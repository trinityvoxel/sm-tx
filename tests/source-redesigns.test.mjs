import {test} from 'node:test';
import assert from 'node:assert/strict';
import city from '../shared/city-calendar.cjs';
import marc from '../shared/marc-events.cjs';
test('CivicPlus date groups keep each card on its explicitly dated day',()=>{
 const card=id=>`<li id="event-${id}"><h3><a href="/m/calendar/event/detail/${id}">Pickleball</a></h3><div class="events-category"><div>8:30 AM - 11:30 AM</div><div class="calendar-location-content"><p>Activity Center</p></div></div></li>`;
 const rows=city.parseCityCalendar(`<ul aria-labelledby="calendar-events-header-2026-11-23">${card(1)}</ul><ul aria-labelledby="calendar-events-header-2026-11-24">${card(2)}</ul>`);
 assert.deepEqual(rows.map(e=>e.date_start),['2026-11-23','2026-11-24']);assert.equal(rows[0].time,'8:30 AM');assert.equal(rows[0].venue_name,'Activity Center');assert.equal(rows[0].cost,null);
 assert.equal(city.parseCityCalendar(card(3)).length,0);
});
test('Marc JSON is parsed as data with explicit dates, not executed or assigned fabricated times',()=>{
 const rows=marc.parseMarcEvents('const MANUAL_SNAPSHOT=[{"title":"Show","date":"2026-12-04","url":"https://example.com"}]; const FEED_SNAPSHOT=[{"title":"Late show","eventStart":"2026-12-05T02:00:00Z","doortime":"8 PM"}];');
 assert.equal(rows.length,2);assert.equal(rows[0].date_start,'2026-12-04');assert.equal(rows[0].time,null);assert.equal(rows[1].date_start,'2026-12-04');
 assert.throws(()=>marc.parseMarcEvents('const MANUAL_SNAPSHOT=[process.exit()];'));
});
