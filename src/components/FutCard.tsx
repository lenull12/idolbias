"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Rarity } from "./CardEffects";
import { FUT_RARITY_CONFIG, HOLO_GRADIENT, HOLO_NICKNAME_GRADIENT, NATION_FLAGS } from "@/lib/futConfig";
import { FutEffects } from "./FutCardEffects";

export type FutCardProps = {
  imageSrc: string;
  ovr: number;
  position: string;
  nation: string;
  stats: { tec: number; phy: number; men: number };
  rarity: Rarity;
  name: string;
  nickname?: string;
  styleTag?: string;
  refCode?: string;
  nationLabel?: string;
  positionLabel?: string;
  width?: number;
  zoomed?: boolean;
  startFlipped?: boolean;
  tiltX?: number;
  tiltY?: number;
};

const CARD_RATIO = 1152 / 896;
const BASE_WIDTH = 248;
const SWIPE_THRESHOLD = 30;

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

function borderColor(rarity: Rarity) {
  const map: Record<Rarity, string> = { common: "#3a3a4a", rare: "#5078d8", epic: "#7c3aed", legendary: "#c8960e", secret: "#ff69b4" };
  return map[rarity];
}
function borderWidth(rarity: Rarity) { return rarity === "legendary" || rarity === "secret" ? 3 : rarity === "epic" ? 2.5 : 2; }

// ═══════════════════════════════════════════════════
// FUT CARD BACK (Verso)
// ═══════════════════════════════════════════════════

