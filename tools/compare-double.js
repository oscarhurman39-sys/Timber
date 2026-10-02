#!/usr/bin/env node
/* compare-double.js — a plant JSON arrives for a card the deck already has.
   Find the card, diff every field, say which side looks right, write the fields
   Claude picks. Oscar's rule, 2026-10-01: "compare stats procedure for any doubles
   I ever send should be something we build and you figure out what seems correct".

     node tools/compare-double.js <plant.json>                  report (single object or array)
     node tools/compare-double.js batch.json --only "Rose"      report only entries whose latin/common matches
     node tools/compare-double.js plant.json --card "<latin>"   force the target card
     node tools/compare-double.js plant.json --apply hardiness,thirst,toxicity
     node tools/compare-double.js --card "<latin>" --set toxicity="No known hazard."

   MATCHING, in order, and it says which one hit:
     exact latin · latin with brackets/quotes/case stripped · same genus + same
     quoted cultivar or code · exact common name · a cultivar word found in one
     card only (PROBABLE — confirm before --apply, or pass --card).

   VERDICTS are suggestions, not decisions. The rules are small and stated:
     blank on the card, filled incoming     -> take incoming (never lose data)
     ratings within one icon (3 on 0-20,
       10 on sunNeed/sunMin)                 -> keep the card; the difference is noise
     ratings an icon or more apart, or
       hardiness / size / peak / foliage /
       hue disagreeing                        -> a call; genus siblings are printed
                                                so the deck's own consistency can
                                                settle it where nothing else can
     toxicity                                -> both sides are run through the card's
                                                real TOX_LADDER and the tier printed
     prose that merely differs                -> keep the card unless the incoming
                                                says something the card does not

   WRITING is row surgery like deal-plant.js: the one row is located by its exact
   latin and only the named literals change, so every other byte of timber.html is
   untouched. Both blocks are re-parsed afterwards and the write is rolled back if
   either changed length or the field does not read back. plants.csv is re-exported.
   Layout fields (soil, soilWarning, aspect) are NOT applied here — they are hand-
   fitted to the panel budgets per batch, see fit-incoming.js. */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const D = require('./plant-data.js');
const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'timber.html');

