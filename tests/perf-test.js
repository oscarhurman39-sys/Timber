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
  await page.goto(URL);
  await page.waitForTimeout(1200);

  const total = await page.evaluate(() => document.querySelectorAll('.deck .card').length);

  /* ---- 1. compositing layers ---- */
  const layers = await page.evaluate(() =>
    [...document.querySelectorAll('.deck .card')].filter(c => getComputedStyle(c).willChange !== 'auto').length);
  check(`only moving cards are promoted (${layers} layers, not ${total})`, layers <= MAX_LAYERS, `${layers} > ${MAX_LAYERS}`);

  /* ---- 2. painted content ---- */
  const painted = await page.evaluate(() => document.querySelectorAll('.deck .card:not(.deep)').length);
  check(`only the top ${MAX_PAINTED} cards paint their content (${painted} of ${total})`, painted <= MAX_PAINTED, `${painted} > ${MAX_PAINTED}`);

  const photos = await page.evaluate(() =>
    [...document.querySelectorAll('.tphoto img')].filter(i => getComputedStyle(i).visibility !== 'hidden').length);
  check(`buried photos are not painted (${photos} visible)`, photos <= MAX_PAINTED, `${photos} > ${MAX_PAINTED}`);

  /* ---- 3. hiding buried content must be pixel-identical ---- */
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
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  const metric = async (n) => {
    const { metrics } = await cdp.send('Performance.getMetrics');
    return (metrics.find(m => m.name === n) || {}).value || 0;
  };
  const layoutsBefore = await metric('LayoutCount');
  await page.evaluate(async () => {
    const card = [...document.querySelectorAll('.deck .card:not([data-gone])')].pop();
    const fire = (type, x, y) => {
      const t = new Touch({ identifier: 1, target: card, clientX: x, clientY: y });
      card.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true }));
    };
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    fire('touchstart', 190, 420);
    for (let i = 1; i <= 30; i++) { fire('touchmove', 190 + i * 2, 420 - i); await sleep(8); }
    fire('touchend', 250, 390);
    await sleep(120);
  });
  const layouts = (await metric('LayoutCount')) - layoutsBefore;
  check(`dragging a card forces no layout (${layouts})`, layouts === 0, `${layouts} layout passes during the drag`);

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

  check('no page errors', pageErrors.length === 0, pageErrors.join(' | '));

  console.log(`\n${passed} passed, ${failed} failed`);
  if (fails.length) fails.forEach(f => console.log(' FAIL:', f));
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
