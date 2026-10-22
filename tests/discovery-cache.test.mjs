import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cachedDiscovery} from '../server/discovery-cache.js';
import {publicResponse} from '../server/public-cache.js';
function cacheFixture(){const saved=new Map();return {saved,match:async k=>saved.get(k.url)?.clone(),put:async(k,v)=>saved.set(k.url,v.clone())};}
test('concurrent public discovery reads share a load and caller changes cannot corrupt cached data',async()=>{
 const cache=cacheFixture(),range={from:'2026-10-22',to:'2027-01-20'};let reads=0;
 let release;const gate=new Promise(r=>{release=r;});
 const load=async()=>{reads++;await gate;return [{id:'a',name:'Public event'}]};
 const a=cachedDiscovery(range,load,cache),b=cachedDiscovery(range,load,cache);release();
 const [first,second]=await Promise.all([a,b]);assert.equal(reads,1);first[0].name='Changed';assert.equal(second[0].name,'Public event');
 assert.equal((await cachedDiscovery(range,load,cache))[0].name,'Public event');assert.equal(reads,1);
 await cachedDiscovery({...range,from:'2026-10-23'},load,cache);assert.equal(reads,2);
});
test('failed discovery loads are not cached and are retried',async()=>{
 const cache=cacheFixture(),range={from:'2026-10-22',to:'2027-01-20'};
 await assert.rejects(cachedDiscovery(range,()=>Promise.reject(Error('quota')),cache),/quota/);
 assert.equal(cache.saved.size,0);
 assert.deepEqual(await cachedDiscovery(range,async()=>[],cache),[]);
});
test('GA cookies reuse public HTML but session cookies and admin credentials still bypass',async()=>{
 const cache=cacheFixture();let reads=0;const render=()=>{reads++;return new Response('public')};const assets={js:'test'};
 const anonymous=new Request('https://sm-tx.com/');await publicResponse(anonymous,assets,render,cache);
 await publicResponse(new Request(anonymous,{headers:{Cookie:'_ga=1; _ga_BK70Z5T50Z=2'}}),assets,render,cache);assert.equal(reads,1);
 for(const headers of [{Cookie:'_ga=1; session=secret'},{'X-SM-TX-Key':'admin'},{Authorization:'Bearer admin'}])await publicResponse(new Request(anonymous,{headers}),assets,render,cache);
 assert.equal(reads,4);
});
