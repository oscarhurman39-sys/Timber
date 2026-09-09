/*
  deck-fuzz.js — the deck's state machine, driven at random and judged on invariants.

  Every other browser suite drives ONE feature and checks what that feature did.
  This one does the opposite: it interleaves every action that can touch the deck —
  go-to-card, swipes, undo, hold-to-rewind, filters, review mode, reset — in a random
  order, interrupting the go-to-card arrival at every phase of its arc, and after each
  step asks only "is the deck still coherent?".

  That is the gap it fills. The bugs this catches are not feature bugs, they are
  COMBINATION bugs: two ephemeral views entered in the wrong order, a timer that
  outlives the run that armed it, a card that ends up in the deck and the history at
  once. Nobody writes a test for a sequence nobody thought of, so the sequence is
  generated instead.

  Seeded and deterministic: a failure prints its seed, and
      node tests/deck-fuzz.js --seed 987654321
  replays exactly that run. Never make this suite random-per-run — a flake nobody can
  reproduce is worse than no coverage at all.

  THE INVARIANTS ARE THE SPEC. Read them before changing one. Two of them are scoped
  to the full deck on purpose:
    · learnedCount is the count of right-swipes still in history — but review and
      filter deliberately keep the GLOBAL count while their own history is empty (both
      back it up on entry and restore it on exit), so inside an ephemeral view that
      identity is not the contract and asserting it there asserts the wrong thing;
    · every plant is accounted for exactly once — true of the full deck, meaningless
      of a filtered view, which is a slice by definition.
*/
const { chromium } = require('playwright');
const NPLANTS = require('../tools/plant-data.js')
  .readDeck(require('fs').readFileSync(require('path').join(__dirname, '..', 'timber.html'), 'utf8')).length;

const URL = 'http://localhost:8477/timber.html';
const STEPS = 120;
/* Three fixed seeds, chosen because they exercise different orderings, not because
   three is magic. Add one rather than replacing one — an old seed is a regression
   test for whatever it once caught. */
const SEEDS = [1234567, 987654321, 42];

const argSeed = (() => { const i = process.argv.indexOf('--seed'); return i === -1 ? null : Number(process.argv[i + 1]); })();

/* Runs entirely inside the page: the whole point is to interleave actions faster than
   a round trip per action would allow, and to look at the live state between them. */
