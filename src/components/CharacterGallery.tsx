"use client";

import CARDS, { rarityFromReference } from "@/data/cards";
import type { Rarity } from "@/components/CardEffects";
import { RARITY_ORDER } from "@/lib/gameConfig";
import { RARITY_COLORS } from "@/lib/rarityTheme";

export default function CharacterGallery({
  characterName,
  ownedCards = {},
}: {
  characterName: string;
  ownedCards?: Record<string, number>;
}) {
  const characterCards = CARDS.filter((c) => c.idol === characterName);
  const ownedRefs = new Set(Object.keys(ownedCards));
  const collected = characterCards.filter((c) => ownedRefs.has(c.reference)).length;
  const total = characterCards.length;

  const byRarity: Record<Rarity, { collected: number; total: number }> = {
    common: { collected: 0, total: 0 },
    rare: { collected: 0, total: 0 },
    epic: { collected: 0, total: 0 },
    legendary: { collected: 0, total: 0 },
    secret: { collected: 0, total: 0 },
  };
  for (const card of characterCards) {
    const r = rarityFromReference(card.reference);
    byRarity[r].total++;
    if (ownedRefs.has(card.reference)) byRarity[r].collected++;
  }

  if (total === 0) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "var(--text-disabled)" }}>
        No cards available for {characterName} yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text-primary)", margin: "0 0 4px" }}>
          {characterName} Collection
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {collected}/{total} cards · {total > 0 ? Math.round((collected / total) * 100) : 0}%
          </span>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(var(--text-primary-rgb),0.06)", overflow: "hidden", maxWidth: 200 }}>
            <div style={{
              width: `${(collected / total) * 100}%`, height: "100%", borderRadius: 2,
              background: "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))",
              transition: "width 0.3s",
            }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {RARITY_ORDER.map((r) => {
          const { collected: c, total: t } = byRarity[r];
          if (t === 0) return null;
          return (
            <div key={r} style={{
              padding: "4px 10px", borderRadius: 6,
              background: "rgba(var(--text-primary-rgb),0.03)",
              border: `2px solid rgba(var(--text-primary-rgb),0.06)`,
              fontSize: 11, fontWeight: 600,
              fontFamily: "var(--font-mono, monospace)",
              color: c === t ? RARITY_COLORS[r] : "var(--text-disabled)",
            }}>
              {r.toUpperCase()} {c}/{t}
            </div>
          );
        })}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
        gap: 10,
      }}>
        {characterCards.map((card) => {
          const owned = ownedRefs.has(card.reference);
          const rarity = rarityFromReference(card.reference);
          return (
            <div key={card.id} style={{
              borderRadius: 10,
              overflow: "hidden",
              background: owned ? "transparent" : "rgba(var(--text-primary-rgb),0.02)",
              border: owned ? "none" : "2px solid rgba(var(--text-primary-rgb),0.04)",
              opacity: owned ? 1 : 0.4,
            }}>
              {owned ? (
                <img
                  src={card.imageSrc}
                  alt={card.reference}
                  style={{ width: "100%", aspectRatio: "896/1152", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div style={{
                  width: "100%", aspectRatio: "896/1152",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(var(--text-primary-rgb),0.02)",
                }}>
                  <span style={{ fontSize: 24, opacity: 0.3 }}>?</span>
                </div>
              )}
              <div style={{ padding: "4px 6px" }}>
                <span style={{
                  fontSize: 9, fontWeight: 600, color: owned ? RARITY_COLORS[rarity] : "var(--text-disabled)",
                  fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.5px",
                }}>
                  {card.reference.split("-").pop()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
