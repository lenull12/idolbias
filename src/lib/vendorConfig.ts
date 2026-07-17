import type { Rarity } from "@/components/CardEffects";
import type { CardGrade } from "@/db/schema";

export const VENDOR_OFFERS_PER_DAY = 3;

export const VENDOR_MIN_RARITY: Rarity[] = ["rare", "epic", "legendary", "secret"];
export const VENDOR_MIN_GRADE: CardGrade[] = ["pristine", "gem"];

export const VENDOR_DISCOUNT_RANGE: [number, number] = [0.55, 0.85];

// ─── Instant-sell ──────────────────────────────────────────────────────────

export const INSTANT_SELL_PAYOUT_RATE = 0.3;
export const INSTANT_SELL_MAX_RARITY: Rarity[] = ["common", "rare"];
export const INSTANT_SELL_MAX_GRADE: CardGrade[] = ["standard", "fine"];

export function isInstantSellEligible(rarity: Rarity, grade: CardGrade): boolean {
  return INSTANT_SELL_MAX_RARITY.includes(rarity) && INSTANT_SELL_MAX_GRADE.includes(grade);
}
