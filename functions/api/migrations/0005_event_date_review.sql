-- Additive, local first. Production requires deployment approval.
CREATE TABLE IF NOT EXISTS event_date_reviews (
 name TEXT NOT NULL, date_start TEXT NOT NULL, source_url TEXT NOT NULL DEFAULT '',
 reason TEXT NOT NULL, evidence TEXT NOT NULL, observed_at TEXT NOT NULL,
 PRIMARY KEY(name,date_start,source_url)
);
CREATE TABLE IF NOT EXISTS event_url_aliases (
 old_id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id)
);
