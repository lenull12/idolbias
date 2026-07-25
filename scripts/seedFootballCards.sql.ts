/**
 * Génère le SQL de seed pour insertion via wrangler.
 * Usage :
 *   npx tsx scripts/seedFootballCards.sql.ts > scripts/seed_football.sql
 *   npx wrangler d1 execute idolbias-db --file=scripts/seed_football.sql --remote
 */

import { CHARACTERS, CARD_PRINTS } from "../src/data/footballCards";
import { CHARACTER_STATS } from "../src/data/characterStats";

const now = new Date().toISOString();
const lines: string[] = [];

lines.push("-- Seed characters");
for (const c of CHARACTERS) {
  const cs = CHARACTER_STATS[c.id];
  const nickname = cs?.nickname ? `'${cs.nickname!.replace(/'/g, "''")}'` : "NULL";
  const taille = cs?.tailleCm ?? 170;
  const poids = cs?.poidsKg ?? 65;
  const pied = cs?.piedPrefere ? `'${cs.piedPrefere.replace(/'/g, "''")}'` : "'right'";
  const pv = JSON.stringify(c.photoVariants).replace(/'/g, "''");
  lines.push(
    `INSERT OR REPLACE INTO characters (id, name, nickname, nation, default_style, default_position, taille_cm, poids_kg, pied_prefere, photo_variants, created_at) ` +
    `VALUES ('${c.id}', '${c.name.replace(/'/g, "''")}', ${nickname}, '${c.nation}', '${c.defaultStyle}', '${c.defaultPosition}', ${taille}, ${poids}, ${pied}, '${pv}', '${now}');`
  );
}

lines.push("");
lines.push("-- Seed card prints");
for (const p of CARD_PRINTS) {
  const mintCap = p.mintCap ?? "NULL";
  lines.push(
    `INSERT OR REPLACE INTO card_prints (id, character_id, edition_code, rarity, ref_code, mint_cap, minted, created_at) ` +
    `VALUES ('${p.id}', '${p.characterId}', '${p.editionCode}', '${p.rarity}', '${p.refCode}', ${mintCap}, ${p.minted ?? 0}, '${now}');`
  );
}

console.log(lines.join("\n"));
