/**
 * Seed script — idempotent : upsert les personnages et card_prints
 * depuis data/footballCards.ts vers la base D1.
 *
 * Usage :
 *   npx tsx scripts/seedFootballCards.ts
 *   npx tsx scripts/seedFootballCards.ts --remote
 */

import { getDb } from "@/db/client";
import {
  characters,
  cardPrints,
  type Rarity,
  type Nation,
  type Style,
  type Position,
} from "@/db/footballSchema";
import { CHARACTERS, CARD_PRINTS } from "@/data/footballCards";
import { CHARACTER_STATS } from "@/data/characterStats";

async function seed() {
  const db = getDb();
  const now = new Date();

  console.log(`Seeding ${CHARACTERS.length} characters...`);
  for (const c of CHARACTERS) {
    await db
      .insert(characters)
      .values({
        id: c.id,
        name: c.name,
        nickname: CHARACTER_STATS[c.id]?.nickname ?? null,
        nation: c.nation as Nation,
        defaultStyle: c.defaultStyle as Style,
        defaultPosition: c.defaultPosition as Position,
        photoVariants: c.photoVariants,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: characters.id,
        set: {
          name: c.name,
          nickname: CHARACTER_STATS[c.id]?.nickname ?? null,
          nation: c.nation as Nation,
          defaultStyle: c.defaultStyle as Style,
          defaultPosition: c.defaultPosition as Position,
          photoVariants: c.photoVariants,
        },
      });
  }

  console.log(`Seeding ${CARD_PRINTS.length} card prints...`);
  for (const p of CARD_PRINTS) {
    await db
      .insert(cardPrints)
      .values({
        id: p.id,
        characterId: p.characterId,
        editionCode: p.editionCode,
        rarity: p.rarity as Rarity,
        refCode: p.refCode,
        mintCap: p.mintCap ?? null,
        minted: p.minted ?? 0,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: cardPrints.id,
        set: {
          mintCap: p.mintCap ?? null,
          minted: p.minted ?? 0,
        },
      });
  }

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
