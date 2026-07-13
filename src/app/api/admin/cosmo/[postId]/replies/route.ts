import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cosmoReplies } from "@/db/schema";

const ADMIN_COOKIE = "idolbias_admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE)?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const db = getDb();

  const replies = await db
    .select()
    .from(cosmoReplies)
    .where(eq(cosmoReplies.postId, postId))
    .orderBy(desc(cosmoReplies.createdAt));

  return NextResponse.json({ replies });
}
