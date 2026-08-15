import React from "react";
import { Bell, ChevronRight, LogOut, Palette, Settings, Shield } from "lucide-react";
import { Avatar, GlassCard } from "../components/ui.jsx";

export default function ProfileScreen({ profile, friendsCount, chatsCount, onLogOut }) {
  const rows = [
    { icon: Shield, label: "Privacy & safety" },
    { icon: Bell, label: "Notifications" },
    { icon: Palette, label: "Appearance" },
    { icon: Settings, label: "Account settings" },
  ];
  return (
    <div className="halo-screen">
      <div className="halo-profile-hero">
        <Avatar name={profile?.fullName} photoURL={profile?.photoURL} size={72} ring />
        <h2>{profile?.fullName}</h2>
        <p>@{profile?.username}</p>
        <div className="halo-profile-stats">
          <div>
            <span>{friendsCount}</span>Friends
          </div>
          <div>
            <span>{chatsCount}</span>Chats
          </div>
        </div>
      </div>
      <GlassCard className="halo-list-card">
        {rows.map((r) => (
          <div className="halo-settings-row" key={r.label}>
            <r.icon size={17} />
            <span>{r.label}</span>
            <ChevronRight size={15} />
          </div>
        ))}
      </GlassCard>
      <button className="halo-danger-btn" onClick={onLogOut}>
        <LogOut size={16} /> Log out
      </button>
    </div>
  );
}
