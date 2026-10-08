// Manual production release check. Creates only an explicitly labeled pending
// fixture, tests admin editing/protection, then removes the fixture. The
// submission audit entry remains rejected. Sends one admin submission alert.
import assert from 'node:assert/strict';
const base='https://sm-tx.com/api';
const key=process.env.SM_TX_API_KEY;
assert.ok(key,'SM_TX_API_KEY must be configured');
async function api(path,method='GET',body){
 const r=await fetch(base+path,{method,headers:{'X-SM-TX-Key':key,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const data=await r.json();assert.ok(r.ok,`${method} ${path}: ${r.status}`);return data;
}
for(const route of ['/admin/date-reviews','/admin/sources','/admin/jobs','/events/pending']){await api(route);console.log('Authenticated read passed:',route);}
let id;
try{
 const created=await api('/events/submit','POST',{name:'SM-TX release verification — not a public event',date_start:'2026-10-08',time:'6:00 PM',venue_name:'Release verification only',venue_address:'Not a real event',category:'community',cost:'Not applicable',submitter_name:'SM-TX.com Admin',submitter_email:'events@sm-tx.com',description:'Authorized deployment QA. This pending fixture will be removed immediately.'});
 id=created.id;assert.ok(id);assert.equal(created.status,'pending');
 assert.ok((await api('/events/pending')).some(e=>e.id===id));
 const edited=await api('/events/'+id,'PATCH',{time:'7:00 PM',protect_imports:true});assert.equal(edited.time,'7:00 PM');
 // A scraped refresh cannot replace an explicitly protected matching occurrence.
 await api('/events/'+id,'PATCH',{source:'scraped',time:'7:00 PM',protect_imports:true});
 await api('/admin/import','POST',{events:[{name:edited.name,date_start:edited.date_start,time:'8:00 PM',venue_name:edited.venue_name,venue_address:edited.venue_address,category:'community',source:'scraped'}]});
 const protectedRow=(await api('/events/pending')).find(e=>e.id===id);assert.equal(protectedRow.time,'7:00 PM');
 console.log('Submission storage, admin editing and import protection passed.');
}finally{
 if(id){await api('/events/'+id,'PATCH',{status:'rejected',protect_imports:false});await api('/events/'+id,'DELETE');console.log('Release fixture removed:',id);}
}
