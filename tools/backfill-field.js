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
    node tools/backfill-field.js hardiness --verify         CHECK the values already on cards
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
const VERIFY = argv.includes('--verify');
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

/* ---------- --verify: check what is ALREADY on the cards ----------
   --paste asks for values that are missing. --verify asks whether the values
   that are present are RIGHT, which is a different question and the one the
   deck has actually been bitten by: 'Pal Maleter' vs the label, two Cornus
   kousa 'Flower Tower' cards that each named the other's code in their own cvs,
   and CARD-STATS' own warning that hardiness is "the single most error-prone
   field (the mock-ups all carried H5 from the template)".

   So this prints latin + current value and asks for DISAGREEMENTS ONLY. A pass
   over 431 cards that returns "all fine" in 431 objects is unreadable and
   expensive; one that returns the twelve that are wrong is a to-do list. */
const VERIFY_SPEC = {
  hardiness: {
    ask: [
      'For each plant, does the RHS hardiness band shown match what RHS publishes?',
      'Bands: H1a >15C - H1b 10-15C - H1c 5-10C - H2 1-5C - H3 -5 to 1C -',
      'H4 -10 to -5C - H5 -15 to -10C - H6 -20 to -15C - H7 below -20C.',
      'CARD-STATS.md calls this the deck\'s most error-prone field: an early template',
      'put H5 on everything, so H5 in particular deserves a hard look.',
      'Where RHS rates the SPECIES but not the cultivar, say so rather than treating',
      'the species rating as confirmation of the cultivar.',
    ],
    answer: ['currentBand','rhsBand','note'],
  },
  latin: {
    ask: [
      'Three questions per plant, and a fourth about the list as a whole.',
      '1. Is this the currently ACCEPTED botanical name (RHS Plant Finder first, then',
      '   Kew/POWO)? If not, give the accepted name and mark this one a synonym.',
      '2. For a trade name, is the cultivar code right and correctly formatted —',
      '   Genus species TRADE NAME (\'code\')?',
      '3. Is the spelling right, including the cultivar epithet inside the quotes?',
      '4. ACROSS THE WHOLE LIST: are any TWO entries the same plant under different',
      '   names? This is the one that matters most. The deck currently carries',
      '   Cornus kousa \'Flower Tower\' AND Cornus kousa FLOWER TOWER (\'Zuilb1\') as two',
      '   cards, and each names the other in its own cvs field. Nothing automated',
      '   catches that, because a trade name written two ways is invisible to a',
      '   string comparison. Report every pair you find.',
    ],
    answer: ['currentLatin','acceptedName','isSynonym','duplicateOf','note'],
    context: ['common', 'cvs'],
  },
  peak: {
    ask: [
      'Does the flowering/interest window match what RHS gives for UK conditions?',
      'The card shows Mon-Mon and wraps the year where it needs to (Sep-May is',
      'September through to the following May).',
      'A card whose PROSE sells a second season the peak does not cover is worth',
      'flagging too — "red autumn colour" on a May-Jun peak, for instance.',
    ],
    answer: ['currentPeak','rhsPeak','note'],
    context: ['visual'],
  },
  size: {
    ask: [
      'Does the ultimate size match RHS, for UK garden conditions rather than native',
      'range? The card shows "H x W".',
      'RHS gives bands and a time-to-ultimate-height; a card claiming a 10-year size',
      'where RHS gives a 20-year one is the common error, so say which you are using.',
      'Flag anything where the size fights the card\'s own wording — "compact" on a',
      'plant reaching 4m, for instance.',
    ],
    answer: ['currentSize','rhsSize','note'],
    context: ['visual'],
  },
  toxicity: {
    ask: [
      'These values are ALREADY on cards and are read out to customers, so this pass',
      'is about wrongness, not gaps. For each, does the statement match the RHS',
      '"Potentially harmful" line or the HTA category?',
      'Flag three things specifically:',
      ' - anything stated as harmful that no UK source supports',
      ' - anything a UK source calls harmful that this wording downplays',
      ' - anything naming an animal or a plant part the source does not name',
      'Also flag any wording that would MISLEAD a reader even if technically true.',
    ],
    answer: ['currentText','verdict','suggestedText','source'],
  },
};

