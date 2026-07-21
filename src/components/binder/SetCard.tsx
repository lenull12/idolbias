"use client";

import { useMemo } from "react";
import { getCardsByPack, getPackInfo, type CardEntry } from "@/data/cards";
import { GROUPS } from "@/data/artists";

function getMemberColor(idolName: string): string {
  for (const group of GROUPS) {
    const m = group.members.find((m) => m.stageName === idolName);
    if (m) return m.color;
  }
  return "var(--text-muted)";
}

type MemberProgress = {
  name: string;
  color: string;
  owned: number;
  total: number;
};

function computeProgress(packCode: string, owned: Record<string, number>): {
  members: MemberProgress[];
  totalOwned: number;
  totalCards: number;
} {
  const cards = getCardsByPack(packCode);
  const memberMap = new Map<string, CardEntry[]>();
  for (const card of cards) {
    const list = memberMap.get(card.idol) ?? [];
    list.push(card);
    memberMap.set(card.idol, list);
  }
  const members: MemberProgress[] = [];
  let totalOwned = 0;
  for (const [name, memberCards] of memberMap) {
    const memberOwned = memberCards.filter((c) => (owned[c.id] ?? 0) > 0).length;
    totalOwned += memberOwned;
    members.push({ name, color: getMemberColor(name), owned: memberOwned, total: memberCards.length });
  }
  return { members, totalOwned, totalCards: cards.length };
}

export default function SetCard({ packCode, owned, onClick, onGoToShop, claimed = false }: {
  packCode: string;
  owned: Record<string, number>;
  onClick?: () => void;
  onGoToShop?: (packCode: string) => void;
  claimed?: boolean;
}) {
  const info = getPackInfo(packCode);
  const prog = useMemo(() => computeProgress(packCode, owned), [packCode, owned]);
  const pct = prog.totalCards > 0 ? Math.round((prog.totalOwned / prog.totalCards) * 100) : 0;
  const completed = pct === 100;

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 16, overflow: "hidden", cursor: "pointer",
        border: completed ? "2px solid var(--rarity-legendary-badge)" : "2px solid var(--text-primary)",
        boxShadow: completed
          ? "5px 5px 0px rgba(194,84,46,0.5)"
          : "5px 5px 0px rgba(var(--text-primary-rgb),0.9)",
        background: "var(--surface-white)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
    >
      <style>{`@keyframes completedGlow { 0%, 100% { box-shadow: 0 0 6px rgba(194,84,46,0.3); } 50% { box-shadow: 0 0 14px rgba(194,84,46,0.6); } }`}</style>

      {/* Cover */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "896/576", overflow: "hidden", background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple), var(--holo-c))" }}>
        {info.coverImage ? (
          <img src={info.coverImage} alt={info.name} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "rgba(var(--surface-white-rgb),0.5)" }}>
            ✦
          </div>
        )}
        {completed && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            padding: "3px 10px", borderRadius: 6,
            background: claimed
              ? "linear-gradient(135deg, var(--rarity-legendary-badge), #e07640)"
              : "linear-gradient(135deg, var(--accent-hotpink), var(--accent-pink))",
            color: "var(--text-primary)", fontSize: 9, fontWeight: 800,
            fontFamily: "var(--font-sans, monospace)", letterSpacing: "1px",
            animation: claimed ? "completedGlow 2s ease-in-out infinite" : "none",
            border: "1.5px solid rgba(var(--text-primary-rgb),0.3)",
          }}>
            {claimed ? "✓ CLAIMED" : "COMPLETED"}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={(e) => { e.stopPropagation(); onGoToShop?.(packCode); }} style={{
              fontFamily: "var(--font-display, cursive)", fontSize: 17, fontWeight: 700,
              color: "var(--text-primary)", letterSpacing: "-0.2px",
              border: "none", background: "none", cursor: "pointer", padding: 0, textAlign: "left",
            }}>
              {info.name}
            </button>
            <span style={{
              padding: "1px 8px", borderRadius: 4, background: "rgba(var(--text-primary-rgb),0.04)",
              fontSize: 9, fontWeight: 700, letterSpacing: "1px", color: "var(--text-disabled)",
              fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap",
            }}>
              {info.edition.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Per-member bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {prog.members.map((m) => (
            <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 36, fontSize: 10, fontWeight: 700, color: m.color,
                fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.5px", flexShrink: 0,
              }}>
                {m.name}
              </span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(var(--text-primary-rgb),0.06)", overflow: "hidden" }}>
                <div style={{
                  width: `${m.total > 0 ? (m.owned / m.total) * 100 : 0}%`,
                  height: "100%", borderRadius: 3,
                  background: `linear-gradient(90deg, ${m.color}, ${m.color}88)`,
                  transition: "width 0.4s ease",
                }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-disabled)", fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap", minWidth: 28, textAlign: "right" }}>
                {m.owned}/{m.total}
              </span>
            </div>
          ))}
        </div>

        {/* Total bar */}
        <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.5px" }}>
              TOTAL
            </span>
            <span style={{
              fontSize: 11, fontWeight: 800, fontFamily: "var(--font-display, cursive)",
              color: completed ? "var(--rarity-legendary-badge)" : "var(--text-primary)",
            }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(var(--text-primary-rgb),0.06)", overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`, height: "100%", borderRadius: 4,
              background: completed
                ? "linear-gradient(90deg, var(--rarity-legendary-badge), #e07640)"
                : "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))",
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>


      </div>
    </div>
  );
}
