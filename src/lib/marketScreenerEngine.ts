import CARDS, { rarityFromReference } from "@/data/cards";
import { getDb } from "@/db/client";
import { priceCheckpoints } from "@/db/schema";
import type { CardGrade } from "@/db/schema";
import { getCardBaseValue } from "./valueConfig";
import { sql } from "drizzle-orm";
import { GRADE_ORDER } from "./gradeConfig";

const CACHE_TTL_MS = 15 * 60 * 1000;
let cachedAt = 0;
let cachedCheckpoints: any[] | null = null;
let cachedGrade: string | undefined;

export type ScreenerRow = {
  cardId: string;
  reference: string;
  grade: string;
  group: string;
  idol: string;
  pack: string;
  rarity: string;
  currentPrice: number;
  pct24h: number;
  sparkline: number[];
};

function pct24hFromHistory(historyArr: { hour: number; mult: number }[]): number {
  if (historyArr.length < 2) return 0;
  const current = historyArr[historyArr.length - 1];
  const target = current.hour - 24;
  let closest = historyArr[0];
  for (const p of historyArr) {
    if (Math.abs(p.hour - target) < Math.abs(closest.hour - target)) closest = p;
  }
  if (closest.mult <= 0) return 0;
  return Math.round(((current.mult - closest.mult) / closest.mult) * 1000) / 10;
}

async function fetchAllCheckpoints() {
  const db = getDb();
  return db.select().from(priceCheckpoints);
}

export async function getMarketScreener(grade: CardGrade = "standard"): Promise<ScreenerRow[]> {
  const now = Date.now();

  if (cachedCheckpoints && cachedGrade === grade && now - cachedAt < CACHE_TTL_MS) {
    return buildScreener(cachedCheckpoints, grade);
  }

  let all = await fetchAllCheckpoints();

  // Seed missing grade checkpoints for all cards — one-shot per cache expiry
  const currentHour = Math.floor(now / 3600_000);
  const existingKeys = new Set(all.map((cp: any) => cp.cardId + ":" + cp.grade));
  const missing: Array<{ cardId: string; grade: string }> = [];

  for (const card of CARDS) {
    for (const g of GRADE_ORDER) {
      if (!existingKeys.has(card.id + ":" + g)) {
        missing.push({ cardId: card.id, grade: g });
      }
    }
  }

  if (missing.length > 0) {
    const db = getDb();
    const startHour = currentHour - 24;
    const BATCH_SIZE = 50;

    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (m) => {
        const historyArr: { hour: number; mult: number }[] = [];
        let mult = 0.8 + Math.random() * 0.4;

        for (let h = 0; h <= 24; h++) {
          if (h > 0) {
            mult = mult * (0.97 + Math.random() * 0.06);
            mult = Math.max(0.1, Math.min(3, mult));
          }
          historyArr.push({ hour: startHour + h, mult: Math.round(mult * 1000) / 1000 });
        }

        const finalMult = historyArr[historyArr.length - 1].mult;
        const history = JSON.stringify(historyArr);
        await db.run(sql`INSERT OR IGNORE INTO price_checkpoints (card_id, grade, last_hour, vol_multiplier, history) VALUES (${m.cardId}, ${m.grade}, ${currentHour}, ${finalMult}, ${history})`);
      }));
    }

    all = await fetchAllCheckpoints();
  }

  cachedCheckpoints = all;
  cachedGrade = grade;
  cachedAt = now;

  return buildScreener(all, grade);
}

function buildScreener(allCheckpoints: any[], grade: CardGrade): ScreenerRow[] {
  const cpMap = new Map<string, any>();
  for (const cp of allCheckpoints) {
    cpMap.set(cp.cardId + ":" + cp.grade, cp);
  }

  return CARDS.map((card) => {
    const key = card.id + ":" + grade;
    const cp = cpMap.get(key);
    const baseValue = getCardBaseValue(card.id, grade);

    let currentPrice: number;
    let pct24h = 0;
    let sparkline: number[] = [];

    if (cp) {
      currentPrice = Math.round(baseValue * cp.volMultiplier);
      const historyArr: { hour: number; mult: number }[] = JSON.parse(cp.history);
      sparkline = historyArr.slice(-24).map((h) => Math.round(baseValue * h.mult));
      pct24h = pct24hFromHistory(historyArr);
    } else {
      currentPrice = baseValue;
    }

    return {
      cardId: card.id,
      reference: card.reference,
      grade,
      group: card.group,
      idol: card.idol,
      pack: card.pack,
      rarity: rarityFromReference(card.reference),
      currentPrice,
      pct24h,
      sparkline,
    };
  });
}

export async function getTopMovers(limit = 3, grade: CardGrade = "standard") {
  const screener = await getMarketScreener(grade);
  const sorted = [...screener].sort((a, b) => b.pct24h - a.pct24h);
  return {
    gainers: sorted.slice(0, limit),
    losers: sorted.slice(-limit).reverse(),
  };
}

export async function getAllPrices(): Promise<Record<string, number>> {
  const allCheckpoints = await fetchAllCheckpoints();
  const map: Record<string, number> = {};
  for (const cp of allCheckpoints) {
    const card = CARDS.find((c) => c.id === cp.cardId);
    if (!card) continue;
    const baseValue = getCardBaseValue(cp.cardId, cp.grade as CardGrade);
    map[cp.cardId + ":" + cp.grade] = Math.round(baseValue * cp.volMultiplier);
  }
  return map;
}
