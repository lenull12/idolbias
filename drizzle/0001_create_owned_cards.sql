CREATE TABLE IF NOT EXISTS owned_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL REFERENCES players(id),
  card_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  first_obtained_at INTEGER NOT NULL,
  last_obtained_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS owned_cards_player_card_idx ON owned_cards(player_id, card_id);
