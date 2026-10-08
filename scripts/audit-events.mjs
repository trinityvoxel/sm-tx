#!/usr/bin/env node
// Read-only local SQLite audit. Findings are review candidates, not verified errors.
import {DatabaseSync} from 'node:sqlite';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import dates from '../shared/event-dates.cjs';
import categories from '../shared/category.cjs';
const [dbPath, from, to, output] = process.argv.slice(2);
if (!dbPath || !/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '') || !output) throw new Error('Usage: node scripts/audit-events.mjs local.sqlite from-date through-date output.json');
const db = new DatabaseSync(resolve(dbPath), {readOnly:true});
const rows = db.prepare("SELECT id,name,date_start,date_end,time,venue_name,venue_address,category,description,url,cost,source FROM events WHERE status='approved' AND coalesce(date_end,date_start)>=? AND date_start<=? ORDER BY date_start,time,id").all(from,to);
const findings=[];
for (const e of rows) {
 const flags=[];
 const issue=dates.dateIssue(e); if(issue) flags.push({type:'date_conflict',detail:issue});
 const weekly=String(e.description||'').match(/\b(?:every|each)\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/i);
 if(weekly && ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(e.date_start+'T12:00:00Z').getUTCDay()].toLowerCase()!==weekly[1].toLowerCase()) flags.push({type:'weekly_conflict',detail:weekly[0]});
 if(!e.time) flags.push({type:e.date_end && e.date_end!==e.date_start?'multi_day_hours':'missing_time',detail:'Check source; do not assume all-day'});
 if(/^(san marcos(?:,?\s*(?:tx|texas))?|tba|tbd|unknown)$/i.test(e.venue_name||'') || !e.venue_name) flags.push({type:'vague_venue',detail:e.venue_name});
 const category=categories.primaryCategory(e.name);if(category&&category!==e.category) flags.push({type:'category_candidate',detail:`${e.category} → ${category}`});
 if(!/^https?:\/\//.test(e.url||'')) flags.push({type:'missing_source',detail:'No HTTP source URL'});
 if(/^free$/i.test(e.cost||'') && !/\bfree\b|no (?:admission|cost)|complimentary/i.test(e.description||'')) flags.push({type:'unsubstantiated_free',detail:'Free label requires checking; absence in description is not proof of error'});
 if(flags.length)findings.push({id:e.id,name:e.name,date:e.date_start,url:e.url,flags});
}
const duplicateCandidates=[];
for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
 const a=rows[i],b=rows[j];
 if(a.name.toLowerCase().replace(/[^a-z0-9]/g,'')!==b.name.toLowerCase().replace(/[^a-z0-9]/g,''))continue;
 const gap=Math.abs(Date.parse(a.date_start)-Date.parse(b.date_start))/86400000;
 if(gap<=1 && a.venue_name===b.venue_name)duplicateCandidates.push({ids:[a.id,b.id],name:a.name,dates:[a.date_start,b.date_start],reason:gap===0?'same-day candidate':'adjacent-day candidate; may be legitimate daily event'});
}
const counts={};for(const f of findings)for(const flag of f.flags)counts[flag.type]=(counts[flag.type]||0)+1;
const report={from,to,total:rows.length,flagged:findings.length,counts,duplicateCandidates,findings};
writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify({from,to,total:rows.length,flagged:findings.length,counts,duplicateCandidates:duplicateCandidates.length}));
