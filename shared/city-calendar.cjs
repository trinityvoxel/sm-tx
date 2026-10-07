const { decode } = require("./txst.cjs");
const { structuredTime } = require("./schedule.cjs");
const plain = (value) =>
  decode(decode(value))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
function parseCityCalendar(html) {
  const events = [];
  // CivicEngage lists microdata inside each calendar item, not JSON-LD.
  for (const match of html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const block = match[1];
    if (!/itemtype=["']https?:\/\/schema.org\/Event["']/i.test(block)) continue;
    const prop = (key, source = block) =>
      plain(
        source.match(
          new RegExp(
            "<[^>]+itemprop=[\"']" +
              key +
              "[\"'][^>]*>([\\s\\S]*?)</(?:span|p|div)>",
            "i",
          ),
        )?.[1],
      );
    const start = prop("startDate"),
      name = prop("name");
    const href = decode(
      block.match(
        /href=["']([^"']*Calendar\.aspx\?[^"']*EID=\d+[^"']*)["']/i,
      )?.[1] || "",
    );
    if (!name || !/^\d{4}-\d{2}-\d{2}T/.test(start) || !href) continue;
    const url = new URL(href, "https://www.sanmarcostx.gov");
    const location = block.slice(block.search(/itemprop=["']location["']/i));
    const date_start = start.slice(0, 10);
    const description = prop("description");
    const address = [
      "streetAddress",
      "addressLocality",
      "addressRegion",
      "postalCode",
    ]
      .map((key) => prop(key, location))
      .filter(Boolean)
      .join(", ");
    events.push({
      name,
      date_start,
      time: structuredTime(start, date_start),
      venue_name: prop("name", location) || "Venue not listed",
      venue_address: address || null,
      description: description || null,
      url: `${url.origin}${url.pathname}?EID=${url.searchParams.get("EID")}`,
      category: /pickleball|basketball|volleyball|soccer|tennis/i.test(name)
        ? "sports"
        : "community",
      cost: null,
      kid_friendly: null,
      source: "scraped",
    });
  }
  return events;
}
module.exports = { parseCityCalendar };
