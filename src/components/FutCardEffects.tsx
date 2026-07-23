"use client";

import type { Rarity } from "./CardEffects";
import { HoloShiftEffect, NeonGlowBorder, BannerChromaticPulse } from "./CardEffects";
import { FUT_RARITY_CONFIG, HOLO_GRADIENT } from "@/lib/futConfig";

function ScanlinesPattern() {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", borderRadius: 6,
      opacity: 0.12,
      background: "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(91,141,239,0.5) 3px, rgba(91,141,239,0.5) 4px)",
    }} />
  );
}

function CircuitPattern() {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", borderRadius: 6,
      opacity: 0.15,
      background: [
        "linear-gradient(155deg, transparent 48%, rgba(139,92,246,0.6) 48%, rgba(139,92,246,0.6) 49%, transparent 49%)",
        "linear-gradient(25deg, transparent 58%, rgba(167,139,250,0.5) 58%, rgba(167,139,250,0.5) 59%, transparent 59%)",
        "linear-gradient(115deg, transparent 68%, rgba(124,58,237,0.7) 68%, rgba(124,58,237,0.7) 69%, transparent 69%)",
      ].join(", "),
    }} />
  );
}

function SunburstPattern() {
  const rays = Array.from({ length: 18 }, (_, i) => {
    const deg = i * 20;
    const alpha = i % 3 === 0 ? 0.3 : i % 3 === 1 ? 0.25 : 0.2;
    return `transparent ${deg}deg, rgba(232,182,90,${alpha}) ${deg + 2}deg, transparent ${deg + 4}deg`;
  }).join(", ");
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", borderRadius: 6,
      opacity: 0.2,
      background: `conic-gradient(from 0deg at 50% 0%, ${rays}, transparent 360deg)`,
    }} />
  );
}

function AuroraPattern() {
  return (
    <>
      <style>{`@keyframes futAuroraDrift { 0%,100% { background-position: 0% 0%, 0% 10%, 0% -5%; } 50% { background-position: 15% 5%, -10% -5%, 10% 8%; } }`}</style>
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", borderRadius: 6,
        opacity: 0.18,
        background: [
          "linear-gradient(115deg, transparent 30%, rgba(255,105,180,0.35) 32%, rgba(138,92,246,0.15) 36%, transparent 38%)",
          "linear-gradient(125deg, transparent 52%, rgba(100,200,255,0.2) 55%, rgba(255,180,220,0.12) 59%, transparent 61%)",
          "linear-gradient(108deg, transparent 72%, rgba(138,92,246,0.25) 75%, rgba(255,105,180,0.1) 79%, transparent 81%)",
        ].join(", "),
        backgroundSize: "100% 100%",
        animation: "futAuroraDrift 6s ease-in-out infinite",
      }} />
    </>
  );
}

