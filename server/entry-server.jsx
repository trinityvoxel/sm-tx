import React from "react";
import { renderToString } from "react-dom/server.browser";
import App from "../client/src/App.jsx";
import { loadModel, readEvents, attachEditorial } from "./model.js";
import { guides, staticPaths } from "../client/src/data/guides.js";
import {
  ORIGIN,
  usefulEvent,
  eventPath,
  calendarFile,
} from "../client/src/lib/events.js";
import { xml, jsonForHtml } from "../client/src/lib/content.js";
import { today, addDays } from "../client/src/lib/dates.js";
const analytics = `<script>if(location.hostname==='sm-tx.com'&&!location.pathname.startsWith('/admin')){window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','G-BK70Z5T50Z',{send_page_view:false});var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-BK70Z5T50Z';document.head.appendChild(s)}</script>`;
export function documentHtml(model, assets) {
  const { rawEvent, ...m } = model;
  const title = m.heading + " | SM-TX.com";
  const schema = [
    {
      "@type": "Organization",
      "@id": ORIGIN + "/#publisher",
      name: "SM-TX.com",
      url: ORIGIN,
    },
    {
      "@type": "WebSite",
      "@id": ORIGIN + "/#website",
      name: "SM-TX.com",
      url: ORIGIN,
      publisher: { "@id": ORIGIN + "/#publisher" },
    },
    ...(m.schema || []),
  ];
  if (m.path !== "/" && m.status === 200 && !m.noindex)
    schema.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
        ...(m.kind === "event"
          ? [
              {
                "@type": "ListItem",
                position: 2,
                name: "Events",
                item: ORIGIN + "/events",
              },
            ]
          : m.path.startsWith("/guides/")
            ? [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Guides",
                  item: ORIGIN + "/guides",
                },
              ]
            : []),
        {
          "@type": "ListItem",
          position: m.kind === "event" || m.path.startsWith("/guides/") ? 3 : 2,
          name: m.heading,
          item: m.canonical,
        },
      ],
    });
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${xml(title)}</title><meta name="description" content="${xml(m.description)}"><meta name="robots" content="${m.noindex ? "noindex,follow" : "index,follow"}"><link rel="canonical" href="${xml(m.canonical)}"><meta property="og:type" content="website"><meta property="og:site_name" content="SM-TX.com"><meta property="og:title" content="${xml(title)}"><meta property="og:description" content="${xml(m.description)}"><meta property="og:url" content="${xml(m.canonical)}"><meta property="og:image" content="${xml(m.event?.image || ORIGIN + "/social-card.jpg")}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg">${assets.css.map((x) => `<link rel="stylesheet" href="/${x}">`).join("")}<script type="application/ld+json">${jsonForHtml({ "@context": "https://schema.org", "@graph": schema })}</script>${analytics}</head><body><div id="root">${renderToString(<App model={m} />)}</div><script id="page-data" type="application/json">${jsonForHtml(m)}</script><script type="module" src="/${assets.js}"></script></body></html>`;
}
export async function handleRequest(request, env, assets) {
  const url = new URL(request.url);
  if (!["GET", "HEAD"].includes(request.method))
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  if (
    url.hostname === "www.sm-tx.com" ||
    (url.hostname === "sm-tx.com" && url.protocol === "http:")
  ) {
    url.protocol = "https:";
    url.hostname = "sm-tx.com";
    return Response.redirect(url, 301);
  }
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
    return Response.redirect(url, 301);
  }
  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
  try {
    const eventMatch = url.pathname.match(/^\/events\/(evt-[a-z0-9]+)$/);
    if (eventMatch) {
      let alias;
      try { alias = await env.DB.prepare('SELECT event_id FROM event_url_aliases WHERE old_id = ?').bind(eventMatch[1]).first(); }
      catch (error) { if (!/no such table/i.test(error.message)) throw error; }
      if (alias && /^evt-[a-z0-9]+$/.test(alias.event_id)) {
        url.pathname = '/events/' + alias.event_id;
        return Response.redirect(url, 301);
      }
      let held;
      try { held = await env.DB.prepare("SELECT e.name FROM events e JOIN event_date_reviews r ON r.name=e.name AND r.date_start=e.date_start AND r.source_url=e.url WHERE e.id=? AND e.status='pending'").bind(eventMatch[1]).first(); }
      catch (error) { if (!/no such table/i.test(error.message)) throw error; }
      if (held) return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Date being verified | SM-TX.com</title><style>body{background:#142537;color:#eef8f7;font:18px/1.6 system-ui;margin:0;padding:clamp(24px,8vw,100px)}main{max-width:680px}a{color:#55ddce}</style></head><body><main><a href="/">SM-TX.com</a><h1>${xml(held.name)}</h1><h2>We’re verifying this event’s date</h2><p>The previously imported date was unreliable. This listing is temporarily off the calendar while we confirm the schedule.</p><a href="/events">Browse other calendar listings</a></main></body></html>`, {headers:{...headers,'X-Robots-Tag':'noindex, follow'}});
    }
    if (url.pathname === "/sitemap.xml") {
      const events = await attachEditorial(env.DB, await readEvents(env.DB));
      const paths = [
        "/",
        "/events",
        "/events/today",
        "/events/this-weekend",
        "/calendar",
        ...staticPaths,
      ];
      const records = paths.map((path) => ({
        path,
        lastmod: guides.find((g) => g.path === path)?.reviewed,
      }));
      for (const e of events.filter(usefulEvent)) {
        const expired = (e.date_end || e.date_start) < addDays(today(), -90);
        if (!expired || e.editorial?.retain_archive)
          records.push({
            path: eventPath(e),
            lastmod: e.editorial?.content_updated_at || e.updated_at,
          });
      }
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
          records
            .map(
              (r) =>
                "<url><loc>" +
                xml(ORIGIN + r.path) +
                "</loc>" +
                (r.lastmod && !isNaN(Date.parse(r.lastmod))
                  ? "<lastmod>" +
                    xml(new Date(r.lastmod).toISOString()) +
                    "</lastmod>"
                  : "") +
                "</url>",
            )
            .join("") +
          "</urlset>",
        {
          headers: {
            ...headers,
            "Content-Type": "application/xml; charset=utf-8",
          },
        },
      );
    }
    let calendar = url.pathname.endsWith("/calendar.ics");
    if (calendar) url.pathname = url.pathname.slice(0, -13);
    const model = await loadModel(url, env);
    if (calendar) {
      if (model.kind !== "event")
        return new Response("Event not found", {
          status: 404,
          headers: { "X-Robots-Tag": "noindex" },
        });
      return new Response(calendarFile(model.rawEvent), {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": 'attachment; filename="sm-tx-event.ics"',
          "X-Robots-Tag": "noindex",
          "Cache-Control": "no-store",
        },
      });
    }
    if (model.noindex || url.hostname !== "sm-tx.com")
      headers["X-Robots-Tag"] = "noindex, follow";
    return new Response(documentHtml(model, assets), {
      status: model.status,
      headers,
    });
  } catch (error) {
    console.error("Public page unavailable:", error.message);
    return new Response(
      documentHtml(
        {
          path: url.pathname,
          heading: "The calendar is temporarily unavailable.",
          description:
            "We could not load current listings. Please try again shortly.",
          kind: "error",
          status: 503,
          noindex: true,
          canonical: ORIGIN + url.pathname,
        },
        assets,
      ),
      {
        status: 503,
        headers: { ...headers, "Retry-After": "60", "X-Robots-Tag": "noindex" },
      },
    );
  }
}
export { loadModel };
