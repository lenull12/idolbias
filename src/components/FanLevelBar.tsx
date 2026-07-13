"use client";

import { getFanLevel } from "@/lib/gameConfig";

export default function FanLevelBar({ xp, color }: { xp: number; color: string }) {
  const { level, xpIntoLevel, xpForNext } = getFanLevel(xp);
  const pct = (xpIntoLevel / xpForNext) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", maxWidth: 240 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Fan Lv.{level}</span>
        <span style={{ fontSize: 11, color: "rgba(var(--text-primary-rgb),0.35)" }}>{xpIntoLevel}/{xpForNext} XP</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "rgba(var(--text-primary-rgb),0.06)", overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 3,
          background: `linear-gradient(90deg, ${color}, rgba(var(--surface-white-rgb),0.7))`,
          transition: "width 0.2s",
        }} />
      </div>
    </div>
  );
}
