import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wallets, progression } from "@/db/schema";
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
  const def = dailyDef || weeklyDef;
  if (!def) return NextResponse.json({ error: "Unknown mission" }, { status: 400 });

  // ─── Event missions ───────────────────────────────────────────────────
  if (missionId.startsWith("event_")) {
    try {
      const { claimCollectionEvent } = await import("@/lib/claimCollectionEvent");
      const eventId = missionId.replace("event_", "");
      const result = await claimCollectionEvent(playerId, eventId);
      return NextResponse.json(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  if (!dailyDef && !weeklyDef) {
    return NextResponse.json({ error: "This mission is not active today" }, { status: 400 });
  }

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

  if ((prog.missionProgress[missionId] ?? 0) < def.target)
    return NextResponse.json({ error: "Mission not complete" }, { status: 400 });

  const now = new Date();
  const reward = def.reward;
  const ticketAdd = reward.tickets ?? 0;
  const gemAdd = reward.gems ?? 0;
  const dustAdd = reward.dust ?? 0;

  // Atomic claim: mark as claimed with SQL-level NOT EXISTS guard
  const claimResult = await db.update(progression)
    .set({
      missionsClaimed: sql`json_set(${progression.missionsClaimed}, '$[#]', ${missionId})`,
      updatedAt: now,
    })
    .where(and(
      eq(progression.playerId, playerId),
      sql`NOT EXISTS (SELECT 1 FROM json_each(${progression.missionsClaimed}) WHERE value = ${missionId})`,
    ))
    .returning({ playerId: progression.playerId });

  if (claimResult.length === 0) {
    return NextResponse.json({ error: "Already claimed" }, { status: 400 });
  }

  await db.update(wallets).set({
    tickets: sql`tickets + ${ticketAdd}`,
    gems: sql`gems + ${gemAdd}`,
    dust: sql`dust + ${dustAdd}`,
    updatedAt: now,
  }).where(eq(wallets.playerId, playerId));

  const [wallet] = await db.select().from(wallets).where(eq(wallets.playerId, playerId)).limit(1);

  return NextResponse.json({ reward, wallet: { tickets: wallet.tickets, gems: wallet.gems, dust: wallet.dust } });
}
