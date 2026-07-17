import { NextResponse } from "next/server";
import { eq, or, desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { ownedCards } from "@/db/schema";
import { getCardById, rarityFromReference } from "@/data/cards";

export async function GET() {
  const db = getDb();

  const rows = await db.select().from(ownedCards)
    .where(or(eq(ownedCards.grade, "gem"), eq(ownedCards.grade, "pristine")))
    .orderBy(desc(ownedCards.firstObtainedAt));

  const enriched = rows
    .map((row) => {
      const card = getCardById(row.cardId);
      if (!card) return null;
      const rarity = rarityFromReference(card.reference);
      if (rarity !== "secret" && rarity !== "legendary") return null;
      return {
        playerId: row.playerId,
        cardId: row.cardId,
        idol: card.idol,
        pack: card.pack,
        rarity,
        grade: row.grade,
        quantity: row.quantity,
        firstObtainedAt: row.firstObtainedAt,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => {
      const gradeRank = (g: string) => (g === "gem" ? 0 : 1);
      const rarityRank = (r: string) => (r === "secret" ? 0 : 1);
      return gradeRank(a.grade) - gradeRank(b.grade) || rarityRank(a.rarity) - rarityRank(b.rarity);
    })
    .slice(0, 30);

  return NextResponse.json({ rarest: enriched });
}
