import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, lte, gte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { progression, events } from "@/db/schema";
import { DAILY_POOL, WEEKLY_POOL, DAILY_SLOT_COUNT, WEEKLY_SLOT_COUNT, pickWeightedMissions, todayStr, getMondayStr, getDailyResetTime, getWeeklyResetTime } from "@/lib/gameConfig";
import type { MissionDef } from "@/lib/gameConfig";

const COOKIE_NAME = "idolbias_player_id";

export async function GET() {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const db = getDb();
  const [prog] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);
  if (!prog) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const today = todayStr();
  const monday = getMondayStr();
  let dailyTemplates: MissionDef[] = (prog.dailyTemplates ?? []) as MissionDef[];
  let weeklyTemplates: MissionDef[] = (prog.weeklyTemplates ?? []) as MissionDef[];

  // Repick immediately if templates are empty (e.g. after migration)
  if (dailyTemplates.length === 0) {
    dailyTemplates = pickWeightedMissions(DAILY_POOL, DAILY_SLOT_COUNT);
    await db.update(progression).set({
      dailyTemplates, missionsDate: today,
      missionProgress: {}, missionsClaimed: [], updatedAt: new Date(),
    }).where(eq(progression.playerId, playerId));
  }
  if (weeklyTemplates.length === 0) {
    weeklyTemplates = pickWeightedMissions(WEEKLY_POOL, WEEKLY_SLOT_COUNT);
    await db.update(progression).set({
      weeklyTemplates, weeklyMissionsDate: monday,
      weeklyMissionProgress: {}, weeklyMissionsClaimed: [], updatedAt: new Date(),
    }).where(eq(progression.playerId, playerId));
  }

  if (prog.missionsDate !== today) {
    dailyTemplates = pickWeightedMissions(DAILY_POOL, DAILY_SLOT_COUNT);
    await db.update(progression).set({
      dailyTemplates,
      missionsDate: today,
      missionProgress: {},
      missionsClaimed: [],
      updatedAt: new Date(),
    }).where(eq(progression.playerId, playerId));
  }

  if (prog.weeklyMissionsDate !== monday) {
    weeklyTemplates = pickWeightedMissions(WEEKLY_POOL, WEEKLY_SLOT_COUNT);
    await db.update(progression).set({
      weeklyTemplates,
      weeklyMissionsDate: monday,
      weeklyMissionProgress: {},
      weeklyMissionsClaimed: [],
      updatedAt: new Date(),
    }).where(eq(progression.playerId, playerId));
  }

  // ─── Event missions ───────────────────────────────────────────────────
  const now = new Date();
  const eventMissions = await db.select().from(events)
    .where(and(
      eq(events.type, "collection"),
      lte(events.startsAt, now),
      gte(events.endsAt, now),
    ));

  return NextResponse.json({
    daily: dailyTemplates,
    weekly: weeklyTemplates,
    event: eventMissions.map((ev) => ({
      id: `event_${ev.id}`,
      label: ev.label,
      target: ev.targetCount ?? 1,
      reward: { tickets: ev.rewardTickets ?? 0, gems: ev.rewardGems ?? 0, dust: ev.rewardDust ?? 0 },
      difficulty: ev.type === "collection" ? "normal" : "hard",
      eventEndsAt: ev.endsAt,
    })),
    dailyResetAt: getDailyResetTime().timestamp,
    weeklyResetAt: getWeeklyResetTime().timestamp,
  });
}
