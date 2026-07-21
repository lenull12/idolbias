"use client";

import BackstageDecor from "@/components/BackstageDecor";
import SystemWindow from "@/components/SystemWindow";
import { useState, useRef, useCallback, useEffect } from "react";
import PhotoCard from "@/components/PhotoCard";
import type { Rarity } from "@/components/CardEffects";
import { startHoldSound, stopHoldSound, playBurst, playFlip, playReveal } from "@/lib/pullSounds";
import { getPackDropRates, getCardsByPack, getPackInfo } from "@/data/cards";
import { openPack } from "@/lib/gameActions";
import type { ServerCard } from "@/lib/gachaEngine";
import { RARITY_ORDER } from "@/lib/gameConfig";
import { RARITY_LABELS, RARITY_COLORS, RARITY_STARS, SEASON_COLORS } from "@/lib/rarityTheme";
import { HARD_PITY_THRESHOLD } from "@/lib/pullConfig";

// ─── Types ─────────────────────────────────────────────────────────────────

type PullResult = ServerCard & {
  season: { label: string; color: string; textColor: string };
  meta: { idol: string; group: string; pack: string; edition: string; reference: string };
  isNew: boolean;
};

// ─── Constants ─────────────────────────────────────────────────────────────

const CARD_W = 224;
const CARD_H = 288;
const ZOOM_W = 515;
const ZOOM_H = 662;
const SWIPE_THRESHOLD = 60;

function useResponsiveCardWidth(): number {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return Math.min(280, Math.max(180, (w - 48) * 0.55));
}

function useGridCardWidth(cols: number): number {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const pad = 64;
  const gap = 16 * (cols - 1);
  return Math.min(200, Math.max(60, Math.floor((w - pad - gap) / cols)));
}

function useResponsiveZoomSize(): { w: number; h: number } {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const zoomW = Math.min(ZOOM_W, w * 0.88);
  return { w: zoomW, h: Math.round(zoomW * (ZOOM_H / ZOOM_W)) };
}


// ─── Helpers ────────────────────────────────────────────────────────────────

// ─── Pack Display ──────────────────────────────────────────────────────────

