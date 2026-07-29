"use client";

import { useState } from "react";
import PitchCanvas from "@/components/PitchCanvas";
import { computeDisplaySize } from "@/lib/pitchCoords";

export default function PitchDecorPreviewView() {
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const { displayWidth, displayHeight } = computeDisplaySize(orientation, 720, 1100);

  return (
    <div className="mx-auto max-w-[1200px]" style={{ padding: "24px 16px 48px" }}>
      <span style={{ fontSize: 13, color: "var(--text-disabled)", letterSpacing: "4px", textTransform: "uppercase" }}>
        ✦ Pitch Decor Preview
      </span>
      <h1 style={{ fontFamily: "var(--font-display, cursive)", fontSize: 28, fontWeight: 400, margin: "0 0 8px", letterSpacing: "-0.3px" }}>
        Décor du terrain
      </h1>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
        Validation visuelle — terrain Phaser avec lignes, cages, pelouse, tribunes et panneaux.
        Aucune joueuse ni ballon (étape 1).
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["horizontal", "vertical"] as const).map((o) => (
          <button
            key={o}
            onClick={() => setOrientation(o)}
            style={{
              padding: "6px 16px", borderRadius: 8, border: "1px solid",
              borderColor: orientation === o ? "var(--accent-hotpink)" : "rgba(var(--text-primary-rgb),0.15)",
              background: orientation === o ? "var(--accent-hotpink)" : "var(--surface)",
              color: orientation === o ? "#fff" : "var(--text-primary)",
              cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            }}
          >
            {o === "horizontal" ? "Horizontal (match)" : "Vertical (tactique)"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 16, borderRadius: 12, background: "var(--surface)", border: "1px solid rgba(var(--text-primary-rgb),0.08)" }}>
        <PitchCanvas orientation={orientation} displayWidth={displayWidth} displayHeight={displayHeight} />
      </div>

      <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: "var(--surface)", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Checklist de validation :
        <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
          <li>Pelouse avec bandes de tonte alternées</li>
          <li>Lignes réglementaires complètes (surfaces, rond central, points, arcs de corner)</li>
          <li>Cages avec poteaux + filet</li>
          <li>Panneaux publicitaires Y2K</li>
          <li>Tribunes suggérées (points de foule)</li>
          <li>Poteaux de corner avec fanions</li>
        </ul>
      </div>
    </div>
  );
}
