import React, { useState, useRef } from "react";
import { PageTitle } from "../components/UI.jsx";
import { trackEvent } from "../analytics.js";
export default function Forms({ contact = false, eventId = "" }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  const feedback = useRef();
  async function send(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const raw = Object.fromEntries(new FormData(form));
    if (!contact && raw.date_end && raw.date_end < raw.date_start) {
      setError("End date must be on or after the start date.");
      setTimeout(() => feedback.current?.focus(), 0);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = contact
        ? raw
        : {
            ...raw,
            kid_friendly: !!raw.kid_friendly,
            pet_friendly: !!raw.pet_friendly,
            age_21_plus: !!raw.age_21_plus,
          };
      const res = await fetch(contact ? "/api/contact" : "/api/events/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let data;
        try {
          data = await res.json();
        } catch {}
        throw new Error(
          data?.error ||
            "We could not send this right now. Your entries are still here; please try again.",
        );
      }
      if (!contact)
        trackEvent("generate_lead", {
          lead_source: "community_event_submission",
          event_category: raw.category,
        });
      setDone(true);
      setTimeout(() => feedback.current?.focus(), 0);
    } catch (e) {
      setError(e.message);
      setTimeout(() => feedback.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  }
  const field = (
    name,
    label,
    type = "text",
    required = true,
    help = "",
    extra = {},
  ) => (
    <div className="field" key={name}>
      <label htmlFor={name}>
        {label}
        {required ? " *" : " (optional)"}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        maxLength={type === "email" ? 254 : 200}
        aria-describedby={help ? name + "-help" : undefined}
        {...extra}
      />
      {help && <small id={name + "-help"}>{help}</small>}
    </div>
  );
  return (
    <div className="form-layout">
      <section>
        <PageTitle
          eyebrow={contact ? "SM-TX.com Admin" : "Made better by the community"}
          title={contact ? "Get in touch." : "Share something good."}
        >
          <p>
            {contact
              ? "Send a question or suggest a correction. Your message goes privately to the site administrator."
              : "Hosting an event in the San Marcos area? Send the details for review. Approved events appear in the community calendar."}
          </p>
        </PageTitle>
        {done ? (
          <div className="success" tabIndex="-1" ref={feedback} role="status">
            <h2>
              {contact
                ? "Your message is on its way."
                : "Your event has been submitted."}
            </h2>
            <p>
              {contact
                ? "Thank you for helping keep SM-TX.com useful."
                : "The listing is awaiting review. Your contact information will not appear on the event page."}
            </p>
            <a href="/events">Browse upcoming events</a>
          </div>
        ) : (
          <form onSubmit={send} className="submission-form">
            <p className="small">Fields marked * are required.</p>
            {error && (
              <div className="error" role="alert" ref={feedback} tabIndex="-1">
                {error}
              </div>
            )}
            {contact ? (
              <>
                <div className="form-row">
                  {field("name", "Your name")}
                  {field(
                    "email",
                    "Your email",
                    "email",
                    true,
                    "Used only to respond to your message.",
                    { autoComplete: "email" },
                  )}
                </div>
                {field(
                  "event_id",
                  "Event reference",
                  "text",
                  false,
                  "Include an event link or reference if your message is about a listing.",
                  { defaultValue: eventId },
                )}
                <div className="field">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    maxLength="5000"
                    rows="7"
                  />
                </div>
                <div className="honeypot" aria-hidden="true">
                  <label htmlFor="website">Leave this blank</label>
                  <input
                    id="website"
                    name="website"
                    tabIndex="-1"
                    autoComplete="off"
                  />
                </div>
              </>
            ) : (
              <>
                <fieldset>
                  <legend>1. The event</legend>
                  {field("name", "Event name")}
                  <div className="form-row">
                    {field("date_start", "Start date", "date")}
                    {field("date_end", "End date", "date", false)}
                  </div>
                  {field(
                    "time",
                    "Start time",
                    "text",
                    false,
                    "Include AM/PM and timezone if known; leave blank if not confirmed.",
                    { placeholder: "e.g. 7:30 PM Central" },
                  )}
                  <div className="field">
                    <label htmlFor="category">Category *</label>
                    <select
                      id="category"
                      name="category"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Choose a category
                      </option>
                      {Object.entries({
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
                      }).map(([v, l]) => (
                        <option value={v} key={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="description">Description *</label>
                    <textarea
                      id="description"
                      name="description"
                      maxLength="500"
                      rows="5"
                      required
                      aria-describedby="description-help"
                    />
                    <small id="description-help">
                      Up to 500 characters. Tell visitors what to expect using
                      factual details.
                    </small>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>2. Place and admission</legend>
                  {field("venue_name", "Venue name")}
                  {field("venue_address", "Venue address")}
                  {field(
                    "url",
                    "Official event or ticket link",
                    "url",
                    true,
                    "Use a complete https:// or http:// address.",
                    { pattern: "https?://.*", maxLength: 2000 },
                  )}
                  {field(
                    "cost",
                    "Admission / ticket cost",
                    "text",
                    true,
                    "Write “free” only when confirmed; otherwise enter the price or “Check official source”.",
                  )}
                  <div className="field">
                    <span className="label">Check only confirmed details</span>
                    {[
                      ["kid_friendly", "Kid-friendly"],
                      ["pet_friendly", "Pet-friendly"],
                      ["age_21_plus", "Age 21+ only"],
                    ].map(([name, label]) => (
                      <label className="checkbox" key={name}>
                        <input name={name} type="checkbox" />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend>3. Your contact details</legend>
                  {field(
                    "submitter_name",
                    "Your name",
                    "text",
                    true,
                    "For the review process; not published.",
                    { autoComplete: "name" },
                  )}
                  {field(
                    "submitter_email",
                    "Your email",
                    "email",
                    true,
                    "Used for submission administration and approval notifications; not published.",
                    { autoComplete: "email" },
                  )}
                </fieldset>
              </>
            )}
            <p className="small">
              Please send only information needed to handle this{" "}
              {contact ? "message" : "listing"}.{" "}
              <a href="/editorial-policy">Editorial and privacy information</a>.
            </p>
            <button type="submit" disabled={busy}>
              {busy
                ? "Sending…"
                : contact
                  ? "Send message"
                  : "Submit event for review"}
            </button>
            <noscript>
              <p>
                Sending this form requires JavaScript. Event listings and guides
                remain available without it.
              </p>
            </noscript>
          </form>
        )}
      </section>
      <aside className="form-aside">
        <h2>
          {contact ? "A useful correction includes" : "Before you submit"}
        </h2>
        <ul>
          {(contact
            ? [
                "The event name or page link.",
                "What needs to change.",
                "An official source that confirms the update.",
              ]
            : [
                "Accurate dates and a clear venue address.",
                "A link to the official organizer or ticket page.",
                "Admission and audience details you can confirm.",
              ]
          ).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p>
          Messages are handled by SM-TX.com Admin. Event information is reviewed
          before publication.
        </p>
      </aside>
    </div>
  );
}
