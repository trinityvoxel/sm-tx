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
      let hasImage = false; // Flag to check if any image was found
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
        const imgEl = item.querySelector('.eventColl-img img.contentImg, .eventColl-img img, img.contentImg');
        const imageUrl = imgEl?.getAttribute('src') || null;
        if (imageUrl) hasImage = true; // Set flag if an image is found
        if (imgEl) {
          console.log(`[${SOURCE}] Found imgEl for ${name}: ${imgEl.outerHTML}`);
        } else {
          console.log(`[${SOURCE}] imgEl not found for ${name}`);
        }
        console.log(`[${SOURCE}] Image URL for ${name}: ${imageUrl}`); // Logging extracted image URL
        return { month, day, name, href, time, cost, status, imageUrl };
      });
    });

    console.log(`[${SOURCE}] Found ${rawEvents.length} raw event items`);

    // Save page HTML if images were found
    if (rawEvents.some(e => e.imageUrl)) {
      const htmlContent = await page.content();
      await write({
        path: `sm-tx/cheatham-street-page.html`,
        content: htmlContent,
      });
      console.log(`[${SOURCE}] Saved Cheatham Street page HTML to cheatham-street-page.html`);
    }

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
        image_url: raw.imageUrl || null, // Include image_url
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
      const cards = document.querySelectorAll('section .row.event-content');
      cards.forEach(card => {
        const titleEl = card.querySelector('h2, .event-title, [class*="title"]');
        const dateEl  = card.querySelector('h3, time, .event-date, [class*="date"]');
        const timeEl  = card.querySelector('.event-time, [class*="time"]');
        const linkEl  = card.querySelector('a[href]');
        const locEl   = card.querySelector('.event-location, [class*="location"], [class*="venue"]');
        const descEl  = card.querySelector('.event-info-text p, p, .description');
        const imgEl   = card.querySelector('.event-image-holder img, img');

        const name = titleEl?.textContent?.trim() || '';
        const dateText = dateEl?.getAttribute('datetime') || dateEl?.textContent || '';
        const timeText = timeEl?.textContent || '';
        const href = linkEl?.getAttribute('href') || '';
        const locationText = locEl?.textContent || '';
        const description = descEl?.textContent || '';
        const imageUrlRaw = imgEl?.getAttribute('src') || '';
        const imageUrl = imageUrlRaw
          ? (imageUrlRaw.startsWith('http') ? imageUrlRaw : `${location.protocol}//${location.host}${imageUrlRaw}`)
          : null;

        if (!name || name.length < 3) return;

        if (imgEl) {
          console.log(`[${SOURCE}] Found imgEl for ${name}: ${imgEl.outerHTML}`);
        } else {
          console.log(`[${SOURCE}] imgEl not found for ${name}`);
        }
        console.log(`[${SOURCE}] Image URL for ${name}: ${imageUrl}`); // Logging extracted image URL

        results.push({
          name,
          dateText: dateText.trim(),
          timeText: timeText.trim(),
          href,
          locationText: locationText.trim(),
          description: description.trim(),
          imageUrl,
        });
      });

      return results;
    });

    console.log(`[${SOURCE}] Found ${rawEvents.length} raw event cards`);

    // Save page HTML if images were found
    if (rawEvents.some(e => e.imageUrl)) {
      const htmlContent = await page.content();
      await write({
        path: `sm-tx/industry-tx-page.html`,
        content: htmlContent,
      });
      console.log(`[${SOURCE}] Saved Industry TX page HTML to industry-tx-page.html`);
    }

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
        image_url: raw.imageUrl || null,
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