async function runSeed(browser, seed) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto(URL);
  await page.waitForFunction(() => !document.getElementById('deck').hasAttribute('data-dealing'));

  const out = await page.evaluate(async ([SEED, STEPS]) => {
    let s = SEED;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const bad = [];
    let staged = 0;                              /* how many steps caught a deal in flight */

    const judge = (step, action) => {
      const domAll = [...document.querySelectorAll('#deck .card')];
      const dom = domAll.filter(c => !c.dataset.gone).map(c => +c.dataset.idx);
      const domSet = new Set(dom);
      const hist = history.map(h => h.idx);
      const note = (what, extra) => bad.push({ step, action, what, extra });

      /* 1 — a card is in the deck or in the history, never both */
      const both = hist.filter(i => domSet.has(i));
      if (both.length) note('idx in both deck and history', both.slice(0, 4));

      /* 2 — order is the deck's membership, with no duplicates */
      const os = new Set(order);
      if (os.size !== order.length) note('order has duplicates', order.length - os.size);
      if (os.size !== domSet.size || [...os].some(i => !domSet.has(i)))
        note('order != live DOM', { order: os.size, dom: domSet.size });

      /* 3 — full deck only: every plant is somewhere, exactly once */
      if (!reviewMode && !activeFilter) {
        const seen = new Set([...dom, ...hist]);
        if (seen.size !== PLANTS.length) note('plants unaccounted for', { seen: seen.size, total: PLANTS.length });
        if (dom.length + hist.length !== PLANTS.length) note('deck + history != deck size', { deck: dom.length, history: hist.length });
      }

      /* 4 — full deck only (see the header): the starred count is the history's */
      if (!reviewMode && !activeFilter) {
        const learned = history.filter(h => h.learned).length;
        if (learnedCount !== learned) note('learnedCount drift', { learnedCount, learned });
      }

      /* 5 — an idle deck carries no half-finished go-to-card arrival */
      if (gotoCard === null && gotoTimer === null) {
        const stuck = domAll.filter(c => c.dataset.goto || c.classList.contains('drawn'));
        if (stuck.length) note('drawn state left on an idle deck', stuck.length);
      }

      stackCheck(step, action);                  /* 6 — see below; also run mid-deal */
    };

    /* 6 — liveStack() is what gets SAVED, so a wrong one is silently corrupted progress.
       It must equal the pending cards plus the standing ones, exactly and without
       duplicates. Run SEPARATELY from the rest because the state worth testing is the
       one where dealPending is non-empty — a staged deal, or the middle of a rewind
       restore — and the settled judgement above deliberately flushes that away first.
       Learned the hard way: the first version of this file only ever checked liveStack
       after flushDeal(), which made dealPending always null and the assertion vacuous.
       A control that corrupted liveStack outright still passed. */
    const stackCheck = (step, action) => {
      const dom = [...document.querySelectorAll('#deck .card:not([data-gone])')].map(c => +c.dataset.idx);
      const ls = liveStack(), lset = new Set(ls);
      const note = (what, extra) => bad.push({ step, action, what, extra });
      if (lset.size !== ls.length) note('liveStack has duplicates', ls.length - lset.size);
      const want = new Set([...(dealPending || []), ...dom]);
      if (lset.size !== want.size || [...want].some(i => !lset.has(i)))
        note('liveStack != pending + DOM', { liveStack: lset.size, want: want.size, pending: (dealPending || []).length });
      return !!dealPending;
    };

    /* A DETERMINISTIC PROLOGUE, because the most fragile path in the deck is also the
       one chance is worst at reaching. Going to a card you already swiped restores every
       card in between, and that restore is STAGED — 16 built at once, the rest in timer
       slices that have to land in the middle of the stack, under the cards dealt in front
       of the animation. Reaching it at random needs a history deeper than DEAL_SYNC and
       then a goto that happens to pick from it; the first three seeds tried never did, and
       a control that staged the restore against the wrong anchor passed all of them.
       So it is set up on purpose, every run, before the random part starts. */
    const prologue = async () => {
      for (let i = 0; i < 40; i++) { act(i % 3 === 0); await sleep(30); }
      const target = history[0] && history[0].idx;
      if (target === undefined) { bad.push({ step: 'prologue', action: 'setup', what: 'no history to rewind into' }); return; }
      goToCard(target);
      if (!deck.hasAttribute('data-dealing'))
        bad.push({ step: 'prologue', action: 'goto', what: 'a 40-card restore was not staged', extra: 'it ran as one task' });
      staged++;
      stackCheck('prologue', 'staged restore');
      const predicted = liveStack();
      flushDeal();
      const after = [...document.querySelectorAll('#deck .card:not([data-gone])')].map(c => +c.dataset.idx);
      const diff = predicted.length !== after.length ? 0 : predicted.findIndex((v, i) => v !== after[i]);
      if (predicted.length !== after.length || diff !== -1)
        bad.push({ step: 'prologue', action: 'staged restore (flush)', what: 'liveStack did not predict the settled deck',
          extra: { predicted: predicted.length, after: after.length, firstDiffAt: diff } });
      stopGoto();
      await sleep(300);
      judge('prologue', 'staged restore');
    };
    await prologue();

    const ACTIONS = ['goto', 'goto', 'goto', 'swipeL', 'swipeR', 'undo', 'rewind',
      'filter', 'clearFilter', 'review', 'reset'];

    for (let step = 0; step < STEPS; step++) {
      const a = pick(ACTIONS);
      try {
        if (a === 'goto') {
          const reachable = PLANTS.map((_, i) => i).filter(i => order.includes(i) || history.some(h => h.idx === i));
          if (reachable.length) goToCard(pick(reachable));
          /* the interesting part: cut the arrival off at every phase of its arc —
             the paint wait, the rise, the hold, the drop, and after it has landed */
          await sleep(pick([30, 120, 400, 700, 900]));
        } else if (a === 'swipeL') { act(false); await sleep(120); }
        else if (a === 'swipeR') { act(true); await sleep(120); }
        else if (a === 'undo') { undo(60); await sleep(80); }
        else if (a === 'rewind') { for (let i = 0; i < 5; i++) { undo(40); await sleep(25); } stopRewind(); await sleep(60); }
        else if (a === 'filter') {
          renderFilterChips();
          const chips = [...document.querySelectorAll('#filterChips .chip')].filter(c => !c.disabled);
          if (chips.length) pick(chips).click();
          await sleep(150);
        } else if (a === 'clearFilter') { if (activeFilter) clearFilter(); await sleep(120); }
        else if (a === 'review') { if (reviewMode) exitReview(); else enterReview(); await sleep(150); }
        else if (a === 'reset') { buildDeck(); await sleep(200); }
      } catch (e) { bad.push({ step, action: a, what: 'threw', extra: String(e) }); }

      /* Judge the STAGED state first, while there is one — this is the only window in
         which dealPending is non-empty, and it is exactly the window the deal anchor
         has to get right. Then settle and judge the rest: the other invariants are
         about the deck at rest, and "mid-animation" is a legitimate state, not a fault. */
      stopGoto();                                /* before the snapshot: landing a card moves its node */
      let predicted = null;
      if (deck.hasAttribute('data-dealing')) { staged++; stackCheck(step, a + ' (mid-deal)'); predicted = liveStack(); }
      flushDeal();
      /* 7 — liveStack() is a PREDICTION of the settled deck, and flushing is the deck
         settling. They must agree card for card, in order. Membership alone is not
         enough: a staged deal handed the wrong anchor puts its cards in the wrong PLACE
         in the stack, which is the order you then swipe through, and a set comparison
         cannot see it — a control that staged the rewind restore against a null anchor
         passed every other check in this file. */
      if (predicted) {
        const after = [...document.querySelectorAll('#deck .card:not([data-gone])')].map(c => +c.dataset.idx);
        const diff = predicted.length !== after.length ? 0 : predicted.findIndex((v, i) => v !== after[i]);
        if (predicted.length !== after.length || diff !== -1)
          bad.push({ step, action: a + ' (flush)', what: 'liveStack did not predict the settled deck',
            extra: { predicted: predicted.length, after: after.length, firstDiffAt: diff } });
      }
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      judge(step, a);
      if (bad.length > 6) break;                 /* six is plenty to debug from */
    }

    flushDeal(); stopGoto();
    await sleep(200);
    judge('final', 'settle');
    return { bad, staged, order: order.length, history: history.length, cards: document.querySelectorAll('#deck .card').length };
  }, [seed, STEPS]);

  await ctx.close();
  return { seed, ...out, pageErrors };
}

(async () => {
  const browser = await chromium.launch();
  const seeds = argSeed !== null ? [argSeed] : SEEDS;
  let failed = 0;

  for (const seed of seeds) {
    const r = await runSeed(browser, seed);
    const ok = !r.bad.length && !r.pageErrors.length;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'} seed ${String(seed).padEnd(10)} ${STEPS} actions · ` +
      `deck ${r.cards}/${NPLANTS}, order ${r.order}, history ${r.history}, ${r.staged} mid-deal checks`);
    r.bad.forEach(v => console.log('   violation:', JSON.stringify(v)));
    r.pageErrors.slice(0, 3).forEach(e => console.log('   page error:', e));
    if (!ok) console.log(`   replay it with: node tests/deck-fuzz.js --seed ${seed}`);
  }

  await browser.close();
  console.log(`\n${seeds.length - failed}/${seeds.length} seeds clean (${seeds.length * STEPS} interleaved actions)`);
  process.exit(failed ? 1 : 0);
})();
