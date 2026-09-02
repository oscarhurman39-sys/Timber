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
/* the staged deal (timber.html dealCards) lands buried cards in timer chunks; the deck
   carries data-dealing until the last chunk is in, so counting DOM cards must wait it out */
const deckSettled = page => page.waitForFunction(() => !document.getElementById('deck').hasAttribute('data-dealing'));
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
  await deckSettled(page);

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

  /* COUNT CARDS, NOT IMAGES. The budget is "a buried card must not paint its
     photo", and this counted <img> elements as a proxy for it. That held until a
     PHOTO_SWAP card reached the painted window: a swap card carries TWO images in
     one .tphoto and cross-fades between them, so the proxy read 5 painted photos
     across 4 painted cards and failed a card that was behaving exactly as
     designed (Cedrus 'Horstmann's Silberspitz', 2026-08-23). The invariant is
     asserted directly now — nothing on a .deep card may be visible — and the
     count is still bounded, just with the swap frames the window legitimately
     holds added to the ceiling, so a real leak still fails. */
  const ph = await page.evaluate(() => {
    const vis = [...document.querySelectorAll('.tphoto img')]
      .filter(i => getComputedStyle(i).visibility !== 'hidden');
    const onDeep = vis.filter(i => i.closest('.card')?.classList.contains('deep'));
    const swapExtras = vis.filter(i => i.classList.contains('alt')).length;
    return { visible: vis.length, onDeep: onDeep.length, swapExtras };
  });
  check(`no buried card paints its photo (${ph.onDeep} on .deep cards)`, ph.onDeep === 0,
    `${ph.onDeep} photo(s) painted on cards marked deep`);
  const photoCeiling = MAX_PAINTED + ph.swapExtras;
  check(`painted photos stay inside the window (${ph.visible} visible, ceiling ${photoCeiling})`,
    ph.visible <= photoCeiling, `${ph.visible} > ${photoCeiling}`);

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
  /* This asserted diff.px === 0 until 2026-08-16, when it went red at deck 173
     and stayed red. It was NOT a defect, and the evidence is worth keeping so
     nobody re-tightens it blind:

       - Bisected, not assumed. The previous commit (deck 171) passed 14/14 on
         the same port; the next one failed with identical numbers every run.
       - The differing pixels were dumped with coordinates. Fifteen of the first
         sixteen were a vertical run at x=764, y=1311-1325 — the outermost edge
         of the deck halo — reading (0,0,0) against (1,1,1). One unit in 255.
       - Unhiding the buried cards makes that edge DARKER, not lighter. Nothing
         is peeking past the top card; it is more `.tcard` box-shadows stacking
         across an 8-bit rounding boundary, which is the cause this check has
         been named after since it was written.
       - It scales with the pile: max delta was 3 at deck 173 and 5 at 194.

     So the intent is unchanged — buried content must not become visible — but
     it is now expressed as "nothing a screen could show" rather than "not one
     bit". The real failure this must still catch is a buried card's CONTENT
     appearing, which means card colours: deltas in the tens or hundreds across
     a region of pixels, orders of magnitude past these bounds.

     The bounds below were not guessed. A leak was staged and measured: one
     buried card un-hidden and nudged 12px so part of it genuinely showed past
     the top card came out at **46882 px, max delta 443** — against a residual of
     17 px at max delta 5. Three orders of magnitude on both axes, so the budget
     is nowhere near being able to swallow a real one. Re-run that measurement
     (scratch script, same procedure as this block) before ever widening it.

     The observed numbers are in the check's own name on every run, passing or
     failing, so the drift stays visible instead of hiding under a threshold. If
     px climbs into the hundreds, or max into the tens, that is a different
     phenomenon and wants looking at rather than another loosening. */
  /* RAISED 2026-08-18, second time, and the two reasons are separate — measured,
     not assumed, by emptying the EDITION registry and re-running the same diff:

       deck 217, no themed cards ....... 17 px, max delta 9
       deck 217, with the two themed ... 98 px, max delta 13

     1. THE BASELINE DRIFTED ON ITS OWN. Same 17 pixels as at deck 194, but the
        max delta went 5 -> 9 purely because 23 more cards stack 23 more shadows
        at that edge. That is the growth this comment predicted.
     2. THE TWO THEMED CARDS ADD ~81 px. Their `backdrop-filter` samples what is
        painted behind, so a themed card's pixels depend on whether buried cards
        are hidden. Confined to cards that opt in; empty EDITION and it returns
        to the 17 px baseline exactly.

     A `filter:` on the card was a THIRD cause and was removed rather than
     tolerated: drop-shadow rendered the whole card to its own buffer and moved
     22510 px by up to 39. This check caught it before it shipped, which is the
     entire argument for having kept the assertion tight.

     The margin is re-measured, not inherited: a staged leak — one buried card
     un-hidden and nudged 12px so it genuinely showed — diffs at 47173 px, max
     delta 443 on this same deck. That is 480x the pixel budget below. */
  /* DELTA RAISED 2026-08-28, third time, and only the delta — the pixel budget is
     untouched because the pixel count went DOWN. Measured, not assumed:

       residual today (deck 240) ..... 31 px, max delta 26
       staged leak, same procedure ... 36497 px, max delta 375

     The differing pixels were dumped with coordinates again, and they are not
     where they used to be. They are no longer one near-black row: they are the
     deck's TOP CORNERS (x≈30 and x≈749 at y≈302 in the 780x1688 shot) plus two
     thin bands at the card's lower edge, and they carry COLOUR — [18,10,0]
     against [3,0,0], a warm gold. That is the stacked cards' own gold trim in
     the halo, arriving because two new photographs changed which card sits on
     top; the value had hovered at 22-25 for a week before one tipped it over.

     Still not a leak, and the ratio proves it: 1177x on pixels and 14x on delta
     against a real one. Max delta 26 is about 8 per channel on near-black, which
     no screen shows. The pixel budget stays at 256 precisely because that is the
     axis a genuine leak explodes on — 36497 of them — and it must stay tight.

     If the DELTA needs raising a fourth time, stop and look for a colour change
     at the card edge rather than reaching for the number again. */
  const HALO_MAX_PX = 256;     /* 31 at deck 240; 98 at deck 217 with two themed cards */
  const HALO_MAX_DELTA = 30;   /* sum across r+g+b; 26 observed at deck 240 */
  check(`hiding buried content shows nothing (${diff.px}px, max Δ${diff.max}; halo shadows round at the edge)`,
    diff.px <= HALO_MAX_PX && diff.max <= HALO_MAX_DELTA,
    `${diff.px}px differ (${diff.pct}%), max channel delta ${diff.max} ` +
    `— budget ${HALO_MAX_PX}px / Δ${HALO_MAX_DELTA}`);

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
    const t0 = performance.now(); let movedAt = null, movedFrame = null, frames = 0;
    const tick = () => {
      const now = performance.now() - t0;
      if (movedAt === null && card.getBoundingClientRect().left > held + 4) { movedAt = now; movedFrame = frames; }
      frames++;
      if (now < 500) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    duringRelease = true; fire('touchend', 310, 390); duringRelease = false;
    const handler = performance.now() - t0;
    await sleep(600);
    window.markHot = real;
    return { calledSync, handler: +handler.toFixed(1), frames,
             movedFrame, movedAt: movedAt === null ? null : +movedAt.toFixed(1) };
  });
  check('releasing a card does no layer or paint work on the frame the throw starts',
    release.calledSync === false, 'markHot() ran inside the touchend handler');
  check(`the touchend that commits a swipe returns promptly (${release.handler}ms)`,
    release.handler <= 16, `${release.handler}ms of script on the release`);
  /* COUNT FRAMES, NOT MILLISECONDS. This asks whether the throw starts immediately or
     waits on main-thread work, and the sampler can only see movement when it gets a
     frame — so a wall-clock budget measures the container's frame cadence as much as
     the app. Traced 2026-08-18: the card had moved 60px by the sampler's second frame,
     but that frame landed anywhere between 23ms and 63ms depending on machine load, and
     the old 50ms cap failed 4 runs out of 4 on a deck size that had passed the same
     check an hour earlier. Frame INDEX is what the check's own name always claimed to
     measure and it is cadence-proof; the ms figure stays in the label as information,
     with a loose absolute ceiling underneath it to catch a genuine stall. */
  check(`the card is already moving two frames after the release ` +
        `(frame ${release.movedFrame}, ${release.movedAt}ms)`,
    release.movedFrame !== null && release.movedFrame <= 2 && release.movedAt <= 250,
    `moved at frame ${release.movedFrame}, ${release.movedAt}ms (sampler saw ${release.frames} frames)`);
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
