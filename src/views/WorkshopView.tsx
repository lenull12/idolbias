"use client";

import { useEffect, useMemo, useState } from "react";
import CARDS, { getCardById, rarityFromReference } from "@/data/cards";
import type { CardEntry } from "@/data/cards";
import type { Rarity } from "@/components/CardEffects";
import { DISENCHANT_VALUES, CRAFT_COSTS, RARITY_ORDER } from "@/lib/gameConfig";
import {
  disenchantCard, craftCard, createTradeOffer,
  listTradeOffers, acceptTradeOffer, cancelTradeOffer, type TradeOffer,
} from "@/lib/gameActions";

const RARITY_LABELS: Record<Rarity, string> = {
  common: "COMMON", rare: "RARE", epic: "EPIC", legendary: "LEGENDARY", secret: "SECRET",
};
const RARITY_COLOR: Record<Rarity, string> = {
  common: "var(--rarity-common)", rare: "var(--rarity-rare)", epic: "var(--rarity-epic)", legendary: "var(--rarity-legendary)", secret: "var(--rarity-secret-ink)",
};

type Tab = "disenchant" | "craft" | "trade";

export default function WorkshopView({
  owned = {},
  dust = 0,
  onChanged = () => {},
}: {
  owned?: Record<string, number>;
  dust?: number;
  onChanged?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("disenchant");

  return (
    <div className="mx-auto max-w-[600px] lg:max-w-[900px]" style={{ padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 23, letterSpacing: "-0.3px", margin: 0, color: "var(--accent-hotpink)" }}>
          Workshop
        </h1>
        <span style={{
          fontSize: 13, fontWeight: 700, color: "var(--lilac-text-bold)", fontFamily: "var(--font-sans, monospace)",
          display: "inline-flex", alignItems: "center", gap: 4, marginLeft: "auto",
        }}>💠 {dust} dust</span>
      </div>

      <div style={{
        display: "flex", gap: 2, padding: 2, borderRadius: 10, marginBottom: 20, width: "fit-content",
        background: "rgba(var(--text-primary-rgb),0.04)",
      }}>
        {([["disenchant", "✨ Disenchant"], ["craft", "🔮 Craft"], ["trade", "🔄 Trade"]] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "6px 14px", borderRadius: 8, border: "none",
            background: tab === id ? "var(--surface-white)" : "transparent",
            color: tab === id ? "var(--accent-hotpink)" : "var(--text-muted)",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font-sans, monospace)",
            boxShadow: tab === id ? "1px 1px 0px rgba(var(--text-primary-rgb),0.1)" : "none",
          }}>{label}</button>
        ))}
      </div>

      {tab === "disenchant" && <DisenchantTab owned={owned} onChanged={onChanged} />}
      {tab === "craft" && <CraftTab dust={dust} onChanged={onChanged} />}
      {tab === "trade" && <TradeTab owned={owned} onChanged={onChanged} />}
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
        await disenchantCard(cardId, qty);
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
              <img src={card.imageSrc} alt={card.idol} style={{ width: 40, height: 52, objectFit: "cover", borderRadius: 5, border: `2px solid ${RARITY_COLOR[rarity]}` }} />
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
        <button disabled={!hasSelection || busy} onClick={handleDisenchant} style={{
          ...confirmBtnStyle, marginLeft: "auto", opacity: hasSelection ? 1 : 0.4, cursor: hasSelection ? "pointer" : "default",
        }}>
          {busy ? "…" : "Disenchant selected"}
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: "var(--state-danger)" }}>{error}</div>}
    </div>
  );
}

// ─── Craft ──────────────────────────────────────────────────────────────────

function CraftTab({ dust, onChanged }: { dust: number; onChanged: () => void }) {
  const [rarity, setRarity] = useState<Rarity>("common");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CardEntry | null>(null);

  const cost = CRAFT_COSTS[rarity];
  const poolSize = useMemo(() => CARDS.filter((c) => rarityFromReference(c.reference) === rarity).length, [rarity]);
  const canAfford = dust >= cost;

  const handleCraft = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await craftCard(rarity);
      setResult(res.card as CardEntry);
      onChanged();
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
            background: rarity === r ? RARITY_COLOR[r] : "var(--surface-white)",
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

      {result && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, background: "rgba(var(--surface-white-rgb),0.6)", border: "1px solid rgba(255,158,196,0.1)" }}>
          <img src={result.imageSrc} alt={result.idol} style={{ width: 60, height: 78, objectFit: "cover", borderRadius: 6, border: `2px solid ${RARITY_COLOR[rarityFromReference(result.reference)]}` }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-sans, monospace)" }}>{result.idol}</div>
            <div style={{ fontSize: 11, color: "var(--text-disabled)" }}>{result.reference} · {result.group}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Trade ──────────────────────────────────────────────────────────────────

