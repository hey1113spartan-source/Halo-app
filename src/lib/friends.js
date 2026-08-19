import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { pairId } from "./ids.js";
import { createNotification } from "./notifications.js";

function requestRef(uidA, uidB) {
  return doc(db, "friendRequests", pairId(uidA, uidB));
}

export async function getRelationship(myUid, otherUid) {
  const [reqSnap, friendSnap] = await Promise.all([
    getDoc(requestRef(myUid, otherUid)),
    getDoc(doc(db, "users", myUid, "friends", otherUid)),
  ]);
  if (friendSnap.exists()) return "friends";
  if (reqSnap.exists()) {
    const data = reqSnap.data();
    if (data.status === "pending") return data.fromUid === myUid ? "requested" : "incoming";
    if (data.status === "rejected") return data.fromUid === myUid ? "requested" : "incoming";
  }
  return "none";
}

export async function sendFriendRequest(fromUid, toUid) {
  if (fromUid === toUid) throw new Error("You can't friend yourself.");
  const ref = requestRef(fromUid, toUid);
  const existing = await getDoc(ref);
  if (existing.exists() && existing.data().status === "pending") {
    throw new Error("A request is already pending between you two.");
  }
  await setDoc(ref, {
    fromUid,
    toUid,
    status: "pending",
    createdAt: serverTimestamp(),
    respondedAt: null,
  });

  const fromSnap = await getDoc(doc(db, "users", fromUid));
  const fromData = fromSnap.exists() ? fromSnap.data() : null;
  await createNotification(toUid, {
    type: "friend_request",
    fromUid,
    fromName: fromData?.fullName,
    fromPhotoURL: fromData?.photoURL,
  });
}

export async function cancelFriendRequest(fromUid, toUid) {
  await deleteDoc(requestRef(fromUid, toUid));
}

export async function respondToRequest(requestDoc, accept) {
  const { fromUid, toUid } = requestDoc;
  const ref = doc(db, "friendRequests", pairId(fromUid, toUid));
  const batch = writeBatch(db);

  const [fromProfile, toProfile] = await Promise.all([
    getDoc(doc(db, "users", fromUid)),
    getDoc(doc(db, "users", toUid)),
  ]);
  const fromData = fromProfile.data();
  const toData = toProfile.data();

  if (accept) {
    batch.update(ref, { status: "accepted", respondedAt: serverTimestamp() });
    batch.set(doc(db, "users", toUid, "friends", fromUid), {
      uid: fromUid,
      username: fromData.username,
      fullName: fromData.fullName,
      photoURL: fromData.photoURL || null,
      since: serverTimestamp(),
    });
    batch.set(doc(db, "users", fromUid, "friends", toUid), {
      uid: toUid,
      username: toData.username,
      fullName: toData.fullName,
      photoURL: toData.photoURL || null,
      since: serverTimestamp(),
    });
  } else {
    batch.update(ref, { status: "rejected", respondedAt: serverTimestamp() });
  }

  await batch.commit();

  if (accept) {
    await createNotification(fromUid, {
      type: "friend_accepted",
      fromUid: toUid,
      fromName: toData?.fullName,
      fromPhotoURL: toData?.photoURL,
    });
  }
}

export async function removeFriend(myUid, friendUid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "users", myUid, "friends", friendUid));
  batch.delete(doc(db, "users", friendUid, "friends", myUid));
  batch.delete(requestRef(myUid, friendUid));
  await batch.commit();
}

export function listenIncomingRequests(uid, cb) {
  const q = query(
    collection(db, "friendRequests"),
    where("toUid", "==", uid),
    where("status", "==", "pending")
  );
  return onSnapshot(q, async (snap) => {
    const rows = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        const fromSnap = await getDoc(doc(db, "users", data.fromUid));
        return { id: d.id, ...data, fromProfile: fromSnap.exists() ? fromSnap.data() : null };
      })
    );
    cb(rows);
  });
}

export function listenOutgoingRequests(uid, cb) {
  const q = query(
    collection(db, "friendRequests"),
    where("fromUid", "==", uid),
    where("status", "==", "pending")
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function listenFriends(uid, cb) {
  return onSnapshot(collection(db, "users", uid, "friends"), (snap) => {
    cb(snap.docs.map((d) => d.data()));
  });
}
