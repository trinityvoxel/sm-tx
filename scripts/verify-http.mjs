import assert from "node:assert/strict";
import { writeFile, readFile } from "node:fs/promises";
const base = "http://127.0.0.1:8788";
const routes = [
  "/",
  "/events",
  "/events/today",
  "/events/this-weekend",
  "/calendar",
  "/guides",
  "/guides/things-to-do",
  "/guides/dining",
  "/guides/outdoor-activities",
  "/guides/hill-country-weekend",
  "/stay",
  "/submit",
  "/contact",
  "/about",
  "/editorial-policy",
  "/admin",
  "/missing-page",
  "/events?category=music",
  "/events?page=2",
  "/events/evt-lpfw0ntc",
];
const rows = [];
const privateConfig = await readFile(
  new URL("../.dev.vars", import.meta.url),
  "utf8",
).catch(() => "");
const recipient = privateConfig.match(/SUBMISSION_ALERT_TO="([^"]+)"/)?.[1];
for (const route of routes) {
  const r = await fetch(base + route);
  const html = await r.text();
  const missing = route === "/missing-page";
  assert.equal(r.status, missing ? 404 : 200);
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert.equal((html.match(/<meta name="description"/g) || []).length, 1);
  if (route !== "/admin")
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  if (recipient)
    assert.ok(!html.includes(recipient), "Private recipient leaked");
  const directives = html.match(/name="robots" content="([^"]+)"/)?.[1];
  assert.equal(
    directives,
    route === "/admin" || missing || route.includes("category=")
      ? "noindex,follow"
      : "index,follow",
  );
  assert.ok(!html.includes("private-test@example.com"));
  JSON.parse(
    html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1],
  );
  rows.push({
    route,
    status: r.status,
    robots: directives,
    initialHtml: true,
    canonical: html.match(/rel="canonical" href="([^"]+)"/)[1],
  });
}
const redirect = await fetch(base + "/guides/", { redirect: "manual" });
assert.equal(redirect.status, 301);
assert.equal(redirect.headers.get("location"), base + "/guides");
const missing = await fetch(base + "/events/no-such-event");
assert.equal(missing.status, 404);
const ics = await fetch(base + "/events/evt-lpfw0ntc/calendar.ics");
assert.match(await ics.text(), /BEGIN:VCALENDAR/);
const sitemap = await fetch(base + "/sitemap.xml").then((r) => r.text());
assert.ok(sitemap.includes("https://sm-tx.com/events/today"));
assert.ok(!sitemap.includes("/admin"));
assert.ok(
  [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].every((m) => !m[1].includes("?")),
);
assert.ok(!sitemap.includes("submitter"));
await writeFile(
  new URL("../../outputs/http-verification.json", import.meta.url),
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      pages: rows,
      redirects: "pass",
      missingEvent404: "pass",
      calendarDownload: "pass",
      sitemap: "pass",
      privateRecipient: "not present",
    },
    null,
    2,
  ),
);
console.log(
  `Passed ${rows.length} initial-HTML route checks, redirect, missing event, ICS, sitemap, and privacy checks.`,
);
