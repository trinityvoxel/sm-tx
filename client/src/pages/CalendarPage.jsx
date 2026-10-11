import Link from "../components/Link.jsx";
import React from "react";
import { PageTitle, Arrow } from "../components/UI.jsx";
import { formatDate, addDays } from "../lib/dates.js";
export default function CalendarPage({ model: m }) {
  const groups = Object.groupBy
    ? Object.groupBy(m.events, (e) => e.date_start)
    : m.events.reduce(
        (a, e) => ({ ...a, [e.date_start]: [...(a[e.date_start] || []), e] }),
        {},
      );
  const offset = new Date(m.range.from + "T12:00:00Z").getUTCDay();
  const days = Number(m.range.to.slice(8));
  return (
    <>
      <PageTitle title="The San Marcos calendar">
        <p>
          Choose a date and find your next outing. Event times are listed as
          supplied; confirm details with the organizer.
        </p>
      </PageTitle>
      <nav className="calendar-nav" aria-label="Calendar month">
        <Link
          className="button secondary"
          href={"/calendar?month=" + m.previousMonth}
        >
          Previous month
        </Link>
        <h2>
          {formatDate(m.range.from, {
            month: "long",
            year: "numeric",
            day: undefined,
          })}
        </h2>
        <Link className="button secondary" href={"/calendar?month=" + m.nextMonth}>
          Next month
        </Link>
        <Link href="/calendar">Current month</Link>
      </nav>
      <div className="month-grid" aria-label="Dates with event listings">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <span className="weekday" key={d}>
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span className="blank" key={"b" + i} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = addDays(m.range.from, i);
          const count = m.events.filter(
            (e) => e.date_start <= date && (e.date_end || e.date_start) >= date,
          ).length;
          return (
            <div
              className={
                date === m.today ? "calendar-day is-today" : "calendar-day"
              }
              key={date}
            >
              <span>
                {i + 1}
                {date === m.today && <small>Today</small>}
              </span>
              {count > 0 && (
                <Link href={"/events?date=" + date}>
                  {count} {count === 1 ? "event" : "events"} <Arrow />
                </Link>
              )}
            </div>
          );
        })}
      </div>
      <section className="agenda">
        <h2>Events this month</h2>
        {!m.events.length ? (
          <p className="empty">
            No events are listed for this month yet.{" "}
            <Link href="/events">Browse upcoming events.</Link>
          </p>
        ) : (
          Object.entries(groups).map(([date, events]) => (
            <section className="agenda-day" key={date}>
              <h3>
                <time dateTime={date}>
                  {formatDate(date, { weekday: "short" })}
                </time>
              </h3>
              <ul>
                {events.map((e) => (
                  <li key={e.id}>
                    <div>
                      <Link href={e.path}>{e.name}</Link>
                      <p>
                        {e.venue_name}
                        {e.date_end && e.date_end !== date
                          ? " · Through " + formatDate(e.date_end)
                          : ""}
                      </p>
                    </div>
                    <span>{e.time || "Time not listed"}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </section>
    </>
  );
}
