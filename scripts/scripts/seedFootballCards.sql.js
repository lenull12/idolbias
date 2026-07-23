"use strict";
/**
 * Génère le SQL de seed pour insertion via wrangler.
 * Usage :
 *   npx tsx scripts/seedFootballCards.sql.ts > scripts/seed_football.sql
 *   npx wrangler d1 execute idolbias-db --file=scripts/seed_football.sql --remote
 */
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var footballCards_1 = require("../src/data/footballCards");
var now = new Date().toISOString();
var lines = [];
lines.push("-- Seed characters");
for (var _i = 0, CHARACTERS_1 = footballCards_1.CHARACTERS; _i < CHARACTERS_1.length; _i++) {
    var c = CHARACTERS_1[_i];
    var nickname = c.nickname ? "'".concat(c.nickname.replace(/'/g, "''"), "'") : "NULL";
    var pv = JSON.stringify(c.photoVariants).replace(/'/g, "''");
    lines.push("INSERT OR REPLACE INTO characters (id, name, nickname, nation, default_style, default_position, is_captain, photo_variants, created_at) " +
        "VALUES ('".concat(c.id, "', '").concat(c.name.replace(/'/g, "''"), "', ").concat(nickname, ", '").concat(c.nation, "', '").concat(c.defaultStyle, "', '").concat(c.defaultPosition, "', ").concat(c.isCaptain ? 1 : 0, ", '").concat(pv, "', '").concat(now, "');"));
}
lines.push("");
lines.push("-- Seed card prints");
for (var _c = 0, CARD_PRINTS_1 = footballCards_1.CARD_PRINTS; _c < CARD_PRINTS_1.length; _c++) {
    var p = CARD_PRINTS_1[_c];
    var mintCap = (_a = p.mintCap) !== null && _a !== void 0 ? _a : "NULL";
    lines.push("INSERT OR REPLACE INTO card_prints (id, character_id, edition_code, rarity, ref_code, mint_cap, minted, created_at) " +
        "VALUES ('".concat(p.id, "', '").concat(p.characterId, "', '").concat(p.editionCode, "', '").concat(p.rarity, "', '").concat(p.refCode, "', ").concat(mintCap, ", ").concat((_b = p.minted) !== null && _b !== void 0 ? _b : 0, ", '").concat(now, "');"));
}
console.log(lines.join("\n"));
