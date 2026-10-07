const { genericVenue } = require('./venue.cjs');
function sourceHealth(source, events, errors = []) {
  const unresolved = events.filter(e => !e.time || genericVenue(e.venue_name));
  return {
    source, count: events.length,
    status: errors.length ? 'error' : !events.length || unresolved.length ? 'review' : 'success',
    checked_at: new Date().toISOString(), errors,
    missing_time: events.filter(e => !e.time).length,
    missing_venue: events.filter(e => genericVenue(e.venue_name)).length,
    // Bounded evidence, not a claim that all missing data has been recovered.
    examples: unresolved.slice(0, 10).map(e => ({ name: e.name, date: e.date_start, url: e.url,
      missing: [!e.time && 'time', genericVenue(e.venue_name) && 'venue'].filter(Boolean) })),
  };
}
function metadata(run) {
  try { return typeof run?.meta === 'string' ? JSON.parse(run.meta) : run?.meta || {}; }
  catch { return {}; }
}
function jobHealth(job, runs, now = Date.now()) {
  if (job.enabled === 0 || job.enabled === false) return 'Disabled';
  const last = runs?.[0];
  if (!last) return 'No run recorded';
  const stamp = Date.parse(last.finished_at || last.started_at);
  const maxHours = job.id === 'smtx-event-scraper' ? 36 : 120;
  if (!Number.isFinite(stamp) || now - stamp > maxHours * 3600000) return 'Overdue';
  if (last.status !== 'success') return 'Failed / partial';
  const sources = metadata(last).sources;
  if (!Array.isArray(sources) || !sources.length || sources.some(s => !s.status)) return 'Legacy report — coverage unknown';
  if (sources.some(s => s.status === 'error')) return 'Failed / partial';
  if (sources.some(s => s.status !== 'out_of_season' && (s.status === 'review' || !s.count))) return 'Needs review';
  return 'Healthy';
}
function volumeDrop(current, previous) {
  return previous >= 10 && current < previous * 0.5;
}
function assertImportResponse(res) {
  if (res.status < 200 || res.status >= 300) throw new Error(`Import HTTP ${res.status}`);
  if (!Number.isInteger(res.body?.inserted) || !Number.isInteger(res.body?.skipped)) throw new Error('Invalid import response');
}
module.exports = { sourceHealth, metadata, jobHealth, volumeDrop, assertImportResponse };
