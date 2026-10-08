-- Reviewed repair for existing imports. Run locally first.
-- Production execution requires the separate release approval and a database backup.
UPDATE events
SET venue_name = 'Wake the Dead Coffee House',
    venue_address = '1432 Old Ranch Road 12, San Marcos, TX 78666',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE source = 'scraped'
  AND name = 'Laughing Dead Comedy Open Mic'
  AND lower(trim(venue_name)) IN ('san marcos', 'san marcos, tx', 'san marcos, texas')
  AND lower(description) LIKE '%at wake the dead coffee house%';
