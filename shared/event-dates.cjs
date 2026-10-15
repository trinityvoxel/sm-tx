// Calendar fields are not instants. Timestamp fields require an explicit offset.
function calendarDate(value) {
  const s = String(value || '');
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:$|T00:00:00(?:\.000)?Z$)/);
  if (!m) return null;
  const d = new Date(m[1] + 'T12:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === m[1] ? m[1] : null;
}
function instantDate(value) {
  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(String(value))) return null;
  const d = new Date(value);
  if (isNaN(d)) return null;
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Chicago', year:'numeric', month:'2-digit', day:'2-digit' }).format(d);
}
// An occurrence field takes precedence over a recurring series start date.
function occurrenceDate(doc) {
  const value = doc.date || doc.startDate;
  return calendarDate(value) || instantDate(value);
}
function dateIssue(event) {
  const date = calendarDate(event.date_start);
  if (!date) return 'Invalid calendar date';
  if (String(event.url || '').split(/[?#]/)[0] === 'https://www.tantrasanmarcos.com/event-info/bluegrass-night-2024-06-12-19-30' && date !== '2024-06-12') return 'Source is a dated June 12, 2024 event page; a current occurrence source is required';
  // Publisher-confirmed venue-specific schedule; never infer dates from this rule.
  if (/^Lucky Guess Trivia$/i.test(event.name || '') && /sean\s*patrick/i.test(event.venue_name || '') && new Date(date+'T12:00:00Z').getUTCDay() !== 3)
    return 'Date conflicts with publisher-confirmed Wednesday schedule for Lucky Guess Trivia at Sean Patrick’s; verify before approval';
  if (/^Laughing Dead Comedy Open Mic$/i.test(event.name || '')
      && /wake\s*(?:the\s*)?dead/i.test([event.venue_name,event.description,event.url].join(' '))
      && new Date(date+'T12:00:00Z').getUTCDay() !== 2)
    return 'Date conflicts with publisher-confirmed Tuesday schedule for Laughing Dead Comedy Open Mic at Wake the Dead Coffee House; verify before approval';
  const titleMatch = String(event.name || '').match(/\b(first|second|third|fourth|fifth|last)\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/i);
  const descriptionMatch = String(event.description || '').match(/\b(?:every|each)\s+((?:first|second|third|fourth|fifth|last)\s+(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday))\b/i);
  const match = titleMatch || (descriptionMatch && descriptionMatch[1].match(/(first|second|third|fourth|fifth|last)\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/i));
  if (!match) {
    const weekly = String(event.description || '').match(/\b(?:every|each)\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)s?\b/i)
      || String(event.name || '').match(/\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)s\b/i);
    // Multiple weekday schedules need source review, not a single-day assumption.
    const mentioned = [...String(event.description || '').matchAll(/\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)s?\b/gi)].map(m=>m[1].toLowerCase());
    if (new Set(mentioned).size > 1) return null;
    if (weekly) {
      const actual = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(date+'T12:00:00Z').getUTCDay()];
      if (actual.toLowerCase() !== weekly[1].toLowerCase()) return `Date ${date} conflicts with source recurrence “${weekly[0]}”; verify before approval`;
    }
    return null;
  }
  const day = new Date(date + 'T12:00:00Z');
  const weekday = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(match[2].toLowerCase());
  const ordinal = ['first','second','third','fourth','fifth'].indexOf(match[1].toLowerCase()) + 1;
  const nextWeek = new Date(day); nextWeek.setUTCDate(day.getUTCDate()+7);
  const ordinalMatches = ordinal ? Math.ceil(day.getUTCDate()/7) === ordinal : nextWeek.getUTCMonth() !== day.getUTCMonth();
  return day.getUTCDay() !== weekday || !ordinalMatches ? `Date ${date} conflicts with ${titleMatch ? 'title' : 'source'} recurrence “${match[0]}”; verify an organizer exception before approval` : null;
}
module.exports = { calendarDate, instantDate, occurrenceDate, dateIssue };
