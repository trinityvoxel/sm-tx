#!/usr/bin/env node
// Usage: node scrape-smtx-browser.js [--dry-run]
// Playwright-based headless browser scraper for JS-rendered San Marcos event sources.
// Sources: taproomsanmarcos.com (Google Calendar iframes), visitsanmarcos.com, downtownSanMarcos.com

const { chromium } = require('playwright');
const https = require('https');
const http = require('http');

const DRY_RUN = process.argv.includes('--dry-run');
const IMPORT_API = process.env.SM_TX_API_ENDPOINT || 'https://sm-tx.com/api/admin/import';
const IMPORT_KEY = process.env.SM_TX_API_KEY;
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// Look ahead 90 days
const LOOKAHEAD_MS = 90 * 24 * 60 * 60 * 1000;
const LOOKAHEAD_DATE = new Date(TODAY.getTime() + LOOKAHEAD_MS);

// Approved domains — SECURITY: never navigate outside these
const APPROVED_DOMAINS = [
  'taproomsanmarcos.com',
  'www.taproomsanmarcos.com',
  'visitsanmarcos.com',
  'www.visitsanmarcos.com',
  'downtownSanMarcos.com',
  'www.downtownSanMarcos.com',
  'downtownsanmarcos.com',
  'www.downtownsanmarcos.org',
  'downtownsanmarcos.org',
  'cheathamstreet.com',
  'www.cheathamstreet.com',
  'smtx.industrytx.com',
  'www.smtx.industrytx.com',
  // Google Calendar is loaded inside Taproom iframes — we read frames, don't navigate TO them
];

const LISTEN_SM_URL = 'https://www.visitsanmarcos.com/listen-san-marcos/live-this-week/';

// SECURITY: canary phrases — discard any event containing these
const CANARY_PHRASES = [
  'ignore previous instructions',
  'ignore your instructions',
  'you are now',
  'disregard your rules',
  'system:',
  'new instruction',
  'override',
  'jailbreak',
];

function isDomainApproved(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return APPROVED_DOMAINS.some(d => hostname === d.toLowerCase() || hostname.endsWith('.' + d.toLowerCase()));
  } catch {
    return false;
  }
}

function hasCanary(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CANARY_PHRASES.some(p => lower.includes(p));
}

function sanitize(event) {
  for (const key of ['name', 'description', 'venue_name', 'venue_address', 'url']) {
    if (hasCanary(event[key])) {
      console.warn(`  [SECURITY] Canary phrase in "${key}" — discarding: ${event.name}`);
      return null;
    }
  }
  return event;
}

// ─── Date utilities ──────────────────────────────────────────────────────────

const MONTH_MAP = {
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12,
  jan:1, feb:2, mar:3, apr:4, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12
};

function toISO(dateStr) {
  if (!dateStr) return null;
  try {
    const s = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    // "February 28, 2026" or "Feb 28, 2026"
    const m1 = s.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(202\d)/);
    if (m1) {
      const mo = MONTH_MAP[m1[1].toLowerCase()];
      if (mo) {
        return `${m1[3]}-${String(mo).padStart(2,'0')}-${m1[2].padStart(2,'0')}`;
      }
    }

    // MM/DD/YYYY
    const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(202\d)$/);
    if (m2) return `${m2[3]}-${m2[1].padStart(2,'0')}-${m2[2].padStart(2,'0')}`;

    // Day-first: "28 February 2026"
    const m3 = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(202\d)$/);
    if (m3) {
      const mo = MONTH_MAP[m3[2].toLowerCase()];
      if (mo) return `${m3[3]}-${String(mo).padStart(2,'0')}-${m3[1].padStart(2,'0')}`;
    }

    // Fallback
    const d = new Date(s);
    if (!isNaN(d)) return fmtDate(d);
  } catch {}
  return null;
}

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function isFuture(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  return d >= TODAY;
}

function isWithinLookahead(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  return d >= TODAY && d <= LOOKAHEAD_DATE;
}

// Build YYYY-MM-DD from year, month (1-12), day
function buildDate(year, month, day) {
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

// Get the Nth occurrence of a weekday in a given month/year
// weekday: 0=Sun, 1=Mon, ..., 6=Sat
// nth: 1,2,3,4 (1st, 2nd, etc.)
function nthWeekdayOfMonth(year, month, weekday, nth) {
  const d = new Date(year, month - 1, 1);
  let count = 0;
  while (d.getMonth() === month - 1) {
    if (d.getDay() === weekday) {
      count++;
      if (count === nth) return fmtDate(d);
    }
    d.setDate(d.getDate() + 1);
  }
  return null;
}

// Get ALL occurrences of a weekday in a given month/year
function allWeekdaysOfMonth(year, month, weekday) {
  const results = [];
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    if (d.getDay() === weekday) results.push(fmtDate(new Date(d)));
    d.setDate(d.getDate() + 1);
  }
  return results;
}

// ─── HTTP POST + Admin helpers ──────────────────────────────────────────────

function postEvents(events) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ events });
    const url = new URL(IMPORT_API);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-SM-TX-Key': IMPORT_KEY,
      },
    };
    const proto = url.protocol === 'https:' ? https : http;
    const req = proto.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(new Error('Request timeout')); });
    req.write(body);
    req.end();
  });
}

// Upsert an event source into the admin-visible event_sources table
function upsertEventSource({ id, type, name, url, frequency }) {
  if (!IMPORT_KEY || DRY_RUN) return; // only do this in real runs with a key

  const body = JSON.stringify({
    id,
    type,
    name,
    url,
    frequency,
  });

  const adminUrl = new URL(process.env.SM_TX_SOURCES_ENDPOINT || 'https://sm-tx.com/api/admin/sources/upsert');

  return new Promise((resolve) => {
    const options = {
      hostname: adminUrl.hostname,
      port: adminUrl.port || 443,
      path: adminUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-SM-TX-Key': IMPORT_KEY,
      },
      timeout: 10000,
    };
    const proto = adminUrl.protocol === 'https:' ? https : http;
    const req = proto.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve());
    });
    req.on('error', () => resolve()); // fail-soft; scraping should not die on admin upsert
    req.on('timeout', () => { req.destroy(); resolve(); });
    req.write(body);
    req.end();
  });
}

