import type { TecStats, PhyStats, MenStats, GkStats, SetPieceStats, Position, Position12, Style, Rarity } from "@/db/footballSchema";
import type { FormationSlot, LinkColor } from "@/db/lineupSchema";

// ─── StatKey ──────────────────────────────────────────────────────────────────

export type StatKey = keyof TecStats | keyof PhyStats | keyof MenStats | keyof GkStats | keyof SetPieceStats;

// ─── Zones ────────────────────────────────────────────────────────────────────

export type ZoneKey = "relance" | "construction" | "milieu" | "progression" | "finition";

const ZONES: ZoneKey[] = ["relance", "construction", "milieu", "progression", "finition"];

function zoneFromY(y: number): ZoneKey {
  if (y <= 20) return "relance";
  if (y <= 40) return "construction";
  if (y <= 60) return "milieu";
  if (y <= 80) return "progression";
  return "finition";
}

// ─── MatchPlayer & TeamMatchInput ────────────────────────────────────────────

export interface EquippedSkill {
  skillCardDefId: string;
  effectType: "stat_boost" | "special_ability";
  abilityId?: string;
  cooldownSeconds?: number;
  relevantPhases?: string[];
}

export interface MatchPlayer {
  instanceId: string;
  characterId: string;
  name: string;
  slotId: string;
  group: Position;
  position12: Position12;
  role: string | null;
  style: Style;
  rarity: Rarity;
  stats: Partial<Record<StatKey, number>>;
  baseX: number;
  baseY: number;
  equippedSkills: EquippedSkill[];
  isGK: boolean;
}

export type TacticSlider = -2 | -1 | 0 | 1 | 2;

export interface TeamMatchInput {
  teamId: string;
  players: MatchPlayer[];
  formation: FormationSlot[];
  links: { slotIdA: string; slotIdB: string; color: LinkColor }[];
  activeSynergyAbilityIds: string[];
  mentality?: TacticSlider;
  defensiveLine?: TacticSlider;
  tempo?: TacticSlider;
  passingDirectness?: TacticSlider;
}

// ─── BallState, PlayerPosition ────────────────────────────────────────────────

export interface BallState {
  x: number;
  y: number;
}

export interface PlayerPosition {
  instanceId: string;
  x: number;
  y: number;
}

// ─── Keyframe ─────────────────────────────────────────────────────────────────

export interface Keyframe {
  step: number;
  minute: number;
  ball: { x: number; y: number };
  positions: { instanceId: string; x: number; y: number }[];
  actress: string;
  defender: string;
  attackScore: number;
  defenseScore: number;
  outcome: "success" | "turnover" | "goal" | "save";
}

// ─── MatchEvent (lighter, for timeline) ──────────────────────────────────────

export interface MatchEvent {
  minute: number;
  type: "goal" | "save" | "turnover";
  team: string;
  player: string;
  zone: ZoneKey;
}

// ─── MicroAction (full trace) ─────────────────────────────────────────────────

export interface MicroAction {
  ball: BallState;
  positions: PlayerPosition[];
  actress: string;
  defender: string;
  attackScore: number;
  defenseScore: number;
  success: boolean;
  phaseKey: ZoneKey;
}

// ─── MatchResult ──────────────────────────────────────────────────────────────

export interface MatchResult {
  score: Record<string, number>;
  events: MatchEvent[];
  keyframes: Keyframe[];
  microActions: MicroAction[];
  possession: Record<string, number>;
}

// ─── RNG seeded (conservé de l'ancien moteur) ─────────────────────────────────

function makeSeededRng(seed: string) {
  let state = 0;
  for (let i = 0; i < seed.length; i++) state = (Math.imul(31, state) + seed.charCodeAt(i)) | 0;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) | 0;
    return ((state >>> 0) % 100000) / 100000;
  };
}

// ─── Chemical effective stats (conservé) ──────────────────────────────────────

const GRADE_SHARPNESS: Record<string, number> = {
  standard: -0.05, fine: 0, mint: 0.05, pristine: 0.1, gem: 0.15,
};

export function computeEffectiveStats(
  baseStats: Record<StatKey, number>,
  grade: string,
  chemistryScoreAvg: number,
  synergyStatBoost: Partial<Record<StatKey, number>>,
  skillStatBoosts: Partial<Record<StatKey, number>>[],
): Record<StatKey, number> {
  const sharpness = 1 + (GRADE_SHARPNESS[grade] ?? 0);
  const chemistryMult = 1 + chemistryScoreAvg * 0.03;
  const result = {} as Record<StatKey, number>;
  for (const key of Object.keys(baseStats) as StatKey[]) {
    let v = baseStats[key] * sharpness * chemistryMult;
    v += synergyStatBoost[key] ?? 0;
    for (const boost of skillStatBoosts) v += boost[key] ?? 0;
    result[key] = Math.max(1, Math.min(99, v));
  }
  return result;
}

// ─── Constantes de poids par zone ────────────────────────────────────────────

// Échelle : les stats sont en 1-99, les poids en 0.0-2.0
// weightedScore = sum(stats[i]*poids[i]) / sum(poids) — résultat en 0-99
function weightedScore(
  stats: Partial<Record<StatKey, number>>,
  weights: Partial<Record<StatKey, number>>,
  minute = 0,
  mentality?: TacticSlider,
  formMod = 1.0,
  momentumMod = 1.0,
  tempo?: TacticSlider,
): number {
  const endurance = stats.endurance ?? 50;
  let sum = 0;
  let totalW = 0;
  for (const [k, w] of Object.entries(weights)) {
    const statKey = k as StatKey;
    const fatigueMult = getFatigueMultiplier(minute, endurance, statKey, mentality, tempo);
    const v = (stats[statKey] ?? 50) * fatigueMult * formMod * momentumMod;
    sum += v * w;
    totalW += w;
  }
  if (totalW === 0) return 50;
  return Math.round(sum / totalW);
}

// ─── ZONE_ATTACK_WEIGHTS[zone][stat] ──────────────────────────────────────────

const ZONE_ATTACK_WEIGHTS: Record<ZoneKey, Partial<Record<StatKey, number>>> = {
  relance: {
    passe: 2.0, controle: 1.5, decision: 1.5,
    puissance: 0.8, sangFroid: 1.0, agressivite: 0.5,
  },
  construction: {
    passe: 2.0, controle: 1.5, decision: 1.5,
    dribble: 1.0, anticipation: 0.8, longThrows: 0.8,
    sangFroid: 0.5, agressivite: 0.5,
  },
  milieu: {
    passe: 1.5, dribble: 1.5, controle: 1.2,
    decision: 1.2, endurance: 1.0, agressivite: 0.8,
    puissance: 0.5, anticipation: 0.5,
  },
  progression: {
    dribble: 2.0, vitesse: 1.5, acceleration: 1.5,
    centre: 1.0, passe: 0.8, decision: 0.8,
    puissance: 0.5, agilite: 0.5,
  },
  finition: {
    tir: 2.0, sangFroid: 1.5, detente: 1.0,
    decision: 1.0, puissance: 0.8, agilite: 0.8,
    penalty: 0.6, acceleration: 0.5,
  },
};

// ─── ZONE_DEFENSE_WEIGHTS[zone][stat] ─────────────────────────────────────────

const ZONE_DEFENSE_WEIGHTS: Record<ZoneKey, Partial<Record<StatKey, number>>> = {
  relance: {
    positionnement: 1.5, tacle: 1.0, anticipation: 1.0,
    agressivite: 0.8, vitesse: 0.5,
  },
  construction: {
    positionnement: 1.5, tacle: 1.5, anticipation: 1.2,
    agressivite: 1.0, endurance: 0.5,
  },
  milieu: {
    tacle: 1.5, anticipation: 1.5, positionnement: 1.2,
    endurance: 1.0, agressivite: 1.0, agilite: 0.5,
  },
  progression: {
    tacle: 1.5, positionnement: 1.5, vitesse: 1.0,
    anticipation: 1.0, agilite: 0.8, agressivite: 0.5,
  },
  finition: {
    anticipation: 1.5, positionnement: 1.5, agilite: 1.2,
    detente: 1.0, tacle: 0.8, vitesse: 0.5,
  },
};

