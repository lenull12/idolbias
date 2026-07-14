import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, sql, gte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wallets, ownedCards, progression } from "@/db/schema";
import { getCardById, rarityFromReference } from "@/data/cards";
import { DISENCHANT_VALUES } from "@/lib/gameConfig";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { cardId, quantity: rawQty }: { cardId?: string; quantity?: number } = await request.json();
  if (!cardId) return NextResponse.json({ error: "Missing cardId" }, { status: 400 });

  const card = getCardById(cardId);
  if (!card) return NextResponse.json({ error: "Unknown card" }, { status: 400 });

  const db = getDb();
  const [owned] = await db.select().from(ownedCards)
    .where(and(eq(ownedCards.playerId, playerId), eq(ownedCards.cardId, cardId))).limit(1);

  const maxDisenchantable = owned ? owned.quantity - 1 : 0;
  if (maxDisenchantable <= 0)
    return NextResponse.json({ error: "No duplicate to disenchant" }, { status: 400 });

  const quantity = Math.min(maxDisenchantable, Math.max(1, Math.floor(rawQty ?? 1)));
  const rarity = rarityFromReference(card.reference);
  const dustGained = (DISENCHANT_VALUES[rarity] ?? 0) * quantity;
  const now = new Date();

  // Atomic decrement: only succeeds if quantity >= quantity + 1 (keep at least 1)
  const debitResult = await db.update(ownedCards)
    .set({ quantity: sql`${ownedCards.quantity} - ${quantity}` })
    .where(and(
      eq(ownedCards.playerId, playerId),
      eq(ownedCards.cardId, cardId),
      gte(ownedCards.quantity, quantity + 1),
    ))
    .returning({ cardId: ownedCards.cardId });

  if (debitResult.length === 0) {
    return NextResponse.json({ error: "Not enough duplicates to disenchant" }, { status: 400 });
  }

  await db.batch([
    db.update(wallets).set({ dust: sql`dust + ${dustGained}`, updatedAt: now })
      .where(eq(wallets.playerId, playerId)),
    db.update(progression).set({
      missionProgress: sql`json_set(mission_progress, '$.disenchant_card', COALESCE(json_extract(mission_progress, '$.disenchant_card'), 0) + ${quantity})`,
      updatedAt: now,
    }).where(eq(progression.playerId, playerId)),
  ]);

  const [wallet] = await db.select().from(wallets).where(eq(wallets.playerId, playerId)).limit(1);

  return NextResponse.json({
    cardId,
    quantityDisenchanted: quantity,
    dustGained,
    wallet: { tickets: wallet.tickets, gems: wallet.gems, dust: wallet.dust },
  });
}
