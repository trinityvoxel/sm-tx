import Link from "../components/Link.jsx";
import CollectionHealth from '../components/CollectionHealth.jsx';
import DateReviews from '../components/DateReviews.jsx';
import React, { useEffect, useRef, useState } from "react";
import EventManager from "../components/EventManager.jsx";
import EditorialAdmin from "../components/EditorialAdmin.jsx";
import { CATEGORY_LABELS } from "../constants.js";

const SESSION_KEY = "sm_tx_admin_key";

const pageStyle = {
  maxWidth: 960,
  margin: "2rem auto",
  padding: "0 1rem",
};

// ─── Login Gate ─────────────────────────────────────────────────────────────

function LoginGate({ onLogin }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input.trim() }),
      });
      if (res.ok) {
        const { apiKey } = await res.json();
        sessionStorage.setItem(SESSION_KEY, apiKey);
        onLogin(apiKey);
      } else {
        setError("Invalid password.");
      }
    } catch {
      setError("Could not reach API.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "var(--white)",
          borderRadius: 12,
          padding: "2rem 2.5rem",
          boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
          width: "100%",
          maxWidth: 360,
        }}
      >
        <h1
          style={{
            fontSize: "1.4rem",
            color: "var(--ink)",
            marginBottom: "0.25rem",
          }}
        >
          Admin
        </h1>
        <p
          style={{
            color: "var(--muted)",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
          }}
        >
          Enter your password to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            autoComplete="current-password"
            type="password"
            placeholder="Password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "0.6rem 0.75rem",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: "0.95rem",
              marginBottom: "0.75rem",
              outline: "none",
            }}
          />
          {error && (
            <p
              style={{
                color: "#ffb4b4",
                fontSize: "0.85rem",
                marginBottom: "0.75rem",
              }}
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={checking}
            style={{
              width: "100%",
              padding: "0.6rem",
              borderRadius: 8,
              background: "var(--ink)",
              color: "var(--white)",
              border: "none",
              fontSize: "0.95rem",
              cursor: checking ? "not-allowed" : "pointer",
              opacity: checking ? 0.7 : 1,
            }}
          >
            {checking ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2
        style={{
          fontSize: "1.1rem",
          marginBottom: "0.75rem",
          color: "var(--ink)",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          background: "var(--white)",
          borderRadius: 12,
          padding: "1rem 1.25rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

// ─── Run Now Button ───────────────────────────────────────────────────────────

function RunNowButton({ jobId, apiKey, onDone, lastRunAt }) {
  const [state, setState] = useState("idle"); // idle | queued | polling | done | error
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  }

  async function handleRun() {
    setState("queued");
    setElapsed(0);
    try {
      const res = await fetch(
        `/api/admin/jobs/${encodeURIComponent(jobId)}/trigger`,
        {
          method: "POST",
          headers: { "X-SM-TX-Key": apiKey },
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("Trigger error:", body);
        setState("error");
        setTimeout(() => setState("idle"), 4000);
        return;
      }
    } catch (e) {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
      return;
    }

    // Poll every 15s for up to 10 minutes waiting for D1 to show a newer run
    setState("polling");
    const startedAt = Date.now();
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );

    pollRef.current = setInterval(async () => {
      const waited = Date.now() - startedAt;
      if (waited > 10 * 60 * 1000) {
        stopPolling();
        setState("idle");
        onDone();
        return;
      }
      try {
        const res = await fetch(
          `/api/admin/jobs/${encodeURIComponent(jobId)}/runs?limit=1`,
          {
            headers: { "X-SM-TX-Key": apiKey },
          },
        );
        if (!res.ok) return;
        const runs = await res.json();
        const newest = runs?.[0];
        // A new run has appeared if its started_at is after we triggered
        if (
          newest &&
          new Date(newest.started_at).getTime() > startedAt - 30000
        ) {
          if (newest.status === "success" || newest.status === "error") {
            stopPolling();
            setState("done");
            setTimeout(() => {
              setState("idle");
              onDone();
            }, 3000);
          }
        }
      } catch {}
    }, 15000);
  }

  useEffect(() => () => stopPolling(), []);

  const labels = {
    idle: "▶ Run",
    queued: "Queuing…",
    polling: `⏳ ${elapsed}s`,
    done: "✓ Done",
    error: "✗ Failed",
  };
  const bg = {
    idle: "var(--pale)",
    queued: "var(--pale)",
    polling: "#fffbeb",
    done: "#dcfce7",
    error: "#fee2e2",
  }[state];
  const color = {
    idle: "var(--ink)",
    queued: "var(--muted)",
    polling: "#92400e",
    done: "#166534",
    error: "#991b1b",
  }[state];

  return (
    <button
      onClick={handleRun}
      disabled={state !== "idle"}
      title={
        state === "polling"
          ? "Running on GitHub Actions — checking every 15s for completion"
          : undefined
      }
      style={{
        padding: "0.25rem 0.65rem",
        borderRadius: 6,
        fontSize: "0.8rem",
        border: "1px solid #e5e7eb",
        background: bg,
        color,
        cursor: state === "idle" ? "pointer" : "not-allowed",
        whiteSpace: "nowrap",
        transition: "background 0.2s, color 0.2s",
        minWidth: "4.5rem",
        textAlign: "center",
      }}
    >
      {labels[state]}
    </button>
  );
}

// ─── Pending submission card ────────────────────────────────────────────────

function displayDateTime(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function PendingEventCard({ event, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = `pending-event-${event.id}`;
  const eventUrl = /^https?:\/\//i.test(event.url || "") ? event.url : null;
  const flags = [
    ["Kid friendly", event.kid_friendly],
    ["Pet friendly", event.pet_friendly],
    ["21+ only", event.age_21_plus],
  ];

  const detailRows = [
    ["Start date", event.date_start],
    ["End date", event.date_end || "Not provided"],
    ["Time", event.time || "Not provided"],
    [
      "Category",
      CATEGORY_LABELS[event.category] || event.category || "Not provided",
    ],
    ["Cost / tickets", event.cost || "Not provided"],
    ["Venue", event.venue_name],
    ["Venue address", event.venue_address],
  ];

  return (
    <article
      style={{
        padding: "0.9rem",
        borderRadius: 8,
        background: "var(--pale)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
            {event.name}
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--muted)",
              marginTop: "0.2rem",
            }}
          >
            {event.date_start}
            {event.time ? ` @ ${event.time}` : ""} · {event.venue_name}
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--muted)",
              marginTop: "0.15rem",
            }}
          >
            Submitted by {event.submitter_name} ({event.submitter_email})
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailsId}
            onClick={() => setExpanded((value) => !value)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "var(--white)",
              color: "#0f766e",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            {expanded ? "Hide details" : "View details"}
          </button>
          <button
            type="button"
            onClick={() => onApprove(event.id)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: 8,
              border: "none",
              background: "#286557",
              color: "var(--white)",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => onReject(event.id)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "var(--white)",
              color: "var(--ink)",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Reject
          </button>
        </div>
      </div>

      {expanded && (
        <div
          id={detailsId}
          style={{
            marginTop: "0.9rem",
            paddingTop: "0.9rem",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(110px, 150px) minmax(0, 1fr)",
              columnGap: "1rem",
              rowGap: "0.65rem",
              margin: 0,
              fontSize: "0.86rem",
            }}
          >
            {detailRows.map(([label, value]) => (
              <React.Fragment key={label}>
                <dt style={{ color: "var(--muted)", fontWeight: 600 }}>
                  {label}
                </dt>
                <dd
                  style={{
                    margin: 0,
                    color: "var(--ink)",
                    overflowWrap: "anywhere",
                  }}
                >
                  {value || "Not provided"}
                </dd>
              </React.Fragment>
            ))}
            <dt style={{ color: "var(--muted)", fontWeight: 600 }}>
              Event URL
            </dt>
            <dd
              style={{
                margin: 0,
                color: "var(--ink)",
                overflowWrap: "anywhere",
              }}
            >
              {eventUrl ? (
                <Link
                  href={eventUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--teal)" }}
                >
                  {eventUrl}
                </Link>
              ) : (
                "Not provided"
              )}
            </dd>
            <dt style={{ color: "var(--muted)", fontWeight: 600 }}>Audience</dt>
            <dd
              style={{
                margin: 0,
                display: "flex",
                gap: "0.4rem",
                flexWrap: "wrap",
              }}
            >
              {flags.map(([label, enabled]) => (
                <span
                  key={label}
                  style={{
                    padding: "0.15rem 0.45rem",
                    borderRadius: 999,
                    background: enabled ? "#dcfce7" : "var(--pale)",
                    color: enabled ? "#166534" : "var(--muted)",
                    fontSize: "0.78rem",
                  }}
                >
                  {enabled ? "✓" : "—"} {label}
                </span>
              ))}
            </dd>
            <dt style={{ color: "var(--muted)", fontWeight: 600 }}>
              Submitter
            </dt>
            <dd
              style={{
                margin: 0,
                color: "var(--ink)",
                overflowWrap: "anywhere",
              }}
            >
              {event.submitter_name} ·{" "}
              <Link
                href={`mailto:${event.submitter_email}`}
                style={{ color: "var(--teal)" }}
              >
                {event.submitter_email}
              </Link>
            </dd>
            <dt style={{ color: "var(--muted)", fontWeight: 600 }}>
              Submitted
            </dt>
            <dd style={{ margin: 0, color: "var(--ink)" }}>
              {displayDateTime(event.created_at)}
            </dd>
            <dt style={{ color: "var(--muted)", fontWeight: 600 }}>
              Submission ID
            </dt>
            <dd
              style={{
                margin: 0,
                color: "var(--muted)",
                overflowWrap: "anywhere",
                fontFamily: "monospace",
                fontSize: "0.8rem",
              }}
            >
              {event.id}
            </dd>
          </dl>
          <div style={{ marginTop: "0.9rem" }}>
            <div
              style={{
                color: "var(--muted)",
                fontWeight: 600,
                fontSize: "0.86rem",
                marginBottom: "0.35rem",
              }}
            >
              Description
            </div>
            <div
              style={{
                color: "var(--ink)",
                fontSize: "0.88rem",
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                padding: "0.75rem",
                borderRadius: 7,
                background: "var(--white)",
                border: "1px solid #e5e7eb",
              }}
            >
              {event.description || "Not provided"}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function statusLabel(value) {
  return String(value || "unknown").replaceAll("_", " ");
}

function SubmissionHistory({ submissions }) {
  const [search, setSearch] = useState("");
  const needle = search.trim().toLowerCase();
  const filtered = submissions.filter(
    (submission) =>
      !needle ||
      [
        submission.event_name,
        submission.submitter_name,
        submission.submitter_email,
        submission.status,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(needle),
      ),
  );

  return (
    <>
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by person, email, event, or status…"
        aria-label="Search submission history"
        style={{
          width: "100%",
          boxSizing: "border-box",
          marginBottom: "0.85rem",
          padding: "0.55rem 0.7rem",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: "0.88rem",
          color: "var(--ink)",
          background: "var(--white)",
        }}
      />
      {filtered.length === 0 ? (
        <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
          No matching submissions.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 760,
              borderCollapse: "collapse",
              fontSize: "0.84rem",
            }}
          >
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #e5e7eb",
                  color: "var(--muted)",
                }}
              >
                <th style={{ padding: "0.55rem" }}>Event</th>
                <th style={{ padding: "0.55rem" }}>Submitted by</th>
                <th style={{ padding: "0.55rem" }}>Submitted</th>
                <th style={{ padding: "0.55rem" }}>Status</th>
                <th style={{ padding: "0.55rem" }}>Approval email</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((submission) => (
                <tr
                  key={submission.id}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                    verticalAlign: "top",
                  }}
                >
                  <td style={{ padding: "0.65rem 0.55rem", maxWidth: 260 }}>
                    {submission.event_status === "approved" ? (
                      <Link
                        href={`/events/${submission.event_id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--teal)", fontWeight: 600 }}
                      >
                        {submission.event_name}
                      </Link>
                    ) : (
                      <span style={{ fontWeight: 600 }}>
                        {submission.event_name}
                      </span>
                    )}
                    {submission.date_start && (
                      <div
                        style={{ marginTop: "0.2rem", color: "var(--muted)" }}
                      >
                        {submission.date_start}
                        {submission.time ? ` @ ${submission.time}` : ""}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "0.65rem 0.55rem" }}>
                    <div>{submission.submitter_name}</div>
                    <button
                      type="button"
                      onClick={() => setSearch(submission.submitter_email)}
                      title="Show every submission from this email"
                      style={{
                        display: "block",
                        margin: "0.2rem 0 0",
                        padding: 0,
                        border: 0,
                        color: "var(--teal)",
                        background: "none",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      {submission.submitter_email}
                    </button>
                  </td>
                  <td
                    style={{
                      padding: "0.65rem 0.55rem",
                      color: "var(--muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayDateTime(submission.submitted_at)}
                  </td>
                  <td
                    style={{
                      padding: "0.65rem 0.55rem",
                      textTransform: "capitalize",
                    }}
                  >
                    {statusLabel(submission.status)}
                  </td>
                  <td
                    style={{
                      padding: "0.65rem 0.55rem",
                      color: "var(--muted)",
                      textTransform: "capitalize",
                    }}
                  >
                    {statusLabel(submission.approval_email_status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function Dashboard({ apiKey, onLogout }) {
  const [section, setSection] = useState("events");
  const [settings, setSettings] = useState(null);
  const [sources, setSources] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobRuns, setJobRuns] = useState({});
  const [pending, setPending] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const headers = { "X-SM-TX-Key": apiKey };

  async function fetchAdminData() {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, sourcesRes, jobsRes, pendingRes, submissionsRes] =
        await Promise.all([
          fetch("/api/admin/settings", { headers }),
          fetch("/api/admin/sources", { headers }),
          fetch("/api/admin/jobs", { headers }),
          fetch("/api/events/pending", { headers }),
          fetch("/api/admin/submissions?limit=200", { headers }),
        ]);
      if (!settingsRes.ok) throw new Error(`Settings: ${settingsRes.status}`);
      if (!sourcesRes.ok) throw new Error(`Sources: ${sourcesRes.status}`);
      if (!jobsRes.ok) throw new Error(`Jobs: ${jobsRes.status}`);
      if (!pendingRes.ok)
        throw new Error(`Pending events: ${pendingRes.status}`);
      if (!submissionsRes.ok)
        throw new Error(`Submission history: ${submissionsRes.status}`);

      const [
        settingsJson,
        sourcesJson,
        jobsJson,
        pendingJson,
        submissionsJson,
      ] = await Promise.all([
        settingsRes.json(),
        sourcesRes.json(),
        jobsRes.json(),
        pendingRes.ok ? pendingRes.json() : [],
        submissionsRes.ok ? submissionsRes.json() : [],
      ]);

      setSettings(settingsJson);
      setSources(sourcesJson);
      setJobs(jobsJson || []);
      setPending(pendingJson || []);
      setSubmissions(submissionsJson || []);

      // Fetch recent runs for each job
      const runsEntries = await Promise.all(
        (jobsJson || []).map(async (job) => {
          try {
            const res = await fetch(
              `/api/admin/jobs/${encodeURIComponent(job.id)}/runs?limit=5`,
              { headers },
            );
            if (!res.ok) return [job.id, []];
            return [job.id, (await res.json()) || []];
          } catch {
            return [job.id, []];
          }
        }),
      );
      const runsMap = {};
      for (const [id, runs] of runsEntries) runsMap[id] = runs;
      setJobRuns(runsMap);
    } catch (e) {
      setError(e.message || "Error loading admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function toggleFacebook(enabled) {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ facebook_enabled: enabled }),
      });
      if (!res.ok) throw new Error("Failed to update setting");
      setSettings((prev) => ({ ...prev, facebook_enabled: String(enabled) }));
    } catch (e) {
      setError(e.message || "Error updating Facebook toggle");
    }
  }

  async function approveEvent(id) {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
      setPending((prev) => prev.filter((e) => e.id !== id));
      setSubmissions((prev) =>
        prev.map((submission) =>
          submission.event_id === id
            ? {
                ...submission,
                status: "approved",
                event_status: "approved",
                reviewed_at: new Date().toISOString(),
                approval_email_status: "queued",
              }
            : submission,
        ),
      );
    } catch (e) {
      setError(e.message);
    }
  }

  async function rejectEvent(id) {
    const name = pending.find((event) => event.id === id)?.name || id;
    if (
      !window.confirm(
        `Reject and remove “${name}”? This action cannot be undone in the dashboard.`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error(`Reject failed: ${res.status}`);
      setPending((prev) => prev.filter((e) => e.id !== id));
      setSubmissions((prev) =>
        prev.map((submission) =>
          submission.event_id === id
            ? {
                ...submission,
                status: "rejected",
                event_status: null,
                reviewed_at: new Date().toISOString(),
                approval_email_status: "not_applicable",
              }
            : submission,
        ),
      );
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <p style={{ color: "#ffb4b4" }}>Error: {error}</p>
        <button
          onClick={fetchAdminData}
          style={{
            marginRight: "1rem",
            padding: "0.4rem 0.9rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
        <button
          onClick={onLogout}
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  const fbEnabled = settings && settings.facebook_enabled === "true";

  return (
    <div style={pageStyle}>
      <div
        className="admin-heading"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem", color: "var(--ink)", margin: 0 }}>
            SM-TX.com Admin
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "0.9rem",
              margin: "0.25rem 0 0",
            }}
          >
            Events, sources, and publishing
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={fetchAdminData}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "var(--pale)",
              cursor: "pointer",
              fontSize: "0.85rem",
              color: "var(--ink)",
            }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={onLogout}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "var(--pale)",
              cursor: "pointer",
              fontSize: "0.85rem",
              color: "var(--ink)",
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="admin-workspace">
        <nav className="admin-navigation" aria-label="Admin sections">
          {[
            ["events", "Events"],
            ["sources", "Event sources"],
            ["settings", "Site settings"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              aria-pressed={section === id}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="admin-content">
          <div hidden={section !== "events"}>
            <DateReviews apiKey={apiKey} />
            <EventManager apiKey={apiKey} />
            {/* Pending Events */}
            <Section
              title={`Pending Events ${pending.length > 0 ? `(${pending.length})` : ""}`}
            >
              {pending.length === 0 ? (
                <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                  No pending submissions.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {pending.map((evt) => (
                    <PendingEventCard
                      key={evt.id}
                      event={evt}
                      onApprove={approveEvent}
                      onReject={rejectEvent}
                    />
                  ))}
                </div>
              )}
            </Section>

            <Section
              title={`Submission History ${submissions.length > 0 ? `(${submissions.length})` : ""}`}
            >
              {submissions.length === 0 ? (
                <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                  No community submissions recorded yet.
                </p>
              ) : (
                <SubmissionHistory submissions={submissions} />
              )}
            </Section>

            <EditorialAdmin apiKey={apiKey} />
          </div>
          <div hidden={section !== "settings"}>
            <Section title="Publishing identity">
              <p>Publisher: SM-TX.com · Notifications: SM-TX.com Admin</p>
              <p>
                Submission recipients are managed privately on the server and
                are never included in public pages.
              </p>
            </Section>
            <Section title="Riverbend Hideaway">
              <p>
                The homepage photo and booking links point to the approved
                property listing.
              </p>
              <Link
                href="https://www.cohostr.com/book/297530"
                target="_blank"
                rel="noreferrer"
              >
                View booking page
              </Link>
            </Section>
            {/* Facebook Toggle */}
            <Section title="Facebook Scraping">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                    Facebook scraping
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                    Toggle off to stop all Facebook scrapes while keeping the
                    rest running.
                  </div>
                </div>
                <button
                  onClick={() => toggleFacebook(!fbEnabled)}
                  style={{
                    padding: "0.4rem 0.9rem",
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: fbEnabled ? "#286557" : "var(--muted)",
                    background: fbEnabled ? "#286557" : "var(--pale)",
                    color: fbEnabled ? "#ecfdf5" : "var(--ink)",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    minWidth: 90,
                  }}
                >
                  {fbEnabled ? "On" : "Off"}
                </button>
              </div>
            </Section>
          </div>
          <div hidden={section !== "sources"}>
            <CollectionHealth jobs={jobs} jobRuns={jobRuns} />
            {/* Event Sources */}
            <Section title="Event Sources">
              {sources.length === 0 ? (
                <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                  No event sources configured yet.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.9rem",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          textAlign: "left",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <th style={{ padding: "0.5rem" }}>Name</th>
                        <th style={{ padding: "0.5rem" }}>Type</th>
                        <th style={{ padding: "0.5rem" }}>URL</th>
                        <th style={{ padding: "0.5rem" }}>Active</th>
                        <th style={{ padding: "0.5rem" }}>Frequency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sources.map((src) => (
                        <tr
                          key={src.id}
                          style={{ borderBottom: "1px solid #f3f4f6" }}
                        >
                          <td style={{ padding: "0.5rem" }}>{src.name}</td>
                          <td
                            style={{
                              padding: "0.5rem",
                              textTransform: "capitalize",
                            }}
                          >
                            {src.type}
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <Link
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "var(--teal)" }}
                            >
                              {src.url}
                            </Link>
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            {src.active ? "Yes" : "No"}
                          </td>
                          <td style={{ padding: "0.5rem" }}>{src.frequency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            {/* Jobs */}
            <Section title="Jobs & Status">
              {jobs.length === 0 ? (
                <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                  No jobs configured yet.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.9rem",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          textAlign: "left",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <th style={{ padding: "0.5rem" }}>Job</th>
                        <th style={{ padding: "0.5rem" }}>Description</th>
                        <th style={{ padding: "0.5rem" }}>Enabled</th>
                        <th style={{ padding: "0.5rem" }}>Interval</th>
                        <th style={{ padding: "0.5rem" }}>Last Run</th>
                        <th style={{ padding: "0.5rem" }}>Status</th>
                        <th style={{ padding: "0.5rem" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => {
                        const runs = jobRuns[job.id] || [];
                        const last = runs[0];
                        return (
                          <tr
                            key={job.id}
                            style={{ borderBottom: "1px solid #f3f4f6" }}
                          >
                            <td
                              style={{
                                padding: "0.5rem",
                                fontFamily: "monospace",
                                fontSize: "0.8rem",
                              }}
                            >
                              {job.id}
                            </td>
                            <td style={{ padding: "0.5rem" }}>
                              {job.description}
                            </td>
                            <td style={{ padding: "0.5rem" }}>
                              {job.enabled ? "Yes" : "No"}
                            </td>
                            <td style={{ padding: "0.5rem" }}>
                              {job.expected_interval}
                            </td>
                            <td
                              style={{ padding: "0.5rem", fontSize: "0.85rem" }}
                            >
                              {last
                                ? new Date(
                                    last.finished_at || last.started_at,
                                  ).toLocaleString()
                                : "—"}
                            </td>
                            <td style={{ padding: "0.5rem" }}>
                              {last ? (
                                <span
                                  style={{
                                    padding: "0.15rem 0.5rem",
                                    borderRadius: 999,
                                    fontSize: "0.8rem",
                                    background:
                                      last.status === "success"
                                        ? "#dcfce7"
                                        : "#fee2e2",
                                    color:
                                      last.status === "success"
                                        ? "#166534"
                                        : "#991b1b",
                                  }}
                                >
                                  {last.status}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "var(--muted)",
                                  }}
                                >
                                  No runs
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "0.5rem" }}>
                              <RunNowButton
                                jobId={job.id}
                                apiKey={apiKey}
                                onDone={fetchAdminData}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function Admin() {
  const [apiKey, setApiKey] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || "",
  );

  function handleLogin(key) {
    setApiKey(key);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setApiKey("");
  }

  if (!apiKey) return <LoginGate onLogin={handleLogin} />;
  return <Dashboard apiKey={apiKey} onLogout={handleLogout} />;
}