// ─── GK_ATTACK_WEIGHTS — la gardienne relance ─────────────────────────────────

const GK_ATTACK_WEIGHTS: Record<ZoneKey, Partial<Record<StatKey, number>>> = {
  relance: { passe: 2.0, decision: 1.5, sangFroid: 1.0 },
  construction: { kicking: 1.5, passe: 1.0, decision: 1.0 },
  milieu: {},
  progression: {},
  finition: {},
};

// ─── GK_DEFENSE_WEIGHTS — arrêts ──────────────────────────────────────────────

const GK_DEFENSE_WEIGHTS: Record<ZoneKey, Partial<Record<StatKey, number>>> = {
  relance: {},
  construction: {},
  milieu: { anticipation: 1.0, agilite: 1.0 },
  progression: { anticipation: 1.5, agilite: 1.0, positionnement: 0.5 },
  finition: {
    reflexes: 2.0, handling: 1.5, commandArea: 1.2,
    aerialReach: 1.0, rushingOut: 1.0, kicking: 0.5,
    anticipation: 1.5, agilite: 1.5, positionnement: 1.2,
  },
};

// ─── ZONE_K (sensibilité sigmoïde) ────────────────────────────────────────────

const ZONE_K: Record<ZoneKey, number> = {
  relance: 0.20,
  construction: 0.20,
  milieu: 0.20,
  progression: 0.20,
  finition: 0.20,
};

const ZONE_SURPRISE_ATTACK: Record<ZoneKey, StatKey[]> = {
  relance: ["controle", "passe", "decision", "sangFroid"],
  construction: ["dribble", "passe", "decision", "vitesse"],
  milieu: ["dribble", "passe", "decision", "puissance", "agilite"],
  progression: ["vitesse", "acceleration", "dribble", "agilite", "decision"],
  finition: ["tir", "detente", "sangFroid", "puissance", "agilite"],
};

const ZONE_SURPRISE_DEFENSE: Record<ZoneKey, StatKey[]> = {
  relance: ["anticipation", "positionnement", "vitesse", "agressivite"],
  construction: ["anticipation", "positionnement", "vitesse", "agressivite"],
  milieu: ["anticipation", "positionnement", "endurance", "vitesse", "agilite"],
  progression: ["vitesse", "anticipation", "agilite", "positionnement"],
  finition: ["anticipation", "positionnement", "agilite", "detente"],
};

function resolveSurprise(
  stats: Partial<Record<StatKey, number>>,
  pool: StatKey[],
  rng: () => number,
): number {
  const key = pool[Math.floor(rng() * pool.length)];
  return stats[key] ?? 50;
}

// ─── ZONE_MATCH_ATTACK[position12][zone] ──────────────────────────────────────

// À quel point un poste est naturellement actif dans chaque zone (0.0 - 1.0)
const ZONE_MATCH_ATTACK: Partial<Record<Position12, Partial<Record<ZoneKey, number>>>> = {
  GK: { relance: 1.0, construction: 0.1 },
  CB: { relance: 1.0, construction: 0.8, milieu: 0.3, progression: 0.1 },
  RB: { relance: 0.5, construction: 1.0, milieu: 0.7, progression: 0.7 },
  LB: { relance: 0.5, construction: 1.0, milieu: 0.7, progression: 0.7 },
  CDM: { relance: 0.2, construction: 0.9, milieu: 1.0, progression: 0.5 },
  CM: { relance: 0.3, construction: 0.8, milieu: 1.0, progression: 0.9 },
  CAM: { relance: 0.0, construction: 0.3, milieu: 0.8, progression: 1.0, finition: 0.6 },
  LM: { relance: 0.0, construction: 0.5, milieu: 0.9, progression: 1.0, finition: 0.3 },
  RM: { relance: 0.0, construction: 0.5, milieu: 0.9, progression: 1.0, finition: 0.3 },
  LW: { relance: 0.0, construction: 0.3, milieu: 0.6, progression: 1.0, finition: 0.9 },
  RW: { relance: 0.0, construction: 0.3, milieu: 0.6, progression: 1.0, finition: 0.9 },
  ST: { relance: 0.0, construction: 0.3, milieu: 0.4, progression: 0.7, finition: 1.0 },
};

// ─── ZONE_MATCH_DEFENSE[position12][zone] ─────────────────────────────────────

const ZONE_MATCH_DEFENSE: Partial<Record<Position12, Partial<Record<ZoneKey, number>>>> = {
  GK: { relance: 0.2, construction: 0.1, progression: 0.3, finition: 1.0 },
  CB: { relance: 0.8, construction: 1.0, milieu: 1.0, progression: 0.8, finition: 0.4 },
  RB: { relance: 0.5, construction: 0.8, milieu: 0.8, progression: 1.0, finition: 0.3 },
  LB: { relance: 0.5, construction: 0.8, milieu: 0.8, progression: 1.0, finition: 0.3 },
  CDM: { relance: 0.3, construction: 1.0, milieu: 1.0, progression: 0.7 },
  CM: { relance: 0.2, construction: 0.7, milieu: 1.0, progression: 0.7 },
  CAM: { relance: 0.0, construction: 0.3, milieu: 0.5, progression: 0.5 },
  LM: { relance: 0.0, construction: 0.4, milieu: 0.5, progression: 0.5 },
  RM: { relance: 0.0, construction: 0.4, milieu: 0.5, progression: 0.5 },
  LW: { relance: 0.0, construction: 0.2, milieu: 0.3, progression: 0.3 },
  RW: { relance: 0.0, construction: 0.2, milieu: 0.3, progression: 0.3 },
  ST: { relance: 0.0, construction: 0.1, milieu: 0.1, progression: 0.1 },
};

// ─── ROLE_MATCH_ATTACK — modulations par rôle FM ─────────────────────────────
// Clé = "position12|role". Valeur = override des zone match par zone.

