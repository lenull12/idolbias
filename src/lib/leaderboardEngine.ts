import { eq, ne, and } from "drizzle-orm";
import { getDb } from "@/db/client";
import { ownedCards, leaderboardMeta, portfolioSnapshots } from "@/db/schema";
import type { CardGrade } from "@/db/schema";
import { getCurrentPriceWithHistory } from "./priceEngine";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function ensureTodayPortfolioSnapshot() {
  const db = getDb();
  const today = todayStr();

  const claimed = await db.update(leaderboardMeta)
    .set({ lastComputedDate: today })
    .where(and(eq(leaderboardMeta.id, 1), ne(leaderboardMeta.lastComputedDate, today)))
    .returning();
  if (claimed.length === 0) return;

  const allOwned = await db.select().from(ownedCards);

  // Déduplication par (cardId, grade) → un seul appel live par combo
  const uniqueCombos = new Map<string, { cardId: string; grade: CardGrade }>();
  for (const row of allOwned) {
    const key = `${row.cardId}:${row.grade}`;
    if (!uniqueCombos.has(key))
      uniqueCombos.set(key, { cardId: row.cardId, grade: row.grade as CardGrade });
  }

  const priceEntries = await Promise.all(
    Array.from(uniqueCombos.entries()).map(async ([key, { cardId, grade }]) => {
      const { suggestedPrice } = await getCurrentPriceWithHistory(cardId, grade);
      return [key, suggestedPrice] as const;
    })
  );
  const priceByCombo = new Map(priceEntries);

  const totals = new Map<string, number>();
  for (const row of allOwned) {
    const price = priceByCombo.get(`${row.cardId}:${row.grade}`) ?? 0;
    totals.set(row.playerId, (totals.get(row.playerId) ?? 0) + price * row.quantity);
  }

  for (const [playerId, portfolioValue] of totals) {
    await db.insert(portfolioSnapshots)
      .values({ dateStr: today, playerId, portfolioValue })
      .onConflictDoUpdate({
        target: [portfolioSnapshots.dateStr, portfolioSnapshots.playerId],
        set: { portfolioValue },
      });
  }
}
