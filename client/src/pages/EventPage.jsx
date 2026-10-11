import Link from "../components/Link.jsx";
import React, { useState } from "react";
import {
  Breadcrumbs,
  Lodging,
  EventList,
  BookingLink,
  Arrow,
} from "../components/UI.jsx";
import { formatDate } from "../lib/dates.js";
import { trackEvent } from "../analytics.js";
export default function EventPage({ model: m }) {
  const e = m.event;
  const [message, setMessage] = useState("");
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({ title: e.name, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setMessage("Event link copied.");
      }
    } catch (err) {
      if (err.name !== "AbortError")
        setMessage("Copy the address from your browser to share this event.");
    }
  }
  return (
    <>
      <Breadcrumbs items={[["Events", "/events"], [e.name]]} />
      <div className="event-layout">
        <article>
          <p className="eyebrow">{e.categoryLabel} · San Marcos area listing</p>
          <h1>{e.name}</h1>
          {m.expired && (
            <p className="notice">
              This event has ended. These details are kept for reference.{" "}
              <Link href="/events">Find upcoming events.</Link>
            </p>
          )}
          {e.occurrenceStatus && (
            <p className="notice">Event status: {e.occurrenceStatus}</p>
          )}
          <dl className="event-facts">
            <div>
              <dt>When</dt>
              <dd>
                <time dateTime={e.date_start}>
                  {formatDate(e.date_start, {
                    weekday: "long",
                    year: "numeric",
                  })}
                </time>
                {e.date_end && e.date_end !== e.date_start && (
                  <>–{formatDate(e.date_end, { year: "numeric" })}</>
                )}
                <span>
                  {e.time || "Time not listed"}
                  {e.editorial?.schedule_verified
                    ? " · Central Time"
                    : " · Confirm time and timezone with the organizer"}
                </span>
              </dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>
                {e.editorial?.attendance_mode === "online"
                  ? "Online event"
                  : e.venue_name}
                <span>
                  {e.venue_address ||
                    "Address not listed — check the official source"}
                </span>
              </dd>
            </div>
            <div>
              <dt>Admission</dt>
              <dd>
                {e.cost === "free"
                  ? "Listed as free"
                  : e.cost || "Check the official source"}
                <span>
                  Confirm tickets, fees, and availability with the organizer.
                </span>
              </dd>
            </div>
            {e.editorial?.organizer_name && (
              <div>
                <dt>Organizer</dt>
                <dd>
                  {e.editorial.organizer_url ? (
                    <Link href={e.editorial.organizer_url}>
                      {e.editorial.organizer_name}
                    </Link>
                  ) : (
                    e.editorial.organizer_name
                  )}
                </dd>
              </div>
            )}
            {e.editorial?.end_time && e.editorial.schedule_verified === 1 && (
              <div>
                <dt>Ends</dt>
                <dd>
                  {formatDate(e.date_end || e.date_start)} ·{" "}
                  {e.editorial.end_time} Central Time
                </dd>
              </div>
            )}
            {e.editorial?.event_status === "rescheduled" &&
              e.editorial.previous_start_date && (
                <div>
                  <dt>Previously</dt>
                  <dd>
                    {formatDate(e.editorial.previous_start_date, {
                      year: "numeric",
                    })}
                  </dd>
                </div>
              )}
          </dl>
          <div className="actions">
            {e.url && (
              <Link
                className="button"
                href={e.url}
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent("official_event_click", { event_id: e.id })
                }
              >
                Official event page <Arrow />
              </Link>
            )}
            {!m.expired && (
              <Link className="button secondary" href={`${e.path}/calendar.ics`}>
                Add to calendar
              </Link>
            )}
            <button className="text-button" onClick={share}>
              Share event
            </button>
          </div>
          <p role="status" className="small">
            {message}
          </p>
          {!e.editorial?.schedule_verified && !m.expired && (
            <p className="small muted">
              Calendar downloads use an all-day reminder until the start time
              and timezone have been verified.
            </p>
          )}
          <section className="event-description">
            <h2>About this event</h2>
            {e.descriptionHtml ? (
              <div dangerouslySetInnerHTML={{ __html: e.descriptionHtml }} />
            ) : (
              <p>
                No description has been provided. Follow the official event link
                for details.
              </p>
            )}
            <div className="badges">
              {e.kid_friendly === 1 && <span>Listed as kid-friendly</span>}
              {e.pet_friendly === 1 && <span>Listed as pet-friendly</span>}
              {e.age_21_plus === 1 && <span>21+</span>}
            </div>
          </section>
          <section className="source-note">
            <h2>Check before you go</h2>
            <p>
              This listing comes from {e.sourceLabel}. Event times, access, and
              admission can change. The official organizer is the source for
              current details.
            </p>
            {e.editorial?.source_checked_at && (
              <p>
                Source checked:{" "}
                <time dateTime={e.editorial.source_checked_at}>
                  {formatDate(e.editorial.source_checked_at.slice(0, 10), {
                    year: "numeric",
                  })}
                </time>
                .
              </p>
            )}
            <p>
              <Link href={`/contact?event=${encodeURIComponent(e.id)}`}>
                Suggest a correction
              </Link>{" "}
              · <Link href="/editorial-policy">How listings work</Link>
            </p>
          </section>
        </article>
        <aside className="event-aside">
          {e.image && (
            <img
              src={e.image}
              alt=""
              width="640"
              height="480"
              onError={(ev) => {
                ev.currentTarget.hidden = true;
              }}
            />
          )}
          <div className="aside-links">
            <p className="eyebrow">Visiting for this event?</p>
            <h2>Plan your stay.</h2>
            <p>Explore Riverbend Hideaway for your San Marcos trip.</p>
            <BookingLink placement="event_sidebar" />
            <p className="small muted">Publisher’s vacation rental</p>
          </div>
          <div className="aside-links">
            <h2>Keep exploring</h2>
            <Link href={"/events?category=" + encodeURIComponent(e.category)}>
              {e.categoryLabel} events <Arrow />
            </Link>
            <Link href="/events/this-weekend">
              This weekend <Arrow />
            </Link>
            <Link href="/guides/things-to-do">
              Plan your San Marcos visit <Arrow />
            </Link>
          </div>
        </aside>
      </div>
      {m.related.length > 0 && (
        <section>
          <div className="section-heading">
            <h2>More upcoming events</h2>
            <Link href="/events">
              View all <Arrow />
            </Link>
          </div>
          <EventList events={m.related} />
        </section>
      )}
      <Lodging compact />
    </>
  );
}
