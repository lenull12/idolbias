import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { feedComments } from "@/db/schema";

const ADMIN_COOKIE = "idolbias_admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE)?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const db = getDb();

  const comment = {
    id: crypto.randomUUID(),
    postId,
    userId: null,
    authorName: body.authorName ?? "Admin",
    content,
    isOfficial: true,
    createdAt: new Date(),
  };

  await db.insert(feedComments).values(comment);
  return NextResponse.json({ comment });
}
