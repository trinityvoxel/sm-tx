// Only the published, public event projection is stored here. Never wrap admin SQL.
const inFlight = new WeakMap();
export async function cachedDiscovery(range, load, cache) {
  if (!cache) return load();
  const key = new Request(`https://sm-tx.com/__public-data/discovery-v1/${range.from}/${range.to}`);
  try {
    const hit = await cache.match(key);
    if (hit) return await hit.json();
  } catch { /* A cache failure must not prevent a database read. */ }
  let pending = inFlight.get(cache);
  if (!pending) { pending = new Map(); inFlight.set(cache, pending); }
  if (!pending.has(key.url)) {
    pending.set(key.url, (async () => {
      const events = await load();
      try {
        await cache.put(key, new Response(JSON.stringify(events), {
          headers: {'Content-Type':'application/json', 'Cache-Control':'public, max-age=600'},
        }));
      } catch { /* Do not discard successfully loaded data. */ }
      return events;
    })());
  }
  try { return structuredClone(await pending.get(key.url)); }
  finally { pending.delete(key.url); }
}
