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
      .then(c => c.add(new Request(CORE, { cache: 'reload' }))                                // the app itself must cache, or install fails and retries
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
      /* The app shell is revalidated WITH THE SERVER, not the browser's HTTP cache.
         A plain fetch() honours GitHub Pages' short max-age, so for minutes after a
         deploy the "refresh" got the phone's own stale copy back: same ETag, no
         update pill, and the old build re-cached. cache:'no-cache' sends a
         conditional request, so an unchanged page costs a 304, not a download. */
      const path = new URL(key).pathname;
      const shell = new URL(e.request.url).origin === location.origin &&
        (path.endsWith('timber.html') || path.endsWith('index.html') || path.endsWith('/'));
      const req = shell ? new Request(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }) : e.request;
      const refresh = fetch(req).then(res => {
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
