import React, { useMemo } from "react";
import { Clapperboard, GraduationCap, MessageCircle, Sparkles, UserPlus } from "lucide-react";
import { Avatar, Chip, GlassCard, NovaOrb, OrbAmbient, ProgressRing, SectionHeader } from "../components/ui.jsx";
import { greeting, relativeTime } from "../lib/format.js";

export default function HomeScreen({ profile, uid, friends, chats, pendingCount, goTab, onOpenChat, onOpenSearch }) {
  const quickAccess = [
    { icon: MessageCircle, label: "Chat", tab: "chat" },
    { icon: Clapperboard, label: "Watch", tab: "watch" },
    { icon: GraduationCap, label: "Study", tab: "study" },
    { icon: Sparkles, label: "Ask Nova", tab: "ai" },
  ];

  const friendByUid = useMemo(() => {
    const m = new Map();
    friends.forEach((f) => m.set(f.uid, f));
    return m;
  }, [friends]);

  const recentChats = useMemo(() => {
    return chats.slice(0, 3).map((c) => {
      const otherUid = c.participants.find((p) => p !== uid);
      return { chat: c, friend: friendByUid.get(otherUid) };
    });
  }, [chats, friendByUid, uid]);

  const totalUnread = chats.reduce((sum, c) => sum + (c.unread?.[uid] || 0), 0);

  return (
    <div className="halo-screen">
      <section className="halo-hero">
        <OrbAmbient />
        <p className="halo-hero-eyebrow">{greeting()}</p>
        <h1 className="halo-hero-title">{profile?.fullName?.split(" ")[0] || "Welcome"}</h1>
        <p className="halo-hero-sub">
          {totalUnread > 0
            ? `${totalUnread} unread message${totalUnread > 1 ? "s" : ""}${pendingCount > 0 ? ` · ${pendingCount} friend request${pendingCount > 1 ? "s" : ""}` : ""}`
            : pendingCount > 0
            ? `${pendingCount} friend request${pendingCount > 1 ? "s" : ""} waiting`
            : "You're all caught up."}
        </p>
      </section>

      <div className="halo-chip-row">
        {quickAccess.map((q) => (
          <Chip key={q.label} icon={q.icon} label={q.label} onClick={() => goTab(q.tab)} />
        ))}
      </div>

      <section>
        <SectionHeader title="Recent chats" action={chats.length > 0 ? "See all" : null} onAction={() => goTab("chat")} />
        {recentChats.length === 0 ? (
          <GlassCard className="halo-result-card">
            <UserPlus size={22} color="var(--accent-cyan)" />
            <h3>No conversations yet</h3>
            <p>Search for a friend's @username to start chatting.</p>
            <button className="halo-primary-btn" onClick={onOpenSearch}>Find friends</button>
          </GlassCard>
        ) : (
          <GlassCard className="halo-list-card">
            {recentChats.map(({ chat, friend }) => (
              <div className="halo-chat-row" key={chat.id} onClick={() => friend && onOpenChat(friend)}>
                <Avatar name={friend?.fullName} photoURL={friend?.photoURL} size={42} />
                <div className="halo-chat-meta">
                  <span className="halo-chat-name">{friend?.fullName || "Unknown"}</span>
                  <span className="halo-chat-msg">
                    {chat.lastMessageBy === uid ? "You: " : ""}
                    {chat.lastMessage || "Say hi 👋"}
                  </span>
                </div>
                <div className="halo-chat-right">
                  <span className="halo-chat-time">{relativeTime(chat.lastMessageAt)}</span>
                  {chat.unread?.[uid] > 0 && <span className="halo-unread-dot">{chat.unread[uid]}</span>}
                </div>
              </div>
            ))}
          </GlassCard>
        )}
      </section>

      <section className="halo-two-col">
        <GlassCard className="halo-study-mini" onClick={() => goTab("study")}>
          <ProgressRing percent={78} size={56} stroke={5} />
          <div>
            <span className="halo-mini-label">Today's goal</span>
            <span className="halo-mini-value">47 / 60 min</span>
          </div>
        </GlassCard>
        <GlassCard className="halo-ai-mini" onClick={() => goTab("ai")}>
          <NovaOrb size={44} />
          <div>
            <span className="halo-mini-label">Nova</span>
            <span className="halo-mini-value">Ask anything</span>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
