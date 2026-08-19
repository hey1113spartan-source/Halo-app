import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Avatar, GlassCard, SectionHeader } from "../components/ui.jsx";
import { cancelFriendRequest, respondToRequest } from "../lib/friends.js";
import { getUserProfile } from "../lib/users.js";
import { markAllNotificationsRead } from "../lib/notifications.js";
import { relativeTime } from "../lib/format.js";

export default function RequestsScreen({ myUid, incomingRequests, outgoingRequests, notifications, onBack }) {
  const [outgoingProfiles, setOutgoingProfiles] = useState({});
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        outgoingRequests.map(async (r) => [r.toUid, await getUserProfile(r.toUid)])
      );
      if (!cancelled) setOutgoingProfiles(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [outgoingRequests]);

  useEffect(() => {
    if (notifications.length > 0) {
      markAllNotificationsRead(myUid, notifications);
    }
  }, [myUid, notifications]);

  async function handleRespond(request, accept) {
    setBusyId(request.id);
    try {
      await respondToRequest({ fromUid: request.fromUid, toUid: request.toUid }, accept);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(request) {
    setBusyId(request.id);
    try {
      await cancelFriendRequest(request.fromUid, request.toUid);
    } finally {
      setBusyId(null);
    }
  }

  function notifText(n) {
    if (n.type === "friend_request") return `${n.fromName} sent you a friend request`;
    if (n.type === "friend_accepted") return `${n.fromName} accepted your friend request`;
    return `${n.fromName} sent you a message`;
  }

  return (
    <div className="halo-screen">
      <div className="halo-chatroom-header" style={{ padding: "2px 0 4px", border: "none" }}>
        <button className="halo-back-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} />
        </button>
        <div className="halo-chatroom-meta">
          <strong>Notifications</strong>
          <span>{incomingRequests.length} requests waiting</span>
        </div>
      </div>

      <section>
        <SectionHeader title="Friend requests" />
        {incomingRequests.length === 0 ? (
          <p style={{ color: "var(--text-tertiary)", fontSize: 13 }}>No requests right now.</p>
        ) : (
          <GlassCard className="halo-list-card">
            {incomingRequests.map((r) => (
              <div className="halo-request-row" key={r.id}>
                <Avatar name={r.fromProfile?.fullName} photoURL={r.fromProfile?.photoURL} size={42} />
                <div className="halo-chat-meta">
                  <span className="halo-chat-name">{r.fromProfile?.fullName || "Unknown"}</span>
                  <span className="halo-chat-msg">@{r.fromProfile?.username}</span>
                </div>
                <div className="halo-request-actions">
                  <button className="halo-btn-small is-accept" disabled={busyId === r.id} onClick={() => handleRespond(r, true)}>
                    Accept
                  </button>
                  <button className="halo-btn-small is-reject" disabled={busyId === r.id} onClick={() => handleRespond(r, false)}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </GlassCard>
        )}
      </section>

      <section>
        <SectionHeader title="Sent" />
        {outgoingRequests.length === 0 ? (
          <p style={{ color: "var(--text-tertiary)", fontSize: 13 }}>Nothing pending.</p>
        ) : (
          <GlassCard className="halo-list-card">
            {outgoingRequests.map((r) => {
              const p = outgoingProfiles[r.toUid];
              return (
                <div className="halo-request-row" key={r.id}>
                  <Avatar name={p?.fullName} photoURL={p?.photoURL} size={42} />
                  <div className="halo-chat-meta">
                    <span className="halo-chat-name">{p?.fullName || "…"}</span>
                    <span className="halo-chat-msg">@{p?.username}</span>
                  </div>
                  <div className="halo-request-actions">
                    <button className="halo-btn-small is-outline" disabled={busyId === r.id} onClick={() => handleCancel(r)}>
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </GlassCard>
        )}
      </section>

      <section>
        <SectionHeader title="Recent activity" />
        {notifications.length === 0 ? (
          <p style={{ color: "var(--text-tertiary)", fontSize: 13 }}>Nothing yet.</p>
        ) : (
          <GlassCard className="halo-list-card">
            {notifications.map((n) => (
              <div className="halo-chat-row" key={n.id} style={{ opacity: n.read ? 0.65 : 1 }}>
                <Avatar name={n.fromName} photoURL={n.fromPhotoURL} size={38} />
                <div className="halo-chat-meta">
                  <span className="halo-chat-msg" style={{ color: "var(--text-primary)" }}>{notifText(n)}</span>
                </div>
                <span className="halo-chat-time">{relativeTime(n.createdAt)}</span>
              </div>
            ))}
          </GlassCard>
        )}
      </section>
    </div>
  );
}
