import {test} from 'node:test';
import assert from 'node:assert/strict';
import {linkProps} from '../client/src/lib/links.js';
import {cleanHtml} from '../client/src/lib/content.js';
import identity from '../shared/event-identity.cjs';
test('external navigation opens separately, preserving sponsored and excluding deceptive hosts',()=>{
 for(const url of ['https://www.cohostr.com/book/297530','//external.example/event','https://sm-tx.com.evil.test/']){
  const p=linkProps(url,'sponsored');assert.equal(p.target,'_blank');assert.match(p.rel,/noopener/);assert.match(p.rel,/sponsored/);
 }
 for(const url of ['/events','#details','https://sm-tx.com/events','https://www.sm-tx.com/','mailto:hello@example.com'])assert.equal(linkProps(url).target,undefined);
 assert.match(cleanHtml('<a href="https://example.com/event">Official event</a>'),/target="_blank"/);
 assert.ok(!cleanHtml('<a href="javascript:alert(1)">Bad</a>').includes('javascript:'));
});
test('same official occurrence survives title/venue changes, not different dates or event IDs',()=>{
 const a={name:'Texas State Volleyball vs Gonzaga',date_start:'2026-10-08',url:'https://events.txstate.edu/?trumbaEmbed=view%3Devent%26eventid%3D204331505'};
 assert.equal(identity.occurrenceMatch(a,{...a,name:'Texas State Volleyball vs Gonzaga - Dig Pink!',venue_name:'Strahan Arena'}),true);
 assert.equal(identity.occurrenceMatch(a,{...a,date_start:'2026-10-09'}),false);
 assert.equal(identity.occurrenceMatch(a,{...a,url:'https://events.txstate.edu/?eventid=204331506'}),false);
});
test('venue prefixes match across sources but different performances remain separate',()=>{
 const a={name:'Tantra: Jazz & Blues Night',venue_name:'Tantra',date_start:'2026-10-08'};
 assert.equal(identity.occurrenceMatch(a,{...a,name:'Jazz & Blues Night',venue_name:'Tantra Coffeehouse'}),true);
 assert.equal(identity.occurrenceMatch(a,{...a,name:'Tantra Bluegrass Night'}),false);
 assert.equal(identity.occurrenceMatch(a,{...a,venue_name:'Other venue'}),false);
});
test('different known performance times do not collapse across venue aliases',()=>{
 const a={name:'Tantra: Concert',venue_name:'Tantra',date_start:'2026-10-08',time:'6:00 PM'};
 assert.equal(identity.occurrenceMatch(a,{...a,name:'Concert',time:'8:00 PM'}),false);
});
