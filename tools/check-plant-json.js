#!/usr/bin/env node
/* check-plant-json.js — validate a plant JSON produced from PLANT-BRIEF.md
   BEFORE it goes anywhere near the app, and print the PLANTS row to paste in.

     node tools/check-plant-json.js path/to/plant.json

   It never edits data and never fills anything in — it reports. Blank fields are
   fine (blank is honest); the point is catching the errors that would otherwise
   reach a customer: a wrong-scale rating, a light level in the aspect field, a
   soil warning that just repeats the soil, an unparseable bloom range.
*/
'use strict';
const fs = require('fs');

const file = process.argv[2];
if (!file) { console.error('usage: node tools/check-plant-json.js <plant.json>'); process.exit(1); }

let p;
try { p = JSON.parse(fs.readFileSync(file, 'utf8')); }
catch (e) { console.error('ERROR: not valid JSON — ' + e.message); process.exit(1); }

const errors = [], warnings = [], notes = [];

/* ---- required identity ---- */
for (const f of ['common', 'latin', 'hardiness']) {
  if (!p[f] || !String(p[f]).trim()) errors.push(`"${f}" is required and must be real`);
}
const hue = Number(p.hue);
if (!Number.isInteger(hue) || hue < 0 || hue > 360) errors.push(`"hue" must be a whole number 0-360 (got ${JSON.stringify(p.hue)})`);

/* ---- hardiness band ---- */
const BANDS = ['H1a','H1b','H1c','H2','H3','H4','H5','H6','H7'];
if (p.hardiness && !BANDS.includes(String(p.hardiness).trim())) {
  errors.push(`"hardiness" is "${p.hardiness}" — must be one of ${BANDS.join(', ')}`);
}
if (p.hardiness === 'H5' && !p.hardinessNote) {
  notes.push('hardiness is H5 with no note — H5 was the value every early mock-up wrongly carried, so double-check it against the label/RHS');
}

/* ---- ratings ---- */
const SCALES = { pestRisk: 20, thirst: 20, careLevel: 20, growthSpeed: 20, sunNeed: 100, sunMin: 100 };
for (const [f, max] of Object.entries(SCALES)) {
  const v = p[f];
  if (v === '' || v == null) { notes.push(`"${f}" is blank — its row/marker will not render`); continue; }
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > max) {
    errors.push(`"${f}" is ${JSON.stringify(v)} — must be a whole number 0-${max}`);
  } else if (max === 20 && n <= 5 && n !== 0) {
    warnings.push(`"${f}" is ${n} — valid, but suspiciously like a 0-5 rating that wasn't converted (x4). Confirm it means ${(n/4).toFixed(2)}/5, not ${n}/5`);
  }
}
if (p.sunMin != null && p.sunNeed != null && Number(p.sunMin) > Number(p.sunNeed)) {
  errors.push(`"sunMin" (${p.sunMin}) is above "sunNeed" (${p.sunNeed}) — the tolerated floor cannot exceed the preferred level`);
}

/* ---- compass rule: aspect must be a facing, never a light level ---- */
const LIGHT_WORDS = /\b(full sun|part shade|partial shade|semi[- ]shade|dappled|deep shade|shade)\b/i;
if (p.aspect && LIGHT_WORDS.test(p.aspect) && !/\b(north|south|east|west)\b/i.test(p.aspect)) {
  errors.push(`"aspect" is "${p.aspect}" — that's a light level, not a facing. Light belongs in sunNeed; use "Any aspect" here.`);
}
if (p.aspect && !/\b(north|south|east|west)\b/i.test(p.aspect) && !/any aspect/i.test(p.aspect)) {
  warnings.push(`"aspect" is "${p.aspect}" — no compass direction found, so the card will show "Any aspect"`);
}

/* ---- soil must not restate itself ---- */
const norm = s => String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(w => w.length > 3);
if (p.soil && p.soilWarning) {
  const shared = norm(p.soil).filter(w => norm(p.soilWarning).includes(w));
  if (shared.length) warnings.push(`"soil" and "soilWarning" share the word(s) ${shared.join(', ')} — the warning should add a constraint, not repeat the soil type`);
}
if (p.water && p.soil) {
  const shared = norm(p.water).filter(w => norm(p.soil).includes(w));
  if (shared.length) warnings.push(`"water" and "soil" share the word(s) ${shared.join(', ')} — drainage belongs in one field, not both`);
}

/* ---- length guards: the card's zones are fixed; long text auto-shrinks ---- */
if (p.soilWarning && String(p.soilWarning).length > 60)
  warnings.push(`"soilWarning" is ${String(p.soilWarning).length} chars — over ~60 the soil panel shrinks the type to fit. Consider trimming.`);
if (p.soil && String(p.soil).length > 36)
  warnings.push(`"soil" is ${String(p.soil).length} chars — over ~36 it can overflow the narrow soil-value panel (measured limit). Trim it.`);

