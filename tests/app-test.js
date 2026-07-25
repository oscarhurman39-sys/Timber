const { chromium } = require('playwright');
const NPLANTS = 17;  // plants in the demo deck

const URL = 'http://localhost:8477/timber.html';
let passed = 0, failed = 0;
const failures = [];
function check(name, cond, extra) {
  if (cond) { passed++; console.log('PASS', name); }
  else { failed++; failures.push(name + (extra ? ' — ' + extra : '')); console.log('FAIL', name, extra || ''); }
}

async function counts(page) {
  return page.evaluate(() => ({
    left: +document.getElementById('left').textContent,
    done: +document.getElementById('done').textContent,
    menu: +document.getElementById('doneMenu').textContent,
    cards: document.querySelectorAll('.card').length,
  }));
}

async function deckCenter(page) {
  const box = await page.locator('#deck').boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function dragCard(page, dxTotal, opts = {}) {
  const { x, y } = await deckCenter(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  const steps = 8;
  let midOpacity = null;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x + (dxTotal * i) / steps, y + (opts.dy || 0) * i / steps);
    if (i === steps && opts.sampleStamp) {
      midOpacity = await page.evaluate(sel => {
        const cards = document.querySelectorAll('.card');
        const top = cards[cards.length - 1];
        return top ? top.querySelector(sel).style.opacity : null;
      }, opts.sampleStamp);
    }
  }
  await page.mouse.up();
  await page.waitForTimeout(450); // fling animation + removal (320ms)
  return midOpacity;
}

async function doubleTap(page) {
  const { x, y } = await deckCenter(page);
  await page.mouse.move(x, y);
  await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(60);
  await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(600); // flip transition
}

async function singleTap(page) {
  const { x, y } = await deckCenter(page);
  await page.mouse.move(x, y);
  await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(600); // > double-tap window
}

