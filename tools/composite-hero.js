#!/usr/bin/env node
/* composite-hero.js — "hero-on-self": stage a transparent CUTOUT as a card photo.

     NODE_PATH=... node tools/composite-hero.js <cutout.png> <hue 0-360> <out.jpg>

   The card wants a photograph, and a cutout on a bare colour reads as clip-art.
   CARD-PROTOCOL.md's photo register records the fix Oscar asked for on the Salix
   ("darken the background, slap the boy on top in full colour"): the backdrop is
   the cutout ITSELF, flattened onto a deep tint of the card's own hue, blurred
   hard and darkened, and the untouched cutout is composited over it. The result
   melts into the card's dark frame with no seam, and every pixel comes from the
   cutout or from a flat colour — nothing is invented. The register named this
   script for a dozen cards but the file was never committed; this is it, rebuilt
   from that description, and the raw cutout should still be kept alongside as
   <slug>-cutout.png so the composite can be redone.

   Needs sharp (npm i sharp; point NODE_PATH at it). */
'use strict';
const fs = require('fs');
const [src, hueArg, out] = process.argv.slice(2);
if (!src || !hueArg || !out) { console.error('usage: composite-hero.js <cutout.png> <hue> <out.jpg>'); process.exit(1); }
const hue = +hueArg;
if (!(hue >= 0 && hue <= 360)) { console.error('hue must be 0-360'); process.exit(1); }
let sharp; try { sharp = require('sharp'); } catch (e) { console.error('needs sharp'); process.exit(1); }

/* deep tint of the hue: HSL(h, 45%, 12%) -> rgb */
function hsl(h, s, l) {
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}
(async () => {
  const meta = await sharp(src).metadata();
  if (!meta.hasAlpha) { console.error(`${src} has no alpha channel — that is a photo, not a cutout; stage it directly`); process.exit(1); }
  const tint = hsl(hue, 0.45, 0.12);
  const backdrop = await sharp(src)
    .flatten({ background: tint })              /* transparent -> deep tint of the card hue */
    .blur(Math.max(12, Math.round(meta.width / 45)))
    .modulate({ brightness: 0.55, saturation: 0.8 })
    .toBuffer();
  const buf = await sharp(backdrop)
    .composite([{ input: src, blend: 'over' }])  /* the cutout, untouched, on top */
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toBuffer();
  fs.writeFileSync(out, buf);
  console.log(`composite-hero: ${meta.width}x${meta.height}, hue ${hue} (tint rgb ${tint.r},${tint.g},${tint.b}) -> ${out} ${(buf.length / 1024).toFixed(0)} KB`);
})();
