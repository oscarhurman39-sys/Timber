'use strict';
/*
  ingest-batch.js — put a fitted incoming batch into timber.html's HOLD block.

  Held, not dealt, deliberately: these cards have no photograph. The deck deals
  cards with pictures; PLANTS_ON_HOLD is where a fully-researched card waits for
  one. Setting `held` to 0 in plants.csv and re-importing is how a card graduates.

  Safety properties, in order of how much they matter:
    - refuses to run if any incoming latin name already exists in either block,
      so re-running cannot duplicate a card
    - re-parses the rewritten file before saving, so a formatting bug is caught
      here rather than by the browser
    - writes a timestamped backup first
    - re-exports plants.csv, because nothing else does and a stale CSV is how
      the 2026-08-09 sunMin loss happened

  Usage:  node tools/ingest-batch.js data/incoming/wishlist-batch-01.json [--dry]
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const D = require('./plant-data.js');
const { fitBatch } = require('./fit-incoming.js');

const HTML = path.join(__dirname, '..', 'timber.html');
const DRY = process.argv.includes('--dry');
const file = process.argv.slice(2).find(a => !a.startsWith('--'));
if (!file) { console.error('usage: node tools/ingest-batch.js <batch.json> [--dry]'); process.exit(2); }

const batch = require(path.resolve(file));
const { cards, problems, excluded } = fitBatch(batch);
if (problems.length) {
  console.error('fit problems — refusing to ingest:');
  problems.forEach(p => console.error('  ' + p));
  process.exit(1);
}

let html = fs.readFileSync(HTML, 'utf8');
const deck = D.readDeck(html);
const hold = D.readHold(html);

/* Duplicate guard. Keyed on latin because that is the card's real identity —
   two cards may legitimately share a common name. */
const seen = new Map();
[...deck, ...hold].forEach(p => seen.set(p.latin, deck.includes(p) ? 'dealt' : 'held'));
const dupes = cards.filter(c => seen.has(c.latin));
if (dupes.length) {
  console.error(`refusing to ingest: ${dupes.length} already present`);
  dupes.forEach(c => console.error(`  ${c.latin} (${seen.get(c.latin)})`));
  process.exit(1);
}

console.log(`batch          ${batch.length} researched entries`);
console.log(`excluded       ${excluded.length}`);
excluded.forEach(e => console.log(`  ${e.latin}\n    ${e.reason}`));
console.log(`to ingest      ${cards.length} cards -> PLANTS_ON_HOLD`);
console.log(`hold before    ${hold.length}\nhold after     ${hold.length + cards.length}`);
console.log(`deck unchanged ${deck.length}`);

if (DRY) { console.log('\n--dry: nothing written'); process.exit(0); }

const nextHold = [...hold, ...cards];
const out = D.writeBlock(html, 'hold', nextHold);
if (!out) { console.error('could not locate the HOLD block'); process.exit(1); }

/* Re-parse what we are about to save. A pretty-printer bug once dropped the
   trailing comma and broke the file; this is the check that would have caught
   it before it shipped. */
const check = D.readHold(out);
if (check.length !== nextHold.length) {
  console.error(`re-parse mismatch: wrote ${nextHold.length}, read back ${check.length}`);
  process.exit(1);
}
if (D.readDeck(out).length !== deck.length) {
  console.error('re-parse mismatch: the dealt deck changed size — aborting');
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backups = path.join(__dirname, '..', '.backups');
fs.mkdirSync(backups, { recursive: true });
fs.writeFileSync(path.join(backups, `timber.${stamp}.html`), html);
fs.writeFileSync(HTML, out);
console.log(`\nwrote timber.html (backup in .backups/timber.${stamp}.html)`);

/* plants.csv is a real artefact other tools diff against. Nothing else rewrites
   it after an insert, so do it here. */
try {
  execFileSync('node', [path.join(__dirname, '..', 'plants-tool.js'), 'export'], { stdio: 'inherit' });
} catch (e) {
  console.error('csv re-export failed — run `node plants-tool.js export` by hand');
  process.exit(1);
}
