import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { transferListings } from "@/db/footballSchema";

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

  const cancelled = await db
    .update(transferListings)
    .set({ status: "cancelled", resolvedAt: new Date() })
    .where(
      and(
        eq(transferListings.id, Number(listingId)),
        eq(transferListings.sellerId, playerId),
        eq(transferListings.status, "open"),
      ),
    )
    .returning();

  if (cancelled.length === 0) {
    return NextResponse.json({ error: "Nothing to cancel" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
