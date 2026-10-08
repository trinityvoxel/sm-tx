-- Additive contact-form abuse protection; apply only after deployment approval.
-- Keys are salted hashes of an IP plus a 15-minute bucket, never raw addresses.
CREATE TABLE IF NOT EXISTS contact_rate_limits (
 bucket_key TEXT PRIMARY KEY,
 request_count INTEGER NOT NULL DEFAULT 1,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contact_rate_expiry ON contact_rate_limits(expires_at);
