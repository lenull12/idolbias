import type { Rarity } from "@/components/CardEffects";

// ─── Types ─────────────────────────────────────────────────────────────────

export type PackDropRates = Record<Rarity, number>;

export type PackTag = "featured" | "limited" | "discount" | "new";

export type PackInfo = {
  name: string;
  edition: string;
  dropRates: PackDropRates;
  bannerImage?: string;
  /** Cover image ~7:9 used for pull overlay, thumbnails, etc. */
  coverImage?: string;
  endsAt?: string;
  /** Promo tag displayed on the banner (featured / limited / discount / new) */
  tag?: PackTag;
  /** Used when tag === "discount", e.g. 50 for "-50%" */
  discountPercent?: number;
  /** Pack not yet available for purchase, shown grayed out with a lock */
  locked?: boolean;
  /** Cost in tickets (free currency). Undefined = not payable in tickets. */
  costTickets?: number;
  /** Cost in gems (premium currency). Undefined = not payable in gems. */
  costGems?: number;
  /** Original price before discount, shown if tag === "discount" */
  originalCostGems?: number;
  /** Narrative pitch for the pack (2-3 sentences, lore/context) */
  description?: string;
  /** Style/mood tags displayed as pills, e.g. ["Y2K", "Chrome", "Night vibes"] */
  tags?: string[];
};

export type CardEntry = {
  id: string;
  idol: string;
  group: string;
  pack: string;
  packCode: string;
  edition: string;
  reference: string;
  imageSrc: string;
  desirabilityMultiplier?: number;
};

// ─── Constants ─────────────────────────────────────────────────────────────

const RARITY_FROM_SUFFIX: Record<string, Rarity> = {
  C: "common",
  R: "rare",
  E: "epic",
  L: "legendary",
  S: "secret",
};

const GROUP_PREFIX: Record<string, string> = {
  VC: "VICIOUS",
  RZ: "R\u039bZE",
};

const MEMBER_PER_GROUP: Record<string, Record<string, string>> = {
  VICIOUS: { "1": "RIA", "2": "SEORI", "3": "MINA", "4": "HAEUN" },
  "R\u039bZE": { "1": "\u039bSH", "2": "GR\u039bV", "3": "F\u039bLL", "4": "BL\u039bZE" },
};

function groupFromRef(ref: string): string {
  const prefix = ref.match(/^([A-Z]{2})\d/)?.[1] ?? "VC";
  return GROUP_PREFIX[prefix] ?? "VICIOUS";
}

function memberMapForRef(ref: string): Record<string, string> {
  return MEMBER_PER_GROUP[groupFromRef(ref)] ?? MEMBER_PER_GROUP.VICIOUS;
}

/** List of available idols, for the bias picker (Profile) */
export const IDOL_NAMES: string[] = Object.values(MEMBER_PER_GROUP).flatMap(Object.values);

const DEFAULT_DROP_RATES: PackDropRates = {
  common: 100, rare: 0, epic: 0, legendary: 0, secret: 0,
};

const PACK_MAP: Record<string, PackInfo> = {
  // ── Placeholders — to be replaced with real packs when they exist ──
  SUMMER_RUSH: {
    name: "SUMMER RUSH",
    edition: "Limited Drop",
    dropRates: { common: 45, rare: 32, epic: 15, legendary: 6, secret: 2 },
    endsAt: "2026-07-20T00:00:00Z",
    tag: "limited",
    costTickets: 1,
    costGems: 10,
  },
  NEON_DREAMS: {
    name: "NEON DREAMS",
    edition: "Special Edition",
    dropRates: { common: 50, rare: 30, epic: 14, legendary: 5, secret: 1 },
    tag: "discount",
    discountPercent: 50,
    costGems: 10,
    originalCostGems: 20,
  },
  MOONLIGHT: {
    name: "MOONLIGHT SONATA",
    edition: "Season 2",
    dropRates: { common: 50, rare: 30, epic: 14, legendary: 5, secret: 1 },
    tag: "new",
    costTickets: 1,
    costGems: 10,
  },
  STARLIGHT_V2: {
    name: "STARLIGHT VOL. 2",
    edition: "Coming Soon",
    dropRates: DEFAULT_DROP_RATES,
    locked: true,
  },
  AFTERGLOW: {
    name: "AFTERGLOW",
    edition: "Coming Soon",
    dropRates: DEFAULT_DROP_RATES,
    locked: true,
  },
  NR: {
    name: "NEW RULES",
    edition: "First Edition",
    dropRates: { common: 50, rare: 30, epic: 14, legendary: 5, secret: 1 },
    bannerImage: "/cards/VICIOUS-NEW RULES/banner_wide.webp",
    coverImage: "/cards/VICIOUS-NEW RULES/cover.webp",
    tag: "featured",
    costTickets: 1,
    costGems: 10,
    tags: ["Dark elegance", "Rebel chic"],
    description: "VICIOUS rewrites the rules. A darker, bolder chapter — sharp silhouettes, smoldering gazes, and attitude that cuts through the noise.",
  },
  LS: {
    name: "LUCID SHIFT",
    edition: "First Edition",
    dropRates: { common: 50, rare: 30, epic: 14, legendary: 5, secret: 1 },
    bannerImage: "/cards/VICIOUS-LUCID SHIFT/banner_wide.webp",
    coverImage: "/cards/VICIOUS-LUCID SHIFT/cover.webp",
    tag: "featured",
    costTickets: 1,
    costGems: 10,
    tags: ["Chrome Y2K", "Dark fantasy"],
    description: "VICIOUS's very first photocard series. A shift between metallic glamour and chiaroscuro — the THE FIRST BITE era captured from every angle.",
  },
  BF: {
    name: "BLΛCK FLΛSH",
    edition: "EP",
    dropRates: { common: 54, rare: 31, epic: 13.2, legendary: 1.5, secret: 0.3 },
    bannerImage: "/cards/RΛZE-BLACK FLASH/banner_wide.png",
    coverImage: "/cards/R\u039bZE-BLACK FLASH/cover.webp",
    tag: "featured",
    costTickets: 1,
    costGems: 10,
    tags: ["Photoshoot", "Edgy", "Confident"],
    description: "RAZE arrives — raw, unfiltered, impossible to ignore. A high-contrast photoshoot series where confidence meets edge. Every frame burns with attitude.",
  },
};

