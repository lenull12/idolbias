import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, sql, gte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tradeOffers, ownedCards, type CardGrade } from "@/db/schema";
import { GRADE_ORDER } from "@/lib/gradeConfig";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tradeId: string }> },
) {
  const { tradeId } = await params;
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const db = getDb();
  const [offer] = await db.select().from(tradeOffers)
    .where(eq(tradeOffers.id, Number(tradeId))).limit(1);
  if (!offer || offer.status !== "open")
    return NextResponse.json({ error: "Offer not available" }, { status: 400 });
  if (offer.offererId === playerId)
    return NextResponse.json({ error: "Cannot accept your own offer" }, { status: 400 });

  const ownedGradeRows = await db.select({ grade: ownedCards.grade, quantity: ownedCards.quantity })
    .from(ownedCards)
    .where(and(
      eq(ownedCards.playerId, playerId),
      eq(ownedCards.cardId, offer.requestedCardId),
      gte(ownedCards.quantity, 1),
    ));
  if (ownedGradeRows.length === 0)
    return NextResponse.json({ error: "You don't own the requested card" }, { status: 400 });

  const cheapestOwned = [...ownedGradeRows].sort(
    (a, b) => GRADE_ORDER.indexOf(a.grade as CardGrade) - GRADE_ORDER.indexOf(b.grade as CardGrade)
  )[0];

  const now = new Date();

  // Atomic status update
  const updated = await db.update(tradeOffers)
    .set({ status: "completed", resolvedAt: now, resolvedBy: playerId })
    .where(and(eq(tradeOffers.id, offer.id), eq(tradeOffers.status, "open")))
    .returning({ id: tradeOffers.id });

  if (updated.length === 0) {
    return NextResponse.json({ error: "Offer already resolved" }, { status: 400 });
  }

  // Atomic decrement du grade choisi — si échoue, rollback du statut
  const debitResult = await db.update(ownedCards)
    .set({ quantity: sql`${ownedCards.quantity} - 1` })
    .where(and(
      eq(ownedCards.playerId, playerId),
      eq(ownedCards.cardId, offer.requestedCardId),
      eq(ownedCards.grade, cheapestOwned.grade),
      gte(ownedCards.quantity, 1),
    ))
    .returning({ cardId: ownedCards.cardId });

  if (debitResult.length === 0) {
    // Rollback : remettre l'offre à open
    await db.update(tradeOffers)
      .set({ status: "open", resolvedAt: null, resolvedBy: null })
      .where(eq(tradeOffers.id, offer.id));
    return NextResponse.json({ error: "Could not debit card, offer restored" }, { status: 409 });
  }

  // Escrow des cartes
  await db.batch([
    db.insert(ownedCards)
      .values({ playerId, cardId: offer.offeredCardId, grade: offer.offeredGrade, quantity: 1, firstObtainedAt: now, lastObtainedAt: now })
      .onConflictDoUpdate({
        target: [ownedCards.playerId, ownedCards.cardId, ownedCards.grade],
        set: { quantity: sql`${ownedCards.quantity} + 1`, lastObtainedAt: now },
      }),
    db.insert(ownedCards)
      .values({ playerId: offer.offererId, cardId: offer.requestedCardId, grade: cheapestOwned.grade, quantity: 1, firstObtainedAt: now, lastObtainedAt: now })
      .onConflictDoUpdate({
        target: [ownedCards.playerId, ownedCards.cardId, ownedCards.grade],
        set: { quantity: sql`${ownedCards.quantity} + 1`, lastObtainedAt: now },
      }),
  ]);

  return NextResponse.json({ ok: true });
}
