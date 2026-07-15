"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { getCardsByPack, getPackInfo, rarityFromReference, type CardEntry } from "@/data/cards";
import { GROUPS } from "@/data/artists";
import CardSlot from "./CardSlot";

const CARDS_PER_PAGE = 20;

function getMemberColor(idolName: string): string {
  for (const group of GROUPS) {
    const m = group.members.find((m) => m.stageName === idolName);
    if (m) return m.color;
  }
  return "var(--text-muted)";
}

function memberSortKey(name: string): number {
  for (const group of GROUPS) {
    const idx = group.members.findIndex((m) => m.stageName === name);
    if (idx >= 0) return idx;
  }
  return 999;
}

function useCols(): number {
  const [cols, setCols] = useState(5);
  useEffect(() => {
    const handler = () => setCols(window.innerWidth < 640 ? 3 : 5);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return cols;
}

function useSlotWidth(cols: number): number {
  const [w, setW] = useState(120);
  useEffect(() => {
    const handler = () => {
      const vw = window.innerWidth;
      const containerW = Math.min(720, vw - 32);
      setW(Math.floor((containerW - 12 * (cols - 1)) / cols));
    };
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [cols]);
  return w;
}

export default function BinderAlbumView({ packCode, owned, onBack, onGoToShop, onDevComplete }: {
  packCode: string;
  owned: Record<string, number>;
  onBack: () => void;
  onGoToShop?: (packCode: string) => void;
  onDevComplete?: (packCode: string, action: "complete" | "reset") => void;
}) {
  const cols = useCols();
  const slotWidth = useSlotWidth(cols);
  const info = getPackInfo(packCode);
  const cards = useMemo(() => getCardsByPack(packCode), [packCode]);

  const memberGroups = useMemo(() => {
    const map = new Map<string, CardEntry[]>();
    for (const card of cards) {
      const list = map.get(card.idol) ?? [];
      list.push(card);
      map.set(card.idol, list);
    }
    const sorted = [...map.entries()].sort(([a], [b]) => memberSortKey(a) - memberSortKey(b));
    for (const [, list] of sorted) {
      list.sort((a, b) => a.reference.localeCompare(b.reference));
    }
    return sorted;
  }, [cards]);

  const totalCards = cards.length;
  const totalOwned = cards.filter((c) => (owned[c.id] ?? 0) > 0).length;
  const totalPct = totalCards > 0 ? Math.round((totalOwned / totalCards) * 100) : 0;

  const allSlots = useMemo(() => {
    const slots: { card: CardEntry; rarity: string; owned: boolean }[] = [];
    for (const [, memberCards] of memberGroups) {
      for (const card of memberCards) {
        const rarity = rarityFromReference(card.reference);
        const isOwned = (owned[card.id] ?? 0) > 0;
        slots.push({ card, rarity, owned: isOwned });
      }
    }
    return slots;
  }, [memberGroups, owned]);

  const totalPages = Math.max(1, Math.ceil(allSlots.length / CARDS_PER_PAGE));
  const [page, setPage] = useState(0);
  const safePage = Math.min(page, totalPages - 1);

  const canPrev = safePage > 0;
  const canNext = safePage < totalPages - 1;

  const handlePrev = useCallback(() => { if (canPrev) setPage((p) => p - 1); }, [canPrev]);
  const handleNext = useCallback(() => { if (canNext) setPage((p) => p + 1); }, [canNext]);

  return (
    <div style={{ padding: "24px 16px 48px" }}>
      {/* Header — back + title + progress */}
      <div style={{ maxWidth: 720, margin: "0 auto", marginBottom: 28 }}>
        <button onClick={onBack} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 8,
          border: "1.5px solid rgba(var(--text-primary-rgb),0.12)",
          background: "rgba(var(--text-primary-rgb),0.04)",
          cursor: "pointer", color: "var(--text-secondary)",
          fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
          marginBottom: 16,
        }}>
          ← Back to Binder
        </button>

        {typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.search.includes("dev=1")) && onDevComplete && (
          <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-disabled)", fontFamily: "monospace", letterSpacing: "1px" }}>
              DEV:
            </span>
            <button onClick={(e) => { e.stopPropagation(); onDevComplete(packCode, "complete"); }} style={{
              padding: "2px 10px", borderRadius: 4, border: "1px solid #ffcc00",
              background: "rgba(255,204,0,0.08)", color: "#cc9900",
              fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "monospace",
            }}>
              ⚡ Complete set
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDevComplete(packCode, "reset"); }} style={{
              padding: "2px 10px", borderRadius: 4, border: "1px solid #ff6666",
              background: "rgba(255,0,0,0.05)", color: "#cc4444",
              fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "monospace",
            }}>
              ✕ Reset set
            </button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{
            fontFamily: "var(--font-display, cursive)", fontSize: 23, fontWeight: 700,
            margin: 0, color: "var(--text-primary)", letterSpacing: "-0.3px",
          }}>
            {info.name}
          </h1>
          <span style={{
            padding: "1px 8px", borderRadius: 4,
            background: "rgba(var(--text-primary-rgb),0.04)",
            fontSize: 9, fontWeight: 700, letterSpacing: "1px",
            color: "var(--text-disabled)",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            {info.edition.toUpperCase()}
          </span>
          <span style={{
            marginLeft: "auto", fontSize: 12, fontWeight: 600,
            color: totalPct === 100 ? "#DAA520" : "var(--text-muted)",
            fontFamily: "var(--font-display, cursive)",
          }}>
            {totalOwned}/{totalCards} · {totalPct}%
          </span>
        </div>
        <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: "rgba(var(--text-primary-rgb),0.06)", overflow: "hidden" }}>
          <div style={{
            width: `${totalPct}%`, height: "100%", borderRadius: 2,
            background: totalPct === 100
              ? "linear-gradient(90deg, #DAA520, #FFD700)"
              : "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))",
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {/* Page content — slide container */}
      <div style={{ maxWidth: 720, margin: "0 auto", overflow: "hidden", position: "relative" }}>
        <div style={{
          display: "flex",
          transition: "transform 0.3s ease",
          transform: `translateX(-${safePage * 100}%)`,
        }}>
          {Array.from({ length: totalPages }).map((_, pg) => {
            const slots = allSlots.slice(pg * CARDS_PER_PAGE, (pg + 1) * CARDS_PER_PAGE);
            const pageMemberGroups = new Map<string, CardEntry[]>();
            for (const card of slots.map((s) => s.card)) {
              const list = pageMemberGroups.get(card.idol) ?? [];
              list.push(card);
              pageMemberGroups.set(card.idol, list);
            }

            return (
              <div key={pg} style={{ minWidth: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
                {[...pageMemberGroups.entries()]
                  .sort(([a], [b]) => memberSortKey(a) - memberSortKey(b))
                  .map(([memberName, memberCards]) => {
                    const color = getMemberColor(memberName);
                    const memberOwned = memberCards.filter((c) => (owned[c.id] ?? 0) > 0).length;

                    return (
                      <div key={memberName}>
                        {/* Member divider */}
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          paddingBottom: 10, marginBottom: 12,
                          borderBottom: "1px solid rgba(var(--text-primary-rgb),0.08)",
                        }}>
                          <span style={{
                            fontSize: 13, fontWeight: 700, letterSpacing: "2px",
                            color, fontFamily: "var(--font-sans, monospace)",
                          }}>
                            ✦ {memberName}
                          </span>
                          <span style={{
                            fontSize: 11, fontWeight: 600, fontFamily: "var(--font-sans, monospace)",
                            color: "var(--text-disabled)",
                          }}>
                            {memberOwned}/{memberCards.length}
                          </span>
                        </div>

                        {/* Card rows */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {chunk(memberCards, cols).map((row, ri) => (
                            <div key={ri} style={{
                              display: "flex", gap: 12, justifyContent: "center",
                            }}>
                              {row.map((card) => {
                                const rarity = rarityFromReference(card.reference) as any;
                                const isOwned = (owned[card.id] ?? 0) > 0;

                                if (isOwned) {
                                  return (
                                    <CardSlot
                                      key={card.id}
                                      mode="owned"
                                      card={card}
                                      rarity={rarity}
                                      owned={owned}
                                      width={slotWidth}
                                    />
                                  );
                                }
                                return (
                                  <CardSlot
                                    key={card.id}
                                    mode="missing"
                                    reference={card.reference}
                                    imageSrc={card.imageSrc}
                                    rarity={rarity}
                                    memberColor={color}
                                    width={slotWidth}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          maxWidth: 720, margin: "24px auto 0",
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12,
        }}>
          <button onClick={handlePrev} disabled={!canPrev} style={{
            padding: "6px 12px", borderRadius: 6,
            border: "1.5px solid rgba(var(--text-primary-rgb),0.15)",
            background: canPrev ? "rgba(var(--text-primary-rgb),0.04)" : "transparent",
            color: canPrev ? "var(--text-muted)" : "var(--text-disabled)",
            cursor: canPrev ? "pointer" : "default",
            fontFamily: "var(--font-sans, monospace)", fontSize: 13, fontWeight: 600,
          }}>
            ◀
          </button>
          <span style={{
            fontSize: 11, fontWeight: 600, fontFamily: "var(--font-sans, monospace)",
            color: "var(--text-disabled)", letterSpacing: "1px",
          }}>
            {safePage + 1} / {totalPages}
          </span>
          <button onClick={handleNext} disabled={!canNext} style={{
            padding: "6px 12px", borderRadius: 6,
            border: "1.5px solid rgba(var(--text-primary-rgb),0.15)",
            background: canNext ? "rgba(var(--text-primary-rgb),0.04)" : "transparent",
            color: canNext ? "var(--text-muted)" : "var(--text-disabled)",
            cursor: canNext ? "pointer" : "default",
            fontFamily: "var(--font-sans, monospace)", fontSize: 13, fontWeight: 600,
          }}>
            ▶
          </button>
        </div>
      )}
    </div>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
