export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cardInstances, cardPrints, characters } from "@/db/footballSchema";

export async function GET() {
  const pid = (await cookies()).get("idolbias_player_id")?.value;
  if (!pid) return NextResponse.json({ error: "No player" }, { status: 401 });

  const db = getDb();
  const rows = await db
    .select({
      id: cardInstances.id,
      characterId: cardInstances.characterId,
      printId: cardInstances.printId,
      ovr: cardInstances.ovr,
      serial: cardInstances.serial,
      grade: cardInstances.grade,
      group: cardInstances.position,
      position12: cardInstances.position12,
      tecStats: cardInstances.tecStats,
      gkStats: cardInstances.gkStats,
      setPieceStats: cardInstances.setPieceStats,
      phyStats: cardInstances.phyStats,
      menStats: cardInstances.menStats,
      obtainedAt: cardInstances.obtainedAt,
      rarity: cardPrints.rarity,
      refCode: cardPrints.refCode,
      name: characters.name,
      nation: characters.nation,
      photo: characters.photoVariants,
    })
    .from(cardInstances)
    .innerJoin(cardPrints, eq(cardInstances.printId, cardPrints.id))
    .innerJoin(characters, eq(cardPrints.characterId, characters.id))
    .where(eq(cardInstances.ownerId, pid));

  return NextResponse.json({ cards: rows });
}
