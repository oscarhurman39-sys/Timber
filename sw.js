/* Timber service worker — offline app-shell cache with background revalidation.
   Cached pages load instantly (and offline); every online visit refreshes the
   cache in the background, so a redeployed timber.html reaches devices on
   their next load without needing a sw.js change. */
const CACHE = 'timber-v1';
const CORE = './timber.html';
const EXTRA = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.add(CORE)                                // the app itself must cache, or install fails and retries
        .then(() => Promise.allSettled(EXTRA.map(u => c.add(u)))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const key = e.request.url.replace(/[?#].*$/, '');        // one cache entry per resource, query-stripped
  e.respondWith(
    caches.match(key).then(hit => {
      const refresh = fetch(e.request).then(res => {
        if (res.ok && !res.redirected && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(async c => {
            /* a fresher app shell just replaced the stale one we already served —
               tell open pages so they can offer a refresh instead of waiting for
               the user's next visit */
            let fresher = false;
            if (new URL(key).pathname.endsWith('timber.html')) {
              const prev = await c.match(key);                 // must be read BEFORE the put
              const a = prev && prev.headers.get('etag'), b = copy.headers.get('etag');
              fresher = !!(prev && a && b && a !== b);
            }
            /* The write comes FIRST and is awaited. The announcement used to go out
               while the put was still only a pending promise, and the page's whole
               response to it is to reload — straight back through this worker, where
               a cache still holding the stale shell serves the stale shell. Tapping
               "update" could hand you the build you were trying to leave, and the
               pill would come back. Announce a cache that has actually been written. */
            await c.put(key, copy);
            if (fresher) {
              const cs = await self.clients.matchAll();
              cs.forEach(cl => cl.postMessage('timber-updated'));
            }
          });
        }
        return res;
      });
      if (hit) {                                            // stale-while-revalidate
        e.waitUntil(refresh.catch(() => {}));
        return hit;
      }
      return refresh.catch(() => {
        if (e.request.mode === 'navigate') return caches.match(CORE);
      });
    })
  );
});
