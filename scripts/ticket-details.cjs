const {schemasFromHtml, detailBackfill} = require('../shared/detail-fields.cjs');
const {retryRead} = require('./collection-runtime.cjs');
// Follow only public Eventbrite event links supplied by the venue calendar.
function createTicketRecovery(fetcher = fetch) {
  const cache = new Map();
  let deadline;
  return async event => {
    if (event.time) return event;
    let url;
    try { url = new URL(event.url); } catch { return event; }
    if (url.protocol !== 'https:' || url.hostname !== 'www.eventbrite.com' || !url.pathname.startsWith('/e/')) return event;
    url.search = ''; url.hash = '';
    deadline ||= Date.now() + 90000;
    if (!cache.has(url.href)) {
      if (cache.size >= 30 || Date.now() > deadline) return event;
      cache.set(url.href, []);
      try {
        const html = await retryRead(async () => {
          const response = await fetcher(url.href, {signal: AbortSignal.timeout(10000)});
          if (!response.ok) throw new Error(`Ticket detail HTTP ${response.status}`);
          if (response.url && new URL(response.url).hostname !== url.hostname) throw new Error('Domain not approved after ticket redirect');
          return response.text();
        });
        cache.set(url.href, schemasFromHtml(html));
      } catch (error) { console.warn(`[Ticket detail review] ${event.name}: ${error.message}`); }
    }
    return Object.assign(event, detailBackfill(event, {schemas: cache.get(url.href)}));
  };
}
module.exports = {createTicketRecovery};
