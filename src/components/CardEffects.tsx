"use client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const abs = (s: React.CSSProperties): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  borderRadius: "inherit",
  overflow: "hidden",
  ...s,
});

export type Rarity = "common" | "rare" | "epic" | "legendary" | "secret";

interface EffectBaseProps {
  tiltX?: number;
  tiltY?: number;
  trigger?: boolean;
  color?: string;
}

// ─── 4. Light Leak Effect ────────────────────────────────────────────────────
//
export function LightLeakEffect({
  tiltX = 0,
  tiltY = 0,
  color = "#FF69B4",
  intensity = 0.25,
}: {
  tiltX?: number;
  tiltY?: number;
  color?: string;
  intensity?: number;
}) {
  const tiltFactor = Math.min((Math.abs(tiltX) + Math.abs(tiltY)) / 15, 1);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        borderRadius: "inherit",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 0% 0%, ${color}cc 0%, ${color}55 20%, ${color}22 40%, transparent 60%)`,
          opacity: Math.min(intensity + tiltFactor * 0.15, 0.55),
          mixBlendMode: "overlay",
          transition: "opacity 0.15s ease",
          willChange: "opacity",
        }}
      />
      {/* Tilt color overlay — subtle hue shift */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg,
            hsla(${300 + tiltX * 8}, 60%, 70%, 0.12),
            transparent 50%,
            hsla(${0 + tiltY * 8}, 60%, 70%, 0.08) 100%)`,
          mixBlendMode: "overlay",
          transition: "background 0.2s ease",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── 2. Chromatic RGB Effect — dégradé R/B qui tourne selon le tilt

export function PrismaticEffect({ tiltX = 0, tiltY = 0 }: EffectBaseProps) {
  const tiltFactor = Math.min((Math.abs(tiltX) + Math.abs(tiltY)) / 15, 1);
  const angle = 90 + tiltX * 5;
  const rPos = 20 + tiltX * 2 + tiltY * 1.5;
  const bPos = 80 - tiltX * 2 - tiltY * 1.5;
  const opacity = 0.08 + tiltFactor * 0.25;

  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      borderRadius: "inherit", opacity,
      background: `linear-gradient(${angle}deg, rgba(255,50,50,0.30) ${rPos}%, transparent ${rPos + 10}%, transparent ${bPos - 10}%, rgba(50,100,255,0.30) ${bPos}%)`,
      mixBlendMode: "hard-light" as const,
      transition: "opacity 0.15s",
    }} />
  );
}

// ─── 3. Parallax Depth Effect ─────────────────────────────────────────────────

export function ParallaxDepthEffect({ imageSrc, tiltX = 0, tiltY = 0 }: EffectBaseProps & { imageSrc: string }) {
  const maxShift = 16;
  const channels = [
    { factor: 1.0, filter: "hue-rotate(-55deg) saturate(8) brightness(1.4)", opacity: 0.45, blend: "screen" },
    { factor: 0.6, filter: "hue-rotate(55deg) saturate(8) brightness(1.4)", opacity: 0.35, blend: "screen" },
    { factor: 0.25, filter: "brightness(0.7)", opacity: 0.25, blend: "luminosity" },
    { factor: 0.0, filter: "none", opacity: 0.75, blend: "normal" },
  ];

  return (
    <div style={abs({ borderRadius: "inherit" })}>
      {channels.map((ch, i) => {
        const shiftX = tiltY * ch.factor * (maxShift / 15);
        const shiftY = -tiltX * ch.factor * (maxShift / 15);
        return (
          <div key={i} style={{ position: "absolute", inset: 0, transform: `translate(${shiftX}px, ${shiftY}px)`, transition: "transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)", willChange: "transform" }}>
            <img src={imageSrc} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: `calc(100% + ${Math.abs(shiftX) * 2}px)`, height: `calc(100% + ${Math.abs(shiftY) * 2}px)`, marginLeft: `-${Math.abs(shiftX)}px`, marginTop: `-${Math.abs(shiftY)}px`, objectFit: "cover", objectPosition: "center top", opacity: ch.opacity, filter: ch.filter, userSelect: "none", pointerEvents: "none", mixBlendMode: ch.blend as any }} />
          </div>
        );
      })}
    </div>
  );
}

