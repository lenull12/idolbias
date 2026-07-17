import type { Rarity } from "@/components/CardEffects";

export const RARITY_LETTER: Record<Rarity, string> = {
  common: "C", rare: "R", epic: "E", legendary: "L", secret: "S",
};

export const RARITY_BG: Record<Rarity, string> = {
  common: "rgba(26,10,30,0.03)",
  rare: "rgba(255,158,196,0.06)",
  epic: "rgba(201,177,255,0.06)",
  legendary: "rgba(255,215,0,0.06)",
  secret: "rgba(26,10,30,0.04)",
};

export const RARITY_FG: Record<Rarity, string> = {
  common: "var(--rarity-common)",
  rare: "var(--rarity-rare)",
  epic: "var(--rarity-epic)",
  legendary: "var(--rarity-legendary-badge)",
  secret: "var(--rarity-secret-ink)",
};

export const SEASON_COLORS: Record<Rarity, { color: string; textColor: string }> = {
  common:    { color: "transparent",           textColor: "rgba(255,255,255,0.4)" },
  rare:      { color: "var(--rarity-rare)",    textColor: "var(--surface-white)" },
  epic:      { color: "var(--rarity-epic)",    textColor: "var(--surface-white)" },
  legendary: { color: "var(--rarity-legendary)", textColor: "var(--parchment)" },
  secret:    { color: "transparent",           textColor: "var(--surface-white)" },
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "COMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY",
  secret: "SECRET",
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: "var(--rarity-common)",
  rare: "var(--rarity-rare)",
  epic: "var(--rarity-epic)",
  legendary: "var(--rarity-legendary)",
  secret: "var(--rarity-secret-ink)",
};

export const RARITY_STARS: Record<Rarity, string> = {
  common: "\u2605",
  rare: "\u2605\u2605",
  epic: "\u2605\u2605\u2605",
  legendary: "\u2605\u2605\u2605\u2605",
  secret: "\u2605\u2605\u2605\u2605\u2605",
};
