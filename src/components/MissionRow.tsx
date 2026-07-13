"use client";

import type { Reward } from "@/lib/gameConfig";

type RowState = "claimed" | "locked" | "in-progress" | "claimable";

export default function MissionRow({
  label, progress, target, reward, state, onClaim,
}: {
  label: string;
  progress: number;
  target: number;
  reward: Reward;
  state: RowState;
  onClaim?: () => void;
}) {
  const pct = target > 0 ? (progress / target) * 100 : 0;
  const rewardParts: string[] = [];
  if (reward.tickets) rewardParts.push(`${reward.tickets}🎟️`);
  if (reward.gems) rewardParts.push(`${reward.gems}💎`);
  if (reward.dust) rewardParts.push(`${reward.dust}🪄`);
  const rewardStr = rewardParts.join(" ");

  const isDimmed = state === "claimed" || state === "locked";
  const bg = state === "claimable"
    ? "rgba(255,158,196,0.06)"
    : state === "in-progress"
      ? "rgba(var(--text-primary-rgb),0.02)"
      : "transparent";
  const border = state === "claimable"
    ? "1px solid rgba(255,158,196,0.15)"
    : "1px solid rgba(var(--text-primary-rgb),0.05)";

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 10,
        background: bg, border,
        opacity: isDimmed ? 0.5 : 1,
        transition: "all 0.15s",
      }}
    >
      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "block", lineHeight: 1.3 }}>
          {label}
        </span>
        {target > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(var(--text-primary-rgb),0.06)", overflow: "hidden" }}>
              <div style={{
                width: `${pct}%`, height: "100%", borderRadius: 3,
                background: "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))",
                transition: "width 0.2s",
              }} />
            </div>
            <span style={{ fontSize: 10, color: "rgba(var(--text-primary-rgb),0.35)", flexShrink: 0, fontFamily: "var(--font-sans, monospace)" }}>
              {progress}/{target}
            </span>
          </div>
        )}
      </div>

      {/* Reward */}
      {rewardStr && (
        <span style={{ fontSize: 11, color: "rgba(var(--text-primary-rgb),0.45)", flexShrink: 0, whiteSpace: "nowrap" }}>
          {rewardStr}
        </span>
      )}

      {/* Action */}
      <div style={{ flexShrink: 0, minWidth: 72, textAlign: "right" }}>
        {state === "claimed" && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(var(--text-primary-rgb),0.3)" }}>
            ✓ done
          </span>
        )}
        {state === "locked" && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(var(--text-primary-rgb),0.25)" }}>
            locked
          </span>
        )}
        {(state === "in-progress" || state === "claimable") && (
          <button
            onClick={onClaim}
            disabled={state !== "claimable"}
            style={{
              padding: "5px 14px", borderRadius: 8, border: "none",
              cursor: state === "claimable" ? "pointer" : "default",
              fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700,
              background: state === "claimable"
                ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))"
                : "rgba(var(--text-primary-rgb),0.06)",
              color: state === "claimable" ? "var(--text-primary)" : "rgba(var(--text-primary-rgb),0.25)",
            }}
          >
            Claim
          </button>
        )}
      </div>
    </div>
  );
}

export type { RowState };
