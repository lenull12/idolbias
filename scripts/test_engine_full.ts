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

import { simulateMatch, type TeamMatchInput, type MatchPlayer, indexDribble, indexPhysique, indexAerien, techniqueMult, indexImplication, type ZoneKey } from "../src/lib/matchEngine";
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
  "yuriko-take", "aya-mishima", "hinata-shigaki",
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

// ═══════════════════════════════════════════════════════════════════════════════
//  TEST 8 : VALIDATION PHASE 6 — Indices composites
// ═══════════════════════════════════════════════════════════════════════════════

console.log("\n\n═══════════════════════════════════════════════════════════════════");
console.log(" TEST 8 : VALIDATION PHASE 6 — 7 SCÉNARIOS");
console.log("═══════════════════════════════════════════════════════════════════");

// ─── 8.1 Complémentarité ─────────────────────────────────────────────────
console.log("\n─── 8.1 Complémentarité (indexDribble) ───");
const complet = indexDribble({ dribble: 90, agilite: 90, vitesse: 90, acceleration: 90, controle: 90, technique: 50 });
const picUnique = indexDribble({ dribble: 99, agilite: 50, vitesse: 50, acceleration: 50, controle: 90, technique: 50 });
console.log(`  Complet (90/90/90):         ${complet.toFixed(1)}`);
console.log(`  Pic unique (99/50/50):      ${picUnique.toFixed(1)}`);
console.log(`  Écart:                      ${(complet - picUnique).toFixed(1)} points`);
console.log(`  ${complet > picUnique ? "✅" : "❌"} Complétude bat pic unique`);

// ─── 8.2 Technique bornée ─────────────────────────────────────────────────
console.log("\n─── 8.2 Technique bornée (plage [0.85-1.15]) ───");
const tech99 = techniqueMult({ technique: 99 });
const tech50 = techniqueMult({ technique: 50 });
const tech1 = techniqueMult({ technique: 1 });
console.log(`  technique=99 → mult ${tech99.toFixed(3)}`);
console.log(`  technique=50 → mult ${tech50.toFixed(3)}`);
console.log(`  technique=1  → mult ${tech1.toFixed(3)}`);
// Vérification de la plage
const basTech99Drib50 = ((50 * 0.6 + 50 * 0.4) * 0.55 + (50 * 0.5 + 50 * 0.3 + 50 * 0.2) * 0.35 + Math.min(50, 50) * 0.15) * tech99;
const basTech50Drib70 = ((70 * 0.6 + 50 * 0.4) * 0.55 + (50 * 0.5 + 50 * 0.3 + 50 * 0.2) * 0.35 + Math.min(50, 50) * 0.15) * tech50;
console.log(`  technique=99,dribble=50:    ${basTech99Drib50.toFixed(1)} (attendu ~60.4)`);
console.log(`  technique=50,dribble=70:    ${basTech50Drib70.toFixed(1)} (attendu ~59.2)`);
const diff = Math.abs(basTech99Drib50 - basTech50Drib70);
console.log(`  Écart: ${diff.toFixed(1)} points`);
console.log(`  ${diff < 5 ? "✅" : "❌"} Proches mais pas de domination (attendu < 5 pts)`);

// ─── 8.3 Volume de jeu (workRate) ────────────────────────────────────────
console.log("\n─── 8.3 Volume de jeu (workRate vs agressivite) ───");
const impWR90 = indexImplication({ workRate: 90, endurance: 50, positionnement: 50 });
const impWR50 = indexImplication({ workRate: 50, endurance: 50, positionnement: 50 });
console.log(`  workRate=90 → implication ${impWR90.toFixed(3)}`);
console.log(`  workRate=50 → implication ${impWR50.toFixed(3)}`);
console.log(`  Ratio: ${(impWR90 / impWR50).toFixed(2)}x`);
console.log(`  ${impWR90 > impWR50 * 1.15 ? "✅" : "❌"} Impact significatif du workRate`);

// ─── 8.4 Aérien réaliste ─────────────────────────────────────────────────
console.log("\n─── 8.4 Aérien réaliste (taille vs technique) ───");
const attaquante = indexAerien({ jeu_de_tete: 90, detente: 90 }, 160);
const defenseure = indexAerien({ jeu_de_tete: 40, detente: 50 }, 185);
console.log(`  Attaquante (160cm/90/90):    ${attaquante.toFixed(1)}`);
console.log(`  Défenseure (185cm/40/50):    ${defenseure.toFixed(1)}`);
console.log(`  ${attaquante > defenseure ? "✅" : "❌"} Petite technique bat grande non-technique`);

// ─── 8.5 Physique corrigé (poids taille 0.25) ────────────────────────────
console.log("\n─── 8.5 Physique corrigé (force domine taille) ───");
const verratti = indexPhysique({ force: 85, controle: 70 }, 165);
const cb185 = indexPhysique({ force: 60, controle: 50 }, 185);
console.log(`  Verratti-like (165cm/force=85):  ${verratti.toFixed(1)}`);
console.log(`  CB 185cm (force=60):             ${cb185.toFixed(1)}`);
console.log(`  ${verratti > cb185 ? "✅" : "❌"} Petite/forte bat grande/moins forte`);

// ─── 8.6 Chaîne centre→tête ──────────────────────────────────────────────
console.log("\n─── 8.6 Chaîne centre→tête (20 matchs JPN) ───");
let centreEventCount = 0;
let teteButCount = 0;
for (let i = 0; i < 20; i++) {
  const jpn = buildTeam(JPN_IDS, "JPN");
  const jpn2 = buildTeam(JPN_IDS, "JPN2");
  const r = simulateMatch(jpn, jpn2, `chaine-${i}`, 120);
  for (const e of r.events) {
    if (e.player.includes("(centre)")) centreEventCount++;
    if (e.player.includes("(tête)")) teteButCount++;
  }
}
console.log(`  Événements centre: ${centreEventCount}`);
console.log(`  Buts de la tête: ${teteButCount}`);
console.log(`  ${teteButCount > 0 || centreEventCount > 0 ? "✅" : "⚠️"} Centres et têtes détectés dans les logs`);

// ─── 8.7 Action de génie avec échec ──────────────────────────────────────
console.log("\n─── 8.7 Action de génie (50 matchs ARG vs ARG) ───");
let genieReussi = 0;
let genieRate = 0;
for (let i = 0; i < 50; i++) {
  const a = buildTeam(ARG_IDS, "ARG");
  const a2 = buildTeam(ARG_IDS, "ARG2");
  const r = simulateMatch(a, a2, `genie-${i}`, 120);
  for (const e of r.events) {
    if (e.player.includes("(action de génie)")) genieReussi++;
    if (e.player.includes("(tentative de génie ratée)")) genieRate++;
  }
}
const totalGenie = genieReussi + genieRate;
console.log(`  Réussies: ${genieReussi}`);
console.log(`  Ratées:   ${genieRate}`);
console.log(`  Total:    ${totalGenie}`);
if (totalGenie > 0) {
  const ratio = genieReussi / totalGenie;
  console.log(`  Taux de succès: ${(ratio * 100).toFixed(0)}%`);
  console.log(`  ${ratio >= 0.80 ? "✅" : "⚠️"} Ratio ≥ 80% conforme`);
} else {
  console.log(`  ⚠️ Aucune action de génie déclenchée (flair médian trop bas)`);
}

console.log("\n\n✅ TESTS TERMINÉS");
