#!/usr/bin/env node
/* add-plant.js — the whole add-a-plant routine as ONE command.

     node tools/add-plant.js plant.json photo.jpg

   Steps (each fails loudly; nothing is written until validation passes):
     1. validate the JSON via tools/check-plant-json.js (same rules, same errors)
     2. process the photo: EXIF-corrected, 1200px wide JPEG -> photos/<slug>.jpg
     3. insert the PLANTS row into timber.html (before the PLANTS:END marker)
     4. set NPLANTS in tests/app-test.js + tests/edge-test.js to the new count
     5. serve the repo, run the app + edge suites
     6. screenshot the new card -> tools/last-added-card.png

   Photos and data stay honest: nothing is invented, blanks stay blank, and a
   duplicate latin name aborts the run. Aesthetic is untouched — this only feeds
   data through the locked template.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync, spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '..');

const QUICK = process.argv.includes('--quick');
const [jsonPath, photoPath] = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!jsonPath || !photoPath) {
  console.error('usage: node tools/add-plant.js [--quick] <plant.json> <photo.jpg>');
  console.error('  --quick  data checks + whole-deck audit only (~17s instead of ~5min).');
  console.error('           Then run: node tests/run-all.js --jobs 3   before pushing.');
  process.exit(1);
}
const die = (msg) => { console.error('ABORT: ' + msg); process.exit(1); };

/* ---- 1. validate ---- */
try {
  execFileSync(process.execPath, [path.join(__dirname, 'check-plant-json.js'), jsonPath], { stdio: 'inherit' });
} catch { die('plant JSON failed validation — fix it first'); }
const p = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
/* NFD-strip accents to match the app's slugLatin — 'Chōshū' must become 'choshu', not 'ch-sh' */
const slug = p.latin.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ---- duplicate check + current count ---- */
const HTML = path.join(ROOT, 'timber.html');
let html = fs.readFileSync(HTML, 'utf8');
const marker = '];\n/* PLANTS:END */';
if (!html.includes(marker)) die('PLANTS:END marker not found in timber.html');
/* dupes are checked across the WHOLE file (a plant parked in PLANTS_ON_HOLD is
   still taken), but NPLANTS counts only the dealt deck — rows before PLANTS:END */
const latins = [...html.matchAll(/latin:"([^"]+)"/g)].map(m => m[1].toLowerCase());
if (latins.includes(p.latin.toLowerCase())) die(`"${p.latin}" is already in the deck`);
const dealt = [...html.slice(0, html.indexOf(marker)).matchAll(/latin:"([^"]+)"/g)].length;
const count = dealt + 1;

(async () => {
  /* ---- 2. photo ---- */
  if (!fs.existsSync(photoPath)) die('photo not found: ' + photoPath);
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<div></div>');
  const b64 = fs.readFileSync(photoPath).toString('base64');
  const mime = /\.png$/i.test(photoPath) ? 'image/png' : 'image/jpeg';
  const out = await page.evaluate(async (uri) => {
    const img = new Image(); img.src = uri; await img.decode();
    const W = Math.min(1200, img.naturalWidth);
    const H = Math.round(img.naturalHeight * (W / img.naturalWidth));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    c.getContext('2d').drawImage(img, 0, 0, W, H);
    return { natural: `${img.naturalWidth}x${img.naturalHeight}`, W, H, jpg: c.toDataURL('image/jpeg', 0.85) };
  }, `data:${mime};base64,${b64}`);
  const photoOut = path.join(ROOT, 'photos', slug + '.jpg');
  fs.writeFileSync(photoOut, Buffer.from(out.jpg.split(',')[1], 'base64'));
  console.log(`photo: ${out.natural} -> ${out.W}x${out.H} staged as photos/${slug}.jpg`);

  /* ---- 3. insert row ---- */
  const esc = (v) => JSON.stringify(v == null ? '' : String(v));
  const num = (v) => (v === '' || v == null ? '""' : Number(v));
  const row = `  {common:${esc(p.common)}, latin:${esc(p.latin)}, hue:${Number(p.hue)},
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
  html = html.replace(marker, row + marker);
  fs.writeFileSync(HTML, html);
  console.log(`row inserted: deck now ${count} plants`);

  /* ---- 4. plant-count literals in the suites ----
     NPLANTS itself is no longer patched: the four suites now derive it from
     timber.html (tools/plant-data.js), which is what stops a deck change from
     updating some suites and not others. Only the remaining hardcoded literals
     need rewriting, and the derived value is asserted afterwards. */
  for (const t of ['tests/app-test.js', 'tests/edge-test.js', 'tests/srs-test.js', 'tests/features-test.js']) {
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

  /* ---- 5. serve + run suites ---- */
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
  /* Keep plants.csv in step. It used to drift every time a plant was added, because
     nothing wrote it back -- and export was unsafe to run (it dropped the hold
     block). Both are fixed, so sync it here and the csv stops going stale. */
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'plants-tool.js'), 'export'], { stdio: 'pipe', cwd: ROOT });
    console.log('plants.csv re-exported (deck + hold)');
  } catch (e) { console.error('WARNING: could not re-export plants.csv -- run: node plants-tool.js export'); }

  /* Data checks first — 0.3s, and they catch what a new row actually gets wrong. */
  const ok1 = run('tools/data-audit.js') && run('tools/plant-sense.js', ['--strict'])
    && run('tools/photo-credits.js', ['--check']);
  const ok2 = ok1 && run('tests/deck-audit.js');   /* catches a bad new row before it is committed */
  /* app-test + edge-test walk the whole deck (~5 min at 128 cards) and test
     BEHAVIOUR, which a new data row cannot change. Skipped with --quick; the full
     set runs once before pushing via tests/run-all.js --jobs 3. */
  const ok3 = (QUICK || !ok2) ? true : (run('tests/app-test.js') && run('tests/edge-test.js'));

  /* ---- 6. screenshot the new card (newest deals first: it is already on top) ---- */
  const shot = await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 });
  await shot.goto('http://localhost:8477/timber.html', { waitUntil: 'networkidle' });
  await shot.evaluate(() => localStorage.clear());
  await shot.reload({ waitUntil: 'networkidle' });
  await shot.waitForTimeout(500);
  await shot.waitForTimeout(400);
  await shot.screenshot({ path: path.join(__dirname, 'last-added-card.png') });
  await browser.close();
  if (server) process.kill(-server.pid);

  if (!ok1) die('DATA checks failed after insert — fix before committing');
  if (!ok2) die('deck audit failed after insert — inspect before committing');
  if (!ok3) die('behavioural suites failed after insert — inspect before committing');
  console.log(`\nDONE: ${p.common} added and verified.`);
  console.log('Screenshot: tools/last-added-card.png — LOOK AT IT before committing.');
  console.log(QUICK
    ? '\n--quick: gesture/undo/storage suites NOT run. Before pushing: node tests/run-all.js --jobs 3'
    : '\nBefore pushing (sw/perf/srs/features/layout still unrun): node tests/run-all.js --jobs 3');
  console.log('Then: git add -A && commit && push.');
})();
