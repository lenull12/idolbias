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

// ─── 4. Light Leak Effect (Rare) ──────────────────────────────────────────────
//
// Deux couches distinctes, volontairement séparées :
//  1. Le light leak, toujours fixé en haut à gauche — ne bouge jamais.
//  2. Un halo rosé dont seule la POSITION suit le tilt/curseur. La teinte ne
//     dérive plus (pas de hue-rotation) pour rester lisiblement "rose" en toutes
//     circonstances. Intensité volontairement discrète au repos, ne monte que
//     légèrement avec le tilt — cette carte doit rester la plus sobre des
//     rarities "à effet".
//
export function LightLeakEffect({
  tiltX = 0,
  tiltY = 0,
  color = "#FF69B4",
  intensity = 0.8,
}: {
  tiltX?: number;
  tiltY?: number;
  color?: string;
  intensity?: number;
}) {
  const tiltFactor = Math.min((Math.abs(tiltX) + Math.abs(tiltY)) / 15, 1);
  const cx = 50 + tiltY * 2.2;
  const cy = 50 - tiltX * 2.2;

  return (
    <div style={abs({})}>
      {/* Light leak fixe, coin supérieur gauche — inchangé */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 0% 0%, ${color}cc 0%, ${color}55 20%, ${color}22 40%, transparent 60%)`,
          opacity: intensity,
          mixBlendMode: "overlay",
        }}
      />
      {/* Halo rosé qui suit le tilt — position seulement, jamais de dérive de teinte */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at ${cx}% ${cy}%, ${color}40, transparent 55%)`,
          opacity: 0.35 + tiltFactor * 0.25,
          mixBlendMode: "overlay",
          transition: "background 0.1s ease, opacity 0.15s ease",
          willChange: "background, opacity",
        }}
      />
    </div>
  );
}

// ─── 2. Holo Shift Effect (Legendary) ─────────────────────────────────────────
//
// Remplace l'ancien PrismaticEffect (diagonales à angle quasi fixe, peu réactif
// au tilt). Ici, un dégradé arc-en-ciel surdimensionné (250%) dont c'est le
// background-position qui glisse avec le tilt — façon foil holo/shiny carte à
// collectionner. Volontairement discret au repos (opacity basse), l'effet
// "wow" se révèle surtout quand on incline la carte, pas en continu.
//
export function HoloShiftEffect({
  tiltX = 0,
  tiltY = 0,
  maxTilt = 20,
}: EffectBaseProps & { maxTilt?: number }) {
  const px = 50 + (tiltY / maxTilt) * 50;
  const py = 50 - (tiltX / maxTilt) * 50;
  const angle = 115 + tiltX * 1.2;
  const tiltFactor = Math.min((Math.abs(tiltX) + Math.abs(tiltY)) / maxTilt, 1);

  const gradient = `linear-gradient(${angle}deg,
    transparent 0%, #ff2d78 4%, #ff69b4 8%, #ff9a3c 14%, #f5c85c 21%, #f5ff5c 28%,
    #a6ff8a 33%, #4dffb0 38%, #4de8ff 43%, #4dd2ff 48%, #6a9eff 53%, #7c6bff 58%,
    #bf5cff 63%, #ff4de0 68%, transparent 76%, transparent 100%)`;

  return (
    <div style={abs({})}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: gradient,
          backgroundSize: "400% 400%",
          backgroundPosition: `${px}% ${py}%`,
          mixBlendMode: "screen",
          opacity: 0.06 + tiltFactor * 0.08,
          transition: "background-position 0.08s linear, opacity 0.15s ease",
          willChange: "background-position, opacity",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: gradient,
          backgroundSize: "400% 400%",
          backgroundPosition: `${px}% ${py}%`,
          mixBlendMode: "overlay",
          opacity: 0.05 + tiltFactor * 0.07,
          transition: "background-position 0.08s linear, opacity 0.15s ease",
          willChange: "background-position, opacity",
        }}
      />
    </div>
  );
}

// ─── 3. Parallax Depth Effect (Secret) ────────────────────────────────────────

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

// ─── 5. Neon Glow Border (Epic / Secret) ──────────────────────────────────────
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

// ─── 8. Color Pop Effect (Secret) ─────────────────────────────────────────────
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

// ─── 7. Chromatic Banner Pulse (Legendary / Secret) ───────────────────────────
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

// ─── Rarity Effects Selector ───────────────────────────────────────────────────
//
// Progression du "wow" volontaire : common (rien) < rare (sobre, 1 teinte) <
// epic (glow qui pulse) < legendary (holo RGB, mais discret au repos) <
// secret (le combo le plus riche : glow multi-couleur + parallax RGB split +
// color pop + banner pulse). Chaque rarity au-dessus doit toujours se sentir
// plus riche que la précédente, sans jamais devenir criarde au repos.
//
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
          <HoloShiftEffect tiltX={tiltX} tiltY={tiltY} maxTilt={20} />
          <BannerChromaticPulse speed={5} colors={["transparent", "transparent 30%", "rgba(255,215,0,0.4) 45%", "rgba(255,215,0,0.6) 50%", "rgba(255,215,0,0.4) 55%", "transparent 70%", "transparent"]} blendMode="overlay" width={width} />
        </>
      );

    case "secret":
      return (
        <>
          <NeonGlowBorder tiltX={tiltX} tiltY={tiltY} colors={["#FF69B4", "#8B5CF6", "#ffffff"]} pulseSpeed={1.5} />
          <ParallaxDepthEffect imageSrc={imageSrc} tiltX={tiltX} tiltY={tiltY} />
          <ColorPopEffect imageSrc={imageSrc} tiltX={tiltX} tiltY={tiltY} spotSize={35} boost={1.8} />
          <HoloShiftEffect tiltX={tiltX} tiltY={tiltY} maxTilt={20} />
          <BannerChromaticPulse speed={3} blendMode="overlay" width={width} />
        </>
      );

    default:
      return null;
  }
}
