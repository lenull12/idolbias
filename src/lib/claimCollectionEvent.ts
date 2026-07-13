import { getDb } from "@/db/client";
import { wallets, ownedCards, events, eventParticipation } from "@/db/schema";
import { getCardsByPack } from "@/data/cards";
import { and, eq, lte, gte, sql, inArray } from "drizzle-orm";

export async function claimCollectionEvent(playerId: string, eventId: string): Promise<{ reward: any; wallet: any }> {
  const db = getDb();
  const now = new Date();

  // 1. Vérifier que l'event est actif
  const [ev] = await db.select().from(events)
    .where(and(
      eq(events.id, eventId),
      eq(events.type, "collection"),
      lte(events.startsAt, now),
      gte(events.endsAt, now),
    )).limit(1);

  if (!ev) throw new Error("Event not active");

  // 2. Valider le targetPackCode
  if (!ev.targetPackCode) throw new Error("Invalid event configuration: missing target pack");
  const cardsInPack = getCardsByPack(ev.targetPackCode);
  if (cardsInPack.length === 0) throw new Error("Invalid event configuration: unknown pack");

  // 3. Vérifier le progress
  const [ownedResult] = await db.select({ count: sql`COUNT(*)` }).from(ownedCards)
    .where(and(
      eq(ownedCards.playerId, playerId),
      inArray(ownedCards.cardId, cardsInPack.map((c: { id: string }) => c.id)),
    ));
  if (Number(ownedResult.count) < (ev.targetCount ?? 1)) throw new Error("Target not reached");

  // 4. Vérifier si déjà claimé
  const [part] = await db.select().from(eventParticipation)
    .where(and(eq(eventParticipation.eventId, eventId), eq(eventParticipation.playerId, playerId)))
    .limit(1);
  if (part?.claimed) throw new Error("Already claimed");

  // 5. Créditer
  const dustGain = ev.rewardDust ?? 0;
  const gemsGain = ev.rewardGems ?? 0;
  const ticketsGain = ev.rewardTickets ?? 0;

  await db.update(wallets).set({
    dust: sql`dust + ${dustGain}`,
    gems: sql`gems + ${gemsGain}`,
    tickets: sql`tickets + ${ticketsGain}`,
    updatedAt: now,
  }).where(eq(wallets.playerId, playerId));

  // 6. Marquer comme claimé
  await db.insert(eventParticipation)
    .values({ eventId, playerId, progress: ev.targetCount!, claimed: true, createdAt: now })
    .onConflictDoUpdate({
      target: [eventParticipation.eventId, eventParticipation.playerId],
      set: { claimed: true, progress: ev.targetCount! },
    });

  const [updatedWallet] = await db.select().from(wallets).where(eq(wallets.playerId, playerId)).limit(1);
  return {
    reward: { tickets: ticketsGain, gems: gemsGain, dust: dustGain },
    wallet: updatedWallet,
  };
}
