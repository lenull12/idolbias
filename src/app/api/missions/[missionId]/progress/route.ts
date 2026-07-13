import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { progression } from "@/db/schema";
import { DAILY_POOL, WEEKLY_POOL } from "@/lib/gameConfig";
import type { MissionDef } from "@/lib/gameConfig";

const COOKIE_NAME = "idolbias_player_id";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

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

  const dailyDef = ((prog.dailyTemplates ?? []) as MissionDef[]).find((m) => m.id === missionId);
  const weeklyDef = ((prog.weeklyTemplates ?? []) as MissionDef[]).find((m) => m.id === missionId);
  const poolDef = DAILY_POOL.find((m) => m.id === missionId) || WEEKLY_POOL.find((m) => m.id === missionId);
  const def = dailyDef || weeklyDef || poolDef;
  if (!def) return NextResponse.json({ error: "Unknown mission" }, { status: 400 });

  if (missionId.startsWith("event_")) {
    return NextResponse.json({ error: "Event missions use server-side progress" }, { status: 400 });
  }

  // open_pack can only progress via /api/pack/open
  if (missionId === "open_pack") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Daily reset if the day has changed
  const today = todayStr();
  if (prog.missionsDate !== today) {
    await db.update(progression).set({
      missionProgress: {},
      missionsClaimed: [],
      missionsDate: today,
      updatedAt: new Date(),
    }).where(eq(progression.playerId, playerId));
    const [fresh] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);
    if (!fresh) return NextResponse.json({ error: "Player not found" }, { status: 404 });
    Object.assign(prog, fresh);
  }

  const current = prog.missionProgress[missionId] ?? 0;
  if (current >= def.target) return NextResponse.json({ progress: current });

  const next = Math.min(current + 1, def.target);
  await db.update(progression).set({
    missionProgress: { ...prog.missionProgress, [missionId]: next },
    updatedAt: new Date(),
  }).where(eq(progression.playerId, playerId));

  return NextResponse.json({ progress: next });
}
