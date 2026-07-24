/* verify-cards.js — visual + data regression for the locked card builder.
   Run: NODE_PATH=/opt/node22/lib/node_modules node design/verify-cards.js
   Renders design/card-builder.html via file://, asserts every rating's fills
   equal the data-derived values, months match, no missing assets (design
   system section 27: missing assets error, never substitute), and saves a
   baseline screenshot to design/baseline-cards.png for eyeball regression. */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 660 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'card-builder.html'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const res = await page.evaluate(() => {
    const seg = (v, max = 5) => Array.from({ length: max }, (_, i) => {
      const r = v - i; return r >= 1 ? 1 : r <= 0 ? 0 : Math.round(r * 4) / 4;
    });
    const out = { failures: [], cards: 0 };
    const broken = [...document.images].filter(i => !i.complete || i.naturalWidth === 0);
    if (broken.length) out.failures.push('missing assets: ' + broken.map(i => i.src.split('/').pop()).join(','));
    for (const card of document.querySelectorAll('.tcard')) {
      out.cards++;
      const id = card.dataset.plantId;
      const p = window.PLANTS.find(x => x.id === id);
      const fills = (sel) => [...card.querySelectorAll(sel + ' .ricon')].map(e => +e.style.getPropertyValue('--fill'));
      const want = (name, got, exp) => {
        if (JSON.stringify(got) !== JSON.stringify(exp)) out.failures.push(`${id} ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(exp)}`);
      };
      want('pest', fills('.wrow.pest'), seg(p.pestRisk / 4));
      want('thirst', fills('.wrow.thirst'), seg(p.thirst / 4));
      want('care', fills('.wrow.care'), seg(p.careLevel / 4));
      const months = [...card.querySelectorAll('.timeline span')].map((s, i) => s.classList.contains('on') ? i + 1 : 0).filter(Boolean);
      want('months', months, p.bloomMonths);
      const hnum = card.querySelector('.hnum').textContent;
      if (hnum !== p.hardiness) out.failures.push(`${id} crest: ${hnum} != ${p.hardiness}`);
      const wiggle = !!card.querySelector('.b-wiggle');
      if (wiggle !== (p.sunMin != null)) out.failures.push(`${id} wiggle-room shown=${wiggle} but sunMin=${p.sunMin}`);
    }
    return out;
  });

  await page.screenshot({ path: path.resolve(__dirname, 'baseline-cards.png'), fullPage: true });
  await browser.close();
  const fails = res.failures.concat(errors);
  console.log(`${res.cards} cards checked; ${fails.length === 0 ? 'ALL CHECKS PASS' : 'FAILURES:'}`);
  fails.forEach(f => console.log('  FAIL: ' + f));
  process.exit(fails.length ? 1 : 0);
})();
