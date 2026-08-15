import React from "react";
import { BookOpen, Clapperboard, ChevronRight, Flame, Send, Sparkles } from "lucide-react";
import { GlassCard, NovaOrb, ProgressRing, SectionHeader } from "../components/ui.jsx";

export function WatchScreen() {
  return (
    <div className="halo-screen halo-empty-screen">
      <div className="halo-empty-orb">
        <Clapperboard size={30} />
      </div>
      <h2>No watch rooms yet</h2>
      <p>Create a room and pick something to watch together — playback stays in sync for everyone inside.</p>
      <button className="halo-primary-btn">Create watch room</button>
    </div>
  );
}

export function StudyScreen() {
  const subjects = [
    { name: "Data Structures", chapters: "8 / 12 chapters", percent: 66 },
    { name: "Spanish — A2", chapters: "3 / 10 chapters", percent: 30 },
  ];
  return (
    <div className="halo-screen">
      <GlassCard className="halo-study-hero">
        <ProgressRing percent={78} size={72} stroke={6} />
        <div>
          <span className="halo-mini-label">Today's goal</span>
          <span className="halo-mini-value">47 / 60 min</span>
          <span className="halo-mini-streak">
            <Flame size={13} /> 12-day streak · 2,140 XP
          </span>
        </div>
      </GlassCard>
      <SectionHeader title="Your subjects" />
      {subjects.map((s) => (
        <GlassCard key={s.name} className="halo-subject-card">
          <div className="halo-subject-icon">
            <BookOpen size={18} />
          </div>
          <div className="halo-subject-meta">
            <span className="halo-chat-name">{s.name}</span>
            <span className="halo-chat-msg">{s.chapters}</span>
            <div className="halo-progress-bar halo-progress-bar-thin">
              <div style={{ width: `${s.percent}%` }} />
            </div>
          </div>
          <ChevronRight size={16} />
        </GlassCard>
      ))}
    </div>
  );
}

export function AiScreen() {
  const suggestions = ["Explain today's homework", "Summarize this chapter", "Quiz me on Chapter 4", "Translate to Spanish"];
  return (
    <div className="halo-screen halo-ai-screen">
      <div className="halo-nova-hero">
        <NovaOrb size={110} />
        <h2>Hi, I'm Nova</h2>
        <p>Ask me to explain, summarize, quiz, or brainstorm — I'll keep it simple.</p>
      </div>
      <div className="halo-suggest-grid">
        {suggestions.map((s) => (
          <button className="halo-suggest-chip" key={s}>
            {s}
          </button>
        ))}
      </div>
      <div className="halo-ask-bar">
        <Sparkles size={16} />
        <span>Ask Nova anything…</span>
        <button className="halo-ask-send" aria-label="Send">
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
