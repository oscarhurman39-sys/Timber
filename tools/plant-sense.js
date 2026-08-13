#!/usr/bin/env node
/*
  plant-sense.js — an independent second pass over every card's FACTS.

    node tools/plant-sense.js            report contradictions
    node tools/plant-sense.js --strict   exit 1 on any contradiction (for CI)
    node tools/plant-sense.js --json     machine-readable

  WHY THIS EXISTS
  Cards are researched in batches and verified once per batch, which is fast but
  shallow: a wrong thirst or care rating is not obviously wrong on its own, so it
  sails through. This pass cannot check a fact against the world — it has no
  sources — but it CAN check every card against ITSELF. A card that says
  "drought tolerant once established" in prose and carries thirst 18 out of 20 is
  wrong somewhere, and which half is wrong is a question a human can answer fast.

  That is the whole design: turn "is this card right?" (unanswerable at a glance,
  128 times over) into "these 9 cards disagree with themselves" (answerable).

  Every rule below fires only on a genuine internal contradiction, never on a
  blank — a blank is an honest "not entered yet" and is reported separately as
  coverage, not as an error. Rules are deliberately conservative: this tool
  should almost never cry wolf, because a noisy checker gets ignored.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const D = require('./plant-data.js');

const html = fs.readFileSync(path.join(ROOT, 'timber.html'), 'utf8');
const deck = D.readDeck(html);
const hold = D.readHold(html);
const cards = deck.concat(hold);

/* Contradictions that are real, already written up in VERIFY-QUEUE.md, and
   waiting on a horticultural call rather than a code change. Listed as
   "<latin>|<rule>" so a DIFFERENT problem on the same card still fails.
   Same discipline as tests/deck-audit.js: never add a line to silence a new
   defect — add it only alongside an entry in VERIFY-QUEUE.md that says why. */
const KNOWN = new Set([
  "Clematis 'Nelly Moser'|size-no-rails",
  "Clematis viticella 'Purpurea Plena Elegans'|size-no-rails",
  'Clematis montana var. rubens|size-no-rails',
  "Clematis armandii|size-no-rails",
  'Fallopia baldschuanica|size-no-rails',
]);

const issues = [];
const flag = (card, rule, detail, severity = 'contradiction') => {
  if (severity === 'contradiction' && KNOWN.has(`${card.latin}|${rule}`)) severity = 'known';
  issues.push({ card: card.common, latin: card.latin, rule, detail, severity });
};

const num = v => (v === '' || v == null ? null : Number(v));
const has = v => v !== '' && v != null;
const text = c => [c.visual, c.water, c.aspect, c.soil, c.prune, c.resilience,
  c.shrink, c.returnRisk, c.type, c.uses].filter(Boolean).join(' · ');

/* ---------- month parsing, shared by the seasonal rules ---------- */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
function monthsOf(peak) {
  if (!peak) return [];
  const s = String(peak).toLowerCase().replace(/[–—]/g, '-');
  const out = new Set();
  for (const part of s.split(/[,/&]|\band\b/)) {
    const found = [...part.matchAll(/([a-z]{3})[a-z]*/g)]
      .map(m => MONTHS.indexOf(m[1])).filter(i => i >= 0);
    if (/-/.test(part) && found.length === 2) {
      let [a, b] = found;
      for (let i = 0; i < 12; i++) { out.add((a + i) % 12); if ((a + i) % 12 === b) break; }
    } else found.forEach(i => out.add(i));
  }
  return [...out];
}
const SEASON = {
  spring: [2, 3, 4], summer: [5, 6, 7], autumn: [8, 9, 10], fall: [8, 9, 10], winter: [11, 0, 1],
};

