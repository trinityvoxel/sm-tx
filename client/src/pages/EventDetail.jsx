import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API, CATEGORY_COLORS, CATEGORY_LABELS } from '../constants.js';
import Head from '../components/Head.jsx';

function cleanDescription(html) {
  if (!html) return '';
  let s = html;

  // Strip inline images
  s = s.replace(/<img[^>]*>/gi, '');

  // Strip tab characters inside list items (Trumba artifact)
  s = s.replace(/\t/g, '');

  // Strip the TXST metadata block at the bottom — everything from the first
  // metadata label (<b>Campus Location</b>, <b>Audience</b>, <b>Event Type</b>, etc.)
  s = s.replace(/<b>(?:Campus Location|Location|Room|Audience|Event Type|Cost|Sponsor|Contact|More info)<\/b>[\s\S]*/i, '');

  // Strip leading date/location line(s) — e.g. "McCoy Hall Room 431 <br/>Monday, Feb 23..."
  // Pattern: text with no <p>/<ul> tags followed by a <br/> — strip up to 2 leading lines
  s = s.replace(/^([^<]{0,100}<br\s*\/?>\s*){1,2}/i, '');

  // Convert <br/> between block-level content into paragraph breaks
  s = s.replace(/(<br\s*\/?>\s*){2,}/gi, '</p><p>');
  s = s.replace(/<br\s*\/?>/gi, '<br/>');

  // Wrap in paragraph if not already wrapped
  if (!/^<[ph\d]|^<ul|^<ol/i.test(s.trim())) {
    s = `<p>${s}</p>`;
  }

  // Strip relative links, keep text
  s = s.replace(/<a\s[^>]*href="(?!https?)[^"]*"[^>]*>(.*?)<\/a>/gi, '$1');

  // Strip leading/trailing empty paragraphs
  s = s.replace(/^(<p>\s*<\/p>)+|(<p>\s*<\/p>)+$/gi, '');

  return s.trim();
}

