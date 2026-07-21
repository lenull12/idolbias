"use client";

import type { ServerCard } from "./gachaEngine";
import type { Rarity } from "@/components/CardEffects";

export type ClaimDailyResult = {
  tickets: number;
  gems: number;
  streak: number;
  wallet: { tickets: number; gems: number };
};

export type OpenPackResult = {
  cards: ServerCard[];
  wallet: { tickets: number; gems: number };
  pityCount: number;
  newCardIds: string[];
};

export type TradeOffer = {
  id: number;
  offererId: string;
  offeredCardId: string;
  requestedCardId: string;
  status: string;
  createdAt: string;
};

export type ClaimMissionResult = {
  reward: { tickets?: number; gems?: number; dust?: number };
  wallet: { tickets: number; gems: number; dust: number };
};

export type ClaimLifetimeResult = {
  tierIndex: number;
  reward: { tickets?: number; gems?: number };
  nextThreshold: number | null;
  wallet: { tickets: number; gems: number; dust: number };
};

type ApiError = { error: string };

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  const json: unknown = await res.json();
  if (!res.ok) {
    const err = json as ApiError;
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return json as T;
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json: unknown = await res.json();
  if (!res.ok) throw new Error((json as ApiError).error ?? `HTTP ${res.status}`);
  return json as T;
}

export async function claimDailyReward(): Promise<ClaimDailyResult> {
  return post<ClaimDailyResult>("/api/daily/claim");
}

export async function bumpMissionProgress(missionId: string): Promise<{ progress: number }> {
  return post<{ progress: number }>(`/api/missions/${missionId}/progress`);
}

export async function claimMissionReward(missionId: string): Promise<ClaimMissionResult> {
  return post<ClaimMissionResult>(`/api/missions/${missionId}/claim`);
}

export async function bumpWeeklyMissionProgress(missionId: string): Promise<{ progress: number }> {
  return post<{ progress: number }>(`/api/missions/weekly/${missionId}/progress`);
}

export async function claimWeeklyMissionReward(missionId: string): Promise<ClaimMissionResult> {
  return post<ClaimMissionResult>(`/api/missions/weekly/${missionId}/claim`);
}

export async function claimLifetimeTier(missionId: string): Promise<ClaimLifetimeResult> {
  return post<ClaimLifetimeResult>(`/api/lifetime/${missionId}/claim`);
}

export async function openPack(packCode: string, bias?: string | null, paymentMethod?: "tickets" | "gems", pullCount: 1 | 10 = 1): Promise<OpenPackResult> {
  return post<OpenPackResult>("/api/pack/open", { packCode, bias, paymentMethod, pullCount });
}

export async function disenchantCard(cardId: string, quantity = 1, grade?: string): Promise<{
  quantityDisenchanted: number; dustGained: number; wallet: { tickets: number; gems: number; dust: number };
}> {
  return post("/api/cards/disenchant", { cardId, grade: grade ?? "standard", quantity });
}

export async function instantSellCard(cardId: string, grade: string, quantity: number): Promise<{
  ok: true; payout: number;
}> {
  return post("/api/cards/instant-sell", { cardId, grade, quantity });
}

export async function createTradeOffer(offeredCardId: string, requestedCardId: string): Promise<{ ok: true }> {
  return post("/api/trade", { offeredCardId, requestedCardId });
}

export async function acceptTradeOffer(tradeId: number): Promise<{ ok: true }> {
  return post(`/api/trade/${tradeId}/accept`);
}

export async function cancelTradeOffer(tradeId: number): Promise<{ ok: true }> {
  return post(`/api/trade/${tradeId}/cancel`);
}

export async function listTradeOffers(): Promise<{ offers: TradeOffer[]; myOffers: TradeOffer[] }> {
  return get("/api/trade");
}

export async function changeBias(idol: string): Promise<{ bias: string; biasChangedAt: string; cooldownDays: number }> {
  return post("/api/player/bias", { idol });
}

export async function craftCard(rarity: Rarity): Promise<{
  card: { id: string; idol: string; group: string; pack: string; edition: string; reference: string; imageSrc: string };
  dustSpent: number;
  wallet: { tickets: number; gems: number; dust: number };
}> {
  return post("/api/cards/craft", { rarity });
}
