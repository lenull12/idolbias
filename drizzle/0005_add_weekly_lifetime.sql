ALTER TABLE progression ADD COLUMN total_logins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE progression ADD COLUMN weekly_missions_date TEXT;
ALTER TABLE progression ADD COLUMN weekly_mission_progress TEXT NOT NULL DEFAULT '{}';
ALTER TABLE progression ADD COLUMN weekly_missions_claimed TEXT NOT NULL DEFAULT '[]';
ALTER TABLE progression ADD COLUMN lifetime_progress TEXT NOT NULL DEFAULT '{}';
ALTER TABLE progression ADD COLUMN lifetime_claimed TEXT NOT NULL DEFAULT '[]';
