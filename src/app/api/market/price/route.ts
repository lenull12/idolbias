import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentPriceWithHistory } from "@/lib/priceEngine";
import type { CardGrade } from "@/db/schema";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId");
  const grade = searchParams.get("grade");
  if (!cardId || !grade)
    return NextResponse.json({ error: "Missing cardId or grade" }, { status: 400 });

  const data = await getCurrentPriceWithHistory(cardId, grade as CardGrade);
  return NextResponse.json(data);
}
