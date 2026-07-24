"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import BackstageDecor from "@/components/BackstageDecor";
import SystemWindow from "@/components/SystemWindow";
import FutCard from "@/components/FutCard";
import type { FutCardProps } from "@/components/FutCard";
import type { Rarity } from "@/components/CardEffects";
import { openPack } from "@/lib/gameActions";
import type { ServerCard } from "@/lib/gachaEngine";
import { startHoldSound, stopHoldSound, playBurst, playFlip, playReveal } from "@/lib/pullSounds";
import { getPackInfo, getPackDropRates, getAllPacks } from "@/data/footballCards";
import { RARITY_ORDER } from "@/lib/gameConfig";
import { NATION_MAP } from "@/lib/futConfig";
import { CARDS_PER_PACK } from "@/lib/pullConfig";
import { FRAC } from "@/lib/statGenerator";

const RARITY_COLORS: Record<string, string> = {
  common: "#3a3a4a", rare: "#5078d8", epic: "#7c3aed", legendary: "#c8960e", secret: "#ff69b4",
};

const RARITY_LABELS: Record<string, string> = {
  common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary", secret: "Secret",
};

const RARITY_STARS: Record<string, string> = {
  common: "★", rare: "★★", epic: "★★★", legendary: "★★★★", secret: "★★★★★",
};

const CARD_W = 224;
const CARD_H = 288;
const ZOOM_W = 515;
const ZOOM_H = 662;
const SWIPE_THRESHOLD = 60;
const HOLD_DURATION = 1800;

function aggregateStats(card: ServerCard): { tec: number; phy: number; men: number } {
  const frac = FRAC[card.rarity] ?? 1;
  const scale = (vals: number[]) => {
    const avgRaw = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    return Math.max(1, Math.min(99, Math.round(avgRaw * frac)));
  };
  const clean = (o: Record<string, any> | null) =>
    Object.values(o ?? {}).filter((v): v is number => typeof v === "number");
  return {
    tec: scale(clean(card.gkStats ?? card.tecStats)),
    phy: scale(clean(card.phyStats)),
    men: scale(clean(card.menStats)),
  };
}

function mapToFutCard(c: ServerCard): FutCardProps {
  const m = NATION_MAP[c.nation];
  return {
    imageSrc: c.imageSrc, ovr: c.ovr, position: c.group, nation: m?.flag ?? c.nation.toUpperCase(),
    stats: aggregateStats(c), rarity: c.rarity as any, name: c.name.toUpperCase(),
    nickname: c.nickname, refCode: c.reference, serial: c.serial,
    nationLabel: m?.label ?? c.nation.toUpperCase(),
    positionLabel: c.group,
    styleTag: `OVR ${c.ovr} · ${c.group}`,
  };
}

type PullResult = ServerCard & { isNew: boolean; futProps: FutCardProps };

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

// ─── Pack Display ──────────────────────────────────────────────────────────

