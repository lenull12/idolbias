"use client";

import type { CardGrade } from "@/db/schema";

// ─── GradeBadge ─────────────────────────────────────────────────────────────
//
// Langage visuel volontairement distinct de la rareté (métallique/foil,
// pas les teintes rose/violet/or déjà utilisées par RarityEffects) pour
// que rareté et grade restent lisibles séparément même combinés
// (ex: une Legendary en grade Gem ne doit pas devenir un bloc de couleur
// indéchiffrable).
//
// - standard  → rien (évite le bruit visuel sur 60% des cartes)
// - fine      → tag discret gris/argenté
// - mint      → badge argenté, léger relief
// - pristine  → badge doré + liseré doré autour de la carte
// - gem       → badge holo (même famille que HoloShiftEffect) + liseré
//               holo + chatoiement animé en continu (ambient, pas lié
//               au tilt — contrairement à l'effet Legendary, un badge
//               doit rester visible même sans interaction souris)

const GRADE_LABEL: Record<CardGrade, string> = {
  standard: "",
  fine: "FINE",
  mint: "MINT",
  pristine: "PRISTINE",
  gem: "GEM",
};

type GradeVisual = {
  background: string;
  color: string;
  ring?: string;
  holo?: boolean;
};

const GRADE_VISUALS: Partial<Record<CardGrade, GradeVisual>> = {
  fine: {
    background: "rgba(110,110,122,0.92)",
    color: "#ffffff",
  },
  mint: {
    background: "linear-gradient(135deg, #d8d8e2, #9a9aab)",
    color: "var(--text-primary)",
  },
  pristine: {
    background: "linear-gradient(135deg, #f5d67a, #c99a2e)",
    color: "var(--text-primary)",
    ring: "rgba(232,182,90,0.65)",
  },
  gem: {
    background:
      "linear-gradient(110deg, #ff2d78, #ff9a3c, #f5ff5c, #4dffb0, #4dd2ff, #7c6bff, #ff2d78)",
    color: "var(--text-primary)",
    holo: true,
  },
};

export function GradeBadge({
  grade,
  size = "full",
  width = 220,
  hideTag = false,
}: {
  grade?: CardGrade;
  size?: "full" | "compact";
  width?: number;
  hideTag?: boolean;
}) {
  if (!grade || grade === "standard") return null;
  const visual = GRADE_VISUALS[grade];
  if (!visual) return null;

  const compact = size === "compact";
  const cardRadius = Math.round(width * 0.045);

  return (
    <>
      {visual.holo && (
        <style>{`
          @keyframes gradeHoloShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      )}

      {/* Badge coin haut-droit — masqué si hideTag (zoom face avant) */}
      {!hideTag && (
        <div
        style={{
          position: "absolute",
          top: compact ? 4 : 9,
          right: compact ? 4 : 9,
          zIndex: 6,
          padding: compact ? "2px 5px" : "3px 9px",
          borderRadius: compact ? 5 : 7,
          background: visual.background,
          backgroundSize: visual.holo ? "300% 100%" : undefined,
          animation: visual.holo ? "gradeHoloShift 3.5s ease-in-out infinite" : undefined,
          border: "1px solid rgba(26,10,30,0.55)",
          boxShadow: compact ? "1px 1px 0 rgba(26,10,30,0.6)" : "2px 2px 0 rgba(26,10,30,0.85)",
          fontFamily: "var(--font-mono, ui-monospace, monospace)",
          fontSize: compact ? 7 : 9.5,
          fontWeight: 800,
          letterSpacing: compact ? 0 : "0.5px",
          color: visual.color,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {compact ? GRADE_LABEL[grade][0] : GRADE_LABEL[grade]}
        </div>
      )}

      {/* Liseré autour de la carte — uniquement pristine/gem, les deux
          grades assez rares pour mériter d'être visibles même de loin,
          sans zoomer sur le badge */}
      {(grade === "pristine" || grade === "gem") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 4,
            borderRadius: cardRadius,
            pointerEvents: "none",
            boxShadow:
              grade === "gem"
                ? "inset 0 0 0 2px rgba(255,255,255,0.2), 0 0 16px 2px rgba(255,45,120,0.22)"
                : `inset 0 0 0 2px ${visual.ring}`,
          }}
        />
      )}
    </>
  );
}
