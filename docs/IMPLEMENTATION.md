# SM-TX redesign — review build

Status: local implementation; not deployed. Production databases, account settings, DNS, secrets, and analytics properties have not been changed.

## Business purpose

Earn useful San Marcos search traffic and turn visitors with travel intent into qualified Riverbend Hideaway booking referrals. Event discovery builds the audience and trust. The homepage and weekend page include an early booking ribbon; details have a contextual stay panel; guides and the stay page link to the canonical booking URL. Publisher ownership is disclosed.

## Build and preview

Use Node 22.13+ (SQLite tests currently report an experimental-feature warning on the local Node runtime).

```sh
npm --prefix client ci
npm --prefix client run build
npm --prefix client test
npm --prefix client run lint
npm --prefix client run preview
```

Preview: http://127.0.0.1:8788. Uses local D1 only. Initialize a fresh local database with the CREATE TABLE statements in `functions/api/schema.sql`, excluding that file's historical sample inserts. Never import those sample events into production. The existing schema file was deliberately retained unchanged.

The preview command runs from the repository root so Pages Functions and wrangler.toml resolve together. Do not use a plain Vite static preview: public event pages require the HTML renderer and D1.

## Rendering

React is shared between server HTML and browser hydration. Public navigation uses standard links and GET forms. React Router and Helmet are no longer needed; authoritative routing and metadata now belong to the server. Original public URLs remain intact. Admin is loaded only after hydration and retains its existing APIs and session handling.

`npm run build` produces Vite browser assets, `.server/entry-server.js`, an asset manifest, static guide/trust pages, optimized river imagery, and a real 404 document. `functions/[[path]].js` handles dynamic HTML and the sitemap. More-specific existing `/api/*` handlers remain in place. `_routes.json` excludes assets, never the API routes. There is no wildcard SPA redirect.

Guide HTML is generated at build time as well as being available through the shared renderer. Currently the catch-all Function serves public page HTML, including guides; the static files are a fallback artifact, not a claim that guide requests bypass Functions. This keeps one authoritative header/redirect path but incurs function requests. Dynamic reads are uncached for correctness and immediate cancellation visibility; introduce short-lived caching only with tested invalidation and measurement.

## Explicit backend additions — not applied to production

- `0002_event_editorial.sql`: optional companion table for verified status, times, location, organizer, price, source-check date, indexing, archive retention, plus a date-query index. No existing event fields are altered. Existing records continue rendering if this table is absent.
- Authenticated `/api/editorial` and a corresponding administration form. Existing approval status remains separate from an event's occurrence status.
- `0003_contact_rate_limits.sql`: contact-form abuse protection. Salted IP/time-bucket hashes; no raw IP or message text stored. Five messages per 15-minute bucket. Old buckets are removed on later requests; without requests they remain hashed counters.
- `/api/contact`: validates messages, rejects cross-origin browser submissions, uses a honeypot and rate limiting, then calls the existing private notification service. It reports failure honestly if configuration is missing. The rate limiter uses D1 and the existing server-only API key as its salt; no unsupported Pages rate-limit binding is required.
- Notification display name changed to `SM-TX.com Admin`. Existing approval and community submission delivery flows are preserved.

These migrations require separate production approval and a database backup before application. Contact delivery requires migration 0003, the existing API_KEY, and the notifier URL/shared secret. Tests use isolated SQLite or mocks and never send real email.

## Private recipient

The user-supplied recipient is recorded only in ignored local `.dev.vars`. Set `SUBMISSION_ALERT_TO` privately on the notification worker and any direct-email environment during the separately approved launch. Do not put it in Vite variables, public documentation, HTML, schema, or client bundles. Keep `SUBMISSION_ALERT_FROM` / `APPROVAL_EMAIL_FROM` on the authenticated SM-TX.com domain; a display name is not a sender address or proof of domain authentication. Check SPF/DKIM/provider authorization and deliver a controlled test after approval. Existing approval BCC behavior is preserved.

## SEO and operational limitations

The report in the review output describes page eligibility, crawler policy, measurement, and launch checks. Optional data verification is not automatic: an importer updating a record is not evidence that an organizer confirmed it. Missing verified fields are omitted from schema. Some legacy events therefore will not qualify for Google's Event rich results until reviewed.

The source query window is 90 days, with 24 events per result page and nine on the homepage. Calendar periods are explicit. The current query implementation reads matching records before applying filters; for substantially larger volumes, move filtering/counting to SQL and split the sitemap before 50,000 URLs/50 MB. The current sitemap omits old non-retained archives but keeps their stable pages with noindex.

Contact rate limiting does not replace production WAF protection for the legacy submission or login APIs. Production bot-protection rules have not been inspected or changed.

## Rollback proven

Original commit: `857303c40679eb9c28ce884c39395d85566efd0c`.
Backup: `backup/sm-tx-before-redesign-2026-09-23`.
Working branch: `redesign/professional-ui-ux`.

A detached checkout at `../sm-tx-original` was created from the backup, verified clean, and its production build passed. The redesign tree was not overwritten.

For another recovery directory:

```sh
git worktree add --detach ../sm-tx-restored backup/sm-tx-before-redesign-2026-09-23
git -C ../sm-tx-restored rev-parse HEAD
npm --prefix ../sm-tx-restored/client ci
npm --prefix ../sm-tx-restored/client run build
```

This restores code/build output, not a database snapshot or a deployment. No database data was modified remotely. After any future approved additive migrations, a code rollback can leave the unused companion tables in place; do not drop them as part of routine rollback. A future production rollback would additionally require an explicitly approved Pages deployment rollback or deployment of the restored build.


## Approved design implementation — September 25, 2026

The public application now uses Moonlit water/turquoise, the approved mermaid as a decorative 25% background, compact Riverbend Hideaway photography, nine chronological cards, and an outlined Calendar View link. Category navigation falls back to a single select without horizontal scrolling. Existing server-rendered content, URLs, metadata and GA4 remain in place.

Admin now groups existing moderation, submission history, sources/jobs and settings into sections. An event editor supports corrections and optional import protection. Migration 0004 adds an event_import_protection table; production requires separate approval. If the table is missing, a protected save returns 503 before saving any change. Protected matching records are skipped by imports. The local preview applies this migration only after a local database backup.

Schedule extraction now takes the start of explicit time ranges, refuses ambiguous ranges, converts offset timestamps to Central Time only for matching occurrence dates, and checks Visit San Marcos detail structured data when the listing lacks a venue or time. Repeat imports can fill missing scraped-event times while preserving protected records. This does not claim every legacy time has been repaired.

Content reconciliation: every one of 3,310 IDs in the saved production snapshot remains in the local database (3,311 total, including a pre-existing local test record). Of those local records, 1,710 have no time. The local event_sources and jobs tables are empty; they are not evidence that production sources are absent. The existing scheduled workflow files were retained unchanged. A complete production source health reconciliation still requires authorized read access to source/job settings and recent runs.

Live email delivery, production bot/WAF policy, Search Console/Bing account verification and mobile visual QA remain launch checks. Browser process launch was unavailable in this execution environment; the in-app browser loaded the new homepage and its real event data. No production writes or deployments have been made.

## Permanent external-link policy
All off-domain HTTP(S) links open a new tab with noopener/noreferrer, including booking, organizer, official-event, admin-source and imported-description links. Use the shared Link component; lint disallows raw JSX anchors elsewhere. Relative and SM-TX.com links remain internal. Preserve sponsored attributes and click analytics.
