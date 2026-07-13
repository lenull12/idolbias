export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { feedComments } from "@/db/schema";

const COOKIE_NAME = "idolbias_player_id";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { postId } = await params;
  const db = getDb();

  const comments = await db
    .select()
    .from(feedComments)
    .where(eq(feedComments.postId, postId))
    .orderBy(desc(feedComments.isOfficial), desc(feedComments.createdAt));

  return NextResponse.json(
    { comments },
    { headers: { "Cache-Control": "no-store, must-revalidate" } }
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { postId } = await params;
  const body = await request.json();
  const { authorName, content } = body;

  if (!authorName || !content) {
    return NextResponse.json(
      { error: "authorName and content required" },
      { status: 400, headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  }

  const db = getDb();

  try {
    const comment = {
      id: crypto.randomUUID(),
      postId,
      userId: playerId,
      authorName,
      content,
      isOfficial: false,
      createdAt: new Date(),
    };

    await db.insert(feedComments).values(comment);

    return NextResponse.json(
      { comment },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (err) {
    console.error("Comment error:", err);
    return NextResponse.json({ error: "Comment failed" }, { status: 500 });
  }
}
