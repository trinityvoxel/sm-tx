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
        description="Top restaurants, bars, and cafes in San Marcos. From riverside dining to casual tacos, here's where to eat."
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
              From riverside dining to food trucks, local breweries to taco stands — San Marcos has something for every palate.
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
          
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🍽️ Casual Dining & Local Favorites
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              Quick, delicious, and authentic — these spots capture the spirit of San Marcos.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Texas Chansey Grill</strong> — Local favorite for burgers, sandwiches, and Tex-Mex comfort food.</li>
              <li><strong>The Grapevine</strong> — Bar and restaurant with good wings, nachos, and appetizers. Great for groups.</li>
              <li><strong>Tantra Restaurant</strong> — Upscale casual with live music. Known for steaks and seafood.</li>
              <li><strong>Los Molcajetes</strong> — Authentic Mexican cuisine. Try the carne asada.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🌮 Tacos, Food Trucks & Quick Bites
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              San Marcos has some of the best casual Mexican food in Texas. Look for food trucks near the river and downtown.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Aldaco's Tacos</strong> — Quick, fresh, and affordable. A local institution.</li>
              <li><strong>Juan's Tacos</strong> — Early morning breakfast tacos and carne guisada.</li>
              <li><strong>Downtown Food Trucks</strong> — Various vendors near the river. BBQ, tacos, and breakfast.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🍺 Breweries & Coffee
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              Craft beer and coffee culture thrive in San Marcos.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Barrel of Bones Brewing Company</strong> — Local brewery with outdoor seating and food trucks.</li>
              <li><strong>Greener Pastures Coffee Roasters</strong> — Excellent local coffee. Good workspace for working remotely.</li>
              <li><strong>San Marcos Tap House</strong> — 50+ craft beers on tap.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🏞️ Riverside Dining & Scenic Spots
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              Dining with a view of the San Marcos River is one of the city's best experiences.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Tantra Restaurant</strong> — Fine dining overlooking the river. Live music on weekends. Known for steaks and seafood.</li>
              <li><strong>The Grapevine</strong> — Casual riverside dining with good appetizers and drinks.</li>
              <li><strong>Downtown Riverfront Picnic Areas</strong> — Free river access for picnicking. Perfect for casual dining on the bank.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🎓 College Town Vibes
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              Texas State University keeps the dining scene young and diverse. The downtown strip has new restaurants and bars opening regularly.
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
              🏡 Cook Your Own Meals Too
            </h3>
            <p style={{ color: '#134e4a', lineHeight: 1.7, marginBottom: '1rem' }}>
              Riverbend Hideaway has a full kitchen if you want to cook group meals. Stock up at local groceries and enjoy farm-to-table meals on your private deck overlooking the Blanco River.
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
              <strong>Pro Tip:</strong> Most downtown restaurants are casual and friendly. Show up early (before 6pm) to avoid long waits on weekends.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
