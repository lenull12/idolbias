import type { Rarity } from "@/components/CardEffects";

export const MAX_VOL_MULTIPLIER = 3;
export const MEAN_REVERSION_RATE = 0.03;
export const CLUSTER_SENSITIVITY = 0.6;
export const SALE_INFLUENCE_FACTOR = 0.15;
export const MAX_REPLAY_TICKS = 8760; // 1 year of hourly ticks

export const VOLATILITY_BY_RARITY: Record<Rarity, number> = {
  common: 0.3,
  rare: 0.35,
  epic: 0.4,
  legendary: 0.45,
  secret: 0.5,
};
