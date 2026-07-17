import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { portfolioSnapshots } from "@/db/schema";
import { ensureTodayPortfolioSnapshot } from "@/lib/leaderboardEngine";

const COOKIE_NAME = "idolbias_player_id";

export async function GET() {
  const db = getDb();
  await ensureTodayPortfolioSnapshot();

  const today = new Date().toISOString().slice(0, 10);

  const all = await db.select().from(portfolioSnapshots)
    .where(eq(portfolioSnapshots.dateStr, today))
    .orderBy(desc(portfolioSnapshots.portfolioValue));

  const top = all.slice(0, 50);

  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;

  let myRank: { rank: number; portfolioValue: number } | null = null;
  if (playerId) {
    const idx = all.findIndex((r) => r.playerId === playerId);
    if (idx !== -1) myRank = { rank: idx + 1, portfolioValue: all[idx].portfolioValue };
  }

  return NextResponse.json({ leaderboard: top, asOf: today, myRank });
}
