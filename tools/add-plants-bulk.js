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

const args = process.argv.slice(2);
if (args.length < 2 || args.length % 2) {
  console.error('usage: node tools/add-plants-bulk.js <a.json> <a-photo> [<b.json> <b-photo> ...]');
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

  /* ---- 4. NPLANTS once, in both suites (same patterns as add-plant.js) ---- */
  for (const t of ['tests/app-test.js', 'tests/edge-test.js']) {
    const f = path.join(ROOT, t);
    let s = fs.readFileSync(f, 'utf8');
    const before = s;
    s = s.replace(/const NPLANTS = \d+/, `const NPLANTS = ${count}`);
    s = s.replace(/for \(let i = 0; i < \d+; i\+\+\) \{ await page\.click\('#learn'\)/g,
                  `for (let i = 0; i < ${count}; i++) { await page.click('#learn')`);
    s = s.replace(/PLANTS\.length === \d+/g, `PLANTS.length === ${count}`);
    s = s.replace(/c\.cards === \d+ && c\.left === '\d+'/g, `c.cards === ${count} && c.left === '${count}'`);
    s = s.replace(/s\.empty && s\.done === '\d+'/g, `s.empty && s.done === '${count}'`);
    s = s.replace(/s\.done === '\d+' && s\.cards === 0/g, `s.done === '${count}' && s.cards === 0`);
    s = s.replace(/s\.cards === \d+ && s\.done === '0'/g, `s.cards === ${count} && s.done === '0'`);
    s = s.replace(/c\.left === '\d+' && c\.done === '0'/g, `c.left === '${count}' && c.done === '0'`);
    if (s === before) die(`no plant-count patterns found in ${t} — suite format changed?`);
    fs.writeFileSync(f, s);
  }
  console.log(`NPLANTS -> ${count} in both suites`);

  /* ---- 5. serve + run each suite ONCE ---- */
  let server = null;
  const up = await fetch('http://localhost:8477/timber.html').then(r => r.ok).catch(() => false);
  if (!up) {
    server = spawn('python3', ['-m', 'http.server', '8477'], { cwd: ROOT, stdio: 'ignore', detached: true });
    await new Promise(r => setTimeout(r, 1200));
  }
  const run = (t) => {
    try { execFileSync(process.execPath, [path.join(ROOT, t)], { stdio: 'inherit', cwd: ROOT }); return true; }
    catch { return false; }
  };
  const ok1 = run('tests/app-test.js');
  const ok2 = run('tests/edge-test.js');
  const ok3 = run('tests/deck-audit.js');

  /* ---- 6. screenshot the newest card (top of deck) once ---- */
  const shot = await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 });
  await shot.goto('http://localhost:8477/timber.html', { waitUntil: 'networkidle' });
  await shot.evaluate(() => localStorage.clear());
  await shot.reload({ waitUntil: 'networkidle' });
  await shot.waitForTimeout(900);
  await shot.screenshot({ path: path.join(__dirname, 'last-added-card.png') });
  await browser.close();
  if (server) process.kill(-server.pid);

  if (!ok1 || !ok2 || !ok3) die('suites FAILED after insert — inspect before committing');
  console.log(`\nDONE: ${pairs.length} plants added and the whole deck verified once.`);
  console.log('  ' + pairs.map(p => p.data.common).join('\n  '));
  console.log('Screenshot: tools/last-added-card.png — LOOK AT IT before committing.');
  console.log('The deck audit above checked every card (photos, hues, aspects) — review its output.');
  console.log('Then: git add -A && commit && push.');
})();
