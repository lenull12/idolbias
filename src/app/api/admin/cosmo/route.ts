import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { cosmoPosts } from "@/db/schema";

const ADMIN_COOKIE = "idolbias_admin";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE)?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { memberId, content, imageUrl } = body;

  if (!memberId || !content) {
    return NextResponse.json({ error: "memberId and content required" }, { status: 400 });
  }

  const db = getDb();
  const post = {
    id: crypto.randomUUID(),
    memberId,
    content,
    imageUrl: imageUrl ?? null,
    createdAt: new Date(),
  };

  await db.insert(cosmoPosts).values(post);
  return NextResponse.json({ post });
}
