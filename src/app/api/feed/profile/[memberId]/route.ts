export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { feedPosts, feedSubscriptions, feedLikes, feedComments } from "@/db/schema";
import { GROUPS } from "@/data/artists";

const COOKIE_NAME = "idolbias_player_id";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json(
    { error: "No player" },
    { status: 401, headers: { "Cache-Control": "no-store, must-revalidate" } }
  );

  const { memberId } = await params;
  const db = getDb();

  const group = GROUPS.find((g) => g.members.some((m) => m.id === memberId));
  const member = group?.members.find((m) => m.id === memberId);

  if (!member || !group) {
    return NextResponse.json(
      { error: "Member not found" },
      { status: 404, headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  }

  const [followerRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedSubscriptions)
    .where(eq(feedSubscriptions.memberId, memberId));

  const [isFollowedRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedSubscriptions)
    .where(and(eq(feedSubscriptions.memberId, memberId), eq(feedSubscriptions.playerId, playerId)));

  // Fetch posts and player likes separately
  const postRows = await db
    .select({
      id: feedPosts.id,
      imageUrl: feedPosts.imageUrl,
      caption: feedPosts.caption,
      createdAt: feedPosts.createdAt,
      likeCount: sql<number>`(SELECT count(*) FROM ${feedLikes} WHERE ${feedLikes.postId} = ${feedPosts.id})`,
      commentCount: sql<number>`(SELECT count(*) FROM ${feedComments} WHERE ${feedComments.postId} = ${feedPosts.id})`,
    })
    .from(feedPosts)
    .where(eq(feedPosts.memberId, memberId))
    .orderBy(desc(feedPosts.createdAt));

  const postIds = postRows.map((p) => p.id);
  const myLikesOnPosts = postIds.length > 0
    ? await db
        .select({ postId: feedLikes.postId })
        .from(feedLikes)
        .where(and(eq(feedLikes.userId, playerId), inArray(feedLikes.postId, postIds)))
    : [];
  const likedPostIds = new Set(myLikesOnPosts.map((l) => l.postId));

  return NextResponse.json(
    {
      member: {
        id: member.id,
        stageName: member.stageName,
        realName: member.realName,
        groupName: group.name,
        groupId: group.id,
        position: member.position,
        avatar: member.profileImage ?? null,
        color: member.color,
        bio: member.bio,
        birthday: member.birthday,
      },
      followerCount: followerRow?.count ?? 0,
      postCount: postRows.length,
      isFollowedByMe: (isFollowedRow?.count ?? 0) > 0,
      posts: postRows.map((p) => ({ ...p, isLiked: likedPostIds.has(p.id) })),
    },
    { headers: { "Cache-Control": "no-store, must-revalidate" } }
  );
}
