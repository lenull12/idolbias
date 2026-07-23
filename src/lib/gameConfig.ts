import type { Rarity } from "@/components/CardEffects";

export const RARITY_ORDER: Rarity[] = ["common", "rare", "epic", "legendary", "secret"];

export type Reward = {
  tickets?: number;
  gems?: number;
  dust?: number;
};

export type MissionDef = {
  id: string;
  label: string;
  target: number;
  reward: Reward;
};

export type MissionState = MissionDef & {
  progress: number;
  complete: boolean;
  claimed: boolean;
};

export type LifetimeTier = {
  threshold: number;
  reward: Reward;
};

export type LifetimeMissionDef = {
  id: string;
  label: string;
  tiers: LifetimeTier[];
};

export const LIFETIME_MISSIONS: LifetimeMissionDef[] = [
  {
    id: "collect_cards",
    label: "Collection Mastery",
    tiers: [
      { threshold: 10, reward: { gems: 10 } },
      { threshold: 25, reward: { gems: 20 } },
      { threshold: 50, reward: { gems: 50 } },
      { threshold: 100, reward: { gems: 100 } },
      { threshold: 150, reward: { gems: 150 } },
      { threshold: 250, reward: { gems: 200 } },
    ],
  },
  {
    id: "complete_sets",
    label: "Set Completionist",
    tiers: [
      { threshold: 1, reward: { dust: 40, gems: 20 } },
      { threshold: 2, reward: { dust: 100, gems: 50 } },
      { threshold: 4, reward: { dust: 200, gems: 100 } },
    ],
  },
  {
    id: "collect_legendary",
    label: "Legendary Hunter",
    tiers: [
      { threshold: 5, reward: { gems: 20 } },
      { threshold: 15, reward: { gems: 60 } },
      { threshold: 30, reward: { gems: 150 } },
    ],
  },
  {
    id: "collect_secret",
    label: "Secret Seeker",
    tiers: [
      { threshold: 1, reward: { dust: 60, gems: 20 } },
      { threshold: 3, reward: { dust: 160, gems: 60 } },
    ],
  },
  {
    id: "login_dedication",
    label: "Login Dedication",
    tiers: [
      { threshold: 7, reward: { gems: 10 } },
      { threshold: 30, reward: { gems: 30, tickets: 5 } },
      { threshold: 100, reward: { gems: 100, tickets: 10 } },
      { threshold: 365, reward: { gems: 400, tickets: 30 } },
    ],
  },
  {
    id: "streak_record",
    label: "Unstoppable",
    tiers: [
      { threshold: 7, reward: { gems: 20 } },
      { threshold: 30, reward: { tickets: 10 } },
      { threshold: 100, reward: { tickets: 30, gems: 100 } },
    ],
  },
  {
    id: "packs_opened",
    label: "Pack Addict",
    tiers: [
      { threshold: 10, reward: { gems: 10 } },
      { threshold: 50, reward: { gems: 40 } },
      { threshold: 200, reward: { tickets: 10, gems: 100 } },
      { threshold: 1000, reward: { tickets: 30, gems: 400 } },
    ],
  },
  {
    id: "craft_master",
    label: "Craft Master",
    tiers: [
      { threshold: 5, reward: { dust: 20 } },
      { threshold: 25, reward: { dust: 60, gems: 20 } },
      { threshold: 100, reward: { dust: 160, gems: 100 } },
    ],
  },
  {
    id: "disenchant_veteran",
    label: "Disenchant Veteran",
    tiers: [
      { threshold: 10, reward: { dust: 20 } },
      { threshold: 50, reward: { dust: 60, gems: 20 } },
      { threshold: 200, reward: { dust: 160, gems: 60 } },
    ],
  },
  {
    id: "trades_completed",
    label: "Master Trader",
    tiers: [
      { threshold: 1, reward: { gems: 10 } },
      { threshold: 10, reward: { gems: 40 } },
      { threshold: 50, reward: { tickets: 10, gems: 100 } },
    ],
  },
];