function Particles({ rarity }: { rarity: Rarity }) {
  if (rarity !== "legendary" && rarity !== "secret") return null;
  const color = rarity === "legendary" ? "#f5d700" : "#ff69b4";
  const accent = rarity === "legendary" ? "rgba(245,215,0,0.5)" : "rgba(138,92,246,0.4)";
  return (
    <>
      <style>{`
        @keyframes futPt1 { 0%,100%{opacity:0;transform:scale(0)translate(0,0);}15%{opacity:1;transform:scale(1.5)translate(10px,-20px);}45%{opacity:0.6;transform:scale(0.8)translate(30px,-50px);}75%{opacity:0.15;transform:scale(0.4)translate(20px,-40px);} }
        @keyframes futPt2 { 0%,100%{opacity:0;transform:scale(0)translate(0,0);}20%{opacity:0.8;transform:scale(1.3)translate(-15px,-25px);}55%{opacity:0.4;transform:scale(0.7)translate(-35px,-60px);}85%{opacity:0.1;transform:scale(0.3)translate(-25px,-45px);} }
        @keyframes futPt3 { 0%,100%{opacity:0;transform:scale(0)translate(0,0);}12%{opacity:0.7;transform:scale(1)translate(20px,15px);}40%{opacity:0.35;transform:scale(0.6)translate(40px,30px);}70%{opacity:0.1;transform:scale(0.3)translate(30px,20px);} }
        @keyframes futPt4 { 0%,100%{opacity:0;transform:scale(0)translate(0,0);}25%{opacity:0.65;transform:scale(1.1)translate(-10px,10px);}50%{opacity:0.25;transform:scale(0.5)translate(-25px,25px);}80%{opacity:0.08;transform:scale(0.2)translate(-15px,15px);} }
        @keyframes futPt5 { 0%,100%{opacity:0;transform:scale(0)translate(0,0);}10%{opacity:0.55;transform:scale(1.4)translate(5px,-30px);}35%{opacity:0.25;transform:scale(0.7)translate(15px,-70px);}65%{opacity:0.08;transform:scale(0.3)translate(10px,-50px);} }
      `}</style>
      {[1,2,3,4,5].map((n) => (
        <div key={n} style={{
          position: "absolute", zIndex: 15, pointerEvents: "none",
          borderRadius: "50%", opacity: 0, top: "50%", left: "50%",
          width: 1, height: 1, background: "#fff",
          boxShadow: `0 0 6px 1px ${color}, 0 0 14px 3px ${accent}`,
          animation: `futPt${n} ${2.5 + n * 0.3}s ease-out infinite ${n * 0.4}s`,
        }} />
      ))}
    </>
  );
}

function HoloSweep({ speed = 2.2 }: { speed?: number }) {
  return (
    <>
      <style>{`@keyframes futHoloSweep { 0%,100% { background-position: 0% 0%; } 50% { background-position: 100% 100%; } }`}</style>
      <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: "-40% -10%",
          background: "linear-gradient(115deg,transparent 30%,rgba(255,255,255,0.5)45%,rgba(255,200,230,0.5)48%,rgba(200,220,255,0.45)51%,transparent 62%,transparent 100%)",
          backgroundSize: "220% 220%",
          mixBlendMode: "soft-light",
          animation: `futHoloSweep ${speed}s ease-in-out infinite`,
        }} />
      </div>
    </>
  );
}

// ─── Selectors ───

export function FutPattern({ rarity }: { rarity: Rarity }) {
  switch (FUT_RARITY_CONFIG[rarity].pattern) {
    case "scanlines": return <ScanlinesPattern />;
    case "circuit":   return <CircuitPattern />;
    case "sunburst":  return <SunburstPattern />;
    case "aurora":    return <AuroraPattern />;
    default:          return null;
  }
}

export function FutEffects({ rarity, tiltX = 0, tiltY = 0, imageSrc = "", width }: {
  rarity: Rarity;
  tiltX?: number;
  tiltY?: number;
  imageSrc?: string;
  width?: number;
}) {
  return (
    <>
      <FutPattern rarity={rarity} />
      {/* Particles removed entirely */}

      {/* Transposed CardEffects */}
      {rarity === "legendary" && (
        <>
          <HoloShiftEffect tiltX={tiltX} tiltY={tiltY} maxTilt={20} />
          <HoloSweep speed={6} />
          <BannerChromaticPulse speed={10} colors={["transparent", "transparent 40%", "rgba(255,215,0,0.15) 45%", "rgba(255,215,0,0.25) 50%", "rgba(255,215,0,0.15) 55%", "transparent 60%", "transparent"]} blendMode="overlay" width={width} />
        </>
      )}
      {rarity === "secret" && (
        <>
          <NeonGlowBorder tiltX={tiltX} tiltY={tiltY} colors={["#FF69B4", "#8B5CF6", "#ffffff"]} pulseSpeed={1.5} />
          <HoloShiftEffect tiltX={tiltX} tiltY={tiltY} maxTilt={20} />
          <HoloSweep speed={4} />
          <BannerChromaticPulse speed={3} blendMode="overlay" width={width} />
        </>
      )}
      {rarity === "epic" && (
        <NeonGlowBorder tiltX={tiltX} tiltY={tiltY} color="#A78BFA" pulseSpeed={1.5} />
      )}
    </>
  );
}
