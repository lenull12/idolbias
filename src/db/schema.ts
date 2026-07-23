import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";
export type CardGrade = "standard" | "fine" | "mint" | "pristine" | "gem";

// ─── owned_cards (legacy — en cours de migration vers card_instances) ─────
export const ownedCards = sqliteTable("owned_cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: text("player_id").notNull().references(() => players.id),
  cardId: text("card_id").notNull(),
  grade: text("grade").notNull().default("standard"),
  quantity: integer("quantity").notNull().default(0),
  firstObtainedAt: integer("first_obtained_at", { mode: "timestamp" }).notNull(),
  lastObtainedAt: integer("last_obtained_at", { mode: "timestamp" }).notNull(),
}, (table) => ({
  playerCardGradeIdx: uniqueIndex("owned_cards_player_card_grade_idx")
    .on(table.playerId, table.cardId, table.grade),
}));

// ─── players ─────────────────────────────────────────────────────────────
// id = UUID generated server-side, stored client-side in httpOnly cookie.
// email stays nullable for now: only filled when a real
// account is linked (mandatory once gems are sold for real money).
export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  welcomePackClaimedAt: integer("welcome_pack_claimed_at", { mode: "timestamp" }),
}, (table) => ({
  emailIdx: uniqueIndex("players_email_idx").on(table.email),
}));

// ─── wallets ─────────────────────────────────────────────────────────────
export const wallets = sqliteTable("wallets", {
  playerId: text("player_id").primaryKey().references(() => players.id),
  tickets: integer("tickets").notNull().default(0),
  gems: integer("gems").notNull().default(0),
  dust: integer("dust").notNull().default(0),
  dollars: integer("dollars").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ─── progression ─────────────────────────────────────────────────────────
// Mirrors lib/gameConfig.ts logic 1:1, just stored server-side
// instead of localStorage. missionProgress / missionsClaimed / fanXp stay
// as JSON text: only one player reads/writes at a time, no need for
// relational schema here for now.
export const progression = sqliteTable("progression", {
  playerId: text("player_id").primaryKey().references(() => players.id),
  streak: integer("streak").notNull().default(0),
  lastClaim: text("last_claim"), // "yyyy-mm-dd" | null
  missionsDate: text("missions_date").notNull(),
  missionProgress: text("mission_progress", { mode: "json" })
    .$type<Record<string, number>>()
    .notNull()
    .default({}),
  missionsClaimed: text("missions_claimed", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),
  totalLogins: integer("total_logins").notNull().default(0),
  weeklyMissionsDate: text("weekly_missions_date"),
  weeklyMissionProgress: text("weekly_mission_progress", { mode: "json" })
    .$type<Record<string, number>>()
    .notNull()
    .default({}),
  weeklyMissionsClaimed: text("weekly_missions_claimed", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),
  lifetimeProgress: text("lifetime_progress", { mode: "json" })
    .$type<Record<string, number>>()
    .notNull()
    .default({}),
  lifetimeClaimed: text("lifetime_claimed", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),
  pityCounters: text("pity_counters", { mode: "json" })
    .$type<Record<string, number>>()
    .notNull()
    .default({}),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ─── trade_offers ──────────────────────────────────────────────────────────
export const tradeOffers = sqliteTable("trade_offers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  offererId: text("offerer_id").notNull().references(() => players.id),
  offeredCardId: text("offered_card_id").notNull(),
  offeredGrade: text("offered_grade").notNull().default("standard"),
  requestedCardId: text("requested_card_id").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  resolvedBy: text("resolved_by").references(() => players.id),
}, (table) => ({
  statusIdx: index("trade_offers_status_idx").on(table.status),
  offererIdx: index("trade_offers_offerer_idx").on(table.offererId),
}));

// ─── gem_purchases ────────────────────────────────────────────────────────────
export const gemPurchases = sqliteTable("gem_purchases", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull().references(() => players.id),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  packageId: text("package_id").notNull(),
  gemsCredited: integer("gems_credited").notNull(),
  amountPaid: integer("amount_paid").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  waiverConfirmedAt: integer("waiver_confirmed_at", { mode: "timestamp" }),
});

// ─── Better Auth tables ──────────────────────────────────────────────────────
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ─── events ──────────────────────────────────────────────────────────────
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // "collection" | "rate_up" | "hybrid"
  label: text("label").notNull(),
  description: text("description"),
  bannerImage: text("banner_image"),
  startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),
  targetPackCode: text("target_pack_code"),
  targetCount: integer("target_count").default(1),
  rewardDust: integer("reward_dust").default(0),
  rewardGems: integer("reward_gems").default(0),
  rewardTickets: integer("reward_tickets").default(0),
  rateUpMultiplier: real("rate_up_multiplier").default(1),
  rateUpRarities: text("rate_up_rarities", { mode: "json" }).$type<string[]>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── event_participation ──────────────────────────────────────────────────
export const eventParticipation = sqliteTable("event_participation", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: text("event_id").notNull().references(() => events.id),
  playerId: text("player_id").notNull().references(() => players.id),
  progress: integer("progress").notNull().default(0),
  claimed: integer("claimed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => ({
  uniqueParticipation: uniqueIndex("event_participation_event_player_idx").on(table.eventId, table.playerId),
}));

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  providerId: text("provider_id").notNull(),
  accountId: text("account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ─── leaderboard_meta ──────────────────────────────────────────────────────
export const leaderboardMeta = sqliteTable("leaderboard_meta", {
  id: integer("id").primaryKey(),
  lastComputedDate: text("last_computed_date").notNull().default(""),
});

// ─── Football mode tables ────────────────────────────────────────────────
export * from "./footballSchema";
export * from "./lineupSchema";
