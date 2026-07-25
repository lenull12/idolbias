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

function extractPhy(cs: typeof CHARACTER_STATS[string]): PhyStats {
  return Object.fromEntries(PHY_KEYS.map((k) => [k, cs.stats[k] ?? 0])) as unknown as PhyStats;
}

function extractMen(cs: typeof CHARACTER_STATS[string]): MenStats {
  return Object.fromEntries(MEN_KEYS.map((k) => [k, cs.stats[k] ?? 0])) as unknown as MenStats;
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

  const phy = extractPhy(cs);
  const men = extractMen(cs);

  if (cs.isGK) {
    return {
      tec: null,
      gk: {
        reflexes: cs.stats.reflexes ?? 0,
        handling: cs.stats.handling ?? 0,
        aerialReach: cs.stats.aerialReach ?? 0,
        commandArea: cs.stats.commandArea ?? 0,
        kicking: cs.stats.kicking ?? 0,
        rushingOut: cs.stats.rushingOut ?? 0,
      },
      phy,
      men,
      setPiece: null,
      tailleCm: cs.tailleCm,
      poidsKg: cs.poidsKg,
      piedPrefere: cs.piedPrefere,
      ovr,
    };
  }

  return {
    tec: {
      passe: cs.stats.passe ?? 0,
      tir: cs.stats.tir ?? 0,
      dribble: cs.stats.dribble ?? 0,
      centre: cs.stats.centre ?? 0,
      tacle: cs.stats.tacle ?? 0,
      controle: cs.stats.controle ?? 0,
      jeu_de_tete: cs.stats.jeu_de_tete ?? 0,
      technique: cs.stats.technique ?? 0,
    },
    gk: null,
    phy,
    men,
    setPiece: {
      cf: cs.stats.cf ?? 0,
      corners: cs.stats.corners ?? 0,
      penalty: cs.stats.penalty ?? 0,
      longThrows: cs.stats.longThrows ?? 0,
    },
    tailleCm: cs.tailleCm,
    poidsKg: cs.poidsKg,
    piedPrefere: cs.piedPrefere,
    ovr,
  };
}
