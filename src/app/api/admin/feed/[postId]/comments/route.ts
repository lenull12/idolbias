import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Feed feature removed" }, { status: 410 });
}