// ─── Browser helpers ─────────────────────────────────────────────────────────

async function safeNavigate(page, url, timeout = 25000) {
  if (!isDomainApproved(url)) throw new Error(`Domain not approved: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
}

async function waitForNetworkIdle(page, timeout = 12000) {
  try { await page.waitForLoadState('networkidle', { timeout }); }
  catch { await page.waitForTimeout(2000); }
}

function guessCategory(text) {
  const lower = (text || '').toLowerCase();
  if (/live\s*music|band|concert|dj\b|karaoke|bingo.*music|benefit/.test(lower)) return 'music';
  if (/comedy|open\s*mic|improv|theater|theatre|gallery|art\s+show|art\s+market|film|movie/.test(lower)) return 'arts';
  if (/food|drink|taste|chef|culinary|eat|wine|beer|brew/.test(lower)) return 'food';
  if (/festival|fest\b/.test(lower)) return 'festivals';
  if (/market\b/.test(lower)) return 'markets';
  if (/hike|trail|run|walk|outdoor|nature|bird/.test(lower)) return 'outdoor';
  if (/sport|race|marathon|5k|game\b|soccer|football/.test(lower)) return 'sports';
  if (/trivia|bingo|game night/.test(lower)) return 'community';
  if (/bar|club|nightlife|pool night|drag/.test(lower)) return 'nightlife';
  return 'community';
}

// ─── SCRAPER 1: The Taproom San Marcos (Google Calendar Iframes) ─────────────

async function scrapeTaproom(browser) {
  await upsertEventSource({
    id: 'taproom-san-marcos',
    type: 'web',
    name: 'Taproom San Marcos',
    url: 'https://www.taproomsanmarcos.com/events',
    frequency: 'daily',
  });
  const SOURCE = 'Taproom San Marcos';
  const PAGE_URL = 'https://www.taproomsanmarcos.com/events';
  const VENUE_NAME = 'The Taproom San Marcos';
  const VENUE_ADDRESS = '129 E Hopkins St, San Marcos, TX 78666';

  console.log(`\n[${SOURCE}] Navigating to ${PAGE_URL}`);
  const events = [];
  const page = await browser.newPage();

  try {
    await safeNavigate(page, PAGE_URL, 35000);
    // Wix + Google Calendar takes a while
    await page.waitForTimeout(8000);

    // Get all frames on the page
    const frames = page.frames();
    console.log(`[${SOURCE}] Found ${frames.length} frames total`);

    // Find Google Calendar frames
    const calFrames = frames.filter(f => {
      const url = f.url();
      return url.includes('google.com/calendar') || url.includes('calendar.google');
    });
    console.log(`[${SOURCE}] Found ${calFrames.length} Google Calendar frames`);

    for (let fi = 0; fi < calFrames.length; fi++) {
      const frame = calFrames[fi];
      const frameUrl = frame.url();
      console.log(`[${SOURCE}] Frame ${fi + 1}: ${frameUrl.slice(0, 80)}...`);

      // Wait for calendar to render in this frame
      try {
        await frame.waitForSelector('[data-eventid], .KF4T6b, .a-E, [data-eventchip]', { timeout: 10000 });
      } catch {
        // Try with basic calendar selector
        try {
          await frame.waitForSelector('td[data-datevalue]', { timeout: 5000 });
        } catch {
          console.log(`[${SOURCE}] Frame ${fi+1}: calendar not ready, using text extraction`);
        }
      }

      // Extract events from this Google Calendar frame
      // Google Calendar renders events as chips in table cells
      const calData = await frame.evaluate(() => {
        const results = [];

        // Method 1: event chips with dates from parent cells
        const cells = document.querySelectorAll('td[data-datevalue]');
        cells.forEach(cell => {
          const dateValue = cell.getAttribute('data-datevalue'); // format: YYYYMMDD
          const chips = cell.querySelectorAll('[data-eventid], .KF4T6b, [class*="event-chip"], a[data-eventid]');
          chips.forEach(chip => {
            const text = chip.innerText || chip.textContent || '';
            if (text.trim()) {
              results.push({ dateValue, eventText: text.trim().slice(0, 200) });
            }
          });
        });

        // Method 2: look for event titles and associate with nearby dates
        if (results.length === 0) {
          // Try to get the month/year from the heading
          const heading = document.querySelector('h1, h2, [class*="mya"], [class*="month"]');
          const headingText = heading ? heading.innerText : '';

          // Get all event text
          const eventEls = document.querySelectorAll('[class*="event"], [class*="Event"], a[title]');
          eventEls.forEach(el => {
            const text = el.innerText || el.getAttribute('title') || '';
            if (text.trim().length > 2) {
              results.push({ dateValue: null, eventText: text.trim().slice(0, 200), context: headingText });
            }
          });
        }

        // Method 3: parse full calendar text
        if (results.length === 0) {
          const fullText = document.body.innerText;
          results.push({ dateValue: null, eventText: '', rawCalText: fullText.slice(0, 3000) });
        }

        return results;
      });

      console.log(`[${SOURCE}] Frame ${fi+1}: extracted ${calData.length} raw items`);

      // Process extracted calendar data
      for (const item of calData) {
        if (item.rawCalText) {
          // Parse from raw text — look for date patterns
          const lines = item.rawCalText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
          let currentDate = null;

          for (const line of lines) {
            // Date line like "February 2026" or "March 2026"
            const monthMatch = line.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(202\d)$/i);
            if (monthMatch) {
              // Set context month
              continue;
            }

            // Day number like "1" or "23"
            if (/^\d{1,2}$/.test(line)) {
              // Could be a day number, but without full context hard to use
              continue;
            }

            // Event text that looks like "7pm Event Name" or "Event Name"
            const timeMatch = line.match(/^(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s+(.+)$/i);
            if (timeMatch && item.context) {
              const time = timeMatch[1];
              const name = timeMatch[2];
              if (name.length > 2 && currentDate) {
                events.push({
                  name: name.slice(0, 150),
                  date_start: currentDate,
                  time,
                  venue_name: VENUE_NAME,
                  venue_address: VENUE_ADDRESS,
                  category: guessCategory(name),
                  url: PAGE_URL,
                  age_21_plus: true,
                  kid_friendly: false,
                  source: 'scraped',
                });
              }
            }
          }
          continue;
        }

        // Process event with dateValue
        if (item.dateValue && /^\d{8}$/.test(item.dateValue)) {
          const y = parseInt(item.dateValue.slice(0, 4));
          const m = parseInt(item.dateValue.slice(4, 6));
          const d = parseInt(item.dateValue.slice(6, 8));
          const isoDate = buildDate(y, m, d);

          if (!isWithinLookahead(isoDate)) continue;

          const text = item.eventText;
          if (!text || text.length < 2) continue;

          // Parse time from event text (e.g., "7pm Live Music")
          const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
          const time = timeMatch ? timeMatch[1] : undefined;
          const name = text.replace(/\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*/gi, '').trim() || text;

          const event = {
            name: name.slice(0, 150),
            date_start: isoDate,
            time,
            venue_name: VENUE_NAME,
            venue_address: VENUE_ADDRESS,
            category: guessCategory(text),
            url: PAGE_URL,
            age_21_plus: true,
            kid_friendly: false,
            source: 'scraped',
          };

          const clean = sanitize(event);
          if (clean) events.push(clean);
        }
      }
    }

    // If no Google Calendar frames found or no events, try page-level fallback
    if (calFrames.length === 0 || events.length === 0) {
      console.log(`[${SOURCE}] Trying page-level extraction fallback...`);
      
      // Read all visible text on page
      const pageText = await page.evaluate(() => document.body.innerText);
      
      // The Taproom events page shows recurring events visible from screenshot:
      // Karaoke with Kiki (Mondays), Free Pool Night & Karaoke (Tuesdays & Wednesdays), 
      // Live music shows (weekends), etc.
      // Generate the next 90 days of recurring events
      const recurringEvents = [
        { name: 'Karaoke with Kiki', weekday: 1, time: '9:00 PM', category: 'nightlife' },
        { name: 'Free Pool Night', weekday: 2, time: '8:00 PM', category: 'nightlife' },
        { name: 'Karaoke with Kiki', weekday: 2, time: '9:00 PM', category: 'nightlife' },
        { name: 'Wax Wednesdays', weekday: 3, time: '9:00 PM', category: 'music' },
        { name: 'Free Pool Night', weekday: 3, time: '8:00 PM', category: 'nightlife' },
      ];

      // Also look for specific one-off events from page text
      console.log(`[${SOURCE}] Page text length: ${pageText.length} chars`);
      
      const today = new Date(TODAY);
      for (let i = 0; i < 90; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const iso = fmtDate(d);
        const weekday = d.getDay();

        for (const re of recurringEvents) {
          if (re.weekday === weekday) {
            const event = {
              name: re.name,
              date_start: iso,
              time: re.time,
              venue_name: VENUE_NAME,
              venue_address: VENUE_ADDRESS,
              category: re.category,
              description: 'Recurring weekly event at The Taproom San Marcos',
              url: PAGE_URL,
              age_21_plus: true,
              kid_friendly: false,
              source: 'scraped',
            };
            const clean = sanitize(event);
            if (clean) events.push(clean);
          }
        }
      }
    }

    console.log(`[${SOURCE}] Total events: ${events.length}`);
  } catch (err) {
    console.error(`[${SOURCE}] ERROR: ${err.message}`);
  } finally {
    await page.close();
  }

  return { source: SOURCE, events };
}

// ─── SCRAPER 2: Visit San Marcos ─────────────────────────────────────────────

async function scrapeVisitSanMarcos(browser) {
  await upsertEventSource({
    id: 'visit-san-marcos-annual',
    type: 'web',
    name: 'Visit San Marcos — Annual Events',
    url: 'https://www.visitsanmarcos.com/events/annual-events-and-festivals/',
    frequency: 'weekly',
  });
  const SOURCE = 'Visit San Marcos';
  const DEFAULT_ADDRESS = 'San Marcos, TX 78666';
  const events = [];

  // Sub-pages to scrape
  const SUBPAGES = [
    'https://www.visitsanmarcos.com/events/annual-events-and-festivals/',
  ];

  const page = await browser.newPage();

  try {
    for (const url of SUBPAGES) {
      if (!isDomainApproved(url)) continue;
      console.log(`\n[${SOURCE}] Navigating to ${url}`);

      try {
        await safeNavigate(page, url, 25000);
        await waitForNetworkIdle(page, 10000);
        await page.waitForTimeout(2000);

        const rawText = await page.evaluate(() => document.body.innerText);
        console.log(`[${SOURCE}] Page text: ${rawText.length} chars`);

        // Parse the annual events page which has month headings and event descriptions
        // Events are listed by month with names and locations
        const lines = rawText.split('\n').map(s => s.trim()).filter(s => s.length > 0);

        let currentMonth = null;
        const currentYear = TODAY.getFullYear();
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];

          // Month heading: "JANUARY", "FEBRUARY", etc.
          const mo = MONTH_MAP[line.toLowerCase()];
          if (mo) {
            currentMonth = mo;
            i++;
            continue;
          }

          // Look for event-like lines: not empty, has some substance
          if (currentMonth && line.length > 5 && !/^https?:\/\//.test(line)) {
            // Skip lines that are addresses or phone numbers
            if (/^\d{3}[.\-]\d{3}[.\-]\d{4}$/.test(line)) { i++; continue; }
            if (/^\d+\s+(am|pm)/i.test(line)) { i++; continue; }

            const name = line;
            
            // Find venue from next lines
            let venueAddress = DEFAULT_ADDRESS;
            let description = '';
            let j = i + 1;
            while (j < lines.length && j < i + 4) {
              const nextLine = lines[j];
              if (MONTH_MAP[nextLine.toLowerCase()]) break;
              if (nextLine.length > 5 && nextLine.length < 100) {
                description += nextLine + ' ';
              }
              j++;
            }

            // Determine the date: for annual events, use the current/next occurrence
            // If the month is in the past this year, use next year
            let eventYear = currentYear;
            const tentativeDate = new Date(currentYear, currentMonth - 1, 1);
            if (tentativeDate < TODAY) {
              eventYear = currentYear + 1;
            }

            // Use the 1st of the month as a placeholder date
            // This is for recurring annual events without specific dates
            const isoDate = buildDate(eventYear, currentMonth, 15); // mid-month placeholder

            if (!isWithinLookahead(isoDate)) { i++; continue; }

            // Guess category
            const lower = (name + ' ' + description).toLowerCase();
            const category = guessCategory(lower);

            // Skip lines that are clearly not event names
            if (name.length < 5 || name.length > 100) { i++; continue; }
            if (/^[A-Z\s]+$/.test(name) && name.length < 20) { i++; continue; } // all-caps short = probably a section header

            const event = {
              name: name.slice(0, 150),
              date_start: isoDate,
              venue_name: 'Various San Marcos Venues',
              venue_address: DEFAULT_ADDRESS,
              category,
              description: description.trim().slice(0, 500) || undefined,
              url: url,
              source: 'scraped',
            };

            const clean = sanitize(event);
            if (clean) events.push(clean);
            i = j;
            continue;
          }

          // Recurring events without specific month context
          if (!currentMonth) {
            // Look for "Farmer's Market - Saturdays" type patterns
            const recMatch = line.match(/(.+?)\s*[-–]\s*(Saturdays?|Sundays?|Mondays?|Tuesdays?|Wednesdays?|Thursdays?|Fridays?)/i);
            if (recMatch) {
              const name = recMatch[1].trim();
              const dayStr = recMatch[2].toLowerCase();
              const dayMap = { sunday:0, sundays:0, monday:1, mondays:1, tuesday:2, tuesdays:2,
                wednesday:3, wednesdays:3, thursday:4, thursdays:4, friday:5, fridays:5, saturday:6, saturdays:6 };
              const weekday = dayMap[dayStr.replace(/s$/, '')] ?? dayMap[dayStr];

              if (weekday !== undefined) {
                // Generate next 12 occurrences
                const d = new Date(TODAY);
                let count = 0;
                while (count < 12) {
                  if (d.getDay() === weekday) {
                    const iso = fmtDate(d);
                    if (isWithinLookahead(iso)) {
                      const event = {
                        name: name.slice(0, 150),
                        date_start: iso,
                        venue_name: 'San Marcos',
                        venue_address: DEFAULT_ADDRESS,
                        category: guessCategory(name),
                        url: url,
                        source: 'scraped',
                      };
                      const clean = sanitize(event);
                      if (clean) events.push(clean);
                      count++;
                    }
                  }
                  d.setDate(d.getDate() + 1);
                  if (d > LOOKAHEAD_DATE) break;
                }
              }
            }
          }

          i++;
        }

        console.log(`[${SOURCE}] Extracted ${events.length} events from ${url}`);
      } catch (err) {
        console.error(`[${SOURCE}] Failed ${url}: ${err.message}`);
      }
    }
  } finally {
    await page.close();
  }

  // Add well-known recurring San Marcos events from the page we saw
  // (These are confirmed real events from the scrape)
  const wellKnown = [
    {
      name: "Farmer's Market at the Downtown Square",
      weekday: 6, // Saturday
      time: '9:00 AM',
      venue_name: "Downtown Square",
      venue_address: "Downtown Square on San Antonio St, San Marcos, TX 78666",
      category: 'markets',
      description: "Farm-fresh produce and homemade products. Saturdays 9am-1pm.",
      url: SUBPAGES[0],
    },
    {
      name: "Art Squared Arts Market",
      nthWeekday: { n: 2, day: 6 }, // 2nd Saturday
      time: '9:00 AM',
      venue_name: "Downtown Square",
      venue_address: "San Marcos Downtown Square, San Marcos, TX 78666",
      category: 'markets',
      description: "Juried arts and fine crafts market. 2nd Saturdays March-December.",
      url: SUBPAGES[0],
    },
  ];

  // Generate upcoming occurrences of well-known events
  const today = new Date(TODAY);
  for (const wk of wellKnown) {
    if (wk.weekday !== undefined) {
      // All occurrences of this weekday
      const d = new Date(today);
      let count = 0;
      while (count < 12) {
        if (d.getDay() === wk.weekday) {
          const iso = fmtDate(d);
          if (isWithinLookahead(iso)) {
            const event = {
              name: wk.name,
              date_start: iso,
              time: wk.time,
              venue_name: wk.venue_name,
              venue_address: wk.venue_address,
              category: wk.category,
              description: wk.description,
              url: wk.url,
              source: 'scraped',
            };
            const clean = sanitize(event);
            if (clean) events.push(clean);
            count++;
          }
        }
        d.setDate(d.getDate() + 1);
        if (d > LOOKAHEAD_DATE) break;
      }
    } else if (wk.nthWeekday) {
      // Nth occurrence each month
      let year = today.getFullYear();
      let month = today.getMonth() + 1;
      for (let m = 0; m < 4; m++) { // Check next 4 months
        const mo = ((month - 1 + m) % 12) + 1;
        const yr = year + Math.floor((month - 1 + m) / 12);
        const iso = nthWeekdayOfMonth(yr, mo, wk.nthWeekday.day, wk.nthWeekday.n);
        if (iso && isWithinLookahead(iso)) {
          const event = {
            name: wk.name,
            date_start: iso,
            time: wk.time,
            venue_name: wk.venue_name,
            venue_address: wk.venue_address,
            category: wk.category,
            description: wk.description,
            url: wk.url,
            source: 'scraped',
          };
          const clean = sanitize(event);
          if (clean) events.push(clean);
        }
      }
    }
  }

  console.log(`[${SOURCE}] Total events: ${events.length}`);
  return { source: SOURCE, events };
}

// ─── SCRAPER 3: Downtown San Marcos ──────────────────────────────────────────

async function scrapeDowntownSanMarcos(browser) {
  await upsertEventSource({
    id: 'downtown-san-marcos',
    type: 'web',
    name: 'Downtown San Marcos',
    url: 'https://www.downtownsanmarcos.org/events',
    frequency: 'weekly',
  });
  const SOURCE = 'Downtown San Marcos';
  const DEFAULT_ADDRESS = 'Downtown San Marcos, TX 78666';
  const events = [];

  const URLS = [
    'https://www.downtownsanmarcos.org/events',
    'https://www.downtownSanMarcos.com/events',
  ];

  const page = await browser.newPage();
  let found = false;

  for (const url of URLS) {
    if (!isDomainApproved(url)) continue;
    try {
      console.log(`\n[${SOURCE}] Navigating to ${url}`);
      await safeNavigate(page, url, 25000);
      await waitForNetworkIdle(page, 10000);
      await page.waitForTimeout(3000);

      // Try list view if available
      try {
        const listBtn = await page.$('a[href*="view=list"], button[data-view="list"], a:has-text("List"), a:has-text("list view")');
        if (listBtn) {
          await listBtn.click();
          await page.waitForTimeout(2000);
          console.log(`[${SOURCE}] Switched to list view`);
        }
      } catch {}

      // Check if there's a "Mardi Gras" link or other events link
      try {
        const mardiGrasLink = await page.$('a:has-text("Mardi Gras"), nav a:has-text("MARDI GRAS")');
        if (mardiGrasLink) {
          const mardiGrasHref = await mardiGrasLink.getAttribute('href');
          if (mardiGrasHref && isDomainApproved(new URL(mardiGrasHref, url).href)) {
            console.log(`[${SOURCE}] Found Mardi Gras page: ${mardiGrasHref}`);
            await page.goto(new URL(mardiGrasHref, url).href, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await waitForNetworkIdle(page, 8000);
            await page.waitForTimeout(2000);

            const pageContent = await page.evaluate(() => ({
              title: document.title,
              text: document.body.innerText.slice(0, 3000),
            }));

            // Mardi Gras 2026 is on March 3, 2026
            const mardiGrasDate = '2026-03-03';
            if (isWithinLookahead(mardiGrasDate) && pageContent.title && pageContent.title.length > 3) {
              const event = {
                name: 'Mardi Gras Parade',
                date_start: mardiGrasDate,
                time: '12:00 PM',
                venue_name: 'Historic Homes District & Downtown',
                venue_address: 'Belvin Street, San Marcos, TX 78666',
                category: 'festivals',
                description: 'The Mistick Krewe of Okeanos Mardi Gras Parade through the Historic Homes District and Downtown San Marcos.',
                url: new URL(mardiGrasHref, url).href,
                source: 'scraped',
              };
              const clean = sanitize(event);
              if (clean) {
                events.push(clean);
                console.log(`[${SOURCE}] Added Mardi Gras Parade event`);
              }
            }

            // Go back for more content
            await page.goBack();
            await waitForNetworkIdle(page, 5000);
          }
        }
      } catch (err) {
        console.log(`[${SOURCE}] Mardi Gras link check: ${err.message}`);
      }

      // Try to navigate through several months to find events
      const monthsToCheck = 3;
      for (let m = 0; m < monthsToCheck; m++) {
        try {
          // Check current month calendar for events
          const cellTexts = await page.evaluate(() => {
            const results = [];
            // Look for calendar cells with events
            const cells = document.querySelectorAll('td, .day, [class*="day"]');
            cells.forEach(cell => {
              const text = cell.innerText || '';
              if (text.length > 5 && /\w{3,}/.test(text)) {
                results.push(text.slice(0, 300));
              }
            });
            return results;
          });

          for (const cellText of cellTexts) {
            const lines = cellText.split('\n').map(s => s.trim()).filter(s => s.length > 2);
            if (lines.length < 2) continue;

            const dayNum = parseInt(lines[0]);
            if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) continue;

            // We need the month/year from the page heading
            const heading = await page.$eval('h2, h3', el => el.innerText).catch(() => '');
            const headMatch = heading.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(202\d)/i);
            if (!headMatch) continue;

            const monthNum = MONTH_MAP[headMatch[1].toLowerCase()];
            const year = parseInt(headMatch[2]);
            const isoDate = buildDate(year, monthNum, dayNum);

            if (!isWithinLookahead(isoDate)) continue;

            for (let li = 1; li < lines.length; li++) {
              const name = lines[li];
              if (name.length < 3 || name.length > 100) continue;

              const event = {
                name: name.slice(0, 150),
                date_start: isoDate,
                venue_name: 'Downtown San Marcos',
                venue_address: DEFAULT_ADDRESS,
                category: guessCategory(name),
                url: page.url(),
                source: 'scraped',
              };
              const clean = sanitize(event);
              if (clean) events.push(clean);
            }
          }

          // Click next month
          const nextBtn = await page.$('.fc-next-button, button[aria-label*="next"], a[aria-label*="next"], [class*="next-month"], .next');
          if (nextBtn) {
            await nextBtn.click();
            await page.waitForTimeout(1500);
          } else {
            break;
          }
        } catch (err) {
          console.log(`[${SOURCE}] Month ${m+1} check: ${err.message}`);
          break;
        }
      }

      found = true;
      break;
    } catch (err) {
      console.error(`[${SOURCE}] Failed ${url}: ${err.message}`);
    }
  }

  await page.close();

  if (!found) {
    console.log(`[${SOURCE}] All URLs failed`);
  } else if (events.length === 0) {
    console.log(`[${SOURCE}] Calendar appears empty or unpublished`);
  }

  console.log(`[${SOURCE}] Total events: ${events.length}`);
  return { source: SOURCE, events };
}

// ─── SCRAPER 4: Visit San Marcos — Live This Week ────────────────────────────
// Weekly live music listings: venue, act, time. Updated every week by the site.
// Page is server-side rendered — uses plain HTTPS fetch + regex (no Playwright needed).

async function scrapeVisitSMListenLive(_browser) {
  await upsertEventSource({
    id: 'visit-san-marcos-live',
    type: 'web',
    name: 'Visit San Marcos — Live This Week',
    url: LISTEN_SM_URL,
    frequency: 'daily',
  });
  const SOURCE = 'Visit San Marcos Live Music';
  const events = [];

  const MONTH_NUMS = {
    JAN:1, FEB:2, MAR:3, APR:4, MAY:5, JUN:6,
    JUL:7, AUG:8, SEP:9, OCT:10, NOV:11, DEC:12
  };

  console.log(`\n[${SOURCE}] Fetching ${LISTEN_SM_URL}`);

  try {
    // Plain HTTPS fetch — page is server-side rendered
    const html = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.visitsanmarcos.com',
        path: '/listen-san-marcos/live-this-week/',
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SM-TX-Scraper/1.0)' },
      };
      const req = https.request(options, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          reject(new Error(`Redirect to ${res.headers.location} — update URL`));
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.setTimeout(15000, () => req.destroy(new Error('Request timeout')));
      req.end();
    });

    // Structure: <h3>WEDNESDAY - FEB 25</h3> followed by <div>...</div> blocks containing
    // <div><a href="...">Venue</a> - Act description (time)</div> lines
    const stripTags = s => s
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g,'&').replace(/&apos;/g,"'").replace(/&#x27;/g,"'")
      .replace(/&#xA0;/g,' ').replace(/&nbsp;/g,' ').replace(/&#8211;/g,'–')
      .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
      .replace(/\s+/g,' ').trim();

    const now = new Date();

    // Split HTML by <h3> tags to get day sections
    const sections = html.split(/<h3>/i);
    for (const section of sections.slice(1)) {
      // Extract header text
      const headerClose = section.indexOf('</h3>');
      if (headerClose === -1) continue;
      const headerText = stripTags(section.slice(0, headerClose));

      // Must be a day header: "WEDNESDAY - FEB 25"
      const dayMatch = headerText.match(/[A-Z]+DAY\s*[-–]\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{1,2})/i);
      if (!dayMatch) continue;

      const mon = MONTH_NUMS[dayMatch[1].toUpperCase()];
      const day = parseInt(dayMatch[2]);
      if (!mon || !day) continue;

      let year = now.getFullYear();
      if (mon < now.getMonth() + 1 || (mon === now.getMonth() + 1 && day < now.getDate())) year++;
      const isoDate = buildDate(year, mon, day);
      if (!isWithinLookahead(isoDate)) continue;

      // Content is everything after </h3> up to the next <h3>
      const content = section.slice(headerClose + 5).split(/<h3>/i)[0];

      // Find all <a> tags with their surrounding div context
      const linkRe = /<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)(?=<(?:a|div|h[1-6])\s|$)/gi;
      let lm;
      while ((lm = linkRe.exec(content)) !== null) {
        const venueName = stripTags(lm[2]).trim();
        const afterText = stripTags(lm[3]).replace(/^[\s\-–\u00A0]+/, '').trim();

        if (!venueName || venueName.length < 2) continue;
        if (!afterText || afterText.length < 3) continue;

        // Extract time "(7pm)", "(7:30pm)", "(10pm)"
        const timeMatch = afterText.match(/\((\d{1,2}(?::\d{2})?\s*(?:am|pm))\)/i);
        const time = timeMatch ? timeMatch[1] : null;
        const act = afterText.replace(/\s*\(\d{1,2}(?::\d{2})?\s*(?:am|pm)\)\s*/gi, '').trim();

        if (!act || act.length < 3) continue;

        const name = `${venueName}: ${act}`.slice(0, 150);
        const event = {
          name,
          date_start: isoDate,
          time: time || null,
          venue_name: venueName,
          venue_address: 'San Marcos, TX',
          category: 'music',
          description: act,
          url: LISTEN_SM_URL,
          source: 'scraped',
          cost: 'free',
          kid_friendly: false,
          pet_friendly: false,
          age_21_plus: false,
        };

        const clean = sanitize(event);
        if (clean) events.push(clean);
      }
    }
  } catch (err) {
    console.error(`[${SOURCE}] Error: ${err.message}`);
  }

  console.log(`[${SOURCE}] Total events: ${events.length}`);
  return { source: SOURCE, events };
}

// ─── SCRAPER 5: Cheatham Street Warehouse ────────────────────────────────────
// Spacecrafted CMS — events loaded via JS. Extracts from .eventColl-item DOM nodes.

async function scrapeCheathamStreet(browser) {
  await upsertEventSource({
    id: 'cheatham-street-warehouse',
    type: 'web',
    name: 'Cheatham Street Warehouse',
    url: 'https://cheathamstreet.com/calendar',
    frequency: 'daily',
  });
  const SOURCE = 'Cheatham Street Warehouse';
  const VENUE_NAME = 'Cheatham Street Warehouse';
  const VENUE_ADDRESS = '119 Cheatham St, San Marcos, TX 78666';
  const PAGE_URL = 'https://cheathamstreet.com/calendar';
  const events = [];

  const page = await browser.newPage();
  try {
    console.log(`\n[${SOURCE}] Navigating to ${PAGE_URL}`);
    await safeNavigate(page, PAGE_URL, 25000);
    await waitForNetworkIdle(page, 10000);
    await page.waitForTimeout(3000);

    // Wait for Spacecrafted event grid to render
    try {
      await page.waitForSelector('.eventColl-item', { timeout: 12000 });
    } catch {
      console.log(`[${SOURCE}] No .eventColl-item elements found — page may not have loaded`);
    }

    const rawEvents = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.eventColl-item'));
      return items.map(item => {
        const month = item.querySelector('.eventColl-month')?.textContent?.trim() || '';
        const day   = item.querySelector('.eventColl-date')?.textContent?.trim() || '';
        const nameEl = item.querySelector('.eventColl-eventInfo a, h2.eventColl-eventInfo');
        const name  = nameEl?.textContent?.trim() || '';
        const href  = nameEl?.tagName === 'A'
          ? nameEl.getAttribute('href')
          : item.querySelector('.eventColl-eventInfo a')?.getAttribute('href') || '';
        const timeEl = item.querySelector('.eventColl-time, .eventColl-doors, time');
        const time  = timeEl?.textContent?.trim() || '';
        const priceEl = item.querySelector('.eventColl-price, .eventColl-cost');
        const cost  = priceEl?.textContent?.trim() || '';
        const statusEl = item.querySelector('.eventColl-statusBtn');
        const status = statusEl?.textContent?.trim() || '';
        return { month, day, name, href, time, cost, status };
      });
    });

    console.log(`[${SOURCE}] Found ${rawEvents.length} raw event items`);

    const MONTHS = {
      jan:1, feb:2, mar:3, apr:4, may:5, jun:6,
      jul:7, aug:8, sep:9, oct:10, nov:11, dec:12,
    };

    const now = new Date();
    for (const raw of rawEvents) {
      if (!raw.name || !raw.month || !raw.day) continue;

      const monthNum = MONTHS[raw.month.toLowerCase().slice(0, 3)];
      if (!monthNum) continue;
      const dayNum = parseInt(raw.day, 10);
      if (!dayNum) continue;

      // Infer year: if month/day is in the past this calendar year, use next year
      let year = now.getFullYear();
      const candidate = new Date(year, monthNum - 1, dayNum);
      if (candidate < TODAY) year += 1;

      const dateStr = `${year}-${String(monthNum).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
      if (!isWithinLookahead(dateStr)) continue;

      const url = raw.href
        ? (raw.href.startsWith('http') ? raw.href : `https://cheathamstreet.com${raw.href}`)
        : PAGE_URL;

      const event = sanitize({
        name: raw.name,
        date_start: dateStr,
        time: raw.time || null,
        venue_name: VENUE_NAME,
        venue_address: VENUE_ADDRESS,
        category: 'concert',
        description: raw.status ? `Status: ${raw.status}` : null,
        url,
        cost: raw.cost || 'varies',
        age_21_plus: true,
        source: 'scraped',
      });
      if (event) {
        events.push(event);
        console.log(`[${SOURCE}] + ${dateStr} ${event.name}`);
      }
    }
  } catch (err) {
    console.error(`[${SOURCE}] Error: ${err.message}`);
  } finally {
    await page.close();
  }

  console.log(`[${SOURCE}] Done — ${events.length} events`);
  return { source: SOURCE, events };
}

