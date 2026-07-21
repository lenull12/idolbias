import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { progression } from "@/db/schema";
import { CHECKIN_XP, getAffinityTier } from "@/lib/affinityConfig";
import { todayStr } from "@/lib/gameConfig";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get("idolbias_player_id")?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { characterId }: { characterId?: string } = await request.json().catch(() => ({}));
  if (!characterId) return NextResponse.json({ error: "Missing characterId" }, { status: 400 });

  const db = getDb();
  const [prog] = await db
    .select()
    .from(progression)
    .where(eq(progression.playerId, playerId))
    .limit(1);

  if (!prog) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const today = todayStr();
  if (prog.affinityCheckinDate === today) {
    return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
  }

  const currentXp = (prog.affinityXp as Record<string, number>)?.[characterId] ?? 0;
  const newXp = currentXp + CHECKIN_XP;
  const newTier = getAffinityTier(newXp);
  const oldTier = getAffinityTier(currentXp);
  const tierUp = newTier.tier > oldTier.tier;

  await db
    .update(progression)
    .set({
      affinityXp: { ...((prog.affinityXp as Record<string, number>) ?? {}), [characterId]: newXp },
      affinityCheckinDate: today,
      updatedAt: new Date(),
    })
    .where(eq(progression.playerId, playerId));

  return NextResponse.json({
    characterId,
    xp: newXp,
    tier: newTier,
    tierUp,
    reward: tierUp ? newTier.reward : null,
  });
}
