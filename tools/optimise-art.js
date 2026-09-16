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

/* Read a PNG's pixel dimensions from its IHDR header — 24 bytes, no decoder and
   no dependency. Used by the shape check below, which has to run on machines
   without sharp (which is all of them here) or it is not a check. */
function pngSize(file) {
  const b = Buffer.alloc(24);
  const fd = fs.openSync(file, 'r');
  try { fs.readSync(fd, b, 0, 24, 0); } finally { fs.closeSync(fd); }
  if (b.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

/* THE CARD'S CSS HARDCODES THE SHAPE OF THIS ARTWORK.
   Since CARD-PROTOCOL v14.61 the shared card furniture is drawn with
   background-image rather than <img>, which took away the one thing an <img>
   gave for free: the element's height, derived from the file. Those ratios are
   written into timber.html as `aspect-ratio` now, so a master that gets
   re-cropped no longer moves the layout — it DISTORTS the artwork inside a box
   that is still the old shape, on every card, silently.
   This maps each hardcoded ratio back to the master it was taken from. */
const SHAPES = [
  ['crest-blank',     /\.crest\{[^}]*?aspect-ratio:(\d+)\/(\d+)/s],
  ['plaque-full',     /\.plaque\{[^}]*?aspect-ratio:(\d+)\/(\d+)/s],
  ['soil-full',       /\.soilp\{[^}]*?aspect-ratio:(\d+)\/(\d+)/s],
  ['band-full',       /\.band\{[^}]*?aspect-ratio:(\d+)\/(\d+)/s],
  ['growth-diamond',  /\.growth \.mk\{[^}]*?aspect-ratio:(\d+)\/(\d+)/s],
  ['widget-drop-out',  /\.ricon-drop\{--w-ar:(\d+)\/(\d+)/],
  ['widget-seca-out',  /\.ricon-seca\{--w-ar:(\d+)\/(\d+)/],
  ['widget-spray-out', /\.ricon-spray\{--w-ar:(\d+)\/(\d+)/],
];

function checkShapes() {
  const html = fs.readFileSync(path.join(ROOT, 'timber.html'), 'utf8');
  const bad = [];
  for (const [name, re] of SHAPES) {
    const master = path.join(ART, name + '.png');
    if (!fs.existsSync(master)) { bad.push(`${name}.png missing — nothing to check the CSS shape against`); continue; }
    const m = re.exec(html);
    if (!m) { bad.push(`no aspect-ratio found in timber.html for ${name} — did the rule get renamed?`); continue; }
    const size = pngSize(master);
    if (!size) { bad.push(`${name}.png is not a readable PNG`); continue; }
    if (+m[1] !== size.w || +m[2] !== size.h)
      bad.push(`${name}.png is ${size.w}x${size.h} but timber.html draws it at aspect-ratio:${m[1]}/${m[2]} — the art would stretch`);
  }
  return bad;
}

(async () => {
  /* SHARP IS NOT NEEDED TO CHECK, ONLY TO BUILD. This used to `process.exit(0)`
     the moment require('sharp') threw, so --check printed nothing and passed on
     every machine without sharp — which is every machine that runs the gate here.
     tests/run-all.js reported "every art master has a current .webp derivative"
     while proving no such thing. That is the same shape of bug as the
     optimise-photos one that shipped five blank cards, and the same fix: the
     check path below is pure fs, so it runs first and on its own. */
  let sharp = null;
  try { sharp = require('sharp'); } catch (e) { /* only the generate path needs it */ }

  const pngs = walk(ART).sort();
  let before = 0, after = 0, written = 0, stale = [], missing = [];

  for (const png of pngs) {
    const webp = png.replace(/\.png$/, '.webp');
    const src = fs.statSync(png);
    if (src.size < MIN_BYTES) {
      /* a threshold change can strand a .webp the app no longer wants */
      if (!CHECK && fs.existsSync(webp)) { fs.unlinkSync(webp); console.log(`   drop ${path.relative(ROOT, webp)} — master is under the threshold`); }
      continue;
    }

    if (CHECK) {
      /* MISSING and STALE are kept apart because they are not equally trustworthy
         off this machine — see the note at the check below. */
      if (!fs.existsSync(webp)) missing.push(path.relative(ROOT, webp) + ' missing');
      else if (fs.statSync(webp).mtimeMs < src.mtimeMs) stale.push(path.relative(ROOT, webp));
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
    /* MISSING is fatal; STALE is not, and the difference is whether the test is
       sound off this machine. This is the second of the two faults recorded in
       VERIFY-QUEUE item 90, and the item is explicit that they have to be fixed
       together: fixing only the first — making the check actually run without
       sharp — is what turned deploy run 98 red with ~300 bogus staleness lines on
       a tree where nothing was stale. It was fixed alone here on 2026-09-16 and
       this is the same-session correction, before it ever reached the deploy.

       Missing is answered by fs.existsSync, which means the same thing in every
       checkout, and missing is the failure that ships a card with no artwork.
       Stale is answered by comparing mtimes, and git does not preserve mtimes: on
       a fresh clone every file carries the checkout time, so which of a master and
       its derivative looks newer is arbitrary noise. It is still worth PRINTING —
       in a working tree where the derivatives were really generated the mtimes are
       real, and "edited a master, forgot to rebuild" happens — it is just not
       evidence anywhere else. Same resolution as optimise-photos (commit 8e250f2).

       The shape check joins MISSING as fatal: it reads PNG headers and CSS text,
       both of which mean the same thing in every checkout. */
    const shapes = checkShapes();
    if (stale.length) {
      console.error(`optimise-art: ${stale.length} derivative(s) older than their master by mtime.`);
      console.error('  Not failing on it: git does not preserve mtimes, so this is only');
      console.error('  meaningful in a tree where the derivatives were actually generated.');
      console.error('  If you repainted a master here, run: node tools/optimise-art.js');
      if (stale.length <= 8) stale.forEach((f) => console.error('    ' + f));
    }
    const bad = [...missing, ...shapes];
    if (bad.length) { bad.forEach((m) => console.error('FAIL optimise-art: ' + m)); process.exit(1); }
    console.log(`optimise-art: every art master has a current .webp, and all ${SHAPES.length} hardcoded card shapes match their masters` +
                (stale.length ? ` (${stale.length} flagged stale by mtime — see above)` : ''));
    return;
  }

  if (!sharp) {
    console.error('optimise-art needs sharp to BUILD derivatives:  npm i -g sharp   (then run with NODE_PATH=/opt/node22/lib/node_modules)');
    process.exit(2);
  }
  console.log(`\n${written} files: ${(before / 1024 / 1024).toFixed(1)} MB -> ${(after / 1024 / 1024).toFixed(2)} MB  (${(100 - after / before * 100).toFixed(1)}% smaller)`);
})();
