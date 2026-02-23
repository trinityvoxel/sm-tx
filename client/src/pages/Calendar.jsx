import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API, CATEGORY_COLORS, CATEGORY_LABELS } from '../constants.js';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isoDate(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [allEvents, setAllEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  // Parse dateFrom/dateTo from URL state (passed from Home)
  const location = useLocation();
  const [highlightFrom, setHighlightFrom] = useState(location.state?.dateFrom || '');
  const [highlightTo, setHighlightTo] = useState(location.state?.dateTo || '');

  useEffect(() => {
    fetch(`${API}/events?upcoming=true`)
      .then(r => r.json())
      .then(data => { setAllEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  function getEventsForDay(day) {
    const dateStr = isoDate(year, month, day);
    return allEvents.filter(e => {
      if (!e.date_end || e.date_end === e.date_start) return e.date_start === dateStr;
      return e.date_start <= dateStr && e.date_end >= dateStr;
    });
  }

  function isInHighlight(day) {
    if (!highlightFrom || !highlightTo) return false;
    const dateStr = isoDate(year, month, day);
    return dateStr >= highlightFrom && dateStr <= highlightTo;
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = isoDate(now.getFullYear(), now.getMonth(), now.getDate());

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '5rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <button onClick={prevMonth} style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
            padding: '0.5rem 1rem', fontSize: '1.1rem', cursor: 'pointer'
          }}>←</button>
          <h2 style={{ fontWeight: 700, fontSize: '1.4rem', color: '#1a1a2e' }}>
            {MONTH_NAMES[month]} {year}
          </h2>
          <button onClick={nextMonth} style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
            padding: '0.5rem 1rem', fontSize: '1.1rem', cursor: 'pointer'
          }}>→</button>
        </div>

        {highlightFrom && highlightTo && (
          <div style={{
            marginBottom: '1rem', padding: '0.5rem 0.75rem',
            background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
            fontSize: '0.85rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <span>🗓</span>
            <span>Highlighting your visit: <strong>{formatDateFull(highlightFrom)}</strong> → <strong>{formatDateFull(highlightTo)}</strong></span>
            <button onClick={() => { setHighlightFrom(''); setHighlightTo(''); }} style={{
              marginLeft: 'auto', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.85rem'
            }}>✕</button>
          </div>
        )}

        {/* Calendar grid */}
        <div style={{
          background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
          overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f3f4f6' }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{
                padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem',
                fontWeight: 600, color: '#6b7280', textTransform: 'uppercase'
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {/* Empty cells for first day offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: 70, background: '#fafafa', borderBottom: '1px solid #f3f4f6', borderRight: '1px solid #f3f4f6' }} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = isoDate(year, month, day);
              const dayEvents = getEventsForDay(day);
              const isToday = dateStr === todayStr;
              const isSelected = selectedDay === day;
              const isHighlighted = isInHighlight(day);

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  style={{
                    minHeight: 70,
                    padding: '0.35rem 0.4rem',
                    borderBottom: '1px solid #f3f4f6',
                    borderRight: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    background: isSelected ? '#eff6ff' : isHighlighted ? '#f0fdf4' : isToday ? '#fef3c7' : '#fff',
                    transition: 'background 0.1s',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    fontWeight: isToday ? 700 : 400,
                    fontSize: '0.85rem',
                    color: isToday ? '#0e8c8c' : '#1a1a2e',
                    marginBottom: '0.25rem'
                  }}>
                    {isToday ? (
                      <span style={{ background: '#0e8c8c', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                        {day}
                      </span>
                    ) : day}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <span key={idx} style={{
                        display: 'inline-block',
                        width: 8, height: 8,
                        borderRadius: '50%',
                        background: CATEGORY_COLORS[e.category] || '#6b7280'
                      }} title={e.name} />
                    ))}
                    {dayEvents.length > 3 && (
                      <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#6b7280' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {CATEGORY_LABELS[cat]}
            </div>
          ))}
        </div>

        {/* Selected day events */}
        {selectedDay && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#1a1a2e' }}>
              Events on {MONTH_NAMES[month]} {selectedDay}
            </h3>
            {selectedEvents.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No events on this day.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedEvents.map(event => {
                  const color = CATEGORY_COLORS[event.category];
                  return (
                    <Link key={event.id} to={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{
                        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                        padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s',
                        borderLeft: `4px solid ${color}`
                      }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{event.name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            {event.time && `${event.time} · `}{event.venue_name}
                          </div>
                        </div>
                        <span style={{
                          background: color + '20', color, borderRadius: 20,
                          padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600
                        }}>
                          {CATEGORY_LABELS[event.category]}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
