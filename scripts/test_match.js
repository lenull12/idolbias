// Test du moteur de match v2
// Usage: node scripts/test_match.js

const path = require('path');
// On charge le module TypeScript compilé via tsx
require('child_process').execSync('npx tsx -e "
const { simulateMatch } = require(\\"./src/lib/matchEngine\\");
const { CHARACTER_STATS } = require(\\"./src/data/characterStats\\");
const { CHARACTERS } = require(\\"./src/data/footballCards\\");
const { FORMATIONS } = require(\\"./src/db/lineupSchema\\");

const FORMATION = FORMATIONS[\\"4-3-3\\"];

function buildPlayer(char, slot) {
  const cs = CHARACTER_STATS[char.id];
  const pos12 = cs?.position ?? \\"ST\\";
  const stats = {};
  // Remplir les stats depuis CHARACTER_STATS
  if (cs?.stats) {
    for (const [k, v] of Object.entries(cs.stats)) stats[k] = v;
  }
  return {
    instanceId: char.id + \\"-\\" + slot.slotId,
    characterId: char.id,
    name: char.name,
    slotId: slot.slotId,
    group: char.defaultPosition,
    position12: pos12,
    role: null,
    style: char.defaultStyle,
    rarity: \\"common\\",
    stats,
    baseX: slot.x,
    baseY: slot.y,
    equippedSkills: [],
    isGK: pos12 === \\"GK\\",
  };
}

function buildTeam(ids, teamId) {
  const chars = ids.map((id) => CHARACTERS.find((c) => c.id === id)).filter(Boolean);
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

// Test 1: Argentine vs Argentine (même équipe)
const ARG_IDS = [\\"soledad-diaz\\", \\"valentina-gimenez\\", \\"renata-navarro\\", \\"catalina-navarro\\", \\"martina-romero\\", \\"roxy-cabrera\\", \\"celeste-benitez\\", \\"melina-soria\\", \\"pilar-roldan\\", \\"mercedes-perez\\", \\"esperanza-galvan\\"];

const home = buildTeam(ARG_IDS, \\"ARG\\");
const away = buildTeam(ARG_IDS, \\"ARG2\\");

console.log(\\"Test 1: Argentine vs Argentine\\");
const result1 = simulateMatch(home, away, \\"test-seed-1\\", 60);
console.log(\\"  Score: ARG\\", result1.score.ARG, \\"-\\", result1.score.ARG2);
console.log(\\"  Possession: ARG\\", result1.possession.ARG + \\"% / ARG2\\", result1.possession.ARG2 + \\"%\\");
console.log(\\"  Micro-actions:\\", result1.microActions.length);
console.log(\\"  Événements:\\", result1.events.length);

// Test 2: Même seed = même résultat
const result1b = simulateMatch(home, away, \\"test-seed-1\\", 60);
const same = JSON.stringify(result1.score) === JSON.stringify(result1b.score);
console.log(\\"Test 2: Déterminisme même seed →\\", same ? \\"✅\\" : \\"❌\\");

// Test 3: Soledad (93) vs rookies (77-84)
const WEAK_IDS = [\\"celeste-benitez\\", \\"celeste-benitez\\", \\"celeste-benitez\\", \\"celeste-benitez\\", \\"celeste-benitez\\", \\"celeste-benitez\\", \\"celeste-benitez\\", \\"celeste-benitez\\", \\"celeste-benitez\\", \\"celeste-benitez\\", \\"esperanza-galvan\\"];
const weak = buildTeam(WEAK_IDS, \\"WEAK\\");
const result3 = simulateMatch(home, weak, \\"test-seed-3\\", 60);
console.log(\\"Test 3: ARG (93) vs rookies (77)\");
console.log(\\"  Score: ARG\\", result3.score.ARG, \\"-\\", result3.score.WEAK);

// Test 4: Gardienne seule (peu de joueuses)
const SOLO_IDS = [\\"esperanza-galvan\\"];
const solo = buildTeam(SOLO_IDS, \\"SOLO\\");
const result4 = simulateMatch(home, solo, \\"test-seed-4\\", 60);
console.log(\\"Test 4: ARG vs gardienne seule\\");
console.log(\\"  Score: ARG\\", result4.score.ARG, \\"-\\", result4.score.SOLO);

console.log(\\"\\\\nTests terminés.\\");
", { stdio: 'inherit' });', { stdio: 'inherit' });
