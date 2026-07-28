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

const [jsonPath, photoPath] = process.argv.slice(2);
if (!jsonPath || !photoPath) {
  console.error('usage: node tools/add-plant.js <plant.json> <photo.jpg>');
  process.exit(1);
}
const die = (msg) => { console.error('ABORT: ' + msg); process.exit(1); };

/* ---- 1. validate ---- */
try {
  execFileSync(process.execPath, [path.join(__dirname, 'check-plant-json.js'), jsonPath], { stdio: 'inherit' });
} catch { die('plant JSON failed validation — fix it first'); }
const p = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const slug = p.latin.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ---- duplicate check + current count ---- */
const HTML = path.join(ROOT, 'timber.html');
let html = fs.readFileSync(HTML, 'utf8');
const marker = '];\n/* PLANTS:END */';
if (!html.includes(marker)) die('PLANTS:END marker not found in timber.html');
const latins = [...html.matchAll(/latin:"([^"]+)"/g)].map(m => m[1].toLowerCase());
if (latins.includes(p.latin.toLowerCase())) die(`"${p.latin}" is already in the deck`);
const count = latins.length + 1;

(async () => {
  /* ---- 2. photo ---- */
  if (!fs.existsSync(photoPath)) die('photo not found: ' + photoPath);
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
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

  /* ---- 4. NPLANTS in both suites ---- */
  for (const t of ['tests/app-test.js', 'tests/edge-test.js']) {
    const f = path.join(ROOT, t);
    let s = fs.readFileSync(f, 'utf8');
    const before = s;
    s = s.replace(/const NPLANTS = \d+/, `const NPLANTS = ${count}`);
    s = s.replace(/for \(let i = 0; i < \d+; i\+\+\) \{ await page\.click\('#learn'\)/g,
                  `for (let i = 0; i < ${count}; i++) { await page.click('#learn')`);
    s = s.replace(/PLANTS\.length === \d+/g, `PLANTS.length === ${count}`);
    // edge-test string counters ('5', '6'...) follow NPLANTS-1 patterns handled via NPLANTS var in app-test;
    // edge-test uses literals — rewrite them:
    s = s.replace(/c\.cards === \d+ && c\.left === '\d+'/g, `c.cards === ${count} && c.left === '${count}'`);
    s = s.replace(/s\.empty && s\.done === '\d+'/g, `s.empty && s.done === '${count}'`);
    s = s.replace(/s\.done === '\d+' && s\.cards === 0/g, `s.done === '${count}' && s.cards === 0`);
    s = s.replace(/s\.cards === \d+ && s\.done === '0'/g, `s.cards === ${count} && s.done === '0'`);
    s = s.replace(/c\.left === '\d+' && c\.done === '0'/g, `c.left === '${count}' && c.done === '0'`);
    if (s === before) die(`no plant-count patterns found in ${t} — suite format changed?`);
    fs.writeFileSync(f, s);
  }
  console.log(`NPLANTS -> ${count} in both suites`);

  /* ---- 5. serve + run suites ---- */
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

  /* ---- 6. screenshot the new card (it renders bottom of the deck: skip count-1) ---- */
  const shot = await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 });
  await shot.goto('http://localhost:8477/timber.html', { waitUntil: 'networkidle' });
  await shot.evaluate(() => localStorage.clear());
  await shot.reload({ waitUntil: 'networkidle' });
  await shot.waitForTimeout(500);
  for (let i = 0; i < count - 1; i++) { await shot.click('#skip'); await shot.waitForTimeout(380); }
  await shot.waitForTimeout(400);
  await shot.screenshot({ path: path.join(__dirname, 'last-added-card.png') });
  await browser.close();
  if (server) process.kill(-server.pid);

  if (!ok1 || !ok2) die('suites FAILED after insert — inspect before committing');
  console.log(`\nDONE: ${p.common} added and verified.`);
  console.log('Screenshot: tools/last-added-card.png — LOOK AT IT before committing.');
  console.log('Then: git add -A && commit && push.');
})();
