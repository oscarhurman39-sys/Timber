#!/usr/bin/env node
/*
  derive-field.js — fill fields that can be DERIVED from what a card already
  carries, without researching anything.

    node tools/derive-field.js                 what it would do
    node tools/derive-field.js --apply         do it
    node tools/derive-field.js --list          what has been derived so far

  This is deliberately a different tool from backfill-field.js, and the line
  between them is the line that matters in this deck: backfill-field.js applies
  RESEARCH that a human sourced. This applies DEDUCTION from data already on the
  card. Nothing here reaches the internet, and nothing here is a plant fact that
  was not already in the repo.

  Two derivations, and both refuse to guess:

  1. hardinessNote FROM hardiness. The band on the crest is the sourced fact —
     Oscar checked it against RHS or the label. Its MEANING is not a second fact
     needing a second source: it is the published definition of the band, and it
     is written out in CARD-STATS.md section 4a, in this repo. So a card
     carrying H5 and no note can be given the H5 definition without anybody
     inventing anything. What this canNOT do is the plant-specific half a
     researched note often has — "pack the crown with dry straw", "hardier than
     it looks" — and it does not pretend to.

  2. foliage FROM the card's own `visual`. Where Oscar's own description already
     says "evergreen" or "deciduous", reading his word back out is extraction,
     not invention. Only `visual` is read, because that is the card describing
     the PLANT; `uses` says where it goes, and "for planting under deciduous
     trees" is a fact about the trees. A class word sitting after a preposition
     is skipped for the same reason, which costs one true positive
     (Crinodendron, whose flowers "hang beneath ... evergreen leaves") and is
     the right trade: a wrong foliage class is a wrong card.

  EVERY value written is logged to data/derived.json with the rule that produced
  it. That file is the answer to the obvious objection — that filling a field
  with a generic value stops `backfill-field.js <field> --missing` reporting it,
  so the researched version never gets written. It still can: --list prints
  every card whose value is derived rather than researched, and a real answer
  landing in data/incoming can be applied over it with
  `backfill-field.js <field> --apply --overwrite`.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const D = require('./plant-data.js');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'timber.html');
const LEDGER = path.join(ROOT, 'data', 'derived.json');

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const LIST = argv.includes('--list');

/* ---- the RHS bands, transcribed from CARD-STATS.md section 4a ----
   If that table changes, change this with it. The temperature ranges are the
   RHS definitions of the band, not a reading of any individual plant. */
const BAND = {
  H1a: 'Tropical: needs a heated glasshouse above 15C and cannot go outdoors in the UK.',
  H1b: 'Subtropical: needs a heated glasshouse at 10-15C and cannot tolerate frost.',
  H1c: 'Warm temperate, 5-10C minimum. Can stand outdoors in summer but must come in before frost.',
  H2:  'Tender: withstands 1-5C and no frost at all. Outdoors in summer only, or under glass.',
  H3:  'Half-hardy: withstands -5 to 1C. Outdoors in mild or coastal UK gardens; needs shelter or winter protection elsewhere.',
  H4:  'Hardy through an average UK winter, withstanding -10 to -5C.',
  H5:  'Hardy through a cold UK winter, withstanding -15 to -10C.',
  H6:  'Hardy through a very cold UK winter, withstanding -20 to -15C.',
  H7:  'Very hardy: withstands below -20C, so hardy anywhere in the UK.',
};

const CLASS = /\b(semi-evergreen|evergreen|deciduous|herbaceous)\b/i;
/* a class word after a preposition describes where the plant GOES, not the plant */
const PREP = /\b(under|beneath|below|among|amongst|between|behind|against|near|alongside)\s+(\w+\s+){0,2}(semi-evergreen|evergreen|deciduous|herbaceous)\b/i;

const loadLedger = () => {
  if (!fs.existsSync(LEDGER)) return { _readme: [], generated: null, entries: [] };
  try { return JSON.parse(fs.readFileSync(LEDGER, 'utf8')); } catch { return { entries: [] }; }
};

if (LIST) {
  const l = loadLedger();
  if (!l.entries || !l.entries.length) { console.log('nothing derived yet.'); process.exit(0); }
  const byField = {};
  for (const e of l.entries) (byField[e.field] = byField[e.field] || []).push(e);
  console.log(`${l.entries.length} derived value(s) — DEDUCED, not researched.`);
  console.log('A sourced answer should replace these when one arrives:\n');
  for (const [f, es] of Object.entries(byField)) {
    console.log(`  ${f}  (${es.length})`);
    for (const e of es) console.log(`      ${e.latin}   [${e.rule}]`);
  }
  console.log('\nto replace one: put the researched value in data/incoming/ then');
  console.log('  node tools/backfill-field.js <field> --apply --overwrite');
  process.exit(0);
}

