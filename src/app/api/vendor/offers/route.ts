import { NextResponse } from "next/server";
import { getTodayVendorOffers } from "@/lib/vendorEngine";

export async function GET() {
  const offers = await getTodayVendorOffers();
  return NextResponse.json({
    offers: offers.map((o) => ({
      id: o.id,
      cardId: o.cardId,
      grade: o.grade,
      priceGems: o.priceGems,
      claimed: o.claimedByPlayerId !== null,
    })),
  });
}
