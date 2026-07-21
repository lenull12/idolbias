import type { Rarity } from "@/components/CardEffects";

export const PULL_COUNTS = [1, 10] as const;
export type PullCount = (typeof PULL_COUNTS)[number];

export function getPullCost(unitCost: number, count: PullCount): number {
  return unitCost * count;
}

export const TEN_PULL_MIN_RARITY: Rarity = "rare";
export const HARD_PITY_THRESHOLD = 50;
export const HARD_PITY_MIN_RARITY: Rarity = "legendary";
