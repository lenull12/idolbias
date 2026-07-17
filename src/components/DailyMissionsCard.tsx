"use client";

import SystemWindow from "@/components/SystemWindow";
import type { MissionState } from "@/lib/gameConfig";

export default function DailyMissionsCard({
  missions, onClaim,
}: {
  missions: MissionState[];
  onClaim: (id: string) => void;
}) {
  return (
    <SystemWindow title="Daily Missions" width="100%">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {missions.map((m) => {
          const pct = (m.progress / m.target) * 100;
          return (
            <div
              key={m.id}
              style={{
                display: "flex", flexDirection: "column", gap: 6,
                padding: "10px 12px", borderRadius: 10,
                background: m.claimed ? "rgba(var(--text-primary-rgb),0.02)" : "rgba(255,158,196,0.05)",
                border: "2px solid rgba(var(--text-primary-rgb),0.06)",
                opacity: m.claimed ? 0.5 : 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{m.label}</span>
                <span style={{ fontSize: 11, color: "rgba(var(--text-primary-rgb),0.35)", flexShrink: 0 }}>
                  {m.reward.tickets ? `+${m.reward.tickets} 🎟️` : ""}
                  {m.reward.gems ? `+${m.reward.gems} 💎` : ""}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(var(--text-primary-rgb),0.06)", overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%", borderRadius: 3,
                    background: "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))",
                    transition: "width 0.2s",
                  }} />
                </div>
                <span style={{ fontSize: 11, color: "rgba(var(--text-primary-rgb),0.35)", flexShrink: 0 }}>
                  {m.progress}/{m.target}
                </span>
              </div>

              {m.complete && !m.claimed && (
                <button
                  onClick={() => onClaim(m.id)}
                  style={{
                    alignSelf: "flex-start", padding: "5px 12px", borderRadius: 8, border: "none",
                    cursor: "pointer", fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700,
                    background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))", color: "var(--text-primary)",
                  }}
                >
                  Claim
                </button>
              )}
            </div>
          );
        })}
      </div>
    </SystemWindow>
  );
}
