import { generateStatsForRarity, type GeneratedStats } from "@/lib/statGenerator";
import { CHARACTER_STATS } from "@/data/characterStats";
import { getCharacters } from "@/data/footballCards";
import { FORMATIONS, computeAllLinks, type FormationCode, type FormationSlot } from "@/db/lineupSchema";
import { simulateMatch, type MatchPlayer, type TeamMatchInput, type TacticSlider, type MatchResult, type StatKey } from "@/lib/matchEngine";
import type { Rarity, Position12, Style, Nation, Position } from "@/db/footballSchema";

export type LabRarityMode = "fixed" | "random";

export interface LabConfig {
  nation: string;
  mode: LabRarityMode;
  fixedRarity: Rarity;
  individualRarities: Record<string, Rarity>;
  tactics: {
    mentality: TacticSlider;
    defensiveLine: TacticSlider;
    tempo: TacticSlider;
    passingDirectness: TacticSlider;
  };
}

export function randomRarity(rng: () => number): Rarity {
  const r = rng();
  if (r < 0.50) return "common";
  if (r < 0.80) return "rare";
  if (r < 0.94) return "epic";
  if (r < 0.99) return "legendary";
  return "secret";
}

export function randomizeRarities(nation: string, seed: string): Record<string, Rarity> {
  const characters = getCharacters().filter((c) => c.nation === nation);
  const rarities: Record<string, Rarity> = {};
  for (let i = 0; i < characters.length; i++) {
    const charSeed = seed + "-rand-" + i;
    let h = 0;
    for (let j = 0; j < charSeed.length; j++) h = (Math.imul(31, h) + charSeed.charCodeAt(j)) | 0;
    const rng = () => ((h >>> 0) % 100000) / 100000;
    rarities[characters[i].id] = randomRarity(rng);
    h = (h * 1103515245 + 12345) | 0;
  }
  return rarities;
}

export function assignCharactersToSlots(
  nation: string,
  formation: FormationSlot[],
): Record<string, string> {
  const characters = getCharacters().filter((c) => c.nation === nation);

  const groupPool: Record<string, string[]> = { GB: [], DEF: [], MIL: [], ATT: [] };
  for (const char of characters) {
    const cs = CHARACTER_STATS[char.id];
    if (!cs) continue;
    const group = cs.isGK ? "GB" : char.defaultPosition;
    groupPool[group] ??= [];
    groupPool[group].push(char.id);
  }

  const slotGroups: Record<string, string[]> = {};
  for (const slot of formation) {
    slotGroups[slot.position] ??= [];
    slotGroups[slot.position].push(slot.slotId);
  }

  const assignments: Record<string, string> = {};
  const assigned = new Set<string>();

  for (const [group, slotIds] of Object.entries(slotGroups)) {
    const pool = groupPool[group] ?? [];
    for (const slotId of slotIds) {
      let charId: string | undefined;
      if (pool.length > 0) {
        charId = pool.shift();
      } else {
        const surplusGroup = Object.entries(groupPool).find(([, p]) => p.length > 0);
        if (surplusGroup) {
          charId = surplusGroup[1].shift();
          console.warn(
            `[assignCharactersToSlots] ${nation}: slot ${slotId} needs ${group}, ` +
            `borrowing ${charId} from ${surplusGroup[0]}`,
          );
        }
      }
      if (charId) {
        assignments[slotId] = charId;
        assigned.add(charId);
      }
    }
  }

  const allIds = characters.map((c) => c.id);
  for (const id of allIds) {
    if (!assigned.has(id)) {
      const emptySlot = formation.find((s) => !assignments[s.slotId]);
      if (emptySlot) {
        assignments[emptySlot.slotId] = id;
        console.warn(
          `[assignCharactersToSlots] ${nation}: unassigned ${id} placed in ${emptySlot.slotId} (${emptySlot.position})`,
        );
      }
    }
  }

  return assignments;
}

