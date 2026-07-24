/**
 * Test détaillé — Japon vs Argentine (5 matchs + 20 matchs agrégés)
 * Usage: npx tsx scripts/test_jpn_vs_arg.ts
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
  return { teamId, players, formation: FORMATION, links: [], activeSynergyAbilityIds: [] };
}

const ARG_IDS = [
  "soledad-diaz", "valentina-gimenez", "renata-navarro", "catalina-navarro",
  "martina-romero", "roxy-cabrera", "celeste-benitez", "melina-soria",
  "pilar-roldan", "mercedes-perez", "esperanza-galvan",
];

const JPN_IDS = [
  "karen-himekami", "shiori-saonji", "reika-shinomiya", "miyabi-kirishima",
  "hina-tsukiyomi", "hana-kamishiro", "momo-hasegawa", "rin-morishita",
  "yuriko-otake", "aya-mishima", "hinata-shigaki",
];

const argTeam = buildTeam(ARG_IDS, "ARG");
const jpnTeam = buildTeam(JPN_IDS, "JPN");

console.log("=== 5 Matchs JAPON vs ARGENTINE (détaillés) ===\n");

for (let i = 0; i < 5; i++) {
  const r = simulateMatch(jpnTeam, argTeam, `jvsa-${i}`, 60);
  
  // Répartition des zones
  const zones: Record<string, number> = { relance: 0, construction: 0, milieu: 0, progression: 0, finition: 0 };
  for (const ma of r.microActions) {
    zones[ma.phaseKey] = (zones[ma.phaseKey] || 0) + 1;
  }

  // Qui a joué le plus (actrices les plus fréquentes)
  const actressCount: Record<string, number> = {};
  for (const ma of r.microActions) {
    const p = [...jpnTeam.players, ...argTeam.players].find(p => p.instanceId === ma.actress);
    if (p) {
      actressCount[p.name] = (actressCount[p.name] || 0) + 1;
    }
  }
  const sortedActors = Object.entries(actressCount).sort((a, b) => b[1] - a[1]).slice(0, 6);

  console.log(`--- Match ${i + 1} ---`);
  console.log(`  Score:      JPN ${r.score.JPN} - ${r.score.ARG} ARG`);
  console.log(`  Possession: JPN ${r.possession.JPN}% / ARG ${r.possession.ARG}%`);
  console.log(`  Zones:      relance=${zones.relance} constr=${zones.construction} milieu=${zones.milieu} prog=${zones.progression} fin=${zones.finition}`);
  console.log(`  Top actrices:`);
  for (const [name, count] of sortedActors) {
    const team = jpnTeam.players.some(p => p.name === name) ? "JPN" : "ARG";
    console.log(`    ${name.padEnd(25)} ${count} actions (${team})`);
  }
  console.log(`  Événements (${r.events.length}):`);
  for (const e of r.events) {
    console.log(`    ${e.minute}' [${e.type}] ${e.player} — ${e.zone} (${e.team})`);
  }
  console.log();
}

// 20-match aggregate
console.log("=== 20 MATCHS — RÉSUMÉ ===");
let tJpn = 0, tArg = 0, tPoss = 0;
let wJpn = 0, wDraw = 0, wArg = 0;
for (let i = 0; i < 20; i++) {
  const r = simulateMatch(jpnTeam, argTeam, `jvsa-bulk-${i}`, 60);
  tJpn += r.score.JPN;
  tArg += r.score.ARG;
  tPoss += r.possession.JPN;
  if (r.score.JPN > r.score.ARG) wJpn++;
  else if (r.score.JPN === r.score.ARG) wDraw++;
  else wArg++;
}
console.log(`  Victoires: JPN ${wJpn} / Nuls ${wDraw} / ARG ${wArg}`);
console.log(`  Buts moyens: JPN ${(tJpn / 20).toFixed(1)} - ${(tArg / 20).toFixed(1)} ARG`);
console.log(`  Possession JPN: ${(tPoss / 20).toFixed(0)}%`);
console.log(`  Buts/match: ${((tJpn + tArg) / 20).toFixed(2)}`);
