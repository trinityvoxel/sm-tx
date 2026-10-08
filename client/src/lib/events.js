import { text, safeUrl } from "./content.js";
import {
  validDate,
  parseTime,
  zonedDateTime,
  formatDate,
  addDays,
} from "./dates.js";
export const ORIGIN = "https://sm-tx.com";
export const BOOKING_URL = "https://www.cohostr.com/book/297530";
export const LABELS = {
  music: "Music",
  arts: "Arts & culture",
  sports: "Sports",
  markets: "Markets",
  festivals: "Festivals",
  community: "Community",
  nightlife: "Nightlife",
  food: "Food & drink",
  outdoor: "Outdoors",
  education: "Education",
  other: "Other",
};
export const categoryOf = (e) =>
  e.category === "concert" ? "music" : e.category;
export const categoryLabel = (e) => LABELS[categoryOf(e)] || "Other";
export const eventPath = (e) => `/events/${encodeURIComponent(e.id)}`;
export const eventImage = (e) =>
  safeUrl(e.image_override) || safeUrl(e.image_url);
export function sortEvents(events) {
  return [...events].sort(
    (a, b) =>
      a.date_start.localeCompare(b.date_start) ||
      (parseTime(a.time) ?? 1440) - (parseTime(b.time) ?? 1440) ||
      a.name.localeCompare(b.name) ||
      a.id.localeCompare(b.id),
  );
}
export function usefulEvent(e) {
  return (
    e &&
    e.status === "approved" &&
    validDate(e.date_start) &&
    text(e.name).length > 2 &&
    !!text(e.venue_name) &&
    !!safeUrl(e.url) &&
    e.editorial?.indexable !== 0
  );
}
export function eventStatus(e) {
  return {
    scheduled: "Scheduled",
    cancelled: "Canceled",
    postponed: "Postponed",
    rescheduled: "Rescheduled",
  }[e.editorial?.event_status];
}
export function isListed(e) {
  return !["cancelled", "postponed"].includes(e.editorial?.event_status);
}
export function eventSchema(e) {
  if (!usefulEvent(e)) return null;
  const ed = e.editorial || {};
  const description = text(e.description);
  const start = ed.schedule_verified
    ? zonedDateTime(e.date_start, e.time)
    : null;
  const end =
    ed.schedule_verified && ed.end_time
      ? zonedDateTime(e.date_end || e.date_start, ed.end_time)
      : null;
  const schema = {
    "@type": "Event",
    "@id": ORIGIN + eventPath(e) + "#event",
    url: ORIGIN + eventPath(e),
    name: text(e.name),
    startDate: start || e.date_start,
  };
  if (description) schema.description = description;
  if (end && (!start || Date.parse(end) >= Date.parse(start)))
    schema.endDate = end;
  else if (e.date_end && validDate(e.date_end) && e.date_end !== e.date_start)
    schema.endDate = e.date_end;
  if (eventImage(e)) schema.image = [eventImage(e)];
  if (ed.location_verified) {
    schema.location = {
      "@type": "Place",
      name: text(e.venue_name),
      ...(e.venue_address ? { address: text(e.venue_address) } : {}),
    };
    if (ed.attendance_mode === "offline")
      schema.eventAttendanceMode =
        "https://schema.org/OfflineEventAttendanceMode";
  }
  if (ed.attendance_mode === "online" && safeUrl(e.url)) {
    schema.eventAttendanceMode = "https://schema.org/OnlineEventAttendanceMode";
    schema.location = { "@type": "VirtualLocation", url: safeUrl(e.url) };
  }
  const states = {
    scheduled: "EventScheduled",
    cancelled: "EventCancelled",
    postponed: "EventPostponed",
    rescheduled: "EventRescheduled",
  };
  if (ed.event_status === "rescheduled" && validDate(ed.previous_start_date))
    schema.previousStartDate = ed.previous_start_date;
  if (states[ed.event_status])
    schema.eventStatus = "https://schema.org/" + states[ed.event_status];
  if (ed.organizer_name)
    schema.organizer = {
      "@type": "Organization",
      name: text(ed.organizer_name),
      ...(safeUrl(ed.organizer_url) ? { url: ed.organizer_url } : {}),
    };
  if (
    ed.cost_verified &&
    ed.price !== null &&
    ed.price !== undefined &&
    Number(ed.price) >= 0 &&
    ed.currency === "USD" &&
    safeUrl(e.url)
  )
    schema.offers = {
      "@type": "Offer",
      price: Number(ed.price),
      priceCurrency: "USD",
      url: safeUrl(e.url),
    };
  return schema;
}
export function eventSummary(e) {
  return `${text(e.name)} — ${formatDate(e.date_start, { year: "numeric" })}${e.time ? ", " + text(e.time) : ""} at ${text(e.venue_name)}. View the listed details and official event source.`;
}
export function calendarFile(e) {
  const escape = (s) =>
    String(s || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/[,;]/g, "\\$&");
  const ed = e.editorial || {};
  const start = ed.schedule_verified
    ? zonedDateTime(e.date_start, e.time)
    : null;
  const end =
    ed.schedule_verified && ed.end_time
      ? zonedDateTime(e.date_end || e.date_start, ed.end_time)
      : null;
  const compact = (iso) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SM-TX//Events//EN",
    "BEGIN:VEVENT",
    `UID:${escape(e.id)}@sm-tx.com`,
    `DTSTAMP:${compact(Number.isFinite(Date.parse(e.updated_at)) ? e.updated_at : new Date().toISOString())}`,
  ];
  if (start) {
    lines.push("DTSTART:" + compact(start));
    if (end && Date.parse(end) > Date.parse(start))
      lines.push("DTEND:" + compact(end));
  } else
    lines.push(
      "DTSTART;VALUE=DATE:" + e.date_start.replaceAll("-", ""),
      "DTEND;VALUE=DATE:" +
        addDays(e.date_end || e.date_start, 1).replaceAll("-", ""),
    );
  lines.push(
    "SUMMARY:" + escape(text(e.name)),
    "LOCATION:" +
      escape([e.venue_name, e.venue_address].filter(Boolean).join(", ")),
    "DESCRIPTION:" +
      escape(
        `${text(e.description)}${!start && e.time ? "\nListed time: " + text(e.time) + ". Confirm with the organizer." : ""}\n${ORIGIN}${eventPath(e)}`,
      ),
    "URL:" + ORIGIN + eventPath(e),
  );
  if (ed.event_status === "cancelled") lines.push("STATUS:CANCELLED");
  lines.push("END:VEVENT", "END:VCALENDAR");
  // Fold on UTF-8 octet boundaries (RFC 5545), not JS character count.
  return (
    lines
      .map((line) => {
        let result = "",
          count = 0;
        for (const c of line) {
          const bytes = new TextEncoder().encode(c).length;
          if (count + bytes > 73) {
            result += "\r\n ";
            count = 1;
          }
          result += c;
          count += bytes;
        }
        return result;
      })
      .join("\r\n") + "\r\n"
  );
}
