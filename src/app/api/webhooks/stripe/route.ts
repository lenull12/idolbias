import { NextResponse } from "next/server";
import { eq, ne, and, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb } from "@/db/client";
import { gemPurchases, wallets } from "@/db/schema";

function getStripeEnv() {
  try {
    const { env } = require("@opennextjs/cloudflare").getCloudflareContext() as { env: Record<string, string> };
    return env;
  } catch {
    return process.env as Record<string, string>;
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const env = getStripeEnv();
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  const secretKey = env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !secretKey) {
    console.error("Missing STRIPE secrets");
    return NextResponse.json({ error: "Server config" }, { status: 500 });
  }

  try {
    const { default: StripeLib } = await import("stripe") as { default: typeof Stripe };
    const stripe = new StripeLib(secretKey, {
      httpClient: StripeLib.createFetchHttpClient(),
      apiVersion: "2026-06-24.dahlia",
    });

    const rawBody = await request.text();
    const event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const sessionId = session.id;

      const db = getDb();

      const existing = await db
        .select()
        .from(gemPurchases)
        .where(eq(gemPurchases.stripeSessionId, sessionId))
        .limit(1);

      if (existing.length === 0) {
        console.error("Unknown session:", sessionId);
        return NextResponse.json({ error: "Unknown session" }, { status: 400 });
      }

      const purchase = existing[0];
      if (purchase.status === "completed") {
        return NextResponse.json({ ok: true });
      }

      const playerId = session.metadata?.playerId;
      const gemsToCredit = parseInt(session.metadata?.gems ?? "0", 10);

      if (!playerId || gemsToCredit <= 0) {
        console.error("Invalid metadata:", session.metadata);
        return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
      }

      // Atomic: only mark completed if not already completed (prevents double-credit on webhook retry)
      const updated = await db.update(gemPurchases)
        .set({ status: "completed", completedAt: new Date() })
        .where(and(
          eq(gemPurchases.stripeSessionId, sessionId),
          ne(gemPurchases.status, "completed"),
        ))
        .returning({ id: gemPurchases.id });

      if (updated.length === 0) {
        return NextResponse.json({ ok: true });
      }

      await db.update(wallets)
        .set({
          gems: sql`${wallets.gems} + ${gemsToCredit}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.playerId, playerId));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
