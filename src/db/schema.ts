import { sqliteTable, text, integer, real, uniqueIndex, index, primaryKey } from "drizzle-orm/sqlite-core";

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
  fanXp: text("fan_xp", { mode: "json" })
    .$type<Record<string, number>>()
    .notNull()
    .default({}),
  bias: text("bias"),
  biasChangedAt: integer("bias_changed_at", { mode: "timestamp" }),
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
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  dailyTemplates: text("daily_templates", { mode: "json" })
    .$type<{ id: string; label: string; target: number; reward: { tickets?: number; gems?: number; dust?: number } }[]>()
    .notNull()
    .default([]),
  weeklyTemplates: text("weekly_templates", { mode: "json" })
    .$type<{ id: string; label: string; target: number; reward: { tickets?: number; gems?: number; dust?: number } }[]>()
    .notNull()
    .default([]),
});

// ─── trade_offers ──────────────────────────────────────────────────────────
export const tradeOffers = sqliteTable("trade_offers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  offererId: text("offerer_id").notNull().references(() => players.id),
  offeredCardId: text("offered_card_id").notNull(),
  requestedCardId: text("requested_card_id").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  resolvedBy: text("resolved_by").references(() => players.id),
}, (table) => ({
  statusIdx: index("trade_offers_status_idx").on(table.status),
  offererIdx: index("trade_offers_offerer_idx").on(table.offererId),
}));

// ─── owned_cards ───────────────────────────────────────────────────────────
export const ownedCards = sqliteTable("owned_cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: text("player_id").notNull().references(() => players.id),
  cardId: text("card_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  firstObtainedAt: integer("first_obtained_at", { mode: "timestamp" }).notNull(),
  lastObtainedAt: integer("last_obtained_at", { mode: "timestamp" }).notNull(),
}, (table) => ({
  playerCardIdx: uniqueIndex("owned_cards_player_card_idx").on(table.playerId, table.cardId),
}));

// ─── feed_subscriptions ─────────────────────────────────────────────────────
export const feedSubscriptions = sqliteTable("feed_subscriptions", {
  playerId: text("player_id").notNull().references(() => players.id),
  groupId: text("group_id").notNull(),
  memberId: text("member_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  subPk: primaryKey({ columns: [t.playerId, t.memberId] }),
}));

// ─── feed_posts ────────────────────────────────────────────────────────────
export const feedPosts = sqliteTable("feed_posts", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull(),
  groupId: text("group_id").notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── feed_likes ────────────────────────────────────────────────────────────
export const feedLikes = sqliteTable("feed_likes", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => feedPosts.id),
  userId: text("user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  uniqueLike: uniqueIndex("feed_unique_like").on(t.postId, t.userId),
}));

// ─── feed_comments ─────────────────────────────────────────────────────────
export const feedComments = sqliteTable("feed_comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => feedPosts.id),
  userId: text("user_id"),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  isOfficial: integer("is_official", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── cosmo_posts ───────────────────────────────────────────────────────────
export const cosmoPosts = sqliteTable("cosmo_posts", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── cosmo_replies ─────────────────────────────────────────────────────────
export const cosmoReplies = sqliteTable("cosmo_replies", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => cosmoPosts.id),
  userId: text("user_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

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

// ─── set_completions ─────────────────────────────────────────────────────
export const setCompletions = sqliteTable("set_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: text("player_id").notNull().references(() => players.id),
  packCode: text("pack_code").notNull(),
  edition: text("edition").notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
  rewardedAt: integer("rewarded_at", { mode: "timestamp" }),
  claimed: integer("claimed", { mode: "boolean" }).notNull().default(false),
}, (table) => ({
  uniqueCompletion: uniqueIndex("set_completions_player_pack_idx").on(table.playerId, table.packCode),
}));

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

// ─── cosmo_featured_responses ──────────────────────────────────────────────
export const cosmoFeaturedResponses = sqliteTable("cosmo_featured_responses", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => cosmoPosts.id),
  replyId: text("reply_id").notNull().references(() => cosmoReplies.id),
  responseContent: text("response_content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
