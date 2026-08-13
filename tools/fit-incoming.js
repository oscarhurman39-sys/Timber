'use strict';
/*
  fit-incoming.js — maps a researched incoming JSON batch onto the card schema.

  The incoming shape (PLANT-BRIEF.md) and the card shape are deliberately
  different. Research prose is long; the card is a painted 420x600 template with
  measured slots. This script is where that gap is closed ON PURPOSE, in one
  reviewable place, instead of each batch being hand-edited differently.

  Three things it does that a naive mapper would get wrong:

  1. soil + soilWarning are JOINED into the card's single `soil` string, and the
     two halves have hard length budgets (26 / 44). Those are not style rules —
     the soil panel is a narrow parchment strip and longer text overflows into
     the warning triangle below it. Because research prose always blows the
     budget, the short forms are hand-authored in FIT below rather than
     machine-truncated: a clipped sentence on a printed card is worse than a
     short one that was written to be short.

  2. `aspect` on a card is a COMPASS FACING, because the card draws a compass.
     Incoming prose gives light levels ("full sun to partial shade") which is
     sunNeed, a different field. Facings are derived from the sun band, and any
     facing the research actually stated wins over the derivation.

  3. Long prose fields are trimmed at SENTENCE boundaries only, never mid-word,
     to budgets taken from what the existing deck already carries. A trimmed
     field always ends as a whole sentence.

  Anything the card schema cannot carry (toxicity, compliance, hardinessNote,
  foliage, container, uncertain) is NOT dropped: the raw batch stays committed
  in data/incoming/ and tools/unmapped-report.js lists what is being left there.

  Usage:  node tools/fit-incoming.js data/incoming/wishlist-batch-01.json [--json]
*/

/* Hand-authored short forms. Keyed by incoming `latin`.
   soil  <= 26 chars — soil TYPE and drainage only.
   warn  <= 44 chars — a real constraint, not a restatement of soil.
   face  — compass facing; omit to derive from the sun band. */
