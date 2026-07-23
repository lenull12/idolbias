import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { players, wallets, progression } from "@/db/schema";
import { cardInstances } from "@/db/footballSchema";

const COOKIE_NAME = "idolbias_player_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;
const WELCOME_TICKETS = 25;
const WELCOME_GEMS = 500;

export async function GET() {
  try {
    const db = getDb();
    const cookieStore = await cookies();
    let playerId = cookieStore.get(COOKIE_NAME)?.value;

    let isNew = false;

    if (!playerId) {
      playerId = crypto.randomUUID();
      isNew = true;
    } else {
      const existing = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
      if (existing.length === 0) isNew = true;
    }

    if (isNew) {
      const now = new Date();
      await db.insert(players).values({
        id: playerId, createdAt: now,
      });
      await db.insert(wallets).values({
        playerId, tickets: WELCOME_TICKETS, gems: WELCOME_GEMS, updatedAt: now,
      });

      // Use raw SQL to avoid schema column mismatch (migrations may not have all columns)
      const today = new Date().toISOString().slice(0, 10);
      await db.run(sql`
        INSERT INTO progression (player_id, streak, missions_date, mission_progress, missions_claimed, pity_counters, updated_at)
        VALUES (${playerId}, 0, ${today}, '{}', '[]', '{}', ${now.getTime()})
      `);
    }

    let [wallet] = await db.select().from(wallets).where(eq(wallets.playerId, playerId)).limit(1);
    let [prog] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);

    // Recovery: if wallet or progression is missing for an existing player, recreate them
    if (!wallet) {
      await db.insert(wallets).values({ playerId, tickets: WELCOME_TICKETS, gems: WELCOME_GEMS, updatedAt: new Date() });
      [wallet] = await db.select().from(wallets).where(eq(wallets.playerId, playerId)).limit(1);
    }
    if (!prog) {
      const today = new Date().toISOString().slice(0, 10);
      await db.run(sql`
        INSERT INTO progression (player_id, streak, missions_date, mission_progress, missions_claimed, pity_counters, updated_at)
        VALUES (${playerId}, 0, ${today}, '{}', '[]', '{}', ${Date.now()})
      `);
      [prog] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);
    }

    const instanceRows = await db.select().from(cardInstances).where(eq(cardInstances.ownerId, playerId));
    const collection = instanceRows.length;
    const collectionGrades: Record<string, number> = {};
    for (const row of instanceRows) {
      collectionGrades[row.grade] = (collectionGrades[row.grade] ?? 0) + 1;
    }

    const [playerRow] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
    const createdAt = playerRow?.createdAt ?? new Date();
    const welcomePackClaimedAt = playerRow?.welcomePackClaimedAt ?? null;

    const res = NextResponse.json({ playerId, isNew, wallet, progression: prog, collection, collectionGrades, createdAt, welcomePackClaimedAt });
    res.cookies.set(COOKIE_NAME, playerId, {
      httpOnly: true, sameSite: "lax", maxAge: COOKIE_MAX_AGE, path: "/",
    });
    return res;
  } catch (err) {
    console.error("Player API error:", err);
    return NextResponse.json(
      { error: "Internal error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
