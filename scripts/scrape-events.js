#!/usr/bin/env node
/**
 * SM-TX Event Scraper — GitHub Actions version
 * Sources: TXST Trumba RSS, sanmarcostx.gov, themarcsm.com, Eventbrite
 * No AI required. Pure fetch + parse.
 */

const { parseCityCalendar } = require('../shared/city-calendar.cjs');
const { parseTXSTItem } = require('../shared/txst.cjs');
const { retryRead, collectSource, finishRun, postReport } = require('./collection-runtime.cjs');
const { detailBackfill, schemasFromHtml } = require('../shared/detail-fields.cjs');
const { genericVenue } = require('../shared/venue.cjs');
const { assertImportResponse } = require('../shared/collection-health.cjs');
const runErrors = [];
const sourceResults = [];
function recordError(...messages) {
  const message = messages.map(String).join(' ');
  runErrors.push(message);
  console.error(message);
}
const https = require('https');
const http = require('http');
const { URL } = require('url');

const API_KEY = process.env.SM_TX_API_KEY;
const API_ENDPOINT = process.env.SM_TX_API_ENDPOINT || 'https://sm-tx.com/api/admin/import';
const JOB_REPORT_ENDPOINT = process.env.SM_TX_JOB_REPORT || 'https://sm-tx.com/api/admin/jobs/smtx-event-scraper/runs';
const DRY_RUN = process.argv.includes('--dry-run');

if (!API_KEY && !DRY_RUN) {
  recordError('SM_TX_API_KEY is required');
  process.exit(1);
}

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
const LOOKAHEAD_MS = 90 * 24 * 60 * 60 * 1000;
const LOOKAHEAD = new Date(TODAY.getTime() + LOOKAHEAD_MS);

function todayStr() {
  return TODAY.toISOString().split('T')[0];
}

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  return d >= TODAY && d <= LOOKAHEAD;
}

