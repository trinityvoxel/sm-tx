import { Link } from 'react-router-dom';
import Head from '../components/Head.jsx';

const RIVERBEND_URL = 'https://www.cohostr.com/listings/297530';

export default function GuideHillCountry() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Texas Hill Country Weekend Trip Guide from San Marcos',
    description: 'Day trips and weekend itineraries from San Marcos to the Texas Hill Country, including Fredericksburg, Luckenbach, and scenic drives.',
    url: 'https://sm-tx.com/guides/hill-country-weekend'
  };

  return (
    <>
      <Head
        title="Texas Hill Country Weekend Trip Guide | SM-TX"
        description="Day trips from San Marcos to Fredericksburg, Gruene, Blanco, and the Hill Country. Itineraries and recommendations."
        url="https://sm-tx.com/guides/hill-country-weekend"
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
              Texas Hill Country<br /><span style={{ color: '#5eead4' }}>Weekend Guide</span>
            </h1>
            <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '1rem' }}>
              San Marcos is your gateway to the Texas Hill Country. Wine, wildflowers, historic towns, and scenic drives.
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
          
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              Why San Marcos is the Perfect Base
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              San Marcos sits at the eastern edge of the Texas Hill Country, giving you access to everything while staying centered. Fredericksburg is 45 minutes away, Austin is 30 minutes south, and New Braunfels (with its tubing) is just next door. It's the ideal home base for a Hill Country adventure.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🍷 Wine Country: Fredericksburg (45 min)
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              The heart of Texas wine country. Over 30 wineries, German heritage, wildflower displays, and charming downtown galleries.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Wine Trail Loop</strong> — Drive scenic roads hitting multiple wineries. Start with Becker Vineyards or Pedernales Cellars.</li>
              <li><strong>Downtown Fredericksburg</strong> — Main Street has shops, restaurants, and tasting rooms. Park and walk.</li>
              <li><strong>Wildflower Season</strong> — Late March through May. Peak bluebonnet viewing near Fredericksburg.</li>
              <li><strong>Day Trip Itinerary:</strong> Leave San Marcos 10am → Wine tasting 11am–1pm → Lunch on Main Street 1–2pm → More wineries 2–5pm → Return by 7pm.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🤠 Historic Gruene (20 min)
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              One of Texas' best-preserved historic towns. Antiques, tubing, live music, and riverside dining.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Gruene Hall</strong> — Historic dance hall with live country music every night. Established 1878.</li>
              <li><strong>Tubing the Guadalupe</strong> — Rent tubes at outfitters and float downriver (gentler than San Marcos).</li>
              <li><strong>Antique Shops & Galleries</strong> — Browse small shops along the main streets.</li>
              <li><strong>Riverside Dining</strong> — BBQ joints, seafood, and casual spots overlooking the Guadalupe.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🎵 Scenic Drive: Blanco Corkscrew Loop (30 min)
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              One of Texas' most scenic short drives. Winding roads through ranches, wildflowers, and small towns.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Route:</strong> San Marcos → Blanco → Johnson City → Stonewall → Back via Hwy 71</li>
              <li><strong>Stops:</strong> Blanco State Park (hiking/picnicking), Johnson City (restaurants and shops), Stonewall (LBJ National Park).</li>
              <li><strong>Wildflower Peak:</strong> April is stunning. Drive with no particular destination — just enjoy the scenery.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🏜️ Natural Attractions Near San Marcos
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              Some of the best Hill Country experiences are 15–30 minutes away.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Blanco State Park</strong> — River park with hiking, picnicking, and swimming.</li>
              <li><strong>Pedernales Falls State Park</strong> — Iconic waterfalls, hiking trails, and river access (35 min).</li>
              <li><strong>Lost Maples State Park</strong> — Fall foliage paradise (45 min, best September–November).</li>
              <li><strong>Hamilton Pool Preserve</strong> — Turquoise spring-fed swimming hole (30 min, reservations required).</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🎪 Year-Round Events
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              The Hill Country has constant festivals and events.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Spring (March–May):</strong> Wildflower season, Easter festivals, Bluebonnet trails.</li>
              <li><strong>Summer (June–August):</strong> Outdoor concerts, river tubing, farmers markets.</li>
              <li><strong>Fall (September–November):</strong> Fall foliage at Lost Maples, harvest festivals, cooler weather hiking.</li>
              <li><strong>Winter (December–February):</strong> Holiday events, quiet season, best restaurant reservations available.</li>
            </ul>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginTop: '1rem' }}>
              Check <Link to="/" style={{ color: '#0e8c8c', fontWeight: 600 }}>SM-TX Events</Link> for current happenings in San Marcos.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              📝 Sample 3-Day Itinerary
            </h2>
            <div style={{
              background: '#f0fdfa',
              border: '1px solid #dbeaed',
              borderRadius: 8,
              padding: '1.25rem',
              color: '#4b5563',
              lineHeight: 1.8
            }}>
              <p><strong>Day 1 — San Marcos</strong></p>
              <p style={{ marginLeft: '1rem' }}>Float the river · Lunch downtown · Explore outlet malls · Live music at night</p>
              
              <p style={{ marginTop: '1rem' }}><strong>Day 2 — Fredericksburg Wine Trip</strong></p>
              <p style={{ marginLeft: '1rem' }}>Leave early · Tasting at 2–3 wineries · Lunch on Main Street · Drive scenic roads · Return for dinner</p>
              
              <p style={{ marginTop: '1rem' }}><strong>Day 3 — Gruene & Blanco Loop</strong></p>
              <p style={{ marginLeft: '1rem' }}>Visit Gruene Hall area · Tube the Guadalupe · Browse antiques · Scenic drive through Blanco County · Return to San Marcos</p>
            </div>
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
              🏡 Make It a Long Weekend
            </h3>
            <p style={{ color: '#134e4a', lineHeight: 1.7, marginBottom: '1rem' }}>
              Why do day trips when you can stay? Riverbend Hideaway gives you a home base with space for families or friend groups. Cook dinners, relax by the river between adventures, and explore the Hill Country at your own pace.
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
              <strong>Pro Tip:</strong> The Hill Country gets busy on weekends (especially spring and fall). Book accommodations and make restaurant reservations in advance. Weekday visits are quieter and more relaxed.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