function PackDisplay({ onOpen, disabled, coverImage }: { onOpen: () => void; disabled?: boolean | string | null; coverImage?: string }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "holding" | "opening">("idle");
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = useCallback(() => {
    if (disabled || phase === "opening") return;
    setPhase("holding"); setProgress(0);
    startHoldSound();
    const start = performance.now();
    holdRef.current = setInterval(() => {
      const elapsed = performance.now() - start;
      const next = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(next);
      if (next >= 100) {
        clearInterval(holdRef.current!); holdRef.current = null;
        setPhase("opening");
        stopHoldSound();
        playBurst();
        setTimeout(onOpen, 700);
      }
    }, 30);
  }, [disabled, phase, onOpen]);

  const cancelHold = useCallback(() => {
    if (holdRef.current) clearInterval(holdRef.current);
    holdRef.current = null; setPhase("idle"); setProgress(0);
    stopHoldSound();
  }, []);

  useEffect(() => () => { if (holdRef.current) clearInterval(holdRef.current); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36, userSelect: "none" }}
      onMouseDown={startHold} onMouseUp={cancelHold} onMouseLeave={cancelHold}
      onTouchStart={startHold} onTouchEnd={cancelHold}
      onContextMenu={(e) => e.preventDefault()}>
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
            <div style={{ width: "100%", height: "100%", background: "rgba(0,0,0,0.03)" }} />
          )}
        </div>
        <div style={{ width: 260, height: 2, background: "rgba(0,0,0,0.06)", borderRadius: 1, overflow: "hidden" }}>
          <div style={{
            width: `${progress}%`, height: "100%",
            background: phase === "opening" ? "transparent" : "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))",
            borderRadius: 1, transition: phase === "holding" ? "width 0.05s linear" : "none",
          }} />
        </div>
        {disabled && typeof disabled === "string" && (
          <span style={{ color: "var(--text-disabled)", fontSize: 12, fontFamily: "monospace", fontWeight: 600, letterSpacing: "2px" }}>{disabled}</span>
        )}
        {!disabled && phase === "idle" && (
          <span style={{ color: "var(--text-disabled)", fontSize: 12, fontFamily: "monospace", fontWeight: 600, letterSpacing: "2px" }}>HOLD TO OPEN</span>
        )}
        {!disabled && phase === "holding" && (
          <span style={{ color: "var(--text-disabled)", fontSize: 12, fontFamily: "monospace", fontWeight: 600, letterSpacing: "2px" }}>OPENING...</span>
        )}
      </div>
    </div>
  );
}

// ─── Side panels ─────────────────────────────────────────────────────────────

