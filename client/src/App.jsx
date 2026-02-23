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
    </>
  );
}
