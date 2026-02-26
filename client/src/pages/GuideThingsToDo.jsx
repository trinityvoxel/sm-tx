import { Link } from 'react-router-dom';
import Head from '../components/Head.jsx';

const RIVERBEND_URL = 'https://www.cohostr.com/listings/297530';

export default function GuideThingsToDo() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Best Things to Do in San Marcos, TX',
    description: 'Discover the top activities and attractions in San Marcos including river activities, shopping, museums, and live music.',
    url: 'https://sm-tx.com/guides/things-to-do',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Float the San Marcos River' },
        { '@type': 'ListItem', position: 2, name: 'Glass-Bottom Boat Tour at The Meadows Center' },
        { '@type': 'ListItem', position: 3, name: 'San Marcos Premium Outlets & Tanger Outlets' },
        { '@type': 'ListItem', position: 4, name: 'Cheatham Street Warehouse Live Music' },
        { '@type': 'ListItem', position: 5, name: 'LBJ Museum of San Marcos' },
        { '@type': 'ListItem', position: 6, name: 'Texas State University Campus' }
      ]
    }
  };

  return (
    <>
      <Head
        title="Best Things to Do in San Marcos, TX | SM-TX"
        description="Top activities in San Marcos: floating the river, outlet shopping, Cheatham Street Warehouse, The Meadows Center, and more. Your complete guide."
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
              River adventures, world-class outlet shopping, legendary live music, and deep Texas history — all within minutes of each other.
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>

          {/* ── River Activities ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🏞️ River Activities
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              The San Marcos River is the heart of the city. Fed by more than 200 artesian springs from the Edwards Aquifer, the water holds a constant 72°F year-round — making it just as refreshing in January as it is in July. The river runs right through downtown, giving you swimming, tubing, kayaking, and wildlife viewing all within a short walk of shops and restaurants.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Tubing the San Marcos River</strong> — The quintessential San Marcos experience. Tube rentals are available at City Park, just blocks from downtown, and shuttle services return you upstream when you're done. The most popular float runs from City Park through Sewell Park and beyond — plan 2–3 hours for a full trip. Busy spring and summer weekends can draw big crowds; weekday floats are noticeably more relaxed.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Rio Vista Park &amp; The Falls</strong> — This centrally-located park is where the river picks up energy, running over a series of three rapids that replaced the old Rio Vista Dam. Kayakers and SUP riders come here for the challenge; spectators watch from the banks. U.S. Olympic kayak hopefuls have used these rapids for training, and the park hosts local events throughout the year.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Glass-Bottom Boat Tours at The Meadows Center</strong> — Board a flat-bottomed glass boat on Spring Lake — one of the world's largest aquifer-fed spring systems — and peer down into crystal-clear water teeming with endangered species: the Texas blind salamander, fountain darter, and native Texas wild rice. Tours run year-round and last about 30 minutes; book in advance as spots fill quickly on weekends.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Kayaking &amp; Stand-Up Paddleboarding</strong> — Rent a kayak or SUP board to explore quieter stretches of the river at your own pace. The sections downstream from City Park offer calm water shaded by cypress trees, and paddling is an excellent way to spot turtles, herons, and other wildlife up close.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Swimming at Sewell Park</strong> — Located on the Texas State University campus, Sewell Park offers free public access to the river with grassy banks, shallow swimming areas, and river access. It's a favorite for students and locals, and open to all visitors.
              </li>
            </ul>
          </section>

          {/* ── Shopping ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🛍️ Outlet Shopping &amp; Downtown
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              San Marcos is one of the top shopping destinations in Texas, drawing visitors from across the state for its massive outlet complex and a charming downtown square with independent boutiques and local flavor.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>San Marcos Premium Outlets</strong> — With over 220 stores and 1.2 million square feet of shopping, this is one of the largest outlet centers in the country. It's the only Texas location for luxury brands including Gucci, Valentino, Saint Laurent, Dolce &amp; Gabbana, Salvatore Ferragamo, Moncler, and MCM — alongside Nike, Williams-Sonoma, West Elm, and dozens more. Discounts regularly reach 30–65% off retail.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Tanger Outlets</strong> — Adjacent to the Premium Outlets, Tanger adds another sprawling complex with additional brands, restaurants, and an outdoor shopping environment. Most visitors hit both on the same trip; plan a half-day minimum to do it justice.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Downtown San Marcos Square</strong> — A completely different vibe from the outlets. The historic courthouse square is lined with independent boutiques, vintage shops, wine bars, coffee houses, and locally-owned restaurants. It's walkable, lively, and the best place to spend an evening after a day on the river.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Wimberley Glassworks</strong> — Located on the edge of town, this working glass studio lets visitors watch artisans demonstrate centuries-old glassblowing techniques and browse a gallery of handcrafted pieces. It makes for a one-of-a-kind gift and a genuinely fascinating 30-minute stop.
              </li>
            </ul>
          </section>

          {/* ── Culture & History ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🎓 Culture &amp; History
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              San Marcos is one of the oldest continuously inhabited places in North America — archaeological evidence along the river dates human presence back over 10,000 years. Texas State University (enrollment 38,000+) brings constant cultural energy: galleries, performances, and public events run year-round.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>The Meadows Center for Water and the Environment</strong> — More than just boat tours, this Texas State University research center at Spring Lake offers snorkeling programs, educational exhibits, and a Discovery Center where you can see native fish and aquatic life up close. The site has been a state antiquities landmark and is believed to be one of the longest continuously inhabited locations in North America.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>LBJ Museum of San Marcos</strong> — A personal, well-curated look at Lyndon Baines Johnson's formative years as a student at what is now Texas State University in the 1920s. The museum traces LBJ's path from a scrappy Hill Country kid to the 36th President of the United States, with photographs, personal artifacts, and local context you won't find at his larger presidential library in Austin.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Commemorative Air Force Exhibit</strong> — Housed in an authentic 1943 vintage wooden hangar, this exhibit puts you up close with rare, fully operational WWII aircraft — including planes used in the filming of <em>Tora! Tora! Tora!</em> It's a surprisingly immersive experience and a must for aviation and history enthusiasts.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Veramendi Plaza &amp; Historic Districts</strong> — A stroll through the Residential Historic Districts and heritage sites at Veramendi Plaza gives a sense of San Marcos' layered past, from Spanish colonial settlement through the Republic of Texas era. Interpretive markers throughout the district tell the stories of the city's earliest inhabitants.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Texas State University Campus &amp; Art Park</strong> — Walk the beautiful hilltop TXST campus, home to the iconic Old Main building with views over the city. Art Park, a rotating outdoor sculpture installation along the river, is free to visit and showcases regional artists. Downtown galleries and TXST's Performing Arts Center host frequent public events.
              </li>
            </ul>
          </section>

          {/* ── Live Music & Nightlife ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🎵 Live Music &amp; Nightlife
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              San Marcos punches well above its weight for live music. A college town with deep Texas roots, it has produced some of the biggest names in country and blues — and the venues where they got their start are still open and still booking great acts.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Cheatham Street Warehouse</strong> — This is the one. Built in 1910 as a railroad grocery warehouse and converted into a honky-tonk in 1974, Cheatham Street is a Texas legend. George Strait played his first public shows here in 1975 with the Ace in the Hole Band; Stevie Ray Vaughan took the stage nearly every Tuesday night in the early 1980s. Willie Nelson, Townes Van Zandt, and Jerry Jeff Walker have all performed here. Today it still hosts live music multiple nights a week, with a focus on Texas country, singer-songwriter, and roots acts.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>The Marc</strong> — A versatile downtown venue hosting everything from indie rock to electronic to local bands, with a full bar and room to dance. It's the pulse of the contemporary San Marcos music scene and draws both students and locals.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Craft Breweries</strong> — San Marcos has four local breweries serving as casual evening destinations. Grab a pint, play a game of horseshoes, and catch weekend live music in a relaxed setting. The craft beer scene here is unpretentious and genuinely good.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Downtown Bars &amp; Rooftop Spots</strong> — The downtown square has everything from rooftop decks with Hill Country views to quiet courtyard margarita bars. On warm evenings, the outdoor bar scene along the square comes alive with fire performers, street musicians, and a crowd that's equal parts students, locals, and weekend visitors.
              </li>
            </ul>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginTop: '1rem' }}>
              Check <Link to="/" style={{ color: '#0e8c8c', fontWeight: 600 }}>SM-TX Events</Link> for what's happening tonight — live music is scheduled somewhere in San Marcos nearly every day of the week.
            </p>
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
              🏡 Make It a Long Weekend
            </h3>
            <p style={{ color: '#134e4a', lineHeight: 1.7, marginBottom: '1rem' }}>
              There's more here than you can do in a day. Riverbend Hideaway is a spacious Blanco River farmhouse just 15 minutes from downtown San Marcos — big enough for the whole group (sleeps up to 12), with private river access to start your mornings right. Float the San Marcos, shop the outlets, catch Cheatham Street at night, and wake up to the sound of the river.
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
              <strong>Tip:</strong> Most of San Marcos is walkable or a short drive. Park downtown near the square, float the river, grab lunch at a local spot, shop the outlets in the afternoon, and end the night at Cheatham Street — you can fit a lot into one day here.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
