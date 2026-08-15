import React, { useId } from "react";
import { Bell, Camera, ChevronRight, Search, Settings } from "lucide-react";

export function initials(name) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, photoURL, size = 44, ring = false, online = null }) {
  return (
    <div className="halo-avatar-wrap" style={{ width: size, height: size }}>
      <div
        className="halo-avatar"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.36,
          boxShadow: ring ? "0 0 0 2px var(--bg), 0 0 0 3.5px var(--accent-cyan)" : "none",
        }}
      >
        {photoURL ? <img src={photoURL} alt="" /> : initials(name)}
      </div>
      {online !== null && online && (
        <span className="halo-online-dot" style={{ width: size * 0.26, height: size * 0.26 }} />
      )}
    </div>
  );
}

export function ProgressRing({ percent, size = 64, stroke = 6 }) {
  const gradId = "grad-" + useId().replace(/:/g, "");
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C6CF0" />
            <stop offset="100%" stopColor="#2FE8D0" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: size * 0.22, color: "var(--text-primary)" }}>
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}

export function Chip({ icon: Icon, label, onClick }) {
  return (
    <button className="halo-chip" onClick={onClick}>
      <span className="halo-chip-icon">
        <Icon size={18} />
      </span>
      <span>{label}</span>
    </button>
  );
}

export function GlassCard({ children, className = "", onClick, style }) {
  return (
    <div className={`halo-card ${className}`} onClick={onClick} style={style}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <div className="halo-section-header">
      <h2>{title}</h2>
      {action && (
        <button className="halo-link" onClick={onAction}>
          {action} <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

export function OrbAmbient() {
  return (
    <div className="halo-orb-ambient" aria-hidden="true">
      <div className="halo-orb-blob halo-orb-blob-a" />
      <div className="halo-orb-blob halo-orb-blob-b" />
    </div>
  );
}

export function NovaOrb({ size = 120 }) {
  return (
    <div className="halo-nova-orb" style={{ width: size, height: size }}>
      <div className="halo-nova-orb-core" />
      <div className="halo-nova-orb-ring" />
    </div>
  );
}

export function Spinner() {
  return <NovaOrb size={56} />;
}

export function TopBar({ tab, title, profile, onSearch, onBell, bellCount }) {
  return (
    <header className="halo-topbar">
      <div className="halo-topbar-left">
        <Avatar name={profile?.fullName} photoURL={profile?.photoURL} size={38} ring />
        <div className="halo-topbar-title">
          {tab === "home" ? (
            <>
              <span className="halo-eyebrow">Good to see you</span>
              <span className="halo-title-main">{profile?.fullName || "Welcome back"}</span>
            </>
          ) : (
            <span className="halo-title-main">{title}</span>
          )}
        </div>
      </div>
      <div className="halo-topbar-right">
        <button className="halo-icon-btn" aria-label="Search" onClick={onSearch}>
          <Search size={19} />
        </button>
        <button className="halo-icon-btn" aria-label="Friend requests" onClick={onBell}>
          <Bell size={19} />
          {bellCount > 0 && <span className="halo-badge">{bellCount > 9 ? "9+" : bellCount}</span>}
        </button>
        <button className="halo-icon-btn" aria-label="Settings">
          <Settings size={19} />
        </button>
      </div>
    </header>
  );
}

function NavItem({ tab, active, onClick }) {
  const Icon = tab.icon;
  return (
    <button className={`halo-nav-item ${active ? "is-active" : ""}`} onClick={onClick}>
      <Icon size={20} />
      <span>{tab.label}</span>
    </button>
  );
}

export function BottomNav({ tabs, active, onChange }) {
  return (
    <nav className="halo-navbar">
      {tabs.slice(0, 3).map((t) => (
        <NavItem key={t.id} tab={t} active={active === t.id} onClick={() => onChange(t.id)} />
      ))}
      <button className="halo-fab" aria-label="Open camera">
        <Camera size={22} />
      </button>
      {tabs.slice(3).map((t) => (
        <NavItem key={t.id} tab={t} active={active === t.id} onClick={() => onChange(t.id)} />
      ))}
    </nav>
  );
}
