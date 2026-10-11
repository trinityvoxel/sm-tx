import {
  today,
  weekend,
  addDays,
  monthRange,
  validDate,
} from "../client/src/lib/dates.js";
import { cleanHtml, text, safeUrl } from "../client/src/lib/content.js";
import {
  ORIGIN,
  categoryOf,
  categoryLabel,
  eventPath,
  eventImage,
  eventStatus,
  usefulEvent,
  isListed,
  sortEvents,
  eventSummary,
  eventSchema,
} from "../client/src/lib/events.js";
import { guides, staticPaths } from "../client/src/data/guides.js";
const PUBLIC_FIELDS =
  "id,source,status,name,date_start,date_end,time,venue_name,venue_address,category,description,url,cost,kid_friendly,pet_friendly,age_21_plus,image_url,image_override,created_at,updated_at";
export async function readEvents(db, where = "1=1", bindings = [], index = "") {
  let response;
  try { response = await db
    .prepare(
      `SELECT ${PUBLIC_FIELDS} FROM events ${index ? 'INDEXED BY '+index : ''} WHERE status = 'approved' AND (${where}) ORDER BY date_start,time,id`,
    )
    .bind(...bindings)
    .all();
  } catch(error) {
    if(index && /no such index/i.test(error.message))return readEvents(db,where,bindings);
    throw error;
  }
  return response.results || [];
}
export function publicEvent(e) {
  return {
    id: e.id,
    name: text(e.name),
    date_start: e.date_start,
    date_end: validDate(e.date_end) ? e.date_end : null,
    time: text(e.time),
    venue_name: text(e.venue_name),
    venue_address: text(e.venue_address),
    category: categoryOf(e),
    categoryLabel: categoryLabel(e),
    descriptionHtml: cleanHtml(e.description),
    url: safeUrl(e.url),
    cost:
      e.editorial?.cost_verified &&
      e.editorial.price != null &&
      e.editorial.currency === "USD"
        ? Number(e.editorial.price) === 0
          ? "Free (verified)"
          : new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(e.editorial.price)
        : text(e.cost),
    kid_friendly: e.kid_friendly,
    pet_friendly: e.pet_friendly,
    age_21_plus: e.age_21_plus,
    image: eventImage(e),
    path: eventPath(e),
    sourceLabel:
      e.source === "community"
        ? "a community submission"
        : "a public event source",
    occurrenceStatus: eventStatus(e),
    editorial: e.editorial || null,
  };
}
export async function attachEditorial(db, events) {
  try {
    if (!events.length) return [];
    const results=[];
    for(let i=0;i<events.length;i+=80){
      const ids=events.slice(i,i+80).map(e=>e.id);
      const batch=await db.prepare(`SELECT * FROM event_editorial WHERE event_id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all();
      results.push(...batch.results);
    }
    const byId = new Map(results.map((e) => [e.event_id, e]));
    return events.map((e) => ({ ...e, editorial: byId.get(e.id) }));
  } catch (error) {
    if (/no such table.*event_editorial/i.test(error.message)) return events;
    throw error;
  }
}
export async function loadModel(url, env, now = new Date()) {
  const path = url.pathname,
    day = today(now),
    query = url.searchParams;
  const m = {
    path,
    query: query.toString(),
    today: day,
    status: 200,
    noindex: false,
    canonical: ORIGIN + path,
    kind: "editorial",
    heading: "",
    description: "",
    schema: [],
  };
  if (path.startsWith("/admin"))
    return { ...m, kind: "admin", heading: "Administration", noindex: true };
  const titles = {
    "/guides": "San Marcos guides",
    "/about": "About SM-TX.com",
    "/editorial-policy": "Editorial policy & submission privacy",
    "/submit": "Submit a San Marcos event",
    "/contact": "Contact SM-TX.com Admin",
    "/stay": "Riverbend Hideaway · Plan your stay",
  };
  if (staticPaths.includes(path)) {
    const g = guides.find((g) => g.path === path);
    return {
      ...m,
      heading: g?.title || titles[path],
      description:
        g?.intro ||
        {
          "/about":
            "About SM-TX.com, an independent event-discovery site for San Marcos, Texas.",
          "/guides":
            "Practical San Marcos guides for things to do, dining, outdoor activities, and a Hill Country weekend.",
        }[path] ||
        titles[path],
      kind:
        path === "/submit"
          ? "submit"
          : path === "/contact"
            ? "contact"
            : "editorial",
      eventId: query.get("event")?.slice(0, 200) || "",
      noindex: query.size > 0,
    };
  }
  if (
    [
      "/",
      "/events",
      "/events/today",
      "/events/this-weekend",
      "/calendar",
    ].includes(path)
  ) {
    let range = { from: day, to: addDays(day, 90) };
    if (path === "/events/today") range = { from: day, to: day };
    if (path === "/events/this-weekend") range = weekend(day);
    if (path === "/calendar") {
      range = monthRange(query.get("month") || day.slice(0, 7));
      if (!range) return notFound(m);
    }
    if (validDate(query.get("date")))
      range = { from: query.get("date"), to: query.get("date") };
    let raw = await attachEditorial(
      env.DB,
      await readEvents(
        env.DB,
        "date_start <= ? AND COALESCE(NULLIF(date_end,''),date_start) >= ?",
        [range.to, range.from],
        "idx_events_effective_end",
      ),
    );
    raw = raw.filter((e) => validDate(e.date_start) && isListed(e));
    const filters = {
      q: (query.get("q") || "").slice(0, 100),
      category: query.get("category") || "",
      audience: query.get("audience") || "",
    };
    if (filters.q) {
      const q = filters.q.toLowerCase();
      raw = raw.filter((e) =>
        [e.name, e.venue_name].some((s) => s?.toLowerCase().includes(q)),
      );
    }
    if (filters.category)
      raw = raw.filter((e) => categoryOf(e) === filters.category);
    if (filters.audience === "free")
      raw = raw.filter((e) => e.cost?.toLowerCase() === "free");
    if (filters.audience === "family")
      raw = raw.filter((e) => e.kid_friendly === 1);
    raw = sortEvents(raw);
    const total = raw.length,
      pageSize = path === "/" ? 9 : path === "/calendar" ? 5000 : 24,
      pages = Math.max(1, Math.ceil(total / pageSize));
    let page = Number(query.get("page") || 1);
    if (!Number.isInteger(page) || page < 1 || page > pages) return notFound(m);
    const noindex =
      [...query.keys()].some((k) => k !== "page") ||
      (path === "/" && query.size > 0);
    const selected = raw.slice((page - 1) * pageSize, page * pageSize);
    const headings = {
      "/": "San Marcos events, today & this weekend",
      "/events": "Upcoming events in San Marcos",
      "/events/today": "What’s happening in San Marcos today?",
      "/events/this-weekend": "Things to do in San Marcos this weekend",
      "/calendar": "San Marcos events calendar",
    };
    const description =
      path === "/events/today"
        ? "Find listed events happening today in San Marcos, Texas. Check times, venues, admission, and official sources."
        : path === "/events/this-weekend"
          ? "Explore Friday through Sunday event listings in San Marcos, Texas. Find music, markets, and community gatherings, with links to official details."
          : "Browse upcoming San Marcos, Texas event listings by date, category, or venue, and confirm details with the official organizer.";
    return {
      ...m,
      kind: path === "/calendar" ? "calendar" : "discovery",
      heading: headings[path] + (page > 1 ? " · Page " + page : ""),
      description,
      range,
      filters,
      filtered: !!(
        filters.q ||
        filters.category ||
        filters.audience ||
        query.get("date")
      ),
      total,
      page,
      pages,
      events: selected.map(publicEvent),
      noindex,
      canonical: ORIGIN + path + (page > 1 && !noindex ? "?page=" + page : ""),
      schema: [
        {
          "@type": "ItemList",
          itemListElement: selected.map((e, i) => ({
            "@type": "ListItem",
            position: (page - 1) * pageSize + i + 1,
            url: ORIGIN + eventPath(e),
            name: text(e.name),
          })),
        },
      ],
      previousMonth: addDays(range.from, -1).slice(0, 7),
      nextMonth: addDays(range.to, 1).slice(0, 7),
    };
  }
  const match = path.match(/^\/events\/([^/]+)$/);
  if (match) {
    let id;
    try {
      id = decodeURIComponent(match[1]);
    } catch {
      return notFound(m);
    }
    const [e] = await attachEditorial(
      env.DB,
      await readEvents(env.DB, "id = ?", [id]),
    );
    if (!e || !validDate(e.date_start)) return notFound(m);
    // Read only the earliest day(s) needed for three related events, rather
    // than every event in the next 90 days. Sort complete days in JS so mixed
    // source clock formats retain the existing chronological behavior.
    const related=[];
    let cursor=day;
    const through=addDays(day,90);
    while(related.length<3 && cursor<=through){
      const next=await env.DB.prepare("SELECT MIN(date_start) AS day FROM events WHERE status='approved' AND date_start>=? AND date_start<=? AND id!=?").bind(cursor,through,id).first();
      if(!next?.day || !validDate(next.day))break;
      const candidates=await attachEditorial(env.DB,await readEvents(env.DB,"date_start=? AND id!=?",[next.day,id]));
      related.push(...sortEvents(candidates.filter(isListed)).slice(0,3-related.length));
      cursor=addDays(next.day,1);
    }
    return {
      ...m,
      kind: "event",
      event: publicEvent(e),
      rawEvent: e,
      heading: text(e.name),
      description: eventSummary(e),
      expired: (e.date_end || e.date_start) < day,
      related: related.map(publicEvent),
      noindex:
        !usefulEvent(e) ||
        query.size > 0 ||
        ((e.date_end || e.date_start) < addDays(day, -90) &&
          !e.editorial?.retain_archive),
      schema: [eventSchema(e)].filter(Boolean),
    };
  }
  return notFound(m);
}
export function notFound(m) {
  return {
    ...m,
    kind: "error",
    status: 404,
    noindex: true,
    heading: "That page isn’t here.",
    description:
      "The link may have changed, or the event may not be published. Explore current listings to find something else.",
  };
}
export { PUBLIC_FIELDS };
