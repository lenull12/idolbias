import { NextResponse } from "next/server";
import { eq, or, and, desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cardInstances } from "@/db/footballSchema";

export async function GET() {
  const db = getDb();

  const rows = await db.select().from(cardInstances)
    .where(or(eq(cardInstances.grade, "gem"), eq(cardInstances.grade, "pristine")))
    .orderBy(desc(cardInstances.obtainedAt));

  const enriched = rows
    .map((row) => ({
      playerId: row.ownerId,
      instanceId: row.id,
      printId: row.printId,
      grade: row.grade,
      ovr: row.ovr,
      obtainedAt: row.obtainedAt,
    }))
    .sort((a, b) => {
      const gradeRank = (g: string) => (g === "gem" ? 0 : 1);
      return gradeRank(a.grade) - gradeRank(b.grade) || b.ovr - a.ovr;
    })
    .slice(0, 30);

  return NextResponse.json({ rarest: enriched });
}
