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
  if (!offer || offer.status !== "open" || offer.offererId !== playerId)
    return NextResponse.json({ error: "Offer not cancellable" }, { status: 400 });

  const now = new Date();
  await db.batch([
    db.update(ownedCards).set({ quantity: sql`${ownedCards.quantity} + 1` })
      .where(and(eq(ownedCards.playerId, playerId), eq(ownedCards.cardId, offer.offeredCardId))),
    db.update(tradeOffers).set({ status: "cancelled", resolvedAt: now, resolvedBy: playerId })
      .where(eq(tradeOffers.id, offer.id)),
  ]);

  return NextResponse.json({ ok: true });
}
