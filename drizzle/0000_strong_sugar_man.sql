CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`created_at` integer NOT NULL,
	`welcome_pack_claimed_at` integer
);
--> statement-breakpoint
CREATE TABLE `progression` (
	`player_id` text PRIMARY KEY NOT NULL,
	`streak` integer DEFAULT 0 NOT NULL,
	`last_claim` text,
	`missions_date` text NOT NULL,
	`mission_progress` text DEFAULT '{}' NOT NULL,
	`missions_claimed` text DEFAULT '[]' NOT NULL,
	`fan_xp` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`player_id` text PRIMARY KEY NOT NULL,
	`tickets` integer DEFAULT 0 NOT NULL,
	`gems` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
