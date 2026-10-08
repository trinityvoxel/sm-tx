import React from "react";
import {
  PageTitle,
  EventList,
  Lodging,
  BookingRibbon,
  Arrow,
  CalendarIcon,
} from "../components/UI.jsx";
import CategoryNav from "../components/CategoryNav.jsx";
import { guides } from "../data/guides.js";
import { formatDate } from "../lib/dates.js";
const categories = {
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
};
export default function Discovery({ model: m }) {
  return (
    <>
      {m.path === "/" ? (
        <section className="hero">
          <div>
            <p className="eyebrow">The local calendar · San Marcos, Texas</p>
            <h1>What’s happening in San Marcos</h1>
            <p>Music, markets, sports, and more.</p>
            <div className="actions">
              <a className="button secondary" href="/events/today">
                Today
              </a>
              <a className="button secondary" href="/events/this-weekend">
                This weekend
              </a>
            </div>
          </div>
          <BookingRibbon />
        </section>
      ) : (
        <PageTitle title={m.heading}>
          <p>{m.description}</p>
          {m.range && (
            <p className="date-context">
              {formatDate(m.range.from, { year: "numeric" })}–
              {formatDate(m.range.to, { year: "numeric" })} · Central Time
            </p>
          )}
        </PageTitle>
      )}
      {m.path === "/events/this-weekend" && <BookingRibbon />}
      <section className="discovery" aria-labelledby="events-heading">
        <h2 id="events-heading" className="sr-only">
          Upcoming events in San Marcos
        </h2>
        <div className="event-toolbar">
          <CategoryNav model={m} />
          <a className="calendar-control" href="/calendar">
            <CalendarIcon />
            Calendar View
          </a>
        </div>
        {m.path !== "/" && (
          <>
            <nav className="shortcuts" aria-label="Choose event dates">
              <a
                href="/events"
                aria-current={m.path === "/events" ? "page" : undefined}
              >
                Upcoming
              </a>
              <a
                href="/events/today"
                aria-current={m.path === "/events/today" ? "page" : undefined}
              >
                Today
              </a>
              <a
                href="/events/this-weekend"
                aria-current={
                  m.path === "/events/this-weekend" ? "page" : undefined
                }
              >
                This weekend
              </a>
            </nav>
            <form
              className="filters"
              method="get"
              action={m.path === "/" ? "/events" : m.path}
            >
              <div>
                <label htmlFor="q">Search events or venues</label>
                <input
                  id="q"
                  name="q"
                  type="search"
                  maxLength="100"
                  defaultValue={m.filters.q}
                  placeholder="Artist, market, venue…"
                />
              </div>
              <div>
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  defaultValue={m.filters.category}
                >
                  <option value="">All categories</option>
                  {Object.entries(categories).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="audience">More options</label>
                <select
                  id="audience"
                  name="audience"
                  defaultValue={m.filters.audience}
                >
                  <option value="">All events</option>
                  <option value="free">Listed as free</option>
                  <option value="family">Listed as kid-friendly</option>
                </select>
              </div>
              <button type="submit">Find events</button>
            </form>
          </>
        )}
        <p className="result-summary" role="status">
          {m.total} {m.total === 1 ? "event" : "events"} listed
          {m.filters.q ? " matching “" + m.filters.q + "”" : ""}
          {m.filtered ? " · Filters applied" : ""}.{" "}
          {m.filtered && (
            <a href={m.path === "/" ? "/events" : m.path}>Clear filters</a>
          )}
          <span>Details can change. Confirm with the official source.</span>
        </p>
        <EventList events={m.events} />
        {m.pages > 1 && m.path !== "/" && (
          <nav className="pagination" aria-label="Event result pages">
            {m.page > 1 && (
              <a className="button secondary" href={m.pageLink(m.page - 1)}>
                Previous
              </a>
            )}
            <span>
              Page {m.page} of {m.pages}
            </span>
            {m.page < m.pages && (
              <a className="button secondary" href={m.pageLink(m.page + 1)}>
                Next
              </a>
            )}
          </nav>
        )}
        {m.path === "/" && m.total > 9 && (
          <p className="center">
            <a className="button secondary" href="/events">
              See all upcoming events <Arrow />
            </a>
          </p>
        )}
      </section>
      {!m.filtered && (
        <>
          <Lodging />
          <section className="guides-preview">
            <div className="section-heading">
              <div>
                <p className="eyebrow">A little local direction</p>
                <h2>More than a date on the calendar.</h2>
              </div>
              <a href="/guides">
                Explore the guides <Arrow />
              </a>
            </div>
            <div className="guide-grid">
              {guides.slice(0, 3).map((g, i) => (
                <a className="guide-card" href={g.path} key={g.path}>
                  <span className="guide-number">0{i + 1}</span>
                  <h3>{g.title}</h3>
                  <p>{g.intro}</p>
                  <span>
                    Read the guide <Arrow />
                  </span>
                </a>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
