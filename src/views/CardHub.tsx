"use client";

import { useEffect, useState, useMemo } from "react";
import StyledSelect from "@/components/StyledSelect";
import { IconHeart } from "@/components/Icons";
import { GradeBadge } from "@/components/GradeBadge";
import PhotoCard from "@/components/PhotoCard";
import PillBar from "@/components/PillBar";
import CARDS, { rarityFromReference, getCardById } from "@/data/cards";
import type { CardGrade } from "@/db/schema";
import { GRADE_ORDER } from "@/lib/gradeConfig";
import { RARITY_ORDER, CRAFT_COSTS, getDisenchantValue } from "@/lib/gameConfig";
import { RARITY_LABELS, RARITY_COLORS, SEASON_COLORS } from "@/lib/rarityTheme";
import { disenchantCard, craftCard, instantSellCard } from "@/lib/gameActions";
import { isInstantSellEligible, INSTANT_SELL_PAYOUT_RATE } from "@/lib/vendorConfig";
import { useCardPrices } from "@/lib/useCardPrices";
import type { Rarity } from "@/components/CardEffects";
import type { CardEntry } from "@/data/cards";

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
  owned, ownedGrades = {}, dust = 0, gems = 0, onChanged = () => {}, onBumpMission,
}: {
  owned: Record<string, number>;
  ownedGrades?: Record<string, Partial<Record<CardGrade, number>>>;
  dust?: number;
  gems?: number;
  onChanged?: () => void;
  onBumpMission?: (id: string) => void;
}) {
  const [favorites, toggleFav] = useFavorites();
  const [sortBy, setSortBy] = useState<string>("newest");
  const [favFilter, setFavFilter] = useState(false);
  const [filterMember, setFilterMember] = useState("all");
  const [filterPack, setFilterPack] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const prices = useCardPrices();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showCraft, setShowCraft] = useState(false);

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

  const members = useMemo(() => [...new Set(CARDS.map((c) => c.idol))].sort(), []);
  const packs = useMemo(() => [...new Set(CARDS.map((c) => c.pack))].sort(), []);
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
        case "value_desc":
        case "value_asc": {
          const getBestPrice = (c: typeof a) => {
            const grades = ownedGrades[c.id] ?? {};
            const g = [...GRADE_ORDER].reverse().find((gr) => (grades[gr] ?? 0) > 0) ?? "standard";
            return prices[c.id + ":" + g] ?? 0;
          };
          return sortBy === "value_desc" ? getBestPrice(b) - getBestPrice(a) : getBestPrice(a) - getBestPrice(b);
        }
        default: return a.reference.localeCompare(b.reference);
      }
    });

    return list;
  }, [owned, sortBy, favFilter, favorites, filterMember, filterPack, filterRarity, filterGrade, cardIndex, prices, ownedGrades]);

  const totalUnique = ownedCards.length;
  const totalQty = useMemo(() => ownedCards.reduce((sum, c) => sum + (owned[c.id] ?? 0), 0), [ownedCards, owned]);

  if (selectedCardId) {
    return (
      <CardActionPanel
        cardId={selectedCardId}
        ownedGrades={ownedGrades}
        gems={gems}
        dust={dust}
        onBack={() => setSelectedCardId(null)}
        onChanged={onChanged}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[600px] lg:max-w-[1100px]" style={{ padding: "24px 16px 48px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 23, letterSpacing: "-0.3px", margin: 0, color: "var(--accent-hotpink)" }}>
            My Collection
          </h1>
          <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500 }}>
            {totalUnique} unique · {totalQty} total
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--accent-purple)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M12 2l8 7-8 13-8-13z" />
            </svg>
            {dust} dust
          </span>
          <button onClick={() => setShowCraft(true)} style={{
            padding: "7px 14px", borderRadius: 8, cursor: "pointer",
            border: "2px solid var(--text-primary)",
            background: "var(--surface-white)", color: "var(--text-primary)",
            fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)",
          }}>
            Craft
          </button>
        </div>
        {favFilter && (
          <div style={{ width: "100%", marginTop: -4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "var(--accent-hotpink)" }}>
              <IconHeart filled size={12} /> Favorites only
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: "flex", gap: 8, alignItems: "center", marginBottom: 20, flexWrap: "wrap",
        padding: "8px 12px", background: "rgba(var(--surface-white-rgb),0.6)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderRadius: 12, border: "2px solid rgba(var(--text-primary-rgb),0.08)",
        position: "relative", zIndex: 10,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-display)" }}>Sort</span>
        <StyledSelect options={[
          { value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" },
          { value: "value_desc", label: "Value ↓" }, { value: "value_asc", label: "Value ↑" },
          { value: "member", label: "Member" }, { value: "rarity", label: "Rarity" }, { value: "set", label: "Set" },
        ]} value={sortBy} onChange={setSortBy} />
        <StyledSelect options={[{ value: "all", label: "All Members" }, ...members.map((m) => ({ value: m, label: m }))]} value={filterMember} onChange={setFilterMember} />
        <StyledSelect options={[{ value: "all", label: "All Packs" }, ...packs.map((p) => ({ value: p, label: p }))]} value={filterPack} onChange={setFilterPack} />
        <StyledSelect options={[{ value: "all", label: "All Rarities" }, ...RARITY_ORDER.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))]} value={filterRarity} onChange={setFilterRarity} />
        <StyledSelect options={[{ value: "all", label: "All Grades" }, ...GRADE_ORDER.map((g) => ({ value: g, label: g.charAt(0).toUpperCase() + g.slice(1) }))]} value={filterGrade} onChange={setFilterGrade} />
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

      {/* Grid */}
      {ownedCards.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-disabled)", fontSize: 15 }}>
          {favFilter ? "No favorited cards yet — tap the heart icon on a card to add it." : "You don't own any cards yet. Pull a pack to start your collection."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
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
                  meta={{ idol: card.idol, group: card.group, pack: card.pack, edition: card.edition, reference: card.reference }}
                  rarity={rarity}
                  grade={bestGrade}
                  maxTilt={8}
                  width={slotWidth}
                />
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
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {qty > 1 && (
                      <span style={{ padding: "1px 7px", borderRadius: 8, background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))", color: "var(--surface-white)", fontSize: 9.5, fontWeight: 800, fontFamily: "var(--font-sans, monospace)" }}>×{qty}</span>
                    )}
                    {prices[card.id + ":" + (bestGrade ?? "standard")] !== undefined && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(var(--text-primary-rgb),0.6)", fontFamily: "var(--font-display)" }}>💎 {prices[card.id + ":" + (bestGrade ?? "standard")]}</span>
                    )}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSelectedCardId(card.id); }} style={{
                  padding: "3px 0 0", background: "none", border: "none", cursor: "pointer",
                  fontSize: 10, fontWeight: 700, fontFamily: "var(--font-display)",
                  color: "var(--text-muted)", textDecoration: "underline", textUnderlineOffset: "3px",
                  textAlign: "left", width: "fit-content",
                }}>
                  Manage →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showCraft && <CraftModal dust={dust} onClose={() => setShowCraft(false)} onChanged={onChanged} onBumpMission={onBumpMission} />}
    </div>
  );
}

