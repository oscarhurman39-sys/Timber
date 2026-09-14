#!/usr/bin/env node
/* optimise-photos.js — derive the card-sized WebP the app actually loads.
   Run: NODE_PATH=/opt/node22/lib/node_modules node tools/optimise-photos.js
        ... --check   report only, change nothing (used by tests/run-all.js --fast)

   WHY THIS EXISTS

   photos/<slug>.jpg is the master: about 1200px wide and 200-400 KB, which is the
   right thing to keep and the wrong thing to send. The card's photo window is
   13.96%..97.008% of a 420px card — roughly 350 CSS px, and on the widest phone
   the deck ever scales to that is under 900 device pixels even at 3x. The deck
   fetches a window of ten photos as cards near the top, so opening the app pulled
   about 2.5 MB of photographs it then drew at a third of their size.

   The derivative is a plain downscale to CARD_WIDTH: no crop, no reframe. Cards
   position photographs with object-position percentages (PHOTO_FOCUS), which are
   relative to the frame, so the composition is identical.

   Derivatives live in photos/card/ rather than beside the masters on purpose:
   tools/data-audit.js and tools/photo-credits.js both scan photos/ non-recursively
   and would otherwise read every derivative as an unclaimed, uncredited image. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PHOTOS = path.join(ROOT, 'photos');
const OUT = path.join(PHOTOS, 'card');
const CHECK = process.argv.includes('--check');

const CARD_WIDTH = 1000;   /* covers the card at 3x and the detail sheet at 2.5x */
const QUALITY = 80;

/* Only the masters a card can actually resolve. -cutout.png files are source
   material for the frame tools, never loaded by the app. */
const isMaster = f => /\.jpg$/i.test(f) && !/-cutout\.png$/i.test(f);

(async () => {
  /* --check needs no image library. Every question it asks — does the derivative
     exist, is it older than its master, is it an orphan — is answered by fs.
     It used to `process.exit(0)` the instant require('sharp') threw, which made
     the guard a silent no-op on any machine without sharp installed. The app
     loads photos/card/<slug>.webp and never the master, while add-plant.js,
     add-plants-bulk.js and deal-plant.js all stage the master only, so a card
     dealt on a machine without sharp shipped with NO photograph and a green
     suite. It happened twice on 2026-09-14 — five cards in one batch, then the
     Wintersweet — and both times the only thing that caught it was rendering the
     card and looking at it. See VERIFY-QUEUE 87.
     Generating derivatives still needs sharp; checking for them never did. */
  let sharp = null;
  try { sharp = require('sharp'); } catch (e) { /* only the generate path below needs it */ }

  const masters = fs.readdirSync(PHOTOS).filter(isMaster).sort();
  if (!masters.length) { console.error('no photo masters found in photos/'); process.exit(2); }

  if (CHECK) {
    const missing = [], stale = [], orphaned = [];
    for (const f of masters) {
      const d = path.join(OUT, f.replace(/\.jpg$/i, '.webp'));
      if (!fs.existsSync(d)) missing.push(f);
      else if (fs.statSync(d).mtimeMs < fs.statSync(path.join(PHOTOS, f)).mtimeMs) stale.push(f);
    }
    /* a renamed or dropped card leaves a derivative nothing can reach */
    const want = new Set(masters.map(f => f.replace(/\.jpg$/i, '.webp')));
    if (fs.existsSync(OUT)) for (const f of fs.readdirSync(OUT)) if (!want.has(f)) orphaned.push(f);
    const bad = [...missing.map(f => f + ' has no card derivative'),
                 ...stale.map(f => f + ' derivative is older than its master'),
                 ...orphaned.map(f => 'photos/card/' + f + ' has no master')];
    if (bad.length) { bad.forEach(b => console.error('FAIL optimise-photos: ' + b)); process.exit(1); }
    console.log(`optimise-photos: ${masters.length} masters, every card derivative current`);
    return;
  }

  if (!sharp) {
    console.error('optimise-photos needs sharp to BUILD derivatives:  npm i -g sharp   (then run with NODE_PATH=/opt/node22/lib/node_modules)');
    process.exit(2);
  }
  fs.mkdirSync(OUT, { recursive: true });
  let before = 0, after = 0;
  for (const f of masters) {
    const src = path.join(PHOTOS, f);
    const dst = path.join(OUT, f.replace(/\.jpg$/i, '.webp'));
    const buf = await sharp(src)
      .resize({ width: CARD_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 5, smartSubsample: true })
      .toBuffer();
    fs.writeFileSync(dst, buf);
    before += fs.statSync(src).size; after += buf.length;
  }
  /* drop derivatives whose master went away, so photos/card/ never serves a card
     that no longer exists */
  const want = new Set(masters.map(f => f.replace(/\.jpg$/i, '.webp')));
  for (const f of fs.readdirSync(OUT)) if (!want.has(f)) { fs.unlinkSync(path.join(OUT, f)); console.log('  dropped orphan photos/card/' + f); }

  console.log(`${masters.length} photos: ${(before / 1024 / 1024).toFixed(1)} MB -> ${(after / 1024 / 1024).toFixed(1)} MB  (${(100 - after / before * 100).toFixed(1)}% smaller, capped at ${CARD_WIDTH}px)`);
})();
