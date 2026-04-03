/**
 * Cloudflare Pages Function — GET /api/event-card
 * Generates a branded 1200×630 SVG poster card for events without scraped images.
 * Query params: title, date, venue, category
 * Returns: image/svg+xml
 */

const CATEGORY_MAP = {
  music:     { color: '#8b5cf6', emoji: '🎵', label: 'Music' },
  arts:      { color: '#ec4899', emoji: '🎨', label: 'Arts' },
  sports:    { color: '#3b82f6', emoji: '🏆', label: 'Sports' },
  markets:   { color: '#f97316', emoji: '🛒', label: 'Markets' },
  festivals: { color: '#ef4444', emoji: '🎉', label: 'Festivals' },
  community: { color: '#0e8c8c', emoji: '🤝', label: 'Community' },
  nightlife: { color: '#6366f1', emoji: '🌙', label: 'Nightlife' },
  other:     { color: '#6b7280', emoji: '📍', label: 'Other' },
  outdoor:   { color: '#10b981', emoji: '🌿', label: 'Outdoor' },
};

const FALLBACK = CATEGORY_MAP.other;

/**
 * Decode common HTML entities (e.g. &#38; → &, &amp; → &, &quot; → ")
 * so they display correctly in the SVG text.
 */
function decodeHtmlEntities(str) {
  if (!str) return '';
  return String(str)
    // Named entities
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    // Decimal numeric entities (e.g. &#38;)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    // Hex numeric entities (e.g. &#x26;)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Sanitize a string: decode HTML entities first, then strip HTML/script tags
 * and XML-escape for safe SVG embedding.
 */
function sanitize(str) {
  if (!str) return '';
  return decodeHtmlEntities(String(str))
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/[&<>"']/g, (c) => ({     // XML-escape remaining special chars
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]))
    .trim()
    .substring(0, 200);                // max length guard
}

/**
 * Word-wrap text to lines of ~maxChars characters, breaking on word boundaries.
 * Returns an array of line strings.
 */
function wordWrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + ' ' + word).length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  // Enforce max 3 lines, truncate last with ellipsis if needed
  if (lines.length > 3) {
    lines.splice(3);
    lines[2] = lines[2].substring(0, maxChars - 1) + '…';
  }

  return lines;
}

/**
 * Hex color to a slightly lighter/darker variant for gradient.
 * Returns same color with adjusted alpha for a second stop.
 */
function accentGradientStop(hexColor) {
  return hexColor + '33'; // 20% opacity variant
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const params = url.searchParams;

    const rawTitle    = params.get('title')    || 'Untitled Event';
    const rawDate     = params.get('date')     || '';
    const rawVenue    = params.get('venue')    || 'San Marcos, TX';
    const rawCategory = params.get('category') || 'other';

    const title    = sanitize(rawTitle);
    const date     = sanitize(rawDate);
    const venue    = sanitize(rawVenue);
    const category = sanitize(rawCategory).toLowerCase();

    const cat = CATEGORY_MAP[category] || FALLBACK;
    const { color, emoji, label } = cat;

    // Word-wrap title into up to 3 lines, ~28 chars per line for 56px font
    const titleLines = wordWrap(title, 28);
    const lineHeight = 70; // px between title lines

    // Vertical layout constants (1200 × 630)
    const W = 1200;
    const H = 630;

    // Title block vertical center — start Y for first title line
    // Reserve: top accent bar (6px), category badge area (~60px), some padding (~60px)
    // Bottom: date (~50px) + venue (~40px) + padding (~50px)
    // Available for title: ~630 - 6 - 60 - 60 - 140 = ~364px
    // Place title block centered in the available area
    const topReserved = 126;   // accent bar + badge row
    const bottomReserved = 150; // date + venue + padding
    const titleAreaHeight = H - topReserved - bottomReserved;
    const titleBlockHeight = titleLines.length * lineHeight - (lineHeight - 56); // approx
    const titleStartY = topReserved + (titleAreaHeight - titleBlockHeight) / 2 + 56;

    const dateLine  = titleStartY + titleLines.length * lineHeight + 20;
    const venueLine = dateLine + 46;

    // Build title text elements
    const titleSvg = titleLines.map((line, i) => {
      const y = titleStartY + i * lineHeight;
      return `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif" font-size="56" font-weight="800" fill="#ffffff" letter-spacing="-1">${line}</text>`;
    }).join('\n    ');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f2027"/>
      <stop offset="100%" stop-color="#0d1f2d"/>
    </linearGradient>

    <!-- Category color overlay (subtle diagonal tint) -->
    <linearGradient id="catTint" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.18"/>
    </linearGradient>

    <!-- Dot texture pattern -->
    <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(255,255,255,0.035)"/>
    </pattern>

    <!-- Text shadow filter -->
    <filter id="textShadow" x="-5%" y="-5%" width="110%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.6)"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Dot texture overlay -->
  <rect width="${W}" height="${H}" fill="url(#dots)"/>

  <!-- Category color tint overlay -->
  <rect width="${W}" height="${H}" fill="url(#catTint)"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="${W}" height="6" fill="${color}"/>

  <!-- Category pill badge (top-right) -->
  <rect x="${W - 220}" y="22" width="196" height="40" rx="20" ry="20" fill="${color}" opacity="0.95"/>
  <text x="${W - 122}" y="48" text-anchor="middle" font-family="system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif" font-size="22" font-weight="700" fill="#ffffff" letter-spacing="0.5">${emoji} ${label}</text>

  <!-- Event title (word-wrapped) -->
  <g filter="url(#textShadow)">
    ${titleSvg}
  </g>

  <!-- Date line -->
  ${date ? `<text x="${W / 2}" y="${dateLine}" text-anchor="middle" font-family="system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif" font-size="28" font-weight="600" fill="#5eead4" letter-spacing="0.3">📅 ${date}</text>` : ''}

  <!-- Venue line -->
  ${venue ? `<text x="${W / 2}" y="${venueLine}" text-anchor="middle" font-family="system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif" font-size="22" font-weight="400" fill="#94a3b8" letter-spacing="0.2">📍 ${venue}</text>` : ''}

  <!-- Large watermark emoji (bottom-right, faint) -->
  <text x="${W - 80}" y="${H - 30}" text-anchor="middle" font-size="120" opacity="0.4" font-family="system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif">${emoji}</text>

  <!-- sm-tx.com brand mark (bottom-left) -->
  <text x="28" y="${H - 22}" font-family="system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif" font-size="18" font-weight="700" fill="#5eead4" opacity="0.7" letter-spacing="0.5">sm-tx.com</text>
</svg>`;

    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    // Always return a valid SVG — never a 500 visible to the user
    const errorSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f2027"/>
  <rect x="0" y="0" width="1200" height="6" fill="#0d9488"/>
  <text x="600" y="320" text-anchor="middle" font-family="system-ui,sans-serif" font-size="48" font-weight="700" fill="#ffffff">San Marcos Event</text>
  <text x="600" y="385" text-anchor="middle" font-family="system-ui,sans-serif" font-size="24" fill="#5eead4">sm-tx.com</text>
</svg>`;
    return new Response(errorSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}
