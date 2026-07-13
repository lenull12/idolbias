export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type Stripe from "stripe";
import { getDb } from "@/db/client";
import { gemPurchases } from "@/db/schema";
import { getGemPackage } from "@/lib/gemShop";

const COOKIE_NAME = "idolbias_player_id";

function getStripeEnv() {
  try {
    const { env } = require("@opennextjs/cloudflare").getCloudflareContext() as { env: Record<string, string> };
    return env;
  } catch {
    // Fallback for environments where getCloudflareContext is unavailable
    return process.env as Record<string, string>;
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(COOKIE_NAME)?.value;
  if (!playerId) return NextResponse.json({ error: "No player" }, { status: 401 });

  const body = await request.json();
  if (body.waiverConfirmed !== true) {
    return NextResponse.json(
      { error: "You must confirm the waiver of your right of withdrawal." },
      { status: 400, headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  }
  const pkg = getGemPackage(body.packageId);
  if (!pkg) {
    return NextResponse.json({ error: "Invalid package" }, { status: 400 });
  }

  const env = getStripeEnv();
  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("Missing STRIPE_SECRET_KEY");
    return NextResponse.json({ error: "Server config" }, { status: 500 });
  }

  try {
    const { default: StripeLib } = await import("stripe") as { default: typeof Stripe };
    const stripe = new StripeLib(secretKey, {
      httpClient: StripeLib.createFetchHttpClient(),
      apiVersion: "2026-06-24.dahlia",
    });

    const origin = request.headers.get("origin") ?? "http://localhost:8787";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: pkg.priceId, quantity: 1 }],
      success_url: `${origin}/?purchase=success`,
      cancel_url: `${origin}/?purchase=cancelled`,
      client_reference_id: playerId,
      metadata: {
        playerId,
        packageId: pkg.id,
        gems: String(pkg.gems),
      },
    });

    const db = getDb();
    await db.insert(gemPurchases).values({
      id: crypto.randomUUID(),
      playerId,
      stripeSessionId: session.id,
      packageId: pkg.id,
      gemsCredited: pkg.gems,
      amountPaid: pkg.amountEur,
      currency: "eur",
      status: "pending",
      createdAt: new Date(),
      waiverConfirmedAt: new Date(),
    });

    return NextResponse.json(
      { url: session.url },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