// ─── 5. Neon Glow Border ──────────────────────────────────────────────────────
//
export function NeonGlowBorder({
  tiltX = 0,
  tiltY = 0,
  color = "var(--effect-glow-default)",
  colors,
  active = true,
  pulseSpeed = 2,
}: EffectBaseProps & {
  color?: string;
  colors?: string[];
  active?: boolean;
  pulseSpeed?: number;
}) {
  const glowFactor = active
    ? 0.35 + Math.min((Math.abs(tiltX) + Math.abs(tiltY)) / 15, 1) * 0.25
    : 0.35;

  const gradient = colors
    ? `linear-gradient(90deg, transparent 0%, ${colors.map((c, i) => `${c}88 ${(i + 1) * 25}%`).join(", ")}, transparent 100%)`
    : `linear-gradient(90deg, transparent 0%, ${color}22 25%, ${color}55 50%, ${color}22 75%, transparent 100%)`;

  return (
    <>
      <style>{`
        @keyframes neonSweep {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div
        style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            background: gradient,
          backgroundSize: "200% 100%",
          animation: "neonSweep " + pulseSpeed * 2 + "s ease-in-out infinite",
          opacity: glowFactor,
          transition: "opacity 0.15s ease",
        }}
      />
    </>
  );
}

// ─── 8. Color Pop Effect ─────────────────────────────────────────────────────
// Spot de saturation qui suit le tilt sur l'image normale.
//
export function ColorPopEffect({
  tiltX = 0,
  tiltY = 0,
  imageSrc,
  spotSize = 35,
  boost = 1.6,
}: EffectBaseProps & { imageSrc: string; spotSize?: number; boost?: number }) {
  const cx = 50 + tiltX * 3.5;
  const cy = 50 + tiltY * 3.5;

  return (
    <div style={abs({ borderRadius: "inherit" })}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          WebkitMaskImage: `radial-gradient(circle at ${cx}% ${cy}%, black 0%, black ${spotSize * 0.3}%, transparent ${spotSize}%)`,
          maskImage: `radial-gradient(circle at ${cx}% ${cy}%, black 0%, black ${spotSize * 0.3}%, transparent ${spotSize}%)`,
          transition: "mask-image 0.15s cubic-bezier(0.23, 1, 0.32, 1), -webkit-mask-image 0.15s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <img src={imageSrc} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", filter: `saturate(${boost}) contrast(1.05)`, userSelect: "none", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

// ─── 7. Chromatic Banner Pulse
// Fait pulser lentement la teinte du bandeau bas entre deux couleurs.
//
export function BannerChromaticPulse({
  speed = 4,
  colors = ["rgba(200,240,0,0.6)", "rgba(255,100,200,0.6)", "rgba(100,200,255,0.6)"],
  blendMode,
  width = 224,
}: {
  speed?: number;
  colors?: string[];
  blendMode?: string;
  width?: number;
}) {
  const r = Math.round(width * 0.045);
  return (
    <>
      <style>{`
        @keyframes bannerGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: Math.round(width * 0.078),
          pointerEvents: "none",
          borderRadius: `0 0 ${r}px ${r}px`,
          overflow: "hidden",
          zIndex: 2,
          background: `linear-gradient(90deg, ${colors.join(", ")})`,
          backgroundSize: "300% 100%",
          animation: `bannerGradient ${speed}s ease-in-out infinite`,
          ...(blendMode ? { mixBlendMode: blendMode as any } : {}),
        }}
      />
    </>
  );
}

// ─── Rarity Effects Selector

export function RarityEffects({
  rarity,
  tiltX,
  tiltY,
  imageSrc,
  width,
}: {
  rarity: Rarity;
  tiltX: number;
  tiltY: number;
  imageSrc: string;
  width?: number;
}) {
  switch (rarity) {
    case "common":
      return null;

    case "rare":
      return (
        <>
          <LightLeakEffect tiltX={tiltX} tiltY={tiltY} color="#FF69B4" intensity={0.4} />
        </>
      );

    case "epic":
      return (
        <>
          <NeonGlowBorder tiltX={tiltX} tiltY={tiltY} color="#A78BFA" pulseSpeed={1.5} />
        </>
      );

    case "legendary":
      return (
        <>
          <PrismaticEffect tiltX={tiltX} tiltY={tiltY} />
          <BannerChromaticPulse speed={5} colors={["transparent", "transparent 30%", "rgba(255,215,0,0.4) 45%", "rgba(255,215,0,0.6) 50%", "rgba(255,215,0,0.4) 55%", "transparent 70%", "transparent"]} blendMode="overlay" width={width} />
        </>
      );

    case "secret":
      return (
        <>
          <NeonGlowBorder tiltX={tiltX} tiltY={tiltY} colors={["#FF69B4", "#8B5CF6", "#ffffff"]} pulseSpeed={1.5} />
          <ParallaxDepthEffect imageSrc={imageSrc} tiltX={tiltX} tiltY={tiltY} />
          <ColorPopEffect imageSrc={imageSrc} tiltX={tiltX} tiltY={tiltY} spotSize={35} boost={1.8} />
          <BannerChromaticPulse speed={3} blendMode="overlay" width={width} />
        </>
      );

    default:
      return null;
  }
}
