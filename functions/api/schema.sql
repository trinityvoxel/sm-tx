-- sm-tx events table
CREATE TABLE IF NOT EXISTS events (
  id              TEXT PRIMARY KEY,
  source          TEXT NOT NULL DEFAULT 'community',
  status          TEXT NOT NULL DEFAULT 'pending',
  name            TEXT NOT NULL,
  date_start      TEXT NOT NULL,
  date_end        TEXT,
  time            TEXT,
  venue_name      TEXT NOT NULL,
  venue_address   TEXT NOT NULL,
  category        TEXT NOT NULL,
  description     TEXT,
  url             TEXT,
  cost            TEXT NOT NULL DEFAULT 'free',
  kid_friendly    INTEGER NOT NULL DEFAULT 0,
  pet_friendly    INTEGER NOT NULL DEFAULT 0,
  age_21_plus     INTEGER NOT NULL DEFAULT 0,
  submitter_name  TEXT,
  submitter_email TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- Event sources configuration
CREATE TABLE IF NOT EXISTS event_sources (
  id             TEXT PRIMARY KEY,
  type           TEXT NOT NULL,              -- 'web' | 'facebook'
  name           TEXT NOT NULL,
  url            TEXT NOT NULL,
  active         INTEGER NOT NULL DEFAULT 1, -- 1 = active, 0 = disabled
  frequency      TEXT NOT NULL DEFAULT 'daily', -- e.g. 'daily', 'weekly'
  last_scraped_at TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

-- Background jobs (logical jobs like browser_scraper, facebook_scraper)
CREATE TABLE IF NOT EXISTS jobs (
  id               TEXT PRIMARY KEY,        -- e.g. 'browser_scraper'
  description      TEXT NOT NULL,
  enabled          INTEGER NOT NULL DEFAULT 1,
  expected_interval TEXT NOT NULL,          -- e.g. '1d', '7d'
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- Job run history
CREATE TABLE IF NOT EXISTS job_runs (
  id            TEXT PRIMARY KEY,
  job_id        TEXT NOT NULL REFERENCES jobs(id),
  started_at    TEXT NOT NULL,
  finished_at   TEXT NOT NULL,
  status        TEXT NOT NULL,             -- 'success' | 'error'
  error_message TEXT,
  meta          TEXT                       -- JSON blob with counts, etc.
);

-- Key-value settings store (feature flags, toggles)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Sample approved events (San Marcos, TX)
INSERT OR IGNORE INTO events (id, source, status, name, date_start, time, venue_name, venue_address, category, description, url, cost, kid_friendly, pet_friendly, age_21_plus, created_at, updated_at) VALUES
(
  'evt-seed-001', 'scraped', 'approved',
  'Live Music Night at Cheatham Street Warehouse',
  '2026-03-07', '8:00 PM',
  'Cheatham Street Warehouse', '119 Cheatham St, San Marcos, TX 78666',
  'music',
  'An iconic Texas roadhouse hosting live singer-songwriter performances every Friday night. Cash bar, no cover charge.',
  'https://cheathamstreet.com', 'free',
  0, 0, 1,
  '2026-02-22T00:00:00.000Z', '2026-02-22T00:00:00.000Z'
),
(
  'evt-seed-002', 'scraped', 'approved',
  'San Marcos Farmers Market',
  '2026-03-14', '9:00 AM',
  'San Marcos Farmers Market', '216 W San Antonio St, San Marcos, TX 78666',
  'markets',
  'Local producers, fresh produce, artisan foods, handmade crafts, and live music every Saturday morning through spring.',
  'https://sanmarcosfarmersmarket.com', 'free',
  1, 1, 0,
  '2026-02-22T00:00:00.000Z', '2026-02-22T00:00:00.000Z'
),
(
  'evt-seed-003', 'scraped', 'approved',
  'Bobcat Run 5K — TXST Campus',
  '2026-03-21', '7:00 AM',
  'Texas State University — LBJ Student Center', '601 University Dr, San Marcos, TX 78666',
  'sports',
  'Annual 5K fun run around the TXST campus benefiting the Student Emergency Fund. Open to all ages, strollers welcome.',
  'https://recreation.txst.edu', '$25',
  1, 0, 0,
  '2026-02-22T00:00:00.000Z', '2026-02-22T00:00:00.000Z'
),
(
  'evt-seed-004', 'scraped', 'approved',
  'Cypress Creek Float & Cleanup',
  '2026-03-28', '10:00 AM',
  'Sewell Park', 'Aquarena Springs Dr, San Marcos, TX 78666',
  'outdoor',
  'Join the San Marcos River Foundation for a community paddle and riverbank cleanup on Cypress Creek. Kayaks provided, bring sunscreen.',
  'https://smriverf.org', 'free',
  1, 0, 0,
  '2026-02-22T00:00:00.000Z', '2026-02-22T00:00:00.000Z'
),
(
  'evt-seed-005', 'scraped', 'approved',
  'Viva la Veggie Art Walk',
  '2026-04-05', '6:00 PM',
  'San Marcos Arts Center', '10 River Ridge Dr, San Marcos, TX 78666',
  'arts',
  'Local artists showcase work inspired by Hill Country and river culture. Gallery reception with local food vendors and live acoustic music.',
  null, 'free',
  1, 0, 0,
  '2026-02-22T00:00:00.000Z', '2026-02-22T00:00:00.000Z'
);
