/**
 * Test du moteur de match v2 — Phase 1
 * Usage: npx tsx scripts/test_match.ts
 */

import { simulateMatch } from "../src/lib/matchEngine";
import { CHARACTER_STATS } from "../src/data/characterStats";
import { CHARACTERS } from "../src/data/footballCards";
import { FORMATIONS } from "../src/db/lineupSchema";
import type { TeamMatchInput, MatchPlayer } from "../src/lib/matchEngine";
import type { StatKey } from "../src/lib/matchEngine";
import type { Position12, Style } from "../src/db/footballSchema";

const FORMATION = FORMATIONS["4-3-3"];

function buildPlayer(char: typeof CHARACTERS[0], slot: typeof FORMATION[0]): MatchPlayer {
  const cs = CHARACTER_STATS[char.id];
  const pos12 = (cs?.position ?? "ST") as Position12;
  const stats: Partial<Record<StatKey, number>> = {};
  if (cs?.stats) {
    for (const [k, v] of Object.entries(cs.stats)) {
      stats[k as StatKey] = v as number;
    }
  }
  return {
    instanceId: `${char.id}-${slot.slotId}`,
    characterId: char.id,
    name: char.name,
    slotId: slot.slotId,
    group: char.defaultPosition,
    position12: pos12,
    role: cs?.role ?? null,
    style: char.defaultStyle as Style,
    rarity: "common",
    stats,
    tailleCm: cs?.tailleCm ?? 170,
    poidsKg: cs?.poidsKg ?? 65,
    piedPrefere: cs?.piedPrefere ?? "right",
    baseX: slot.x,
    baseY: slot.y,
    equippedSkills: [],
    isGK: pos12 === "GK",
  };
}

function buildTeam(ids: string[], teamId: string): TeamMatchInput {
  const chars = ids.map((id) => CHARACTERS.find((c) => c.id === id)).filter(Boolean) as typeof CHARACTERS;
  const slots = FORMATION.slice(0, chars.length);
  const players = chars.map((c, i) => buildPlayer(c, slots[i]));
  return {
    teamId,
    players,
    formation: FORMATION,
    links: [],
    activeSynergyAbilityIds: [],
  };
}

const ARG_IDS = [
  "soledad-diaz", "valentina-gimenez", "renata-navarro", "catalina-navarro",
  "martina-romero", "roxy-cabrera", "celeste-benitez", "melina-soria",
  "pilar-roldan", "mercedes-perez", "esperanza-galvan",
];

const JPN_IDS = [
  "karen-himekami", "shiori-saonji", "reika-shinomiya", "miyabi-kirishima",
  "hina-tsukiyomi", "hana-kamishiro", "momo-hasegawa", "rin-morishita",
  "yuriko-take", "aya-mishima", "hinata-shigaki",
];

const home = buildTeam(ARG_IDS, "ARG");
const away = buildTeam(ARG_IDS, "ARG2");

console.log("\n=== Test 1: Argentine vs Argentine (10 matchs) ===");
const allScores: Record<string, number[]> = { ARG: [], ARG2: [] };
const allPossession: Record<string, number[]> = { ARG: [], ARG2: [] };
let totalGoals = 0;
for (let i = 0; i < 10; i++) {
  const r = simulateMatch(home, away, `arg-vs-arg-${i}`, 120);
  allScores.ARG.push(r.score.ARG);
  allScores.ARG2.push(r.score.ARG2);
  allPossession.ARG.push(r.possession.ARG);
  allPossession.ARG2.push(r.possession.ARG2);
  totalGoals += r.score.ARG + r.score.ARG2;
}
const avgARG = allScores.ARG.reduce((a, b) => a + b, 0) / 10;
const avgARG2 = allScores.ARG2.reduce((a, b) => a + b, 0) / 10;
const avgPoss = allPossession.ARG.reduce((a, b) => a + b, 0) / 10;
console.log(`  Score moyen: ARG ${avgARG.toFixed(1)} - ${avgARG2.toFixed(1)} ARG2`);
console.log(`  Possession moyenne: ARG ${avgPoss.toFixed(0)}%`);
console.log(`  Buts/match: ${(totalGoals / 10).toFixed(2)}`);
console.log(`  Matchs: ${allScores.ARG.map((g, i) => `${g}-${allScores.ARG2[i]}`).join(", ")}`);

