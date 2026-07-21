import type { Rarity } from "@/components/CardEffects";
import type { CardGrade } from "@/db/schema";
import { rollGrade } from "./gradeConfig";
import { RARITY_ORDER, FAVORITE_WEIGHT_MULTIPLIER } from "./gameConfig";
import { rarityFromReference, getCardsByPack, getPackDropRates } from "@/data/cards";
import { TEN_PULL_MIN_RARITY, HARD_PITY_THRESHOLD, HARD_PITY_MIN_RARITY } from "./pullConfig";

export type ServerCard = {
  id: string;
  cardId: string;
  imageSrc: string;
  rarity: Rarity;
  grade: CardGrade;
  idol: string;
  group: string;
  pack: string;
  edition: string;
  reference: string;
  pityTriggered?: boolean;
};

function rollRarity(weights: Record<Rarity, number>): Rarity {
  const total = RARITY_ORDER.reduce((s, r) => s + weights[r], 0);
  let roll = Math.random() * total;
  for (const r of RARITY_ORDER) {
    roll -= weights[r];
    if (roll <= 0) return r;
  }
  return "common";
}

function pickBiasedIndex(candidates: { idol: string }[], bias?: string | null): number {
  if (!bias) return Math.floor(Math.random() * candidates.length);
  const weights = candidates.map((c) => (c.idol === bias ? FAVORITE_WEIGHT_MULTIPLIER : 1));
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return candidates.length - 1;
}

function rarityAtLeast(r: Rarity, floor: Rarity): boolean {
  return RARITY_ORDER.indexOf(r) >= RARITY_ORDER.indexOf(floor);
}

function drawOne(
  pool: any[],
  weights: Record<Rarity, number>,
  bias: string | null | undefined,
  minRarity?: Rarity,
) {
  const w = minRarity
    ? (Object.fromEntries(
        RARITY_ORDER.map((r) => [r, rarityAtLeast(r, minRarity) ? weights[r] : 0]),
      ) as Record<Rarity, number>)
    : weights;

  let attempts = 0;
  let targetRarity: Rarity;
  let candidates: any[];
  do {
    targetRarity = rollRarity(w);
    candidates = pool.filter((c) => rarityFromReference(c.reference) === targetRarity);
    attempts++;
  } while (candidates.length === 0 && attempts < 50);

  if (candidates.length === 0) return null;
  const card = candidates[pickBiasedIndex(candidates, bias)];
  return { card, rarity: targetRarity };
}

export function generatePull(
  count: number,
  packCode: string,
  bias?: string | null,
  rateUpMultiplier?: number,
  rateUpRarities?: string[],
  pityCountIn = 0,
): { cards: ServerCard[]; pityCountOut: number } {
  const weights = { ...getPackDropRates(packCode) };
  if (rateUpMultiplier && rateUpRarities && rateUpMultiplier > 1) {
    for (const r of rateUpRarities) {
      if (r in weights) (weights as any)[r] *= rateUpMultiplier;
    }
  }

  const pool = getCardsByPack(packCode); // reshuffle chaque pull — pas de splice
  const results: ServerCard[] = [];
  let pityCount = pityCountIn;

  for (let i = 0; i < count && pool.length > 0; i++) {
    const mustHitHardPity = pityCount + 1 >= HARD_PITY_THRESHOLD;
    const draw =
      drawOne(pool, weights, bias, mustHitHardPity ? HARD_PITY_MIN_RARITY : undefined) ??
      drawOne(pool, weights, bias);

    if (!draw) break;
    results.push({
      id: `${draw.card.id}-${i}`,
      cardId: draw.card.id,
      imageSrc: draw.card.imageSrc,
      rarity: draw.rarity,
      grade: rollGrade(),
      idol: draw.card.idol,
      group: draw.card.group,
      pack: draw.card.pack,
      edition: draw.card.edition,
      reference: draw.card.reference,
      pityTriggered: mustHitHardPity,
    });
    pityCount = rarityAtLeast(draw.rarity, HARD_PITY_MIN_RARITY) ? 0 : pityCount + 1;
  }

  // Soft pity: garanti au moins un rare+ sur un 10x
  if (count >= 10 && !results.some((c) => rarityAtLeast(c.rarity, TEN_PULL_MIN_RARITY))) {
    const idx = results.length - 1;
    const draw = drawOne(getCardsByPack(packCode), weights, bias, TEN_PULL_MIN_RARITY);
    if (draw && idx >= 0) {
      results[idx] = {
        ...results[idx],
        cardId: draw.card.id,
        imageSrc: draw.card.imageSrc,
        rarity: draw.rarity,
        idol: draw.card.idol,
        group: draw.card.group,
        reference: draw.card.reference,
        pityTriggered: true,
      };
    }
  }

  return { cards: results, pityCountOut: pityCount };
}
