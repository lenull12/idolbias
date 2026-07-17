"use client";

import type { GemPackage } from "@/lib/gemShop";

export default function GemPackageCard({
  pkg, onBuy, loading, badge, gemIndex,
}: {
  pkg: GemPackage;
  onBuy: () => void;
  loading: boolean;
  badge?: string;
  gemIndex: number;
}) {
  const priceStr = (pkg.amountEur / 100).toLocaleString("fr-FR", {
    style: "currency", currency: "EUR",
  });
  const base = Math.round(pkg.gems / (1 + pkg.bonusPercent / 100));
  const bonus = pkg.gems - base;

  const gems = Array.from({ length: gemIndex }, (_, i) => i);

  const hasBadge = !!badge;
  const bg = hasBadge
    ? "linear-gradient(135deg, rgba(255,20,147,0.08), rgba(201,177,255,0.08))"
    : "rgba(var(--surface-white-rgb),0.4)";
  const border = hasBadge
    ? "2px solid var(--accent-hotpink)"
    : "2px solid rgba(var(--text-primary-rgb),0.08)";
  const shadow = hasBadge
    ? "4px 4px 0px rgba(var(--text-primary-rgb),0.9)"
    : "none";

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      padding: "20px 16px", borderRadius: 14,
      background: bg, border, boxShadow: shadow,
      position: "relative",
    }}>
      {badge && (
        <span style={{
          position: "absolute", top: -10, right: 16,
          padding: "3px 12px", borderRadius: 6,
          background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
          color: "var(--text-primary)", fontSize: 9, fontWeight: 800,
          fontFamily: "var(--font-sans, monospace)", letterSpacing: "1.5px",
          whiteSpace: "nowrap",
        }}>
          {badge}
        </span>
      )}

      <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
        {gems.map((_, i) => (
          <span key={i} style={{ fontSize: 26, lineHeight: 1 }}>💎</span>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{
          fontSize: 28, fontWeight: 900, fontFamily: "var(--font-display)",
          color: hasBadge ? "var(--accent-hotpink)" : "var(--text-primary)",
          letterSpacing: "-1px", lineHeight: 1,
        }}>
          {pkg.gems.toLocaleString()}
        </span>
        <span style={{
          fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display)",
          color: "var(--text-muted)",
        }}>
          Gems
        </span>
      </div>

      {pkg.bonusPercent > 0 ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 10px", borderRadius: 6,
          background: "rgba(255,20,147,0.08)",
          border: "1px solid rgba(255,20,147,0.2)",
        }}>
          <span style={{
            fontSize: 10, fontWeight: 800, color: "var(--accent-hotpink)",
            fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.5px", whiteSpace: "nowrap",
          }}>
            +{pkg.bonusPercent}%
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {base.toLocaleString()} base{" "}
            <span style={{ color: "var(--accent-hotpink)", fontWeight: 700 }}>
              +{bonus.toLocaleString()}
            </span>
          </span>
        </div>
      ) : (
        <div style={{ height: 28 }} />
      )}

      <button onClick={onBuy} disabled={loading} style={{
        padding: "10px 28px", borderRadius: 10, border: "none",
        background: loading
          ? "rgba(var(--text-primary-rgb),0.06)"
          : hasBadge
            ? "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))"
            : "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
        color: loading ? "var(--text-disabled)" : "var(--surface-white)",
        fontWeight: 700, fontSize: 14, cursor: loading ? "default" : "pointer",
        fontFamily: "var(--font-display)", whiteSpace: "nowrap",
        boxShadow: hasBadge ? "2px 2px 0px rgba(var(--text-primary-rgb),0.5)" : "none",
      }}>
        {loading ? "..." : priceStr}
      </button>
    </div>
  );
}
