import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, ne, sql, gte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tradeOffers, ownedCards } from "@/db/schema";

const COOKIE_NAME = "idolbias_player_id";

export async function GET() {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const db = getDb();
  const offers = await db.select().from(tradeOffers)
    .where(and(eq(tradeOffers.status, "open"), ne(tradeOffers.offererId, playerId)));

  const mine = await db.select().from(tradeOffers)
    .where(and(eq(tradeOffers.status, "open"), eq(tradeOffers.offererId, playerId)));

  return NextResponse.json({ offers, myOffers: mine });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { offeredCardId, offeredGrade, requestedCardId }: {
    offeredCardId?: string; offeredGrade?: string; requestedCardId?: string;
  } = await request.json();
  if (!offeredCardId || !offeredGrade || !requestedCardId)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (offeredCardId === requestedCardId)
    return NextResponse.json({ error: "Cannot trade a card for itself" }, { status: 400 });
  const db = getDb();
  const now = new Date();

  // Atomic decrement : ne réussit que si quantity >= 2 (on garde au moins 1)
  const debitResult = await db.update(ownedCards)
    .set({ quantity: sql`${ownedCards.quantity} - 1` })
    .where(and(
      eq(ownedCards.playerId, playerId),
      eq(ownedCards.cardId, offeredCardId),
      eq(ownedCards.grade, offeredGrade),
      gte(ownedCards.quantity, 2),
    ))
    .returning({ cardId: ownedCards.cardId });

  if (debitResult.length === 0) {
    return NextResponse.json({ error: "No duplicate to trade" }, { status: 400 });
  }

  await db.insert(tradeOffers).values({
    offererId: playerId,
    offeredCardId,
    offeredGrade,
    requestedCardId,
    status: "open",
    createdAt: now,
  });

  return NextResponse.json({ ok: true });
}
