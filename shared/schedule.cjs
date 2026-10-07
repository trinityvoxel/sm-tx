// Extract only explicit clocks. Dates and descriptions without clocks stay unknown.
function startTime(value) {
  const text = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&ndash;|&#8211;/g, "–")
    .replace(/&mdash;|&#8212;/g, "—")
    .trim();
  const range = text.match(
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,
  );
  if (range) {
    // A range crossing noon without an explicit first meridiem is ambiguous.
    if (
      !range[3] &&
      Number(range[1]) > Number(range[4]) &&
      Number(range[1]) !== 12
    )
      return null;
    return clock(range[1], range[2], range[3] || range[6]);
  }
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (match) return clock(match[1], match[2], match[3]);
  const military = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (military && Number(military[1]) < 24 && Number(military[2]) < 60)
    return `${military[1].padStart(2, "0")}:${military[2]}`;
  return null;
}
function clock(hour, minute = "00", meridiem) {
  if (+hour < 1 || +hour > 12 || +(minute || 0) > 59) return null;
  return `${+hour}:${minute || "00"} ${meridiem.toUpperCase()}`;
}
function structuredTime(value, occurrenceDate) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value || "")) return null;
  if (/([+-]\d{2}:?\d{2}|Z)$/.test(value)) {
    const date = new Date(value);
    if (!Number.isFinite(+date)) return null;
    const localDay = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    if (localDay !== occurrenceDate) return null;
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
  return value.slice(0, 10) === occurrenceDate
    ? startTime(value.slice(11, 16))
    : null;
}
module.exports = { startTime, structuredTime };
