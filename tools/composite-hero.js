#!/usr/bin/env node
/* composite-hero.js — the "hero-on-self" cutout treatment (CARD-PROTOCOL v12.15).

     node tools/composite-hero.js <cutout.png> <out.jpg> [hue]

   Oscar's brief: "darken the background, then slap the boy on top in full colour."
   A transparent-background specimen cutout has no scene to sit in, so instead of
   flattening the transparency to black we build the plate from the cutout itself:

     1. a dark base in the plant's own hue (matches the card's photo-less fallback
        gradient, so the plate melts into the card's dark frame with no seam)
     2. a darkened + blurred + enlarged copy of the cutout as an ambient backdrop
     3. the sharp full-colour cutout on top, contained and centred

   Output is an opaque 1200x1558 JPEG (the locked card-window ratio, 0.77) ready to
   stage as photos/<latin-slug>.jpg. Nothing about the plant data is invented; this
   only turns a cutout into a presentable photo.
*/
'use strict';
const fs = require('fs');
const path = require('path');
/* playwright is installed globally in this environment; resolve it from the
   global module root so the script runs without a local node_modules */
function loadPlaywright() {
  try { return require('playwright'); } catch {}
  const gp = require('child_process').execSync('npm root -g').toString().trim();
  return require(require('path').join(gp, 'playwright'));
}
const { chromium } = loadPlaywright();

const [cutoutPath, outPath, hueArg] = process.argv.slice(2);
if (!cutoutPath || !outPath) {
  console.error('usage: node tools/composite-hero.js <cutout.png> <out.jpg> [hue]');
  process.exit(1);
}
const hue = Number(hueArg == null ? 120 : hueArg);
const W = 1200, H = 1558;

(async () => {
  const b64 = fs.readFileSync(cutoutPath).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<div></div>');
  const dataUrl = await page.evaluate(async ({ uri, W, H, hue }) => {
    const img = new Image();
    img.src = uri;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');

    /* 1. base gradient — identical to the card's photo-less fallback
          (linear-gradient(160deg, hsl(hue 45% 22%), hsl(hue+20 55% 12%))) */
    const ang = 160 * Math.PI / 180;
    const dx = Math.sin(ang), dy = -Math.cos(ang);
    const half = (Math.abs(dx) * W + Math.abs(dy) * H) / 2;
    const cx = W / 2, cy = H / 2;
    const g = x.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
    g.addColorStop(0, `hsl(${hue} 45% 22%)`);
    g.addColorStop(1, `hsl(${hue + 20} 55% 12%)`);
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);

    /* geometry: contain the cutout in the frame */
    const scaleContain = Math.min(W / img.naturalWidth, H / img.naturalHeight);
    const drawContain = (scale, alpha, blur, tint) => {
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      x.save();
      x.globalAlpha = alpha;
      if (blur) x.filter = `blur(${blur}px)`;
      x.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      x.restore();
    };

    /* 2. ambient backdrop: enlarged, blurred, dark copy of the cutout */
    drawContain(scaleContain * 1.4, 0.55, 26);
    /* darken the backdrop so the sharp hero pops (dark hue veil, not black) */
    x.save();
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = `hsla(${hue + 10} 50% 8% / 0.45)`;
    x.fillRect(0, 0, W, H);
    x.restore();

    /* 3. sharp full-colour hero on top */
    drawContain(scaleContain * 0.99, 1, 0);

    return c.toDataURL('image/jpeg', 0.88);
  }, { uri: `data:image/png;base64,${b64}`, W, H, hue });
  await browser.close();

  fs.writeFileSync(outPath, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`composite-hero: ${path.basename(cutoutPath)} -> ${outPath} (${W}x${H}, hue ${hue})`);
})();
