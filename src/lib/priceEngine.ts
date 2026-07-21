import { eq, and, sql, gte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { marketSales, priceCheckpoints } from "@/db/schema";
import type { CardGrade } from "@/db/schema";
import { getCardById, rarityFromReference } from "@/data/cards";
import { getCardBaseValue } from "./valueConfig";
import {
  MAX_VOL_MULTIPLIER, MEAN_REVERSION_RATE, CLUSTER_SENSITIVITY,
  SALE_INFLUENCE_FACTOR, MAX_REPLAY_TICKS, VOLATILITY_BY_RARITY,
} from "./priceConfig";

const SALT = process.env.PRICE_ENGINE_SALT ?? "dev-salt-do-not-use-in-prod";

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

function currentHour(): number {
  return Math.floor(Date.now() / 3600_000);
}

function computeTick(
  baseValue: number, volatility: number, rng: () => number,
  meanReversion: number, clusterSensitivity: number,
  volumeBump: number, previousMultiplier: number,
): number {
  const noise = boxMuller(rng) * volatility * 0.1;
  const reversion = (1 - previousMultiplier) * meanReversion;
  const cluster = ((rng() - 0.5) * 2) * clusterSensitivity * 0.05;
  let multiplier = previousMultiplier * (1 + noise + reversion + cluster) + volumeBump * SALE_INFLUENCE_FACTOR;
  multiplier = Math.max(0.1, Math.min(MAX_VOL_MULTIPLIER, multiplier));
  if (rng() < 0.001) multiplier *= 0.5;
  return multiplier;
}

export async function ensurePriceUpToDate(cardId: string, grade: CardGrade) {
  const db = getDb();
  const now = currentHour();
  const card = getCardById(cardId);
  if (!card) return null;
  const rarity = rarityFromReference(card.reference);
  const baseValue = getCardBaseValue(cardId, grade);
  const volatility = VOLATILITY_BY_RARITY[rarity] ?? 0.3;

  let [cp] = await db.select().from(priceCheckpoints)
    .where(and(eq(priceCheckpoints.cardId, cardId), eq(priceCheckpoints.grade, grade)));

  const rng = seededRandom(fnv1a(cardId + grade + SALT));

  if (!cp) {
    const initMult = 0.8 + rng() * 0.4;
    const history = JSON.stringify([{ hour: now, mult: initMult }]);
    await db.run(sql`INSERT OR IGNORE INTO price_checkpoints (card_id, grade, last_hour, vol_multiplier, history) VALUES (${cardId}, ${grade}, ${now}, ${initMult}, ${history})`);
    [cp] = await db.select().from(priceCheckpoints)
      .where(and(eq(priceCheckpoints.cardId, cardId), eq(priceCheckpoints.grade, grade)));
  }

  const hoursGap = Math.max(0, Math.min(now - cp.lastHour, MAX_REPLAY_TICKS));
  if (hoursGap === 0) return cp;

  // Replay ticks
  let currentMult = cp.volMultiplier;
  const historyArr: { hour: number; mult: number }[] = JSON.parse(cp.history);

  // Sales volume since last checkpoint — one query, not per tick
  const [saleCount] = await db.select({ n: sql<number>`count(*)` })
    .from(marketSales)
    .where(and(
      eq(marketSales.cardId, cardId),
      eq(marketSales.grade, grade),
      gte(marketSales.soldAt, new Date(cp.lastHour * 3600_000)),
    ));
  const volumeBump = Math.min(1, saleCount.n * 0.1);

  for (let h = 0; h < hoursGap; h++) {
    currentMult = computeTick(
      baseValue, volatility, rng,
      MEAN_REVERSION_RATE, CLUSTER_SENSITIVITY,
      volumeBump, currentMult,
    );
  }

  historyArr.push({ hour: now, mult: currentMult });
  while (historyArr.length > MAX_REPLAY_TICKS) historyArr.shift();

  await db.update(priceCheckpoints)
    .set({ lastHour: now, volMultiplier: currentMult, history: JSON.stringify(historyArr) })
    .where(eq(priceCheckpoints.id, cp.id));

  return { ...cp, volMultiplier: currentMult, lastHour: now, history: JSON.stringify(historyArr) };
}

export async function getCurrentPriceWithHistory(cardId: string, grade: CardGrade): Promise<{
  suggestedPrice: number;
  baseValue: number;
  volMultiplier: number;
  recentSales: { priceGems: number; soldAt: Date }[];
}> {
  const db = getDb();
  const now = currentHour();
  const baseValue = getCardBaseValue(cardId, grade);

  const sales = await db.select({ priceGems: marketSales.priceGems, soldAt: marketSales.soldAt })
    .from(marketSales)
    .where(eq(marketSales.cardId, cardId))
    .orderBy(marketSales.soldAt);

  const recentSales = sales.slice(-20);

  const cp = await ensurePriceUpToDate(cardId, grade);
  const volMultiplier = cp?.volMultiplier ?? 1;
  const suggestedPrice = Math.round(baseValue * volMultiplier);

  return { suggestedPrice, baseValue, volMultiplier, recentSales };
}

export async function getPriceHistorySeries(
  cardId: string, grade: CardGrade, hours: number,
): Promise<{ hour: number; price: number }[]> {
  const baseValue = getCardBaseValue(cardId, grade);
  const cp = await ensurePriceUpToDate(cardId, grade);
  if (!cp) return [];
  const historyArr: { hour: number; mult: number }[] = JSON.parse(cp.history);
  const slice = historyArr.slice(-hours);
  return slice.map((h) => ({ hour: h.hour, price: Math.round(baseValue * h.mult) }));
}
