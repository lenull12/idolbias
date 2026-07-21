import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { priceCheckpoints, marketSales } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getCardById, rarityFromReference } from "@/data/cards";
import { getCardBaseValue } from "@/lib/valueConfig";
import type { CardGrade } from "@/db/schema";
import {
  MAX_VOL_MULTIPLIER,
  MEAN_REVERSION_RATE,
  CLUSTER_SENSITIVITY,
  SALE_INFLUENCE_FACTOR,
  MAX_REPLAY_TICKS,
  VOLATILITY_BY_RARITY,
} from "@/lib/priceConfig";

function currentHour(): number {
  return Math.floor(Date.now() / 3600_000);
}

function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function boxMuller(rng: () => number): number {
  const u1 = 1 - rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function computeTick(
  volumeBump: number,
  volatility: number,
  rng: () => number,
  previousMultiplier: number,
): number {
  const noise = boxMuller(rng) * volatility * 0.1;
  const reversion = (1 - previousMultiplier) * MEAN_REVERSION_RATE;
  const cluster = ((rng() - 0.5) * 2) * CLUSTER_SENSITIVITY * 0.05;
  let multiplier = previousMultiplier * (1 + noise + reversion + cluster) + volumeBump * SALE_INFLUENCE_FACTOR;
  multiplier = Math.max(0.1, Math.min(MAX_VOL_MULTIPLIER, multiplier));
  if (rng() < 0.001) multiplier *= 0.5;
  return multiplier;
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.get("x-cron-secret") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const now = currentHour();

  const all = await db.select().from(priceCheckpoints);

  const saleCounts = await db
    .select({
      cardId: marketSales.cardId,
      grade: marketSales.grade,
      n: sql<number>`count(*)`,
    })
    .from(marketSales)
    .where(gte(marketSales.soldAt, new Date((now - 1) * 3600_000)))
    .groupBy(marketSales.cardId, marketSales.grade);

  const saleMap = new Map<string, number>();
  for (const s of saleCounts) {
    saleMap.set(s.cardId + ":" + s.grade, s.n);
  }

  let updated = 0;
  let skipped = 0;

  const SALT = process.env.PRICE_ENGINE_SALT ?? "dev-salt-do-not-use-in-prod";

  for (const cp of all) {
    if (cp.lastHour >= now) {
      skipped++;
      continue;
    }

    const card = getCardById(cp.cardId);
    if (!card) continue;

    const rarity = rarityFromReference(card.reference);
    const baseValue = getCardBaseValue(cp.cardId, cp.grade as CardGrade);
    const volatility = VOLATILITY_BY_RARITY[rarity] ?? 0.3;
    const rng = seededRandom(fnv1a(cp.cardId + cp.grade + SALT));
    const volumeBump = Math.min(1, (saleMap.get(cp.cardId + ":" + cp.grade) ?? 0) * 0.1);

    const hoursGap = Math.min(now - cp.lastHour, MAX_REPLAY_TICKS);
    let currentMult = cp.volMultiplier;

    for (let h = 0; h < hoursGap; h++) {
      currentMult = computeTick(volumeBump, volatility, rng, currentMult);
    }

    const historyArr: { hour: number; mult: number }[] = JSON.parse(cp.history);
    historyArr.push({ hour: now, mult: currentMult });
    while (historyArr.length > MAX_REPLAY_TICKS) historyArr.shift();

    await db.update(priceCheckpoints)
      .set({ lastHour: now, volMultiplier: currentMult, history: JSON.stringify(historyArr) })
      .where(eq(priceCheckpoints.id, cp.id));

    updated++;
  }

  return NextResponse.json({ ok: true, updated, skipped, hour: now });
}