const FIT = {
  "Tetrapanax papyrifer 'Rex'":        { soil: 'Fertile, humus-rich, moist', warn: 'Suckers widely; avoid winter wet' },
  'Dicksonia antarctica':              { soil: 'Humus-rich, moist, acid',    warn: 'Never let trunk or roots dry out' },
  'Rhus typhina':                      { soil: 'Any, well-drained',          warn: 'Suckers metres from the parent plant' },
  "Rodgersia 'Bronze Peacock'":        { soil: 'Deep, fertile, moist', warn: 'Dry or hot sites scorch the foliage' },
  "Rhododendron 'Homebush'":           { soil: 'Humus-rich, ericaceous',     warn: 'No chalk or lime; keep evenly moist' },
  'Rhododendron luteum':               { soil: 'Moist, ericaceous',          warn: 'No chalk; contain — do not let it seed out' },
  'Trachycarpus fortunei':             { soil: 'Fertile, well-drained',      warn: 'Shelter from wind or leaves shred' },
  'Chamaerops humilis':                { soil: 'Free-draining, fertile',     warn: 'Sharp winter drainage; spiny leaf stalks' },
  'Melianthus major':                  { soil: 'Fertile, sharply drained',   warn: 'Cold wet soil kills; mulch the crown' },
  'Astelia chathamica':                { soil: 'Humus-rich, well-drained',   warn: 'Wet crowns rot in cold winters' },
  'Fargesia rufa':                     { soil: 'Fertile, humus-rich, moist', warn: 'Clump-forming, but widens with age' },
  'Phyllostachys nigra':               { soil: 'Fertile, humus-rich, moist', warn: 'Running — needs a rhizome barrier' },
  'Arbutus unedo':                     { soil: 'Well-drained; lime OK',      warn: 'Avoid cold wet heavy ground' },
  "Tamarix ramosissima 'Pink Cascade'":{ soil: 'Any, reasonably drained',    warn: 'Not shallow chalk; needs an open site' },
  "Pieris 'Forest Flame'":             { soil: 'Humus-rich, ericaceous',     warn: 'No chalk; shelter new growth from frost' },
  "Skimmia japonica 'Rubella'":        { soil: 'Moist, acid to neutral',     warn: 'Alkaline soil and hot sun yellow it' },
  "Ceanothus 'Concha'":                { soil: 'Free-draining, any pH',      warn: 'Winter wet is the main killer' },
  "Physocarpus opulifolius 'Diabolo'": { soil: 'Any, moist, well-drained',   warn: 'Shallow chalk can cause chlorosis' },
  "Sambucus nigra f. porphyrophylla 'Eva'": { soil: 'Any ordinary garden soil', warn: 'Rich ground makes it outgrow its space' },
  "Syringa meyeri 'Palibin'":          { soil: 'Fertile; alkaline OK', warn: 'Not wet ground or poor acid soil' },
  "Daphne bholua 'Jacqueline Postill'":{ soil: 'Humus-rich, well-drained',   warn: 'Will not forgive being moved' },
  'Sarcococca confusa':                { soil: 'Humus-rich, well-drained',   warn: 'Water in while establishing in dry shade' },
  "Chaenomeles × superba 'Crimson and Gold'": { soil: 'Any, reasonably drained', warn: 'Thorny — keep clear of narrow paths' },
  "Kolkwitzia amabilis 'Pink Cloud'":  { soil: 'Any, moist, well-drained',   warn: 'Give it width; clipping ruins the habit' },
  "Deutzia gracilis 'Nikko'":          { soil: 'Any, moist, well-drained',   warn: 'Avoid waterlogging and dry poor soil' },
  "Ribes sanguineum 'King Edward VII'":{ soil: 'Any, reasonably drained',    warn: 'Pungent foliage when handled' },
  "Aucuba japonica 'Crotonifolia'":    { soil: 'Any, reasonably drained',    warn: 'Direct sun scorches the leaves' },
  "Kalmia latifolia 'Ostbo Red'":      { soil: 'Humus-rich, ericaceous',     warn: 'Strictly lime-hating; roots resent moving' },
  'Enkianthus campanulatus':           { soil: 'Humus-rich, acid-neutral',   warn: 'Avoid chalk and prolonged drought' },
  'Fothergilla major':                 { soil: 'Humus-rich, acid-neutral',   warn: 'Avoid chalk and prolonged drought' },
  "Betula utilis subsp. jacquemontii 'Doorenbos'": { soil: 'Fertile, moist, drained', warn: 'Not for drought or standing water' },
  'Amelanchier lamarckii':             { soil: 'Moist, acid to neutral',     warn: 'Avoid shallow chalk and drought' },
  'Parrotia persica':                  { soil: 'Any drained; lime OK',       warn: 'Allow real width — it spreads broadly' },
  "Nyssa sylvatica 'Wisley Bonfire'":  { soil: 'Moist, acid to neutral',     warn: 'Lime intolerant; no chalk, no drought' },
  'Acer griseum':                      { soil: 'Fertile, moist, drained',    warn: 'Avoid drought and waterlogging' },
  "Corylus avellana 'Contorta'":       { soil: 'Any, reasonably drained',    warn: 'If grafted, pull straight suckers early' },
  "Malus 'John Downie'":               { soil: 'Fertile, moist, drained',    warn: 'Avoid waterlogging and starved soil' },
  'Koelreuteria paniculata':           { soil: 'Well-drained, any pH',       warn: 'Cold shade spoils flower and seed set' },
  "Gleditsia triacanthos f. inermis 'Sunburst'": { soil: 'Any well-drained soil', warn: 'A full tree — not a container plant' },
  "Eucalyptus gunnii Azura ('Cagire')":{ soil: 'Fertile, drained, any pH',   warn: 'Still woody and large if left unpruned' },
  'Wisteria floribunda f. multijuga':  { soil: 'Fertile, moist, drained',    warn: 'Needs a genuinely permanent support' },
  'Trachelospermum jasminoides':       { soil: 'Humus-rich, free-draining',  warn: 'Cold exposure and winter wet set it back' },
  "Hedera colchica 'Sulphur Heart'":   { soil: 'Any fertile, drained soil',  warn: 'Keep off gutters, roofs and soft mortar' },
  'Akebia quinata':                    { soil: 'Any fertile, moist soil',    warn: 'Will swamp small shrubs and weak trellis' },
  "Lonicera periclymenum 'Serotina'":  { soil: 'Humus-rich, moist, any pH',  warn: 'Not for dry starved soil; needs support' },
  "Geranium Rozanne ('Gerwat')":       { soil: 'Any fertile, drained soil',  warn: 'Rich soil or shade makes it sprawl' },
  "Erysimum 'Bowles's Mauve'":         { soil: 'Well-drained, lean',         warn: 'Wet winter soil shortens its life' },
  "Nepeta racemosa 'Walker's Low'":    { soil: 'Well-drained, lean',         warn: 'Rich wet soil makes it flop' },
  "Helleborus (Rodney Davey Marbled Group) Anna's Red ('Abcrd02')": { soil: 'Fertile, moist, drained', warn: 'No winter standing water at the crown' },
  "Hakonechloa macra 'Aureola'":       { soil: 'Humus-rich, moist',          warn: 'Emerges very late — do not dig it up' },
};

/* Entries deliberately NOT built, with the reason. An excluded plant is not a
   silent drop: the batch file still holds its research, and the reason is
   printed so it can be re-researched rather than forgotten. */
