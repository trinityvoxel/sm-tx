const fs = require('node:fs');
const { sourceHealth } = require('../shared/collection-health.cjs');
async function retryRead(fn, { attempts = 2, delay = 1000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (error) {
      // Retry transient reads only. Never replay an import POST automatically.
      if (i === attempts - 1 || /(?:HTTP (?:400|401|403|404)|Domain not approved|redirect limit)/i.test(error.message)) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}
async function collectSource(source, fn, errors, reports) {
  const offset = errors.length;
  let result;
  try { result = await fn(); }
  catch (error) { errors.push(`[${source}] ${error.message}`); }
  const events = Array.isArray(result) ? result : result?.events || [];
  const report = sourceHealth(result?.source || source, events, errors.slice(offset));
  if (result?.status === 'out_of_season' && !errors.slice(offset).length && !events.length) {
    Object.assign(report, { status: 'out_of_season', reason: result.reason, season_end: result.season_end });
  }
  reports.push(report);
  console.log(`[Source health] ${report.source}: ${report.status}; ${report.count} events; ${report.missing_time} missing times; ${report.missing_venue} missing venues`);
  return { source: report.source, events };
}
function finishRun(sources, errors, dryRun, diagnostics = []) {
  const report = { checked_at: new Date().toISOString(), dry_run: dryRun, sources, errors, diagnostics };
  if (process.env.SM_TX_REPORT_PATH) fs.writeFileSync(process.env.SM_TX_REPORT_PATH, JSON.stringify(report, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    const escape = value => String(value).replace(/[\r\n|<>]/g, ' ');
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `## Collection ${dryRun ? '(dry run)' : ''}\n\nSource | Status | Events | Missing times | Missing venues\n---|---|---:|---:|---:\n` +
      sources.map(s => `${escape(s.source)} | ${s.status} | ${s.count} | ${s.missing_time} | ${s.missing_venue}`).join('\n') +
      '\n\n' + errors.map(e => `- ${escape(e)}`).join('\n') + '\n');
  }
  // Partial failures must fail the workflow even when other sources imported successfully.
  if (errors.length) process.exitCode = 1;
}
async function postReport(endpoint, key, body) {
  const response = await fetch(endpoint, { method: 'POST', signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json', 'X-SM-TX-Key': key }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Job report HTTP ${response.status}`);
  await response.arrayBuffer();
}
module.exports = { retryRead, collectSource, finishRun, postReport };
