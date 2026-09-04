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

function yesNo(value) {
  return value ? 'Yes' : 'No';
}

function submissionDetails(body, id, submittedAt) {
  const dates = body.date_end && body.date_end !== body.date_start
    ? `${body.date_start} through ${body.date_end}`
    : body.date_start;

  return [
    ['Event', body.name],
    ['Date', dates],
    ['Time', body.time || 'Not provided'],
    ['Venue', body.venue_name],
    ['Address', body.venue_address],
    ['Category', body.category],
    ['Cost / tickets', body.cost || 'Free'],
    ['Description', body.description || 'Not provided'],
    ['Event URL', body.url || 'Not provided'],
    ['Kid friendly', yesNo(body.kid_friendly)],
    ['Pet friendly', yesNo(body.pet_friendly)],
    ['21+ only', yesNo(body.age_21_plus)],
    ['Submitted by', body.submitter_name],
    ['Submitter email', body.submitter_email],
    ['Submitted at', submittedAt],
    ['Submission ID', id],
  ];
}

async function sendTelegramSubmission(env, body, id) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;

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

  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: msg,
      parse_mode: 'HTML',
    }),
  });
  if (!response.ok) {
    throw new Error(`Telegram API returned ${response.status}`);
  }
}

async function sendEmailSubmission(env, body, id, submittedAt) {
  const hasDirectEmailConfig = Boolean(env.SUBMISSION_ALERT_TO && env.SUBMISSION_ALERT_FROM);
  if (!env.SUBMISSION_EMAIL_WEBHOOK_SECRET && !hasDirectEmailConfig) return;

  const details = submissionDetails(body, id, submittedAt);
  const adminUrl = 'https://sm-tx.com/admin';
  const subject = `New event submission: ${body.name}`;
  const text = [
    'A new event was submitted to sm-tx.com and is waiting for review.',
    '',
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    `Review submission: ${adminUrl}`,
  ].join('\n');
  const rows = details.map(([label, value]) => `
    <tr>
      <td style="padding:7px 12px 7px 0;vertical-align:top;color:#6b7280;white-space:nowrap">${esc(label)}</td>
      <td style="padding:7px 0;vertical-align:top;color:#111827;white-space:pre-wrap">${esc(value)}</td>
    </tr>`).join('');
  const html = `<!doctype html>
    <html><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827">
      <div style="max-width:680px;margin:0 auto;padding:24px">
        <div style="background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e5e7eb">
          <div style="font-size:13px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#0e7490">SM-TX Events</div>
          <h1 style="margin:8px 0 10px;font-size:24px;line-height:1.25">New event submission</h1>
          <p style="margin:0 0 18px;color:#4b5563;line-height:1.5">A community submission is waiting for review.</p>
          <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.45">${rows}</table>
          <a href="${adminUrl}" style="display:inline-block;margin-top:22px;padding:11px 18px;border-radius:8px;background:#022c22;color:#ffffff;text-decoration:none;font-weight:700">Review in admin</a>
        </div>
      </div>
    </body></html>`;
  const message = {
    to: env.SUBMISSION_ALERT_TO,
    from: env.SUBMISSION_ALERT_FROM,
    subject,
    html,
    text,
  };

  // Prefer a native Workers email binding when available. Pages deployments can
  // use the Email Service REST API with a narrowly scoped API token instead.
  if (hasDirectEmailConfig && env.EMAIL && typeof env.EMAIL.send === 'function') {
    await env.EMAIL.send({ ...message, replyTo: body.submitter_email });
    return;
  }

  if (env.SUBMISSION_EMAIL_WEBHOOK_SECRET) {
    const webhookUrl = env.SUBMISSION_EMAIL_WEBHOOK_URL
      || 'https://sm-tx-email-notifier.trinityvoxel.workers.dev/notify';
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SUBMISSION_EMAIL_WEBHOOK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...message, replyTo: body.submitter_email }),
    });
    if (!response.ok) {
      throw new Error(`Submission email webhook returned ${response.status}`);
    }
    return;
  }

  if (!hasDirectEmailConfig || !env.CLOUDFLARE_EMAIL_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) return;
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/email/sending/send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_EMAIL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...message, reply_to: body.submitter_email }),
    }
  );
  if (!response.ok) {
    throw new Error(`Cloudflare Email API returned ${response.status}`);
  }
}

async function notifySubmission(env, body, id, submittedAt) {
  const [telegram, email] = await Promise.allSettled([
    sendTelegramSubmission(env, body, id),
    sendEmailSubmission(env, body, id, submittedAt),
  ]);
  if (telegram.status === 'rejected') {
    console.error('Telegram submission notification failed:', telegram.reason);
  }
  if (email.status === 'rejected') {
    console.error('Email submission notification failed:', email.reason);
  }
}

function readableEventDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return value || 'Date not provided';
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  }).format(date);
}

function approvalEventDateTime(event) {
  const start = readableEventDate(event.date_start);
  const dates = event.date_end && event.date_end !== event.date_start
    ? `${start} through ${readableEventDate(event.date_end)}`
    : start;
  return event.time ? `${dates} at ${event.time}` : dates;
}

function approvalEmailContent(submission) {
  const firstName = String(submission.submitter_name || '').trim().split(/\s+/)[0] || 'there';
  const dateAndTime = approvalEventDateTime(submission);
  const eventUrl = `https://sm-tx.com/events/${encodeURIComponent(submission.event_id)}`;
  const subject = `Your event is live on SM-TX: ${submission.event_name}`;
  const text = `Hi ${firstName},

Thanks for sharing an event with the San Marcos community. We reviewed your submission and it is now live on SM-TX.

${submission.event_name}
${dateAndTime}
${submission.venue_name}

View your event: ${eventUrl}

Thanks for helping San Marcos know what's happening.

— SM-TX Events

You received this operational email because you submitted an event to sm-tx.com.`;
  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your event is live on SM-TX</title></head>
  <body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent">${esc(submission.event_name)} has been approved and is now live on SM-TX.</div>
    <div style="max-width:640px;margin:0 auto;padding:24px">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
        <div style="background:#042f2e;padding:22px 28px;color:#ffffff">
          <div style="font-size:20px;font-weight:800;letter-spacing:-.02em">SM-TX</div>
          <div style="margin-top:3px;font-size:13px;color:#99f6e4">What's happening in San Marcos</div>
        </div>
        <div style="padding:30px 28px">
          <div style="font-size:34px;line-height:1">🎉</div>
          <h1 style="margin:12px 0 10px;font-size:25px;line-height:1.25;color:#111827">Your event is live!</h1>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4b5563">Hi ${esc(firstName)}, thanks for sharing an event with the San Marcos community. We reviewed your submission and it is now live on SM-TX.</p>
          <div style="border:1px solid #d1fae5;background:#f0fdfa;border-radius:10px;padding:18px 20px">
            <div style="font-size:18px;font-weight:700;color:#022c22">${esc(submission.event_name)}</div>
            <div style="margin-top:9px;font-size:14px;line-height:1.55;color:#374151">📅 ${esc(dateAndTime)}</div>
            <div style="margin-top:5px;font-size:14px;line-height:1.55;color:#374151">📍 ${esc(submission.venue_name)}</div>
          </div>
          <a href="${eventUrl}" style="display:inline-block;margin-top:22px;padding:12px 19px;border-radius:8px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700">View your event</a>
          <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#6b7280">Thanks for helping San Marcos know what's happening.</p>
          <p style="margin:8px 0 0;font-size:14px;font-weight:700;color:#374151">— SM-TX Events</p>
        </div>
      </div>
      <p style="margin:14px 0 0;text-align:center;font-size:12px;line-height:1.5;color:#9ca3af">You received this operational email because you submitted an event to sm-tx.com.</p>
    </div>
  </body>
</html>`;
  return { subject, text, html, eventUrl };
}

async function sendApprovalEmailMessage(env, submission) {
  const { subject, text, html } = approvalEmailContent(submission);
  const webhookUrl = env.SUBMISSION_EMAIL_WEBHOOK_URL
    || 'https://sm-tx-email-notifier.trinityvoxel.workers.dev/notify';

  if (env.SUBMISSION_EMAIL_WEBHOOK_SECRET) {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SUBMISSION_EMAIL_WEBHOOK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 'approval',
        to: submission.submitter_email,
        subject,
        text,
        html,
      }),
    });
    if (!response.ok) {
      throw new Error(`Approval email webhook returned ${response.status}`);
    }
    return;
  }

  if (
    env.EMAIL && typeof env.EMAIL.send === 'function'
    && env.SUBMISSION_ALERT_TO && env.SUBMISSION_ALERT_FROM
  ) {
    await env.EMAIL.send({
      to: submission.submitter_email,
      bcc: env.SUBMISSION_ALERT_TO,
      from: { email: env.SUBMISSION_ALERT_FROM, name: 'SM-TX Events' },
      subject,
      text,
      html,
    });
    return;
  }

  throw new Error('Approval email delivery is not configured');
}

async function deliverApprovalEmail(env, eventId) {
  const claim = await env.DB.prepare(`
    UPDATE event_submissions
    SET approval_email_status = 'sending', approval_email_error = NULL
    WHERE event_id = ?
      AND status = 'approved'
      AND approval_email_status IN ('queued', 'failed', 'held_for_template_approval', 'not_sent_legacy')
  `).bind(eventId).run();
  const changes = claim.changes ?? claim.meta?.changes ?? 0;
  if (!changes) return { sent: false, reason: 'not_queued' };

  try {
    const submission = await env.DB.prepare(`
      SELECT
        s.event_id, s.event_name, s.submitter_name, s.submitter_email,
        e.date_start, e.date_end, e.time, e.venue_name
      FROM event_submissions s
      JOIN events e ON e.id = s.event_id
      WHERE s.event_id = ? AND e.status = 'approved'
    `).bind(eventId).first();
    if (!submission) throw new Error('Approved submission record not found');

    await sendApprovalEmailMessage(env, submission);
    const sentAt = new Date().toISOString();
    await env.DB.prepare(`
      UPDATE event_submissions
      SET approval_email_status = 'sent', approval_email_sent_at = ?, approval_email_error = NULL
      WHERE event_id = ?
    `).bind(sentAt, eventId).run();
    return { sent: true, sentAt };
  } catch (error) {
    const message = String(error?.message || error).slice(0, 500);
    await env.DB.prepare(`
      UPDATE event_submissions
      SET approval_email_status = 'failed', approval_email_error = ?
      WHERE event_id = ?
    `).bind(message, eventId).run();
    throw error;
  }
}

async function scheduleApprovalEmail(context, env, eventId) {
  if (env.APPROVAL_EMAIL_ENABLED !== 'true') return;
  const task = deliverApprovalEmail(env, eventId).catch(error => {
    console.error('Approval email delivery failed:', error);
  });
  if (typeof context.waitUntil === 'function') {
    context.waitUntil(task);
  } else {
    await task;
  }
}

/**
 * Returns today's date string (YYYY-MM-DD) in America/Chicago (CST/CDT).
 * Avoids the UTC drift bug where dates after 6pm CST would return tomorrow's date.
 */
function todayCST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
}

const EVENT_SERIES_CUTOFFS = [
  {
    label: 'Summer in the Park 2026',
    pattern: /summer\s+in\s+the\s+park/i,
    lastDate: '2026-08-06',
  },
];

function isKnownStaleEvent(evt) {
  const text = `${evt.name || ''} ${evt.venue_name || ''} ${evt.description || ''} ${evt.url || ''}`;
  return EVENT_SERIES_CUTOFFS.some(series => (
    evt.date_start > series.lastDate && series.pattern.test(text)
  ));
}

const PUBLIC_EVENT_FIELDS = [
  'id', 'source', 'status', 'name', 'date_start', 'date_end', 'time',
  'venue_name', 'venue_address', 'category', 'description', 'url', 'cost',
  'kid_friendly', 'pet_friendly', 'age_21_plus', 'image_url', 'image_override',
  'created_at', 'updated_at',
];

function publicEventColumns(alias = '') {
  return PUBLIC_EVENT_FIELDS.map(field => `${alias}${field}`).join(', ');
}

function reviewSubmissionStatement(env, eventId, status, reviewedAt) {
  const pendingEmailStatus = env.APPROVAL_EMAIL_ENABLED === 'true'
    ? 'queued'
    : 'waiting_for_email_provider';
  const emailStatus = status === 'approved'
    ? `CASE WHEN approval_email_status IN ('sent', 'sending') THEN approval_email_status ELSE '${pendingEmailStatus}' END`
    : "'not_applicable'";
  return env.DB.prepare(`
    UPDATE event_submissions
    SET status = ?, reviewed_at = ?, approval_email_status = ${emailStatus}
    WHERE event_id = ?
  `).bind(status, reviewedAt, eventId);
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

const SCRAPER_WORKFLOW_MAP = {
  'smtx-event-scraper':   'event-scraper.yml',
  'smtx-browser-scraper': 'browser-scraper.yml',
};

async function getWorkflowState(env, workflow) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return null;
  const ghUrl = `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${workflow}`;
  const ghRes = await fetch(ghUrl, {
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'sm-tx-worker/1.0',
    },
  });
  if (!ghRes.ok) return null;
  const body = await ghRes.json();
  return body.state || null;
}

async function annotateJobsWithWorkflowState(jobs, env) {
  return Promise.all(jobs.map(async job => {
    const workflow = SCRAPER_WORKFLOW_MAP[job.id];
    if (!workflow) return job;

    const workflowState = await getWorkflowState(env, workflow).catch(() => null);
    if (!workflowState) return job;

    return {
      ...job,
      enabled: workflowState === 'active' ? 1 : 0,
      workflow,
      workflow_state: workflowState,
      enabled_source: 'github_actions',
    };
  }));
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
      let query = `SELECT ${publicEventColumns()} FROM events WHERE status = ?`;
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
        `SELECT ${publicEventColumns()} FROM events WHERE status = ? AND (
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
        `SELECT
          e.*,
          COALESCE(s.submitter_name, e.submitter_name) AS submitter_name,
          COALESCE(s.submitter_email, e.submitter_email) AS submitter_email,
          s.id AS submission_id,
          s.status AS submission_status,
          s.approval_email_status
        FROM events e
        LEFT JOIN event_submissions s ON s.event_id = e.id
        WHERE e.status = ?
        ORDER BY e.created_at DESC`
      ).bind('pending').all();
      return json(results);
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ── GET /api/admin/submissions ────────────────────────────────────────────
  if (method === 'GET' && rest === '/admin/submissions') {
    if (!isAuthed(request, env)) return err('Unauthorized', 401);
    try {
      const limit = Math.min(Math.max(Number(params.get('limit')) || 100, 1), 500);
      const { results } = await env.DB.prepare(`
        SELECT
          s.*,
          e.date_start,
          e.time,
          e.venue_name,
          e.status AS event_status
        FROM event_submissions s
        LEFT JOIN events e ON e.id = s.event_id
        ORDER BY s.submitted_at DESC
        LIMIT ?
      `).bind(limit).all();
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
      const submissionId = crypto.randomUUID();
      const now = new Date().toISOString();
      const submitterName = String(body.submitter_name).trim();
      const submitterEmail = String(body.submitter_email).trim();
      if (!submitterName) return err('Submitter name is required');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) return err('Invalid submitter email');

      const insertEvent = env.DB.prepare(`
        INSERT INTO events (
          id, source, status, name, date_start, date_end, time,
          venue_name, venue_address, category, description, url, cost,
          kid_friendly, pet_friendly, age_21_plus,
          created_at, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).bind(
        id, 'community', 'pending',
        body.name, body.date_start, body.date_end || null, body.time || null,
        body.venue_name, body.venue_address, body.category,
        body.description || null, body.url || null, body.cost || 'free',
        body.kid_friendly ? 1 : 0, body.pet_friendly ? 1 : 0, body.age_21_plus ? 1 : 0,
        now, now
      );
      const insertSubmission = env.DB.prepare(`
        INSERT INTO event_submissions (
          id, event_id, event_name, submitter_name, submitter_email,
          submitter_email_normalized, status, submitted_at, approval_email_status
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, 'pending_review')
      `).bind(
        submissionId, id, body.name, submitterName, submitterEmail,
        submitterEmail.toLowerCase(), now
      );
      await env.DB.batch([insertEvent, insertSubmission]);
      // Keep notification requests alive after returning the fast 201 response.
      // The previous untracked fetch could be cancelled when the Function ended.
      const notificationTask = notifySubmission(env, body, id, now);
      if (typeof context.waitUntil === 'function') {
        context.waitUntil(notificationTask);
      } else {
        await notificationTask;
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
      const event = await env.DB.prepare(
        `SELECT ${publicEventColumns()} FROM events WHERE id = ? AND status = 'approved'`
      ).bind(id).first();
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
      const statements = [
        env.DB.prepare(`UPDATE events SET ${sets.join(', ')} WHERE id = ?`).bind(...vals),
      ];
      if (body.status === 'approved' || body.status === 'rejected') {
        statements.push(reviewSubmissionStatement(env, id, body.status, vals[vals.length - 2]));
      }
      await env.DB.batch(statements);
      const updated = await env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
      if (!updated) return err('Event not found', 404);
      if (body.status === 'approved') {
        await scheduleApprovalEmail(context, env, id);
      }
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
      const now = new Date().toISOString();
      await env.DB.batch([
        reviewSubmissionStatement(env, id, 'rejected', now),
        env.DB.prepare('DELETE FROM events WHERE id = ?').bind(id),
      ]);
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
        if (isKnownStaleEvent(evt)) {
          skipped.push({ reason: 'known stale event series', event: evt.name, date_start: evt.date_start });
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
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare("UPDATE events SET status = 'approved', updated_at = ? WHERE id = ?").bind(now, evtId),
          reviewSubmissionStatement(env, evtId, 'approved', now),
        ]);
        await scheduleApprovalEmail(context, env, evtId);

        return htmlPage(
          'Event Approved',
          '✅',
          `<p><strong>${esc(event.name)}</strong> is now live on sm-tx.com.</p>`,
          '#10b981'
        );
      } else {
        const now = new Date().toISOString();
        await env.DB.batch([
          reviewSubmissionStatement(env, evtId, 'rejected', now),
          env.DB.prepare('DELETE FROM events WHERE id = ?').bind(evtId),
        ]);
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
      const jobs = await annotateJobsWithWorkflowState(results, env);
      return json(jobs);
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

    const workflow = SCRAPER_WORKFLOW_MAP[jobId];
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
