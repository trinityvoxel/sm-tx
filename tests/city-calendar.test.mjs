import { test } from "node:test";
import assert from "node:assert/strict";
import city from "../shared/city-calendar.cjs";
test("CivicEngage microdata supplies per-event dates, clocks and venue", () => {
  const html = `<li><a href="/Calendar.aspx?EID=123&amp;day=25">Details</a><div itemscope itemtype="http://schema.org/Event"><span itemprop="name">Pickleball Open Play</span><span itemprop="startDate">2026-09-28T08:30:00</span><p itemprop="description">Members and non-members have different prices.</p><span itemprop="location" itemscope><span itemprop="name">Activity Center</span><span itemprop="streetAddress">501 E Hopkins</span><span itemprop="addressLocality">San Marcos</span></span></div></li>`;
  const [e] = city.parseCityCalendar(html);
  assert.equal(e.date_start, "2026-09-28");
  assert.equal(e.time, "08:30");
  assert.equal(e.venue_name, "Activity Center");
  assert.equal(e.cost, null);
  assert.equal(e.kid_friendly, null);
  assert.equal(e.url, "https://www.sanmarcostx.gov/Calendar.aspx?EID=123");
  assert.equal(e.category, "sports");
});
test("calendar navigation dates never become invented events", () => {
  assert.deepEqual(
    city.parseCityCalendar(
      '<li><a href="/calendar.aspx">September 25, 2026</a></li>',
    ),
    [],
  );
});
