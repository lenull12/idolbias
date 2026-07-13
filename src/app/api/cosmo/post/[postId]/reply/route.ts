import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { cosmoReplies } from "@/db/schema";

const COOKIE_NAME = "idolbias_player_id";

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
    return NextResponse.json({ error: "authorName and content required" }, { status: 400 });
  }

  const db = getDb();

  const reply = {
    id: crypto.randomUUID(),
    postId,
    userId: playerId,
    authorName,
    content,
    createdAt: new Date(),
  };

  await db.insert(cosmoReplies).values(reply);

  return NextResponse.json({ reply });
}
