export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

let _handler: { GET: Function; POST: Function } | null = null;

async function getHandler() {
  if (!_handler) {
    const [auth, { toNextJsHandler }] = await Promise.all([
      import("@/lib/auth").then((m) => m.getAuth()),
      import("better-auth/next-js"),
    ]);
    _handler = toNextJsHandler(auth);
  }
  return _handler;
}

export async function GET(request: NextRequest) {
  try {
    const handler = await getHandler();
    return handler.GET(request);
  } catch (err) {
    console.error("Auth GET error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const handler = await getHandler();
    return handler.POST(request);
  } catch (err) {
    console.error("Auth POST error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