function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function buildGCalUrl(event) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const title = encodeURIComponent(event.name);
  const loc = encodeURIComponent(`${event.venue_name}, ${event.venue_address}`);
  const details = encodeURIComponent(
    [event.description, event.url ? `More info: ${event.url}` : ''].filter(Boolean).join('\n\n')
  );
  // Format date as YYYYMMDD
  const startDate = event.date_start.replace(/-/g, '');
  const endDate = (event.date_end || event.date_start).replace(/-/g, '');
  return `${base}&text=${title}&location=${loc}&details=${details}&dates=${startDate}/${endDate}`;
}

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API}/events/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Event not found');
        return r.json();
      })
      .then(data => { setEvent(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: '#6b7280' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌀</div>
      Loading event...
    </div>
  );

  if (error) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>😕</div>
      {error}
      <br /><br />
      <Link to="/" style={{ color: '#0e8c8c' }}>← Back to events</Link>
    </div>
  );

  const color = CATEGORY_COLORS[event.category] || '#6b7280';
  const label = CATEGORY_LABELS[event.category] || event.category;
  const dateStr = event.date_end && event.date_end !== event.date_start
    ? `${formatDateFull(event.date_start)} – ${formatDateFull(event.date_end)}`
    : formatDateFull(event.date_start);

  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description ? event.description.replace(/<[^>]*>/g, '') : event.name,
    startDate: event.date_start,
    endDate: event.date_end || event.date_start,
    eventAttendanceMode: 'OfflineEventAttendanceMode',
    eventStatus: 'EventScheduled',
    location: {
      '@type': 'Place',
      name: event.venue_name,
      address: event.venue_address
    }
  };

  const eventUrl = `https://sm-tx.com/events/${id}`;
  const eventDescription = event.description ? event.description.replace(/<[^>]*>/g, '').substring(0, 160) : `${event.name} in San Marcos`;

  return (
    <>
      <Head
        title={`${event.name} | SM-TX Events`}
        description={eventDescription}
        url={eventUrl}
        schema={eventSchema}
      />
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '5rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Back */}
        <Link to="/" style={{ color: '#6b7280', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.25rem' }}>
          ← All events
        </Link>

        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden'
        }}>
          {/* Color accent bar */}
          <div style={{ height: 6, background: color }} />

          <div style={{ padding: '1.5rem' }}>
            {/* Category badge */}
            <span style={{
              background: color + '18', color, border: `1px solid ${color}40`,
              borderRadius: 20, padding: '0.2rem 0.7rem', fontSize: '0.8rem', fontWeight: 600
            }}>
              {label}
            </span>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2, marginTop: '0.75rem', marginBottom: '1rem', color: '#1a1a2e' }}>
              {event.name}
            </h1>

            {/* Info rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.95rem' }}>
                <span>📅</span>
                <span>{dateStr}{event.time ? ` · ${event.time}` : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.95rem' }}>
                <span>📍</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{event.venue_name}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{event.venue_address}</div>
                </div>
              </div>
              {event.cost && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem' }}>
                  <span>🎟</span>
                  <span>{event.cost}</span>
                </div>
              )}
              {event.url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem' }}>
                  <span>🔗</span>
                  <a href={event.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0e8c8c' }}>
                    {event.url}
                  </a>
                </div>
              )}
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {!!event.kid_friendly && (
                <span style={{ fontSize: '0.82rem', background: '#d1fae5', color: '#065f46', borderRadius: 20, padding: '0.3rem 0.75rem', fontWeight: 500 }}>
                  👦 Kid-friendly
                </span>
              )}
              {!!event.pet_friendly && (
                <span style={{ fontSize: '0.82rem', background: '#fef3c7', color: '#92400e', borderRadius: 20, padding: '0.3rem 0.75rem', fontWeight: 500 }}>
                  🐾 Pet-friendly
                </span>
              )}
              {!!event.age_21_plus && (
                <span style={{ fontSize: '0.82rem', background: '#fee2e2', color: '#991b1b', borderRadius: 20, padding: '0.3rem 0.75rem', fontWeight: 500 }}>
                  🔞 21+ Only
                </span>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div
                className="event-description"
                style={{
                  background: '#f9fafb', borderRadius: 8, padding: '1rem 1.25rem',
                  fontSize: '0.95rem', lineHeight: 1.75, color: '#374151', marginBottom: '1.25rem',
                  border: '1px solid #f3f4f6'
                }}
                dangerouslySetInnerHTML={{ __html: cleanDescription(event.description) }}
              />
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a
                href={buildGCalUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: '#4285f4', color: '#fff', borderRadius: 8,
                  padding: '0.55rem 1rem', fontSize: '0.875rem', fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                📆 Add to Google Calendar
              </a>
              <button
                onClick={handleShare}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: copied ? '#10b981' : '#fff', color: copied ? '#fff' : '#1a1a2e',
                  border: '1px solid #e5e7eb', borderRadius: 8,
                  padding: '0.55rem 1rem', fontSize: '0.875rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                {copied ? '✅ Copied!' : '🔗 Share'}
              </button>
            </div>
          </div>
        </div>

        {/* Riverbend CTA */}
        <div style={{
          marginTop: '1.5rem',
          background: '#042f2e',
          color: '#fff',
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>🏡 Staying for {event.name}?</div>
            <div style={{ opacity: 0.85, fontSize: '0.9rem' }}>
              Riverbend Hideaway sleeps up to 12 · Perfect for groups visiting San Marcos
            </div>
          </div>
          <a
            href="https://www.cohostr.com/listings/297530"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#0e8c8c', color: '#fff', borderRadius: 8,
              padding: '0.6rem 1.2rem', fontWeight: 700, textDecoration: 'none',
              fontSize: '0.9rem', whiteSpace: 'nowrap'
            }}
          >
            Book Direct →
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
