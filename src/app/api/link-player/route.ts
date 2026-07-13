export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { players, wallets, progression } from "@/db/schema";
import { getPlayerIdFromRequest } from "@/lib/playerId";
import { getAuth } from "@/lib/auth";

const COOKIE_NAME = "idolbias_player_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

export async function POST(request: Request) {
  try {
    // 1. Get Better Auth session
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.email) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
    }

    // 2. Get current anonymous player ID
    const currentPlayerId = getPlayerIdFromRequest(request);
    if (!currentPlayerId) {
      return NextResponse.json({ error: "no player id" }, { status: 400 });
    }

    const db = getDb();
    const email = session.user.email;

    // 3. Look for existing player with this email
    const [existing] = await db
      .select()
      .from(players)
      .where(eq(players.email, email))
      .limit(1);

    let resolvedPlayerId: string;
    let switched = false;

    if (!existing) {
      // Guard: refuse if current player already linked to another email (logout required)
      const [current] = await db
        .select()
        .from(players)
        .where(eq(players.id, currentPlayerId))
        .limit(1);
      if (current?.email && current.email !== email) {
        return NextResponse.json({ error: "already linked to another account, log out first" }, { status: 409 });
      }

      // Case (a): first time — link email to current player
      await db
        .update(players)
        .set({ email })
        .where(eq(players.id, currentPlayerId));
      resolvedPlayerId = currentPlayerId;
    } else if (existing.id === currentPlayerId) {
      // Case (b): already linked — no-op
      resolvedPlayerId = currentPlayerId;
    } else {
      // Case (c): account already linked elsewhere — switch player ID
      resolvedPlayerId = existing.id;
      switched = true;
    }

    // 4. Set cookie to resolved player ID
    const res = NextResponse.json({
      playerId: resolvedPlayerId,
      linked: true,
      switched,
    });
    res.cookies.set(COOKIE_NAME, resolvedPlayerId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("Link player error:", err);
    return NextResponse.json({ error: "link failed" }, { status: 500 });
  }
}
