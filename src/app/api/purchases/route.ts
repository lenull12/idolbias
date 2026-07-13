export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { gemPurchases } from "@/db/schema";

const COOKIE_NAME = "idolbias_player_id";

export async function GET() {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const db = getDb();

  const purchases = await db
    .select()
    .from(gemPurchases)
    .where(and(
      eq(gemPurchases.playerId, playerId),
      eq(gemPurchases.status, "completed"),
    ))
    .orderBy(desc(gemPurchases.createdAt))
    .limit(50);

  return NextResponse.json(
    { purchases },
    { headers: { "Cache-Control": "no-store, must-revalidate" } }
  );
}
