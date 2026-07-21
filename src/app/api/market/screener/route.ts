import { NextResponse } from "next/server";
import type { CardGrade } from "@/db/schema";
import { getMarketScreener, getTopMovers, getAllPrices } from "@/lib/marketScreenerEngine";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const grade = searchParams.get("grade") ?? "standard";

  if (grade === "all") {
    const prices = await getAllPrices();
    return NextResponse.json({ prices, grade: "all" });
  }

  const [screener, movers] = await Promise.all([
    getMarketScreener(grade as CardGrade),
    getTopMovers(3, grade as CardGrade),
  ]);

  return NextResponse.json({ screener, movers, grade });
}
