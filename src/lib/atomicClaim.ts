import { eq, and, sql, gte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wallets, progression } from "@/db/schema";

/**
 * Crédite atomiquement un wallet avec une condition (ex: gte(sold, cost)).
 * Retourne { success, wallet: { tickets, gems, dust } | null }.
 */
export async function atomicCreditWallet(
  playerId: string,
  credits: { tickets?: number; gems?: number; dust?: number },
  condition?: { column: any; min: number },
): Promise<{ success: boolean; wallet: { tickets: number; gems: number; dust: number } | null }> {
  const db = getDb();
  const now = new Date();
  const setData: Record<string, any> = { updatedAt: now };
  if (credits.tickets) setData.tickets = sql`tickets + ${credits.tickets}`;
  if (credits.gems) setData.gems = sql`gems + ${credits.gems}`;
  if (credits.dust) setData.dust = sql`dust + ${credits.dust}`;

  const conditions = [eq(wallets.playerId, playerId)];
  if (condition) conditions.push(gte(condition.column, condition.min));

  const result = await db.update(wallets)
    .set(setData)
    .where(and(...conditions))
    .returning({ tickets: wallets.tickets, gems: wallets.gems, dust: wallets.dust });

  if (result.length === 0) return { success: false, wallet: null };
  return { success: true, wallet: result[0] };
}

type ClaimColumn = typeof progression.missionsClaimed | typeof progression.weeklyMissionsClaimed | typeof progression.lifetimeClaimed;

const CLAIM_COLUMNS: Record<string, ClaimColumn> = {
  missionsClaimed: progression.missionsClaimed,
  weeklyMissionsClaimed: progression.weeklyMissionsClaimed,
  lifetimeClaimed: progression.lifetimeClaimed,
};
const CLAIM_SET_KEY: Record<string, "missionsClaimed" | "weeklyMissionsClaimed" | "lifetimeClaimed"> = {
  missionsClaimed: "missionsClaimed",
  weeklyMissionsClaimed: "weeklyMissionsClaimed",
  lifetimeClaimed: "lifetimeClaimed",
};

/**
 * Marque atomiquement une mission comme claimée (JSON array append + NOT EXISTS guard).
 * Retourne { success, progression } — success = false si déjà claimée.
 */
export async function atomicClaimMission(
  playerId: string,
  missionId: string,
  targetColumn: "missionsClaimed" | "weeklyMissionsClaimed" | "lifetimeClaimed",
): Promise<{ success: boolean; progression: any }> {
  const db = getDb();
  const column = CLAIM_COLUMNS[targetColumn];
  const setKey = CLAIM_SET_KEY[targetColumn];

  const result = await db.update(progression)
    .set({
      [setKey]: sql`json_set(${column}, '$[#]', ${missionId})`,
      updatedAt: new Date(),
    } as any)
    .where(and(
      eq(progression.playerId, playerId),
      sql`NOT EXISTS (SELECT 1 FROM json_each(${column}) WHERE value = ${missionId})`,
    ))
    .returning({ playerId: progression.playerId });

  if (result.length === 0) return { success: false, progression: null };

  const [prog] = await db.select().from(progression).where(eq(progression.playerId, playerId)).limit(1);
  return { success: true, progression: prog };
}
