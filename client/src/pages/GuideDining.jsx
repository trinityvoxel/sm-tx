import { Link } from 'react-router-dom';
import Head from '../components/Head.jsx';

const RIVERBEND_URL = 'https://www.cohostr.com/listings/297530';

export default function GuideDining() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Best Restaurants & Dining in San Marcos, TX',
    description: 'Discover the best places to eat in San Marcos including casual dining, fine restaurants, and local favorites.',
    url: 'https://sm-tx.com/guides/dining'
  };

  return (
    <>
      <Head
        title="Best Restaurants & Dining in San Marcos, TX | SM-TX"
        description="Top restaurants, bars, and cafes in San Marcos. From casual tacos to fine dining, here's where to eat."
        url="https://sm-tx.com/guides/dining"
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
              Best Places to Eat in<br /><span style={{ color: '#5eead4' }}>San Marcos</span>
            </h1>
            <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '1rem' }}>
              Local favorites, upscale dining, and casual eats. San Marcos has options for every taste and budget.
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
          
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🍽️ Upscale & Fine Dining
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              San Marcos has quality restaurants perfect for a special night out.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>North Street</strong> — Contemporary American cuisine with carefully sourced ingredients. Great for date nights and celebrations.</li>
              <li><strong>Industry</strong> — Modern dining with seasonal menus. Known for creative dishes and craft cocktails.</li>
              <li><strong>Umami</strong> — Asian-inspired cuisine with bold flavors and an extensive drink program.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🌮 Mexican & Casual
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              San Marcos has authentic Mexican food done right, plus casual spots perfect for groups.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Dos Gatos</strong> — Authentic Mexican. Fresh, flavorful, and reliable. Great for families.</li>
              <li><strong>Chuys</strong> — Casual Tex-Mex with a fun atmosphere. Perfect for groups and happy hour.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🍕 Pizza
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              Quality pizza in downtown San Marcos.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Pie Society</strong> — Handcrafted pizza. Great for casual dining or takeout.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🍔 American & Comfort Food
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              Classic American dining and pub fare.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Sean Patricks</strong> — Pub-style dining with burgers, appetizers, and craft beers.</li>
              <li><strong>Blue Dahlia</strong> — Casual spot with comfort food and a welcoming vibe.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              💡 Pro Tips
            </h2>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li>Most restaurants are within walking distance of downtown and the river.</li>
              <li>Arrive early on weekends (before 6pm) to avoid long waits.</li>
              <li>Check <Link to="/" style={{ color: '#0e8c8c', fontWeight: 600 }}>SM-TX Events</Link> for live music and special dining events happening around town.</li>
            </ul>
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
              🏡 Cook Your Own Meals Too
            </h3>
            <p style={{ color: '#134e4a', lineHeight: 1.7, marginBottom: '1rem' }}>
              Riverbend Hideaway has a full kitchen if you want to cook group meals. Stock up at local grocers and enjoy farm-to-table meals on your private deck overlooking the Blanco River.
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
        </div>
      </div>
    </>
  );
}
