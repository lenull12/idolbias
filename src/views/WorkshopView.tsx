"use client";

import { useMemo, useState, useEffect } from "react";
import PillBar from "@/components/PillBar";
import StyledSelect from "@/components/StyledSelect";
import CARDS, { getCardById, rarityFromReference } from "@/data/cards";
import type { CardEntry } from "@/data/cards";
import type { Rarity } from "@/components/CardEffects";
import { DISENCHANT_VALUES, CRAFT_COSTS, RARITY_ORDER } from "@/lib/gameConfig";
import {
  disenchantCard, craftCard,
} from "@/lib/gameActions";
import type { CardGrade } from "@/db/schema";
import { GRADE_ORDER } from "@/lib/gradeConfig";
import { GradeBadge } from "@/components/GradeBadge";
import { RARITY_LABELS, RARITY_COLORS } from "@/lib/rarityTheme";

const GRADE_LABELS: Record<CardGrade, string> = {
  standard: "Standard", fine: "Fine", mint: "Mint", pristine: "Pristine", gem: "Gem",
};

type Tab = "disenchant" | "craft" | "vendor" | "market" | "leaderboard";

export default function WorkshopView({
  owned = {},
  ownedGrades = {},
  dust = 0,
  gems = 0,
  onChanged = () => {},
  onBumpMission,
}: {
  owned?: Record<string, number>;
  ownedGrades?: Record<string, Partial<Record<CardGrade, number>>>;
  dust?: number;
  gems?: number;
  onChanged?: () => void;
  onBumpMission?: (id: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("disenchant");

  return (
    <div className="mx-auto max-w-[600px] lg:max-w-[900px]" style={{ padding: "24px 16px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: "var(--text-disabled)", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase" }}>
          ✦ Workshop
        </span>
        <h1 style={{
          fontFamily: "var(--font-display, cursive)", fontSize: 28, letterSpacing: "-0.3px",
          margin: 0, lineHeight: 1.1,
          background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple), var(--holo-c))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          craft & trade
        </h1>
        <span style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 2 }}>
          Disenchant duplicates and craft new cards
        </span>
        <span style={{
          fontSize: 13, fontWeight: 700, color: "var(--accent-purple)", fontFamily: "var(--font-sans, monospace)",
          display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2,
        }}>💠 {dust} dust</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <PillBar
          tabs={[
            { key: "disenchant" as const, label: "Disenchant" },
            { key: "craft" as const, label: "Craft" },
            { key: "vendor" as const, label: "Vendor" },
            { key: "market" as const, label: "Market" },
            { key: "leaderboard" as const, label: "Rankings" },
          ]}
          activeTab={tab}
          onTabChange={setTab}
        />
      </div>

      {tab === "disenchant" && <DisenchantTab owned={owned} onChanged={onChanged} />}
      {tab === "craft" && <CraftTab dust={dust} onChanged={onChanged} onBumpMission={onBumpMission} />}
      {tab === "vendor" && <VendorTab gems={gems} onChanged={onChanged} />}
      {tab === "market" && <MarketTab ownedGrades={ownedGrades} gems={gems} onChanged={onChanged} />}
      {tab === "leaderboard" && <LeaderboardTab />}
    </div>
  );
}

// ─── Disenchant ─────────────────────────────────────────────────────────────

