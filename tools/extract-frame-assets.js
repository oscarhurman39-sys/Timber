#!/usr/bin/env node
/*
  extract-frame-assets.js — cut the panel artwork out of a special-edition frame.

    node tools/extract-frame-assets.js <frame.png> <name>
    node tools/extract-frame-assets.js art/frame-eternal-flame.png eternal-flame

  Writes art/holo/<name>-plaque.png, -soil.png and -band.png.

  WHY
  A commissioned frame usually draws its own stats plaque, soil panel and aspect
  band (they arrive whether the brief asks for them or not). Those drawn panels
  are then hidden under the standard parchment overlays, so the holo treatment
  stops at the border and the card's whole middle stays beige.

  This cuts them out so they can be put back where they belong. The crop
  rectangles are READ FROM THE APP'S OWN CSS, not copied here: the panel slots
  are defined once in timber.html and the natural sizes come from the standard
  art, so an extraction can never drift from where the panel actually lands.

  The labels (Bloom / Pests & diseases / Thirst / Care Level, SOIL, ASPECT) are
  baked into the standard parchment, NOT into the frame art, so the extracted
  panel is blank. The card keeps the parchment overlay on top in multiply, which
  preserves every label and icon while letting the artwork glow through — see
  the .holo block in timber.html.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const [frameArg, nameArg] = process.argv.slice(2);
if (!frameArg || !nameArg) {
  console.error('usage: node tools/extract-frame-assets.js <frame.png> <name>');
  process.exit(1);
}
const framePath = path.isAbsolute(frameArg) ? frameArg : path.join(ROOT, frameArg);
if (!fs.existsSync(framePath)) { console.error('frame not found: ' + framePath); process.exit(1); }

/* ---- panel slots, read from the app rather than duplicated ---- */
const html = fs.readFileSync(path.join(ROOT, 'timber.html'), 'utf8');
function rule(sel) {
  const m = new RegExp(`(^|\\n)\\s*\\${sel}\\s*\\{([^}]*)\\}`).exec(html);
  if (!m) throw new Error(`CSS rule ${sel} not found in timber.html`);
  const g = k => { const x = new RegExp(`(?:^|;|\\s)${k}:\\s*([\\d.]+)%`).exec(m[2]); return x ? Number(x[1]) : null; };
  return { left: g('left'), top: g('top'), width: g('width') };
}
function cardPx() {
  const m = /\.tcard\s*\{[^}]*?width:\s*(\d+)px;\s*height:\s*(\d+)px/.exec(html);
  if (!m) throw new Error('could not read .tcard size');
  return { w: Number(m[1]), h: Number(m[2]) };
}
/* natural sizes of the standard panels give each slot its height */
function pngSize(p) {
  const d = fs.readFileSync(p);
  if (d.slice(0, 8).toString('binary') !== '\x89PNG\r\n\x1a\n') throw new Error(p + ' is not a PNG');
  return { w: d.readUInt32BE(16), h: d.readUInt32BE(20) };
}

const CARD = cardPx();
/* `mask` lists the .patch rectangles the app lays over each panel to hide the
   parchment's BAKED SAMPLE VALUES ("Jul–Oct", "1/5", "3/5", "2/5", the lit month
   chips, the filled widget icons) before printing the real ones. Ink inside those
   rectangles is dropped during extraction, so a holo panel carries labels and
   furniture but no sample values — which means the card needs no patches over it
   at all, and the panel's artwork stays one continuous surface instead of being
   broken up by swatch rectangles. Rects are read from the CSS, as percentages of
   the panel, so they cannot drift from what the app actually covers. */
const PANELS = [
  { key: 'plaque', sel: '.plaque', art: 'art/plaque-full.png',
    mask: ['.p-bloom-val', '.p-pest-val', '.p-thirst-val', '.p-care-val',
      '.p-bloom-w', '.p-pest-w', '.p-thirst-w', '.p-care-w'] },
  { key: 'soil', sel: '.soilp', art: 'art/soil-full.png',
    mask: ['.s-val', '.s-warn', '.s-tri-cover'] },
  { key: 'band', sel: '.band', art: 'art/band-full.png',
    mask: ['.b-aspect', '.b-sun-cover', '.b-pointer-cover'] },
];

function maskRects(sels) {
  return sels.map(sel => {
    const m = new RegExp(`(^|\\n)\\s*\\${sel}\\s*\\{([^}]*)\\}`).exec(html);
    if (!m) { console.error(`  warn: mask rule ${sel} not found, skipping`); return null; }
    const g = k => { const x = new RegExp(`(?:^|;|\\s)${k}:\\s*([\\d.]+)%`).exec(m[2]); return x ? Number(x[1]) : null; };
    const r = { sel, left: g('left'), top: g('top'), width: g('width'), height: g('height') };
    return (r.left == null || r.top == null || r.width == null || r.height == null) ? null : r;
  }).filter(Boolean);
}

