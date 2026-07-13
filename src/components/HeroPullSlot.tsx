
"use client";

import type { PackInfo } from "@/data/cards";
import { CurrencyToggle, type Method } from "@/components/PackPriceAction";

export default function HeroPullSlot({
  pack,
  tickets,
  gems,
  selected,
  onSelect,
  onPull,
}: {
  pack: PackInfo;
  tickets: number;
  gems: number;
  selected: Method;
  onSelect: (method: Method) => void;
  onPull?: () => void;
}) {
  const cost = selected === "tickets" ? pack.costTickets : pack.costGems;
  const balance = selected === "tickets" ? tickets : gems;
  const canAfford = cost !== undefined && balance >= cost;

  return (
    <div onClick={(e) => { e.stopPropagation(); onPull?.(); }} style={{
      width: "min(195px, 35vw)",
      pointerEvents: "auto",
      cursor: "pointer",
      background: "linear-gradient(180deg, #fcf5e8 0%, #f5e8d0 100%)",
      borderRadius: "14px 14px 10px 10px",
      border: "2px solid #3a2a1a",
      boxShadow: "4px 4px 0px #3a2a1a",
      padding: "8px 8px 6px",
      position: "relative",
    }}>
      {/* Hole punch */}
      <div style={{
        position: "absolute", top: -6, left: "50%", translate: "-50% 0",
        width: 12, height: 12, borderRadius: "50%",
        background: "var(--bg)",
        border: "2px solid #3a2a1a",
      }} />

      {/* Body */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <CurrencyToggle pack={pack} tickets={tickets} gems={gems} size="sm" selected={selected} onSelect={onSelect} ticket />

        <span style={{
          fontFamily: "var(--font-display, cursive)", fontWeight: 900, fontSize: 16,
          letterSpacing: "1px", color: canAfford ? "#3a2a1a" : "var(--text-disabled)",
          lineHeight: 1,
        }}>
          PULL
        </span>
      </div>

      {/* Tear line */}
      <div style={{
        margin: "4px 0 4px",
        display: "flex", gap: 2, justifyContent: "center",
      }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{
            width: 3, height: 1, background: "#9a8a7a",
            flexShrink: 0,
          }} />
        ))}
      </div>

      {/* Stub — price */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span style={{
          fontFamily: "var(--font-display, cursive)", fontSize: 12, fontWeight: 800,
          color: canAfford ? "#5a4a3a" : "var(--text-disabled)",
          letterSpacing: "0.5px",
        }}>
          {canAfford ? `${cost} ${selected === "tickets" ? "🎟️" : "💎"}` : `+${(cost ?? 0) - balance}`}
        </span>
      </div>
    </div>
  );
}
