import Link from "./Link.jsx";
import React from "react";
import { formatDate } from "../lib/dates.js";
import { trackEvent } from "../analytics.js";
export const BOOKING = "https://www.cohostr.com/book/297530";
export function Arrow() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M4 12h15M13 5l7 7-7 7" />
    </svg>
  );
}
export function BookingLink({
  children = "Explore Riverbend Hideaway",
  className = "button",
  placement = "content",
}) {
  return (
    <Link
      className={className}
      href={BOOKING}
      rel="sponsored"
      onClick={() => trackEvent("riverbend_referral", { placement })}
    >
      {children}
      <Arrow />
    </Link>
  );
}
export function Lodging({ compact = false }) {
  return (
    <aside
      className={"lodging " + (compact ? "compact" : "")}
      aria-label="Riverbend Hideaway"
    >
      <div>
        <p className="eyebrow">Make a weekend of it</p>
        <h2>A good day deserves a longer stay.</h2>
        <p>
          Visiting for an event? Explore Riverbend Hideaway for your San Marcos
          trip.
        </p>
        <BookingLink placement="lodging_panel" />
      </div>
      <div className="river-art" aria-hidden="true">
        <svg viewBox="0 0 300 220" fill="none">
          <path
            d="M-40 210C190 210 50 70 340 30M-40 170C190 170 50 30 340-10M-40 250C190 250 50 110 340 70"
            stroke="currentColor"
            strokeWidth="24"
          />
        </svg>
      </div>
    </aside>
  );
}
export function EventCard({ event: e }) {
  const multipleDays = e.date_end && e.date_end !== e.date_start;
  return (
    <article className="event-card">
      <div className="event-date">
        {formatDate(e.date_start, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
        {multipleDays && <> – {formatDate(e.date_end)}</>}
      </div>
      <div className="card-body">
        <p className="eyebrow">{e.categoryLabel}</p>
        <h3>
          <Link href={e.path}>{e.name}</Link>
        </h3>
        <p className="event-time">
          {formatDate(e.date_start, { weekday: "short" })}
          {e.time
            ? " · " + e.time
            : multipleDays
              ? " · Check source for daily hours"
              : " · Time not listed"}
        </p>
        <p>{e.venue_name}</p>
        <div className="badges">
          {e.cost && (
            <span>{e.cost === "free" ? "Listed as free" : e.cost}</span>
          )}
          {e.kid_friendly === 1 && <span>Listed as kid-friendly</span>}
          {e.age_21_plus === 1 && <span>21+</span>}
          {e.occurrenceStatus && <span>{e.occurrenceStatus}</span>}
        </div>
      </div>
    </article>
  );
}
export function EventList({
  events,
  empty = "No events are listed for these dates yet.",
}) {
  return events.length ? (
    <div className="event-grid">
      {events.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  ) : (
    <div className="empty">
      <h2>Room for something new.</h2>
      <p>
        {empty} Try another date, browse upcoming events, or share an event with
        the community.
      </p>
      <Link href="/events">
        Browse upcoming events <Arrow />
      </Link>
      <Link href="/submit">
        Submit an event <Arrow />
      </Link>
    </div>
  );
}
export function PageTitle({ eyebrow, title, children }) {
  return (
    <header className="page-title">
      <p className="eyebrow">{eyebrow || "San Marcos, Texas"}</p>
      <h1>{title}</h1>
      {children && <div className="intro">{children}</div>}
    </header>
  );
}
export function Breadcrumbs({ items = [] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link href="/">Home</Link>
        </li>
        {items.map(([label, path], i) => (
          <li key={i}>
            {path ? (
              <Link href={path}>{label}</Link>
            ) : (
              <span aria-current="page">{label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 11h18M7 15h2m3 0h2m3 0h1M7 18h2m3 0h2" />
    </svg>
  );
}
export function BookingRibbon() {
  return (
    <aside className="booking-ribbon" aria-label="Riverbend Hideaway">
      <img
        src="/riverbend-hideaway.jpg"
        width="1280"
        height="934"
        alt="Riverbend Hideaway’s outdoor seating and fire pit at sunset"
        fetchPriority="high"
      />
      <div>
        <p className="eyebrow">Make a weekend&nbsp;of&nbsp;it</p>
        <h2>Riverbend Hideaway</h2>
        <p>Your place to unwind after the event.</p>
        <BookingLink placement="discovery_top">Check availability</BookingLink>
      </div>
    </aside>
  );
}
