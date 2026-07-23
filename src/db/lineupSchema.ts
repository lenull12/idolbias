import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { players } from "./schema";
import { cardInstances, chemistryPairs, characters, type Position, type Style, type Nation } from "./footballSchema";

export type FormationCode = "4-3-3" | "4-4-2" | "4-2-3-1";

export interface FormationSlot {
  slotId: string;
  position: Position;
  x: number;
  y: number;
  adjacentSlotIds: string[];
}

export const FORMATIONS: Record<FormationCode, FormationSlot[]> = {
  "4-3-3": [
    { slotId: "gb", position: "GB", x: 50, y: 92, adjacentSlotIds: ["def-c"] },
    { slotId: "def-l", position: "DEF", x: 20, y: 72, adjacentSlotIds: ["def-cl", "mil-l"] },
    { slotId: "def-cl", position: "DEF", x: 38, y: 76, adjacentSlotIds: ["def-l", "def-cr", "mil-c"] },
    { slotId: "def-cr", position: "DEF", x: 62, y: 76, adjacentSlotIds: ["def-cl", "def-r", "mil-c"] },
    { slotId: "def-r", position: "DEF", x: 80, y: 72, adjacentSlotIds: ["def-cr", "mil-r"] },
    { slotId: "mil-l", position: "MIL", x: 28, y: 50, adjacentSlotIds: ["def-l", "mil-c", "att-l"] },
    { slotId: "mil-c", position: "MIL", x: 50, y: 46, adjacentSlotIds: ["mil-l", "mil-r", "att-c"] },
    { slotId: "mil-r", position: "MIL", x: 72, y: 50, adjacentSlotIds: ["def-r", "mil-c", "att-r"] },
    { slotId: "att-l", position: "ATT", x: 22, y: 20, adjacentSlotIds: ["mil-l", "att-c"] },
    { slotId: "att-c", position: "ATT", x: 50, y: 14, adjacentSlotIds: ["att-l", "att-r", "mil-c"] },
    { slotId: "att-r", position: "ATT", x: 78, y: 20, adjacentSlotIds: ["mil-r", "att-c"] },
  ],
  "4-4-2": [
    { slotId: "gb", position: "GB", x: 50, y: 92, adjacentSlotIds: ["def-cl", "def-cr"] },
    { slotId: "def-l", position: "DEF", x: 18, y: 74, adjacentSlotIds: ["def-cl", "mil-l"] },
    { slotId: "def-cl", position: "DEF", x: 38, y: 78, adjacentSlotIds: ["def-l", "def-cr"] },
    { slotId: "def-cr", position: "DEF", x: 62, y: 78, adjacentSlotIds: ["def-cl", "def-r"] },
    { slotId: "def-r", position: "DEF", x: 82, y: 74, adjacentSlotIds: ["def-cr", "mil-r"] },
    { slotId: "mil-l", position: "MIL", x: 18, y: 48, adjacentSlotIds: ["def-l", "mil-cl", "att-l"] },
    { slotId: "mil-cl", position: "MIL", x: 40, y: 44, adjacentSlotIds: ["mil-l", "mil-cr"] },
    { slotId: "mil-cr", position: "MIL", x: 60, y: 44, adjacentSlotIds: ["mil-cl", "mil-r"] },
    { slotId: "mil-r", position: "MIL", x: 82, y: 48, adjacentSlotIds: ["def-r", "mil-cr", "att-r"] },
    { slotId: "att-l", position: "ATT", x: 38, y: 16, adjacentSlotIds: ["mil-l", "att-r"] },
    { slotId: "att-r", position: "ATT", x: 62, y: 16, adjacentSlotIds: ["mil-r", "att-l"] },
  ],
  "4-2-3-1": [
    { slotId: "gb", position: "GB", x: 50, y: 92, adjacentSlotIds: ["def-cl", "def-cr"] },
    { slotId: "def-l", position: "DEF", x: 18, y: 74, adjacentSlotIds: ["def-cl", "mil-dl"] },
    { slotId: "def-cl", position: "DEF", x: 38, y: 78, adjacentSlotIds: ["def-l", "def-cr", "mil-d1"] },
    { slotId: "def-cr", position: "DEF", x: 62, y: 78, adjacentSlotIds: ["def-cl", "def-r", "mil-d2"] },
    { slotId: "def-r", position: "DEF", x: 82, y: 74, adjacentSlotIds: ["def-cr", "mil-dr"] },
    { slotId: "mil-d1", position: "MIL", x: 40, y: 58, adjacentSlotIds: ["def-cl", "mil-d2", "att-c"] },
    { slotId: "mil-d2", position: "MIL", x: 60, y: 58, adjacentSlotIds: ["def-cr", "mil-d1", "att-c"] },
    { slotId: "mil-l", position: "MIL", x: 20, y: 34, adjacentSlotIds: ["mil-d1", "att-c"] },
    { slotId: "mil-c", position: "MIL", x: 50, y: 30, adjacentSlotIds: ["mil-d1", "mil-d2", "att-c"] },
    { slotId: "mil-r", position: "MIL", x: 80, y: 34, adjacentSlotIds: ["mil-d2", "att-c"] },
    { slotId: "att-c", position: "ATT", x: 50, y: 12, adjacentSlotIds: ["mil-c", "mil-l", "mil-r"] },
  ],
};

