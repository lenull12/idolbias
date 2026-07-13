export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db/client";
import { feedSubscriptions } from "@/db/schema";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json(
    { error: "No player" },
    { status: 401, headers: { "Cache-Control": "no-store, must-revalidate" } }
  );

  const { memberId } = await request.json();

  const db = getDb();

  try {
    await db
      .delete(feedSubscriptions)
      .where(and(eq(feedSubscriptions.playerId, playerId), eq(feedSubscriptions.memberId, memberId)));

    return NextResponse.json(
      { subscribed: false },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Unsubscribe failed" }, { status: 500 });
  }
}
