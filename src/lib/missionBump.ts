import { eq, and, gte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { progression, feedLikes, feedComments } from "@/db/schema";

function todayStart(): Date {
  const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d;
}
function weekStart(): Date {
  const d = todayStart();
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d;
}

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

export async function syncLikeMissionProgress(playerId: string) {
  const db = getDb();
  const [daily, weekly] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(feedLikes)
      .where(and(eq(feedLikes.userId, playerId), gte(feedLikes.createdAt, todayStart()))),
    db.select({ count: sql<number>`count(*)` }).from(feedLikes)
      .where(and(eq(feedLikes.userId, playerId), gte(feedLikes.createdAt, weekStart()))),
  ]);

  await db.update(progression)
    .set({
      missionProgress: sql`json_set(
        json_set(${progression.missionProgress}, '$."like_posts"', ${daily[0].count}),
        '$."like_10_posts"', ${daily[0].count}
      )`,
    })
    .where(eq(progression.playerId, playerId));

  return { daily: daily[0].count, weekly: weekly[0].count };
}

export async function syncCommentMissionProgress(playerId: string) {
  const db = getDb();
  const [daily, weekly] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(feedComments)
      .where(and(eq(feedComments.userId, playerId), gte(feedComments.createdAt, todayStart()))),
    db.select({ count: sql<number>`count(*)` }).from(feedComments)
      .where(and(eq(feedComments.userId, playerId), gte(feedComments.createdAt, weekStart()))),
  ]);

  await db.update(progression)
    .set({
      missionProgress: sql`json_set(
        json_set(${progression.missionProgress}, '$."comment_posts"', ${daily[0].count}),
        '$."comment_10_posts"', ${daily[0].count}
      )`,
    })
    .where(eq(progression.playerId, playerId));

  return { daily: daily[0].count, weekly: weekly[0].count };
}
