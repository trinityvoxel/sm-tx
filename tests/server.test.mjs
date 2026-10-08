import { test, beforeEach, afterEach, mock } from "node:test";
beforeEach(() =>
  mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-25T12:00:00Z") }),
);
afterEach(() => mock.timers.reset());
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { loadModel } from "../server/model.js";
import { onRequest as api } from "../functions/api/[[route]].js";
import { onRequest as contact } from "../functions/api/contact.js";
import { onRequest as editorial } from "../functions/api/editorial.js";
import notifier from "../email-notifier/src/index.js";
function database() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(
    readFileSync(
      new URL("../functions/api/schema.sql", import.meta.url),
      "utf8",
    ).split("-- Sample approved events")[0],
  );
  sql.exec(
    readFileSync(
      new URL(
        "../functions/api/migrations/0002_event_editorial.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const wrap = (query, values = []) => ({
    bind(...v) {
      return wrap(query, v);
    },
    async all() {
      return { results: sql.prepare(query).all(...values) };
    },
    async first() {
      return sql.prepare(query).get(...values) || null;
    },
    async run() {
      const r = sql.prepare(query).run(...values);
      return {
        success: true,
        changes: Number(r.changes),
        meta: { changes: Number(r.changes) },
      };
    },
  });
  return {
    prepare: (q) => wrap(q),
    batch: (stmts) => Promise.all(stmts.map((s) => s.run())),
    sql,
  };
}
const sample = {
  name: "Fixture event",
  date_start: "2026-09-25",
  date_end: "2026-09-26",
  time: "7:30 PM",
  venue_name: "Fixture venue",
  venue_address: "Fixture address",
  category: "music",
  description: "A local-only test record.",
  url: "https://example.com/event",
  cost: "Check official source",
  submitter_name: "Private Test Name",
  submitter_email: "private-test@example.com",
};
test("editor-reviewed records survive imports and can be explicitly unlocked", async () => {
  const DB = database(),
    env = { DB, API_KEY: "local-test-key" };
  DB.sql.exec(
    readFileSync(
      new URL(
        "../functions/api/migrations/0004_event_import_protection.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const headers = { "X-SM-TX-Key": env.API_KEY };
  const incoming = {
    ...sample,
    source: "scraped",
    venue_name: "San Marcos",
    time: null,
  };
  const send = (e) =>
    api(ctx(req("/api/admin/import", "POST", { events: [e] }, headers), env));
  await send(incoming);
  const id = DB.sql.prepare("SELECT id FROM events").get().id;
  const save = await api(
    ctx(
      req(
        "/api/events/" + id,
        "PATCH",
        { venue_name: "Reviewed venue", protect_imports: true },
        headers,
      ),
      env,
    ),
  );
  assert.equal(save.status, 200);
  await send({ ...incoming, time: "8:00 PM" });
  assert.equal(DB.sql.prepare("SELECT time FROM events").get().time, null);
  await api(
    ctx(
      req(
        "/api/events/" + id,
        "PATCH",
        { venue_name: "Reviewed venue", protect_imports: false },
        headers,
      ),
      env,
    ),
  );
  await send({ ...incoming, time: "8:00 PM" });
  assert.equal(DB.sql.prepare("SELECT time FROM events").get().time, "8:00 PM");
  assert.equal(DB.sql.prepare("SELECT count(*) AS n FROM events").get().n, 1);
});
const req = (path, method = "GET", body, headers = {}) =>
  new Request("https://sm-tx.com" + path, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const ctx = (request, env) => ({
  request,
  env,
  waitUntil: (p) => p.catch(() => {}),
});
test("TXST refresh repairs a closing-date import without losing its ID or inventing admission", async () => {
  const DB = database(),
    env = { DB, API_KEY: "local-test-key" };
  const headers = { "X-SM-TX-Key": env.API_KEY };
  const old = {
    ...sample,
    source: "scraped",
    date_start: "2026-12-11",
    date_end: null,
    url: "https://events.txstate.edu/?trumbaEmbed=event123",
  };
  const send = (e) =>
    api(ctx(req("/api/admin/import", "POST", { events: [e] }, headers), env));
  await send(old);
  const id = DB.sql.prepare("SELECT id FROM events").get().id;
  const updated = {
    ...old,
    source_provider: "txst_rss",
    date_start: "2026-08-10",
    date_end: "2026-12-11",
    time: null,
    venue_name: "The Wittliff Collections",
    venue_address: null,
    cost: null,
    kid_friendly: null,
  };
  assert.equal((await send(updated)).status, 201);
  const record = DB.sql.prepare("SELECT * FROM events").get();
  assert.equal(record.id, id);
  assert.equal(record.date_start, "2026-08-10");
  assert.equal(record.cost, "Check official source");
  assert.equal(record.venue_address, "");
  assert.equal(record.kid_friendly, 0);
  assert.equal(DB.sql.prepare("SELECT COUNT(*) AS n FROM events").get().n, 1);
});
test("homepage serves nine chronological events and retains later results", async () => {
  const DB = database(),
    env = { DB, API_KEY: "local-test-key" };
  const events = Array.from({ length: 12 }, (_, i) => ({
    ...sample,
    source: "scraped",
    name: "Chronology " + i,
    time: `${String(20 - i).padStart(2, "0")}:00`,
  }));
  await api(
    ctx(
      req(
        "/api/admin/import",
        "POST",
        { events },
        { "X-SM-TX-Key": env.API_KEY },
      ),
      env,
    ),
  );
  const model = await loadModel(
    new URL("https://sm-tx.com/"),
    env,
    new Date("2026-09-25T12:00:00Z"),
  );
  assert.equal(model.events.length, 9);
  assert.equal(model.total, 12);
  assert.deepEqual(
    model.events.map((e) => e.time),
    [
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
    ],
  );
});
test("repeat scraper import repairs a generic venue in place", async () => {
  const DB = database(),
    env = { DB, API_KEY: "local-test-key" };
  const event = {
    ...sample,
    source: "scraped",
    venue_name: "San Marcos",
    venue_address: "San Marcos, TX",
  };
  const send = (e) =>
    api(
      ctx(
        req(
          "/api/admin/import",
          "POST",
          { events: [e] },
          { "X-SM-TX-Key": env.API_KEY },
        ),
        env,
      ),
    );
  assert.equal((await send(event)).status, 201);
  const before = DB.sql.prepare("SELECT * FROM events").get();
  assert.equal(
    (
      await send({
        ...event,
        description: "Comedy open mic hosted at Wake the Dead Coffee House!",
      })
    ).status,
    201,
  );
  const rows = DB.sql.prepare("SELECT * FROM events").all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, before.id);
  assert.equal(rows[0].venue_name, "Wake the Dead Coffee House");
  assert.equal(rows[0].status, before.status);
});
test("submission → private moderation → approval → public listing preserves privacy", async () => {
  const DB = database(),
    env = { DB, API_KEY: "local-test-key" };
  const result = await api(ctx(req("/api/events/submit", "POST", sample), env));
  assert.equal(result.status, 201);
  const stored = DB.sql.prepare("SELECT * FROM events").get();
  assert.equal(stored.status, "pending");
  assert.equal(
    DB.sql.prepare("SELECT * FROM event_submissions").get().submitter_email,
    sample.submitter_email,
  );
  const hidden = await api(ctx(req("/api/events/" + stored.id), env));
  assert.equal(hidden.status, 404);
  const denied = await api(
    ctx(req("/api/events/" + stored.id, "PATCH", { status: "approved" }), env),
  );
  assert.equal(denied.status, 401);
  const approved = await api(
    ctx(
      req(
        "/api/events/" + stored.id,
        "PATCH",
        { status: "approved" },
        { "X-SM-TX-Key": "local-test-key" },
      ),
      env,
    ),
  );
  assert.equal(approved.status, 200);
  const response = await api(ctx(req("/api/events/" + stored.id), env));
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.ok(!body.includes("private-test"));
  assert.ok(!body.includes("Private Test Name"));
  const page = await loadModel(
    new URL("https://sm-tx.com/events/" + stored.id),
    env,
    new Date("2026-09-23T12:00Z"),
  );
  assert.equal(page.status, 200);
  assert.ok(!JSON.stringify(page).includes("private-test"));
});
test("search variants noindex, real pagination, and missing records are 404", async () => {
  const env = { DB: database() };
  const day = new Date("2026-09-23T12:00Z");
  const m = await loadModel(
    new URL("https://sm-tx.com/events?q=unknown"),
    env,
    day,
  );
  assert.equal(m.noindex, true);
  assert.equal(m.total, 0);
  assert.equal(m.status, 200);
  assert.equal(
    (await loadModel(new URL("https://sm-tx.com/events?page=999"), env, day))
      .status,
    404,
  );
  assert.equal(
    (
      await loadModel(
        new URL("https://sm-tx.com/events/no-such-event"),
        env,
        day,
      )
    ).status,
    404,
  );
  assert.equal(
    (await loadModel(new URL("https://sm-tx.com/unknown"), env, day)).status,
    404,
  );
});
test("editorial endpoint requires auth and rejects fabricated invalid fields", async () => {
  const env = { DB: database(), API_KEY: "local-test-key" };
  assert.equal(
    (await editorial(ctx(req("/api/editorial?id=x"), env))).status,
    401,
  );
});
test("contact rejects cross-origin messages and retains honest unavailable state", async () => {
  const body = {
    name: "Test",
    email: "test@example.com",
    message: "Test message",
  };
  assert.equal(
    (
      await contact(
        ctx(
          req("/api/contact", "POST", body, {
            Origin: "https://attacker.example",
          }),
          {},
        ),
      )
    ).status,
    403,
  );
  assert.equal(
    (await contact(ctx(req("/api/contact", "POST", body), {}))).status,
    503,
  );
  assert.equal(
    (
      await contact(
        ctx(req("/api/contact", "POST", { ...body, website: "spam" }), {}),
      )
    ).status,
    200,
  );
});
test("contact uses private notifier configuration and reports delivery failures", async () => {
  const saved = globalThis.fetch;
  let payload;
  globalThis.fetch = async (url, options) => {
    payload = JSON.parse(options.body);
    return new Response("{}", { status: 200 });
  };
  try {
    const env = {
      CONTACT_RATE_LIMITER: { limit: async () => ({ success: true }) },
      SUBMISSION_EMAIL_WEBHOOK_SECRET: "test-only",
      SUBMISSION_EMAIL_WEBHOOK_URL: "https://notifier.example/notify",
    };
    const r = await contact(
      ctx(
        req("/api/contact", "POST", {
          name: "Test",
          email: "test@example.com",
          message: "Question",
        }),
        env,
      ),
    );
    assert.equal(r.status, 200);
    assert.equal(payload.to, undefined);
    assert.equal(payload.replyTo, "test@example.com");
    globalThis.fetch = async () => new Response("{}", { status: 502 });
    assert.equal(
      (
        await contact(
          ctx(
            req("/api/contact", "POST", {
              name: "Test",
              email: "test@example.com",
              message: "Question",
            }),
            env,
          ),
        )
      ).status,
      502,
    );
  } finally {
    globalThis.fetch = saved;
  }
});
test("email notifier uses SM-TX.com Admin and configured private recipient", async () => {
  let message;
  const env = {
    WEBHOOK_SECRET: "test-secret",
    SUBMISSION_ALERT_TO: "private-recipient@example.com",
    SUBMISSION_ALERT_FROM: "events@sm-tx.com",
    EMAIL: {
      send: async (body) => {
        message = body;
        return { messageId: "test" };
      },
    },
  };
  const r = await notifier.fetch(
    new Request("https://notifier.example/notify", {
      method: "POST",
      headers: { Authorization: "Bearer test-secret" },
      body: JSON.stringify({
        to: "untrusted@example.com",
        subject: "Test",
        text: "Test",
        html: "<p>Test</p>",
      }),
    }),
    env,
  );
  assert.equal(r.status, 200);
  assert.equal(message.to, "private-recipient@example.com");
  assert.equal(message.from.name, "SM-TX.com Admin");
  assert.ok(!(await r.text()).includes("private-recipient"));
});

test("contact D1 limiter rejects sixth message and never stores raw IP", async () => {
  const DB = database();
  DB.sql.exec(
    readFileSync(
      new URL(
        "../functions/api/migrations/0003_contact_rate_limits.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const env = {
    DB,
    API_KEY: "test-key",
    SUBMISSION_EMAIL_WEBHOOK_SECRET: "test",
    SUBMISSION_EMAIL_WEBHOOK_URL: "https://notifier.example/notify",
  };
  const saved = globalThis.fetch;
  globalThis.fetch = async () => new Response("{}");
  try {
    for (let i = 0; i < 6; i++) {
      const response = await contact(
        ctx(
          req(
            "/api/contact",
            "POST",
            { name: "Test", email: "test@example.com", message: "Test" },
            { "CF-Connecting-IP": "192.0.2.1" },
          ),
          env,
        ),
      );
      assert.equal(response.status, i < 5 ? 200 : 429);
    }
    const row = DB.sql.prepare("SELECT * FROM contact_rate_limits").get();
    assert.match(row.bucket_key, /^[a-f0-9]{64}$/);
    assert.ok(!JSON.stringify(row).includes("192.0.2.1"));
  } finally {
    globalThis.fetch = saved;
  }
});

test("renderer returns useful non-JavaScript HTML and correct error statuses", async () => {
  const { handleRequest } = await import("../.server/entry-server.js");
  const assets = { js: "assets/test.js", css: ["assets/test.css"] };
  const env = { DB: database() };
  const response = await handleRequest(req("/events/today"), env, assets);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<h1[^>]*>What/);
  assert.match(html, /Room for something new/);
  const unknown = await handleRequest(req("/missing"), env, assets);
  assert.equal(unknown.status, 404);
  const redirect = await handleRequest(
    new Request("http://www.sm-tx.com/events"),
    env,
    assets,
  );
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get("location"), "https://sm-tx.com/events");
  const broken = await handleRequest(
    req("/events"),
    {
      DB: {
        prepare() {
          throw new Error("Simulated unavailable database");
        },
      },
    },
    assets,
  );
  assert.equal(broken.status, 503);
  assert.equal(broken.headers.get("Retry-After"), "60");
  assert.match(await broken.text(), /temporarily unavailable/);
});

test("repeat imports repair title categories while preserving reviewed records", async () => {
  const DB = database(), env = { DB, API_KEY: "local-test-key" };
  DB.sql.exec(readFileSync(new URL("../functions/api/migrations/0004_event_import_protection.sql", import.meta.url), "utf8"));
  const event = { ...sample, name: "San Marcos Flea Market", source: "scraped", category: "music", description: "Live music and vendors" };
  const send = () => api(ctx(req("/api/admin/import", "POST", { events: [event] }, { "X-SM-TX-Key": env.API_KEY }), env));
  assert.equal((await send()).status, 201);
  const first = DB.sql.prepare("SELECT * FROM events").get();
  assert.equal(first.category, "markets");
  DB.sql.prepare("UPDATE events SET category = 'music'").run();
  await send();
  assert.equal(DB.sql.prepare("SELECT category FROM events WHERE id = ?").get(first.id).category, "markets");
  DB.sql.prepare("UPDATE events SET category = 'community'").run();
  DB.sql.prepare("INSERT INTO event_import_protection (event_id, reviewed_at) VALUES (?, CURRENT_TIMESTAMP)").run(first.id);
  await send();
  assert.equal(DB.sql.prepare("SELECT category FROM events WHERE id = ?").get(first.id).category, "community");
  assert.equal(DB.sql.prepare("SELECT COUNT(*) AS n FROM events").get().n, 1);
});

test('conflicting recurrence imports preserve date evidence without publishing', async () => {
 const DB = database(), env = {DB, API_KEY:'local-test-key'};
 DB.sql.exec(readFileSync(new URL('../functions/api/migrations/0005_event_date_review.sql', import.meta.url),'utf8'));
 const event = {...sample, name:'First Tuesday Film Series',date_start:'2026-10-07',date_evidence:{calendar_date:'2026-10-07T00:00:00Z'}};
 const response = await api(ctx(req('/api/admin/import','POST',{events:[event]},{'X-SM-TX-Key':env.API_KEY}),env));
 assert.equal(response.status,201);
 const result = await response.json();
 assert.equal(result.inserted,0);
 assert.match(result.details.skipped[0].reason,/conflicts/);
 assert.equal(DB.sql.prepare('SELECT COUNT(*) AS n FROM events').get().n,0);
 assert.match(DB.sql.prepare('SELECT evidence FROM event_date_reviews').get().evidence,/2026-10-07T00:00:00Z/);
});
test('date review evidence is private and readable by the admin', async () => {
 const DB=database(),env={DB,API_KEY:'local-test-key'};
 DB.sql.exec(readFileSync(new URL('../functions/api/migrations/0005_event_date_review.sql',import.meta.url),'utf8'));
 DB.sql.prepare('INSERT INTO event_date_reviews VALUES (?,?,?,?,?,?)').run('Fixture','2026-10-07','https://example.com','Date conflict','{"private_evidence":true}','2026-09-27');
 assert.equal((await api(ctx(req('/api/admin/date-reviews'),env))).status,401);
 const response=await api(ctx(req('/api/admin/date-reviews','GET',undefined,{'X-SM-TX-Key':env.API_KEY}),env));
 assert.equal(response.status,200);assert.equal((await response.json()).length,1);
});
test('a shifted date cannot bypass protection on a reviewed occurrence', async () => {
 const DB=database(),env={DB,API_KEY:'local-test-key'};
 DB.sql.exec(readFileSync(new URL('../functions/api/migrations/0004_event_import_protection.sql',import.meta.url),'utf8'));
 const send = event=>api(ctx(req('/api/admin/import','POST',{events:[event]},{'X-SM-TX-Key':env.API_KEY}),env));
 const event={...sample,source:'scraped',date_start:'2026-10-01',date_end:null};
 await send(event);const {id}=DB.sql.prepare('SELECT id FROM events').get();
 DB.sql.prepare('INSERT INTO event_import_protection VALUES (?,?)').run(id,'2026-09-27');
 const response=await send({...event,date_start:'2026-10-02'});
 assert.match((await response.json()).details.skipped[0].reason,/date-shifted duplicate/);
 assert.equal(DB.sql.prepare('SELECT COUNT(*) AS n FROM events').get().n,1);
});
