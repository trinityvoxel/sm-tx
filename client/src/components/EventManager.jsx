import Link from "./Link.jsx";
import { sortEvents } from "../lib/events.js";
import React, { useEffect, useState } from "react";
export default function EventManager({ apiKey }) {
  const [events, setEvents] = useState([]),
    [selected, setSelected] = useState(null);
  const [query, setQuery] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [protect, setProtect] = useState(true);
  useEffect(() => {
    const abort = new AbortController();
    Promise.all(['/api/events','/api/events/pending'].map(path => fetch(path, {signal:abort.signal,headers:{'X-SM-TX-Key':apiKey}}).then(r => {
      if (!r.ok) throw new Error('Could not load review events');
      return r.json();
    }))).then(([approved,pending]) => setEvents(sortEvents([...approved,...pending])))
      .catch((e) => {
        if (e.name !== "AbortError") setMessage(e.message);
      });
    return () => abort.abort();
  }, [apiKey]);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const body = Object.fromEntries(
        [
          "name",
          "date_start",
          "date_end",
          "time",
          "venue_name",
          "venue_address",
          "url",
          "category",
          "status",
        ].map((key) => [
          key,
          selected[key] || (key === "venue_address" ? "" : null),
        ]),
      );
      body.protect_imports = protect;
      const response = await fetch(
        "/api/events/" + encodeURIComponent(selected.id),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-SM-TX-Key": apiKey,
          },
          body: JSON.stringify(body),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save event");
      setEvents((rows) =>
        rows.map((row) => (row.id === selected.id ? { ...row, ...body } : row)),
      );
      setMessage(
        protect
          ? "Saved. Future imports will preserve this reviewed record."
          : "Changes saved. Import protection is off.",
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="event-manager">
      <h2>Review event details</h2>
      <p>
        Correct times and venues against the official source. Upcoming published
        events appear first.
      </p>
      <label htmlFor="admin-event-search">Find an event or venue</label>
      <input
        id="admin-event-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="admin-review">
        <div className="admin-queue">
          {events
            .filter(
              (e) =>
                (!query
                  ? e.status === "pending" || e.date_start >=
                    new Date().toLocaleDateString("en-CA", {
                      timeZone: "America/Chicago",
                    })
                  : true) &&
                (e.name + " " + e.venue_name)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
            )
            .slice(0, 12)
            .map((e) => (
              <button
                key={e.id}
                type="button"
                aria-pressed={selected?.id === e.id}
                onClick={() => {
                  setSelected(e);
                  setProtect(true);
                  setMessage("");
                }}
              >
                <strong>{e.name}</strong>
                <span>
                  {e.date_start} · {e.venue_name}
                </span>
                {e.status === "pending" && <span>Pending verification</span>}
                {!e.time && <span>Time needs review</span>}
              </button>
            ))}
          {!events.length && <p>No events loaded.</p>}
        </div>
        {selected ? (
          <form className="admin-editor" onSubmit={save}>
            <h3>{selected.name}</h3>
            {[
              ["name", "Event name", "text"],
              ["date_start", "Start date", "date"],
              ["date_end", "End date", "date"],
              ["time", "Time · Central Time", "text"],
              ["venue_name", "Venue", "text"],
              ["venue_address", "Address", "text"],
              ["url", "Official event URL", "url"],
            ].map(([key, label, type]) => (
              <label key={key}>
                {label}
                <input
                  type={type}
                  required={["name", "date_start", "venue_name"].includes(key)}
                  value={selected[key] || ""}
                  onChange={(e) =>
                    setSelected({ ...selected, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            <label>Category<input required value={selected.category || ''} onChange={e=>setSelected({...selected,category:e.target.value})}/></label>
            <label>Publication status<select disabled={selected.source !== "scraped"} value={selected.status || 'approved'} onChange={e=>setSelected({...selected,status:e.target.value})}>
              <option value="pending">Pending verification</option><option value="approved">Approved — source verified</option><option value="rejected">Rejected</option>
            </select></label>
            <p>Approve scraped events only after checking the actual occurrence with its source. Use Pending Events below for community submissions and their notification workflow. Keep import protection on for reviewed exceptions.</p>
            {/^https?:\/\//i.test(selected.url || "") && (
              <Link href={selected.url} target="_blank" rel="noreferrer">
                Check official event details
              </Link>
            )}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={protect}
                onChange={(e) => setProtect(e.target.checked)}
              />
              Protect this record from automatic import changes
            </label>
            <button disabled={busy}>
              {busy ? "Saving…" : "Save reviewed changes"}
            </button>
          </form>
        ) : (
          <div className="admin-editor">
            <h3>Select an event</h3>
            <p>Its details will appear here for review.</p>
          </div>
        )}
      </div>
      <p role="status">{message}</p>
    </section>
  );
}
