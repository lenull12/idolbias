CREATE TABLE leaderboard_meta (
  id INTEGER PRIMARY KEY,
  last_computed_date TEXT NOT NULL DEFAULT ''
);

CREATE TABLE portfolio_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date_str TEXT NOT NULL,
  player_id TEXT NOT NULL,
  portfolio_value INTEGER NOT NULL
);
CREATE UNIQUE INDEX portfolio_snapshots_date_player_idx ON portfolio_snapshots(date_str, player_id);