function DropRatesPanel({ packCode }: { packCode: string }) {
  const rates = getPackDropRates(packCode);
  const total = RARITY_ORDER.reduce((sum, r) => sum + rates[r], 0);
  return (
    <div className="hidden lg:block" style={{ position: "fixed", left: 20, top: "50%", transform: "translateY(-50%)", zIndex: 5 }}>
      <SystemWindow title="Drop Rates" width={150}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {RARITY_ORDER.map((r) => {
            const pct = total > 0 ? (rates[r] / total) * 100 : 0;
            return (
              <div key={r} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "monospace", fontWeight: 600, color: "var(--text-secondary)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: RARITY_COLORS[r] }} />
                  {RARITY_LABELS[r]}
                </span>
                <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "var(--text-secondary)" }}>{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </SystemWindow>
    </div>
  );
}

function LastDropPanel({ history }: { history: PullResult[] }) {
  const [latest, ...rest] = history;
  return (
    <div className="hidden lg:block" style={{ position: "fixed", right: 20, top: "50%", transform: "translateY(-50%)", zIndex: 5 }}>
      <SystemWindow title="Last Drop" width={150}>
        {!latest ? (
          <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 600, color: "var(--text-disabled)" }}>NO DROPS YET</span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src={latest.futProps.imageSrc} alt="" style={{ width: 34, height: 44, objectFit: "cover", borderRadius: 5, border: `1.5px solid ${RARITY_COLORS[latest.rarity]}` }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{latest.futProps.name}</span>
                <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 600, color: RARITY_COLORS[latest.rarity] }}>{RARITY_LABELS[latest.rarity]}</span>
              </div>
            </div>
            {rest.length > 0 && (
              <>
                <div style={{ height: 1, background: "rgba(0,0,0,0.08)" }} />
                {rest.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: RARITY_COLORS[c.rarity], flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.futProps.name}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </SystemWindow>
    </div>
  );
}

// ─── Page Marquee ─────────────────────────────────────────────────────────────

function PageMarquee({ onHome }: { onHome: () => void }) {
  return (
    <>
      <style>{`@keyframes marqueeFoil { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}</style>
      <div style={{
        position: "fixed", top: 10, left: 10, zIndex: 5,
        display: "flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: "8px 8px 6px 6px",
        background: "var(--surface-white, #fff)", border: "2px solid var(--text-primary)",
        boxShadow: "2px 2px 0px rgba(var(--text-primary-rgb),0.9)",
      }}>
        <span onClick={onHome} style={{ fontSize: 12, cursor: "pointer", lineHeight: 1 }}>←</span>
        <span className="hidden lg:inline" style={{
          fontFamily: "var(--font-display, cursive)", fontSize: 13, fontWeight: 700,
          letterSpacing: "0.5px", textTransform: "uppercase",
          backgroundImage: "linear-gradient(100deg, var(--accent-hotpink) 0%, var(--accent-purple) 35%, var(--holo-c, #9EE6FF) 65%, var(--accent-hotpink) 100%)",
          backgroundSize: "300% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", animation: "marqueeFoil 6s ease-in-out infinite",
        }}>
          SCOUT PASS
        </span>
      </div>
    </>
  );
}

// ─── Ticket Counter ──────────────────────────────────────────────────────────

function TicketCounter({ tickets, gems }: { tickets: number; gems: number }) {
  return (
    <div style={{
      position: "fixed", top: 10, right: 10, zIndex: 5,
      display: "flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: "8px 8px 6px 6px",
      background: "var(--surface-white, #fff)", border: "2px solid var(--text-primary)",
      boxShadow: "2px 2px 0px rgba(var(--text-primary-rgb),0.9)",
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <span style={{ fontSize: 12 }}>🎟️</span>
        <span style={{ fontFamily: "var(--font-display, cursive)", fontSize: 12, fontWeight: 700, color: tickets > 0 ? "var(--text-primary)" : "var(--text-disabled)" }}>{tickets}</span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <span style={{ fontSize: 12 }}>💎</span>
        <span style={{ fontFamily: "var(--font-display, cursive)", fontSize: 12, fontWeight: 700, color: gems > 0 ? "var(--text-primary)" : "var(--text-disabled)" }}>{gems}</span>
      </span>
    </div>
  );
}

// ─── Ticker Bar ──────────────────────────────────────────────────────────────

const TICKER_ITEMS = ["✦ SCOUT PASS", "✦ NEW DROPS EVERY WEEK", "✦ GOOD LUCK ON YOUR PULL", "✦ COLLECT 'EM ALL"];

function TickerBar() {
  const content = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <>
      <style>{`@keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 5, height: 30, overflow: "hidden",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "var(--text-primary)",
        borderTop: "2px solid var(--text-primary)",
        display: "flex", alignItems: "center",
      }}>
        <div style={{
          display: "flex", gap: 40, whiteSpace: "nowrap",
          animation: "tickerScroll 22s linear infinite",
          fontFamily: "monospace", fontSize: 12, fontWeight: 600,
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

// ─── Rarity Tally (live, only revealed cards) ───────────────────────────────

function RarityTally({ results, revealedIds }: { results: PullResult[]; revealedIds: Set<string> }) {
  const counts: Partial<Record<string, number>> = {};
  for (const card of results) {
    if (!revealedIds.has(card.id)) continue;
    counts[card.rarity] = (counts[card.rarity] ?? 0) + 1;
  }
  const entries = RARITY_ORDER.filter((r) => counts[r]);
  if (entries.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
      {entries.map((r) => (
        <div key={r} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 8, border: `1.5px solid ${RARITY_COLORS[r]}`, background: "rgba(255,255,255,0.6)" }}>
          <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: RARITY_COLORS[r] }}>{counts[r]}× {RARITY_LABELS[r]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── MiniVersoCard ──────────────────────────────────────────────────────────

function MiniVersoCard({ card, index, onClick, isRevealed, coverImage, cardWidth = CARD_W }: {
  card: PullResult; index: number; onClick: (e: React.MouseEvent) => void; isRevealed: boolean; coverImage?: string; cardWidth?: number;
}) {
  const cardHeight = Math.round(cardWidth * (CARD_H / CARD_W));
  if (isRevealed) {
    return (
      <div style={{ width: cardWidth, height: cardHeight, animation: `cardIn 0.4s ease-out ${index * 0.08}s both`, userSelect: "none", WebkitUserSelect: "none" }}>
        <style>{`@keyframes cardIn { 0% { opacity: 0; transform: translateY(24px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
        <FutCard {...card.futProps} width={cardWidth} />
      </div>
    );
  }
  return (
    <div onClick={onClick} style={{
      width: cardWidth, height: cardHeight, borderRadius: 9, overflow: "hidden", cursor: "pointer",
      position: "relative",
      background: "rgba(var(--surface-white-rgb),0.75)",
      border: coverImage ? "none" : "2px solid rgba(0,0,0,0.06)",
      animation: `cardIn 0.4s ease-out ${index * 0.08}s both`,
      transition: "transform 0.2s",
      userSelect: "none", WebkitUserSelect: "none",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
    >
      <style>{`
        @keyframes cardIn { 0% { opacity: 0; transform: translateY(24px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{
        position: "absolute", inset: 0,
        background: coverImage ? `url("${coverImage}") center/cover` : "rgba(0,0,0,0.03)",
        opacity: 1,
      }} />
    </div>
  );
}

// ─── ZoomedSwipeCard ─────────────────────────────────────────────────────────

function ZoomedSwipeCard({ card, onReveal, coverImage, zoomW = ZOOM_W, zoomH = ZOOM_H }: {
  card: PullResult; onReveal: () => void; coverImage?: string;
  zoomW?: number; zoomH?: number;
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

  if (flipDone) {
    return (
      <div style={{ position: "relative" }}>
        <FutCard {...card.futProps} width={zoomW} zoomed />
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
          ? `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
          : `rotateY(${dragRotation}deg)`,
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: 9, overflow: "hidden",
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          background: coverImage ? `url("${coverImage}") center/cover` : "rgba(0,0,0,0.03)",
        }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 9, overflow: "hidden",
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
        }}>
          <FutCard {...card.futProps} width={zoomW} zoomed />
        </div>
      </div>
    </div>
  );
}

// ─── RecapWindow ────────────────────────────────────────────────────────────

function RecapWindow({ results, revealedIds, bestRarity, onClose }: {
  results: PullResult[]; revealedIds: Set<string>; bestRarity: string | null; onClose: () => void;
}) {
  const counts: Partial<Record<string, number>> = {};
  for (const card of results) {
    if (!revealedIds.has(card.id)) continue;
    counts[card.rarity] = (counts[card.rarity] ?? 0) + 1;
  }
  const revealedResults = results.filter((c) => revealedIds.has(c.id));

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 210,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(var(--text-primary-rgb),0.35)",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      cursor: "pointer",
    }}>
      <style>{`@keyframes recapIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }`}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        animation: "recapIn 0.25s ease-out",
        maxHeight: "92vh", overflowY: "auto",
      }}>
        <SystemWindow title="Pull Recap" width={Math.min(520, typeof window !== "undefined" ? window.innerWidth * 0.9 : 520)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Best pull */}
            {bestRarity && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 600, letterSpacing: "1.5px", color: "var(--text-disabled)" }}>BEST PULL</span>
                <span style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, letterSpacing: "2px", color: RARITY_COLORS[bestRarity] }}>
                  {RARITY_STARS[bestRarity]} {RARITY_LABELS[bestRarity]}
                </span>
              </div>
            )}

            {/* Rarity tally */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {Object.entries(counts).map(([r, n]) => (
                <div key={r} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 8, border: `1.5px solid ${RARITY_COLORS[r]}`, background: "rgba(255,255,255,0.6)" }}>
                  <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: RARITY_COLORS[r] }}>{n}× {RARITY_LABELS[r]}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(var(--text-primary-rgb),0.08)" }} />

            {/* Card list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {revealedResults.map((card, i) => (
                <div key={card.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 10px", borderRadius: 8,
                  background: i % 2 === 0 ? "rgba(var(--text-primary-rgb),0.03)" : "transparent",
                }}>
                  <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 600, color: "var(--text-disabled)", minWidth: 16 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {card.futProps.name}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "var(--text-muted)" }}>
                    OVR {card.ovr}
                  </span>
                  <span style={{
                    fontSize: 9, fontFamily: "monospace", fontWeight: 700, letterSpacing: "1px",
                    padding: "2px 7px", borderRadius: 5,
                    background: RARITY_COLORS[card.rarity],
                    color: "#fff", flexShrink: 0,
                  }}>
                    {RARITY_LABELS[card.rarity]}
                  </span>
                </div>
              ))}
            </div>

            {/* Close */}
            <button onClick={onClose} style={{
              alignSelf: "center", padding: "8px 24px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
              color: "var(--text-primary)", fontFamily: "var(--font-display, cursive)",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              CLOSE
            </button>
          </div>
        </SystemWindow>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FutPullOverlay({
  onClose, packCode = "STANDARD", paymentMethod = "tickets", pullCount = 1,
  tickets: initialTickets, gems: initialGems, refresh,
}: {
  onClose?: () => void; packCode?: string; paymentMethod?: "tickets" | "gems";
  pullCount?: 1 | 5; tickets?: number; gems?: number; refresh?: () => Promise<any>;
}) {
  const [phase, setPhase] = useState<"pack" | "cards" | "recap">("pack");
  const [pullResults, setPullResults] = useState<PullResult[]>([]);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [showZoom, setShowZoom] = useState<string | null>(null);
  const [showRecap, setShowRecap] = useState(false);
  const [history, setHistory] = useState<PullResult[]>([]);
  const [tickets, setTickets] = useState(initialTickets ?? 0);
  const [gems, setGems] = useState(initialGems ?? 0);

  const packInfo = getPackInfo(packCode);
  const coverImage = packInfo.coverImage ?? packInfo.bannerImage;
  const canAffordTickets = packInfo.costTickets !== undefined && tickets >= packInfo.costTickets;
  const canAffordGems = packInfo.costGems !== undefined && gems >= packInfo.costGems;
  const canAfford = paymentMethod === "gems" ? canAffordGems : canAffordTickets;
  const disabledReason = !canAfford ? (paymentMethod === "gems" ? "NO GEMS" : "NO TICKETS") : null;

  const totalBatches = Math.ceil(pullResults.length / CARDS_PER_PACK);
  const batchStart = currentBatchIndex * CARDS_PER_PACK;
  const currentBatch = pullResults.slice(batchStart, batchStart + CARDS_PER_PACK);
  const revealedInBatch = currentBatch.filter((c) => revealedIds.has(c.id));
  const allRevealedInBatch = currentBatch.length > 0 && revealedInBatch.length === currentBatch.length;

  const zoomCard = showZoom ? pullResults.find((c) => c.id === showZoom) ?? null : null;

  const bestRarity = pullResults.reduce<string | null>((best, c) => {
    if (!revealedIds.has(c.id)) return best;
    if (!best || RARITY_ORDER.indexOf(c.rarity as Rarity) > RARITY_ORDER.indexOf(best as Rarity)) return c.rarity;
    return best;
  }, null);

  const cardWidth = useResponsiveCardWidth();
  const zoomSize = useResponsiveZoomSize();

  const handleOpen = useCallback(async () => {
    const method = paymentMethod === "gems" ? (canAffordGems ? "gems" : null) : (canAffordTickets ? "tickets" : null);
    if (!method) return;
    try {
      const result = await openPack(packCode, method, pullCount);
      setTickets(result.wallet.tickets);
      setGems(result.wallet.gems);
      const mapped = result.cards.map((c: ServerCard) => ({
        ...c, isNew: true, futProps: mapToFutCard(c),
      }));
      setPullResults(mapped);
      setPhase("cards");
      setRevealedIds(new Set());
      setCurrentBatchIndex(0);
      setShowZoom(null);
      await refresh?.();
    } catch (err: any) {
      console.error(err);
    }
  }, [packCode, paymentMethod, pullCount, tickets, gems, canAffordTickets, canAffordGems, refresh]);

  const handleCardRevealed = useCallback((id: string) => {
    setRevealedIds((prev) => new Set(prev).add(id));
    const card = pullResults.find((c) => c.id === id);
    if (card) {
      setHistory((prev) => [card, ...prev].slice(0, 8));
      playReveal(card.rarity as Rarity);
    }
  }, [pullResults]);

  const handleRevealAll = useCallback(() => {
    const unflipped = currentBatch.filter((c) => !revealedIds.has(c.id));
    if (unflipped.length === 0) return;
    setRevealedIds((prev) => {
      const next = new Set(prev);
      unflipped.forEach((c) => next.add(c.id));
      return next;
    });
    setHistory((prev) => [...unflipped.slice().reverse(), ...prev].slice(0, 8));
    const bestUnflipped = unflipped.reduce((b, c) =>
      RARITY_ORDER.indexOf(c.rarity as Rarity) > RARITY_ORDER.indexOf(b) ? c.rarity as Rarity : b, "common" as Rarity);
    playReveal(bestUnflipped);
  }, [currentBatch, revealedIds]);

  const goToBatch = useCallback((idx: number) => {
    setCurrentBatchIndex(idx);
    setShowZoom(null);
  }, []);

  const handlePullAgain = useCallback(() => {
    setPhase("pack");
    setPullResults([]);
    setRevealedIds(new Set());
    setCurrentBatchIndex(0);
    setShowZoom(null);
    setHistory([]);
  }, []);

  return (
    <div style={{
      height: "100vh", width: "100%", overflow: "hidden",
      position: "relative", zIndex: 0,
      userSelect: "none", WebkitUserSelect: "none",
    }}>
      <BackstageDecor />
      <PageMarquee onHome={onClose ?? (() => {})} />
      <TicketCounter tickets={tickets} gems={gems} />
      <TickerBar />
      <DropRatesPanel packCode={packCode} />
      <LastDropPanel history={history} />

      {/* Header banner */}
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
          {packInfo.bannerImage && (
            <img src={packInfo.bannerImage} alt="" style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", filter: "brightness(0.7)",
            }} />
          )}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(var(--text-primary-rgb),0.10) 0%, rgba(var(--text-primary-rgb),0.60) 100%)",
          }} />
          <div style={{ position: "absolute", bottom: 6, left: 10 }}>
            <div style={{
              fontFamily: "var(--font-display, cursive)", fontSize: 20, fontWeight: 700,
              color: "var(--surface-white)", textShadow: "2px 2px 0 rgba(var(--text-primary-rgb),0.4)",
            }}>
              {packInfo.name}
            </div>
          </div>
        </div>
        {phase === "cards" && (
          <RevealProgressPips total={pullResults.length} revealed={revealedIds.size} />
        )}
      </div>

      {/* Central content */}
      <div style={{
        position: "absolute", inset: 0, bottom: 30, zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
      }}>
        {phase === "pack" && (
          <SystemWindow title={packInfo.name} onClose={onClose}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <PackDisplay onOpen={handleOpen} disabled={disabledReason} coverImage={coverImage} />
            </div>
          </SystemWindow>
        )}

        {phase === "cards" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {/* Batch card grid */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
              {currentBatch.map((card, i) => (
                <MiniVersoCard
                  key={card.id}
                  card={card}
                  index={i}
                  isRevealed={revealedIds.has(card.id)}
                  onClick={() => setShowZoom(card.id)}
                  coverImage={coverImage}
                  cardWidth={cardWidth}
                />
              ))}
            </div>

            {/* Batch navigation */}
            {totalBatches > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
                <button onClick={() => goToBatch(currentBatchIndex - 1)} disabled={currentBatchIndex === 0} style={{
                  padding: "4px 10px", borderRadius: 6, border: "1.5px solid var(--text-primary)",
                  background: currentBatchIndex === 0 ? "transparent" : "var(--surface-white)",
                  color: currentBatchIndex === 0 ? "var(--text-disabled)" : "var(--text-primary)",
                  cursor: currentBatchIndex === 0 ? "default" : "pointer", fontSize: 11, fontWeight: 700, fontFamily: "monospace",
                }}>←</button>
                <span>{currentBatchIndex + 1}/{totalBatches}</span>
                <button onClick={() => goToBatch(currentBatchIndex + 1)} disabled={!allRevealedInBatch || currentBatchIndex >= totalBatches - 1} style={{
                  padding: "4px 10px", borderRadius: 6, border: "1.5px solid var(--text-primary)",
                  background: !allRevealedInBatch || currentBatchIndex >= totalBatches - 1 ? "transparent" : "var(--surface-white)",
                  color: !allRevealedInBatch || currentBatchIndex >= totalBatches - 1 ? "var(--text-disabled)" : "var(--text-primary)",
                  cursor: !allRevealedInBatch || currentBatchIndex >= totalBatches - 1 ? "default" : "pointer", fontSize: 11, fontWeight: 700, fontFamily: "monospace",
                }}>→</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {phase === "cards" && (
        <div style={{
          position: "absolute", bottom: 44, left: 0, right: 0, zIndex: 2,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        }}>
          <RarityTally results={pullResults} revealedIds={revealedIds} />
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            {allRevealedInBatch && currentBatchIndex >= totalBatches - 1 ? (
              <>
                <button onClick={handlePullAgain} style={{
                  padding: "8px 18px", borderRadius: 10, border: "1.5px solid rgba(var(--text-primary-rgb),0.15)",
                  background: "transparent", color: "var(--text-secondary)",
                  fontFamily: "monospace", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  PULL AGAIN
                </button>
                <button onClick={() => setShowRecap(true)} style={{
                  padding: "8px 18px", borderRadius: 10, border: "1.5px solid rgba(var(--text-primary-rgb),0.15)",
                  background: "transparent", color: "var(--text-secondary)",
                  fontFamily: "monospace", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  VIEW RECAP
                </button>
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
                fontFamily: "monospace", fontSize: 11, fontWeight: 600,
                letterSpacing: "0.5px", cursor: "pointer",
              }}>
                REVEAL ALL
              </button>
            )}
          </div>
        </div>
      )}

      {/* Zoom overlay */}
      {showZoom && zoomCard && (
        <div onPointerDown={() => setShowZoom(null)} style={{
          position: "fixed", inset: 0, zIndex: 220,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(var(--text-primary-rgb),0.35)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          cursor: "pointer", userSelect: "none", WebkitUserSelect: "none",
        }}>
          <style>{`@keyframes zoomIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }`}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ animation: "zoomIn 0.45s cubic-bezier(0.23, 1, 0.32, 1)" }}
          >
            <ZoomedSwipeCard card={zoomCard} onReveal={() => handleCardRevealed(zoomCard.id)} coverImage={coverImage} zoomW={zoomSize.w} zoomH={zoomSize.h} />
          </div>
        </div>
      )}

      {/* Recap overlay */}
      {showRecap && (
        <RecapWindow results={pullResults} revealedIds={revealedIds} bestRarity={bestRarity} onClose={() => setShowRecap(false)} />
      )}
    </div>
  );
}

export { RARITY_LABELS, RARITY_COLORS, RARITY_STARS };