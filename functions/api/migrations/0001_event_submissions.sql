CREATE TABLE IF NOT EXISTS event_submissions (
  id                         TEXT PRIMARY KEY,
  event_id                   TEXT NOT NULL UNIQUE,
  event_name                 TEXT NOT NULL,
  submitter_name             TEXT NOT NULL,
  submitter_email            TEXT NOT NULL,
  submitter_email_normalized TEXT NOT NULL,
  status                     TEXT NOT NULL DEFAULT 'pending',
  submitted_at               TEXT NOT NULL,
  reviewed_at                TEXT,
  approval_email_status      TEXT NOT NULL DEFAULT 'pending_review',
  approval_email_sent_at     TEXT,
  approval_email_error       TEXT
);

CREATE INDEX IF NOT EXISTS idx_event_submissions_email
  ON event_submissions(submitter_email_normalized);
CREATE INDEX IF NOT EXISTS idx_event_submissions_submitted
  ON event_submissions(submitted_at DESC);

-- Preserve existing community submitter data before removing the duplicate PII
-- from event rows. Previously rejected rows were hard-deleted and cannot be
-- reconstructed.
INSERT OR IGNORE INTO event_submissions (
  id, event_id, event_name, submitter_name, submitter_email,
  submitter_email_normalized, status, submitted_at, reviewed_at,
  approval_email_status
)
SELECT
  'legacy-' || id,
  id,
  name,
  COALESCE(submitter_name, 'Unknown'),
  submitter_email,
  lower(trim(submitter_email)),
  status,
  created_at,
  CASE WHEN status IN ('approved', 'rejected') THEN updated_at ELSE NULL END,
  CASE WHEN status = 'approved' THEN 'not_sent_legacy' ELSE 'pending_review' END
FROM events
WHERE submitter_email IS NOT NULL AND trim(submitter_email) != '';

UPDATE events
SET submitter_name = NULL,
    submitter_email = NULL
WHERE submitter_name IS NOT NULL OR submitter_email IS NOT NULL;