function fmtDate(d) {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fetchUrl(urlStr, opts = {}) {
  return retryRead(() => fetchOnce(urlStr, opts));
}
function fetchOnce(urlStr, opts = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    if (opts.allowedHost && url.hostname !== opts.allowedHost) return reject(new Error('Domain not approved for detail redirect'));
    const client = url.protocol === 'https:' ? https : http;
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SM-TX-Scraper/1.0)',
        ...opts.headers,
      },
      timeout: 15000,
    };
    const req = client.get(options, (res) => {
      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = new URL(res.headers.location, urlStr).href;
        res.resume();
        if (redirects >= 5) return reject(new Error('Source redirect limit'));
        return fetchOnce(next, opts, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode < 200 || res.statusCode >= 300) { res.resume(); reject(new Error('Source HTTP '+res.statusCode)); return; }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ─── Source 1: TXST Trumba RSS ───────────────────────────────────────────────

async function scrapeTXST() {
  const events = [];
  console.log('[TXST] Fetching Trumba RSS...');
  try {
    const { body } = await fetchUrl('https://www.trumba.com/calendars/txstate.rss');
    const items = body.match(/<item>([\s\S]*?)<\/item>/g) || [];
    console.log(`[TXST] ${items.length} RSS items found`);

    for (const item of items) {
      const event = parseTXSTItem(item);
      if (event && (isUpcoming(event.date_start) || (event.date_start <= fmtDate(TODAY) && event.date_end >= fmtDate(TODAY)))) events.push(event);
    }

  } catch (e) {
    recordError(`[TXST] Error: ${e.message}`);
  }
  console.log(`[TXST] ${events.length} upcoming events`);
  return events;
}

// ─── Source 2: San Marcos City Calendar ──────────────────────────────────────

async function scrapeCityCalendar() {
  const events = [];
  console.log('[City] Fetching sanmarcostx.gov...');
  try {
    const { body } = await fetchUrl('https://www.sanmarcostx.gov/calendar.aspx');

    // Extract event blocks — the city site embeds events in a pattern like:
    // <span class="fc-title">Event Name</span> with nearby date info
    // Try to find JSON-LD structured data first
    const ldMatches = body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
    for (const block of ldMatches) {
      try {
        const json = JSON.parse(block.replace(/<script[^>]*>|<\/script>/g, ''));
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          if (item['@type'] !== 'Event' && item['@type'] !== 'SocialEvent') continue;
          const dateStr = item.startDate?.split('T')[0];
          if (!dateStr || !isUpcoming(dateStr)) continue;
          events.push({
            name: item.name,
            date_start: dateStr,
            date_end: item.endDate?.split('T')[0] || null,
            time: item.startDate?.includes('T') ? item.startDate.split('T')[1].slice(0,5) : null,
            venue_name: item.location?.name || 'City of San Marcos',
            venue_address: item.location?.address?.streetAddress
              ? `${item.location.address.streetAddress}, San Marcos, TX ${item.location.address.postalCode || '78666'}`
              : 'San Marcos, TX 78666',
            category: 'community',
            description: item.description?.slice(0, 400) || null,
            url: item.url || 'https://www.sanmarcostx.gov/calendar.aspx',
            cost: null,
            kid_friendly: null,
            source: 'scraped',
          });
        }
      } catch {}
    }

    if (events.length === 0) events.push(...parseCityCalendar(body).filter(e => isUpcoming(e.date_start)));

  } catch (e) {
    recordError(`[City] Error: ${e.message}`);
  }
  console.log(`[City] ${events.length} upcoming events`);
  return events;
}

// ─── Source 3: The Marc ───────────────────────────────────────────────────────

async function scrapeTheMarc() {
  const events = [];
  console.log('[Marc] Fetching themarcsm.com...');
  try {
    const { body } = await fetchUrl('https://themarcsm.com/');
    // Spacecrafted CMS embeds event data directly in homepage HTML
    const nameMatches = [...body.matchAll(/<h2 class="eventColl-eventInfo"><a href="([^"]+)">([^<]+)<\/a>/gi)];
    const monthMatches = [...body.matchAll(/<span class="eventColl-month">([^<]+)<\/span>/gi)];
    const dateMatches  = [...body.matchAll(/<span class="eventColl-date">([^<]+)<\/span>/gi)];

    const MONTHS = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,
                     jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };

    for (let i = 0; i < nameMatches.length; i++) {
      const [, href, name] = nameMatches[i];
      const month = monthMatches[i]?.[1]?.trim().toLowerCase().slice(0,3);
      const day   = parseInt(dateMatches[i]?.[1]?.trim());
      const monthNum = MONTHS[month];
      if (!name || !monthNum || !day) continue;

      let year = TODAY.getFullYear();
      const candidate = new Date(year, monthNum - 1, day);
      if (candidate < TODAY) year += 1;

      const dateStr = `${year}-${String(monthNum).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      if (!isUpcoming(dateStr)) continue;

      events.push({
        name: name.trim(),
        date_start: dateStr,
        venue_name: 'The Marc',
        venue_address: '126 N LBJ Dr, San Marcos, TX 78666',
        category: 'concert',
        url: href.startsWith('http') ? href : `https://themarcsm.com${href}`,
        cost: 'varies',
        age_21_plus: true,
        source: 'scraped',
      });
    }
  } catch (e) {
    recordError(`[Marc] Error: ${e.message}`);
  }
  console.log(`[Marc] ${events.length} upcoming events`);
  return events;
}

// ─── Source 4: Eventbrite ─────────────────────────────────────────────────────

async function scrapeEventbrite() {
  const events = [];
  console.log('[Eventbrite] Fetching...');
  try {
    const { body } = await fetchUrl('https://www.eventbrite.com/d/tx--san-marcos/events/');
    // Extract event name+URL pairs from embedded JSON blobs
    const nameUrls = [...body.matchAll(/"name":"([^"]{5,80})","url":"(https:\/\/www\.eventbrite\.com\/e\/[^"]+)"/g)];
    const seen = new Set();
    for (const [, name, url] of nameUrls) {
      if (seen.has(url)) continue;
      seen.add(url);
      // Try to find a date near this name in the HTML
      const idx = body.indexOf(name);
      const nearby = body.slice(Math.max(0, idx - 500), idx + 500);
      // Look for ISO date format
      const dateM = nearby.match(/"startDate":"(\d{4}-\d{2}-\d{2})/) ||
                    nearby.match(/"start_date":"(\d{4}-\d{2}-\d{2})/);
      const dateStr = dateM?.[1];
      if (!dateStr || !isUpcoming(dateStr)) continue;

      const timeM = nearby.match(/"startDate":"(\d{4}-\d{2}-\d{2}T(\d{2}:\d{2}))/);
      events.push({
        name,
        date_start: dateStr,
        time: timeM?.[2] || null,
        venue_name: 'San Marcos, TX',
        venue_address: 'San Marcos, TX 78666',
        category: 'community',
        url,
        cost: 'varies',
        source: 'scraped',
      });
    }
  } catch (e) {
    recordError(`[Eventbrite] Error: ${e.message}`);
  }
  console.log(`[Eventbrite] ${events.length} upcoming events`);
  return events;
}

// ─── Import to API ────────────────────────────────────────────────────────────

async function postEvents(events) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ events });
    const url = new URL(API_ENDPOINT);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SM-TX-Key': API_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('POST timeout')); });
    req.write(body);
    req.end();
  });
}

