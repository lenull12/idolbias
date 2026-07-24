"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IconGrid, IconSearch } from "@/components/Icons";
import ArrowButton from "@/components/ArrowButton";
import StyledSelect from "@/components/StyledSelect";
import { getCharacters, getPrintsByCharacter, type CharacterDef } from "@/data/footballCards";
import { CHARACTER_STATS } from "@/data/characterStats";
import { RARITY_ORDER } from "@/lib/gameConfig";

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

const STYLE_LABELS: Record<string, string> = {
  percussion: "Percussion",
  vista: "Vista",
  pressing: "Pressing",
  elevation: "Elevation",
  sangFroid: "Sang-froid",
};

const PAGE_SIZE = 24;
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
  const [filterNation, setFilterNation] = useState("all");
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [page, setPage] = useState(0);

  const characters = useMemo(() => getCharacters(), []);

  const nations = useMemo(() => [...new Set(characters.map((c) => c.nation))].sort(), [characters]);
  const positions = useMemo(() => [...new Set(characters.map((c) => c.defaultPosition))].sort(), [characters]);

  const filtered = useMemo(() => {
    let list = [...characters];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.nation.toLowerCase().includes(q) ||
          c.defaultStyle.toLowerCase().includes(q) ||
          (CHARACTER_STATS[c.id]?.nickname && CHARACTER_STATS[c.id]!.nickname!.toLowerCase().includes(q))
      );
    }
    if (filterNation !== "all") list = list.filter((c) => c.nation === filterNation);
    if (filterPosition !== "all") list = list.filter((c) => c.defaultPosition === filterPosition);
    if (viewMode === "collection") list = list.filter((c) => (owned[c.id] ?? 0) > 0);
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [search, filterNation, filterPosition, filterRarity, viewMode, owned, characters]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const paginatedChars = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [viewMode, search, filterNation, filterPosition, filterRarity]);

  const completion = useMemo(() => {
    const total = characters.length;
    const unlocked = characters.filter((c) => (owned[c.id] ?? 0) > 0).length;
    return { unlocked, total };
  }, [owned, characters]);

  const canPrev = safePage > 0;
  const canNext = safePage < totalPages - 1;
  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <div className="mx-auto max-w-[600px] lg:max-w-[1100px]" style={{ padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 23, letterSpacing: "-0.3px", margin: 0, color: "var(--accent-hotpink)" }}>
          Player Catalogue
        </h1>
        <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500 }}>
          {characters.length} players
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
        WebkitBackdropFilter: "blur(12px)", borderRadius: 12, border: "2px solid rgba(var(--text-primary-rgb),0.08)",
      }}>
        <div style={{
          display: "flex", gap: 0, borderRadius: 8,
          border: "2px solid rgba(var(--text-primary-rgb),0.12)",
          overflow: "hidden",
        }}>
          <button onClick={() => setViewMode("collection")} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "5px 12px", border: "none",
            background: viewMode === "collection"
              ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))"
              : "transparent",
            color: viewMode === "collection" ? "var(--text-primary)" : "var(--text-muted)",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font-display)", whiteSpace: "nowrap",
            transition: "background 0.15s",
          }}>
            <IconGrid size={13} /> Collection
          </button>
          <button onClick={() => setViewMode("all")} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "5px 12px", border: "none",
            background: viewMode === "all"
              ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))"
              : "transparent",
            color: viewMode === "all" ? "var(--text-primary)" : "var(--text-muted)",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font-display)", whiteSpace: "nowrap",
            transition: "background 0.15s",
          }}>
            <IconSearch size={13} /> All players
          </button>
        </div>

        <input placeholder="Search players…" value={search} onChange={(e) => setSearch(e.target.value)} style={{
          flex: "1 1 160px", padding: "6px 10px", borderRadius: 8,
          border: "2px solid rgba(var(--text-primary-rgb),0.12)",
          background: "rgba(var(--surface-white-rgb),0.5)", color: "var(--text-primary)", fontSize: 12, outline: "none",
          fontFamily: "var(--font-display)", fontWeight: 600,
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => e.target.style.borderColor = "var(--accent-hotpink)"}
        onBlur={(e) => e.target.style.borderColor = "rgba(var(--text-primary-rgb),0.12)"}
        />
        <StyledSelect
          options={[{ value: "all", label: "All Nations" }, ...nations.map((n) => ({ value: n, label: `${NATION_FLAGS[n] ?? ""} ${n.charAt(0).toUpperCase() + n.slice(1)}` }))]}
          value={filterNation}
          onChange={setFilterNation}
        />
        <StyledSelect
          options={[{ value: "all", label: "All Positions" }, ...positions.map((p) => ({ value: p, label: p }))]}
          value={filterPosition}
          onChange={setFilterPosition}
        />
        <StyledSelect
          options={[{ value: "all", label: "All Rarities" }, ...RARITY_ORDER.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))]}
          value={filterRarity}
          onChange={setFilterRarity}
        />
        <button onClick={() => { setSearch(""); setFilterNation("all"); setFilterPosition("all"); setFilterRarity("all"); }} style={{
          padding: "5px 10px", borderRadius: 8, cursor: "pointer",
          border: "2px solid rgba(var(--text-primary-rgb),0.12)",
          background: "transparent", color: "var(--text-muted)", fontSize: 11,
          fontFamily: "var(--font-display)", letterSpacing: "1px", fontWeight: 700,
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--text-primary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(var(--text-primary-rgb),0.12)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >RESET</button>
      </div>

      <div style={{ fontSize: 10, color: "var(--text-disabled)", fontFamily: "var(--font-sans, monospace)", marginBottom: 12, fontWeight: 500 }}>
        {filtered.length === characters.length
          ? `${characters.length} players`
          : `${filtered.length} / ${characters.length} players`}
        {totalPages > 1 && ` · page ${safePage + 1}/${totalPages}`}
      </div>

      <div ref={gridRef} className="grid grid-cols-5 lg:grid-cols-10" style={{ gap: GAP }}>
        {paginatedChars.map((char) => {
          const prints = getPrintsByCharacter(char.id);
          const qty = owned[char.id] ?? 0;
          const isOwned = qty > 0;
          const flag = NATION_FLAGS[char.nation] ?? "";

          return (
            <div
              key={char.id}
              style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 6 }}
            >
              <div style={{
                position: "relative",
                borderRadius: 12, overflow: "hidden",
                aspectRatio: "896/1152",
                background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
                border: "2px solid rgba(var(--text-primary-rgb),0.08)",
                boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
                filter: isOwned ? "none" : "grayscale(0.6) brightness(0.6)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "var(--surface-white)", fontFamily: "var(--font-display, cursive)" }}>
                  {char.name[0]}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginTop: 4, fontFamily: "var(--font-sans, monospace)" }}>
                  {flag} {CHARACTER_STATS[char.id]?.position ?? char.defaultPosition}
                </span>
                {!isOwned && (
                  <div style={{
                    position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%",
                    background: "rgba(var(--text-primary-rgb),0.55)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                  }}>🔒</div>
                )}
                {isOwned && qty > 1 && (
                  <div style={{
                    position: "absolute", top: 4, right: 4, zIndex: 2,
                    padding: "1px 6px", borderRadius: 8,
                    background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
                    color: "var(--surface-white)", fontSize: 9, fontWeight: 800,
                    fontFamily: "var(--font-sans, monospace)",
                    boxShadow: "1px 1px 0px rgba(var(--text-primary-rgb),0.3)",
                  }}>×{qty}</div>
                )}
                <div style={{
                  position: "absolute", bottom: 4, left: 4, right: 4,
                  display: "flex", gap: 3, justifyContent: "center", flexWrap: "wrap",
                }}>
                  {prints.map((p) => {
                    const rarityColors: Record<string, string> = {
                      common: "rgba(128,128,128,0.5)",
                      rare: "var(--accent-pink)",
                      epic: "var(--accent-purple)",
                      legendary: "#c8960e",
                      secret: "#ff69b4",
                    };
                    return (
                      <span key={p.id} style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: rarityColors[p.rarity] ?? "gray",
                        border: "1px solid rgba(255,255,255,0.3)",
                      }} />
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono, monospace)",
                  color: isOwned ? "var(--text-secondary)" : "var(--text-disabled)",
                  letterSpacing: "0.5px",
                }}>
                  {char.name.split(" ")[0]}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: "var(--text-muted)",
                  fontFamily: "var(--font-sans, monospace)",
                }}>
                  {STYLE_LABELS[char.defaultStyle] ?? char.defaultStyle}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20 }}>
          <ArrowButton direction="left" label="Prev" onClick={canPrev ? handlePrev : undefined} disabled={!canPrev} size={13} />
          <span style={{
            fontSize: 12, fontWeight: 700, color: "var(--text-secondary)",
            fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.5px",
          }}>
            {safePage + 1} / {totalPages}
          </span>
          <ArrowButton direction="right" label="Next" onClick={canNext ? handleNext : undefined} disabled={!canNext} size={13} />
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-disabled)", fontSize: 15 }}>
          {viewMode === "collection"
            ? "You don't own any cards yet. Pull a pack to start your collection ✨"
            : "No players match your filters."}
        </div>
      )}
    </div>
  );
}
