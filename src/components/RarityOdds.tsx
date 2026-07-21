"use client";

import { RARITY_ORDER } from "@/lib/gameConfig";
import { RARITY_LABELS, RARITY_LETTER } from "@/lib/rarityTheme";
import type { PackDropRates } from "@/data/cards";
import type { Rarity } from "@/components/CardEffects";

const BADGE_COLORS_DEFAULT: Record<Rarity, { bg: string; fg: string }> = {
  common: { bg: "rgba(var(--text-primary-rgb),0.03)", fg: "rgba(var(--text-primary-rgb),0.4)" },
  rare: { bg: "rgba(59,125,219,0.06)", fg: "var(--rarity-rare)" },
  epic: { bg: "rgba(124,92,255,0.06)", fg: "var(--rarity-epic)" },
  legendary: { bg: "rgba(232,182,90,0.06)", fg: "var(--rarity-legendary-badge)" },
  secret: { bg: "rgba(var(--text-primary-rgb),0.04)", fg: "var(--text-primary)" },
};

const BADGE_COLORS_BANNER: Record<Rarity, { bg: string; fg: string }> = {
  common: { bg: "rgba(var(--text-primary-rgb),0.55)", fg: "var(--surface-white)" },
  rare: { bg: "rgba(59,125,219,0.92)", fg: "var(--surface-white)" },
  epic: { bg: "rgba(124,92,255,0.92)", fg: "var(--surface-white)" },
  legendary: { bg: "rgba(232,182,90,0.92)", fg: "var(--surface-white)" },
  secret: { bg: "var(--surface-white)", fg: "var(--surface-white)" },
};

export default function RarityOdds({ dropRates, size = "md", variant = "default" }: {
  dropRates: PackDropRates; size?: "sm" | "md"; variant?: "default" | "banner";
}) {
  const colors = variant === "banner" ? BADGE_COLORS_BANNER : BADGE_COLORS_DEFAULT;
  const total = RARITY_ORDER.reduce((s, r) => s + dropRates[r], 0);
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {RARITY_ORDER.map((r) => {
        const pct = total > 0 ? (dropRates[r] / total) * 100 : 0;
        const decimals = pct < 1 ? 1 : 0;
        const label = pct.toFixed(decimals) + "% " + (variant === "banner" && size !== "sm" ? RARITY_LABELS[r] : RARITY_LETTER[r]);
        if (variant === "banner" && r === "secret") {
          return (
            <span key={r} style={{
              padding: size === "sm" ? "1px 6px" : "2px 7px", borderRadius: 4,
              background: "var(--surface-white)",
              fontSize: size === "sm" ? 9 : 10, fontWeight: 700,
              fontFamily: "var(--font-sans, monospace)", letterSpacing: "1px",
            }}>
              <span style={{
                backgroundImage: "linear-gradient(90deg, var(--accent-pink), var(--accent-purple), var(--holo-c))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                {label}
              </span>
            </span>
          );
        }
        return (
          <span key={r} style={{
            padding: size === "sm" ? "1px 6px" : "2px 7px", borderRadius: 4,
            background: colors[r].bg, color: colors[r].fg,
            fontSize: size === "sm" ? 9 : 10, fontWeight: 700,
            fontFamily: "var(--font-sans, monospace)", letterSpacing: "1px",
          }}>
            {label}
          </span>
        );
      })}
    </div>
  );
}
