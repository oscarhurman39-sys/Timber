#!/usr/bin/env node
/* audit-layout.js — measure every rendered card for layout defects.
   Part of the build process (see CORRECTION-PROTOCOL.md). Run from repo root
   with the local server up:

     NODE_PATH=/opt/node22/lib/node_modules node design/audit-layout.js

   Exits 1 if any card violates a rule. Rules are MEASURED, never eyeballed:

   A. ink-fits-box    — every live text zone (.val-ink, title, latin) must not
                        overflow its box (scroll vs client, 1px tolerance).
   B. band-collisions — wiggle-room label must stay inside the band, clear of
                        the light bar's start, the sun icon and the marker;
                        marker triangle must sit within the bar span.
   C2. rail-overflow  — the H/S size-rail values must fit their parchment patch.
                        They are set vertically with nowrap, so a long value runs
                        out of the patch and over the baked HEIGHT/SPREAD
                        lettering instead of wrapping.
   C. rail-alignment  — growth diamond's VISUAL centre must sit on the axis
                        centreline within 0.5px. The sprite's visible content
                        is biased +0.8px right of its bitmap centre (measured
                        from alpha bounds: bbox x 7..40 in a 44px bitmap), so
                        the renderer compensates and this audit asserts the
                        compensated position. Re-measure if the sprite changes.
   D. within-card     — no live ink may leak outside the card face.
   E. focus-photo     — every PHOTO_FOCUS key must be a current plant's latin-
                        slug with a photos/<slug>.jpg on disk (filesystem check):
                        catches id-vs-latin-slug drift that silently drops a
                        card to the gradient fallback.                         */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SPRITE_BIAS = 0.8;         // growth-diamond visual-centre bias at 17px display width
