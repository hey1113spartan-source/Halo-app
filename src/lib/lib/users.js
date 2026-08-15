import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase.js";

const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/;

export function isUsernameFormatValid(raw) {
  return USERNAME_RE.test(normalizeUsername(raw));
}

export function normalizeUsername(raw) {
  return (raw || "").trim().toLowerCase().replace(/^@/, "");
}

export async function checkUsernameAvailable(raw) {
  const uname = normalizeUsername(raw);
  if (!USERNAME_RE.test(uname)) return false;
  const snap = await getDoc(doc(db, "usernames", uname));
  return !snap.exists();
}

async function uploadAvatar(uid, file) {
  const path = `avatars/${uid}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function createAccount({ email, password, fullName, username, photoFile }) {
  const uname = normalizeUsername(username);
  if (!USERNAME_RE.test(uname)) {
    throw new Error("Usernames are 3-20 characters: lowercase letters, numbers, underscore, starting with a letter.");
  }

  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const uid = cred.user.uid;

  let photoURL = null;
  if (photoFile) {
    try {
      photoURL = await uploadAvatar(uid, photoFile);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    }
  }

  await claimUsernameAndCreateProfile(uid, { email: email.trim(), fullName: fullName.trim(), username: uname, photoURL });
  await updateProfile(cred.user, { displayName: fullName.trim(), photoURL: photoURL || undefined });

  try {
    await sendEmailVerification(cred.user);
  } catch (err) {
    console.error("Verification email failed to send:", err);
  }

  return uid;
}

export async function claimUsernameAndCreateProfile(uid, { email, fullName, username, photoURL }) {
  const uname = normalizeUsername(username);
  const usernameRef = doc(db, "usernames", uname);
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(usernameRef);
    if (existing.exists()) {
      throw new Error("That username was just taken — try another.");
    }
    tx.set(usernameRef, { uid });
    tx.set(userRef, {
      uid,
      email,
      fullName,
      username: uname,
      photoURL: photoURL || null,
      bio: "",
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
  });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function searchUserByUsername(raw) {
  const uname = normalizeUsername(raw);
  if (!uname) return null;
  const unameSnap = await getDoc(doc(db, "usernames", uname));
  if (!unameSnap.exists()) return null;
  return getUserProfile(unameSnap.data().uid);
}

export function touchPresence(uid) {
  if (!uid) return;
  updateDoc(doc(db, "users", uid), { lastActive: serverTimestamp() }).catch(() => {});
}

const ONLINE_WINDOW_MS = 60 * 1000;
export function isOnline(lastActive) {
  if (!lastActive?.toMillis) return false;
  return Date.now() - lastActive.toMillis() < ONLINE_WINDOW_MS;
}

export async function logIn({ username, password }) {
  const profile = await searchUserByUsername(username);
  if (!profile) throw new Error("No account with that username.");
  return signInWithEmailAndPassword(auth, profile.email, password);
}

export async function logOut() {
  return signOut(auth);
}

export async function resetPasswordByUsername(usernameOrEmail) {
  const value = (usernameOrEmail || "").trim();
  if (value.includes("@") && value.includes(".")) {
    return sendPasswordResetEmail(auth, value);
  }
  const profile = await searchUserByUsername(value);
  if (!profile) throw new Error("No account with that username.");
  return sendPasswordResetEmail(auth, profile.email);
}
