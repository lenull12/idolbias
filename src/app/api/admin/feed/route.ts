import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { feedPosts } from "@/db/schema";

const ADMIN_COOKIE = "idolbias_admin";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE)?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { memberId, groupId, imageUrl, caption } = body;

  if (!memberId || !groupId || !imageUrl) {
    return NextResponse.json({ error: "memberId, groupId, imageUrl required" }, { status: 400 });
  }

  const db = getDb();
  const post = {
    id: crypto.randomUUID(),
    memberId,
    groupId,
    imageUrl,
    caption: caption ?? null,
    createdAt: new Date(),
  };

  await db.insert(feedPosts).values(post);
  return NextResponse.json({ post });
}
