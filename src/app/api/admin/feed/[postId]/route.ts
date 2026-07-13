export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { feedPosts, feedLikes, feedComments } from "@/db/schema";

const ADMIN_COOKIE = "idolbias_admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE)?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const db = getDb();

  try {
    await db.delete(feedComments).where(eq(feedComments.postId, postId));
    await db.delete(feedLikes).where(eq(feedLikes.postId, postId));
    await db.delete(feedPosts).where(eq(feedPosts.id, postId));

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Delete post error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
