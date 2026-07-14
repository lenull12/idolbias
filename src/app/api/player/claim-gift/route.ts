import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { players, wallets } from "@/db/schema";

const COOKIE_NAME = "idolbias_player_id";
const GIFT_GEMS = 300;

export async function POST() {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const db = getDb();
  const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });
  if (player.welcomePackClaimedAt) {
    return NextResponse.json({ error: "Gift already claimed" }, { status: 400 });
  }

  const now = new Date();
  await db.batch([
    db.update(players).set({ welcomePackClaimedAt: now }).where(eq(players.id, playerId)),
    db.update(wallets).set({ gems: sql`gems + ${GIFT_GEMS}`, updatedAt: now }).where(eq(wallets.playerId, playerId)),
  ]);

  const [wallet] = await db.select().from(wallets).where(eq(wallets.playerId, playerId)).limit(1);

  return NextResponse.json({ wallet: { tickets: wallet.tickets, gems: wallet.gems, dust: wallet.dust } });
}
