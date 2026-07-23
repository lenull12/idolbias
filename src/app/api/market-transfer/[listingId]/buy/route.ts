import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cardInstances, transferListings, transferSales } from "@/db/footballSchema";
import { wallets } from "@/db/schema";
import { TRANSFER_MARKET_COMMISSION_RATE } from "@/lib/marketTransferConfig";

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

  const claimed = await db
    .update(transferListings)
    .set({ status: "sold", buyerId: playerId, resolvedAt: new Date() })
    .where(and(eq(transferListings.id, Number(listingId)), eq(transferListings.status, "open")))
    .returning();
  if (claimed.length === 0) {
    return NextResponse.json({ error: "This listing is no longer available" }, { status: 400 });
  }

  const listing = claimed[0];
  if (listing.sellerId === playerId) {
    await db
      .update(transferListings)
      .set({ status: "open", buyerId: null, resolvedAt: null })
      .where(eq(transferListings.id, Number(listingId)));
    return NextResponse.json({ error: "You can't buy your own listing" }, { status: 400 });
  }

  const debited = await db
    .update(wallets)
    .set({ dollars: sql`${wallets.dollars} - ${listing.priceDollars}` })
    .where(and(eq(wallets.playerId, playerId), gte(wallets.dollars, listing.priceDollars)))
    .returning();
  if (debited.length === 0) {
    await db
      .update(transferListings)
      .set({ status: "open", buyerId: null, resolvedAt: null })
      .where(eq(transferListings.id, Number(listingId)));
    return NextResponse.json({ error: "Not enough dollars" }, { status: 400 });
  }

  const commission = Math.round(listing.priceDollars * TRANSFER_MARKET_COMMISSION_RATE);
  const sellerPayout = listing.priceDollars - commission;

  await db
    .update(wallets)
    .set({ dollars: sql`${wallets.dollars} + ${sellerPayout}` })
    .where(eq(wallets.playerId, listing.sellerId));

  await db
    .update(cardInstances)
    .set({
      ownerId: playerId,
      affinityXp: 0,
      affinityLastActiveAt: new Date(),
    })
    .where(eq(cardInstances.id, listing.cardInstanceId));

  await db.insert(transferSales).values({
    cardInstanceId: listing.cardInstanceId,
    priceDollars: listing.priceDollars,
    soldAt: new Date(),
  });

  return NextResponse.json({ ok: true, cardInstanceId: listing.cardInstanceId, pricePaid: listing.priceDollars });
}
