import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cosmoReplies, cosmoFeaturedResponses } from "@/db/schema";

const COOKIE_NAME = "idolbias_player_id";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ memberId: string; postId: string }> }
) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { postId } = await params;
  const db = getDb();

  const replies = await db
    .select()
    .from(cosmoReplies)
    .where(and(eq(cosmoReplies.postId, postId), eq(cosmoReplies.userId, playerId)))
    .orderBy(desc(cosmoReplies.createdAt));

  const featuredIds = await db
    .select({ replyId: cosmoFeaturedResponses.replyId })
    .from(cosmoFeaturedResponses)
    .where(eq(cosmoFeaturedResponses.postId, postId));

  const featuredReplyIds = new Set(featuredIds.map((f) => f.replyId));

  const repliesWithFeatured = replies.map((r) => ({
    ...r,
    isFeatured: featuredReplyIds.has(r.id),
  }));

  return NextResponse.json({ replies: repliesWithFeatured });
}
