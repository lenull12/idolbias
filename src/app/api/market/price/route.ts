import { NextResponse } from "next/server";
import { getCurrentPriceWithHistory, getPriceHistorySeries } from "@/lib/priceEngine";
import type { CardGrade } from "@/db/schema";

const HOURS: Record<string, number> = { "24h": 24, "7d": 168, "30d": 720, "1y": 8760 };

function downsample(series: { hour: number; price: number }[], maxPoints: number) {
  if (series.length <= maxPoints) return series;
  const step = Math.ceil(series.length / maxPoints);
  const result = [];
  for (let i = 0; i < series.length; i += step) {
    result.push(series[i]);
  }
  if (result.length > 0 && result[result.length - 1] !== series[series.length - 1]) {
    result.push(series[series.length - 1]);
  }
  return result;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId");
  const grade = searchParams.get("grade");
  const range = searchParams.get("range") ?? "24h";
  if (!cardId || !grade)
    return NextResponse.json({ error: "Missing cardId or grade" }, { status: 400 });

  const hours = HOURS[range] ?? 24;
  const [data, series] = await Promise.all([
    getCurrentPriceWithHistory(cardId, grade as CardGrade),
    getPriceHistorySeries(cardId, grade as CardGrade, hours),
  ]);

  const maxPoints = hours <= 24 ? hours : hours <= 168 ? 168 : 90;
  return NextResponse.json({
    ...data,
    series: downsample(series, maxPoints),
    range,
  });
}