export const FIXED_DAILY: MissionDef[] = [
  { id: "open_pack", label: "Open 1 pack", target: 1, reward: { gems: 10 } },
];
export const FIXED_WEEKLY: MissionDef[] = [
  { id: "open_5_packs", label: "Open 5 packs", target: 5, reward: { gems: 100 } },
  { id: "daily_streak_5", label: "Login 5 days this week", target: 5, reward: { gems: 100 } },
];
export const ROTATING_DAILY_SLOT_COUNT = 3;

export const STREAK_BONUS_GEMS = [15, 30, 50, 0, 30, 50, 0];

export const XP_PER_LEVEL = 100;

import { GRADE_VALUE_MULTIPLIER } from "./gradeConfig";
import type { CardGrade } from "@/db/schema";

export const DISENCHANT_VALUES: Record<string, number> = {
  common: 1, rare: 3, epic: 8, legendary: 20, secret: 60,
};

export function getDisenchantValue(rarity: string, grade: CardGrade): number {
  return Math.round((DISENCHANT_VALUES[rarity] ?? 0) * GRADE_VALUE_MULTIPLIER[grade]);
}

export const CRAFT_COSTS: Record<string, number> = {
  common: 4, rare: 12, epic: 32, legendary: 80, secret: 240,
};

export function getFanLevel(xp: number): { level: number; xpIntoLevel: number; xpForNext: number } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  return { level, xpIntoLevel: xp % XP_PER_LEVEL, xpForNext: XP_PER_LEVEL };
}

export function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function getMondayOf(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getMondayStr(date = new Date()): string {
  return todayStr(getMondayOf(date));
}

export type MissionDifficulty = "easy" | "normal" | "hard";

export interface PoolMissionDef extends MissionDef {
  difficulty: MissionDifficulty;
  weight: number;
}

export const DAILY_POOL: PoolMissionDef[] = [
  { id: "open_3_packs", label: "Open 3 packs", target: 3, reward: { gems: 50 }, difficulty: "normal", weight: 2 },
  { id: "collect_5_new", label: "Collect 5 cards", target: 5, reward: { dust: 50 }, difficulty: "hard", weight: 1 },
  { id: "craft_card", label: "Craft 1 card", target: 1, reward: { gems: 40 }, difficulty: "hard", weight: 1 },
];

export const WEEKLY_POOL: PoolMissionDef[] = [
  { id: "open_5_packs", label: "Open 5 packs", target: 5, reward: { gems: 100 }, difficulty: "normal", weight: 3 },
  { id: "collect_3_new", label: "Collect 3 cards", target: 3, reward: { gems: 60 }, difficulty: "normal", weight: 3 },
  { id: "craft_3_cards", label: "Craft 3 cards", target: 3, reward: { dust: 100, gems: 50 }, difficulty: "hard", weight: 1 },
];

export const DAILY_SLOT_COUNT = 4;
export const WEEKLY_SLOT_COUNT = 4;

export function pickWeightedMissions(pool: PoolMissionDef[], count: number): MissionDef[] {
  const weighted = pool.flatMap((m) => Array.from({ length: m.weight }, () => m));
  const shuffled = [...weighted].sort(() => Math.random() - 0.5);
  const picked = new Set<string>();
  const result: MissionDef[] = [];
  for (const m of shuffled) {
    if (picked.has(m.id)) continue;
    picked.add(m.id);
    result.push({ id: m.id, label: m.label, target: m.target, reward: m.reward });
    if (result.length >= count) break;
  }
  return result;
}

export function getDailyResetTime(): { label: string; timestamp: number } {
  const next = new Date();
  next.setUTCHours(24, 0, 0, 0);
  return { label: "Daily reset", timestamp: next.getTime() };
}

export function getWeeklyResetTime(): { label: string; timestamp: number } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(next.getDate() + diff);
  next.setUTCHours(0, 0, 0, 0);
  return { label: "Weekly reset", timestamp: next.getTime() };
}
