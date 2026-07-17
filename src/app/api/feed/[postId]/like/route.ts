export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db/client";
import { feedLikes } from "@/db/schema";
import { syncLikeMissionProgress } from "@/lib/missionBump";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { postId } = await params;
  const db = getDb();

  try {
    const existing = await db
      .select()
      .from(feedLikes)
      .where(and(eq(feedLikes.postId, postId), eq(feedLikes.userId, playerId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(feedLikes)
        .where(and(eq(feedLikes.postId, postId), eq(feedLikes.userId, playerId)));
    // Seul endroit légitime qui touche à like_posts/like_10_posts
    await syncLikeMissionProgress(playerId);

    return NextResponse.json(
        { liked: false },
        { headers: { "Cache-Control": "no-store, must-revalidate" } }
      );
    }

    await db.insert(feedLikes).values({
      id: crypto.randomUUID(),
      postId,
      userId: playerId,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { liked: true },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (err) {
    console.error("Like error:", err);
    return NextResponse.json({ error: "Like failed" }, { status: 500 });
  }
}
