import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { marketListings, ownedCards } from "@/db/schema";

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

  const cancelled = await db.update(marketListings)
    .set({ status: "cancelled", resolvedAt: new Date() })
    .where(and(
      eq(marketListings.id, Number(listingId)),
      eq(marketListings.status, "open"),
      eq(marketListings.sellerId, playerId),
    ))
    .returning();
  if (cancelled.length === 0)
    return NextResponse.json({ error: "Listing already resolved or not yours" }, { status: 400 });

  const listing = cancelled[0];
  await db.update(ownedCards)
    .set({ quantity: sql`${ownedCards.quantity} + 1` })
    .where(and(
      eq(ownedCards.playerId, playerId),
      eq(ownedCards.cardId, listing.cardId),
      eq(ownedCards.grade, listing.grade),
    ));

  return NextResponse.json({ ok: true });
}
