import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API, CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from '../constants.js';

const RIVERBEND_PHOTO = 'https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/87999-297530-DcPs67WuOwB5o7P5GqtCvFN32E8cRhwrrp8RMIlPoa8-68efd79c87e31';
const RIVERBEND_URL = 'https://stay.cohostr.com/san-marcos/';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function EventCard({ event }) {
  const color = CATEGORY_COLORS[event.category] || '#6b7280';
  const label = CATEGORY_LABELS[event.category] || event.category;
  const dateStr = event.date_end && event.date_end !== event.date_start
    ? `${formatDate(event.date_start)} – ${formatDate(event.date_end)}`
    : formatDate(event.date_start);

  return (
    <Link to={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '1rem 1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.15s, transform 0.15s',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.3, color: '#1a1a2e', flex: 1 }}>
            {event.name}
          </h3>
          <span style={{
            background: color + '18', color, border: `1px solid ${color}40`,
            borderRadius: 20, padding: '0.2rem 0.6rem',
            fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0
          }}>
            {label}
          </span>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
          📅 {dateStr}{event.time ? ` · ${event.time}` : ''}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>📍 {event.venue_name}</div>
        {event.cost && <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>🎟 {event.cost}</div>}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '0.25rem' }}>
          {event.kid_friendly && <span style={{ fontSize: '0.75rem', background: '#d1fae5', color: '#065f46', borderRadius: 20, padding: '0.15rem 0.5rem' }}>👦 Kid-friendly</span>}
          {event.pet_friendly && <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', borderRadius: 20, padding: '0.15rem 0.5rem' }}>🐾 Pet-friendly</span>}
          {event.age_21_plus && <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: 20, padding: '0.15rem 0.5rem' }}>🔞 21+</span>}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  async function fetchEvents() {
    setLoading(true);
    try {
      let url = `${API}/events`;
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (searchFrom && searchTo) {
        params.set('date_from', searchFrom);
        params.set('date_to', searchTo);
      } else {
        params.set('upcoming', 'true');
      }
      const q = params.toString();
      if (q) url += '?' + q;
      const data = await (await fetch(url)).json();
      setEvents(data);
    } catch {
      setError('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchEvents(); }, [category, searchFrom, searchTo]);

  function handleSearch(e) {
    e.preventDefault();
    setSearchFrom(dateFrom);
    setSearchTo(dateTo);
  }

  function handleClear() {
    setDateFrom(''); setDateTo(''); setSearchFrom(''); setSearchTo('');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdfa' }}>

      {/* ── HERO ── */}
      <div style={{
        position: 'relative',
        backgroundImage: `
          linear-gradient(180deg, rgba(2,20,18,0.52) 0%, rgba(4,47,46,0.38) 55%, rgba(4,47,46,0.65) 100%),
          url('/rio-vista-hero.jpg')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center 60%',
        color: '#fff',
        padding: '4rem 1rem 3rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(2rem, 5.5vw, 3.2rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '0.6rem',
            letterSpacing: '-1px',
            textShadow: '0 2px 20px rgba(0,0,0,0.45)'
          }}>
            Everything happening in<br />
            <span style={{ color: '#5eead4' }}>San Marcos</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.88, marginBottom: '1.75rem', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
            Music. Food. Festivals. Markets. All in one place.
          </p>

          {/* Date picker */}
          <form onSubmit={handleSearch} style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: 14,
            padding: '1rem 1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            marginBottom: '1rem',
          }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>🗓 Planning a visit?</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>Arriving</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ borderRadius: 8, border: 'none', padding: '0.4rem 0.6rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.92)' }} />
              <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>Leaving</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ borderRadius: 8, border: 'none', padding: '0.4rem 0.6rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.92)' }} />
            </div>
            <button type="submit" style={{
              background: '#0d9488', color: '#fff', border: 'none', borderRadius: 8,
              padding: '0.45rem 1rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer'
            }}>Show Events →</button>
            {(searchFrom || searchTo) && (
              <button type="button" onClick={handleClear} style={{
                background: 'transparent', color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8,
                padding: '0.4rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer'
              }}>Clear</button>
            )}
          </form>

          {/* Riverbend Hideaway — in-hero CTA */}
          <a href={RIVERBEND_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem',
              background: 'rgba(0,0,0,0.38)',
              border: '1px solid rgba(94,234,212,0.35)',
              borderRadius: 12,
              padding: '0.75rem 1rem',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              transition: 'background 0.15s',
              textAlign: 'left',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.52)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.38)'}
            >
              <img
                src={RIVERBEND_PHOTO}
                alt="Riverbend Hideaway"
                style={{ width: 80, height: 58, borderRadius: 8, objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#5eead4', marginBottom: 2 }}>
                  Need a place to stay?
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: 2 }}>
                  Riverbend Hideaway
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>
                  Blanco River · Sleeps up to 12 · Book direct, skip the OTA fees
                </div>
              </div>
              <div style={{
                background: '#0d9488', color: '#fff', borderRadius: 8,
                padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 700,
                flexShrink: 0, whiteSpace: 'nowrap'
              }}>
                Book Direct →
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Wave separator */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 60" preserveAspectRatio="none"
        style={{ display: 'block', marginTop: -2, background: '#f0fdfa' }}>
        <path fill="#f0fdfa" d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
          style={{ fill: '#f0fdfa' }} />
        <rect width="1440" height="30" fill="transparent" />
      </svg>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0.5rem 1rem 8rem' }}>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button onClick={() => setCategory('all')} style={{
            background: category === 'all' ? '#042f2e' : '#fff',
            color: category === 'all' ? '#fff' : '#042f2e',
            border: '1px solid #e5e7eb', borderRadius: 20,
            padding: '0.35rem 0.9rem', fontSize: '0.85rem',
            fontWeight: category === 'all' ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s'
          }}>All</button>
          {CATEGORIES.map(cat => {
            const color = CATEGORY_COLORS[cat];
            const isActive = category === cat;
            return (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                background: isActive ? color : `${color}15`,
                color: isActive ? '#fff' : color,
                border: `1px solid ${color}40`, borderRadius: 20,
                padding: '0.35rem 0.9rem', fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500, cursor: 'pointer', transition: 'all 0.15s'
              }}>{CATEGORY_LABELS[cat]}</button>
            );
          })}
        </div>

        {(searchFrom && searchTo) && (
          <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#4b5563' }}>
            Showing events from <strong>{formatDate(searchFrom)}</strong> to <strong>{formatDate(searchTo)}</strong>
            {' '}· {events.length} found
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌀</div>Loading events...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>{error}</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
            No events found.{' '}
            <button onClick={handleClear} style={{ color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        )}

        {/* Submit CTA */}
        <div style={{
          marginTop: '2.5rem', padding: '1.5rem',
          background: '#ccfbf1', border: '1px solid #99f6e4',
          borderRadius: 12, textAlign: 'center'
        }}>
          <p style={{ color: '#134e4a', marginBottom: '0.75rem' }}>Know about an event we're missing?</p>
          <Link to="/submit" style={{
            display: 'inline-block', background: '#0d9488', color: '#fff',
            padding: '0.6rem 1.5rem', borderRadius: 8, fontWeight: 600, textDecoration: 'none'
          }}>Submit an Event</Link>
        </div>
      </div>

      {/* ── STICKY BOTTOM BAR ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#042f2e', color: '#fff',
        padding: '0.75rem 1rem', textAlign: 'center', zIndex: 200,
        fontSize: '0.9rem', borderTop: '2px solid #0d9488',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.5rem', flexWrap: 'wrap'
      }}>
        <span>🏡 Staying in San Marcos? Riverbend Hideaway sleeps up to 12 on the Blanco River —</span>
        <a href={RIVERBEND_URL} target="_blank" rel="noopener noreferrer"
          style={{ color: '#5eead4', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid #5eead4' }}>
          book direct at stay.cohostr.com/san-marcos/ →
        </a>
      </div>
    </div>
  );
}
