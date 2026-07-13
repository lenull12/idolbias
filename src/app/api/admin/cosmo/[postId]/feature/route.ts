import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cosmoFeaturedResponses, cosmoReplies } from "@/db/schema";

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
  const { replyId, responseContent } = body;

  if (!replyId || !responseContent) {
    return NextResponse.json({ error: "replyId and responseContent required" }, { status: 400 });
  }

  const db = getDb();

  const existing = await db
    .select()
    .from(cosmoFeaturedResponses)
    .where(eq(cosmoFeaturedResponses.replyId, replyId))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: "Reply already featured" }, { status: 409 });
  }

  const featured = {
    id: crypto.randomUUID(),
    postId,
    replyId,
    responseContent,
    createdAt: new Date(),
  };

  await db.insert(cosmoFeaturedResponses).values(featured);
  return NextResponse.json({ featured });
}