async function reportRun(started, status, summary, inserted, skipped) {
  if (!API_KEY || DRY_RUN) return;
  const body = JSON.stringify({
    started_at: started,
    finished_at: new Date().toISOString(),
    status,
    error_message: status === 'error' ? summary : null,
    meta: { inserted, skipped, summary, sources:sourceResults, errors:runErrors },
  });
  try { await postReport(JOB_REPORT_ENDPOINT, API_KEY, JSON.parse(body)); }
  catch (error) { recordError(error.message); }
}

const detailCache = new Map();
let detailDeadline = null;
async function recoverDetails(events) {
  detailDeadline ||= Date.now() + 90000;
  for (const event of events) {
    if (event.time && !genericVenue(event.venue_name)) continue;
    let url;
    try { url = new URL(event.url); } catch { continue; }
    if (!['www.sanmarcostx.gov', 'themarcsm.com', 'www.themarcsm.com', 'www.eventbrite.com'].includes(url.hostname)) continue;
    if (!detailCache.has(url.href)) {
      if (detailCache.size >= 12 || Date.now() > detailDeadline) continue;
      detailCache.set(url.href, []);
      try {
        const { body } = await fetchUrl(url.href, { allowedHost: url.hostname });
        detailCache.set(url.href, schemasFromHtml(body));
      } catch (error) { console.warn(`[Detail review] ${event.name}: ${error.message}`); }
    }
    Object.assign(event, detailBackfill(event, { schemas: detailCache.get(url.href) }));
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const started = new Date().toISOString();
  console.log(`\nSM-TX Event Scraper — ${started}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'} | Lookahead: ${fmtDate(LOOKAHEAD)}\n`);

  let totalInserted = 0, totalSkipped = 0;
  const allEvents = [];

  // Run all scrapers
  for (const [label, fn] of [
    ['TXST', scrapeTXST],
    ['City Calendar', scrapeCityCalendar],
    ['The Marc', scrapeTheMarc],
    ['Eventbrite', scrapeEventbrite],
  ]) {
    const result = await collectSource(label, async () => {
      const events = await fn();
      // RSS remains authoritative for TXST; HTML details help the other adapters.
      if (label !== 'TXST') await recoverDetails(events);
      return events;
    }, runErrors, sourceResults);
    allEvents.push(...result.events);
  }

  // Deduplicate by name+date
  const seen = new Set();
  const deduped = allEvents.filter(e => {
    const key = `${e.name?.toLowerCase().trim()}|${e.date_start}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\nTotal unique events to import: ${deduped.length}`);

  if (DRY_RUN) {
    for (const e of deduped) {
      console.log(`  [${e.date_start}] ${e.name} @ ${e.venue_name}`);
    }
    console.log(`\nDry run complete. ${deduped.length} events would be submitted.`);
    return;
  }

  if (deduped.length === 0) {
    console.log('No events to import.');
    await reportRun(started, runErrors.length ? 'error' : 'success', runErrors.join('; ') || 'No events found', 0, 0);
    return;
  }

  // Post in batches of 30
  const BATCH = 30;
  for (let i = 0; i < deduped.length; i += BATCH) {
    const batch = deduped.slice(i, i + BATCH);
    try {
      const res = await postEvents(batch);
      assertImportResponse(res);
      const ins = res.body?.inserted ?? 0;
      const skp = res.body?.skipped ?? 0;
      totalInserted += ins;
      totalSkipped += skp;
      console.log(`Batch ${Math.floor(i/BATCH)+1}: inserted ${ins}, skipped ${skp}`);
    } catch (e) {
      recordError(`Batch ${Math.floor(i/BATCH)+1} failed: ${e.message}`);
    }
  }

  const summary = `Inserted ${totalInserted}, skipped ${totalSkipped} from ${deduped.length} events across TXST, City, Marc, Eventbrite`;
  console.log(`\nDone. ${summary}`);

  await reportRun(started, runErrors.length ? 'error' : 'success', [summary,...runErrors].join('; '), totalInserted, totalSkipped);
  console.log('Collection finished; see source health report.');
}

main().catch(async (err) => {
  recordError('Fatal:', err.message);
  await reportRun(new Date().toISOString(), 'error', err.message, 0, 0).catch(() => {});
  process.exitCode = 1;
}).finally(() => finishRun(sourceResults, runErrors, DRY_RUN));
