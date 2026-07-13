/**
 * Global player ID — set after first /api/player response,
 * then passed explicitly to API routes via header or query param.
 * Avoids reliance on cookies which may not work reliably in Workers.
 */

let _playerId: string | null = null;

export function setPlayerId(id: string) {
  _playerId = id;
}

export function getPlayerId(): string | null {
  return _playerId;
}

/**
 * Read playerId from request: cookie → x-player-id header → _pid query param
 */
export function getPlayerIdFromRequest(request: Request): string | null {
  // 1. Try cookie
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)idolbias_player_id=([^;]+)/);
    if (match) return match[1];
  }

  // 2. Try custom header (set by frontend)
  const headerId = request.headers.get("x-player-id");
  if (headerId) return headerId;

  // 3. Try query param
  const url = new URL(request.url);
  const queryId = url.searchParams.get("_pid");
  if (queryId) return queryId;

  return null;
}
