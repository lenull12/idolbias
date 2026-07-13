import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cosmoFeaturedResponses, cosmoReplies, cosmoPosts } from "@/db/schema";

const COOKIE_NAME = "idolbias_player_id";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { memberId } = await params;
  const db = getDb();

  const rows = await db
    .select({
      id: cosmoFeaturedResponses.id,
      postId: cosmoFeaturedResponses.postId,
      replyId: cosmoFeaturedResponses.replyId,
      responseContent: cosmoFeaturedResponses.responseContent,
      createdAt: cosmoFeaturedResponses.createdAt,
      postContent: cosmoPosts.content,
      postImageUrl: cosmoPosts.imageUrl,
      replyAuthorName: cosmoReplies.authorName,
      replyContent: cosmoReplies.content,
    })
    .from(cosmoFeaturedResponses)
    .innerJoin(cosmoPosts, eq(cosmoFeaturedResponses.postId, cosmoPosts.id))
    .innerJoin(cosmoReplies, eq(cosmoFeaturedResponses.replyId, cosmoReplies.id))
    .where(eq(cosmoPosts.memberId, memberId))
    .orderBy(desc(cosmoFeaturedResponses.createdAt));

  return NextResponse.json({ featured: rows });
}
