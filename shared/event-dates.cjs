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
function dateIssue(event) {
  const date = calendarDate(event.date_start);
  if (!date) return 'Invalid calendar date';
  const titleMatch = String(event.name || '').match(/\b(first|second|third|fourth|fifth|last)\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/i);
  const descriptionMatch = String(event.description || '').match(/\b(?:every|each)\s+((?:first|second|third|fourth|fifth|last)\s+(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday))\b/i);
  const match = titleMatch || (descriptionMatch && descriptionMatch[1].match(/(first|second|third|fourth|fifth|last)\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/i));
  if (!match) {
    const weekly = String(event.description || '').match(/\b(?:every|each)\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/i);
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
module.exports = { calendarDate, instantDate, dateIssue };