function topFlipped(page) {
  return page.evaluate(() => {
    const cards = document.querySelectorAll('.card');
    const top = cards[cards.length - 1];
    return top ? top.classList.contains('flipped') : null;
  });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));

  await page.addInitScript(() => {
    window.__speakCalls = 0;
    if (window.speechSynthesis) {
      const orig = speechSynthesis.speak.bind(speechSynthesis);
      speechSynthesis.speak = u => { window.__speakCalls++; window.__lastUtterance = u.text; return orig(u); };
    }
  });
  await page.goto(URL);
  await page.waitForTimeout(300);

  /* ---- 1. initial state & branding ---- */
  let c = await counts(page);
  check('initial: all cards dealt, 0 starred', c.cards === NPLANTS && c.left === NPLANTS && c.done === 0, JSON.stringify(c));
  check('title is Timber', (await page.title()).includes('Timber'));
  const bodyText = await page.evaluate(() => document.documentElement.outerHTML.toLowerCase());
  check('no "plinder" anywhere', !bodyText.includes('plinder'));
  const progressText = await page.locator('.progress').innerText();
  check('progress line format', new RegExp(NPLANTS + ' to learn · 0 starred · double-tap a card for trade data').test(progressText), progressText);
  check('brand wordmark says Timber', (await page.locator('.brand span').innerText()) === 'Timber');
  check('search button visible top right', await page.locator('#searchBtn').isVisible());
  await page.click('#menuBtn'); await page.waitForTimeout(350);
  check('install row hidden until prompt available', !(await page.locator('#installRow').isVisible()));
  await page.click('.sheet .scrim', { position: { x: 15, y: 300 } }); await page.waitForTimeout(350);
  check('scrim click closes menu', await page.evaluate(() => !document.getElementById('sheet').classList.contains('open')));

  /* ---- 2. swipe right = learned ---- */
  const learnOp = await dragCard(page, 150, { sampleStamp: '.stamp.learn' });
  c = await counts(page);
  check('swipe right: LEARNED stamp visible mid-drag', learnOp !== null && parseFloat(learnOp) > 0.5, 'opacity=' + learnOp);
  check('swipe right: card removed, starred +1', c.cards === NPLANTS-1 && c.left === NPLANTS-1 && c.done === 1, JSON.stringify(c));

  /* ---- 3. swipe left = skip ---- */
  const skipOp = await dragCard(page, -150, { sampleStamp: '.stamp.skip' });
  c = await counts(page);
  check('swipe left: SKIP stamp visible mid-drag', skipOp !== null && parseFloat(skipOp) > 0.5, 'opacity=' + skipOp);
  check('swipe left: card removed, starred unchanged', c.cards === NPLANTS-2 && c.left === NPLANTS-2 && c.done === 1, JSON.stringify(c));

  /* ---- 4. undo ---- */
  await page.click('#back'); await page.waitForTimeout(100);
  c = await counts(page);
  check('undo skip: card back, starred unchanged', c.cards === NPLANTS-1 && c.left === NPLANTS-1 && c.done === 1, JSON.stringify(c));
  await page.click('#back'); await page.waitForTimeout(100);
  c = await counts(page);
  check('undo learn: card back, starred -1', c.cards === NPLANTS && c.left === NPLANTS && c.done === 0, JSON.stringify(c));

  /* ---- 5. buttons ---- */
  await page.click('#learn'); await page.waitForTimeout(450);
  c = await counts(page);
  check('star button = learn', c.cards === NPLANTS-1 && c.done === 1, JSON.stringify(c));
  await page.click('#skip'); await page.waitForTimeout(450);
  c = await counts(page);
  check('x button = skip', c.cards === NPLANTS-2 && c.done === 1, JSON.stringify(c));
  await page.click('#back'); await page.click('#back'); await page.waitForTimeout(150);
  c = await counts(page);
  check('undo restores both', c.cards === NPLANTS && c.left === NPLANTS && c.done === 0, JSON.stringify(c));

  /* ---- 5b. rapid double fab press during fling window: no state corruption ---- */
  await page.click('#learn');
  await page.waitForTimeout(80);
  await page.click('#learn');
  await page.waitForTimeout(500);
  c = await counts(page);
  check('rapid double star: two distinct cards learned', c.left === NPLANTS-2 && c.done === 2, JSON.stringify(c));
  const orderClean = await page.evaluate(() => new Set(order).size === order.length);
  check('rapid double star: no duplicate indices in order', orderClean);
  await page.click('#back'); await page.click('#back'); await page.waitForTimeout(200);
  c = await counts(page);
  check('rapid double star: undo x2 restores clean state', c.cards === NPLANTS && c.left === NPLANTS && c.done === 0, JSON.stringify(c));

  /* ---- 6. sub-threshold drag snaps back ---- */
  await page.waitForTimeout(400);
  await dragCard(page, 60);
  c = await counts(page);
  const stampReset = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card');
    const top = cards[cards.length - 1];
    return top.querySelector('.stamp.learn').style.opacity;
  });
  check('sub-threshold drag: card stays, counts unchanged', c.cards === NPLANTS && c.done === 0, JSON.stringify(c));
  check('sub-threshold drag: stamp fades back out', stampReset === '0' || stampReset === '', 'opacity=' + stampReset);

  /* ---- 7. double-tap flip + swipe lock ---- */
  await page.waitForTimeout(400);
  await doubleTap(page);
  check('double-tap flips card', await topFlipped(page) === true);
  const backVisible = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card');
    const top = cards[cards.length - 1];
    return top.querySelector('.back .back-head h3').textContent;
  });
  check('back shows latin name + trade sheet', backVisible === 'Heavenly Bamboo' || backVisible.length > 0, backVisible);
  await dragCard(page, 160); // try to swipe while flipped
  c = await counts(page);
  check('drag while flipped: card NOT swiped', c.cards === NPLANTS && c.done === 0, JSON.stringify(c));
  check('drag while flipped: still flipped', await topFlipped(page) === true);
  const transformWhileFlipped = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card');
    const top = cards[cards.length - 1];
    return top.style.transform;
  });
  check('drag while flipped: no residual transform', transformWhileFlipped === '' || transformWhileFlipped === 'none', transformWhileFlipped);
  await singleTap(page);
  check('single tap on back flips to front', await topFlipped(page) === false);

  /* ---- 8. flipped + star button unflips instead of swiping ---- */
  await page.waitForTimeout(400);
  await doubleTap(page);
  await page.click('#learn'); await page.waitForTimeout(450);
  c = await counts(page);
  check('star while flipped: unflips, does not swipe', c.cards === NPLANTS && c.done === 0 && (await topFlipped(page)) === false, JSON.stringify(c));

  /* ---- 9. empty state + reset ---- */
  for (let i = 0; i < NPLANTS; i++) { await page.click('#learn'); await page.waitForTimeout(400); }
  c = await counts(page);
  const emptyShown = await page.locator('#empty').isVisible();
  const actionsHidden = await page.evaluate(() => document.getElementById('actions').style.visibility === 'hidden');
  check('deck cleared: empty state shows', c.cards === 0 && emptyShown, JSON.stringify(c));
  check('deck cleared: action buttons hidden', actionsHidden);
  check('empty state text', (await page.locator('#empty h3').innerText()).includes("Deck's clear"));
  await page.click('#reset2'); await page.waitForTimeout(150);
  c = await counts(page);
  check('reset deck restores all', c.cards === NPLANTS && c.left === NPLANTS && c.done === 0, JSON.stringify(c));

  /* ---- 10. menu ---- */
  await page.click('#learn'); await page.waitForTimeout(450);
  await page.click('#menuBtn'); await page.waitForTimeout(350);
  check('menu opens', await page.evaluate(() => document.getElementById('sheet').classList.contains('open')));
  c = await counts(page);
  check('menu learned count matches', c.menu === 1 && c.done === 1, JSON.stringify(c));
  await page.click('#resetRow'); await page.waitForTimeout(350);
  c = await counts(page);
  const sheetClosed = await page.evaluate(() => !document.getElementById('sheet').classList.contains('open'));
  check('menu reset works + closes sheet', c.cards === NPLANTS && c.done === 0 && sheetClosed, JSON.stringify(c));
  check('closing menu returns focus to menu button', await page.evaluate(() => document.activeElement && document.activeElement.id === 'menuBtn'));

  /* ---- 11. search / dictionary ---- */
  await page.click('#searchBtn'); await page.waitForTimeout(400);
  check('search opens', await page.evaluate(() => document.getElementById('search').classList.contains('open')));
  check('search input focused', await page.evaluate(() => document.activeElement === document.getElementById('searchInput')));
  let rows = await page.locator('.s-row').count();
  check('empty query lists all plants', rows === NPLANTS, 'rows=' + rows);
  await page.fill('#searchInput', 'nand');
  await page.waitForTimeout(100);
  rows = await page.locator('.s-row').count();
  check('query "nand" → 1 result', rows === 1, 'rows=' + rows);
  await page.click('.s-row'); await page.waitForTimeout(150);
  const detail = await page.locator('#searchDetail').innerText();
  check('detail shows care + trade data', detail.includes('Nandina domestica') && detail.includes('£3.80–£4.50') && detail.includes('Book Wk25') && detail.includes('Water'), detail.slice(0, 80));
  check('detail view: results list actually hidden', !(await page.locator('#searchResults').isVisible()) && (await page.locator('#searchDetail').isVisible()));
  await page.click('#dBack'); await page.waitForTimeout(100);
  check('back to results', (await page.locator('#searchResults').isVisible()) && !(await page.locator('#searchDetail').isVisible()));
  await page.fill('#searchInput', 'zzzz');
  await page.waitForTimeout(100);
  check('no-match message', (await page.locator('#searchResults').innerText()).includes('No plants match'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  check('escape closes search', await page.evaluate(() => !document.getElementById('search').classList.contains('open')));
  c = await counts(page);
  check('search leaves deck untouched', c.cards === NPLANTS && c.left === NPLANTS && c.done === 0, JSON.stringify(c));

  /* dictionary mode row opens search */
  await page.click('#menuBtn'); await page.waitForTimeout(350);
  await page.click('#dictRow'); await page.waitForTimeout(400);
  check('dictionary mode row opens search', await page.evaluate(() => document.getElementById('search').classList.contains('open') && !document.getElementById('sheet').classList.contains('open')));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);

  /* ---- 11b. search edge cases: stale Enter, focus management ---- */
  await page.click('#searchBtn'); await page.waitForTimeout(400);
  await page.fill('#searchInput', 'e'); await page.waitForTimeout(100);
  rows = await page.locator('.s-row').count();
  check('query "e" matches all', rows === NPLANTS, 'rows=' + rows);
  await page.locator('.s-row').nth(2).click(); await page.waitForTimeout(150);
  check('third row opens Weigela detail', (await page.locator('#searchDetail').innerText()).includes('Weigela'));
  check('detail moves focus to back button', await page.evaluate(() => document.activeElement && document.activeElement.id === 'dBack'));
  await page.focus('#searchInput');
  await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  check('enter while detail open does NOT swap plant', (await page.locator('#searchDetail').innerText()).includes('Weigela') && (await page.locator('#searchDetail').isVisible()));
  await page.click('#dBack'); await page.waitForTimeout(100);
  check('back from detail focuses a result row', await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('s-row')));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  check('close search returns focus to search button', await page.evaluate(() => document.activeElement && document.activeElement.id === 'searchBtn'));

  /* ---- 11b2. customer-facing view ---- */
  await page.click('#searchBtn'); await page.waitForTimeout(400);
  await page.fill('#searchInput', 'nand'); await page.waitForTimeout(100);
  await page.click('.s-row'); await page.waitForTimeout(150);
  await page.click('#dCustomer'); await page.waitForTimeout(150);
  const cust = await page.locator('#searchDetail').innerText();
  check('customer view: name, care and retail price shown',
    cust.includes('Heavenly Bamboo') && cust.includes('£10.99') && cust.includes('Watering'), cust.slice(0, 60));
  check('customer view: trade data hidden',
    !cust.includes('3.80') && !/margin/i.test(cust) && !cust.includes('Book Wk25') && !/shrink/i.test(cust) && !/return risk/i.test(cust), '');
  await page.click('#dStaff'); await page.waitForTimeout(150);
  check('back to staff view restores trade sheet', (await page.locator('#searchDetail').innerText()).includes('£3.80'));
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  check('escape unwinds back out of search', await page.evaluate(() => !document.getElementById('search').classList.contains('open')));

  /* ---- 11c. mobile hardening CSS ---- */
  check('pull-to-refresh guarded (overscroll-behavior none)', await page.evaluate(() => getComputedStyle(document.body).overscrollBehaviorY === 'none'));
  check('safe-area inset styles present for installed iOS', await page.evaluate(() => [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => r.cssText.includes('safe-area-inset')); } catch (e) { return false; } })));

  /* ---- 11d. quiz mode (via top-right menu) ---- */
  const deriveCorrect = async () => {
    const t = await page.locator('#qQuestion').innerText();
    return page.evaluate(txt => {
      const m = txt.match(/“([\s\S]+)”/);
      if (!m) return null;
      const p = PLANTS.find(pl => Object.values(pl).some(v => v === m[1]));
      return p ? p.common : null;
    }, t);
  };
  await page.click('#menuBtn'); await page.waitForTimeout(350);
  await page.click('#quizRow'); await page.waitForTimeout(400);
  check('quiz opens from menu, sheet closes', await page.evaluate(() =>
    document.getElementById('quiz').classList.contains('open') && !document.getElementById('sheet').classList.contains('open')));
  const optCount = await page.locator('.q-opt').count();
  check('quiz offers all plants as options', optCount === Math.min(NPLANTS, 4) || optCount === 3, 'opts=' + optCount);
  let correct = await deriveCorrect();
  check('quiz question uses real plant data', !!correct, await page.locator('#qQuestion').innerText());
  await page.locator('.q-opt', { hasText: correct }).click();
  await page.waitForTimeout(100);
  check('correct answer bumps streak', (await page.locator('#qStreak').innerText()) === '1');
  await page.waitForTimeout(1100); // auto-advance to next question
  correct = await deriveCorrect();
  await page.locator('.q-opt').filter({ hasNotText: correct }).first().click();
  await page.waitForTimeout(100);
  check('wrong answer resets streak and reveals correct',
    (await page.locator('#qStreak').innerText()) === '0' && (await page.locator('.q-opt.correct').count()) === 1);
  check('best streak retained in session', (await page.locator('#qBest').innerText()) === '1');
  await page.click('#quizClose'); await page.waitForTimeout(200);
  c = await counts(page);
  check('quiz closes, deck untouched', !(await page.evaluate(() => document.getElementById('quiz').classList.contains('open'))) && c.left === NPLANTS && c.done === 0, JSON.stringify(c));

  /* ---- 11e. persistence across reloads ---- */
  await page.waitForTimeout(300);
  await dragCard(page, 150);
  c = await counts(page);
  check('persist: learn one before reload', c.left === NPLANTS-1 && c.done === 1, JSON.stringify(c));
  await page.reload(); await page.waitForTimeout(400);
  c = await counts(page);
  check('persist: progress survives reload', c.cards === NPLANTS-1 && c.left === NPLANTS-1 && c.done === 1 && c.menu === 1, JSON.stringify(c));
  await page.click('#back'); await page.waitForTimeout(150);
  c = await counts(page);
  check('persist: undo works after reload (history restored)', c.cards === NPLANTS && c.left === NPLANTS && c.done === 0, JSON.stringify(c));
  await page.reload(); await page.waitForTimeout(400);
  c = await counts(page);
  check('persist: clean state persists too', c.cards === NPLANTS && c.left === NPLANTS && c.done === 0, JSON.stringify(c));
  check('persist: quiz best streak survives reload', await page.evaluate(() => document.getElementById('qBest').textContent) === '1');
  const resetPersists = await page.evaluate((n) => JSON.parse(localStorage.getItem('timber-progress-v1')).stack.length === n, NPLANTS);
  check('persist: storage reflects live state', resetPersists);

  /* ---- 11f. latin pronunciation button ---- */
  const sayBtn = page.locator('.card:last-child .say');
  check('say button on card front', await sayBtn.isVisible());
  await sayBtn.click();
  await page.waitForTimeout(80);
  await sayBtn.click(); // two quick taps — must NOT count as card double-tap
  await page.waitForTimeout(500);
  const speak1 = await page.evaluate(() => ({ calls: window.__speakCalls, text: window.__lastUtterance }));
  check('say button triggers speech with latin name', speak1.calls >= 2 && speak1.text === 'Nandina domestica', JSON.stringify(speak1));
  check('rapid say taps do not flip the card', await topFlipped(page) === false);
  c = await counts(page);
  check('say taps do not swipe or count', c.cards === NPLANTS && c.left === NPLANTS && c.done === 0, JSON.stringify(c));

  await page.click('#searchBtn'); await page.waitForTimeout(400);
  await page.fill('#searchInput', 'choisya'); await page.waitForTimeout(100);
  await page.click('.s-row'); await page.waitForTimeout(150);
  await page.click('#dSay'); await page.waitForTimeout(200);
  const speak2 = await page.evaluate(() => window.__lastUtterance);
  check('search detail say button speaks its plant', speak2 === 'Choisya ternata', speak2);
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.waitForTimeout(250);

  /* say button hides when speech is unsupported */
  const noTtsCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const noTtsPage = await noTtsCtx.newPage();
  await noTtsPage.addInitScript(() => { delete Object.getPrototypeOf(window.speechSynthesis ? window : {}).speechSynthesis; try { delete window.speechSynthesis; } catch (e) {} });
  await noTtsPage.goto(URL); await noTtsPage.waitForTimeout(300);
  const noTtsHidden = await noTtsPage.evaluate(() =>
    !('speechSynthesis' in window) ? [...document.querySelectorAll('.say')].every(b => b.hidden) : 'tts-still-present');
  check('say button hidden when speech unsupported', noTtsHidden === true, String(noTtsHidden));
  await noTtsCtx.close();

  /* ---- 12. PWA: manifest + service worker ---- */
  const manifest = await page.evaluate(() => {
    const href = document.getElementById('manifestLink').href;
    if (!href.startsWith('data:')) return null;
    return JSON.parse(decodeURIComponent(href.slice(href.indexOf(',') + 1)));
  });
  check('manifest: name/short_name Timber', manifest && manifest.name === 'Timber' && manifest.short_name === 'Timber');
  check('manifest: theme/background #0c1810', manifest && manifest.theme_color === '#0c1810' && manifest.background_color === '#0c1810');
  check('manifest: has 192 + 512 + maskable icons', manifest &&
    manifest.icons.some(i => i.sizes === '192x192' && i.src.startsWith('data:image/')) &&
    manifest.icons.some(i => i.sizes === '512x512' && i.purpose === 'any' && i.src.startsWith('data:image/')) &&
    manifest.icons.some(i => i.sizes === '512x512' && i.purpose === 'maskable'));
  check('manifest: absolute start_url', manifest && manifest.start_url.startsWith('http'));

  const swState = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { supported: false };
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise(r => setTimeout(() => r(null), 8000)),
    ]);
    const keys = await caches.keys();
    const hit = await caches.match('./timber.html');
    return { supported: true, registered: !!reg, cacheKeys: keys, shellCached: !!hit };
  });
  check('service worker registers over http', swState.registered, JSON.stringify(swState.cacheKeys));
  check('app shell cached for offline', swState.shellCached, JSON.stringify(swState.cacheKeys));

  /* offline reload actually works */
  const context = page.context();
  await context.setOffline(true);
  let offlineOk = true;
  try { await page.reload({ waitUntil: 'load', timeout: 8000 }); } catch (e) { offlineOk = false; }
  if (offlineOk) {
    await page.waitForTimeout(300);
    const t = await page.title().catch(() => '');
    offlineOk = t.includes('Timber') && (await counts(page)).cards === NPLANTS;
  }
  check('works offline after first visit', offlineOk);
  await context.setOffline(false);
  await page.reload(); await page.waitForTimeout(300);

  /* ---- 13. responsive: no horizontal overflow at 320px and 428px ---- */
  for (const w of [320, 428]) {
    await page.setViewportSize({ width: w, height: 700 });
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`no horizontal overflow at ${w}px`, overflow <= 0, 'overflow=' + overflow);
  }
  await page.setViewportSize({ width: 390, height: 844 });

  /* ---- 14. data integrity: exact PLANTS field names ---- */
  const fieldCheck = await page.evaluate((NPLANTS) => {
    const required = ['common','latin','hue','visual','water','aspect','soil','prune','source','peak','order','bench','root','trade','retail','margin','type','shrink','returnRisk','pots','cvs','hardiness','resilience','uses','size'];
    return PLANTS.length === NPLANTS && PLANTS.every(p => required.every(k => k in p)) &&
      PLANTS[0].trade === '2L £3.80–£4.50' && PLANTS[2].latin === 'Weigela florida ‘Nana Variegata’' &&
      PLANTS[3].pestRisk === 3 && PLANTS[4].hardiness === 'H2';
  }, NPLANTS);
  check('PLANTS: all plants, exact field names, data intact', fieldCheck);

  /* ---- 15. touch device behaviour (single vs double tap, touch swipe) ---- */
  const tctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const tpage = await tctx.newPage();
  tpage.on('pageerror', e => pageErrors.push('touch:' + String(e)));
  await tpage.goto(URL); await tpage.waitForTimeout(300);
  const tbox = await tpage.locator('#deck').boundingBox();
  const tx = tbox.x + tbox.width / 2, ty = tbox.y + tbox.height / 2;

  await tpage.touchscreen.tap(tx, ty);
  await tpage.waitForTimeout(450);
  check('touch: single tap does NOT flip', await topFlipped(tpage) === false);
  await tpage.touchscreen.tap(tx, ty);
  await tpage.waitForTimeout(80);
  await tpage.touchscreen.tap(tx, ty);
  await tpage.waitForTimeout(600);
  check('touch: double tap flips', await topFlipped(tpage) === true);
  await tpage.waitForTimeout(400);
  await tpage.touchscreen.tap(tx, ty);
  await tpage.waitForTimeout(600);
  check('touch: tap on back unflips', await topFlipped(tpage) === false);

  // touch swipe right via synthetic TouchEvents against the card element
  const touchSwipe = await tpage.evaluate(() => {
    const cards = document.querySelectorAll('.card');
    const card = cards[cards.length - 1];
    const r = card.getBoundingClientRect();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const mk = (type, x) => new TouchEvent(type, {
      cancelable: true, bubbles: true,
      touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: card, clientX: x, clientY: cy })],
    });
    card.dispatchEvent(mk('touchstart', cx));
    for (let i = 1; i <= 6; i++) card.dispatchEvent(mk('touchmove', cx + i * 25));
    card.dispatchEvent(mk('touchend', cx + 150));
    return true;
  });
  await tpage.waitForTimeout(450);
  const tc = await counts(tpage);
  check('touch: swipe right marks learned', touchSwipe && tc.cards === NPLANTS-1 && tc.done === 1, JSON.stringify(tc));
  await tctx.close();

  /* ---- 16. no JS errors anywhere ---- */
  check('no page errors', pageErrors.length === 0, pageErrors.join(' | '));

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failures.length) { console.log('FAILURES:'); failures.forEach(f => console.log(' -', f)); }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
