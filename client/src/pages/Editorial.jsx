import Link from "../components/Link.jsx";
import React from "react";
import { guides } from "../data/guides.js";
import {
  PageTitle,
  Breadcrumbs,
  Lodging,
  Arrow,
  BookingLink,
} from "../components/UI.jsx";
import { formatDate } from "../lib/dates.js";
export default function Editorial({ model: m }) {
  const g = guides.find((g) => g.path === m.path);
  if (g)
    return (
      <>
        <Breadcrumbs items={[["Guides", "/guides"], [g.title]]} />
        <article className="editorial">
          <PageTitle eyebrow="The San Marcos field guide" title={g.title}>
            <p>{g.intro}</p>
          </PageTitle>
          <p className="byline">
            By SM-TX.com · Sources reviewed{" "}
            <time dateTime={g.reviewed}>
              {formatDate(g.reviewed, { year: "numeric" })}
            </time>
          </p>
          <nav className="contents" aria-label="In this guide">
            <h2>In this guide</h2>
            <ol>
              {g.sections.map((s, i) => (
                <li key={s.title}>
                  <Link href={"#section-" + i}>{s.title}</Link>
                </li>
              ))}
            </ol>
          </nav>
          {g.sections.map((s, i) => (
            <section id={"section-" + i} key={s.title}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
              <ul className="source-links">
                {s.links.map(([label, url]) => (
                  <li key={url}>
                    <Link
                      href={url}
                      rel={
                        url.startsWith("https://www.cohostr.com")
                          ? "sponsored"
                          : undefined
                      }
                    >
                      {label} <Arrow />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <section className="source-note">
            <h2>About this guide</h2>
            <p>
              Published by SM-TX.com. Source links appear alongside each
              recommendation. Hours, access, menus, and schedules can change.{" "}
              <Link href="/contact">Suggest a correction</Link> or read our{" "}
              <Link href="/editorial-policy">editorial policy</Link>.
            </p>
          </section>
        </article>
        <section>
          <h2>Keep exploring</h2>
          <div className="guide-grid">
            {guides
              .filter((x) => x !== g)
              .map((x) => (
                <Link className="guide-card" key={x.path} href={x.path}>
                  <h3>{x.title}</h3>
                  <span>
                    Read the guide <Arrow />
                  </span>
                </Link>
              ))}
          </div>
        </section>
        <Lodging />{" "}
      </>
    );
  if (m.path === "/guides")
    return (
      <>
        <PageTitle title="A little local direction.">
          <p>
            Practical guides to San Marcos, Texas, with official sources to help
            you plan your visit.
          </p>
        </PageTitle>
        <div className="guide-grid">
          {guides.map((g, i) => (
            <Link className="guide-card" href={g.path} key={g.path}>
              <span className="guide-number">0{i + 1}</span>
              <h2>{g.title}</h2>
              <p>{g.intro}</p>
              <span>
                Read the guide <Arrow />
              </span>
            </Link>
          ))}
        </div>
        <Lodging />
      </>
    );
  if (m.path === "/stay")
    return (
      <>
        <PageTitle
          eyebrow="Publisher’s vacation rental"
          title="Stay for the weekend."
        >
          <p>
            Visiting San Marcos for an event? Explore Riverbend Hideaway and
            check current property details, availability, and booking terms
            directly.
          </p>
        </PageTitle>
        <BookingLink placement="stay_page" />
        <figure className="stay-photo">
          <img
            src="https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/87999-297530-DcPs67WuOwB5o7P5GqtCvFN32E8cRhwrrp8RMIlPoa8-68efd79c87e31"
            alt="Riverbend Hideaway vacation rental"
            width="1200"
            height="700"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.closest("figure").hidden = true;
            }}
          />
          <figcaption>Riverbend Hideaway · SM-TX.com listing.</figcaption>
        </figure>
        <div className="editorial">
          <h2>Start with the event, then plan the stay.</h2>
          <p>
            Confirm the event’s dates and admission details before booking
            lodging. Our <Link href="/events/this-weekend">weekend calendar</Link> and{" "}
            <Link href="/guides/hill-country-weekend">weekend planning guide</Link>{" "}
            can help you put the trip together.
          </p>
          <h2>A clear connection</h2>
          <p>
            SM-TX.com promotes the publisher’s vacation rental, Riverbend
            Hideaway. Event listings and guide recommendations are separate from
            the booking process. Prices, availability, amenities, and terms are
            provided by the booking page.
          </p>
        </div>
      </>
    );
  return (
    <article className="editorial">
      <PageTitle title={m.heading} />
      {m.path === "/about" ? (
        <>
          <p>
            SM-TX.com is an independent event-discovery site for San Marcos,
            Texas. It brings together public event listings and community
            submissions to help residents, students, families, and visitors
            decide what to do.
          </p>
          <h2>Find something worth going out for.</h2>
          <p>
            Start with <Link href="/events/today">today’s events</Link>, plan{" "}
            <Link href="/events/this-weekend">this weekend</Link>, or use the{" "}
            <Link href="/calendar">calendar</Link>. Listings link back to an official
            source whenever one is available.
          </p>
          <h2>Who publishes this site?</h2>
          <p>
            The publisher is SM-TX.com. This is an independent publication, not
            an official city or Texas State University website. The publisher
            also promotes Riverbend Hideaway, a vacation rental. Those
            placements are identified and kept secondary to event discovery.
          </p>
          <p>
            <Link href="/editorial-policy">
              How we handle listings and corrections
            </Link>{" "}
            · <Link href="/contact">Contact SM-TX.com Admin</Link>
          </p>
        </>
      ) : (
        <>
          <p>
            Our goal is to make local events easier to discover while being
            clear about where the information comes from and what still needs
            confirmation.
          </p>
          <h2>Where listings come from</h2>
          <p>
            Events come from configured public sources and community
            submissions. Community submissions enter a moderation queue before
            publication. Imported information can be incomplete or out of date;
            inclusion is not an endorsement or a guarantee of admission.
          </p>
          <h2>Dates, prices, and source checks</h2>
          <p>
            Event dates describe the event itself. A source-check date appears
            only when a review has been recorded. Guide review dates refer to an
            editorial source review, not a live guarantee of current conditions.
            We do not treat a database update as proof that an organizer
            reconfirmed an event.
          </p>
          <p>
            Labels such as “listed as free” and “listed as kid-friendly” reflect
            supplied information. Confirm restrictions, prices, times, and
            access with the official organizer. Unknown details stay unknown.
          </p>
          <h2>Corrections and changes</h2>
          <p>
            <Link href="/contact">Send a correction</Link> with the event link, the
            detail that needs changing, and an official source where possible.
            Corrections are reviewed before changes are published. Canceled,
            postponed, and past events should be clearly distinguished from
            upcoming events.
          </p>
          <h2>Descriptions and attribution</h2>
          <p>
            Source links accompany event details. We use supplied factual
            information and short editorial summaries; we do not invent
            descriptions or publish generic filler to make a page longer. If you
            own content and have a concern, contact the administrator.
          </p>
          <h2>Commercial relationship</h2>
          <p>
            SM-TX.com promotes the publisher’s vacation rental, Riverbend
            Hideaway. Lodging placements are labeled. We do not claim fake
            reviews, ratings, discounts, or availability.
          </p>
          <h2>Submission privacy</h2>
          <p>
            Organizer names and email addresses submitted for administration are
            kept out of public event responses. Contact messages go to the site
            administrator. Do not include sensitive personal information. The
            site uses Google Analytics to understand usage; form contents are
            not sent as analytics event parameters.
          </p>
        </>
      )}
    </article>
  );
}
