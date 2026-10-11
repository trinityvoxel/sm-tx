import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicResponse} from '../server/public-cache.js';
test('public pages reuse a response; admin, credentials, cookies, errors never cache',async()=>{
 const saved=new Map();const cache={match:async k=>saved.get(k.url)?.clone(),put:async(k,v)=>saved.set(k.url,v)};let reads=0;
 const render=()=>{reads++;return new Response('public');};const assets={js:'build-a.js'};
 const page=new Request('https://sm-tx.com/events');
 await publicResponse(page,assets,render,cache);await publicResponse(page,assets,render,cache);assert.equal(reads,1);
 for(const r of [new Request('https://sm-tx.com/admin'),new Request('https://sm-tx.com/api/events'),new Request(page,{headers:{Cookie:'session=x'}}),new Request(page,{headers:{Authorization:'Bearer x'}})]){await publicResponse(r,assets,render,cache);await publicResponse(r,assets,render,cache);}assert.equal(reads,9);
 await publicResponse(page,{js:'build-b.js'},render,cache);assert.equal(reads,10);
 const size=saved.size;
 const fail=new Request('https://sm-tx.com/events/fail');await publicResponse(fail,assets,()=>new Response('error',{status:503}),cache);assert.equal(saved.size,size);
});
