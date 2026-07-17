CREATE TABLE vendor_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date_str TEXT NOT NULL,
  slot_index INTEGER NOT NULL,
  card_id TEXT NOT NULL,
  grade TEXT NOT NULL,
  price_gems INTEGER NOT NULL,
  claimed_by_player_id TEXT,
  claimed_at INTEGER
);
CREATE UNIQUE INDEX vendor_offers_date_slot_idx ON vendor_offers(date_str, slot_index);
