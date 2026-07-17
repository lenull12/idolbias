CREATE TABLE market_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id TEXT NOT NULL REFERENCES players(id),
  card_id TEXT NOT NULL,
  grade TEXT NOT NULL,
  price_gems INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  buyer_id TEXT
);
CREATE INDEX market_listings_card_grade_status_idx ON market_listings(card_id, grade, status);
CREATE INDEX market_listings_seller_idx ON market_listings(seller_id);

CREATE TABLE market_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  grade TEXT NOT NULL,
  price_gems INTEGER NOT NULL,
  sold_at INTEGER NOT NULL
);
CREATE INDEX market_sales_card_grade_idx ON market_sales(card_id, grade);
