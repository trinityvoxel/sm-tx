import React, { useEffect, useState } from 'react';

const sectionStyle = {
  maxWidth: 960,
  margin: '2rem auto',
  padding: '0 1rem',
};

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h1 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', color: '#022c22' }}>{title}</h1>
      <div style={{ background: '#fff', borderRadius: 12, padding: '1rem 1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {children}
      </div>
    </section>
  );
}

export default function Admin() {
  const [settings, setSettings] = useState(null);
  const [sources, setSources] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobRuns, setJobRuns] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchAdminData() {
    setLoading(true);
    setError(null);
    try {
      const key = import.meta.env.VITE_ADMIN_API_KEY || '';
      const [settingsRes, sourcesRes, jobsRes] = await Promise.all([
        fetch('/api/admin/settings', { headers: { 'X-SM-TX-Key': key } }),
        fetch('/api/admin/sources', { headers: { 'X-SM-TX-Key': key } }),
        fetch('/api/admin/jobs', { headers: { 'X-SM-TX-Key': key } }),
      ]);
      if (!settingsRes.ok) throw new Error('Failed to load settings');
      if (!sourcesRes.ok) throw new Error('Failed to load sources');
      if (!jobsRes.ok) throw new Error('Failed to load jobs');
      const [settingsJson, sourcesJson, jobsJson] = await Promise.all([
        settingsRes.json(),
        sourcesRes.json(),
        jobsRes.json(),
      ]);
      setSettings(settingsJson);
      setSources(sourcesJson);
      setJobs(jobsJson || []);

      // Fetch recent runs for each job (up to 5)
      const runsEntries = await Promise.all(
        (jobsJson || []).map(async (job) => {
          try {
            const runsRes = await fetch(`/api/admin/jobs/${encodeURIComponent(job.id)}/runs?limit=5`, {
              headers: { 'X-SM-TX-Key': key },
            });
            if (!runsRes.ok) return [job.id, []];
            const runs = await runsRes.json();
            return [job.id, runs || []];
          } catch {
            return [job.id, []];
          }
        })
      );
      const runsMap = {};
      for (const [id, runs] of runsEntries) {
        runsMap[id] = runs;
      }
      setJobRuns(runsMap);
    } catch (e) {
      setError(e.message || 'Error loading admin data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function toggleFacebook(enabled) {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-SM-TX-Key': import.meta.env.VITE_ADMIN_API_KEY || '',
        },
        body: JSON.stringify({ facebook_enabled: enabled }),
      });
      if (!res.ok) throw new Error('Failed to update setting');
      setSettings(prev => ({ ...prev, facebook_enabled: String(enabled) }));
    } catch (e) {
      setError(e.message || 'Error updating Facebook toggle');
    }
  }

  if (loading) {
    return (
      <div style={sectionStyle}>
        <p>Loading admin dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={sectionStyle}>
        <p style={{ color: '#b91c1c' }}>Error: {error}</p>
      </div>
    );
  }

  const fbEnabled = settings && settings.facebook_enabled === 'true';

  return (
    <div style={sectionStyle}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#022c22' }}>Admin Dashboard</h1>
      <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
        Internal controls for SM-TX scrapers and sources.
      </p>

      <Section title="Facebook Scraping">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Facebook scraping</div>
            <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
              Toggle this off to immediately stop all Facebook-based scrapes while keeping the rest of the system running.
            </div>
          </div>
          <button
            onClick={() => toggleFacebook(!fbEnabled)}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 999,
              border: '1px solid',
              borderColor: fbEnabled ? '#16a34a' : '#9ca3af',
              background: fbEnabled ? '#16a34a' : '#f3f4f6',
              color: fbEnabled ? '#ecfdf5' : '#111827',
              fontSize: '0.9rem',
              cursor: 'pointer',
              minWidth: 90,
            }}
          >
            {fbEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </Section>

      <Section title="Event Sources">
        {sources.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>No event sources configured yet.</p>
        ) : (
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
        )}
      </Section>

      <Section title="Jobs & Status">
        {jobs.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>No jobs configured yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '0.5rem' }}>Job</th>
                <th style={{ padding: '0.5rem' }}>Description</th>
                <th style={{ padding: '0.5rem' }}>Enabled</th>
                <th style={{ padding: '0.5rem' }}>Expected Interval</th>
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
                          padding: '0.15rem 0.5rem',
                          borderRadius: 999,
                          fontSize: '0.8rem',
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
        )}
      </Section>
    </div>
  );
}
