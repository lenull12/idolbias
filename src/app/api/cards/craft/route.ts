export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, sql, gte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wallets, ownedCards } from "@/db/schema";
import CARDS, { rarityFromReference } from "@/data/cards";
import { CRAFT_COSTS } from "@/lib/gameConfig";
import type { Rarity } from "@/components/CardEffects";

const COOKIE_NAME = "idolbias_player_id";
const VALID_RARITIES: Rarity[] = ["common", "rare", "epic", "legendary", "secret"];

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { rarity }: { rarity?: Rarity } = await request.json();
  if (!rarity || !VALID_RARITIES.includes(rarity))
    return NextResponse.json({ error: "Invalid rarity" }, { status: 400 });

  const pool = CARDS.filter((c) => rarityFromReference(c.reference) === rarity);
  if (pool.length === 0) return NextResponse.json({ error: "No cards in this rarity" }, { status: 400 });

  const cost = CRAFT_COSTS[rarity];
  const db = getDb();
  const now = new Date();

  // ─── Atomic conditional debit ─────────────────────────────────────────
  const debitResult = await db.update(wallets)
    .set({ dust: sql`dust - ${cost}`, updatedAt: now })
    .where(and(eq(wallets.playerId, playerId), gte(wallets.dust, cost)))
    .returning({ dust: wallets.dust });

  if (debitResult.length === 0) {
    return NextResponse.json({ error: "Not enough dust" }, { status: 400 });
  }

  const picked = pool[Math.floor(Math.random() * pool.length)];

  await db.insert(ownedCards)
    .values({ playerId, cardId: picked.id, quantity: 1, firstObtainedAt: now, lastObtainedAt: now })
    .onConflictDoUpdate({
      target: [ownedCards.playerId, ownedCards.cardId],
      set: { quantity: sql`${ownedCards.quantity} + 1`, lastObtainedAt: now },
    });

  const [updatedWallet] = await db.select().from(wallets).where(eq(wallets.playerId, playerId)).limit(1);

  return NextResponse.json({
    card: picked,
    dustSpent: cost,
    wallet: { tickets: updatedWallet.tickets, gems: updatedWallet.gems, dust: updatedWallet.dust },
  });
}
