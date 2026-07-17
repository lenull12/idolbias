import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { ownedCards, marketListings } from "@/db/schema";
import { getCardById } from "@/data/cards";
import { MARKET_MIN_PRICE_GEMS } from "@/lib/marketConfig";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { cardId, grade, priceGems, confirmLastCopy } = await req.json();

  if (!priceGems || priceGems < MARKET_MIN_PRICE_GEMS)
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  if (!getCardById(cardId))
    return NextResponse.json({ error: "Unknown card" }, { status: 400 });

  // Vérifier si c'est le dernier exemplaire
  const [owned] = await db.select().from(ownedCards)
    .where(and(eq(ownedCards.playerId, playerId), eq(ownedCards.cardId, cardId), eq(ownedCards.grade, grade)));
  if (owned?.quantity === 1 && !confirmLastCopy) {
    return NextResponse.json({
      error: "This is your only copy — confirm to list it anyway",
      code: "LAST_COPY_CONFIRMATION_REQUIRED",
    }, { status: 409 });
  }

  // Escrow atomique
  const escrowed = await db.update(ownedCards)
    .set({ quantity: sql`${ownedCards.quantity} - 1` })
    .where(and(
      eq(ownedCards.playerId, playerId),
      eq(ownedCards.cardId, cardId),
      eq(ownedCards.grade, grade),
      gte(ownedCards.quantity, 1),
    ))
    .returning();
  if (escrowed.length === 0)
    return NextResponse.json({ error: "Card not available to list" }, { status: 400 });

  const [listing] = await db.insert(marketListings)
    .values({ sellerId: playerId, cardId, grade, priceGems, status: "open", createdAt: new Date() })
    .returning();

  return NextResponse.json({ ok: true, listing });
}
