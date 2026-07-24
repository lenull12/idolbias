import type { Rarity, TecStats, PhyStats, MenStats, GkStats, SetPieceStats, Position12 } from "@/db/footballSchema";
import type { CardGrade } from "@/db/schema";
import { rollGrade } from "./gradeConfig";
import { RARITY_ORDER } from "./gameConfig";
import {
  rarityFromReference,
  getCharacters,
  getPrintsByCharacter,
  getPackDropRates,
  getPackInfo,
  getCharacterById,
} from "@/data/footballCards";
import { generateStatsForRarity } from "./statGenerator";
import { CHARACTER_STATS } from "@/data/characterStats";
import type { Position } from "@/db/footballSchema";
import { HARD_PITY_THRESHOLD, HARD_PITY_MIN_RARITY } from "./pullConfig";

export type ServerCard = {
  id: string;
  printId: string;
  cardId: string;
  imageSrc: string;
  rarity: Rarity;
  grade: CardGrade;
  name: string;
  nickname?: string;
  serial?: number;
  nation: string;
  group: Position;
  position12: Position12;
  characterId: string;
  pack: string;
  edition: string;
  reference: string;
  pityTriggered?: boolean;
  ovr: number;
  tecStats: TecStats | null;
  gkStats: GkStats | null;
  setPieceStats: SetPieceStats | null;
  phyStats: PhyStats;
  menStats: MenStats;
  role?: string;
};

function rollRarity(weights: Record<string, number>): Rarity {
  const total = RARITY_ORDER.reduce((s, r) => s + weights[r], 0);
  let roll = Math.random() * total;
  for (const r of RARITY_ORDER) {
    roll -= weights[r];
    if (roll <= 0) return r;
  }
  return "common";
}

function rarityAtLeast(r: Rarity, floor: Rarity): boolean {
  return RARITY_ORDER.indexOf(r) >= RARITY_ORDER.indexOf(floor);
}

export function generatePull(
  count: number,
  packCode: string,
  _progress?: Record<string, number>,
  pityCountIn = 0,
): { cards: ServerCard[]; pityCountOut: number } {
  const batchSeed = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const weights = getPackDropRates(packCode);
  const edition = getPackInfo(packCode).edition;
  const characters = getCharacters();
  const results: ServerCard[] = [];
  let pityCount = pityCountIn;

  for (let i = 0; i < count; i++) {
    const mustHitHardPity = pityCount + 1 >= HARD_PITY_THRESHOLD;
    const minRarity = mustHitHardPity ? HARD_PITY_MIN_RARITY : undefined;

    let targetRarity = minRarity ?? rollRarity(weights);
    if (minRarity && !rarityAtLeast(targetRarity, minRarity)) {
      targetRarity = minRarity;
    }

    const charIndex = Math.floor(Math.random() * characters.length);
    const character = characters[charIndex];
    const characterPrints = getPrintsByCharacter(character.id);

    const print = characterPrints.find(
      (p) => p.editionCode === edition && p.rarity === targetRarity,
    );
    if (!print) {
      const fallback = characterPrints.find((p) => p.editionCode === edition);
      if (!fallback) continue;
      targetRarity = fallback.rarity as Rarity;
    }

    const usedPrint = print ?? characterPrints.find((p) => p.editionCode === edition)!;

    const seed = `${usedPrint.id}-${batchSeed}-${i}`;
    const cs = CHARACTER_STATS[character.id];
    const position12 = (cs?.position ?? "ST") as Position12;
    const { tec, gk, phy, men, setPiece, ovr } = generateStatsForRarity(character.id, targetRarity, seed);

    results.push({
      id: `${usedPrint.id}-${batchSeed}-${i}`,
      printId: usedPrint.id,
      cardId: usedPrint.id,
      imageSrc: character.photoVariants.standard,
      rarity: targetRarity,
      grade: rollGrade(),
      name: character.name,
      nickname: cs?.nickname ?? "",
      nation: character.nation,
      group: character.defaultPosition,
      position12,
      characterId: character.id,
      pack: packCode,
      edition,
      reference: usedPrint.refCode,
      pityTriggered: mustHitHardPity,
      ovr,
      tecStats: tec,
      gkStats: gk,
      setPieceStats: setPiece,
      phyStats: phy,
      menStats: men,
    });

    pityCount = rarityAtLeast(targetRarity, HARD_PITY_MIN_RARITY) ? 0 : pityCount + 1;
  }

  return { cards: results, pityCountOut: pityCount };
}
