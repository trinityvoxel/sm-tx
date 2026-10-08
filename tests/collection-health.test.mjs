import test from 'node:test';
import assert from 'node:assert/strict';
import health from '../shared/collection-health.cjs';
import runtime from '../scripts/collection-runtime.cjs';
const { sourceHealth, jobHealth, volumeDrop, assertImportResponse } = health;
const { collectSource, retryRead } = runtime;
test('partial extraction failure retains usable events but marks source error', async () => {
  const errors = [], reports = [];
  const result = await collectSource('Venue', async () => {
    errors.push('second page failed');
    return [{ name: 'Concert', date_start: '2026-10-10', venue_name: 'San Marcos' }];
  }, errors, reports);
  assert.equal(result.events.length, 1);
  assert.equal(reports[0].status, 'error');
  assert.equal(reports[0].missing_time, 1);
  assert.equal(reports[0].missing_venue, 1);
});
test('empty source is reviewable and missing evidence examples are bounded', () => {
  assert.equal(sourceHealth('Seasonal', []).status, 'review');
  assert.equal(sourceHealth('Venue', Array.from({ length: 20 }, () => ({ name: 'Event' }))).examples.length, 10);
});
test('stale and legacy successful runs are not healthy', () => {
  const job = { id: 'smtx-event-scraper', enabled: 1 };
  const run = { status: 'success', finished_at: '2026-10-01T00:00:00Z', meta: '{}' };
  assert.equal(jobHealth(job, [run], Date.parse('2026-10-03')), 'Overdue');
  assert.match(jobHealth(job, [run], Date.parse('2026-10-01T01:00Z')), /Legacy/);
  run.meta = JSON.stringify({ sources: [{ status: 'error', count: 12 }] });
  assert.equal(jobHealth(job, [run], Date.parse('2026-10-01T01:00Z')), 'Failed / partial');
  assert.equal(jobHealth({ ...job, enabled: 0 }, [run]), 'Disabled');
  assert.equal(volumeDrop(4, 20), true);
  assert.equal(volumeDrop(0, 2), false);
});
test('non-2xx and invalid import responses cannot appear successful', () => {
  assert.throws(() => assertImportResponse({ status: 401, body: {} }), /401/);
  assert.throws(() => assertImportResponse({ status: 200, body: '<html>' }), /Invalid/);
  assert.doesNotThrow(() => assertImportResponse({ status: 201, body: { inserted: 0, skipped: 20 } }));
});
test('read retries recover a transient failure but do not retry permission errors', async () => {
  let count = 0;
  assert.equal(await retryRead(async () => { if (++count === 1) throw new Error('HTTP 503'); return 'ok'; }, { delay: 0 }), 'ok');
  count = 0;
  await assert.rejects(retryRead(async () => { count++; throw new Error('HTTP 403'); }, { delay: 0 }), /403/);
  assert.equal(count, 1);
});

test('ended season is skipped without an error or automatic next-year activation', async () => {
  const { sourceSeason } = await import('../shared/source-seasons.cjs').then(m => m.default);
  assert.equal(sourceSeason('summer-in-the-park', '2026-08-06'), null);
  assert.equal(sourceSeason('summer-in-the-park', '2026-10-07').status, 'out_of_season');
  assert.equal(sourceSeason('summer-in-the-park', '2027-06-01').status, 'out_of_season');
  assert.equal(sourceSeason('other-source', '2026-10-07'), null);
  const errors = [], reports = [];
  await collectSource('Summer in the Park', async () => ({events:[], ...sourceSeason('summer-in-the-park', '2026-10-07')}), errors, reports);
  assert.equal(errors.length, 0);
  assert.equal(reports[0].status, 'out_of_season');
  const run={status:'success',finished_at:'2026-10-07T12:00:00Z',meta:{sources:[reports[0],{status:'success',count:10}]}};
  assert.equal(jobHealth({id:'smtx-browser-scraper',enabled:1},[run],Date.parse('2026-10-07T13:00:00Z')),'Healthy');
  run.meta.sources.push({status:'error',count:0});
  assert.equal(jobHealth({id:'smtx-browser-scraper',enabled:1},[run],Date.parse('2026-10-07T13:00:00Z')),'Failed / partial');
});
