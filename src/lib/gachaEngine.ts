import type { Rarity } from "@/components/CardEffects";
import { RARITY_ORDER, BIAS_WEIGHT_MULTIPLIER } from "./gameConfig";
import { rarityFromReference, getCardsByPack, getPackDropRates } from "@/data/cards";

export type ServerCard = {
  id: string;
  cardId: string;
  imageSrc: string;
  rarity: Rarity;
  idol: string;
  group: string;
  pack: string;
  edition: string;
  reference: string;
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
  const weights = candidates.map((c) => (c.idol === bias ? BIAS_WEIGHT_MULTIPLIER : 1));
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return candidates.length - 1;
}

export function generatePull(count: number, packCode: string, bias?: string | null, rateUpMultiplier?: number, rateUpRarities?: string[]): ServerCard[] {
  const weights = getPackDropRates(packCode);
  // Apply rate-up boost to targeted rarities
  if (rateUpMultiplier && rateUpRarities && rateUpMultiplier > 1) {
    for (const r of rateUpRarities) {
      if (r in weights) (weights as any)[r] *= rateUpMultiplier;
    }
  }
  const pool = [...getCardsByPack(packCode)];
  const results: ServerCard[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    let targetRarity: Rarity;
    let candidates: typeof pool;
    let attempts = 0;
    do {
      targetRarity = rollRarity(weights);
      candidates = pool.filter((c) => rarityFromReference(c.reference) === targetRarity);
      attempts++;
    } while (candidates.length === 0 && attempts < 50);
    const card = candidates.length > 0
      ? candidates[pickBiasedIndex(candidates, bias)]
      : pool[Math.floor(Math.random() * pool.length)];
    pool.splice(pool.indexOf(card), 1);
    const rarity = rarityFromReference(card.reference);
    results.push({
      id: `${card.id}-${i}`,
      cardId: card.id,
      imageSrc: card.imageSrc,
      rarity,
      idol: card.idol,
      group: card.group,
      pack: card.pack,
      edition: card.edition,
      reference: card.reference,
    });
  }
  return results;
}
