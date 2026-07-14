"use client";

import { useMemo, useState } from "react";
import CARDS, { getCardById, rarityFromReference } from "@/data/cards";
import type { CardEntry } from "@/data/cards";
import type { Rarity } from "@/components/CardEffects";
import { DISENCHANT_VALUES, CRAFT_COSTS, RARITY_ORDER } from "@/lib/gameConfig";
import {
  disenchantCard, craftCard,
} from "@/lib/gameActions";

const RARITY_LABELS: Record<Rarity, string> = {
  common: "COMMON", rare: "RARE", epic: "EPIC", legendary: "LEGENDARY", secret: "SECRET",
};
const RARITY_COLOR: Record<Rarity, string> = {
  common: "var(--rarity-common)", rare: "var(--rarity-rare)", epic: "var(--rarity-epic)", legendary: "var(--rarity-legendary)", secret: "var(--rarity-secret-ink)",
};

type Tab = "disenchant" | "craft";

export default function WorkshopView({
  owned = {},
  dust = 0,
  onChanged = () => {},
  onBumpMission,
}: {
  owned?: Record<string, number>;
  dust?: number;
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

      <div style={{
        display: "flex", gap: 2, padding: 2, borderRadius: 10, marginBottom: 20, width: "fit-content",
        background: "rgba(var(--text-primary-rgb),0.04)",
      }}>
        {([["disenchant", "✨ Disenchant"], ["craft", "🔮 Craft"]] as [Tab, string][]).map(([id, label]) => (
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
      {tab === "craft" && <CraftTab dust={dust} onChanged={onChanged} onBumpMission={onBumpMission} />}
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
        await disenchantCard(cardId, qty);
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
        await disenchantCard(c.id, q - 1);
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
              <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px", borderRadius: 10, background: "rgba(var(--text-primary-rgb),0.03)", border: "1px solid rgba(var(--text-primary-rgb),0.06)" }}>
                {Object.entries(allSummary).map(([r, v]) => (
                  <div key={r} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "var(--font-sans, monospace)" }}>
                    <span>{v.count}× {RARITY_LABELS[r as Rarity]}</span>
                    <span style={{ fontWeight: 700, color: "var(--accent-hotpink)" }}>+{v.dust} 💠</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid rgba(var(--text-primary-rgb),0.1)", marginTop: 4, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, fontFamily: "var(--font-sans, monospace)" }}>
                  <span>Total</span>
                  <span style={{ color: "var(--accent-hotpink)" }}>+{totalAllDust} 💠</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowAllConfirm(false)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid rgba(var(--text-primary-rgb),0.12)",
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
            border: `3px solid ${RARITY_COLOR[rarityFromReference(craftResult.reference)]}`,
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
                  border: "1px solid var(--accent-hotpink)",
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

const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 8, background: "rgba(var(--surface-white-rgb),0.6)", border: "1px solid rgba(var(--text-primary-rgb),0.05)" };
const stepperBtnStyle: React.CSSProperties = { width: 24, height: 24, borderRadius: 6, border: "2px solid var(--text-primary)", background: "var(--surface-white)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans, monospace)", fontSize: 12 };
const confirmBtnStyle: React.CSSProperties = { padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))", color: "var(--surface-white)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans, monospace)" };
const ghostBtnStyle: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, border: "1.5px solid rgba(var(--text-primary-rgb),0.15)", background: "transparent", color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans, monospace)" };
