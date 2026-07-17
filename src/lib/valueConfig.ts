import type { Rarity } from "@/components/CardEffects";
import type { CardGrade } from "@/db/schema";
import { GRADE_VALUE_MULTIPLIER } from "./gradeConfig";
import { getCardById, rarityFromReference } from "@/data/cards";

export const RARITY_MULTIPLIER: Record<Rarity, number> = {
  common: 0.5,
  rare: 1,
  epic: 2.5,
  legendary: 8,
  secret: 20,
};

export const PACK_BASE_VALUE: Record<string, number> = {
  NR: 10,
  LS: 10,
  BF: 10,
};
const DEFAULT_PACK_BASE_VALUE = 10;

export function getPackBaseValue(packCode: string): number {
  return PACK_BASE_VALUE[packCode] ?? DEFAULT_PACK_BASE_VALUE;
}

export function baseValue(packCode: string, rarity: Rarity, grade: CardGrade): number {
  const base = getPackBaseValue(packCode);
  const rarityMult = RARITY_MULTIPLIER[rarity] ?? 1;
  const gradeMult = GRADE_VALUE_MULTIPLIER[grade] ?? 1;
  return Math.round(base * rarityMult * gradeMult);
}

export function getCardBaseValue(cardId: string, grade: CardGrade): number {
  const card = getCardById(cardId);
  if (!card) return 0;
  const rarity = rarityFromReference(card.reference);
  const desirability = card.desirabilityMultiplier ?? 1;
  return Math.round(baseValue(card.packCode, rarity, grade) * desirability);
}
