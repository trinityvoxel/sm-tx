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