const {startTime} = require('./schedule.cjs');
const normalize = value => String(value || '').toLowerCase().replace(/&#38;|&amp;/g,'&').replace(/[^a-z0-9]+/g,' ').trim();
function providerId(value) {
 try { const u=new URL(value); if(!['events.txstate.edu','events.txst.edu','www.trumba.com'].includes(u.hostname))return null;
 const embed=new URLSearchParams(u.searchParams.get('trumbaEmbed')||''); const id=u.searchParams.get('eventid')||embed.get('eventid');return /^\d+$/.test(id||'')?'trumba:'+id:null;
 } catch {return null;}
}
function occurrenceMatch(a,b) {
 if(a.date_start!==b.date_start)return false;
 const x=providerId(a.url),y=providerId(b.url);
 if(x&&y)return x===y;
 if(a.time && b.time && startTime(a.time) && startTime(b.time) && startTime(a.time)!==startTime(b.time))return false;
 // Only remove a venue prefix when it is explicitly followed by a colon.
 const venue=v=>normalize(v).replace(/\bcoffeehouse\b|\bcoffee house\b/g,'').trim();
 if(!venue(a.venue_name)||venue(a.venue_name)!==venue(b.venue_name))return false;
 const title=e=>normalize(String(e.name||'').replace(/^([^:]+):\s*/, (m,p)=>venue(p)===venue(e.venue_name)?'':m));
 return title(a)===title(b) && !!title(a);
}
module.exports={providerId,occurrenceMatch};
