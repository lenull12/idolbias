import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { players, wallets, progression, ownedCards } from "@/db/schema";
import type { CardGrade } from "@/db/schema";

const COOKIE_NAME = "idolbias_player_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;
const WELCOME_TICKETS = 5;
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
        INSERT INTO progression (player_id, streak, missions_date, mission_progress, missions_claimed, fan_xp, updated_at)
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
        INSERT INTO progression (player_id, streak, missions_date, mission_progress, missions_claimed, fan_xp, updated_at)
        VALUES (${playerId}, 0, ${today}, '{}', '[]', '{}', ${Date.now()})
      `);
      [prog] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);
    }

    const ownedRows = await db.select().from(ownedCards).where(eq(ownedCards.playerId, playerId));
    const collection: Record<string, number> = {};
    const collectionGrades: Record<string, Partial<Record<CardGrade, number>>> = {};
    for (const row of ownedRows) {
      collection[row.cardId] = (collection[row.cardId] ?? 0) + row.quantity;
      if (!collectionGrades[row.cardId]) collectionGrades[row.cardId] = {};
      collectionGrades[row.cardId][row.grade as CardGrade] = row.quantity;
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
