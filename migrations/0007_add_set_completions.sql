CREATE TABLE IF NOT EXISTS `set_completions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`pack_code` text NOT NULL,
	`edition` text NOT NULL,
	`completed_at` integer NOT NULL,
	`rewarded_at` integer,
	`claimed` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `set_completions_player_pack_idx` ON `set_completions` (`player_id`, `pack_code`);
