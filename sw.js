/* Timber service worker — offline app-shell cache with background revalidation.
   Cached pages load instantly (and offline); every online visit refreshes the
   cache in the background, so a redeployed timber.html reaches devices on
   their next load without needing a sw.js change. */
const CACHE = 'timber-v1';
const CORE = './timber.html';
// The painted card template. Without these the card front has no fallback — it renders as bare
// text — so they are pre-cached at install rather than left to the runtime cache, which only
// fills once a visit has actually rendered every card. Photos keep the runtime path: they have a
// gradient fallback, and the list grows with every plant added.
// tests/sw-update-test.js fails if this list drifts from the art/ files timber.html references.
const ART = [
  'band-full', 'crest-blank', 'frame-full', 'growth-diamond', 'parch-swatch', 'plaque-full',
  'rail-patch-h', 'rail-patch-s', 'soil-full', 'sun-small',
  'widget-drop-fill', 'widget-drop-out', 'widget-seca-fill', 'widget-seca-out',
  'widget-spray-fill', 'widget-spray-out',
].map(n => './art/' + n + '.png');
const EXTRA = ['./', './index.html', ...ART];

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
          caches.open(CACHE).then(c => c.put(key, copy));
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
