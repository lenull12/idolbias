import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json() as { name?: string; email?: string; message?: string };

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const env =
      typeof process !== "undefined" && process.env.RESEND_API_KEY
        ? process.env
        : (await import("@opennextjs/cloudflare")).getCloudflareContext().env as unknown as Record<string, string>;

    const { Resend } = await import("resend");
    const resend = new Resend(env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "IdolBias Contact <noreply@idolbias.com>",
      to: "help@idolbias.com",
      replyTo: email,
      subject: `[Contact] ${name} — ${email}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (error) {
      console.error("Contact email error:", error);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