const ROLE_MATCH_ATTACK: Record<string, Partial<Record<ZoneKey, number>>> = {
  "ST|poacher":         { construction: 0.1, milieu: 0.2, progression: 0.5, finition: 1.2 },
  "ST|false_nine":      { relance: 0.1, construction: 0.6, milieu: 0.8, progression: 0.8, finition: 0.7 },
  "ST|target_man":      { construction: 0.2, milieu: 0.4, progression: 0.5, finition: 1.1 },
  "ST|second_striker":  { construction: 0.4, milieu: 0.6, progression: 0.8, finition: 1.2 },
  "ST|advanced_forward":{ construction: 0.4, milieu: 0.4, progression: 0.8, finition: 1.1 },
  "CAM|playmaker":      { construction: 0.4, milieu: 1.0, progression: 1.1, finition: 0.6 },
  "CAM|trequartista":   { relance: 0.0, construction: 0.5, milieu: 1.0, progression: 1.0, finition: 0.8 },
  "LW|winger":          { construction: 0.3, milieu: 0.7, progression: 1.1, finition: 0.9 },
  "LW|inside_forward":  { construction: 0.4, milieu: 0.8, progression: 1.0, finition: 1.0 },
  "RW|winger":          { construction: 0.3, milieu: 0.7, progression: 1.1, finition: 0.9 },
  "RW|inside_forward":  { construction: 0.4, milieu: 0.8, progression: 1.0, finition: 1.0 },
  "LM|winger":          { construction: 0.5, milieu: 0.9, progression: 1.1, finition: 0.3 },
  "LM|wide_playmaker":  { relance: 0.1, construction: 0.7, milieu: 1.0, progression: 0.9, finition: 0.4 },
  "RM|winger":          { construction: 0.5, milieu: 0.9, progression: 1.1, finition: 0.3 },
  "RM|wide_playmaker":  { relance: 0.1, construction: 0.7, milieu: 1.0, progression: 0.9, finition: 0.4 },
  "CM|box_to_box":      { relance: 0.4, construction: 1.0, milieu: 1.1, progression: 1.0, finition: 0.3 },
  "CM|deep_lying_playmaker": { relance: 0.5, construction: 1.0, milieu: 1.1, progression: 0.7, finition: 0.1 },
  "CDM|regista":        { relance: 0.4, construction: 1.1, milieu: 1.1, progression: 0.6, finition: 0.1 },
  "CDM|ball_winning":   { relance: 0.2, construction: 1.0, milieu: 1.0, progression: 0.5, finition: 0.1 },
  "CDM|anchor":         { relance: 0.5, construction: 1.0, milieu: 1.0, progression: 0.3, finition: 0.0 },
  "LB|fullback":        { relance: 0.5, construction: 1.0, milieu: 0.7, progression: 0.8, finition: 0.2 },
  "LB|inverted_wingback": { relance: 0.5, construction: 1.1, milieu: 0.9, progression: 0.6, finition: 0.2 },
  "RB|fullback":        { relance: 0.5, construction: 1.0, milieu: 0.7, progression: 0.8, finition: 0.2 },
  "RB|inverted_wingback": { relance: 0.5, construction: 1.1, milieu: 0.9, progression: 0.6, finition: 0.2 },
  "CB|ball_playing_defender": { relance: 1.1, construction: 1.0, milieu: 0.5, progression: 0.2 },
  "CB|libero":          { relance: 1.2, construction: 1.2, milieu: 0.7, progression: 0.4, finition: 0.1 },
  "CB|stopper":         { relance: 1.0, construction: 0.7, milieu: 0.2, progression: 0.1 },
  "GK|sweeper_keeper":  { relance: 1.2, construction: 0.4, milieu: 0.2, progression: 0.1 },
};

// Bonus latéral : si ball.x < 25 ou > 75, FB et Wingers bonus +0.3
function lateralBonus(position12: Position12, ballX: number): number {
  const isWide = ["RB", "LB", "LM", "RM", "LW", "RW"].includes(position12);
  if (isWide && (ballX < 25 || ballX > 75)) return 0.3;
  return 0;
}

// ─── ROLE_ROAM ─────────────────────────────────────────────────────────────────

const ROLE_ROAM: Record<string, number> = {
  gardien: 0.00,
  sweeper: 0.30,
  stopper: 0.05,
  ball_playing_defender: 0.15,
  fullback: 0.25,
  inverted_wingback: 0.15,
  anchor: 0.10,
  deep_lying_playmaker: 0.25,
  box_to_box: 0.40,
  regista: 0.30,
  trequartista: 0.30,
  winger: 0.30,
  inside_forward: 0.20,
  poacher: 0.05,
  target_man: 0.05,
  false_nine: 0.50,
  second_striker: 0.30,
};

const DEFAULT_ROAM = 0.20;

function roam(player: MatchPlayer): number {
  return ROLE_ROAM[player.role ?? ""] ?? DEFAULT_ROAM;
}

// ─── RPS ──────────────────────────────────────────────────────────────────────

const RPS_ADVANTAGE: Partial<Record<Style, Style>> = {
  percussion: "vista",
  vista: "elevation",
  pressing: "percussion",
  elevation: "sangFroid",
  sangFroid: "pressing",
};

function applyStyleModifiers(
  weights: Partial<Record<StatKey, number>>,
  actress: MatchPlayer,
  defender: MatchPlayer,
  zone: ZoneKey,
): Partial<Record<StatKey, number>> {
  const mod = { ...weights };
  const rpsAdvantage = RPS_ADVANTAGE[actress.style] === defender.style;

  switch (actress.style) {
    case "percussion":
      if (["milieu", "progression"].includes(zone)) {
        mod.puissance = (mod.puissance ?? 1) * 1.2;
        mod.agressivite = (mod.agressivite ?? 1) * 1.2;
      }
      break;
    case "vista":
      if (["construction", "milieu"].includes(zone)) {
        mod.passe = (mod.passe ?? 1) * 1.2;
        mod.decision = (mod.decision ?? 1) * 1.2;
      }
      break;
    case "pressing":
      if (["construction", "milieu"].includes(zone)) {
        mod.agressivite = (mod.agressivite ?? 1) * 1.2;
        mod.tacle = (mod.tacle ?? 1) * 1.2;
        mod.endurance = (mod.endurance ?? 1) * 1.15;
      }
      break;
    case "elevation":
      if (["progression", "finition"].includes(zone)) {
        mod.detente = (mod.detente ?? 1) * 1.3;
        mod.centre = (mod.centre ?? 1) * 1.2;
      }
      break;
    case "sangFroid":
      if (["finition", "progression"].includes(zone)) {
        mod.tir = (mod.tir ?? 1) * 1.2;
        mod.sangFroid = (mod.sangFroid ?? 1) * 1.2;
      }
      break;
  }

  if (rpsAdvantage) {
    for (const key of Object.keys(mod)) mod[key as StatKey] = (mod[key as StatKey] ?? 1) * 1.1;
  }

  return mod;
}

// ─── Scores d'intervention ────────────────────────────────────────────────────

function getRoleMatch(player: Pick<MatchPlayer, "position12" | "role">, zone: ZoneKey, side: "attack" | "defense"): number {
  const roleKey = `${player.position12}|${player.role ?? ""}`;
  const table = side === "attack" ? ROLE_MATCH_ATTACK : undefined;
  const fallback = side === "attack" ? ZONE_MATCH_ATTACK : ZONE_MATCH_DEFENSE;
  const zmRole = table?.[roleKey];
  if (zmRole && zone in zmRole) return zmRole[zone]!;
  return fallback[player.position12]?.[zone] ?? 0.2;
}

function interventionScore(
  player: MatchPlayer,
  ball: BallState,
  allPositions: Map<string, { x: number; y: number }>,
): number {
  const pos = allPositions.get(player.instanceId);
  if (!pos) return 0;
  const dist = Math.sqrt((pos.x - ball.x) ** 2 + (pos.y - ball.y) ** 2);
  const proximity = Math.max(0, 1 - dist / 100);
  const zm = getRoleMatch(player, zoneFromY(ball.y), "attack");
  const lat = lateralBonus(player.position12, ball.x);
  return proximity * (zm + lat) * (1 + roam(player));
}

function defenseInterventionScore(
  player: MatchPlayer,
  ball: BallState,
  allPositions: Map<string, { x: number; y: number }>,
): number {
  const pos = allPositions.get(player.instanceId);
  if (!pos) return 0;
  const dist = Math.sqrt((pos.x - ball.x) ** 2 + (pos.y - ball.y) ** 2);
  const proximity = Math.max(0, 1 - dist / 100);
  const zm = getRoleMatch(player, zoneFromY(ball.y), "defense");
  const lat = lateralBonus(player.position12, ball.x);
  const ant = (player.stats.anticipation ?? 50) / 99;
  const posi = (player.stats.positionnement ?? 50) / 99;
  const mentalFactor = 0.5 + 0.5 * ((ant + posi) / 2);
  return proximity * (zm + lat) * (1 + roam(player)) * mentalFactor;
}

