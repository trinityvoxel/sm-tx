export const ZONE = "America/Chicago";
export function today(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function validDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value || "") &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value
  );
}
export function addDays(date, count) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}
export function formatDate(date, options = {}) {
  if (!validDate(date)) return "Date to be confirmed";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    ...options,
  }).format(new Date(`${date}T12:00:00Z`));
}
export function weekend(date) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const friday = addDays(date, day === 0 ? -2 : day === 6 ? -1 : 5 - day);
  return { from: friday, to: addDays(friday, 2) };
}
export function parseTime(value) {
  const m = String(value || "")
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m || (!m[3] && !m[2])) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  if (min > 59 || (m[3] ? h < 1 || h > 12 : h > 23)) return null;
  if (m[3]) h = (h % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0);
  return h * 60 + min;
}
// A wall time may be missing or ambiguous during DST transitions. Never guess.
export function zonedDateTime(date, time, zone = ZONE) {
  const minutes = parseTime(time);
  if (!validDate(date) || minutes === null) return null;
  const wall = `${date}T${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const naive = Date.parse(wall + ":00Z");
  const matches = [];
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  for (const hours of [-6, -5]) {
    const instant = new Date(naive - hours * 3600000);
    if (fmt.format(instant).replace(" ", "T") === wall)
      matches.push(`${wall}:00${hours === -5 ? "-05:00" : "-06:00"}`);
  }
  return matches.length === 1 ? matches[0] : null;
}
export function overlaps(event, from, to) {
  return event.date_start <= to && (event.date_end || event.date_start) >= from;
}
export function monthRange(month) {
  if (!/^\d{4}-\d{2}$/.test(month || "") || !validDate(`${month}-01`))
    return null;
  const from = `${month}-01`;
  const d = new Date(from + "T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + 1);
  return { from, to: addDays(d.toISOString().slice(0, 10), -1) };
}
