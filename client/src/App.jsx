import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Calendar from './pages/Calendar.jsx';
import EventDetail from './pages/EventDetail.jsx';
import Submit from './pages/Submit.jsx';

const navStyle = {
  background: '#042f2e',
  color: '#fff',
  padding: '0 0',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
};

const innerNav = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '0 1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  height: 56
};

const logoStyle = {
  fontWeight: 800,
  fontSize: '1.2rem',
  color: '#fff',
  textDecoration: 'none',
  letterSpacing: '-0.5px',
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
  marginRight: '0.5rem'
};

function NavLink({ to, children }) {
  const loc = useLocation();
  const active = loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to));
  return (
    <Link
      to={to}
      style={{
        color: active ? '#0e8c8c' : 'rgba(255,255,255,0.8)',
        textDecoration: 'none',
        fontWeight: active ? 600 : 400,
        fontSize: '0.95rem',
        padding: '0.25rem 0',
        borderBottom: active ? '2px solid #0e8c8c' : '2px solid transparent',
        transition: 'color 0.15s'
      }}
    >
      {children}
    </Link>
  );
}

function Footer() {
  return (
    <footer style={{
      background: '#042f2e', color: '#99d6d4', fontSize: '0.9rem', lineHeight: 1.8,
      padding: '2.5rem 1.5rem 3.5rem', marginTop: '3rem',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🧜‍♀️</span>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#e0fffe', letterSpacing: '0.04em' }}>
            About San Marcos
          </span>
        </div>
        <p style={{ margin: '0 0 0.85rem', color: '#b2e0de' }}>
          San Marcos sits on the banks of the spring-fed San Marcos River — one of the oldest
          continuously inhabited places in North America and home to some of the clearest water in
          Texas. The river runs a constant 68°F year-round, making it a magnet for swimmers, tubers,
          and kayakers in every season.
        </p>
        <p style={{ margin: '0 0 0.85rem', color: '#b2e0de' }}>
          For over four decades, Aquarena Springs entertained visitors with live underwater mermaid
          performances — a beloved piece of local history woven into the city's identity. The shows
          are gone, but the springs remain. Texas State University keeps the city young and
          constantly buzzing with music, art, and events year-round.
        </p>
        <p style={{ margin: 0, color: '#b2e0de' }}>
          San Marcos punches well above its size: world-class outlet shopping, a thriving live
          music scene, and easy access to the Texas Hill Country. Whether you're here for a weekend
          or a week, there's always something on.
        </p>
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #0e5c5a', color: '#6baaa8', fontSize: '0.8rem' }}>
          SM-TX Events · Community calendar for San Marcos, TX ·{' '}
          <Link to="/submit" style={{ color: '#5eead4', textDecoration: 'none' }}>Submit an event</Link>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <nav style={navStyle}>
        <div style={innerNav}>
          <Link to="/" style={logoStyle}>
            <span>🧜‍♀️</span>
            <span>SM-TX</span>
          </Link>
          <NavLink to="/">Events</NavLink>
          <NavLink to="/calendar">Calendar</NavLink>
          <NavLink to="/submit">Submit Event</NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/submit" element={<Submit />} />
      </Routes>
      <Footer />
    </>
  );
}
