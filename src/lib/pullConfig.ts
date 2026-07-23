export const CARDS_PER_PACK = 5;
export const PULL_COUNTS = [1, 5] as const;
export type PullCount = (typeof PULL_COUNTS)[number];

export const BUNDLE_PACK_COUNT = 5;
export const BUNDLE_DISCOUNT = 0.2;

export function getPullCost(unitCost: number, count: PullCount): number {
  const subtotal = unitCost * count;
  const discount = count === BUNDLE_PACK_COUNT ? BUNDLE_DISCOUNT : 0;
  return Math.round(subtotal * (1 - discount));
}

export const HARD_PITY_THRESHOLD = 50;
export const HARD_PITY_MIN_RARITY = "legendary" as const;
