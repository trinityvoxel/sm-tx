const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = 18793;
const API_KEY = 'smtx-internal-2026';

app.use(cors());
app.use(express.json());

// Serve static frontend
const distPath = path.join(__dirname, 'client/dist');
app.use(express.static(distPath));

// API key middleware
function requireKey(req, res, next) {
  const key = req.headers['x-sm-tx-key'];
  if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// --- Seed data ---
function seedIfEmpty() {
  if (db.data.events.length > 0) return;
  const now = new Date();
  const d = (offsetDays) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + offsetDays);
    return dt.toISOString().split('T')[0];
  };
  db.data.events = [
    {
      id: uuidv4(),
      name: 'Cypress Creek Sessions — Live at The Marc',
      date_start: d(3),
      date_end: null,
      time: '8:00 PM',
      venue_name: 'The Marc',
      venue_address: '120 E Hopkins St, San Marcos, TX 78666',
      category: 'music',
      description: 'An intimate evening of Texas singer-songwriter music on the banks of Cypress Creek. Local and regional artists take the stage at one of San Marcos\'s most beloved venues.',
      url: 'https://themarc.com',
      cost: '$10 cover',
      kid_friendly: false,
      pet_friendly: false,
      age_21_plus: true,
      status: 'approved',
      submitter_name: 'Admin',
      submitter_email: 'admin@sm-tx.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'San Marcos Farmers Market',
      date_start: d(5),
      date_end: null,
      time: '9:00 AM – 1:00 PM',
      venue_name: 'Hays County Courthouse Square',
      venue_address: '111 E San Antonio St, San Marcos, TX 78666',
      category: 'markets',
      description: 'Fresh local produce, artisan goods, live music, and family fun every Saturday morning in the heart of downtown San Marcos. Over 60 local vendors.',
      url: 'https://sanmarcostx.gov/farmers-market',
      cost: 'Free admission',
      kid_friendly: true,
      pet_friendly: true,
      age_21_plus: false,
      status: 'approved',
      submitter_name: 'Admin',
      submitter_email: 'admin@sm-tx.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'TXST Bobcats Baseball vs. UT Arlington',
      date_start: d(7),
      date_end: null,
      time: '6:30 PM',
      venue_name: 'Bobcat Ballpark',
      venue_address: '1 Bobcat Way, San Marcos, TX 78666',
      category: 'sports',
      description: 'Texas State Bobcats take on UT Arlington in a Sun Belt Conference showdown. Come cheer on the home team at historic Bobcat Ballpark!',
      url: 'https://txstatebobcats.com',
      cost: '$8 general / $5 students',
      kid_friendly: true,
      pet_friendly: false,
      age_21_plus: false,
      status: 'approved',
      submitter_name: 'Admin',
      submitter_email: 'admin@sm-tx.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'San Marcos River Art Festival',
      date_start: d(10),
      date_end: d(11),
      time: '10:00 AM – 6:00 PM',
      venue_name: 'City Park',
      venue_address: '401 W Hutchison St, San Marcos, TX 78666',
      category: 'arts',
      description: 'Two days of art, music, and culture along the beautiful San Marcos River. Featuring over 80 juried artists, live performances, food vendors, and hands-on workshops for all ages.',
      url: null,
      cost: 'Free',
      kid_friendly: true,
      pet_friendly: true,
      age_21_plus: false,
      status: 'approved',
      submitter_name: 'Admin',
      submitter_email: 'admin@sm-tx.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Drink Local Craft Beer Festival',
      date_start: d(14),
      date_end: null,
      time: '2:00 PM – 8:00 PM',
      venue_name: 'Centennial Park',
      venue_address: '401 W MLK Dr, San Marcos, TX 78666',
      category: 'food',
      description: 'Celebrate the best craft beers from Central Texas breweries. Sample over 50 beers, enjoy live music, and feast on food truck bites from local vendors. 21+ event.',
      url: null,
      cost: '$25 general / $40 VIP',
      kid_friendly: false,
      pet_friendly: false,
      age_21_plus: true,
      status: 'approved',
      submitter_name: 'Admin',
      submitter_email: 'admin@sm-tx.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  db.save();
  console.log('Seeded 5 sample events.');
}

seedIfEmpty();

// --- Helpers ---
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// --- Routes ---

// GET /api/events
app.get('/api/events', (req, res) => {
  let events = db.data.events.filter(e => e.status === 'approved');

  const { date, date_from, date_to, category, upcoming } = req.query;

  if (upcoming === 'true') {
    const now = new Date();
    const future = addDays(now, 30);
    events = events.filter(e => {
      const start = new Date(e.date_start);
      return start >= now && start <= future;
    });
  }

  if (date) {
    events = events.filter(e => e.date_start === date || (e.date_end && e.date_end >= date && e.date_start <= date));
  }

  if (date_from && date_to) {
    events = events.filter(e => {
      const start = new Date(e.date_start);
      const end = e.date_end ? new Date(e.date_end) : start;
      const from = new Date(date_from);
      const to = new Date(date_to);
      return start <= to && end >= from;
    });
  }

  if (category && category !== 'all') {
    events = events.filter(e => e.category === category);
  }

  events.sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
  res.json(events);
});

// GET /api/events/upcoming
app.get('/api/events/upcoming', (req, res) => {
  const now = new Date();
  const future = addDays(now, 30);
  const events = db.data.events
    .filter(e => e.status === 'approved')
    .filter(e => {
      const start = new Date(e.date_start);
      return start >= now && start <= future;
    })
    .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
  res.json(events);
});

// GET /api/events/pending
app.get('/api/events/pending', requireKey, (req, res) => {
  const events = db.data.events
    .filter(e => e.status === 'pending')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(events);
});

// GET /api/events/:id
app.get('/api/events/:id', (req, res) => {
  const event = db.data.events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// POST /api/events/submit
app.post('/api/events/submit', (req, res) => {
  const required = ['name', 'date_start', 'venue_name', 'venue_address', 'category', 'submitter_name', 'submitter_email'];
  const missing = required.filter(f => !req.body[f]);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  const valid_categories = ['music','food','outdoor','arts','sports','markets','festivals','community','nightlife','other'];
  if (!valid_categories.includes(req.body.category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  const event = {
    id: uuidv4(),
    name: req.body.name,
    date_start: req.body.date_start,
    date_end: req.body.date_end || null,
    time: req.body.time || null,
    venue_name: req.body.venue_name,
    venue_address: req.body.venue_address,
    category: req.body.category,
    description: req.body.description || null,
    url: req.body.url || null,
    cost: req.body.cost || null,
    kid_friendly: !!req.body.kid_friendly,
    pet_friendly: !!req.body.pet_friendly,
    age_21_plus: !!req.body.age_21_plus,
    status: 'pending',
    submitter_name: req.body.submitter_name,
    submitter_email: req.body.submitter_email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.data.events.push(event);
  db.save();
  res.status(201).json({ success: true, id: event.id, message: 'Event submitted for review! We\'ll review it within 24 hours.' });
});

// PATCH /api/events/:id
app.patch('/api/events/:id', requireKey, (req, res) => {
  const idx = db.data.events.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Event not found' });

  const allowed = ['name','date_start','date_end','time','venue_name','venue_address','category','description','url','cost','kid_friendly','pet_friendly','age_21_plus','status'];
  allowed.forEach(f => {
    if (f in req.body) db.data.events[idx][f] = req.body[f];
  });
  db.data.events[idx].updated_at = new Date().toISOString();
  db.save();
  res.json(db.data.events[idx]);
});

// DELETE /api/events/:id
app.delete('/api/events/:id', requireKey, (req, res) => {
  const idx = db.data.events.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Event not found' });
  db.data.events.splice(idx, 1);
  db.save();
  res.json({ success: true });
});

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('<h1>SM-TX Events Hub</h1><p>Frontend not built yet. Run npm run build in /client.</p>');
  }
});

app.listen(PORT, () => {
  console.log(`SM-TX Events Hub server running on port ${PORT}`);
});
