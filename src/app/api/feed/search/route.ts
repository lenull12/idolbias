export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, sql, and } from "drizzle-orm";
import { getDb } from "@/db/client";
import { feedSubscriptions } from "@/db/schema";
import { GROUPS } from "@/data/artists";

const COOKIE_NAME = "idolbias_player_id";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json(
    { error: "No player" },
    { status: 401, headers: { "Cache-Control": "no-store, must-revalidate" } }
  );

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();

  if (!q) {
    return NextResponse.json(
      { results: [] },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  }

  const db = getDb();

  const results = [];
  for (const group of GROUPS) {
    for (const member of group.members) {
      if (!member.revealed) continue;
      if (
        member.stageName.toLowerCase().includes(q) ||
        group.name.toLowerCase().includes(q) ||
        (member.realName && member.realName.toLowerCase().includes(q))
      ) {
        const [followerRow] = await db
          .select({ count: sql<number>`count(*)` })
          .from(feedSubscriptions)
          .where(eq(feedSubscriptions.memberId, member.id));

        const [subRow] = await db
          .select({ count: sql<number>`count(*)` })
          .from(feedSubscriptions)
          .where(and(eq(feedSubscriptions.memberId, member.id), eq(feedSubscriptions.playerId, playerId)));

        results.push({
          memberId: member.id,
          groupId: group.id,
          stageName: member.stageName,
          groupName: group.name,
          avatar: member.profileImage ?? null,
          color: member.color,
          followerCount: followerRow?.count ?? 0,
          isFollowedByMe: (subRow?.count ?? 0) > 0,
        });
      }
    }
  }

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "no-store, must-revalidate" } }
  );
}
