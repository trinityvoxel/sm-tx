import React, { useEffect, useState } from 'react';

const SESSION_KEY = 'sm_tx_admin_key';

const pageStyle = {
  maxWidth: 960,
  margin: '2rem auto',
  padding: '0 1rem',
};

// ─── Login Gate ─────────────────────────────────────────────────────────────

function LoginGate({ onLogin }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input.trim() }),
      });
      if (res.ok) {
        const { apiKey } = await res.json();
        sessionStorage.setItem(SESSION_KEY, apiKey);
        onLogin(apiKey);
      } else {
        setError('Invalid password.');
      }
    } catch {
      setError('Could not reach API.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', padding: '2rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '2rem 2.5rem',
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: 360,
      }}>
        <h1 style={{ fontSize: '1.4rem', color: '#022c22', marginBottom: '0.25rem' }}>Admin</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Enter your password to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Password"
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '0.6rem 0.75rem', borderRadius: 8,
              border: '1px solid #d1d5db', fontSize: '0.95rem',
              marginBottom: '0.75rem', outline: 'none',
            }}
          />
          {error && (
            <p style={{ color: '#b91c1c', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={checking}
            style={{
              width: '100%', padding: '0.6rem', borderRadius: 8,
              background: '#022c22', color: '#fff', border: 'none',
              fontSize: '0.95rem', cursor: checking ? 'not-allowed' : 'pointer',
              opacity: checking ? 0.7 : 1,
            }}
          >
            {checking ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#022c22' }}>{title}</h2>
      <div style={{ background: '#fff', borderRadius: 12, padding: '1rem 1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {children}
      </div>
    </section>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function Dashboard({ apiKey, onLogout }) {
  const [settings, setSettings] = useState(null);
  const [sources, setSources] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobRuns, setJobRuns] = useState({});
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const headers = { 'X-SM-TX-Key': apiKey };

  async function fetchAdminData() {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, sourcesRes, jobsRes, pendingRes] = await Promise.all([
        fetch('/api/admin/settings', { headers }),
        fetch('/api/admin/sources', { headers }),
        fetch('/api/admin/jobs', { headers }),
        fetch('/api/events/pending', { headers }),
      ]);
      if (!settingsRes.ok) throw new Error(`Settings: ${settingsRes.status}`);
      if (!sourcesRes.ok) throw new Error(`Sources: ${sourcesRes.status}`);
      if (!jobsRes.ok) throw new Error(`Jobs: ${jobsRes.status}`);

      const [settingsJson, sourcesJson, jobsJson, pendingJson] = await Promise.all([
        settingsRes.json(),
        sourcesRes.json(),
        jobsRes.json(),
        pendingRes.ok ? pendingRes.json() : [],
      ]);

      setSettings(settingsJson);
      setSources(sourcesJson);
      setJobs(jobsJson || []);
      setPending(pendingJson || []);

      // Fetch recent runs for each job
      const runsEntries = await Promise.all(
        (jobsJson || []).map(async (job) => {
          try {
            const res = await fetch(`/api/admin/jobs/${encodeURIComponent(job.id)}/runs?limit=5`, { headers });
            if (!res.ok) return [job.id, []];
            return [job.id, await res.json() || []];
          } catch {
            return [job.id, []];
          }
        })
      );
      const runsMap = {};
      for (const [id, runs] of runsEntries) runsMap[id] = runs;
      setJobRuns(runsMap);
    } catch (e) {
      setError(e.message || 'Error loading admin data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAdminData(); }, []);

  async function toggleFacebook(enabled) {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ facebook_enabled: enabled }),
      });
      if (!res.ok) throw new Error('Failed to update setting');
      setSettings(prev => ({ ...prev, facebook_enabled: String(enabled) }));
    } catch (e) {
      setError(e.message || 'Error updating Facebook toggle');
    }
  }

  async function approveEvent(id) {
    try {
      await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      setPending(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function rejectEvent(id) {
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE', headers });
      setPending(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) {
    return <div style={pageStyle}><p style={{ color: '#6b7280' }}>Loading…</p></div>;
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#b91c1c' }}>Error: {error}</p>
        <button onClick={fetchAdminData} style={{ marginRight: '1rem', padding: '0.4rem 0.9rem', borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer' }}>
          Retry
        </button>
        <button onClick={onLogout} style={{ padding: '0.4rem 0.9rem', borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    );
  }

  const fbEnabled = settings && settings.facebook_enabled === 'true';

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#022c22', margin: 0 }}>Admin Dashboard</h1>
          <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
            SM-TX internal controls
          </p>
        </div>
        <button
          onClick={onLogout}
          style={{ padding: '0.4rem 0.9rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontSize: '0.85rem', color: '#374151' }}
        >
          Sign out
        </button>
      </div>

      {/* Pending Events */}
      <Section title={`Pending Events ${pending.length > 0 ? `(${pending.length})` : ''}`}>
        {pending.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>No pending submissions.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pending.map(evt => (
              <div key={evt.id} style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                gap: '1rem', padding: '0.75rem', borderRadius: 8, background: '#f9fafb',
                border: '1px solid #e5e7eb',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{evt.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.2rem' }}>
                    {evt.date_start}{evt.time ? ` @ ${evt.time}` : ''} · {evt.venue_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.15rem' }}>
                    Submitted by {evt.submitter_name} ({evt.submitter_email})
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => approveEvent(evt.id)}
                    style={{ padding: '0.35rem 0.75rem', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectEvent(evt.id)}
                    style={{ padding: '0.35rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Facebook Toggle */}
      <Section title="Facebook Scraping">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Facebook scraping</div>
            <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
              Toggle off to stop all Facebook scrapes while keeping the rest running.
            </div>
          </div>
          <button
            onClick={() => toggleFacebook(!fbEnabled)}
            style={{
              padding: '0.4rem 0.9rem', borderRadius: 999, border: '1px solid',
              borderColor: fbEnabled ? '#16a34a' : '#9ca3af',
              background: fbEnabled ? '#16a34a' : '#f3f4f6',
              color: fbEnabled ? '#ecfdf5' : '#111827',
              fontSize: '0.9rem', cursor: 'pointer', minWidth: 90,
            }}
          >
            {fbEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </Section>

      {/* Event Sources */}
      <Section title="Event Sources">
        {sources.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>No event sources configured yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>Type</th>
                  <th style={{ padding: '0.5rem' }}>URL</th>
                  <th style={{ padding: '0.5rem' }}>Active</th>
                  <th style={{ padding: '0.5rem' }}>Frequency</th>
                </tr>
              </thead>
              <tbody>
                {sources.map(src => (
                  <tr key={src.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.5rem' }}>{src.name}</td>
                    <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>{src.type}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <a href={src.url} target="_blank" rel="noreferrer" style={{ color: '#0e7490' }}>{src.url}</a>
                    </td>
                    <td style={{ padding: '0.5rem' }}>{src.active ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '0.5rem' }}>{src.frequency}</td>
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
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>No jobs configured yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '0.5rem' }}>Job</th>
                  <th style={{ padding: '0.5rem' }}>Description</th>
                  <th style={{ padding: '0.5rem' }}>Enabled</th>
                  <th style={{ padding: '0.5rem' }}>Interval</th>
                  <th style={{ padding: '0.5rem' }}>Last Run</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => {
                  const runs = jobRuns[job.id] || [];
                  const last = runs[0];
                  return (
                    <tr key={job.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{job.id}</td>
                      <td style={{ padding: '0.5rem' }}>{job.description}</td>
                      <td style={{ padding: '0.5rem' }}>{job.enabled ? 'Yes' : 'No'}</td>
                      <td style={{ padding: '0.5rem' }}>{job.expected_interval}</td>
                      <td style={{ padding: '0.5rem' }}>
                        {last ? new Date(last.finished_at || last.started_at).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        {last ? (
                          <span style={{
                            padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.8rem',
                            background: last.status === 'success' ? '#dcfce7' : '#fee2e2',
                            color: last.status === 'success' ? '#166534' : '#991b1b',
                          }}>
                            {last.status}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>No runs</span>
                        )}
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
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function Admin() {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem(SESSION_KEY) || '');

  function handleLogin(key) { setApiKey(key); }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setApiKey('');
  }

  if (!apiKey) return <LoginGate onLogin={handleLogin} />;
  return <Dashboard apiKey={apiKey} onLogout={handleLogout} />;
}
