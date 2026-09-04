const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

async function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
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

function validEmail(value) {
  return typeof value === 'string'
    && value.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/notify') {
      return json({ error: 'Not found' }, 404);
    }

    if (!env.WEBHOOK_SECRET || !env.SUBMISSION_ALERT_TO || !env.SUBMISSION_ALERT_FROM) {
      return json({ error: 'Email notifier is not configured' }, 503);
    }

    const authorization = request.headers.get('Authorization') || '';
    const authorized = await safeEqual(authorization, `Bearer ${env.WEBHOOK_SECRET}`);
    if (!authorized) return json({ error: 'Unauthorized' }, 401);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    const isApproval = body.kind === 'approval';
    if (
      typeof body.subject !== 'string' || !body.subject.trim() || body.subject.length > 200
      || typeof body.text !== 'string' || body.text.length > 100000
      || typeof body.html !== 'string' || body.html.length > 100000
      || (isApproval && !validEmail(body.to))
      || (body.kind && !isApproval)
      || (body.replyTo && !validEmail(body.replyTo))
    ) {
      return json({ error: 'Invalid email payload' }, 400);
    }

    try {
      const result = await env.EMAIL.send({
        to: isApproval ? body.to : env.SUBMISSION_ALERT_TO,
        ...(isApproval ? { bcc: env.SUBMISSION_ALERT_TO } : {}),
        from: { email: env.SUBMISSION_ALERT_FROM, name: 'SM-TX Events' },
        subject: body.subject.trim(),
        text: body.text,
        html: body.html,
        ...(body.replyTo ? { replyTo: body.replyTo } : {}),
      });
      return json({ ok: true, messageId: result.messageId });
    } catch (error) {
      console.error('Email send failed:', error);
      return json({ error: 'Email delivery failed' }, 502);
    }
  },
};
