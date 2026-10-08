import React from 'react';
import health from '../../../shared/collection-health.cjs';
const { jobHealth, metadata, volumeDrop } = health;
export default function CollectionHealth({ jobs, jobRuns }) {
  return <section aria-label="Collection health">
    <h3>Collection health</h3>
    <p>Automatic collection uses no AI. Empty feeds and missing details need review; they do not prove that no events exist. Existing events are retained when a source fails.</p>
    {jobs.length === 0 && <p>No collection history is available in this environment.</p>}
    {jobs.map(job => {
      const runs = jobRuns[job.id] || [];
      const sources = metadata(runs[0]).sources || [];
      return <article key={job.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--muted)' }}>
        <h4>{job.id}: {jobHealth(job, runs)}</h4>
        <p>{job.workflow_state === 'disabled_inactivity' ? 'GitHub disabled this schedule after inactivity. Re-enable the workflow in GitHub.' : 'Check GitHub Actions if a scheduled run is overdue.'}</p>
        {runs[0]?.error_message && <p role="status">{runs[0].error_message}</p>}
        {sources.map(source => {
          const prior = metadata(runs[1]).sources?.find(s => s.source === source.source);
          const successful = runs.find(run => metadata(run).sources?.some(s => s.source === source.source && ['success', 'review'].includes(s.status)));
          return <details key={source.source} style={{ marginBottom: '.8rem' }}>
            <summary>{source.source}: {source.status === 'out_of_season' ? 'Out of season' : source.status || 'legacy report'} · {source.count} events{source.status !== 'out_of_season' && volumeDrop(source.count, prior?.count) ? ' · Large decrease — review source' : ''}</summary>
            {source.reason && <p>{source.reason}</p>}
            <p>Last successful collection in recent history: {successful ? new Date(successful.finished_at || successful.started_at).toLocaleString() : 'Not recorded'}. Success means the fetch completed, not that every detail is verified.</p>
            <p>Missing times: {source.missing_time ?? 'not measured'} · Missing venues: {source.missing_venue ?? 'not measured'}</p>
            {!source.count && source.status !== 'out_of_season' && <p>No events returned. Check for seasonal closure, a changed page, or an image-only schedule.</p>}
            {source.errors?.map((error, i) => <p key={i}>{error}</p>)}
            {!!source.examples?.length && <ul>{source.examples.map((event, i) => <li key={i}>
              {event.date} — {event.name}: missing {event.missing.join(' and ')}.{' '}
              {/^https?:\/\//i.test(event.url || '') && <a href={event.url} target="_blank" rel="noreferrer">Review source</a>}
            </li>)}</ul>}
            {!!source.examples?.length && <p>Showing up to ten examples from this source.</p>}
          </details>;
        })}
      </article>;
    })}
  </section>;
}
