import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, ne, and, or, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wallets, progression } from "@/db/schema";
import { STREAK_TICKETS, STREAK_BONUS_GEMS, todayStr, daysBetween, getMondayStr } from "@/lib/gameConfig";

const COOKIE_NAME = "idolbias_player_id";

export async function POST() {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const db = getDb();
  const now = new Date();
  const today = todayStr(now);

  const [prog] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);
  if (!prog) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  if (prog.lastClaim === today) return NextResponse.json({ error: "Already claimed today" }, { status: 400 });

  const gap = prog.lastClaim ? daysBetween(prog.lastClaim, today) : null;
  const nextStreak = gap === 1 ? prog.streak + 1 : 1;
  const dayIndex = (nextStreak - 1) % 7;
  const ticketReward = STREAK_TICKETS[dayIndex];
  const gemReward = STREAK_BONUS_GEMS[dayIndex] ?? 0;

  // ─── Weekly daily_streak_5 progress ─────────────────────────────────
  const monday = getMondayStr();
  const isSameWeek = prog.weeklyMissionsDate === monday;
  const weeklyProgress = { ...(isSameWeek ? prog.weeklyMissionProgress : {}) };
  {
    const cur = weeklyProgress["daily_streak_5"] ?? 0;
    weeklyProgress["daily_streak_5"] = Math.min(cur + 1, 5);
  }

  // Atomic claim: only update if lastClaim !== today (prevents double-claim race)
  const claimResult = await db.update(progression)
    .set({
      streak: nextStreak,
      lastClaim: today,
      totalLogins: sql`total_logins + 1`,
      weeklyMissionProgress: weeklyProgress,
      weeklyMissionsDate: monday,
      updatedAt: now,
    })
    .where(and(
      eq(progression.playerId, playerId),
      or(isNull(progression.lastClaim), ne(progression.lastClaim, today)),
    ))
    .returning({ playerId: progression.playerId });

  if (claimResult.length === 0) {
    return NextResponse.json({ error: "Already claimed today" }, { status: 400 });
  }

  await db.update(wallets).set({
    tickets: sql`tickets + ${ticketReward}`,
    gems: sql`gems + ${gemReward}`,
    updatedAt: now,
  }).where(eq(wallets.playerId, playerId));

  const [wallet] = await db.select().from(wallets).where(eq(wallets.playerId, playerId)).limit(1);

  return NextResponse.json({
    tickets: ticketReward,
    gems: gemReward,
    streak: nextStreak,
    wallet: { tickets: wallet.tickets, gems: wallet.gems },
  });
}
