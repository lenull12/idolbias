ALTER TABLE progression ADD COLUMN daily_templates TEXT NOT NULL DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE progression ADD COLUMN weekly_templates TEXT NOT NULL DEFAULT '[]';