function FutCardBack(p: FutCardProps) {
  const w = p.width ?? BASE_WIDTH;
  const s = (r: number) => Math.round(w * r);
  const flagUrl = NATION_FLAGS[p.nation];
  const bd = borderColor(p.rarity);
  const bw = borderWidth(p.rarity);
  const cfg = FUT_RARITY_CONFIG[p.rarity];
  return (
    <div style={{
      position: "absolute", inset: 0,
      backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
      borderRadius: s(0.036), overflow: "hidden",
      transform: "rotateY(180deg)",
      border: `${bw}px solid ${bd}`,
      boxShadow: `inset 0 0 0 0.5px ${bd}`,
      background: `linear-gradient(170deg, ${cfg.cardBg}, #0d0d18)`,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: `${s(0.04)} ${s(0.048)} ${s(0.028)}`,
      justifyContent: "space-between",
      ...(p.rarity === "secret" ? { animation: "futSecretBorder 3s ease-in-out infinite" } : {}),
    }}>
      {/* Flag — smaller, with safe margin */}
      {flagUrl && <div style={{ width: s(0.1), height: s(0.1), borderRadius: "50%", overflow: "hidden", border: `${s(0.006)} solid rgba(255,255,255,0.25)`, boxShadow: `0 ${s(0.006)} ${s(0.024)} rgba(0,0,0,0.5)`, background: "#1a1a2e", flexShrink: 0 }}><img src={flagUrl} alt={p.nation} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
      {/* Nation */}
      <div style={{ fontSize: s(0.036), fontWeight: 700, letterSpacing: s(0.02), textTransform: "uppercase", marginTop: s(0.01), color: bd }}>{p.nationLabel ?? p.nation}</div>
      {/* Nickname */}
      {p.nickname && <div style={{ fontSize: s(0.038), fontWeight: 600, letterSpacing: s(0.02), textTransform: "uppercase", marginTop: s(0.006), color: bd, opacity: 0.7, fontFamily: "var(--font-rajdhani), var(--font-sans)" }}>{p.nickname}</div>}
      {/* Name */}
      <div style={{ fontSize: s(0.06), fontWeight: 800, letterSpacing: s(0.016), textTransform: "uppercase", marginTop: s(0.006), fontFamily: cfg.font === "orbitron" ? "var(--font-orbitron), var(--font-sans)" : cfg.font === "rajdhani" ? "var(--font-rajdhani), var(--font-sans)" : "var(--font-sans)", color: p.rarity === "secret" ? "transparent" : "#fff", ...(p.rarity === "secret" ? { background: HOLO_GRADIENT, backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "futAccentSweep 2.5s ease-in-out infinite" } : {}) }}>{p.name}</div>
      {/* Position */}
      <div style={{ fontSize: s(0.03), fontWeight: 600, letterSpacing: s(0.016), textTransform: "uppercase", marginTop: s(0.006), color: bd, opacity: 0.6 }}>{p.position}</div>
      {/* Divider */}
      <div style={{ width: "50%", height: 1, background: `linear-gradient(90deg, transparent, ${bd}44, transparent)`, marginTop: s(0.016) }} />
      {/* Stats */}
      <div style={{ display: "flex", gap: s(0.052), marginTop: s(0.016) }}>
        {(["tec","phy","men"] as const).map(k => (
          <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: s(0.006), minWidth: s(0.14) }}>
            <span style={{ fontSize: s(0.072), fontWeight: 800, fontFamily: "'Courier New', monospace", color: cfg.statColor }}>{p.stats[k]}</span>
            <span style={{ fontSize: s(0.028), fontWeight: 600, letterSpacing: s(0.016), textTransform: "uppercase", color: cfg.statLabelColor }}>{k.toUpperCase()}</span>
          </div>
        ))}
      </div>
      {/* Ref code */}
      {p.refCode && <div style={{ fontSize: s(0.024), fontWeight: 600, letterSpacing: s(0.012), fontFamily: "'Courier New', monospace", color: "#555", marginTop: "auto" }}>{p.refCode}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// FUT CARD FRONT (Recto) — stripped to PhotoCard style
// ═══════════════════════════════════════════════════

function FutCardFront(p: FutCardProps) {
  const w = p.width ?? BASE_WIDTH;
  const s = (r: number) => Math.round(w * r);
  const cfg = FUT_RARITY_CONFIG[p.rarity];
  const flagUrl = NATION_FLAGS[p.nation];
  const bd = borderColor(p.rarity);
  const bw = borderWidth(p.rarity);

  return (
    <div style={{
      position: "absolute", inset: 0,
      backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
      borderRadius: s(0.036), overflow: "hidden",
      border: `${bw}px solid ${bd}`,
      boxShadow: `inset 0 0 0 0.5px ${bd}`,
      background: cfg.cardBg,
      ...(p.rarity === "secret" ? { animation: "futSecretBorder 3s ease-in-out infinite" } : {}),
    }}>
      <FutEffects rarity={p.rarity} tiltX={p.tiltX ?? 0} tiltY={p.tiltY ?? 0} imageSrc={p.imageSrc} width={w} />
      {p.rarity !== "common" && <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: `radial-gradient(ellipse at 50% 28%, ${bd}22 0%, transparent 50%)` }} />}
      {p.rarity !== "common" && <div style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none", background: `linear-gradient(160deg, ${bd}12 0%, transparent 40%, transparent 80%, ${bd}08 100%)` }} />}
      <div style={{ position: "absolute", inset: 0, zIndex: 3 }}>
        <img src={p.imageSrc} alt={p.name} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 12%", display: "block" }} />
      </div>
      <div style={{ position: "absolute", top: s(0.02), left: s(0.024), zIndex: 10, display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
        <span style={{ fontSize: s(0.137), fontWeight: 900, fontFamily: cfg.font === "orbitron" ? "var(--font-orbitron), 'Arial Black', sans-serif" : cfg.font === "rajdhani" ? "var(--font-rajdhani), 'Arial Black', sans-serif" : "'Arial Black', 'Impact', sans-serif", letterSpacing: s(-0.008), color: cfg.ovrColor, textShadow: `0 0 ${s(0.024)} rgba(0,0,0,0.9)` }}>{p.ovr}</span>
        <span style={{ fontSize: s(0.032), fontWeight: 700, letterSpacing: s(0.01), textTransform: "uppercase", marginTop: s(0.016), marginLeft: s(0.004), color: cfg.posColor, textShadow: `0 0 ${s(0.016)} rgba(0,0,0,0.8)` }}>{p.position}</span>
      </div>
      {flagUrl && <div style={{ position: "absolute", top: s(0.02), right: s(0.02), zIndex: 10, width: s(0.105), height: s(0.105), borderRadius: "50%", overflow: "hidden", border: `${s(0.008)} solid rgba(255,255,255,0.25)`, boxShadow: `0 ${s(0.008)} ${s(0.032)} rgba(0,0,0,0.5)`, background: "#1a1a2e" }}><img src={flagUrl} alt={p.nation} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10 }}>
        <div style={{ height: s(0.012), width: "100%", background: p.rarity === "secret" ? HOLO_GRADIENT : cfg.bandAccent, ...(p.rarity === "secret" ? { backgroundSize: "200% 100%", animation: "futAccentSweep 4s ease-in-out infinite" } : {}) }} />
        <div style={{ background: "rgba(4,4,10,0.72)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", padding: `${s(0.016)} ${s(0.04)} ${s(0.02)}`, display: "flex", flexDirection: "column", alignItems: "center", gap: s(0.008), minHeight: s(0.177), justifyContent: "center" }}>
          {p.nickname && <div style={{ fontSize: s(0.028), fontWeight: 600, letterSpacing: s(0.016), textTransform: "uppercase", lineHeight: 1, fontFamily: "var(--font-rajdhani), system-ui, sans-serif", background: HOLO_NICKNAME_GRADIENT, backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "futAccentSweep 3.5s ease-in-out infinite" }}>{p.nickname}</div>}
          <span style={{ fontSize: p.rarity === "secret" ? s(0.04) : p.rarity === "legendary" ? s(0.044) : p.rarity === "epic" ? s(0.052) : s(0.048), fontWeight: 800, letterSpacing: p.rarity === "secret" ? s(0.012) : s(0.008), textTransform: "uppercase", lineHeight: 1, fontFamily: cfg.font === "orbitron" ? "var(--font-orbitron), system-ui, sans-serif" : cfg.font === "rajdhani" ? "var(--font-rajdhani), system-ui, sans-serif" : "system-ui, sans-serif", ...(p.rarity === "secret" ? { background: HOLO_GRADIENT, backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "futAccentSweep 2.5s ease-in-out infinite" } : { color: cfg.nameColor, textShadow: cfg.nameGlow === "none" ? "none" : cfg.nameGlow }) }}>{p.name}</span>
          <div style={{ display: "flex", gap: s(0.056), alignItems: "center" }}>
            {(["tec","phy","men"] as const).map(k => (
              <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: s(0.004), minWidth: s(0.105) }}>
                <span style={{ fontSize: s(0.052), fontWeight: 800, fontFamily: "'Courier New',monospace", lineHeight: 1, color: cfg.statColor }}>{p.stats[k]}</span>
                <span style={{ fontSize: s(0.024), fontWeight: 700, letterSpacing: s(0.008), textTransform: "uppercase", color: cfg.statLabelColor }}>{k.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ZOOM OVERLAY
// ═══════════════════════════════════════════════════

function ZoomOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  return createPortal(<div onPointerDown={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}><style>{`@keyframes futZoomFadeIn{from{opacity:0}to{opacity:1}}@keyframes futZoomCardIn{from{transform:scale(0.88)}to{transform:scale(1)}}`}</style><div onClick={e => e.stopPropagation()} style={{ animation: "futZoomCardIn 0.25s cubic-bezier(0.23,1,0.32,1)" }}>{children}</div></div>, document.body);
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export default function FutCard(props: FutCardProps) {
  const { width = BASE_WIDTH, zoomed, rarity, startFlipped = false } = props;
  const height = Math.round(width * CARD_RATIO);
  const maxTilt = rarity === "legendary" || rarity === "secret" ? 20 : 12;

  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const dragging = useRef(false);
  const startX = useRef(0);
  const swipeFlip = useRef(false);
  const visualBase = useRef(startFlipped ? 180 : 0);
  const [swipeX, setSwipeX] = useState(0);
  const [isFlipped, setIsFlipped] = useState(startFlipped);
  const [isZoomed, setIsZoomed] = useState(false);

  const applyTilt = useCallback((px: number, py: number) => {
    if (!innerRef.current) return;
    const ry = (px - 0.5) * maxTilt * 2;
    const rx = (0.5 - py) * maxTilt * 2;
    setTiltX(rx); setTiltY(ry);
    innerRef.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(1.04)`;
  }, [maxTilt]);

  const resetTilt = useCallback((instant = false) => {
    if (!innerRef.current) return;
    innerRef.current.style.transition = instant ? "none" : "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)";
    innerRef.current.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
    setTiltX(0); setTiltY(0);
    if (instant) { requestAnimationFrame(() => { if (innerRef.current) innerRef.current.style.transition = "transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)"; }); return; }
    setTimeout(() => { if (innerRef.current) innerRef.current.style.transition = "transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)"; }, 500);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging.current) return; setIsInteracting(true);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => { const r = wrapRef.current?.getBoundingClientRect(); if (!r) return; applyTilt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); });
  }, [applyTilt]);

  const handleMouseLeave = useCallback(() => { if (rafRef.current) cancelAnimationFrame(rafRef.current); setIsInteracting(false); resetTilt(); }, [resetTilt]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => { e.stopPropagation(); dragging.current = true; startX.current = e.clientX; swipeFlip.current = false; setIsInteracting(true); resetTilt(true); }, [resetTilt]);

  useEffect(() => {
    const hm = (e: PointerEvent) => { if (!dragging.current) return; const d = e.clientX - startX.current; if (!swipeFlip.current && Math.abs(d) < 3) return; if (Math.abs(d) >= 3) swipeFlip.current = true; setSwipeX(d); };
    const hu = (e: PointerEvent) => { if (!dragging.current) return; dragging.current = false; const d = e.clientX - startX.current; if (Math.abs(d) >= SWIPE_THRESHOLD) { resetTilt(true); visualBase.current += d > 0 ? 180 : -180; setIsFlipped(v => !v); } setSwipeX(0); setIsInteracting(false); };
    window.addEventListener("pointermove", hm); window.addEventListener("pointerup", hu); window.addEventListener("pointercancel", hu);
    return () => { window.removeEventListener("pointermove", hm); window.removeEventListener("pointerup", hu); window.removeEventListener("pointercancel", hu); };
  }, [resetTilt]);

  const handleClick = useCallback(() => { if (zoomed || swipeFlip.current) return; setIsZoomed(true); }, [zoomed]);
  const currentRotation = visualBase.current + Math.max(-180, Math.min(180, swipeX * 0.35));

  return (<>
    <style>{`@keyframes futAccentSweep{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}@keyframes futSecretBorder{0%{border-color:#ff69b4}33%{border-color:#8b5cf6}66%{border-color:#4de8ff}100%{border-color:#ff69b4}}@keyframes futAutoTilt{0%,100%{transform:rotate3d(1,-1,0,2deg)}50%{transform:rotate3d(1,-1,0,-2deg)}}`}</style>

    {isZoomed && createPortal(<ZoomOverlay onClose={() => setIsZoomed(false)}><FutCard {...props} width={Math.min(480, typeof window !== "undefined" ? window.innerWidth * 0.85 : 480)} zoomed startFlipped={isFlipped} /></ZoomOverlay>, document.body)}

    <div ref={wrapRef} style={{ perspective: `${Math.round(width * 3.57)}px`, width, height, display: "inline-block", cursor: dragging.current ? "grabbing" : "grab", userSelect: "none", WebkitUserSelect: "none", animation: isInteracting ? "none" : "futAutoTilt 8s ease-in-out infinite" }}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onPointerDown={handlePointerDown} onClick={handleClick}>
      <div ref={innerRef} style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)", willChange: "transform" }}>
        <div style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d", transition: swipeX !== 0 ? "none" : "transform 0.65s cubic-bezier(0.23, 1, 0.32, 1)", transform: `rotateY(${currentRotation}deg)` }}>
          <FutCardFront {...props} tiltX={tiltX} tiltY={tiltY} />
          <FutCardBack {...props} />
        </div>
      </div>
    </div>
  </>);
}