for (const c of cards) {
  const t = text(c).toLowerCase();
  const thirst = num(c.thirst), care = num(c.careLevel), pest = num(c.pestRisk);
  const sun = num(c.sunNeed), sunMin = num(c.sunMin), speed = num(c.growthSpeed);

  /* 1. water prose vs thirst rating (0-20; 20 = thirstiest) */
  const dry = /\b(drought[- ]tolerant|drought resistant|low once established|once established[,.]? *(?:low|drought)|water sparingly|dry soil|xeric|low water)\b/.test(t);
  /* "water freely" is deliberately NOT here: it is a growing-season instruction
     ("water freely in growth; sparingly in winter") and sits perfectly happily on
     a drought-tolerant Mediterranean container plant. Including it flagged
     Oleander, which is correct as written. Only true moisture-lover phrasing. */
  const wet = /\b(keep moist|never dries|constantly moist|boggy|marginal aquatic|moisture[- ]retentive soil essential|does not tolerate drought)\b/.test(t);
  if (dry && has(thirst) && thirst >= 14)
    flag(c, 'thirst-vs-prose', `prose says drought tolerant but thirst is ${thirst}/20`);
  if (wet && has(thirst) && thirst <= 6)
    flag(c, 'thirst-vs-prose', `prose says it must stay moist but thirst is only ${thirst}/20`);

  /* 2. pest prose vs pestRisk. CARD-STATS.md §2a: HIGHER = more prone to trouble
        (stored directly, no inversion). */
  const pestFree = /\b(pest[- ]free|trouble[- ]free|pest and disease free|disease[- ]resistant|pest resistant|generally pest free)\b/.test(t);
  const pestProne = /\b(prone to (?:aphid|scale|red spider|vine weevil|mildew|blackspot|rust)|susceptible to|watch for (?:aphid|scale|mildew))\b/.test(t);
  if (pestFree && has(pest) && pest >= 14)
    flag(c, 'pest-vs-prose', `prose says pest-free but pestRisk is ${pest}/20 (higher = more trouble)`);
  if (pestProne && has(pest) && pest <= 5)
    flag(c, 'pest-vs-prose', `prose names specific pest problems but pestRisk is only ${pest}/20`);

  /* 3. aspect prose vs the sun band the dial draws */
  const fullSunOnly = /\bfull sun\b/.test(String(c.aspect || '').toLowerCase()) &&
    !/(shade|pt sh|part)/.test(String(c.aspect || '').toLowerCase());
  const shadeOnly = /\b(full shade|deep shade|shade only)\b/.test(String(c.aspect || '').toLowerCase());
  if (fullSunOnly && has(sun) && sun < 55)
    flag(c, 'sun-vs-aspect', `aspect is full sun only but sunNeed is ${sun}/100`);
  if (shadeOnly && has(sun) && sun > 45)
    flag(c, 'sun-vs-aspect', `aspect is shade only but sunNeed is ${sun}/100`);
  if (has(sun) && has(sunMin) && sunMin > sun)
    flag(c, 'sun-band-inverted', `sunMin ${sunMin} > sunNeed ${sun}`);

  /* 4. maintenance prose vs careLevel. CARD-STATS.md §2c: HIGHER = more work. */
  const easy = /\b(no (?:regular )?prun|needs no prun|prune only to|low maintenance|virtually maintenance[- ]free|little attention)\b/.test(t);
  /* "demanding" and "exacting" are bare adjectives with no polarity of their own,
     so they need a negation guard: "few demanding requirements" means the
     opposite of "demanding" and flagged Kolkwitzia 'Pink Cloud' as a
     contradiction when careLevel 5 was correct. The other alternatives here are
     whole phrases that cannot be negated into their own opposite. */
  const fussy = /\b(requires (?:regular|careful)|needs winter protection|fleece in winter|lift(?: and store)? (?:before|over) winter|(?<!\b(?:few|no|not|without|little|hardly any)\s)(?:demanding|exacting)|move (?:indoors|under glass))\b/.test(t);
  if (easy && has(care) && care >= 14)
    flag(c, 'care-vs-prose', `prose says low maintenance but careLevel is ${care}/20 (higher = more work)`);
  if (fussy && has(care) && care <= 5)
    flag(c, 'care-vs-prose', `prose describes winter protection / regular attention but careLevel is only ${care}/20`);

  /* 5. hardiness vs tenderness prose. H5+ is "hardy in most of the UK"; a card
        that also says it needs frost protection is contradicting its own crest. */
  const hNum = /^H(\d)/.exec(String(c.hardiness || ''));
  const tender = /\b(tender|frost[- ]tender|not frost hardy|needs winter protection|overwinter (?:indoors|under glass)|min(?:imum)? \d+ ?°c|glasshouse|conservatory)\b/.test(t);
  if (hNum && Number(hNum[1]) >= 5 && tender)
    flag(c, 'hardiness-vs-prose', `crest says ${c.hardiness} (hardy) but prose describes frost tenderness`);
  if (hNum && Number(hNum[1]) <= 2 && /\b(fully hardy|very hardy|cold hardy|hardy anywhere)\b/.test(t))
    flag(c, 'hardiness-vs-prose', `crest says ${c.hardiness} (tender) but prose calls it hardy`);

  /* 6. commercial arithmetic. margin = (retail - trade) / retail. Both are quoted
        as ranges, so compare the achievable band, and only complain when the stated
        margin cannot be reached at ANY point in the quoted ranges. */
  const money = s => [...String(s || '').matchAll(/£\s?(\d+(?:\.\d+)?)/g)].map(m => Number(m[1]));
  /* "55–60%" states a range but only the top number carries the % sign, so match
     bare leading numbers of a range too — otherwise a 55-60% band reads as 60-60%
     and every ranged margin looks like a mismatch. */
  const pct = s => {
    const str = String(s || '');
    const m = str.match(/(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)\s*%/);
    if (m) return [Number(m[1]), Number(m[2])];
    return [...str.matchAll(/(\d+(?:\.\d+)?)\s?%/g)].map(x => Number(x[1]));
  };
  const tr = money(c.trade), re = money(c.retail), mg = pct(c.margin);
  if (tr.length && re.length && mg.length) {
    const tLo = Math.min(...tr), tHi = Math.max(...tr);
    const rLo = Math.min(...re), rHi = Math.max(...re);
    const best = (rHi - tLo) / rHi * 100;         // cheapest buy, dearest sell
    const worst = (rLo - tHi) / rLo * 100;        // dearest buy, cheapest sell
    const mLo = Math.min(...mg), mHi = Math.max(...mg);
    if (mLo > best + 0.5)
      flag(c, 'margin-arithmetic', `stated margin ${mLo}-${mHi}% is unreachable: best case from trade £${tLo}-${tHi} to retail £${rLo}-${rHi} is ${best.toFixed(1)}%`);
    /* A stated margin BELOW the gross arithmetic is only a warning: the quoted
       band may legitimately be net of carriage, potting and shrink, which the
       trade/retail figures don't capture. A margin ABOVE what the prices can
       yield has no such excuse, so that stays a contradiction. */
    if (mHi < worst - 0.5)
      flag(c, 'margin-arithmetic', `stated margin ${mLo}-${mHi}% is below the gross arithmetic (${worst.toFixed(1)}% at worst from these prices) — fine if the band is net of costs, wrong if it should be gross`, 'warning');
    if (tHi >= rLo)
      flag(c, 'margin-arithmetic', `trade top £${tHi} is at or above retail floor £${rLo} — sold at a loss at that end`, 'contradiction');
  }

  /* 7. peak season vs seasonal words in the prose */
  const pm = monthsOf(c.peak);
  if (pm.length) {
    for (const [word, months] of Object.entries(SEASON)) {
      const claimsSeason = new RegExp(`\\b${word}[- ](?:flower|bloom|blossom|colour|color|interest|display)`, 'i').test(t);
      if (!claimsSeason || months.some(m => pm.includes(m))) continue;
      /* A plant can honestly have two seasons of interest — Cornus kousa flowers
         in May and colours in October — and the card has one bloom band. When the
         mismatch is flower-vs-foliage the card is not wrong, it just can't show
         both, so that's a warning. A flowering claim outside the flowering band
         is a straight contradiction. */
      const foliageClaim = new RegExp(`\\b${word}[- ](?:colour|color|interest|display)`, 'i').test(t);
      flag(c, 'peak-vs-prose',
        `prose claims ${word} interest but peak "${c.peak}" covers none of ${word}` +
        (foliageClaim ? ' — second season of interest the single bloom band cannot show' : ''),
        foliageClaim ? 'warning' : 'contradiction');
    }
  }
  if (c.peak && !pm.length)
    flag(c, 'peak-unparseable', `peak "${c.peak}" parses to no months — the bloom timeline will be empty`, 'warning');

  /* 8. size rail sanity: both dimensions must parse, and a "compact"/"dwarf"
        claim should not sit on a 4m plant. */
  /* sizes are written in either metres or centimetres, and as single values or
     ranges: "1.5–2.5m H × 1–1.5m W", "75 cm H × 60 cm W", "1.2–1.5 m H × 60–90 cm W".
     Take the top of each range, normalised to metres. */
  const dims = [...String(c.size || '')
    .matchAll(/(\d+(?:\.\d+)?)\s*(?:[–—-]|to)?\s*(\d+(?:\.\d+)?)?\s*(cm|m)\b/gi)]
    .map(m => Number(m[2] ?? m[1]) / (m[3].toLowerCase() === 'cm' ? 100 : 1));
  /* The rails need "<height> H × <spread> W". Anything else leaves them blank. */
  if (c.size && !/\bH\b/.test(String(c.size)) && !/\bW\b/.test(String(c.size)))
    flag(c, 'size-no-rails', `size "${c.size}" has no "H × W" split, so both size rails render blank`);
  else if (c.size && dims.length < 2)
    flag(c, 'size-unparseable', `size "${c.size}" does not give two dimensions for the H/S rails`, 'warning');
  /* "dwarf" is an absolute claim; "compact" is often relative (a compact citrus is
     still a big shrub), so only the strong words are treated as contradictory. */
  const strongSmall = /\b(dwarf|miniature|low[- ]growing|ground ?cover)\b/.test(t);
  const softSmall = /\bcompact\b/.test(t);
  if (dims.length && strongSmall && Math.max(...dims) > 2.5)
    flag(c, 'size-vs-prose', `described as dwarf/miniature but size reaches ${Math.max(...dims)}m`);
  else if (dims.length && softSmall && Math.max(...dims) > 3)
    flag(c, 'size-vs-prose', `described as compact but size reaches ${Math.max(...dims)}m — check the band is not a step too high`, 'warning');

  /* 9. binomial shape: "Genus species" or "Genus 'Cultivar'". Catches typos and
        a common/latin swap. Not a taxonomy check — just the written form. */
  /* a leading "×" is valid — it marks an intergeneric hybrid (nothogenus), e.g.
     "× Cuprocyparis leylandii". Strip it before checking the genus capital. */
  const L = String(c.latin || '').trim().replace(/^[×x]\s*/, '');
  if (L && !/^[A-Z][a-z×-]+(?:\s+[×x]\s*)?(?:\s+[a-z][a-z-]+)?/.test(L))
    flag(c, 'latin-form', `"${L}" does not start with a capitalised genus`, 'warning');
  /* Take the epithet as everything between the FIRST and LAST apostrophe, because
     cultivar names legitimately contain them — Euonymus fortunei 'Emerald 'n' Gold'
     would otherwise read as the epithet "Emerald ". */
  const first = L.indexOf("'"), last = L.lastIndexOf("'");
  if (first !== -1 && last > first) {
    const cv = L.slice(first + 1, last);
    if (cv !== cv.trim()) flag(c, 'latin-form', `cultivar epithet has stray spacing: "${cv}"`, 'warning');
  }

  /* 10. growth speed vs prose */
  if (/\b(slow[- ]growing|very slow)\b/.test(t) && has(speed) && speed >= 15)
    flag(c, 'speed-vs-prose', `prose says slow-growing but growthSpeed is ${speed}/20`);
  if (/\b(fast[- ]growing|vigorous|rampant|quick to establish)\b/.test(t) && has(speed) && speed <= 5)
    flag(c, 'speed-vs-prose', `prose says vigorous/fast but growthSpeed is ${speed}/20`);
}

