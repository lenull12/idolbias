import { eq, ne, and } from "drizzle-orm";
import { getDb } from "@/db/client";
import { leaderboardMeta } from "@/db/schema";
import { cardInstances } from "@/db/footballSchema";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function computePlayerCardCounts(): Promise<Map<string, number>> {
  const db = getDb();
  const rows = await db.select().from(cardInstances);
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.ownerId, (counts.get(row.ownerId) ?? 0) + 1);
  }
  return counts;
}

export async function ensureTodaySnapshot() {
  const db = getDb();
  const today = todayStr();

  const claimed = await db.update(leaderboardMeta)
    .set({ lastComputedDate: today })
    .where(and(eq(leaderboardMeta.id, 1), ne(leaderboardMeta.lastComputedDate, today)))
    .returning();
  if (claimed.length === 0) return;

  await computePlayerCardCounts();
}
