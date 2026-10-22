import {handleRequest} from '../.server/entry-server.js';
import snapshots from '../server/outage-snapshot.json';
import assets from '../.server/assets.json';
import {publicResponse} from '../server/public-cache.js';
export function onRequest({request,env}) {
 return publicResponse(request,assets,async()=>{
  const publicEnv = new URL(request.url).hostname === 'sm-tx.com' ? {...env, PUBLIC_DISCOVERY_CACHE:globalThis.caches?.default} : env;
  const response=await handleRequest(request,publicEnv,assets);
  const url=new URL(request.url);
  if(response.status===503 && Date.now()<Date.parse("2026-10-12T12:00:00Z") && !url.search && snapshots[url.pathname])return new Response(snapshots[url.pathname],{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-SM-TX-Snapshot':'2026-10-11T14:15:00Z'}});
  return response;
 });
}
