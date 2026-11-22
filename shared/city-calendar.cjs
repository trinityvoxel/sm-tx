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
  // CivicPlus redesign groups cards beneath an explicit ISO date heading.
  for(const section of html.split(/aria-labelledby=["']calendar-events-header-/i).slice(1)) {
    const date=section.match(/^(\d{4}-\d{2}-\d{2})["']/)?.[1];
    if(!date)continue;
    for(const match of section.matchAll(/<li\b[^>]*id=["']event-\d+["'][^>]*>([\s\S]*?)<\/li>/gi)) {
      const block=match[1];
      const link=block.match(/<a\b[^>]*href=["'](\/m\/calendar\/event\/detail\/\d+)["'][^>]*>([\s\S]*?)<\/a>/i);
      if(!link)continue;
      const name=plain(link[2]);
      const details=block.slice(block.indexOf('class="events-category"'));
      const time=plain(details).match(/\b(\d{1,2}:\d{2}\s*[AP]M)\s*[-–]/i)?.[1]||null;
      const venue=plain(block.match(/class=["']calendar-location-content["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]);
      const description=plain(block.match(/class=["']redesign-text[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]);
      events.push({name,date_start:date,time,venue_name:venue||'Venue not listed',venue_address:null,description:description||null,url:'https://www.sanmarcostx.gov'+link[1],category:/pickleball|basketball|volleyball|soccer|tennis/i.test(name)?'sports':'community',cost:null,kid_friendly:null,source:'scraped'});
    }
  }
  return events;
}
module.exports = { parseCityCalendar };
