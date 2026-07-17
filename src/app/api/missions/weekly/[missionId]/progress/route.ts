import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Mission progress is now server-side only" }, { status: 403 });
}