/* ---------- coverage: blanks are honest, but worth counting ---------- */
const RATINGS = ['seasonalImpact', 'growthSpeed', 'pestRisk', 'thirst', 'careLevel', 'sunNeed', 'sunMin'];
const coverage = RATINGS.map(f => ({
  field: f,
  filled: cards.filter(c => has(c[f])).length,
  blank: cards.filter(c => !has(c[f])).length,
}));
const fullyBlank = cards.filter(c => RATINGS.every(f => !has(c[f])));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ cards: cards.length, issues, coverage, fullyBlank: fullyBlank.map(c => c.common) }, null, 2));
} else {
  const contradictions = issues.filter(i => i.severity === 'contradiction');
  const warnings = issues.filter(i => i.severity === 'warning');
  console.log(`plant-sense: ${cards.length} cards checked (${deck.length} dealt, ${hold.length} held)\n`);
  if (contradictions.length) {
    console.log(`CONTRADICTIONS (${contradictions.length}) — the card disagrees with itself; one side is wrong:`);
    for (const i of contradictions) console.log(`  ✗ ${i.card} [${i.rule}] ${i.detail}`);
    console.log('');
  }
  if (warnings.length) {
    console.log(`WARNINGS (${warnings.length}) — malformed rather than contradictory:`);
    for (const i of warnings) console.log(`  · ${i.card} [${i.rule}] ${i.detail}`);
    console.log('');
  }
  const known = issues.filter(i => i.severity === 'known');
  if (known.length) {
    console.log(`KNOWN (${known.length}) — real, written up in VERIFY-QUEUE.md, awaiting a horticultural call:`);
    for (const i of known) console.log(`  ~ ${i.card} [${i.rule}] ${i.detail}`);
    console.log('  fix the card, then delete its line from KNOWN in this file and from VERIFY-QUEUE.md.\n');
  }
  console.log('rating coverage:');
  for (const c of coverage) console.log(`  ${c.field.padEnd(15)} ${String(c.filled).padStart(3)} filled  ${String(c.blank).padStart(3)} blank`);
  if (fullyBlank.length) console.log(`\ncards with NO ratings at all (${fullyBlank.length}): ${fullyBlank.map(c => c.common).join(', ')}`);
  console.log(contradictions.length ? `\n${contradictions.length} contradiction(s) to resolve.` : '\nNo card contradicts itself.');
}

process.exit(process.argv.includes('--strict') && issues.some(i => i.severity === 'contradiction') ? 1 : 0);