if (VERIFY) {
  if (!field) { console.error('usage: node tools/backfill-field.js <field> --verify [--chunk 50]'); process.exit(2); }
  const html0 = fs.readFileSync(HTML, 'utf8');
  const filled = [...D.readDeck(html0), ...D.readHold(html0)]
    .filter(p => String(p[field] ?? '').trim());
  if (!filled.length) { console.log('no card carries "' + field + '" — nothing to verify.'); process.exit(0); }
  const spec = VERIFY_SPEC[field];
  const ctx = (spec && spec.context) || [];
  const parts = [];
  for (let i = 0; i < filled.length; i += CHUNK) parts.push(filled.slice(i, i + CHUNK));

  console.log('### VERIFY ' + field + ' — ' + filled.length + ' card(s) carry a value, ' +
              parts.length + ' batch(es) of up to ' + CHUNK + '\n');
  parts.forEach((part, k) => {
    const bar = '='.repeat(72);
    console.log(bar);
    console.log('BATCH ' + (k + 1) + ' OF ' + parts.length + ' — VERIFY ' + field + ' — ' + part.length + ' plants');
    console.log(bar + '\n');
    console.log('You are CHECKING one field, "' + field + '", on plants in a UK garden-centre');
    console.log('card deck. The values below are already printed on cards. Do not rewrite the');
    console.log('deck and do not research anything else.\n');
    console.log('THE RULES');
    console.log('  REPORT DISAGREEMENTS ONLY. Return nothing for a plant you agree with.');
    console.log('  An empty array is a valid and welcome answer.');
    console.log('  Never invent. If you cannot find a source, say so in "note" and set the');
    console.log('  verdict to "unverified" rather than guessing at a correction.');
    console.log('  UK context: RHS first, then Kew, then the trade.');
    (spec ? spec.ask : ['(no checking rules recorded for this field — see PLANT-BRIEF.md)'])
      .forEach(l => console.log('  ' + l));
    console.log('');
    console.log('OUTPUT — one JSON array of ONLY the disagreements. Copy each latin EXACTLY as');
    console.log('given, curly apostrophe and × sign included.\n');
    const keys=(spec?spec.answer:['current','corrected','note']).map(k=>'"'+k+'":"…"').join(',');
    console.log('[{"latin":"<exactly as given>",'+keys+',"sources":["…"]}, …]\n');
    console.log('THE CARDS\n');
    for (const p of part) {
      const extra = ctx.map(c => String(p[c] ?? '').trim()).filter(Boolean).map(v => '  [' + v + ']').join('');
      /* for latin the value IS the name, so printing it twice is noise */
      const shown = field === 'latin' ? '' : '  =  ' + String(p[field]).replace(/\s+/g, ' ').trim();
      console.log('  ' + p.latin + shown + extra);
    }
    console.log('');
  });
  console.error('\n(disagreements come back as a to-do list, not a patch — read them, then fix' +
                '\n cards by hand or via data/incoming + backfill-field.js --apply --overwrite)');
  process.exit(0);
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

/* An APOSTROPHE is not a difference of opinion about the plant.
   Cards carry the typographer's curly quote — Nepeta racemosa 'Walker’s Low' —
   because that is what the deck was typed with. Research comes back with the
   straight ASCII one, because that is what a keyboard and most chat windows
   produce. Matched byte-for-byte those are two different plants, so the value
   was dropped on the floor with no error: it landed in "no card for", which
   reads like a genus-level answer being correctly refused, and is how six
   researched foliage values sat unapplied without anyone noticing.

   This normalises ONLY typography — the four apostrophe glyphs and runs of
   whitespace. It does NOT relax the rule that matters: a genus answer still
   cannot reach a cultivar card, because "Astilbe" and "Astilbe 'Fanal'" differ
   by more than punctuation. Exact matches are still preferred; the loose key is
   a fallback, and it refuses to guess when two cards share one. */
const typographicKey = (l) => String(l)
  .replace(/[\u2018\u2019\u02BC\u00B4]/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const index = new Map();
for (const p of deck) index.set(p.latin, { card: p, block: 'deck' });
for (const p of hold) index.set(p.latin, { card: p, block: 'hold' });

const looseIndex = new Map();
for (const [latin, entry] of index) {
  const k = typographicKey(latin);
  if (k === latin) { if (!looseIndex.has(k)) looseIndex.set(k, entry); continue; }
  looseIndex.set(k, entry);
}
/* a loose key that two different cards share is ambiguous — refuse it rather
   than pick one, which is the same rule the tie handling below applies */
{
  const seen = new Map();
  for (const latin of index.keys()) {
    const k = typographicKey(latin);
    seen.set(k, (seen.get(k) || 0) + 1);
  }
  for (const [k, n] of seen) if (n > 1) looseIndex.delete(k);
}
const lookup = (latin) => index.get(latin) || looseIndex.get(typographicKey(latin)) || undefined;

const fill = [], held = [], conflicts = [], nocard = [], ties = [];
for (const [latin, values] of supplied) {
  const hit = lookup(latin);
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