const PACK_DIRS: Record<string, { dir: string; ext: string }> = {
  NR: { dir: "/cards/VICIOUS-NEW RULES", ext: ".webp" },
  LS: { dir: "/cards/VICIOUS-LUCID SHIFT", ext: ".webp" },
  BF: { dir: "/cards/R\u039bZE-BLACK FLASH", ext: ".webp" },
};

const DEFAULT_PACK_DIR = { dir: "/cards/VICIOUS-LUCID SHIFT", ext: ".webp" };

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extract rarity from the reference suffix */
export function rarityFromReference(ref: string): Rarity {
  return RARITY_FROM_SUFFIX[ref.slice(-1).toUpperCase()] ?? "common";
}

/** Parse a reference and return all properties */
export function parseReference(ref: string): {
  groupPrefix: string;
  member: string;
  packCode: string;
  number: string;
  rarity: Rarity;
} {
  const m = ref.match(/^([A-Z]{2})(\d+)-([A-Z]+)-(\d{3})([C|R|E|L|S])$/i);
  if (!m) throw new Error(`Invalid reference: ${ref}`);
  return {
    groupPrefix: m[1].toUpperCase(),
    member: m[2],
    packCode: m[3],
    number: m[4],
    rarity: m[5].toUpperCase() as Rarity,
  };
}

/** Rebuild the image path from the reference */
export function imagePathFromReference(ref: string): string {
  const { packCode } = parseReference(ref);
  const cfg = PACK_DIRS[packCode] ?? DEFAULT_PACK_DIR;
  return `${cfg.dir}/${ref}${cfg.ext}`;
}

/** Return full pack info (name, edition, drop rates) */
export function getPackInfo(packCode: string): PackInfo {
  return PACK_MAP[packCode] ?? { name: packCode, edition: "Unknown", dropRates: DEFAULT_DROP_RATES };
}

/** Return only the drop rates of a pack, for the UI */
export function getPackDropRates(packCode: string): PackDropRates {
  return getPackInfo(packCode).dropRates;
}

/** Return all cards belonging to a given pack */
export function getCardsByPack(packCode: string): CardEntry[] {
  return CARDS.filter((c) => c.packCode === packCode);
}

/**
 * Return all packs as [code, info] pairs, sorted:
 * featured first, locked packs (coming soon) last.
 */
export function getAllPacks(): Array<[string, PackInfo]> {
  const weight = (p: PackInfo) => (p.tag === "featured" ? 0 : p.locked ? 2 : 1);
  return Object.entries(PACK_MAP).sort((a, b) => weight(a[1]) - weight(b[1]));
}

/** Return a card by its id, or undefined if unknown */
export function getCardById(id: string): CardEntry | undefined {
  return CARDS.find((c) => c.id === id);
}

// ─── Card Database ─────────────────────────────────────────────────────────

const DESIRABILITY_OVERRIDES: Record<string, number> = {
  // À remplir manuellement — ex: "VC1-NR-002L": 1.4
};

