#!/usr/bin/env node
/*
  backfill-field.js — fill ONE column on cards that already exist, from research
  already sitting in data/incoming.

    node tools/backfill-field.js foliage                    what it would do
    node tools/backfill-field.js foliage --apply            do it
    node tools/backfill-field.js foliage --prefer longest   see "ties" below
    node tools/backfill-field.js foliage --apply --overwrite
    node tools/backfill-field.js foliage --missing          the cards still blank
    node tools/backfill-field.js foliage --paste            ready-to-paste research prompt
    node tools/backfill-field.js foliage --paste --chunk 40 smaller batches (default 50)

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
const PASTE = argv.includes('--paste');
const CHUNK = Math.max(1, Number(argv[argv.indexOf('--chunk') + 1]) || 50);
const OVERWRITE = argv.includes('--overwrite');
const PREFER = (argv[argv.indexOf('--prefer') + 1] || '') === 'longest' && argv.includes('--prefer');
const field = argv.find(a => !a.startsWith('--') && a !== 'longest');

if (!field) { console.error('usage: node tools/backfill-field.js <field> [--apply] [--prefer longest] [--overwrite]'); process.exit(2); }
if (!D.FIELDS.includes(field)) {
  console.error(`"${field}" is not a card field. A key outside plant-data.js FIELDS is erased by the next
csv round-trip, so add it to FIELDS first — deliberately — rather than here.`);
  process.exit(2);
}

/* ---------- --paste: the whole ask, ready for a chat window ----------
   --missing gives names one per line, which is right for a spreadsheet column and
   wrong for a chat prompt. This prints the RULES for the field and then the names
   as one comma-separated paragraph, chunked, so a batch pastes in and the answer
   pastes back.

   The rules below are not opinion. Each is a constraint tools/check-plant-json.js
   already enforces or PLANT-BRIEF.md already states. If a validator rule changes,
   change it here too, or the research comes back failing the check it was written
   to pass. */
const SPEC = {
  toxicity: { rule: [
    'PASTE CHATGPT-TOXICITY-BRIEF.md FROM THIS REPO ABOVE THIS LIST. It is the full',
    'brief for this field and carries the source order, the tier keyword table and the',
    'worked traps. What follows is only the plant list for one batch.',
  ] },
  compliance: { rule: [
    'compliance is about the LAW, not health. For each plant, does any of these apply,',
    'and what is the detail: Schedule 9 of the Wildlife and Countryside Act (illegal to',
    'plant or cause to grow in the wild); plant breeders rights / PBR / PVR (give the',
    'grant number if you can find it); a plant passport requirement to move or sell it;',
    'a biosecurity restriction (Xylella host, ash dieback, an import ban).',
    'If none apply return "" — blank is a perfectly good answer for this field.',
    'Never guess a PBR number. If a cultivar looks protected but you cannot find the',
    'grant, say exactly that in prose rather than inventing a reference.',
  ] },
  hardinessNote: { rule: [
    'One or two sentences saying what the RHS hardiness band MEANS for a UK gardener:',
    'the approximate temperature range, and any siting condition that comes with it',
    '(a sheltered wall, a winter mulch, protection in a cold garden).',
    'The card ALREADY carries the band. Do not contradict it — if your research',
    'disagrees with the band, say so in uncertain rather than writing a note that',
    'fights the shield printed beside it.',
    'Bands: H1a/H1b/H1c glasshouse - H2 tender, no frost - H3 half-hardy, -5 to 1C -',
    'H4 hardy, average winter, -10 to -5C - H5 cold winter, -15 to -10C - H6 very cold,',
    '-20 to -15C - H7 below -20C.',
  ] },
  foliage: { rule: [
    'foliage MUST NAME one of exactly these four words or the validator rejects it:',
    'evergreen, semi-evergreen, deciduous, herbaceous.',
    '"herbaceous" is the honest answer for a plant that dies to the ground, which',
    '"deciduous" does not distinguish from a bare twiggy shrub.',
    'A leaf description after the class word is welcome and prints on the card back:',
    '"deciduous; five-lobed leaves with strong red autumn colour".',
  ] },
  cvs: { rule: [
    'cvs is the cultivar / synonym / series note. Useful content: the breeder code behind',
    'a trade name (sold as FLOWER TOWER, registered as Zuilb1), accepted-name and synonym',
    'pairs, the series a colour selection belongs to, sibling cultivars worth knowing.',
    'Free prose, keep it short — it prints on the card.',
    'A straight species with nothing to say gets "".',
  ] },
  pollination: { rule: [
    'pollination MUST NAME one of exactly these three or the validator rejects it:',
    '"needs partner", "self-fertile", "not applicable".',
    'Detail after a semicolon is fine: "needs partner; female plants only berry with a',
    'male nearby". Use "not applicable" for anything not grown for fruit or seed.',
  ] },
  clay: { rule: [
    'clay is strictly "yes" or "no" — will it grow acceptably on heavy clay?',
    'There is no third answer. Leave it BLANK ("") where there is no sourced statement:',
    'blank already means "not established", and "unknown" is rejected.',
  ] },
  stockForm: { rule: [
    'stockForm is how the plant is normally SOLD in UK retail. Exactly one of:',
    '"container", "bare-root", "both". Nothing else is accepted.',
  ] },
  rootSize: { rule: [
    'rootSize is the pot or root size the plant is typically sold at in UK retail and it',
    'MUST CARRY A FIGURE: "9 cm pot", "2 L", "60-80 cm bare-root". A value with no digit',
    'is rejected because it would print an empty row on the card.',
    'No typical size found? Return "" and say why.',
  ] },
  uses: { rule: ['uses is where the plant goes, as a short mid-dot list: "Borders - gravel gardens - coastal - cut flowers". Aim under 150 characters.'] },
  water: { rule: ['water is the watering regime in one short sentence, under 120 characters. Do NOT repeat the soil drainage line — drainage belongs in soil, not here.'] },
  prune: { rule: ['prune is when and how to prune, one or two short sentences, under 165 characters. If it needs none, say so plainly.'] },
  resilience: { rule: ['resilience is what the plant shrugs off and what troubles it, one or two sentences under 165 characters. Name the actual pest or disease where there is one.'] },
  sunMin: { rule: ['sunMin is an INTEGER 0-100: the LOWEST light the plant tolerates, where 0 is deep shade, 50 part shade, 100 the most sun possible in the open. It must not exceed the sunNeed already on the card. Return null if you cannot state it.'] },
};
const RATING_SCALE = {
  pestRisk:    '0-3 bulletproof - 8-10 occasional aphid or mildew - 14-16 needs watching (roses) - 18-20 chronic (box blight).',
  thirst:      '0-3 drought-proof - 4-6 low - 10-12 average border - 16-20 constantly moist.',
  careLevel:   '0-3 plant-and-forget - 6-8 light annual tidy - 12-14 regular pruning - 18-20 high-maintenance.',
  growthSpeed: '0-4 very slow - 8-12 steady - 16-18 fast - 20 rampant.',
};
for (const [k, scale] of Object.entries(RATING_SCALE)) {
  SPEC[k] = { rule: [
    k + ' is a 0-20 INTEGER, higher = more of the named thing. Not 0-5. ' + scale,
    'The validator warns on any value of 1-5, because that is almost always a 0-5 answer',
    'left in a 0-20 box. If you mean "quite prone", that is 14, not 4.',
  ] };
}

