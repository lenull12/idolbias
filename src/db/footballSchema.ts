import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import { players } from "./schema";

export type Rarity = "common" | "rare" | "epic" | "legendary" | "secret";
export type Nation = "france" | "allemagne" | "angleterre" | "italie" | "espagne" | "bresil" | "japon" | "argentine";
export type Style = "percussion" | "vista" | "pressing" | "elevation" | "sangFroid";
export type Position = "GB" | "DEF" | "MIL" | "ATT";
export type Grade = "standard" | "fine" | "mint" | "pristine" | "gem";

export const OVR_BAND: Record<Rarity, [number, number]> = {
  common: [45, 64],
  rare: [65, 74],
  epic: [75, 84],
  legendary: [85, 94],
  secret: [95, 99],
};

export const SKILL_SLOTS_BY_RARITY: Record<Rarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
  secret: 4,
};

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nickname: text("nickname"),
  nation: text("nation").$type<Nation>().notNull(),
  defaultStyle: text("default_style").$type<Style>().notNull(),
  defaultPosition: text("default_position").$type<Position>().notNull(),
  isCaptain: integer("is_captain", { mode: "boolean" }).notNull().default(false),
  photoVariants: text("photo_variants", { mode: "json" })
    .$type<{ standard: string; field?: string; signature?: string; mythic?: string }>()
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const cardPrints = sqliteTable("card_prints", {
  id: text("id").primaryKey(),
  characterId: text("character_id").notNull().references(() => characters.id),
  editionCode: text("edition_code").notNull(),
  rarity: text("rarity").$type<Rarity>().notNull(),
  refCode: text("ref_code").notNull(),
  mintCap: integer("mint_cap"),
  minted: integer("minted").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  characterEditionRarityIdx: uniqueIndex("card_prints_char_edition_rarity_idx")
    .on(t.characterId, t.editionCode, t.rarity),
}));

export interface TecStats { passe: number; tir: number; dribble: number; centre: number; tacle: number; controle: number; }
export interface PhyStats { vitesse: number; acceleration: number; endurance: number; puissance: number; agilite: number; detente: number; }
export interface MenStats { anticipation: number; sangFroid: number; leadership: number; positionnement: number; agressivite: number; decision: number; }

export const cardInstances = sqliteTable("card_instances", {
  id: text("id").primaryKey(),
  printId: text("print_id").notNull().references(() => cardPrints.id),
  ownerId: text("owner_id").notNull().references(() => players.id),
  serial: integer("serial"),
  tecStats: text("tec_stats", { mode: "json" }).$type<TecStats>().notNull(),
  phyStats: text("phy_stats", { mode: "json" }).$type<PhyStats>().notNull(),
  menStats: text("men_stats", { mode: "json" }).$type<MenStats>().notNull(),
  position: text("position").$type<Position>().notNull(),
  ovr: integer("ovr").notNull(),
  grade: text("grade").$type<Grade>().notNull().default("standard"),
  affinityXp: integer("affinity_xp").notNull().default(0),
  affinityLastActiveAt: integer("affinity_last_active_at", { mode: "timestamp" }).notNull(),
  matchesPlayed: integer("matches_played").notNull().default(0),
  pityTriggered: integer("pity_triggered", { mode: "boolean" }).notNull().default(false),
  obtainedAt: integer("obtained_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  ownerIdx: uniqueIndex("card_instances_owner_idx").on(t.id, t.ownerId),
  printSerialIdx: uniqueIndex("card_instances_print_serial_idx").on(t.printId, t.serial),
}));

export type SkillEffectType = "stat_boost" | "special_ability";

export const skillCardDefs = sqliteTable("skill_card_defs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  rarity: text("rarity").$type<Rarity>().notNull(),
  effectType: text("effect_type").$type<SkillEffectType>().notNull(),
  statBoost: text("stat_boost", { mode: "json" }).$type<Partial<Record<string, number>>>(),
  abilityId: text("ability_id"),
  cooldownSeconds: integer("cooldown_seconds"),
  iconUrl: text("icon_url").notNull(),
});

export const skillCardInventory = sqliteTable("skill_card_inventory", {
  playerId: text("player_id").notNull().references(() => players.id),
  skillCardDefId: text("skill_card_def_id").notNull().references(() => skillCardDefs.id),
  quantity: integer("quantity").notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.playerId, t.skillCardDefId] }),
}));

export const cardInstanceSkillSlots = sqliteTable("card_instance_skill_slots", {
  cardInstanceId: text("card_instance_id").notNull().references(() => cardInstances.id),
  slotIndex: integer("slot_index").notNull(),
  skillCardDefId: text("skill_card_def_id").notNull().references(() => skillCardDefs.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.cardInstanceId, t.slotIndex] }),
}));

export const chemistryPairs = sqliteTable("chemistry_pairs", {
  instanceIdA: text("instance_id_a").notNull().references(() => cardInstances.id),
  instanceIdB: text("instance_id_b").notNull().references(() => cardInstances.id),
  matchesPlayedTogether: integer("matches_played_together").notNull().default(0),
  chemistryBonus: integer("chemistry_bonus").notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.instanceIdA, t.instanceIdB] }),
}));

// ─── transfer_listings — marché des transferts (Dollars, instances) ─────
export const transferListings = sqliteTable("transfer_listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardInstanceId: text("card_instance_id").notNull().references(() => cardInstances.id),
  sellerId: text("seller_id").notNull().references(() => players.id),
  priceDollars: integer("price_dollars").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  buyerId: text("buyer_id"),
}, (t) => ({
  instanceStatusIdx: index("transfer_listings_instance_status_idx").on(t.cardInstanceId, t.status),
}));

export const transferSales = sqliteTable("transfer_sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardInstanceId: text("card_instance_id").notNull(),
  priceDollars: integer("price_dollars").notNull(),
  soldAt: integer("sold_at", { mode: "timestamp" }).notNull(),
});

type StatKey = keyof TecStats | keyof PhyStats | keyof MenStats;

export const POSITION_WEIGHTS: Record<Position, Partial<Record<StatKey, number>>> = {
  ATT: { tir: 3, dribble: 2, vitesse: 2, sangFroid: 2, acceleration: 2 },
  MIL: { passe: 3, decision: 2, controle: 2, endurance: 2, dribble: 2 },
  DEF: { tacle: 3, positionnement: 3, puissance: 2, anticipation: 2 },
  GB: { anticipation: 3, agilite: 3, positionnement: 2, sangFroid: 2 },
};

const DEFAULT_WEIGHT = 1;

export function computeOVR(
  tec: TecStats,
  phy: PhyStats,
  men: MenStats,
  position: Position,
  editorialBoost = 0,
): number {
  const all: Record<StatKey, number> = { ...tec, ...phy, ...men };
  const weights = POSITION_WEIGHTS[position];
  let sum = 0;
  let totalWeight = 0;
  for (const key of Object.keys(all) as StatKey[]) {
    const w = weights[key] ?? DEFAULT_WEIGHT;
    sum += all[key] * w;
    totalWeight += w;
  }
  const raw = Math.round((sum / totalWeight / 20) * 99) + editorialBoost;
  return raw;
}

export function clampOVRToRarityBand(ovr: number, rarity: Rarity): number {
  const [min, max] = OVR_BAND[rarity];
  return Math.max(min, Math.min(max, ovr));
}