const REFS: string[] = [
  // ── NEW RULES (NR) — 40 cartes ──
  // RIA (VC1) — 001→010: C-L-E-R-C-R-C-S-R-E
  "VC1-NR-001C", "VC1-NR-002L", "VC1-NR-003E", "VC1-NR-004R", "VC1-NR-005C",
  "VC1-NR-006R", "VC1-NR-007C", "VC1-NR-008S", "VC1-NR-009R", "VC1-NR-010E",
  // SEORI (VC2) — 011→020: C-R-E-S-C-E-C-R-L-C
  "VC2-NR-011C", "VC2-NR-012R", "VC2-NR-013E", "VC2-NR-014S", "VC2-NR-015C",
  "VC2-NR-016E", "VC2-NR-017C", "VC2-NR-018R", "VC2-NR-019L", "VC2-NR-020C",
  // MINA (VC3) — 021→030: C-L-R-E-C-R-S-C-R-E
  "VC3-NR-021C", "VC3-NR-022L", "VC3-NR-023R", "VC3-NR-024E", "VC3-NR-025C",
  "VC3-NR-026R", "VC3-NR-027S", "VC3-NR-028C", "VC3-NR-029R", "VC3-NR-030E",
  // HAEUN (VC4) — 031→040: C-E-L-S-R-C-C-E-R-C
  "VC4-NR-031C", "VC4-NR-032E", "VC4-NR-033L", "VC4-NR-034S", "VC4-NR-035R",
  "VC4-NR-036C", "VC4-NR-037C", "VC4-NR-038E", "VC4-NR-039R", "VC4-NR-040C",
  // ── BLΛCK FLΛSH (BF) — 20 cartes ──
  // ΛSH (RZ1) — 001→005: R-C-E-R-S
  "RZ1-BF-001R", "RZ1-BF-002C", "RZ1-BF-003E", "RZ1-BF-004R", "RZ1-BF-005S",
  // GRΛV (RZ2) — 006→010: C-E-L-R-C
  "RZ2-BF-006C", "RZ2-BF-007E", "RZ2-BF-008L", "RZ2-BF-009R", "RZ2-BF-010C",
  // FΛLL (RZ3) — 011→015: C-L-E-R-C
  "RZ3-BF-011C", "RZ3-BF-012L", "RZ3-BF-013E", "RZ3-BF-014R", "RZ3-BF-015C",
  // BLΛZE (RZ4) — 016→020: E-S-R-C-R
  "RZ4-BF-016E", "RZ4-BF-017S", "RZ4-BF-018R", "RZ4-BF-019C", "RZ4-BF-020R",
  // ── LUCID SHIFT (LS) — 40 cartes ──
  // RIA (VC1) — 001→010: S-E-E-L-C-R-C-R-C-R
  "VC1-LS-001S", "VC1-LS-002E", "VC1-LS-003E", "VC1-LS-004L", "VC1-LS-005C",
  "VC1-LS-006R", "VC1-LS-007C", "VC1-LS-008R", "VC1-LS-009C", "VC1-LS-010R",
  // SEORI (VC2) — 011→020: C-R-C-E-S-E-C-L-C-R
  "VC2-LS-011C", "VC2-LS-012R", "VC2-LS-013C", "VC2-LS-014E", "VC2-LS-015S",
  "VC2-LS-016E", "VC2-LS-017C", "VC2-LS-018L", "VC2-LS-019C", "VC2-LS-020R",
  // MINA (VC3) — 021→030: C-R-E-C-S-E-R-C-R-L
  "VC3-LS-021C", "VC3-LS-022R", "VC3-LS-023E", "VC3-LS-024C", "VC3-LS-025S",
  "VC3-LS-026E", "VC3-LS-027R", "VC3-LS-028C", "VC3-LS-029R", "VC3-LS-030L",
  // HAEUN (VC4) — 031→040: E-E-C-R-C-L-S-C-R-R
  "VC4-LS-031E", "VC4-LS-032E", "VC4-LS-033C", "VC4-LS-034R", "VC4-LS-035C",
  "VC4-LS-036L", "VC4-LS-037S", "VC4-LS-038C", "VC4-LS-039R", "VC4-LS-040C",
];

function buildCard(ref: string): CardEntry {
  const p = parseReference(ref);
  const memberMap = memberMapForRef(ref);
  const idol = memberMap[p.member] ?? `MEMBER-${p.member}`;
  const pack = getPackInfo(p.packCode);

  return {
    id: ref.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    idol,
    group: groupFromRef(ref),
    pack: pack.name,
    packCode: p.packCode,
    edition: pack.edition,
    reference: ref,
    imageSrc: imagePathFromReference(ref),
    desirabilityMultiplier: DESIRABILITY_OVERRIDES[ref] ?? 1,
  };
}

const CARDS: CardEntry[] = REFS.map(buildCard);

export default CARDS;
