#!/usr/bin/env node
/*
  fit-pest-icon.js — size a commissioned pest drawing to the plaque's icon slot.

    NODE_PATH=/opt/node22/lib/node_modules node tools/fit-pest-icon.js <source.png> <key>
    ... --size 256      output square edge in px (default 256)
    ... --margin 6      clear margin around the subject, % of the output (default 6)
    ... --gain 1.15     multiply alpha, for art that arrives slightly soft
    ... --dry           measure and report, write nothing

  Writes art/pest/<key>.png. Run tools/optimise-art.js afterwards for the .webp
  the app actually loads.

  WHY
  Generated icon art arrives on a big square canvas with the subject floating
  somewhere in the middle at whatever size the model felt like — the slug came
  back 1254x1254 with the animal filling 64% of the width and 55% of the height,
  sitting off-centre. Dropped into the card as-is, that renders at roughly 18 x 14
  px inside a 29 px slot: a small smudge with a lot of air around it, and every
  future icon a different size again. The whole family has to sit at ONE scale or
  the plaque looks like it was assembled from a jumble sale.

  So the rule is mechanical and lives here rather than in whoever is drawing:
  crop to the subject's own alpha bounds, centre it in a square sized by its
  LONGER edge, add a fixed margin, resample once. A tall icon and a wide icon
  then both fill the slot to the same optical weight, which is what makes them
  read as a set.

  The slot itself is 76 x 77 px in art/plaque-full.png = about 29 CSS px on the
  card = about 26 px on a phone. That is the whole design constraint: at that
  size only the silhouette survives, so the tool also reports how much of the
  output the subject occupies and warns when a drawing is too fine to hold up.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUTDIR = path.join(ROOT, 'art', 'pest');

const argv = process.argv.slice(2);
const flag = (f, d = null) => { const i = argv.indexOf(f); return i === -1 ? d : argv[i + 1]; };
const has = f => argv.includes(f);
const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
const [srcArg, key] = positional;

if (!srcArg || !key) {
  console.error('usage: node tools/fit-pest-icon.js <source.png> <key> [--size 256] [--margin 6] [--gain 1] [--dry]');
  process.exit(1);
}
if (!/^[a-z][a-z0-9-]*$/.test(key)) {
  console.error(`key "${key}" must be lower-case letters, digits and hyphens — it is used as a filename and a data value`);
  process.exit(1);
}
const SIZE = Number(flag('--size', 256));
const MARGIN = Number(flag('--margin', 6));
const GAIN = Number(flag('--gain', 1));
if (!Number.isFinite(SIZE) || SIZE < 32) { console.error('--size must be at least 32'); process.exit(1); }
if (!Number.isFinite(MARGIN) || MARGIN < 0 || MARGIN >= 40) { console.error('--margin must be 0..40 (%)'); process.exit(1); }
if (!Number.isFinite(GAIN) || GAIN <= 0) { console.error('--gain must be positive'); process.exit(1); }

const srcPath = path.isAbsolute(srcArg) ? srcArg : path.join(ROOT, srcArg);
if (!fs.existsSync(srcPath)) { console.error('source not found: ' + srcPath); process.exit(1); }

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id=c></canvas>');
  const uri = 'data:image/png;base64,' + fs.readFileSync(srcPath).toString('base64');

  const res = await page.evaluate(async ({ uri, SIZE, MARGIN, GAIN }) => {
    const img = new Image(); img.src = uri; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const src = document.createElement('canvas'); src.width = W; src.height = H;
    const sx = src.getContext('2d'); sx.drawImage(img, 0, 0);
    const d = sx.getImageData(0, 0, W, H).data;

    /* alpha bounds of the subject. 16 rather than 0: generated art carries a
       haze of 1-3 alpha across the whole canvas and a zero threshold returns
       the entire frame, which silently defeats the crop. */
    let minx = 1e9, miny = 1e9, maxx = -1, maxy = -1, maxA = 0, sumA = 0, n = 0;
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const a = d[(py * W + px) * 4 + 3];
      if (a > maxA) maxA = a;
      if (a > 16) { sumA += a; n++;
        if (px < minx) minx = px; if (px > maxx) maxx = px;
        if (py < miny) miny = py; if (py > maxy) maxy = py; }
    }
    if (maxx < 0) return { error: 'source is fully transparent' };
    const sw = maxx - minx + 1, sh = maxy - miny + 1;

    /* square by the LONGER edge so wide and tall icons carry the same weight */
    const long = Math.max(sw, sh);
    const inner = SIZE * (1 - MARGIN / 100 * 2);
    const k = inner / long;
    const dw = Math.round(sw * k), dh = Math.round(sh * k);

    const out = document.createElement('canvas'); out.width = SIZE; out.height = SIZE;
    const ox = out.getContext('2d');
    ox.imageSmoothingEnabled = true; ox.imageSmoothingQuality = 'high';
    ox.drawImage(src, minx, miny, sw, sh, Math.round((SIZE - dw) / 2), Math.round((SIZE - dh) / 2), dw, dh);

    if (GAIN !== 1) {
      const im = ox.getImageData(0, 0, SIZE, SIZE), a = im.data;
      for (let i = 3; i < a.length; i += 4) a[i] = Math.min(255, Math.round(a[i] * GAIN));
      ox.putImageData(im, 0, 0);
    }
    return { W, H, subject: { x: minx, y: miny, w: sw, h: sh },
      srcFillPct: +(long / Math.max(W, H) * 100).toFixed(1),
      maxAlpha: maxA, meanAlpha: +(sumA / n).toFixed(1),
      out: { w: dw, h: dh }, png: out.toDataURL('image/png') };
  }, { uri, SIZE, MARGIN, GAIN });

  await browser.close();
  if (res.error) { console.error('ABORT: ' + res.error); process.exit(1); }

  const slotCss = 29;                        // the icon slot, in CSS px on the card
  const onCard = +(res.out.w / SIZE * slotCss).toFixed(1);
  console.log(`source      ${res.W}x${res.H}, subject ${res.subject.w}x${res.subject.h} at (${res.subject.x},${res.subject.y}) — filled ${res.srcFillPct}% of the canvas`);
  console.log(`alpha       peak ${res.maxAlpha}/255, mean ${res.meanAlpha} over the subject`);
  console.log(`output      ${SIZE}x${SIZE}, subject ${res.out.w}x${res.out.h} (${MARGIN}% margin)`);
  console.log(`on the card ${onCard} x ${(res.out.h / SIZE * slotCss).toFixed(1)} CSS px in a ${slotCss}px slot`);
  if (res.maxAlpha < 230) console.log(`WARNING     peak alpha is only ${res.maxAlpha} — the icon will read washed out. Re-run with --gain ${(250 / res.maxAlpha).toFixed(2)}`);
  if (res.srcFillPct < 35) console.log(`NOTE        the subject was small on its canvas, so it has been scaled up ${(1 / (res.srcFillPct / 100)).toFixed(1)}x — check it has not gone soft`);

  if (has('--dry')) { console.log('\n--dry: nothing written'); return; }
  fs.mkdirSync(OUTDIR, { recursive: true });
  const outPath = path.join(OUTDIR, key + '.png');
  fs.writeFileSync(outPath, Buffer.from(res.png.split(',')[1], 'base64'));
  console.log(`\nwrote art/pest/${key}.png (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
  console.log(`next:  NODE_PATH=/opt/node22/lib/node_modules node tools/optimise-art.js`);
})();
