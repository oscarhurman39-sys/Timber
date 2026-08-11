#!/usr/bin/env node
/* deal-plant.js — a photograph arrived for a held card; deal it.

     node tools/deal-plant.js "<latin>" <photo> [--focus "50% 30%"]

   add-plant.js creates a NEW card from JSON. This is the other half, and the
   one the deck actually needs now: 105 cards are already written and sitting in
   PLANTS_ON_HOLD purely because they have no photograph. This takes one photo,
   stages it under the slug the app derives from `latin`, moves that card out of
   the hold block, and records the provenance — the four steps that were being
   done by hand.

   Everything is written in one go and rolled back together if the result does
   not re-parse, so a half-dealt card cannot reach disk. Run the gate afterwards:
     node tests/run-all.js --jobs 3
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'timber.html');

const argv = process.argv.slice(2);
const flag = f => { const i = argv.indexOf(f); return i === -1 ? null : argv[i + 1]; };
const focus = flag('--focus');
const [latinArg, photoArg] = argv.filter((a, i) =>
  !a.startsWith('--') && argv[i - 1] !== '--focus');
if (!latinArg || !photoArg) {
  console.error('usage: node tools/deal-plant.js "<latin>" <photo> [--focus "50% 30%"]');
  process.exit(1);
}
const die = m => { console.error('ABORT: ' + m); process.exit(1); };

const slugLatin = l => l.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

if (!fs.existsSync(photoArg)) die('photo not found: ' + photoArg);
const original = fs.readFileSync(HTML, 'utf8');

/* ---- locate the card inside the hold block ----
   Matched on the whole row so the move is a lift-and-drop of the exact text,
   never a re-serialisation: a card that goes through this tool comes out
   byte-identical apart from where it sits. */
const HOLD_OPEN = 'const PLANTS_ON_HOLD=[';
const HOLD_END = ' ];\n/* HOLD:END */';
const PLANTS_END = '];\n/* PLANTS:END */';
for (const m of [HOLD_OPEN, HOLD_END, PLANTS_END]) if (!original.includes(m)) die('marker missing: ' + m);

const holdStart = original.indexOf(HOLD_OPEN);
const holdStop = original.indexOf(HOLD_END);
const holdBody = original.slice(holdStart, holdStop);
const rowRe = new RegExp(
  '\\n?  \\{common:[^\\n]*?latin:"' + latinArg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '",[\\s\\S]*?sunMin:[^}]*\\},?\\n',
  '');
const hit = holdBody.match(rowRe);
if (!hit) {
  const held = [...holdBody.matchAll(/latin:"([^"]+)"/g)].map(m => m[1]);
  const near = held.filter(l => slugLatin(l).includes(slugLatin(latinArg).split('-')[0]));
  die(`"${latinArg}" is not in PLANTS_ON_HOLD.` +
      (near.length ? '\n  did you mean:\n    ' + near.join('\n    ') : ''));
}
const slug = slugLatin(latinArg);
console.log(`found held card: ${latinArg}\n  -> photos/${slug}.jpg`);

(async () => {
  /* ---- stage the photo the same way add-plant.js does: EXIF-corrected by the
     browser's own decoder, capped at 1200px on the long edge, re-encoded JPEG ---- */
  const { chromium } = require('/opt/node22/lib/node_modules/playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<div></div>');
  const b64 = fs.readFileSync(photoArg).toString('base64');
  const mime = /\.png$/i.test(photoArg) ? 'image/png' : 'image/jpeg';
  const out = await page.evaluate(async (uri) => {
    const img = new Image(); img.src = uri; await img.decode();
    const long = Math.max(img.naturalWidth, img.naturalHeight);
    const k = Math.min(1, 1200 / long);
    const W = Math.round(img.naturalWidth * k), H = Math.round(img.naturalHeight * k);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    c.getContext('2d').drawImage(img, 0, 0, W, H);
    return { natural: `${img.naturalWidth}x${img.naturalHeight}`, W, H, jpg: c.toDataURL('image/jpeg', 0.85) };
  }, `data:${mime};base64,${b64}`);
  await browser.close();

  const photoOut = path.join(ROOT, 'photos', slug + '.jpg');
  const photoExisted = fs.existsSync(photoOut);
  if (photoExisted) die(`photos/${slug}.jpg already exists — this card is not waiting for a photo`);
  fs.writeFileSync(photoOut, Buffer.from(out.jpg.split(',')[1], 'base64'));
  console.log(`photo: ${out.natural} -> ${out.W}x${out.H}`);

  /* ---- move the row: out of hold, in before PLANTS:END ---- */
  let html = original;
  const row = hit[0].replace(/^\n/, '').replace(/,?\n$/, '');
  html = html.slice(0, holdStart) + holdBody.replace(hit[0], hit[0].startsWith('\n') ? '\n' : '') +
         html.slice(holdStop);
  /* the dealt block's last row may lack a trailing comma after a csv round-trip;
     appending onto it without one yields `}{` and kills the whole app */
  {
    const at = html.indexOf(PLANTS_END), head = html.slice(0, at);
    if (/}\s*$/.test(head) && !/},\s*$/.test(head)) html = head.replace(/}(\s*)$/, '},$1') + html.slice(at);
  }
  html = html.replace(PLANTS_END, row + ',\n' + PLANTS_END);

  if (focus) {
    const anchor = 'const PHOTO_FOCUS={';
    if (!html.includes(anchor)) die('PHOTO_FOCUS map not found');
    html = html.replace(anchor, `${anchor}\n  '${slug}':'${focus}',`);
    console.log(`focus: ${focus}`);
  }

  fs.writeFileSync(HTML, html);

  /* ---- re-parse or roll everything back ---- */
  try {
    const pd = require('./plant-data.js');
    const before = pd.readDeck(original).length;
    const after = pd.readDeck(fs.readFileSync(HTML, 'utf8')).length;
    if (after !== before + 1) throw new Error(`deck parses to ${after}, expected ${before + 1}`);
    const stillHeld = fs.readFileSync(HTML, 'utf8')
      .slice(holdStart, fs.readFileSync(HTML, 'utf8').indexOf(HOLD_END))
      .includes(`latin:"${latinArg}"`);
    if (stillHeld) throw new Error('card is still in the hold block');
    console.log(`\ndeck: ${before} -> ${after}`);
  } catch (e) {
    fs.writeFileSync(HTML, original);
    fs.unlinkSync(photoOut);
    die(`${e.message} — timber.html and the photo were rolled back, nothing changed`);
  }

  /* ---- provenance, via the existing tool so the format stays single-sourced ---- */
  execFileSync(process.execPath, [path.join(__dirname, 'photo-credits.js'),
    '--set', slug + '.jpg', '--source', 'oscar',
    '--licence', "Oscar's own photograph — owned outright",
    '--author', 'Oscar Hurman'], { stdio: 'inherit' });

  console.log('\nnow run:  node plants-tool.js export && node tools/build-stamp.js --write && node tests/run-all.js --jobs 3');
})();
