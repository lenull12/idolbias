import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { progression } from "@/db/schema";
import { WEEKLY_POOL, getMondayStr } from "@/lib/gameConfig";
import type { MissionDef } from "@/lib/gameConfig";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await params;
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const db = getDb();
  const [prog] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);
  if (!prog) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const templateDef = ((prog.weeklyTemplates ?? []) as MissionDef[]).find((m) => m.id === missionId);
  const poolDef = WEEKLY_POOL.find((m) => m.id === missionId);
  const def = templateDef || poolDef;
  if (!def) return NextResponse.json({ error: "Unknown mission" }, { status: 400 });

  const serverTracked = ["open_5_packs", "collect_3_new", "daily_streak_5"];
  if (serverTracked.includes(missionId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const monday = getMondayStr();
  if (prog.weeklyMissionsDate !== monday) {
    await db.update(progression).set({
      weeklyMissionProgress: {},
      weeklyMissionsClaimed: [],
      weeklyMissionsDate: monday,
      updatedAt: new Date(),
    }).where(eq(progression.playerId, playerId));
    const [fresh] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);
    if (!fresh) return NextResponse.json({ error: "Player not found" }, { status: 404 });
    Object.assign(prog, fresh);
  }

  const current = prog.weeklyMissionProgress[missionId] ?? 0;
  if (current >= def.target) return NextResponse.json({ progress: current });

  const next = Math.min(current + 1, def.target);
  await db.update(progression).set({
    weeklyMissionProgress: { ...prog.weeklyMissionProgress, [missionId]: next },
    updatedAt: new Date(),
  }).where(eq(progression.playerId, playerId));

  return NextResponse.json({ progress: next });
}