/* ---- bloom ---- */
const MONTHS = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
function parseMonths(str) {
  if (!str) return [];
  const found = (String(str).toLowerCase().match(/[a-z]{3,}/g) || []).map(w => MONTHS[w.slice(0,3)]).filter(Boolean);
  if (!found.length) return [];
  if (found.length === 1) return [found[0]];
  const out = []; let m = found[0];
  while (true) { out.push(m); if (m === found[found.length-1] || out.length > 12) break; m = m % 12 + 1; }
  return out;
}
const parsed = parseMonths(p.peak);
if (p.peak && !parsed.length) errors.push(`"peak" is "${p.peak}" — the app can't parse it. Use "Mon-Mon", e.g. "Jul-Oct".`);
if (Array.isArray(p.bloomMonths) && parsed.length &&
    JSON.stringify(parsed) !== JSON.stringify(p.bloomMonths)) {
  warnings.push(`"peak" ("${p.peak}") parses to [${parsed}] but "bloomMonths" says [${p.bloomMonths}] — the card uses peak`);
}

/* ---- panel-fit lengths ---- */
if (p.soil && p.soil.length > 26) warnings.push(`"soil" is ${p.soil.length} chars — over ~26 it overflows the soil panel into the warning triangle. Shorten the display value (detail can live in the warning or notes).`);
if (p.soilWarning && p.soilWarning.length > 44) warnings.push(`"soilWarning" is ${p.soilWarning.length} chars — may overflow its zone (~44 max)`);

/* ---- latin formatting ---- */
if (p.latin) {
  /* allow a leading × (nothogenus, e.g. "× Cuprocyparis") or hybrid-species "Genus ×epithet" */
  if (!/^(×\s*)?[A-Z]/.test(p.latin)) errors.push('"latin" should start with a capitalised genus');
  const q = (p.latin.match(/'/g) || []).length;
  if (q % 2) errors.push(`"latin" has unbalanced quotes: ${p.latin}`);
  if (/\bx\s/i.test(p.latin) && !p.latin.includes('×')) warnings.push('"latin" may need the × hybrid sign rather than the letter x');
}

/* ---- controlled vocabularies ---- */
if (p.foliage && !['evergreen','semi-evergreen','deciduous'].includes(String(p.foliage).toLowerCase()))
  warnings.push(`"foliage" is "${p.foliage}" — expected evergreen / semi-evergreen / deciduous`);
if (p.container && !['yes','with care','no'].includes(String(p.container).toLowerCase()))
  warnings.push(`"container" is "${p.container}" — expected yes / with care / no`);

/* ---- commercial data must not be invented ---- */
for (const f of ['source','order','bench','root','trade','retail','margin','type','shrink','returnRisk','pots']) {
  if (p[f] && String(p[f]).trim()) errors.push(`"${f}" is commercial data and must come from Oscar, not research — remove it`);
}

/* ---- report ---- */
const line = (tag, arr) => arr.forEach(m => console.log(`  ${tag} ${m}`));
console.log(`\n${p.common || '(no name)'} — ${p.latin || '(no latin)'}\n`);
if (errors.length)   { console.log('ERRORS (fix before use):');   line('✗', errors); console.log(); }
if (warnings.length) { console.log('WARNINGS (check these):');     line('!', warnings); console.log(); }
if (notes.length)    { console.log('NOTES:');                      line('·', notes); console.log(); }
if (Array.isArray(p.uncertain) && p.uncertain.length) {
  console.log('DECLARED UNCERTAIN (needs Oscar/label confirmation):');
  p.uncertain.forEach(u => console.log('  ? ' + u));
  console.log();
}

if (errors.length) { console.log(`${errors.length} error(s) — not safe to add yet.\n`); process.exit(1); }

/* ---- emit the PLANTS row ---- */
const esc = v => JSON.stringify(v == null ? '' : String(v));
const n = v => (v === '' || v == null ? '""' : Number(v));
console.log('PASS — paste this row into the PLANTS array in timber.html:\n');
console.log(`  {common:${esc(p.common)}, latin:${esc(p.latin)}, hue:${hue},
   visual:${esc(p.visual)},
   water:${esc(p.water)},
   aspect:${esc(p.aspect)},
   soil:${esc([p.soil, p.soilWarning].filter(Boolean).join('; '))},
   prune:${esc(p.prune)},
   source:"", peak:${esc(p.peak)}, order:"", bench:"", root:"",
   trade:"", retail:"", margin:"", type:"", shrink:"", returnRisk:"", pots:"",
   cvs:${esc(p.cvs)},
   hardiness:${esc(p.hardiness)}, resilience:${esc(p.resilience)},
   uses:${esc(p.uses)}, size:${esc(`${p.height || ''} H × ${p.spread || ''} W`)},
   seasonalImpact:"", growthSpeed:${n(p.growthSpeed)}, pestRisk:${n(p.pestRisk)}, thirst:${n(p.thirst)}, careLevel:${n(p.careLevel)}, sunNeed:${n(p.sunNeed)}, sunMin:${n(p.sunMin)}},`);
console.log(`\nPhoto must be staged at: photos/${(p.latin||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}.jpg`);
console.log('Then bump NPLANTS in tests/app-test.js and tests/edge-test.js and run the suites.\n');
