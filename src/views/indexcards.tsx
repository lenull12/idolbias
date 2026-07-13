"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CARDS, { rarityFromReference } from "@/data/cards";
import type { CardEntry } from "@/data/cards";
import type { Rarity } from "@/components/CardEffects";
import PhotoCard from "@/components/PhotoCard";
import { RARITY_ORDER } from "@/lib/gameConfig";
import { RARITY_BG, SEASON_COLORS } from "@/lib/rarityTheme";

const RARITY_LABELS: Record<Rarity, string> = {
  common: "COMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY",
  secret: "SECRET",
};

const RARITY_TEXT: Record<Rarity, string> = {
  common: "rgba(var(--text-primary-rgb),0.3)",
  rare: "var(--accent-pink)",
  epic: "var(--accent-purple)",
  legendary: "var(--rarity-legendary)",
  secret: "var(--text-primary)",
};

function getGroups(cards: CardEntry[]): string[] {
  return [...new Set(cards.map((c) => c.group))].sort();
}
function getPacks(cards: CardEntry[]): string[] {
  return [...new Set(cards.map((c) => c.pack))].sort();
}
function getMembers(cards: CardEntry[]): string[] {
  return [...new Set(cards.map((c) => c.idol))].sort();
}

const selectStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid rgba(255,158,196,0.06)",
  background: "rgba(var(--surface-white-rgb),0.6)",
  color: "var(--text-secondary)",
  fontSize: 12,
  outline: "none",
  cursor: "pointer",
  fontFamily: "var(--font-sans, monospace)",
  minWidth: 100,
  fontWeight: 500,
};

const ROWS = 4;
const PAGE_SIZE = 20;
const GAP = 12;

