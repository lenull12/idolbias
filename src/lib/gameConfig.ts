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
  // ─── Collection ──────────────────────────────────────────
  {
    id: "collect_cards",
    label: "Collection Mastery",
    tiers: [
      { threshold: 10, reward: { gems: 50 } },
      { threshold: 25, reward: { gems: 100 } },
      { threshold: 50, reward: { gems: 250 } },
      { threshold: 100, reward: { gems: 500 } },
      { threshold: 150, reward: { gems: 750 } },
      { threshold: 250, reward: { gems: 1000 } },
    ],
  },
  {
    id: "complete_sets",
    label: "Set Completionist",
    tiers: [
      { threshold: 1, reward: { dust: 200, gems: 100 } },
      { threshold: 2, reward: { dust: 500, gems: 250 } },
      { threshold: 4, reward: { dust: 1000, gems: 500 } },
    ],
  },
  {
    id: "collect_legendary",
    label: "Legendary Hunter",
    tiers: [
      { threshold: 5, reward: { gems: 100 } },
      { threshold: 15, reward: { gems: 300 } },
      { threshold: 30, reward: { gems: 750 } },
    ],
  },
  {
    id: "collect_secret",
    label: "Secret Seeker",
    tiers: [
      { threshold: 1, reward: { dust: 300, gems: 100 } },
      { threshold: 3, reward: { dust: 800, gems: 300 } },
    ],
  },
  // ─── Social ─────────────────────────────────────────────
  {
    id: "follow_all_artists",
    label: "Devoted Fan",
    tiers: [
      { threshold: 1, reward: { gems: 50 } },
      { threshold: 2, reward: { gems: 100 } },
      { threshold: 3, reward: { gems: 200 } },
      { threshold: 4, reward: { tickets: 5, gems: 300 } },
    ],
  },
  {
    id: "likes_given",
    label: "Feed Lover",
    tiers: [
      { threshold: 50, reward: { gems: 50 } },
      { threshold: 200, reward: { gems: 150 } },
      { threshold: 500, reward: { gems: 400 } },
      { threshold: 1000, reward: { tickets: 5, gems: 500 } },
    ],
  },
  // ─── Progression ─────────────────────────────────────────
  {
    id: "fan_level",
    label: "Fan Devotion",
    tiers: [
      { threshold: 5, reward: { tickets: 1, gems: 10 } },
      { threshold: 10, reward: { tickets: 3, gems: 25 } },
      { threshold: 20, reward: { tickets: 5, gems: 50 } },
      { threshold: 30, reward: { tickets: 8, gems: 125 } },
      { threshold: 50, reward: { tickets: 10, gems: 250 } },
      { threshold: 75, reward: { tickets: 15, gems: 500 } },
    ],
  },
  {
    id: "login_dedication",
    label: "Login Dedication",
    tiers: [
      { threshold: 7, reward: { gems: 50 } },
      { threshold: 30, reward: { gems: 150, tickets: 5 } },
      { threshold: 100, reward: { gems: 500, tickets: 10 } },
      { threshold: 365, reward: { gems: 2000, tickets: 30 } },
    ],
  },
  {
    id: "streak_record",
    label: "Unstoppable",
    tiers: [
      { threshold: 7, reward: { gems: 100 } },
      { threshold: 30, reward: { tickets: 10 } },
      { threshold: 100, reward: { tickets: 30, gems: 500 } },
    ],
  },
  // ─── Économie / Workshop ────────────────────────────────
  {
    id: "packs_opened",
    label: "Pack Addict",
    tiers: [
      { threshold: 10, reward: { gems: 50 } },
      { threshold: 50, reward: { gems: 200 } },
      { threshold: 200, reward: { tickets: 10, gems: 500 } },
      { threshold: 1000, reward: { tickets: 30, gems: 2000 } },
    ],
  },
  {
    id: "craft_master",
    label: "Craft Master",
    tiers: [
      { threshold: 5, reward: { dust: 100 } },
      { threshold: 25, reward: { dust: 300, gems: 100 } },
      { threshold: 100, reward: { dust: 800, gems: 500 } },
    ],
  },
  {
    id: "disenchant_veteran",
    label: "Disenchant Veteran",
    tiers: [
      { threshold: 10, reward: { dust: 100 } },
      { threshold: 50, reward: { dust: 300, gems: 100 } },
      { threshold: 200, reward: { dust: 800, gems: 300 } },
    ],
  },
  {
    id: "trades_completed",
    label: "Master Trader",
    tiers: [
      { threshold: 1, reward: { gems: 50 } },
      { threshold: 10, reward: { gems: 200 } },
      { threshold: 50, reward: { tickets: 10, gems: 500 } },
    ],
  },
];

