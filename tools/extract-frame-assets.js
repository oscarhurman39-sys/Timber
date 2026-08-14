#!/usr/bin/env node
/*
  extract-frame-assets.js — cut the panel artwork out of a special-edition frame.

    node tools/extract-frame-assets.js <frame.png> <name>
    node tools/extract-frame-assets.js art/frame-eternal-flame.png eternal-flame \
        --ground 30,10,48,44 --calm 0.5

  Writes art/holo/<name>-plaque.png, -soil.png and -band.png.

  Options
    --ground x,y,w,h  take the panel GROUND texture from this region of the frame
                      (percent), instead of from the panel's own slot. Frames
                      usually paint their own plaque — rules, borders and all —
                      inside the slot, and parchment ink multiplied over painted
                      furniture doubles every line. A clean streak region gives
                      the same holo surface with exactly one set of furniture:
                      the parchment's.
    --calm N          0..1: mix the ground toward the standard parchment's own
                      ground tone before the ink lands. 0 = raw artwork (vivid,
                      ink struggles), 1 = reproduces the standard panel almost
                      exactly. The readable-but-still-holo zone is the middle.
    --ink-key LO,HI   transfer ONLY the parchment's ink, not its surface. The
                      whole-panel multiply tints the ground with the parchment's
                      cream (x0.87,0.71,0.45 per channel) — right when the target
                      IS parchment-adjacent (Eternal Flame + --calm), wrong when
                      the frame's own material must survive (a pearl frame goes
                      tan, i.e. straight back to the paper look the special
                      panels replaced). Per pixel: distance from the parchment's
                      ground tone below LO transfers nothing, above HI transfers
                      fully, cosine in between. LO exists because plain ink
                      lifting was tried before and rejected — the parchment's
                      vignette survived as a veil (see the flatten note below);
                      LO is the veil threshold, and 30,90 clears it while keeping
                      labels (dist 100+) and icons intact. A 3% feathered edge
                      margin also drops the parchment's own outer border, which
                      would otherwise double the frame box's border.

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

const argvAll = process.argv.slice(2);
const flagOf = (f, d = null) => { const i = argvAll.indexOf(f); return i === -1 ? d : argvAll[i + 1]; };
const [frameArg, nameArg] = argvAll.filter((a, i) => !a.startsWith('--') && !(i > 0 && argvAll[i - 1].startsWith('--')));
const GROUND = flagOf('--ground') ? flagOf('--ground').split(',').map(Number) : null;
if (GROUND && (GROUND.length !== 4 || GROUND.some(n => !Number.isFinite(n)))) { console.error('--ground must be x,y,w,h in percent'); process.exit(1); }
const CALM = Number(flagOf('--calm', 0));
if (!(CALM >= 0 && CALM <= 1)) { console.error('--calm must be 0..1'); process.exit(1); }
const INKKEY = flagOf('--ink-key') ? flagOf('--ink-key').split(',').map(Number) : null;
if (INKKEY && (INKKEY.length !== 2 || INKKEY.some(n => !Number.isFinite(n)) || INKKEY[0] >= INKKEY[1])) {
  console.error('--ink-key must be LO,HI with LO < HI'); process.exit(1);
}
if (!frameArg || !nameArg) {
  console.error('usage: node tools/extract-frame-assets.js <frame.png> <name> [--ground x,y,w,h] [--calm 0..1] [--ink-key LO,HI]');
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

  const results = await page.evaluate(async ({ uri, slots, standards, swatchB64, GROUND, CALM, INKKEY }) => {
    const img = new Image(); img.src = uri; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const out = [];

    /* the parchment's own ground tone: the average of its light pixels (the
       cream, not the ink). Mixing the artwork toward this before the multiply
       is what buys the ink its contrast back. */
    const groundTone = async (b64) => {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 200) continue;
        const l = (Math.max(d[i], d[i + 1], d[i + 2]) + Math.min(d[i], d[i + 1], d[i + 2])) / 510;
        if (l > 0.62) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      }
      return n ? `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})` : 'rgb(232,220,196)';
    };

    /* draw the panel ground at target size: either the slot's own crop (legacy)
       or, with --ground, the largest target-aspect sub-rect centred inside the
       clean region — abstract streaks survive the re-crop, painted furniture
       is never present to survive anything. */
    const drawGround = (x, c, slotRect) => {
      let sx, sy, sw, sh;
      if (GROUND) {
        const gx = GROUND[0] / 100 * W, gy = GROUND[1] / 100 * H, gw = GROUND[2] / 100 * W, gh = GROUND[3] / 100 * H;
        const want = c.width / c.height;
        sw = gw; sh = gw / want;
        if (sh > gh) { sh = gh; sw = gh * want; }
        sx = gx + (gw - sw) / 2; sy = gy + (gh - sh) / 2;
      } else ({ sx, sy, sw, sh } = slotRect);
      x.filter = 'saturate(1.35) contrast(1.08) brightness(1.04)';
      x.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      x.filter = 'none';
      return `${Math.round(sx)},${Math.round(sy)} ${Math.round(sw)}x${Math.round(sh)}`;
    };

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

    /* --ink-key: the multiply, gated per pixel by how far the parchment pixel
       sits from the parchment's own ground tone. Ground-tone pixels (the cream,
       the grain, most of the vignette) transfer nothing, so the frame's material
       survives untinted; ink and icons (a long way from the ground tone)
       transfer as a normal multiply. The 3% feathered edge margin stops the
       parchment's outer border re-drawing itself on top of the frame box's own
       border. */
    const flattenKeyed = async (artCanvas, overlayB64, LO, HI) => {
      const tone = /(\d+),(\d+),(\d+)/.exec(await groundTone(overlayB64)).slice(1, 4).map(Number);
      const im = new Image(); im.src = 'data:image/png;base64,' + overlayB64; await im.decode();
      const W2 = artCanvas.width, H2 = artCanvas.height;
      const oc = document.createElement('canvas'); oc.width = W2; oc.height = H2;
      const ox = oc.getContext('2d'); ox.imageSmoothingQuality = 'high';
      ox.drawImage(im, 0, 0, W2, H2);
      const o = ox.getImageData(0, 0, W2, H2).data;
      const x = artCanvas.getContext('2d');
      const gd = x.getImageData(0, 0, W2, H2);
      const g = gd.data;
      const mx = Math.max(2, Math.round(W2 * 0.03)), my = Math.max(2, Math.round(H2 * 0.03));
      for (let py = 0; py < H2; py++) for (let px = 0; px < W2; px++) {
        const i = (py * W2 + px) * 4;
        const dist = Math.max(Math.abs(o[i] - tone[0]), Math.abs(o[i + 1] - tone[1]), Math.abs(o[i + 2] - tone[2]));
        let a = (dist - LO) / (HI - LO);
        if (a <= 0) continue;
        if (a > 1) a = 1;
        a = (1 - Math.cos(a * Math.PI)) / 2;                       // cosine ramp, no hard key edge
        const e = Math.min(Math.min(px, W2 - 1 - px) / mx, Math.min(py, H2 - 1 - py) / my);
        if (e < 1) a *= Math.max(0, e);
        if (a <= 0) continue;
        g[i]     = g[i]     * (1 - a) + (g[i]     * o[i]     / 255) * a;
        g[i + 1] = g[i + 1] * (1 - a) + (g[i + 1] * o[i + 1] / 255) * a;
        g[i + 2] = g[i + 2] * (1 - a) + (g[i + 2] * o[i + 2] / 255) * a;
      }
      x.putImageData(gd, 0, 0);
      return artCanvas;
    };

    for (const s of slots) {
      const slotRect = {
        sx: Math.round(s.left / 100 * W), sy: Math.round(s.top / 100 * H),
        sw: Math.round(s.width / 100 * W), sh: Math.round(s.height / 100 * H),
      };
      const c = document.createElement('canvas');
      /* keep the panel's own pixel density: match the standard art's natural size
         so the extracted panel drops into the same slot at the same resolution */
      c.width = s.nat.w; c.height = s.nat.h;
      const x = c.getContext('2d');
      x.imageSmoothingQuality = 'high';
      const src = drawGround(x, c, slotRect);                              // artwork ground
      if (CALM > 0) {                                                      // toward parchment tone
        x.globalAlpha = CALM; x.fillStyle = await groundTone(standards[s.key]);
        x.fillRect(0, 0, c.width, c.height); x.globalAlpha = 1;
      }
      if (INKKEY) await flattenKeyed(c, standards[s.key], INKKEY[0], INKKEY[1]);
      else await flatten(c, standards[s.key]);                             // x parchment
      out.push({ key: s.key, src, w: c.width, h: c.height, png: c.toDataURL('image/png') });
    }

    /* A holo swatch for the value patches. They must stay OPAQUE (they hide the
       baked sample values), so this is a plain tile of frame artwork at the same
       size as parch-swatch.png, taken from a busy part of the plaque area. */
    {
      const sw0 = new Image(); sw0.src = 'data:image/png;base64,' + swatchB64; await sw0.decode();
      const c = document.createElement('canvas'); c.width = sw0.naturalWidth; c.height = sw0.naturalHeight;
      const x = c.getContext('2d');
      /* same ground pipeline as the panels — a patch cut hotter than the panel
         it covers reads as a glowing rectangle, which is the exact tone-mismatch
         the patches exist to avoid */
      const src = drawGround(x, c, {
        sx: Math.round(W * 0.30), sy: Math.round(H * 0.64),
        sw: Math.round(W * 0.12), sh: Math.round(H * 0.06),
      });
      if (CALM > 0) {
        x.globalAlpha = CALM; x.fillStyle = await groundTone(swatchB64);
        x.fillRect(0, 0, c.width, c.height); x.globalAlpha = 1;
      }
      if (INKKEY) await flattenKeyed(c, swatchB64, INKKEY[0], INKKEY[1]);  // parch-swatch is pure surface: keyed, nothing transfers, the swatch is clean ground
      else await flatten(c, swatchB64);
      out.push({ key: 'swatch', src, w: c.width, h: c.height, png: c.toDataURL('image/png') });
    }
    return out;
  }, { uri: `data:image/png;base64,${b64}`, slots, standards, swatchB64, GROUND, CALM, INKKEY });

  for (const r of results) {
    const f = path.join(outDir, `${nameArg}-${r.key}.png`);
    fs.writeFileSync(f, Buffer.from(r.png.split(',')[1], 'base64'));
    console.log(`wrote art/holo/${nameArg}-${r.key}.png  ${r.w}x${r.h}  (cropped from ${r.src})`);
  }
  await browser.close();
  console.log('\nAdd them to the card\'s HOLO entry in timber.html to use them.');
})();
