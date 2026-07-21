"use client";

import { useEffect, useMemo, useState } from "react";
import PillBar from "@/components/PillBar";
import StyledSelect from "@/components/StyledSelect";
import StyledInput from "@/components/StyledInput";
import ArrowButton from "@/components/ArrowButton";
import type { CardGrade } from "@/db/schema";
import { GRADE_ORDER } from "@/lib/gradeConfig";
import { getCardById, rarityFromReference } from "@/data/cards";
import { GradeBadge } from "@/components/GradeBadge";
import { RARITY_ORDER } from "@/lib/gameConfig";
import { GROUPS } from "@/data/artists";
import type { ScreenerRow } from "@/lib/marketScreenerEngine";

const GRADE_LABELS: Record<CardGrade, string> = {
  standard: "Standard", fine: "Fine", mint: "Mint", pristine: "Pristine", gem: "Gem",
};

const rarityLabel = (r: string) => r.charAt(0).toUpperCase() + r.slice(1);

type SubTab = "vendor" | "market" | "leaderboard";

export default function MarketView({
  gems = 0, onChanged = () => {},
}: {
  gems?: number; onChanged?: () => void;
}) {
  const [tab, setTab] = useState<SubTab>("vendor");

  return (
    <div className="mx-auto max-w-[600px] lg:max-w-[1100px]" style={{ padding: "24px 16px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase" }}>
          ✦ Market
        </span>
        <h1 style={{
          fontFamily: "var(--font-display, cursive)", fontSize: 28, letterSpacing: "-0.3px", margin: 0, lineHeight: 1.1,
          background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple), var(--holo-c))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          market
        </h1>
        <span style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 2 }}>
          Deals, trading, and the leaderboard &mdash; all in one place.
        </span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <PillBar
          tabs={[
            { key: "vendor" as const, label: "Vendor" },
            { key: "market" as const, label: "Market" },
            { key: "leaderboard" as const, label: "Rankings" },
          ]}
          activeTab={tab}
          onTabChange={setTab}
        />
      </div>

      {tab === "vendor" && <VendorTab gems={gems} onChanged={onChanged} />}
      {tab === "market" && <MarketplaceDashboard gems={gems} onChanged={onChanged} />}
      {tab === "leaderboard" && <LeaderboardTab />}
    </div>
  );
}

function VendorTab({ gems, onChanged }: { gems: number; onChanged: () => void }) {
  const [offers, setOffers] = useState<{ id: number; cardId: string; grade: CardGrade; priceGems: number; claimed: boolean }[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vendor/offers").then((r) => r.json()).then((d) => setOffers(d.offers));
  }, []);

  const handleBuy = async (offerId: number, price: number) => {
    if (gems < price) { setError("Not enough gems"); return; }
    setBusyId(offerId); setError(null);
    try {
      const res = await fetch("/api/vendor/buy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Purchase failed");
      setOffers((prev) => prev?.map((o) => (o.id === offerId ? { ...o, claimed: true } : o)) ?? null);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  if (!offers) return <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "12px 0" }}>Loading today&rsquo;s offers&hellip;</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
        3 targeted offers, refreshed daily &mdash; always below live market value. First come, first served.
      </span>
      {error && <div style={{ fontSize: 12, color: "var(--accent-hotpink)" }}>{error}</div>}

      {offers.map((offer) => {
        const card = getCardById(offer.cardId);
        if (!card) return null;
        const rarity = rarityFromReference(card.reference);
        return (
          <div key={offer.id} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 16px", borderRadius: 14,
            background: "rgba(var(--surface-white-rgb),0.5)",
            border: "2px solid rgba(var(--text-primary-rgb),0.08)",
            opacity: offer.claimed ? 0.45 : 1,
          }}>
            {card.imageSrc
              ? <img src={card.imageSrc} alt={card.idol} style={{ width: 60, aspectRatio: "896/1152", borderRadius: 10, border: "2px solid var(--text-primary)", objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 60, aspectRatio: "896/1152", borderRadius: 10, border: "2px solid var(--text-primary)", background: "var(--surface-glass)", flexShrink: 0 }} />
            }
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>{card.idol}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{card.reference} &middot; {rarityLabel(rarity)} &middot; {GRADE_LABELS[offer.grade]}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{card.pack}</span>
            </div>
            <button
              disabled={offer.claimed || busyId === offer.id}
              onClick={() => handleBuy(offer.id, offer.priceGems)}
              style={{
                padding: "10px 18px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700,
                fontFamily: "var(--font-display)", cursor: offer.claimed ? "default" : "pointer", whiteSpace: "nowrap",
                background: offer.claimed ? "rgba(var(--text-primary-rgb),0.08)" : "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
                color: offer.claimed ? "var(--text-muted)" : "var(--surface-white)",
              }}
            >
              {offer.claimed ? "Sold out" : busyId === offer.id ? "..." : `💎 ${offer.priceGems}`}
            </button>
          </div>
        );
      })}
    </div>
  );
}


