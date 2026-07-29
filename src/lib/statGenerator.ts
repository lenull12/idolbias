import { CHARACTER_STATS } from "@/data/characterStats";
import {
  type Rarity,
  type TecStats,
  type PhyStats,
  type MenStats,
  type GkStats,
  type SetPieceStats,
} from "@/db/footballSchema";

const PHY_KEYS: (keyof PhyStats)[] = ["vitesse", "acceleration", "endurance", "puissance", "agilite", "detente", "force"];
const MEN_KEYS: (keyof MenStats)[] = ["anticipation", "sangFroid", "leadership", "positionnement", "agressivite", "decision", "workRate", "flair"];
const TEC_KEYS: (keyof TecStats)[] = ["passe", "tir", "dribble", "centre", "tacle", "controle", "jeu_de_tete", "technique"];
const GK_KEYS: (keyof GkStats)[] = ["reflexes", "handling", "aerialReach", "commandArea", "kicking", "rushingOut"];
const SP_KEYS: (keyof SetPieceStats)[] = ["cf", "corners", "penalty", "longThrows"];

const FRAC: Record<Rarity, number> = {
  common: 0.78,
  rare: 0.85,
  epic: 0.91,
  legendary: 1.00,
  secret: 1.12,
};

export { FRAC };

const JITTER = 3;

function seededFloat(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return ((h >>> 0) % 100000) / 100000;
}

function seededGaussianNoise(seedA: string, seedB: string): number {
  const u1 = Math.max(seededFloat(seedA), 1e-6);
  const u2 = seededFloat(seedB);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export interface GeneratedStats {
  tec: TecStats | null;
  gk: GkStats | null;
  phy: PhyStats;
  men: MenStats;
  setPiece: SetPieceStats | null;
  tailleCm: number;
  poidsKg: number;
  piedPrefere: string;
  ovr: number;
}

function scaleStatValue(value: number, frac: number, baseSeed: string, statKey: string): number {
  const seedA = baseSeed + '-' + statKey + '-a';
  const seedB = baseSeed + '-' + statKey + '-b';
  const jitter = Math.max(-JITTER, Math.min(JITTER,
    Math.round(seededGaussianNoise(seedA, seedB) * JITTER)
  ));
  return Math.max(1, Math.min(99, Math.round(value * frac + jitter)));
}

function scaleCategory<T>(
  cs: typeof CHARACTER_STATS[string],
  keys: (keyof T)[],
  frac: number,
  baseSeed: string,
): T {
  const result: Record<string, number> = {};
  for (const k of keys) {
    const statKey = k as string;
    result[statKey] = scaleStatValue((cs.stats as any)[statKey] ?? 0, frac, baseSeed, statKey);
  }
  return result as unknown as T;
}

export function generateStatsForRarity(
  characterId: string,
  rarity: Rarity,
  seed: string,
): GeneratedStats {
  const cs = CHARACTER_STATS[characterId];
  if (!cs) throw new Error(`CharacterStats not found: ${characterId}`);

  const frac = FRAC[rarity];

  const ovrJitter = Math.max(-JITTER, Math.min(JITTER,
    Math.round(seededGaussianNoise(seed + '-jit', seed + '-jit2') * JITTER)
  ));
  const ovr = Math.max(1, Math.min(99, Math.round(cs.base * frac + ovrJitter)));

  const baseSeed = seed + '-' + characterId + '-' + rarity;

  if (cs.isGK) {
    return {
      tec: null,
      gk: scaleCategory<GkStats>(cs, GK_KEYS, frac, baseSeed),
      phy: scaleCategory<PhyStats>(cs, PHY_KEYS, frac, baseSeed),
      men: scaleCategory<MenStats>(cs, MEN_KEYS, frac, baseSeed),
      setPiece: null,
      tailleCm: cs.tailleCm,
      poidsKg: cs.poidsKg,
      piedPrefere: cs.piedPrefere,
      ovr,
    };
  }

  return {
    tec: scaleCategory<TecStats>(cs, TEC_KEYS, frac, baseSeed),
    gk: null,
    phy: scaleCategory<PhyStats>(cs, PHY_KEYS, frac, baseSeed),
    men: scaleCategory<MenStats>(cs, MEN_KEYS, frac, baseSeed),
    setPiece: scaleCategory<SetPieceStats>(cs, SP_KEYS, frac, baseSeed),
    tailleCm: cs.tailleCm,
    poidsKg: cs.poidsKg,
    piedPrefere: cs.piedPrefere,
    ovr,
  };
}
