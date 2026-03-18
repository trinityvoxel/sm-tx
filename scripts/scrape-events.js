#!/usr/bin/env node
/**
 * SM-TX Event Scraper — GitHub Actions version
 * Sources: TXST Trumba RSS, sanmarcostx.gov, themarcsm.com, Eventbrite
 * No AI required. Pure fetch + parse.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const API_KEY = process.env.SM_TX_API_KEY;
const API_ENDPOINT = process.env.SM_TX_API_ENDPOINT || 'https://sm-tx.com/api/admin/import';
const JOB_REPORT_ENDPOINT = process.env.SM_TX_JOB_REPORT || 'https://sm-tx.com/api/admin/jobs/smtx-event-scraper/runs';
const DRY_RUN = process.argv.includes('--dry-run');

if (!API_KEY && !DRY_RUN) {
  console.error('SM_TX_API_KEY is required');
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
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
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
        return fetchUrl(next, opts).then(resolve).catch(reject);
      }
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
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                     item.match(/<title>(.*?)<\/title>/))?.[1]?.trim();
      const desc  = (item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
                     item.match(/<description>([\s\S]*?)<\/description>/))?.[1] || '';
      const link  = item.match(/<link>(.*?)<\/link>/)?.[1]?.trim();
      if (!title) continue;

      // Extract date from description — format: "Monday, March 18, 2026" or "Ongoing through..."
      const dateMatch = desc.match(
        /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/i
      );
      if (!dateMatch) continue;

      const MONTHS = { january:1,february:2,march:3,april:4,may:5,june:6,
                       july:7,august:8,september:9,october:10,november:11,december:12 };
      const month = MONTHS[dateMatch[1].toLowerCase()];
      const day = parseInt(dateMatch[2]);
      const year = parseInt(dateMatch[3]);
      const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      if (!isUpcoming(dateStr)) continue;

      // Extract time if present
      const timeMatch = desc.match(/(\d{1,2}(?::\d{2})?(?:am|pm))/i);
      const time = timeMatch ? timeMatch[1] : null;

      // Clean description
      const cleanDesc = desc
        .replace(/<[^>]+>/g, ' ')
        .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&#\d+;/g,'')
        .replace(/\s+/g,' ').trim().slice(0, 400);

      // Classify category
      const lower = (title + ' ' + cleanDesc).toLowerCase();
      let category = 'community';
      if (/concert|music|band|perform|recital|jazz|choir/.test(lower)) category = 'music';
      else if (/sport|athlet|game|match|tournament|baseball|basketball|soccer|tennis|golf|track/.test(lower)) category = 'sports';
      else if (/exhibit|art|gallery|museum|photo/.test(lower)) category = 'arts';
      else if (/graduation|commencement|ceremony|lecture|speaker/.test(lower)) category = 'education';

      events.push({
        name: title,
        date_start: dateStr,
        time,
        venue_name: 'Texas State University',
        venue_address: '601 University Dr, San Marcos, TX 78666',
        category,
        description: cleanDesc || null,
        url: link || 'https://events.txst.edu',
        cost: 'free',
        kid_friendly: !/(21\+|alcohol|beer|wine|bar)/i.test(cleanDesc),
        source: 'scraped',
      });
    }
  } catch (e) {
    console.error(`[TXST] Error: ${e.message}`);
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
            cost: 'free',
            kid_friendly: true,
            source: 'scraped',
          });
        }
      } catch {}
    }

    // Fallback: extract from HTML event title links
    if (events.length === 0) {
      const eventLinks = [...body.matchAll(/href="([^"]*calendar[^"]*)"[^>]*>([^<]{5,80})</gi)];
      const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
      for (const [, href, name] of eventLinks.slice(0, 30)) {
        const dateM = href.match(datePattern) || body.match(datePattern);
        if (!dateM) continue;
        const dateStr = `${dateM[3]}-${dateM[1].padStart(2,'0')}-${dateM[2].padStart(2,'0')}`;
        if (!isUpcoming(dateStr)) continue;
        events.push({
          name: name.trim(),
          date_start: dateStr,
          venue_name: 'City of San Marcos',
          venue_address: 'San Marcos, TX 78666',
          category: 'community',
          url: href.startsWith('http') ? href : `https://www.sanmarcostx.gov${href}`,
          cost: 'free',
          kid_friendly: true,
          source: 'scraped',
        });
      }
    }
  } catch (e) {
    console.error(`[City] Error: ${e.message}`);
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
    console.error(`[Marc] Error: ${e.message}`);
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
    console.error(`[Eventbrite] Error: ${e.message}`);
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
  if (!API_KEY) return;
  const body = JSON.stringify({
    started_at: started,
    finished_at: new Date().toISOString(),
    status,
    error_message: status === 'error' ? summary : null,
    meta: { inserted, skipped, summary },
  });
  const url = new URL(JOB_REPORT_ENDPOINT);
  return new Promise((resolve) => {
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SM-TX-Key': API_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 10000,
    }, (res) => { res.resume(); resolve(); });
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
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
    try {
      const events = await fn();
      allEvents.push(...events);
    } catch (e) {
      console.error(`[${label}] Fatal: ${e.message}`);
    }
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
    await reportRun(started, 'success', 'No events found', 0, 0);
    return;
  }

  // Post in batches of 30
  const BATCH = 30;
  for (let i = 0; i < deduped.length; i += BATCH) {
    const batch = deduped.slice(i, i + BATCH);
    try {
      const res = await postEvents(batch);
      const ins = res.body?.inserted ?? 0;
      const skp = res.body?.skipped ?? 0;
      totalInserted += ins;
      totalSkipped += skp;
      console.log(`Batch ${Math.floor(i/BATCH)+1}: inserted ${ins}, skipped ${skp}`);
    } catch (e) {
      console.error(`Batch ${Math.floor(i/BATCH)+1} failed: ${e.message}`);
    }
  }

  const summary = `Inserted ${totalInserted}, skipped ${totalSkipped} from ${deduped.length} events across TXST, City, Marc, Eventbrite`;
  console.log(`\nDone. ${summary}`);

  await reportRun(started, 'success', summary, totalInserted, totalSkipped);
  console.log('Run reported to dashboard.');
}

main().catch(async (err) => {
  console.error('Fatal:', err.message);
  await reportRun(new Date().toISOString(), 'error', err.message, 0, 0).catch(() => {});
  process.exit(1);
});
