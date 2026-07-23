import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { progression } from "@/db/schema";

export async function bumpMissionProgress(playerId: string, actionType: string, amount = 1) {
  const db = getDb();
  await db.update(progression)
    .set({
      missionProgress: sql`json_set(
        ${progression.missionProgress},
        '$."' || ${actionType} || '"',
        COALESCE(json_extract(${progression.missionProgress}, '$."' || ${actionType} || '"'), 0) + ${amount}
      )`,
    })
    .where(eq(progression.playerId, playerId));
}
