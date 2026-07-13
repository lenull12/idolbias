import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cosmoPosts } from "@/db/schema";

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

  const posts = await db
    .select()
    .from(cosmoPosts)
    .where(eq(cosmoPosts.memberId, memberId))
    .orderBy(desc(cosmoPosts.createdAt))
    .limit(20);

  return NextResponse.json({ posts });
}
