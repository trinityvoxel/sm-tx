-- Additive; apply to production only with explicit deployment/database approval.
CREATE TABLE IF NOT EXISTS event_import_protection (
 event_id TEXT PRIMARY KEY REFERENCES events(id),
 reviewed_at TEXT NOT NULL
);
