// Private editorial endpoint. Never included in public event API projections.
const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
const fields = [
  "event_status",
  "previous_start_date",
  "schedule_verified",
  "location_verified",
  "attendance_mode",
  "end_time",
  "organizer_name",
  "organizer_url",
  "cost_verified",
  "price",
  "currency",
  "source_checked_at",
  "indexable",
  "retain_archive",
];
export async function onRequest({ request, env }) {
  if (!env.API_KEY || request.headers.get("X-SM-TX-Key") !== env.API_KEY)
    return json({ error: "Unauthorized" }, 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 200)
    return json({ error: "Event id is required" }, 400);
  try {
    const event = await env.DB.prepare("SELECT id FROM events WHERE id = ?")
      .bind(id)
      .first();
    if (!event) return json({ error: "Event not found" }, 404);
    if (request.method === "GET")
      return json(
        (await env.DB.prepare(
          "SELECT * FROM event_editorial WHERE event_id = ?",
        )
          .bind(id)
          .first()) || { event_id: id },
      );
    if (request.method !== "PUT")
      return json({ error: "Method not allowed" }, 405);
    const raw = await request.text();
    if (raw.length > 10000) return json({ error: "Payload too large" }, 413);
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    if (!body || Array.isArray(body) || typeof body !== "object")
      return json({ error: "Invalid payload" }, 400);
    const data = {};
    for (const key of fields)
      if (Object.hasOwn(body, key)) data[key] = body[key];
    for (const key of [
      "schedule_verified",
      "location_verified",
      "cost_verified",
      "indexable",
      "retain_archive",
    ])
      if (key in data && ![0, 1].includes(data[key]))
        return json({ error: `Invalid ${key}` }, 400);
    for (const key of [
      "organizer_name",
      "organizer_url",
      "end_time",
      "source_checked_at",
      "previous_start_date",
    ])
      if (
        data[key] != null &&
        (typeof data[key] !== "string" || data[key].length > 2000)
      )
        return json({ error: `Invalid ${key}` }, 400);
    if (
      data.event_status != null &&
      !["scheduled", "cancelled", "postponed", "rescheduled"].includes(
        data.event_status,
      )
    )
      return json({ error: "Invalid event status" }, 400);
    if (
      data.attendance_mode != null &&
      !["offline", "online"].includes(data.attendance_mode)
    )
      return json({ error: "Invalid attendance mode" }, 400);
    if (
      data.price != null &&
      (typeof data.price !== "number" ||
        !Number.isFinite(data.price) ||
        data.price < 0)
    )
      return json({ error: "Invalid price" }, 400);
    if (data.currency != null && data.currency !== "USD")
      return json({ error: "Currency must be USD" }, 400);
    if (data.organizer_url) {
      try {
        if (!["https:", "http:"].includes(new URL(data.organizer_url).protocol))
          throw new Error();
      } catch {
        return json({ error: "Invalid organizer URL" }, 400);
      }
    }
    if (
      data.source_checked_at &&
      (!Number.isFinite(Date.parse(data.source_checked_at)) ||
        Date.parse(data.source_checked_at) > Date.now())
    )
      return json(
        { error: "Source check must be a real, non-future date" },
        400,
      );
    if (!Object.keys(data).length)
      return json({ error: "No editorial fields provided" }, 400);
    data.content_updated_at = new Date().toISOString();
    const keys = Object.keys(data);
    await env.DB.prepare(
      `INSERT INTO event_editorial (event_id,${keys.join(",")}) VALUES (?,${keys.map(() => "?").join(",")}) ON CONFLICT(event_id) DO UPDATE SET ${keys.map((k) => `${k}=excluded.${k}`).join(",")}`,
    )
      .bind(id, ...keys.map((k) => data[k]))
      .run();
    return json({ ok: true });
  } catch (error) {
    if (/no such table.*event_editorial/i.test(error.message))
      return json(
        { error: "The optional editorial migration has not been applied." },
        503,
      );
    return json({ error: "Editorial data could not be saved." }, 500);
  }
}
