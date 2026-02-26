import { Link } from 'react-router-dom';
import Head from '../components/Head.jsx';

const RIVERBEND_URL = 'https://www.cohostr.com/listings/297530';

export default function GuideHillCountry() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Texas Hill Country Weekend Trip Guide from San Marcos',
    description: 'Day trips and weekend itineraries from San Marcos to Fredericksburg, Gruene, Wimberley, Blanco, and across the Texas Hill Country.',
    url: 'https://sm-tx.com/guides/hill-country-weekend'
  };

  return (
    <>
      <Head
        title="Texas Hill Country Weekend Trip Guide | SM-TX"
        description="Day trips from San Marcos: Fredericksburg wine country, Gruene Hall, Wimberley, Pedernales Falls, and the Devil's Backbone scenic drive."
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
              San Marcos is your launchpad into the Hill Country — wineries, historic dance halls, spring-fed parks, and some of the most scenic drives in Texas.
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>

          {/* ── Why San Marcos ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              📍 Why San Marcos is the Perfect Base
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1rem' }}>
              San Marcos sits at the eastern gateway of the Texas Hill Country, positioned almost perfectly between Austin (45 minutes north) and San Antonio (1 hour south) on I-35. From here, you can reach Wimberley in 20 minutes, Blanco in 30, Gruene in 20, Johnson City in 45, and Fredericksburg in about 1.5 hours. That puts virtually the entire Hill Country within day-trip range — wine trails, state parks, historic towns, and scenic drives — without having to fight Austin or San Antonio traffic getting there.
            </p>
            <p style={{ color: '#4b5563', lineHeight: 1.8 }}>
              Groups staying at Riverbend Hideaway on the Blanco River get an additional perk: you're already in the Hill Country the moment you step outside. The property sits on the Blanco River between San Marcos and Wimberley, making it a true nature retreat that's still close to everything.
            </p>
          </section>

          {/* ── Gruene ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🤠 Gruene Historic District — 20 Minutes
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              Gruene (pronounced "Green") is a German-Texan cotton town that time forgot — in the best possible way. Now part of New Braunfels, the historic district is listed on the National Register of Historic Places and draws visitors with its preserved 1880s architecture, the Guadalupe River, and one of Texas's most storied music venues. A half-day here is easy to fill.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Gruene Hall</strong> — Built in 1878, Gruene Hall is one of the oldest continuously operating dance halls in Texas. The wood-plank floors, roll-up canvas sides, and string lights haven't changed much in 150 years. Live music — country, Texas roots, and honky-tonk — plays nearly every weekend and many weeknights. Lyle Lovett, Robert Earl Keen, and Hal Ketchum have all taken this stage.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Gristmill River Restaurant</strong> — Located in a converted 1870s cotton gin overlooking the Guadalupe River, the Gristmill serves Texas comfort food (burgers, quail, chicken-fried steak) on multi-level decks above the water. Go for lunch or an early dinner before catching music at Gruene Hall.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Tubing the Guadalupe</strong> — Several outfitters in Gruene rent tubes for floats down the Guadalupe River, which runs broader and a bit calmer than the San Marcos. This stretch is popular with families; the current is mild and the scenery is beautiful. Plan 2–3 hours on the water.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Gruene General Store &amp; Antiques</strong> — The Gruene General Store has operated continuously since the 1870s and sells Texas-made gifts, local food products, and Hill Country souvenirs. The surrounding blocks have antique shops and galleries worth browsing on a slow afternoon.
              </li>
            </ul>
          </section>

          {/* ── Wimberley ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🌿 Wimberley — 20 Minutes
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              Tucked along Cypress Creek in the hills west of San Marcos, Wimberley is an artsy, eclectic small town with a thriving local food and arts scene, one of the best swimming holes in Texas, and a legendary monthly market. It's the closest Hill Country day trip from San Marcos and one of the most rewarding.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Blue Hole Regional Park</strong> — A stunning natural swimming hole on spring-fed Cypress Creek, shaded by towering bald cypress trees. The water is cold, clear, and a vivid blue-green — easily one of the most beautiful swimming spots in Texas. Entry is by reservation only during the summer peak season (May–August); book well in advance. Open dawn to dusk.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Wimberley Market Days</strong> — Held on the first Saturday of each month, March through December, this massive outdoor market draws 475+ vendors selling antiques, art, handmade goods, clothing, and food. It's one of the largest and most popular outdoor markets in Central Texas; arrive early for parking and the best selection.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Wimberley Square</strong> — The small but lively town square has independent restaurants, wine bars, boutique shops, and art galleries. It's a pleasant spot for lunch or a slow afternoon browse. Local favorites include healthy cafes, Texas wine bars, and shops selling hand-crafted jewelry and home goods.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Wimberley Glassworks</strong> — This working glass studio — accessible from both Wimberley and San Marcos — lets visitors watch live glassblowing demonstrations by skilled artisans using centuries-old techniques. The gallery displays and sells the finished pieces. A free, fascinating 20–30 minute stop.
              </li>
            </ul>
          </section>

          {/* ── Fredericksburg ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🍷 Fredericksburg &amp; Wine Country — 1.5 Hours
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              Fredericksburg is the undisputed capital of Texas wine country — and one of the most charming small towns in the state. Founded in 1846 by German immigrants, it retains its German heritage in the architecture, the food, and the festivals. More than 50 wineries now operate within a short drive of Main Street, making it the second-largest wine-producing region in the U.S. Plan a full day; there's more here than most people expect.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Texas Wine Trail (US-290 Corridor)</strong> — The most concentrated stretch of Texas wineries runs along US-290 between Fredericksburg and Johnson City. Becker Vineyards is one of the largest and most acclaimed (gorgeous grounds, reserve reds, full event calendar). Pedernales Cellars produces excellent Tempranillo. William Chris Vineyards in Hye focuses on 100% Texas-grown grapes. Tower of Pietra (Torre di Pietra) offers sweeping views. Most wineries are open daily with tasting fees of $15–25; no appointment needed at the major ones.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Main Street, Fredericksburg</strong> — The 10-block Main Street is lined with tasting rooms, German restaurants, specialty food shops, art galleries, and boutique hotels. Grab Fredericksburg peach ice cream, taste local olive oil, browse handmade quilts, or settle into a biergarten for a stein of cold beer and a pretzel. It's walkable and endlessly browsable.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>National Museum of the Pacific War</strong> — Fredericksburg is the birthplace of Fleet Admiral Chester Nimitz, and this nationally recognized museum tells the full story of the Pacific Theater of WWII. The complex spans multiple buildings and is considered one of the finest WWII museums in the country. Plan 2–3 hours minimum.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Enchanted Rock State Natural Area</strong> — Located 18 miles north of Fredericksburg, Enchanted Rock is one of Texas's most iconic landscapes: a massive pink granite dome rising 425 feet above the surrounding terrain, covering 640 acres. The main dome trail is about 1 mile and moderately strenuous. The park also has 8 miles of additional trails, camping, rock climbing, and extraordinary stargazing (it's in a dark sky zone). Entry requires timed reservations on weekends — book ahead.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Peach Season (May–August)</strong> — Gillespie County produces the best peaches in Texas, and summer in Fredericksburg means roadside stands piled high with fragrant, tree-ripened fruit. Visit orchards like Jenschke Orchards, Burg's Corner, or Marburger Orchard for pick-your-own options or fresh cobbler.
              </li>
            </ul>
          </section>

          {/* ── Blanco & Johnson City ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🌾 Blanco &amp; Johnson City — 30–45 Minutes
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              The small towns of Blanco and Johnson City sit at the heart of the Hill Country and are easy to combine into a single loop day trip from San Marcos. Both have grown significantly in recent years with excellent restaurants, local breweries, and artisan shops — yet neither has lost the quiet, unhurried character of a Hill Country town.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Blanco State Park</strong> — A compact but delightful Texas state park hugging a one-mile stretch of the spring-fed Blanco River. Swimming, canoeing, kayaking, fishing (largemouth bass, catfish, and rainbow trout stocked in winter), picnicking, and simple hiking are all on offer. The CCC-built pavilion and stone dams are beautiful, and the park stays cool even in summer. Perfect for a few hours of low-key outdoor time before or after a Fredericksburg wine visit.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Real Ale Brewing Company</strong> — Blanco is home to one of Texas's most respected craft breweries. The taproom is laid-back, the beers are excellent (try the Firemans #4 or Devil's Backbone amber), and the brewery grounds have a great outdoor vibe. Tours available on weekends.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>LBJ National Historical Park (Johnson City)</strong> — Johnson City was Lyndon B. Johnson's hometown, and the National Park Service maintains his boyhood home and a visitor center telling the story of his early years. Combined with the LBJ Ranch (the "Texas White House") 14 miles west near Stonewall, it's a full, rich history day. Entry is free.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Pedernales Falls State Park</strong> — Located 10 miles east of Johnson City (about 50 minutes from San Marcos), Pedernales Falls is one of the crown jewels of the Texas state park system. The Pedernales River flows over wide, layered limestone shelves creating a series of falls and pools. Hike the 9-mile Wolf Mountain Trail for panoramic Hill Country views, swim in the river (when flow levels are safe), or simply sit on the limestone and watch the water. The park covers 5,212 acres with 19.8 miles of hiking and mountain biking trails. Note: the river is prone to flash flooding; always check current conditions before swimming.
              </li>
            </ul>
          </section>

          {/* ── Scenic Drives ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🚗 Scenic Drives
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              Some of the best Hill Country experiences happen through the windshield. These routes are worth driving even without a specific destination — just windows down and miles of Texas passing by.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Ranch Road 12 (San Marcos to Wimberley to Blanco)</strong> — The most accessible scenic drive from San Marcos. RR 12 winds northwest from downtown through rolling limestone hills, creek crossings, and old ranches. The stretch between Wimberley and Blanco is particularly dramatic, crossing canyon rims with sweeping views. Best in spring when roadsides are blanketed in bluebonnets and Indian paintbrush.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>FM 32 — The Devil's Backbone</strong> — Widely considered one of the most scenic roads in all of Texas. FM 32 follows a sharp limestone ridge between Wimberley and Blanco, with the road running right along the spine of the hills and dropping away sharply on both sides. The views stretch for miles in every direction. Take it slowly; there are pullouts worth stopping at. Connects naturally to a Wimberley-Blanco-Pedernales Falls loop.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>US-290 Wine Road (Dripping Springs to Fredericksburg)</strong> — The corridor highway of Texas wine country. US-290 heading west from Austin through Dripping Springs and Johnson City to Fredericksburg is flanked by vineyards, lavender farms, distilleries, and roadside peach stands. It's best explored as a there-and-back rather than a loop, since there's too much to see to rush through.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>The Blanco River Road Loop</strong> — A less-traveled favorite: drive south from Blanco on US-281, following the Blanco River through small ranches and river crossings toward San Marcos. This route passes through prime Hill Country terrain — deer everywhere at dawn and dusk — with the river visible from the road at several points.
              </li>
            </ul>
          </section>

          {/* ── Seasonal Highlights ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#042f2e', marginBottom: '0.75rem' }}>
              🗓️ Seasonal Highlights
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              The Hill Country has something to offer every season, but the experience shifts significantly throughout the year. Here's what to expect — and plan around.
            </p>
            <ul style={{ color: '#4b5563', lineHeight: 1.9, paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Spring (March–May)</strong> — Peak wildflower season is the Hill Country's showpiece. Bluebonnets typically peak in late March through mid-April, blanketing roadsides, fields, and hillsides in vivid color. Indian paintbrush, evening primrose, and winecups follow through May. This is the most popular time to visit — book accommodations months in advance for spring weekends, especially Easter. Also the best time for river paddling before summer heat sets in.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Summer (June–August)</strong> — Hot, but that's what the rivers are for. Tubing season hits its peak on the San Marcos and Guadalupe; swimming holes are packed on weekends. Fredericksburg's peach season runs through August — farm stands and orchards are in full swing. Outdoor concerts and live music events are everywhere. Enchanted Rock and longer hikes are best done at dawn before temperatures climb.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Fall (September–November)</strong> — The Hill Country's second-best season. Temperatures cool to comfortable hiking and wine-tasting weather by October. Fall harvest festivals dot the calendar in Fredericksburg and Gruene. Lost Maples State Natural Area (about 1.5 hours west of San Marcos) puts on one of Texas's only authentic fall foliage displays in late October and early November, drawing significant crowds — reservations required. This is the best time to visit Pedernales Falls and Enchanted Rock.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Winter (December–February)</strong> — The quietest and most underrated season. Fredericksburg's Kristkindl Markt (Christmas market) and holiday light displays on Main Street are genuinely magical. Wineries are less crowded and often have special barrel tastings and events. Blanco State Park stocks rainbow trout in the river for winter fishing. Restaurants that are impossible to get into during peak season suddenly have availability.
              </li>
            </ul>
          </section>

          {/* ── Itinerary ── */}
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
              lineHeight: 1.9
            }}>
              <p><strong>Day 1 — San Marcos</strong></p>
              <p style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>Morning glass-bottom boat tour at The Meadows Center → Float the San Marcos River from City Park → Lunch on the downtown square → Explore the Premium Outlets → Catch live music at Cheatham Street Warehouse</p>

              <p><strong>Day 2 — Wimberley &amp; Devil's Backbone</strong></p>
              <p style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>Morning swim at Blue Hole (reserve in advance) → Browse Wimberley Square for lunch and shopping → Drive the Devil's Backbone (FM 32) to Blanco → Afternoon at Blanco State Park → Dinner and Real Ale tasting in Blanco → Return via US-281</p>

              <p><strong>Day 3 — Fredericksburg Wine Country</strong></p>
              <p style={{ marginLeft: '1rem' }}>Leave San Marcos by 9am → Stop at Pedernales Falls State Park for a morning hike → Continue to Fredericksburg → Tasting at Becker Vineyards and William Chris Vineyards → Lunch on Main Street → Browse shops and galleries → Return via US-290 through Dripping Springs</p>
            </div>
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
              🏡 Your Hill Country Home Base
            </h3>
            <p style={{ color: '#134e4a', lineHeight: 1.7, marginBottom: '1rem' }}>
              Skip the hotel and make it a proper Hill Country getaway. Riverbend Hideaway is a spacious Blanco River farmhouse situated between San Marcos and Wimberley — private, peaceful, and close to everything on this list. The property sleeps up to 12, has direct river access, and is the kind of place where the group ends up staying up late on the porch long after the day trips are done. It's how Hill Country weekends are supposed to go.
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
              <strong>Booking Tip:</strong> Spring wildflower weekends and fall foliage at Lost Maples fill up months in advance across the entire Hill Country. If your dates fall in March–April or October–November, book accommodations, winery reservations, and Enchanted Rock timed entries as early as possible.
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.75rem' }}>
              <strong>While you're in San Marcos:</strong> Check out our <Link to="/guides/outdoor-activities" style={{ color: '#0e8c8c' }}>Outdoor Activities guide</Link> and <Link to="/guides/things-to-do" style={{ color: '#0e8c8c' }}>Things to Do guide</Link> for the best of what's right in town.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
