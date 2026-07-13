import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tradeOffers, ownedCards } from "@/db/schema";
import { getCardById } from "@/data/cards";

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

  const { offeredCardId, requestedCardId }: { offeredCardId?: string; requestedCardId?: string } =
    await request.json();
  if (!offeredCardId || !requestedCardId)
    return NextResponse.json({ error: "Missing cardId" }, { status: 400 });
  if (offeredCardId === requestedCardId)
    return NextResponse.json({ error: "Cannot trade a card for itself" }, { status: 400 });
  if (!getCardById(offeredCardId) || !getCardById(requestedCardId))
    return NextResponse.json({ error: "Unknown card" }, { status: 400 });

  const db = getDb();
  const [owned] = await db.select().from(ownedCards)
    .where(and(eq(ownedCards.playerId, playerId), eq(ownedCards.cardId, offeredCardId))).limit(1);

  if (!owned || owned.quantity <= 1)
    return NextResponse.json({ error: "No duplicate to trade" }, { status: 400 });

  const now = new Date();
  await db.batch([
    db.update(ownedCards).set({ quantity: sql`${ownedCards.quantity} - 1` })
      .where(and(eq(ownedCards.playerId, playerId), eq(ownedCards.cardId, offeredCardId))),
    db.insert(tradeOffers).values({
      offererId: playerId,
      offeredCardId,
      requestedCardId,
      status: "open",
      createdAt: now,
    }),
  ]);

  return NextResponse.json({ ok: true });
}
