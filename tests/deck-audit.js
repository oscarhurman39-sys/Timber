/* deck-audit.js — audits the WHOLE deck as a set.
   Run: NODE_PATH=/opt/node22/lib/node_modules node tests/deck-audit.js  (server on :8477)

   tools/check-plant-json.js only ever sees one incoming plant, and design/verify-cards.js
   only checks the 2-card design mock — so nothing audited the shipped deck. This does.

   It judges RENDERED outcomes, not raw fields, because the stored format differs from the
   incoming JSON (soil arrives joined, "S/W" is a valid facing the compass rule resolves).
   Auditing the raw data instead produced ~120 false alarms; auditing what the card
   actually shows produces the handful that are real.

   ERRORS fail the run. WARNINGS are printed but do not: a blank rating is honest — the
   data simply is not in yet — and the app renders it as an empty row on purpose.

   KNOWN_GAPS are pre-existing defects, listed so the suite is green on today's deck while
   still printing them every run. Fixing a card means deleting its line here. Never add a
   line to silence a NEW defect. */
const { chromium } = require('playwright');

const URL = 'http://localhost:8477/timber.html';

/* latin name -> why it is knowingly broken. Delete a line once the card is fixed. */
const KNOWN_GAPS = {
};

let failed = 0;
const errors = [], warnings = [], known = [];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.goto(URL);
  await page.waitForTimeout(1000);

  /* photos fetch in a sliding window in the live app — reveal them all for the audit */
  await page.evaluate(() =>
    document.querySelectorAll('.tphoto img').forEach(i => { if (!i.getAttribute('src') && i.dataset.psrc) i.src = i.dataset.psrc; }));
  await page.waitForTimeout(2500);

  const cards = await page.evaluate(() => {
    /* read each card as the user sees it: the rendered ink, not the source field */
    document.querySelectorAll('.deck .card').forEach(c => c.classList.remove('deep'));
    return [...document.querySelectorAll('.deck .card')].map((c) => {
      const p = PLANTS[+c.dataset.idx];
      const txt = (sel) => (c.querySelector(sel) || {}).textContent || '';
      const photo = c.querySelector('.tphoto img');
      return {
        common: p.common, latin: p.latin, hue: p.hue, hardiness: p.hardiness,
        aspectData: p.aspect || '', aspectShown: txt('.b-aspect-ink').trim(),
        sunNeed: p.sunNeed, sunMin: p.sunMin, peak: p.peak || '',
        months: [...c.querySelectorAll('.tline span.on')].length,
        crest: txt('.hnum').trim(),
        photoOk: !!photo && photo.naturalWidth > 0,
        blankRatings: ['pestRisk', 'thirst', 'careLevel', 'growthSpeed', 'sunNeed', 'sunMin']
          .filter(f => p[f] === '' || p[f] == null).length,
        sizeH: txt('.rail-h .v').trim(), sizeS: txt('.rail-s .v').trim(),
        /* a caption with nothing under it reads as broken, not as "not entered yet" */
        orphanCells: [...c.querySelectorAll('.back .g, .back .cell')]
          .filter(e => !((e.querySelector('.n') || {}).textContent || '').trim())
          .map(e => ((e.querySelector('.l') || {}).textContent || '').trim()),
      };
    });
  });

  const err = (c, rule, detail) => {
    const entry = `${c.common} — ${rule}: ${detail}`;
    if (KNOWN_GAPS[c.latin]) known.push(entry); else errors.push(entry);
  };
  const warn = (c, rule, detail) => {
    const entry = `${c.common} — ${rule}: ${detail}`;
    if (KNOWN_GAPS[c.latin]) known.push(entry); else warnings.push(entry);
  };

  const LIGHT = /\b(full sun|part shade|partial shade|semi[- ]shade|dappled|deep shade|shade|sun)\b/i;
  const seenLatin = new Map(), seenCommon = new Map();

  for (const c of cards) {
    /* identity */
    if (seenLatin.has(c.latin)) errors.push(`${c.common} — duplicate-latin: also "${seenLatin.get(c.latin)}"`);
    seenLatin.set(c.latin, c.common);
    if (seenCommon.has(c.common)) errors.push(`${c.common} — duplicate-common: also "${seenCommon.get(c.common)}"`);
    seenCommon.set(c.common, c.common);

    /* the card must never silently drop information it was given. "Any aspect" is a
       positive claim; showing it when the data says otherwise AND no light bar carries
       the truth means the card contradicts its own source. */
    const sunBlank = c.sunNeed === '' || c.sunNeed == null;
    if (c.aspectShown === 'Any aspect' && LIGHT.test(c.aspectData) && !/any aspect/i.test(c.aspectData) && sunBlank)
      err(c, 'aspect-information-lost', `data "${c.aspectData}" -> card shows "Any aspect" with no light bar`);

    /* crest must echo the data */
    if (c.crest && c.crest !== c.hardiness) err(c, 'crest-mismatch', `crest "${c.crest}" != hardiness "${c.hardiness}"`);

    /* bloom text present but timeline empty = unparseable peak */
    if (c.peak && c.months === 0) err(c, 'peak-unparseable', `peak "${c.peak}" lights no months`);

    /* light floor cannot exceed the preferred level */
    if (c.sunMin !== '' && c.sunNeed !== '' && c.sunMin != null && c.sunNeed != null && Number(c.sunMin) > Number(c.sunNeed))
      err(c, 'sunmin-above-sunneed', `sunMin ${c.sunMin} > sunNeed ${c.sunNeed}`);

    if (!Number.isInteger(c.hue) || c.hue < 0 || c.hue > 360) err(c, 'hue-range', String(c.hue));

    /* the trade sheet must omit a field it has no value for, never print a bare caption */
    if (c.orphanCells.length)
      err(c, 'orphan-trade-cells', `${c.orphanCells.length} caption(s) with no value: ${c.orphanCells.join(', ')}`);

    /* soft: honest gaps, reported not enforced */
    if (!c.photoOk) warn(c, 'photo-missing', 'card falls back to its leaf gradient');
    if (c.blankRatings >= 4) warn(c, 'near-empty', `${c.blankRatings} of 6 ratings blank — stat rows render empty`);
    if (!c.sizeH || !c.sizeS) warn(c, 'size-rail-blank', `H "${c.sizeH}" S "${c.sizeS}"`);
  }

  if (pageErrors.length) errors.push('page errors: ' + pageErrors.join(' | '));

  console.log(`deck audited: ${cards.length} cards\n`);
  if (errors.length) { console.log(`ERRORS (${errors.length}) — these fail the run:`); errors.forEach(e => console.log('  ✗ ' + e)); console.log(); }
  if (warnings.length) { console.log(`WARNINGS (${warnings.length}) — honest gaps, not failures:`); warnings.forEach(w => console.log('  · ' + w)); console.log(); }
  if (known.length) {
    console.log(`KNOWN GAPS (${known.length}) — listed in KNOWN_GAPS, not failing:`);
    known.forEach(k => console.log('  ~ ' + k));
    console.log('  fix the card, then delete its line from KNOWN_GAPS.\n');
  }

  failed = errors.length;
  console.log(failed ? `FAILED: ${failed} error(s)` : 'DECK AUDIT PASS');
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