function selectActor(
  players: MatchPlayer[],
  ball: BallState,
  positions: Map<string, { x: number; y: number }>,
): MatchPlayer | null {
  let best: MatchPlayer | null = null;
  let bestScore = -1;
  for (const p of players) {
    const score = interventionScore(p, ball, positions);
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best;
}

function selectDefender(
  players: MatchPlayer[],
  ball: BallState,
  positions: Map<string, { x: number; y: number }>,
): MatchPlayer | null {
  let best: MatchPlayer | null = null;
  let bestScore = -1;
  for (const p of players) {
    const score = defenseInterventionScore(p, ball, positions);
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best;
}

function findGK(players: MatchPlayer[]): MatchPlayer | undefined {
  return players.find((p) => p.isGK);
}

// ─── Pressing collectif (zones basses) ────────────────────────────────────────

const MENTALITY_PARAMS: Record<TacticSlider, { distanceSeuil: number; bonusScore: number; risqueMultiplier: number; fatigueMult: number; foulRiskMult: number }> = {
  [-2]: { distanceSeuil: 10, bonusScore: 0.70, risqueMultiplier: 0.05, fatigueMult: 0.75, foulRiskMult: 0.70 },
  [-1]: { distanceSeuil: 15, bonusScore: 0.85, risqueMultiplier: 0.20, fatigueMult: 0.85, foulRiskMult: 0.85 },
  [0]:  { distanceSeuil: 22, bonusScore: 1.00, risqueMultiplier: 0.50, fatigueMult: 1.00, foulRiskMult: 1.00 },
  [1]:  { distanceSeuil: 30, bonusScore: 1.15, risqueMultiplier: 1.00, fatigueMult: 1.30, foulRiskMult: 1.15 },
  [2]:  { distanceSeuil: 38, bonusScore: 1.30, risqueMultiplier: 1.40, fatigueMult: 1.55, foulRiskMult: 1.30 },
};

function computePressingScore(
  defendingTeam: TeamMatchInput,
  ball: BallState,
  positions: Map<string, { x: number; y: number }>,
): { pressingScore: number; spaceBehind: number } {
  const params = MENTALITY_PARAMS[defendingTeam.mentality ?? 0];

  const presseurs = defendingTeam.players.filter((p) => {
    const pos = positions.get(p.instanceId);
    if (!pos) return false;
    const dist = Math.sqrt((pos.x - ball.x) ** 2 + (pos.y - ball.y) ** 2);
    return dist < params.distanceSeuil;
  });

  if (presseurs.length === 0) {
    return { pressingScore: 20, spaceBehind: 0 };
  }

  const avgPressing = presseurs.reduce((sum, p) => sum + (
    (p.stats.agressivite ?? 50) * 1.0 +
    (p.stats.endurance ?? 50) * 0.7 +
    (p.stats.anticipation ?? 50) * 0.5 +
    (p.stats.vitesse ?? 50) * 0.3
  ), 0) / presseurs.length;

  const nombreBonus = presseurs.length >= 4 ? 1.2 : presseurs.length >= 2 ? 1.1 : 1.0;
  const pressingScore = avgPressing * params.bonusScore * nombreBonus;

  const spaceBehind = (11 - presseurs.length) > 6
    ? Math.round((11 - presseurs.length) * params.risqueMultiplier * 3)
    : 0;

  return { pressingScore, spaceBehind };
}

// ─── Ligne défensive (5 niveaux, hauteur continue) ───────────────────────────

const LIGNE_PARAMS: Record<TacticSlider, {
  ligneHauteur: number; compressionAdverse: number; counterBonusOwn: number; offsideMult: number;
}> = {
  [-2]: { ligneHauteur: 12, compressionAdverse: 0.65, counterBonusOwn: 1.80, offsideMult: 0.35 },
  [-1]: { ligneHauteur: 28, compressionAdverse: 0.75, counterBonusOwn: 1.50, offsideMult: 0.50 },
  [0]:  { ligneHauteur: 50, compressionAdverse: 1.00, counterBonusOwn: 1.00, offsideMult: 1.00 },
  [1]:  { ligneHauteur: 68, compressionAdverse: 1.15, counterBonusOwn: 0.60, offsideMult: 1.60 },
  [2]:  { ligneHauteur: 82, compressionAdverse: 1.30, counterBonusOwn: 0.35, offsideMult: 2.20 },
};

const ZONE_CENTER_Y: Record<ZoneKey, number> = {
  relance: 10, construction: 30, milieu: 50, progression: 70, finition: 90,
};

function collectiveWeight(zone: ZoneKey, ligneHauteur: number): number {
  const dist = Math.abs(ZONE_CENTER_Y[zone] - ligneHauteur);
  return Math.max(0, 1 - dist / 45);
}

function computeZoneDefenseScore(
  defendingTeam: TeamMatchInput,
  zone: ZoneKey,
  ball: BallState,
  positions: Map<string, { x: number; y: number }>,
  individualDefenseScore: number,
): { defenseScore: number; spaceBehind: number } {
  const params = LIGNE_PARAMS[defendingTeam.defensiveLine ?? 0];
  const weight = collectiveWeight(zone, params.ligneHauteur);

  if (weight <= 0) return { defenseScore: individualDefenseScore, spaceBehind: 0 };

  const pressing = computePressingScore(defendingTeam, ball, positions);
  const defenseScore = individualDefenseScore * (1 - weight) + pressing.pressingScore * weight;
  return { defenseScore, spaceBehind: pressing.spaceBehind };
}

// ─── Tempo (rythme temporel) ─────────────────────────────────────────────────

const TEMPO_PARAMS: Record<TacticSlider, { minuteIncrementMult: number; fatigueMult: number; errorMult: number }> = {
  [-2]: { minuteIncrementMult: 1.35, fatigueMult: 0.80, errorMult: 0.85 },
  [-1]: { minuteIncrementMult: 1.15, fatigueMult: 0.90, errorMult: 0.92 },
  [0]:  { minuteIncrementMult: 1.00, fatigueMult: 1.00, errorMult: 1.00 },
  [1]:  { minuteIncrementMult: 0.85, fatigueMult: 1.15, errorMult: 1.10 },
  [2]:  { minuteIncrementMult: 0.70, fatigueMult: 1.35, errorMult: 1.20 },
};

// ─── Directivité des passes ──────────────────────────────────────────────────

const DIRECTNESS_PARAMS: Record<TacticSlider, { distanceMult: number; errorMult: number }> = {
  [-2]: { distanceMult: 0.70, errorMult: 0.75 },
  [-1]: { distanceMult: 0.85, errorMult: 0.88 },
  [0]:  { distanceMult: 1.00, errorMult: 1.00 },
  [1]:  { distanceMult: 1.20, errorMult: 1.15 },
  [2]:  { distanceMult: 1.40, errorMult: 1.30 },
};

// ─── Résolution micro-action (avec contre-pied) ──────────────────────────────

function resolveMicroAction(
  actress: MatchPlayer,
  defender: MatchPlayer,
  zone: ZoneKey,
  ball: BallState,
  rng: () => number,
  minute: number,
  defendingTeam: TeamMatchInput,
  attackingTeam: TeamMatchInput,
  positions: Map<string, { x: number; y: number }>,
  formMap?: Map<string, number>,
  momentumAtk = 1.0,
  momentumDef = 1.0,
  justRecovered = false,
  redCards?: Set<string>,
): { success: boolean; distance: number; newBall: BallState; breakaway: boolean } {
  const fm = (p: MatchPlayer) => formMap?.get(p.instanceId) ?? 1.0;
  const attackWeights = actress.isGK ? GK_ATTACK_WEIGHTS[zone] : ZONE_ATTACK_WEIGHTS[zone];
  const modAttack = applyStyleModifiers(attackWeights, actress, defender, zone);
  const surprise = rng();

  let attackScore: number;
  let defenseScore: number;
  let spaceBehind = 0;

  if (surprise < 0.2) {
    attackScore = resolveSurprise(actress.stats, ZONE_SURPRISE_ATTACK[zone], rng);
  } else {
    attackScore = weightedScore(actress.stats, modAttack, minute, attackingTeam.mentality, fm(actress), 1.0, attackingTeam.tempo);
  }

  const defWeights = defender.isGK ? GK_DEFENSE_WEIGHTS[zone] : ZONE_DEFENSE_WEIGHTS[zone];
  const modDefense = applyStyleModifiers(defWeights, actress, defender, zone);
  const individualDefense = weightedScore(defender.stats, modDefense, minute, defendingTeam.mentality, fm(defender), 1.0, defendingTeam.tempo);
  const zoneDefense = computeZoneDefenseScore(defendingTeam, zone, ball, positions, individualDefense);
  defenseScore = zoneDefense.defenseScore;
  spaceBehind = zoneDefense.spaceBehind;

  const ratio = (attackScore * momentumAtk) - (defenseScore * momentumDef);
  const k = ZONE_K[zone];
  const prob = 1 / (1 + Math.exp(-k * ratio));

  const success = rng() < prob;

  const compression = LIGNE_PARAMS[defendingTeam.defensiveLine ?? 0].compressionAdverse;
  const counterMult = justRecovered ? LIGNE_PARAMS[attackingTeam.defensiveLine ?? 0].counterBonusOwn : 1.0;
  const directnessMult = DIRECTNESS_PARAMS[attackingTeam.passingDirectness ?? 0].distanceMult;

  const DISTANCE_CAP_NORMAL = 20;
  let distance = success
    ? Math.min(DISTANCE_CAP_NORMAL, (8 + Math.max(0, ratio) * 1.2) * compression * directnessMult + spaceBehind * 0.5 * counterMult)
    : 0;

  let breakaway = false;
  const counterAttackChance = spaceBehind > 10 ? 0.15 * counterMult : 0;
  if (success && rng() < counterAttackChance) {
    distance = Math.min(38, distance + spaceBehind);
    breakaway = true;
  }

  // Le nouveau x tend vers la coéquipière la plus proche (pass plausible)
  const teammates = attackingTeam.players.filter(p => p.instanceId !== actress.instanceId && !p.isGK);
  let targetX = ball.x;
  if (teammates.length > 0) {
    const ballPos = ball;
    let bestScore = Infinity;
    for (const tm of teammates) {
      const tp = positions.get(tm.instanceId);
      if (!tp) continue;
      const dx = tp.x - ballPos.x;
      const dy = tp.y - ballPos.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const score = dist - dy * 0.3;
      if (score < bestScore) { bestScore = score; targetX = tp.x; }
    }
  }
  const newX = ball.x + (targetX - ball.x) * 0.3 + (rng() - 0.5) * 10;
  const newY = success
    ? Math.min(100, ball.y + distance)
    : Math.max(0, ball.y - 2);

  return { success, distance, newBall: { x: newX, y: newY }, breakaway };
}

// ─── Mouvement 2D ─────────────────────────────────────────────────────────────

function updatePositions(
  players: MatchPlayer[],
  ball: BallState,
  currentPositions: Map<string, { x: number; y: number }>,
  event: "possession" | "turnover",
): Map<string, { x: number; y: number }> {
  const newPos = new Map(currentPositions);
  for (const p of players) {
    const r = roam(p);
    const t = r * 0.3;
    const factor = event === "turnover" ? -0.6 : t;

    let x = p.baseX + (ball.x - p.baseX) * factor;
    let y = p.baseY + (ball.y - p.baseY) * factor;

    // Contraintes spatiales par rôle
    if (p.position12 === "GK") y = Math.max(y, 70);
    if (["CB"].includes(p.position12)) y = Math.max(y, 30);
    if (["ST", "LW", "RW", "CAM"].includes(p.position12)) y = Math.min(y, 80);

    newPos.set(p.instanceId, { x: Math.round(x), y: Math.round(y) });
  }
  return newPos;
}

// ─── Fatigue différentielle par catégorie de stat ─────────────────────────────

const FATIGUE_CATEGORIES: { coeff: number; stats: StatKey[] }[] = [
  { coeff: 1.4, stats: ["vitesse", "acceleration", "endurance", "puissance", "agilite", "detente"] },
  { coeff: 0.8, stats: ["anticipation", "sangFroid", "leadership", "positionnement", "agressivite", "decision"] },
  { coeff: 0.6, stats: ["passe", "tir", "dribble", "centre", "tacle", "controle",
    "reflexes", "handling", "aerialReach", "commandArea", "kicking", "rushingOut"] },
  { coeff: 0.4, stats: ["cf", "corners", "penalty", "longThrows"] },
];

function getCategoryCoeff(statKey: StatKey): number {
  for (const cat of FATIGUE_CATEGORIES) {
    if ((cat.stats as string[]).includes(statKey)) return cat.coeff;
  }
  return 1.0;
}

function getFatigueMultiplier(minute: number, endurance: number, statKey: StatKey, mentality?: TacticSlider, tempo?: TacticSlider): number {
  if (minute <= 60) return 1;
  const progression = Math.min(1, (minute - 60) / 30);
  const resistance = endurance / 99;
  const coeff = getCategoryCoeff(statKey);
  const fatigueFactor = progression * (1 - resistance) * 0.25 * coeff;
  const mentaliteMult = MENTALITY_PARAMS[mentality ?? 0].fatigueMult * TEMPO_PARAMS[tempo ?? 0].fatigueMult;
  return Math.max(0.01, 1 - fatigueFactor * mentaliteMult);
}

// ─── Tir au but ───────────────────────────────────────────────────────────────

function resolveShot(
  actress: MatchPlayer,
  gk: MatchPlayer | undefined,
  rng: () => number,
  minute: number,
  mentality?: TacticSlider,
  formMap?: Map<string, number>,
  ball?: BallState,
  tempo?: TacticSlider,
): { goal: boolean; save: boolean } {
  const fmA = formMap?.get(actress.instanceId) ?? 1.0;
  const shotScore = weightedScore(actress.stats, ZONE_ATTACK_WEIGHTS["finition"], minute, mentality, fmA, 1.0, tempo);
  const gkScore = gk ? weightedScore(gk.stats, GK_DEFENSE_WEIGHTS["finition"], minute, mentality, formMap?.get(gk.instanceId) ?? 1.0, 1.0, tempo) : 0;

  // xG-like : la qualité du tir dépend de la distance et de l'angle
  const shotY = ball?.y ?? 90;
  const shotX = ball?.x ?? 50;
  // Distance : plus y est haut, plus on est proche du but
  const distanceFactor = shotY >= 96 ? 1.3 : shotY >= 89 ? 1.0 : shotY >= 82 ? 0.75 : 0.50;
  // Angle : plus x est central, mieux c'est
  const angleFactor = shotX >= 25 && shotX <= 75 ? 1.0 : shotX >= 15 && shotX <= 85 ? 0.85 : 0.65;
  const qualityFactor = distanceFactor * angleFactor;

  const onTarget = rng() < 0.40 * qualityFactor;
  if (!onTarget) return { goal: false, save: false };

  const goalProb = 1 / (1 + Math.exp(-0.35 * (shotScore - gkScore)));
  const goal = rng() < goalProb;

  return { goal, save: !goal };
}

// ─── Corner ───────────────────────────────────────────────────────────────────

function resolveCorner(
  attackingTeam: TeamMatchInput,
  defendingTeam: TeamMatchInput,
  rng: () => number,
): { goal: boolean; scorer: string; header: string } {
  const taker = attackingTeam.players.sort(
    (a, b) => (b.stats.corners ?? 50) - (a.stats.corners ?? 50)
  )[0];
  const defender = defendingTeam.players.sort(
    (a, b) => ((b.stats.cf ?? 50) + (b.stats.detente ?? 50)) - ((a.stats.cf ?? 50) + (a.stats.detente ?? 50))
  )[0];
  const gk = defendingTeam.players.find(p => p.isGK);
  const gkCommand = gk?.stats.commandArea ?? 50;

  const cornerQuality = taker.stats.corners ?? 50;
  const aerialThreat = attackingTeam.players
    .filter(p => !p.isGK)
    .reduce((s, p) => s + (p.stats.detente ?? 50) + (p.stats.cf ?? 50), 0)
    / Math.max(1, attackingTeam.players.filter(p => !p.isGK).length);

  const attackScore = (cornerQuality * 0.6 + aerialThreat * 0.4);
  const defScore = (gkCommand * 0.4 + (defender.stats.detente ?? 50) * 0.3 + (defender.stats.cf ?? 50) * 0.3);

  const ratio = attackScore - defScore;
  const prob = 1 / (1 + Math.exp(-0.12 * ratio));
  const baseCornerGoalRate = 0.035;
  const adjustedProb = baseCornerGoalRate * (prob / 0.5);

  const goal = rng() < adjustedProb;

  return { goal, scorer: taker.name, header: defender.name };
}

// ─── Coup franc ───────────────────────────────────────────────────────────────

function resolveFreeKick(
  taker: MatchPlayer,
  gk: MatchPlayer | undefined,
  distance: "proche" | "moyen" | "loin",
  rng: () => number,
): { goal: boolean } {
  const shotPower = (taker.stats.cf ?? 50) * 0.5 + (taker.stats.tir ?? 50) * 0.3 + (taker.stats.sangFroid ?? 50) * 0.2;
  const defScore = gk ? (gk.stats.reflexes ?? 50) * 0.6 + (gk.stats.anticipation ?? 50) * 0.4 : 40;
  const wallBonus = 5;
  const ratio = shotPower - (defScore + wallBonus);
  const baseProb = distance === "proche" ? 0.08 : distance === "moyen" ? 0.05 : 0.02;
  const prob = baseProb * (1 + ratio / 100);
  return { goal: rng() < prob };
}

// ─── Penalty ──────────────────────────────────────────────────────────────────

function resolvePenalty(
  taker: MatchPlayer,
  gk: MatchPlayer | undefined,
  rng: () => number,
): { goal: boolean } {
  const shootScore = (taker.stats.penalty ?? 50) * 0.6 + (taker.stats.sangFroid ?? 50) * 0.4;
  const gkScore = gk ? (gk.stats.reflexes ?? 50) * 0.5 + (gk.stats.anticipation ?? 50) * 0.5 : 40;
  const ratio = shootScore - gkScore;
  const baseRate = 0.76;
  const prob = Math.max(0.55, Math.min(0.90, baseRate + ratio * 0.005));
  return { goal: rng() < prob };
}

// ─── Possession ───────────────────────────────────────────────────────────────

function computePossession(step: number, homeTeamId: string, events: string[]): number {
  if (events.length === 0) return 50;
  const homeEvents = events.filter((t) => t === homeTeamId).length;
  return Math.round((homeEvents / events.length) * 100);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  simulateMatch — point d'entrée principal
// ═══════════════════════════════════════════════════════════════════════════════

export function simulateMatch(
  homeInput: TeamMatchInput,
  awayInput: TeamMatchInput,
  seed: string,
  maxMicroActions = 120,
): MatchResult {
  const rng = makeSeededRng(seed);

  // Cloner les inputs pour éviter la contamination inter-matchs
  const home: TeamMatchInput = {
    ...homeInput,
    players: homeInput.players.map(p => ({ ...p })),
  };
  const away: TeamMatchInput = {
    ...awayInput,
    players: awayInput.players.map(p => ({ ...p })),
  };

  const ball: BallState = { x: 50, y: 20 };
  const allP = [...home.players, ...away.players];

  // Initialiser les positions (base formation)
  const positions = new Map<string, { x: number; y: number }>();
  for (const p of allP) positions.set(p.instanceId, { x: p.baseX, y: p.baseY });

  let attackingTeam = rng() < 0.5 ? home : away;
  let defendingTeam = attackingTeam === home ? away : home;

  const microActions: MicroAction[] = [];
  const events: MatchEvent[] = [];
  const score: Record<string, number> = { [home.teamId]: 0, [away.teamId]: 0 };
  const possessionEvents: string[] = [];
  const keyframes: Keyframe[] = [];

  // ─── Forme du jour (flèches PES) ───────────────────────────────────────
  const FORM_LEVELS = [0.94, 0.97, 1.00, 1.03, 1.06];
  const formMap = new Map<string, number>();
  for (const p of allP) {
    const roll = rng();
    const idx = roll < 0.10 ? 0 : roll < 0.35 ? 1 : roll < 0.65 ? 2 : roll < 0.90 ? 3 : 4;
    formMap.set(p.instanceId, FORM_LEVELS[idx]);
  }

  // ─── Cartons ────────────────────────────────────────────────────────────
  const yellowCards = new Map<string, number>();
  const redCards = new Set<string>();

  // ─── Assist tracker ────────────────────────────────────────────────────
  let lastAssister: string | null = null;

  // ─── Contre-attaque ────────────────────────────────────────────────────
  let justRecovered = false;

  // ─── Momentum (vagues psychologiques) ──────────────────────────────────
  // Après un but : l'équipe qui a marqué a +5% stats pendant 5 min,
  // l'équipe qui a encaissé a -5% stats pendant 5 min
  let momentumTeam: string | null = null;
  let momentumUntilMinute = 0;
  const MOMENTUM_BOOST = 1.05;
  const MOMENTUM_PENALTY = 0.95;
  const MOMENTUM_DURATION = 5; // minutes

  let possessionSteps = 0;
  let possessionStartY = ball.y;
  const MIN_POSSESSION_STEPS = 3;

  let matchMinute = 0.0;
  let step = 0;
  while (matchMinute < 90 && step < maxMicroActions) {
    const minute = Math.round(matchMinute);
    const tempoIncMult = TEMPO_PARAMS[attackingTeam.tempo ?? 0].minuteIncrementMult;
    matchMinute += (0.5 + rng() * 1.0) * tempoIncMult;
    step++;

    // Ajustement dynamique par incrément de slider
    function clampSlider(v: number): TacticSlider {
      return Math.max(-2, Math.min(2, v)) as TacticSlider;
    }
    if (minute >= 70) {
      const homeScore = score[home.teamId];
      const awayScore = score[away.teamId];
      const isHome = attackingTeam.teamId === home.teamId;
      if ((isHome && homeScore < awayScore) || (!isHome && awayScore < homeScore)) {
        attackingTeam.mentality = clampSlider((attackingTeam.mentality ?? 0) + 1);
      }
    }
    if (minute >= 80) {
      const homeScore = score[home.teamId];
      const awayScore = score[away.teamId];
      const isHome = attackingTeam.teamId === home.teamId;
      if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) {
        attackingTeam.mentality = clampSlider((attackingTeam.mentality ?? 0) - 1);
      }
    }

    const zone = zoneFromY(ball.y);

    // Sélection (filtrer les expulsées)
    const actress = selectActor(attackingTeam.players.filter(p => !redCards.has(p.instanceId)), ball, positions);
    if (!actress) break;

    const defender = selectDefender(defendingTeam.players.filter(p => !redCards.has(p.instanceId)), ball, positions);
    if (!defender) {
      if (zone === "finition") {
        const shotResult = resolveShot(actress, undefined, rng, minute, attackingTeam.mentality, formMap, ball, attackingTeam.tempo);
        if (shotResult.goal) score[attackingTeam.teamId]++;
        events.push({
          minute, type: shotResult.goal ? "goal" : "save",
          team: attackingTeam.teamId, player: actress.name, zone,
        });
        ball.x = 50; ball.y = 20;
        for (const p of allP) positions.set(p.instanceId, { x: p.baseX, y: p.baseY });
        continue;
      }
      ball.y = Math.max(0, ball.y - 5);
      continue;
    }

    // Taux d'erreur modulé par le tempo + la directivité
    const tempoErrMult = TEMPO_PARAMS[attackingTeam.tempo ?? 0].errorMult;
    const directnessErrMult = DIRECTNESS_PARAMS[attackingTeam.passingDirectness ?? 0].errorMult;
    if (rng() < 0.20 * tempoErrMult * directnessErrMult) {
      events.push({
        minute, type: "turnover", team: defendingTeam.teamId,
        player: actress.name + " (erreur)", zone,
      });
      ball.y = Math.max(0, ball.y - 5);
      ball.y = 100 - ball.y;
      justRecovered = true;
      [attackingTeam, defendingTeam] = [defendingTeam, attackingTeam];
      possessionSteps = 0;
      possessionStartY = ball.y;
      continue;
    }

    // Événements rares
    const rareRoll = rng();
    let rareEventHandled = false;

    // Frappe lointaine (5% en progression)
    if (zone === "progression" && rareRoll < 0.05 && !actress.isGK) {
      const gk = findGK(defendingTeam.players);
      const longShotScore = weightedScore(actress.stats, { tir: 1.0, puissance: 0.7 }, minute, attackingTeam.mentality, formMap?.get(actress.instanceId) ?? 1.0, 1.0, attackingTeam.tempo);
      const gkScore = gk ? weightedScore(gk.stats, GK_DEFENSE_WEIGHTS["finition"], minute, undefined, formMap?.get(gk.instanceId) ?? 1.0, 1.0, attackingTeam.tempo) : 0;
      const onTarget = rng() < 0.30;
      if (onTarget) {
        const goalProb = 1 / (1 + Math.exp(-0.35 * (longShotScore - gkScore)));
        const goal = rng() < goalProb;
        if (goal) {
          score[attackingTeam.teamId]++;
          events.push({ minute, type: "goal", team: attackingTeam.teamId, player: actress.name + " (CF)", zone });
        } else {
          events.push({ minute, type: "save", team: defendingTeam.teamId, player: gk?.name ?? "?", zone });
        }
        ball.x = 50; ball.y = 20;
        for (const p of allP) positions.set(p.instanceId, { x: p.baseX, y: p.baseY });
        justRecovered = true;
      [attackingTeam, defendingTeam] = [defendingTeam, attackingTeam];
        possessionSteps = 0;
        possessionStartY = ball.y;
        continue;
      }
      rareEventHandled = true;
    }
    // Erreur individuelle (2% toutes zones)
    if (!rareEventHandled && rng() < 0.02) {
      const errorPlayer = allP[Math.floor(rng() * allP.length)];
      events.push({ minute, type: "turnover", team: defendingTeam.teamId, player: errorPlayer.name, zone });
      ball.y = 100 - ball.y;
      justRecovered = true;
      [attackingTeam, defendingTeam] = [defendingTeam, attackingTeam];
      possessionSteps = 0;
      possessionStartY = ball.y;
      continue;
    }

    // Résoudre la micro-action
    const momAtk = minute <= momentumUntilMinute && momentumTeam === attackingTeam.teamId ? MOMENTUM_BOOST : minute <= momentumUntilMinute ? MOMENTUM_PENALTY : 1.0;
    const momDef = minute <= momentumUntilMinute && momentumTeam === defendingTeam.teamId ? MOMENTUM_BOOST : minute <= momentumUntilMinute ? MOMENTUM_PENALTY : 1.0;
    const resolved = resolveMicroAction(actress, defender, zone, ball, rng, minute, defendingTeam, attackingTeam, positions, formMap, momAtk, momDef, justRecovered, redCards);
    justRecovered = false;
    ball.x = resolved.newBall.x;
    ball.y = resolved.newBall.y;

    // Mettre à jour positions
    const event = resolved.success ? "possession" : "turnover";
    const newPositions = updatePositions(allP, ball, positions, event);
    for (const [k, v] of newPositions) positions.set(k, v);

    // Tracker possession
    possessionEvents.push(attackingTeam.teamId);

    // Enregistrer micro-action
    const posSnapshot: PlayerPosition[] = allP.map((p) => ({
      instanceId: p.instanceId,
      x: positions.get(p.instanceId)?.x ?? p.baseX,
      y: positions.get(p.instanceId)?.y ?? p.baseY,
    }));

    microActions.push({
      ball: { x: ball.x, y: ball.y },
      positions: posSnapshot,
      actress: actress.instanceId,
      defender: defender.instanceId,
      attackScore: weightedScore(actress.stats, ZONE_ATTACK_WEIGHTS[zone], minute, attackingTeam.mentality, formMap?.get(actress.instanceId) ?? 1.0, 1.0, attackingTeam.tempo),
      defenseScore: weightedScore(defender.stats, ZONE_DEFENSE_WEIGHTS[zone], minute, defendingTeam.mentality, formMap?.get(defender.instanceId) ?? 1.0, 1.0, defendingTeam.tempo),
      success: resolved.success,
      phaseKey: zone,
    });

    // Keyframe
    keyframes.push({
      step,
      minute,
      ball: { x: ball.x, y: ball.y },
      positions: posSnapshot,
      actress: actress.instanceId,
      defender: defender.instanceId,
      attackScore: microActions[microActions.length - 1].attackScore,
      defenseScore: microActions[microActions.length - 1].defenseScore,
      outcome: resolved.success ? "success" : "turnover",
    });

    // Possession inertia : pas de turnover avant MIN_POSSESSION_STEPS micro-actions
    if (!resolved.success) {
      possessionSteps++;

      if (possessionSteps < MIN_POSSESSION_STEPS) {
        possessionStartY = ball.y;
        continue;
      }

      if ((zone === "relance" || zone === "construction")
          && ball.y >= possessionStartY
          && (ball.y - possessionStartY < 20)) {
        possessionStartY = ball.y;
        continue;
      }

      // Turnover réel
      events.push({
        minute, type: "turnover", team: defendingTeam.teamId,
        player: defender.name, zone,
      });
      ball.y = 100 - ball.y;
      justRecovered = true;
      [attackingTeam, defendingTeam] = [defendingTeam, attackingTeam];
      possessionSteps = 0;
      possessionStartY = ball.y;
      continue;
    }

    // Sur succès : réinitialiser le compteur + tracker assist
    if (resolved.success) {
      possessionSteps = 0;
      possessionStartY = ball.y;
      if (zone !== "finition") lastAssister = actress.instanceId;
    }

    // Contre-attaque éclair
    if (resolved.breakaway) {
      events.push({ minute, type: "goal", team: attackingTeam.teamId, player: actress.name + " (contre-attaque)", zone });
    }

    // ─── Hors-jeu : après une action réussie en milieu/progression ──────────
    if (zone !== "relance" && zone !== "finition"
        && (resolved.newBall.y - ball.y + resolved.distance > 15)) {
      // Trouver le dernier défenseur (le plus proche du but adverse)
      const lastDefY = Math.max(...defendingTeam.players
        .filter(p => !p.isGK)
        .map(p => positions.get(p.instanceId)?.y ?? 100));
      const actressY = positions.get(actress.instanceId)?.y ?? 50;

      // L'actrice est-elle derrière la défense ?
      if (actressY > lastDefY + 5) {
        // Probabilité de hors-jeu : dépend du positionnement de la défense et de l'anticipation de l'attaque
        const offsideChance = ((defender.stats.agressivite ?? 50) / 200)
          * (1 - (actress.stats.anticipation ?? 50) / 150)
          * LIGNE_PARAMS[defendingTeam.defensiveLine ?? 0].offsideMult;
        if (rng() < Math.min(0.08, Math.max(0.01, offsideChance))) {
          events.push({ minute, type: "turnover", team: defendingTeam.teamId, player: "Hors-jeu (" + actress.name + ")", zone });
          ball.x = 50; ball.y = Math.max(20, ball.y - 10);
          justRecovered = true;
      [attackingTeam, defendingTeam] = [defendingTeam, attackingTeam];
          possessionSteps = 0; possessionStartY = ball.y;
          continue;
        }
      }
    }

    // ─── Fautes : après une action réussie, la défenseure peut faire faute ──
    if (resolved.success && zone !== "relance") {
      const foulProb = 0.04
        + ((defender.stats.agressivite ?? 50) - 50) / 800
        - ((defender.stats.tacle ?? 50) - 50) / 1000
        - ((defender.stats.decision ?? 50) - 50) / 1000;
      const prob = Math.max(0.01, Math.min(0.12, foulProb * MENTALITY_PARAMS[defendingTeam.mentality ?? 0].foulRiskMult));

      if (rng() < prob) {
        // ─── Carton (inclus dans le message du penalty/CF) ─────────────────
        let cardSuffix = "";
        const yellows = yellowCards.get(defender.instanceId) ?? 0;
        const isRough = (defender.stats.agressivite ?? 50) > 80 && (defender.stats.tacle ?? 50) < 65;
        if (zone === "finition" && isRough && rng() < 0.30) {
          redCards.add(defender.instanceId);
          cardSuffix = " 🔴 expulsée";
          // Si la GK est expulsée, une outfield devient gardienne
          if (defender.isGK) {
            const replacement = defendingTeam.players
              .filter(p => !redCards.has(p.instanceId) && !p.isGK)
              .sort((a, b) => (b.stats.tir ?? 0) - (a.stats.tir ?? 0))[0];
            if (replacement) {
              replacement.isGK = true;
              cardSuffix += " → " + replacement.name + " au but";
            }
          }
        } else if (yellows === 1) {
          redCards.add(defender.instanceId);
          cardSuffix = " 🟥 2e jaune";
          // Même logique pour second jaune GK
          if (defender.isGK) {
            const replacement = defendingTeam.players
              .filter(p => !redCards.has(p.instanceId) && !p.isGK)
              .sort((a, b) => (b.stats.tir ?? 0) - (a.stats.tir ?? 0))[0];
            if (replacement) {
              replacement.isGK = true;
              cardSuffix += " → " + replacement.name + " au but";
            }
          }
        } else if (isRough || zone === "finition" || rng() < 0.5) {
          yellowCards.set(defender.instanceId, yellows + 1);
          cardSuffix = " 🟨";
        }
        // ───────────────────────────────────────────────────────────────────

        if (zone === "finition") {
          // Penalty
          const pkResult = resolvePenalty(actress, findGK(defendingTeam.players), rng);
          if (pkResult.goal) {
            score[attackingTeam.teamId]++;
            events.push({ minute, type: "goal", team: attackingTeam.teamId, player: actress.name + " (penalty" + cardSuffix + ")", zone });
          } else {
            events.push({ minute, type: "save", team: defendingTeam.teamId, player: findGK(defendingTeam.players)?.name + " (penalty arrêté" + cardSuffix + ")", zone });
          }
          ball.x = 50; ball.y = 20;
          justRecovered = true;
      [attackingTeam, defendingTeam] = [defendingTeam, attackingTeam];
          possessionSteps = 0; possessionStartY = ball.y;
          continue;
        }

        // Coup franc
        const fkResult = resolveFreeKick(actress, findGK(defendingTeam.players),
          zone === "progression" ? "proche" : zone === "milieu" ? "moyen" : "loin", rng);
        if (fkResult.goal) {
          score[attackingTeam.teamId]++;
          events.push({ minute, type: "goal", team: attackingTeam.teamId, player: actress.name + " (CF" + cardSuffix + ")", zone });
        } else {
          events.push({ minute, type: "turnover", team: defendingTeam.teamId, player: defender.name + " (faute" + cardSuffix + ")", zone });
        }
        ball.x = 50; ball.y = 20;
        justRecovered = true;
      [attackingTeam, defendingTeam] = [defendingTeam, attackingTeam];
        possessionSteps = 0; possessionStartY = ball.y;
        continue;
      }
    }

    // Si en finition avec succès : tentative de but
    if (zone === "finition") {
      const gk = findGK(defendingTeam.players);
      const shotResult = resolveShot(actress, gk, rng, minute, attackingTeam.mentality, formMap, ball, attackingTeam.tempo);
      if (shotResult.goal) {
        score[attackingTeam.teamId]++;
        const assister = lastAssister && lastAssister !== actress.instanceId
          ? allP.find(p => p.instanceId === lastAssister)?.name
          : null;
        events.push({
          minute, type: "goal", team: attackingTeam.teamId,
          player: actress.name + (assister ? " (" + assister + ")" : ""), zone,
        });
        momentumTeam = attackingTeam.teamId;
        momentumUntilMinute = minute + MOMENTUM_DURATION;
        ball.x = 50; ball.y = 20;
        for (const p of allP) positions.set(p.instanceId, { x: p.baseX, y: p.baseY });
        justRecovered = true;
      [attackingTeam, defendingTeam] = [defendingTeam, attackingTeam];
        possessionSteps = 0; possessionStartY = ball.y;
      } else if (shotResult.save) {
        events.push({ minute, type: "save", team: defendingTeam.teamId, player: gk?.name ?? "?", zone });
        ball.y = 100 - ball.y;
        justRecovered = true;
      [attackingTeam, defendingTeam] = [defendingTeam, attackingTeam];
        possessionSteps = 0; possessionStartY = ball.y;
      } else {
        // Tir non cadré → résolution de l'arrêt de jeu
        const deadBall = rng();
        if (deadBall < 0.40) {
          // Corner
          const cornerResult = resolveCorner(attackingTeam, defendingTeam, rng);
          if (cornerResult.goal) {
            score[attackingTeam.teamId]++;
            events.push({ minute, type: "goal", team: attackingTeam.teamId, player: cornerResult.scorer + " (corner)", zone });
          } else {
            events.push({ minute, type: "turnover", team: defendingTeam.teamId, player: cornerResult.header + " (corner dégagé)", zone });
          }
        } else if (deadBall < 0.65) {
          // Dégagement (6 mètres)
          events.push({ minute, type: "turnover", team: defendingTeam.teamId, player: "Dégagement", zone });
          ball.x = 50; ball.y = 20;
        } else {
          // Sortie de but (goal kick)
          events.push({ minute, type: "turnover", team: defendingTeam.teamId, player: "Sortie de but", zone });
          ball.x = 50; ball.y = 15;
        }
        // L'équipe qui défendait récupère
        justRecovered = true;
      [attackingTeam, defendingTeam] = [defendingTeam, attackingTeam];
        possessionSteps = 0; possessionStartY = ball.y;
      }
    }

    // Touche : sortie sur l'axe x
    if (ball.x < 0 || ball.x > 100) {
      const zoneY = zoneFromY(ball.y);
      const longThrow = actress.stats.longThrows ?? 50;
      if ((zoneY === "progression" || zoneY === "finition") && longThrow > 70 && rng() < 0.03) {
        events.push({ minute, type: "goal", team: attackingTeam.teamId, player: actress.name + " (touche)", zone });
        score[attackingTeam.teamId]++;
      } else {
        events.push({ minute, type: "turnover", team: defendingTeam.teamId, player: "Touche " + (ball.x < 0 ? "gauche" : "droite"), zone });
      }
      ball.x = ball.x < 0 ? 1 : 99;
      ball.y = Math.max(10, Math.min(90, ball.y));
      justRecovered = true;
      [attackingTeam, defendingTeam] = [defendingTeam, attackingTeam];
      possessionSteps = 0; possessionStartY = ball.y;
      continue;
    }
  }

  const possession: Record<string, number> = {
    [home.teamId]: computePossession(0, home.teamId, possessionEvents),
    [away.teamId]: 100 - computePossession(0, home.teamId, possessionEvents),
  };

  return { score, events, keyframes, microActions, possession };
}
