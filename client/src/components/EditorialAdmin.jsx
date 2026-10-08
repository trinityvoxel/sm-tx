import React, { useState } from "react";
export default function EditorialAdmin({ apiKey }) {
  const [id, setId] = useState(""),
    [data, setData] = useState(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const headers = { "X-SM-TX-Key": apiKey, "Content-Type": "application/json" };
  async function load(ev) {
    ev.preventDefault();
    setBusy(true);
    setData(null);
    try {
      const r = await fetch("/api/editorial?id=" + encodeURIComponent(id), {
        headers,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setData(d);
      setMessage(
        "Loaded editorial record. Verify each fact against the official source before saving.",
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(ev) {
    ev.preventDefault();
    setBusy(true);
    try {
      const { event_id, content_updated_at, ...body } = data;
      const r = await fetch("/api/editorial?id=" + encodeURIComponent(id), {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessage("Editorial details saved.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  function set(key, value) {
    setData({ ...data, [key]: value });
  }
  return (
    <section className="editorial-admin">
      <h2>Verified event details</h2>
      <p>
        Optional editorial fields require the separately approved database
        migration. Imported labels are not verification.
      </p>
      <form onSubmit={load}>
        <label htmlFor="editorial-id">Event ID</label>
        <input
          id="editorial-id"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
          maxLength="200"
        />
        <button disabled={busy}>Load event</button>
      </form>
      <p role="status">{message}</p>
      {data && (
        <form onSubmit={save}>
          <label htmlFor="event-status">Occurrence status</label>
          <select
            id="event-status"
            value={data.event_status || ""}
            onChange={(e) => set("event_status", e.target.value || null)}
          >
            <option value="">Unknown</option>
            {["scheduled", "cancelled", "postponed", "rescheduled"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <label htmlFor="attendance-mode">Attendance mode</label>
          <select
            id="attendance-mode"
            value={data.attendance_mode || ""}
            onChange={(e) => set("attendance_mode", e.target.value || null)}
          >
            <option value="">Unknown</option>
            <option value="offline">In person</option>
            <option value="online">Online</option>
          </select>
          {[
            [
              "previous_start_date",
              "Previous start date (rescheduled events)",
              "date",
            ],
            ["end_time", "Verified end time", "time"],
            ["organizer_name", "Organizer name", "text"],
            ["organizer_url", "Organizer website", "url"],
            ["source_checked_at", "Source checked (date)", "date"],
          ].map(([key, label, type]) => (
            <div className="field" key={key}>
              <label htmlFor={"ed-" + key}>{label}</label>
              <input
                id={"ed-" + key}
                type={type}
                value={data[key]?.slice(0, type === "date" ? 10 : 2000) || ""}
                onChange={(e) => set(key, e.target.value || null)}
              />
            </div>
          ))}
          {[
            ["schedule_verified", "Start time and Central timezone verified"],
            ["location_verified", "Venue and address verified"],
            ["cost_verified", "Price verified"],
            ["indexable", "Eligible for search indexing"],
            ["retain_archive", "Keep useful archive eligible for search"],
          ].map(([key, label]) => (
            <label className="checkbox" key={key}>
              <input
                type="checkbox"
                checked={!!(data[key] ?? (key === "indexable" ? 1 : 0))}
                onChange={(e) => set(key, e.target.checked ? 1 : 0)}
              />
              {label}
            </label>
          ))}
          <label htmlFor="ed-price">
            Verified admission price (USD; blank if unknown)
          </label>
          <input
            id="ed-price"
            type="number"
            step="0.01"
            min="0"
            value={data.price ?? ""}
            onChange={(e) =>
              setData({
                ...data,
                price: e.target.value === "" ? null : Number(e.target.value),
                currency: e.target.value === "" ? null : "USD",
              })
            }
          />
          <button disabled={busy}>Save verified details</button>
        </form>
      )}
    </section>
  );
}
