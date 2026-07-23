import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cardInstances, transferListings } from "@/db/footballSchema";
import { TRANSFER_MARKET_MIN_PRICE_DOLLARS } from "@/lib/marketTransferConfig";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(req: Request) {
  const { cardInstanceId, priceDollars } = (await req.json()) as {
    cardInstanceId?: string;
    priceDollars?: number;
  };

  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!cardInstanceId || !priceDollars || priceDollars < TRANSFER_MARKET_MIN_PRICE_DOLLARS) {
    return NextResponse.json({ error: "Invalid listing parameters" }, { status: 400 });
  }

  const db = getDb();

  const [instance] = await db
    .select()
    .from(cardInstances)
    .where(and(eq(cardInstances.id, cardInstanceId), eq(cardInstances.ownerId, playerId)));
  if (!instance) {
    return NextResponse.json({ error: "You don't own this card instance" }, { status: 403 });
  }

  const [existingOpen] = await db
    .select()
    .from(transferListings)
    .where(and(eq(transferListings.cardInstanceId, cardInstanceId), eq(transferListings.status, "open")));
  if (existingOpen) {
    return NextResponse.json({ error: "This card is already listed" }, { status: 400 });
  }

  const now = new Date();
  const [created] = await db
    .insert(transferListings)
    .values({
      cardInstanceId,
      sellerId: playerId,
      priceDollars,
      status: "open",
      createdAt: now,
    })
    .returning();

  return NextResponse.json({ ok: true, listing: created });
}
