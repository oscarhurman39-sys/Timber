#!/usr/bin/env node
/* optimise-photos.js — derive the card-sized WebP the app actually loads.
   Run: NODE_PATH=/opt/node22/lib/node_modules node tools/optimise-photos.js
        ... --check   report only, change nothing (used by tests/run-all.js --fast)
        ... --only <file.jpg>   rebuild one derivative (used by add-plant/deal-plant)

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
/* --only <file> builds ONE derivative. It exists so the tools that stage a photo
   can build the file the app actually loads, in the same pass, with the same
   encoder — see the note on ONE below. */
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i === -1 ? null : process.argv[i + 1]; })();

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

  let masters = fs.readdirSync(PHOTOS).filter(isMaster).sort();
  if (!masters.length) { console.error('no photo masters found in photos/'); process.exit(2); }
  if (ONLY) {
    const want = path.basename(ONLY);
    if (!masters.includes(want)) { console.error('optimise-photos --only: no such master photos/' + want); process.exit(2); }
    masters = [want];
  }

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
    /* MISSING and ORPHANED are fatal; STALE is not, and the difference is whether
       the test is sound off this machine.

       Missing and orphaned are answered by fs.existsSync, which means the same
       thing in every checkout. Stale is answered by comparing mtimes — and git
       does not preserve mtimes. On a fresh clone every file is stamped with the
       checkout time, so which of a master and its derivative looks "newer" is
       arbitrary noise.

       That went unnoticed for as long as this check quietly exited 0 whenever
       sharp was absent, which is every CI runner. Making the check actually run
       (2026-09-14, so a photo-less card could not ship green) turned the noise
       into a hard failure and broke the deploy on the very next push: 300-odd
       "derivative is older than its master" lines on a tree where nothing was
       stale at all. The gate did its job — nothing was published — but the gate
       was wrong.

       So stale now warns. It is still worth printing: in a working tree where
       the files were really generated the mtimes are real, and "you edited a
       master and forgot to rebuild" is a thing that happens. It is just not
       evidence anywhere else, and it is not the failure that ships a broken
       card. Missing is, and missing stays fatal everywhere. */
    const bad = [...missing.map(f => f + ' has no card derivative'),
                 ...orphaned.map(f => 'photos/card/' + f + ' has no master')];
    if (stale.length) {
      console.error(`optimise-photos: ${stale.length} derivative(s) older than their master by mtime.`);
      console.error('  Not failing on it: git does not preserve mtimes, so this is only');
      console.error('  meaningful in a tree where the derivatives were actually generated.');
      console.error('  If you edited a master here, run: node tools/optimise-photos.js');
      if (stale.length <= 8) stale.forEach(f => console.error('    ' + f));
    }
    if (bad.length) { bad.forEach(b => console.error('FAIL optimise-photos: ' + b)); process.exit(1); }
    console.log(`optimise-photos: ${masters.length} masters, every derivative present` +
                (stale.length ? ` (${stale.length} flagged stale by mtime — see above)` : ''));
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
  if (!ONLY) {
    /* Only the FULL pass may sweep orphans. A --only run knows about one master,
       so every other derivative would look orphaned to it. */
    const want = new Set(masters.map(f => f.replace(/\.jpg$/i, '.webp')));
    for (const f of fs.readdirSync(OUT)) if (!want.has(f)) { fs.unlinkSync(path.join(OUT, f)); console.log('  dropped orphan photos/card/' + f); }
  }

  console.log(`${masters.length} photos: ${(before / 1024 / 1024).toFixed(1)} MB -> ${(after / 1024 / 1024).toFixed(1)} MB  (${(100 - after / before * 100).toFixed(1)}% smaller, capped at ${CARD_WIDTH}px)`);
})();