function MarketplaceDashboard({
  gems, onChanged,
}: {
  gems: number; onChanged: () => void;
}) {
  const [screener, setScreener] = useState<ScreenerRow[] | null>(null);
  const [movers, setMovers] = useState<{ gainers: ScreenerRow[]; losers: ScreenerRow[] } | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const [screenerGrade, setScreenerGrade] = useState<string>("standard");

  useEffect(() => {
    fetch(`/api/market/screener?grade=${screenerGrade}`).then((r) => r.json()).then((d) => { setScreener(d.screener); setMovers(d.movers); });
  }, [screenerGrade]);

  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const genders = useMemo(() => [...new Set(GROUPS.map((g) => g.gender).filter(Boolean))], []);

  const genderOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: "all", label: "All Groups" }];
    if (genders.includes("female")) opts.push({ value: "female", label: "Girl Groups" });
    if (genders.includes("male")) opts.push({ value: "male", label: "Boy Groups" });
    return opts;
  }, [genders]);

  const groupOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: "all", label: "All" }];
    GROUPS.filter((g) => {
      if (genderFilter === "all") return true;
      return g.gender === genderFilter;
    }).forEach((g) => opts.push({ value: g.name, label: g.name }));
    return opts;
  }, [genderFilter]);

  useEffect(() => { setGroupFilter("all"); setPage(0); }, [genderFilter]);

  const rarityOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: "all", label: "All Rarities" }];
    RARITY_ORDER.forEach((r) => opts.push({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }));
    return opts;
  }, []);

  const filteredScreener = useMemo(() => {
    let list = screener ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.idol.toLowerCase().includes(q) || r.reference.toLowerCase().includes(q) || r.pack.toLowerCase().includes(q));
    }
    if (genderFilter !== "all") {
      list = list.filter((r) => {
        const g = GROUPS.find((x) => x.name === r.group);
        return g?.gender === genderFilter;
      });
    }
    if (groupFilter !== "all") {
      list = list.filter((r) => r.group === groupFilter);
    }
    if (rarityFilter !== "all") {
      list = list.filter((r) => r.rarity === rarityFilter);
    }
    return list;
  }, [screener, search, genderFilter, groupFilter, rarityFilter]);

  const totalPages = Math.ceil(filteredScreener.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const paginatedRows = filteredScreener.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search, genderFilter, groupFilter, rarityFilter]);

  if (selectedCardId) {
    return (
      <CardDetailPanel cardId={selectedCardId} onBack={() => setSelectedCardId(null)} gems={gems} onChanged={onChanged} />
    );
  }

  if (!screener || !movers) {
    return <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "12px 0" }}>Loading market data&hellip;</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
        Live index, always moving &mdash; even before anyone lists a card.
      </span>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1a9e5c", marginBottom: 6 }}>Top gainers (24h)</div>
          {movers.gainers.map((row) => <MoverChip key={row.cardId} row={row} onClick={() => setSelectedCardId(row.cardId)} />)}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-hotpink)", marginBottom: 6 }}>Top losers (24h)</div>
          {movers.losers.map((row) => <MoverChip key={row.cardId} row={row} onClick={() => setSelectedCardId(row.cardId)} />)}
        </div>
      </div>

      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-muted)" }}>
        All cards
      </span>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <StyledInput placeholder="Search by name or ref…" value={search} onChange={setSearch} style={{ maxWidth: 220 }} />
        <StyledSelect options={genderOptions} value={genderFilter} onChange={setGenderFilter} />
        <StyledSelect options={groupOptions} value={groupFilter} onChange={setGroupFilter} />
        <StyledSelect options={rarityOptions} value={rarityFilter} onChange={setRarityFilter} />
        <StyledSelect options={GRADE_ORDER.map((g) => ({ value: g, label: GRADE_LABELS[g as CardGrade] }))} value={screenerGrade} onChange={setScreenerGrade} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {paginatedRows.map((row) => <ScreenerRowItem key={row.cardId} row={row} onClick={() => setSelectedCardId(row.cardId)} />)}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <ArrowButton direction="left" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} size={13} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>
            {safePage + 1} / {totalPages}
          </span>
          <ArrowButton direction="right" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} size={13} />
        </div>
      )}

      {filteredScreener.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--text-disabled)", padding: "12px 0" }}>No cards match your filters.</div>
      )}
    </div>
  );
}

