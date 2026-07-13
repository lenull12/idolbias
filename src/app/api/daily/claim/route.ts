import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wallets, progression } from "@/db/schema";
import { STREAK_TICKETS, STREAK_DAY7_GEMS, MISSIONS_WEEKLY, todayStr, daysBetween, getMondayStr } from "@/lib/gameConfig";

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
  let gemReward = dayIndex === 6 ? STREAK_DAY7_GEMS : 0;



  // ─── Weekly daily_streak_5 progress ─────────────────────────────────
  const monday = getMondayStr();
  const isSameWeek = prog.weeklyMissionsDate === monday;
  const weeklyProgress = { ...(isSameWeek ? prog.weeklyMissionProgress : {}) };
  const streak5Def = MISSIONS_WEEKLY.find((m) => m.id === "daily_streak_5");
  if (streak5Def) {
    const cur = weeklyProgress["daily_streak_5"] ?? 0;
    weeklyProgress["daily_streak_5"] = Math.min(cur + 1, streak5Def.target);
  }

  await db.batch([
    db.update(wallets).set({
      tickets: sql`tickets + ${ticketReward}`,
      gems: sql`gems + ${gemReward}`,
      updatedAt: now,
    }).where(eq(wallets.playerId, playerId)),
    db.update(progression).set({
      streak: nextStreak,
      lastClaim: today,
      totalLogins: sql`total_logins + 1`,
      weeklyMissionProgress: weeklyProgress,
      weeklyMissionsDate: monday,
      updatedAt: now,
    }).where(eq(progression.playerId, playerId)),
  ]);

  const [wallet] = await db.select().from(wallets).where(eq(wallets.playerId, playerId)).limit(1);

  return NextResponse.json({
    tickets: ticketReward,
    gems: gemReward,
    streak: nextStreak,
    wallet: { tickets: wallet.tickets, gems: wallet.gems },
  });
}
