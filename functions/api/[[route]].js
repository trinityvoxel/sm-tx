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

  // ── GET /api/events ───────────────────────────────────────────────────────
  if (method === 'GET' && rest === '/events') {
    try {
      let query = 'SELECT * FROM events WHERE status = ?';
      const binds = ['approved'];

      if (params.get('upcoming') === 'true') {
        const today = new Date().toISOString().slice(0, 10);
        const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        query += ' AND date_start >= ? AND date_start <= ?';
        binds.push(today, future);
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

      query += ' ORDER BY date_start ASC';

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
      const today = new Date().toISOString().slice(0, 10);
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { results } = await env.DB.prepare(
        'SELECT * FROM events WHERE status = ? AND date_start >= ? AND date_start <= ? ORDER BY date_start ASC'
      ).bind('approved', today, future).all();
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
        const msg = [
          `📅 *New Event Submission — sm-tx.com*`,
          ``,
          `*${body.name}*`,
          `📍 ${body.venue_name}`,
          `🗓 ${dateStr}`,
          `🏷 ${body.category}${body.cost && body.cost !== 'free' ? ` · ${body.cost}` : ' · free'}`,
          ``,
          `Submitted by: ${body.submitter_name} (${body.submitter_email})`,
          ``,
          `Review & approve at: https://sm\\-tx\\.com/api/events/pending`,
        ].join('\n');
        fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: msg,
            parse_mode: 'MarkdownV2',
          }),
        }).catch(() => {}); // swallow errors — notification is best-effort
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
        'category','description','url','cost','kid_friendly','pet_friendly','age_21_plus','status','source'];
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
      for (const evt of body.events) {
        if (!evt.name || !evt.date_start || !evt.venue_name || !evt.venue_address || !evt.category) {
          skipped.push({ reason: 'missing required field', event: evt.name || '(unnamed)' });
          continue;
        }
        // Skip past events
        if (evt.date_start < new Date().toISOString().slice(0, 10)) {
          skipped.push({ reason: 'past event', event: evt.name });
          continue;
        }
        // Deduplicate by name + date_start
        const existing = await env.DB.prepare(
          'SELECT id FROM events WHERE name = ? AND date_start = ?'
        ).bind(evt.name, evt.date_start).first();
        if (existing) {
          skipped.push({ reason: 'duplicate', event: evt.name });
          continue;
        }
        const id = 'evt-' + Math.random().toString(36).slice(2, 10);
        await env.DB.prepare(`
          INSERT INTO events (
            id, source, status, name, date_start, date_end, time,
            venue_name, venue_address, category, description, url, cost,
            kid_friendly, pet_friendly, age_21_plus,
            submitter_name, submitter_email, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).bind(
          id, evt.source || 'scraped', 'approved',
          evt.name, evt.date_start, evt.date_end || null, evt.time || null,
          evt.venue_name, evt.venue_address, evt.category,
          evt.description || null, evt.url || null, evt.cost || 'free',
          evt.kid_friendly ? 1 : 0, evt.pet_friendly ? 1 : 0, evt.age_21_plus ? 1 : 0,
          null, null,
          now, now
        ).run();
        inserted.push({ id, name: evt.name });
      }
      return json({ inserted: inserted.length, skipped: skipped.length, details: { inserted, skipped } }, 201);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  return err('Not found', 404);
}
