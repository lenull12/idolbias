export const AFFINITY_TIERS = [
  { tier: 1, xpRequired: 0,    label: "Stranger",   icon: "\uD83E\uDD1D", reward: null },
  { tier: 2, xpRequired: 100,  label: "Listener",   icon: "\uD83D\uDC4B", reward: "alt_portrait" },
  { tier: 3, xpRequired: 500,  label: "Regular",    icon: "\uD83D\uDCAC", reward: "alt_outfit" },
  { tier: 4, xpRequired: 1500, label: "Confidant",  icon: "\uD83D\uDC95", reward: "mini_clip" },
  { tier: 5, xpRequired: 4000, label: "Bias",       icon: "\uD83D\uDC96", reward: "exclusive_outfit" },
  { tier: 6, xpRequired: 10000, label: "Soulbound", icon: "\uD83C\uDF1F", reward: "full_gallery" },
] as const;

export const CHECKIN_XP = 10;
export const DUPLICATE_XP = 5;
export const PULL_NEW_XP = 15;

export function getAffinityTier(xp: number) {
  for (let i = AFFINITY_TIERS.length - 1; i >= 0; i--) {
    if (xp >= AFFINITY_TIERS[i].xpRequired) return AFFINITY_TIERS[i];
  }
  return AFFINITY_TIERS[0];
}

export function getNextTier(xp: number) {
  const current = getAffinityTier(xp);
  const idx = AFFINITY_TIERS.findIndex((t) => t.tier === current.tier);
  return idx < AFFINITY_TIERS.length - 1 ? AFFINITY_TIERS[idx + 1] : null;
}
