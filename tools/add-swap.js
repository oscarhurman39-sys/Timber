#!/usr/bin/env node
/* add-swap.js — a SECOND photograph arrived for a card that already has one.
   Make the card flash between them (PHOTO_SWAP), never replace and never ask.
   Oscar's rule, 2026-10-01: "if you get a double photo always make it a flash
   between, should be the go-to protocol".

     node tools/add-swap.js "<latin>" <photo.jpg> --as <suffix> [--focus "50% 45%"] [--hold 3.5s] [--note "why"]

   What it does, in one go and rolled back together if the result does not parse:
     1. stages the photo as photos/<slug>-<suffix>.jpg through the same canvas
        pipeline as add-plant.js (1200 wide, JPEG 0.85) and builds the card
        derivative photos/card/<slug>-<suffix>.webp (optimise-photos --only)
     2. adds the PHOTO_SWAP entry — or, if the card already flashes, appends the
        new frame to its `alts` (an `alt` becomes `alts:[old, new]`)
     3. writes the CREDITS.json entry (Oscar's own photo, like every other)
     4. runs tools/check-boot.js, which verifies the asset the entry points at

   The card must be DEALT: a held card has no first photo to flash from — deal it
   with deal-plant.js first. The suffix names what the frame shows ("flowers",
   "autumn", "sunlit"), which is how the eleven existing alts are named.
   Afterwards: restamp (build-stamp --write), deck-audit, and run-all before pushing. */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const D = require('./plant-data.js');
const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'timber.html');