function PackDisplay({ onOpen, disabled, coverImage }: { onOpen: () => void; disabled?: boolean | string | null; coverImage?: string }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "holding" | "opening">("idle");
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = useCallback(() => {
    if (disabled || phase === "opening") return;
    setPhase("holding"); setProgress(0);
    startHoldSound();
    holdRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 1.5;
        if (next >= 100) {
          clearInterval(holdRef.current!); holdRef.current = null;
          setPhase("opening");
          stopHoldSound();
          playBurst();
          setTimeout(onOpen, 700);
          return 100;
        }
        return next;
      });
    }, 30);
  }, [phase, onOpen]);

  const cancelHold = useCallback(() => {
    if (holdRef.current) clearInterval(holdRef.current);
    holdRef.current = null; setPhase("idle"); setProgress(0);
    stopHoldSound();
  }, []);

  useEffect(() => () => { if (holdRef.current) clearInterval(holdRef.current); }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 36,
        userSelect: "none",
      }}
      onMouseDown={startHold} onMouseUp={cancelHold} onMouseLeave={cancelHold}
      onTouchStart={startHold} onTouchEnd={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-1px); } 75% { transform: translateX(1px); } }
        @keyframes openBurst { 0% { transform: scale(1); opacity: 1; } 40% { transform: scale(1.08) rotate(-1deg); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
      `}</style>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 260, height: 334, borderRadius: 14, overflow: "hidden", position: "relative",
          cursor: disabled ? "not-allowed" : phase === "opening" ? "default" : "pointer",
          opacity: disabled ? 0.35 : 1,
          animation: disabled ? "none" : phase === "opening" ? "openBurst 0.7s ease-in forwards" : phase === "holding" ? "shake 0.08s linear infinite" : "float 3s ease-in-out infinite",
        }}>
          {coverImage ? (
            <img src={coverImage} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "rgba(var(--text-primary-rgb),0.03)" }} />
          )}
        </div>
        <div style={{ width: 260, height: 2, background: "rgba(255,158,196,0.06)", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: phase === "opening" ? "transparent" : "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))", borderRadius: 1, transition: phase === "holding" ? "width 0.15s linear" : "none" }} />
        </div>
        {disabled && typeof disabled === "string" && <span style={{ color: "var(--text-disabled)", fontSize: 12, fontFamily: "var(--font-sans, monospace)", fontWeight: 600, letterSpacing: "2px" }}>{disabled}</span>}
        {!disabled && phase === "idle" && <span style={{ color: "var(--text-disabled)", fontSize: 12, fontFamily: "var(--font-sans, monospace)", fontWeight: 600, letterSpacing: "2px" }}>HOLD TO OPEN</span>}
        {!disabled && phase === "holding" && <span style={{ color: "var(--text-disabled)", fontSize: 12, fontFamily: "var(--font-sans, monospace)", fontWeight: 600, letterSpacing: "2px" }}>OPENING...</span>}
      </div>
    </div>
  );
}

// ─── Mini Verso Card ───────────────────────────────────────────────────────

function MiniVersoCard({ card, index, onClick, isRevealed, coverImage, cardWidth = CARD_W, priceGems }: {
  card: PullResult; index: number; onClick: (e: React.MouseEvent) => void; isRevealed: boolean; coverImage?: string; cardWidth?: number; priceGems?: number;
}) {
  const cardHeight = Math.round(cardWidth * (CARD_H / CARD_W));
  const wrapperHeight = cardHeight + 24; // reserve space for price gems
  if (isRevealed) {
    return (
      <div style={{ width: cardWidth, minHeight: wrapperHeight, animation: `cardIn 0.4s ease-out ${index * 0.1}s both`, userSelect: "none", WebkitUserSelect: "none", position: "relative" }}>
        <style>{`@keyframes cardIn { 0% { opacity: 0; transform: translateY(24px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
        <PhotoCard imageSrc={card.imageSrc} season={card.season} meta={card.meta} rarity={card.rarity} grade={card.grade} width={cardWidth} />
        {card.isNew && (
          <div style={{
            position: "absolute", top: -6, left: -6, zIndex: 2,
            padding: "2px 8px", borderRadius: 6,
            background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-pink))",
            color: "var(--surface-white)", fontSize: 9, fontWeight: 800,
            fontFamily: "var(--font-sans, monospace)",
            letterSpacing: "1px",
            border: "1.5px solid var(--surface-white)",
            boxShadow: "1px 1px 0px rgba(var(--text-primary-rgb),0.3)",
            transform: "rotate(-6deg)",
          }}>
            NEW
          </div>
        )}
        {priceGems !== undefined && (
          <div style={{ textAlign: "center", marginTop: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(var(--text-primary-rgb),0.6)", fontFamily: "var(--font-display)" }}>💎 {priceGems}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div onClick={onClick} style={{
      width: cardWidth, height: wrapperHeight, borderRadius: Math.round(cardWidth * 0.045), overflow: "hidden", cursor: "pointer",
      position: "relative",
      background: "rgba(var(--surface-white-rgb),0.75)",
      animation: `cardIn 0.4s ease-out ${index * 0.1}s both`,
      transition: "transform 0.2s",
      userSelect: "none", WebkitUserSelect: "none",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px) scale(1.02)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
    >
      <style>{`
        @keyframes cardIn { 0% { opacity: 0; transform: translateY(24px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{
        position: "absolute", inset: 0,
        background: coverImage ? `url("${coverImage}") center/cover` : "rgba(var(--text-primary-rgb),0.03)",
        opacity: 1,
      }} />
    </div>
  );
}

// ─── Zoomed Swipe Card ─────────────────────────────────────────────────────

function ZoomedSwipeCard({ card, onReveal, coverImage, zoomW = ZOOM_W, zoomH = ZOOM_H, priceGems }: {
  card: PullResult; onReveal: () => void; coverImage?: string;
  zoomW?: number; zoomH?: number; priceGems?: number;
}) {
  const [swipeX, setSwipeX] = useState(0);
  const [flipDone, setFlipDone] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const maxTilt = card.rarity === "legendary" || card.rarity === "secret" ? 20 : 12;
  const tiltRange = maxTilt * 2;

  const handleMouseMove = useCallback((e: React.PointerEvent) => {
    if (dragging.current || flipDone) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTiltY((((e.clientX - rect.left) / rect.width) - 0.5) * tiltRange);
    setTiltX((0.5 - (e.clientY - rect.top) / rect.height) * tiltRange);
  }, [flipDone, tiltRange]);

  const handleMouseLeave = useCallback(() => {
    if (dragging.current) return;
    setTiltX(0); setTiltY(0);
  }, []);

  const onDown = useCallback((e: React.PointerEvent) => {
    if (flipDone) return;
    dragging.current = true; startX.current = e.clientX;
    setTiltX(0); setTiltY(0);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
  }, [flipDone]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const handleMove = (e: PointerEvent) => { if (!dragging.current) return; setSwipeX(e.clientX - startX.current); };
    const handleUp = (e: PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      if (Math.abs(e.clientX - startX.current) >= SWIPE_THRESHOLD) {
        playFlip();
        setSwipeX(e.clientX - startX.current > 0 ? 999 : -999);
        const delay = (card.rarity === "legendary" || card.rarity === "secret") ? 900 : 420;
        setTimeout(() => { setFlipDone(true); onReveal(); }, delay);
      } else { setSwipeX(0); }
    };
    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerup", handleUp);
    el.addEventListener("pointercancel", handleUp);
    return () => { el.removeEventListener("pointermove", handleMove); el.removeEventListener("pointerup", handleUp); el.removeEventListener("pointercancel", handleUp); };
  }, [card.id, onReveal, card.rarity]);

  useEffect(() => {
    if (flipDone) playReveal(card.rarity);
  }, [flipDone, card.rarity]);

  if (flipDone) {
    const rarityCfg: Record<string, { color: string; flash: string; pulse: string; shimmer: boolean; prismatic: boolean }> = {
      common:    { color: "26,10,30",    flash: "0.4s", pulse: "0.3s", shimmer: false, prismatic: false },
      rare:      { color: "0,0,0", flash: "0.6s", pulse: "0.4s", shimmer: false, prismatic: false },
      epic:      { color: "124,92,255",   flash: "0.8s", pulse: "0.5s", shimmer: true,  prismatic: false },
      legendary: { color: "245,240,225", flash: "1s",   pulse: "0.6s", shimmer: true,  prismatic: false },
      secret:    { color: "255,255,255", flash: "1.2s", pulse: "0.7s", shimmer: true,  prismatic: true },
    };
    const cfg = rarityCfg[card.rarity] || rarityCfg.common;
    return (
      <div style={{ position: "relative" }}>
        <style>{`
          @keyframes cardFlash { 0% { opacity: 0.9; } 100% { opacity: 0; } }
          @keyframes cardPulse { 0% { transform: scale(0.96); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
          @keyframes shimmerSweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); opacity: 0; } }
        `}</style>
        <div style={{
          position: "absolute", inset: -12, borderRadius: Math.round(zoomW * 0.065),
          background: `radial-gradient(circle, rgba(${cfg.color},0.35) 0%, transparent 70%)`,
          animation: `cardFlash ${cfg.flash} ease-out forwards`,
          pointerEvents: "none", zIndex: 1,
        }} />
        {cfg.shimmer && (
          <div style={{ position: "absolute", inset: 0, borderRadius: Math.round(zoomW * 0.045), zIndex: 2, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(105deg, transparent 40%, rgba(${cfg.color},0.3) 50%, transparent 60%)`,
              animation: "shimmerSweep 0.8s ease-out forwards",
            }} />
          </div>
        )}
        {cfg.prismatic && (
          <div style={{ position: "absolute", inset: 0, borderRadius: Math.round(zoomW * 0.045), zIndex: 3, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(105deg, transparent 35%, rgba(255,100,100,0.2) 42%, rgba(255,200,50,0.2) 47%, rgba(100,255,100,0.2) 52%, rgba(100,150,255,0.2) 57%, rgba(200,100,255,0.2) 62%, transparent 68%)",
              animation: "shimmerSweep 0.7s ease-out 0.1s forwards",
            }} />
          </div>
        )}
        <div style={{ animation: `cardPulse ${cfg.pulse} ease-out` }}>
          <PhotoCard imageSrc={card.imageSrc} season={card.season} meta={card.meta} rarity={card.rarity} grade={card.grade} hideGradeTag width={zoomW} zoomed />
      </div>
      {priceGems !== undefined && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(var(--text-primary-rgb),0.6)", fontFamily: "var(--font-display)" }}>💎 {priceGems}</span>
        </div>
      )}
    </div>
  );
  }

  const dragRotation = Math.max(-180, Math.min(180, (swipeX / 300) * 180));
  const isHoverTilt = !dragging.current && dragRotation === 0;

  return (
    <div ref={cardRef} style={{ width: zoomW, height: zoomH, perspective: Math.round(zoomW * 3.57), cursor: "grab", touchAction: "none" }}
      onPointerDown={onDown} onPointerMove={handleMouseMove} onPointerLeave={handleMouseLeave}>
      <div style={{
        width: "100%", height: "100%", position: "relative",
        transformStyle: "preserve-3d",
        transition: dragging.current ? "none" : "transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        transform: isHoverTilt
          ? `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.04)`
          : `rotateY(${dragRotation}deg)`,
      }}>
        {/* VERSO */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: Math.round(zoomW * 0.045), overflow: "hidden",
          backfaceVisibility: "hidden",
          background: "rgba(var(--surface-white-rgb),0.75)",
          userSelect: "none", WebkitUserSelect: "none",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: coverImage ? `url("${coverImage}") center/cover` : "rgba(var(--text-primary-rgb),0.03)",
            opacity: 1,
          }} />
        </div>
        {/* RECTO */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", userSelect: "none", WebkitUserSelect: "none" }}>
          <PhotoCard imageSrc={card.imageSrc} season={card.season} meta={card.meta} rarity={card.rarity} grade={card.grade} hideGradeTag width={zoomW} zoomed />
        </div>
      </div>
    </div>
  );
}

