import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
test('import lookups use indexes instead of scanning the events table',()=>{
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../functions/api/schema.sql',import.meta.url),'utf8').split('-- Sample approved events')[0]);db.exec(readFileSync(new URL('../functions/api/migrations/0006_query_indexes.sql',import.meta.url),'utf8'));
 for(const query of ["SELECT * FROM events WHERE lower(name)=lower('show') AND date_start='2026-10-11' AND lower(venue_name)=lower('venue')","SELECT * FROM events WHERE date_start='2026-10-11'","SELECT id FROM events WHERE lower(name)=lower('show') AND url='https://example.com' AND date_start!='2026-10-11' AND abs(julianday(date_start)-julianday('2026-10-11'))<=1"]){const plan=db.prepare('EXPLAIN QUERY PLAN '+query).all().map(r=>r.detail).join(' ');assert.match(plan,/SEARCH events USING/);assert.doesNotMatch(plan,/SCAN events/);}
});
