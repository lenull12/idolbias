import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wallets, progression } from "@/db/schema";
import { getMondayStr } from "@/lib/gameConfig";
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
  const def = templateDef;
  if (!def) return NextResponse.json({ error: "Unknown mission" }, { status: 400 });

  if (!templateDef) {
    return NextResponse.json({ error: "This mission is not active this week" }, { status: 400 });
  }

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

  if ((prog.weeklyMissionProgress[missionId] ?? 0) < def.target)
    return NextResponse.json({ error: "Mission not complete" }, { status: 400 });

  const now = new Date();
  const reward = def.reward;
  const ticketAdd = reward.tickets ?? 0;
  const gemAdd = reward.gems ?? 0;
  const dustAdd = reward.dust ?? 0;

  // Atomic claim: mark as claimed with SQL-level NOT EXISTS guard
  const claimResult = await db.update(progression)
    .set({
      weeklyMissionsClaimed: sql`json_set(${progression.weeklyMissionsClaimed}, '$[#]', ${missionId})`,
      updatedAt: now,
    })
    .where(and(
      eq(progression.playerId, playerId),
      sql`NOT EXISTS (SELECT 1 FROM json_each(${progression.weeklyMissionsClaimed}) WHERE value = ${missionId})`,
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
