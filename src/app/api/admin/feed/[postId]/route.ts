import { NextResponse } from "next/server";

export async function DELETE() {
  return NextResponse.json({ error: "Feed feature removed" }, { status: 410 });
}
