import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { ownedCards, wallets } from "@/db/schema";
import { getCardById, rarityFromReference } from "@/data/cards";
import { getCurrentPriceWithHistory } from "@/lib/priceEngine";
import { isInstantSellEligible, INSTANT_SELL_PAYOUT_RATE } from "@/lib/vendorConfig";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { cardId, grade, quantity } = await req.json();
  if (!quantity || quantity < 1)
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });

  const card = getCardById(cardId);
  if (!card) return NextResponse.json({ error: "Unknown card" }, { status: 400 });

  const rarity = rarityFromReference(card.reference);
  if (!isInstantSellEligible(rarity, grade))
    return NextResponse.json({ error: "This card is too valuable for instant sell" }, { status: 400 });

  const [owned] = await db.select().from(ownedCards)
    .where(and(eq(ownedCards.playerId, playerId), eq(ownedCards.cardId, cardId), eq(ownedCards.grade, grade)));

  const maxSellable = Math.max(0, (owned?.quantity ?? 0) - 1);
  if (quantity > maxSellable)
    return NextResponse.json({ error: "Not enough duplicates" }, { status: 400 });

  const { suggestedPrice: currentPrice } = await getCurrentPriceWithHistory(cardId, grade);
  const unitPayout = Math.round(currentPrice * INSTANT_SELL_PAYOUT_RATE);
  const totalPayout = unitPayout * quantity;

  // Atomic decrement
  const sold = await db.update(ownedCards)
    .set({ quantity: sql`${ownedCards.quantity} - ${quantity}` })
    .where(and(
      eq(ownedCards.playerId, playerId),
      eq(ownedCards.cardId, cardId),
      eq(ownedCards.grade, grade),
      gte(ownedCards.quantity, quantity + 1),
    ))
    .returning();
  if (sold.length === 0)
    return NextResponse.json({ error: "Not enough duplicates" }, { status: 400 });

  await db.update(wallets)
    .set({ gems: sql`${wallets.gems} + ${totalPayout}` })
    .where(eq(wallets.playerId, playerId));

  return NextResponse.json({ ok: true, payout: totalPayout });
}