function CardActionPanel({
  cardId, ownedGrades, gems, dust, onBack, onChanged,
}: {
  cardId: string; ownedGrades: Record<string, Partial<Record<CardGrade, number>>>; gems: number; dust: number;
  onBack: () => void; onChanged: () => void;
}) {
  const card = getCardById(cardId);
  const [listings, setListings] = useState<any[] | null>(null);
  const [livePrice, setLivePrice] = useState<{ suggestedPrice: number; series: { hour: number; price: number }[] } | null>(null);
  const [chartGrade, setChartGrade] = useState<CardGrade>("standard");
  const [error, setError] = useState<string | null>(null);

  const loadListings = () => {
    fetch(`/api/market/listings?cardId=${cardId}`).then((r) => r.json()).then((d) => setListings(d.listings));
  };
  useEffect(() => { loadListings(); }, [cardId]);
  useEffect(() => {
    fetch(`/api/market/price?cardId=${cardId}&grade=${chartGrade}&range=24h`).then((r) => r.json())
      .then((data) => setLivePrice({ suggestedPrice: data.suggestedPrice, series: (data.series ?? []).map((s: { hour: number; price: number }) => ({ hour: s.hour, price: s.price })) }));
  }, [cardId, chartGrade]);

  if (!card) return null;
  const rarity = rarityFromReference(card.reference);

  return (
    <div className="mx-auto max-w-[600px] lg:max-w-[1100px]" style={{ padding: "24px 16px 48px" }}>
      <button onClick={onBack} style={{
        fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer",
        alignSelf: "flex-start", padding: "4px 0", marginBottom: 16, fontFamily: "var(--font-display)",
      }}>&larr; Back to Collection</button>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ width: 220, flexShrink: 0 }}>
          <PhotoCard
            imageSrc={card.imageSrc}
            season={SEASON_COLORS[rarity]}
            meta={{ idol: card.idol, group: card.group, pack: card.pack, edition: card.edition, reference: card.reference }}
            rarity={rarity}
            grade={GRADE_ORDER.reverse().find((g) => (ownedGrades[cardId]?.[g] ?? 0) > 0)}
            maxTilt={8}
            width={220}
          />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>{card.idol}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{card.reference} &middot; {rarity.charAt(0).toUpperCase() + rarity.slice(1)} &middot; {card.pack}</div>
          <span style={{ fontSize: 11, color: "var(--text-disabled)", display: "block", marginTop: 2 }}>Tap the card to zoom</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <StyledSelect options={GRADE_ORDER.map((g) => ({ value: g, label: g.charAt(0).toUpperCase() + g.slice(1) }))} value={chartGrade} onChange={(v) => setChartGrade(v as CardGrade)} />
      </div>

      {livePrice && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>💎 {livePrice.suggestedPrice}</span>
          </div>
          {livePrice.series.length > 1 && (
            <div style={{ marginTop: 8, borderRadius: 14, border: "2px solid var(--text-primary)", boxShadow: "4px 4px 0 rgba(var(--text-primary-rgb),0.9)", background: "rgba(var(--surface-white-rgb),0.9)", padding: "14px" }}>
              <MiniChart series={livePrice.series} color="var(--accent-hotpink)" />
            </div>
          )}
        </div>
      )}

      {error && <div style={{ fontSize: 12, color: "var(--accent-hotpink)", marginBottom: 12 }}>{error}</div>}

      {/* Your copies */}
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-muted)" }}>Your copies</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {GRADE_ORDER.map((grade) => {
            const qty = ownedGrades[cardId]?.[grade] ?? 0;
            if (qty === 0) return null;
            return <GradeActionRow key={grade} cardId={cardId} grade={grade} qty={qty} rarity={rarity} dust={dust} gems={gems} onChanged={() => { onChanged(); loadListings(); }} setError={setError} />;
          })}
          {Object.values(ownedGrades[cardId] ?? {}).every((v) => (v ?? 0) === 0) && (
            <div style={{ fontSize: 12, color: "var(--text-disabled)", padding: "8px 0" }}>You don&rsquo;t own this card.</div>
          )}
        </div>
      </div>

      {/* Active listings */}
      <div>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-muted)" }}>Active listings</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {(listings ?? []).map((listing) => (
            <div key={listing.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 10, background: "rgba(var(--surface-white-rgb),0.5)", border: "2px solid rgba(var(--text-primary-rgb),0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <GradeBadge grade={listing.grade} size="compact" />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Seller: {listing.sellerId?.slice(0, 8) ?? "anon"}</span>
              </div>
              <button onClick={async () => {
                if (gems < listing.priceGems) { setError("Not enough gems"); return; }
                try {
                  const res = await fetch(`/api/market/${listing.id}/buy`, { method: "POST" });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error ?? "Purchase failed");
                  loadListings();
                  onChanged();
                } catch (e) { setError((e as Error).message); }
              }} style={{
                padding: "6px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-display)",
                background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))", color: "var(--surface-white)",
              }}>
                Buy 💎 {listing.priceGems}
              </button>
            </div>
          ))}
          {listings?.length === 0 && <span style={{ fontSize: 12, color: "var(--text-disabled)" }}>No listings right now.</span>}
          {listings === null && <span style={{ fontSize: 12, color: "var(--text-disabled)" }}>Loading&hellip;</span>}
        </div>
      </div>
    </div>
  );
}