const argv = process.argv.slice(2);
const flag = f => { const i = argv.indexOf(f); return i === -1 ? null : argv[i + 1]; };
const positional = argv.filter((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').startsWith('--'));
const FILE = positional[0] || null;
const ONLY = flag('--only');
const FORCE = flag('--card');
const APPLY = flag('--apply') ? flag('--apply').split(',').map(s => s.trim()).filter(Boolean) : null;
const SETS = argv.map((a, i) => a === '--set' ? argv[i + 1] : null).filter(Boolean);
const JSON_OUT = argv.includes('--json');
const die = m => { console.error('ABORT: ' + m); process.exit(1); };

/* ---- the card's own safety ladder, copied verbatim from timber.html so the
   verdict matches what the card prints, not what the brief says it prints ---- */
const TOX_LADDER = [
  ['clear', /\bno (?:known )?hazard/i],
  ['severe', /highly (?:toxic|poison)|particularly (?:dangerous|poisonous)|potentially dangerous|fatal|deadly/i],
  ['harmful', /toxic|poison|harmful|cyanogenic/i],
  ['harmful', /not (?:be )?(?:treated as |considered )?edible|should not be eaten|not to be eaten|do not eat/i],
  ['edible', /\bedible\b|cooked for|for preserves/i],
  ['caution', /irritant|irritat|sap\b|allerg|spine|sharp|glove|hairs/i],
];
const TIER_WORD = { severe: 'Highly toxic', harmful: 'Toxic', caution: 'Handle with care', edible: 'Edible parts', clear: 'No known hazard' };
function toxTier(t) { if (!t || !String(t).trim()) return '(blank — prints nothing)'; for (const [k, re] of TOX_LADDER) if (re.test(t)) return TIER_WORD[k]; return TIER_WORD.caution + ' (DEFAULT — no keyword matched)'; }

/* ---- normalisers ---- */
const slugLatin = l => String(l).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const normLatin = l => String(l).toLowerCase().replace(/[\[\]()'"’‘×™®]/g, ' ').replace(/\s+/g, ' ').trim();
const genusOf = l => String(l).trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
const quotedTokens = l => [...String(l).matchAll(/'([^']+)'|\[([^\]]+)\]/g)].map(m => (m[1] || m[2]).toLowerCase().trim());
const words = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(w => w.length >= 4);
const STOP = new Set(['series', 'group', 'hybrid', 'hybrida', 'japonica', 'nigra', 'alba', 'rosa', 'rose', 'plant', 'bush', 'tree', 'shrub', 'dwarf', 'japanese', 'chinese', 'english', 'purple', 'blue', 'red', 'pink', 'white', 'black', 'gold', 'golden', 'little', 'autumn', 'winter', 'summer', 'spring']);

function cmSize(h, s) {
  /* the deck's convention: sub-metre ranges in cm, anything reaching 1 m left alone */
  const conv = v => {
    const m = String(v || '').trim().match(/^(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*m$/) || String(v || '').trim().match(/^(\d+(?:\.\d+)?)\s*m$/);
    if (!m) return v;
    const a = parseFloat(m[1]), b = m[2] != null ? parseFloat(m[2]) : null;
    if (a >= 1 || (b != null && b >= 1)) return v;
    return b != null ? `${Math.round(a * 100)}–${Math.round(b * 100)} cm` : `${Math.round(a * 100)} cm`;
  };
  if (!h || !s) return '';
  return `${conv(h)} H × ${conv(s)} W`;
}
const normSize = s => String(s || '').toLowerCase().replace(/\s+/g, '').replace(/[–—]/g, '-').replace(/\.0+(?=[^0-9])/g, '');

/* ---- load the deck ---- */
const html = fs.readFileSync(HTML, 'utf8');
const deck = D.readDeck(html), hold = D.readHold(html);
const all = [...deck.map(p => ({ card: p, state: 'dealt' })), ...hold.map(p => ({ card: p, state: 'held' }))];

function findCard(inc) {
  if (FORCE) {
    const hit = all.find(x => x.card.latin === FORCE) || all.find(x => x.card.latin.toLowerCase() === FORCE.toLowerCase());
    if (!hit) die(`--card "${FORCE}" is not in the deck or the hold block`);
    return { ...hit, how: 'forced with --card' };
  }
  const L = inc.latin || '';
  let hit = all.find(x => x.card.latin.toLowerCase() === L.toLowerCase());
  if (hit) return { ...hit, how: 'exact latin' };
  hit = all.find(x => normLatin(x.card.latin) === normLatin(L));
  if (hit) return { ...hit, how: 'latin, brackets/quotes/case stripped' };
  const g = genusOf(L), toks = quotedTokens(L);
  if (toks.length) {
    const hits = all.filter(x => genusOf(x.card.latin) === g && quotedTokens(x.card.latin).some(t => toks.includes(t)));
    if (hits.length === 1) return { ...hits[0], how: `same genus + cultivar/code '${toks.find(t => quotedTokens(hits[0].card.latin).includes(t))}'` };
  }
  if (inc.common) {
    hit = all.find(x => x.card.common.toLowerCase() === String(inc.common).toLowerCase());
    if (hit) return { ...hit, how: 'exact common name' };
  }
  /* last: a distinctive word from the incoming cultivar or common name, found in exactly one card */
  const cand = [...new Set([...words(L.replace(/^\S+\s*\S*/, '')), ...words(inc.common)])].filter(w => !STOP.has(w) && w !== g);
  for (const w of cand) {
    const hits = all.filter(x => (x.card.latin + ' ' + x.card.common + ' ' + (x.card.cvs || '')).toLowerCase().includes(w));
    if (hits.length === 1) return { ...hits[0], how: `PROBABLE — the word "${w}" appears in this one card only; confirm, or pass --card` , probable: true };
  }
  return null;
}

/* ---- the diff ---- */
const SCORE = { growthSpeed: 3, pestRisk: 3, thirst: 3, careLevel: 3, sunNeed: 10, sunMin: 10 };
const PROSE = ['visual', 'water', 'prune', 'resilience', 'uses', 'cvs', 'hardinessNote'];
const CALL = ['hardiness', 'peak', 'foliage', 'hue', 'size', 'compliance', 'pollination', 'stockForm', 'clay', 'rootSize'];
const blank = v => v == null || String(v).trim() === '';
const foliageWord = s => (String(s || '').match(/semi-evergreen|evergreen|deciduous|herbaceous/i) || [''])[0].toLowerCase();

function siblings(latin, field) {
  const g = genusOf(latin);
  const vals = all.filter(x => genusOf(x.card.latin) === g && x.card.latin !== latin && !blank(x.card[field])).map(x => String(x.card[field]));
  if (!vals.length) return '';
  const count = {}; vals.forEach(v => count[v] = (count[v] || 0) + 1);
  return Object.entries(count).sort((a, b) => b[1] - a[1]).map(([v, n]) => `${v}×${n}`).join(' ');
}

function diffOne(inc, hit) {
  const c = hit.card, rows = [];
  const incSize = cmSize(inc.height, inc.spread) || inc.size || '';
  const incoming = { ...inc, size: incSize };
  const fields = ['common', 'hue', 'hardiness', 'hardinessNote', 'peak', 'foliage', 'size', 'growthSpeed', 'pestRisk', 'thirst', 'careLevel', 'sunNeed', 'sunMin', 'toxicity', 'compliance', 'cvs', 'visual', 'water', 'prune', 'resilience', 'uses', 'pollination', 'stockForm', 'clay', 'rootSize'];
  for (const f of fields) {
    const a = c[f], b = incoming[f];
    if (blank(a) && blank(b)) continue;
    let verdict, same = false;
    if (f in SCORE) {
      const x = Number(a), y = Number(b);
      if (blank(a)) verdict = 'card blank → take incoming';
      else if (blank(b)) verdict = 'incoming blank → keep card';
      else if (x === y) { verdict = 'same'; same = true; }
      else if (Math.abs(x - y) <= SCORE[f]) verdict = `within one icon (Δ${y - x > 0 ? '+' : ''}${y - x}) → keep card`;
      else verdict = `an icon or more apart (Δ${y - x > 0 ? '+' : ''}${y - x}) → A CALL · siblings ${siblings(c.latin, f) || 'none'}`;
    } else if (f === 'toxicity') {
      const ta = toxTier(a), tb = toxTier(b);
      if (blank(a) && !blank(b)) verdict = `card blank → take incoming (prints ${tb})`;
      else if (blank(b)) verdict = `incoming blank → keep card (prints ${ta})`;
      else if (String(a).trim() === String(b).trim()) { verdict = 'same'; same = true; }
      else verdict = `card prints ${ta} · incoming prints ${tb}${ta === tb ? ' → same tier, keep card' : ' → A CALL (tiers differ)'}`;
    } else if (f === 'foliage') {
      if (blank(a)) verdict = 'card blank → take incoming';
      else if (blank(b)) verdict = 'keep card';
      else if (foliageWord(a) === foliageWord(b)) { verdict = foliageWord(a) ? `same class (${foliageWord(a)})` : 'same'; same = String(a) === String(b); }
      else verdict = `class differs (${foliageWord(a) || '?'} vs ${foliageWord(b) || '?'}) → A CALL · siblings ${siblings(c.latin, f) || 'none'}`;
    } else if (f === 'size') {
      if (blank(a)) verdict = 'card blank → take incoming';
      else if (blank(b)) verdict = 'keep card';
      else if (normSize(a) === normSize(b)) { verdict = 'same'; same = true; }
      else verdict = 'differs → A CALL';
    } else if (CALL.includes(f)) {
      if (blank(a)) verdict = 'card blank → take incoming';
      else if (blank(b)) verdict = 'keep card';
      else if (String(a).trim().toLowerCase() === String(b).trim().toLowerCase()) { verdict = 'same'; same = true; }
      else verdict = `differs → A CALL${f === 'hardiness' ? ' · siblings ' + (siblings(c.latin, f) || 'none') : ''}`;
    } else { /* prose + common */
      if (blank(a)) verdict = 'card blank → take incoming';
      else if (blank(b)) verdict = 'keep card';
      else if (String(a).trim() === String(b).trim()) { verdict = 'same'; same = true; }
      else verdict = `differs (card ${String(a).length} chars, incoming ${String(b).length}) → keep card unless incoming says something new`;
    }
    rows.push({ field: f, card: blank(a) ? '' : String(a), incoming: blank(b) ? '' : String(b), verdict, same });
  }
  return rows;
}

/* ---- row surgery ---- */
function rowSpan(text, latin) {
  const esc = latin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('\\n?  \\{common:[^\\n]*?latin:"' + esc + '",[\\s\\S]*?sunMin:[^}]*\\},?\\n');
  const m = text.match(re);
  if (!m) return null;
  return { start: m.index, end: m.index + m[0].length, text: m[0] };
}
function readLiteral(row, key) {
  const re = new RegExp('(?<=[\\s{,])' + key + ':');
  const m = re.exec(row);
  if (!m) return null;
  let i = m.index + m[0].length;
  if (row[i] === '"') {
    let j = i + 1;
    while (j < row.length) { if (row[j] === '\\') { j += 2; continue; } if (row[j] === '"') break; j++; }
    return { start: i, end: j + 1 };
  }
  let j = i; while (j < row.length && !/[,}\s]/.test(row[j])) j++;
  return { start: i, end: j };
}
const lit = (k, v) => (D.SCORE_FIELDS.has(k) || k === 'hue') ? (blank(v) ? '""' : String(Number(v))) : JSON.stringify(blank(v) ? '' : String(v));
function setFields(latin, changes) {
  const original = fs.readFileSync(HTML, 'utf8');
  const deckB = D.bounds(original, 'deck'), holdB = D.bounds(original, 'hold');
  let span = rowSpan(original.slice(deckB.start, deckB.end), latin), base = deckB.start, which = 'deck';
  if (!span && holdB) { span = rowSpan(original.slice(holdB.start, holdB.end), latin); base = holdB.start; which = 'hold'; }
  if (!span) die(`row for "${latin}" not found in either block`);
  let row = span.text;
  for (const [k, v] of Object.entries(changes)) {
    if (!D.FIELDS.includes(k)) die(`"${k}" is not a card field (see FIELDS in tools/plant-data.js)`);
    const l = readLiteral(row, k);
    if (l) row = row.slice(0, l.start) + lit(k, v) + row.slice(l.end);
    else {
      const at = row.search(/(?<=[\s{,])seasonalImpact:/);
      if (at === -1) die(`row for "${latin}" has no seasonalImpact anchor to insert "${k}" before`);
      row = row.slice(0, at) + `${k}:${lit(k, v)}, ` + row.slice(at);
    }
  }
  const out = original.slice(0, base + span.start) + row + original.slice(base + span.end);
  /* re-parse or roll back */
  let d2, h2;
  try { d2 = D.readDeck(out); h2 = D.readHold(out); } catch (e) { die(`rewritten file does not parse (${e.message}) — nothing written`); }
  if (d2.length !== deck.length || h2.length !== hold.length) die(`block sizes changed (${deck.length}/${hold.length} → ${d2.length}/${h2.length}) — nothing written`);
  const got = [...d2, ...h2].find(p => p.latin === latin);
  for (const [k, v] of Object.entries(changes)) {
    const want = (D.SCORE_FIELDS.has(k) || k === 'hue') ? (blank(v) ? '' : Number(v)) : String(v);
    if (String(got[k]) !== String(want)) die(`"${k}" reads back as ${JSON.stringify(got[k])}, expected ${JSON.stringify(want)} — nothing written`);
  }
  fs.writeFileSync(HTML, out);
  try { execFileSync(process.execPath, [path.join(ROOT, 'plants-tool.js'), 'export'], { stdio: 'pipe', cwd: ROOT }); }
  catch (e) { console.error('WARNING: plants.csv re-export failed — run: node plants-tool.js export'); }
  console.log(`wrote ${Object.keys(changes).length} field(s) on "${latin}" [${which}]; plants.csv re-exported`);
}

/* ---- --set mode: no incoming file needed ---- */
if (SETS.length) {
  if (!FORCE) die('--set needs --card "<latin>"');
  const changes = {};
  for (const s of SETS) { const i = s.indexOf('='); if (i < 1) die(`--set wants field=value, got ${s}`); changes[s.slice(0, i)] = s.slice(i + 1); }
  const hit = findCard({ latin: FORCE });
  for (const [k, v] of Object.entries(changes)) console.log(`${k}: ${JSON.stringify(hit.card[k] ?? '')}  →  ${JSON.stringify(v)}${k === 'toxicity' ? `   (prints ${toxTier(v)})` : ''}`);
  setFields(hit.card.latin, changes);
  process.exit(0);
}

/* ---- report / apply ---- */
if (!FILE) { console.error('usage: node tools/compare-double.js <plant.json> [--only text] [--card "<latin>"] [--apply f1,f2] | --card "<latin>" --set field=value'); process.exit(1); }
let incoming = JSON.parse(fs.readFileSync(FILE, 'utf8'));
if (!Array.isArray(incoming)) incoming = [incoming];
if (ONLY) incoming = incoming.filter(p => (p.latin + ' ' + p.common).toLowerCase().includes(ONLY.toLowerCase()));
if (APPLY && incoming.length !== 1) die(`--apply needs exactly one incoming entry (got ${incoming.length}); use --only to pick one`);

const report = [];
for (const inc of incoming) {
  const hit = findCard(inc);
  if (!hit) { report.push({ latin: inc.latin, match: null }); if (!JSON_OUT) console.log(`\n${inc.latin}\n  no card matches — this is new, not a double`); continue; }
  const rows = diffOne(inc, hit);
  report.push({ latin: inc.latin, match: hit.card.latin, state: hit.state, how: hit.how, rows });
  if (JSON_OUT) continue;
  console.log(`\n${inc.latin}\n  = ${hit.card.latin}  [${hit.state}]  matched by: ${hit.how}`);
  const diff = rows.filter(r => !r.same);
  if (!diff.length) { console.log('  every comparable field is the same'); continue; }
  for (const r of diff) {
    const show = v => v.length > 110 ? v.slice(0, 107) + '…' : v;
    console.log(`  ${r.field}`);
    console.log(`     card:     ${show(r.card) || '(blank)'}`);
    console.log(`     incoming: ${show(r.incoming) || '(blank)'}`);
    console.log(`     → ${r.verdict}`);
  }
  if (APPLY) {
    if (hit.probable) die('match is only PROBABLE — pass --card "<latin>" to confirm before --apply');
    const changes = {};
    const incSize = cmSize(inc.height, inc.spread) || inc.size || '';
    for (const f of APPLY) {
      if (['soil', 'soilWarning', 'aspect'].includes(f)) die(`"${f}" is a layout field — fit it by hand (fit-incoming.js budgets), not here`);
      const v = f === 'size' ? incSize : inc[f];
      if (v == null) die(`incoming has no "${f}"`);
      changes[f] = v;
    }
    console.log('');
    setFields(hit.card.latin, changes);
  }
}
if (JSON_OUT) console.log(JSON.stringify(report, null, 1));
