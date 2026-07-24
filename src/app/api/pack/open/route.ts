export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, gte, sql, or, isNull, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wallets, progression, cardInstances, cardPrints, type CardGrade } from "@/db/schema";
import { getPackInfo } from "@/data/footballCards";
import { generatePull, type ServerCard } from "@/lib/gachaEngine";
import { getPullCost, CARDS_PER_PACK, type PullCount } from "@/lib/pullConfig";
import { getMondayStr } from "@/lib/gameConfig";

const COOKIE_NAME = "idolbias_player_id";
const MAX_RETRIES = 3;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const { packCode, paymentMethod: rawMethod, pullCount: rawCount }: {
    packCode?: string; paymentMethod?: string; pullCount?: number;
  } = await request.json();
  if (!packCode || !getPackInfo(packCode).name)
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });

  const numPacks: PullCount = rawCount === 5 ? 5 : 1;
  const paymentMethod = rawMethod === "gems" ? "gems" : "tickets";
  const packInfo = getPackInfo(packCode);
  const unitCost = paymentMethod === "gems" ? packInfo.costGems : packInfo.costTickets;
  if (unitCost === undefined)
    return NextResponse.json({ error: `Pack not purchasable with ${paymentMethod}` }, { status: 400 });
  const cost = getPullCost(unitCost, numPacks);

  const db = getDb();
  const now = new Date();

  let [prog] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);
  if (!prog) {
    const today = new Date().toISOString().slice(0, 10);
    await db.run(sql`
      INSERT INTO progression (player_id, streak, missions_date, mission_progress, missions_claimed, pity_counters, updated_at)
      VALUES (${playerId}, 0, ${today}, '{}', '[]', '{}', ${now.getTime()})
    `);
    [prog] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);
    if (!prog) return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const costColumn = paymentMethod === "gems" ? wallets.gems : wallets.tickets;

  const { cards, pityCountOut } = generatePull(
    numPacks * CARDS_PER_PACK,
    packCode,
    prog.missionProgress,
    (prog.pityCounters as Record<string, number>)?.[packCode] ?? 0,
  );

  const openPackProgress = Math.min((prog.missionProgress["open_pack"] ?? 0) + 1, 1);
  const rarePlusCount = cards.filter((c) => c.rarity !== "common").length;
  const open3packsProg = Math.min((prog.missionProgress["open_3_packs"] ?? 0) + 1, 3);
  const collectRareProg = Math.min((prog.missionProgress["collect_rare_plus"] ?? 0) + rarePlusCount, 2);
  const collect5newProg = Math.min((prog.missionProgress["collect_5_new"] ?? 0) + cards.length, 5);

  const monday = getMondayStr();
  const isSameWeek = prog.weeklyMissionsDate === monday;
  const weeklyProgress = { ...(isSameWeek ? prog.weeklyMissionProgress : {}) };

  weeklyProgress["open_5_packs"] = Math.min((weeklyProgress["open_5_packs"] ?? 0) + 1, 5);
  weeklyProgress["collect_3_new"] = Math.min((weeklyProgress["collect_3_new"] ?? 0) + cards.length, 3);

  // Group cards by printId so we (a) increment minted once per print and
  // (b) assign distinct serials when a pack yields several cards of the same print.
  const printOrder: string[] = [];
  const printCount = new Map<string, number>();
  for (const c of cards) {
    if (!printCount.has(c.printId)) {
      printCount.set(c.printId, 0);
      printOrder.push(c.printId);
    }
    printCount.set(c.printId, printCount.get(c.printId)! + 1);
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // --- Fresh optimistic read of prints + wallet (re-read every retry) ---
    const printRows = await db
      .select({ id: cardPrints.id, minted: cardPrints.minted, mintCap: cardPrints.mintCap })
      .from(cardPrints)
      .where(inArray(cardPrints.id, printOrder));
    const printMap = new Map(printRows.map((p) => [p.id, p]));

    // Assign serials: within the cap => numbered (1-based), beyond => unnumbered (null).
    const serials: Record<string, number | null> = {};
    const idx = new Map<string, number>();
    for (const c of cards) {
      const p = printMap.get(c.printId)!;
      const base = p.minted;
      const k = idx.get(c.printId) ?? 0;
      const m = base + k + 1;
      serials[c.id] = p.mintCap == null || m <= p.mintCap ? m : null;
      idx.set(c.printId, k + 1);
    }

    const [walletRow] = await db
      .select({ gems: wallets.gems, tickets: wallets.tickets })
      .from(wallets)
      .where(eq(wallets.playerId, playerId))
      .limit(1);
    const balance = walletRow ? (paymentMethod === "gems" ? walletRow.gems : walletRow.tickets) : 0;
    if (!walletRow || balance < cost)
      return NextResponse.json({ error: `Not enough ${paymentMethod}` }, { status: 400 });

    // --- Build ONE atomic batch (D1 batch == transaction, all-or-nothing on error) ---
    const stmts: any[] = [];

    // (a) Increment minted per print, guarded so a concurrent pull loses the race
    //     (0 rows returned) instead of double-minting.
    for (const pid of printOrder) {
      const p = printMap.get(pid)!;
      const cnt = printCount.get(pid)!;
      stmts.push(
        db.update(cardPrints)
          .set({ minted: sql`minted + ${cnt}` })
          .where(
            and(
              eq(cardPrints.id, pid),
              eq(cardPrints.minted, p.minted),
            ),
          )
          .returning({ id: cardPrints.id, minted: cardPrints.minted }),
      );
    }

    // (b) Debit wallet, guarded by balance.
    stmts.push(
      db.update(wallets)
        .set(
          paymentMethod === "gems"
            ? { gems: sql`gems - ${cost}`, updatedAt: now }
            : { tickets: sql`tickets - ${cost}`, updatedAt: now },
        )
        .where(and(eq(wallets.playerId, playerId), gte(costColumn, cost)))
        .returning({ gems: wallets.gems, tickets: wallets.tickets }),
    );

    // (c) Insert instances with their resolved serials.
    for (const c of cards) {
      stmts.push(
        db.insert(cardInstances).values({
          id: c.id,
          printId: c.printId,
          ownerId: playerId,
          characterId: c.characterId,
          serial: serials[c.id],
          tecStats: c.tecStats ?? { passe: 0, tir: 0, dribble: 0, centre: 0, tacle: 0, controle: 0 },
          gkStats: c.gkStats,
          setPieceStats: c.setPieceStats,
          phyStats: c.phyStats,
          menStats: c.menStats,
          position: c.group,
          position12: c.position12,
          role: c.role,
          ovr: c.ovr,
          grade: c.grade as any,
          affinityLastActiveAt: now,
          pityTriggered: c.pityTriggered ?? false,
          obtainedAt: now,
        }),
      );
    }

    // (d) Progression.
    stmts.push(
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
        pityCounters: { ...((prog.pityCounters as Record<string, number>) ?? {}), [packCode]: pityCountOut },
        updatedAt: now,
      }).where(eq(progression.playerId, playerId)),
    );

    let results: any;
    try {
      results = await db.batch(stmts as any);
    } catch (e: any) {
      // Hard error (e.g. UNIQUE(serial) collision backstop) => retry with fresh state.
      if (attempt === MAX_RETRIES - 1) throw e;
      continue;
    }

    // --- Verify every guarded statement actually touched a row ---
    const nPrints = printOrder.length;
    const printResults = results.slice(0, nPrints);
    const walletResult = results[nPrints];
    const printsOk = printResults.every((r: any) => Array.isArray(r) && r.length === 1);
    const walletOk = Array.isArray(walletResult) && walletResult.length === 1;

    if (printsOk && walletOk) {
      const committed = walletResult[0];
      return NextResponse.json({
        cards: cards.map((c) => ({ ...c, serial: serials[c.id], isNew: true })),
        wallet: { tickets: committed.tickets, gems: committed.gems },
        pityCount: pityCountOut,
        newCardIds: [],
      });
    }
    // A guard lost the race (e.g. another pull took the last serial) => retry.
  }

  return NextResponse.json(
    { error: "Pull could not be completed due to concurrent activity. Please retry." },
    { status: 409 },
  );
}