export function buildTeamInput(
  nation: string,
  ratings: Record<string, Rarity>,
  tactics: { mentality: TacticSlider; defensiveLine: TacticSlider; tempo: TacticSlider; passingDirectness: TacticSlider },
  seed: string,
  formationCode: FormationCode = "4-3-3",
  preAssignments?: Record<string, string>, // slotId → characterId, si fourni skip auto-assign
): TeamMatchInput {
  const formation = FORMATIONS[formationCode];
  let assignments = preAssignments;
  if (preAssignments) {
    // Si preAssignments a des trous, les combler avec les joueuses restantes de la nation
    const assignedIds = new Set(Object.values(preAssignments).filter(Boolean));
    const nationChars = getCharacters().filter(c => c.nation === nation && !assignedIds.has(c.id));
    assignments = { ...preAssignments };
    for (const slot of formation) {
      if (!assignments[slot.slotId]) {
        const charId = nationChars.shift()?.id;
        if (charId) assignments[slot.slotId] = charId;
      }
    }
  } else {
    assignments = assignCharactersToSlots(nation, formation);
  }

  const characters = getCharacters();
  const charDefs = new Map(characters.map((c) => [c.id, c]));

  const players: MatchPlayer[] = formation.map((slot) => {
    const characterId = assignments[slot.slotId];
    const cs = CHARACTER_STATS[characterId];
    const rarity = ratings[characterId] ?? "common";
    const gen: GeneratedStats = generateStatsForRarity(characterId, rarity, seed + "-" + characterId);
    const stats: Partial<Record<StatKey, number>> = {
      ...(gen.phy ?? {}),
      ...(gen.men ?? {}),
      ...(gen.tec ?? {}),
      ...(gen.setPiece ?? {}),
      ...(gen.gk ?? {}),
    };

    const charDef = charDefs.get(characterId);

    return {
      instanceId: `${nation}-${characterId}-lab`,
      characterId,
      name: charDef?.name ?? characterId,
      slotId: slot.slotId,
      group: slot.position,
      position12: cs.position as Position12,
      role: cs.role ?? null,
      style: cs.style as Style,
      rarity,
      stats,
      tailleCm: gen.tailleCm,
      poidsKg: gen.poidsKg,
      piedPrefere: gen.piedPrefere,
      baseX: slot.x,
      baseY: slot.y,
      equippedSkills: [],
      isGK: cs.isGK,
    };
  });

  const instancesMap = new Map(
    players.map((p) => [p.instanceId, { id: p.instanceId, nation: nation as Nation, position: p.group }]),
  );

  const assignmentsByInstanceId: Record<string, string | null> = {};
  for (const slot of formation) {
    const instanceId = players.find((p) => p.slotId === slot.slotId)?.instanceId;
    assignmentsByInstanceId[slot.slotId] = instanceId ?? null;
  }

  const links = computeAllLinks(formation, assignmentsByInstanceId, instancesMap, new Map())
    .map((l) => ({ slotIdA: l.slotIdA, slotIdB: l.slotIdB, color: l.color }));

  return {
    teamId: nation,
    players,
    formation,
    links,
    activeSynergyAbilityIds: [],
    mentality: tactics.mentality,
    defensiveLine: tactics.defensiveLine,
    tempo: tactics.tempo,
    passingDirectness: tactics.passingDirectness,
  };
}

export interface BatchResult {
  winsHome: number;
  winsAway: number;
  draws: number;
  avgGoalsHome: number;
  avgGoalsAway: number;
  totalMatches: number;
}

export function runBatch(
  homeConfig: { nation: string; ratings: Record<string, Rarity>; tactics: LabConfig["tactics"]; formation?: FormationCode; assignments?: Record<string, string> },
  awayConfig: { nation: string; ratings: Record<string, Rarity>; tactics: LabConfig["tactics"]; formation?: FormationCode; assignments?: Record<string, string> },
  n: number,
  seed: string,
): BatchResult {
  let winsHome = 0, winsAway = 0, draws = 0, goalsHome = 0, goalsAway = 0;

  for (let i = 0; i < n; i++) {
    const batchSeed = seed + `-batch-${i}`;
    const home = buildTeamInput(homeConfig.nation, homeConfig.ratings, homeConfig.tactics, batchSeed, homeConfig.formation, homeConfig.assignments);
    const away = buildTeamInput(awayConfig.nation, awayConfig.ratings, awayConfig.tactics, batchSeed, awayConfig.formation, awayConfig.assignments);
    const result = simulateMatch(home, away, batchSeed);

    const sh = result.score[home.teamId] ?? 0;
    const sa = result.score[away.teamId] ?? 0;
    goalsHome += sh;
    goalsAway += sa;
    if (sh > sa) winsHome++;
    else if (sa > sh) winsAway++;
    else draws++;
  }

  return {
    winsHome,
    winsAway,
    draws,
    avgGoalsHome: goalsHome / n,
    avgGoalsAway: goalsAway / n,
    totalMatches: n,
  };
}
