"use client";

import { useEffect, useState, useMemo } from "react";
import { IconHeart } from "@/components/Icons";
import StyledSelect from "@/components/StyledSelect";
import CARDS, { rarityFromReference } from "@/data/cards";
import { RARITY_ORDER } from "@/lib/gameConfig";
import { SEASON_COLORS } from "@/lib/rarityTheme";
import PhotoCard from "@/components/PhotoCard";
import type { CardGrade } from "@/db/schema";
import { GRADE_ORDER } from "@/lib/gradeConfig";

function useFavorites(): [Record<string, true>, (id: string) => void] {
  const [favs, setFavs] = useState<Record<string, true>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("idolbias_favorites") || "{}"); } catch { return {}; }
  });

  const toggle = (cardId: string) => {
    setFavs((prev) => {
      const next = { ...prev };
      if (next[cardId]) delete next[cardId];
      else next[cardId] = true;
      localStorage.setItem("idolbias_favorites", JSON.stringify(next));
      return next;
    });
  };

  return [favs, toggle];
}

export default function MyCardsView({ owned, ownedGrades = {} }: {
  owned: Record<string, number>;
  ownedGrades?: Record<string, Partial<Record<CardGrade, number>>>;
}) {
  const [favorites, toggleFav] = useFavorites();
  const [sortBy, setSortBy] = useState<string>("newest");
  const [favFilter, setFavFilter] = useState(false);
  const [filterMember, setFilterMember] = useState("all");
  const [filterPack, setFilterPack] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [filterGrade, setFilterGrade] = useState<string>("all");

  const [cols, setCols] = useState(5);
  useEffect(() => {
    const handler = () => setCols(window.innerWidth < 640 ? 3 : 5);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const slotWidth = useMemo(() => {
    if (typeof window === "undefined") return 130;
    const containerW = Math.min(1100, window.innerWidth - 32);
    const available = containerW - (cols - 1) * 16;
    return Math.floor(available / cols);
  }, [cols]);

  const groups = useMemo(() => [...new Set(CARDS.map((c) => c.group))].sort(), []);
  const packs = useMemo(() => [...new Set(CARDS.map((c) => c.pack))].sort(), []);
  const members = useMemo(() => [...new Set(CARDS.map((c) => c.idol))].sort(), []);

  const cardIndex = useMemo(() => {
    const idx: Record<string, number> = {};
    CARDS.forEach((c, i) => { idx[c.id] = i; });
    return idx;
  }, []);

  const ownedCards = useMemo(() => {
    let list = CARDS.filter((c) => (owned[c.id] ?? 0) > 0);

    if (favFilter) list = list.filter((c) => favorites[c.id]);
    if (filterMember !== "all") list = list.filter((c) => c.idol === filterMember);
    if (filterPack !== "all") list = list.filter((c) => c.pack === filterPack);
    if (filterRarity !== "all") list = list.filter((c) => rarityFromReference(c.reference) === filterRarity);
    if (filterGrade !== "all") list = list.filter((c) => (ownedGrades[c.id]?.[filterGrade as CardGrade] ?? 0) > 0);

    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return (cardIndex[b.id] ?? 0) - (cardIndex[a.id] ?? 0);
        case "oldest": return (cardIndex[a.id] ?? 0) - (cardIndex[b.id] ?? 0);
        case "member": return a.idol.localeCompare(b.idol) || a.reference.localeCompare(b.reference);
        case "rarity": {
          const ra = RARITY_ORDER.indexOf(rarityFromReference(a.reference));
          const rb = RARITY_ORDER.indexOf(rarityFromReference(b.reference));
          return rb - ra || a.reference.localeCompare(b.reference);
        }
        case "set": return a.packCode.localeCompare(b.packCode) || a.reference.localeCompare(b.reference);
        default: return a.reference.localeCompare(b.reference);
      }
    });

    return list;
  }, [owned, sortBy, favFilter, favorites, filterMember, filterPack, filterRarity, filterGrade, cardIndex]);

  const totalUnique = ownedCards.length;
  const totalQty = useMemo(() =>
    ownedCards.reduce((sum, c) => sum + (owned[c.id] ?? 0), 0),
  [ownedCards, owned]);

  return (
    <div className="mx-auto max-w-[600px] lg:max-w-[1100px]" style={{ padding: "24px 16px 48px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 23, letterSpacing: "-0.3px", margin: 0, color: "var(--accent-hotpink)" }}>
          My Cards
        </h1>
        <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500 }}>
          {totalUnique} unique · {totalQty} total
        </span>
        {favFilter && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "var(--accent-hotpink)",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <IconHeart filled={true} size={12} />
              Favorites only
            </span>
          </span>
        )}
      </div>

      {/* Filters bar */}
      <div style={{
        display: "flex", gap: 8, alignItems: "center", marginBottom: 20,
        padding: "8px 12px", background: "rgba(var(--surface-white-rgb),0.6)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderRadius: 12, border: "2px solid rgba(var(--text-primary-rgb),0.08)", flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px",           color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-display)" }}>
          Sort
        </span>
        <StyledSelect
          options={[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "member", label: "Member" },
            { value: "rarity", label: "Rarity" },
            { value: "set", label: "Set" },
          ]}
          value={sortBy}
          onChange={setSortBy}
        />

        <StyledSelect
          options={[{ value: "all", label: "All Members" }, ...members.map((m) => ({ value: m, label: m }))]}
          value={filterMember}
          onChange={setFilterMember}
        />
        <StyledSelect
          options={[{ value: "all", label: "All Packs" }, ...packs.map((p) => ({ value: p, label: p }))]}
          value={filterPack}
          onChange={setFilterPack}
        />
        <StyledSelect
          options={[{ value: "all", label: "All Rarities" }, ...RARITY_ORDER.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))]}
          value={filterRarity}
          onChange={setFilterRarity}
        />

        <StyledSelect
          options={[{ value: "all", label: "All Grades" }, ...GRADE_ORDER.map((g) => ({ value: g, label: g.charAt(0).toUpperCase() + g.slice(1) }))]}
          value={filterGrade}
          onChange={setFilterGrade}
        />

        <button onClick={() => setFavFilter((v) => !v)} style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 10px", borderRadius: 8, cursor: "pointer",
          border: "2px solid rgba(var(--text-primary-rgb),0.12)",
          background: favFilter ? "rgba(255,20,147,0.08)" : "transparent",
          color: favFilter ? "var(--accent-hotpink)" : "var(--text-muted)",
          fontSize: 11, fontWeight: 700,
          fontFamily: "var(--font-display)",
          transition: "border-color 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => { if (!favFilter) e.currentTarget.style.borderColor = "var(--text-primary)"; }}
        onMouseLeave={(e) => { if (!favFilter) e.currentTarget.style.borderColor = "rgba(var(--text-primary-rgb),0.12)"; }}
        >
          <IconHeart filled={favFilter} size={14} />
          {favFilter ? "Favorites" : "All"}
        </button>
      </div>

      {/* Grid */}
      {ownedCards.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-disabled)", fontSize: 15 }}>
          {favFilter           ? "No favorited cards yet. Tap the heart icon on a card to add it." : "You don't own any cards yet. Pull a pack to start your collection ✨"}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 16,
        }}>
          {ownedCards.map((card) => {
            const rarity = rarityFromReference(card.reference);
            const qty = owned[card.id] ?? 0;
            const isFav = !!favorites[card.id];
            const gradesOwned = ownedGrades[card.id] ?? {};
            const bestGrade = [...GRADE_ORDER].reverse().find((g) => (gradesOwned[g] ?? 0) > 0);

            return (
              <div key={card.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                  grade={bestGrade}
                  maxTilt={8}
                  width={slotWidth}
                />
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0 2px",
                }}>
                  <button onClick={(e) => { e.stopPropagation(); toggleFav(card.id); }} style={{
                    width: 26, height: 26, borderRadius: "50%",
                    border: "2px solid rgba(var(--text-primary-rgb),0.12)", cursor: "pointer", padding: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isFav ? "var(--accent-hotpink)" : "transparent",
                    color: isFav ? "var(--surface-white)" : "var(--text-disabled)",
                    flexShrink: 0, transition: "background 0.15s, border-color 0.15s",
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => { if (!isFav) e.currentTarget.style.borderColor = "rgba(var(--text-primary-rgb),0.3)"; }}
                  onMouseLeave={(e) => { if (!isFav) e.currentTarget.style.borderColor = "rgba(var(--text-primary-rgb),0.12)"; }}
                  >
                    <IconHeart filled={isFav} size={13} />
                  </button>
                  {qty > 1 && (
                    <span style={{
                      padding: "1px 7px", borderRadius: 8,
                      background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
                      color: "var(--surface-white)", fontSize: 9.5, fontWeight: 800,
                      fontFamily: "var(--font-sans, monospace)",
                    }}>
                      ×{qty}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
