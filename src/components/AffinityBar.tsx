"use client";

import { getAffinityTier, getNextTier, AFFINITY_TIERS } from "@/lib/affinityConfig";

export default function AffinityBar({ xp }: { xp: number }) {
  const current = getAffinityTier(xp);
  const next = getNextTier(xp);

  const pct = next
    ? Math.round(((xp - current.xpRequired) / (next.xpRequired - current.xpRequired)) * 100)
    : 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {AFFINITY_TIERS.map((t) => {
          const unlocked = xp >= t.xpRequired;
          return (
            <span
              key={t.tier}
              title={t.label}
              style={{
                fontSize: 18,
                opacity: unlocked ? 1 : 0.25,
                filter: unlocked ? "none" : "grayscale(1)",
                transition: "all 0.3s",
              }}
            >
              {t.icon}
            </span>
          );
        })}
      </div>

      <div style={{ height: 6, borderRadius: 3, background: "rgba(var(--text-primary-rgb),0.08)", overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 3,
            background: "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))",
            transition: "width 0.3s",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
          {current.icon} {current.label}
        </span>
        {next && (
          <span style={{ color: "var(--text-disabled)" }}>
            {next.xpRequired - xp} XP &rarr; {next.icon} {next.label}
          </span>
        )}
      </div>
    </div>
  );
}
