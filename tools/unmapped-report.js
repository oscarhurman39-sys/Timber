'use strict';
/*
  unmapped-report.js — what an incoming batch carries that the card cannot.

  tools/fit-incoming.js maps research onto the 32 card fields. Several incoming
  fields have no card slot at all. They are preserved in data/incoming/, but a
  file nobody reads is only marginally better than a deletion, so this lists them
  and marks which ones carry safety or legal weight.

  Run after ingesting a batch:
    node tools/unmapped-report.js data/incoming/wishlist-batch-01.json
    node tools/unmapped-report.js data/incoming/*.json --md > /tmp/report.md
*/
const path = require('path');
const { FIELDS } = require('./plant-data.js');

/* Incoming keys that fit-incoming.js consumes rather than copies, so their
   absence from the card is expected and not a gap. */
const CONSUMED = new Set(['soilWarning', 'height', 'spread']);

/* Weight, not just presence. A missing hardinessNote is an editorial loss; a
   missing Schedule 9 note is a legal one. */
const WEIGHT = {
  compliance: 'LEGAL',
  toxicity: 'SAFETY',
  hardinessNote: 'editorial',
  foliage: 'editorial',
  container: 'editorial',
  uncertain: 'editorial',
};

const files = process.argv.slice(2).filter(a => !a.startsWith('--'));
const MD = process.argv.includes('--md');
if (!files.length) { console.error('usage: node tools/unmapped-report.js <batch.json...> [--md]'); process.exit(2); }

const cardFields = new Set(FIELDS);
const byField = new Map();
let total = 0;

for (const f of files) {
  for (const p of require(path.resolve(f))) {
    total++;
    for (const [k, v] of Object.entries(p)) {
      if (cardFields.has(k) || CONSUMED.has(k)) continue;
      const filled = Array.isArray(v) ? v.length > 0 : String(v || '').trim() !== '';
      if (!filled) continue;
      if (!byField.has(k)) byField.set(k, []);
      byField.get(k).push({ latin: p.latin, value: v });
    }
  }
}

const order = [...byField.keys()].sort((a, b) => {
  const rank = k => (WEIGHT[k] === 'LEGAL' ? 0 : WEIGHT[k] === 'SAFETY' ? 1 : 2);
  return rank(a) - rank(b) || byField.get(b).length - byField.get(a).length;
});

if (MD) {
  console.log(`# Unmapped incoming fields\n`);
  console.log(`${total} researched entries across ${files.length} batch file(s). The card schema`);
  console.log(`carries ${FIELDS.length} fields; the ones below have no card slot.\n`);
}
for (const k of order) {
  const rows = byField.get(k);
  const w = WEIGHT[k] || 'unclassified';
  if (MD) {
    console.log(`\n## \`${k}\` — ${w} — ${rows.length}/${total} entries\n`);
    for (const r of rows) {
      const v = Array.isArray(r.value) ? r.value.join(' ') : r.value;
      console.log(`- **${r.latin}** — ${v}`);
    }
  } else {
    console.log(`${w.padEnd(12)} ${k.padEnd(15)} ${String(rows.length).padStart(3)}/${total} entries`);
    if (w === 'LEGAL' || w === 'SAFETY') {
      const show = w === 'LEGAL' ? rows : rows.slice(0, 3);
      show.forEach(r => console.log(`             · ${r.latin}`));
      if (w === 'SAFETY' && rows.length > 3) console.log(`             · … and ${rows.length - 3} more`);
    }
  }
}
if (!MD) {
  const legal = order.filter(k => WEIGHT[k] === 'LEGAL').reduce((n, k) => n + byField.get(k).length, 0);
  const safety = order.filter(k => WEIGHT[k] === 'SAFETY').reduce((n, k) => n + byField.get(k).length, 0);
  console.log(`\n${legal} legal and ${safety} safety notes have no card slot.`);
  console.log('Adding `toxicity` and `compliance` to the card is a schema change (CSV columns,');
  console.log('data-audit, a rendered slot, template-geometry), not a field append — see README.');
}
