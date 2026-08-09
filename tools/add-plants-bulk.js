#!/usr/bin/env node
/* add-plants-bulk.js — add MANY plants in one pass, verifying ONCE at the end.

     node tools/add-plants-bulk.js a.json a.jpg b.json b.jpg c.json c.jpg ...

   Why this exists: add-plant.js re-runs the full suite (94 app checks + edge
   checks + deck audit, each launching Chromium) after EVERY insert. One edge
   check walks the whole deck with a ~420ms settle per card, so suite time grows
   with deck size — at 120+ cards a per-plant suite run is minutes, and a batch
   of N plants pays it N times. Inserting a row costs about a second; the suite
   is the whole bill. This tool amortises it: validate and dedup EVERYTHING
   up front (nothing is written if any plant fails), stage all photos, insert
   all rows, bump NPLANTS once, then run the suites and screenshot ONCE.

   Same guarantees as add-plant.js — same validator, same row format, same
   suites gating the commit — just paid once per batch, not once per plant.
   Use add-plant.js for a single plant; use this for two or more. */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync, spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '..');

const QUICK = process.argv.includes('--quick');
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (args.length < 2 || args.length % 2) {
  console.error('usage: node tools/add-plants-bulk.js [--quick] <a.json> <a-photo> [<b.json> <b-photo> ...]');
  console.error('  --quick  data checks + whole-deck audit only (~15s instead of ~5min).');
  console.error('           Adding a plant is a DATA change: it cannot alter gesture,');
  console.error('           quiz or service-worker behaviour, only the data those');
  console.error('           behaviours read. So the data gate is the one that matters');
  console.error('           per batch — run the full suite once before you push.');
  process.exit(1);
}
const die = (msg) => { console.error('ABORT: ' + msg); process.exit(1); };

const pairs = [];
for (let i = 0; i < args.length; i += 2) pairs.push({ json: args[i], photo: args[i + 1] });

/* ---- 1. validate EVERY json + photo path before anything is written ---- */
const HTML = path.join(ROOT, 'timber.html');
let html = fs.readFileSync(HTML, 'utf8');
const marker = '];\n/* PLANTS:END */';
if (!html.includes(marker)) die('PLANTS:END marker not found in timber.html');
const latins = [...html.matchAll(/latin:"([^"]+)"/g)].map(m => m[1].toLowerCase());

const slugOf = (latin) => latin.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const seen = new Set();
for (const p of pairs) {
  try {
    execFileSync(process.execPath, [path.join(__dirname, 'check-plant-json.js'), p.json], { stdio: 'inherit' });
  } catch { die(`${p.json} failed validation — nothing was written`); }
  if (!fs.existsSync(p.photo)) die(`photo not found: ${p.photo} — nothing was written`);
  p.data = JSON.parse(fs.readFileSync(p.json, 'utf8'));
  const key = p.data.latin.toLowerCase();
  if (latins.includes(key)) die(`"${p.data.latin}" is already in the deck — nothing was written`);
  if (seen.has(key)) die(`"${p.data.latin}" appears twice in this batch — nothing was written`);
  seen.add(key);
  p.slug = slugOf(p.data.latin);
}
console.log(`\nall ${pairs.length} plants validated — proceeding to write\n`);

