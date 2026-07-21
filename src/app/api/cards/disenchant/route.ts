import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, sql, gte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wallets, ownedCards, progression, type CardGrade } from "@/db/schema";
import { getCardById, rarityFromReference } from "@/data/cards";
import { getDisenchantValue } from "@/lib/gameConfig";
import { getCurrentPriceWithHistory } from "@/lib/priceEngine";

const COOKIE_NAME = "idolbias_player_id";
const DISENCHANT_CONFIRM_THRESHOLD = 50;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { cardId, grade, quantity: rawQty, confirmHighValue }: { cardId?: string; grade?: string; quantity?: number; confirmHighValue?: boolean } = await request.json();
  if (!cardId || !grade) return NextResponse.json({ error: "Missing cardId or grade" }, { status: 400 });

  const card = getCardById(cardId);
  if (!card) return NextResponse.json({ error: "Unknown card" }, { status: 400 });

  const db = getDb();
  const [owned] = await db.select().from(ownedCards)
    .where(and(
      eq(ownedCards.playerId, playerId),
      eq(ownedCards.cardId, cardId),
      eq(ownedCards.grade, grade),
    )).limit(1);

  const maxDisenchantable = owned ? owned.quantity - 1 : 0;
  if (maxDisenchantable <= 0)
    return NextResponse.json({ error: "No duplicate to disenchant" }, { status: 400 });

  const quantity = Math.min(maxDisenchantable, Math.max(1, Math.floor(rawQty ?? 1)));
  const rarity = rarityFromReference(card.reference);
  const dustGained = getDisenchantValue(rarity, grade as CardGrade) * quantity;

  // Confirm before disenchanting high-value duplicates
  if (!confirmHighValue) {
    const { suggestedPrice } = await getCurrentPriceWithHistory(cardId, grade as CardGrade);
    if (suggestedPrice > DISENCHANT_CONFIRM_THRESHOLD) {
      return NextResponse.json({
        error: `This card is worth ~${suggestedPrice} gems on the market. Disenchant anyway?`,
        code: "HIGH_VALUE_CONFIRMATION_REQUIRED",
      }, { status: 409 });
    }
  }

  const now = new Date();

  // Atomic decrement — grade-aware
  const debitResult = await db.update(ownedCards)
    .set({ quantity: sql`${ownedCards.quantity} - ${quantity}` })
    .where(and(
      eq(ownedCards.playerId, playerId),
      eq(ownedCards.cardId, cardId),
      eq(ownedCards.grade, grade),
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
