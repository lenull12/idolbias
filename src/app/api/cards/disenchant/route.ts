import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wallets, ownedCards } from "@/db/schema";
import { getCardById, rarityFromReference } from "@/data/cards";
import { DISENCHANT_VALUES } from "@/lib/gameConfig";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { cardId, quantity: rawQty }: { cardId?: string; quantity?: number } = await request.json();
  if (!cardId) return NextResponse.json({ error: "Missing cardId" }, { status: 400 });

  const card = getCardById(cardId);
  if (!card) return NextResponse.json({ error: "Unknown card" }, { status: 400 });

  const db = getDb();
  const [owned] = await db.select().from(ownedCards)
    .where(and(eq(ownedCards.playerId, playerId), eq(ownedCards.cardId, cardId))).limit(1);

  const maxDisenchantable = owned ? owned.quantity - 1 : 0;
  if (maxDisenchantable <= 0)
    return NextResponse.json({ error: "No duplicate to disenchant" }, { status: 400 });

  const quantity = Math.min(maxDisenchantable, Math.max(1, Math.floor(rawQty ?? 1)));
  const rarity = rarityFromReference(card.reference);
  const dustGained = (DISENCHANT_VALUES[rarity] ?? 0) * quantity;
  const now = new Date();

  await db.batch([
    db.update(ownedCards).set({ quantity: sql`${ownedCards.quantity} - ${quantity}` })
      .where(and(eq(ownedCards.playerId, playerId), eq(ownedCards.cardId, cardId))),
    db.update(wallets).set({ dust: sql`dust + ${dustGained}`, updatedAt: now })
      .where(eq(wallets.playerId, playerId)),
  ]);

  const [wallet] = await db.select().from(wallets).where(eq(wallets.playerId, playerId)).limit(1);

  return NextResponse.json({
    cardId,
    quantityDisenchanted: quantity,
    dustGained,
    wallet: { tickets: wallet.tickets, gems: wallet.gems, dust: wallet.dust },
  });
}