const BAR = { start: 40.4, end: 93.2 };   // light bar span, % of band (locked manifest)

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:8477/timber.html');
  await page.waitForTimeout(800);

  const violations = await page.evaluate(({ SPRITE_BIAS, BAR }) => {
    const out = [];
    const cards = [...document.querySelectorAll('.card')];
    const name = c => (c.querySelector('.thead h2') || {}).textContent || '?';

    for (const card of cards) {
      const plant = name(card).trim();
      const bad = (rule, detail) => out.push({ plant, rule, detail });

      /* F. photo-frame registration — the photo window must land on the opening
         painted into the frame artwork. Measured off art/frame-600.png on
         2026-08-14 (art px / 2.6262 per css px): top 1.332%, right inset 2.992%,
         bottom inset 4.378%, left 13.96%, corner radius 11.4px.
         Nothing measured this before, which is how a 3.4px misregistration
         shipped on all 167 cards: the photo sat low and wide, lapping the gold
         trim on the right and leaving a strip along the top where the frame's
         OWN baked reference photo showed above the real one. Oscar caught it by
         eye on a phone; the tolerance here is 0.6px so the next drift does not
         need his eye. */
      {
        /* a fullart card has no frame opening — the artwork IS the whole face,
           so its .tphoto fills the card and rule F does not apply */
        const tc = card.querySelector('.tcard'), ph = card.querySelector('.tphoto');
        if (tc && ph && !tc.classList.contains('fullart')) {
          const cb = tc.getBoundingClientRect(), pb = ph.getBoundingClientRect();
          if (cb.width > 1 && cb.height > 1) {
            /* .tscale scales x and y INDEPENDENTLY (--csx/--csy), so the two
               axes need their own factor back to template px — one shared
               factor reads every bottom edge as ~69px out. */
            const kx = 420 / cb.width, ky = 600 / cb.height;
            const want = { left: 58.63, top: 7.99, right: 407.43, bottom: 573.73 };
            const got = { left: (pb.left - cb.left) * kx, top: (pb.top - cb.top) * ky,
                          right: (pb.right - cb.left) * kx, bottom: (pb.bottom - cb.top) * ky };
            for (const side of ['left', 'top', 'right', 'bottom']) {
              const off = got[side] - want[side];
              if (Math.abs(off) > 0.6)
                bad('photo-frame-registration',
                  `photo ${side} edge is ${off > 0 ? '+' : ''}${off.toFixed(2)}px off the frame's painted opening`);
            }
            /* computed border-radius is unaffected by the transform, so it is
               already in template px — scaling it here was the second bug. */
            const r = parseFloat(getComputedStyle(ph).borderTopLeftRadius);
            if (Math.abs(r - 11.4) > 0.6)
              bad('photo-frame-registration',
                `photo corner radius ${r.toFixed(2)}px does not match the frame's 11.4px opening`);
          }
        }
      }

      /* A. ink fits box */
      for (const el of card.querySelectorAll('.val-ink, .thead h2, .thead .bot')) {
        const oW = el.scrollWidth - el.clientWidth, oH = el.scrollHeight - el.clientHeight;
        if (oW > 1 || oH > 1)
          bad('ink-fits-box', `${el.className.split(' ').join('.')} overflows by ${oW}x${oH}px: "${el.textContent.trim().slice(0, 40)}"`);
      }

      /* B. band collisions */
      const band = card.querySelector('.band');
      if (band) {
        const br = band.getBoundingClientRect();
        const pct = x => (x - br.left) / br.width * 100;
        const wig = band.querySelector('.b-wiggle');
        const tri = band.querySelector('.b-tri');
        const sun = band.querySelector('.b-sun');
        if (wig) {
          const wr = wig.getBoundingClientRect();
          if (pct(wr.left) < 38) bad('band-collisions', `wiggle label leaks left of the light zone (starts at ${pct(wr.left).toFixed(1)}%)`);
          if (wr.left < br.left || wr.right > br.right) bad('band-collisions', 'wiggle label outside the band');
          if (sun) {
            const sr = sun.getBoundingClientRect();
            const overlap = !(wr.right < sr.left || wr.left > sr.right || wr.bottom < sr.top || wr.top > sr.bottom);
            if (overlap) bad('band-collisions', 'wiggle label overlaps the sun icon');
          }
        }
        if (tri) {
          const tr = tri.getBoundingClientRect();
          const cx = pct((tr.left + tr.right) / 2);
          if (cx < BAR.start - 1 || cx > BAR.end + 1)
            bad('band-collisions', `marker triangle at ${cx.toFixed(1)}% is outside the bar (${BAR.start}–${BAR.end}%)`);
        }
        /* every band child (sprites included) must stay inside the band —
           catches runaway images, e.g. a cascade collision blowing one up */
        for (const el of band.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (!r.width) continue;
          if (r.left < br.left - 2 || r.right > br.right + 2 || r.top < br.top - 2 || r.bottom > br.bottom + 2)
            bad('band-collisions', `${el.tagName.toLowerCase()}.${(el.className || '?').toString().split(' ').join('.')} leaks outside the band (${Math.round(r.width)}px wide)`);
        }
      }

      /* B2. plaque patches must not touch the baked label rows (luminance-
         measured in plaque-full.png; a patch's feather over a label is the
         "blurred words" defect). Zones in % of the plaque box, x 11-42%. */
      const plaque = card.querySelector('.plaque');
      if (plaque) {
        const pr = plaque.getBoundingClientRect();
        const LABELS = [['Bloom', 9.0, 12.3], ['Pests & diseases', 29.4, 38.8], ['Thirst', 55.8, 59.2], ['Care Level', 76.2, 79.6]];
        /* The baked label TEXT starts at x 16.86% at the earliest (first dark-ink
           column per row, scanned in plaque-full.png 2026-08-14: Pests 16.86,
           Thirst 17.0, Care 17.0, Bloom 17.14 — lum<110). The guard used to be
           x1<12, which was really the LIVE VALUE zones' left edge (12.4%), not
           the labels': it fired on the pest-icon patch (x 0.98-15.59), whose
           feather ends 1.27% short of the nearest letter and cannot wash it.
           16.4 leaves 0.46% margin under the measured text start. Value patches
           (x0 >= 12.4, reaching well past 16.4) are still checked, which is the
           defect this rule exists for. */
        for (const patch of plaque.querySelectorAll('.patch')) {
          const r = patch.getBoundingClientRect();
          const x0 = (r.left - pr.left) / pr.width * 100, x1 = (r.right - pr.left) / pr.width * 100;
          const y0 = (r.top - pr.top) / pr.height * 100, y1 = (r.bottom - pr.top) / pr.height * 100;
          if (x1 < 16.4 || x0 > 36) continue;
          for (const [lname, ly0, ly1] of LABELS) {
            if (y0 < ly1 - 0.5 && y1 > ly0 + 0.5)
              bad('band-collisions', `patch ${patch.className.split(' ').join('.')} overlaps the baked "${lname}" label (${y0.toFixed(1)}-${y1.toFixed(1)}% vs ${ly0}-${ly1}%)`);
          }
        }
      }

      /* C. growth rail alignment */
      const mk = card.querySelector('.growth .mk');
      const axis = card.querySelector('.growth .axis');
      if (mk && axis) {
        const m = mk.getBoundingClientRect(), a = axis.getBoundingClientRect();
        const scale = m.width / 17;                       // account for --cs card scaling
        const visCx = (m.left + m.right) / 2 + SPRITE_BIAS * scale;
        const axCx = (a.left + a.right) / 2;
        const off = (visCx - axCx) / scale;               // in card px
        if (Math.abs(off) > 0.5)
          bad('rail-alignment', `diamond visual centre ${off.toFixed(2)}px off the axis centreline`);
      }

      /* C2. size-rail values fit their parchment patch.
         The H and S rails are ~61px tall at display size and the value is set
         vertically with white-space:nowrap, so a long value does not wrap — it
         runs straight out of the patch and over the baked HEIGHT / SPREAD
         lettering on the spine. The .v element is absolutely positioned to fill
         its box, so its own rect never grows: the overflow is only visible by
         measuring the TEXT with a Range.
         Caught by: Waterlily 'Marliacea Carnea' shipped with height
         "0.1–0.15m above water" — 133px of ink in a 61px patch, a 72px overrun
         straight across the HEIGHT label. Every other card sits ~3.6px inside.
         Tolerance 2px: the patch edges are feathered by the mask, so a sub-2px
         overrun is not visible ("75–100 cm" sits 1.7px over and reads fine). */
      for (const cls of ['rail-h', 'rail-s']) {
        const box = card.querySelector('.' + cls);
        const v = box && box.querySelector('.v');
        if (!v || !v.firstChild) continue;
        const rg = document.createRange();
        rg.selectNodeContents(v);
        const tb = rg.getBoundingClientRect(), bb = box.getBoundingClientRect();
        if (tb.height === 0 || bb.height === 0) continue;
        const over = (tb.height - bb.height) / (bb.height / 60.8);   // normalise to display px
        if (over > 2)
          bad('rail-overflow', `${cls} value "${v.textContent.trim()}" overruns its patch by ${over.toFixed(1)}px and crosses the baked label — shorten the ${cls === 'rail-h' ? 'height' : 'spread'} value`);
      }

      /* D. ink stays within the card face */
      const face = card.querySelector('.tcard');
      if (face) {
        const fr = face.getBoundingClientRect();
        for (const el of card.querySelectorAll('.val-ink')) {
          const r = el.getBoundingClientRect();
          if (r.left < fr.left - 1 || r.right > fr.right + 1 || r.top < fr.top - 1 || r.bottom > fr.bottom + 1)
            bad('within-card', `${el.className.split(' ').join('.')} leaks outside the card face`);
        }
      }
    }
    return out;
  }, { SPRITE_BIAS, BAR });

  /* E. focus/photo consistency — every PHOTO_FOCUS key must (a) be a current
     plant's latin-slug and (b) have a photos/<slug>.jpg on disk. A focus entry
     under the wrong key (e.g. the JSON id instead of the latin-slug) means the
     card is silently on the gradient fallback. This is exactly the id-vs-latin
     drift that shipped the Euonymus card blank. Secondary source photos and
     out-of-deck photos have no focus entry, so are never flagged. */
  const { slugs, focusKeys } = await page.evaluate(() => ({
    slugs: PLANTS.map(p => p.latin.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')),
    focusKeys: Object.keys(PHOTO_FOCUS),
  }));
  const slugSet = new Set(slugs);
  const photoDir = path.join(__dirname, '..', 'photos');
  const onDisk = new Set(fs.readdirSync(photoDir).filter(f => f.endsWith('.jpg')).map(f => f.replace(/\.jpg$/, '')));
  for (const k of focusKeys) {
    if (!slugSet.has(k))
      violations.push({ plant: k, rule: 'focus-photo', detail: `PHOTO_FOCUS key "${k}" matches no plant's latin-slug — card is on the fallback` });
    else if (!onDisk.has(k))
      violations.push({ plant: k, rule: 'focus-photo', detail: `PHOTO_FOCUS["${k}"] set but photos/${k}.jpg is missing` });
  }

  await browser.close();

  if (!violations.length) { console.log('LAYOUT AUDIT: all cards clean'); process.exit(0); }
  console.log(`LAYOUT AUDIT: ${violations.length} violation(s)\n`);
  for (const v of violations) console.log(`  [${v.plant}] ${v.rule}: ${v.detail}`);
  process.exit(1);
})();
