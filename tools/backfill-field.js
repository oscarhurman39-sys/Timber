#!/usr/bin/env node
/*
  backfill-field.js — fill ONE column on cards that already exist, from research
  already sitting in data/incoming.

    node tools/backfill-field.js foliage                    what it would do
    node tools/backfill-field.js foliage --apply            do it
    node tools/backfill-field.js foliage --prefer longest   see "ties" below
    node tools/backfill-field.js foliage --apply --overwrite
    node tools/backfill-field.js foliage --missing          the cards still blank

  The round trip a flat research pass takes:

    node tools/backfill-field.js toxicity --missing   > ask.txt
      → research those latin names, one question, many plants
      → save [{"latin":"<exactly as printed>","toxicity":"…"}, …]
        into data/incoming/
    node tools/backfill-field.js toxicity --apply

  --missing prints the latin string the card actually carries, because that is
  the only thing this tool matches on. A research pass that answers for "Astilbe"
  cannot be applied to a card called "Astilbe 'Chocolate Shogun'".

  Why this exists. tools/ingest-batch.js adds WHOLE CARDS and refuses any latin
  that already exists, which is the right rule for a batch of new plants and the
  wrong one for "we researched one question across forty plants we already have".
  Before this, a schema column added after the research (foliage, toxicity,
  hardinessNote) could only be filled by hand, card by card, so it mostly wasn't:
  312 foliage values had been supplied and 0 were on a card.

  What it will NOT do, because each of these would be a guess:
    - match anything but an exact `latin`. A genus-level answer ("Astilbe") is
      not evidence about a named cultivar card, so those are reported, not used.
    - overwrite a value a card already carries, unless you pass --overwrite.
    - pick between two incoming files that disagree. It reports the conflict and
      skips the card. `--prefer longest` narrows that to the case where every
      candidate is the SAME on the classified value and differs only in how much
      description follows, which is the shape research passes actually collide in.
    - invent, reword, trim or case-correct anything. The string reaching the card
      is the string in the JSON.

  Safety properties are ingest-batch's, for the same reasons: timestamped backup,
  re-parse the rewritten file before saving, re-export plants.csv.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const D = require('./plant-data.js');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'timber.html');
const INCOMING = path.join(ROOT, 'data', 'incoming');

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const MISSING = argv.includes('--missing');
const OVERWRITE = argv.includes('--overwrite');
const PREFER = (argv[argv.indexOf('--prefer') + 1] || '') === 'longest' && argv.includes('--prefer');
const field = argv.find(a => !a.startsWith('--') && a !== 'longest');

if (!field) { console.error('usage: node tools/backfill-field.js <field> [--apply] [--prefer longest] [--overwrite]'); process.exit(2); }
if (!D.FIELDS.includes(field)) {
  console.error(`"${field}" is not a card field. A key outside plant-data.js FIELDS is erased by the next
csv round-trip, so add it to FIELDS first — deliberately — rather than here.`);
  process.exit(2);
}

/* ---------- --missing: the question list for a flat research pass ----------
   Deliberately nothing but latin names, one per line, so the output pastes
   straight into a prompt or a spreadsheet column. Held cards are included: a
   card waiting for a photograph is still a card, and research does not need
   the photograph. */
if (MISSING) {
  const html0 = fs.readFileSync(HTML, 'utf8');
  const blank = [...D.readDeck(html0), ...D.readHold(html0)]
    .filter(p => p[field] === undefined || String(p[field]).trim() === '');
  console.error(`${blank.length} card(s) carry no ${field}:`);   /* stderr, so a > redirect keeps only the names */
  blank.forEach(p => console.log(p.latin));
  process.exit(0);
}

/* ---------- gather every supplied value, keyed by exact latin ---------- */
const supplied = new Map();          // latin -> Map(value -> [files])
const unreadable = [];
for (const f of fs.readdirSync(INCOMING).filter(f => f.endsWith('.json')).sort()) {
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(INCOMING, f), 'utf8')); }
  catch (e) { unreadable.push(`${f}: ${e.message}`); continue; }
  for (const p of (Array.isArray(j) ? j : [j])) {
    if (!p || typeof p !== 'object') continue;
    const latin = String(p.latin || '').trim();
    const raw = p[field];
    if (!latin || raw === undefined || raw === null || String(raw).trim() === '') continue;
    const v = String(raw).trim();
    if (!supplied.has(latin)) supplied.set(latin, new Map());
    const m = supplied.get(latin);
    m.set(v, (m.get(v) || []).concat(f));
  }
}

/* ---------- resolve a latin's candidates to one value, or to a reason why not ----------
   `--prefer longest` is NOT "the longer one is better research". It is only
   allowed to fire when the candidates do not disagree about anything the app
   reads — see sameAnswer below — which leaves the choice between a bare
   "deciduous" and that same answer with the leaf description still attached. */
const classOf = v => {                 /* mirrors foliageClass() in timber.html */
  const t = String(v);
  if (/(?:^|[^-\w])herbaceous/i.test(t)) return 'herbaceous';
  const m = t.match(/(?:^|[^-\w])(semi-evergreen|evergreen|deciduous|herbaceous)/i);
  return m ? m[1].toLowerCase() : '';
};
/* The comparison is per-field because "differs only in detail" is per-field.
   For any field with no classifier here, two different strings are a conflict. */
