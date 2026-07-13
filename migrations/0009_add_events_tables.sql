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
CREATE TABLE IF NOT EXISTS `event_participation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` text NOT NULL,
	`player_id` text NOT NULL,
	`progress` integer NOT NULL DEFAULT 0,
	`claimed` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_participation_event_player_idx` ON `event_participation` (`event_id`, `player_id`);
