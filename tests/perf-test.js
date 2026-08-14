/* perf-test.js — locks in the deck's compositing budget.
   Run: NODE_PATH=/opt/node22/lib/node_modules node tests/perf-test.js  (server on :8477)

   The deck holds every plant in the DOM at once. That is fine — audit-layout.js relies
   on it — but only the top few cards are ever visible, so only those may be PAINTED and
   only the ones that MOVE may be promoted to their own GPU layer.

   Two regressions this catches, both of which shipped once and glitched swiping on a
   real phone:
     · will-change on every card -> 57 compositing layers (~200MB of GPU layer memory),
       which also defeats occlusion culling
     · painting every buried card -> the browser holds a decoded bitmap for all 54 photos
   The third check is the guard rail on the fix: hiding buried content must not change a
   single pixel, because ~30 stacked box-shadows are what build the deck's halo. */
const { chromium } = require('playwright');

const URL = 'http://localhost:8477/timber.html';
const MAX_LAYERS = 4;       /* mid-fling card + top three live — one deeper than visible motion,
                               so a swipe never promotes a card the user can see (phone tearing) */
const MAX_PAINTED = 4;      /* PAINT_DEPTH in timber.html */

let passed = 0, failed = 0; const fails = [];
const check = (name, ok, detail = '') => {
  if (ok) { passed++; console.log('PASS ' + name); }
  else { failed++; fails.push(name + (detail ? ' — ' + detail : '')); console.log('FAIL ' + name + (detail ? ' — ' + detail : '')); }
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  let photoReqs = 0;
  page.on('request', (r) => { if (r.url().includes('/photos/')) photoReqs++; });
  await page.goto(URL);
  await page.waitForTimeout(1200);

  const total = await page.evaluate(() => document.querySelectorAll('.deck .card').length);

  /* ---- 0. photo fetching is windowed, not a load-time stampede ---- */
  check(`photo fetching stays windowed at load (${photoReqs} requests, not ${total})`, photoReqs <= 12, `${photoReqs} > 12`);

  /* ---- 1. compositing layers ---- */
  const layers = await page.evaluate(() =>
    [...document.querySelectorAll('.deck .card')].filter(c => getComputedStyle(c).willChange !== 'auto').length);
  check(`only moving cards are promoted (${layers} layers, not ${total})`, layers <= MAX_LAYERS, `${layers} > ${MAX_LAYERS}`);

  /* ---- 1b. REAL composited layer count (CDP) — will-change is only a proxy.
     perspective + preserve-3d + hidden backfaces on every card once forced ~4 real
     layers per card (228 measured): phones evicted tiles → white screens, stale
     card slabs. Only hot cards may keep a 3D context. ---- */
  const ltCdp = await ctx.newCDPSession(page);
  let realLayers = null;
  ltCdp.on('LayerTree.layerTreeDidChange', (e) => { if (e.layers) realLayers = e.layers.length; });
  await ltCdp.send('LayerTree.enable');
  /* the enable-time snapshot still carries load-time layers the compositor hasn't
     collected — provoke a swipe and read the settled steady-state tree instead */
  await page.evaluate(() => act(true));
  await page.waitForTimeout(900);
  check(`real composited layer count stays flat (${realLayers} layers)`, realLayers !== null && realLayers <= 24,
    `${realLayers} > 24`);
  await ltCdp.send('LayerTree.disable');

  /* ---- 2. painted content ---- */
  const painted = await page.evaluate(() => document.querySelectorAll('.deck .card:not(.deep)').length);
  check(`only the top ${MAX_PAINTED} cards paint their content (${painted} of ${total})`, painted <= MAX_PAINTED, `${painted} > ${MAX_PAINTED}`);

  const photos = await page.evaluate(() =>
    [...document.querySelectorAll('.tphoto img')].filter(i => getComputedStyle(i).visibility !== 'hidden').length);
  check(`buried photos are not painted (${photos} visible)`, photos <= MAX_PAINTED, `${photos} > ${MAX_PAINTED}`);

  /* ---- 3. hiding buried content must be pixel-identical ----
     Freeze animations first. This assertion is about ONE thing: whether the deep
     toggle changes a visible pixel. A holo card's wisp layers animate whenever
     they are hot, so two screenshots taken a second apart would differ no matter
     what the toggle did, and the check would fail for a reason that has nothing
     to do with what it tests. Today the only holo card sits deep in the deck and
     its wisps are display:none, so this passes by luck — freeze them and it
     passes on purpose, whatever the deck order happens to be. */
  await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused !important}' });
  await page.evaluate(() => document.querySelectorAll('.deck .card').forEach(c => c.classList.remove('deep')));
  await page.waitForTimeout(2500);                       /* let every photo load and paint */
  const refShot = (await page.screenshot()).toString('base64');
  await page.evaluate(() => markHot());
  await page.waitForTimeout(900);
  const liveShot = (await page.screenshot()).toString('base64');

  const diff = await page.evaluate(async ([a, z]) => {
    const load = (s) => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
    const [A, B] = await Promise.all([load(a), load(z)]);
    const cv = document.createElement('canvas'); cv.width = A.width; cv.height = A.height;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(A, 0, 0); const da = new Uint8ClampedArray(cx.getImageData(0, 0, A.width, A.height).data);
    cx.clearRect(0, 0, A.width, A.height); cx.drawImage(B, 0, 0);
    const db = cx.getImageData(0, 0, A.width, A.height).data;
    let n = 0, max = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
      if (d > 0) { n++; if (d > max) max = d; }
    }
    return { px: n, max, pct: +(100 * n / (da.length / 4)).toFixed(3) };
  }, [refShot, liveShot]);
  check('hiding buried content changes no pixel (the deck halo is stacked shadows)',
    diff.px === 0, `${diff.px}px differ (${diff.pct}%), max channel delta ${diff.max}`);

  /* ---- 4. a drag must not force layout ---- */
  /* settle the photo pipeline first: the background trickle loader (tricklePhotos)
     sets img.src every 900ms for tens of seconds, and an image-load completing
     inside the drag window counts a layout pass that the drag did not force —
     whether one lands there is a deck-size-dependent timing accident. Load
     everything now so the measurement sees only what the drag itself does. */
  await page.evaluate(() => document.querySelectorAll('.card .tphoto img').forEach(i => {
    if (!i.getAttribute('src') && i.dataset.psrc) i.src = i.dataset.psrc;
  }));
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.card .tphoto img')].every(i => !i.getAttribute('src') || i.complete), null, { timeout: 30000 });
  await page.waitForTimeout(600);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  const metric = async (n) => {
    const { metrics } = await cdp.send('Performance.getMetrics');
    return (metrics.find(m => m.name === n) || {}).value || 0;
  };
  /* Measured in two windows, not one. Oscar's call: a swipe is a swipe now — any real
     drag commits on release, no snap-back — so a released drag legitimately updates
     counts, the learn bar and #actions visibility, which legitimately costs layout.
     That is correct work, not thrashing, and asserting 0 across it would fail on
     purpose. What must still cost nothing is the drag ITSELF — the 30 touchmoves
     while the finger is down, before anything commits — so that window is measured
     alone, release excluded. */
  const layoutsBefore = await metric('LayoutCount');
  await page.evaluate(async () => {
    const card = [...document.querySelectorAll('.deck .card:not([data-gone])')].pop();
    window.__dragTestCard = card;
    const fire = (type, x, y) => {
      const t = new Touch({ identifier: 1, target: card, clientX: x, clientY: y });
      card.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true }));
    };
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    fire('touchstart', 190, 420);
    for (let i = 1; i <= 30; i++) { fire('touchmove', 190 + i * 2, 420 - i); await sleep(8); }
  });
  const layouts = (await metric('LayoutCount')) - layoutsBefore;
  check(`dragging a card forces no layout (${layouts})`, layouts === 0, `${layouts} layout passes during the drag`);
  await page.evaluate(async () => {
    const card = window.__dragTestCard;
    const t = new Touch({ identifier: 1, target: card, clientX: 250, clientY: 390 });
    card.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t], bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 120));
  });

  /* ---- 5. the promotion must follow the deck, not go stale ---- */
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  for (let i = 0; i < 3; i++) { await page.click('#learn'); await page.waitForTimeout(420); }
  const after = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.deck .card')];
    const live = cards.filter(c => !c.dataset.gone);
    const top = live[live.length - 1];
    return {
      layers: cards.filter(c => getComputedStyle(c).willChange !== 'auto').length,
      painted: cards.filter(c => !c.classList.contains('deep')).length,
      topIsHot: top ? top.classList.contains('hot') : false,
      topIsPainted: top ? !top.classList.contains('deep') : false,
    };
  });
  check('after swiping, the new top card is promoted', after.topIsHot && after.topIsPainted);
  check(`after swiping, the budget still holds (${after.layers} layers / ${after.painted} painted)`,
    after.layers <= MAX_LAYERS && after.painted <= MAX_PAINTED, JSON.stringify(after));

  /* ---- 6. letting go of a card must not cost a frame ----
     markHot() allocates a layer for the newly revealed card and un-hides the one behind
     it — a full paint of a whole card. Called straight from fling(), that lands on the
     very frame the throw starts, and the card hangs where the finger left it: 145-257ms
     of dead screen measured by screencast, ~130ms on a real phone. It reads as the swipe
     not being yours.
     Movement is sampled in a rAF registered before the release, so it reads the card's
     position ahead of the deferred bookkeeping in the same frame — what the compositor
     is showing, not how long the main thread is busy afterwards. Main-thread frame gaps
     are the wrong metric here: the throw is transform+opacity on a promoted layer, so it
     keeps running while the deferred work blocks rAF, which it does by design. */
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const release = await page.evaluate(async () => {
    const real = window.markHot;
    let duringRelease = false, calledSync = false;
    window.markHot = (...a) => { if (duringRelease) calledSync = true; return real(...a); };
    const card = [...document.querySelectorAll('.deck .card:not([data-gone])')].pop();
    const fire = (type, x, y) => {
      const t = new Touch({ identifier: 1, target: card, clientX: x, clientY: y });
      card.dispatchEvent(new TouchEvent(type, {
        touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true }));
    };
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    fire('touchstart', 190, 420);
    for (let i = 1; i <= 30; i++) { fire('touchmove', 190 + i * 4, 420 - i); await sleep(8); }
    await sleep(60);                                   /* a finger rests before it lifts */
    const held = card.getBoundingClientRect().left;
    const t0 = performance.now(); let movedAt = null;
    const tick = () => {
      const now = performance.now() - t0;
      if (movedAt === null && card.getBoundingClientRect().left > held + 4) movedAt = now;
      if (now < 500) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    duringRelease = true; fire('touchend', 310, 390); duringRelease = false;
    const handler = performance.now() - t0;
    await sleep(600);
    window.markHot = real;
    return { calledSync, handler: +handler.toFixed(1),
             movedAt: movedAt === null ? null : +movedAt.toFixed(1) };
  });
  check('releasing a card does no layer or paint work on the frame the throw starts',
    release.calledSync === false, 'markHot() ran inside the touchend handler');
  check(`the touchend that commits a swipe returns promptly (${release.handler}ms)`,
    release.handler <= 16, `${release.handler}ms of script on the release`);
  check(`the card is already moving two frames after the release (${release.movedAt}ms)`,
    release.movedAt !== null && release.movedAt <= 50, `moved at ${release.movedAt}ms`);
  const settled = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.deck .card')];
    const top = cards.filter(c => !c.dataset.gone).pop();
    return { hot: top ? top.classList.contains('hot') : false, deep: top ? top.classList.contains('deep') : true };
  });
  check('the deferred promotion still lands', settled.hot && !settled.deep, JSON.stringify(settled));

  check('no page errors', pageErrors.length === 0, pageErrors.join(' | '));

  console.log(`\n${passed} passed, ${failed} failed`);
  if (fails.length) fails.forEach(f => console.log(' FAIL:', f));
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