const sameAnswer = (a, b) => field === 'foliage'
  ? (classOf(a) !== '' && classOf(a) === classOf(b))
  : a.toLowerCase() === b.toLowerCase();

function resolve(values) {
  const vs = [...values.keys()];
  if (vs.length === 1) return { value: vs[0] };
  if (!PREFER) return { conflict: vs };
  if (!vs.every(v => sameAnswer(v, vs[0]))) return { conflict: vs };
  const value = vs.slice().sort((a, b) => b.length - a.length || (a < b ? -1 : 1))[0];
  return { value, tie: vs };
}

/* ---------- match against the cards that exist ---------- */
let html = fs.readFileSync(HTML, 'utf8');
const deck = D.readDeck(html), hold = D.readHold(html);
const index = new Map();
for (const p of deck) index.set(p.latin, { card: p, block: 'deck' });
for (const p of hold) index.set(p.latin, { card: p, block: 'hold' });

const fill = [], held = [], conflicts = [], nocard = [], ties = [];
for (const [latin, values] of supplied) {
  const hit = index.get(latin);
  if (!hit) { nocard.push(latin); continue; }
  const r = resolve(values);
  if (r.conflict) { conflicts.push({ latin, values: r.conflict }); continue; }
  if (r.tie) ties.push({ latin, kept: r.value, dropped: r.tie.filter(v => v !== r.value) });
  const current = hit.card[field];
  if (current !== undefined && String(current).trim() !== '') {
    if (String(current) === r.value) continue;                   /* already correct */
    if (!OVERWRITE) { held.push({ latin, current: String(current), incoming: r.value }); continue; }
  }
  fill.push({ latin, block: hit.block, value: r.value, card: hit.card });
}

/* ---------- report ---------- */
const say = (n, what) => console.log(`${String(n).padStart(4)}  ${what}`);
console.log(`\nbackfill "${field}"${APPLY ? '' : '  (dry run — nothing written)'}`);
say(supplied.size, 'latin names carry a value in data/incoming');
say(fill.length, `card(s) would get one${OVERWRITE ? ' (overwriting where set)' : ''}`);
say(nocard.length, 'supplied for a latin with no card (genus- or species-level answers are NOT applied to cultivar cards)');
say(held.length, `card(s) already carry a different value — left alone${OVERWRITE ? '' : ' (--overwrite to replace)'}`);
say(conflicts.length, 'latin(s) where data/incoming disagrees with itself — skipped');
if (ties.length) say(ties.length, '--prefer longest resolved: same answer, more description kept');
if (unreadable.length) { console.log('\nunreadable JSON:'); unreadable.forEach(u => console.log('  ' + u)); }
if (conflicts.length) {
  console.log('\nconflicts:');
  for (const c of conflicts) { console.log('  ' + c.latin); c.values.forEach(v => console.log('      ' + JSON.stringify(v))); }
}
if (held.length) {
  console.log('\nalready set (card value first):');
  for (const h of held) console.log(`  ${h.latin}\n      card     ${JSON.stringify(h.current)}\n      incoming ${JSON.stringify(h.incoming)}`);
}
if (nocard.length) console.log('\nno card for: ' + nocard.join(' · '));
if (fill.length) {
  console.log('\nwould set:');
  for (const f of fill) console.log(`  [${f.block}] ${f.latin}  ${JSON.stringify(f.value)}`);
}
if (!APPLY) { console.log('\nre-run with --apply to write.'); process.exit(0); }
if (!fill.length) { console.log('\nnothing to write.'); process.exit(0); }

/* ---------- write ---------- */
for (const f of fill) f.card[field] = f.value;
/* writeBlock takes the block NAME, not the block object: bounds() tests
   `which === 'hold'` and treats anything else as the deck, so passing D.HOLD
   silently writes the deck's cards into the hold block. The re-parse below
   caught exactly that on this tool's first run. */
let out = D.writeBlock(html, 'deck', deck);
out = D.writeBlock(out, 'hold', hold);

/* re-parse before saving, so a formatting bug is caught here and not by the browser */
const rdDeck = D.readDeck(out), rdHold = D.readHold(out);
if (rdDeck.length !== deck.length || rdHold.length !== hold.length)
  { console.error('re-parse changed the card count — refusing to write'); process.exit(1); }
const wrote = [...rdDeck, ...rdHold].filter(p => p[field] !== undefined).length;
const expect = [...deck, ...hold].filter(p => p[field] !== undefined).length;
if (wrote !== expect) { console.error(`re-parse found ${wrote} ${field} values, expected ${expect} — refusing to write`); process.exit(1); }

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backups = path.join(ROOT, '.backups');
fs.mkdirSync(backups, { recursive: true });
fs.writeFileSync(path.join(backups, `timber.${stamp}.html`), html);
fs.writeFileSync(HTML, out);
console.log(`\nwrote timber.html — ${fill.length} card(s) now carry ${field} (backup in .backups/timber.${stamp}.html)`);

try {
  execFileSync(process.execPath, [path.join(ROOT, 'plants-tool.js'), 'export'], { stdio: 'pipe', cwd: ROOT });
  console.log('plants.csv re-exported (deck + hold)');
} catch (e) { console.error('WARNING: could not re-export plants.csv -- run: node plants-tool.js export'); }