function MoverChip({ row, onClick }: { row: ScreenerRow; onClick: () => void }) {
  const up = row.pct24h >= 0;
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
      background: "rgba(var(--surface-white-rgb),0.5)", marginBottom: 6, border: "2px solid rgba(var(--text-primary-rgb),0.08)", cursor: "pointer", textAlign: "left",
    }}>
      {(() => { const c = getCardById(row.cardId); return c?.imageSrc
        ? <img src={c.imageSrc} alt={row.idol} style={{ width: 26, aspectRatio: "896/1152", borderRadius: 5, border: "2px solid var(--text-primary)", objectFit: "cover", flexShrink: 0 }} />
        : <div style={{ width: 26, aspectRatio: "896/1152", borderRadius: 5, border: "2px solid var(--text-primary)", background: "var(--surface-glass)", flexShrink: 0 }} />;
      })()}
      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.idol} <span style={{ fontSize: 10, color: "var(--text-muted)" }}>({row.reference})</span></span>
      <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--font-display)", color: up ? "#1a9e5c" : "var(--accent-hotpink)", flexShrink: 0 }}>
        {up ? "+" : ""}{row.pct24h}%
      </span>
    </button>
  );
}

function ScreenerRowItem({ row, onClick }: { row: ScreenerRow; onClick: () => void }) {
  const up = row.pct24h >= 0;
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
      background: "rgba(var(--surface-white-rgb),0.5)", border: "2px solid rgba(var(--text-primary-rgb),0.08)", cursor: "pointer", textAlign: "left",
    }}>
      {(() => { const c = getCardById(row.cardId); return c?.imageSrc
        ? <img src={c.imageSrc} alt={row.idol} style={{ width: 38, aspectRatio: "896/1152", borderRadius: 7, border: "2px solid var(--text-primary)", objectFit: "cover", display: "block", flexShrink: 0 }} />
        : <div style={{ width: 38, aspectRatio: "896/1152", borderRadius: 7, border: "2px solid var(--text-primary)", background: "var(--surface-glass)", flexShrink: 0 }} />;
      })()}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)" }}>{row.idol} &mdash; {row.reference}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{GRADE_LABELS[row.grade as CardGrade]} &middot; {row.pack}</div>
      </div>
      <PriceSparkline history={row.sparkline.map((price, i) => ({ hour: i, price }))} width={56} height={26} color={up ? "#1a9e5c" : "var(--accent-hotpink)"} />
      <div style={{ textAlign: "right", flexShrink: 0, minWidth: 64 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 800 }}>💎 {row.currentPrice}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, color: up ? "#1a9e5c" : "var(--accent-hotpink)" }}>
          {up ? "+" : ""}{row.pct24h}%
        </div>
      </div>
    </button>
  );
}

