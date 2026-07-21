"use client";

import PhotoCard from "@/components/PhotoCard";
import { RARITY_LABELS, SEASON_COLORS, RARITY_BG, RARITY_FG } from "@/lib/rarityTheme";
import type { Rarity } from "@/components/CardEffects";
import type { CardEntry } from "@/data/cards";

const CARD_RATIO = 1152 / 896;

type OwnedProps = {
  mode: "owned";
  card: CardEntry;
  rarity: Rarity;
  owned: Record<string, number>;
  width?: number;
};

type MissingProps = {
  mode: "missing";
  reference: string;
  imageSrc: string;
  rarity: Rarity;
  memberColor: string;
  width?: number;
};

type Props = OwnedProps | MissingProps;

export default function CardSlot(props: Props) {
  const w = props.width ?? 85;
  const h = Math.round(w * CARD_RATIO);

  if (props.mode === "owned") {
    const qty = props.owned[props.card.id] ?? 0;
    return (
      <div style={{ position: "relative" }}>
        <PhotoCard
          imageSrc={props.card.imageSrc}
          season={SEASON_COLORS[props.rarity]}
          meta={{
            idol: props.card.idol,
            group: props.card.group,
            pack: props.card.pack,
            edition: props.card.edition,
            reference: props.card.reference,
          }}
          rarity={props.rarity}
          width={w}
          maxTilt={8}
        />
        {qty > 1 && (
          <div style={{
            position: "absolute", top: 4, right: 4, zIndex: 2,
            padding: "1px 6px", borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent-hotpink), var(--accent-purple))",
            color: "var(--surface-white)", fontSize: 9, fontWeight: 800,
            fontFamily: "var(--font-sans, monospace)",
            boxShadow: "1px 1px 0px rgba(var(--text-primary-rgb),0.3)",
          }}>
            ×{qty}
          </div>
        )}
      </div>
    );
  }

  const fg = RARITY_FG[props.rarity];
  const borderColor = props.rarity === "secret"
    ? "var(--accent-pink)"
    : props.rarity === "legendary"
    ? "var(--rarity-legendary-badge)"
    : fg;

  const boxShadow = props.rarity === "secret"
    ? "0 0 6px rgba(255,105,180,0.3), 0 0 10px rgba(139,92,246,0.2)"
    : props.rarity === "legendary"
    ? "0 0 6px rgba(194,84,46,0.3)"
    : "none";

  return (
    <div style={{
      width: w, height: h, borderRadius: Math.round(w * 0.045),
      overflow: "hidden",
      border: `1.5px solid ${borderColor}`,
      boxShadow,
      position: "relative",
      pointerEvents: "none", userSelect: "none",
    }}>
      {/* Blurred silhouette image */}
      <img
        src={props.imageSrc}
        alt=""
        draggable={false}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          filter: "brightness(0.35) blur(2px) saturate(0.3)",
        }}
      />

      {/* 🔒 icon */}
      <div style={{
        position: "absolute", top: 6, right: 6, zIndex: 1,
        width: Math.round(w * 0.22), height: Math.round(w * 0.22),
        borderRadius: "50%",
        background: "rgba(var(--text-primary-rgb),0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(w * 0.12),
      }}>
        🔒
      </div>

      {/* Reference text */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 4, zIndex: 1,
      }}>
        <span style={{
          fontSize: Math.round(w * 0.1), fontWeight: 600,
          fontFamily: "var(--font-mono, monospace)",
          color: "rgba(var(--text-primary-rgb),0.2)",
          letterSpacing: "0.5px", textAlign: "center",
          padding: "0 4px",
        }}>
          {props.reference}
        </span>
        <span style={{
          display: "inline-block", padding: "1px 8px", borderRadius: 4,
          background: RARITY_BG[props.rarity],
          fontSize: Math.round(w * 0.1), fontWeight: 700, letterSpacing: "1px",
          fontFamily: "var(--font-sans, monospace)",
          opacity: 0.4,
        }}>
          {props.rarity === "secret" ? (
            <span style={{
              backgroundImage: "linear-gradient(90deg, var(--accent-pink), var(--accent-purple))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {RARITY_LABELS[props.rarity]}
            </span>
          ) : (
            <span style={{ color: "var(--text-disabled)" }}>
              {RARITY_LABELS[props.rarity]}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
