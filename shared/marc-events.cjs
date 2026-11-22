const {calendarDate,instantDate}=require('./event-dates.cjs');
function parseMarcEvents(html){
 const events=[];
 for(const key of ['MANUAL_SNAPSHOT','FEED_SNAPSHOT']){
  const text=html.match(new RegExp('const\\s+'+key+'\\s*=\\s*(\\[[\\s\\S]*?\\]);'))?.[1];
  if(!text)continue;
  const rows=JSON.parse(text);
  for(const row of rows){
   const date=key==='MANUAL_SNAPSHOT'?calendarDate(row.date):instantDate(row.eventStart);
   if(!date||!row.title)continue;
   events.push({name:row.title,date_start:date,time:row.doors||row.doortime||null,venue_name:'The Marc',venue_address:'126 N LBJ Dr, San Marcos, TX 78666',category:'music',description:row.subtitle||row.eventsubtitle||null,url:row.url||row.link||'https://themarcsm.com/',cost:null,source:'scraped'});
  }
 }
 return events;
}
module.exports={parseMarcEvents};
