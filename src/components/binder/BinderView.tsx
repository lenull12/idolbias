"use client";

import { useMemo } from "react";
import { getAllPacks, getCardsByPack } from "@/data/cards";
import SetCard from "./SetCard";

export default function BinderView({ owned, onSelectPack, onGoToShop, claimedPacks = {} }: {
  owned: Record<string, number>;
  onSelectPack?: (packCode: string) => void;
  onGoToShop?: (packCode: string) => void;
  claimedPacks?: Record<string, boolean>;
}) {
  const packs = useMemo(() => getAllPacks().filter(([, p]) => !p.locked), []);

  const completedSets = useMemo(() =>
    packs.filter(([code]) => {
      const cards = getCardsByPack(code);
      return cards.length > 0 && cards.every((c) => (owned[c.id] ?? 0) > 0);
    }).length,
  [packs, owned]);

  return (
    <div className="mx-auto max-w-[600px] lg:max-w-[1100px]" style={{ padding: "24px 16px 48px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 23, letterSpacing: "-0.3px", margin: 0, color: "var(--accent-hotpink)" }}>
          Binder
        </h1>
        <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500 }}>
          {completedSets}/{packs.length} sets completed
        </span>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {packs.map(([code]) => (
          <SetCard key={code} packCode={code} owned={owned} onClick={() => onSelectPack?.(code)} onGoToShop={onGoToShop} claimed={claimedPacks[code] ?? false} />
        ))}
      </div>

      {packs.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-disabled)", fontSize: 15 }}>
          No sets available yet.
        </div>
      )}
    </div>
  );
}
