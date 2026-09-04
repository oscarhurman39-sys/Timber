const { chromium } = require('playwright');
const NPLANTS = require('../tools/plant-data.js')
  .readDeck(require('fs').readFileSync(require('path').join(__dirname,'..','timber.html'),'utf8')).length;
/* Derived from timber.html, never hand-typed. Four suites used to carry a
   hardcoded copy of this number; a deck change that updated only some of
   them made the rest fail for the wrong reason. */
const URL = 'http://localhost:8477/timber.html';
/* the staged deal (timber.html dealCards) lands buried cards in timer chunks; the deck
   carries data-dealing until the last chunk is in, so counting DOM cards must wait it out */
const deckSettled = page => page.waitForFunction(() => !document.getElementById('deck').hasAttribute('data-dealing'));
let passed = 0, failed = 0;
const fails = [];
function check(name, cond, extra) {
  if (cond) { passed++; console.log('PASS', name); }
  else { failed++; fails.push(name); console.log('FAIL', name, extra || ''); }
}

(async () => {
  const browser = await chromium.launch();

  /* ---- 1. corrupted localStorage must not brick the app ---- */
  let ctx = await browser.newContext();
  let page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => {
    localStorage.setItem('timber-progress-v1', '{{{{not json!!');
    localStorage.setItem('timber-quiz-v1', 'banana');
  });
  await page.goto(URL); await page.waitForTimeout(300); await deckSettled(page);
  let c = await page.evaluate(() => ({ cards: document.querySelectorAll('.card').length, left: document.getElementById('left').textContent }));
  check('corrupted storage -> fresh deck, no crash', c.cards === NPLANTS && c.left === String(NPLANTS) && errs.length === 0, JSON.stringify({ c, errs }));
  await ctx.close();

  /* ---- 2. persisted EMPTY deck restores to empty state correctly ---- */
  ctx = await browser.newContext();
  page = await ctx.newPage();
  page.on('pageerror', e => errs.push('empty:' + e));
  await page.goto(URL); await page.waitForTimeout(300);
  for (let i = 0; i < NPLANTS; i++) { await page.click('#learn'); await page.waitForTimeout(420); }
  let s = await page.evaluate(() => ({ empty: document.getElementById('empty').classList.contains('show'), done: document.getElementById('done').textContent }));
  check('deck cleared before reload', s.empty && s.done === String(NPLANTS), JSON.stringify(s));
  await page.reload(); await page.waitForTimeout(400);
  s = await page.evaluate(() => ({
    empty: document.getElementById('empty').classList.contains('show'),
    actionsHidden: document.getElementById('actions').style.visibility === 'hidden',
    done: document.getElementById('done').textContent, cards: document.querySelectorAll('.card').length,
  }));
  check('persisted empty deck -> empty state + hidden actions + count kept', s.empty && s.actionsHidden && s.done === String(NPLANTS) && s.cards === 0, JSON.stringify(s));
  // undo out of restored empty state (history persisted)
  // actions bar hidden -> undo not clickable by user; but reset must work:
  await page.click('#reset2'); await page.waitForTimeout(300); await deckSettled(page);
  s = await page.evaluate(() => ({ cards: document.querySelectorAll('.card').length, done: document.getElementById('done').textContent }));
  check('reset from restored empty state works', s.cards === NPLANTS && s.done === '0', JSON.stringify(s));
  await ctx.close();

  /* ---- 3. undo with empty history: no crash, no state change ---- */
  ctx = await browser.newContext();
  page = await ctx.newPage();
  const errs3 = [];
  page.on('pageerror', e => errs3.push(String(e)));
  await page.goto(URL); await page.waitForTimeout(300);
  // the button is disabled with nothing to undo, so the pointer path is closed off
  // structurally; the keyboard path still reaches undo() and must stay a no-op
  const backDisabled = await page.evaluate(() => document.getElementById('back').disabled);
  check('undo button disabled on a fresh deck', backDisabled === true, JSON.stringify({ backDisabled }));
  await page.keyboard.press('Backspace'); await page.keyboard.press('Backspace');
  await page.waitForTimeout(150); await deckSettled(page);
  c = await page.evaluate(() => ({ cards: document.querySelectorAll('.card').length, left: document.getElementById('left').textContent }));
  check('undo on fresh deck is a safe no-op', c.cards === NPLANTS && c.left === String(NPLANTS) && errs3.length === 0, JSON.stringify({ c, errs3 }));
  await ctx.close();

  /* ---- 4. search input with quotes/special chars doesn't crash rendering ---- */
  ctx = await browser.newContext();
  page = await ctx.newPage();
  const errs4 = [];
  page.on('pageerror', e => errs4.push(String(e)));
  await page.goto(URL); await page.waitForTimeout(300);
  await page.click('#searchBtn'); await page.waitForTimeout(400);
  for (const q of ['"', "'Nana", '<script>', '  ', '‘Obsessed’']) {
    await page.fill('#searchInput', q); await page.waitForTimeout(80);
  }
  const res = await page.evaluate(() => document.getElementById('searchResults').children.length);
  check('special-char queries safe (curly-quote cultivar search works)', errs4.length === 0 && res >= 1, JSON.stringify({ errs4, res }));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await ctx.close();

  /* ---- 5. quiz: spam-clicking options can't double-score or crash ---- */
  ctx = await browser.newContext();
  page = await ctx.newPage();
  const errs5 = [];
  page.on('pageerror', e => errs5.push(String(e)));
  await page.goto(URL); await page.waitForTimeout(300);
  await page.click('#menuBtn'); await page.waitForTimeout(350);
  await page.click('#quizRow'); await page.waitForTimeout(400);
  // click the same option 5 times fast
  const first = page.locator('.q-opt').first();
  for (let i = 0; i < 5; i++) { await first.click({ force: true }).catch(() => {}); }
  await page.waitForTimeout(150);
  const streak = await page.locator('#qStreak').innerText();
  check('quiz option spam: streak is 0 or 1, never more', ['0', '1'].includes(streak) && errs5.length === 0, 'streak=' + streak);
  await page.click('#quizClose'); await page.waitForTimeout(200);
  await ctx.close();

  /* ---- 6. flip stays locked after undo re-adds a previously flipped card ---- */
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.goto(URL); await page.waitForTimeout(300);
  const deckBox = await page.locator('#deck').boundingBox();
  const x = deckBox.x + deckBox.width / 2, y = deckBox.y + deckBox.height / 2;
  // flip top card, unflip via star (act() unflips), then star again to swipe, then undo
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(60); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(600);
  await page.click('#learn'); await page.waitForTimeout(200);   // unflips
  await page.click('#learn'); await page.waitForTimeout(450);   // swipes
  await page.click('#back'); await page.waitForTimeout(200);    // restore
  const flipped = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card');
    return cards[cards.length - 1].classList.contains('flipped');
  });
  c = await page.evaluate(() => ({ left: document.getElementById('left').textContent, done: document.getElementById('done').textContent }));
  check('undone card returns unflipped with correct counts', flipped === false && c.left === String(NPLANTS) && c.done === '0', JSON.stringify({ flipped, c }));
  await ctx.close();

  /* ---- 7. hold-to-rewind on the undo button ----
     The property that makes the gesture safe is that it is STOPPABLE — somebody
     holding it is usually trying to reach a particular card, not to wipe the deck.
     So the load-bearing assertion here is the middle one: a one-second hold must
     rewind several cards and still stop a long way short of the top. */
  ctx = await browser.newContext();
  page = await ctx.newPage();
  const errs7 = [];
  page.on('pageerror', e => errs7.push(String(e)));
  await page.goto(URL); await page.waitForTimeout(300);
  const state = () => page.evaluate(() => ({
    cards: document.querySelectorAll('.card:not([data-gone])').length,
    left: document.getElementById('left').textContent,
    done: document.getElementById('done').textContent,
    history: Array.isArray(history) ? history.length : -1,   /* not window.history — the app's let-scoped array shadows it */
    disabled: document.getElementById('back').disabled,
    rewinding: document.getElementById('back').classList.contains('rewinding'),
    /* flyIn puts an inline transition on the card it is animating and clears it
       after; a card carrying one is a card currently sailing back into the deck */
    flying: [...document.querySelectorAll('.card')].filter(c => /transform/.test(c.style.transition)).length,
  }));
  const pressBack = async ms => {
    const b = await page.locator('#back').boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(ms);
    await page.mouse.up();
    await page.waitForTimeout(200);
  };
  /* A card has to come back the side it was flung to, or the rewind reads as cards
     appearing from nowhere rather than the swipe running backwards. flyIn clears the
     inline transform synchronously, so the start position is only observable as the
     computed matrix once the transition is under way. */
  const reenterX = () => page.evaluate(() => new Promise(res => {
    undo(500);
    setTimeout(() => {
      const c = [...document.querySelectorAll('.card:not([data-gone])')].pop();
      const m = getComputedStyle(c).transform.match(/matrix(3d)?\(([^)]+)\)/);
      if (!m) return res(0);
      const v = m[2].split(',').map(Number);
      res(m[1] ? v[12] : v[4]);
    }, 50);
  }));
  await page.click('#learn'); await page.waitForTimeout(500);
  const xLearned = await reenterX(); await page.waitForTimeout(700);
  await page.click('#skip'); await page.waitForTimeout(500);
  const xSkipped = await reenterX(); await page.waitForTimeout(700);
  check('fly-in reverses the swipe: learned re-enters from the right, skip from the left',
    xLearned > 100 && xSkipped < -100, JSON.stringify({ xLearned, xSkipped }));

  const SWIPES = 24;
  for (let i = 0; i < SWIPES; i++) { await page.click(i % 4 === 3 ? '#skip' : '#learn'); await page.waitForTimeout(120); }
  await page.waitForTimeout(400);
  s = await state();
  check('rewind setup: 24 swipes recorded', s.history === SWIPES, JSON.stringify(s));

  // a tap is still a tap — one card, no repeat
  await page.click('#back'); await page.waitForTimeout(300);
  s = await state();
  check('tap: undoes exactly one card', s.history === SWIPES - 1, JSON.stringify(s));

  // a press only just past the repeat threshold is still one card, and the click
  // that follows the release must not sneak in a second
  await pressBack(430);
  s = await state();
  check('press just past the threshold: one card, click swallowed', s.history === SWIPES - 2, JSON.stringify(s));

  // THE ONE THAT MATTERS — mid-rewind cards are flying, and a 1s hold stops far short
  const b7 = await page.locator('#back').boundingBox();
  await page.mouse.move(b7.x + b7.width / 2, b7.y + b7.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(520);
  const mid = await state();
  await page.waitForTimeout(500);
  await page.mouse.up(); await page.waitForTimeout(300);
  const stopped = await state();
  const rewound = (SWIPES - 2) - stopped.history;
  check('1s hold: rewinds several cards and stops well short of the top',
    mid.rewinding === true && mid.flying >= 1 && stopped.rewinding === false &&
    rewound >= 2 && stopped.history >= 5,
    JSON.stringify({ mid, stopped, rewound }));

  // held to the end it runs out at the top and stops cleanly rather than erroring.
  // Hold until the history is actually empty rather than for a fixed 4s: the rewind
  // cadence is frame-paced, and under run-all --jobs 3 (three Chromiums plus the
  // app-test deck walk) 4s was not always enough to reach the top — the pair went
  // red at deck 240 with 28/28 green standalone. The property is "reaches the top
  // and stops cleanly", not "does so within one wall-clock budget".
  {
    const b = await page.locator('#back').boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.waitForFunction(() => Array.isArray(history) && history.length === 0, null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(300);          /* let the last fly-in land before releasing */
    await page.mouse.up();
    await page.waitForTimeout(300);
  }
  const top = await state();
  check('held to the top: full deck restored, history empty, undo disabled, spin off',
    top.cards === NPLANTS && top.left === String(NPLANTS) && top.done === '0' &&
    top.history === 0 && top.disabled === true && top.rewinding === false && errs7.length === 0,
    JSON.stringify({ top, errs7 }));

  await page.reload(); await page.waitForTimeout(400);
  const afterReload = await state();
  check('rewind to the top persisted across reload',
    afterReload.left === String(NPLANTS) && afterReload.done === '0' && afterReload.history === 0,
    JSON.stringify(afterReload));
  await ctx.close();

  /* ---- 7b. reduced motion: the rewind still works, the flying does not ---- */
  ctx = await browser.newContext({ reducedMotion: 'reduce' });
  page = await ctx.newPage();
  const errs7b = [];
  page.on('pageerror', e => errs7b.push(String(e)));
  await page.goto(URL); await page.waitForTimeout(300);
  for (let i = 0; i < 8; i++) { await page.click('#learn'); await page.waitForTimeout(120); }
  await page.waitForTimeout(300);
  const bR = await page.locator('#back').boundingBox();
  await page.mouse.move(bR.x + bR.width / 2, bR.y + bR.height / 2);
  await page.mouse.down(); await page.waitForTimeout(700);
  const midR = await page.evaluate(() => ({
    history: history.length,
    flying: [...document.querySelectorAll('.card')].filter(c => /transform/.test(c.style.transition)).length,
  }));
  await page.mouse.up(); await page.waitForTimeout(300);
  const endR = await page.evaluate(() => history.length);
  check('reduced motion: cards still rewind, none animate',
    endR < 8 && endR >= 0 && midR.flying === 0 && errs7b.length === 0,
    JSON.stringify({ midR, endR, errs7b }));
  await ctx.close();

  /* ---- 9. boot sentinel: a crash loop opens light, a clean open does not ----
     Two iPhones died on the full deck with Safari's "A problem repeatedly occurred"
     and no WebKit exists here to reproduce it, so the app itself keeps score:
     bootPending is set before the deal and cleared on a clean end; two opens in a
     row that never cleared it => deal only the newest LIGHT_CAP cards. The
     simulated history below is exactly what a crashed open leaves behind. */
  const LIGHT_CAP = 24, LIGHT_N = Math.min(LIGHT_CAP, NPLANTS);
  const diagOf = page => page.evaluate(() => JSON.parse(localStorage.getItem('timber-diag-v1') || 'null'));
  // 9a. a clean first open: pending is armed, nothing failed, no cap, no pill
  ctx = await browser.newContext(); page = await ctx.newPage();
  const errs9 = []; page.on('pageerror', e => errs9.push(String(e)));
  await page.goto(URL); await deckSettled(page);
  let dg = await diagOf(page);
  let l = await page.evaluate(() => ({ cards: document.querySelectorAll('.card').length, pill: document.getElementById('lightPill').hidden, tag: document.getElementById('modeTag').textContent }));
  check('boot sentinel: clean open arms bootPending, zero fails, full deck, no pill',
    dg && dg.bootPending === true && dg.bootFails === 0 && dg.lightMode === false && l.cards === NPLANTS && l.pill && l.tag === '' && errs9.length === 0,
    JSON.stringify({ dg, l, errs9 }));
  // a clean end (pagehide) clears the flag — closing the tab must never count as a crash
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  dg = await diagOf(page);
  check('boot sentinel: pagehide marks the open clean', dg.bootPending === false && dg.bootFails === 0, JSON.stringify(dg));
  await ctx.close();
  // 9b. ONE open that never ended cleanly: counted, but still the full deck
  ctx = await browser.newContext(); page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('timber-diag-v1', JSON.stringify({ bootPending: true, bootFails: 0 })));
  await page.goto(URL); await deckSettled(page);
  dg = await diagOf(page);
  l = await page.evaluate(() => ({ cards: document.querySelectorAll('.card').length, pill: document.getElementById('lightPill').hidden }));
  check('boot sentinel: one failed open -> fails=1, full deck, no pill', dg.bootFails === 1 && dg.lightMode === false && l.cards === NPLANTS && l.pill, JSON.stringify({ dg, l }));
  await ctx.close();
  // 9c. TWO in a row: light mode — capped deck, pill, foot tag, saved progress untouched
  ctx = await browser.newContext(); page = await ctx.newPage();
  const errs9c = []; page.on('pageerror', e => errs9c.push(String(e)));
  await page.addInitScript(() => {
    if (localStorage.getItem('seeded')) return;           /* only the first load of this context is the crashed history */
    localStorage.setItem('seeded', '1');
    localStorage.setItem('timber-diag-v1', JSON.stringify({ bootPending: true, bootFails: 1 }));
    localStorage.setItem('timber-progress-v1', '{"fp":"sentinel-probe"}');
  });
  await page.goto(URL); await deckSettled(page);
  dg = await diagOf(page);
  l = await page.evaluate(() => ({ cards: document.querySelectorAll('.card').length, pill: document.getElementById('lightPill').hidden, left: document.getElementById('left').textContent, tag: document.getElementById('modeTag').textContent, progress: localStorage.getItem('timber-progress-v1') }));
  check('boot sentinel: two failed opens -> light mode deals only the newest cards, pill + foot tag shown',
    dg.lightMode === true && dg.bootFails === 2 && l.cards === LIGHT_N && l.left === String(LIGHT_N) && !l.pill && /light mode/.test(l.tag) && errs9c.length === 0,
    JSON.stringify({ dg, l, errs9c }));
  await page.click('#learn'); await page.waitForTimeout(450);
  l = await page.evaluate(() => localStorage.getItem('timber-progress-v1'));
  check('light mode: a swipe never writes over the saved full-deck progress', l === '{"fp":"sentinel-probe"}', String(l));
  // a light open that survives must NOT reset the mode, or the app alternates crash/crash/light forever
  await page.reload(); await deckSettled(page);
  dg = await diagOf(page);
  l = await page.evaluate(() => document.querySelectorAll('.card').length);
  check('light mode sticks across a clean reload', dg.lightMode === true && dg.bootFails === 0 && l === LIGHT_N, JSON.stringify({ dg, l }));
  // the pill is the way out: full deck, counter reset, diagnostic query dropped
  await page.click('#lightPill'); await page.waitForLoadState('load'); await deckSettled(page);
  dg = await diagOf(page);
  l = await page.evaluate(() => ({ cards: document.querySelectorAll('.card').length, pill: document.getElementById('lightPill').hidden }));
  check('light pill: tap returns the full deck and clears the mode', dg.lightMode === false && dg.bootFails === 0 && l.cards === NPLANTS && l.pill && errs9c.length === 0, JSON.stringify({ dg, l, errs9c }));
  await ctx.close();

  /* ---- 10. Report a problem: last error is captured, the report reads it back, copy works ---- */
  ctx = await browser.newContext(); ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  page = await ctx.newPage();
  await page.goto(URL); await page.waitForTimeout(300);
  await page.evaluate(() => setTimeout(() => { throw new Error('edge-probe-error'); }, 0)); await page.waitForTimeout(200);
  dg = await diagOf(page);
  check('report: an uncaught error is recorded with build and time', dg.lastError && /edge-probe-error/.test(dg.lastError.msg) && dg.lastError.build && dg.lastError.at, JSON.stringify(dg.lastError));
  await page.click('#menuBtn'); await page.waitForTimeout(350);
  await page.click('#diagRow'); await page.waitForTimeout(400);
  let rep = await page.evaluate(() => ({ open: document.getElementById('diag').classList.contains('open'), text: document.getElementById('diagText').textContent, focus: document.activeElement && document.activeElement.id }));
  check('report: opens from the menu, names build, deck, device and the last error',
    rep.open && rep.text.includes('build') && rep.text.includes(`of ${NPLANTS}`) && rep.text.includes('edge-probe-error') && rep.text.includes('HeadlessChrome') && rep.focus === 'diagClose',
    JSON.stringify(rep));
  await page.click('#diagCopy'); await page.waitForTimeout(150);
  const copied = await page.evaluate(() => ({ label: document.getElementById('diagCopy').textContent, clip: navigator.clipboard.readText().catch(() => '') }));
  const clipText = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  check('report: Copy puts the report on the clipboard', copied.label === 'Copied ✓' && clipText.startsWith('Timber report'), JSON.stringify({ copied: copied.label, clip: clipText.slice(0, 40) }));
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(450);   // hotkeys must be inert behind the dialog
  const untouched = await page.evaluate(() => document.getElementById('done').textContent === '0');
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  rep = await page.evaluate(() => ({ open: document.getElementById('diag').classList.contains('open'), focus: document.activeElement && document.activeElement.id }));
  check('report: swipe keys inert while open, Escape closes and returns focus to the menu', untouched && !rep.open && rep.focus === 'menuBtn', JSON.stringify({ untouched, rep }));
  await ctx.close();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (fails.length) fails.forEach(f => console.log(' FAIL:', f));
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
