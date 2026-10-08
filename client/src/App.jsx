import React, { useEffect, useState, lazy, Suspense } from "react";
import Discovery from "./pages/Discovery.jsx";
import EventPage from "./pages/EventPage.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import Editorial from "./pages/Editorial.jsx";
import Forms from "./pages/Forms.jsx";
import { trackPageView, trackEvent } from "./analytics.js";
import { PageTitle } from "./components/UI.jsx";
const Admin = lazy(() => import("./pages/Admin.jsx"));
function AdminSurface() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? (
    <Suspense fallback={<p role="status">Loading administration…</p>}>
      <Admin />
    </Suspense>
  ) : (
    <p>Loading administration…</p>
  );
}
function Logo() {
  return (
    <a className="logo" href="/" aria-label="SM-TX.com home">
      <svg viewBox="0 0 44 32" width="44" height="32" aria-hidden="true">
        <path
          d="M1 9Q11-1 22 9T43 9M1 18Q11 8 22 18T43 18M1 27Q11 17 22 27T43 27"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      </svg>
      <span>
        SM-TX<span className="logo-dot">.com</span>
      </span>
    </a>
  );
}
export default function App({ model: m }) {
  useEffect(() => {
    trackPageView(m.path);
    if (m.kind === "event")
      trackEvent("view_event_details", {
        event_id: m.event.id,
        event_category: m.event.category,
      });
  }, [m.path]);
  const admin = m.kind === "admin";
  const links = [
    ["Events", "/events"],
    ["Calendar", "/calendar"],
    ["Guides", "/guides"],
    ["Stay", "/stay"],
  ];
  let content;
  if (m.kind === "discovery")
    content = (
      <Discovery
        model={{
          ...m,
          pageLink: (n) => {
            const p = new URLSearchParams(m.query);
            p.set("page", n);
            return m.path + "?" + p.toString();
          },
        }}
      />
    );
  else if (m.kind === "event") content = <EventPage model={m} />;
  else if (m.kind === "calendar") content = <CalendarPage model={m} />;
  else if (m.kind === "editorial") content = <Editorial model={m} />;
  else if (m.kind === "submit" || m.kind === "contact")
    content = <Forms contact={m.kind === "contact"} eventId={m.eventId} />;
  else if (admin) content = <AdminSurface />;
  else
    content = (
      <div className="error-page">
        <PageTitle title={m.heading} />
        <p>{m.description}</p>
        <a className="button" href="/events">
          Browse events
        </a>
      </div>
    );
  return (
    <div
      className={admin ? "site-shell admin-shell" : "site-shell public-shell"}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Logo />
          {admin ? (
            <a href="/">Return to public site</a>
          ) : (
            <>
              <nav className="desktop-nav" aria-label="Main navigation">
                {links.map(([label, path]) => (
                  <a
                    key={path}
                    href={path}
                    aria-current={
                      m.path.startsWith(path) ||
                      (path === "/events" && m.path === "/")
                        ? "page"
                        : undefined
                    }
                  >
                    {label}
                  </a>
                ))}
                <a className="submit-link" href="/submit">
                  Submit an event
                </a>
              </nav>
              <details className="mobile-nav">
                <summary>Menu</summary>
                <nav aria-label="Mobile navigation">
                  {[...links, ["Submit an event", "/submit"]].map(
                    ([label, path]) => (
                      <a
                        key={path}
                        href={path}
                        aria-current={
                          m.path.startsWith(path) ? "page" : undefined
                        }
                      >
                        {label}
                      </a>
                    ),
                  )}
                </nav>
              </details>
            </>
          )}
        </div>
      </header>
      <main
        id="main"
        tabIndex="-1"
        className={admin ? "admin-surface" : "container"}
      >
        {content}
      </main>
      {!admin && (
        <footer className="site-footer">
          <div className="footer-inner">
            <div>
              <Logo />
              <p>
                Good things happen here.
                <br />
                Find yours in San Marcos, Texas.
              </p>
            </div>
            <nav aria-label="Explore">
              <h2>Explore</h2>
              <a href="/events/today">Today’s events</a>
              <a href="/events/this-weekend">This weekend</a>
              <a href="/guides">San Marcos guides</a>
              <a href="/submit">Submit an event</a>
            </nav>
            <nav aria-label="About the site">
              <h2>SM-TX.com</h2>
              <a href="/about">About</a>
              <a href="/editorial-policy">Editorial policy</a>
              <a href="/contact">Contact & corrections</a>
              <a href="/stay">Riverbend Hideaway</a>
            </nav>
            <p className="footer-bottom">
              Independent local listings · Confirm event details with the
              official organizer.
              <br />
              Published by SM-TX.com. Riverbend Hideaway is the publisher’s
              vacation rental.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
