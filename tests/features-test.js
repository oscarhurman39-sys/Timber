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
  await page.waitForTimeout(450);
}

// click the correct (or a wrong) option in the current quiz round, return the answer plant
const answerRound = (page, correctly) => page.evaluate(right => {
  const m = document.getElementById('qQuestion').textContent.match(/“([\s\S]+)”/);
  const p = PLANTS.find(pl => Object.values(pl).some(v => v === m[1]));
  const want = document.getElementById('qOptions').dataset.round === 'reverse' ? p.latin : p.common;
  const btns = [...document.querySelectorAll('#qOptions .q-opt')];
  (right ? btns.find(b => b.textContent === want) : btns.find(b => b.textContent !== want)).click();
  return { common: p.common, latin: p.latin };
}, correctly);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto(URL); await page.waitForTimeout(400);

  /* ---- PHOTO_SWAP: both frames of a two-photo card must actually load ----
     markHot() used to set src on `.tphoto img` — the FIRST image only — so a swap
     card's <img class="alt"> never got a src. It had been loading anyway as a side
     effect of tricklePhotos setting src on every buried image; r79 turned that into
     fetch() (correctly — 1.1GB of decode targets) and the swap silently lost its
     second frame: every two-photo card blinked to black and back to the SAME photo
     for twelve days. Nothing asserted the alt was loaded, so nothing noticed.
     This does. It checks the FETCH window, where the alt must already carry a src,
     and that at least one swap card exists so the check cannot pass on nothing. */
  await deckSettled(page);
  const swapLoad = await page.evaluate(() => {
    const live = [...document.querySelectorAll('#deck .card:not([data-gone])')];
    const near = live.slice(-FETCH_DEPTH);
    const swaps = near.filter(c => c.querySelector('.tphoto.swap'));
    const bad = swaps.filter(c => [...c.querySelectorAll('.tphoto img')].some(i => !i.getAttribute('src')));
    return { total: document.querySelectorAll('.tphoto.swap').length, near: swaps.length,
             bad: bad.map(c => c.querySelector('h2')?.textContent) };
  });
  check('deck has at least one two-photo card to test', swapLoad.total >= 1, JSON.stringify(swapLoad));
  check(`every swap card in the fetch window carries a src on BOTH frames (${swapLoad.near} in window)`,
    swapLoad.near >= 1 && swapLoad.bad.length === 0, JSON.stringify(swapLoad));
  if (swapLoad.near >= 1) {
    const altOk = await page.waitForFunction(() => {
      const live = [...document.querySelectorAll('#deck .card:not([data-gone])')];
      const top = live.slice(-FETCH_DEPTH).filter(c => c.querySelector('.tphoto.swap'));
      return top.every(c => { const a = c.querySelector('.tphoto img.alt'); return a && a.complete && a.naturalWidth > 0; });
    }, null, { timeout: 15000 }).then(() => true).catch(() => false);
    check('the alt frame decodes to real pixels (not a broken or empty image)', altOk);
  }

  /* ================= WS2: quiz v2 ================= */

  /* ---- round variety + reverse options ---- */
  const rounds = await page.evaluate(() => {
    openQuiz();
    const seen = new Set();
    let reverseOpts = null;
    for (let i = 0; i < 60; i++) {
      nextQuestion();
      const r = document.getElementById('qOptions').dataset.round;
      seen.add(r);
      if (r === 'reverse' && !reverseOpts)
        reverseOpts = [...document.querySelectorAll('#qOptions .q-opt')].map(b => b.textContent);
      if (r === 'trade' && !window._tradeQ) window._tradeQ = document.getElementById('qQuestion').textContent;
    }
    // trade rounds need the answer plant to have a UNIQUE retail — rare in a 57-plant
    // deck, so force the picker onto such a plant instead of hoping random sampling hits one
    const uniqueRetail = PLANTS.find(a => a.retail && PLANTS.filter(p => p.retail === a.retail).length === 1);
    if (uniqueRetail) {
      const orig = pickWeightedPlant;
      pickWeightedPlant = () => uniqueRetail;
      for (let i = 0; i < 60 && !window._tradeQ; i++) {
        nextQuestion();
        if (document.getElementById('qOptions').dataset.round === 'trade') {
          seen.add('trade');
          window._tradeQ = document.getElementById('qQuestion').textContent;
        }
      }
      pickWeightedPlant = orig;
    }
    closeQuiz();
    const latins = new Set(PLANTS.map(p => p.latin));
    return {
      seen: [...seen], tradeSupported: !!uniqueRetail,
      reverseOptsAreLatin: reverseOpts ? reverseOpts.every(t => latins.has(t)) : null,
      tradeQ: window._tradeQ || null,
    };
  });
  check('classic and reverse rounds both appear',
    rounds.seen.includes('classic') && rounds.seen.includes('reverse'), JSON.stringify(rounds.seen));
  check('trade rounds appear when a unique retail exists',
    !rounds.tradeSupported || rounds.seen.includes('trade'), JSON.stringify(rounds));
  check('reverse rounds offer latin names as options', rounds.reverseOptsAreLatin === true,
    JSON.stringify(rounds.reverseOptsAreLatin));
  if (rounds.tradeQ) check('trade question quotes the retail price', /“£/.test(rounds.tradeQ), rounds.tradeQ);

  /* ---- weakest-first bias ----
     pickWeightedPlant weights each plant 1/(box+1). Park every plant but PLANTS[0]
     in box 5 (weight 1/6) and leave PLANTS[0] unseen (weight 1), so
        p(weakest) = 1 / (1 + (N-1)/6) = 6 / (N+5)
     against uniform 1/N. Both the expected value and the pass threshold are
     DERIVED from N: this assertion used to hardcode ">= 18", calibrated when the
     deck was 57 plants. At 128 plants 18 is the expected value itself, so the
     test failed about half the time on chance alone. Draws are sized so that
     "biased" and "uniform" stay several sigma apart however big the deck gets. */
  const DRAWS = 4000;
  const bias = await page.evaluate((draws) => {
    const srs = {};
    PLANTS.forEach((p, i) => { if (i > 0) srs[p.latin] = { box: 5, due: '2099-01-01' }; }); // PLANTS[0] unseen
    localStorage.setItem('timber-srs-v1', JSON.stringify(srs));
    let hits = 0;
    for (let i = 0; i < draws; i++) if (pickWeightedPlant() === PLANTS[0]) hits++;
    localStorage.removeItem('timber-srs-v1');
    return hits;
  }, DRAWS);
  const pBias = 6 / (NPLANTS + 5);
  const expected = DRAWS * pBias;
  const sd = Math.sqrt(DRAWS * pBias * (1 - pBias));
  const uniform = DRAWS / NPLANTS;
  // 4 sigma below the biased mean: ~1-in-30,000 false failures, and still far above uniform
  const floor = Math.max(uniform * 2, expected - 4 * sd);
  check('picker biases toward the weakest plant', bias >= floor,
    `weakest picked ${bias}/${DRAWS} — expected ≈${expected.toFixed(0)} (±${sd.toFixed(0)}), uniform would be ≈${uniform.toFixed(0)}, floor ${floor.toFixed(0)}`);

  /* ---- session summary + SRS wiring on wrong answers ---- */
  await page.click('#menuBtn'); await page.waitForTimeout(350);
  await page.click('#quizRow'); await page.waitForTimeout(400);
  await answerRound(page, true); await page.waitForTimeout(1100);
  const missed = await answerRound(page, false); await page.waitForTimeout(300);
  await page.click('#quizClose'); await page.waitForTimeout(200);
  const summary = await page.evaluate(() => ({
    visible: !document.getElementById('qSummary').hidden,
    text: document.getElementById('qSummaryStats').textContent,
    stillOpen: document.getElementById('quiz').classList.contains('open'),
  }));
  check('first close shows session summary', summary.visible && summary.stillOpen, JSON.stringify(summary));
  check('summary counts the session (1/2)', /1 \/ 2/.test(summary.text), summary.text);
  check('summary names the missed plant as weakest', summary.text.includes(missed.common), summary.text);
  const missedSRS = await page.evaluate(lat => {
    const d = JSON.parse(localStorage.getItem('timber-srs-v1') || '{}');
    return d[lat] || null;
  }, missed.latin);
  check('wrong quiz answer still writes SRS (due tomorrow)',
    missedSRS && missedSRS.due === await page.evaluate(() => srsDateStr(1)), JSON.stringify(missedSRS));
  await page.click('#qSummaryClose'); await page.waitForTimeout(200);
  check('summary Done closes the quiz',
    !(await page.evaluate(() => document.getElementById('quiz').classList.contains('open'))));

  /* ================= WS3: deck filters ================= */
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload(); await page.waitForTimeout(400);

  await page.click('#menuBtn'); await page.waitForTimeout(350);
  const chips = await page.evaluate(() =>
    [...document.querySelectorAll('#filterChips .chip')].map(c => ({
      id: c.dataset.f, n: +c.querySelector('small').textContent, disabled: c.disabled })));
  check('filter chips render from data', chips.length >= 4, JSON.stringify(chips.map(c => c.id)));
  check('zero-match chips are disabled, others enabled',
    chips.every(c => c.disabled === (c.n === 0)), JSON.stringify(chips));

  /* need n >= 2: swiping a 1-card filtered view empties it, which auto-clears the
     filter — the toggle-off steps below assume the filter is still active */
  const typeChip = chips.find(c => (c.id.startsWith('type:') || c.id.startsWith('hard:')) && c.n > 1 && c.n < NPLANTS);
  const progressSnap = await page.evaluate(() => localStorage.getItem('timber-progress-v1'));
  if (typeChip) {
    await page.click(`#filterChips .chip[data-f="${typeChip.id}"]`); await page.waitForTimeout(350);
    await deckSettled(page);
    const st = await page.evaluate(() => ({
      cards: document.querySelectorAll('.card').length,
      sheetOpen: document.getElementById('sheet').classList.contains('open'),
      progress: localStorage.getItem('timber-progress-v1'),
    }));
    check('data chip filters the deck to its count', st.cards === typeChip.n, JSON.stringify({ st: st.cards, want: typeChip.n }));
    check('applying a filter closes the menu', !st.sheetOpen);
    check('filter never touches saved progress', st.progress === progressSnap);

    /* swipe inside filter: SRS written, progress untouched */
    const filtTop = await page.evaluate(() => {
      const cards = document.querySelectorAll('.card:not([data-gone])');
      return PLANTS[+cards[cards.length - 1].dataset.idx].latin;
    });
    await dragCard(page, 160);
    const afterSwipe = await page.evaluate(lat => ({
      srs: (JSON.parse(localStorage.getItem('timber-srs-v1') || '{}'))[lat] || null,
      progress: localStorage.getItem('timber-progress-v1'),
    }), filtTop);
    check('swipe in filtered deck writes SRS', !!afterSwipe.srs, JSON.stringify(afterSwipe.srs));
    check('swipe in filtered deck leaves progress byte-identical', afterSwipe.progress === progressSnap);

    /* toggle chip off restores the full deck */
    await page.click('#menuBtn'); await page.waitForTimeout(350);
    check('active chip is marked on in menu',
      await page.evaluate(id => document.querySelector(`#filterChips .chip[data-f="${id}"]`).classList.contains('on'), typeChip.id));
    await page.click(`#filterChips .chip[data-f="${typeChip.id}"]`); await page.waitForTimeout(350);
    await deckSettled(page);
    const restored = await page.evaluate(() => ({
      cards: document.querySelectorAll('.card').length,
      done: +document.getElementById('done').textContent,
    }));
    check('clearing the filter restores the full deck', restored.cards === NPLANTS && restored.done === 0, JSON.stringify(restored));
    await page.click('.sheet .scrim', { position: { x: 15, y: 300 } }); await page.waitForTimeout(350);
  } else {
    check('data chip filters the deck to its count', false, 'no chip with 2<=n<NPLANTS in data — inspect FILTER_DEFS');
  }

  /* filter ↔ review: one ephemeral view at a time */
  await page.evaluate(() => {
    const srs = {};
    PLANTS.forEach((p, i) => { if (i < 2) srs[p.latin] = { box: 1, due: srsDateStr(0) }; });
    localStorage.setItem('timber-srs-v1', JSON.stringify(srs));
  });
  if (typeChip) {
    await page.click('#menuBtn'); await page.waitForTimeout(350);
    await page.click(`#filterChips .chip[data-f="${typeChip.id}"]`); await page.waitForTimeout(350);
    await page.click('#menuBtn'); await page.waitForTimeout(350);
    await page.click('#reviewRow'); await page.waitForTimeout(350);
    const cross = await page.evaluate(() => ({
      cards: document.querySelectorAll('.card').length,
      review: reviewMode, filter: activeFilter,
    }));
    check('entering review clears an active filter', cross.review && cross.filter === null && cross.cards === 2, JSON.stringify(cross));
    await page.click('#menuBtn'); await page.waitForTimeout(350);
    await page.click('#reviewRow'); await page.waitForTimeout(350); // exit review (also closes the sheet)
    await deckSettled(page);
    check('exiting review lands on the full deck',
      await page.evaluate(() => document.querySelectorAll('.card').length) === NPLANTS);
  }

  /* ================= WS4: fuzzy search ================= */
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await page.waitForTimeout(400);
  const firstHit = async q => {
    await page.evaluate(() => { openSearch(); });
    await page.fill('#searchInput', q); await page.waitForTimeout(150);
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('.s-row .s-names b')].map(b => b.textContent));
    await page.evaluate(() => closeSearch());
    return rows;
  };
  check('typo griselina finds New Zealand Broadleaf', (await firstHit('griselina')).includes('New Zealand Broadleaf'));
  check('typo nandena finds Heavenly Bamboo', (await firstHit('nandena')).includes('Heavenly Bamboo'));
  check('exact match ranks first', (await firstHit('nandina'))[0] === 'Heavenly Bamboo');
  check('cultivar search firepower hits its plant', (await firstHit('firepower')).includes('Heavenly Bamboo'));
  check('multi-word query works', (await firstHit('hot lips')).includes('Hot Lips Sage'));
  check('gibberish shows no-match message', (await firstHit('zzqqxx')).length === 0);
  check('empty query lists the whole deck', (await firstHit('')).length === NPLANTS);

  /* ================= WS5: stats dashboard ================= */
  await page.click('#menuBtn'); await page.waitForTimeout(350);
  await page.click('#statsRow'); await page.waitForTimeout(350);
  const stats = await page.evaluate(() => ({
    open: document.getElementById('stats').classList.contains('open'),
    text: document.getElementById('statsContent').textContent,
    cols: document.querySelectorAll('.st-boxes .col').length,
  }));
  check('stats overlay opens from menu', stats.open);
  check('stats shows learned tally', new RegExp(`0 / ${NPLANTS}`).test(stats.text), stats.text.slice(0, 60));
  check('stats shows 6 review-box columns (new + 5)', stats.cols === 6, 'cols=' + stats.cols);
  check('stats shows weakest plants', /Weakest plants/.test(stats.text));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  check('Escape closes stats, focus returns to menu button', await page.evaluate(() =>
    !document.getElementById('stats').classList.contains('open') && document.activeElement.id === 'menuBtn'));

  /* ================= WS6: photos on search sheets ================= */
  await page.evaluate(() => { openSearch(); });
  await page.fill('#searchInput', 'nandina'); await page.waitForTimeout(150);
  await page.click('.s-row'); await page.waitForTimeout(300);
  const photo = await page.evaluate(() => {
    const img = document.querySelector('#searchDetail .d-photo img');
    return img ? { src: img.getAttribute('src') } : null;
  });
  /* the sheet resolves its photo through photoSrc(), which points at the
     card-sized derivative tools/optimise-photos.js builds — not the master */
  check('search detail carries a photo slot with slugged src',
    photo && /^photos\/card\/[a-z0-9-]+\.webp$/.test(photo.src), JSON.stringify(photo));
  await page.evaluate(() => {  // a missing photo file must hide the whole strip
    document.querySelector('#searchDetail .d-photo img').dispatchEvent(new Event('error'));
  });
  check('failed photo hides its strip (no broken image)', await page.evaluate(() =>
    document.querySelector('#searchDetail .d-photo').style.display === 'none'));
  await page.click('#dCustomer'); await page.waitForTimeout(200);
  check('customer view carries the photo slot too',
    await page.evaluate(() => !!document.querySelector('#searchDetail .d-photo img')));
  await page.evaluate(() => closeSearch());

  /* ================= UI polish: learn bar, richer results, recents, month dots ================= */
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await page.waitForTimeout(400);
  check('learn bar starts empty',
    await page.evaluate(() => document.getElementById('learnBar').style.width) === '0%');
  await dragCard(page, 160);
  const barW = await page.evaluate(() => parseFloat(document.getElementById('learnBar').style.width));
  check('learn bar grows after a learn swipe', barW > 0 && barW < 100, 'width=' + barW);

  await page.evaluate(() => { openSearch(); });
  await page.fill('#searchInput', 'nandina'); await page.waitForTimeout(150);
  check('result rows carry a type/peak sub-line',
    await page.evaluate(() => {
      const sub = document.querySelector('.s-row .s-sub');
      return !!sub && sub.textContent.length > 0;
    }));
  await page.click('.s-row'); await page.waitForTimeout(250);
  check('detail shows the 12-month peak strip when peak parses',
    await page.evaluate(() => document.querySelectorAll('#searchDetail .mdots span').length === 12
      && document.querySelectorAll('#searchDetail .mdots span.on').length > 0));
  check('share button stays hidden without navigator.share',
    await page.evaluate(() => !navigator.share ? document.getElementById('dShare').hidden : true));
  await page.evaluate(() => closeSearch());
  await page.evaluate(() => { openSearch(); }); await page.waitForTimeout(200);
  const recent = await page.evaluate(() => ({
    chip: document.querySelector('.r-chip') ? document.querySelector('.r-chip').textContent : null,
    stored: JSON.parse(localStorage.getItem('timber-recent-v1') || '[]'),
  }));
  check('viewed plant appears as a recently-viewed chip',
    recent.chip === 'Heavenly Bamboo' && recent.stored.includes('Nandina domestica'), JSON.stringify(recent));
  await page.click('.r-chip'); await page.waitForTimeout(250);
  check('recent chip opens the plant detail',
    (await page.evaluate(() => document.getElementById('searchDetail').textContent)).includes('Nandina domestica'));
  await page.evaluate(() => closeSearch());

  /* keyboard: ArrowDown from the input walks into the results */
  await page.evaluate(() => { openSearch(); }); await page.waitForTimeout(200);
  await page.focus('#searchInput');
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(100);
  check('ArrowDown moves focus from input to first result',
    await page.evaluate(() => document.activeElement.classList.contains('s-row')));
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(100);
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(100);
  check('ArrowUp from first result returns to the input',
    await page.evaluate(() => document.activeElement.id === 'searchInput'));
  await page.evaluate(() => closeSearch());

  /* ================= WS7: focus trap ================= */
  await page.click('#menuBtn'); await page.waitForTimeout(350);
  await page.click('#statsRow'); await page.waitForTimeout(350);
  await page.keyboard.press('Tab'); // statsClose is the only focusable — Tab must wrap, not escape
  check('Tab cannot escape an open overlay', await page.evaluate(() =>
    document.getElementById('stats').contains(document.activeElement)));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);

  /* ================= go to card (search → deck) ================= */

  /* ---- riffle path: deepest live card in the stack, via the search detail button ---- */
  const g1 = await page.evaluate(() => {
    const live = [...document.querySelectorAll('#deck .card:not([data-gone])')];
    const bottom = +live[0].dataset.idx;
    const before = { order: order.length, history: history.length, learned: learnedCount };
    openSearch(); showPlant(bottom);
    const btn = !!document.getElementById('dGoCard');
    if (btn) document.getElementById('dGoCard').click();
    return { bottom, before, btn, searchOpen: search.classList.contains('open') };
  });
  check('search detail has a Go to card button', g1.btn);
  check('go-to-card closes the search sheet', !g1.searchOpen);
  /* Budget, not just a backstop. A riffle to the deepest card takes ~2.6s at 218
     cards; it took 34s before the far half of the cut was batched in one DOM pass,
     and this wait silently absorbed the whole slide from one to the other until it
     finally blew the old 30s cap. 12s is ~4x headroom and fails loudly next time. */
  await page.waitForFunction(() => gotoTimer === null, null, { timeout: 12000 });
  await page.waitForTimeout(450); // let the last tuck land
  const g2 = await page.evaluate(() => ({
    top: +[...document.querySelectorAll('#deck .card:not([data-gone])')].pop().dataset.idx,
    order: order.length, history: history.length, learned: learnedCount,
  }));
  check('riffle surfaces the searched card', g2.top === g1.bottom, `top ${g2.top} want ${g1.bottom}`);
  check('riffle is a cut, not a swipe — nothing recorded',
    g2.order === g1.before.order && g2.history === g1.before.history && g2.learned === g1.before.learned,
    JSON.stringify({ before: g1.before, after: { order: g2.order, history: g2.history, learned: g2.learned } }));

  /* ---- rewind path: skip the surfaced card, then go-to-card must undo it back ---- */
  const g3 = await page.evaluate(() => {
    const t = +[...document.querySelectorAll('#deck .card:not([data-gone])')].pop().dataset.idx;
    act(false);
    return t;
  });
  await page.waitForTimeout(500);
  await page.evaluate(t => { openSearch(); showPlant(t); document.getElementById('dGoCard').click(); }, g3);
  await page.waitForFunction(() => gotoTimer === null, null, { timeout: 12000 });
  await page.waitForTimeout(450);
  const g4 = await page.evaluate(() => {
    const top = +[...document.querySelectorAll('#deck .card:not([data-gone])')].pop().dataset.idx;
    return { top, stillInHistory: history.some(h => h.idx === top) };
  });
  check('go-to-card rewinds a swiped card back on top', g4.top === g3 && !g4.stillInHistory,
    `top ${g4.top} want ${g3} inHistory ${g4.stillInHistory}`);

  /* ---- no JS errors anywhere ---- */
  check('no page errors', pageErrors.length === 0, pageErrors.join(' | '));

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failures.length) { console.log('FAILURES:'); failures.forEach(f => console.log(' -', f)); }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
