import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { marketListings, marketSales, ownedCards, wallets } from "@/db/schema";
import { MARKET_COMMISSION_RATE } from "@/lib/marketConfig";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  // 1) Flip atomique du statut
  const claimed = await db.update(marketListings)
    .set({ status: "sold", buyerId: playerId, resolvedAt: new Date() })
    .where(and(eq(marketListings.id, Number(listingId)), eq(marketListings.status, "open")))
    .returning();
  if (claimed.length === 0)
    return NextResponse.json({ error: "This listing is no longer available" }, { status: 400 });

  const listing = claimed[0];
  if (listing.sellerId === playerId) {
    await db.update(marketListings)
      .set({ status: "open", buyerId: null, resolvedAt: null })
      .where(eq(marketListings.id, Number(listingId)));
    return NextResponse.json({ error: "You can't buy your own listing" }, { status: 400 });
  }

  // 2) Débit atomique de l'acheteur
  const debited = await db.update(wallets)
    .set({ gems: sql`${wallets.gems} - ${listing.priceGems}` })
    .where(and(eq(wallets.playerId, playerId), gte(wallets.gems, listing.priceGems)))
    .returning();
  if (debited.length === 0) {
    await db.update(marketListings)
      .set({ status: "open", buyerId: null, resolvedAt: null })
      .where(eq(marketListings.id, Number(listingId)));
    return NextResponse.json({ error: "Not enough gems" }, { status: 400 });
  }

  // 3) Commission + paiement vendeur
  const commission = Math.round(listing.priceGems * MARKET_COMMISSION_RATE);
  const sellerPayout = listing.priceGems - commission;

  await db.update(wallets)
    .set({ gems: sql`${wallets.gems} + ${sellerPayout}` })
    .where(eq(wallets.playerId, listing.sellerId));

  // 4) Transfert de la carte
  const now = new Date();
  await db.insert(ownedCards)
    .values({ playerId, cardId: listing.cardId, grade: listing.grade, quantity: 1, firstObtainedAt: now, lastObtainedAt: now })
    .onConflictDoUpdate({
      target: [ownedCards.playerId, ownedCards.cardId, ownedCards.grade],
      set: { quantity: sql`${ownedCards.quantity} + 1`, lastObtainedAt: now },
    });

  // 5) Log de vente pour l'historique
  await db.insert(marketSales).values({
    cardId: listing.cardId, grade: listing.grade,
    priceGems: listing.priceGems, soldAt: now,
  });

  return NextResponse.json({ ok: true, cardId: listing.cardId, pricePaid: listing.priceGems });
}
