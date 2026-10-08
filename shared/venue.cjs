// City-only placeholders are not venues. Only enrich them from explicit evidence.
const clean = value => typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
const invalidContact = value => /^(?:mailto:)?[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(clean(value));
const genericVenue = value => !clean(value) || invalidContact(value) || /^(san marcos(?:,? (?:tx|texas))?|various san marcos venues|venue (?:unknown|unconfirmed))$/i.test(clean(value));
function resolveVenue(event, details = {}) {
  if (!genericVenue(event.venue_name)) return { venue_name: event.venue_name, venue_address: event.venue_address };
  const candidates = [details.location, details.listing];
  for (const place of candidates) {
    const name = clean(typeof place === 'string' ? place : place?.name || place?.title);
    if (genericVenue(name)) continue;
    const address = place?.address;
    return { venue_name: name, venue_address: typeof address === 'string' ? address : address && typeof address === 'object' ? [address.streetAddress, address.addressLocality, address.addressRegion, address.postalCode].filter(Boolean).join(', ') : event.venue_address };
  }
  // Verified venue identity; require an explicit location phrase, not a casual mention.
  if (/\b(?:at|hosted at|location:)\s+(?:the\s+)?wake the dead(?: coffee house)?\b/i.test(clean(event.description))) {
    return { venue_name: 'Wake the Dead Coffee House', venue_address: '1432 Old Ranch Road 12, San Marcos, TX 78666' };
  }
  return { venue_name: invalidContact(event.venue_name) ? 'Venue unconfirmed' : event.venue_name, venue_address: event.venue_address };
}
function venueBackfill(existing, incoming) {
  if (existing.source !== 'scraped' || incoming.source !== 'scraped' || !genericVenue(existing.venue_name)) return null;
  const resolved = resolveVenue(incoming);
  return genericVenue(resolved.venue_name) ? null : resolved;
}
module.exports = { genericVenue, resolveVenue, venueBackfill };
