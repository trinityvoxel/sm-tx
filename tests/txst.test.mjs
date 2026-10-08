import { test } from "node:test";
import assert from "node:assert/strict";
import txst from "../shared/txst.cjs";
const item = (
  description,
  category = "2026/09/25 (Fri)",
  title = "Sample session",
) =>
  `<item><title>${title}</title><category>${category}</category><description><![CDATA[${description}]]></description><link>https://events.txstate.edu/?eventid=123</link></item>`;
test("TXST uses feed start date and explicit venue, price and type", () => {
  const e = txst.parseTXSTItem(
    item(
      "The Wittliff Collections<br>Ongoing through Friday, December 11, 2026<br><b>Event Type</b>: Long-Term Exhibit<br><b>Cost</b>: Free",
      "2026/08/10 (Mon)",
    ),
  );
  assert.equal(e.date_start, "2026-08-10");
  assert.equal(e.date_end, "2026-12-11");
  assert.equal(e.category, "arts");
  assert.equal(e.venue_name, "The Wittliff Collections");
  assert.equal(e.venue_address, null);
  assert.equal(e.kid_friendly, null);
  assert.equal(e.time, null);
});
test("TXST decodes noon ranges without taking end time, no invented free or family labels", () => {
  const e = txst.parseTXSTItem(
    item(
      'Online<br>Friday, September 25, 2026, 12&amp;nbsp;&amp;ndash;&amp;nbsp;1pm<br><img src="image"><b>Sponsor</b>: University',
    ),
  );
  assert.equal(e.time, "12:00 PM");
  assert.equal(e.venue_name, "Online");
  assert.equal(e.cost, null);
  assert.equal(e.kid_friendly, null);
});
test("TXST reads Campus Location and multi-day start instead of last day", () => {
  const e = txst.parseTXSTItem(
    item(
      'Friday, September 25 – Sunday, September 27, 2026<br><b>Campus Location</b>: <a href="https://example.com">Comal</a><br><b>Room</b>: 116',
    ),
  );
  assert.equal(e.venue_name, "Comal");
  assert.equal(e.date_start, "2026-09-25");
  assert.equal(e.date_end, "2026-09-27");
});
test('away cross-country meets retain their actual city and sports category', () => {
 const e=txst.parseTXSTItem(item('College Station, TX<br>Friday, October 16, 2026','2026/10/16 (Fri)','Texas State Cross Country at Arturo Barrios Invitational'));
 assert.equal(e.category,'sports');
 assert.equal(e.venue_name,'College Station, TX');
 assert.equal(e.time,null);
});
