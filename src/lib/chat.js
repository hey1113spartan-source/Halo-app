import {
  arrayUnion,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { pairId } from "./ids.js";

export function chatIdFor(uidA, uidB) {
  return pairId(uidA, uidB);
}

export async function ensureChat(uidA, uidB) {
  const chatId = chatIdFor(uidA, uidB);
  const ref = doc(db, "chats", chatId);
  await setDoc(
    ref,
    {
      participants: [uidA, uidB],
      lastMessage: null,
      lastMessageAt: null,
      lastMessageBy: null,
      unread: { [uidA]: 0, [uidB]: 0 },
    },
    { merge: true }
  );
  return chatId;
}

export async function sendMessage(chatId, senderId, recipientId, text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const chatRef = doc(db, "chats", chatId);
  const msgRef = doc(collection(db, "chats", chatId, "messages"));

  const batch = writeBatch(db);
  batch.set(msgRef, {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
    deliveredTo: [],
    seenBy: [senderId],
  });
  batch.update(chatRef, {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
    lastMessageBy: senderId,
    [`unread.${recipientId}`]: increment(1),
  });
  await batch.commit();
}

export function listenMessages(chatId, cb) {
  const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function markDelivered(chatId, messageId, uid) {
  updateDoc(doc(db, "chats", chatId, "messages", messageId), {
    deliveredTo: arrayUnion(uid),
  }).catch(() => {});
}

export async function markSeen(chatId, messages, uid) {
  const unseen = messages.filter((m) => m.senderId !== uid && !(m.seenBy || []).includes(uid));
  if (unseen.length === 0) return;
  const batch = writeBatch(db);
  unseen.forEach((m) => {
    batch.update(doc(db, "chats", chatId, "messages", m.id), { seenBy: arrayUnion(uid) });
  });
  batch.update(doc(db, "chats", chatId), { [`unread.${uid}`]: 0 });
  await batch.commit();
}

export function listenUserChats(uid, cb) {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", uid),
    orderBy("lastMessageAt", "desc")
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
