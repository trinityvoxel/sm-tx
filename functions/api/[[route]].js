/**
 * Cloudflare Pages Functions — /api/* catch-all handler
 * Zero external dependencies. D1 bound as env.DB. API key in env.API_KEY.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-SM-TX-Key',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function err(message, status = 400) {
  return json({ error: message }, status);
}

function isAuthed(request, env) {
  return request.headers.get('X-SM-TX-Key') === env.API_KEY;
}

/** Timing-safe string comparison to prevent timing attacks */
async function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const [ka, kb] = await Promise.all([
    crypto.subtle.importKey('raw', enc.encode(a), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    crypto.subtle.importKey('raw', enc.encode(b), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
  ]);
  const msg = enc.encode('compare');
  const [sa, sb] = await Promise.all([
    crypto.subtle.sign('HMAC', ka, msg),
    crypto.subtle.sign('HMAC', kb, msg),
  ]);
  const va = new Uint8Array(sa), vb = new Uint8Array(sb);
  if (va.length !== vb.length) return false;
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

function htmlPage(title, emoji, body, color = '#10b981') {
  return new Response(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — SM-TX Events</title>
  <style>
    body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb}
    .card{background:#fff;border-radius:12px;padding:2rem 2.5rem;text-align:center;box-shadow:0 2px 20px rgba(0,0,0,.08);max-width:400px;width:90%}
    .emoji{font-size:3rem;margin-bottom:.75rem}
    h1{color:${color};margin:0 0 .5rem;font-size:1.4rem}
    p{color:#6b7280;margin:.5rem 0;line-height:1.6}
    a{color:#0e8c8c;text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">${emoji}</div>
    <h1>${title}</h1>
    ${body}
    <p style="margin-top:1.25rem"><a href="https://sm-tx.com">← sm-tx.com</a></p>
  </div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

function esc(str) {
  // Escape HTML special chars for Telegram HTML mode
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/**
 * Returns today's date string (YYYY-MM-DD) in America/Chicago (CST/CDT).
 * Avoids the UTC drift bug where dates after 6pm CST would return tomorrow's date.
 */
function todayCST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
}

/**
 * Returns a future date string N days from now, also CST-anchored.
 */
function futureDateCST(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(d);
}

/** Parse /api/events or /api/events/submit or /api/events/:id */
function parsePath(url) {
  const path = new URL(url).pathname;
  // strip leading /api
  const rest = path.replace(/^\/api/, '').replace(/\/$/, '') || '/';
  return rest;
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  // OPTIONS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const rest = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
  const params = url.searchParams;

  // ── POST /api/admin/login ─────────────────────────────────────────────────
  // Validates ADMIN_PASSWORD and returns the API key for dashboard use.
  if (method === 'POST' && rest === '/admin/login') {
    try {
      const body = await request.json();
      const { password } = body || {};
      if (!password) return err('Password required', 400);
      if (!env.ADMIN_PASSWORD) return err('ADMIN_PASSWORD not configured', 500);
      const ok = await safeEqual(password, env.ADMIN_PASSWORD);
      if (!ok) return err('Invalid password', 401);
      return json({ apiKey: env.API_KEY });
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── GET /api/events ───────────────────────────────────────────────────────
  if (method === 'GET' && rest === '/events') {
    try {
      let query = 'SELECT * FROM events WHERE status = ?';
      const binds = ['approved'];

      if (params.get('upcoming') === 'true') {
        const today = todayCST();
        const future = futureDateCST(90);
        // Include events that:
        //   (a) start today or in the next 90 days, OR
        //   (b) are multi-day events that started before today but end today or later
        // This ensures today's ongoing events always appear regardless of start time.
        query += ' AND ((date_start >= ? AND date_start <= ?) OR (date_end IS NOT NULL AND date_end >= ? AND date_start < ?))';
        binds.push(today, future, today, today);
      } else if (params.get('date')) {
        query += ' AND date_start = ?';
        binds.push(params.get('date'));
      } else if (params.get('date_from') && params.get('date_to')) {
        query += ' AND date_start >= ? AND date_start <= ?';
        binds.push(params.get('date_from'), params.get('date_to'));
      }

      if (params.get('category')) {
        query += ' AND category = ?';
        binds.push(params.get('category'));
      }

      query += ' ORDER BY date_start ASC, time ASC NULLS LAST';

      const stmt = env.DB.prepare(query);
      const { results } = await stmt.bind(...binds).all();
      return json(results);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── GET /api/events/upcoming ──────────────────────────────────────────────
  if (method === 'GET' && rest === '/events/upcoming') {
    try {
      const today = todayCST();
      const future = futureDateCST(90);
      const { results } = await env.DB.prepare(
        `SELECT * FROM events WHERE status = ? AND (
          (date_start >= ? AND date_start <= ?) OR
          (date_end IS NOT NULL AND date_end >= ? AND date_start < ?)
        ) ORDER BY date_start ASC, time ASC NULLS LAST`
      ).bind('approved', today, future, today, today).all();
      return json(results);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── GET /api/events/pending ───────────────────────────────────────────────
  if (method === 'GET' && rest === '/events/pending') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    try {
      const { results } = await env.DB.prepare(
        'SELECT * FROM events WHERE status = ? ORDER BY created_at DESC'
      ).bind('pending').all();
      return json(results);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── POST /api/admin/fix-industry-categories ──────────────────────────────
  if (method === 'POST' && rest === '/admin/fix-industry-categories') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    try {
      const now = new Date().toISOString();
      const stmt = env.DB.prepare(`
        UPDATE events
        SET category = 'music',
            updated_at = ?
        WHERE venue_name = 'Industry - San Marcos'
          AND status = 'approved'
          AND category = 'community'
          AND (
            lower(name) LIKE '%music%'
            OR lower(description) LIKE '%music%'
            OR name IN ('Drew')
          )
      `);
      const { success, changes } = await stmt.bind(now).run();
      return json({ ok: true, updated: changes ?? 0 });
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── POST /api/admin/clear-generated-images ──────────────────────────────
  // Clears AI-generated event images so the frontend falls back to poster cards.
  // Keeps scraped/source images intact.
  if (method === 'POST' && rest === '/admin/clear-generated-images') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    try {
      const now = new Date().toISOString();
      const where = `
        image_url IS NOT NULL
        AND image_url != ''
        AND (
          image_url LIKE 'https://pub-images.sm-tx.com/events/%'
          OR image_url LIKE 'http://pub-images.sm-tx.com/events/%'
        )
      `;
      const { results: affected } = await env.DB.prepare(`
        SELECT id, name, date_start, venue_name, image_url
        FROM events
        WHERE ${where}
        ORDER BY date_start ASC, name ASC
      `).all();

      const { changes } = await env.DB.prepare(`
        UPDATE events
        SET image_url = NULL,
            updated_at = ?
        WHERE ${where}
      `).bind(now).run();

      return json({ ok: true, cleared: changes ?? 0, affected });
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── POST /api/admin/sources/upsert ────────────────────────────────────────
  if (method === 'POST' && rest === '/admin/sources/upsert') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    try {
      const body = await request.json();
      const { id, type, name, url, frequency } = body || {};
      if (!id || !type || !name || !url) return err('Missing required fields', 400);
      const now = new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO event_sources (id, type, name, url, active, frequency, last_scraped_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          type = excluded.type,
          name = excluded.name,
          url = excluded.url,
          active = 1,
          frequency = excluded.frequency,
          last_scraped_at = excluded.last_scraped_at,
          updated_at = excluded.updated_at
      `).bind(id, type, name, url, frequency || 'daily', now, now, now).run();
      return json({ ok: true });
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── POST /api/events/submit ───────────────────────────────────────────────
  if (method === 'POST' && rest === '/events/submit') {
    try {
      const body = await request.json();
      const required = ['name', 'date_start', 'venue_name', 'venue_address', 'category', 'submitter_name', 'submitter_email'];
      for (const field of required) {
        if (!body[field]) return err(`Missing required field: ${field}`);
      }
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO events (
          id, source, status, name, date_start, date_end, time,
          venue_name, venue_address, category, description, url, cost,
          kid_friendly, pet_friendly, age_21_plus,
          submitter_name, submitter_email, created_at, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).bind(
        id, 'community', 'pending',
        body.name, body.date_start, body.date_end || null, body.time || null,
        body.venue_name, body.venue_address, body.category,
        body.description || null, body.url || null, body.cost || 'free',
        body.kid_friendly ? 1 : 0, body.pet_friendly ? 1 : 0, body.age_21_plus ? 1 : 0,
        body.submitter_name, body.submitter_email,
        now, now
      ).run();
      // Notify Andrew via Telegram (fire-and-forget — don't block the response)
      if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
        const dateStr = body.date_start + (body.time ? ` @ ${body.time}` : '');
        const approveUrl = `https://sm-tx.com/api/admin/events/${id}/approve?key=${env.API_KEY}`;
        const rejectUrl  = `https://sm-tx.com/api/admin/events/${id}/reject?key=${env.API_KEY}`;
        const msg = [
          `📅 <b>New Event Submission — sm-tx.com</b>`,
          ``,
          `<b>${esc(body.name)}</b>`,
          `📍 ${esc(body.venue_name)}`,
          `🗓 ${esc(dateStr)}`,
          `🏷 ${esc(body.category)}${body.cost && body.cost !== 'free' ? ` · ${esc(body.cost)}` : ' · free'}`,
          ``,
          `Submitted by: ${esc(body.submitter_name)} (${esc(body.submitter_email)})`,
          ``,
          `<a href="${approveUrl}">✅ Approve</a>   <a href="${rejectUrl}">🗑 Reject</a>`,
        ].join('\n');
        fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: msg,
            parse_mode: 'HTML',
          }),
        }).catch(() => {});
      }
      return json({ id, status: 'pending', message: 'Event submitted for review.' }, 201);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── GET /api/events/:id ───────────────────────────────────────────────────
  const idMatch = rest.match(/^\/events\/([^/]+)$/);
  if (method === 'GET' && idMatch) {
    const id = idMatch[1];
    try {
      const event = await env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
      if (!event) return err('Event not found', 404);
      return json(event);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── PATCH /api/events/:id ─────────────────────────────────────────────────
  if (method === 'PATCH' && idMatch) {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    const id = idMatch[1];
    try {
      const body = await request.json();
      const allowed = ['name','date_start','date_end','time','venue_name','venue_address',
        'category','description','url','cost','kid_friendly','pet_friendly','age_21_plus','status','source','image_url'];
      const sets = [];
      const vals = [];
      for (const key of allowed) {
        if (key in body) {
          sets.push(`${key} = ?`);
          vals.push(body[key]);
        }
      }
      if (!sets.length) return err('No updatable fields provided');
      sets.push('updated_at = ?');
      vals.push(new Date().toISOString());
      vals.push(id);
      await env.DB.prepare(`UPDATE events SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
      const updated = await env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
      if (!updated) return err('Event not found', 404);
      return json(updated);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── DELETE /api/events/:id ────────────────────────────────────────────────
  if (method === 'DELETE' && idMatch) {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    const id = idMatch[1];
    try {
      await env.DB.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
      return json({ message: 'Deleted.' });
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── POST /api/admin/import ────────────────────────────────────────────────
  // Bulk import scraped events (auto-approved). Auth required.
  // Body: { events: [ { name, date_start, venue_name, venue_address, category, ... } ] }
  if (method === 'POST' && rest === '/admin/import') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    try {
      const body = await request.json();
      if (!Array.isArray(body.events) || body.events.length === 0) {
        return err('events array required');
      }
      const now = new Date().toISOString();
      const inserted = [];
      const skipped = [];

      function normalizeName(name) {
        if (!name) return '';
        return String(name)
          .toLowerCase()
          .replace(/\s+live\s+at.*/g, '')
          .replace(/\sat\s.+$/, '')
          .replace(/[^a-z0-9]+/g, ' ')
          .trim();
      }

      function sourcePriority(source) {
        // Higher number = higher priority
        const s = (source || 'scraped').toLowerCase();
        if (s === 'venue_site') return 3;
        if (s === 'facebook') return 2;
        if (s === 'aggregator') return 1;
        return 0;
      }

      for (const evt of body.events) {
        if (!evt.name || !evt.date_start || !evt.venue_name || !evt.venue_address || !evt.category) {
          skipped.push({ reason: 'missing required field', event: evt.name || '(unnamed)' });
          continue;
        }
        // Skip past events (use CST date to avoid UTC drift)
        if (evt.date_start < todayCST()) {
          skipped.push({ reason: 'past event', event: evt.name });
          continue;
        }

        const normName = normalizeName(evt.name);
        const date = evt.date_start;
        const venue = (evt.venue_name || '').toLowerCase().trim();

        // Look for an exact match on normalized name, date, and venue first
        let existing = await env.DB.prepare(
          'SELECT * FROM events WHERE lower(name) = lower(?) AND date_start = ? AND lower(venue_name) = lower(?)'
        ).bind(evt.name, date, evt.venue_name).first();

        // If no exact venue match, fall back to any event with same normalized name + date
        if (!existing && normName) {
          const { results } = await env.DB.prepare(
            'SELECT * FROM events WHERE date_start = ?'
          ).bind(date).all();
          existing = (results || []).find(row => normalizeName(row.name) === normName);
        }

        const newSource = evt.source || 'scraped';

        if (existing) {
          const existingPriority = sourcePriority(existing.source);
          const incomingPriority = sourcePriority(newSource);
          if (incomingPriority <= existingPriority) {
            // Image display priority: 1) image_override (future admin) 2) image_url (scraped) 3) Poster card (frontend fallback)
            // Keep the existing row — but always backfill/fix image_url if scraper found one
            if (evt.image_url && evt.image_url !== existing.image_url) {
              await env.DB.prepare('UPDATE events SET image_url = ?, updated_at = ? WHERE id = ?')
                .bind(evt.image_url, now, existing.id).run();
            }
            skipped.push({ reason: 'duplicate', event: evt.name });
            continue;
          }

          // Upgrade existing row with better source details
          const updates = [];
          const vals = [];
          const fields = ['description', 'url', 'cost'];
          for (const f of fields) {
            if (evt[f] && (!existing[f] || existing[f] === 'free')) {
              updates.push(`${f} = ?`);
              vals.push(evt[f]);
            }
          }
          if (evt.image_url && evt.image_url !== existing.image_url) {
            updates.push('image_url = ?');
            vals.push(evt.image_url);
          }
          updates.push('source = ?');
          vals.push(newSource);
          updates.push('updated_at = ?');
          vals.push(now);
          vals.push(existing.id);

          if (updates.length > 2) {
            await env.DB.prepare(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`).bind(...vals).run();
          }
          skipped.push({ reason: 'duplicate_upgraded', event: evt.name });
          continue;
        }

        const id = 'evt-' + Math.random().toString(36).slice(2, 10);
        await env.DB.prepare(`
          INSERT INTO events (
            id, source, status, name, date_start, date_end, time,
            venue_name, venue_address, category, description, url, cost,
            kid_friendly, pet_friendly, age_21_plus,
            image_url, submitter_name, submitter_email, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).bind(
          id, newSource, 'approved',
          evt.name, evt.date_start, evt.date_end || null, evt.time || null,
          evt.venue_name, evt.venue_address, evt.category,
          evt.description || null, evt.url || null, evt.cost || 'free',
          evt.kid_friendly ? 1 : 0, evt.pet_friendly ? 1 : 0, evt.age_21_plus ? 1 : 0,
          evt.image_url || null, null, null,
          now, now
        ).run();

        inserted.push({ id, name: evt.name });
      }
      return json({ inserted: inserted.length, skipped: skipped.length, details: { inserted, skipped } }, 201);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── GET /api/admin/events/:id/approve|reject?key=... ─────────────────────
  // One-tap approve/reject links sent in Telegram notifications.
  const actionMatch = rest.match(/^\/admin\/events\/([^/]+)\/(approve|reject)$/);
  if (method === 'GET' && actionMatch) {
    if (params.get('key') !== env.API_KEY) {
      return htmlPage('Unauthorized', '🚫', '<p>Invalid or expired link.</p>', '#ef4444');
    }
    const [, evtId, action] = actionMatch;
    try {
      const event = await env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(evtId).first();
      if (!event) {
        return htmlPage('Not Found', '🤷', '<p>This event no longer exists — it may have already been reviewed.</p>', '#6b7280');
      }
      if (action === 'approve') {
        await env.DB.prepare("UPDATE events SET status = 'approved', updated_at = ? WHERE id = ?")
          .bind(new Date().toISOString(), evtId).run();

        return htmlPage(
          'Event Approved',
          '✅',
          `<p><strong>${esc(event.name)}</strong> is now live on sm-tx.com.</p>`,
          '#10b981'
        );
      } else {
        await env.DB.prepare('DELETE FROM events WHERE id = ?').bind(evtId).run();
        return htmlPage(
          'Event Rejected',
          '🗑️',
          `<p><strong>${esc(event.name)}</strong> has been removed.</p>`,
          '#ef4444'
        );
      }
    } catch (e) {
      return htmlPage('Error', '⚠️', `<p>${esc(e.message)}</p>`, '#f59e0b');
    }
  }

  // ── GET /api/admin/settings ──────────────────────────────────────────────
  if (method === 'GET' && rest === '/admin/settings') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    try {
      const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
      const settings = {};
      for (const row of results || []) {
        settings[row.key] = row.value;
      }
      return json(settings);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── PATCH /api/admin/settings ────────────────────────────────────────────
  if (method === 'PATCH' && rest === '/admin/settings') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    try {
      const body = await request.json();
      const updates = [];
      for (const key of ['facebook_enabled', 'admin_enabled']) {
        if (key in body) {
          updates.push({ key, value: String(body[key]) });
        }
      }
      if (!updates.length) return err('No updatable settings provided');
      const stmt = env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
      for (const u of updates) {
        await stmt.bind(u.key, u.value).run();
      }
      return json({ ok: true });
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── /api/admin/sources (GET/POST) ────────────────────────────────────────
  if (rest === '/admin/sources') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    if (method === 'GET') {
      try {
        const { results } = await env.DB.prepare('SELECT * FROM event_sources ORDER BY created_at DESC').all();
        return json(results);
      } catch (e) {
        return err(e.message, 500);
      }
    }
    if (method === 'POST') {
      try {
        const body = await request.json();
        const required = ['type', 'name', 'url'];
        for (const f of required) {
          if (!body[f]) return err(`Missing required field: ${f}`);
        }
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await env.DB.prepare(`
          INSERT INTO event_sources (
            id, type, name, url, active, frequency, last_scraped_at, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?)
        `).bind(
          id,
          body.type,
          body.name,
          body.url,
          body.active === false ? 0 : 1,
          body.frequency || 'daily',
          null,
          now,
          now
        ).run();
        const created = await env.DB.prepare('SELECT * FROM event_sources WHERE id = ?').bind(id).first();
        return json(created, 201);
      } catch (e) {
        return err(e.message, 500);
      }
    }
  }

  // ── PATCH /api/admin/sources/:id ─────────────────────────────────────────
  const sourceMatch = rest.match(/^\/admin\/sources\/([^/]+)$/);
  if (sourceMatch && method === 'PATCH') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    const sourceId = sourceMatch[1];
    try {
      const body = await request.json();
      const allowed = ['name', 'url', 'active', 'frequency', 'last_scraped_at'];
      const sets = [];
      const vals = [];
      for (const key of allowed) {
        if (key in body) {
          if (key === 'active') {
            sets.push('active = ?');
            vals.push(body.active ? 1 : 0);
          } else {
            sets.push(`${key} = ?`);
            vals.push(body[key]);
          }
        }
      }
      if (!sets.length) return err('No updatable fields provided');
      sets.push('updated_at = ?');
      vals.push(new Date().toISOString());
      vals.push(sourceId);
      await env.DB.prepare(`UPDATE event_sources SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
      const updated = await env.DB.prepare('SELECT * FROM event_sources WHERE id = ?').bind(sourceId).first();
      if (!updated) return err('Source not found', 404);
      return json(updated);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── GET /api/admin/jobs ─────────────────────────────────────────────────
  if (method === 'GET' && rest === '/admin/jobs') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    try {
      const { results } = await env.DB.prepare('SELECT * FROM jobs ORDER BY id').all();
      return json(results);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── GET /api/admin/jobs/:id/runs ─────────────────────────────────────────
  const jobRunsMatch = rest.match(/^\/admin\/jobs\/([^/]+)\/runs$/);
  if (jobRunsMatch && method === 'GET') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    const jobId = jobRunsMatch[1];
    const limit = Math.min(parseInt(params.get('limit') || '20', 10), 100);
    try {
      const { results } = await env.DB.prepare(
        'SELECT * FROM job_runs WHERE job_id = ? ORDER BY started_at DESC LIMIT ?'
      ).bind(jobId, limit).all();
      return json(results);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── POST /api/admin/jobs/:id/runs ────────────────────────────────────────
  const jobRunsPostMatch = rest.match(/^\/admin\/jobs\/([^/]+)\/runs$/);
  if (jobRunsPostMatch && method === 'POST') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    const jobId = jobRunsPostMatch[1];
    try {
      const body = await request.json();
      const id = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO job_runs (
          id, job_id, started_at, finished_at, status, error_message, meta
        ) VALUES (?,?,?,?,?,?,?)
      `).bind(
        id,
        jobId,
        body.started_at,
        body.finished_at,
        body.status,
        body.error_message || null,
        body.meta ? JSON.stringify(body.meta) : null
      ).run();
      const created = await env.DB.prepare('SELECT * FROM job_runs WHERE id = ?').bind(id).first();
      return json(created, 201);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── POST /api/admin/jobs/:id/trigger ─────────────────────────────────────
  // Triggers the corresponding GitHub Actions workflow via workflow_dispatch.
  // Requires env.GITHUB_TOKEN (PAT with actions:write) and env.GITHUB_REPO (e.g. "trinityvoxel/sm-tx")
  const triggerMatch = rest.match(/^\/admin\/jobs\/([^/]+)\/trigger$/);
  if (triggerMatch && method === 'POST') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    const jobId = triggerMatch[1];

    const WORKFLOW_MAP = {
      'smtx-event-scraper':   'event-scraper.yml',
      'smtx-browser-scraper': 'browser-scraper.yml',
    };
    const workflow = WORKFLOW_MAP[jobId];
    if (!workflow) return err(`No workflow mapped for job: ${jobId}`, 404);
    if (!env.GITHUB_TOKEN) return err('GITHUB_TOKEN not configured', 500);
    if (!env.GITHUB_REPO)  return err('GITHUB_REPO not configured', 500);

    try {
      const ghUrl = `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${workflow}/dispatches`;
      const ghRes = await fetch(ghUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'sm-tx-worker/1.0',
        },
        body: JSON.stringify({ ref: 'main' }),
      });
      if (ghRes.status === 204) {
        return json({ ok: true, message: `Triggered ${workflow}` });
      }
      const ghBody = await ghRes.text();
      return err(`GitHub API error ${ghRes.status}: ${ghBody}`, 500);
    } catch (e) {
      return err(`fetch failed: ${e.message}`, 500);
    }
  }

  return err('Not found', 404);
}
