import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCheck, Search, Send, UserPlus } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import { Avatar, GlassCard } from "../components/ui.jsx";
import { chatIdFor, ensureChat, listenMessages, markDelivered, markSeen, sendMessage } from "../lib/chat.js";
import { clockTime, relativeTime } from "../lib/format.js";

export function ChatListScreen({ myUid, friends, chats, onOpenChat, onOpenSearch }) {
  const chattedUids = useMemo(() => new Set(chats.map((c) => c.participants.find((p) => p !== myUid))), [chats, myUid]);
  const friendByUid = useMemo(() => new Map(friends.map((f) => [f.uid, f])), [friends]);
  const freshFriends = friends.filter((f) => !chattedUids.has(f.uid));

  return (
    <div className="halo-screen">
      <button className="halo-search-bar" style={{ width: "100%", background: "var(--glass-fill)", border: "1px solid var(--glass-border)" }} onClick={onOpenSearch}>
        <Search size={16} />
        <span style={{ color: "var(--text-tertiary)" }}>Find friends by @username</span>
      </button>

      {chats.length === 0 ? (
        <GlassCard className="halo-result-card">
          <UserPlus size={22} color="var(--accent-cyan)" />
          <h3>No conversations yet</h3>
          <p>Once you're friends with someone, start a chat right from their profile.</p>
        </GlassCard>
      ) : (
        <GlassCard className="halo-list-card">
          {chats.map((c) => {
            const otherUid = c.participants.find((p) => p !== myUid);
            const friend = friendByUid.get(otherUid);
            return (
              <div className="halo-chat-row" key={c.id} onClick={() => friend && onOpenChat(friend)}>
                <Avatar name={friend?.fullName} photoURL={friend?.photoURL} size={44} />
                <div className="halo-chat-meta">
                  <span className="halo-chat-name">{friend?.fullName || "Unknown"}</span>
                  <span className="halo-chat-msg">
                    {c.lastMessageBy === myUid ? "You: " : ""}
                    {c.lastMessage || "Say hi 👋"}
                  </span>
                </div>
                <div className="halo-chat-right">
                  <span className="halo-chat-time">{relativeTime(c.lastMessageAt)}</span>
                  {c.unread?.[myUid] > 0 && <span className="halo-unread-dot">{c.unread[myUid]}</span>}
                </div>
              </div>
            );
          })}
        </GlassCard>
      )}

      {freshFriends.length > 0 && (
        <section>
          <div className="halo-section-header">
            <h2>Start a new chat</h2>
          </div>
          <GlassCard className="halo-list-card">
            {freshFriends.map((f) => (
              <div className="halo-chat-row" key={f.uid} onClick={() => onOpenChat(f)}>
                <Avatar name={f.fullName} photoURL={f.photoURL} size={40} />
                <div className="halo-chat-meta">
                  <span className="halo-chat-name">{f.fullName}</span>
                  <span className="halo-chat-msg">@{f.username}</span>
                </div>
              </div>
            ))}
          </GlassCard>
        </section>
      )}
    </div>
  );
}

export function ChatRoomScreen({ myUid, friend, onBack }) {
  const chatId = useMemo(() => chatIdFor(myUid, friend.uid), [myUid, friend.uid]);
  const [messages, setMessages] = useState([]);
  const [liveFriend, setLiveFriend] = useState(friend);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    ensureChat(myUid, friend.uid);
  }, [myUid, friend.uid]);

  useEffect(() => {
    return onSnapshot(doc(db, "users", friend.uid), (snap) => {
      if (snap.exists()) setLiveFriend(snap.data());
    });
  }, [friend.uid]);

  useEffect(() => {
    return listenMessages(chatId, setMessages);
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    const undelivered = messages.filter((m) => m.senderId !== myUid && !(m.deliveredTo || []).includes(myUid));
    undelivered.forEach((m) => markDelivered(chatId, m.id, myUid));
    if (messages.length > 0) markSeen(chatId, messages, myUid);
  }, [messages, chatId, myUid]);

  async function handleSend(e) {
    e.preventDefault();
    const value = text;
    setText("");
    await sendMessage(chatId, myUid, friend.uid, value);
  }

  const online = liveFriend?.lastActive?.toMillis && Date.now() - liveFriend.lastActive.toMillis() < 60000;

  return (
    <div className="halo-chatroom">
      <div className="halo-chatroom-header">
        <button className="halo-back-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} />
        </button>
        <Avatar name={liveFriend?.fullName} photoURL={liveFriend?.photoURL} size={36} online={online} />
        <div className="halo-chatroom-meta">
          <strong>{liveFriend?.fullName}</strong>
          <span>{online ? "Online" : "Offline"}</span>
        </div>
      </div>

      <div className="halo-messages">
        {messages.map((m) => {
          const mine = m.senderId === myUid;
          const seen = mine && (m.seenBy || []).includes(friend.uid);
          const delivered = mine && (m.deliveredTo || []).includes(friend.uid);
          return (
            <div className={`halo-msg-row ${mine ? "is-mine" : ""}`} key={m.id}>
              <div>
                <div className="halo-bubble">{m.text}</div>
                <div className="halo-msg-meta">
                  <span>{clockTime(m.createdAt)}</span>
                  {mine && (
                    <span className={`halo-msg-ticks ${seen ? "is-seen" : ""}`}>
                      {seen || delivered ? <CheckCheck size={12} /> : <Check size={12} />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="halo-composer" onSubmit={handleSend}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" />
        <button type="submit" disabled={!text.trim()} aria-label="Send">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
