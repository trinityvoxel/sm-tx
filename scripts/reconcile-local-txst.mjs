// Local-only evidence-based repair. Never connects to an API or remote database.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import txst from "../shared/txst.cjs";
const [dbPath, rssPath, reportPath, mode] = process.argv.slice(2);
if (
  !dbPath ||
  !rssPath ||
  !reportPath ||
  !resolve(dbPath).includes("/.wrangler/state/")
)
  throw new Error(
    "Provide a local .wrangler database, RSS evidence file, report path, and optional --apply. Back up the database first.",
  );
const db = new DatabaseSync(dbPath);
const fields = [
  "date_start",
  "date_end",
  "time",
  "venue_name",
  "venue_address",
  "category",
  "cost",
  "kid_friendly",
];
const report = {
  checkedAt: new Date().toISOString(),
  evidence: resolve(rssPath),
  before: db.prepare("SELECT COUNT(*) AS n FROM events").get().n,
  changes: [],
  conflicts: [],
};
const locked = new Set(
  db
    .prepare("SELECT event_id FROM event_import_protection")
    .all()
    .map((r) => r.event_id),
);
for (const match of readFileSync(rssPath, "utf8").matchAll(
  /<item>([\s\S]*?)<\/item>/g,
)) {
  const e = txst.parseTXSTItem(match[0]);
  if (!e) continue;
  e.venue_address ||= "";
  e.cost ||= "Check official source";
  e.kid_friendly = e.kid_friendly ? 1 : 0;
  const candidates = db
    .prepare(
      "SELECT * FROM events WHERE source='scraped' AND url=? AND name=? AND (date_start=? OR date_start=?)",
    )
    .all(e.url, e.name, e.date_start, e.date_end || e.date_start);
  if (candidates.length !== 1) {
    report.conflicts.push({
      name: e.name,
      date: e.date_start,
      matches: candidates.length,
    });
    continue;
  }
  const previous = candidates[0];
  if (locked.has(previous.id)) continue;
  const changes = Object.fromEntries(
    fields
      .filter((key) => (previous[key] ?? null) !== (e[key] ?? null))
      .map((key) => [
        key,
        { before: previous[key] ?? null, after: e[key] ?? null },
      ]),
  );
  if (!Object.keys(changes).length) continue;
  report.changes.push({ id: previous.id, name: e.name, changes });
}
if (mode === "--apply") {
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const row of report.changes) {
      const keys = Object.keys(row.changes);
      db.prepare(
        `UPDATE events SET ${keys.map((key) => key + "=?").join(",")},updated_at=? WHERE id=?`,
      ).run(
        ...keys.map((key) => row.changes[key].after),
        report.checkedAt,
        row.id,
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
report.applied = mode === "--apply";
report.after = db.prepare("SELECT COUNT(*) AS n FROM events").get().n;
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({
    applied: report.applied,
    changed: report.changes.length,
    unmatched: report.conflicts.length,
    before: report.before,
    after: report.after,
  }),
);
db.close();
