#!/usr/bin/env node
/*
  apply-pest-survey.js — write a filled-in pest survey back into the deck.

    node tools/apply-pest-survey.js data/pest-survey.csv --dry   report only
    node tools/apply-pest-survey.js data/pest-survey.csv         write it

  Reads the `slug` and `pest` columns of data/pest-survey.csv (see PEST-BRIEF.md
  section 6 for the research prompt that fills it) and sets each card's `pest`
  field. Everything else in the CSV is ignored, so the research model can add
  working columns without breaking anything.

  WHY THIS EXISTS
  The survey is 254 rows. Hand-editing 254 cards is where transcription errors
  live, and a wrong pest is a silent defect: the card renders a confident icon
  for the wrong problem and nothing fails.

  TWO GUARDS THAT MATTER

  1. A key with no drawn icon is NOT written. check-boot fails a card whose pest
     is not in the PEST registry, so applying `aphid` before aphid.webp exists
     would break the build for everyone. Those rows are reported as PENDING ART
     and left alone, which makes it safe to run the survey once, up front, and
     re-run it as each icon lands.
  2. A key that is not in the canonical list at all is an ERROR, not a warning —
     that is a typo or an invented pest, and it stops the run before anything
     is written.

  Blank clears the field, because blank is a real answer: it means "nothing
  dominates", and the card correctly falls back to the baked red spider mite.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'timber.html');
const pd = require('./plant-data.js');

/* The canonical answer set. Mirrors PEST-BRIEF.md section 3; anything outside it
   is a mistake worth stopping for. `mite` is here because it is a legitimate
   answer (it is the baked default) even though it needs no icon file. */
const CANON = new Set(['mite', 'slugs', 'aphid', 'vine-weevil', 'caterpillar', 'scale',
  'whitefly', 'sawfly', 'lily-beetle', 'viburnum-beetle', 'leaf-miner', 'browsing',
  'mildew', 'black-spot', 'rust', 'blight', 'canker', 'scab', 'honey-fungus', 'root-rot']);

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const csvPath = argv.find(a => !a.startsWith('--'));
if (!csvPath) { console.error('usage: node tools/apply-pest-survey.js <survey.csv> [--dry]'); process.exit(1); }
const abs = path.isAbsolute(csvPath) ? csvPath : path.join(ROOT, csvPath);
if (!fs.existsSync(abs)) { console.error('not found: ' + abs); process.exit(1); }

const html = fs.readFileSync(HTML, 'utf8');

/* which pests actually have art, read from the app rather than duplicated here */
const registered = new Set();
{
  const m = /const PEST=\{([\s\S]*?)\n\};/.exec(html);
  if (!m) { console.error('PEST registry not found in timber.html'); process.exit(1); }
  for (const k of m[1].matchAll(/(?:^|[\s,{])['"]?([a-z][a-z0-9-]*)['"]?\s*:/g)) registered.add(k[1]);
}
registered.add('mite');                          // baked into the plaque, always available

/* csvParse gives arrays of cells; the header row names the columns. Read the two
   columns BY NAME rather than by position, so a research model that adds a
   "reason" or "confidence" column — which they always do — cannot shift the
   answer into the wrong field. */
const table = pd.csvParse(fs.readFileSync(abs, 'utf8'));
if (table.length < 2) { console.error('survey is empty'); process.exit(1); }
const head = table[0].map(h => String(h).trim().toLowerCase());
const iSlug = head.indexOf('slug'), iPest = head.indexOf('pest');
for (const [name, i] of [['slug', iSlug], ['pest', iPest]])
  if (i === -1) { console.error(`survey has no "${name}" column`); process.exit(1); }
const rows = table.slice(1).map(cells => ({ slug: cells[iSlug], pest: cells[iPest] }));

const slugLatin = l => l.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const deck = pd.readDeck(html), hold = pd.readHold(html);
const bySlug = new Map();
for (const p of deck) bySlug.set(slugLatin(p.latin), { p, block: 'deck' });
for (const p of hold) bySlug.set(slugLatin(p.latin), { p, block: 'hold' });

const errors = [], pending = [], changes = [], cleared = [], unknownSlug = [];
for (const r of rows) {
  const slug = (r.slug || '').trim();
  const key = (r.pest || '').trim().toLowerCase();
  if (!slug) continue;
  const hit = bySlug.get(slug);
  if (!hit) { unknownSlug.push(slug); continue; }
  const current = hit.p.pest || '';
  if (!key) { if (current) cleared.push({ hit, slug, from: current }); continue; }
  if (!CANON.has(key)) { errors.push(`${slug}: "${key}" is not a canonical pest key`); continue; }
  if (!registered.has(key)) { pending.push({ slug, key }); continue; }
  if (key !== current) changes.push({ hit, slug, key, from: current });
}

if (unknownSlug.length) {
  console.log(`\n${unknownSlug.length} survey row(s) match no card (renamed or removed):`);
  unknownSlug.slice(0, 10).forEach(s => console.log('  ? ' + s));
  if (unknownSlug.length > 10) console.log(`  … and ${unknownSlug.length - 10} more`);
}
if (errors.length) {
  console.error(`\n${errors.length} invalid key(s) — nothing written:`);
  errors.forEach(e => console.error('  ✗ ' + e));
  process.exit(1);
}
if (pending.length) {
  const byKey = {};
  for (const p of pending) (byKey[p.key] = byKey[p.key] || []).push(p.slug);
  console.log(`\nPENDING ART — ${pending.length} card(s) want a pest with no icon yet, left unchanged:`);
  for (const [k, list] of Object.entries(byKey).sort((a, b) => b[1].length - a[1].length))
    console.log(`  ${String(list.length).padStart(3)}  ${k}`);
  console.log('  (draw these per PEST-BRIEF.md, add them to PEST, then re-run this)');
}

console.log(`\n${changes.length} card(s) to set, ${cleared.length} to clear.`);
for (const c of changes.slice(0, 40))
  console.log(`  ${c.slug} : ${c.from || '(blank)'} -> ${c.key}`);
if (changes.length > 40) console.log(`  … and ${changes.length - 40} more`);

if (DRY) { console.log('\n--dry: nothing written'); process.exit(0); }
if (!changes.length && !cleared.length) { console.log('nothing to do'); process.exit(0); }

for (const c of changes) c.hit.p.pest = c.key;
for (const c of cleared) delete c.hit.p.pest;

let out = pd.writeBlock(html, 'deck', deck);
out = pd.writeBlock(out, 'hold', hold);
fs.writeFileSync(HTML, out);

/* re-parse or roll back: a survey must never be able to leave a broken deck */
try {
  const back = fs.readFileSync(HTML, 'utf8');
  if (pd.readDeck(back).length !== deck.length) throw new Error('deck length changed');
  if (pd.readHold(back).length !== hold.length) throw new Error('hold length changed');
} catch (e) {
  fs.writeFileSync(HTML, html);
  console.error(`ABORT: ${e.message} — timber.html rolled back`);
  process.exit(1);
}
console.log('\nwritten. now run:');
console.log('  node plants-tool.js export && node tools/build-stamp.js --write && node tests/run-all.js');
