import type { TecStats, PhyStats, MenStats, Position, Rarity } from "@/db/footballSchema";
import type { FormationSlot, LinkColor } from "@/db/lineupSchema";

export type StatKey = keyof TecStats | keyof PhyStats | keyof MenStats;

export interface MatchPlayer {
  instanceId: string;
  characterId: string;
  name: string;
  slotId: string;
  position: Position;
  stats: Record<StatKey, number>;
  equippedSkills: EquippedSkill[];
  rarity: Rarity;
}

export interface EquippedSkill {
  skillCardDefId: string;
  effectType: "stat_boost" | "special_ability";
  abilityId?: string;
  cooldownSeconds?: number;
  relevantPhases?: Phase[];
}

export interface TeamMatchInput {
  teamId: string;
  players: MatchPlayer[];
  formation: FormationSlot[];
  links: { slotIdA: string; slotIdB: string; color: LinkColor }[];
  activeSynergyAbilityIds: string[];
}

export type Phase = "construction" | "progression" | "creation" | "finition";

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
    result[key] = Math.max(1, Math.min(20, v));
  }
  return result;
}

const PHASE_ATTACK_WEIGHTS: Record<Phase, Partial<Record<StatKey, number>>> = {
  construction: { passe: 3, controle: 2, decision: 2 },
  progression: { dribble: 2, vitesse: 2, acceleration: 1, centre: 1 },
  creation: { dribble: 2, decision: 2, centre: 1, controle: 1 },
  finition: { tir: 3, sangFroid: 2, puissance: 1, detente: 1 },
};

const PHASE_DEFENSE_WEIGHTS: Record<Phase, Partial<Record<StatKey, number>>> = {
  construction: { agressivite: 2, anticipation: 2, positionnement: 1 },
  progression: { tacle: 2, positionnement: 2, anticipation: 1 },
  creation: { tacle: 2, agressivite: 1, positionnement: 2 },
  finition: { agilite: 2, anticipation: 2, positionnement: 1, detente: 1 },
};

function applyFatigue(stats: Record<StatKey, number>, minute: number, endurance: number): Record<StatKey, number> {
  if (minute <= 60) return stats;
  const progression = Math.min(1, (minute - 60) / 30);
  const resistance = endurance / 20;
  const fatigueFactor = progression * (1 - resistance) * 0.25;
  const result = {} as Record<StatKey, number>;
  for (const key of Object.keys(stats) as StatKey[]) {
    result[key] = stats[key] * (1 - fatigueFactor);
  }
  return result;
}

function statsAtMinute(player: MatchPlayer, minute: number): Record<StatKey, number> {
  return applyFatigue(player.stats, minute, player.stats.endurance);
}

function zoneScore(players: MatchPlayer[], weights: Partial<Record<StatKey, number>>, minute = 0): number {
  if (players.length === 0) return 10;
  const totalWeight = Object.values(weights).reduce((a, b) => a + (b ?? 0), 0);
  const perPlayer = players.map((p) => {
    const stats = statsAtMinute(p, minute);
    return (Object.entries(weights) as [StatKey, number][]).reduce((sum, [stat, w]) => sum + stats[stat] * w, 0) / totalWeight;
  });
  return perPlayer.reduce((a, b) => a + b, 0) / perPlayer.length;
}