// ─── Page Marquee (badge fixe) ──────────────────────────────────────────────

function PageMarquee({ onHome }: { onHome: () => void }) {
  return (
    <>
      <style>{`
        @keyframes marqueeFoil {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div style={{
        position: "fixed", top: 10, left: 10, zIndex: 5,
        display: "flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: "8px 8px 6px 6px",
        background: "var(--surface-white, #fff)",
        border: "2px solid var(--text-primary)",
        boxShadow: "2px 2px 0px rgba(var(--text-primary-rgb),0.9)",
      }}>
        <span onClick={onHome} style={{ fontSize: 12, cursor: "pointer", lineHeight: 1 }}>←</span>
        <span className="hidden lg:inline" style={{
          fontFamily: "var(--font-display, cursive)", fontSize: 13, fontWeight: 700,
          letterSpacing: "0.5px", textTransform: "uppercase",
          backgroundImage: "linear-gradient(100deg, var(--accent-hotpink) 0%, var(--accent-purple) 35%, var(--holo-c, #9EE6FF) 65%, var(--accent-hotpink) 100%)",
          backgroundSize: "300% 100%",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          animation: "marqueeFoil 6s ease-in-out infinite",
        }}>
          BACKSTAGE PASS
        </span>
      </div>
    </>
  );
}

// ─── Bottom Ticker ───────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  "✦ BACKSTAGE PASS",
  "✦ NEW DROPS EVERY WEEK",
  "✦ GOOD LUCK ON YOUR PULL",
  "✦ COLLECT 'EM ALL",
  "✦ COMEBACK SOON",
];

function TickerBar() {
  const content = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <>
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 5,
        height: 30, overflow: "hidden",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "var(--text-primary)",
        borderTop: "2px solid var(--text-primary)",
        display: "flex", alignItems: "center",
      }}>
        <div style={{
          display: "flex", gap: 40, whiteSpace: "nowrap",
          animation: "tickerScroll 22s linear infinite",
          fontFamily: "var(--font-sans, monospace)", fontSize: 12, fontWeight: 600,
          letterSpacing: "1.5px", color: "rgba(var(--surface-white-rgb),0.7)",
          paddingLeft: 40,
        }}>
          {content.map((item, i) => <span key={i}>{item}</span>)}
        </div>
      </div>
    </>
  );
}

// ─── Reveal Progress Pips ─────────────────────────────────────────────────────

function RevealProgressPips({ total, revealed }: { total: number; revealed: number }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{
          width: 18, height: 5, borderRadius: 3,
          background: i < revealed ? "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))" : "rgba(var(--text-primary-rgb),0.1)",
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );
}

// ─── Live Rarity Tally ───────────────────────────────────────────────────────

function RarityTally({ pullResults, revealedIds }: { pullResults: PullResult[]; revealedIds: Set<string> }) {
  const counts: Partial<Record<Rarity, number>> = {};
  for (const card of pullResults) {
    if (!revealedIds.has(card.id)) continue;
    counts[card.rarity] = (counts[card.rarity] ?? 0) + 1;
  }
  const entries = RARITY_ORDER.filter((r) => counts[r]);
  if (entries.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
      {entries.map((r) => (
        <div key={r} style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "3px 9px", borderRadius: 8,
          border: `1.5px solid ${RARITY_COLORS[r]}`,
          background: "rgba(var(--surface-white-rgb),0.6)",
        }}>
          <span style={{ fontSize: 10, fontFamily: "var(--font-sans, monospace)", fontWeight: 700, color: RARITY_COLORS[r] === "rgba(var(--text-primary-rgb),0.3)" ? "rgba(var(--text-primary-rgb),0.5)" : RARITY_COLORS[r] }}>
            {counts[r]}× {RARITY_LABELS[r]}
          </span>
        </div>
      ))}
    </div>
  );
}



// ─── Share Button ────────────────────────────────────────────────────────────

function ShareButton({ pullResults, bestRarity }: { pullResults: PullResult[]; bestRarity: Rarity | null }) {
  const handleShare = useCallback(async () => {
    const group = pullResults[0]?.meta.group ?? "";
    const packName = pullResults[0]?.meta.pack ?? "";
    const text = `Pulled ${pullResults.length} ${group} cards · ${packName} — best pull: ${bestRarity ? RARITY_LABELS[bestRarity] : "?"} ✦`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  }, [pullResults, bestRarity]);

  return (
    <button onClick={handleShare} style={{
      padding: "7px 18px", borderRadius: 10, border: "1.5px solid rgba(var(--text-primary-rgb),0.1)",
      background: "transparent", color: "var(--text-secondary)",
      fontFamily: "var(--font-sans, monospace)", fontSize: 13, fontWeight: 600,
      letterSpacing: "1px", cursor: "pointer",
    }}>
      📸 SHARE
    </button>
  );
}

// ─── Drop Rates Panel ────────────────────────────────────────────────────────

function DropRatesPanel({ packCode }: { packCode: string }) {
  const rates = getPackDropRates(packCode);
  const total = RARITY_ORDER.reduce((sum, r) => sum + rates[r], 0);

  return (
    <div className="hidden lg:block" style={{
      position: "fixed", left: 20, top: "50%", transform: "translateY(-50%)", zIndex: 5,
    }}>
      <SystemWindow title="Drop Rates" width={150}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {RARITY_ORDER.map((r) => {
            const pct = total > 0 ? (rates[r] / total) * 100 : 0;
            return (
              <div key={r} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 11, fontFamily: "var(--font-sans, monospace)", fontWeight: 600,
                  letterSpacing: "0.5px", color: "var(--text-secondary)",
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                    background: r === "secret"
                      ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple), var(--holo-c), var(--accent-pink))"
                      : RARITY_COLORS[r],
                    backgroundSize: r === "secret" ? "200% 200%" : undefined,
                    animation: r === "secret" ? "marqueeFoil 3s ease-in-out infinite" : undefined,
                  }} />
                  {RARITY_LABELS[r]}
                </span>
                <span style={{ fontSize: 11, fontFamily: "var(--font-sans, monospace)", fontWeight: 700, color: "var(--text-secondary)" }}>
                  {pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </SystemWindow>
    </div>
  );
}

// ─── Last Drop Panel ─────────────────────────────────────────────────────────

function LastDropPanel({ history }: { history: PullResult[] }) {
  const [latest, ...rest] = history;

  return (
    <div className="hidden lg:block" style={{
      position: "fixed", right: 20, top: "50%", transform: "translateY(-50%)", zIndex: 5,
    }}>
      <SystemWindow title="Last Drop" width={150}>
        {!latest ? (
          <span style={{
            fontSize: 11, fontFamily: "var(--font-sans, monospace)", fontWeight: 600,
            color: "var(--text-disabled)", letterSpacing: "0.5px",
          }}>
            NO DROPS YET
          </span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src={latest.imageSrc} alt="" style={{
                width: 34, height: 44, objectFit: "cover", borderRadius: 5,
                border: `1.5px solid ${RARITY_COLORS[latest.rarity]}`,
              }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{
                  fontSize: 12, fontFamily: "var(--font-display, cursive)", fontWeight: 700,
                  color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {latest.meta.idol}
                </span>
                <span style={{
                  fontSize: 10, fontFamily: "var(--font-sans, monospace)", fontWeight: 600,
                  letterSpacing: "0.5px", color: RARITY_COLORS[latest.rarity],
                }}>
                  {RARITY_LABELS[latest.rarity]}
                </span>
      </div>
      </div>

            {rest.length > 0 && (
              <>
                <div style={{ height: 1, background: "rgba(var(--text-primary-rgb),0.08)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {rest.map((c) => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: RARITY_COLORS[c.rarity], flexShrink: 0 }} />
                      <span style={{
                        fontSize: 10, fontFamily: "var(--font-sans, monospace)", color: "var(--text-muted)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {c.meta.idol}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </SystemWindow>
    </div>
  );
}

// ─── Ticket Counter ──────────────────────────────────────────────────────────

function TicketCounter({ tickets, gems }: { tickets: number; gems: number }) {
  return (
    <div style={{
      position: "fixed", top: 10, right: 10, zIndex: 5,
      display: "flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: "8px 8px 6px 6px",
      background: "var(--surface-white, #fff)",
      border: "2px solid var(--text-primary)",
      boxShadow: "2px 2px 0px rgba(var(--text-primary-rgb),0.9)",
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <span style={{ fontSize: 12 }}>🎟️</span>
        <span style={{ fontFamily: "var(--font-display, cursive)", fontSize: 12, fontWeight: 700, color: tickets > 0 ? "var(--text-primary)" : "var(--text-disabled)" }}>
          {tickets}
        </span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 3, position: "relative" }}>
        <span style={{ fontSize: 12 }}>💎</span>
        <span style={{ fontFamily: "var(--font-display, cursive)", fontSize: 12, fontWeight: 700, color: gems > 0 ? "var(--text-primary)" : "var(--text-disabled)" }}>
          {gems}
        </span>
        {gems === 0 && (
          <span style={{
            position: "absolute", top: -5, right: -8,
            width: 15, height: 15, borderRadius: "50%", border: "1.5px solid var(--accent-hotpink)",
            background: "var(--accent-hotpink)", color: "#fff", fontSize: 9, fontWeight: 900,
            cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}>
            +
          </span>
        )}
      </span>
    </div>
  );
}

// ─── Pull Overlay ──────────────────────────────────────────────────────────

export default function PullOverlay({ onClose, packCode = "LS", bias = null, tickets = 3, gems = 0, paymentMethod = "tickets", pullCount = 1, initialPityCount = 0, onPackOpened, onCardRevealed }: {
  packCode?: string; bias?: string | null;
  tickets?: number; gems?: number; paymentMethod?: "tickets" | "gems"; pullCount?: number; initialPityCount?: number;
  onClose: () => void;
  onPackOpened?: () => void; onCardRevealed?: (idol: string, rarity: Rarity) => void;
}) {
  const [phase, setPhase] = useState<"pack" | "cards" | "recap">("pack");
  const [pullResults, setPullResults] = useState<PullResult[]>([]);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [recapMethod, setRecapMethod] = useState<"tickets" | "gems">(paymentMethod ?? "tickets");
  const [pityCount, setPityCount] = useState(initialPityCount ?? 0);
  const [bestRarity, setBestRarity] = useState<Rarity | null>(null);
  const [history, setHistory] = useState<PullResult[]>([]);
  const [cardPrices, setCardPrices] = useState<Record<string, number>>({});

  const [isMobile, setIsMobile] = useState(true);
  const isMultiPull = (pullResults.length || pullCount) >= 10;
  const gridCols = isMobile ? 2 : 5;

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const currentCard = pullResults[currentCardIndex];
  const isCurrentRevealed = currentCard && revealedIds.has(currentCard.id);
  const allRevealed = revealedIds.size === pullResults.length;

  const handleOpen = useCallback(async () => {
    const packInfo = getPackInfo(packCode);
    const canAffordTickets = packInfo.costTickets !== undefined && tickets >= packInfo.costTickets;
    const canAffordGems = packInfo.costGems !== undefined && gems >= packInfo.costGems;
    const method = paymentMethod === "gems" ? (canAffordGems ? "gems" : null) : (canAffordTickets ? "tickets" : null);
    if (!method) return;
    try {
      const result = await openPack(packCode, bias, method, pullCount as 1 | 10);
      const newSet = new Set(result.newCardIds ?? []);
      // Best-last sort: commons first, legendary/secret last
      const sorted = [...result.cards].sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
      setPityCount(result.pityCount ?? 0);
      setPullResults(sorted.map((c) => ({
        ...c,
        isNew: newSet.has(c.cardId),
        season: { label: "", ...SEASON_COLORS[c.rarity] },
        meta: { idol: c.idol, group: c.group, pack: c.pack, edition: c.edition, reference: c.reference },
      })));
      onPackOpened?.();
      setPhase("cards");
      setRevealedIds(new Set());
      setBestRarity(null);
      setCurrentCardIndex(0);
      setShowZoom(false);
    } catch (err) {
      console.error(err);
    }
  }, [tickets, gems, packCode, bias, paymentMethod, pullCount, onPackOpened]);

  const handleSelectCard = useCallback((card: PullResult) => {
    const idx = pullResults.indexOf(card);
    if (idx >= 0) setCurrentCardIndex(idx);
    setShowZoom(true);
  }, [pullResults]);

  const handleCloseZoom = useCallback(() => {
    setShowZoom(false);
    if (revealedIds.size === pullResults.length) {
      setShowRecap(true);
    }
  }, [revealedIds.size, pullResults.length, isMultiPull]);

  const handleCardRevealed = useCallback((id: string) => {
    setRevealedIds((prev) => new Set(prev).add(id));
    const card = pullResults.find((c) => c.id === id);
    if (card) {
      setBestRarity((prev) => {
        if (!prev) return card.rarity;
        return RARITY_ORDER.indexOf(card.rarity) > RARITY_ORDER.indexOf(prev) ? card.rarity : prev;
      });
      setHistory((prev) => [card, ...prev].slice(0, 8));
      onCardRevealed?.(card.meta.idol, card.rarity);
      fetch(`/api/market/price?cardId=${card.cardId}&grade=${card.grade}`)
        .then((r) => r.json())
        .then((d) => setCardPrices((prev) => ({ ...prev, [id]: d.suggestedPrice })));
    }
  }, [pullResults, onCardRevealed]);

  const handleNextCard = useCallback(() => {
    if (currentCardIndex < pullResults.length - 1) {
      setCurrentCardIndex((i) => i + 1);
    } else {
      setPhase("recap");
      setShowRecap(true);
    }
  }, [currentCardIndex, pullResults.length]);

  const handleRevealAll = useCallback(() => {
    const unrevealed = pullResults.filter((c) => !revealedIds.has(c.id));
    if (unrevealed.length === 0) return;
    // Check if any legendary+ cards are unrevealed — warn the user
    const hasLegendaryPlus = unrevealed.some((c) => ["legendary", "secret"].includes(c.rarity));
    if (hasLegendaryPlus && !window.confirm("You have Legendary+ cards to reveal. Skip to end anyway?")) {
      return;
    }
    setRevealedIds((prev) => {
      const next = new Set(prev);
      unrevealed.forEach((c) => next.add(c.id));
      return next;
    });
    setBestRarity((prev) => {
      let best = prev;
      for (const c of unrevealed) {
        if (!best || RARITY_ORDER.indexOf(c.rarity) > RARITY_ORDER.indexOf(best)) best = c.rarity;
      }
      return best;
    });
    setHistory((prev) => [...unrevealed.slice().reverse(), ...prev].slice(0, 8));
    setCurrentCardIndex(pullResults.length - 1);
    playReveal(unrevealed.reduce((best, c) =>
      RARITY_ORDER.indexOf(c.rarity) > RARITY_ORDER.indexOf(best) ? c.rarity : best, "common" as Rarity
    ));
  }, [pullResults, revealedIds]);

  const handlePullAgain = useCallback(() => {
    setPhase("pack");
    setPullResults([]);
    setRevealedIds(new Set());
    setCurrentCardIndex(0);
    setShowZoom(false);
    setShowRecap(false);
    setBestRarity(null);
    setHistory([]);
  }, []);

  const cardWidth = isMultiPull ? 0 : useResponsiveCardWidth();
  const gridCardWidth = useGridCardWidth(gridCols);
  const zoomSize = useResponsiveZoomSize();
  const packed = getPackInfo(packCode);
  const canAffordTickets = packed.costTickets !== undefined && tickets >= packed.costTickets;
  const canAffordGems = packed.costGems !== undefined && gems >= packed.costGems;
  const canAfford = paymentMethod === "gems" ? canAffordGems : canAffordTickets;
  const disabledReason = !canAfford ? (paymentMethod === "gems" ? "NO GEMS" : "NO TICKETS") : null;
  const coverImage = packed.coverImage ?? packed.bannerImage;

  return (
    <div style={{
      height: "100vh", width: "100%", overflow: "hidden",
      position: "relative", zIndex: 0,
      userSelect: "none", WebkitUserSelect: "none",
    }}>
      <BackstageDecor />
      <PageMarquee onHome={onClose} />
      <TicketCounter tickets={tickets} gems={gems} />
      <TickerBar />
      <DropRatesPanel packCode={packCode} />
      <LastDropPanel history={history} />

      {/* Header: banner + progress */}
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0, zIndex: 2,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        padding: "0 16px",
      }}>
        <div style={{
          width: "min(560px, 88vw)", height: 90, borderRadius: 12, overflow: "hidden",
          position: "relative", border: "2px solid var(--text-primary)",
          boxShadow: "3px 3px 0px rgba(var(--text-primary-rgb),0.9)",
        }}>
          <img src={getPackInfo(packCode).bannerImage ?? ""} alt="" style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", filter: "brightness(0.7)",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(var(--text-primary-rgb),0.10) 0%, rgba(var(--text-primary-rgb),0.60) 100%)",
          }} />
          <div style={{ position: "absolute", bottom: 6, left: 10 }}>
            <div style={{
              fontFamily: "var(--font-display, cursive)", fontSize: 20, fontWeight: 700,
              color: "var(--surface-white)", textShadow: "2px 2px 0 rgba(var(--text-primary-rgb),0.4)",
            }}>
              {getPackInfo(packCode).name}
            </div>
          </div>
        </div>
        {phase === "cards" && (
          <RevealProgressPips total={pullResults.length} revealed={revealedIds.size} />
        )}
      </div>

      {/* Central content + inline controls */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
        padding: "52px 16px 50px",
        overflow: "auto",
      }}>
        {phase === "pack" && (
          <SystemWindow title={getPackInfo(packCode).name} onClose={onClose}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <PityMeter pityCount={pityCount} />
              <PackDisplay onOpen={handleOpen} disabled={disabledReason} coverImage={coverImage} />
            </div>
          </SystemWindow>
        )}
        {/* Desktop: card grid */}
        {!isMobile && phase === "cards" && (
          isMultiPull ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridCols}, ${gridCardWidth}px)`,
              gap: 16,
              justifyContent: "center",
            }}>
              {pullResults.map((card, i) => (
                <MiniVersoCard key={card.id} card={card} index={i} isRevealed={revealedIds.has(card.id)} onClick={() => handleSelectCard(card)} coverImage={coverImage} cardWidth={gridCardWidth} priceGems={cardPrices[card.id]} />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: "100%", overflow: "hidden" }}>
              {pullResults.map((card, i) => (
                <MiniVersoCard key={card.id} card={card} index={i} isRevealed={revealedIds.has(card.id)} onClick={() => handleSelectCard(card)} coverImage={coverImage} cardWidth={cardWidth} priceGems={cardPrices[card.id]} />
              ))}
            </div>
          )
        )}

        {isMobile && isMultiPull && phase === "cards" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridCols}, ${gridCardWidth}px)`,
            gap: 12,
            justifyContent: "center",
            padding: "0 8px",
          }}>
            {pullResults.map((card, i) => (
              <MiniVersoCard key={card.id} card={card} index={i} isRevealed={revealedIds.has(card.id)} onClick={() => handleSelectCard(card)} coverImage={coverImage} cardWidth={gridCardWidth} priceGems={cardPrices[card.id]} />
            ))}
          </div>
        )}

        {/* Mobile multi-pull bottom controls */}
        {isMobile && isMultiPull && phase === "cards" && (
          <div style={{ display: "flex", justifyContent: "center", gap: 10, paddingBottom: 16 }}>
            <button onClick={handlePullAgain} style={{
              padding: "8px 18px", borderRadius: 10,
              border: "2px solid rgba(var(--text-primary-rgb),0.15)",
              background: "transparent", color: "var(--text-secondary)",
              fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              PULL AGAIN
            </button>
            <button onClick={() => setShowRecap(true)} style={{
              padding: "8px 18px", borderRadius: 10,
              border: "2px solid rgba(var(--text-primary-rgb),0.15)",
              background: "transparent", color: "var(--text-secondary)",
              fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              VIEW RECAP
            </button>
            <button onClick={onClose} style={{
              padding: "8px 18px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
              color: "var(--text-primary)", fontFamily: "var(--font-display)",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              BACK TO SHOP
            </button>
          </div>
        )}

        {/* Mobile: single card at a time */}
        {isMobile && !isMultiPull && (phase === "cards" || phase === "recap") && currentCard && (
          <div style={{ position: "relative", animation: "cardIn 0.3s ease" }}>
            {isCurrentRevealed || phase === "recap" ? (
              <>
                <PhotoCard imageSrc={currentCard.imageSrc} season={currentCard.season} meta={currentCard.meta} rarity={currentCard.rarity} grade={currentCard.grade} width={cardWidth} />
                {currentCard.isNew && (
                  <div style={{
                    position: "absolute", top: -6, left: -6, zIndex: 2,
                    padding: "2px 8px", borderRadius: 6,
                    background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-pink))",
                    color: "var(--surface-white)", fontSize: 9, fontWeight: 800,
                    fontFamily: "var(--font-sans, monospace)", letterSpacing: "1px",
                    border: "1.5px solid var(--surface-white)",
                    boxShadow: "1px 1px 0px rgba(var(--text-primary-rgb),0.3)",
                    transform: "rotate(-6deg)",
                  }}>
                    NEW
                  </div>
                )}
                {cardPrices[currentCard.id] !== undefined && (
                  <div style={{ textAlign: "center", marginTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(var(--text-primary-rgb),0.6)", fontFamily: "var(--font-display)" }}>💎 {cardPrices[currentCard.id]}</span>
                  </div>
                )}
              </>
            ) : (
              <MiniVersoCard card={currentCard} index={0} isRevealed={false} onClick={() => handleSelectCard(currentCard)} coverImage={coverImage} cardWidth={cardWidth} priceGems={cardPrices[currentCard.id]} />
            )}
            {phase === "cards" && isCurrentRevealed && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
                <button onClick={handleNextCard} style={{
                  padding: "8px 24px", borderRadius: 10,
                  border: "2px solid var(--text-primary)",
                  background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
                  color: "var(--text-primary)", fontFamily: "var(--font-display, cursive)",
                  fontSize: 14, letterSpacing: "0.5px", cursor: "pointer",
                }}>
                  {currentCardIndex < pullResults.length - 1 ? "NEXT CARD →" : "✦ RECAP"}
                </button>
              </div>
            )}
          </div>
        )}

        {phase === "cards" && isMobile && !isMultiPull && !isCurrentRevealed && !showZoom && (
          <button onClick={handleRevealAll} style={{
            padding: "6px 16px", borderRadius: 10, border: "1.5px solid rgba(var(--text-primary-rgb),0.15)",
            background: "transparent", color: "var(--text-secondary)",
            fontFamily: "var(--font-sans, monospace)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.5px", cursor: "pointer", touchAction: "manipulation",
          }}>
            REVEAL ALL
          </button>
        )}
      </div>

      {/* Desktop bottom controls — RarityTally + REVEAL ALL / PULL AGAIN + BACK TO SHOP */}
      {!isMobile && phase === "cards" && !showZoom && (
        <div style={{
          position: "absolute", bottom: 44, left: 0, right: 0, zIndex: 2,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        }}>
          <RarityTally pullResults={pullResults} revealedIds={revealedIds} />
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          {allRevealed ? (
            <>
              <button onClick={handlePullAgain} style={{
                padding: "8px 18px", borderRadius: 10,
                border: "1.5px solid rgba(var(--text-primary-rgb),0.15)",
                background: "transparent", color: "var(--text-secondary)",
                fontFamily: "var(--font-sans, monospace)", fontSize: 12, fontWeight: 700,
                cursor: "pointer",
              }}>
                PULL AGAIN
              </button>
              {isMultiPull && (
                <button onClick={() => setShowRecap(true)} style={{
                  padding: "8px 18px", borderRadius: 10,
                  border: "1.5px solid rgba(var(--text-primary-rgb),0.15)",
                  background: "transparent", color: "var(--text-secondary)",
                  fontFamily: "var(--font-sans, monospace)", fontSize: 12, fontWeight: 700,
                  cursor: "pointer",
                }}>
                  VIEW RECAP
                </button>
              )}
              <button onClick={onClose} style={{
                padding: "8px 18px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
                color: "var(--text-primary)", fontFamily: "var(--font-display, cursive)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>
                BACK TO SHOP
              </button>
            </>
          ) : (
            <button onClick={handleRevealAll} style={{
              padding: "6px 16px", borderRadius: 10, border: "1.5px solid rgba(var(--text-primary-rgb),0.15)",
              background: "transparent", color: "var(--text-secondary)",
              fontFamily: "var(--font-sans, monospace)", fontSize: 11, fontWeight: 600,
              letterSpacing: "0.5px", cursor: "pointer",
            }}>
              REVEAL ALL
            </button>
          )}
        </div>
      </div>
      )}

      {/* Recap overlay */}
      {phase === "recap" && (
        <div style={{
          position: "absolute", bottom: 44, left: 0, right: 0, zIndex: 3,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          pointerEvents: "none",
        }}>
          {bestRarity && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, pointerEvents: "auto" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 10, fontFamily: "var(--font-sans, monospace)", fontWeight: 600, letterSpacing: "1.5px" }}>
                BEST PULL
              </span>
              <span style={{
                color: RARITY_COLORS[bestRarity], fontSize: 16,
                fontFamily: "var(--font-sans, monospace)", fontWeight: 700, letterSpacing: "2px",
                textShadow: bestRarity !== "common" ? `0 0 8px ${RARITY_COLORS[bestRarity]}55` : "none",
              }}>
                {RARITY_STARS[bestRarity]} {RARITY_LABELS[bestRarity]}
              </span>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
            <ShareButton pullResults={pullResults} bestRarity={bestRarity} />
            <button onClick={onClose} style={{
              padding: "8px 24px", borderRadius: 10, border: "2px solid var(--text-primary)",
              background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
              color: "var(--text-primary)", fontFamily: "var(--font-display, cursive)",
              fontSize: 14, letterSpacing: "0.5px", cursor: "pointer",
            }}>
              BACK TO SHOP
            </button>
          </div>
        </div>
      )}

      {/* Recap table modal */}
      {showRecap && (() => {
        const packInfo = getPackInfo(packCode);
        const totalValue = pullResults.reduce((sum, card) => sum + (cardPrices[card.id] ?? 0), 0);
        const recapCost = recapMethod === "tickets" ? packInfo.costTickets : packInfo.costGems;
        const recapBalance = recapMethod === "tickets" ? tickets : gems;
        const recapCanAfford = recapCost !== undefined && recapBalance >= recapCost;

        return (
        <div onClick={() => setShowRecap(false)} style={{
          position: "fixed", inset: 0, zIndex: 210,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(var(--text-primary-rgb),0.35)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          cursor: "pointer",
        }}>
          <style>{`
            @keyframes zoomIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
          `}</style>
          <div onClick={(e) => e.stopPropagation()} style={{
            animation: "zoomIn 0.3s ease",
            maxWidth: 520, width: "calc(100vw - 32px)", maxHeight: "90vh", overflowY: "auto",
            borderRadius: 16, border: "2px solid var(--text-primary)",
            boxShadow: "6px 6px 0px rgba(var(--text-primary-rgb),0.9)",
            background: "rgba(var(--surface-white-rgb),0.98)",
            cursor: "default", display: "flex", flexDirection: "column", gap: 0,
          }}>
            <div style={{ padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
                  Pull recap
                </span>
                <button onClick={() => setShowRecap(false)} style={{
                  background: "none", border: "none", cursor: "pointer", padding: 4,
                  fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--text-muted)",
                }}>✕ Close</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pullResults.map((card) => (
                  <div key={card.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10,
                    background: "rgba(var(--surface-white-rgb),0.5)", border: "2px solid rgba(var(--text-primary-rgb),0.08)",
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: RARITY_COLORS[card.rarity],
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)" }}>{card.meta.idol}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>{card.reference}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-display)", minWidth: 80, textAlign: "center" }}>
                      {RARITY_LABELS[card.rarity]}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-display)", minWidth: 60, textAlign: "center" }}>
                      {card.grade.charAt(0).toUpperCase() + card.grade.slice(1)}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", minWidth: 70, textAlign: "right" }}>
                      💎 {(cardPrices[card.id] ?? 0)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(255,20,147,0.06)", border: "2px solid rgba(255,20,147,0.12)",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>Total pack value</span>
                <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>💎 {totalValue}</span>
              </div>
            </div>

            <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
              {packInfo.costTickets !== undefined && (
                <button
                  onClick={() => setRecapMethod("tickets")}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, border: recapMethod === "tickets" ? "2px solid var(--text-primary)" : "2px solid rgba(var(--text-primary-rgb),0.12)",
                    background: recapMethod === "tickets" ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))" : "transparent",
                    color: recapMethod === "tickets" ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-display)",
                  }}>
                  🎟️ {packInfo.costTickets}
                </button>
              )}
              {packInfo.costGems !== undefined && (
                <button
                  onClick={() => setRecapMethod("gems")}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, border: recapMethod === "gems" ? "2px solid var(--text-primary)" : "2px solid rgba(var(--text-primary-rgb),0.12)",
                    background: recapMethod === "gems" ? "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))" : "transparent",
                    color: recapMethod === "gems" ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-display)",
                  }}>
                  💎 {packInfo.costGems}
                </button>
              )}
            </div>

            <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
              <button
                disabled={!recapCanAfford}
                onClick={() => { setShowRecap(false); handleOpen(); }}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                  background: recapCanAfford ? "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))" : "rgba(var(--text-primary-rgb),0.08)",
                  color: recapCanAfford ? "var(--surface-white)" : "var(--text-disabled)",
                  fontWeight: 800, fontSize: 14, cursor: recapCanAfford ? "pointer" : "default", fontFamily: "var(--font-display)", letterSpacing: "1px",
                }}>
                {recapCanAfford ? "Pull again" : "Not enough"}
              </button>
              <button
                onClick={() => { setShowRecap(false); onClose(); }}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10,
                  border: "2px solid rgba(var(--text-primary-rgb),0.12)", background: "transparent",
                  color: "var(--text-secondary)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--font-display)",
                }}>
                Back to Shop
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Zoom overlay for swipe-to-reveal */}
      {showZoom && currentCard && (
        <div onPointerDown={handleCloseZoom} style={{
          position: "fixed", inset: 0, zIndex: 220,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(var(--text-primary-rgb),0.35)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          cursor: "pointer",
          userSelect: "none", WebkitUserSelect: "none",
        }}>
          <style>{`
            @keyframes zoomIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
          `}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ animation: `zoomIn 0.45s cubic-bezier(0.23, 1, 0.32, 1)` }}
          >
            <ZoomedSwipeCard card={currentCard} onReveal={() => handleCardRevealed(currentCard.id)} coverImage={coverImage} zoomW={zoomSize.w} zoomH={zoomSize.h} priceGems={cardPrices[currentCard.id]} />
          </div>
        </div>
      )}
    </div>
  );
}

function PityMeter({ pityCount, threshold = HARD_PITY_THRESHOLD }: { pityCount: number; threshold?: number }) {
  const pct = Math.min(100, (pityCount / threshold) * 100);
  const remaining = threshold - pityCount;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 200 }}>
      <div style={{ height: 4, borderRadius: 2, background: "rgba(var(--text-primary-rgb),0.08)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))", transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 10, fontFamily: "var(--font-sans, monospace)", color: "var(--text-muted)", textAlign: "center" }}>
        {remaining} pulls until guaranteed Legendary+
      </span>
    </div>
  );
}

export { RARITY_STARS } from "@/lib/rarityTheme";


