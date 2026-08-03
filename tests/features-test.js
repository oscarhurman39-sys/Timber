const { chromium } = require('playwright');
const NPLANTS = 57;  // plants in the demo deck

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

  /* ---- weakest-first bias ---- */
  const bias = await page.evaluate(() => {
    const srs = {};
    PLANTS.forEach((p, i) => { if (i > 0) srs[p.latin] = { box: 5, due: '2099-01-01' }; }); // PLANTS[0] unseen
    localStorage.setItem('timber-srs-v1', JSON.stringify(srs));
    let hits = 0;
    for (let i = 0; i < 400; i++) if (pickWeightedPlant() === PLANTS[0]) hits++;
    localStorage.removeItem('timber-srs-v1');
    return hits;
  });
  // 57 plants: weakest weight 1 vs 1/6 each → p≈0.097, mean≈39/400; uniform would be ≈7
  check('picker biases toward the weakest plant', bias >= 18, `weakest picked ${bias}/400 (expected ≈39, uniform ≈7)`);

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

  const typeChip = chips.find(c => c.id.startsWith('type:') && c.n > 0 && c.n < NPLANTS);
  const progressSnap = await page.evaluate(() => localStorage.getItem('timber-progress-v1'));
  if (typeChip) {
    await page.click(`#filterChips .chip[data-f="${typeChip.id}"]`); await page.waitForTimeout(350);
    const st = await page.evaluate(() => ({
      cards: document.querySelectorAll('.card').length,
      sheetOpen: document.getElementById('sheet').classList.contains('open'),
      progress: localStorage.getItem('timber-progress-v1'),
    }));
    check('type chip filters the deck to its count', st.cards === typeChip.n, JSON.stringify({ st: st.cards, want: typeChip.n }));
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
    const restored = await page.evaluate(() => ({
      cards: document.querySelectorAll('.card').length,
      done: +document.getElementById('done').textContent,
    }));
    check('clearing the filter restores the full deck', restored.cards === NPLANTS && restored.done === 0, JSON.stringify(restored));
    await page.click('.sheet .scrim', { position: { x: 15, y: 300 } }); await page.waitForTimeout(350);
  } else {
    check('type chip filters the deck to its count', false, 'no partial type chip in data — inspect FILTER_DEFS');
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
  check('typo choysia finds Mexican Orange Blossom', (await firstHit('choysia')).includes('Mexican Orange Blossom'));
  check('typo nandena finds Heavenly Bamboo', (await firstHit('nandena')).includes('Heavenly Bamboo'));
  check('exact match ranks first', (await firstHit('nandina'))[0] === 'Heavenly Bamboo');
  check('cultivar search firepower hits its plant', (await firstHit('firepower')).includes('Heavenly Bamboo'));
  check('multi-word query works', (await firstHit('orange blossom')).includes('Mexican Orange Blossom'));
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
  check('search detail carries a photo slot with slugged src',
    photo && /^photos\/[a-z0-9-]+\.jpg$/.test(photo.src), JSON.stringify(photo));
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

  /* ---- no JS errors anywhere ---- */
  check('no page errors', pageErrors.length === 0, pageErrors.join(' | '));

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failures.length) { console.log('FAILURES:'); failures.forEach(f => console.log(' -', f)); }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
