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

  const { memberId, groupId } = await request.json();
  if (!memberId || !groupId) {
    return NextResponse.json(
      { error: "memberId and groupId required" },
      { status: 400, headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  }

  const db = getDb();

  try {
    const existing = await db
      .select()
      .from(feedSubscriptions)
      .where(and(eq(feedSubscriptions.playerId, playerId), eq(feedSubscriptions.memberId, memberId)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { subscribed: true },
        { headers: { "Cache-Control": "no-store, must-revalidate" } }
      );
    }

    await db.insert(feedSubscriptions).values({
      playerId,
      memberId,
      groupId,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { subscribed: true },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Subscribe failed" }, { status: 500 });
  }
}
