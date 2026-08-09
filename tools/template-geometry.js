#!/usr/bin/env node
/*
  template-geometry.js — make card-template geometry computed, not hand-measured.

    node tools/template-geometry.js                 show every anchor in px and %
    node tools/template-geometry.js --check         fail if any anchor has drifted
    node tools/template-geometry.js --reflow 720    recompute % for a 720px-tall card
    node tools/template-geometry.js --reflow 720 --write

  WHY
  Overlays have to land pixel-exact on furniture baked into the frame artwork, so
  their positions are stored as percentages of the card. That is fine until the
  card changes height: every percentage then has to be re-derived by hand, which
  is what made the v12 -> v14 elongation (543px -> 600px) an afternoon of
  measurement surgery.

  But the remapping rule is completely mechanical and already written down in
  timber.html: furniture above the inserted spine keeps its distance from the TOP
  edge; furniture below keeps its distance from the BOTTOM edge. That is
  arithmetic, not judgement. This tool does the arithmetic.

  It only touches the nine card-level rules. Everything else (.p-*, .t-*, .s-*,
  .b-*) is a percentage of its own parent — plaque, soil patch, band — and is
  unaffected by card height, which is why those were never the painful part.

  --check guards the other direction: it recomputes each anchor from the CSS and
  compares against the locked px values in data/template-anchors.json, so an
  accidental nudge to a percentage is caught by the test run instead of by eye.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'timber.html');
const ANCHORS = path.join(ROOT, 'data', 'template-anchors.json');

function cardHeight(css) {
  const m = /\.tcard\s*\{[^}]*?height:\s*(\d+)px/.exec(css);
  if (!m) throw new Error('could not find .tcard height in timber.html');
  return Number(m[1]);
}

/* Read `top: N%` (and optional `height: N%`) for one selector at the top level
   of the stylesheet. Deliberately narrow: one selector, one rule. */
function readRule(css, sel) {
  const re = new RegExp(`(^|\\n)\\s*\\${sel}\\s*\\{([^}]*)\\}`);
  const m = re.exec(css);
  if (!m) return null;
  const top = /(?:^|;|\s)top:\s*([\d.]+)%/.exec(m[2]);
  return top ? { top: Number(top[1]), body: m[2], index: m.index } : null;
}

function load() {
  const html = fs.readFileSync(HTML, 'utf8');
  const H = cardHeight(html);
  const spec = JSON.parse(fs.readFileSync(ANCHORS, 'utf8'));
  return { html, H, spec };
}

/* px position of an element's top edge, and its distance from the bottom edge */
function measure(html, H, sel) {
  const r = readRule(html, sel);
  if (!r) return null;
  const px = r.top / 100 * H;
  return { top: r.top, px, fromBottom: H - px };
}

const argv = process.argv.slice(2);
const { html, H, spec } = load();

const rows = spec.cardLevel.map(e => {
  const m = measure(html, H, e.selector);
  return { ...e, ...(m || {}), missing: !m };
});

