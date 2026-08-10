#!/usr/bin/env node
/*
  extract-wisps.js — isolate a effect layer out of any artwork as a transparent PNG.

    node tools/extract-wisps.js <source.png> <out-name> --mode rainbow
    node tools/extract-wisps.js <source.png> <out-name> --mode shards --region 0,0,100,100

  Options
    --mode rainbow   keep saturated iridescent streaks (the holo shimmer)
    --mode shards    keep the brightest structural highlights (spiky lava/thorn edges)
    --mode bright    keep everything bright, whatever its hue
    --region x,y,w,h  crop first, in PERCENT of the source (default whole image)
    --out-w N        output width in px (height follows the crop's aspect; default 900)
    --gain N         multiply the resulting alpha (default 1)

  Writes art/holo/<out-name>.png with a real alpha channel.

  WHY
  A special-edition frame carries motifs — iridescent streaks, spiky highlights —
  that are locked into its border. Pulled out onto transparency they become a
  layer that can be floated over the photo and animated, so the card reads as
  lit from inside rather than merely framed prettily.

  The keying is deliberately simple and per-pixel: convert to HSL, build an alpha
  from saturation and lightness according to the mode, and keep the original RGB.
  No edge detection and no segmentation, because the motifs here are defined by
  colour and brightness rather than by shape — and a simple rule is one you can
  predict and re-run on the next frame.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const argv = process.argv.slice(2);
const flag = (f, d = null) => { const i = argv.indexOf(f); return i === -1 ? d : argv[i + 1]; };
const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
const [srcArg, outName] = positional;

if (!srcArg || !outName) {
  console.error('usage: node tools/extract-wisps.js <source.png> <out-name> [--mode rainbow|shards|bright] [--region x,y,w,h] [--out-w N] [--gain N]');
  process.exit(1);
}
const MODE = flag('--mode', 'rainbow');
const OUTW = Number(flag('--out-w', 900));
const GAIN = Number(flag('--gain', 1));
const REGION = (flag('--region', '0,0,100,100')).split(',').map(Number);
if (REGION.length !== 4 || REGION.some(n => !Number.isFinite(n))) { console.error('--region must be x,y,w,h in percent'); process.exit(1); }

const srcPath = path.isAbsolute(srcArg) ? srcArg : path.join(ROOT, srcArg);
if (!fs.existsSync(srcPath)) { console.error('source not found: ' + srcPath); process.exit(1); }

(async () => {
  const { chromium } = require('playwright');
  const b64 = fs.readFileSync(srcPath).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id=c></canvas>');

  const res = await page.evaluate(async ({ uri, MODE, OUTW, GAIN, REGION }) => {
    const img = new Image(); img.src = uri; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const [rx, ry, rw, rh] = REGION;
    const sx = Math.round(rx / 100 * W), sy = Math.round(ry / 100 * H);
    const sw = Math.round(rw / 100 * W), sh = Math.round(rh / 100 * H);
    const outW = Math.min(OUTW, sw), outH = Math.round(outW * (sh / sw));
    const c = document.createElement('canvas'); c.width = outW; c.height = outH;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    const d = x.getImageData(0, 0, outW, outH);
    const p = d.data;
    let kept = 0;
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i] / 255, g = p[i + 1] / 255, b = p[i + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const l = (mx + mn) / 2;
      const s = mx === mn ? 0 : (l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn));
      let a;
      if (MODE === 'rainbow') {
        /* iridescence = colourful AND luminous. Both terms must be present, so a
           flat bright area (the plain gold ground) drops out and only the streaks
           that actually shift hue survive. */
        a = Math.max(0, Math.min(1, (s - 0.30) * 1.9)) * Math.max(0, Math.min(1, (l - 0.30) * 2.1));
      } else if (MODE === 'shards') {
        /* the spiky highlights are the brightest thing in the frame */
        a = Math.max(0, Math.min(1, (l - 0.62) * 3.2));
      } else {
        a = Math.max(0, Math.min(1, (l - 0.45) * 2.2));
      }
      a = Math.max(0, Math.min(1, a * GAIN));
      p[i + 3] = Math.round(a * 255);
      if (a > 0.04) kept++;
    }
    x.putImageData(d, 0, 0);
    return { png: c.toDataURL('image/png'), outW, outH, kept, total: outW * outH, src: `${sx},${sy} ${sw}x${sh}` };
  }, { uri: `data:image/png;base64,${b64}`, MODE, OUTW, GAIN, REGION });

  fs.mkdirSync(path.join(ROOT, 'art', 'holo'), { recursive: true });
  const out = path.join(ROOT, 'art', 'holo', outName + '.png');
  fs.writeFileSync(out, Buffer.from(res.png.split(',')[1], 'base64'));
  const pct = (res.kept / res.total * 100).toFixed(1);
  console.log(`wrote art/holo/${outName}.png  ${res.outW}x${res.outH}  mode=${MODE}  from ${res.src}`);
  console.log(`  ${pct}% of pixels kept (alpha > 0.04)` + (pct < 3 ? '  — very sparse, try --gain 1.5 or a looser mode' : pct > 70 ? '  — almost everything survived, the key is too loose' : ''));
  await browser.close();
})();