const html = fs.readFileSync(HTML, 'utf8');
const deck = D.readDeck(html), hold = D.readHold(html);
const plan = [];
const skipped = [];

for (const [block, rows] of [['deck', deck], ['hold', hold]]) {
  for (const p of rows) {
    /* 1. hardinessNote from the band */
    if (!String(p.hardinessNote || '').trim()) {
      const band = String(p.hardiness || '').trim();
      if (BAND[band]) {
        plan.push({ block, latin: p.latin, field: 'hardinessNote', value: BAND[band], rule: 'band-definition:' + band });
      } else {
        skipped.push(`${p.latin}: hardiness ${JSON.stringify(band)} is not a band this table knows`);
      }
    }
    /* 2. foliage from the card's own visual */
    if (!String(p.foliage || '').trim()) {
      const v = String(p.visual || '');
      const m = v.match(CLASS);
      if (m && !PREP.test(v)) {
        plan.push({ block, latin: p.latin, field: 'foliage', value: m[1].toLowerCase(), rule: 'own-visual' });
      } else if (m) {
        skipped.push(`${p.latin}: foliage word sits after a preposition in visual — left blank`);
      }
    }
  }
}

const byField = {};
for (const e of plan) byField[e.field] = (byField[e.field] || 0) + 1;
console.log(`\nderive-field${APPLY ? '' : '  (dry run — nothing written)'}`);
for (const [f, n] of Object.entries(byField)) console.log(`  ${String(n).padStart(4)}  ${f}`);
if (skipped.length) {
  console.log(`\n  ${skipped.length} left blank on purpose:`);
  skipped.slice(0, 12).forEach(s => console.log('      ' + s));
  if (skipped.length > 12) console.log(`      ... and ${skipped.length - 12} more`);
}
if (!plan.length) { console.log('\nnothing to derive.'); process.exit(0); }
if (!APPLY) { console.log('\nre-run with --apply to write.'); process.exit(0); }

/* ---- write, then re-parse before saving ---- */
const patch = (rows) => rows.map(p => {
  const mine = plan.filter(e => e.latin === p.latin);
  if (!mine.length) return p;
  const out = { ...p };
  for (const e of mine) out[e.field] = e.value;
  return out;
});
let out = D.writeBlock(html, 'deck', patch(deck));
if (!out) { console.error('could not write the deck block'); process.exit(1); }
out = D.writeBlock(out, 'hold', patch(hold));
if (!out) { console.error('could not write the hold block'); process.exit(1); }
if (D.readDeck(out).length !== deck.length || D.readHold(out).length !== hold.length) {
  console.error('re-parse mismatch — aborting, nothing written'); process.exit(1);
}
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.mkdirSync(path.join(ROOT, '.backups'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '.backups', `timber.${stamp}.html`), html);
fs.writeFileSync(HTML, out);

const ledger = loadLedger();
ledger._readme = [
  'Values DEDUCED by tools/derive-field.js, not researched by a human.',
  '',
  'Every entry here is true — a band definition transcribed from CARD-STATS.md,',
  "or a class word read back out of the card's own `visual` line — but none of",
  'it is plant-specific research, and a sourced answer should replace it.',
  '',
  'This file exists because filling a blank HIDES it: backfill-field.js <field>',
  '--missing stops reporting a card once that field is non-empty. This is the',
  'recoverable list of what still wants a real answer.',
  '',
  'To replace one: put the researched value in data/incoming/ then',
  '  node tools/backfill-field.js <field> --apply --overwrite',
];
ledger.generated = new Date().toISOString().slice(0, 10);
const key = e => e.latin + ' :: ' + e.field;
const have = new Set((ledger.entries || []).map(key));
ledger.entries = [...(ledger.entries || []),
  ...plan.filter(e => !have.has(key(e))).map(({ latin, field, value, rule }) => ({ latin, field, value, rule }))];
fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 1) + '\n');

console.log(`\nwrote timber.html — ${plan.length} value(s) derived (backup in .backups/timber.${stamp}.html)`);
console.log(`logged to data/derived.json — ${ledger.entries.length} total; see --list`);
