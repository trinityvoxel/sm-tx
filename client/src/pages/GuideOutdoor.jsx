import { Link } from 'react-router-dom';
import Head from '../components/Head.jsx';

const RIVERBEND_URL = 'https://www.cohostr.com/listings/297530';

export default function GuideOutdoor() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Outdoor Activities & Adventures in San Marcos, TX',
    description: 'Hiking, kayaking, tubing, swimming, fishing, biking, and wildlife in and around San Marcos, Texas.',
    url: 'https://sm-tx.com/guides/outdoor-activities'
  };

  return (
    <>
      <Head
        title="Outdoor Activities & Adventures in San Marcos, TX | SM-TX"
        description="Tubing, swimming, hiking Purgatory Creek, kayaking Rio Vista, fishing, and birding — the complete outdoor guide for San Marcos, TX."
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
              Outdoor Adventures in<br /><span style={{ color: '#5eead4' }}>San Marcos</span>
            </h1>
            <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '1rem' }}>
              Spring-fed rivers, wooded creek trails, and over 2,100 acres of city greenspace — all right in town.
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>

          {/* ── Tubing ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🚣 Tubing &amp; Floating the San Marcos River
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              The San Marcos River is one of the finest tubing rivers in Texas — spring-fed, crystal-clear, and a constant 72°F year-round. Unlike the Guadalupe, the San Marcos flows right through the center of town, making it easy to start and end downtown. The river is generally shallow (2–6 feet deep) with a mild current, making it accessible for all ages.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>City Park Launch</strong> — The main put-in for tubers, located just off the downtown square. Tube rental outfitters operate nearby and offer shuttle service back to your starting point. This is the busiest access point, especially on warm weekends.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>City Park to Sewell Park Float</strong> — The shorter, family-friendly float. This stretch runs through a cypress-lined section of the river past the Texas State University campus, taking about 45 minutes to an hour. It's gentle, scenic, and a great intro for kids or first-time floaters.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Extended Float to Martindale</strong> — For a longer adventure, start at Don's Fish Camp or Texas State Tubes and float downstream to Martindale, a rural community about 7 miles away. This takes 3–4 hours and gives you a genuine Hill Country river experience with less crowd. Shuttle pickups available through local outfitters.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Best Season:</strong> Year-round floats are possible thanks to the 72°F water, but summer weekends are the busiest and most festive. Fall and spring offer the same great water with lighter crowds and cooler air temps.
              </li>
            </ul>
          </section>

          {/* ── Swimming ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🏊 Swimming &amp; Spring-Fed Water
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              Spring-fed swimming in the middle of a Texas city is a rare luxury — San Marcos has it. The water is consistently clean and cool, with multiple designated swimming areas within easy reach of downtown.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Sewell Park (Texas State Campus)</strong> — The most popular free swimming spot in San Marcos, located on the Texas State University campus right on the river. The banks are grassy and shaded by old cypress trees, the river is clear and cool, and there's no admission fee. Open to the public, not just students.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Rio Vista Park</strong> — Downstream from downtown, Rio Vista Park offers river access with rocky banks and deeper pools below the rapids. This is where locals swim and wade on hot afternoons — more rugged than Sewell Park, but the flowing water from the rapids makes it feel like a natural waterpark.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>City Park River Access</strong> — City Park provides easy, central access to the river for swimming and wading. It's shaded, family-friendly, and a convenient choice if you're already downtown.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Note on Spring Lake:</strong> Spring Lake at The Meadows Center is a protected habitat for several endangered species (including the Texas blind salamander and fountain darter) and is not open for general swimming. The lake is best experienced via the glass-bottom boat tours offered at the center.
              </li>
            </ul>
          </section>

          {/* ── Hiking ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🥾 Hiking &amp; Trail Walking
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              San Marcos has over 2,100 acres of city greenspace and an extensive urban trail system — a surprisingly large network for a city its size. Trails range from flat, paved riverside paths to rocky creek crossings through native juniper and oak woodlands. Most trailheads are within a 10-minute drive of downtown.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Purgatory Creek Natural Area</strong> — The crown jewel of San Marcos's trail system. This large natural area in the northwest part of the city features several interconnected loop trails through creek-cut limestone terrain, oak groves, and open meadows. The Purgatory Creek Trail, Bear Creek Trail, and connecting paths give you 5+ miles of options at a moderate difficulty level. Expect some creek crossings; wear shoes you don't mind getting wet. Best in cooler months (October–April) when the trails are less overgrown and wildlife is more active.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>San Marcos River Trail (Paved Greenway)</strong> — A flat, paved trail that follows the San Marcos River through the heart of the city, connecting City Park, Sewell Park, and Rio Vista Park. It's ideal for casual walkers, joggers, and families with strollers. The trail is ADA accessible for much of its length and offers plenty of river overlooks, benches, and shade.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Schulle Canyon Wildlife Corridor</strong> — A quieter, less-visited natural area on the city's west side with limestone canyon terrain and native plant communities. This is a good choice when Purgatory Creek is crowded, offering similar Hill Country scenery with more solitude.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Spring Lake &amp; Meadows Center Overlook Paths</strong> — Short, easy walks around Spring Lake give you sweeping views of the headwaters of the San Marcos River, native aquatic vegetation, and frequent wildlife sightings including ducks, herons, and the occasional white-tailed deer. Access is through the Meadows Center grounds.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>ADA Access:</strong> The first half-mile to full mile of most San Marcos natural area trails is ADA accessible, making these parks genuinely inclusive for visitors of varying mobility levels.
              </li>
            </ul>
          </section>

          {/* ── Kayaking & Paddling ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🛶 Kayaking &amp; Paddleboarding
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              For those who want more control than a tube, kayaking and stand-up paddleboarding are excellent options on the San Marcos River. The water is clear enough to see the bottom in most sections, and the river's consistent flow makes it beginner-friendly while still offering some challenge near the rapids.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Rio Vista Park Rapids</strong> — Three engineered rapids replaced the old Rio Vista Dam, creating whitewater features that draw kayakers and SUP riders looking for a workout. The rapids are class I–II, making them accessible for intermediate paddlers. In fall and winter, competitive kayakers use this stretch for training — U.S. Olympic kayak hopefuls have trained here.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Flatwater Paddle Downstream</strong> — Put in at City Park and paddle at a leisurely pace through cypress-lined channels, spotting turtles sunning on logs and great blue herons fishing from the banks. Several local outfitters rent kayaks and canoes by the hour.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Texas Water Safari Route</strong> — Every June since 1963, the Texas Water Safari — billed as the World's Toughest Boat Race — starts right here in San Marcos and runs 260 miles to Seadrift on the Gulf Coast. Even if you're not racing, putting in at Aquarena Springs and paddling the first few miles of the race route is an epic experience.
              </li>
            </ul>
          </section>

          {/* ── Fishing ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🎣 Fishing
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              The San Marcos River supports a healthy, year-round fishery thanks to its consistent temperature and spring-fed clarity. Several species are present throughout the river, and access is easy from multiple public points. A Texas fishing license is required for anglers 17 and older.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Target Species</strong> — Guadalupe bass (the Texas state fish, native to the Edwards Plateau river systems), largemouth bass, channel catfish, and sunfish. The spring-fed water keeps the river productive even in summer when many Texas rivers slow down.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Best Access Points</strong> — City Park, Rio Vista Park, and the sections of the river downstream from Sewell Park all offer accessible fishing spots. Wading anglers typically have the best luck in the shallower riffles, while bank anglers do well near deeper pools.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Technique Tips</strong> — Light spinning tackle or fly fishing gear works best in the clear water; the fish can be line-shy in the gin-clear sections near the springs. Early mornings and evenings produce the most action, especially for bass.
              </li>
            </ul>
          </section>

          {/* ── Biking ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🚴 Biking
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              San Marcos has invested in bike infrastructure, and the combination of paved greenways, natural trails, and low-traffic neighborhoods makes it a solid cycling city. Options range from easy paved paths to technical single-track.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>River Trail Greenway</strong> — The paved trail along the San Marcos River connects several parks and is the most popular cycling route in the city. Flat, scenic, and traffic-free for most of its length — a good choice for families or casual riders.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Purgatory Creek Natural Area (MTB)</strong> — The natural surface trails at Purgatory Creek are rideable on a mountain bike, with rocky limestone sections, creek crossings, and elevation changes that give experienced riders a real workout. The terrain is typical Texas Hill Country — technical in spots but not extreme.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Neighborhood &amp; Campus Rides</strong> — The Texas State campus and surrounding neighborhoods are bike-friendly with marked lanes and low traffic. A loop from downtown through campus, along the river, and back through historic neighborhoods covers 5–8 miles with minimal elevation.
              </li>
            </ul>
          </section>

          {/* ── Wildlife & Nature ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              📸 Wildlife &amp; Nature Watching
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              The spring-fed ecosystem of San Marcos supports remarkable biodiversity for an urban environment. The city sits along a migratory bird corridor, and the rivers attract a wide range of water-dependent wildlife. Early morning and dusk are the best times to observe.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Endangered Species Viewing</strong> — Spring Lake is home to several endangered species found nowhere else on Earth: the Texas blind salamander, San Marcos salamander, and fountain darter. While you can't swim with them, the glass-bottom boat tours at The Meadows Center offer clear views of these remarkable creatures in their native habitat.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Birding</strong> — Over 2,100 acres of city greenspace and two spring-fed river systems make San Marcos a productive birding destination. The Purgatory Creek Natural Area, Spring Lake shoreline, and the river corridor regularly host great blue herons, green herons, belted kingfishers, painted buntings (spring/summer), black-bellied whistling ducks, and many migratory species.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>River Wildlife</strong> — From any of the public river access points, you're likely to spot red-eared sliders sunning on rocks, river otters in quieter sections, white-tailed deer drinking at dusk, and the occasional fox or raccoon. The clarity of the water lets you watch fish — including the striking Guadalupe bass — swimming in their natural environment.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Wildflower Season (March–May)</strong> — The roadsides and natural areas around San Marcos come alive with bluebonnets, Indian paintbrush, evening primrose, and winecups in spring. The river corridor is particularly colorful, and many trails pass through native wildflower meadows during peak bloom.
              </li>
            </ul>
          </section>

          {/* ── Riverbend CTA ── */}
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
              Riverbend Hideaway is a large Blanco River farmhouse just 15 minutes from downtown San Marcos — the ideal base for outdoor groups. Wake up with private river access for morning fishing or a cool dip, then head out to Purgatory Creek, Rio Vista, or the outlets for the rest of the day. It sleeps up to 12, making it perfect for families or adventure crews who want room to spread out.
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
              <strong>First Timer's Tip:</strong> Start with a tube float and swim at Sewell Park — no gear, no experience, and no cost (just bring a tube). Then explore Purgatory Creek the next morning when it's cooler. That one-two combination covers the best of what San Marcos outdoors has to offer.
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.75rem' }}>
              <strong>Ready for more?</strong> Check out our <Link to="/guides/hill-country-weekend" style={{ color: '#0e8c8c' }}>Hill Country Weekend guide</Link> for day trips to Pedernales Falls, Enchanted Rock, and beyond.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
