import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { marketListings, marketSales } from "@/db/schema";
import { MARKET_PRICE_HISTORY_LIMIT } from "@/lib/marketConfig";

export async function GET(req: Request) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId");
  const grade = searchParams.get("grade");

  const listingConditions: any[] = [eq(marketListings.status, "open")];
  if (cardId) listingConditions.push(eq(marketListings.cardId, cardId));
  if (grade) listingConditions.push(eq(marketListings.grade, grade));

  const listings = await db.select().from(marketListings)
    .where(and(...listingConditions))
    .orderBy(marketListings.priceGems);

  let priceHistory: { priceGems: number; soldAt: Date }[] = [];
  if (cardId) {
    const saleConditions: any[] = [eq(marketSales.cardId, cardId)];
    if (grade) saleConditions.push(eq(marketSales.grade, grade));
    priceHistory = await db.select({ priceGems: marketSales.priceGems, soldAt: marketSales.soldAt })
      .from(marketSales)
      .where(and(...saleConditions))
      .orderBy(desc(marketSales.soldAt))
      .limit(MARKET_PRICE_HISTORY_LIMIT);
  }

  return NextResponse.json({ listings, priceHistory });
}