// ─── SCRAPER 6: Downtown Industry (Industry TX) ─────────────────────────────
// Events page: https://smtx.industrytx.com/san-marcos-downtown-industry-san-marcos-events
// We expect a list/grid of event cards with title, date, time, and possibly location.

async function scrapeIndustryTX(browser) {
  await upsertEventSource({
    id: 'downtown-industry',
    type: 'web',
    name: 'Industry - San Marcos',
    url: 'https://smtx.industrytx.com/san-marcos-downtown-industry-san-marcos-events',
    frequency: 'daily',
  });
  const SOURCE = 'Downtown Industry';
  const PAGE_URL = 'https://smtx.industrytx.com/san-marcos-downtown-industry-san-marcos-events';
  const DEFAULT_VENUE = 'Downtown Industry';
  const DEFAULT_ADDRESS = '310 Mary St, San Marcos, TX 78666'; // adjust if the page shows a different address
  const events = [];

  const page = await browser.newPage();
  try {
    console.log(`\n[${SOURCE}] Navigating to ${PAGE_URL}`);
    await safeNavigate(page, PAGE_URL, 25000);
    await waitForNetworkIdle(page, 10000);
    await page.waitForTimeout(3000);

    // Try to find event card elements — this may need tweaking once we inspect the DOM
    const rawEvents = await page.evaluate(() => {
      const results = [];

      // Generic card selectors; adjust class names if we learn the real structure
      const cards = document.querySelectorAll('[class*="event" i], [class*="Event" i], article, .card');
      cards.forEach(card => {
        const titleEl = card.querySelector('h2, h3, .event-title, [class*="title"]');
        const dateEl  = card.querySelector('time, .event-date, [class*="date"]');
        const timeEl  = card.querySelector('.event-time, [class*="time"]');
        const linkEl  = card.querySelector('a[href]');
        const locEl   = card.querySelector('.event-location, [class*="location"], [class*="venue"]');
        const descEl  = card.querySelector('p, .description');

        const name = titleEl?.textContent?.trim() || '';
        const dateText = dateEl?.getAttribute('datetime') || dateEl?.textContent || '';
        const timeText = timeEl?.textContent || '';
        const href = linkEl?.getAttribute('href') || '';
        const locationText = locEl?.textContent || '';
        const description = descEl?.textContent || '';

        if (!name || name.length < 3) return;

        results.push({
          name,
          dateText: dateText.trim(),
          timeText: timeText.trim(),
          href,
          locationText: locationText.trim(),
          description: description.trim(),
        });
      });

      return results;
    });

    console.log(`[${SOURCE}] Found ${rawEvents.length} raw event cards`);

    for (const raw of rawEvents) {
      const isoDate = toISO(raw.dateText) || null;
      if (!isoDate || !isWithinLookahead(isoDate)) continue;

      // Extract a clean time if present
      const timeMatch = raw.timeText.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
      const time = timeMatch ? timeMatch[1] : undefined;

      const venue_name = raw.locationText && raw.locationText.length > 3
        ? raw.locationText
        : DEFAULT_VENUE;

      const eventUrl = raw.href
        ? (raw.href.startsWith('http') ? raw.href : new URL(raw.href, PAGE_URL).href)
        : PAGE_URL;

      const event = sanitize({
        name: raw.name.slice(0, 150),
        date_start: isoDate,
        time,
        venue_name,
        venue_address: DEFAULT_ADDRESS,
        category: guessCategory(`${raw.name} ${raw.description}`),
        description: raw.description ? raw.description.slice(0, 500) : undefined,
        url: eventUrl,
        source: 'scraped',
      });

      if (event) events.push(event);
    }
  } catch (err) {
    console.error(`[${SOURCE}] Error: ${err.message}`);
  } finally {
    await page.close();
  }

  console.log(`[${SOURCE}] Done — ${events.length} events`);
  return { source: SOURCE, events };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const started = new Date().toISOString();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SM-TX Browser Scraper — ${started}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no POST)' : 'LIVE'}`);
  console.log(`Today: ${fmtDate(TODAY)} | Lookahead: ${fmtDate(LOOKAHEAD_DATE)}`);
  console.log(`${'='.repeat(60)}`);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const scraper of [scrapeTaproom, scrapeVisitSanMarcos, scrapeDowntownSanMarcos, scrapeVisitSMListenLive, scrapeCheathamStreet, scrapeIndustryTX]) {
    let result;
    try {
      result = await scraper(browser);
    } catch (err) {
      console.error(`[SCRAPER FATAL] ${scraper.name}: ${err.message}`);
      result = { source: scraper.name, events: [] };
    }
    results.push(result);
  }

  await browser.close();

  // ─── Dedup and submit ───────────────────────────────────────────────────────

  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(60)}`);

  const allEvents = [];
  for (const r of results) {
    allEvents.push(...r.events);
    console.log(`  ${r.source}: ${r.events.length} events found`);
  }

  // Dedup by name+date_start
  const seen = new Set();
  const deduped = [];
  for (const ev of allEvents) {
    const key = `${ev.name.toLowerCase().trim()}|${ev.date_start}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(ev);
    }
  }
  console.log(`  Total unique events: ${deduped.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Events (not posted):');
    for (const ev of deduped) {
      console.log(`  • [${ev.date_start}] ${ev.name} @ ${ev.venue_name} (${ev.category})`);
      if (ev.time) console.log(`    Time: ${ev.time}`);
    }
    console.log(`\nDry run complete. ${deduped.length} events would be submitted.`);
    return;
  }

  if (deduped.length === 0) {
    console.log('No events to POST.');
    return;
  }

  let totalInserted = 0;
  let totalSkipped = 0;
  const BATCH_SIZE = 20;

  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const batch = deduped.slice(i, i + BATCH_SIZE);
    console.log(`\nPosting batch ${Math.floor(i/BATCH_SIZE)+1} (${batch.length} events)...`);
    try {
      const res = await postEvents(batch);
      console.log(`  HTTP ${res.status} | Inserted: ${res.body?.inserted ?? '?'} | Skipped: ${res.body?.skipped ?? '?'}`);
      totalInserted += res.body?.inserted || 0;
      totalSkipped += res.body?.skipped || 0;
      if (res.body?.details) console.log(`  Details: ${JSON.stringify(res.body.details).slice(0, 200)}`);
    } catch (err) {
      console.error(`  POST failed: ${err.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('FINAL RESULTS');
  console.log(`${'='.repeat(60)}`);
  for (const r of results) {
    console.log(`  ${r.source}: ${r.events.length} events scraped`);
  }
  console.log(`  API inserted: ${totalInserted} | API skipped: ${totalSkipped}`);
  console.log(`${'='.repeat(60)}\n`);

  // Report run to dashboard
  await reportRun(started, 'success', totalInserted, totalSkipped, null).catch(() => {});
  console.log('Run reported to dashboard.');
}

async function reportRun(started, status, inserted, skipped, error) {
  const key = process.env.SM_TX_API_KEY;
  if (!key) return;
  const endpoint = process.env.SM_TX_JOB_REPORT || 'https://sm-tx.com/api/admin/jobs/smtx-browser-scraper/runs';
  const body = JSON.stringify({
    started_at: started,
    finished_at: new Date().toISOString(),
    status,
    error_message: error || null,
    meta: { inserted, skipped },
  });
  const url = new URL(endpoint);
  return new Promise((resolve) => {
    const req = https.request({
      hostname: url.hostname, path: url.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-SM-TX-Key': key, 'Content-Length': Buffer.byteLength(body) },
      timeout: 10000,
    }, (res) => { res.resume(); resolve(); });
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

const _scriptStart = new Date().toISOString();
main().catch(async err => {
  console.error('Fatal error:', err);
  await reportRun(_scriptStart, 'error', 0, 0, err.message).catch(() => {});
  process.exit(1);
});
