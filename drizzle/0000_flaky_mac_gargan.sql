CREATE TABLE IF NOT EXISTS `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`account_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `event_participation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` text NOT NULL,
	`player_id` text NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`claimed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `event_participation_event_player_idx` ON `event_participation` (`event_id`,`player_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`description` text,
	`banner_image` text,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`target_pack_code` text,
	`target_count` integer DEFAULT 1,
	`reward_dust` integer DEFAULT 0,
	`reward_gems` integer DEFAULT 0,
	`reward_tickets` integer DEFAULT 0,
	`rate_up_multiplier` real DEFAULT 1,
	`rate_up_rarities` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `gem_purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`stripe_session_id` text NOT NULL,
	`package_id` text NOT NULL,
	`gems_credited` integer NOT NULL,
	`amount_paid` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	`waiver_confirmed_at` integer,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `gem_purchases_stripe_session_id_unique` ON `gem_purchases` (`stripe_session_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `leaderboard_meta` (
	`id` integer PRIMARY KEY NOT NULL,
	`last_computed_date` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `owned_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`card_id` text NOT NULL,
	`grade` text DEFAULT 'standard' NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`first_obtained_at` integer NOT NULL,
	`last_obtained_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `owned_cards_player_card_grade_idx` ON `owned_cards` (`player_id`,`card_id`,`grade`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `players` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`created_at` integer NOT NULL,
	`welcome_pack_claimed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `players_email_idx` ON `players` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `progression` (
	`player_id` text PRIMARY KEY NOT NULL,
	`streak` integer DEFAULT 0 NOT NULL,
	`last_claim` text,
	`missions_date` text NOT NULL,
	`mission_progress` text DEFAULT '{}' NOT NULL,
	`missions_claimed` text DEFAULT '[]' NOT NULL,
	`total_logins` integer DEFAULT 0 NOT NULL,
	`weekly_missions_date` text,
	`weekly_mission_progress` text DEFAULT '{}' NOT NULL,
	`weekly_missions_claimed` text DEFAULT '[]' NOT NULL,
	`lifetime_progress` text DEFAULT '{}' NOT NULL,
	`lifetime_claimed` text DEFAULT '[]' NOT NULL,
	`pity_counters` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `trade_offers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`offerer_id` text NOT NULL,
	`offered_card_id` text NOT NULL,
	`offered_grade` text DEFAULT 'standard' NOT NULL,
	`requested_card_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	`resolved_by` text,
	FOREIGN KEY (`offerer_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_by`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `trade_offers_status_idx` ON `trade_offers` (`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `trade_offers_offerer_idx` ON `trade_offers` (`offerer_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `wallets` (
	`player_id` text PRIMARY KEY NOT NULL,
	`tickets` integer DEFAULT 0 NOT NULL,
	`gems` integer DEFAULT 0 NOT NULL,
	`dust` integer DEFAULT 0 NOT NULL,
	`dollars` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `card_instance_skill_slots` (
	`card_instance_id` text NOT NULL,
	`slot_index` integer NOT NULL,
	`skill_card_def_id` text NOT NULL,
	PRIMARY KEY(`card_instance_id`, `slot_index`),
	FOREIGN KEY (`card_instance_id`) REFERENCES `card_instances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`skill_card_def_id`) REFERENCES `skill_card_defs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `card_instances` (
	`id` text PRIMARY KEY NOT NULL,
	`print_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`serial` integer,
	`tec_stats` text NOT NULL,
	`phy_stats` text NOT NULL,
	`men_stats` text NOT NULL,
	`position` text NOT NULL,
	`ovr` integer NOT NULL,
	`grade` text DEFAULT 'standard' NOT NULL,
	`affinity_xp` integer DEFAULT 0 NOT NULL,
	`affinity_last_active_at` integer NOT NULL,
	`matches_played` integer DEFAULT 0 NOT NULL,
	`pity_triggered` integer DEFAULT false NOT NULL,
	`obtained_at` integer NOT NULL,
	FOREIGN KEY (`print_id`) REFERENCES `card_prints`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `card_instances_owner_idx` ON `card_instances` (`id`,`owner_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `card_prints` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`edition_code` text NOT NULL,
	`rarity` text NOT NULL,
	`ref_code` text NOT NULL,
	`mint_cap` integer,
	`minted` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `card_prints_char_edition_rarity_idx` ON `card_prints` (`character_id`,`edition_code`,`rarity`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`nickname` text,
	`nation` text NOT NULL,
	`default_style` text NOT NULL,
	`default_position` text NOT NULL,
	`is_captain` integer DEFAULT false NOT NULL,
	`photo_variants` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `chemistry_pairs` (
	`instance_id_a` text NOT NULL,
	`instance_id_b` text NOT NULL,
	`matches_played_together` integer DEFAULT 0 NOT NULL,
	`chemistry_bonus` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`instance_id_a`, `instance_id_b`),
	FOREIGN KEY (`instance_id_a`) REFERENCES `card_instances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`instance_id_b`) REFERENCES `card_instances`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `skill_card_defs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`rarity` text NOT NULL,
	`effect_type` text NOT NULL,
	`stat_boost` text,
	`ability_id` text,
	`cooldown_seconds` integer,
	`icon_url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `skill_card_inventory` (
	`player_id` text NOT NULL,
	`skill_card_def_id` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`player_id`, `skill_card_def_id`),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`skill_card_def_id`) REFERENCES `skill_card_defs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `transfer_listings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`card_instance_id` text NOT NULL,
	`seller_id` text NOT NULL,
	`price_dollars` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	`buyer_id` text,
	FOREIGN KEY (`card_instance_id`) REFERENCES `card_instances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`seller_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transfer_listings_instance_status_idx` ON `transfer_listings` (`card_instance_id`,`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `transfer_sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`card_instance_id` text NOT NULL,
	`price_dollars` integer NOT NULL,
	`sold_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `lineups` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`name` text DEFAULT 'Mon équipe' NOT NULL,
	`formation_code` text DEFAULT '4-3-3' NOT NULL,
	`assignments` text NOT NULL,
	`mentality` text DEFAULT 'balanced' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `synergy_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`character_ids` text NOT NULL,
	`require_adjacent` integer DEFAULT false NOT NULL,
	`stat_boost` text,
	`ability_id` text
);
