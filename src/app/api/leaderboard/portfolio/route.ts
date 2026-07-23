import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { cardInstances } from "@/db/footballSchema";
import { computePlayerCardCounts } from "@/lib/leaderboardEngine";

const COOKIE_NAME = "idolbias_player_id";

export async function GET() {
  const counts = await computePlayerCardCounts();
  const sorted = Array.from(counts.entries())
    .map(([playerId, count]) => ({ playerId, cardCount: count }))
    .sort((a, b) => b.cardCount - a.cardCount);

  const top = sorted.slice(0, 50);

  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;

  let myRank: { rank: number; cardCount: number } | null = null;
  if (playerId) {
    const idx = sorted.findIndex((r) => r.playerId === playerId);
    if (idx !== -1) myRank = { rank: idx + 1, cardCount: sorted[idx].cardCount };
  }

  const today = new Date().toISOString().slice(0, 10);
  return NextResponse.json({ leaderboard: top, asOf: today, myRank });
}
