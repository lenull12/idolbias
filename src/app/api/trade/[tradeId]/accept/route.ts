import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tradeOffers, ownedCards } from "@/db/schema";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tradeId: string }> },
) {
  const { tradeId } = await params;
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const db = getDb();
  const [offer] = await db.select().from(tradeOffers)
    .where(eq(tradeOffers.id, Number(tradeId))).limit(1);
  if (!offer || offer.status !== "open")
    return NextResponse.json({ error: "Offer not available" }, { status: 400 });
  if (offer.offererId === playerId)
    return NextResponse.json({ error: "Cannot accept your own offer" }, { status: 400 });

  const [ownedRequested] = await db.select().from(ownedCards)
    .where(and(eq(ownedCards.playerId, playerId), eq(ownedCards.cardId, offer.requestedCardId))).limit(1);
  if (!ownedRequested || ownedRequested.quantity < 1)
    return NextResponse.json({ error: "You don't own the requested card" }, { status: 400 });

  const now = new Date();

  // Atomic status update: only succeeds if still "open" (prevents double-accept)
  const updated = await db.update(tradeOffers)
    .set({ status: "completed", resolvedAt: now, resolvedBy: playerId })
    .where(and(eq(tradeOffers.id, offer.id), eq(tradeOffers.status, "open")))
    .returning({ id: tradeOffers.id });

  if (updated.length === 0) {
    return NextResponse.json({ error: "Offer already resolved" }, { status: 400 });
  }

  await db.batch([
    db.update(ownedCards).set({ quantity: sql`${ownedCards.quantity} - 1` })
      .where(and(eq(ownedCards.playerId, playerId), eq(ownedCards.cardId, offer.requestedCardId))),
    db.insert(ownedCards)
      .values({ playerId, cardId: offer.offeredCardId, quantity: 1, firstObtainedAt: now, lastObtainedAt: now })
      .onConflictDoUpdate({
        target: [ownedCards.playerId, ownedCards.cardId],
        set: { quantity: sql`${ownedCards.quantity} + 1`, lastObtainedAt: now },
      }),
    db.insert(ownedCards)
      .values({ playerId: offer.offererId, cardId: offer.requestedCardId, quantity: 1, firstObtainedAt: now, lastObtainedAt: now })
      .onConflictDoUpdate({
        target: [ownedCards.playerId, ownedCards.cardId],
        set: { quantity: sql`${ownedCards.quantity} + 1`, lastObtainedAt: now },
      }),
  ]);

  return NextResponse.json({ ok: true });
}