const argv = process.argv.slice(2);
const flag = f => { const i = argv.indexOf(f); return i === -1 ? null : argv[i + 1]; };
const [latin, photo] = argv.filter((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').startsWith('--'));
const suffix = flag('--as'), focus = flag('--focus') || '50% 45%', hold = flag('--hold') || '3.5s', note = flag('--note') || '';
const die = m => { console.error('ABORT: ' + m); process.exit(1); };
if (!latin || !photo || !suffix) { console.error('usage: node tools/add-swap.js "<latin>" <photo.jpg> --as <suffix> [--focus "50% 45%"] [--hold 3.5s] [--note "why"]'); process.exit(1); }
if (!/^[a-z0-9-]+$/.test(suffix)) die('--as must be a lowercase slug fragment, e.g. flowers, autumn, sunlit');
if (!fs.existsSync(photo)) die('photo not found: ' + photo);

const slugLatin = l => l.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const original = fs.readFileSync(HTML, 'utf8');
const deck = D.readDeck(original), hold_ = D.readHold(original);
const card = deck.find(p => p.latin === latin) || deck.find(p => p.latin.toLowerCase() === latin.toLowerCase());
if (!card) {
  if (hold_.find(p => p.latin.toLowerCase() === latin.toLowerCase())) die(`"${latin}" is HELD — it has no first photo to flash from. Deal it with tools/deal-plant.js first.`);
  die(`"${latin}" is not in the deck`);
}
const slug = slugLatin(card.latin);
const master = path.join(ROOT, 'photos', `${slug}-${suffix}.jpg`);
const alt = `photos/card/${slug}-${suffix}.webp`;
if (fs.existsSync(master)) die(`photos/${slug}-${suffix}.jpg already exists — pick another --as`);
if (!fs.existsSync(path.join(ROOT, 'photos', slug + '.jpg'))) die(`the card's own photo photos/${slug}.jpg is missing — nothing to flash from`);

/* ---- the PHOTO_SWAP edit, prepared before anything touches disk ---- */
const anchor = 'const PHOTO_SWAP={';
const a = original.indexOf(anchor);
if (a === -1) die('PHOTO_SWAP map not found');
const close = original.indexOf('\n};', a);
if (close === -1) die('PHOTO_SWAP closing brace not found');
let html;
const keyRe = new RegExp("\\n  '" + slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "':\\{");
const km = keyRe.exec(original.slice(a, close));
if (km) {
  /* already flashing: append this frame */
  const at = a + km.index + km[0].length;
  const entryEnd = original.indexOf('\n  },', at);
  let entry = original.slice(at, entryEnd);
  if (/\balts:\[/.test(entry)) {
    entry = entry.replace(/(\balts:\[[\s\S]*?)(\n\s*\],)/, `$1\n      '${alt}',$2`);
  } else if (/\balt:'[^']+',/.test(entry)) {
    entry = entry.replace(/\balt:'([^']+)',/, `alts:[\n      '$1',\n      '${alt}',\n    ],`);
  } else die(`existing PHOTO_SWAP entry for ${slug} has neither alt nor alts — edit it by hand`);
  html = original.slice(0, at) + entry + original.slice(entryEnd);
  console.log(`PHOTO_SWAP: ${slug} already flashes — frame appended`);
} else {
  const comment = note ? `  /* ${note.replace(/\*\//g, '* /')} */\n` : '';
  const entry = `${comment}  '${slug}':{\n    alt:'${alt}',\n    focus:'${focus}',\n    hold:'${hold}',\n  },`;
  html = original.slice(0, close) + '\n' + entry + original.slice(close);
  console.log(`PHOTO_SWAP: new entry for ${slug}`);
}

(async () => {
  /* ---- 1. stage master + derivative (same pipeline as add-plant.js) ---- */
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<div></div>');
  const b64 = fs.readFileSync(photo).toString('base64');
  const mime = /\.png$/i.test(photo) ? 'image/png' : 'image/jpeg';
  const out = await page.evaluate(async (uri) => {
    const img = new Image(); img.src = uri; await img.decode();
    const W = Math.min(1200, img.naturalWidth);
    const H = Math.round(img.naturalHeight * (W / img.naturalWidth));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    c.getContext('2d').drawImage(img, 0, 0, W, H);
    return { natural: `${img.naturalWidth}x${img.naturalHeight}`, W, H, jpg: c.toDataURL('image/jpeg', 0.85) };
  }, `data:${mime};base64,${b64}`);
  await browser.close();
  fs.writeFileSync(master, Buffer.from(out.jpg.split(',')[1], 'base64'));
  console.log(`photo: ${out.natural} -> ${out.W}x${out.H} staged as photos/${slug}-${suffix}.jpg`);
  const undo = () => { try { fs.unlinkSync(master); } catch {} try { fs.unlinkSync(path.join(ROOT, alt)); } catch {} fs.writeFileSync(HTML, original); };
  try {
    execFileSync(process.execPath, [path.join(__dirname, 'optimise-photos.js'), '--only', `${slug}-${suffix}.jpg`], { stdio: 'inherit', cwd: ROOT });
  } catch (e) { undo(); die('card derivative not built (sharp missing? NODE_PATH=/opt/node22/lib/node_modules) — rolled back'); }

  /* ---- 2. write the map, verify, roll back on any failure ---- */
  fs.writeFileSync(HTML, html);
  try {
    if (D.readDeck(html).length !== deck.length || D.readHold(html).length !== hold_.length) throw new Error('plant blocks changed size');
    execFileSync(process.execPath, [path.join(__dirname, 'check-boot.js')], { stdio: 'pipe', cwd: ROOT });
  } catch (e) { undo(); die(`check failed after the swap edit (${(e.stdout || e.message || '').toString().trim().split('\n').pop()}) — rolled back, nothing changed`); }

  /* ---- 3. credits ---- */
  const licence = `Oscar's own photograph — owned outright. Second frame for the ${card.common} card (PHOTO_SWAP alt)${note ? ': ' + note : ''}.`;
  execFileSync(process.execPath, [path.join(__dirname, 'photo-credits.js'), '--set', `${slug}-${suffix}.jpg`, '--source', 'oscar', '--licence', licence, '--author', 'Scion Studios'], { stdio: 'inherit', cwd: ROOT });

  console.log(`\nDONE: ${card.common} now flashes between photos/card/${slug}.webp and ${alt} (focus ${focus}, hold ${hold}).`);
  console.log('Next: node tools/build-stamp.js --write · NODE_PATH=/opt/node22/lib/node_modules node tests/deck-audit.js · tests/run-all.js before the push.');
})();
