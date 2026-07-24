"use client";

import { useEffect, useState, useMemo } from "react";
import StyledSelect from "@/components/StyledSelect";
import { IconHeart } from "@/components/Icons";
import { RARITY_ORDER } from "@/lib/gameConfig";
import PlayerStatsView from "@/components/PlayerStatsView";
import type { OwnedCard } from "@/types/ownedCard";

const NATION_FLAGS: Record<string, string> = {
  france: "🇫🇷",
  allemagne: "🇩🇪",
  angleterre: "🇬🇧",
  italie: "🇮🇹",
  espagne: "🇪🇸",
  bresil: "🇧🇷",
  japon: "🇯🇵",
  argentine: "🇦🇷",
};

const RARITY_COLORS: Record<string, string> = {
  common: "#3a3a4a",
  rare: "#5078d8",
  epic: "#7c3aed",
  legendary: "#c8960e",
  secret: "#ff69b4",
};

const GRADE_ORDER = ["standard", "fine", "mint", "pristine", "gem"];

const GRADE_COLORS: Record<string, string> = {
  standard: "var(--text-disabled)",
  fine: "var(--accent-purple)",
  mint: "#50c878",
  pristine: "var(--accent-hotpink)",
  gem: "var(--rarity-legendary)",
};

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

export default function CardHub({
  ownedCards = [],
  onChanged = () => {},
  onBumpMission,
}: {
  ownedCards: OwnedCard[];
  onChanged?: () => void;
  onBumpMission?: (id: string) => void;
}) {
  const [favorites, toggleFav] = useFavorites();
  const [sortBy, setSortBy] = useState<string>("newest");
  const [favFilter, setFavFilter] = useState(false);
  const [filterNation, setFilterNation] = useState("all");
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null);

  const [cols, setCols] = useState(5);
  useEffect(() => {
    const handler = () => setCols(window.innerWidth < 640 ? 3 : 5);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const nations = useMemo(() => [...new Set(ownedCards.map((c) => c.nation))].sort(), [ownedCards]);
  const positions = useMemo(() => [...new Set(ownedCards.map((c) => c.group))].sort(), [ownedCards]);

  const filteredCards = useMemo(() => {
    let list = [...ownedCards];

    if (favFilter) list = list.filter((c) => favorites[c.id]);
    if (filterNation !== "all") list = list.filter((c) => c.nation === filterNation);
    if (filterPosition !== "all") list = list.filter((c) => c.group === filterPosition);
    if (filterRarity !== "all") list = list.filter((c) => c.rarity === filterRarity);

    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return 0;
        case "oldest": return 0;
        case "name": return a.name.localeCompare(b.name);
        case "rarity": return RARITY_ORDER.indexOf(b.rarity as any) - RARITY_ORDER.indexOf(a.rarity as any);
        case "ovr": return b.ovr - a.ovr;
        default: return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [ownedCards, sortBy, favFilter, favorites, filterNation, filterPosition, filterRarity]);

  const totalUnique = useMemo(() => new Set(filteredCards.map((c) => c.characterId)).size, [filteredCards]);
  const totalQty = filteredCards.length;

  return (
    <div className="mx-auto max-w-[600px] lg:max-w-[1100px]" style={{ padding: "24px 16px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 23, letterSpacing: "-0.3px", margin: 0, color: "var(--accent-hotpink)" }}>
            My Collection
          </h1>
          <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500 }}>
            {totalUnique} unique · {totalQty} total
          </span>
        </div>
        {favFilter && (
          <div style={{ width: "100%", marginTop: -4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "var(--accent-hotpink)" }}>
              <IconHeart filled size={12} /> Favorites only
            </span>
          </div>
        )}
      </div>

      <div style={{
        display: "flex", gap: 8, alignItems: "center", marginBottom: 20, flexWrap: "wrap",
        padding: "8px 12px", background: "rgba(var(--surface-white-rgb),0.6)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderRadius: 12, border: "2px solid rgba(var(--text-primary-rgb),0.08)",
        position: "relative", zIndex: 10,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-display)" }}>Sort</span>
        <StyledSelect options={[
          { value: "name", label: "Name" },
          { value: "rarity", label: "Rarity" },
          { value: "ovr", label: "OVR" },
        ]} value={sortBy} onChange={setSortBy} />
        <StyledSelect options={[{ value: "all", label: "All Nations" }, ...nations.map((n) => ({ value: n, label: `${NATION_FLAGS[n] ?? ""} ${n.charAt(0).toUpperCase() + n.slice(1)}` }))]} value={filterNation} onChange={setFilterNation} />
        <StyledSelect options={[{ value: "all", label: "All Positions" }, ...positions.map((p) => ({ value: p, label: p }))]} value={filterPosition} onChange={setFilterPosition} />
        <StyledSelect options={[{ value: "all", label: "All Rarities" }, ...RARITY_ORDER.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))]} value={filterRarity} onChange={setFilterRarity} />
        <button onClick={() => setFavFilter((v) => !v)} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
          border: "2px solid rgba(var(--text-primary-rgb),0.12)",
          background: favFilter ? "rgba(255,20,147,0.08)" : "transparent",
          color: favFilter ? "var(--accent-hotpink)" : "var(--text-muted)",
          fontSize: 11, fontWeight: 700, fontFamily: "var(--font-display)",
        }}>
          <IconHeart filled={favFilter} size={14} />
          {favFilter ? "Favorites" : "All"}
        </button>
      </div>

      {filteredCards.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-disabled)", fontSize: 15 }}>
          {favFilter ? "No favorited cards yet — tap the heart icon to add one." : "You don't own any cards yet. Pull a pack to start your collection."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
          {filteredCards.map((card) => {
            const isFav = !!favorites[card.id];
            const flag = NATION_FLAGS[card.nation] ?? "";
            const rarityColor = RARITY_COLORS[card.rarity] ?? "#666";
            const gradeLabel = card.grade ? GRADE_ORDER.indexOf(card.grade) >= 2 ? card.grade : null : null;

            return (
              <div key={card.id} style={{ display: "flex", flexDirection: "column", gap: 6, cursor: "pointer" }}
                onClick={() => setSelectedCard(card)}>
                <div style={{
                  position: "relative",
                  borderRadius: 12, overflow: "hidden",
                  aspectRatio: "896/1152",
                  background: `linear-gradient(135deg, ${rarityColor}44, ${rarityColor}22)`,
                  border: `2px solid ${rarityColor}66`,
                  boxShadow: `3px 3px 0px ${rarityColor}44`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <img src={card.photo.standard} alt={card.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} />
                  <div style={{
                    position: "absolute", top: 4, left: 4, display: "flex", gap: 3, alignItems: "center",
                  }}>
                    {gradeLabel && (
                      <span style={{
                        padding: "1px 5px", borderRadius: 4, fontSize: 8, fontWeight: 800,
                        background: rarityColor, color: "#fff",
                      }}>
                        {gradeLabel.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                    padding: "20px 6px 6px", display: "flex", flexDirection: "column", gap: 1,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                        {flag} {card.name}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                        {card.ovr}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                        {card.group} · {card.rarity}
                      </span>
                      {card.serial != null && (
                        <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono, monospace)" }}>
                          #{String(card.serial).padStart(4, "0")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
                  <button onClick={(e) => { e.stopPropagation(); toggleFav(card.id); }} style={{
                    width: 26, height: 26, borderRadius: "50%", border: "2px solid rgba(var(--text-primary-rgb),0.12)", cursor: "pointer", padding: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isFav ? "var(--accent-hotpink)" : "transparent",
                    color: isFav ? "var(--surface-white)" : "var(--text-disabled)",
                    flexShrink: 0, lineHeight: 1,
                  }}>
                    <IconHeart filled={isFav} size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCard && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          padding: 16, overflow: "auto",
        }} onClick={() => setSelectedCard(null)}>
          <div style={{
            maxWidth: 480, width: "100%", maxHeight: "90vh", overflow: "auto",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              borderRadius: 16, overflow: "hidden",
              background: "var(--surface-white)", border: "2px solid rgba(var(--text-primary-rgb),0.1)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
            }}>
              <div style={{ position: "relative", aspectRatio: "896/1152", maxHeight: 300, overflow: "hidden" }}>
                <img src={selectedCard.photo.standard} alt={selectedCard.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                  padding: "30px 12px 12px",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{selectedCard.name}</div>
                  <div style={{ display: "flex", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                    <span>{selectedCard.rarity.toUpperCase()}</span>
                    <span>·</span>
                    <span>OVR {selectedCard.ovr}</span>
                    {selectedCard.serial != null && (
                      <>
                        <span>·</span>
                        <span>#{String(selectedCard.serial).padStart(4, "0")}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <PlayerStatsView card={selectedCard} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
