// Analytics cookies do not personalize public HTML. Unknown/session cookies bypass it.
function safePublicCookies(header) {
 return !header || header.split(';').every(part => /^(?:_ga(?:_[A-Za-z0-9]+)?|_gid|_gat(?:_[A-Za-z0-9_]+)?)$/.test(part.trim().split('=')[0]));
}
// Cache only anonymous public GET responses. Never cache admin/API or failures.
export async function publicResponse(request, assets, render, cache = globalThis.caches?.default) {
 const url=new URL(request.url);
 const eligible=request.method==='GET' && url.hostname==='sm-tx.com' && !/^\/(?:admin|api)(?:\/|$)/.test(url.pathname) && !request.headers.has('Authorization') && !request.headers.has('X-SM-TX-Key') && safePublicCookies(request.headers.get('Cookie'));
 if(!cache || !eligible)return render();
 const keyUrl=new URL(url);keyUrl.searchParams.set('__smtx_build',assets.js);keyUrl.searchParams.sort();
 const key=new Request(keyUrl,{method:'GET'});
 try {const hit=await cache.match(key);if(hit)return hit;}catch{/* Cache failure must not block the site. */}
 const response=await render();
 if(response.status!==200 || response.headers.has('Set-Cookie'))return response;
 const ttl=response.headers.has('X-SM-TX-Snapshot')?60:url.pathname==='/sitemap.xml'?3600:60;
 const headers=new Headers(response.headers);headers.set('Cache-Control',`public, max-age=0, s-maxage=${ttl}`);
 const result=new Response(response.body,{status:response.status,headers});
 try{await cache.put(key,result.clone());}catch{/* Serve the successful response even if caching fails. */}
 return result;
}
