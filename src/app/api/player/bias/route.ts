import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { progression } from "@/db/schema";
import { BIAS_COOLDOWN_DAYS } from "@/lib/gameConfig";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(request: Request) {
  const { idol } = await request.json() as { idol: string };
  if (!idol || typeof idol !== "string") {
    return NextResponse.json({ error: "Invalid idol name" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const db = getDb();
  const [prog] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);
  if (!prog) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const now = new Date();

  // Check cooldown
  if (prog.bias && prog.biasChangedAt) {
    const changedAt = new Date(prog.biasChangedAt);
    const elapsedDays = (now.getTime() - changedAt.getTime()) / 86400000;
    if (elapsedDays < BIAS_COOLDOWN_DAYS) {
      const remainingDays = BIAS_COOLDOWN_DAYS - Math.floor(elapsedDays);
      return NextResponse.json({
        error: `Bias can only be changed every ${BIAS_COOLDOWN_DAYS} days. ${remainingDays} day(s) remaining.`,
        remainingDays,
        cooldownDays: BIAS_COOLDOWN_DAYS,
      }, { status: 429 });
    }
  }

  await db.update(progression).set({
    bias: idol,
    biasChangedAt: now,
    updatedAt: now,
  }).where(eq(progression.playerId, playerId));

  return NextResponse.json({
    bias: idol,
    biasChangedAt: now.toISOString(),
    cooldownDays: BIAS_COOLDOWN_DAYS,
  });
}