// ─── Fixed daily/weekly (always present) ────────────────────────────────
export const FIXED_DAILY: MissionDef[] = [
  { id: "open_pack", label: "Open 1 pack", target: 1, reward: { gems: 20 } },
];
export const FIXED_WEEKLY: MissionDef[] = [
  { id: "open_5_packs", label: "Open 5 packs", target: 5, reward: { gems: 100 } },
  { id: "daily_streak_5", label: "Login 5 days this week", target: 5, reward: { gems: 100 } },
];
export const ROTATING_DAILY_SLOT_COUNT = 3;

export const STREAK_TICKETS = [0, 0, 0, 1, 1, 1, 3];
export const STREAK_BONUS_GEMS = [15, 30, 50, 0, 30, 50, 0];

export const XP_PER_LEVEL = 100;
export const XP_PER_RARITY: Record<string, number> = {
  common: 5, rare: 10, epic: 20, legendary: 40, secret: 100,
};

export const BIAS_WEIGHT_MULTIPLIER = 1.25;
export const BIAS_COOLDOWN_DAYS = 7;

export const DISENCHANT_VALUES: Record<string, number> = {
  common: 5, rare: 15, epic: 40, legendary: 100, secret: 300,
};

export const CRAFT_COSTS: Record<string, number> = {
  common: 20, rare: 60, epic: 160, legendary: 400, secret: 1200,
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

// ─── Pool missions ─────────────────────────────────────────────────────

export type MissionDifficulty = "easy" | "normal" | "hard";

export interface PoolMissionDef extends MissionDef {
  difficulty: MissionDifficulty;
  weight: number;
}

export const DAILY_POOL: PoolMissionDef[] = [
  { id: "open_pack", label: "Open 1 pack", target: 1, reward: { gems: 20 }, difficulty: "easy", weight: 4 },
  { id: "view_artist", label: "Visit an artist profile", target: 1, reward: { gems: 10 }, difficulty: "easy", weight: 4 },
  { id: "view_collection", label: "Browse the card catalogue", target: 1, reward: { gems: 10 }, difficulty: "easy", weight: 4 },
  { id: "like_posts", label: "Like 3 posts", target: 3, reward: { gems: 15 }, difficulty: "normal", weight: 3 },
  { id: "comment_posts", label: "Comment 1 time", target: 1, reward: { gems: 15 }, difficulty: "normal", weight: 3 },
  { id: "collect_rare_plus", label: "Collect 2 Rare+ cards or better", target: 2, reward: { dust: 20 }, difficulty: "normal", weight: 2 },
  { id: "open_3_packs", label: "Open 3 packs", target: 3, reward: { gems: 50 }, difficulty: "normal", weight: 2 },
  { id: "like_10_posts", label: "Like 10 posts", target: 10, reward: { tickets: 1 }, difficulty: "hard", weight: 1 },
  { id: "collect_5_new", label: "Collect 5 cards", target: 5, reward: { dust: 50 }, difficulty: "hard", weight: 1 },
  { id: "craft_card", label: "Craft 1 card", target: 1, reward: { gems: 40 }, difficulty: "hard", weight: 1 },
  { id: "view_feed", label: "Visit the feed", target: 1, reward: { gems: 10 }, difficulty: "easy", weight: 3 },
  // removed: follow_member (not enough artists at launch)
];

export const WEEKLY_POOL: PoolMissionDef[] = [
  { id: "open_5_packs", label: "Open 5 packs", target: 5, reward: { gems: 100 }, difficulty: "normal", weight: 3 },
  { id: "collect_3_new", label: "Collect 3 cards", target: 3, reward: { gems: 60 }, difficulty: "normal", weight: 3 },
  { id: "visit_3_artists", label: "Visit 3 distinct artists", target: 3, reward: { gems: 60 }, difficulty: "normal", weight: 2 },
  // removed: daily_streak_5 (moved to FIXED_WEEKLY)
  { id: "like_20_posts", label: "Like 20 posts", target: 20, reward: { gems: 150 }, difficulty: "normal", weight: 2 },
  { id: "comment_10_posts", label: "Comment 10 times", target: 10, reward: { gems: 60 }, difficulty: "normal", weight: 2 },
  // removed: follow_5_artists (not enough artists at launch)
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