function midfieldControlScore(team: TeamMatchInput, minute: number): number {
  const midfielders = team.players.filter((p) => p.position === "MIL");
  if (midfielders.length === 0) return 10;
  const scores = midfielders.map((p) => {
    const s = statsAtMinute(p, minute);
    return (s.passe + s.decision + s.controle) / 3;
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function playersForPhase(team: TeamMatchInput, phase: Phase, side: "attack" | "defense"): MatchPlayer[] {
  const roles: Record<Phase, Record<"attack" | "defense", Position[]>> = {
    construction: { attack: ["DEF", "MIL"], defense: ["ATT", "MIL"] },
    progression: { attack: ["MIL", "ATT"], defense: ["MIL", "DEF"] },
    creation: { attack: ["ATT", "MIL"], defense: ["DEF"] },
    finition: { attack: ["ATT"], defense: ["DEF", "GB"] },
  };
  const wanted = roles[phase][side];
  return team.players.filter((p) => wanted.includes(p.position));
}

function makeSeededRng(seed: string) {
  let state = 0;
  for (let i = 0; i < seed.length; i++) state = (Math.imul(31, state) + seed.charCodeAt(i)) | 0;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) | 0;
    return ((state >>> 0) % 100000) / 100000;
  };
}

function resolvePhaseProbability(attackScore: number, defenseScore: number, k = 0.35): number {
  return 1 / (1 + Math.exp(-k * (attackScore - defenseScore)));
}

export type TimingProvider = (context: { phase: Phase; player: MatchPlayer }) => number;

const defaultTimingProvider: TimingProvider = () => 0.6;

export interface AbilityActivation {
  player: MatchPlayer;
  skill: EquippedSkill;
  timingAccuracy: number;
}

function pickAbility(
  player: MatchPlayer,
  phase: Phase,
  cooldowns: Map<string, number>,
): EquippedSkill | null {
  const available = player.equippedSkills.filter(
    (s) => s.effectType === "special_ability" && (cooldowns.get(s.skillCardDefId) ?? 0) <= 0
  );
  if (available.length === 0) return null;

  const inPhase = available.filter((s) => (s.relevantPhases ?? ["creation", "finition"]).includes(phase));
  if (inPhase.length > 0) return inPhase[0];

  return phase === "finition" ? available[0] : null;
}

function resolveActionWithLayers(
  baseProb: number,
  activation: AbilityActivation | null,
  abilityBonus = 0.25,
): number {
  if (!activation) return baseProb;
  return Math.min(0.95, baseProb + abilityBonus * activation.timingAccuracy);
}

export interface MatchEvent {
  minute: number;
  type: "chance" | "goal" | "save" | "turnover" | "signature";
  team: string;
  player: string;
  phase: Phase;
}

export interface Keyframe {
  minute: number;
  phase: Phase;
  ballZone: { x: number; y: number };
  involvedPlayers: { playerId: string; x: number; y: number }[];
  outcome?: "success" | "turnover" | "goal" | "save" | "signature";
}

interface SequenceResult {
  events: MatchEvent[];
  keyframes: Keyframe[];
  goalScored: boolean;
  scoringTeam?: string;
}

const PHASES: Phase[] = ["construction", "progression", "creation", "finition"];

function resolveSequence(
  attackingTeam: TeamMatchInput,
  defendingTeam: TeamMatchInput,
  minute: number,
  cooldowns: Map<string, number>,
  rng: () => number,
  timingProvider: TimingProvider = defaultTimingProvider,
): SequenceResult {
  const events: MatchEvent[] = [];
  const keyframes: Keyframe[] = [];

  for (const phase of PHASES) {
    const attackers = playersForPhase(attackingTeam, phase, "attack");
    const defenders = playersForPhase(defendingTeam, phase, "defense");

    const attackScore = zoneScore(attackers, PHASE_ATTACK_WEIGHTS[phase], minute);
    const defenseScore = zoneScore(defenders, PHASE_DEFENSE_WEIGHTS[phase], minute);
    let prob = resolvePhaseProbability(attackScore, defenseScore, phase === "finition" ? 0.4 : 0.3);

    const lead = attackers[0];
    let activation: AbilityActivation | null = null;
    if (lead) {
      const skill = pickAbility(lead, phase, cooldowns);
      if (skill) {
        const timingAccuracy = timingProvider({ phase, player: lead });
        activation = { player: lead, skill, timingAccuracy };
        prob = resolveActionWithLayers(prob, activation);
        if (skill.cooldownSeconds) cooldowns.set(skill.skillCardDefId, skill.cooldownSeconds);
      }
    }

    const success = rng() < prob;
    const isSignature = !!activation && activation.timingAccuracy > 0.85 && success;

    keyframes.push({
      minute,
      phase,
      ballZone: { x: PHASE_X[phase], y: 50 },
      involvedPlayers: [...attackers, ...defenders].map((p) => ({ playerId: p.instanceId, x: PHASE_X[phase], y: 50 })),
      outcome: !success ? "turnover" : phase === "finition" ? (isSignature ? "signature" : "goal") : "success",
    });

    if (!success) {
      events.push({ minute, type: "turnover", team: defendingTeam.teamId, player: defenders[0]?.name ?? "?", phase });
      return { events, keyframes, goalScored: false };
    }

    if (phase === "finition") {
      events.push({
        minute,
        type: isSignature ? "signature" : "goal",
        team: attackingTeam.teamId,
        player: lead?.name ?? "?",
        phase,
      });
      return { events, keyframes, goalScored: true, scoringTeam: attackingTeam.teamId };
    }
  }

  return { events, keyframes, goalScored: false };
}

const PHASE_X: Record<Phase, number> = { construction: 25, progression: 50, creation: 70, finition: 88 };

export interface MatchResult {
  events: MatchEvent[];
  keyframes: Keyframe[];
  score: Record<string, number>;
}

export function simulateMatch(
  home: TeamMatchInput,
  away: TeamMatchInput,
  seed: string,
  sequenceCount = 20,
  timingProvider?: TimingProvider,
): MatchResult {
  const rng = makeSeededRng(seed);
  const events: MatchEvent[] = [];
  const keyframes: Keyframe[] = [];
  const score: Record<string, number> = { [home.teamId]: 0, [away.teamId]: 0 };
  const cooldownsHome = new Map<string, number>();
  const cooldownsAway = new Map<string, number>();

  for (let i = 0; i < sequenceCount; i++) {
    const minute = Math.round((i / sequenceCount) * 90);
    const homeMil = midfieldControlScore(home, minute);
    const awayMil = midfieldControlScore(away, minute);
    const homePossessionProb = 0.3 + 0.4 * (homeMil / (homeMil + awayMil));
    const homeAttacks = rng() < homePossessionProb;
    const [attackingTeam, defendingTeam, cds] = homeAttacks
      ? [home, away, cooldownsHome]
      : [away, home, cooldownsAway];

    const result = resolveSequence(attackingTeam, defendingTeam, minute, cds, rng, timingProvider);
    events.push(...result.events);
    keyframes.push(...result.keyframes);
    if (result.goalScored && result.scoringTeam) score[result.scoringTeam]++;
  }

  return { events, keyframes, score };
}
