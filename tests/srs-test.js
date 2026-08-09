const { chromium } = require('playwright');
const NPLANTS = 128;  // plants in the demo deck (5 more parked in PLANTS_ON_HOLD until photos land)

const URL = 'http://localhost:8477/timber.html';
let passed = 0, failed = 0;
const failures = [];
function check(name, cond, extra) {
  if (cond) { passed++; console.log('PASS', name); }
  else { failed++; failures.push(name + (extra ? ' — ' + extra : '')); console.log('FAIL', name, extra || ''); }
}

async function dragCard(page, dxTotal) {
  const box = await page.locator('#deck').boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(x + (dxTotal * i) / 8, y);
  await page.mouse.up();
  await page.waitForTimeout(450); // fling animation + removal
}

const getSRS = page => page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('timber-srs-v1')) || {}; } catch (e) { return {}; }
});
const localDate = (page, off) => page.evaluate(o => srsDateStr(o), off); // page's own local-date helper
const topLatin = page => page.evaluate(() => {
  const cards = document.querySelectorAll('.card:not([data-gone])');
  return PLANTS[+cards[cards.length - 1].dataset.idx].latin;
});
async function openReview(page) {
  await page.click('#menuBtn'); await page.waitForTimeout(350);
  await page.click('#reviewRow'); await page.waitForTimeout(350);
}
// seed n plants due today, the rest due far in the future; deck progress cleared for a known 8-card start
const seedDue = (page, n) => page.evaluate(count => {
  const srs = {};
  PLANTS.forEach((p, i) => { srs[p.latin] = { box: 1, due: i < count ? srsDateStr(0) : '2099-01-01' }; });
  localStorage.setItem('timber-srs-v1', JSON.stringify(srs));
  localStorage.removeItem('timber-progress-v1');
}, n);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto(URL); await page.waitForTimeout(400);

  /* ---- 1. fresh state ---- */
  check('menu shows 0 due on fresh state',
    await page.evaluate(() => document.getElementById('reviewDueMenu').textContent) === '0');

  /* ---- 2. swipe right creates box-1 record due tomorrow ---- */
  const latin1 = await topLatin(page);
  await dragCard(page, 160);
  let srs = await getSRS(page);
  check('learn creates SRS record keyed by latin',
    !!srs[latin1], JSON.stringify(srs));
  check('learn: box 1, due +1 day',
    srs[latin1] && srs[latin1].box === 1 && srs[latin1].due === await localDate(page, 1),
    JSON.stringify(srs[latin1]));

  /* ---- 3. box progression + interval schedule, cap at 5 ---- */
  const boxes = await page.evaluate(lat => {
    const out = [];
    for (let i = 0; i < 5; i++) {
      srsOnSwipe(lat, true);
      const r = JSON.parse(localStorage.getItem('timber-srs-v1'))[lat];
      out.push({ box: r.box, due: r.due });
    }
    return out;
  }, latin1);
  check('boxes climb 2,3,4,5 and cap at 5',
    boxes.map(b => b.box).join(',') === '2,3,4,5,5', JSON.stringify(boxes));
  const wantDue = [3, 7, 16, 35, 35]; // intervals for boxes 2,3,4,5,5
  let intervalsOk = true;
  for (let i = 0; i < 5; i++) if (boxes[i].due !== await localDate(page, wantDue[i])) intervalsOk = false;
  check('intervals follow 1/3/7/16/35 per box', intervalsOk, JSON.stringify(boxes));

  /* ---- 4. swipe left resets to box 1, due tomorrow ---- */
  const latin2 = await topLatin(page);
  await page.evaluate(lat => srsOnSwipe(lat, true), latin2); // pre-existing box
  await dragCard(page, -160);
  srs = await getSRS(page);
  check('skip resets to box 1, due tomorrow',
    srs[latin2].box === 1 && srs[latin2].due === await localDate(page, 1), JSON.stringify(srs[latin2]));

  /* ---- 5. quiz wrong drops a box, due tomorrow ---- */
  const qw = await page.evaluate(() => {
    const lat = PLANTS[0].latin, lat2 = PLANTS[1].latin;
    localStorage.setItem('timber-srs-v1', JSON.stringify({ [lat]: { box: 3, due: '2099-01-01' } }));
    srsOnQuizWrong(lat);   // existing record: 3 → 2
    srsOnQuizWrong(lat2);  // no record: lands in box 1
    return JSON.parse(localStorage.getItem('timber-srs-v1'));
  });
  check('quiz wrong drops box 3→2, due tomorrow',
    qw[await page.evaluate(() => PLANTS[0].latin)].box === 2
    && qw[await page.evaluate(() => PLANTS[0].latin)].due === await localDate(page, 1), JSON.stringify(qw));
  check('quiz wrong on unseen plant creates box-1 record',
    qw[await page.evaluate(() => PLANTS[1].latin)].box === 1, JSON.stringify(qw));

  /* ---- 6. corrupt / invalid storage tolerated ---- */
  await page.evaluate(() => localStorage.setItem('timber-srs-v1', '{"broken'));
  await page.reload(); await page.waitForTimeout(400);
  check('corrupt SRS JSON → treated as empty, app boots',
    await page.evaluate(() => document.getElementById('reviewDueMenu').textContent) === '0');
  const filtered = await page.evaluate(() => {
    localStorage.setItem('timber-srs-v1', JSON.stringify({
      good: { box: 2, due: '2026-01-01' }, badBox: { box: 9, due: '2026-01-01' },
      badDue: { box: 2, due: 'someday' }, junk: 42,
    }));
    return loadSRS();
  });
  check('invalid SRS entries filtered on load',
    Object.keys(filtered).join(',') === 'good', JSON.stringify(filtered));

  /* ---- 7. due count + review filter ---- */
  await seedDue(page, 3);
  await page.reload(); await page.waitForTimeout(400);
  check('menu shows due count 3',
    await page.evaluate(() => document.getElementById('reviewDueMenu').textContent) === '3');
  const progressBefore = await page.evaluate(() => localStorage.getItem('timber-progress-v1'));
  await openReview(page);
  const inReview = await page.evaluate(() => ({
    cards: document.querySelectorAll('.card').length,
    sheetOpen: document.getElementById('sheet').classList.contains('open'),
    label: document.getElementById('reviewDueMenu').textContent,
  }));
  check('review deck holds only the 3 due plants', inReview.cards === 3, JSON.stringify(inReview));
  check('entering review closes the menu sheet', !inReview.sheetOpen);
  check('menu row flips to exit review', inReview.label === 'exit review');

  /* ---- 8. review swipes hit SRS but never saved progress ---- */
  const rvLatin = await topLatin(page);
  await dragCard(page, 160);
  srs = await getSRS(page);
  check('swipe inside review updates SRS (box 1→2)', srs[rvLatin].box === 2, JSON.stringify(srs[rvLatin]));
  check('saved full-deck progress untouched during review',
    await page.evaluate(() => localStorage.getItem('timber-progress-v1')) === progressBefore);

  /* ---- 9. exit review restores the full deck exactly ---- */
  await openReview(page); // row now toggles review off
  const restored = await page.evaluate(() => ({
    cards: document.querySelectorAll('.card').length,
    left: +document.getElementById('left').textContent,
    done: +document.getElementById('done').textContent,
  }));
  check('exit review restores full deck', restored.cards === NPLANTS && restored.left === NPLANTS
    && restored.done === 0, JSON.stringify(restored));
  check('progress still byte-identical after exit',
    await page.evaluate(() => localStorage.getItem('timber-progress-v1')) === progressBefore);

  /* ---- 10. review auto-exits when the last due card is swiped ---- */
  await seedDue(page, 1);
  await page.reload(); await page.waitForTimeout(400);
  await openReview(page);
  await dragCard(page, 160);
  await page.waitForTimeout(200);
  check('last due swipe drops back to the full deck',
    await page.evaluate(() => document.querySelectorAll('.card').length) === NPLANTS);

  /* ---- 11. all caught up ---- */
  await seedDue(page, 0); // everything due 2099
  await page.reload(); await page.waitForTimeout(400);
  await openReview(page);
  const caught = await page.evaluate(() => ({
    label: document.getElementById('reviewDueMenu').textContent,
    cards: document.querySelectorAll('.card').length,
    sheetOpen: document.getElementById('sheet').classList.contains('open'),
  }));
  check('zero due shows all-caught-up with next date',
    /all caught up · next 2099-01-01/.test(caught.label), JSON.stringify(caught));
  check('zero due leaves deck + menu alone', caught.cards === NPLANTS && caught.sheetOpen);

  /* ---- 12. deck reset never wipes SRS ---- */
  await page.click('.sheet .scrim', { position: { x: 15, y: 300 } }); await page.waitForTimeout(350);
  await page.evaluate(() => buildDeck());
  srs = await getSRS(page);
  check('reset deck keeps SRS records', Object.keys(srs).length === NPLANTS, JSON.stringify(Object.keys(srs)));

  /* ---- 13. keyboard access on the review row ---- */
  await page.click('#menuBtn'); await page.waitForTimeout(350);
  await page.focus('#reviewRow');
  await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  check('review row responds to Enter',
    /all caught up/.test(await page.evaluate(() => document.getElementById('reviewDueMenu').textContent)));

  /* ---- 14. no JS errors anywhere ---- */
  check('no page errors', pageErrors.length === 0, pageErrors.join(' | '));

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failures.length) { console.log('FAILURES:'); failures.forEach(f => console.log(' -', f)); }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
