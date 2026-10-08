const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export async function onRequest({ request, env }) {
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin)
    return json({ error: "Please send this form from SM-TX.com." }, 403);
  const raw = await request.text();
  if (raw.length > 12000) return json({ error: "Message too long." }, 413);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid message." }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return json({ error: "Invalid message." }, 400);
  if (body.website) return json({ ok: true });
  if (
    typeof body.name !== "string" ||
    !body.name.trim() ||
    body.name.length > 200 ||
    typeof body.email !== "string" ||
    body.email.length > 254 ||
    !/^\S+@[^\s@]+\.[^\s@]+$/.test(body.email) ||
    typeof body.message !== "string" ||
    !body.message.trim() ||
    body.message.length > 5000 ||
    (body.event_id && typeof body.event_id !== "string") ||
    body.event_id?.length > 200
  )
    return json(
      { error: "Check your name, email, and message, then try again." },
      400,
    );
  let success = false;
  try {
    if (env.CONTACT_RATE_LIMITER) {
      ({ success } = await env.CONTACT_RATE_LIMITER.limit({
        key: request.headers.get("CF-Connecting-IP") || "unknown",
      }));
    } else if (env.DB && env.API_KEY) {
      const bucket = Math.floor(Date.now() / 900000);
      const material = `${env.API_KEY}:contact:${request.headers.get("CF-Connecting-IP") || "unknown"}:${bucket}`;
      const hash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(material),
      );
      const key = Array.from(new Uint8Array(hash), (n) =>
        n.toString(16).padStart(2, "0"),
      ).join("");
      const row = await env.DB.prepare(
        "INSERT INTO contact_rate_limits (bucket_key,request_count,expires_at) VALUES (?,1,?) ON CONFLICT(bucket_key) DO UPDATE SET request_count=request_count+1 RETURNING request_count",
      )
        .bind(key, (bucket + 2) * 900000)
        .first();
      success = row.request_count <= 5;
      await env.DB.prepare(
        "DELETE FROM contact_rate_limits WHERE expires_at < ?",
      )
        .bind(Date.now())
        .run();
    } else {
      return json(
        {
          error:
            "Contact messages are not enabled yet. Please try again later.",
        },
        503,
      );
    }
  } catch {
    return json(
      {
        error:
          "Contact messages are temporarily unavailable. Please try again later.",
      },
      503,
    );
  }
  if (!success)
    return json(
      { error: "Too many messages. Please wait before trying again." },
      429,
    );
  if (!env.SUBMISSION_EMAIL_WEBHOOK_SECRET || !env.SUBMISSION_EMAIL_WEBHOOK_URL)
    return json(
      {
        error:
          "Contact messages are temporarily unavailable. Please try again later.",
      },
      503,
    );
  const text = [
    "Message for SM-TX.com Admin",
    `From: ${body.name} <${body.email}>`,
    `Event reference: ${body.event_id || "Not provided"}`,
    "",
    body.message,
  ].join("\n");
  try {
    const response = await fetch(env.SUBMISSION_EMAIL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SUBMISSION_EMAIL_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify({
        subject: "SM-TX.com contact message",
        text,
        html: "<pre>" + escape(text) + "</pre>",
        replyTo: body.email,
      }),
    });
    if (!response.ok) throw new Error("Delivery failed");
    return json({ ok: true });
  } catch {
    return json(
      { error: "Your message could not be delivered. Please try again later." },
      502,
    );
  }
}
