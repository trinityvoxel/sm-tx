import { test } from 'node:test';
import assert from 'node:assert/strict';
import venues from '../shared/venue.cjs';
const record = { source: 'scraped', venue_name: 'San Marcos', venue_address: 'San Marcos, TX', description: 'Check out this weekly comedy open mic hosted at Wake the Dead Coffee House!' };
test('recovers the Laughing Dead venue from the imported description', () => {
  assert.equal(venues.resolveVenue(record).venue_name, 'Wake the Dead Coffee House');
  assert.match(venues.resolveVenue(record).venue_address, /1432 Old Ranch Road 12/);
});
test('uses structured Place fields but never organizer hostname as venue', () => {
  assert.equal(venues.resolveVenue({ ...record, description: '' }, { location: { name: 'Example Hall', address: { streetAddress: '1 Main St', addressLocality: 'San Marcos' } } }).venue_name, 'Example Hall');
  assert.equal(venues.resolveVenue({ ...record, description: '' }, { hostname: 'Tourism bureau' }).venue_name, 'San Marcos');
});
test('repeat imports enrich generic scraped venues without changing specific or community venues', () => {
  assert.equal(venues.venueBackfill(record, record).venue_name, 'Wake the Dead Coffee House');
  assert.equal(venues.venueBackfill({ ...record, venue_name: 'Other Hall' }, record), null);
  assert.equal(venues.venueBackfill({ ...record, source: 'community' }, record), null);
  assert.equal(venues.resolveVenue({ ...record, description: 'Thanks to Wake the Dead for sponsoring.' }).venue_name, 'San Marcos');
});
test('contact emails cannot become venue names, including structured locations', () => {
 const e={...record,venue_name:'market@example.com',description:''};
 assert.equal(venues.resolveVenue(e).venue_name,'Venue unconfirmed');
 assert.equal(venues.resolveVenue(e,{location:{name:'mailto:market@example.com'}}).venue_name,'Venue unconfirmed');
 assert.equal(venues.resolveVenue(e,{location:{name:'Actual Market Hall'}}).venue_name,'Actual Market Hall');
 assert.equal(venues.resolveVenue({...e,description:'Market at Wake the Dead.'}).venue_name,'Wake the Dead Coffee House');
});
