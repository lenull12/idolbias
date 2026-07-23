"use client";

import type { ServerCard } from "./gachaEngine";

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

export async function openPack(packCode: string, paymentMethod?: "tickets" | "gems", pullCount: 1 | 5 = 1): Promise<OpenPackResult> {
  return post<OpenPackResult>("/api/pack/open", { packCode, paymentMethod, pullCount });
}
