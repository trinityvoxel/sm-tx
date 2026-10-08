# No-AI event collection

Prepared on the redesign branch; production has not been changed.

## Routine

GitHub Actions runs the fetch scraper daily at 11:17 UTC and browser scraper Tuesday/Friday at 11:43 UTC after these workflow changes reach the default branch. Cloudflare continues serving the site/API/D1 database. Both workflows use standard Ubuntu runners and no AI services. TZ is America/Chicago for date calculations; cron times remain UTC and shift relative to local daylight-saving time.

Sources remain configured: TXST, City Calendar, The Marc, Eventbrite, Taproom, Visit San Marcos annual/recurring pages, Visit San Marcos calendar, Downtown San Marcos, Visit San Marcos live music, Cheatham Street, Industry, Summer in the Park. No stored event is deleted when collection fails or returns no events.

Reads have one bounded retry for transient failures. Import POSTs are not blindly retried. Non-2xx/malformed import responses and caught source failures fail the workflow after usable results are processed. A job report failure also fails the workflow. Empty/seasonal sources and missing fields are review states, not automatic proof of an outage. The GitHub summary and seven-day JSON artifact show source counts, errors, missing details and up to ten review examples per source. The dashboard compares the latest two reports for a decrease of more than half from a baseline of at least ten events.

Detail recovery follows existing event URLs. JSON-LD title and occurrence date must match before enriching time/location; visible tourism time fields retain title/recurrence checks. Fetch detail recovery is bounded to 12 URLs / 90 seconds before beginning another request. Browser recovery is bounded to 40 cached URLs / three minutes before beginning another request; an in-flight request may finish after the deadline. This is deliberately partial enrichment, not a guarantee to recover every missing field. No AI/OCR dependency.

The hard-coded Taproom recurrence generator and hard-coded tourism market generator have been removed. Current dated source entries remain enabled. Existing historical/generated database rows remain untouched and still need reconciliation. Image-only schedules need organizer submissions, a public calendar feed, or occasional manual review. Never infer a new month from an old poster.

## Monitoring and occasional maintenance

Check Admin > Event sources for overdue, disabled, failed/partial, or review states. Daily jobs become overdue after 36 hours, twice-weekly jobs after five days. Legacy successful reports explicitly have unknown coverage. A last successful source collection is shown only from the five recent reports loaded by the dashboard; it does not imply every field is verified.

The dashboard reports health when opened; it is not an independent push monitor. GitHub failure notifications depend on the owner's notification preferences, which have not been changed or verified. Public GitHub schedules may be disabled after 60 days without repository activity. Check GitHub workflow state and re-enable after confirming the reason; do not add artificial commits as a workaround. A separate lightweight Cloudflare heartbeat is an option if unattended alerting is essential, but is not installed by this change.

On an empty/broken source: open its source page, verify whether there are current events, then repair the adapter or ask for a structured feed. Preserve existing content. Use workflow_dispatch with dry_run=true to validate; this suppresses imports, source upserts and remote run reports. Read the Actions summary/artifact instead. Do not use Run Now against production before release approval.

Local dry runs:

    SM_TX_REPORT_PATH=/tmp/smtx-fetch-health.json node scripts/scrape-events.js --dry-run
    SM_TX_REPORT_PATH=/tmp/smtx-browser-health.json node scripts/scrape-browser.js --dry-run

## Release blockers / boundaries

The September 30 production browser log shows a Simpleview token failure despite a green workflow. Added bounded module-readiness waiting and an error callback, and the October 7 GitHub Ubuntu dry run successfully launched Chromium and exercised all eight adapters. Three pages returned HTTP 403 (main tourism calendar, annual tourism pages, Summer in the Park); the job correctly failed rather than reporting success. An approved feed or permitted source access is needed before those adapters can be certified. Do not evade access controls. The local Mac launch restriction no longer prevents verification because the remote dry-run path is working.

Other adapters still contain historical date/year/recurrence heuristics; this hardening pass is not an all-source correctness certification. Review source counts and sample occurrences before activation. Existing import protections preserve reviewed records, but per-field source updates/cancellation reconciliation and provider occurrence-ID deduplication require further work. Existing imports are not fully reconciled by these changes.

Before production: approve release, back up D1, apply already-required approved migrations, test browser dry run on an allowed runner, verify job rows and authenticated reporting, confirm GitHub notification preferences and account usage, then separately approve deployment. No new database migration is required specifically for collection health; it uses existing job_runs.meta.

## October 7 seasonal and ticket-detail update
Summer in the Park now returns out_of_season after its verified 2026 cutoff, before any network request or source upsert. It remains paused in future years until a verified schedule is configured. The dashboard does not treat its zero count as a missing-data/volume failure. History is retained.

The latest GitHub dry run (37654952591) reports only two request failures: Visit San Marcos main/annual pages, each HTTP 403 with Access Denied title. Summer is not a failed feed. Cheatham official Eventbrite ticket links are followed by a bounded plain-fetch helper (30 URLs, 90-second start-request budget); 17/24 missing times recovered, seven unresolved. Dates and titles must match before applying a time. This supersedes earlier counts in this document.
