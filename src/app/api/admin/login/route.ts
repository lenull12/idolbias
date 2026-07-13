import { NextResponse } from "next/server";

// For MVP: hardcoded fallback. Set ADMIN_SECRET env var in production.
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "idolbias2026";
const COOKIE_NAME = "idolbias_admin";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "authenticated", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });
  return res;
}
