import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wallets, ownedCards, setCompletions } from "@/db/schema";
import { getCardsByPack, getPackInfo } from "@/data/cards";

const COOKIE_NAME = "idolbias_player_id";
const REWARD_DUST = 200;
const REWARD_GEMS = 100;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { packCode, _dev } = await request.json() as { packCode: string; _dev?: boolean };
  if (!packCode) return NextResponse.json({ error: "Missing packCode" }, { status: 400 });

  const cards = getCardsByPack(packCode);
  if (cards.length === 0) return NextResponse.json({ error: "No cards in pack" }, { status: 400 });

  const packInfo = getPackInfo(packCode);
  const db = getDb();
  const now = new Date();

  if (!_dev) {
    // Vérifier que toutes les cartes du set sont possédées (sauf en mode dev)
    const ownedRows = await db.select({ cardId: ownedCards.cardId })
      .from(ownedCards)
      .where(
        and(
          eq(ownedCards.playerId, playerId),
          inArray(ownedCards.cardId, cards.map((c) => c.id))
        )
      );

    const ownedSet = new Set(ownedRows.map((r) => r.cardId));
    if (ownedSet.size < cards.length) {
      return NextResponse.json({ error: "Set not complete" }, { status: 400 });
    }
  }

  // Vérifier si déjà claimé
  const existing = await db.select()
    .from(setCompletions)
    .where(and(eq(setCompletions.playerId, playerId), eq(setCompletions.packCode, packCode)))
    .limit(1);

  if (existing.length > 0 && existing[0].claimed) {
    return NextResponse.json({ success: true, alreadyClaimed: true, wallet: null });
  }

  // Insérer ou update la complétion
  if (existing.length > 0) {
    await db.update(setCompletions).set({
      claimed: true,
      rewardedAt: now,
    }).where(eq(setCompletions.id, existing[0].id));
  } else {
    await db.insert(setCompletions).values({
      playerId,
      packCode,
      edition: packInfo.edition,
      completedAt: now,
      rewardedAt: now,
      claimed: true,
    });
  }

  // Créditer le wallet
  await db.update(wallets).set({
    dust: sql`dust + ${REWARD_DUST}`,
    gems: sql`gems + ${REWARD_GEMS}`,
    updatedAt: now,
  }).where(eq(wallets.playerId, playerId));

  const [wallet] = await db.select().from(wallets).where(eq(wallets.playerId, playerId)).limit(1);

  return NextResponse.json({
    success: true,
    alreadyClaimed: false,
    wallet: wallet ? { tickets: wallet.tickets, gems: wallet.gems, dust: wallet.dust } : null,
  });
}