function TradeTab({ owned, onChanged }: { owned: Record<string, number>; onChanged: () => void }) {
  const [offers, setOffers] = useState<TradeOffer[]>([]);
  const [myOffers, setMyOffers] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offeredId, setOfferedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const duplicates = useMemo(() => CARDS.filter((c) => (owned[c.id] ?? 0) > 1), [owned]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listTradeOffers();
      setOffers(res.offers);
      setMyOffers(res.myOffers);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleAccept = async (id: number) => {
    setBusyId(id); setError(null);
    try { await acceptTradeOffer(id); onChanged(); await load(); }
    catch (e) { setError((e as Error).message); } finally { setBusyId(null); }
  };
  const handleCancel = async (id: number) => {
    setBusyId(id); setError(null);
    try { await cancelTradeOffer(id); onChanged(); await load(); }
    catch (e) { setError((e as Error).message); } finally { setBusyId(null); }
  };
  const handleCreate = async (requestedCardId: string) => {
    if (!offeredId) return;
    setError(null);
    try {
      await createTradeOffer(offeredId, requestedCardId);
      setOfferedId(null); setSearch("");
      onChanged(); await load();
    } catch (e) { setError((e as Error).message); }
  };

  const candidates = CARDS
    .filter((c) => c.id !== offeredId)
    .filter((c) => !search.trim() || c.idol.toLowerCase().includes(search.toLowerCase()) || c.reference.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 20);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={sectionTitleStyle}>Create an offer</div>
        {duplicates.length === 0 ? (
          <EmptyState text="No duplicates to offer yet." />
        ) : !offeredId ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {duplicates.map((c) => (
              <button key={c.id} onClick={() => setOfferedId(c.id)} style={pickBtnStyle}>
                <img src={c.imageSrc} alt={c.idol} style={{ width: 34, height: 44, objectFit: "cover", borderRadius: 4 }} />
                <span style={{ fontSize: 10 }}>{c.reference}</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, fontFamily: "var(--font-sans, monospace)" }}>
              Offering <b>{getCardById(offeredId)?.reference}</b> for…
            </div>
            <input placeholder="Search a card…" value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} />
            <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
              {candidates.map((c) => (
                <button key={c.id} onClick={() => handleCreate(c.id)} style={candidateRowStyle}>
                  <span>{c.idol} · {c.reference}</span>
                </button>
              ))}
            </div>
            <button onClick={() => { setOfferedId(null); setSearch(""); }} style={backBtnStyle}>← Cancel</button>
          </div>
        )}
      </div>

      {myOffers.length > 0 && (
        <div>
          <div style={sectionTitleStyle}>Your open offers</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myOffers.map((o) => (
              <div key={o.id} style={offerRowStyle}>
                <CardChip cardId={o.offeredCardId} />
                <span style={arrowStyle}>→</span>
                <CardChip cardId={o.requestedCardId} />
                <button disabled={busyId === o.id} onClick={() => handleCancel(o.id)} style={cancelBtnStyle}>
                  {busyId === o.id ? "…" : "Cancel"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={sectionTitleStyle}>Open offers from other players</div>
        {loading && <div style={{ fontSize: 12, color: "var(--text-disabled)" }}>Loading…</div>}
        {!loading && offers.length === 0 && <EmptyState text="No open offers right now." />}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {offers.map((o) => {
            const canAccept = (owned[o.requestedCardId] ?? 0) > 0;
            return (
              <div key={o.id} style={offerRowStyle}>
                <CardChip cardId={o.offeredCardId} />
                <span style={arrowStyle}>→</span>
                <CardChip cardId={o.requestedCardId} />
                <button disabled={!canAccept || busyId === o.id} onClick={() => handleAccept(o.id)} style={{
                  ...acceptBtnStyle, opacity: canAccept ? 1 : 0.4, cursor: canAccept ? "pointer" : "default",
                }} title={canAccept ? "" : "You don't own the requested card"}>
                  {busyId === o.id ? "…" : "Accept"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {error && <div style={{ fontSize: 11, color: "var(--state-danger)" }}>{error}</div>}
    </div>
  );
}

function CardChip({ cardId }: { cardId: string }) {
  const card = getCardById(cardId);
  if (!card) return <span style={{ fontSize: 11 }}>???</span>;
  const rarity = rarityFromReference(card.reference);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <img src={card.imageSrc} alt={card.idol} style={{ width: 34, height: 44, objectFit: "cover", borderRadius: 4, border: `2px solid ${RARITY_COLOR[rarity]}` }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-sans, monospace)" }}>{card.idol}</span>
        <span style={{ fontSize: 9, color: "var(--text-disabled)", fontFamily: "var(--font-mono, monospace)" }}>{card.reference}</span>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ fontSize: 12, color: "var(--text-disabled)", fontStyle: "italic", padding: "12px 0" }}>{text}</div>;
}

const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 8, background: "rgba(var(--surface-white-rgb),0.6)", border: "1px solid rgba(var(--text-primary-rgb),0.05)" };
const stepperBtnStyle: React.CSSProperties = { width: 24, height: 24, borderRadius: 6, border: "2px solid var(--text-primary)", background: "var(--surface-white)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans, monospace)", fontSize: 12 };
const confirmBtnStyle: React.CSSProperties = { padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))", color: "var(--surface-white)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans, monospace)" };
const backBtnStyle: React.CSSProperties = { padding: "4px 0", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 11, cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans, monospace)" };
const sectionTitleStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", fontFamily: "var(--font-sans, monospace)", marginBottom: 8, textTransform: "uppercase" };
const offerRowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(var(--text-primary-rgb),0.06)", background: "rgba(var(--surface-white-rgb),0.6)" };
const arrowStyle: React.CSSProperties = { fontSize: 14, color: "var(--text-disabled)" };
const acceptBtnStyle: React.CSSProperties = { marginLeft: "auto", padding: "5px 10px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))", color: "var(--surface-white)", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-sans, monospace)" };
const cancelBtnStyle: React.CSSProperties = { marginLeft: "auto", padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(var(--text-primary-rgb),0.2)", background: "transparent", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans, monospace)" };
const pickBtnStyle: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 6, borderRadius: 8, border: "1px solid rgba(var(--text-primary-rgb),0.08)", background: "var(--surface-white)", cursor: "pointer" };
const inputStyle: React.CSSProperties = { padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(255,158,196,0.2)", fontSize: 12, fontFamily: "var(--font-sans, monospace)", outline: "none" };
const candidateRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(var(--text-primary-rgb),0.06)", background: "var(--surface-white)", cursor: "pointer", fontSize: 11, fontFamily: "var(--font-sans, monospace)", textAlign: "left" };
