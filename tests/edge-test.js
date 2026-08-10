const { chromium } = require('playwright');
const NPLANTS = require('../tools/plant-data.js')
  .readDeck(require('fs').readFileSync(require('path').join(__dirname,'..','timber.html'),'utf8')).length;
/* Derived from timber.html, never hand-typed. Four suites used to carry a
   hardcoded copy of this number; a deck change that updated only some of
   them made the rest fail for the wrong reason. */
const URL = 'http://localhost:8477/timber.html';
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
  await page.goto(URL); await page.waitForTimeout(300);
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
  await page.click('#reset2'); await page.waitForTimeout(300);
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
  await page.waitForTimeout(150);
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

  /* ---- 7. hold-to-reset on the undo button ----
     The destructive half of a button people tap constantly, so both halves are
     asserted: a short press must undo ONE card and nothing more, and only a press
     past the 2s mark may rebuild the deck. */
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
    holding: document.getElementById('back').classList.contains('holding'),
  }));
  const holdBack = async ms => {
    const b = await page.locator('#back').boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(ms);
    await page.mouse.up();
    await page.waitForTimeout(150);
  };
  await page.click('#learn'); await page.waitForTimeout(450);
  await page.click('#learn'); await page.waitForTimeout(450);
  await page.click('#skip');  await page.waitForTimeout(450);

  // mid-hold the fill must be running, so the gesture is visibly abortable
  const b7 = await page.locator('#back').boundingBox();
  await page.mouse.move(b7.x + b7.width / 2, b7.y + b7.height / 2);
  await page.mouse.down(); await page.waitForTimeout(700);
  const midHold = await state();
  await page.mouse.up(); await page.waitForTimeout(150);
  const aborted = await state();
  check('short press: fill shows mid-hold, release undoes exactly one card',
    midHold.holding === true && aborted.holding === false &&
    aborted.history === 2 && aborted.left === String(NPLANTS - 2) && aborted.done === '2',
    JSON.stringify({ midHold, aborted }));

  await holdBack(2300);
  const reset = await state();
  check('2s hold: whole deck rebuilt, history cleared, undo re-disabled',
    reset.cards === NPLANTS && reset.left === String(NPLANTS) && reset.done === '0' &&
    reset.history === 0 && reset.disabled === true && reset.holding === false && errs7.length === 0,
    JSON.stringify({ reset, errs7 }));

  // the reset must survive a reload — buildDeck persists, it isn't just a view
  await page.reload(); await page.waitForTimeout(400);
  const afterReload = await state();
  check('2s hold: reset persisted across reload',
    afterReload.left === String(NPLANTS) && afterReload.done === '0' && afterReload.history === 0,
    JSON.stringify(afterReload));
  await ctx.close();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (fails.length) fails.forEach(f => console.log(' FAIL:', f));
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
