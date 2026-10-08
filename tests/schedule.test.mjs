import { test } from "node:test";
import assert from "node:assert/strict";
import schedule from "../shared/schedule.cjs";
test("schedule extraction uses start of range, never end or unknown cutoff", () => {
  assert.equal(schedule.startTime("7–10pm"), "7:00 PM");
  assert.equal(schedule.startTime("11am–1pm"), "11:00 AM");
  assert.equal(schedule.startTime("11–1pm"), null);
  assert.equal(schedule.startTime("All day"), null);
  assert.equal(schedule.startTime("September 25, 2026"), null);
});
test("structured schedules match occurrence and convert offset to Central", () => {
  assert.equal(
    schedule.structuredTime("2026-09-26T01:00:00Z", "2026-09-25"),
    "8:00 PM",
  );
  assert.equal(
    schedule.structuredTime("2026-09-26T01:00:00Z", "2026-09-26"),
    null,
  );
  assert.equal(schedule.structuredTime("2026-09-25", "2026-09-25"), null);
});
