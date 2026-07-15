export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, or, inArray, sql, gte, lte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wallets, progression, ownedCards, events, eventParticipation, type CardGrade } from "@/db/schema";
import { getPackInfo, getCardsByPack } from "@/data/cards";
import { generatePull, type ServerCard } from "@/lib/gachaEngine";
import { XP_PER_RARITY, getMondayStr } from "@/lib/gameConfig";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { packCode, bias, paymentMethod: rawMethod }: {
    packCode?: string; bias?: string | null; paymentMethod?: string;
  } = await request.json();
  if (!packCode || !getPackInfo(packCode).name)
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });

  const paymentMethod = rawMethod === "gems" ? "gems" : "tickets";
  const packInfo = getPackInfo(packCode);
  const cost = paymentMethod === "gems" ? packInfo.costGems : packInfo.costTickets;
  if (cost === undefined)
    return NextResponse.json({ error: `Pack not purchasable with ${paymentMethod}` }, { status: 400 });

  const db = getDb();
  const now = new Date();

  const [prog] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);
  if (!prog) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  // ─── Atomic conditional debit ─────────────────────────────────────────
  const costColumn = paymentMethod === "gems" ? wallets.gems : wallets.tickets;
  const balanceColumn = paymentMethod === "gems" ? "gems" : "tickets";
  const setData = paymentMethod === "gems"
    ? { gems: sql`gems - ${cost}`, updatedAt: now }
    : { tickets: sql`tickets - ${cost}`, updatedAt: now };

  const debitResult = await db.update(wallets)
    .set(setData)
    .where(and(eq(wallets.playerId, playerId), gte(costColumn, cost)))
    .returning({ [balanceColumn]: costColumn });

  if (debitResult.length === 0) {
    return NextResponse.json({ error: `Not enough ${paymentMethod}` }, { status: 400 });
  }

  // ─── Check active rate-ups ────────────────────────────────────────────
  const activeRateUps = await db.select().from(events)
    .where(and(
      eq(events.targetPackCode, packCode),
      lte(events.startsAt, now),
      gte(events.endsAt, now),
      or(eq(events.type, "rate_up"), eq(events.type, "hybrid")),
    )).limit(1);
  const rateUp = activeRateUps[0];
  const rateUpMultiplier = rateUp?.rateUpMultiplier ?? undefined;
  const rateUpRarities = rateUp?.rateUpRarities ?? undefined;

  // ─── Generate cards ───────────────────────────────────────────────────
  const cards: ServerCard[] = generatePull(5, packCode, bias ?? null, rateUpMultiplier, rateUpRarities);

  // ─── Grade-aware "isNew" detection ───────────────────────────────────
  const pulledKeys = [...new Set(cards.map((c) => `${c.cardId}:${c.grade}`))];
  const existingRows = pulledKeys.length > 0
    ? await db.select({ cardId: ownedCards.cardId, grade: ownedCards.grade })
        .from(ownedCards)
        .where(and(
          eq(ownedCards.playerId, playerId),
          or(...pulledKeys.map((k) => {
            const [cardId, grade] = k.split(":");
            return and(eq(ownedCards.cardId, cardId), eq(ownedCards.grade, grade));
          })),
        ))
    : [];
  const existingGradeKeySet = new Set(existingRows.map((r) => `${r.cardId}:${r.grade}`));
  const newCardGradeKeySet = new Set(
    pulledKeys.filter((k) => !existingGradeKeySet.has(k))
  );

  // ─── Grade-agnostic pour les missions ────────────────────────────────
  const pulledCardIds = [...new Set(cards.map((c) => c.cardId))];
  const existingCardIdRows = pulledCardIds.length > 0
    ? await db.select({ cardId: ownedCards.cardId }).from(ownedCards)
        .where(and(eq(ownedCards.playerId, playerId), inArray(ownedCards.cardId, pulledCardIds)))
    : [];
  const existingCardIdSet = new Set(existingCardIdRows.map((r) => r.cardId));
  const newCardIds = pulledCardIds.filter((id) => !existingCardIdSet.has(id));

  const fanXp = { ...prog.fanXp };
  for (const card of cards) {
    const gain = XP_PER_RARITY[card.rarity] ?? 5;
    fanXp[card.idol] = (fanXp[card.idol] ?? 0) + gain;
  }

  const currentProgress = prog.missionProgress["open_pack"] ?? 0;
  const openPackProgress = Math.min(currentProgress + 1, 1);

  // Pool missions tracking
  const rarePlusCount = cards.filter((c) => c.rarity !== "common").length;
  const open3packsProg = Math.min((prog.missionProgress["open_3_packs"] ?? 0) + 1, 3);
  const collectRareProg = Math.min((prog.missionProgress["collect_rare_plus"] ?? 0) + rarePlusCount, 2);
  const collect5newProg = Math.min((prog.missionProgress["collect_5_new"] ?? 0) + newCardIds.length, 5);

  const monday = getMondayStr();
  const isSameWeek = prog.weeklyMissionsDate === monday;
  const weeklyProgress = { ...(isSameWeek ? prog.weeklyMissionProgress : {}) };

  weeklyProgress["open_5_packs"] = Math.min((weeklyProgress["open_5_packs"] ?? 0) + 1, 5);

  {
    const prev = weeklyProgress["collect_3_new"] ?? 0;
    weeklyProgress["collect_3_new"] = Math.min(prev + newCardIds.length, 3);
  }

  const cardCounts = new Map<string, { cardId: string; grade: string; qty: number }>();
  for (const card of cards) {
    const key = `${card.cardId}|${card.grade}`;
    const existing = cardCounts.get(key);
    if (existing) existing.qty++;
    else cardCounts.set(key, { cardId: card.cardId, grade: card.grade, qty: 1 });
  }
  const ownedUpserts = Array.from(cardCounts.values()).map(({ cardId, grade, qty }) =>
    db.insert(ownedCards)
      .values({ playerId, cardId, grade, quantity: qty, firstObtainedAt: now, lastObtainedAt: now })
      .onConflictDoUpdate({
        target: [ownedCards.playerId, ownedCards.cardId, ownedCards.grade],
        set: { quantity: sql`${ownedCards.quantity} + ${qty}`, lastObtainedAt: now },
      })
  );

  await db.batch([
    db.update(progression).set({
      missionProgress: {
        ...prog.missionProgress,
        open_pack: openPackProgress,
        open_3_packs: open3packsProg,
        collect_rare_plus: collectRareProg,
        collect_5_new: collect5newProg,
      },
      weeklyMissionProgress: weeklyProgress,
      weeklyMissionsDate: monday,
      fanXp,
      updatedAt: now,
    }).where(eq(progression.playerId, playerId)),
    ...ownedUpserts,
  ]);

  // ─── Event participation (collection events) ─────────────────────────
  const activeCollectionEvents = await db.select().from(events)
    .where(and(
      eq(events.targetPackCode, packCode),
      lte(events.startsAt, now),
      gte(events.endsAt, now),
      eq(events.type, "collection"),
    ));

  for (const ev of activeCollectionEvents) {
    const cardIdsInPack = getCardsByPack(ev.targetPackCode!).map((c) => c.id);
    const ownedInPack = await db.select({ count: sql`COUNT(*)` }).from(ownedCards)
      .where(and(
        eq(ownedCards.playerId, playerId),
        inArray(ownedCards.cardId, cardIdsInPack),
      ));
    const count = Number(ownedInPack[0]?.count ?? 0);
    await db.insert(eventParticipation)
      .values({ eventId: ev.id, playerId, progress: count, claimed: count >= (ev.targetCount ?? 1), createdAt: now })
      .onConflictDoUpdate({
        target: [eventParticipation.eventId, eventParticipation.playerId],
        set: { progress: count, claimed: count >= (ev.targetCount ?? 1) },
      });
  }

  const [updatedWallet] = await db.select().from(wallets).where(eq(wallets.playerId, playerId)).limit(1);

  return NextResponse.json({
    cards: cards.map((c) => ({
      ...c,
      isNew: newCardGradeKeySet.has(`${c.cardId}:${c.grade}`),
    })),
    wallet: { tickets: updatedWallet.tickets, gems: updatedWallet.gems },
    newCardIds,
  });
}
