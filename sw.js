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
            if (new URL(key).pathname.endsWith('timber.html')) {
              const prev = await c.match(key);
              const a = prev && prev.headers.get('etag'), b = copy.headers.get('etag');
              if (prev && a && b && a !== b) {
                const cs = await self.clients.matchAll();
                cs.forEach(cl => cl.postMessage('timber-updated'));
              }
            }
            c.put(key, copy);
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
