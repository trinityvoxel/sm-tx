import test from 'node:test';
import assert from 'node:assert/strict';
import ticket from '../scripts/ticket-details.cjs';
test('official ticket details are cached but matched separately to each occurrence', async () => {
 let calls=0;
 const recover=ticket.createTicketRecovery(async url => {calls++;return {ok:true,url,text:async()=>'<script type="application/ld+json">{"@type":"MusicEvent","name":"Concert","startDate":"2026-10-09T20:00:00-05:00"}</script>'};});
 const event={name:'Concert',date_start:'2026-10-09',url:'https://www.eventbrite.com/e/concert-123?aff=venue'};
 assert.equal((await recover({...event})).time,'8:00 PM');
 assert.equal((await recover({...event,date_start:'2026-10-10'})).time,undefined);
 assert.equal(calls,1);
 await recover({...event,url:'https://unapproved.example/e/concert'});
 assert.equal(calls,1);
});
test('denied ticket details stay unresolved and are not retried', async()=>{
 let calls=0;
 const recover=ticket.createTicketRecovery(async()=>{calls++;return {ok:false,status:403};});
 const event={name:'Concert',date_start:'2026-10-09',url:'https://www.eventbrite.com/e/concert-123'};
 assert.equal((await recover(event)).time,undefined);
 assert.equal(calls,1);
});
