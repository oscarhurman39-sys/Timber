#!/usr/bin/env node
/*
  deck-diff.js — compare the plant data between two versions of the app,
  semantically. Not a text diff: a card-by-card, field-by-field answer to
  "what actually differs?"

    node tools/deck-diff.js <ref>                 <ref> vs the working tree
    node tools/deck-diff.js <refA> <refB>         two refs
    node tools/deck-diff.js <ref> --fields        also list every changed field
    node tools/deck-diff.js <ref> --json

  <ref> is anything git can resolve — a branch, a tag, a commit — or a path to
  an .html file.

  WHY
  This project has already had two development lines drift apart and be merged
  back by hand, card by card. A textual diff of a 3,000-line single-file app is
  useless for that: reordering a block, or the tooling reformatting it, buries
  the twenty cards that genuinely differ under a thousand lines that don't.

  This reads the PLANTS and PLANTS_ON_HOLD arrays from both sides and compares
  the DATA, so a reorder shows as no change and a real edit shows as one line.
  Run it before merging two lines, and the merge stops being archaeology.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const D = require('./plant-data.js');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const showFields = process.argv.includes('--fields');
const asJson = process.argv.includes('--json');

if (!args.length) {
  console.log('usage: node tools/deck-diff.js <ref> [<ref>] [--fields] [--json]');
  process.exit(1);
}

function load(ref) {
  if (!ref) return { label: 'working tree', html: fs.readFileSync(path.join(ROOT, 'timber.html'), 'utf8') };
  if (fs.existsSync(ref) && ref.endsWith('.html')) return { label: ref, html: fs.readFileSync(ref, 'utf8') };
  try {
    return { label: ref, html: execFileSync('git', ['show', `${ref}:timber.html`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }) };
  } catch {
    console.error(`ERROR: cannot resolve "${ref}" as a git ref or an .html path`);
    process.exit(1);
  }
}

function cardsOf(html) {
  const deck = D.readDeck(html), hold = D.readHold(html);
  const m = new Map();
  for (const p of deck) m.set(p.common, { ...p, _held: false });
  for (const p of hold) m.set(p.common, { ...p, _held: true });
  return { m, deck: deck.length, hold: hold.length };
}

const A = load(args[0]);
const B = load(args[1]);
const a = cardsOf(A.html), b = cardsOf(B.html);

const added = [...b.m.keys()].filter(k => !a.m.has(k));
const removed = [...a.m.keys()].filter(k => !b.m.has(k));
const common = [...b.m.keys()].filter(k => a.m.has(k));

const changed = [];
const heldChanged = [];
for (const k of common) {
  const x = a.m.get(k), y = b.m.get(k);
  const fields = D.FIELDS.filter(f => String(x[f] ?? '') !== String(y[f] ?? ''))
    .map(f => ({ field: f, from: x[f] ?? '', to: y[f] ?? '' }));
  if (fields.length) changed.push({ card: k, fields });
  if (x._held !== y._held) heldChanged.push({ card: k, from: x._held ? 'held' : 'dealt', to: y._held ? 'held' : 'dealt' });
}

if (asJson) {
  console.log(JSON.stringify({ a: A.label, b: B.label, added, removed, changed, heldChanged }, null, 2));
  process.exit(0);
}

const trunc = s => { s = String(s); return s.length > 60 ? s.slice(0, 57) + '…' : s; };

console.log(`A: ${A.label}   ${a.deck} dealt + ${a.hold} held = ${a.m.size}`);
console.log(`B: ${B.label}   ${b.deck} dealt + ${b.hold} held = ${b.m.size}\n`);

if (added.length) { console.log(`ONLY IN B (${added.length}) — B has these, A does not:`); added.forEach(n => console.log('  + ' + n)); console.log(''); }
if (removed.length) { console.log(`ONLY IN A (${removed.length}) — merging B over A would LOSE these:`); removed.forEach(n => console.log('  - ' + n)); console.log(''); }
if (heldChanged.length) { console.log(`MOVED BETWEEN DECK AND HOLD (${heldChanged.length}):`); heldChanged.forEach(h => console.log(`  ~ ${h.card}: ${h.from} -> ${h.to}`)); console.log(''); }
if (changed.length) {
  console.log(`EDITED (${changed.length} card(s) differ in ${changed.reduce((n, c) => n + c.fields.length, 0)} field(s)):`);
  for (const c of changed) {
    console.log(`  ~ ${c.card}  [${c.fields.map(f => f.field).join(', ')}]`);
    if (showFields) for (const f of c.fields) console.log(`      ${f.field}: "${trunc(f.from)}"  ->  "${trunc(f.to)}"`);
  }
  console.log('');
}
if (!added.length && !removed.length && !changed.length && !heldChanged.length)
  console.log('No difference in plant data — the two sides carry identical cards.');
else if (!showFields && changed.length)
  console.log('(re-run with --fields to see the before/after values)');