(async () => {
  /* ---- 2. stage every photo in ONE browser session ---- */
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<div></div>');
  for (const p of pairs) {
    const b64 = fs.readFileSync(p.photo).toString('base64');
    const mime = /\.png$/i.test(p.photo) ? 'image/png' : 'image/jpeg';
    const out = await page.evaluate(async (uri) => {
      const img = new Image(); img.src = uri; await img.decode();
      const W = Math.min(1200, img.naturalWidth);
      const H = Math.round(img.naturalHeight * (W / img.naturalWidth));
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      c.getContext('2d').drawImage(img, 0, 0, W, H);
      return { natural: `${img.naturalWidth}x${img.naturalHeight}`, W, H, jpg: c.toDataURL('image/jpeg', 0.85) };
    }, `data:${mime};base64,${b64}`);
    fs.writeFileSync(path.join(ROOT, 'photos', p.slug + '.jpg'), Buffer.from(out.jpg.split(',')[1], 'base64'));
    console.log(`photo: ${out.natural} -> ${out.W}x${out.H} staged as photos/${p.slug}.jpg`);
  }

  /* ---- 3. insert every row (same format as add-plant.js) ---- */
  const esc = (v) => JSON.stringify(v == null ? '' : String(v));
  const num = (v) => (v === '' || v == null ? '""' : Number(v));
  let rows = '';
  for (const { data: p } of pairs) {
    rows += `  {common:${esc(p.common)}, latin:${esc(p.latin)}, hue:${Number(p.hue)},
   visual:${esc(p.visual)},
   water:${esc(p.water)},
   aspect:${esc(p.aspect)},
   soil:${esc([p.soil, p.soilWarning].filter(Boolean).join('; '))},
   prune:${esc(p.prune)},
   source:"", peak:${esc(p.peak)}, order:"", bench:"", root:"",
   trade:"", retail:"", margin:"", type:"", shrink:"", returnRisk:"", pots:"",
   cvs:${esc(p.cvs)},
   hardiness:${esc(p.hardiness)}, resilience:${esc(p.resilience)},
   uses:${esc(p.uses)}, size:${esc(`${p.height || ''} H × ${p.spread || ''} W`)},
   seasonalImpact:"", growthSpeed:${num(p.growthSpeed)}, pestRisk:${num(p.pestRisk)}, thirst:${num(p.thirst)}, careLevel:${num(p.careLevel)}, sunNeed:${num(p.sunNeed)}, sunMin:${num(p.sunMin)}},
`;
  }
  html = html.replace(marker, rows + marker);
  fs.writeFileSync(HTML, html);
  const count = latins.length + pairs.length;
  console.log(`rows inserted: deck now ${count} plants`);

  /* ---- 4. plant-count literals in the suites ----
     NPLANTS itself is no longer patched: the four suites now derive it from
     timber.html (tools/plant-data.js), which is what stops a deck change from
     updating some suites and not others. Only the remaining hardcoded literals
     need rewriting, and the derived value is asserted afterwards. */
  for (const t of ['tests/app-test.js', 'tests/edge-test.js']) {
    const f = path.join(ROOT, t);
    let s = fs.readFileSync(f, 'utf8');
    const before = s;
    if (/const NPLANTS = \d+/.test(s)) die(`${t} still hardcodes NPLANTS — it should derive it from timber.html`);
    s = s.replace(/for \(let i = 0; i < \d+; i\+\+\) \{ await page\.click\('#learn'\)/g,
                  `for (let i = 0; i < ${count}; i++) { await page.click('#learn')`);
    s = s.replace(/PLANTS\.length === \d+/g, `PLANTS.length === ${count}`);
    s = s.replace(/c\.cards === \d+ && c\.left === '\d+'/g, `c.cards === ${count} && c.left === '${count}'`);
    s = s.replace(/s\.empty && s\.done === '\d+'/g, `s.empty && s.done === '${count}'`);
    s = s.replace(/s\.done === '\d+' && s\.cards === 0/g, `s.done === '${count}' && s.cards === 0`);
    s = s.replace(/s\.cards === \d+ && s\.done === '0'/g, `s.cards === ${count} && s.done === '0'`);
    s = s.replace(/c\.left === '\d+' && c\.done === '0'/g, `c.left === '${count}' && c.done === '0'`);
    if (s !== before) fs.writeFileSync(f, s);
  }
  {
    const derived = require('./plant-data.js').readDeck(fs.readFileSync(HTML, 'utf8')).length;
    if (derived !== count) die(`deck says ${derived} plants but this run inserted up to ${count} — counts disagree`);
    console.log(`deck count ${count}, derived by every suite from timber.html`);
  }

  /* ---- 5. serve + run each suite ONCE ---- */
  let server = null;
  const up = await fetch('http://localhost:8477/timber.html').then(r => r.ok).catch(() => false);
  if (!up) {
    server = spawn('python3', ['-m', 'http.server', '8477'], { cwd: ROOT, stdio: 'ignore', detached: true });
    await new Promise(r => setTimeout(r, 1200));
  }
  const run = (t, args = []) => {
    try { execFileSync(process.execPath, [path.join(ROOT, t), ...args], { stdio: 'inherit', cwd: ROOT }); return true; }
    catch { return false; }
  };

  /* The data checks cost about a third of a second and catch what a fresh batch
     actually gets wrong — a duplicate name, a rating out of range, a card that
     contradicts itself, a photo with no provenance entry. Run them FIRST so a bad
     batch fails now instead of after five minutes of Chromium. */
  const okData = run('tools/data-audit.js') && run('tools/plant-sense.js', ['--strict'])
    && run('tools/photo-credits.js', ['--check']);

  /* deck-audit is the one browser suite that is really about the DATA: it reads
     every card as rendered and checks photos, hues, aspects, crests, bloom bands.
     That is the suite a new plant can genuinely break, and it costs ~15s. */
  const okDeck = okData && run('tests/deck-audit.js');

  /* app-test and edge-test are behavioural — gestures, undo, corrupt storage. A
     new data row cannot change that behaviour, and they now cost ~4.5 min between
     them because both walk the whole deck (the learn-every-card loop alone is
     128 x 400ms). Skipped in --quick; run the full suite once before pushing. */
  let okBehaviour = true;
  if (!QUICK && okDeck) {
    okBehaviour = run('tests/app-test.js') && run('tests/edge-test.js');
  }
  const ok1 = okData, ok2 = okDeck, ok3 = okBehaviour;

  /* ---- 6. screenshot the newest card (top of deck) once ---- */
  const shot = await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 });
  await shot.goto('http://localhost:8477/timber.html', { waitUntil: 'networkidle' });
  await shot.evaluate(() => localStorage.clear());
  await shot.reload({ waitUntil: 'networkidle' });
  await shot.waitForTimeout(900);
  await shot.screenshot({ path: path.join(__dirname, 'last-added-card.png') });
  await browser.close();
  if (server) process.kill(-server.pid);

  if (!ok1) die('DATA checks failed after insert — fix before committing');
  if (!ok2) die('deck audit failed after insert — inspect before committing');
  if (!ok3) die('behavioural suites failed after insert — inspect before committing');

  console.log(`\nDONE: ${pairs.length} plants added, whole deck verified once.`);
  console.log('  ' + pairs.map(p => p.data.common).join('\n  '));
  console.log('Screenshot: tools/last-added-card.png — LOOK AT IT before committing.');
  console.log('The deck audit above checked every card (photos, hues, aspects) — review its output.');
  if (QUICK) {
    console.log('\n--quick: gesture/undo/storage suites were NOT run.');
    console.log('Commit freely, but run the full set once before you push:');
    console.log('  node tests/run-all.js --jobs 3');
  } else {
    console.log('\nStill not run here: sw-update, perf, srs, features, verify-cards, audit-layout.');
    console.log('Before pushing:  node tests/run-all.js --jobs 3');
  }
  console.log('Then: git add -A && commit && push.');
})();
