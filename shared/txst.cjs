const { startTime } = require("./schedule.cjs");
function decode(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n) => {
      const code = n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : +n;
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    })
    .replace(
      /&(amp|lt|gt|quot|apos|nbsp|ndash|mdash);/g,
      (_, n) =>
        ({
          amp: "&",
          lt: "<",
          gt: ">",
          quot: '"',
          apos: "'",
          nbsp: " ",
          ndash: "–",
          mdash: "—",
        })[n],
    );
}
const plain = (value) =>
  decode(decode(value))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
function parseTXSTItem(item) {
  const tag = (name) =>
    item.match(
      new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">", "i"),
    )?.[1] || "";
  const name = plain(tag("title"));
  const description = decode(decode(tag("description")));
  const day = plain(tag("category")).match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (!name || !day) return null;
  const date_start = day.slice(1).join("-");
  const beforeImage = description.split(/<img/i)[0];
  const lines = beforeImage
    .split(/<br\s*\/?\s*>/i)
    .map(plain)
    .filter(Boolean);
  const dateLine =
    lines.find((line) =>
      /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+\w+\s+\d/.test(
        line,
      ),
    ) || "";
  const field = (label) =>
    plain(
      description.match(
        new RegExp(
          "<b>\\s*" + label + "\\s*</b>\\s*:\\s*([\\s\\S]*?)(?=<br|<b>|$)",
          "i",
        ),
      )?.[1],
    );
  const firstLine = lines[0] || "";
  const venue_name =
    field("Campus Location") ||
    (firstLine !== dateLine && !/Ongoing|\d{4}/.test(firstLine)
      ? firstLine
      : "") ||
    "Texas State University";
  const type = field("Event Type");
  const topic = name + " " + type;
  let category = "education";
  if (/exhibit|gallery|museum|art show/i.test(topic)) category = "arts";
  else if (
    /volleyball|football|basketball|baseball|softball|soccer|tennis|golf|athletic|track and field/i.test(
      topic,
    )
  )
    category = "sports";
  else if (/concert|recital|choir|jazz|band|live music/i.test(topic))
    category = "music";
  else if (/family weekend|community/i.test(topic)) category = "community";
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const end = dateLine.match(
    /(?:through|–|—)\s*(?:\w+,?\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/i,
  );
  const date_end = end
    ? `${end[3]}-${String(months.findIndex((m) => m.toLowerCase() === end[1].toLowerCase()) + 1).padStart(2, "0")}-${end[2].padStart(2, "0")}`
    : null;
  return {
    name,
    date_start,
    date_end,
    time: startTime(dateLine),
    venue_name,
    venue_address: null,
    category,
    description: plain(description).slice(0, 1200),
    url: plain(tag("link")),
    cost: field("Cost") || null,
    kid_friendly: null,
    source: "scraped",
    source_provider: "txst_rss",
  };
}
module.exports = { parseTXSTItem, decode };
