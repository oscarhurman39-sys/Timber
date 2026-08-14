#!/usr/bin/env node
/* optimise-art.js — re-encode the card artwork as WebP for the network.
   Run: NODE_PATH=/opt/node22/lib/node_modules node tools/optimise-art.js
        ... --check   report only, change nothing (used by tests/run-all.js --fast)

   WHY THIS EXISTS

   The artwork is painted, so it is photographic in the way PNG is worst at: no
   flat runs to pack, an alpha channel on every frame, and 1100px of it. The five
   biggest files were 3.6 MB, 3.3 MB, 2.6 MB, 2.4 MB and 1.7 MB. A phone opening
   the deck pulled about 13 MB of card art before it could show a single card —
   most of it for the two special cards, which are buried a long way down and
   which the card templates reference from the markup, so every card in the DOM
   asks for them at once.

   Lossy WebP with a full-quality alpha channel gives that back at roughly a
   twentieth of the bytes with no visible difference at card size. Nothing is
   resampled: the pixel dimensions are preserved exactly, because the overlay
   anchors in tools/template-geometry.js are percentages measured against them,
   and a resize would silently move every plaque, rail and crest on the card.

   The PNGs stay in the repo. They are the masters the design tools
   (design/card-builder.html, design/extract-locked-template.js,
   tools/extract-anim-strips.js) read, and re-deriving a WebP is lossless from
   the master but not from a previous WebP. Only the app loads the .webp. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ART = path.join(ROOT, 'art');
const CHECK = process.argv.includes('--check');

/* Sprite strips are played by jumping background-position between cells, so a
   lossy encoder that bleeds across a cell edge shows up as a smear mid-animation.
   They get the high-quality setting; everything else gets the default.

   smartSubsample is not optional here. WebP's default 4:2:0 chroma subsampling
   throws away colour detail, and this artwork is saturated gold on deep green —
   exactly the case it handles worst. Measured against the master, composited over
   the deck background at card size: q82 flat gave 3.6 RMS, q90 with smart
   subsampling gives 2.5 for 120 KB more, and the encoder stops improving after
   that. Under ~3 RMS is not visible at the size a card paints. */
const STRIP = /[\\/]anim[\\/]/;
const Q_DEFAULT = 90;
const Q_STRIP = 94;
const WEBP = { alphaQuality: 100, effort: 6, smartSubsample: true };

/* Small assets are left as PNG masters. They are the worst per-pixel performers
   (soft-edged icons, mostly alpha) for the least return — the whole widget set
   saves about 20 KB between them, once, and they are the files where a lossy
   encoder is most likely to show. Only art heavy enough to matter is converted. */
const MIN_BYTES = 32 * 1024;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : (e.name.endsWith('.png') ? [p] : []);
  });
}

(async () => {
  let sharp;
  try { sharp = require('sharp'); }
  catch (e) {
    if (CHECK) { console.log('optimise-art: sharp not installed — skipping check'); process.exit(0); }
    console.error('optimise-art needs sharp:  npm i -g sharp   (then run with NODE_PATH=/opt/node22/lib/node_modules)');
    process.exit(2);
  }

  const pngs = walk(ART).sort();
  let before = 0, after = 0, written = 0, stale = [];

  for (const png of pngs) {
    const webp = png.replace(/\.png$/, '.webp');
    const src = fs.statSync(png);
    if (src.size < MIN_BYTES) {
      /* a threshold change can strand a .webp the app no longer wants */
      if (!CHECK && fs.existsSync(webp)) { fs.unlinkSync(webp); console.log(`   drop ${path.relative(ROOT, webp)} — master is under the threshold`); }
      continue;
    }

    if (CHECK) {
      /* the only thing a check can prove cheaply: the app's .webp exists and is
         not older than the master it was derived from */
      if (!fs.existsSync(webp)) stale.push(path.relative(ROOT, webp) + ' missing');
      else if (fs.statSync(webp).mtimeMs < src.mtimeMs) stale.push(path.relative(ROOT, webp) + ' older than its .png');
      continue;
    }

    const q = STRIP.test(png) ? Q_STRIP : Q_DEFAULT;
    const meta = await sharp(png).metadata();
    const buf = await sharp(png)
      .webp({ quality: q, ...WEBP })
      .toBuffer();

    /* dimensions are load-bearing — refuse to ship a file that moved them */
    const out = await sharp(buf).metadata();
    if (out.width !== meta.width || out.height !== meta.height)
      throw new Error(`${png}: ${meta.width}x${meta.height} became ${out.width}x${out.height}`);

    if (buf.length >= src.size) { console.log(`   skip ${path.relative(ROOT, png)} — webp is no smaller`); continue; }

    fs.writeFileSync(webp, buf);
    before += src.size; after += buf.length; written++;
    console.log(`  ${(src.size / 1024).toFixed(0).padStart(6)} KB -> ${(buf.length / 1024).toFixed(0).padStart(5)} KB  q${q}  ${path.relative(ROOT, png)}`);
  }

  if (CHECK) {
    if (stale.length) { stale.forEach(s => console.error('FAIL optimise-art: ' + s)); process.exit(1); }
    console.log('optimise-art: every art master has a current .webp');
    return;
  }
  console.log(`\n${written} files: ${(before / 1024 / 1024).toFixed(1)} MB -> ${(after / 1024 / 1024).toFixed(2)} MB  (${(100 - after / before * 100).toFixed(1)}% smaller)`);
})();
