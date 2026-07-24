/**
 * TEST COMPLET — Moteur de match v2
 * Usage: npx tsx scripts/test_engine_full.ts
 *
 * Couvre :
 *   – ARG vs ARG (mêmes équipes, toutes mentalités)
 *   – ARG vs JPN (toutes mentalités croisées)
 *   – ARG vs SOLO, JPN vs SOLO (gardienne seule)
 *   – ARG vs WEAK (rookies)
 *   – 100 sims pour distribution des scores
 *   – Détail des zones, actrices, événements
 */

import { simulateMatch, type TeamMatchInput, type MatchPlayer } from "../src/lib/matchEngine";
import { CHARACTER_STATS } from "../src/data/characterStats";
import { CHARACTERS } from "../src/data/footballCards";
import { FORMATIONS } from "../src/db/lineupSchema";
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
    role: null,
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

// ─── Rosters ────────────────────────────────────────────────────────────────

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

const WEAK_IDS = Array(11).fill("celeste-benitez"); // 11 × Celeste = 77 base
const SOLO_IDS = ["esperanza-galvan"];

// ─── Helpers ────────────────────────────────────────────────────────────────

function zoneBreakdown(actions: { phaseKey: string }[]): Record<string, number> {
  const z: Record<string, number> = { relance: 0, construction: 0, milieu: 0, progression: 0, finition: 0 };
  for (const ma of actions) z[ma.phaseKey] = (z[ma.phaseKey] || 0) + 1;
  return z;
}

function topActors(actions: { actress: string }[], players: MatchPlayer[], teamIdA: string, teamIdB: string, limit = 5): string[] {
  const count: Record<string, number> = {};
  for (const ma of actions) {
    const p = players.find(p => p.instanceId === ma.actress);
    if (p) count[p.name] = (count[p.name] || 0) + 1;
  }
  return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([n, c]) => `${n} (${c}x)`);
}

function detailMatch(m: number, teamA: TeamMatchInput, teamB: TeamMatchInput, labelA: string, labelB: string, seed: string) {
  const r = simulateMatch(teamA, teamB, seed, 120);
  const zones = zoneBreakdown(r.microActions);
  const allPlayers = [...teamA.players, ...teamB.players];
  const actors = topActors(r.microActions, allPlayers, teamA.teamId, teamB.teamId, 6);

  const label = `${labelA}(${teamA.mentality}) vs ${labelB}(${teamB.mentality})`;

  console.log(`\n#${m} ${label}`);
  console.log(`  Score:      ${teamA.teamId} ${r.score[teamA.teamId]} - ${r.score[teamB.teamId]} ${teamB.teamId}`);
  console.log(`  Possession: ${teamA.teamId} ${r.possession[teamA.teamId]}% / ${teamB.teamId} ${r.possession[teamB.teamId]}%`);
  console.log(`  Zones:      ${Object.entries(zones).filter(([_, v]) => v > 0).map(([k, v]) => `${k}=${v}`).join(" ")}`);
  console.log(`  Top actrices:`);
  for (const a of actors) console.log(`    ${a}`);
  console.log(`  Événements (${r.events.length}):`);
  for (const e of r.events) {
    console.log(`    ${e.minute}' [${e.type}] ${e.player} — ${e.zone} (${e.team})`);
  }
}

