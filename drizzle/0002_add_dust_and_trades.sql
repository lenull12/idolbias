ALTER TABLE wallets ADD COLUMN dust INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS trade_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offerer_id TEXT NOT NULL REFERENCES players(id),
  offered_card_id TEXT NOT NULL,
  requested_card_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  resolved_by TEXT REFERENCES players(id)
);

CREATE INDEX IF NOT EXISTS trade_offers_status_idx ON trade_offers(status);
CREATE INDEX IF NOT EXISTS trade_offers_offerer_idx ON trade_offers(offerer_id);
