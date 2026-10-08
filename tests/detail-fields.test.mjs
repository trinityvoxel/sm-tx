import {test} from 'node:test';
import assert from 'node:assert/strict';
import detail from '../shared/detail-fields.cjs';
const event={name:'San Marcos Flea Market',date_start:'2026-09-27'};
const page={name:event.name,fields:{Time:'9:00 AM to 5:00 PM',Recurrence:'Recurring weekly on Sunday, Saturday'}};
test('visible source time recovers a recurring event missing schema time',()=>{
 assert.equal(detail.visibleDetailTime(event,page),'9:00 AM');
 assert.equal(detail.visibleDetailTime({...event,date_start:'2026-09-28'},page),null);
 assert.equal(detail.visibleDetailTime(event,{...page,name:'Other event'}),null);
});
test('monthly and exact-date checks prevent copying a different occurrence time',()=>{
 const p={name:event.name,fields:{Next:'October 24, 2026',Time:'9:00 AM to 2:30 PM',Recurrence:'Recurring monthly on the 4th Saturday'}};
 assert.equal(detail.visibleDetailTime({...event,date_start:'2026-10-24'},p),'9:00 AM');
 assert.equal(detail.visibleDetailTime({...event,date_start:'2026-10-25'},p),null);
 assert.equal(detail.visibleDetailTime(event,{...page,fields:{Time:'9:00 AM'}}),null);
});
test('a more specific description prevents broad weekly recurrence extrapolation',()=>{
 const specific={...page,description:'First and third Saturdays only',fields:{Time:'9:00 AM',Recurrence:'Recurring weekly on Saturday',Next:'October 3, 2026'}};
 assert.equal(detail.visibleDetailTime({...event,date_start:'2026-10-10'},specific),null);
 assert.equal(detail.visibleDetailTime({...event,date_start:'2026-10-03'},specific),'9:00 AM');
});

test('structured detail recovery requires matching title and occurrence', () => {
 const event = {name:'Concert',date_start:'2026-10-08',venue_name:'San Marcos'};
 const schema = {name:'Concert',startDate:'2026-10-08T19:00:00-05:00',location:{name:'Verified Venue'}};
 const {detailBackfill} = detail;
 assert.equal(detailBackfill(event,{schemas:[schema]}).venue_name,'Verified Venue');
 assert.ok(detailBackfill(event,{schemas:[schema]}).time);
 assert.equal(detailBackfill(event,{schemas:[{...schema,startDate:'2026-10-09T19:00:00-05:00'}]}).time,undefined);
 assert.equal(detailBackfill(event,{schemas:[{...schema,name:'Different Concert'}]}).venue_name,'San Marcos');
 assert.equal(detailBackfill({...event,time:'8:00 PM'},{schemas:[schema]}).time,'8:00 PM');
});

test('detail extraction tolerates malformed JSON-LD and reads graphs', () => {
 const schemas = detail.schemasFromHtml(`<script type="application/ld+json">broken</script><script type='application/ld+json'>{"@graph":[{"@type":"MusicEvent","name":"Concert"},{"@type":"Place","name":"Venue"}]}</script>`);
 assert.equal(schemas.length,1);
 assert.equal(schemas[0].name,'Concert');
});
