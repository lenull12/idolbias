export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { players, wallets, progression, ownedCards, tradeOffers, feedPosts, feedLikes, feedComments, feedSubscriptions, cosmoPosts, cosmoReplies, cosmoFeaturedResponses, gemPurchases, setCompletions, eventParticipation, user, session, account, verification } from "@/db/schema";
import { getAuth } from "@/lib/auth";

export async function DELETE() {
  try {
    const auth = await getAuth();
    const headers = new Headers();
    // Forward all cookies from the request context
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) headers.set("cookie", cookieHeader);

    const sessionData = await auth.api.getSession({ headers });
    if (!sessionData?.user?.id) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
    }

    const userId = sessionData.user.id;
    const db = getDb();

    // Find player linked to this user via email
    const email = sessionData.user.email;
    const [player] = email
      ? await db.select().from(players).where(eq(players.email, email)).limit(1)
      : [];

    const playerId = player?.id;

    // Wipe player data FIRST (if this fails, OAuth session remains intact → user can retry)
    if (playerId) {
      await db.delete(setCompletions).where(eq(setCompletions.playerId, playerId));
      await db.delete(eventParticipation).where(eq(eventParticipation.playerId, playerId));
      await db.delete(feedSubscriptions).where(eq(feedSubscriptions.playerId, playerId));
      await db.delete(tradeOffers).where(eq(tradeOffers.offererId, playerId));
      await db.delete(tradeOffers).where(eq(tradeOffers.resolvedBy, playerId));
      await db.delete(ownedCards).where(eq(ownedCards.playerId, playerId));
      await db.delete(gemPurchases).where(eq(gemPurchases.playerId, playerId));
      await db.delete(wallets).where(eq(wallets.playerId, playerId));
      await db.delete(progression).where(eq(progression.playerId, playerId));
      await db.delete(players).where(eq(players.id, playerId));
    }

    // Wipe auth tables SECOND (only if player data deletion succeeded)
    await db.delete(session).where(eq(session.userId, userId));
    await db.delete(account).where(eq(account.userId, userId));
    await db.delete(verification).where(eq(verification.identifier, email ?? ""));
    await db.delete(user).where(eq(user.id, userId));

    const res = NextResponse.json({ deleted: true });
    res.cookies.set("idolbias_player_id", "", { maxAge: 0, path: "/" });
    return res;
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
