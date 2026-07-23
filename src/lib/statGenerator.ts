import { CHARACTER_STATS } from "@/data/characterStats";
import {
  type Rarity,
  type TecStats,
  type PhyStats,
  type MenStats,
} from "@/db/footballSchema";

type StatKey = keyof TecStats | keyof PhyStats | keyof MenStats;

const TEC_KEYS: (keyof TecStats)[] = ["passe", "tir", "dribble", "centre", "tacle", "controle"];
const PHY_KEYS: (keyof PhyStats)[] = ["vitesse", "acceleration", "endurance", "puissance", "agilite", "detente"];
const MEN_KEYS: (keyof MenStats)[] = ["anticipation", "sangFroid", "leadership", "positionnement", "agressivite", "decision"];
const ALL_STAT_KEYS: StatKey[] = [...TEC_KEYS, ...PHY_KEYS, ...MEN_KEYS];

const FRAC: Record<Rarity, number> = {
  common: 0.78,
  rare: 0.85,
  epic: 0.91,
  legendary: 1.00,
  secret: 1.12,
};

export { FRAC };

const JITTER = 3;

export type StatShape = Record<StatKey, number>;

export function buildStatShape(peaks: Partial<Record<StatKey, number>>): StatShape {
  const shape = Object.fromEntries(ALL_STAT_KEYS.map((k) => [k, peaks[k] ?? 1])) as StatShape;
  const avg = ALL_STAT_KEYS.reduce((s, k) => s + shape[k], 0) / ALL_STAT_KEYS.length;
  for (const k of ALL_STAT_KEYS) shape[k] = shape[k] / avg;
  return shape;
}

export const STYLE_SHAPES: Record<"percussion" | "vista" | "pressing" | "elevation" | "sangFroid", StatShape> = {
  percussion: buildStatShape({ vitesse: 1.3, acceleration: 1.3, puissance: 1.25, agressivite: 1.2, tacle: 0.8, sangFroid: 0.75 }),
  vista: buildStatShape({ passe: 1.3, decision: 1.25, dribble: 1.2, controle: 1.15, tacle: 0.75, puissance: 0.8 }),
  pressing: buildStatShape({ agressivite: 1.3, endurance: 1.25, tacle: 1.25, positionnement: 1.15, dribble: 0.75, sangFroid: 0.8 }),
  elevation: buildStatShape({ detente: 1.35, puissance: 1.2, positionnement: 1.15, centre: 1.1, vitesse: 0.85, passe: 0.8 }),
  sangFroid: buildStatShape({ sangFroid: 1.35, tir: 1.25, controle: 1.15, decision: 1.1, agressivite: 0.75, endurance: 0.85 }),
};

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

function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v));
}

function splitStats(raw: Record<StatKey, number>): { tec: TecStats; phy: PhyStats; men: MenStats } {
  return {
    tec: Object.fromEntries(TEC_KEYS.map((k) => [k, raw[k]])) as unknown as TecStats,
    phy: Object.fromEntries(PHY_KEYS.map((k) => [k, raw[k]])) as unknown as PhyStats,
    men: Object.fromEntries(MEN_KEYS.map((k) => [k, raw[k]])) as unknown as MenStats,
  };
}

function targetRawAverage(targetOVR: number): number {
  return (targetOVR / 99) * 20;
}

function adjustLeastWeightedStat(
  raw: Record<StatKey, number>,
  weights: Partial<Record<StatKey, number>>,
  ovrGapPoints: number,
): void {
  if (ovrGapPoints === 0) return;
  const sorted = [...ALL_STAT_KEYS].sort((a, b) => (weights[a] ?? 1) - (weights[b] ?? 1));
  const target = sorted[0];
  const delta = Math.round(ovrGapPoints * 3);
  raw[target] = clamp(1, 20, raw[target] + delta);
}

export interface GeneratedStats {
  tec: TecStats;
  phy: PhyStats;
  men: MenStats;
  ovr: number;
}

export function generateStatsForRarity(
  characterId: string,
  rarity: Rarity,
  seed: string,
): GeneratedStats {
  const cs = CHARACTER_STATS[characterId];
  if (!cs) throw new Error(`CharacterStats not found: ${characterId}`);

  const jitter = Math.max(-JITTER, Math.min(JITTER, Math.round(seededGaussianNoise(seed + '-jit', seed + '-jit2') * JITTER)));
  const ovr = Math.max(1, Math.min(99, Math.round(cs.base * FRAC[rarity] + jitter)));

  if (cs.isGK) {
    const rawTec: TecStats = {
      passe: cs.stats.reflexes ?? 0,
      tir: cs.stats.handling ?? 0,
      dribble: cs.stats.aerialReach ?? 0,
      centre: cs.stats.commandArea ?? 0,
      tacle: cs.stats.kicking ?? 0,
      controle: cs.stats.rushingOut ?? 0,
    };
    const rawPhy: PhyStats = {
      vitesse: cs.stats.vitesse ?? 0,
      acceleration: cs.stats.acceleration ?? 0,
      endurance: cs.stats.endurance ?? 0,
      puissance: cs.stats.puissance ?? 0,
      agilite: cs.stats.agilite ?? 0,
      detente: cs.stats.detente ?? 0,
    };
    const rawMen: MenStats = {
      anticipation: cs.stats.anticipation ?? 0,
      sangFroid: cs.stats.sangFroid ?? 0,
      leadership: cs.stats.leadership ?? 0,
      positionnement: cs.stats.positionnement ?? 0,
      agressivite: cs.stats.agressivite ?? 0,
      decision: cs.stats.decision ?? 0,
    };
    return { tec: rawTec, phy: rawPhy, men: rawMen, ovr };
  }

  const raw = splitStats(cs.stats as Record<StatKey, number>);
  return { ...raw, ovr };
}
