#!/usr/bin/env node
/* build-standalone.js — turn the repo into the single self-contained file that
   gets published as the artifact.

     node tools/build-standalone.js            # -> dist/timber-standalone.html

   timber.html is the source of truth: it loads art/ and photos/ over HTTP and
   needs a server. A published artifact gets none of that — a strict CSP blocks
   every external host — so the deliverable has to carry its own assets. This
   script is that missing step. Without it the artifact could only ever be
   hand-assembled, which is exactly how the repo and the published app forked.

   What it does:
     1. re-encode every art/*.png to WebP, capped at 2x its on-card size
     2. re-encode each referenced photo to WebP and build the PHOTO_DATA map
     3. inline all of it as data: URIs, in CSS url() and in JS src= alike
     4. drop the PWA plumbing (manifest link, service worker) — neither can work
        inside the artifact frame, and a stale worker is an active hazard
     5. add the frame min-height clamp (see below)
     6. strip the document wrapper, which the artifact shell supplies itself

   Images go through Chromium's canvas rather than a native module, matching
   tools/add-plant.js so the repo keeps a single image-processing dependency.
*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist');
const OUT = path.join(OUT_DIR, 'timber-standalone.html');

const die = (m) => { console.error('ABORT: ' + m); process.exit(1); };

/* Cap each asset at roughly twice the width it is drawn at on a 420px-wide card,
   which is all a 2x display can resolve. Anything absent falls back to ART_CAP. */
const ART_CAP = 900;
const ART_WIDTH = {
  'frame-full': 840,      // fills the whole 420px card
  'plaque-full': 540,     // 63.46% of the card
  'band-full': 690,       // 81.60%
  'crest-blank': 150,     // 17.23%
  'soil-full': 140,       // 15.59%
  'rail-patch-h': 60,
  'rail-patch-s': 60,
};
const PHOTO_WIDTH = 760;  // the card's photo window is ~360 CSS px
const Q_ART = 0.86;       // painted artwork: banding shows, so keep it higher
const Q_PHOTO = 0.80;

const slugLatin = (l) => l.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

