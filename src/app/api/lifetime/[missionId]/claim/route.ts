import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wallets, progression, tradeOffers } from "@/db/schema";
import { cardInstances } from "@/db/footballSchema";
import { LIFETIME_MISSIONS } from "@/lib/gameConfig";

const COOKIE_NAME = "idolbias_player_id";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await params;
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const def = LIFETIME_MISSIONS.find((m) => m.id === missionId);
  if (!def) return NextResponse.json({ error: "Unknown mission" }, { status: 400 });

  const db = getDb();
  const [prog] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);
  if (!prog) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  let currentValue: number;
  switch (missionId) {
    case "collect_cards": {
      const rows = await db.select().from(cardInstances).where(eq(cardInstances.ownerId, playerId));
      currentValue = rows.length;
      break;
    }
    case "collect_legendary": {
      const rows = await db.select().from(cardInstances).where(and(
        eq(cardInstances.ownerId, playerId),
        eq(cardInstances.position, "MIL"),
      ));
      currentValue = rows.length;
      break;
    }
    case "collect_secret": {
      const rows = await db.select().from(cardInstances).where(and(
        eq(cardInstances.ownerId, playerId),
        eq(cardInstances.position, "ATT"),
      ));
      currentValue = rows.length;
      break;
    }
    case "login_dedication":
      currentValue = prog.totalLogins ?? 0;
      break;
    case "streak_record":
      currentValue = prog.streak ?? 0;
      break;
    case "packs_opened":
      currentValue = (prog.missionProgress as any)?.["open_pack"] ?? 0;
      break;
    case "craft_master":
      currentValue = (prog.missionProgress as any)?.["craft_card"] ?? 0;
      break;
    case "disenchant_veteran":
      currentValue = (prog.missionProgress as any)?.["disenchant_card"] ?? 0;
      break;
    case "trades_completed": {
      const rows = await db.select().from(tradeOffers)
        .where(and(eq(tradeOffers.offererId, playerId), eq(tradeOffers.status, "completed")));
      currentValue = rows.length;
      break;
    }
    default:
      currentValue = 0;
  }

  const claimed = prog.lifetimeClaimed;
  const unclaimedIdx = def.tiers.findIndex((_, i) => {
    const key = `${missionId}_${i}`;
    return !claimed.includes(key);
  });

  if (unclaimedIdx === -1) return NextResponse.json({ error: "All tiers already claimed" }, { status: 400 });

  const tier = def.tiers[unclaimedIdx];
  if (currentValue < tier.threshold)
    return NextResponse.json({ error: `Requires ${tier.threshold}, have ${currentValue}` }, { status: 400 });

  const key = `${missionId}_${unclaimedIdx}`;
  const now = new Date();
  const reward = tier.reward;
  const ticketAdd = reward.tickets ?? 0;
  const gemAdd = reward.gems ?? 0;
  const dustAdd = reward.dust ?? 0;

  await db.batch([
    db.update(wallets).set({
      tickets: sql`tickets + ${ticketAdd}`,
      gems: sql`gems + ${gemAdd}`,
      dust: sql`dust + ${dustAdd}`,
      updatedAt: now,
    }).where(eq(wallets.playerId, playerId)),
    db.update(progression).set({
      lifetimeClaimed: [...claimed, key],
      updatedAt: now,
    }).where(eq(progression.playerId, playerId)),
  ]);

  const [wallet] = await db.select().from(wallets).where(eq(wallets.playerId, playerId)).limit(1);
  const nextTier = unclaimedIdx + 1 < def.tiers.length ? def.tiers[unclaimedIdx + 1] : null;

  return NextResponse.json({
    tierIndex: unclaimedIdx,
    reward,
    nextThreshold: nextTier?.threshold ?? null,
    wallet: { tickets: wallet.tickets, gems: wallet.gems, dust: wallet.dust },
  });
}
