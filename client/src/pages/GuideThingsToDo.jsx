import { Link } from 'react-router-dom';
import Head from '../components/Head.jsx';

const RIVERBEND_URL = 'https://www.cohostr.com/listings/297530';

export default function GuideThingsToDo() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Best Things to Do in San Marcos, TX',
    description: 'Discover the top activities and attractions in San Marcos including river activities, shopping, museums, and more.',
    url: 'https://sm-tx.com/guides/things-to-do',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Float the San Marcos River' },
        { '@type': 'ListItem', position: 2, name: 'Visit San Marcos Outlet Malls' },
        { '@type': 'ListItem', position: 3, name: 'Explore the River at Spring Lake' },
        { '@type': 'ListItem', position: 4, name: 'Texas State University Campus' },
        { '@type': 'ListItem', position: 5, name: 'Gruene Historic District Day Trip' }
      ]
    }
  };

  return (
    <>
      <Head
        title="Best Things to Do in San Marcos, TX | SM-TX"
        description="Top activities in San Marcos: floating the river, outlet shopping, Spring Lake, Gruene, and more. Your guide to the best attractions."
        url="https://sm-tx.com/guides/things-to-do"
        schema={schema}
      />
      
      <div style={{ minHeight: '100vh', background: '#f0fdfa', paddingBottom: '4rem' }}>
        {/* Hero */}
        <div style={{
          backgroundImage: `linear-gradient(180deg, rgba(2,20,18,0.55) 0%, rgba(4,47,46,0.4) 100%), url('/rio-vista-hero.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#fff',
          padding: '3rem 1rem',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <h1 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 900,
              lineHeight: 1.2,
              marginBottom: '0.5rem',
              letterSpacing: '-0.5px'
            }}>
              Best Things to Do in<br /><span style={{ color: '#5eead4' }}>San Marcos</span>
            </h1>
            <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '1rem' }}>
              River activities, shopping, history, and natural attractions — all within minutes of each other.
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
          
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🏞️ River Activities
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              The San Marcos River is the lifeblood of the city. Crystal-clear water (a constant 68°F year-round) makes it perfect for floating, kayaking, and swimming.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Float the River</strong> — The iconic San Marcos experience. Rent tubes at the downtown access or book a guided float trip.</li>
              <li><strong>Kayaking</strong> — More control than floating; explore quiet sections of the river.</li>
              <li><strong>Spring Lake</strong> — Pristine natural springs. Great for swimming, picnicking, and wildlife viewing.</li>
              <li><strong>Aquarena Springs</strong> — Historic springs with scenic overlooks.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🛍️ Outlet Shopping & Downtown
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              San Marcos is home to two major outlet malls and a vibrant downtown with local shops, galleries, and restaurants.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>San Marcos Premium Outlets</strong> — Nike, Coach, Gap, and 100+ brands.</li>
              <li><strong>Tanger Outlets</strong> — Another major hub with discounted pricing.</li>
              <li><strong>Downtown San Marcos</strong> — Independent shops, art galleries, and local restaurants within walking distance of the river.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🎓 Culture & History
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              Texas State University anchors the city and brings constant cultural energy. Museums and historic sites tell the story of this ancient settlement.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>The Meadows Center</strong> — Museum, research, and visitor center at Spring Lake. Learn about the archaeological and natural history of the area.</li>
              <li><strong>San Marcos Art Center</strong> — Local artists and rotating exhibits. Located downtown.</li>
              <li><strong>TXST Campus</strong> — Walk the Texas State University campus. Frequent events, concerts, and galleries open to the public year-round.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🎵 Live Music & Nightlife
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              San Marcos has a thriving live music scene. Venues range from casual bars to dedicated music halls, with performances almost every night.
            </p>
            <p style={{ color: '#4b5563', lineHeight: 1.8 }}>
              Check <Link to="/" style={{ color: '#0e8c8c', fontWeight: 600 }}>SM-TX Events</Link> for nightly happenings — whether you're into country, blues, indie, or electronic.
            </p>
          </section>

          {/* Riverbend CTA */}
          <section style={{
            background: '#ccfbf1',
            border: '1px solid #99f6e4',
            borderRadius: 12,
            padding: '1.5rem',
            marginTop: '2.5rem',
            marginBottom: '2.5rem'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#042f2e', marginBottom: '0.5rem' }}>
              🏡 Plan an Extended Stay
            </h3>
            <p style={{ color: '#134e4a', lineHeight: 1.7, marginBottom: '1rem' }}>
              Want to explore all of these attractions without rushing? Book Riverbend Hideaway — a stunning Blanco River farmhouse just 15 minutes from downtown that sleeps up to 12. Perfect for families or groups wanting a home base in the heart of Hill Country.
            </p>
            <a
              href={RIVERBEND_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: '#0d9488',
                color: '#fff',
                padding: '0.6rem 1.25rem',
                borderRadius: 8,
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              View Riverbend Hideaway →
            </a>
          </section>

          <section style={{ paddingTop: '1.5rem', borderTop: '1px solid #dbeaed' }}>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              <strong>Tip:</strong> Most attractions are clustered within 10–15 minutes of each other. Park downtown, float the river, grab lunch, shop the outlets, catch a show — all in one day.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
