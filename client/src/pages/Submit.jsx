import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API, CATEGORIES, CATEGORY_LABELS } from '../constants.js';

const fieldStyle = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  color: '#1a1a2e',
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.15s',
};

function Field({ label, required, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: '0.2rem' }}>*</span>}
      </label>
      {hint && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{hint}</span>}
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
        padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8,
        background: value ? '#f0fdf4' : '#fff', transition: 'all 0.15s',
        userSelect: 'none'
      }}
    >
      <div style={{
        width: 40, height: 22, borderRadius: 11,
        background: value ? '#0e8c8c' : '#d1d5db',
        position: 'relative', transition: 'background 0.15s', flexShrink: 0
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 20 : 2,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', transition: 'left 0.15s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }} />
      </div>
      <span style={{ fontSize: '0.9rem', color: '#374151', fontWeight: value ? 500 : 400 }}>
        {label}
      </span>
    </div>
  );
}

export default function Submit() {
  const [form, setForm] = useState({
    name: '',
    date_start: '',
    date_end: '',
    time: '',
    venue_name: '',
    venue_address: '',
    category: '',
    description: '',
    url: '',
    cost: '',
    kid_friendly: false,
    pet_friendly: false,
    age_21_plus: false,
    submitter_name: '',
    submitter_email: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/events/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '2rem 1.5rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.75rem', color: '#1a1a2e' }}>
          Event Submitted!
        </h2>
        <p style={{ color: '#4b5563', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Thanks for contributing to San Marcos's event scene! We'll review your submission within 24 hours and get it listed if everything checks out.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{
            background: '#051e33', color: '#fff', borderRadius: 8,
            padding: '0.6rem 1.25rem', fontWeight: 600, textDecoration: 'none'
          }}>
            ← Browse Events
          </Link>
          <button onClick={() => { setSuccess(false); setForm({ name:'',date_start:'',date_end:'',time:'',venue_name:'',venue_address:'',category:'',description:'',url:'',cost:'',kid_friendly:false,pet_friendly:false,age_21_plus:false,submitter_name:'',submitter_email:'' }); }} style={{
            background: '#fff', color: '#1a1a2e', border: '1px solid #e5e7eb', borderRadius: 8,
            padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer'
          }}>
            Submit Another
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1rem' }}>
        <Link to="/" style={{ color: '#6b7280', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.25rem' }}>
          ← Back to events
        </Link>

        <h1 style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.5rem', color: '#1a1a2e' }}>
          Submit an Event
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
          Know about something happening in San Marcos? Share it with the community. Fields marked <span style={{ color: '#ef4444' }}>*</span> are required.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
            padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#1a1a2e', fontSize: '1rem' }}>Event Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Field label="Event Name" required>
                <input value={form.name} onChange={e => set('name', e.target.value)} style={fieldStyle} placeholder="e.g. Live Music at The Marc" required />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Field label="Start Date" required>
                  <input type="date" value={form.date_start} onChange={e => set('date_start', e.target.value)} style={fieldStyle} required />
                </Field>
                <Field label="End Date" hint="For multi-day events">
                  <input type="date" value={form.date_end} onChange={e => set('date_end', e.target.value)} style={fieldStyle} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Field label="Time">
                  <input value={form.time} onChange={e => set('time', e.target.value)} style={fieldStyle} placeholder="e.g. 7:00 PM" />
                </Field>
                <Field label="Category" required>
                  <select value={form.category} onChange={e => set('category', e.target.value)} style={fieldStyle} required>
                    <option value="">Select category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Description" hint="Max 500 characters">
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value.slice(0, 500))}
                  style={{ ...fieldStyle, minHeight: 90, resize: 'vertical' }}
                  placeholder="Tell people what to expect..."
                />
                <span style={{ fontSize: '0.78rem', color: form.description.length >= 480 ? '#ef4444' : '#9ca3af', textAlign: 'right' }}>
                  {form.description.length}/500
                </span>
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Field label="Event URL">
                  <input value={form.url} onChange={e => set('url', e.target.value)} style={fieldStyle} placeholder="https://..." type="url" />
                </Field>
                <Field label="Cost / Tickets">
                  <input value={form.cost} onChange={e => set('cost', e.target.value)} style={fieldStyle} placeholder="e.g. Free, $10, $20-$40" />
                </Field>
              </div>
            </div>
          </div>

          <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
            padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#1a1a2e', fontSize: '1rem' }}>Venue</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Field label="Venue Name" required>
                <input value={form.venue_name} onChange={e => set('venue_name', e.target.value)} style={fieldStyle} placeholder="e.g. The Marc" required />
              </Field>
              <Field label="Venue Address" required>
                <input value={form.venue_address} onChange={e => set('venue_address', e.target.value)} style={fieldStyle} placeholder="e.g. 120 E Hopkins St, San Marcos, TX 78666" required />
              </Field>
            </div>
          </div>

          <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
            padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#1a1a2e', fontSize: '1rem' }}>Event Type</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <Toggle label="👦 Kid-friendly" value={form.kid_friendly} onChange={v => set('kid_friendly', v)} />
              <Toggle label="🐾 Pet-friendly" value={form.pet_friendly} onChange={v => set('pet_friendly', v)} />
              <Toggle label="🔞 21+ Only" value={form.age_21_plus} onChange={v => set('age_21_plus', v)} />
            </div>
          </div>

          <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
            padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#1a1a2e', fontSize: '1rem' }}>Your Info</h3>
            <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.75rem' }}>
              Used only for questions and status updates about this submission. Never displayed publicly or added to a marketing list.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Field label="Your Name" required>
                <input value={form.submitter_name} onChange={e => set('submitter_name', e.target.value)} style={fieldStyle} placeholder="Jane Smith" required />
              </Field>
              <Field label="Your Email" required>
                <input value={form.submitter_email} onChange={e => set('submitter_email', e.target.value)} style={fieldStyle} placeholder="jane@example.com" type="email" required />
              </Field>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
              padding: '0.75rem 1rem', color: '#991b1b', fontSize: '0.9rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: submitting ? '#9ca3af' : '#0e8c8c',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '0.85rem', fontSize: '1rem', fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s'
            }}
          >
            {submitting ? '⏳ Submitting...' : '🚀 Submit Event'}
          </button>
        </form>
      </div>
    </div>
  );
}
