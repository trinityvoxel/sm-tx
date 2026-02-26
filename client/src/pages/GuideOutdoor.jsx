import { Link } from 'react-router-dom';
import Head from '../components/Head.jsx';

const RIVERBEND_URL = 'https://www.cohostr.com/listings/297530';

export default function GuideOutdoor() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Outdoor Activities & Adventures Near San Marcos, TX',
    description: 'Hiking, kayaking, tubing, swimming, and more. Outdoor adventure guide for San Marcos and the Texas Hill Country.',
    url: 'https://sm-tx.com/guides/outdoor-activities'
  };

  return (
    <>
      <Head
        title="Outdoor Activities & Adventures Near San Marcos | SM-TX"
        description="Hiking, kayaking, tubing, swimming, and Hill Country adventure. Complete outdoor activity guide for San Marcos."
        url="https://sm-tx.com/guides/outdoor-activities"
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
              Outdoor Adventures Near<br /><span style={{ color: '#5eead4' }}>San Marcos</span>
            </h1>
            <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '1rem' }}>
              From crystal-clear rivers to scenic hiking trails. An outdoor lover's paradise in the Texas Hill Country.
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
          
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🚣 Tubing & Floating
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              The San Marcos River is perfect for tubing and floating. The water stays a consistent 68°F year-round, and it's gentle enough for families but fun for adventure seekers.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Float Trip Time:</strong> Downtown to Martindale — approximately 2 hours of relaxation.</li>
              <li><strong>Best For Families:</strong> The river is shallow (2–6 feet) and slow-moving.</li>
              <li><strong>Rentals:</strong> Several outfitters near downtown offer tube rentals and shuttle services.</li>
              <li><strong>Season:</strong> Year-round, but busiest on warm weekends.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🏊 Swimming & Spring-Fed Water
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              San Marcos is built around cold, clean spring-fed water — a rarity in Texas.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Spring Lake</strong> — Natural springs with dedicated swimming area. Shallow, clear, and beautiful. Small admission fee.</li>
              <li><strong>Downtown San Marcos River</strong> — Free swimming in designated areas.</li>
              <li><strong>Aquarena Springs</strong> — Historic springs with scenic overlooks and easy access.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🚴 Hiking & Trail Walking
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              Scenic trails through the Hill Country. Distances range from casual walks to day hikes.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Blanco River Greenway</strong> — Easy riverside trail, great for families.</li>
              <li><strong>Purgatory Creek Trail</strong> — 3-mile loop, moderate difficulty. Waterfall views.</li>
              <li><strong>Willow Springs Trail</strong> — Scenic walk through native trees and wildflowers (seasonal).</li>
              <li><strong>Cypress Creek (30 min away)</strong> — More challenging hikes with creek crossings.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🎣 Fishing
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              The San Marcos River is stocked with catfish, bass, and perch. Texas fishing license required.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>River Fishing</strong> — Easy access from multiple spots. Fish for catfish and perch.</li>
              <li><strong>Spring Lake</strong> — Limited fishing in designated areas.</li>
              <li><strong>Local Guides</strong> — Several guide services available for half-day trips.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🚴‍♀️ Biking
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              Flat terrain and scenic routes make San Marcos great for cycling.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Downtown Loop</strong> — Flat, easy ride through the city center.</li>
              <li><strong>River Greenway</strong> — Dedicated bike path alongside the San Marcos River.</li>
              <li><strong>Hill Country Byway</strong> — More challenging rides with scenic views heading toward Blanco and Johnson City.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              📸 Nature Watching & Photography
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              The Hill Country is known for wildlife and wildflowers. Spring (March–May) is peak season for bluebonnets and Indian paintbrush.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li><strong>Spring Lake Overlook</strong> — Great for bird watching and landscape photography.</li>
              <li><strong>Wildflower Trails</strong> — Best in spring. Google "Hill Country wildflower tours" for guided options.</li>
              <li><strong>Sunrise/Sunset Spots</strong> — River overlooks near downtown.</li>
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
              🏡 Adventure Headquarters
            </h3>
            <p style={{ color: '#134e4a', lineHeight: 1.7, marginBottom: '1rem' }}>
              Stay at Riverbend Hideaway and have direct river access from your private land. Wake up to the Blanco River, explore trails from your doorstep, and enjoy a home base for all these adventures. Sleeps up to 12 — perfect for adventure groups.
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
              View Riverbend →
            </a>
          </section>

          <section style={{ paddingTop: '1.5rem', borderTop: '1px solid #dbeaed' }}>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              <strong>Beginner Tip:</strong> Start with floating the river and swimming at Spring Lake — no experience needed. Then venture to trails as you explore the area.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