/* ---------- reflow ---------- */
const ri = argv.indexOf('--reflow');
if (ri !== -1) {
  const newH = Number(argv[ri + 1]);
  if (!Number.isFinite(newH) || newH < 100) {
    console.error('usage: --reflow <new card height in px>');
    process.exit(1);
  }
  console.log(`reflowing card height ${H}px -> ${newH}px  (${newH - H >= 0 ? '+' : ''}${newH - H}px)\n`);
  console.log('selector          anchor   old top%   new top%   px kept');
  const edits = [];
  for (const r of rows) {
    if (r.missing) { console.log(`${r.selector.padEnd(17)} MISSING from timber.html`); continue; }
    const newPx = r.anchor === 'top' ? r.px
      : r.anchor === 'percent' ? r.top / 100 * newH
      : newH - r.fromBottom;
    const newTop = Number((newPx / newH * 100).toFixed(4));
    const kept = r.anchor === 'top' ? `${r.px.toFixed(1)}px from top`
      : r.anchor === 'percent' ? `${r.top}% (scales)`
      : `${r.fromBottom.toFixed(1)}px from bottom`;
    console.log(`${r.selector.padEnd(17)} ${r.anchor.padEnd(7)} ${String(r.top).padStart(8)}%  ${String(newTop).padStart(8)}%   ${kept}`);
    edits.push({ selector: r.selector, from: r.top, to: newTop });
  }

  /* .tinner is the photo window: it is inset from top AND bottom, so its bottom
     inset is the thing to preserve, and all the extra height lands in the photo
     — which is what the elongation was for. */
  const inner = /(^|\n)\s*\.tinner\s*\{([^}]*)\}/.exec(html);
  if (inner) {
    const bm = /bottom:\s*([\d.]+)%/.exec(inner[2]);
    if (bm) {
      const px = Number(bm[1]) / 100 * H;
      console.log(`\n.tinner bottom    bottom  ${bm[1]}%  ->  ${(px / newH * 100).toFixed(4)}%   ${px.toFixed(1)}px from bottom`);
    }
  }

  if (!argv.includes('--write')) {
    console.log('\nDry run. Add --write to apply, then run:');
    console.log('  node tools/template-geometry.js --check && node tests/run-all.js');
    process.exit(0);
  }

  let out = html.replace(/(\.tcard\s*\{[^}]*?height:\s*)\d+(px)/, `$1${newH}$2`);
  out = out.replace(/(\.tscale\s*\{[^}]*?height:\s*)\d+(px)/, `$1${newH}$2`);
  for (const e of edits) {
    const re = new RegExp(`((^|\\n)\\s*\\${e.selector}\\s*\\{[^}]*?top:\\s*)${String(e.from).replace('.', '\\.')}%`);
    if (!re.test(out)) { console.error(`ERROR: could not rewrite ${e.selector} — aborting, nothing written`); process.exit(1); }
    out = out.replace(re, `$1${e.to}%`);
  }
  if (inner) {
    const bm = /bottom:\s*([\d.]+)%/.exec(inner[2]);
    if (bm) {
      const px = Number(bm[1]) / 100 * H;
      out = out.replace(/((^|\n)\s*\.tinner\s*\{[^}]*?bottom:\s*)[\d.]+%/, `$1${(px / newH * 100).toFixed(4)}%`);
    }
  }
  fs.writeFileSync(HTML, out);
  /* Re-derive the locked px anchors at the new height so --check stays truthful. */
  spec.cardHeight = newH;
  fs.writeFileSync(ANCHORS, JSON.stringify(spec, null, 1) + '\n');
  console.log(`\nwritten. card height is now ${newH}px.`);
  console.log('The frame ARTWORK still has to match — this moves the overlays, not the painted furniture.');
  console.log('Next: node tools/template-geometry.js --check && node tests/run-all.js');
  process.exit(0);
}

/* ---------- check / report ---------- */
const TOL = 0.75;   // px
const problems = [];
for (const r of rows) {
  if (r.missing) { problems.push(`${r.selector}: rule missing or has no top:%`); continue; }
  if (r.anchor === 'percent') {
    if (r.topPct != null && Math.abs(r.topPct - r.top) > 0.02)
      problems.push(`${r.selector}: percent-anchored at ${r.top}% but locked at ${r.topPct}%`);
    continue;
  }
  const want = r.anchor === 'top' ? r.expectPx : r.expectFromBottom;
  const got = r.anchor === 'top' ? r.px : r.fromBottom;
  if (want != null && Math.abs(want - got) > TOL)
    problems.push(`${r.selector}: ${r.anchor}-anchored at ${got.toFixed(2)}px but locked at ${want}px (drift ${(got - want).toFixed(2)}px)`);
}
if (spec.cardHeight && spec.cardHeight !== H)
  problems.push(`card height is ${H}px but data/template-anchors.json locks ${spec.cardHeight}px — reflow was not recorded`);

if (argv.includes('--check')) {
  if (problems.length) {
    console.error(`template geometry drift (${problems.length}):`);
    problems.forEach(p => console.error('  ✗ ' + p));
    console.error('\nIf the move was intentional, re-lock with --reflow, or update expectPx in data/template-anchors.json.');
    process.exit(1);
  }
  console.log(`template-geometry OK: ${rows.length} card-level anchors match at ${H}px`);
  process.exit(0);
}

console.log(`card height: ${H}px\n`);
console.log('selector          anchor   top%      px from top   px from bottom');
for (const r of rows) {
  if (r.missing) { console.log(`${r.selector.padEnd(17)} MISSING`); continue; }
  console.log(`${r.selector.padEnd(17)} ${r.anchor.padEnd(7)} ${String(r.top).padStart(7)}%  ${r.px.toFixed(1).padStart(11)}   ${r.fromBottom.toFixed(1).padStart(14)}`);
}
console.log(problems.length ? `\n${problems.length} drift(s) — run --check for detail.` : '\nall anchors match the locked values.');