function simN(teamA: TeamMatchInput, teamB: TeamMatchInput, n: number, prefix: string) {
  let tA = 0, tB = 0, tPoss = 0;
  let wA = 0, wD = 0, wB = 0;
  let maxGoals = 0, minGoals = 99;
  const scores: number[] = [];
  const zonesTotal: Record<string, number> = { relance: 0, construction: 0, milieu: 0, progression: 0, finition: 0 };
  let turnovers = 0, goals = 0, saves = 0;

  for (let i = 0; i < n; i++) {
    const r = simulateMatch(teamA, teamB, `${prefix}-${i}`, 120);
    tA += r.score[teamA.teamId];
    tB += r.score[teamB.teamId];
    tPoss += r.possession[teamA.teamId];
    const total = r.score[teamA.teamId] + r.score[teamB.teamId];
    scores.push(total);
    if (total > maxGoals) maxGoals = total;
    if (total < minGoals) minGoals = total;
    if (r.score[teamA.teamId] > r.score[teamB.teamId]) wA++;
    else if (r.score[teamA.teamId] === r.score[teamB.teamId]) wD++;
    else wB++;
    for (const ma of r.microActions) zonesTotal[ma.phaseKey]++;
    for (const e of r.events) {
      if (e.type === "turnover") turnovers++;
      else if (e.type === "goal") goals++;
      else if (e.type === "save") saves++;
    }
  }

  const zonesStr = Object.entries(zonesTotal)
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => `${k}=${Math.round(v / n)}`)
    .join(" ");

  return {
    label: `${teamA.teamId} vs ${teamB.teamId}`,
    avgA: (tA / n).toFixed(1),
    avgB: (tB / n).toFixed(1),
    avgPoss: (tPoss / n).toFixed(0),
    wins: { [teamA.teamId]: wA, draw: wD, [teamB.teamId]: wB },
    avgGoals: ((tA + tB) / n).toFixed(2),
    maxGoals, minGoals,
    zonesPerMatch: zonesStr,
    avgTurnovers: (turnovers / n / 60 * 100).toFixed(0) + "%",
    avgGoalsPerMatch: (goals / n).toFixed(1),
    dist1: scores.filter(s => s <= 1).length,
    dist23: scores.filter(s => s > 1 && s <= 3).length,
    dist4: scores.filter(s => s > 3).length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log("╔══════════════════════════════════════════════════════════════════╗");
console.log("║           MOTEUR DE MATCH V2 — BATTERIE DE TESTS COMPLÈTE       ║");
console.log("╚══════════════════════════════════════════════════════════════════╝");

// ─── TEST 1 : ARG vs ARG (toutes mentalités) ───────────────────────────────

console.log("\n\n═══════════════════════════════════════════════════════════════════");
console.log(" TEST 1 : ARG vs ARG2 — ÉQUIPES IDENTIQUES");
console.log("═══════════════════════════════════════════════════════════════════");

const arg = buildTeam(ARG_IDS, "ARG");
const arg2 = buildTeam(ARG_IDS, "ARG2");
detailMatch(1, arg, arg2, "ARG", "ARG2", "arg-arg");

console.log("\n\n═══ RÉSUMÉ 20 MATCHS — ARG vs ARG2 ═══");
let r = simN(arg, arg2, 20, "arg-arg-bulk");
console.log(`  ${r.label}`);
console.log(`    Score: ${r.avgA} - ${r.avgB} | Poss: ${r.avgPoss}% | Buts/match: ${r.avgGoals}`);
console.log(`    Max: ${r.maxGoals} / Min: ${r.minGoals} | Victoires: ${JSON.stringify(r.wins)}`);
console.log(`    Zones/moy: ${r.zonesPerMatch}`);
console.log(`    Buts: ${r.avgGoalsPerMatch} | Turnovers zonage: ${r.avgTurnovers}`);
console.log(`    Distrib: 0-1:${r.dist1}  2-3:${r.dist23}  4+:${r.dist4}`);

// ─── TEST 2 : ARG vs JPN ───────────────────────────────────────────────────

console.log("\n\n═══════════════════════════════════════════════════════════════════");
console.log(" TEST 2 : ARG vs JPN — 10 MATCHS DÉTAILLÉS");
console.log("═══════════════════════════════════════════════════════════════════");

for (let i = 0; i < 3; i++) {
  const a = buildTeam(ARG_IDS, "ARG");
  const j = buildTeam(JPN_IDS, "JPN");
  detailMatch(i + 1, a, j, "ARG", "JPN", `arg-jpn-${i}`);
}

console.log("\n\n═══ RÉSUMÉ 20 MATCHS — ARG vs JPN ═══");
r = simN(buildTeam(ARG_IDS, "ARG"), buildTeam(JPN_IDS, "JPN"), 20, "arg-jpn-bulk");
console.log(`  ${r.label}`);
console.log(`    Score: ${r.avgA} - ${r.avgB} | Poss: ${r.avgPoss}% | Buts/match: ${r.avgGoals}`);
console.log(`    Victoires: ${JSON.stringify(r.wins)} | Max: ${r.maxGoals} Min: ${r.minGoals}`);
console.log(`    Zones/moy: ${r.zonesPerMatch}`);
console.log(`    Distrib: 0-1:${r.dist1}  2-3:${r.dist23}  4+:${r.dist4}`);

// ─── TEST 3 : Équipes vs gardienne seule ───────────────────────────────────

console.log("\n\n═══════════════════════════════════════════════════════════════════");
console.log(" TEST 3 : ÉQUIPES vs GARDIENNE SEULE");
console.log("═══════════════════════════════════════════════════════════════════");

r = simN(buildTeam(ARG_IDS, "ARG"), buildTeam(SOLO_IDS, "SOLO"), 10, "arg-solo");
console.log(`  ARG vs SOLO`);
console.log(`    Score: ${r.avgA} - ${r.avgB} | Poss: ${r.avgPoss}% | Buts/match: ${r.avgGoals}`);
console.log(`    Max: ${r.maxGoals} Min: ${r.minGoals} | Zones/moy: ${r.zonesPerMatch}`);

r = simN(buildTeam(JPN_IDS, "JPN"), buildTeam(SOLO_IDS, "SOLO"), 10, "jpn-solo");
console.log(`  JPN vs SOLO`);
console.log(`    Score: ${r.avgA} - ${r.avgB} | Poss: ${r.avgPoss}% | Buts/match: ${r.avgGoals}`);
console.log(`    Max: ${r.maxGoals} Min: ${r.minGoals} | Zones/moy: ${r.zonesPerMatch}`);

// ─── TEST 4 : Équipes vs rookies ───────────────────────────────────────────

console.log("\n\n═══════════════════════════════════════════════════════════════════");
console.log(" TEST 4 : ÉQUIPES vs ROOKIES");
console.log("═══════════════════════════════════════════════════════════════════");

r = simN(buildTeam(ARG_IDS, "ARG"), buildTeam(WEAK_IDS, "WEAK"), 10, "arg-weak");
console.log(`  ARG vs WEAK`);
console.log(`    Score: ${r.avgA} - ${r.avgB} | Poss: ${r.avgPoss}% | Buts/match: ${r.avgGoals}`);
console.log(`    Zones/moy: ${r.zonesPerMatch} | Max: ${r.maxGoals} Min: ${r.minGoals}`);

r = simN(buildTeam(JPN_IDS, "JPN"), buildTeam(WEAK_IDS, "WEAK"), 10, "jpn-weak");
console.log(`  JPN vs WEAK`);
console.log(`    Score: ${r.avgA} - ${r.avgB} | Poss: ${r.avgPoss}% | Buts/match: ${r.avgGoals}`);
console.log(`    Zones/moy: ${r.zonesPerMatch} | Max: ${r.maxGoals} Min: ${r.minGoals}`);

// ─── TEST 5 : 100 sims ARG vs ARG ──────────────────────────────────────────

console.log("\n\n═══════════════════════════════════════════════════════════════════");
console.log(" TEST 5 : 100 SIMS — DISTRIBUTION (ARG vs ARG2)");
console.log("═══════════════════════════════════════════════════════════════════");

const scores: number[] = [];
for (let i = 0; i < 100; i++) {
  const m = simulateMatch(buildTeam(ARG_IDS, "ARG"), buildTeam(ARG_IDS, "ARG2"), `dist-${i}`, 120);
  scores.push(m.score.ARG + m.score.ARG2);
}
const avg100 = scores.reduce((a, b) => a + b, 0) / 100;
const max100 = Math.max(...scores);
const min100 = Math.min(...scores);
console.log(`  moy=${avg100.toFixed(2)} min=${min100} max=${max100}`);
console.log(`  0-1:${scores.filter(s => s <= 1).length}  2-3:${scores.filter(s => s > 1 && s <= 3).length}  4+:${scores.filter(s => s > 3).length}`);

// ─── TEST 6 : 100 sims ARG vs JPN ─────────────────────────────────────────

console.log("\n\n═══════════════════════════════════════════════════════════════════");
console.log(" TEST 6 : 100 SIMS — ARG vs JPN");
console.log("═══════════════════════════════════════════════════════════════════");

const jpnScores: number[] = [];
for (let i = 0; i < 100; i++) {
  const m = simulateMatch(buildTeam(ARG_IDS, "ARG"), buildTeam(JPN_IDS, "JPN"), `arg-jpn-dist-${i}`, 120);
  jpnScores.push(m.score.ARG + m.score.JPN);
}
const avgJpn = jpnScores.reduce((a, b) => a + b, 0) / 100;
const maxJpn = Math.max(...jpnScores);
console.log(`  ARG vs JPN: moy=${avgJpn.toFixed(2)} max=${maxJpn}  0-1:${jpnScores.filter(s => s <= 1).length}  2-3:${jpnScores.filter(s => s > 1 && s <= 3).length}  4+:${jpnScores.filter(s => s > 3).length}`);

// ─── TEST 7 : Match ultra-détaillé ─────────────────────────────────────────

console.log("\n\n═══════════════════════════════════════════════════════════════════");
console.log(" TEST 7 : MATCH ULTRA-DÉTAILLÉ — ARG vs JPN");
console.log("═══════════════════════════════════════════════════════════════════");
const argDet = buildTeam(ARG_IDS, "ARG");
const jpnDet = buildTeam(JPN_IDS, "JPN");
const rDetail = simulateMatch(argDet, jpnDet, "ultra-detail", 120);
const allPlayers = [...argDet.players, ...jpnDet.players];
const zones = zoneBreakdown(rDetail.microActions);

console.log(`Score: ARG ${rDetail.score.ARG} - ${rDetail.score.JPN} JPN`);
console.log(`Possession: ARG ${rDetail.possession.ARG}% / JPN ${rDetail.possession.JPN}%`);
console.log(`Zones: ${Object.entries(zones).filter(([_, v]) => v > 0).map(([k, v]) => `${k}=${v}`).join(" ")}`);

// Stats des actrices
const actressStats: Record<string, { total: number; succès: number }> = {};
for (const ma of rDetail.microActions) {
  const p = allPlayers.find(p => p.instanceId === ma.actress);
  if (p) {
    if (!actressStats[p.name]) actressStats[p.name] = { total: 0, succès: 0 };
    actressStats[p.name].total++;
    if (ma.success) actressStats[p.name].succès++;
  }
}
console.log(`\nActrices (trié par actions) :`);
const sorted = Object.entries(actressStats).sort((a, b) => b[1].total - a[1].total);
for (const [name, stats] of sorted) {
  const team = argDet.players.some(p => p.name === name) ? "ARG" : "JPN";
  const pct = stats.total > 0 ? Math.round(stats.succès / stats.total * 100) : 0;
  console.log(`  ${name.padEnd(25)} ${team}  ${stats.total.toString().padStart(3)} actions  ${stats.succès}/${stats.total} succès (${pct}%)`);
}

// Toutes les micro-actions
console.log(`\nTIMELINE COMPLÈTE (${rDetail.microActions.length} micro-actions) :`);
for (let i = 0; i < rDetail.microActions.length; i++) {
  const ma = rDetail.microActions[i];
  const actress = allPlayers.find(p => p.instanceId === ma.actress);
  const defens = allPlayers.find(p => p.instanceId === ma.defender);
  const aname = actress?.name ?? "?";
  const dname = defens?.name ?? "?";
  const ateam = argDet.players.some(p => p.instanceId === ma.actress) ? "ARG" : "JPN";
  const minute = Math.round((i / rDetail.microActions.length) * 90);
  console.log(`  ${minute}' (${ma.phaseKey}) ${aname} [${ateam}] vs ${dname}  sc=${ma.attackScore}/${ma.defenseScore}  ${ma.success ? "✅" : "❌"} ball@(${ma.ball.x},${ma.ball.y})`);
}

console.log(`\nÉvénements (${rDetail.events.length}) :`);
for (const e of rDetail.events) {
  console.log(`  ${e.minute}' [${e.type}] ${e.player} — ${e.zone} (${e.team})`);
}

// Bilan par équipe
const argEvents = rDetail.events.filter(e => e.team === "ARG");
const jpnEvents = rDetail.events.filter(e => e.team === "JPN");
console.log(`\nBilan ARG: ${rDetail.events.length > 0 ? (argEvents.filter(e => e.type === "goal").length) : 0} buts, ${argEvents.filter(e => e.type === "turnover").length} turnovers`);
console.log(`Bilan JPN: ${jpnEvents.filter(e => e.type === "goal").length} buts, ${jpnEvents.filter(e => e.type === "turnover").length} turnovers`);

console.log("\n\n✅ TESTS TERMINÉS");
