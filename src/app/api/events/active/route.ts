import { NextResponse } from "next/server";
import { eq, and, lte, gte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { events } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const now = new Date();

  const active = await db.select().from(events)
    .where(and(
      eq(events.type, "collection"),
      lte(events.startsAt, now),
      gte(events.endsAt, now),
    ))
    .orderBy(events.endsAt)
    .limit(1);

  const rateUpEvents = await db.select().from(events)
    .where(and(
      eq(events.type, "rate_up"),
      lte(events.startsAt, now),
      gte(events.endsAt, now),
    ))
    .orderBy(events.endsAt);

  const hybrids = await db.select().from(events)
    .where(and(
      eq(events.type, "hybrid"),
      lte(events.startsAt, now),
      gte(events.endsAt, now),
    ))
    .orderBy(events.endsAt);

  return NextResponse.json({
    collection: active[0] ?? null,
    rateUps: rateUpEvents,
    hybrids: hybrids,
  });
}
