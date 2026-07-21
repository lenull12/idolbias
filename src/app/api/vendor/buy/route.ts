import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { vendorOffers, ownedCards, wallets } from "@/db/schema";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { offerId } = await req.json();

  // 1) Claim atomique de l'offre — must be today's offer and unclaimed
  const today = new Date().toISOString().slice(0, 10);
  const claimed = await db.update(vendorOffers)
    .set({ claimedByPlayerId: playerId, claimedAt: new Date() })
    .where(and(eq(vendorOffers.id, offerId), isNull(vendorOffers.claimedByPlayerId), eq(vendorOffers.dateStr, today)))
    .returning();
  if (claimed.length === 0) {
    return NextResponse.json({ error: "This offer is no longer available" }, { status: 400 });
  }
  const offer = claimed[0];

  // 2) Débit atomique des gems
  const debited = await db.update(wallets)
    .set({ gems: sql`${wallets.gems} - ${offer.priceGems}` })
    .where(and(eq(wallets.playerId, playerId), gte(wallets.gems, offer.priceGems)))
    .returning();
  if (debited.length === 0) {
    // Rollback du claim
    await db.update(vendorOffers)
      .set({ claimedByPlayerId: null, claimedAt: null })
      .where(eq(vendorOffers.id, offerId));
    return NextResponse.json({ error: "Not enough gems" }, { status: 400 });
  }

  // 3) Crédit de la carte
  const now = new Date();
  await db.insert(ownedCards)
    .values({ playerId, cardId: offer.cardId, grade: offer.grade, quantity: 1, firstObtainedAt: now, lastObtainedAt: now })
    .onConflictDoUpdate({
      target: [ownedCards.playerId, ownedCards.cardId, ownedCards.grade],
      set: { quantity: sql`${ownedCards.quantity} + 1`, lastObtainedAt: now },
    });

  return NextResponse.json({ ok: true, cardId: offer.cardId, grade: offer.grade });
}
