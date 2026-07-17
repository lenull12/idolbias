"use client";

import { useState } from "react";
import { STREAK_TICKETS, STREAK_BONUS_GEMS } from "@/lib/gameConfig";
import CloseButton from "@/components/CloseButton";

export default function StreakModal({
  streak,
  canClaim,
  isBroken,
  onClaim,
  onClose,
}: {
  streak: number;
  canClaim: boolean;
  isBroken: boolean;
  onClaim: () => Promise<{ tickets: number; gems: number; streak: number } | null>;
  onClose: () => void;
}) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [result, setResult] = useState<{ tickets: number; gems: number; streak: number } | null>(null);

  const todayIdx = canClaim ? streak % 7 : 0;
  const todayTickets = STREAK_TICKETS[todayIdx];
  const todayGems = STREAK_BONUS_GEMS[todayIdx];

  const handleClick = async () => {
    if (claiming || !canClaim) return;
    setClaiming(true);
    const res = await onClaim();
    if (res) {
      setResult(res);
      setClaimed(true);
      setTimeout(onClose, 2000);
    }
    setClaiming(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(var(--text-primary-rgb),0.35)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        cursor: "pointer",
      }}
    >
      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
        @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 6px rgba(218,165,32,0.3); } 50% { box-shadow: 0 0 18px rgba(218,165,32,0.6); } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "modalIn 0.35s cubic-bezier(0.23, 1, 0.32, 1)",
          width: "min(340px, 88vw)",
          borderRadius: 16, overflow: "hidden",
          border: "2px solid var(--text-primary)",
          boxShadow: "6px 6px 0px rgba(var(--text-primary-rgb),0.9)",
          background: "var(--surface-white)",
          cursor: "default",
        }}
      >
        <div style={{ padding: "20px 20px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Header */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontFamily: "var(--font-display, cursive)", fontWeight: 700, color: "var(--text-primary)" }}>
              ✦ Daily Login
            </div>
          </div>

          {/* Streak frise */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0 2px" }}>
            {Array.from({ length: 7 }).map((_, i) => {
              const isDay7 = i === 6;
              const isPast = canClaim && !claimed && i < todayIdx;
              const isTodayClaimable = canClaim && !claimed && i === todayIdx && !isBroken;
              const isFuture = canClaim && !claimed && i > todayIdx && !isBroken;
              const isAfterClaim = claimed && i <= result!.streak % 7;
              const isCurrentAfterClaim = claimed && i === result!.streak % 7;

              const tickets = STREAK_TICKETS[i];
              const gems = STREAK_BONUS_GEMS[i];

              let bg = "transparent";
              let fg = "rgba(var(--text-primary-rgb),0.18)";
              let label = String(i + 1);
              let border = isDay7 ? "2px solid rgba(218,165,32,0.25)" : "2px solid rgba(var(--text-primary-rgb),0.1)";
              let glow = {};
              let showReward = true;

              if (isPast || isAfterClaim) {
                bg = "rgba(var(--text-primary-rgb),0.06)";
                fg = "var(--text-muted)";
                label = "✓";
                border = "2px solid rgba(var(--text-primary-rgb),0.06)";
              }
              if (isTodayClaimable) {
                bg = "var(--accent-hotpink)";
                fg = "var(--surface-white)";
                label = String(i + 1);
                if (isDay7) glow = { animation: "glowPulse 1.5s ease-in-out infinite" };
              }
              if (isCurrentAfterClaim) {
                bg = "rgba(255,20,147,0.08)";
                fg = "var(--accent-hotpink)";
                label = "✓";
                border = "2px solid var(--accent-hotpink)";
              }
              if (isFuture) {
                bg = "transparent";
                fg = "rgba(var(--text-primary-rgb),0.18)";
              }
              if (isBroken) {
                bg = i === 0 ? "var(--accent-hotpink)" : "transparent";
                fg = i === 0 ? "var(--surface-white)" : "rgba(var(--text-primary-rgb),0.18)";
                label = i === 0 ? "1" : String(i + 1);
                border = i === 0 ? "2px solid var(--accent-hotpink)" : "2px solid rgba(var(--text-primary-rgb),0.1)";
              }

              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: 38 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isTodayClaimable ? 14 : 12, fontWeight: isTodayClaimable ? 800 : 600,
                    border, background: bg, color: fg, transition: "all 0.25s",
                    ...(isDay7 ? glow : {}),
                  }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 9, textAlign: "center", lineHeight: 1.15, color: showReward ? "var(--text-muted)" : "transparent", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {tickets > 0 ? `${tickets} 🎟️` : gems > 0 ? `${gems} 💎` : "—"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day labels */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: -10, padding: "0 6px" }}>
            {["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"].map((d, i) => {
              const isCurrent = canClaim && !claimed && i === todayIdx;
              return (
                <div key={i} style={{
                  fontSize: 9, fontWeight: isCurrent ? 700 : 500, fontFamily: "var(--font-sans, monospace)",
                  color: isCurrent ? "var(--text-primary)" : "var(--text-disabled)",
                  letterSpacing: "0.3px",
                }}>
                  {d}
                </div>
              );
            })}
          </div>

          {/* Day 7 jackpot teaser */}
          {todayIdx !== 6 && !claimed && !isBroken && (
            <div style={{ textAlign: "center", fontSize: 11, color: "#DAA520", fontWeight: 600, fontFamily: "var(--font-sans, monospace)", marginTop: -4 }}>
              ⭐ Day 7: 3 tickets
            </div>
          )}

          {/* Reward / status block */}
          {!claimed && !isBroken && (
            <div style={{
              textAlign: "center", padding: "12px", borderRadius: 10,
              background: "rgba(var(--text-primary-rgb),0.03)",
               border: "2px solid rgba(var(--text-primary-rgb),0.06)",
            }}>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display, cursive)", color: "var(--text-primary)" }}>
                {todayGems > 0 ? `+${todayGems} gems` : todayTickets > 0 ? `+${todayTickets} tickets` : "+15 gems"}
                {todayIdx === 6 ? <span style={{ fontSize: 14, marginLeft: 6, color: "#DAA520" }}>⭐</span> : null}
              </span>
            </div>
          )}

          {/* Broken streak message */}
          {isBroken && !claimed && (
            <div style={{
              textAlign: "center", padding: "10px", borderRadius: 10,
              background: "rgba(255,20,147,0.04)",         border: "2px solid rgba(255,20,147,0.15)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-hotpink)", fontFamily: "var(--font-display, cursive)" }}>
                💔 Streak broken!<br />Start again today.
              </span>
            </div>
          )}

          {/* Claim success */}
          {claimed && result && (
            <div style={{
              textAlign: "center", padding: "10px", borderRadius: 10,
              background: "linear-gradient(135deg, rgba(255,20,147,0.06), rgba(255,158,196,0.04))",
               border: "2px solid var(--accent-hotpink)",
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-display, cursive)", color: "var(--accent-hotpink)" }}>
                +{[
                  result.gems > 0 ? `${result.gems} gems` : "",
                  result.tickets > 0 ? `${result.tickets} tickets` : "",
                ].filter(Boolean).join(" + ")}
              </span>
            </div>
          )}

          {/* Claim button */}
          {!claimed && (
            <button
              onClick={handleClick}
              disabled={!canClaim || claiming}
              style={{
                padding: "12px 0", borderRadius: 10, border: "none",
                background: canClaim && !claiming
                  ? "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))"
                  : "rgba(var(--text-primary-rgb),0.06)",
                color: canClaim && !claiming ? "var(--surface-white)" : "var(--text-disabled)",
                fontSize: 14, fontWeight: 800, cursor: canClaim && !claiming ? "pointer" : "default",
                fontFamily: "var(--font-sans, monospace)", letterSpacing: "1.5px",
                transition: "all 0.2s",
              }}
            >
              {claiming ? "CLAIMING..." : "CLAIM"}
            </button>
          )}

          {/* Streak counter */}
          <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans, monospace)", fontWeight: 600, marginTop: -6 }}>
            Streak: {result ? result.streak : isBroken ? 0 : streak} day{result ? (result.streak > 1 ? "s" : "") : isBroken ? "" : streak > 1 ? "s" : ""} 🔥
          </div>

          {/* Close */}
          <CloseButton onClick={onClose} />
        </div>
      </div>
    </div>
  );
}