const slots = PANELS.map(p => {
  const r = rule(p.sel);
  const nat = pngSize(path.join(ROOT, p.art));
  /* the overlay is width-driven: rendered height = width% * cardW * (natH/natW) */
  const wPx = r.width / 100 * CARD.w;
  const hPct = (wPx * (nat.h / nat.w)) / CARD.h * 100;
  return { ...p, left: r.left, top: r.top, width: r.width, height: hPct, nat, mask: maskRects(p.mask || []) };
});

console.log(`card ${CARD.w}x${CARD.h}; slots read from timber.html:`);
for (const s of slots) {
  console.log(`  ${s.key.padEnd(7)} x ${s.left}%  y ${s.top.toFixed(2)}%  w ${s.width}%  h ${s.height.toFixed(2)}%   (source ${s.nat.w}x${s.nat.h})`);
}

(async () => {
  const { chromium } = require('playwright');
  const b64 = fs.readFileSync(framePath).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id=c></canvas>');
  const outDir = path.join(ROOT, 'art', 'holo');
  fs.mkdirSync(outDir, { recursive: true });

  /* the standard panels, loaded so their ink can be lifted off the parchment */
  const standards = {};
  for (const p of PANELS) standards[p.key] = fs.readFileSync(path.join(ROOT, p.art)).toString('base64');
  const swatchB64 = fs.readFileSync(path.join(ROOT, 'art', 'parch-swatch.png')).toString('base64');

  const results = await page.evaluate(async ({ uri, slots, standards, swatchB64 }) => {
    const img = new Image(); img.src = uri; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const out = [];

    /* Flatten artwork x parchment offline.
       This is the same idea as a CSS multiply, done once into an opaque PNG. Done
       in CSS it fails: multiply makes the panel translucent, the parchment's baked
       SAMPLE values ("Jul-Oct", "1/5", "3/5", "2/5") stop being hidden by the
       .patch swatches, and every card reads double. Flattened offline the result
       is fully opaque, so the patches keep working exactly as they do on a
       standard card -- and because the swatch is flattened with the SAME artwork,
       the patches tone-match the panel instead of sitting on it as beige blocks.
       Lifting the ink out instead was tried first and looked worse: the
       parchment's uneven vignette survives as a veil, and the masked value
       regions then stand out flat against it. */
    const flatten = async (artCanvas, overlayB64) => {
      const im = new Image(); im.src = 'data:image/png;base64,' + overlayB64; await im.decode();
      const x = artCanvas.getContext('2d');
      x.globalCompositeOperation = 'multiply';
      x.drawImage(im, 0, 0, artCanvas.width, artCanvas.height);
      x.globalCompositeOperation = 'source-over';
      return artCanvas;
    };

    for (const s of slots) {
      const sx = Math.round(s.left / 100 * W), sy = Math.round(s.top / 100 * H);
      const sw = Math.round(s.width / 100 * W), sh = Math.round(s.height / 100 * H);
      const c = document.createElement('canvas');
      /* keep the panel's own pixel density: match the standard art's natural size
         so the extracted panel drops into the same slot at the same resolution */
      c.width = s.nat.w; c.height = s.nat.h;
      const x = c.getContext('2d');
      x.imageSmoothingQuality = 'high';
      /* lift the artwork a little: the panel slots fall on the calmer part of the
         frame, and once ink is laid over the top a flat crop reads muddy */
      x.filter = 'saturate(1.35) contrast(1.08) brightness(1.04)';
      x.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);          // artwork
      x.filter = 'none';
      await flatten(c, standards[s.key]);                                  // x parchment
      out.push({ key: s.key, src: `${sx},${sy} ${sw}x${sh}`, w: c.width, h: c.height, png: c.toDataURL('image/png') });
    }

    /* A holo swatch for the value patches. They must stay OPAQUE (they hide the
       baked sample values), so this is a plain tile of frame artwork at the same
       size as parch-swatch.png, taken from a busy part of the plaque area. */
    {
      const sw0 = new Image(); sw0.src = 'data:image/png;base64,' + swatchB64; await sw0.decode();
      const c = document.createElement('canvas'); c.width = sw0.naturalWidth; c.height = sw0.naturalHeight;
      const x = c.getContext('2d');
      x.drawImage(img, Math.round(W * 0.30), Math.round(H * 0.64), Math.round(W * 0.12), Math.round(H * 0.06),
        0, 0, c.width, c.height);
      await flatten(c, swatchB64);
      out.push({ key: 'swatch', src: 'plaque interior', w: c.width, h: c.height, png: c.toDataURL('image/png') });
    }
    return out;
  }, { uri: `data:image/png;base64,${b64}`, slots, standards, swatchB64 });

  for (const r of results) {
    const f = path.join(outDir, `${nameArg}-${r.key}.png`);
    fs.writeFileSync(f, Buffer.from(r.png.split(',')[1], 'base64'));
    console.log(`wrote art/holo/${nameArg}-${r.key}.png  ${r.w}x${r.h}  (cropped from ${r.src})`);
  }
  await browser.close();
  console.log('\nAdd them to the card\'s HOLO entry in timber.html to use them.');
})();
