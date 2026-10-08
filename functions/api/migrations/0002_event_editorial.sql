-- OPTIONAL, ADDITIVE MIGRATION. Apply only after explicit production approval.
-- Imported defaults are not verification. NULL means unknown.
CREATE TABLE IF NOT EXISTS event_editorial (
 event_id TEXT PRIMARY KEY REFERENCES events(id),
 event_status TEXT CHECK(event_status IN ('scheduled','cancelled','postponed','rescheduled')),
 previous_start_date TEXT,
 schedule_verified INTEGER NOT NULL DEFAULT 0,
 location_verified INTEGER NOT NULL DEFAULT 0,
 attendance_mode TEXT CHECK(attendance_mode IN ('offline','online')),
 end_time TEXT,
 organizer_name TEXT,
 organizer_url TEXT,
 cost_verified INTEGER NOT NULL DEFAULT 0,
 price REAL,
 currency TEXT,
 source_checked_at TEXT,
 content_updated_at TEXT,
 indexable INTEGER NOT NULL DEFAULT 1,
 retain_archive INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_events_public_dates ON events(status,date_start,date_end);