if (PASTE) {
  if (!field) { console.error('usage: node tools/backfill-field.js <field> --paste [--chunk 50]'); process.exit(2); }
  const html0 = fs.readFileSync(HTML, 'utf8');
  const blank = [...D.readDeck(html0), ...D.readHold(html0)]
    .filter(p => p[field] === undefined || String(p[field]).trim() === '');
  if (!blank.length) { console.log('nothing blank: every card already carries "' + field + '".'); process.exit(0); }
  const spec = SPEC[field];
  const parts = [];
  for (let i = 0; i < blank.length; i += CHUNK) parts.push(blank.slice(i, i + CHUNK));

  console.log('### ' + field + ' — ' + blank.length + ' card(s) blank, ' + parts.length +
              ' batch(es) of up to ' + CHUNK + '\n');
  parts.forEach((part, k) => {
    const bar = '='.repeat(72);
    console.log(bar);
    console.log('BATCH ' + (k + 1) + ' OF ' + parts.length + ' — ' + field + ' — ' + part.length + ' plants');
    console.log(bar + '\n');
    console.log('You are filling ONE field, "' + field + '", for plants already in a UK');
    console.log('garden-centre card deck. Do not research anything else about them.\n');
    console.log('THE RULES');
    console.log('  Never invent. If you cannot find a specific, citable statement for a plant,');
    console.log('  return "' + field + '": "" for it and say why in that entry\'s uncertain.');
    console.log('  A blank is correct. A plausible guess reaches a customer.');
    console.log('  UK context throughout: RHS first, then Kew, then the trade.');
    (spec ? spec.rule : ['(no field-specific rules recorded — see PLANT-BRIEF.md)'])
      .forEach(l => console.log('  ' + l));
    console.log('');
    console.log('OUTPUT — one JSON array and nothing else. Copy each latin name EXACTLY as');
    console.log('given, including any curly apostrophe or × sign: it is the only thing the');
    console.log('importer matches on, so a retyped name silently fails to apply.\n');
    console.log('[{"latin":"<exactly as given>","' + field + '":"…","uncertain":["…"],"sources":["…"]}, …]\n');
    console.log('THE PLANTS\n');
    console.log(part.map(p => p.latin).join(', ') + '\n');
  });
  console.error('\n(save the answer into data/incoming/ then: node tools/backfill-field.js ' +
                field + ' --apply)');
  process.exit(0);
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
