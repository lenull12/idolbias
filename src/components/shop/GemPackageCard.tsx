"use client";

import type { GemPackage } from "@/lib/gemShop";

export default function GemPackageCard({
  pkg,
  onBuy,
  loading,
  bestValue,
}: {
  pkg: GemPackage;
  onBuy: () => void;
  loading: boolean;
  bestValue?: boolean;
}) {
  const priceStr = (pkg.amountEur / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
  const base = Math.round(pkg.gems / (1 + pkg.bonusPercent / 100));
  const bonus = pkg.gems - base;
  const valuePerEuro = Math.round(pkg.gems / (pkg.amountEur / 100));
  const highlighted = bestValue || pkg.featured;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 16px", borderRadius: 14,
      background: highlighted
        ? "linear-gradient(135deg, rgba(255,158,196,0.12), rgba(201,177,255,0.12))"
        : "rgba(var(--surface-white-rgb),0.5)",
      border: highlighted
        ? "2px solid var(--accent-hotpink)"
        : "1px solid rgba(255,158,196,0.08)",
      boxShadow: highlighted
        ? "5px 5px 0px rgba(var(--text-primary-rgb),0.9)"
        : "none",
      position: "relative",
    }}>
      {/* Gem icon + count */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 26 }}>💎</span>
        <span style={{
          fontSize: 20, fontWeight: 900,
          fontFamily: "var(--font-display)", color: "var(--text-primary)",
          letterSpacing: "-0.5px", whiteSpace: "nowrap",
        }}>
          {pkg.gems.toLocaleString()}
        </span>
      </div>

      {/* Breakdown */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        {pkg.bonusPercent > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {base.toLocaleString()} base <span style={{ color: "var(--accent-hotpink)", fontWeight: 700 }}>+{bonus.toLocaleString()} bonus</span>
            {" · "}<span style={{ color: "var(--accent-hotpink)" }}>+{pkg.bonusPercent}%</span>
          </span>
        )}
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
          <strong>{valuePerEuro} 💎/€</strong>
        </span>
      </div>

      {/* Badges */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
        {bestValue && (
          <span style={{
            padding: "2px 8px", borderRadius: 5,
            background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
            color: "var(--text-primary)", fontSize: 8, fontWeight: 800,
            fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.5px",
            whiteSpace: "nowrap",
          }}>
            ★ BEST VALUE
          </span>
        )}
        {pkg.featured && !bestValue && (
          <span style={{
            padding: "2px 8px", borderRadius: 5,
            background: "var(--accent-hotpink)",
            color: "var(--surface-white)", fontSize: 8, fontWeight: 800,
            fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.5px",
            whiteSpace: "nowrap",
          }}>
            POPULAR
          </span>
        )}
        <button onClick={onBuy} disabled={loading} style={{
          padding: "8px 18px", borderRadius: 8, border: "none",
          background: loading
            ? "rgba(255,255,255,0.05)"
            : "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
          color: loading ? "var(--text-disabled)" : "var(--surface-white)",
          fontWeight: 700, fontSize: 12, cursor: loading ? "default" : "pointer",
          fontFamily: "var(--font-sans)", whiteSpace: "nowrap",
        }}>
          {loading ? "..." : `Buy · ${priceStr}`}
        </button>
      </div>
    </div>
  );
}