(async () => {
  let html = fs.readFileSync(path.join(ROOT, 'timber.html'), 'utf8');
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<div></div>');

  /* Re-encode through a canvas. Returns a data: URI. */
  const encode = async (buf, mime, maxW, quality) => {
    const uri = `data:${mime};base64,${buf.toString('base64')}`;
    return page.evaluate(async ({ uri, maxW, quality }) => {
      const img = new Image(); img.src = uri; await img.decode();
      const W = Math.min(maxW, img.naturalWidth);
      const H = Math.round(img.naturalHeight * (W / img.naturalWidth));
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      c.getContext('2d').drawImage(img, 0, 0, W, H);
      const out = c.toDataURL('image/webp', quality);
      if (!out.startsWith('data:image/webp')) throw new Error('webp encode unsupported');
      return { out, W, H, src: `${img.naturalWidth}x${img.naturalHeight}` };
    }, { uri, maxW, quality });
  };

  let artBytes = 0, photoBytes = 0;

  /* ---- 1. art: every art/<name>.png token, in CSS and JS alike ---- */
  const artNames = [...new Set([...html.matchAll(/art\/([a-z0-9-]+)\.png/g)].map((m) => m[1]))];
  if (!artNames.length) die('no art/ references found — is timber.html already built?');
  for (const name of artNames) {
    const file = path.join(ROOT, 'art', name + '.png');
    if (!fs.existsSync(file)) die('missing asset: art/' + name + '.png');
    const r = await encode(fs.readFileSync(file), 'image/png', ART_WIDTH[name] || ART_CAP, Q_ART);
    const before = html.length;
    html = html.split(`art/${name}.png`).join(r.out);
    if (html.length === before) die('no substitution made for art/' + name + '.png');
    artBytes += r.out.length;
    console.log(`  art  ${name.padEnd(20)} ${r.src.padStart(9)} -> ${r.W}x${r.H}  ${(r.out.length / 1024).toFixed(0)}KB`);
  }

  /* ---- 2. photos: keyed by slug, exactly as the card looks them up ---- */
  const arr = html.match(/const PLANTS = \[[\s\S]*?\n\];/);
  if (!arr) die('PLANTS array not found');
  const PLANTS = eval(arr[0].replace('const PLANTS = ', ''));
  if (PLANTS.some((p) => !p)) die('PLANTS contains an empty slot (array elision)');
  const photoMap = {};
  let missing = 0;
  for (const p of PLANTS) {
    const slug = slugLatin(p.latin);
    const file = path.join(ROOT, 'photos', slug + '.jpg');
    if (!fs.existsSync(file)) { missing++; console.log(`  photo MISSING ${slug} (${p.common}) — card falls back to its leaf gradient`); continue; }
    const r = await encode(fs.readFileSync(file), 'image/jpeg', PHOTO_WIDTH, Q_PHOTO);
    photoMap[slug] = r.out;
    photoBytes += r.out.length;
  }
  console.log(`  photos inlined: ${Object.keys(photoMap).length}/${PLANTS.length} (${missing} without a photo)`);

  const photoConst = 'const PHOTO_DATA={' +
    Object.entries(photoMap).map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`).join(',') + '};\n';
  const PHOTO_SRC = 'const photoSrc=slug=>`photos/${slug}.jpg`;';
  if (!html.includes(PHOTO_SRC)) die('photoSrc helper not found');
  html = html.replace(PHOTO_SRC, "const photoSrc=slug=>PHOTO_DATA[slug]||'';");
  // declare the map just above the slug helper that keys it
  const anchor = '/* fold diacritics first';
  if (!html.includes(anchor)) die('slugLatin anchor comment not found');
  html = html.replace(anchor, photoConst + anchor);

  /* ---- 3. icons: same treatment, and the manifest must agree on the type ---- */
  for (const name of ['ICON192', 'ICON512']) {
    const m = html.match(new RegExp(`const ${name}="data:image/png;base64,([A-Za-z0-9+/=]+)";`));
    if (!m) die(`${name} not found`);
    const r = await encode(Buffer.from(m[1], 'base64'), 'image/png', 512, 0.9);
    html = html.replace(m[0], `const ${name}="${r.out}";`);
  }
  html = html.split('type:"image/png"').join('type:"image/webp"');

  /* ---- 4. The service worker cannot work in the frame and a stale one is an
     active hazard, so it goes. The manifest <link> stays: the PWA block sets its
     href at runtime and would throw on a null element, taking the rest of the
     script — and so the whole deck — down with it. An unused manifest is inert. ---- */
  const SW = "if('serviceWorker' in navigator";
  if (!html.includes(SW)) die('service worker guard not found');
  html = html.replace(SW, "if(false && 'serviceWorker' in navigator");

  /* ---- 5. the artifact frame auto-sizes its iframe to the content's
     scrollHeight, while the app sizes itself from the frame via 100dvh. Left
     alone the two chase each other down to a collapsed layout. A min-height
     derived from viewport WIDTH, which the frame does not auto-size, gives the
     loop a stable fixed point. It stays out of source because on a real phone in
     landscape it would force the app taller than the screen. ---- */
  const H = 'height:100dvh;user-select:none;';
  if (!html.includes(H)) die('body height rule not found');
  html = html.replace(H, 'height:100dvh;min-height:clamp(560px,195vw,920px);user-select:none;');

  /* ---- 6. the artifact shell supplies its own doctype/html/head/body ---- */
  html = html.replace(/^<!DOCTYPE html>\s*<html[^>]*>\s*<head>\s*/i, '')
             .replace(/<\/head>\s*<body>\s*/i, '\n\n')
             .replace(/\s*<\/body>\s*<\/html>\s*$/i, '\n');
  if (/<!DOCTYPE|<html|<\/body>/i.test(html)) die('document wrapper not fully stripped');

  const left = [...html.matchAll(/(art|photos)\/[a-z0-9-]+\.(png|jpg)/g)].map((m) => m[0]);
  if (left.length) die('un-inlined asset references remain: ' + [...new Set(left)].join(', '));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, html);
  await browser.close();

  const mb = (n) => (n / 1024 / 1024).toFixed(2) + 'MB';
  console.log(`\n  art ${mb(artBytes)} + photos ${mb(photoBytes)}`);
  console.log(`  wrote dist/timber-standalone.html  ${mb(html.length)}`);
  if (html.length > 9.5 * 1024 * 1024) {
    console.warn('  WARNING: over ~9.5MB — lower PHOTO_WIDTH/Q_PHOTO before publishing');
  }
})().catch((e) => die(e.stack || String(e)));
