#!/usr/bin/env node
/*
  extract-anim-strips.js — turn a folder of animation frames into sprite strips.

    node tools/extract-anim-strips.js <framesDir> <name> \
        --layer 'ring:0,0,100,100:cuts=20,58,42,42+62,74,16,26' \
        --layer 'sprigA:20,58,42,42' \
        --layer 'sprigB:62,74,16,26' \
        --scale 0.5

  Reads frame_01.png .. frame_NN.png from <framesDir> and writes one
  art/anim/<name>-<layer>.png per layer: all N cells side by side in a single
  horizontal strip, cropped to the layer's rect (percent of the frame canvas).

  WHY A STRIP AND NOT TEN FILES
  Ten separate files mean ten fetches, ten decodes, and a chance for mobile
  Chrome to flash mid-swap while a frame is still decoding. A strip is one
  fetch and one decode, and "changing frame" is just background-position on an
  image that is already in memory — the flash is structurally impossible, not
  merely mitigated by preloading.

  WHY LAYERS MUST NOT SHARE CONNECTED ART
  Layers exist so they can be phase-shifted against each other (the whole point:
  nothing changes on exactly the same tick). Two layers that both contain part
  of one connected branch will show that branch in two different frames at once
  — a crack straight through the artwork. So: one layer per CONNECTED piece,
  and `cuts=` zeroes another layer's zone out of a bigger layer so a floating
  sprig can be phased independently of the ring it visually sits inside.
  Seams through the soft glow are invisible; seams through solid wood are not.
  Check occupancy before choosing rects (see the Avondale build).

  The layer spec is  name:x,y,w,h[:cuts=x,y,w,h+x,y,w,h...]  all in percent of
  the source frame canvas. The printed snippet is ready for the ANIM config.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const argv = process.argv.slice(2);
const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
const [dirArg, nameArg] = positional;
const SCALE = Number((argv[argv.indexOf('--scale') + 1] || 1));
const layerSpecs = argv.flatMap((a, i) => a === '--layer' ? [argv[i + 1]] : []);
const SKIP = new Set((argv[argv.indexOf('--skip') + 1] || '').split(',').filter(s => argv.includes('--skip')).map(Number));

if (!dirArg || !nameArg || !layerSpecs.length) {
  console.error("usage: node tools/extract-anim-strips.js <framesDir> <name> --layer 'name:x,y,w,h[:cuts=x,y,w,h+...]' [--layer ...] [--scale N]");
  process.exit(1);
}

const LAYERS = layerSpecs.map(s => {
  const [name, rectS, cutS] = s.split(':');
  const rect = rectS.split(',').map(Number);
  const cuts = cutS && cutS.startsWith('cuts=')
    ? cutS.slice(5).split('+').map(c => c.split(',').map(Number)) : [];
  if (rect.length !== 4 || rect.some(n => !Number.isFinite(n))) { console.error('bad rect in --layer ' + s); process.exit(1); }
  return { name, rect, cuts };
});

const dir = path.isAbsolute(dirArg) ? dirArg : path.join(ROOT, dirArg);
const frames = fs.readdirSync(dir).filter(f => /^frame_(\d+)\.png$/.test(f))
  .filter(f => !SKIP.has(Number(/(\d+)/.exec(f)[1]))).sort();
if (SKIP.size) console.log('skipping frame(s): ' + [...SKIP].join(', '));
if (frames.length < 2) { console.error(`found ${frames.length} frame_NN.png files in ${dir} — need at least 2`); process.exit(1); }

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<div></div>');
  const uris = frames.map(f => 'data:image/png;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64'));

  const results = await page.evaluate(async ({ uris, LAYERS, SCALE }) => {
    const imgs = [];
    for (const u of uris) { const i = new Image(); i.src = u; await i.decode(); imgs.push(i); }
    const W = imgs[0].naturalWidth, H = imgs[0].naturalHeight;
    for (const i of imgs) if (i.naturalWidth !== W || i.naturalHeight !== H) throw new Error('frames differ in size — the sequence is not registration-locked');
    const out = [];
    for (const L of LAYERS) {
      const [rx, ry, rw, rh] = L.rect;
      const sx = Math.round(rx / 100 * W), sy = Math.round(ry / 100 * H);
      const sw = Math.round(rw / 100 * W), sh = Math.round(rh / 100 * H);
      const cw = Math.round(sw * SCALE), ch = Math.round(sh * SCALE);
      const c = document.createElement('canvas'); c.width = cw * imgs.length; c.height = ch;
      const x = c.getContext('2d');
      x.imageSmoothingQuality = 'high';
      imgs.forEach((im, i) => x.drawImage(im, sx, sy, sw, sh, i * cw, 0, cw, ch));
      /* zero the cut zones in every cell — those pixels belong to another layer */
      for (const cut of L.cuts) {
        const cxp = (cut[0] - rx) / rw, cyp = (cut[1] - ry) / rh;
        const cwp = cut[2] / rw, chp = cut[3] / rh;
        for (let i = 0; i < imgs.length; i++) {
          x.clearRect(i * cw + cxp * cw, cyp * ch, cwp * cw, chp * ch);
        }
      }
      out.push({ name: L.name, cells: imgs.length, cw, ch, png: c.toDataURL('image/png') });
    }
    return out;
  }, { uris, LAYERS, SCALE });

  const outDir = path.join(ROOT, 'art', 'anim');
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`${frames.length} frames from ${dirArg}, scale ${SCALE}:`);
  for (const r of results) {
    const f = path.join(outDir, `${nameArg}-${r.name}.png`);
    fs.writeFileSync(f, Buffer.from(r.png.split(',')[1], 'base64'));
    const kb = Math.round(fs.statSync(f).size / 1024);
    console.log(`  wrote art/anim/${nameArg}-${r.name}.png  ${r.cells} cells of ${r.cw}x${r.ch}  (${kb} KB)`);
  }
  console.log('\nANIM config snippet (rects are % of the frame canvas == % of the grove):');
  for (const L of LAYERS) {
    const [x, y, w, h] = L.rect;
    console.log(`  {src:'art/anim/${nameArg}-${L.name}.png', left:${x}, top:${y}, width:${w}, height:${h}, phase:0},`);
  }
  await browser.close();
})();
