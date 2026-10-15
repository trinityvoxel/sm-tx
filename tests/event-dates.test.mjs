import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import dates from '../shared/event-dates.cjs';
test('date-only and midnight calendar fields never change day with host timezone', () => {
 for (const TZ of ['UTC','America/Chicago','Asia/Tokyo']) {
  const output = execFileSync(process.execPath, ['-e', "const d=require('./shared/event-dates.cjs');console.log(d.calendarDate('2026-09-01T00:00:00.000Z'),d.instantDate('2026-09-02T00:30:00Z'))"], {cwd:new URL('../', import.meta.url), env:{...process.env,TZ}}).toString().trim();
  assert.equal(output,'2026-09-01 2026-09-01');
 }
 assert.equal(dates.calendarDate('2026-02-30'),null);
 assert.equal(dates.instantDate('2026-09-01T19:00:00'),null);
});
test('recurrence conflicts are held, including legitimate exceptions requiring review', () => {
 assert.equal(dates.dateIssue({name:'First Tuesday Film Series',date_start:'2026-09-01'}),null);
 assert.match(dates.dateIssue({name:'First Tuesday Pairing Dinner',date_start:'2026-09-02'}),/conflicts/);
 assert.match(dates.dateIssue({name:'First Tuesday Film Series',date_start:'2026-07-14'}),/organizer exception/);
 assert.equal(dates.dateIssue({name:'Last Friday',date_start:'2026-10-30'}),null);
});
test('weekly source descriptions flag the wrong weekday without inventing a replacement', () => {
 assert.match(dates.dateIssue({name:'Produce on the Patio',description:'EVERY Saturday at the coffee house',date_start:'2026-09-27'}),/conflicts/);
 assert.equal(dates.dateIssue({name:'Produce on the Patio',description:'EVERY Saturday at the coffee house',date_start:'2026-09-26'}),null);
 assert.equal(dates.dateIssue({name:'Dinner',description:'Last Saturday was wonderful',date_start:'2026-09-27'}),null);
});
test('ordinal recurrence in a source description catches weekday and week-number errors', () => {
 const e={name:'Laughing Dead Showcase',description:'At Wake the Dead EVERY THIRD SATURDAY.'};
 assert.match(dates.dateIssue({...e,date_start:'2026-10-18'}),/source recurrence/);
 assert.match(dates.dateIssue({...e,date_start:'2026-10-10'}),/conflicts/);
 assert.equal(dates.dateIssue({...e,date_start:'2026-10-17'}),null);
 assert.equal(dates.dateIssue({name:'Show',description:'We enjoyed last Saturday.',date_start:'2026-10-18'}),null);
});
test('expired Tantra detail page cannot justify newly generated weekly occurrences',()=>{
 assert.match(dates.dateIssue({name:'Tantra Bluegrass Night',date_start:'2026-10-15',url:'https://www.tantrasanmarcos.com/event-info/bluegrass-night-2024-06-12-19-30'}),/2024/);
 assert.equal(dates.dateIssue({name:'Tantra: Bluegrass Night',date_start:'2026-10-07',url:'https://www.visitsanmarcos.com/listen-san-marcos/live-this-week/'}),null);
});

test('confirmed trivia rule is venue-specific and catches missing recurrence prose', () => {
 const e={name:'Lucky Guess Trivia',venue_name:"Sean Patrick's Irish Pub & Texas Grub"};
 assert.match(dates.dateIssue({...e,date_start:'2026-10-22'}),/Wednesday/);
 assert.equal(dates.dateIssue({...e,date_start:'2026-10-21'}),null);
 assert.equal(dates.dateIssue({...e,venue_name:'Another venue',date_start:'2026-10-22'}),null);
});
test('plural weekday titles and descriptions catch errors without assuming multi-day schedules',()=>{
 assert.match(dates.dateIssue({name:'Karaoke Thursdays',date_start:'2026-10-16'}),/conflicts/);
 assert.match(dates.dateIssue({name:'Show',description:'Every Wednesdays',date_start:'2026-10-15'}),/conflicts/);
 assert.equal(dates.dateIssue({name:'Show',description:'Every Wednesday and Thursday',date_start:'2026-10-15'}),null);
});

test('occurrence timestamps use Central time and never fall back to a series start',()=>{
 for(const TZ of ['UTC','America/Chicago','Asia/Tokyo']) {
 const code="const {occurrenceDate:d}=require('./shared/event-dates.cjs');console.log(d({date:'2026-10-22T01:00:00Z',startDate:'2026-06-17'}),d({date:'2026-11-05T02:00:00Z'}),d({date:'2026-10-21T00:00:00Z'}),d({date:'invalid',startDate:'2026-06-17'}))";
 assert.equal(execFileSync(process.execPath,['-e',code],{cwd:new URL('../',import.meta.url),env:{...process.env,TZ}}).toString().trim(),'2026-10-21 2026-11-04 2026-10-21 null');
 }
});