const EXCLUDE = {
  "Malus 'Evereste'": "wishlist entry 37 is Malus 'John Downie', not 'Evereste'. The supplied " +
    "research is specific to 'Evereste' (yellow-orange fruit, pitched on pollination); " +
    "'John Downie' has larger conical orange-red fruit and is pitched on jelly. " +
    "Relabelling one as the other would put wrong facts on the card. Needs a re-research.",
};

/* Compass facing derived from the sun band. The card draws a compass, so a
   light level here renders nothing useful. A facing stated in the research
   overrides this. */
function deriveFacing(sunNeed) {
  if (sunNeed >= 90) return 'South / West';
  if (sunNeed >= 60) return 'East / South / West';
  if (sunNeed >= 40) return 'East / West';
  return 'North / East';
}
const STATED = {
  "Ceanothus 'Concha'": 'South / West',
  'Trachelospermum jasminoides': 'South / West',
  'Wisteria floribunda f. multijuga': 'South / West',
  "Aucuba japonica 'Crotonifolia'": 'North / East',
};

/* Budgets from what the deck already carries, not invented. Trimming happens on
   sentence boundaries so a card never shows a clipped clause. The first sentence
   is always kept even if it alone exceeds the budget. */
const BUDGET = { visual: 190, water: 120, prune: 165, resilience: 165, uses: 150 };

function trimSentences(text, budget) {
  if (!text || text.length <= budget) return text || '';
  const parts = text.match(/[^.]+\.\s*/g);
  if (!parts) return text;
  let out = parts[0].trim();
  for (let i = 1; i < parts.length; i++) {
    const next = (out + ' ' + parts[i].trim()).trim();
    if (next.length > budget) break;
    out = next;
  }
  return out;
}

/* "4-8m" + "2.5-4m" -> "4-8m H × 2.5-4m W". Both rails read this one string, so
   a card missing either half renders blank rails (see VERIFY-QUEUE item 1). */
function makeSize(height, spread) {
  if (!height || !spread) return '';
  return `${height} H × ${spread} W`;
}

function fitCard(p) {
  const problems = [];
  const fit = FIT[p.latin];
  if (!fit) { problems.push(`no FIT entry for ${p.latin}`); return { problems }; }
  if (fit.soil.length > 26) problems.push(`${p.latin}: soil ${fit.soil.length}>26`);
  if (fit.warn.length > 44) problems.push(`${p.latin}: warn ${fit.warn.length}>44`);
  const size = makeSize(p.height, p.spread);
  if (!size) problems.push(`${p.latin}: missing height or spread`);

  const card = {
    common: p.common,
    latin: p.latin,
    hue: p.hue,
    visual: trimSentences(p.visual, BUDGET.visual),
    water: trimSentences(p.water, BUDGET.water),
    aspect: fit.face || STATED[p.latin] || deriveFacing(p.sunNeed),
    soil: `${fit.soil}; ${fit.warn}`,
    prune: trimSentences(p.prune, BUDGET.prune),
    peak: p.peak,
    cvs: p.cvs || '',
    hardiness: p.hardiness,
    resilience: trimSentences(p.resilience, BUDGET.resilience),
    uses: trimSentences(p.uses, BUDGET.uses),
    size,
    growthSpeed: p.growthSpeed,
    pestRisk: p.pestRisk,
    thirst: p.thirst,
    careLevel: p.careLevel,
    sunNeed: p.sunNeed,
    sunMin: p.sunMin,
  };
  return { card, problems };
}

function fitBatch(batch) {
  const cards = [], problems = [], excluded = [];
  for (const p of batch) {
    if (EXCLUDE[p.latin]) { excluded.push({ latin: p.latin, reason: EXCLUDE[p.latin] }); continue; }
    const r = fitCard(p);
    problems.push(...r.problems);
    if (r.card) cards.push(r.card);
  }
  return { cards, problems, excluded };
}

module.exports = { fitBatch, fitCard, FIT, EXCLUDE, BUDGET, trimSentences, makeSize, deriveFacing };

if (require.main === module) {
  const path = require('path');
  const file = process.argv[2];
  if (!file) { console.error('usage: node tools/fit-incoming.js <batch.json> [--json]'); process.exit(2); }
  const batch = require(path.resolve(file));
  const { cards, problems, excluded } = fitBatch(batch);
  if (process.argv.includes('--json')) { console.log(JSON.stringify(cards, null, 2)); process.exit(problems.length ? 1 : 0); }
  console.log(`fitted ${cards.length} of ${batch.length} cards`);
  for (const c of cards) {
    console.log(`\n${c.latin}`);
    console.log(`  aspect ${c.aspect}`);
    console.log(`  soil   ${c.soil}  (${c.soil.length})`);
    console.log(`  size   ${c.size}`);
  }
  if (problems.length) { console.log('\nPROBLEMS:'); problems.forEach(p => console.log('  ' + p)); process.exit(1); }
  console.log('\nno problems');
}
