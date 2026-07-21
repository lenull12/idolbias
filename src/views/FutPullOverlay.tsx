"use client";

import { useState } from "react";
import FutCard from "@/components/FutCard";
import type { FutCardProps } from "@/components/FutCard";
import { SAMPLE_FUT_CARDS } from "@/data/footballCards";

export default function FutPullOverlay({ onClose }: { onClose?: () => void }) {
  const [revealed, setRevealed] = useState(false);

  const handleOpen = () => {
    setRevealed(true);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#06060e",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 24, padding: 24,
      fontFamily: "system-ui, sans-serif",
      position: "relative",
    }}>
      {/* Close button */}
      {onClose && (
        <button onClick={onClose} style={{
          position: "fixed", top: 12, right: 12, zIndex: 100,
          width: 36, height: 36, borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.15)",
          background: "rgba(10,10,20,0.8)",
          color: "#888", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        }}>✕</button>
      )}
      {!revealed && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
        }}>
          <div onClick={handleOpen} style={{
            width: 200, height: 260, borderRadius: 12,
            background: "linear-gradient(135deg, #1a1a2e, #252547)",
            border: "2px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "transform 0.2s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
            <span style={{ fontSize: 48, opacity: 0.4 }}>🎁</span>
          </div>
          <span style={{ fontSize: 12, color: "#888", letterSpacing: 2, fontFamily: "monospace" }}>
            CLICK TO PULL
          </span>
        </div>
      )}

      {revealed && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 20,
          justifyContent: "center", alignItems: "center",
        }}>
          {SAMPLE_FUT_CARDS.map((card, i) => {
            const isL = card.rarity === "legendary";
            const isS = card.rarity === "secret";
            const auraStyle: React.CSSProperties = card.rarity === "common" ? { opacity: 0 } :
              card.rarity === "rare" ? { opacity: 0.4, background: "radial-gradient(ellipse at center, rgba(80,120,216,0.14) 0%, transparent 68%)" } :
              card.rarity === "epic" ? { opacity: 0.5, background: "radial-gradient(ellipse at center, rgba(124,58,237,0.2) 0%, rgba(124,58,237,0.05) 50%, transparent 72%)" } :
              isL ? { opacity: 0.65, background: "radial-gradient(ellipse at center, rgba(232,182,90,0.28) 0%, rgba(232,182,90,0.07) 45%, transparent 68%)" } :
              { opacity: 0.75, background: "radial-gradient(ellipse at center, rgba(255,105,180,0.3) 0%, rgba(138,92,246,0.12) 40%, transparent 68%)" };
            return (
              <div key={i}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px) scale(1.03)"; e.currentTarget.style.zIndex = "10"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.zIndex = ""; }}
                style={{
                position: "relative", padding: 16, transition: "transform 0.2s ease, z-index 0s",
                ...(isL ? { filter: "drop-shadow(0 0 18px rgba(232,182,90,0.45)) drop-shadow(0 0 36px rgba(232,182,90,0.12))", animation: "futLegendGlow 2s ease-in-out infinite" } : {}),
                ...(isS ? { filter: "drop-shadow(0 0 18px rgba(255,105,180,0.45)) drop-shadow(0 0 36px rgba(138,92,246,0.12))", animation: "futSecretGlow 2.5s ease-in-out infinite" } : {}),
              }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: 18, pointerEvents: "none", ...auraStyle }} />
                <FutCard {...card} />
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes futLegendGlow { 0%,100% { filter: drop-shadow(0 0 18px rgba(232,182,90,0.45)) drop-shadow(0 0 36px rgba(232,182,90,0.12)); } 50% { filter: drop-shadow(0 0 26px rgba(255,215,0,0.55)) drop-shadow(0 0 48px rgba(255,215,0,0.18)); } }
        @keyframes futSecretGlow { 0%,100% { filter: drop-shadow(0 0 18px rgba(255,105,180,0.45)) drop-shadow(0 0 36px rgba(138,92,246,0.12)); } 33% { filter: drop-shadow(0 0 26px rgba(138,92,246,0.55)) drop-shadow(0 0 48px rgba(255,105,180,0.18)); } 66% { filter: drop-shadow(0 0 26px rgba(77,232,255,0.55)) drop-shadow(0 0 48px rgba(138,92,246,0.18)); } }
      `}</style>
    </div>
  );
}
