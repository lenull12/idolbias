ALTER TABLE owned_cards ADD COLUMN grade TEXT NOT NULL DEFAULT 'standard';
--> statement-breakpoint
DROP INDEX IF EXISTS owned_cards_player_card_idx;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS owned_cards_player_card_grade_idx ON owned_cards (player_id, card_id, grade);