function CardDetailPanel({
  cardId, onBack, gems, onChanged,
}: {
  cardId: string; onBack: () => void; gems: number; onChanged: () => void;
}) {
  const card = getCardById(cardId);
  const [listings, setListings] = useState<any[] | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [livePrice, setLivePrice] = useState<{ currentPrice: number; history: { hour: number; price: number }[] } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartGrade, setChartGrade] = useState<CardGrade>("standard");
  const [chartRange, setChartRange] = useState<string>("24h");

  const rangeOptions = useMemo(() => [
    { value: "24h", label: "24h" },
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
    { value: "1y", label: "1y" },
  ], []);

  const loadListings = () => {
    fetch(`/api/market/listings?cardId=${cardId}`).then((r) => r.json())
      .then((d) => { setListings(d.listings); setPriceHistory(d.priceHistory ?? []); });
  };

  useEffect(() => { loadListings(); }, [cardId]);
  useEffect(() => {
    fetch(`/api/market/price?cardId=${cardId}&grade=${chartGrade}&range=${chartRange}`).then((r) => r.json())
      .then((data) => setLivePrice({
        currentPrice: data.suggestedPrice,
        history: (data.series ?? []).map((s: { hour: number; price: number }) => ({ hour: s.hour, price: s.price })),
      }));
  }, [cardId, chartGrade, chartRange]);

  if (!card) return null;
  const rarity = rarityFromReference(card.reference);

  const handleBuy = async (listingId: number, price: number) => {
    if (gems < price) { setError("Not enough gems"); return; }
    setBusyId(listingId); setError(null);
    try {
      const res = await fetch(`/api/market/${listingId}/buy`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Purchase failed");
      loadListings();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const pctRange = livePrice && livePrice.history.length > 1
    ? Math.round(((livePrice.currentPrice - livePrice.history[0].price) / livePrice.history[0].price) * 1000) / 10 : 0;
  const up = pctRange >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <button onClick={onBack} style={{
        fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer",
        alignSelf: "flex-start", padding: "4px 0", fontFamily: "var(--font-display)",
      }}>&larr; Back to Marketplace</button>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {card.imageSrc
          ? <img src={card.imageSrc} alt={card.idol} style={{ width: 64, aspectRatio: "896/1152", borderRadius: 12, border: "2px solid var(--text-primary)", boxShadow: "3px 3px 0 rgba(var(--text-primary-rgb),0.9)", objectFit: "cover", flexShrink: 0 }} />
          : <div style={{ width: 64, aspectRatio: "896/1152", borderRadius: 12, border: "2px solid var(--text-primary)", boxShadow: "3px 3px 0 rgba(var(--text-primary-rgb),0.9)", background: "var(--surface-glass)", flexShrink: 0 }} />
        }
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-display)" }}>{card.idol} &mdash; {card.reference}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{GRADE_LABELS[chartGrade]} &middot; {rarityLabel(rarity)} &middot; {card.pack}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <StyledSelect
          options={GRADE_ORDER.map((g) => ({ value: g, label: GRADE_LABELS[g] }))}
          value={chartGrade}
          onChange={(v) => setChartGrade(v as CardGrade)}
        />
        <StyledSelect options={rangeOptions} value={chartRange} onChange={setChartRange} />
      </div>

      {livePrice && (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 30 }}>💎 {livePrice.currentPrice}</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 800, color: up ? "#1a9e5c" : "var(--accent-hotpink)" }}>
              {up ? "▲" : "▼"} {Math.abs(pctRange)}% <span style={{ fontSize: 10, fontWeight: 600 }}>({chartRange})</span>
            </span>
          </div>
          <div style={{ borderRadius: 14, border: "2px solid var(--text-primary)", boxShadow: "4px 4px 0 rgba(var(--text-primary-rgb),0.9)", background: "rgba(var(--surface-white-rgb),0.9)", padding: "18px 14px 14px" }}>
            <PriceChart series={livePrice.history} color={up ? "#1a9e5c" : "var(--accent-hotpink)"} showGrid />
          </div>
        </>
      )}

      {error && <div style={{ fontSize: 12, color: "var(--accent-hotpink)" }}>{error}</div>}

      <div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Active listings
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {(listings ?? []).map((listing) => (
            <div key={listing.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 10,
              background: "rgba(var(--surface-white-rgb),0.5)", border: "2px solid rgba(var(--text-primary-rgb),0.08)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)" }}>{GRADE_LABELS[listing.grade as CardGrade]}</span>
              <button
                disabled={busyId === listing.id}
                onClick={() => handleBuy(listing.id, listing.priceGems)}
                style={{
                  padding: "6px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "var(--font-display)",
                  background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))", color: "var(--surface-white)",
                }}
              >
                {busyId === listing.id ? "..." : `💎 ${listing.priceGems}`}
              </button>
            </div>
          ))}
          {listings?.length === 0 && <span style={{ fontSize: 12, color: "var(--text-disabled)" }}>No one is selling this right now &mdash; be the first.</span>}
        </div>
      </div>

      {priceHistory.length > 0 && (
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Recent sales
          </span>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {priceHistory.map((s, i) => (
              <span key={i} style={{ fontSize: 12, fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>💎{s.priceGems}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PriceChart({ series, color = "var(--accent-hotpink)", showGrid = false }: {
  series: { hour: number; price: number }[]; color?: string; showGrid?: boolean;
}) {
  if (series.length < 2) return null;

  const prices = series.map((p) => p.price);
  const hours = series.map((p) => p.hour);
  const min = Math.min(...prices), max = Math.max(...prices);
  const pad = (max - min) * 0.1 || 1;
  const yMin = min - pad, yMax = max + pad;
  const yRange = yMax - yMin || 1;

  const LEFT_PAD = 40;
  const RIGHT_PAD = 8;
  const TOP_PAD = 8;
  const BOTTOM_PAD = 22;
  const W = 600;
  const H = 200;
  const plotW = W - LEFT_PAD - RIGHT_PAD;
  const plotH = H - TOP_PAD - BOTTOM_PAD;

  const points = series.map((p, i) => {
    const x = (LEFT_PAD + (i / (series.length - 1)) * plotW).toFixed(1);
    const y = (TOP_PAD + plotH - ((p.price - yMin) / yRange) * plotH).toFixed(1);
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `${points} ${LEFT_PAD + plotW},${TOP_PAD + plotH} ${LEFT_PAD},${TOP_PAD + plotH}`;

  const yTicks = [yMax, yMin + yRange * 0.5, yMin];
  const xTicks = showGrid ? [
    { label: `-${Math.round((hours[hours.length - 1] - hours[0]) / 2)}h`, x: LEFT_PAD + plotW * 0.25 },
    { label: `-${hours[hours.length - 1] - hours[0]}h`, x: LEFT_PAD },
    { label: "now", x: LEFT_PAD + plotW },
  ] : [];

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "auto", display: "block" }}>
        {showGrid && [0.25, 0.5, 0.75].map((frac, i) => {
          const y = TOP_PAD + plotH * (1 - frac);
          return <line key={i} x1={LEFT_PAD} y1={y} x2={LEFT_PAD + plotW} y2={y} stroke="var(--text-disabled)" strokeWidth="0.5" opacity="0.3" />;
        })}

        {showGrid && xTicks.map((t, i) => (
          <text key={i} x={t.x} y={TOP_PAD + plotH + 16} textAnchor={i === 2 ? "end" : i === 1 ? "start" : "middle"} fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-display)" fontWeight={600}>
            {t.label}
          </text>
        ))}

        {yTicks.map((val, i) => {
          const y = TOP_PAD + plotH - ((val - yMin) / yRange) * plotH;
          return (
            <g key={i}>
              <line x1={LEFT_PAD - 4} y1={y} x2={LEFT_PAD} y2={y} stroke="var(--text-disabled)" strokeWidth="0.5" opacity="0.3" />
              <text x={LEFT_PAD - 6} y={y + 3} textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-display)" fontWeight={600}>
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        <polygon points={areaPoints} fill={color} opacity="0.08" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function PriceSparkline({ history, width = 100, height = 32, color = "var(--accent-hotpink)", strokeWidth = 1.5 }: {
  history: { hour: number; price: number }[]; width?: number; height?: number; color?: string; strokeWidth?: number;
}) {
  if (history.length < 2) return null;
  const prices = history.map((p) => p.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const points = history.map((p, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - ((p.price - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width, height, flexShrink: 0 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function LeaderboardTab() {
  const [subTab, setSubTab] = useState<"portfolio" | "rarest">("portfolio");
  const [portfolio, setPortfolio] = useState<any | null>(null);
  const [rarest, setRarest] = useState<any[] | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard/portfolio").then((r) => r.json()).then(setPortfolio);
    fetch("/api/leaderboard/rarest").then((r) => r.json()).then((d) => setRarest(d.rarest));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ marginBottom: 4 }}>
        <PillBar
          tabs={[
            { key: "portfolio" as const, label: "Portfolio" },
            { key: "rarest" as const, label: "Rarest" },
          ]}
          activeTab={subTab}
          onTabChange={setSubTab}
        />
      </div>

      {subTab === "portfolio" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {portfolio?.myRank && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,20,147,0.08)", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)", border: "2px solid rgba(255,20,147,0.15)" }}>
              Your rank: #{portfolio.myRank.rank} &middot; 💎 {portfolio.myRank.portfolioValue}
            </div>
          )}
          {portfolio?.leaderboard?.map((row: any, i: number) => (
            <div key={row.playerId} style={{
              display: "flex", justifyContent: "space-between", padding: "9px 12px", fontSize: 13,
              borderRadius: 10, background: "rgba(var(--surface-white-rgb),0.5)", border: "2px solid rgba(var(--text-primary-rgb),0.08)",
            }}>
              <span style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>#{i + 1} &middot; {row.playerId.slice(0, 8)}&hellip;</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>💎 {row.portfolioValue}</span>
            </div>
          ))}
        </div>
      )}

      {subTab === "rarest" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rarest?.map((row, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px",
              borderRadius: 10, background: "rgba(var(--surface-white-rgb),0.5)", border: "2px solid rgba(var(--text-primary-rgb),0.08)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)" }}>{row.idol} &mdash; {row.pack}</span>
              <GradeBadge grade={row.grade} size="compact" width={100} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