const gradeLabel = (g: CardGrade) => g.charAt(0).toUpperCase() + g.slice(1);

function GradeActionRow({
  cardId, grade, qty, rarity, dust, gems, onChanged, setError,
}: {
  cardId: string; grade: CardGrade; qty: number; rarity: Rarity; dust: number; gems: number;
  onChanged: () => void; setError: (msg: string | null) => void;
}) {
  const extras = qty - 1;
  const canDisenchant = extras > 0;
  const canSell = isInstantSellEligible(rarity, grade) && extras > 0;
  const hasActions = canDisenchant || canSell;

  const [expand, setExpand] = useState(false);

  // Disenchant
  const [disAmt, setDisAmt] = useState(0);
  const [disBusy, setDisBusy] = useState(false);
  // Instant sell
  const [sellAmt, setSellAmt] = useState(0);
  const [sellBusy, setSellBusy] = useState(false);
  // List on market
  const [listPrice, setListPrice] = useState("");
  const [listBusy, setListBusy] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const isLastCopy = qty === 1;

  useEffect(() => {
    if (!expand) return;
    fetch(`/api/market/price?cardId=${cardId}&grade=${grade}`).then((r) => r.json()).then((d) => setSuggestedPrice(d.suggestedPrice));
  }, [expand, cardId, grade]);

  const handleDisenchant = async () => {
    if (disAmt === 0) return;
    setDisBusy(true);
    try {
      await disenchantCard(cardId, disAmt, grade);
      setDisAmt(0);
      onChanged();
    } catch (e) { setError((e as Error).message); }
    finally { setDisBusy(false); }
  };

  const handleSell = async () => {
    if (sellAmt === 0) return;
    setSellBusy(true);
    try {
      await instantSellCard(cardId, grade, sellAmt);
      setSellAmt(0);
      onChanged();
    } catch (e) { setError((e as Error).message); }
    finally { setSellBusy(false); }
  };

  const handleList = async (confirmLast: boolean) => {
    const priceGems = Number(listPrice);
    if (!priceGems || priceGems < 1) { setError("Enter a valid price"); return; }
    setListBusy(true);
    try {
      const res = await fetch("/api/market/list", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, grade, priceGems, confirmLastCopy: confirmLast }),
      });
      const data = await res.json();
      if (res.status === 409 && data.code === "LAST_COPY_CONFIRMATION_REQUIRED") { setNeedsConfirm(true); return; }
      if (!res.ok) throw new Error(data.error ?? "Listing failed");
      setListPrice("");
      setNeedsConfirm(false);
      onChanged();
    } catch (e) { setError((e as Error).message); }
    finally { setListBusy(false); }
  };

  const dustValue = getDisenchantValue(rarity, grade);
  const sellRate = INSTANT_SELL_PAYOUT_RATE;

  const btnBase: React.CSSProperties = {
    padding: "4px 8px", borderRadius: 6, border: "2px solid rgba(var(--text-primary-rgb),0.12)",
    background: "var(--surface-white)", cursor: "pointer", fontSize: 10, fontWeight: 700,
    fontFamily: "var(--font-display)", color: "var(--text-primary)",
  };

  return (
    <div style={{ borderRadius: 12, background: "rgba(var(--surface-white-rgb),0.5)", border: "2px solid rgba(var(--text-primary-rgb),0.08)", overflow: "hidden" }}>
      <button onClick={() => setExpand((v) => !v)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px",
        background: "none", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GradeBadge grade={grade} size="compact" />
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)" }}>
            ×{qty}
            <span style={{ color: "var(--text-muted)", fontWeight: 500, marginLeft: 6 }}>
              {isLastCopy ? "· your only copy" : `· ${extras} to spare`}
            </span>
          </span>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{expand ? "▲" : "▼"}</span>
      </button>

      {expand && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {suggestedPrice !== null && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Live price: 💎 {suggestedPrice}</span>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            {canDisenchant && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => setDisAmt(Math.max(0, disAmt - 1))} disabled={disAmt <= 0} style={btnBase}>&minus;</button>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-display)", minWidth: 16, textAlign: "center" }}>{disAmt}</span>
                <button onClick={() => setDisAmt(Math.min(extras, disAmt + 1))} disabled={disAmt >= extras} style={btnBase}>+</button>
                <button disabled={disAmt === 0 || disBusy} onClick={handleDisenchant} style={{ ...btnBase, background: disAmt > 0 ? "var(--accent-purple)" : undefined, color: disAmt > 0 ? "var(--surface-white)" : undefined, border: disAmt > 0 ? "none" : undefined }}>
                  {disBusy ? "..." : `Disenchant`} {disAmt > 0 ? `(+${disAmt * dustValue}💎)` : ""}
                </button>
              </div>
            )}

            {canSell && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => setSellAmt(Math.max(0, sellAmt - 1))} disabled={sellAmt <= 0} style={btnBase}>&minus;</button>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-display)", minWidth: 16, textAlign: "center" }}>{sellAmt}</span>
                <button onClick={() => setSellAmt(Math.min(extras, sellAmt + 1))} disabled={sellAmt >= extras} style={btnBase}>+</button>
                <button disabled={sellAmt === 0 || sellBusy} onClick={handleSell} style={{ ...btnBase, background: sellAmt > 0 ? "var(--accent-hotpink)" : undefined, color: sellAmt > 0 ? "var(--surface-white)" : undefined, border: sellAmt > 0 ? "none" : undefined }}>
                  {sellBusy ? "..." : `Sell`} {sellAmt > 0 ? `(+${Math.round((suggestedPrice ?? 0) * sellRate * sellAmt)}💎)` : ""}
                </button>
              </div>
            )}

            {!hasActions && <span style={{ fontSize: 11, color: "var(--text-disabled)" }}>No extra copies available for disenchant or instant sell.</span>}
          </div>

          {/* List on Market */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 11, color: "var(--text-disabled)", fontFamily: "var(--font-display)" }}>
              {suggestedPrice !== null ? `Suggested price: 💎 ${suggestedPrice}` : "Loading suggested price..."}
            </div>

            {needsConfirm ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px", borderRadius: 8, background: "rgba(255,20,147,0.06)", border: "2px solid rgba(255,20,147,0.25)" }}>
                <span style={{ fontSize: 12 }}>This is your only copy &mdash; selling it means you no longer own it. Sure?</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button disabled={listBusy} onClick={() => handleList(true)} style={{
                    flex: 1, padding: "8px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    fontFamily: "var(--font-display)", background: "var(--accent-hotpink)", color: "var(--surface-white)",
                  }}>{listBusy ? "..." : "Yes, list it"}</button>
                  <button onClick={() => setNeedsConfirm(false)} style={{
                    flex: 1, padding: "8px 12px", borderRadius: 8, border: "2px solid rgba(var(--text-primary-rgb),0.12)",
                    background: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    fontFamily: "var(--font-display)", color: "var(--text-secondary)",
                  }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number" min={1} placeholder={suggestedPrice !== null ? String(suggestedPrice) : "..."} value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  style={{
                    flex: 1, padding: "8px 10px", borderRadius: 8,
                    border: "2px solid rgba(var(--text-primary-rgb),0.12)", background: "var(--surface-white)",
                    color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 600,
                    outline: "none", maxWidth: 180,
                  }}
                />
                <button disabled={listBusy || !listPrice} onClick={() => handleList(false)} style={{
                  padding: "8px 16px", borderRadius: 8, border: "2px solid var(--text-primary)",
                  background: listPrice ? "var(--text-primary)" : "transparent",
                  color: listPrice ? "var(--surface-white)" : "var(--text-disabled)",
                  fontSize: 12, fontWeight: 700, cursor: listPrice ? "pointer" : "default",
                  fontFamily: "var(--font-display)", whiteSpace: "nowrap",
                }}>
                  {listBusy ? "..." : "List for sale"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CraftModal({ dust, onClose, onChanged, onBumpMission }: { dust: number; onClose: () => void; onChanged: () => void; onBumpMission?: (id: string) => void }) {
  const [rarity, setRarity] = useState<Rarity>("common");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [craftResult, setCraftResult] = useState<CardEntry | null>(null);

  const cost = CRAFT_COSTS[rarity];
  const poolSize = useMemo(() => CARDS.filter((c) => rarityFromReference(c.reference) === rarity).length, [rarity]);
  const canAfford = dust >= cost;
  const isLegendary = rarity === "legendary" || rarity === "secret";

  const handleCraft = async () => {
    setBusy(true); setError(null); setCraftResult(null);
    try {
      const res = await craftCard(rarity);
      setCraftResult(res.card as CardEntry);
      onChanged();
      onBumpMission?.("craft_card");
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(var(--text-primary-rgb),0.35)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", cursor: "pointer",
    }}>
      <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }`}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        animation: "modalIn 0.35s cubic-bezier(0.23, 1, 0.32, 1)",
        width: "min(340px, 88vw)", borderRadius: 16, overflow: "hidden",
        border: "2px solid var(--text-primary)", boxShadow: "6px 6px 0px rgba(var(--text-primary-rgb),0.9)",
        background: "var(--surface-white)", cursor: "default",
      }}>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", textAlign: "center", color: "var(--text-primary)" }}>
            Craft a card
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
            Spend dust for a random card of the selected rarity.
          </span>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {RARITY_ORDER.map((r) => (
              <button key={r} onClick={() => setRarity(r)} style={{
                padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                border: `2px solid ${rarity === r ? "var(--text-primary)" : "rgba(var(--text-primary-rgb),0.12)"}`,
                background: rarity === r ? RARITY_COLORS[r] : "var(--surface-white)",
                color: rarity === r && r !== "common" ? "var(--surface-white)" : "var(--text-primary)",
                fontSize: 11, fontWeight: 700, fontFamily: "var(--font-display)",
              }}>{RARITY_LABELS[r]}</button>
            ))}
          </div>

          <div style={{ fontSize: 13, fontFamily: "var(--font-display)", textAlign: "center" }}>
            Cost: <b style={{ color: "var(--accent-hotpink)" }}>{cost} dust</b> &middot; pool: {poolSize} cards
          </div>

          <button disabled={!canAfford || busy} onClick={handleCraft} style={{
            padding: "10px 0", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
            color: "var(--surface-white)", fontSize: 13, fontWeight: 700, cursor: canAfford ? "pointer" : "default",
            fontFamily: "var(--font-display)", opacity: canAfford ? 1 : 0.4,
          }}>
            {busy ? "Crafting..." : canAfford ? "Craft" : "Not enough dust"}
          </button>

          {error && <div style={{ fontSize: 11, color: "var(--state-danger)" }}>{error}</div>}

          <button onClick={onClose} style={{
            padding: "8px 0", borderRadius: 10, border: "2px solid rgba(var(--text-primary-rgb),0.12)",
            background: "transparent", color: "var(--text-muted)", cursor: "pointer",
            fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)",
          }}>Close</button>
        </div>
      </div>

      {/* Craft result reveal */}
      {craftResult && (
        <div onClick={(e) => { e.stopPropagation(); setCraftResult(null); }} style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(var(--text-primary-rgb),0.5)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", cursor: "pointer",
        }}>
          <style>{`
            @keyframes revealIn { 0% { opacity: 0; transform: scale(0.7) rotateY(90deg); } 100% { opacity: 1; transform: scale(1) rotateY(0); } }
          `}</style>
          <div onClick={(e) => e.stopPropagation()} style={{
            animation: "revealIn 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            width: "min(240px, 75vw)", borderRadius: 14, overflow: "hidden",
            border: `3px solid ${RARITY_COLORS[rarityFromReference(craftResult.reference)]}`,
            boxShadow: isLegendary ? "0 0 30px rgba(194,84,46,0.4)" : "0 0 20px rgba(var(--text-primary-rgb),0.2)",
            background: "var(--surface-white)", cursor: "default",
          }}>
            <img src={craftResult.imageSrc} alt={craftResult.idol} style={{ width: "100%", display: "block" }} />
            <div style={{ padding: "14px 14px 16px", textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>{craftResult.idol}</div>
              <div style={{ fontSize: 10, color: "var(--text-disabled)", fontFamily: "var(--font-display)" }}>{craftResult.reference} &middot; {RARITY_LABELS[rarityFromReference(craftResult.reference)]}</div>
              <div onClick={() => setCraftResult(null)} style={{
                padding: "8px 0", borderRadius: 8, marginTop: 4,
                background: "linear-gradient(135deg, rgba(255,20,147,0.08), rgba(201,177,255,0.06))",
                border: "2px solid var(--accent-hotpink)",
                fontSize: 13, fontWeight: 800, fontFamily: "var(--font-display)",
                color: "var(--accent-hotpink)", letterSpacing: "1px", cursor: "pointer",
              }}>{isLegendary ? "AMAZING!" : "NICE!"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniChart({ series, color = "var(--accent-hotpink)" }: { series: { hour: number; price: number }[]; color?: string }) {
  if (series.length < 2) return null;
  const prices = series.map((p) => p.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const W = 600, H = 120;
  const LEFT = 0, TOP = 0, plotW = W, plotH = H;

  const points = series.map((p, i) => {
    const x = LEFT + (i / (series.length - 1)) * plotW;
    const y = TOP + plotH - ((p.price - min) / range) * plotH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const areaPoints = `${points} ${LEFT + plotW},${TOP + plotH} ${LEFT},${TOP + plotH}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "auto", display: "block" }}>
      <polygon points={areaPoints} fill={color} opacity="0.08" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
