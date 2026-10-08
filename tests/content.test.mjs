import { test } from "node:test";
import assert from "node:assert/strict";
import {
  weekend,
  today,
  zonedDateTime,
  validDate,
  parseTime,
} from "../client/src/lib/dates.js";
import { cleanHtml, jsonForHtml } from "../client/src/lib/content.js";
import {
  eventSchema,
  calendarFile,
  usefulEvent,
} from "../client/src/lib/events.js";
const event = {
  id: "local-fixture",
  status: "approved",
  name: "Local fixture",
  date_start: "2026-09-25",
  time: "7:30 PM",
  venue_name: "Test venue",
  url: "https://example.com/event",
  description: "<p>Source description</p>",
};
test("today follows Central calendar across UTC midnight", () =>
  assert.equal(today(new Date("2026-09-24T02:00:00Z")), "2026-09-23"));
test("weekend means Friday through Sunday including Sunday", () => {
  assert.deepEqual(weekend("2026-09-27"), {
    from: "2026-09-25",
    to: "2026-09-27",
  });
  assert.deepEqual(weekend("2026-09-28"), {
    from: "2026-10-02",
    to: "2026-10-04",
  });
});
test("dates reject overflow and times sort noon and midnight correctly", () => {
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(parseTime("12am"), 0);
  assert.equal(parseTime("12pm"), 720);
  assert.equal(parseTime("25:00"), null);
});
test("DST missing and ambiguous times never guessed", () => {
  assert.equal(zonedDateTime("2026-03-08", "2:30 AM"), null);
  assert.equal(zonedDateTime("2026-11-01", "1:30 AM"), null);
  assert.equal(
    zonedDateTime("2026-09-25", "7:30 PM"),
    "2026-09-25T19:30:00-05:00",
  );
  assert.equal(
    zonedDateTime("2026-01-25", "7:30 PM"),
    "2026-01-25T19:30:00-06:00",
  );
});
test("source HTML strips active content and dangerous protocols", () => {
  const s = cleanHtml(
    '<script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">test</a><p style="color:red">safe</p>',
  );
  assert.ok(!/script|onerror|javascript:|style=/.test(s));
  assert.ok(s.includes("<p>safe</p>"));
});
test("serialized model cannot break out of script tag", () =>
  assert.ok(
    !jsonForHtml({ text: "</script><script>alert(1)</script>" }).includes("<"),
  ));
test("schema never fabricates location, offer, schedule status, or timezone", () => {
  const s = eventSchema(event);
  assert.equal(s.startDate, event.date_start);
  assert.equal(s.location, undefined);
  assert.equal(s.offers, undefined);
  assert.equal(s.eventStatus, undefined);
  assert.equal(s.eventAttendanceMode, undefined);
});
test("verified data supplies timed schema and real zero price", () => {
  const s = eventSchema({
    ...event,
    editorial: {
      schedule_verified: 1,
      cost_verified: 1,
      price: 0,
      currency: "USD",
      location_verified: 1,
      event_status: "cancelled",
    },
  });
  assert.match(s.startDate, /-05:00$/);
  assert.equal(s.offers.price, 0);
  assert.equal(s.eventStatus, "https://schema.org/EventCancelled");
});
test("calendar fallback is all-day with exclusive end and preserves listed time", () => {
  const s = calendarFile(event);
  assert.match(s, /DTSTART;VALUE=DATE:20260925/);
  assert.match(s, /DTEND;VALUE=DATE:20260926/);
  assert.match(s, /Listed time/);
});
test("unknown and unpublished records not indexable", () => {
  assert.equal(usefulEvent({ ...event, status: "pending" }), false);
  assert.equal(usefulEvent({ ...event, url: "javascript:alert(1)" }), false);
  assert.equal(usefulEvent({ ...event, editorial: { indexable: 0 } }), false);
});
