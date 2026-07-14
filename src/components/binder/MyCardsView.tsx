"use client";

import { useEffect, useState, useMemo } from "react";
import CARDS, { rarityFromReference } from "@/data/cards";
import { RARITY_ORDER } from "@/lib/gameConfig";
import { SEASON_COLORS } from "@/lib/rarityTheme";
import PhotoCard from "@/components/PhotoCard";

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

const selectStyle: React.CSSProperties = {
  padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,158,196,0.06)",
  background: "rgba(var(--surface-white-rgb),0.5)", color: "var(--text-secondary)",
  fontSize: 11, outline: "none", cursor: "pointer",
  fontFamily: "var(--font-sans, monospace)", fontWeight: 600,
};

export default function MyCardsView({ owned }: {
  owned: Record<string, number>;
}) {
  const [favorites, toggleFav] = useFavorites();
  const [sortBy, setSortBy] = useState<string>("newest");
  const [favFilter, setFavFilter] = useState(false);
  const [filterMember, setFilterMember] = useState("all");
  const [filterPack, setFilterPack] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");

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
  }, [owned, sortBy, favFilter, favorites, filterMember, filterPack, filterRarity, cardIndex]);

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
            ❤️ Favorites only
          </span>
        )}
      </div>

      {/* Filters bar */}
      <div style={{
        display: "flex", gap: 8, alignItems: "center", marginBottom: 20,
        padding: "8px 12px", background: "rgba(var(--surface-white-rgb),0.6)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderRadius: 12, border: "1px solid rgba(255,158,196,0.04)", flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--text-disabled)", textTransform: "uppercase" }}>
          Sort
        </span>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="member">Member</option>
          <option value="rarity">Rarity</option>
          <option value="set">Set</option>
        </select>

        <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} style={selectStyle}>
          <option value="all">All Members</option>
          {members.map((m) => (<option key={m} value={m}>{m}</option>))}
        </select>
        <select value={filterPack} onChange={(e) => setFilterPack(e.target.value)} style={selectStyle}>
          <option value="all">All Packs</option>
          {packs.map((p) => (<option key={p} value={p}>{p}</option>))}
        </select>
        <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} style={selectStyle}>
          <option value="all">All Rarities</option>
          {RARITY_ORDER.map((r) => (<option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>))}
        </select>

        <button onClick={() => setFavFilter((v) => !v)} style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: 6, border: "1.5px solid rgba(var(--text-primary-rgb),0.06)",
          background: favFilter ? "rgba(255,20,147,0.06)" : "transparent",
          color: favFilter ? "var(--accent-hotpink)" : "var(--text-muted)",
          fontSize: 11, fontWeight: 700, cursor: "pointer",
          fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap",
        }}>
          ❤️ {favFilter ? "Favorites" : "All"}
        </button>
      </div>

      {/* Grid */}
      {ownedCards.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-disabled)", fontSize: 15 }}>
          {favFilter ? "No favorited cards yet. Tap the ❤️ on a card to add it." : "You don't own any cards yet. Pull a pack to start your collection ✨"}
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

            return (
              <div key={card.id} style={{ position: "relative" }}>
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
                  width={slotWidth}
                />
                {qty > 1 && (
                  <div style={{
                    position: "absolute", top: 4, right: 4, zIndex: 2,
                    padding: "1px 6px", borderRadius: 8,
                    background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
                    color: "var(--surface-white)", fontSize: 9, fontWeight: 800,
                    fontFamily: "var(--font-sans, monospace)",
                    boxShadow: "1px 1px 0px rgba(var(--text-primary-rgb),0.3)",
                  }}>
                    ×{qty}
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFav(card.id); }}
                  style={{
                    position: "absolute", top: 4, left: 4, zIndex: 2,
                    width: 24, height: 24, borderRadius: "50%",
                    border: "none", cursor: "pointer", padding: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13,
                    background: isFav ? "var(--accent-hotpink)" : "rgba(var(--text-primary-rgb),0.25)",
                    color: "var(--surface-white)",
                    transition: "background 0.15s",
                  }}
                >
                  ❤️
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
