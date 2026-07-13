export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { feedSubscriptions } from "@/db/schema";

const COOKIE_NAME = "idolbias_player_id";

export async function GET() {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json(
    { error: "No player" },
    { status: 401, headers: { "Cache-Control": "no-store, must-revalidate" } }
  );

  const db = getDb();

  const subs = await db
    .select()
    .from(feedSubscriptions)
    .where(eq(feedSubscriptions.playerId, playerId));

  return NextResponse.json(
    { subscriptions: subs },
    { headers: { "Cache-Control": "no-store, must-revalidate" } }
  );
}
