// One public read per run, no AI and no database writes. Fail CI on date conflicts.
import dates from '../shared/event-dates.cjs';
import { writeFileSync } from 'node:fs';
const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'America/Chicago'}).format(new Date());
const response = await fetch('https://sm-tx.com/api/events', {signal:AbortSignal.timeout(30000)});
if (!response.ok) throw new Error(`Event audit HTTP ${response.status}`);
const events = await response.json();
if (!Array.isArray(events)) throw new Error('Unexpected events response');
const current = events.filter(e=>(e.date_end || e.date_start)>=today);
const conflicts = current.flatMap(e=>{
 const reason=dates.dateIssue(e);
 return reason ? [{id:e.id,name:e.name,date:e.date_start,venue:e.venue_name,url:e.url,reason}] : [];
});
const report={checked_at:new Date().toISOString(),checked:current.length,conflicts};
if(process.env.SM_TX_DATE_AUDIT_PATH) writeFileSync(process.env.SM_TX_DATE_AUDIT_PATH,JSON.stringify(report,null,2));
console.log(`Checked ${current.length} current/future events; ${conflicts.length} weekday conflicts.`);
if(conflicts.length){console.error(JSON.stringify(conflicts,null,2));process.exitCode=1;}
