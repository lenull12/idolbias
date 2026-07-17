CREATE TABLE price_checkpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  grade TEXT NOT NULL,
  last_hour INTEGER NOT NULL,
  vol_multiplier REAL NOT NULL DEFAULT 1,
  history TEXT NOT NULL
);
CREATE UNIQUE INDEX price_checkpoints_card_grade_idx ON price_checkpoints(card_id, grade);
