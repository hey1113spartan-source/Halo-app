import React, { useMemo, useState } from "react";
import { ArrowLeft, Search, UserCheck, UserPlus, Users } from "lucide-react";
import { Avatar, GlassCard } from "../components/ui.jsx";
import { cancelFriendRequest, respondToRequest, sendFriendRequest } from "../lib/friends.js";
import { normalizeUsername, searchUserByUsername } from "../lib/users.js";

export default function SearchScreen({ myUid, friends, incomingRequests, outgoingRequests, onBack, onOpenChat }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const relationship = useMemo(() => {
    if (!result) return "none";
    if (result.uid === myUid) return "self";
    if (friends.some((f) => f.uid === result.uid)) return "friends";
    const outgoing = outgoingRequests.find((r) => r.toUid === result.uid);
    if (outgoing) return "requested";
    const incoming = incomingRequests.find((r) => r.fromUid === result.uid);
    if (incoming) return "incoming";
    return "none";
  }, [result, myUid, friends, incomingRequests, outgoingRequests]);

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setNotFound(false);
    const uname = normalizeUsername(query);
    if (!uname) return;
    setSearching(true);
    try {
      const profile = await searchUserByUsername(uname);
      if (profile) {
        setResult(profile);
      } else {
        setResult(null);
        setNotFound(true);
      }
    } catch (err) {
      setError(err.message || "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function handleAction() {
    setError("");
    setBusy(true);
    try {
      if (relationship === "none") {
        await sendFriendRequest(myUid, result.uid);
      } else if (relationship === "requested") {
        await cancelFriendRequest(myUid, result.uid);
      } else if (relationship === "incoming") {
        const incoming = incomingRequests.find((r) => r.fromUid === result.uid);
        await respondToRequest({ fromUid: incoming.fromUid, toUid: incoming.toUid }, true);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="halo-screen">
      <div className="halo-chatroom-header" style={{ padding: "2px 0 4px", border: "none" }}>
        <button className="halo-back-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} />
        </button>
        <div className="halo-chatroom-meta">
          <strong>Find friends</strong>
          <span>Search by exact @username</span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="halo-search-bar">
        <Search size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="@malli_07"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </form>

      {error && <div className="halo-auth-error">{error}</div>}

      {searching && <p style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>Searching…</p>}

      {notFound && !searching && (
        <GlassCard className="halo-result-card">
          <Users size={22} color="var(--text-tertiary)" />
          <h3>No one found</h3>
          <p>Double-check the exact @username and try again.</p>
        </GlassCard>
      )}

      {result && (
        <GlassCard className="halo-result-card">
          <Avatar name={result.fullName} photoURL={result.photoURL} size={72} />
          <h3>{result.fullName}</h3>
          <p>@{result.username}</p>

          {relationship === "self" && <p style={{ marginTop: 4 }}>That's you.</p>}

          {relationship === "friends" && (
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button className="halo-btn-small is-friends">
                <UserCheck size={13} style={{ marginRight: 4, verticalAlign: -2 }} /> Friends
              </button>
              <button className="halo-btn-small is-outline" onClick={() => onOpenChat(result)}>
                Message
              </button>
            </div>
          )}

          {relationship === "none" && (
            <button className="halo-primary-btn" onClick={handleAction} disabled={busy}>
              <UserPlus size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
              {busy ? "Sending…" : "Send friend request"}
            </button>
          )}

          {relationship === "requested" && (
            <button className="halo-btn-small is-outline" onClick={handleAction} disabled={busy}>
              {busy ? "Cancelling…" : "Requested — tap to cancel"}
            </button>
          )}

          {relationship === "incoming" && (
            <button className="halo-primary-btn" onClick={handleAction} disabled={busy}>
              {busy ? "Accepting…" : "Accept their request"}
            </button>
          )}
        </GlassCard>
      )}
    </div>
  );
}
