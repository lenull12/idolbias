"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Rarity } from "./CardEffects";
import { GROUPS } from "@/data/artists";
import { GradeBadge } from "./GradeBadge";
import type { CardGrade } from "@/db/schema";

function groupLogoPath(groupName: string): string {
  const g = GROUPS.find((g) => g.name === groupName);
  return g?.logoPath ?? "/vicious_logo.png";
}
import { RarityEffects, NeonGlowBorder } from "./CardEffects";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardSeason = {
  label?: string;     // ex: "SEASON 01"
  color: string;      // hex couleur bandeau recto
  textColor: string;  // hex texte bandeau recto
};

export type PhotoCardMeta = {
  /** Nom de l'idol */
  idol: string;
  /** Nom du groupe */
  group: string;
  /** Nom du pack / drop */
  pack: string;
  /** Collection or edition name */
  edition: string;
  /** Unique reference (e.g. "S01-YN-042") */
  reference: string;
};

export type PhotoCardProps = {
  /** Generated image URL (PNG/WebP 896×1152 recommended) */
  imageSrc: string;
  /** Season info */
  season: CardSeason;
  /** Metadata displayed on the back */
  meta: PhotoCardMeta;
  /** Rarity for visual effects (gems, foil, glitch…) */
  rarity?: Rarity;
  /** Grade qualitatif de l'exemplaire — badge certification, indépendant de la rareté */
  grade?: CardGrade;
  /** Masque le badge texte du grade (garde le liseré pristine/gem) */
  hideGradeTag?: boolean;
  /** 3D tilt intensity in degrees (default: 15) */
  maxTilt?: number;
  /** Card width in px (default: 220) */
  width?: number;
  /** Zoomed mode (disables click-to-zoom) */
  zoomed?: boolean;
  /** Start in back-face mode */
  startFlipped?: boolean;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const CARD_RATIO = 1152 / 896;
const HOLD_DURATION = 400; // ms to trigger flip
const SWIPE_THRESHOLD = 30; // px to trigger swipe to flip

// ─── Sous-composant : verso style Cosmo/Objekt ────────────────────────────────

function CardBack({
  meta,
  season,
  width,
  rarity,
  grade,
}: {
  meta: PhotoCardMeta;
  season: CardSeason;
  width: number;
  rarity?: Rarity;
  grade?: CardGrade;
}) {
  const height = Math.round(width * CARD_RATIO);
  const fs = (ratio: number) => Math.round(width * ratio);
  const GRADE_LABEL: Record<string, string> = {
    standard: "", fine: "Fine", mint: "Mint", pristine: "Pristine", gem: "Gem",
  };

  return (
    <div
      style={{
        width,
        height,
        borderRadius: Math.round(width * 0.045),
        background: "linear-gradient(160deg, var(--card-stock-start) 0%, var(--card-stock-end) 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7% 8%",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: "3.5%",
          left: "3.5%",
          right: "3.5%",
          height: Math.round(width * 0.009),
          background: "rgba(var(--text-primary-rgb),0.06)",
          borderRadius: Math.round(width * 0.009),
        }}
      />
    {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "6%",
          width: "100%",
        }}
      >
        <img
          src={groupLogoPath(meta.group)}
          alt={meta.group}
          draggable={false}
          style={{
            width: "55%",
            maxWidth: fs(0.45),
            height: "auto",
            objectFit: "contain",
            userSelect: "none",
            pointerEvents: "none",
            display: "block",
            filter: "brightness(0.8)",
          }}
        />
      </div>

      {/* Bloc infos central */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: fs(0.04),
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: fs(0.115),
            fontWeight: 600,
            fontFamily: "var(--font-display, cursive)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#000",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {meta.idol}
        </span>

        <div
          style={{
            width: "35%",
            height: 1,
            background: "rgba(var(--text-primary-rgb),0.08)",
            margin: `${fs(0.02)}px 0`,
          }}
        />

        <span
          style={{
            fontSize: fs(0.055),
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {meta.pack}
        </span>

        <span
          style={{
            fontSize: fs(0.05),
            color: "var(--text-secondary)",
            letterSpacing: "0.06em",
          }}
        >
          {meta.edition}
        </span>
      </div>

      {/* Bottom info: ref + number */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {/* Grade — empilé au-dessus de la ref sans la décaler */}
        {grade && grade !== "standard" && (
          <span style={{
            fontSize: fs(0.042), fontFamily: "var(--font-mono, monospace)",
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--text-muted)", marginBottom: fs(0.02),
          }}>
            Grade · {GRADE_LABEL[grade]}
          </span>
        )}

        {/* Ref chip — toujours ancré en bas du bloc */}
        <div style={{ borderRadius: Math.round(width * 0.018), overflow: "hidden" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: `${fs(0.005)}px ${fs(0.035)}px`,
            border: rarity !== "common" && rarity !== "secret"
              ? `${Math.round(width * 0.003)}px solid ${season.color}`
              : "none",
            borderRadius: Math.round(width * 0.018),
            background: "rgba(var(--text-primary-rgb),0.03)",
          }}>
            <span
              style={{
                fontSize: fs(0.045),
                fontFamily: "var(--font-mono, monospace)",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
              }}
            >
              {meta.reference}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div
        style={{
          position: "absolute",
          bottom: "3.5%",
          left: "3.5%",
          right: "3.5%",
          height: Math.round(width * 0.009),
          background: "rgba(var(--text-primary-rgb),0.06)",
          borderRadius: Math.round(width * 0.009),
        }}
      />
    </div>
  );
}

// ─── Sous-composant : zoom overlay ────────────────────────────────────────────

function ZoomOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  // Fermeture sur Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div
      onPointerDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(var(--text-primary-rgb),0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes zoomIn { from { transform: scale(0.88) } to { transform: scale(1) } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "zoomIn 0.25s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function PhotoCard({
  imageSrc,
  season,
  meta,
  rarity = "common",
  grade,
  hideGradeTag,
  maxTilt: _maxTilt,
  width = 224,
  zoomed = false,
  startFlipped = false,
}: PhotoCardProps) {
  const maxTilt = _maxTilt ?? (rarity === "legendary" || rarity === "secret" ? 20 : 12);
  const height = Math.round(width * CARD_RATIO);
  const cardShadow = (() => {
    const s = (m: number) => Math.round(width * 0.01 * m);
    switch (rarity) {
      case "common": return "none";
      case "rare": return `0 0 ${s(1.5)}px #FF69B455, 0 0 ${s(3)}px #FF69B422`;
      case "epic": return `0 0 ${s(3)}px #8B5CF699, 0 0 ${s(6)}px #8B5CF444`;
      case "legendary": return `0 0 ${s(4)}px rgba(232,182,90,0.6), 0 0 ${s(8)}px rgba(232,182,90,0.3)`;
      case "secret": return `0 0 ${s(4)}px rgba(255,105,180,0.5), 0 0 ${s(8)}px rgba(139,92,246,0.35)`;
      default: return "none";
    }
  })();

  // États
  const [isFlipped, setIsFlipped] = useState(startFlipped);
  const [isZoomed, setIsZoomed] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  // Refs tilt
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null); // le div qui reçoit le tilt
  const shineRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const gyroActive = useRef(false);

  // Refs pour swipe to flip
  const dragging = useRef(false);
  const startX = useRef(0);
  const swipeFlip = useRef(false); // true if swipe triggered a flip
  const visualBase = useRef(startFlipped ? 180 : 0); // actual resting rotation (can exceed -180/180, always a multiple of 180)
  const [swipeX, setSwipeX] = useState(0);

  // ─── Tilt ─────────────────────────────────────────────────────────────────

  const applyTilt = useCallback(
    (px: number, py: number) => {
      if (!innerRef.current || !shineRef.current) return;
      const rotateY = (px - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - py) * maxTilt * 2;
      setTiltX(rotateX);
      setTiltY(rotateY);
      innerRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.04)`;
      shineRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(var(--surface-white-rgb),0.12), transparent 40%)`;
      shineRef.current.style.opacity = "0.35";
    },
    [maxTilt, isFlipped]
  );

  const resetTilt = useCallback((instant: boolean = false) => {
    if (!innerRef.current || !shineRef.current) return;
    innerRef.current.style.transition = instant ? "none" : "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)";
    innerRef.current.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
    shineRef.current.style.opacity = "0";
    setTiltX(0);
    setTiltY(0);
    if (instant) {
      // Switch back to short transition so the next hover stays smooth
      requestAnimationFrame(() => {
        if (innerRef.current)
          innerRef.current.style.transition = "transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)";
      });
      return;
    }
    setTimeout(() => {
      if (innerRef.current)
        innerRef.current.style.transition = "transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)";
    }, 500);
  }, []);

  // ─── Souris / touch : tilt ─────────────────────────────────────────────────

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (gyroActive.current || dragging.current) return;
      setIsInteracting(true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = wrapRef.current?.getBoundingClientRect();
        if (!rect) return;
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        applyTilt(px, py);
      });
    },
    [applyTilt]
  );

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsInteracting(false);
    resetTilt();
  }, [resetTilt]);

  // ─── Swipe to flip ─────────────────────────────────────────────────────────
  //   pointerdown  → records starting position, enables drag
  //   pointermove  → calculates delta, updates swipeX for real-time rotateY
  //   pointerup    → si delta > seuil → flip ; sinon snap back

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (zoomed) {
      // Already zoomed → allow swipe to flip in both directions
      dragging.current = true;
      startX.current = e.clientX;
      swipeFlip.current = false;
    setIsInteracting(true); // cuts idle autoTilt during swipe
    resetTilt(true); // instant: prevents parent tilt from animating simultaneously with flip
      return;
    }
    dragging.current = true;
    startX.current = e.clientX;
    swipeFlip.current = false;
    setIsInteracting(true); // coupe l'autoTilt idle pendant le swipe
    resetTilt(true); // instant: prevents parent tilt from animating simultaneously with flip
  }, [zoomed, resetTilt]);

  // move/up events are attached to window via useEffect
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      if (!swipeFlip.current && Math.abs(delta) < 3) return; // dead zone
      if (Math.abs(delta) >= 3) swipeFlip.current = true;
      setSwipeX(delta);
    };
    const handleUp = (e: PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      const delta = e.clientX - startX.current;
      if (Math.abs(delta) >= SWIPE_THRESHOLD) {
        resetTilt(true);
        visualBase.current += delta > 0 ? 180 : -180; // continue dans le sens du drag, jamais l'inverse
        setIsFlipped((v) => !v);
      }
      setSwipeX(0);
      setIsInteracting(false); // let autoTilt resume once swipe is done
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [resetTilt]);

  const handleClick = useCallback(() => {
    if (zoomed) return;
    if (swipeFlip.current) return;
    setIsZoomed(true);
  }, [zoomed]);

  // ─── Gyroscope (disabled) ──────────────────────────────────────────────────

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {isZoomed && (
        <ZoomOverlay onClose={() => setIsZoomed(false)}>
          <PhotoCard
            imageSrc={imageSrc}
            season={season}
            meta={meta}
            rarity={rarity}
            grade={grade}
            hideGradeTag
            maxTilt={maxTilt}
            width={Math.min(515, typeof window !== "undefined" ? window.innerWidth * 0.9 : 515)}
            zoomed
            startFlipped={isFlipped}
          />
        </ZoomOverlay>
      )}

      <style>{`
        @keyframes autoTilt {
          0%, 100% { transform: rotate3d(1, -1, 0, 2deg); }
          50% { transform: rotate3d(1, -1, 0, -2deg); }
        }
      `}</style>

      {/* Perspective wrapper */}
      <div
        ref={wrapRef}
        style={{
          perspective: `${Math.round(width * 3.57)}px`,
          width,
          height,
          display: "inline-block",
          cursor: "pointer",
          userSelect: "none",
          WebkitUserSelect: "none",
          animation: "autoTilt 8s ease-in-out infinite",
          animationPlayState: isInteracting ? "paused" : "running",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        {/* Tilt wrapper — reçoit le tilt 3D */}
        <div
          ref={innerRef}
          style={{
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transition: "transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)",
            willChange: "transform",
          }}
        >
          {/* Flip wrapper — reçoit le rotateY(180deg) pour le verso */}
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              transformStyle: "preserve-3d",
              transition: swipeX !== 0 ? "none" : "transform 0.65s cubic-bezier(0.23, 1, 0.32, 1)",
              transform: `rotateY(${visualBase.current + Math.max(-180, Math.min(180, swipeX * 0.35))}deg)`,
            }}
          >
            {/* ── RECTO ── */}
            <div
            style={{
              position: "absolute",
              inset: 0,
              background: season.color,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              clipPath: `inset(0 round ${Math.round(width * 0.045)}px)`,
              boxShadow: cardShadow,
              transition: "box-shadow 0.4s ease",
            }}>
            {/* Artwork */}
            <img
              src={imageSrc}
              alt={meta.idol}
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
                userSelect: "none",
                display: "block",
                pointerEvents: "none",
              }}
            />

            {/* ── Bandeau saison (bas) ── */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: Math.round(width * 0.078),
                background: rarity === "legendary"
                  ? "rgba(232,182,90,0.2)"
                  : rarity === "secret"
                  ? "rgba(var(--surface-white-rgb),0.15)"
                  : "rgba(18,18,22,0.55)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                pointerEvents: "none",
                zIndex: 1,
                borderTop: rarity !== "common" && rarity !== "secret"
                  ? `${Math.round(width * 0.003)}px solid ${season.color}`
                  : "none",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: Math.round(width * 0.045),
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: Math.round(width * 0.045),
                  fontWeight: 600,
                  color: season.textColor,
                  letterSpacing: "0.03em",
                  fontFamily: "var(--font-mono, monospace)",
                  maxWidth: "30%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {meta.idol.toUpperCase()}
              </span>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  textAlign: "center",
                  fontSize: Math.round(width * 0.028),
                  fontFamily: "var(--font-mono, monospace)",
                  color: season.textColor,
                  letterSpacing: `${Math.round(width * 0.0013)}px`,
                  opacity: 0.7,
                }}
              >
                {meta.reference.toUpperCase()}
              </span>
              <span
                style={{
                  position: "absolute",
                  right: Math.round(width * 0.045),
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: Math.round(width * 0.032),
                  fontWeight: 600,
                  fontFamily: "var(--font-mono, monospace)",
                  color: season.textColor,
                  letterSpacing: "0.08em",
                  maxWidth: "30%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "right",
                  textShadow: rarity === "legendary" || rarity === "secret"
                    ? `0 0 ${Math.round(width * 0.018)}px ${season.color}`
                    : "none",
                }}
              >
                {(() => {
                  const sparkleCount: Record<string, number> = { common: 1, rare: 2, epic: 3, legendary: 4, secret: 5 };
                  const n = sparkleCount[rarity] || 1;
                  return "✦ ".repeat(n).trim();
                })()}
              </span>
            </div>

              {/* Specular reflection */}
              <div
                ref={shineRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  pointerEvents: "none",
                  transition: "opacity 0.1s ease",
                  borderRadius: Math.round(width * 0.045),
                }}
              />

              {/* Rarity-based visual effects */}
              <RarityEffects
                rarity={rarity}
                tiltX={tiltX}
                tiltY={tiltY}
                imageSrc={imageSrc}
                width={width}
              />

              {/* Grade certification badge — taille auto selon la largeur :
                  compact si < 160px (grille), full si vue normale/zoom */}
              <GradeBadge grade={grade} width={width} size={width && width < 160 ? "compact" : "full"} hideTag={hideGradeTag} />

            </div>

            {/* ── VERSO ── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: Math.round(width * 0.045),
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <CardBack
                meta={meta}
                season={season}
                width={width}
                rarity={rarity}
                grade={grade}
              />
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

// ─── Exemple d'utilisation ────────────────────────────────────────────────────
//
// import PhotoCard from "@/components/PhotoCard";
//
// <PhotoCard
//   imageSrc="/cards/yuna_s01.webp"
//   season={{ label: "Season 01", color: "var(--accent-pink)", textColor: "var(--surface-white)" }}
//   meta={{
//     idol: "YUNA",
//     group: "STELLAR",
//     pack: "First Light Pack",
//     edition: "Limited Edition",
//     reference: "S01-YN-042",
//   }}
//   rarity="legendary"
//   maxTilt={15}
//   width={220}
// />
//
// Rarities: common, rare, epic, legendary, secret
//
// Interactions :
//   • Clic simple        → zoom photo en overlay (Escape ou clic fond pour fermer)
//   • Hold ~400ms       → flips card (back with idol/group/edition info)
//   • Clic simple verso  → remet recto
//   • Mouse hover        → 3D tilt + visual effects by rarity
//   • Gyroscope mobile   → (window as any).__enableCardGyro?.() depuis un bouton