function DisenchantTab({ owned, onChanged }: { owned: Record<string, number>; onChanged: () => void }) {
  const duplicates = useMemo(
    () => CARDS.filter((c) => (owned[c.id] ?? 0) > 1).sort((a, b) => (owned[b.id] ?? 0) - (owned[a.id] ?? 0)),
    [owned]
  );
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllConfirm, setShowAllConfirm] = useState(false);

  const setAmount = (id: string, val: number, max: number) =>
    setAmounts((prev) => ({ ...prev, [id]: Math.max(0, Math.min(max, val)) }));

  const totalDust = duplicates.reduce((sum, c) => {
    const rarity = rarityFromReference(c.reference);
    return sum + (amounts[c.id] ?? 0) * (DISENCHANT_VALUES[rarity] ?? 0);
  }, 0);
  const hasSelection = Object.values(amounts).some((v) => v > 0);

  const handleDisenchant = async () => {
    setBusy(true); setError(null);
    try {
      for (const [cardId, qty] of Object.entries(amounts).filter(([, v]) => v > 0)) {
        await disenchantCard(cardId, qty, "standard");
      }
      setAmounts({});
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  };

  const allSummary = useMemo(() => {
    const byRarity: Record<string, { count: number; dust: number }> = {};
    for (const c of duplicates) {
      const q = owned[c.id] ?? 0;
      if (q <= 1) continue;
      const r = rarityFromReference(c.reference);
      const val = DISENCHANT_VALUES[r] ?? 0;
      if (!byRarity[r]) byRarity[r] = { count: 0, dust: 0 };
      byRarity[r].count += q - 1;
      byRarity[r].dust += (q - 1) * val;
    }
    return byRarity;
  }, [duplicates, owned]);

  const totalAllDust = Object.values(allSummary).reduce((s, v) => s + v.dust, 0);
  const allCount = Object.values(allSummary).reduce((s, v) => s + v.count, 0);

  const handleDisenchantAll = async () => {
    setShowAllConfirm(false);
    setBusy(true); setError(null);
    try {
      for (const c of duplicates) {
        const q = owned[c.id] ?? 0;
        if (q <= 1) continue;
        await disenchantCard(c.id, q - 1, "standard");
      }
      setAmounts({});
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  };

  if (duplicates.length === 0) return <EmptyState text="No duplicates yet. Pull a pack — extra copies show up here." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {duplicates.map((card) => {
          const qty = owned[card.id] ?? 0;
          const max = qty - 1;
          const rarity = rarityFromReference(card.reference);
          const amount = amounts[card.id] ?? 0;
          return (
            <div key={card.id} style={rowStyle}>
              <img src={card.imageSrc} alt={card.idol} style={{ width: 40, height: 52, objectFit: "cover", borderRadius: 5, border: `2px solid ${RARITY_COLORS[rarity]}` }} />
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans, monospace)" }}>{card.idol}</span>
                <span style={{ fontSize: 10, color: "var(--text-disabled)" }}>{card.reference} · ×{qty} owned</span>
              </div>
              <button onClick={() => setAmount(card.id, amount - 1, max)} disabled={amount <= 0} style={stepperBtnStyle}>−</button>
              <span style={{ fontFamily: "var(--font-sans, monospace)", fontWeight: 700, minWidth: 20, textAlign: "center" }}>{amount}</span>
              <button onClick={() => setAmount(card.id, amount + 1, max)} disabled={amount >= max} style={stepperBtnStyle}>+</button>
              <span style={{ fontSize: 10, color: "var(--text-muted)", minWidth: 70, textAlign: "right" }}>
                +{amount * (DISENCHANT_VALUES[rarity] ?? 0)} 💠
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "sticky", bottom: 0, background: "var(--bg)", padding: "8px 0" }}>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-sans, monospace)" }}>Total: +{totalDust} 💠</span>
        <button disabled={allCount === 0 || busy} onClick={() => setShowAllConfirm(true)} style={{
          ...ghostBtnStyle, opacity: allCount > 0 ? 1 : 0.4,
        }}>
          ⚡ Disenchant all
        </button>
        <button disabled={!hasSelection || busy} onClick={handleDisenchant} style={{
          ...confirmBtnStyle, marginLeft: "auto", opacity: hasSelection ? 1 : 0.4, cursor: hasSelection ? "pointer" : "default",
        }}>
          {busy ? "…" : "Disenchant selected"}
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: "var(--state-danger)" }}>{error}</div>}

      {/* Disenchant all confirm modal */}
      {showAllConfirm && (
        <div onClick={() => setShowAllConfirm(false)} style={{
          position: "fixed", inset: 0, zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(var(--text-primary-rgb),0.35)", backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)", cursor: "pointer",
        }}>
          <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }`}</style>
          <div onClick={(e) => e.stopPropagation()} style={{
            animation: "modalIn 0.35s cubic-bezier(0.23, 1, 0.32, 1)",
            width: "min(320px, 88vw)", borderRadius: 16, overflow: "hidden",
            border: "2px solid var(--text-primary)",
            boxShadow: "6px 6px 0px rgba(var(--text-primary-rgb),0.9)",
            background: "var(--surface-white)", cursor: "default",
          }}>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display, cursive)", textAlign: "center", color: "var(--text-primary)" }}>
                ⚡ Disenchant all?
              </div>
               <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px", borderRadius: 10, background: "rgba(var(--text-primary-rgb),0.03)", border: "2px solid rgba(var(--text-primary-rgb),0.08)" }}>
                {Object.entries(allSummary).map(([r, v]) => (
                  <div key={r} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "var(--font-sans, monospace)" }}>
                    <span>{v.count}× {RARITY_LABELS[r as Rarity]}</span>
                    <span style={{ fontWeight: 700, color: "var(--accent-hotpink)" }}>+{v.dust} 💠</span>
                  </div>
                ))}
                <div style={{ borderTop: "2px solid rgba(var(--text-primary-rgb),0.1)", marginTop: 4, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, fontFamily: "var(--font-sans, monospace)" }}>
                  <span>Total</span>
                  <span style={{ color: "var(--accent-hotpink)" }}>+{totalAllDust} 💠</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowAllConfirm(false)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "2px solid rgba(var(--text-primary-rgb),0.12)",
                  background: "transparent", color: "var(--text-muted)", cursor: "pointer",
                  fontSize: 13, fontWeight: 700, fontFamily: "var(--font-sans, monospace)",
                }}>
                  Cancel
                </button>
                <button onClick={handleDisenchantAll} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
                  color: "var(--surface-white)", cursor: "pointer",
                  fontSize: 13, fontWeight: 700, fontFamily: "var(--font-sans, monospace)",
                }}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Craft ──────────────────────────────────────────────────────────────────

function CraftTab({ dust, onChanged, onBumpMission }: { dust: number; onChanged: () => void; onBumpMission?: (id: string) => void }) {
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
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420 }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-sans, monospace)" }}>
        Spend dust for a random card of the rarity you pick — same odds as the pool, no target.
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {RARITY_ORDER.map((r) => (
          <button key={r} onClick={() => setRarity(r)} style={{
            padding: "6px 12px", borderRadius: 8, border: `2px solid ${rarity === r ? "var(--text-primary)" : "rgba(var(--text-primary-rgb),0.1)"}`,
            background: rarity === r ? RARITY_COLORS[r] : "var(--surface-white)",
            color: rarity === r && r !== "common" ? "var(--surface-white)" : "var(--text-primary)",
            fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans, monospace)",
          }}>{RARITY_LABELS[r]}</button>
        ))}
      </div>
      <div style={{ fontSize: 13, fontFamily: "var(--font-sans, monospace)" }}>
        Cost: <b style={{ color: "var(--accent-hotpink)" }}>{cost} 💠</b> · pool: {poolSize} cards
      </div>
      <button disabled={!canAfford || busy} onClick={handleCraft} style={{
        ...confirmBtnStyle, opacity: canAfford ? 1 : 0.4, cursor: canAfford ? "pointer" : "default", width: "fit-content",
      }}>
        {busy ? "Crafting…" : canAfford ? "🔮 Craft" : "Not enough dust"}
      </button>
      {error && <div style={{ fontSize: 11, color: "var(--state-danger)" }}>{error}</div>}

      {/* Craft reveal modal */}
      {craftResult && (
        <div onClick={() => setCraftResult(null)} style={{
          position: "fixed", inset: 0, zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(var(--text-primary-rgb),0.35)", backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)", cursor: "pointer",
        }}>
          <style>{`
            @keyframes revealIn { 0% { opacity: 0; transform: scale(0.7) rotateY(90deg); } 100% { opacity: 1; transform: scale(1) rotateY(0); } }
            @keyframes confettiFall { 0% { transform: translateY(-10px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
          `}</style>

          {/* Confettis for legendary+ */}
          {isLegendary && Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{
              position: "fixed", top: -10, left: `${5 + Math.random() * 90}%`, zIndex: 1000,
              width: 5 + Math.random() * 5, height: 5 + Math.random() * 5,
              borderRadius: Math.random() > 0.5 ? "50%" : 2,
              background: ["var(--accent-hotpink)", "var(--accent-purple)", "#DAA520", "var(--holo-c)"][i % 4],
              animation: `confettiFall ${1.5 + Math.random() * 2}s ease-out ${i * 0.1}s forwards`,
              pointerEvents: "none",
            }} />
          ))}

          <div onClick={(e) => e.stopPropagation()} style={{
            animation: "revealIn 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            width: "min(240px, 75vw)",
            borderRadius: 14, overflow: "hidden",
            border: `3px solid ${RARITY_COLORS[rarityFromReference(craftResult.reference)]}`,
            boxShadow: `0 0 30px ${isLegendary ? "rgba(218,165,32,0.4)" : "rgba(var(--text-primary-rgb),0.2)"}`,
            background: "var(--surface-white)",
            cursor: "default",
          }}>
            <div style={{ padding: 0 }}>
              <img src={craftResult.imageSrc} alt={craftResult.idol} style={{ width: "100%", display: "block" }} />
              <div style={{ padding: "14px 14px 16px", textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--font-display, cursive)", color: "var(--text-primary)" }}>
                  {craftResult.idol}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-disabled)", fontFamily: "var(--font-sans, monospace)" }}>
                  {craftResult.reference} · {RARITY_LABELS[rarityFromReference(craftResult.reference)]}
                </div>
                <div style={{
                  padding: "8px 0", borderRadius: 8, marginTop: 4,
                  background: "linear-gradient(135deg, rgba(255,20,147,0.08), rgba(201,177,255,0.06))",
                  border: "2px solid var(--accent-hotpink)",
                  fontSize: 13, fontWeight: 800, fontFamily: "var(--font-sans, monospace)",
                  color: "var(--accent-hotpink)", letterSpacing: "1px", cursor: "pointer",
                }} onClick={() => setCraftResult(null)}>
                  {isLegendary ? "✨ AMAZING!" : "NICE!"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared ─────────────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return <div style={{ fontSize: 12, color: "var(--text-disabled)", fontStyle: "italic", padding: "12px 0" }}>{text}</div>;
}

const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, border: "2px solid rgba(var(--text-primary-rgb),0.08)", background: "rgba(var(--surface-white-rgb),0.5)" };
const stepperBtnStyle: React.CSSProperties = { width: 24, height: 24, borderRadius: 6, border: "2px solid var(--text-primary)", background: "var(--surface-white)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans, monospace)", fontSize: 12 };
const confirmBtnStyle: React.CSSProperties = { padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))", color: "var(--surface-white)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans, monospace)" };
const ghostBtnStyle: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, border: "2px solid rgba(var(--text-primary-rgb),0.15)", background: "transparent", color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans, monospace)" };
const inputStyle: React.CSSProperties = { padding: "6px 8px", borderRadius: 8, border: "2px solid rgba(var(--text-primary-rgb),0.12)", background: "var(--surface-white)", color: "var(--text-primary)", fontSize: 11, fontFamily: "var(--font-display)", fontWeight: 600, outline: "none", transition: "border-color 0.15s" };

// ─── Vendor Tab ────────────────────────────────────────────────────────────

type VendorOffer = {
  id: number; cardId: string; grade: CardGrade; priceGems: number; claimed: boolean;
};

function VendorTab({ gems, onChanged }: { gems: number; onChanged: () => void }) {
  const [offers, setOffers] = useState<VendorOffer[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = () => {
    fetch("/api/vendor/offers", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setOffers(d.offers ?? []))
      .catch(() => {});
  };

  useEffect(() => { fetchOffers(); }, []);

  const handleBuy = async (offerId: number) => {
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/vendor/buy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }), credentials: "include",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      onChanged();
      fetchOffers();
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  };

  if (offers.length === 0) return <EmptyState text="Loading today's offers…" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-sans, monospace)" }}>
        Limited daily offers — pristine+ quality cards at a discount. Check back tomorrow for a fresh selection.
      </div>
      {offers.map((offer) => {
        const card = getCardById(offer.cardId);
        if (!card) return null;
        const rarity = rarityFromReference(card.reference);
        return (
          <div key={offer.id} style={rowStyle}>
            <img src={card.imageSrc} alt={card.idol} style={{ width: 40, height: 52, objectFit: "cover", borderRadius: 5, border: `2px solid ${RARITY_COLORS[rarity]}` }} />
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans, monospace)" }}>{card.idol}</span>
              <span style={{ fontSize: 10, color: "var(--text-disabled)" }}>{card.reference} · {RARITY_LABELS[rarity]} · {GRADE_LABELS[offer.grade]}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-sans, monospace)", color: "var(--accent-hotpink)" }}>
              💎 {offer.priceGems}
            </span>
            <button
              onClick={() => handleBuy(offer.id)}
              disabled={offer.claimed || gems < offer.priceGems || busy}
              style={{
                padding: "6px 14px", borderRadius: 8, border: "none",
                background: offer.claimed ? "rgba(var(--text-primary-rgb),0.08)" : "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
                color: offer.claimed ? "var(--text-disabled)" : "var(--surface-white)",
                fontSize: 11, fontWeight: 700, cursor: offer.claimed ? "default" : "pointer",
                fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap",
                opacity: gems < offer.priceGems && !offer.claimed ? 0.4 : 1,
              }}
            >
              {offer.claimed ? "Sold" : busy ? "…" : gems < offer.priceGems ? "No gems" : "Buy"}
            </button>
          </div>
        );
      })}
      {error && <div style={{ fontSize: 11, color: "var(--state-danger)" }}>{error}</div>}
    </div>
  );
}

// ─── Market Tab ────────────────────────────────────────────────────────────

type MarketListing = {
  id: number; sellerId: string; cardId: string; grade: CardGrade;
  priceGems: number; status: string; createdAt: string;
};

type SellableDuplicate = {
  cardId: string; grade: CardGrade; qty: number;
};

function PriceSparkline({ history, color }: { history: number[]; color?: string }) {
  if (history.length < 2) return null;
  const h = 24; const w = 100; const pad = 2;
  const min = Math.min(...history); const max = Math.max(...history);
  const range = max - min || 1;
  const pts = history.map((v, i) => {
    const x = pad + (i / (history.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color ?? "var(--accent-hotpink)"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SellableDuplicateRow({ dup, onList }: {
  dup: SellableDuplicate; onList: (price: number, confirmLastCopy?: boolean) => Promise<any>;
}) {
  const [price, setPrice] = useState("");
  const [suggested, setSuggested] = useState<number | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [listing, setListing] = useState(false);
  const card = getCardById(dup.cardId);
  if (!card) return null;
  const rarity = rarityFromReference(card.reference);
  const isLastCopy = dup.qty === 1;

  useEffect(() => {
    fetch(`/api/market/price?cardId=${dup.cardId}&grade=${dup.grade}`)
      .then((r) => r.json())
      .then((d) => setSuggested(d.suggestedPrice ?? null))
      .catch(() => {});
  }, [dup.cardId, dup.grade]);

  const handleList = async () => {
    setListing(true);
    const finalPrice = Number(price) || (suggested ?? 1);
    try {
      const res = await onList(finalPrice, needsConfirm);
      if (res?.code === "LAST_COPY_CONFIRMATION_REQUIRED") {
        setNeedsConfirm(true);
      } else if (res?.ok) {
        setPrice(""); setNeedsConfirm(false);
      }
    } finally { setListing(false); }
  };

  return (
    <div style={rowStyle}>
      <img src={card.imageSrc} alt={card.idol} style={{ width: 36, height: 46, objectFit: "cover", borderRadius: 5, border: `2px solid ${RARITY_COLORS[rarity]}` }} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans, monospace)" }}>{card.idol}</span>
        <span style={{ fontSize: 10, color: isLastCopy ? "var(--accent-hotpink)" : "var(--text-disabled)" }}>
          {card.reference} · {isLastCopy ? "your only copy" : `${dup.qty - 1} to spare`}
        </span>
      </div>
      <GradeBadge grade={dup.grade} size="compact" width={100} />
      {!needsConfirm ? (
        <>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            placeholder={suggested !== null ? String(suggested) : "..."}
            style={{ ...inputStyle, width: 72 }}
          />
          <button
            onClick={handleList}
            disabled={listing}
            style={{
              padding: "5px 10px", borderRadius: 7, border: "none",
              background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
              color: "var(--surface-white)", fontSize: 10, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap",
              opacity: listing ? 0.5 : 1,
            }}
          >
            {listing ? "…" : "List"}
          </button>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "var(--accent-hotpink)", fontWeight: 600, fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap" }}>
            Sell last copy?
          </span>
          <button onClick={() => setNeedsConfirm(false)} style={{ padding: "4px 8px", borderRadius: 6, border: "2px solid rgba(var(--text-primary-rgb),0.12)", background: "transparent", color: "var(--text-muted)", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans, monospace)" }}>
            Cancel
          </button>
          <button onClick={handleList} disabled={listing} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "var(--accent-hotpink)", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans, monospace)" }}>
            {listing ? "…" : "Confirm"}
          </button>
        </div>
      )}
    </div>
  );
}

function MarketTab({ ownedGrades, gems, onChanged }: {
  ownedGrades: Record<string, Partial<Record<CardGrade, number>>>;
  gems: number; onChanged: () => void;
}) {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCardId, setFilterCardId] = useState<string | null>(null);
  const [filterGrade, setFilterGrade] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<{ baseValue: number; volMultiplier: number; recentSales: { priceGems: number; soldAt: Date }[] } | null>(null);

  const sellable = useMemo(() => {
    const dups: SellableDuplicate[] = [];
    for (const [cardId, grades] of Object.entries(ownedGrades)) {
      for (const [grade, qty] of Object.entries(grades)) {
        if (qty > 0) dups.push({ cardId, grade: grade as CardGrade, qty });
      }
    }
    return dups.sort((a, b) => b.qty - a.qty);
  }, [ownedGrades]);

  const fetchListings = () => {
    fetch("/api/market/listings", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setListings(d.listings ?? []))
      .catch(() => {});
  };

  useEffect(() => { fetchListings(); }, []);

  useEffect(() => {
    if (!filterCardId || !filterGrade) { setPriceData(null); return; }
    fetch(`/api/market/price?cardId=${filterCardId}&grade=${filterGrade}`)
      .then((r) => r.json())
      .then((d) => setPriceData({ baseValue: d.baseValue, volMultiplier: d.volMultiplier, recentSales: d.recentSales ?? [] }))
      .catch(() => {});
  }, [filterCardId, filterGrade]);

  const handleList = async (cardId: string, grade: CardGrade, priceGems: number, confirmLastCopy?: boolean) => {
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/market/list", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, grade, priceGems, confirmLastCopy }),
        credentials: "include",
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.code === "LAST_COPY_CONFIRMATION_REQUIRED") return data;
        throw new Error(data.error);
      }
      onChanged();
      fetchListings();
      return data;
    } catch (e) {
      setError((e as Error).message);
      return { error: (e as Error).message };
    } finally { setBusy(false); }
  };

  const handleBuy = async (listingId: number) => {
    setBusy(true); setError(null);
    try {
      const r = await fetch(`/api/market/${listingId}/buy`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: "{}", credentials: "include",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      onChanged();
      fetchListings();
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-sans, monospace)" }}>
        Peer-to-peer marketplace. Commission: 8%. List a duplicate at your price.
      </div>

      {/* Sellable duplicates */}
      {sellable.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sellable.map((dup) => (
            <SellableDuplicateRow
              key={`${dup.cardId}-${dup.grade}`}
              dup={dup}
              onList={(price, confirmLastCopy) => handleList(dup.cardId, dup.grade, price, confirmLastCopy)}
            />
          ))}
        </div>
      )}

      {/* Active listings */}
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
          Active listings
        </span>
        {listings.length === 0 ? (
          <EmptyState text="No active listings right now." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {listings.map((listing) => {
              const card = getCardById(listing.cardId);
              if (!card) return null;
              const rarity = rarityFromReference(card.reference);
              return (
                <div key={listing.id} style={rowStyle}>
                  <img src={card.imageSrc} alt={card.idol} style={{ width: 36, height: 46, objectFit: "cover", borderRadius: 5, border: `2px solid ${RARITY_COLORS[rarity]}` }} />
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans, monospace)" }}>{card.idol}</span>
                    <span style={{ fontSize: 10, color: "var(--text-disabled)" }}>{card.reference} · {GRADE_LABELS[listing.grade]}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-sans, monospace)", color: "var(--accent-hotpink)" }}>
                    💎 {listing.priceGems}
                  </span>
                  <button onClick={() => handleBuy(listing.id)} disabled={gems < listing.priceGems || busy} style={{
                    padding: "5px 12px", borderRadius: 7, border: "none",
                    background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
                    color: "var(--surface-white)", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    fontFamily: "var(--font-sans, monospace)", opacity: gems >= listing.priceGems ? 1 : 0.4,
                  }}>
                    Buy
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live index — sélecteur de carte pour consulter son prix */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10, borderRadius: 10, background: "rgba(var(--surface-white-rgb),0.5)", border: "2px solid rgba(var(--text-primary-rgb),0.08)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", textTransform: "uppercase" }}>
          📊 Live index
        </span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input
            value={filterCardId ?? ""}
            onChange={(e) => setFilterCardId(e.target.value || null)}
            placeholder="Card ID"
            style={{ ...inputStyle, flex: 1, minWidth: 120 }}
          />
          <StyledSelect
            options={[{ value: "", label: "All grades" }, ...GRADE_ORDER.map((g) => ({ value: g, label: GRADE_LABELS[g] }))]}
            value={filterGrade ?? ""}
            onChange={(v) => setFilterGrade(v || null)}
          />
        </div>
        {priceData && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, fontFamily: "var(--font-sans, monospace)" }}>
            <span>Base: 💎 {priceData.baseValue}</span>
            <span>Vol: ×{priceData.volMultiplier.toFixed(2)}</span>
            <span style={{ marginLeft: "auto", color: "var(--text-disabled)" }}>
              {priceData.recentSales.length} sales (24h)
            </span>
          </div>
        )}
      </div>
      {error && <div style={{ fontSize: 11, color: "var(--state-danger)" }}>{error}</div>}
    </div>
  );
}

// ─── Leaderboard Tab ────────────────────────────────────────────────────────

type LBEntry = { playerId: string; portfolioValue: number; dateStr: string };
type RareEntry = { playerId: string; cardId: string; idol: string; pack: string; rarity: Rarity; grade: string; quantity: number };

function LeaderboardTab() {
  const [top, setTop] = useState<LBEntry[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number; portfolioValue: number } | null>(null);
  const [rarest, setRarest] = useState<RareEntry[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard/portfolio", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setTop(d.leaderboard ?? []); setMyRank(d.myRank); })
      .catch(() => {});
    fetch("/api/leaderboard/rarest", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRarest(d.rarest ?? []))
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Portfolio leaderboard */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans, monospace)" }}>
          🏆 Portfolio Value
        </span>
        {myRank && (
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "linear-gradient(135deg, rgba(255,20,147,0.08), rgba(201,177,255,0.06))", border: "2px solid var(--accent-hotpink)", fontSize: 12, fontFamily: "var(--font-sans, monospace)" }}>
            Your rank: <b>#{myRank.rank}</b> · 💎 {myRank.portfolioValue}
          </div>
        )}
        {top.length === 0 ? (
          <EmptyState text="No data yet. Come back after the first daily computation." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {top.map((entry, i) => (
              <div key={entry.playerId} style={{
                ...rowStyle,
                background: i < 3 ? "rgba(255,215,0,0.06)" : "rgba(var(--surface-white-rgb),0.6)",
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans, monospace)", minWidth: 24, color: i < 3 ? "var(--accent-hotpink)" : "var(--text-muted)" }}>
                  #{i + 1}
                </span>
                <span style={{ fontSize: 12, fontFamily: "var(--font-sans, monospace)", flex: 1 }}>
                  Player {entry.playerId.slice(0, 8)}…
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-sans, monospace)", color: "var(--accent-hotpink)" }}>
                  💎 {entry.portfolioValue}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rarest cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans, monospace)" }}>
          💎 Rarest Cards
        </span>
        {rarest.length === 0 ? (
          <EmptyState text="No gem/pristine legendary+ cards discovered yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {rarest.map((entry, i) => (
              <div key={`${entry.cardId}-${entry.playerId}`} style={rowStyle}>
                <span style={{ fontSize: 10, fontFamily: "var(--font-sans, monospace)", color: "var(--text-muted)", minWidth: 16 }}>{i + 1}.</span>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans, monospace)", flex: 1 }}>{entry.idol}</span>
                <GradeBadge grade={entry.grade as CardGrade} size="compact" width={100} />
                <span style={{ fontSize: 10, color: "var(--text-disabled)", fontFamily: "var(--font-sans, monospace)" }}>
                  ×{entry.quantity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared styles ─────────────────────────────────────────────────────────