export const lineups = sqliteTable("lineups", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull().references(() => players.id),
  name: text("name").notNull().default("Mon équipe"),
  formationCode: text("formation_code").$type<FormationCode>().notNull().default("4-3-3"),
  assignments: text("assignments", { mode: "json" }).$type<Record<string, string | null>>().notNull(),
  mentality: text("mentality").$type<"defensive" | "balanced" | "offensive">().notNull().default("balanced"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export interface LinkChemistryInput {
  slotA: FormationSlot;
  slotB: FormationSlot;
  instanceA: { id: string; nation: Nation; position: Position };
  instanceB: { id: string; nation: Nation; position: Position };
  pair?: { matchesPlayedTogether: number };
}

export type LinkColor = "red" | "yellow" | "green";

const PAIR_MATCHES_FOR_BONUS = 5;

export function computeLinkChemistry(input: LinkChemistryInput): { score: 0 | 1 | 2 | 3; color: LinkColor } {
  let score = 0;
  if (input.instanceA.nation === input.instanceB.nation) score++;
  if (input.instanceA.position === input.slotA.position && input.instanceB.position === input.slotB.position) score++;
  if (input.pair && input.pair.matchesPlayedTogether >= PAIR_MATCHES_FOR_BONUS) score++;
  const color: LinkColor = score === 0 ? "red" : score <= 1 ? "yellow" : "green";
  return { score: score as 0 | 1 | 2 | 3, color };
}

export function computeAllLinks(
  formation: FormationSlot[],
  assignments: Record<string, string | null>,
  instances: Map<string, { id: string; nation: Nation; position: Position }>,
  pairsByKey: Map<string, { matchesPlayedTogether: number }>,
): { slotIdA: string; slotIdB: string; score: number; color: LinkColor }[] {
  const links: { slotIdA: string; slotIdB: string; score: number; color: LinkColor }[] = [];
  const seen = new Set<string>();

  for (const slotA of formation) {
    const instanceIdA = assignments[slotA.slotId];
    if (!instanceIdA) continue;
    const instanceA = instances.get(instanceIdA);
    if (!instanceA) continue;

    for (const adjId of slotA.adjacentSlotIds) {
      const linkKey = [slotA.slotId, adjId].sort().join("|");
      if (seen.has(linkKey)) continue;
      seen.add(linkKey);

      const slotB = formation.find((s) => s.slotId === adjId);
      const instanceIdB = slotB ? assignments[slotB.slotId] : null;
      if (!slotB || !instanceIdB) continue;
      const instanceB = instances.get(instanceIdB);
      if (!instanceB) continue;

      const pairKey = [instanceIdA, instanceIdB].sort().join("|");
      const pair = pairsByKey.get(pairKey);

      const { score, color } = computeLinkChemistry({ slotA, slotB, instanceA, instanceB, pair });
      links.push({ slotIdA: slotA.slotId, slotIdB: slotB.slotId, score, color });
    }
  }
  return links;
}

export const synergyGroups = sqliteTable("synergy_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  characterIds: text("character_ids", { mode: "json" }).$type<string[]>().notNull(),
  requireAdjacent: integer("require_adjacent", { mode: "boolean" }).notNull().default(false),
  statBoost: text("stat_boost", { mode: "json" }).$type<Partial<Record<string, number>>>(),
  abilityId: text("ability_id"),
});

export interface ActiveSynergy {
  groupId: string;
  activeCharacterSlotIds: string[];
}

export function resolveActiveSynergies(
  formation: FormationSlot[],
  assignments: Record<string, string | null>,
  instanceToCharacterId: Map<string, string>,
  groups: { id: string; characterIds: string[]; requireAdjacent: boolean }[],
): ActiveSynergy[] {
  const slotByCharacter = new Map<string, string>();
  for (const slot of formation) {
    const instanceId = assignments[slot.slotId];
    if (!instanceId) continue;
    const characterId = instanceToCharacterId.get(instanceId);
    if (characterId) slotByCharacter.set(characterId, slot.slotId);
  }

  const active: ActiveSynergy[] = [];
  for (const group of groups) {
    const slotIds = group.characterIds.map((cid) => slotByCharacter.get(cid)).filter(Boolean) as string[];
    if (slotIds.length !== group.characterIds.length) continue;

    if (group.requireAdjacent) {
      const allAdjacent = slotIds.every((sid, i) => {
        if (i === 0) return true;
        const slot = formation.find((s) => s.slotId === slotIds[i - 1]);
        return slot?.adjacentSlotIds.includes(sid);
      });
      if (!allAdjacent) continue;
    }

    active.push({ groupId: group.id, activeCharacterSlotIds: slotIds });
  }
  return active;
}
