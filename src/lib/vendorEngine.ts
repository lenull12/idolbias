import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { vendorOffers } from "@/db/schema";
import type { CardGrade } from "@/db/schema";
import CARDS, { rarityFromReference } from "@/data/cards";
import { getCurrentPriceWithHistory } from "./priceEngine";
import {
  VENDOR_OFFERS_PER_DAY, VENDOR_MIN_RARITY, VENDOR_MIN_GRADE, VENDOR_DISCOUNT_RANGE,
} from "./vendorConfig";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function pickDailyOffers(count: number) {
  const eligible = CARDS.filter((c) => VENDOR_MIN_RARITY.includes(rarityFromReference(c.reference)));
  const offers: { cardId: string; grade: CardGrade; priceGems: number }[] = [];

  for (let i = 0; i < count; i++) {
    const card = eligible[Math.floor(Math.random() * eligible.length)];
    const grade = VENDOR_MIN_GRADE[Math.floor(Math.random() * VENDOR_MIN_GRADE.length)];
    const { suggestedPrice: currentPrice } = await getCurrentPriceWithHistory(card.id, grade);
    const [min, max] = VENDOR_DISCOUNT_RANGE;
    const discount = min + Math.random() * (max - min);
    offers.push({ cardId: card.id, grade, priceGems: Math.max(1, Math.round(currentPrice * discount)) });
  }
  return offers;
}

export async function getTodayVendorOffers() {
  const db = getDb();
  const today = todayStr();
  let rows = await db.select().from(vendorOffers).where(eq(vendorOffers.dateStr, today));

  if (rows.length === 0) {
    const generated = await pickDailyOffers(VENDOR_OFFERS_PER_DAY);
    for (let i = 0; i < generated.length; i++) {
      await db.insert(vendorOffers)
        .values({ dateStr: today, slotIndex: i, ...generated[i] })
        .onConflictDoNothing();
    }
    rows = await db.select().from(vendorOffers).where(eq(vendorOffers.dateStr, today));
  }

  return rows;
}
