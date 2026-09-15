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

/* EVERY ANCHOR THIS BUILD DEPENDS ON, IN ONE PLACE.
   The build works by substituting literal strings in timber.html. Each one is a
   silent dependency on wording that lives in another file, and a refactor that
   renames any of them does not fail anything — it fails the NEXT person who tries
   to build, which can be weeks later. `--check` resolves all of them in about a
   tenth of a second and is in tests/run-all.js --fast for exactly that reason.
   Hoisted to module scope so the check and the build cannot drift apart. */
const PHOTO_FN = 'const photoSrc=slug=>`photos/card/${slug}.webp`;';
const SLUG_ANCHOR = '/* fold diacritics first';
const SW = "if('serviceWorker' in navigator";
const H = 'height:100dvh;user-select:none;';
const ART_REF = /art\/[a-z0-9/-]+\.(?:png|webp)/g;

const CHECK = process.argv.includes('--check');

function check() {
  const html = fs.readFileSync(path.join(ROOT, 'timber.html'), 'utf8');
  const bad = [];

  /* the deck, through the canonical parser (CARD-PROTOCOL rule 0b) */
  let plants = null;
  try {
    const { readDeck } = require(path.join(__dirname, 'plant-data.js'));
    plants = readDeck(html);
    if (!Array.isArray(plants) || !plants.length) bad.push('readDeck returned no plants');
    else if (plants.some((p) => !p)) bad.push('PLANTS contains an empty slot (array elision)');
  } catch (e) { bad.push('readDeck threw: ' + e.message); }

  /* every literal the build substitutes */
  /* String.replace takes the FIRST match, so an anchor that appears twice means
     the build edits the wrong one and says nothing. That is not hypothetical: the
     service-worker guard had two occurrences and the build neutered the harmless
     one. These three must be unique; SW is handled with split/join and may repeat. */
  const occurrences = (lit) => html.split(lit).length - 1;
  for (const [label, lit] of [
    ['photoSrc() helper', PHOTO_FN],
    ['slugLatin anchor comment', SLUG_ANCHOR],
    ['body height rule', H],
  ]) {
    const n = occurrences(lit);
    if (n === 0) bad.push(`${label} not found — the build substitutes it by exact text`);
    else if (n > 1) bad.push(`${label} appears ${n} times — the build replaces only the first`);
  }
  if (!html.includes(SW)) bad.push('service worker guard not found');

  for (const name of ['ICON192', 'ICON512'])
    if (!new RegExp(`const ${name}="data:image/png;base64,([A-Za-z0-9+/=]+)";`).test(html))
      bad.push(`${name} not found`);

  /* every art token must have a PNG master to encode from */
  const refs = [...new Set([...html.matchAll(ART_REF)].map((m) => m[0]))];
  if (!refs.length) bad.push('no art/ references found — is timber.html already built?');
  for (const ref of refs) {
    const master = path.join(ROOT, 'art', ref.replace(/^art\//, '').replace(/\.(png|webp)$/, '') + '.png');
    if (!fs.existsSync(master)) bad.push('missing asset master for ' + ref);
  }

  if (bad.length) { bad.forEach((b) => console.error('FAIL build-standalone: ' + b)); process.exit(1); }
  const withPhoto = plants.filter((p) => fs.existsSync(path.join(ROOT, 'photos', slugLatin(p.latin) + '.jpg'))).length;
  console.log(`build-standalone: every anchor resolves — ${plants.length} plants (${withPhoto} with a photo master), ${refs.length} art refs`);
}

if (CHECK) { check(); process.exit(0); }

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
  /* The app loads art/<name>.webp wherever tools/optimise-art.js derived one and
     art/<name>.png everywhere else, so match either — and always encode from the
     PNG master, because WebP -> canvas -> WebP would stack a second generation of
     loss on the artwork for no reason. The path class allows "/" so the holo and
     anim subdirectories are inlined too; without it their assets stayed as
     relative URLs that nothing can resolve inside the artifact frame. */
  const artRefs = [...new Set([...html.matchAll(ART_REF)].map((m) => m[0]))];
  if (!artRefs.length) die('no art/ references found — is timber.html already built?');
  for (const ref of artRefs) {
    const name = ref.replace(/^art\//, '').replace(/\.(png|webp)$/, '');
    const master = path.join(ROOT, 'art', name + '.png');
    if (!fs.existsSync(master)) die('missing asset master: art/' + name + '.png');
    const r = await encode(fs.readFileSync(master), 'image/png', ART_WIDTH[name] || ART_CAP, Q_ART);
    const before = html.length;
    html = html.split(ref).join(r.out);
    if (html.length === before) die('no substitution made for ' + ref);
    artBytes += r.out.length;
    console.log(`  art  ${name.padEnd(20)} ${r.src.padStart(9)} -> ${r.W}x${r.H}  ${(r.out.length / 1024).toFixed(0)}KB`);
  }

  /* ---- 2. photos: keyed by slug, exactly as the card looks them up ---- */
  /* CARD-PROTOCOL rule 0b: use tools/plant-data.js, never re-implement the parsing.
     This file used to, with /const PLANTS = \[[\s\S]*?\n\];/ — and it had been
     BROKEN for as long as the deck's closing bracket carried a leading space
     (" ];", not "];"). The lazy match then ran past the array's real end, past the
     whole hold block, and stopped at the first line-initial "];" some 3,000 lines
     into the app code — so the eval below was handed live source and died on
     `document is not defined`. The standalone build could not be produced at all,
     silently, which matters because README says the single-file build is what gets
     published to an artifact or a USB stick. readDeck() reads the marker pair that
     plants-tool.js maintains and does not care how the bracket is indented. */
  const { readDeck } = require(path.join(__dirname, 'plant-data.js'));
  const PLANTS = readDeck(html);
  if (!Array.isArray(PLANTS) || !PLANTS.length) die('PLANTS array not found');
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
  /* Every photograph in the app resolves through photoSrc(), so redirecting that
     one line covers the card and both detail sheets at once. It used to match the
     detail sheet's literal src= instead, which String.replace only substitutes
     once — the second sheet and the card (which carries its path on data-psrc,
     not src) kept relative URLs the artifact frame cannot resolve. */
  if (!html.includes(PHOTO_FN)) die('photoSrc() not found — has the photo path helper moved?');
  html = html.replace(PHOTO_FN, 'const photoSrc=slug=>PHOTO_DATA[slug]||"";');
  // declare the map just above the slug helper that keys it
  if (!html.includes(SLUG_ANCHOR)) die('slugLatin anchor comment not found');
  html = html.replace(SLUG_ANCHOR, photoConst + SLUG_ANCHOR);

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
  /* ALL of them, not the first. There are two `if('serviceWorker' in navigator`
     blocks: the update-pill message listener, and the one that actually calls
     navigator.serviceWorker.register('./sw.js'). String.replace takes the first,
     so the build used to neuter the harmless listener and ship the REGISTRATION
     live — exactly the "stale worker is an active hazard" this step exists to
     prevent. Found 2026-09-15 by reading the built file rather than the log. */
  if (!html.includes(SW)) die('service worker guard not found');
  html = html.split(SW).join("if(false && 'serviceWorker' in navigator");
  /* The replacement does not itself contain the anchor (`if(` is followed by
     `false`), so a survivor here means a guard the split did not reach — and the
     register() call inside a neutered block is dead code, which is the point.
     An earlier version of this also tried to assert that no
     `navigator.serviceWorker.register` remained "unguarded" by looking at the
     character before it; that matched the `{` of the guarded block's own body and
     aborted a correct build. The guard is the thing to check, not the call. */
  if (html.includes(SW)) die('a serviceWorker guard survived the build');

  /* ---- 5. the artifact frame auto-sizes its iframe to the content's
     scrollHeight, while the app sizes itself from the frame via 100dvh. Left
     alone the two chase each other down to a collapsed layout. A min-height
     derived from viewport WIDTH, which the frame does not auto-size, gives the
     loop a stable fixed point. It stays out of source because on a real phone in
     landscape it would force the app taller than the screen. ---- */
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