export default function IndexCards({
  onView,
  owned = {},
  onGoToShop,
}: {
  onView?: () => void;
  owned?: Record<string, number>;
  onGoToShop?: (packCode: string) => void;
}) {
  useEffect(() => { onView?.(); }, []);
  const gridRef = useRef<HTMLDivElement>(null);
  const [thumbW, setThumbW] = useState(110);

  useEffect(() => {
    if (!gridRef.current) return;
    const measure = () => {
      const child = gridRef.current!.firstElementChild;
      if (child) setThumbW(child.clientWidth);
    };
    const obs = new ResizeObserver(measure);
    obs.observe(gridRef.current);
    requestAnimationFrame(measure);
    return () => obs.disconnect();
  }, []);

  const [viewMode, setViewMode] = useState<"collection" | "all">("collection");
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterPack, setFilterPack] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [previewCard, setPreviewCard] = useState<CardEntry | null>(null);
  const [page, setPage] = useState(0);

  const groups = useMemo(() => getGroups(CARDS), []);
  const packs = useMemo(() => getPacks(CARDS), []);
  const members = useMemo(() => getMembers(CARDS), []);

  const filtered = useMemo(() => {
    let list = [...CARDS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.idol.toLowerCase().includes(q) ||
          c.reference.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q) ||
          c.pack.toLowerCase().includes(q) ||
          c.edition.toLowerCase().includes(q)
      );
    }
    if (filterGroup !== "all") list = list.filter((c) => c.group === filterGroup);
    if (filterPack !== "all") list = list.filter((c) => c.pack === filterPack);
    if (filterMember !== "all") list = list.filter((c) => c.idol === filterMember);
    if (filterRarity !== "all") list = list.filter((c) => rarityFromReference(c.reference) === filterRarity);
    if (viewMode === "collection") list = list.filter((c) => (owned[c.id] ?? 0) > 0);
    list.sort((a, b) => a.reference.localeCompare(b.reference));
    return list;
  }, [search, filterGroup, filterPack, filterMember, filterRarity, viewMode, owned]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const paginatedCards = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [viewMode, search, filterGroup, filterPack, filterMember, filterRarity]);

  const completion = useMemo(() => {
    const total = CARDS.length;
    const unlocked = CARDS.filter((c) => (owned[c.id] ?? 0) > 0).length;
    return { unlocked, total };
  }, [owned]);

  return (
    <div className="mx-auto max-w-[600px] lg:max-w-[1100px]" style={{ padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 23, letterSpacing: "-0.3px", margin: 0, color: "var(--accent-hotpink)" }}>
          Card Collection
        </h1>
        <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500 }}>
          {CARDS.length} cards
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(var(--text-primary-rgb),0.06)", overflow: "hidden" }}>
          <div style={{
            width: `${completion.total ? (completion.unlocked / completion.total) * 100 : 0}%`,
            height: "100%",
            borderRadius: 3,
            background: "linear-gradient(90deg, var(--accent-hotpink), var(--accent-purple))",
            transition: "width 0.3s ease",
          }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap" }}>
          {completion.unlocked}/{completion.total} unlocked
        </span>
      </div>

      <div style={{
        display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 20,
        padding: "8px 12px", background: "rgba(var(--surface-white-rgb),0.6)", backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)", borderRadius: 12, border: "1px solid rgba(255,158,196,0.04)",
      }}>
        <div style={{
          display: "flex", gap: 2, padding: 2, borderRadius: 8,
          background: "rgba(var(--text-primary-rgb),0.04)",
        }}>
          <button onClick={() => setViewMode("collection")} style={{
            padding: "4px 10px", borderRadius: 6, border: "none",
            background: viewMode === "collection" ? "var(--surface-white)" : "transparent",
            color: viewMode === "collection" ? "var(--accent-hotpink)" : "var(--text-muted)",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap",
            boxShadow: viewMode === "collection" ? "1px 1px 0px rgba(var(--text-primary-rgb),0.1)" : "none",
          }}>🖼 Collection</button>
          <button onClick={() => setViewMode("all")} style={{
            padding: "4px 10px", borderRadius: 6, border: "none",
            background: viewMode === "all" ? "var(--surface-white)" : "transparent",
            color: viewMode === "all" ? "var(--accent-hotpink)" : "var(--text-muted)",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap",
            boxShadow: viewMode === "all" ? "1px 1px 0px rgba(var(--text-primary-rgb),0.1)" : "none",
          }}>🔍 All cards</button>
        </div>

        <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} style={{
          flex: "1 1 160px", padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(255,158,196,0.06)",
          background: "rgba(var(--surface-white-rgb),0.5)", color: "var(--text-primary)", fontSize: 12, outline: "none",
          fontFamily: "var(--font-sans, monospace)", fontWeight: 500,
        }} />
        <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} style={selectStyle}>
          <option value="all">All Groups</option>
          {groups.map((g) => (<option key={g} value={g}>{g}</option>))}
        </select>
        <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} style={selectStyle}>
          <option value="all">All Members</option>
          {members.map((m) => (<option key={m} value={m}>{m}</option>))}
        </select>
        <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} style={selectStyle}>
          <option value="all">All Rarities</option>
          {RARITY_ORDER.map((r) => (<option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>))}
        </select>
        <select value={filterPack} onChange={(e) => setFilterPack(e.target.value)} style={selectStyle}>
          <option value="all">All Packs</option>
          {packs.map((p) => (<option key={p} value={p}>{p}</option>))}
        </select>
        <button onClick={() => { setSearch(""); setFilterGroup("all"); setFilterPack("all"); setFilterMember("all"); setFilterRarity("all"); }} style={{
          padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(var(--text-primary-rgb),0.04)",
          background: "transparent", color: "var(--text-muted)", fontSize: 13, cursor: "pointer",
          fontFamily: "var(--font-sans, monospace)", letterSpacing: "1px", fontWeight: 600,
        }}>RESET</button>
      </div>

      <div style={{ fontSize: 10, color: "var(--text-disabled)", fontFamily: "var(--font-sans, monospace)", marginBottom: 12, fontWeight: 500 }}>
        {filtered.length === CARDS.length
          ? `${CARDS.length} cards`
          : `${filtered.length} / ${CARDS.length} cards`}
        {totalPages > 1 && ` · page ${safePage + 1}/${totalPages}`}
      </div>

      <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(75px, 1fr))`, gap: GAP }}>
        {paginatedCards.map((card) => {
          const rarity = rarityFromReference(card.reference);
          const qty = owned[card.id] ?? 0;
          const isOwned = qty > 0;

          return (
            <div
              key={card.id}
              onClick={isOwned ? undefined : () => setPreviewCard(card)}
              style={{ cursor: isOwned ? "default" : "pointer", display: "flex", flexDirection: "column", gap: 6 }}
            >
              <div style={{
                position: "relative",
                filter: isOwned ? "none" : "grayscale(1) brightness(0.55)",
                pointerEvents: isOwned ? "auto" : "none",
              }}>
                <PhotoCard
                  imageSrc={card.imageSrc}
                  season={SEASON_COLORS[rarity]}
                  meta={{
                    idol: card.idol,
                    group: card.group,
                    pack: card.pack,
                    edition: card.edition,
                    reference: card.reference,
                  }}
                  rarity={rarity}
                  maxTilt={8}
                  width={thumbW}
                />
                {!isOwned && (
                  <div style={{
                    position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%",
                    background: "rgba(var(--text-primary-rgb),0.55)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                  }}>🔒</div>
                )}
                {isOwned && qty > 1 && (
                  <>
                    <div style={{
                      position: "absolute", top: 4, right: 4, zIndex: 2,
                      padding: "1px 6px", borderRadius: 8,
                      background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
                      color: "var(--surface-white)", fontSize: 9, fontWeight: 800,
                      fontFamily: "var(--font-sans, monospace)",
                      boxShadow: "1px 1px 0px rgba(var(--text-primary-rgb),0.3)",
                    }}>×{qty}</div>
                  </>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono, monospace)",
                  color: isOwned ? "var(--text-secondary)" : "var(--text-disabled)",
                  letterSpacing: "0.5px",
                }}>
                  {card.reference}
                </span>
                <span style={{
                  display: "inline-block", padding: "1px 8px", borderRadius: 4,
                  background: RARITY_BG[rarity],
                  fontSize: 9, fontWeight: 700, letterSpacing: "1px",
                  fontFamily: "var(--font-sans, monospace)",
                }}>
                  {rarity === "secret" ? (
                    <span style={{
                      backgroundImage: "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}>{RARITY_LABELS[rarity]}</span>
                  ) : (
                    <span style={{
                      color: isOwned ? RARITY_TEXT[rarity] : "var(--text-disabled)",
                    }}>{RARITY_LABELS[rarity]}</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20 }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "2px solid var(--text-primary)",
              background: safePage === 0 ? "rgba(var(--text-primary-rgb),0.06)" : "var(--surface-white)",
              color: safePage === 0 ? "var(--text-disabled)" : "var(--text-primary)",
              fontFamily: "var(--font-sans, monospace)", fontSize: 12, fontWeight: 700,
              cursor: safePage === 0 ? "default" : "pointer",
              boxShadow: safePage === 0 ? "none" : "2px 2px 0px rgba(var(--text-primary-rgb),0.9)",
            }}
          >← Prev</button>
          <span style={{
            fontSize: 12, fontWeight: 700, color: "var(--text-secondary)",
            fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.5px",
          }}>
            {safePage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "2px solid var(--text-primary)",
              background: safePage >= totalPages - 1 ? "rgba(var(--text-primary-rgb),0.06)" : "var(--surface-white)",
              color: safePage >= totalPages - 1 ? "var(--text-disabled)" : "var(--text-primary)",
              fontFamily: "var(--font-sans, monospace)", fontSize: 12, fontWeight: 700,
              cursor: safePage >= totalPages - 1 ? "default" : "pointer",
              boxShadow: safePage >= totalPages - 1 ? "none" : "2px 2px 0px rgba(var(--text-primary-rgb),0.9)",
            }}
          >Next →</button>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-disabled)", fontSize: 15 }}>
          {viewMode === "collection"
            ? "You don't own any cards yet. Pull a pack to start your collection ✨"
            : "No cards match your filters."}
        </div>
      )}

      {previewCard && (() => {
        const rarity = rarityFromReference(previewCard.reference);
        return (
          <div onClick={() => setPreviewCard(null)} style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(250,245,249,0.85)", backdropFilter: "blur(12px)", cursor: "pointer",
          }}>
            <div onClick={(e) => e.stopPropagation()} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
              animation: "modalIn 0.2s ease-out",
            }}>
              <style>{`@keyframes modalIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }`}</style>
              <div style={{ filter: "grayscale(1) brightness(0.55)" }}>
                <PhotoCard
                  imageSrc={previewCard.imageSrc}
                  season={SEASON_COLORS[rarity]}
                  meta={{
                    idol: previewCard.idol,
                    group: previewCard.group,
                    pack: previewCard.pack,
                    edition: previewCard.edition,
                    reference: previewCard.reference,
                  }}
                  rarity={rarity}
                  width={224}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display, cursive)", fontSize: 18, color: "var(--accent-hotpink)", marginBottom: 4 }}>
                  ??? — Not unlocked yet
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-sans, monospace)", fontWeight: 500 }}>
                  {previewCard.reference}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-disabled)", marginTop: 2, fontWeight: 500 }}>
                  {previewCard.group} ·{" "}
                  <button onClick={(e) => { e.stopPropagation(); onGoToShop?.(previewCard.packCode); }} style={{
                    background: "none", border: "none", padding: 0, cursor: "pointer",
                    color: "var(--accent-hotpink)", fontSize: 13, fontWeight: 600,
                    fontFamily: "var(--font-sans, monospace)", textDecoration: "underline",
                  }}>
                    {previewCard.pack}
                  </button>
                  {" · "}{previewCard.edition}
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    display: "inline-block", padding: "2px 12px", borderRadius: 4,
                    fontSize: 10, fontWeight: 700, letterSpacing: "1.5px",
                    fontFamily: "var(--font-sans, monospace)",
                    background: RARITY_BG[rarity],
                  }}>
                    {rarity === "secret" ? (
                      <span style={{
                        backgroundImage: "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}>{RARITY_LABELS[rarity]}</span>
                    ) : (
                      <span style={{ color: "var(--text-disabled)" }}>{RARITY_LABELS[rarity]}</span>
                    )}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-disabled)", fontStyle: "italic", marginLeft: 8 }}>
                    Pull a pack to discover this card
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
