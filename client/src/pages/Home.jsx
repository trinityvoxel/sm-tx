import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API, CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from '../constants.js';

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
      <div style={{
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
            background: color + '18',
            color: color,
            border: `1px solid ${color}40`,
            borderRadius: 20,
            padding: '0.2rem 0.6rem',
            fontSize: '0.72rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            {label}
          </span>
        </div>

        <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
          📅 {dateStr}{event.time ? ` · ${event.time}` : ''}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          📍 {event.venue_name}
        </div>
        {event.cost && (
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>🎟 {event.cost}</div>
        )}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '0.25rem' }}>
          {event.kid_friendly && (
            <span style={{ fontSize: '0.75rem', background: '#d1fae5', color: '#065f46', borderRadius: 20, padding: '0.15rem 0.5rem' }}>
              👦 Kid-friendly
            </span>
          )}
          {event.pet_friendly && (
            <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', borderRadius: 20, padding: '0.15rem 0.5rem' }}>
              🐾 Pet-friendly
            </span>
          )}
          {event.age_21_plus && (
            <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: 20, padding: '0.15rem 0.5rem' }}>
              🔞 21+
            </span>
          )}
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
      const res = await fetch(url);
      const data = await res.json();
      setEvents(data);
    } catch (e) {
      setError('Failed to load events. Is the server running?');
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

  function handleClearSearch() {
    setDateFrom('');
    setDateTo('');
    setSearchFrom('');
    setSearchTo('');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #051e33 0%, #0a3356 60%, #0e5f5f 100%)',
        color: '#fff',
        padding: '3.5rem 1rem 2.5rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '0.75rem', letterSpacing: '-1px' }}>
            Everything happening in<br />
            <span style={{ color: '#5eead4' }}>San Marcos</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.85, marginBottom: '2rem' }}>
            Music. Food. Festivals. Markets. All in one place.
          </p>

          {/* Date range search */}
          <form onSubmit={handleSearch} style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 14,
            padding: '1rem 1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)'
          }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>🗓 Planning a visit?</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>Arriving</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                style={{ borderRadius: 8, border: 'none', padding: '0.4rem 0.6rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.9)' }}
              />
              <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>Leaving</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                style={{ borderRadius: 8, border: 'none', padding: '0.4rem 0.6rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.9)' }}
              />
            </div>
            <button type="submit" style={{
              background: '#0e8c8c',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.45rem 1rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              Show Events →
            </button>
            {(searchFrom || searchTo) && (
              <button type="button" onClick={handleClearSearch} style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                padding: '0.4rem 0.75rem',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}>
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem 8rem' }}>
        {/* Category filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setCategory('all')}
            style={{
              background: category === 'all' ? '#1a1a2e' : '#fff',
              color: category === 'all' ? '#fff' : '#1a1a2e',
              border: '1px solid #e5e7eb',
              borderRadius: 20,
              padding: '0.35rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: category === 'all' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            All
          </button>
          {CATEGORIES.map(cat => {
            const color = CATEGORY_COLORS[cat];
            const isActive = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  background: isActive ? color : `${color}15`,
                  color: isActive ? '#fff' : color,
                  border: `1px solid ${color}40`,
                  borderRadius: 20,
                  padding: '0.35rem 0.9rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>

        {/* Status bar */}
        {(searchFrom && searchTo) && (
          <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#4b5563' }}>
            Showing events from <strong>{formatDate(searchFrom)}</strong> to <strong>{formatDate(searchTo)}</strong>
            {' '}· {events.length} found
          </div>
        )}

        {/* Events grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌀</div>
            Loading events...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
            {error}
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
            No events found for the selected filters.{' '}
            <button onClick={handleClearSearch} style={{ color: '#0e8c8c', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        )}

        {/* Submit CTA */}
        <div style={{
          marginTop: '2.5rem',
          padding: '1.5rem',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 12,
          textAlign: 'center'
        }}>
          <p style={{ color: '#166534', marginBottom: '0.75rem' }}>
            Know about an event we're missing?
          </p>
          <Link to="/submit" style={{
            display: 'inline-block',
            background: '#0e8c8c',
            color: '#fff',
            padding: '0.6rem 1.5rem',
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: 'none'
          }}>
            Submit an Event
          </Link>
        </div>
      </div>

      {/* Sticky Riverbend CTA */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#051e33',
        color: '#fff',
        padding: '0.75rem 1rem',
        textAlign: 'center',
        zIndex: 200,
        fontSize: '0.9rem',
        borderTop: '2px solid #0e8c8c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <span>🏡 Need a place to stay in San Marcos? Riverbend Hideaway sleeps up to 12 —</span>
        <a
          href="https://stay.cohostr.com/san-marcos/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#5eead4',
            fontWeight: 700,
            textDecoration: 'none',
            borderBottom: '1px solid #5eead4'
          }}
        >
          book direct at stay.cohostr.com/san-marcos/ →
        </a>
      </div>
    </div>
  );
}
