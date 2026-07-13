export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, sql, desc, and, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { feedPosts, feedLikes, feedComments, feedSubscriptions } from "@/db/schema";
import { getPlayerIdFromRequest } from "@/lib/playerId";

export async function GET(request: Request) {
  const fromHeader = getPlayerIdFromRequest(request);
  const fromCookie = (await cookies()).get("idolbias_player_id")?.value;

  const playerId = fromHeader ?? fromCookie;

  if (!playerId) {
    return NextResponse.json(
      {
        error: "No player",
        debug: { header: fromHeader, cookie: fromCookie, allHeaders: Object.fromEntries(request.headers) },
      },
      { status: 401, headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  }

  const db = getDb();
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);
  const mode = url.searchParams.get("mode") ?? "foryou";

  const subs = await db
    .select()
    .from(feedSubscriptions)
    .where(eq(feedSubscriptions.playerId, playerId));
  const subscribedMemberIds = new Set(subs.map((s) => s.memberId));
  const hasSubs = subs.length > 0;

  const myLikes = await db
    .select({ postId: feedLikes.postId })
    .from(feedLikes)
    .where(eq(feedLikes.userId, playerId));
  const likedPostIds = new Set(myLikes.map((l) => l.postId));

  const conditions: any[] = [];
  if (mode === "following" && hasSubs) {
    conditions.push(inArray(feedPosts.memberId, [...subscribedMemberIds]));
  }

  const rows = await db
    .select({
      id: feedPosts.id,
      memberId: feedPosts.memberId,
      groupId: feedPosts.groupId,
      imageUrl: feedPosts.imageUrl,
      caption: feedPosts.caption,
      createdAt: feedPosts.createdAt,
      likeCount: sql<number>`(SELECT count(*) FROM ${feedLikes} WHERE ${feedLikes.postId} = ${feedPosts.id})`,
      commentCount: sql<number>`(SELECT count(*) FROM ${feedComments} WHERE ${feedComments.postId} = ${feedPosts.id})`,
    })
    .from(feedPosts)
    .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
    .orderBy(desc(feedPosts.createdAt))
    .limit(limit + 1);

  const postIds = rows.map((r) => r.id);
  const allComments = postIds.length > 0
    ? await db
        .select()
        .from(feedComments)
        .where(inArray(feedComments.postId, postIds))
        .orderBy(desc(feedComments.createdAt))
    : [];

  const commentsByPost: Record<string, typeof allComments> = {};
  for (const c of allComments) {
    if (!commentsByPost[c.postId]) commentsByPost[c.postId] = [];
    commentsByPost[c.postId].push(c);
  }

  const posts = rows.map((r) => ({
    id: r.id,
    memberId: r.memberId,
    groupId: r.groupId,
    imageUrl: r.imageUrl,
    caption: r.caption,
    createdAt: r.createdAt,
    likeCount: r.likeCount,
    commentCount: r.commentCount,
    isLiked: likedPostIds.has(r.id),
    isSubscribed: subscribedMemberIds.has(r.memberId),
    previewComments: (commentsByPost[r.id] ?? []).slice(0, 2),
  }));

  let nextCursor: string | null = null;
  if (rows.length > limit) {
    rows.pop();
    nextCursor = posts[posts.length - 1].id;
  }

  return NextResponse.json(
    { posts, nextCursor, hasSubs },
    { headers: { "Cache-Control": "no-store, must-revalidate" } }
  );
}
