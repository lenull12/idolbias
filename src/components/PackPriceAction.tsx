
"use client";

import { useState } from "react";
import type { PackInfo } from "@/data/footballCards";
import { getPullCost, PULL_COUNTS, CARDS_PER_PACK, BUNDLE_PACK_COUNT, BUNDLE_DISCOUNT, type PullCount } from "@/lib/pullConfig";

export type Method = "tickets" | "gems";
type Size = "sm" | "md" | "lg";

const SIZE_CONFIG: Record<Size, { chipPad: string; chipFont: number; btnPad: string; btnFont: number; gap: number }> = {
  sm: { chipPad: "5px 9px", chipFont: 11, btnPad: "8px 14px", btnFont: 12, gap: 4 },
  md: { chipPad: "6px 11px", chipFont: 12, btnPad: "10px 18px", btnFont: 13, gap: 5 },
  lg: { chipPad: "7px 12px", chipFont: 13, btnPad: "12px 22px", btnFont: 14, gap: 6 },
};

// ─── Toggle de devise : ne fait QUE choisir, jamais d'action — s'auto-protège du clic parent ─

export function CurrencyToggle({ pack, tickets, gems, size, selected, onSelect, ticket }: {
  pack: PackInfo; tickets: number; gems: number; size: Size; selected: Method; onSelect: (m: Method) => void; ticket?: boolean;
}) {
  const cfg = SIZE_CONFIG[size];
  const options: { method: Method; icon: string; cost: number; original?: number; canAfford: boolean }[] = [];
  if (pack.costTickets !== undefined) {
    options.push({ method: "tickets", icon: "🎟️", cost: pack.costTickets, canAfford: tickets >= pack.costTickets });
  }
  if (pack.costGems !== undefined) {
    options.push({ method: "gems", icon: "💎", cost: pack.costGems, original: pack.originalCostGems, canAfford: gems >= pack.costGems });
  }
  if (options.length < 2) return null;

  return (
    <div onClick={(e) => e.stopPropagation()} style={{
      display: "inline-flex", borderRadius: 8, overflow: "hidden",
      border: ticket ? "1.5px solid #3a2a1a" : "1.5px solid var(--text-primary)",
    }}>
      {options.map((opt, i) => {
        const active = selected === opt.method;
        return (
          <button
            key={opt.method}
            onClick={() => onSelect(opt.method)}
            style={{
              display: "inline-flex", alignItems: "center", gap: cfg.gap,
              padding: cfg.chipPad, border: "none",
              borderLeft: i > 0 ? (ticket ? "1.5px solid #3a2a1a" : "1.5px solid var(--text-primary)") : "none",
              background: ticket
                ? (active ? "#3a2a1a" : "#f0e3d0")
                : (active ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))" : "var(--surface-white)"),
              color: ticket
                ? (active ? "#fcf5e8" : (opt.canAfford ? "#5a4a3a" : "#b0a090"))
                : (active ? "var(--text-primary)" : (opt.canAfford ? "var(--text-secondary)" : "var(--text-disabled)")),
              fontFamily: "var(--font-sans, monospace)", fontSize: cfg.chipFont, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {opt.icon}
            {opt.original !== undefined && (
              <span style={{ textDecoration: "line-through", opacity: 0.6, fontWeight: 600 }}>{opt.original}</span>
            )}
            {opt.cost}
          </button>
        );
      })}
    </div>
  );
}

// ─── Toggle de quantité 1× / 10× ─────────────────────────────────────────────

export function PullCountToggle({ selected, onSelect, size }: {
  selected: PullCount; onSelect: (n: PullCount) => void; size: Size;
}) {
  const cfg = SIZE_CONFIG[size];
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", borderRadius: 8, overflow: "hidden", border: "2px solid var(--text-primary)" }}>
      {PULL_COUNTS.map((n, i) => {
        const active = selected === n;
        return (
          <button key={n} onClick={() => onSelect(n)} style={{
            padding: cfg.chipPad, border: "none",
            borderLeft: i > 0 ? "2px solid var(--text-primary)" : "none",
            background: active ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))" : "var(--surface-white)",
            color: active ? "var(--text-primary)" : "var(--text-secondary)",
            fontFamily: "var(--font-sans, monospace)", fontSize: cfg.chipFont, fontWeight: 700, cursor: "pointer",
          }}>
            {`${n * CARDS_PER_PACK} cards${n === BUNDLE_PACK_COUNT ? ` · −${Math.round(BUNDLE_DISCOUNT * 100)}%` : ""}`}
          </button>
        );
      })}
    </div>
  );
}

// ─── Bouton PULL : tap = pull immédiat, prix affiché dessus ────────────────

function PullButton({ cost, balance, size, icon, onPull }: {
  cost: number; balance: number; size: Size; icon: string; onPull: () => void;
}) {
  const cfg = SIZE_CONFIG[size];
  const canAfford = balance >= cost;
  return (
    <button
      onClick={() => canAfford && onPull()}
      disabled={!canAfford}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: cfg.gap,
        padding: cfg.btnPad, border: "2px solid transparent", borderRadius: 10,
        cursor: canAfford ? "pointer" : "default",
        background: canAfford ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))" : "transparent",
        borderColor: canAfford ? "transparent" : "var(--text-primary)",
        color: canAfford ? "var(--text-primary)" : "var(--text-primary)",
        fontFamily: "var(--font-display, cursive)", fontSize: cfg.btnFont, fontWeight: 700, letterSpacing: "0.5px",
        whiteSpace: "nowrap",
        opacity: canAfford ? 1 : 0.85,
      }}
    >
      {canAfford ? `PULL · ${cost} ${icon}` : `Need ${cost - balance} more ${icon}`}
    </button>
  );
}

// ─── Composant public ───────────────────────────────────────────────────────

export default function PackPriceAction({ pack, tickets, gems, size = "md", align = "end", onPull }: {
  pack: PackInfo; tickets: number; gems: number; size?: Size; align?: "start" | "center" | "end";
  onPull: (method: Method, pullCount: PullCount) => void;
}) {
  const defaultMethod: Method | null =
    pack.costTickets !== undefined && tickets >= pack.costTickets ? "tickets"
    : pack.costGems !== undefined && gems >= pack.costGems ? "gems"
    : pack.costTickets !== undefined ? "tickets"
    : pack.costGems !== undefined ? "gems"
    : null;

  const [selected, setSelected] = useState<Method | null>(defaultMethod);
  const [pullCount, setPullCount] = useState<PullCount>(1);

  if (pack.locked || !selected) return null;

  const unitCost = selected === "tickets" ? pack.costTickets! : pack.costGems!;
  const cost = getPullCost(unitCost, pullCount);
  const balance = selected === "tickets" ? tickets : gems;
  const alignItems = align === "start" ? "flex-start" : align === "center" ? "center" : "flex-end";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems, gap: 6 }}>
      <PullCountToggle selected={pullCount} onSelect={setPullCount} size={size} />
      <CurrencyToggle pack={pack} tickets={tickets} gems={gems} size={size} selected={selected} onSelect={setSelected} />
      <PullButton cost={cost} balance={balance} size={size} icon={selected === "tickets" ? "🎟️" : "💎"} onPull={() => onPull(selected, pullCount)} />
    </div>
  );
}
