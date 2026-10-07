const {startTime} = require('./schedule.cjs');
const weekdays=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
// The visible Time field is usable only for a matching title and occurrence.
function visibleDetailTime(event, detail) {
 if(String(detail?.name||'').trim().toLowerCase()!==String(event.name||'').trim().toLowerCase())return null;
 const day=new Date(event.date_start+'T12:00:00Z');
 if(!Number.isFinite(+day))return null;
 const fields=detail.fields||{};
 const recurrence=String(fields.Recurrence||'').trim().toLowerCase();
 let matches=false;
 const weekly=recurrence.match(/^recurring weekly on (.+)$/);
 if(weekly) {
  const days=weekly[1].split(/,\s*|\s+and\s+/);
  matches=days.every(d=>weekdays.includes(d))&&days.includes(weekdays[day.getUTCDay()]);
 }
 const monthly=recurrence.match(/^recurring monthly on the ([1-5])(?:st|nd|rd|th) (sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
 if(monthly)matches=day.getUTCDay()===weekdays.indexOf(monthly[2])&&Math.ceil(day.getUTCDate()/7)===Number(monthly[1]);
 // A weekly label can be broader than an ordinal rule in the description.
 if (/\b(?:[1-5](?:st|nd|rd|th)|first|second|third|fourth|last)\b/i.test(detail.description || '') && weekly) matches=false;
 const next=fields.Next||fields.Date;
 // Parse only explicitly year-bearing US dates; never invent a year.
 if(next&&/\b20\d{2}\b/.test(next)) {
  const d=new Date(next+' 12:00:00 UTC');
  if(Number.isFinite(+d)&&d.toISOString().slice(0,10)===event.date_start)matches=true;
 }
 return matches ? startTime(fields.Time) : null;
}
function detailBackfill(event, detail) {
 const {instantDate, calendarDate} = require('./event-dates.cjs');
 const {structuredTime} = require('./schedule.cjs');
 const {resolveVenue} = require('./venue.cjs');
 const schema = (detail?.schemas || []).find(n => String(n.name || '').trim().toLowerCase() === String(event.name || '').trim().toLowerCase()
   && (instantDate(n.startDate) || calendarDate(n.startDate)) === event.date_start);
 return { ...resolveVenue(event, {location: schema?.location}),
   time: event.time || structuredTime(schema?.startDate, event.date_start) || visibleDetailTime(event, {...detail, description: schema?.description || ''}) || event.time };
}
function schemasFromHtml(html) {
 const schemas = [];
 const visit = value => {
  if (Array.isArray(value)) value.forEach(visit);
  else if (value && typeof value === 'object') {
   if ([value['@type']].flat().some(t => typeof t === 'string' && /Event$/.test(t))) schemas.push(value);
   if (value['@graph']) visit(value['@graph']);
  }
 };
 for (const match of String(html).matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
  try { visit(JSON.parse(match[1])); } catch { /* A broken block must not discard valid blocks. */ }
 }
 return schemas;
}
module.exports={visibleDetailTime, detailBackfill, schemasFromHtml};
