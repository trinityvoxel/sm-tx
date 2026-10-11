-- Reduce billed row scans for importer matching and public date windows.
CREATE INDEX IF NOT EXISTS idx_events_import_name_date_venue ON events(lower(name),date_start,lower(venue_name));
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date_start);
CREATE INDEX IF NOT EXISTS idx_events_import_review ON events(lower(name),url,date_start);
CREATE INDEX IF NOT EXISTS idx_events_effective_end ON events(status,COALESCE(NULLIF(date_end,''),date_start),date_start);
CREATE INDEX IF NOT EXISTS idx_events_source_url_name_date ON events(source,url,name,date_start);