console.log("\n=== Test 2: Déterminisme (même seed → même résultat) ===");
const rDet1 = simulateMatch(home, away, "det-seed", 120);
const rDet2 = simulateMatch(home, away, "det-seed", 120);
const deterministic = JSON.stringify(rDet1.score) === JSON.stringify(rDet2.score);
console.log(`  ${deterministic ? "✅ Déterministe" : "❌ Non-déterministe"}`);

console.log("\n=== Test 3: Japon vs Argentine (vrais rosters 22 joueuses) ===");
const japan = buildTeam(JPN_IDS, "JPN");
const rJvA = simulateMatch(japan, home, "japan-vs-arg", 120);
console.log(`  Score: JPN ${rJvA.score.JPN} - ${rJvA.score.ARG} ARG`);
console.log(`  Possession: JPN ${rJvA.possession.JPN}% / ARG ${rJvA.possession.ARG}%`);
console.log(`  Événements: ${rJvA.events.length}`);
for (const e of rJvA.events) {
  console.log(`    ${e.minute}' [${e.type}] ${e.player} — ${e.zone} (${e.team})`);
}

console.log("\n=== Test 4: ARG (moyenne ~85) vs rookies (moyenne ~77) ===");
const WEAK_IDS = [
  "celeste-benitez", "celeste-benitez", "celeste-benitez", "celeste-benitez",
  "celeste-benitez", "celeste-benitez", "celeste-benitez", "celeste-benitez",
  "celeste-benitez", "celeste-benitez", "esperanza-galvan",
];
const weak = buildTeam(WEAK_IDS, "WEAK");
const r3 = simulateMatch(home, weak, "test-seed-3", 120);
console.log(`  Score: ARG ${r3.score.ARG} - ${r3.score.WEAK} WEAK`);

console.log("\n=== Test 5: ARG vs gardienne seule ===");
const solo = buildTeam(["esperanza-galvan"], "SOLO");
const r4 = simulateMatch(home, solo, "test-seed-4", 120);
console.log(`  Score: ARG ${r4.score.ARG} - ${r4.score.SOLO} SOLO`);

console.log("\n=== Test 6: RPS — Pressing vs Vista ===");
const PRESSING_IDS = ["martina-romero", "melina-soria"];
const VISTA_IDS = ["soledad-diaz", "celeste-benitez"];
const pressTeam = buildTeam([...PRESSING_IDS, ...PRESSING_IDS, ...PRESSING_IDS, ...PRESSING_IDS, ...PRESSING_IDS.slice(0, 3)], "PRESS");
const vistaTeam = buildTeam([...VISTA_IDS, ...VISTA_IDS, ...VISTA_IDS, ...VISTA_IDS, ...VISTA_IDS.slice(0, 3)], "VISTA");
const r5 = simulateMatch(pressTeam, vistaTeam, "test-seed-5", 120);
console.log(`  Score: PRESS ${r5.score.PRESS} - ${r5.score.VISTA} VISTA`);

console.log("\n=== Test 7: 100 simulations — distribution des scores ===");
const scores: number[] = [];
for (let i = 0; i < 100; i++) {
  const r = simulateMatch(home, away, `bulk-${i}`, 120);
  const total = Object.values(r.score).reduce((a, b) => a + b, 0);
  scores.push(total);
}
const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
const max = Math.max(...scores);
const min = Math.min(...scores);
console.log(`  Buts/moy: ${avg.toFixed(2)}, min: ${min}, max: ${max} (sur 100 matchs)`);
console.log(`  Distribution:`, scores.filter(s => s <= 1).length, "x 0-1 buts,",
  scores.filter(s => s > 1 && s <= 3).length, "x 2-3 buts,",
  scores.filter(s => s > 3).length, "x 4+ buts");

console.log("\n✅ Tests terminés.\n");
