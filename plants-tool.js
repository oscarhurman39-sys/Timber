#!/usr/bin/env node
/*
  plants-tool.js — get plant data in and out of timber.html without hand-editing it.

    node plants-tool.js export     writes ALL plants (dealt + on-hold) to plants.csv
                                   (open in Excel / Google Sheets, edit, save as CSV)
    node plants-tool.js check      validates plants.csv and reports what an import
                                   WOULD change — writes nothing
    node plants-tool.js import     validates plants.csv and rewrites both plant
                                   blocks inside timber.html (timestamped backup kept)

  ---------------------------------------------------------------------------
  WHY THIS TOOL IS PARANOID

  Before 2026-08-09 this tool had two silent data-loss paths, both fixed here:

    1. export only ever saw the PLANTS deck. The PLANTS_ON_HOLD block sat
       outside its markers, so exporting and re-importing DELETED every held
       plant. The csv now carries a "held" column and round-trips both blocks.

    2. import rebuilt every card from the FIELDS list alone, so any card key
       missing from that list was destroyed. `sunMin` — live on 132 cards — was
       missing from it. One import would have wiped the sun-band lower bound
       from the whole deck. FIELDS now includes it, and more importantly the
       tool now REFUSES to write if it finds a card key it doesn't know about,
       instead of quietly dropping it.

  The rule: this tool never invents a value and never silently discards one.
  If it cannot round-trip something losslessly, it stops and says so.
  ---------------------------------------------------------------------------

  Rules the importer enforces:
    - the locked columns only, no extras, any order
    - REQUIRED cells (common, latin, hardiness) must be filled; every other
      field may be blank = "not yet entered" (commercial data + ratings fill in
      over time — a blank is never guessed)
    - hue must be an integer 0-360; hardiness like H1a..H7
    - 0-20 rating fields (seasonalImpact/growthSpeed/pestRisk/thirst/careLevel)
      must be a whole number 0-20 or blank; sunNeed/sunMin 0-100 or blank
    - held must be 0 or 1 (1 = parked out of the deck, no photo yet)
    - no duplicate common or latin names, across dealt AND held together
  On any error, nothing is written. Rubric + scales: CARD-STATS.md.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const D = require('./tools/plant-data.js');

const HTML = path.join(__dirname, 'timber.html');
const CSV = path.join(__dirname, 'plants.csv');
const BACKUPS = path.join(__dirname, '.backups');

/* "held" is a tool-level column, not a card field: it says which block the row
   belongs in rather than anything about the plant. */
const COLUMNS = ['held', ...D.FIELDS];

function fail(msgs) {
  for (const m of [].concat(msgs)) console.error('ERROR: ' + m);
  console.error('\nNothing was written.');
  process.exit(1);
}

function readBoth() {
  const html = fs.readFileSync(HTML, 'utf8');
  let deck, hold;
  try { deck = D.readDeck(html); } catch (e) { fail(e.message); }
  try { hold = D.readHold(html); } catch (e) { fail(e.message); }
  return { html, deck, hold };
}

/* Refuse to proceed if any card carries a key the csv has no column for —
   that key would be erased on the write-back. */
function assertNoUnknownKeys(cards) {
  const unknown = new Map();
  for (const p of cards) {
    for (const k of Object.keys(p)) {
      if (!D.FIELDS.includes(k)) unknown.set(k, (unknown.get(k) || 0) + 1);
    }
  }
  if (unknown.size) {
    fail([
      'these card fields have no csv column, so an export/import round-trip would DESTROY them:',
      ...[...unknown].map(([k, n]) => `    ${k}  (present on ${n} card${n === 1 ? '' : 's'})`),
      'Add them to FIELDS in tools/plant-data.js (and to CARD-PROTOCOL.md) before running this tool.',
    ]);
  }
}

/* ---------- export ---------- */
function doExport() {
  const { deck, hold } = readBoth();
  assertNoUnknownKeys(deck.concat(hold));
  const lines = [COLUMNS.map(D.csvEscape).join(',')];
  const row = (p, held) => COLUMNS.map(f => D.csvEscape(f === 'held' ? held : (p[f] ?? ''))).join(',');
  for (const p of deck) lines.push(row(p, 0));
  for (const p of hold) lines.push(row(p, 1));
  fs.writeFileSync(CSV, lines.join('\n') + '\n');
  console.log(`Exported ${deck.length + hold.length} plants to plants.csv (${deck.length} dealt, ${hold.length} on hold; ${COLUMNS.length} columns).`);
  console.log('Open it in a spreadsheet, edit with YOUR verified values, then run: node plants-tool.js check');
}

/* ---------- validate ---------- */
function parseCsv() {
  if (!fs.existsSync(CSV)) fail('plants.csv not found — run "node plants-tool.js export" first to get the template');
  const rows = D.csvParse(fs.readFileSync(CSV, 'utf8'));
  if (rows.length < 2) fail('plants.csv has no data rows');
  const header = rows[0].map(h => h.trim());
  const errors = [];

  const missing = COLUMNS.filter(f => !header.includes(f));
  const extra = header.filter(h => !COLUMNS.includes(h));
  if (missing.length) errors.push('missing column(s): ' + missing.join(', ') +
    (missing.includes('held') ? '  — this looks like a csv exported by the old tool, which could not see on-hold plants. Re-export before editing.' : ''));
  if (extra.length) errors.push('unknown column(s): ' + extra.join(', ') + ' — only the locked fields are allowed');
  const dupHdr = header.filter((h, i) => header.indexOf(h) !== i);
  if (dupHdr.length) errors.push('duplicate column(s): ' + dupHdr.join(', '));
  if (errors.length) fail(errors);

  const dealt = [], held = [];
  const seen = { common: new Map(), latin: new Map() };
  rows.slice(1).forEach((cells, r) => {
    const rowNo = r + 2; // 1-based, after header
    if (cells.length !== header.length) {
      errors.push(`row ${rowNo}: has ${cells.length} cells, expected ${header.length}`);
      return;
    }
    const p = {};
    header.forEach((h, i) => { p[h] = cells[i].trim(); });

    for (const f of D.REQUIRED) {
      if (p[f] === '') errors.push(`row ${rowNo} (${p.common || '?'}): "${f}" is required — fill it (the importer never invents data, but identity + hardiness must be real)`);
    }
    const hue = Number(p.hue);
    if (p.hue === '' || !Number.isInteger(hue) || hue < 0 || hue > 360) {
      errors.push(`row ${rowNo} (${p.common || '?'}): hue "${p.hue}" must be a whole number 0-360`);
    } else p.hue = hue;

    for (const f of D.SCORE_FIELDS) {
      if (p[f] === undefined || p[f] === '') continue;
      const n = Number(p[f]), max = D.SCORE_MAX[f];
      if (!Number.isInteger(n) || n < 0 || n > max) {
        errors.push(`row ${rowNo} (${p.common || '?'}): "${f}" is "${p[f]}" — must be a whole number 0-${max}, or blank if not yet rated`);
      } else p[f] = n;
    }
    if (p.sunMin !== '' && p.sunNeed !== '' && Number(p.sunMin) > Number(p.sunNeed)) {
      errors.push(`row ${rowNo} (${p.common}): sunMin ${p.sunMin} is above sunNeed ${p.sunNeed} — the sun band would run backwards`);
    }

    const heldFlag = p.held === '' ? '0' : p.held;
    if (heldFlag !== '0' && heldFlag !== '1') {
      errors.push(`row ${rowNo} (${p.common || '?'}): held is "${p.held}" — must be 0 (dealt) or 1 (parked, no photo yet)`);
    }

    for (const k of ['common', 'latin']) {
      const key = p[k].toLowerCase().replace(/[‘’']/g, "'");
      if (key && seen[k].has(key)) errors.push(`row ${rowNo}: duplicate ${k} "${p[k]}" (also row ${seen[k].get(key)})`);
      else seen[k].set(key, rowNo);
    }

    const card = D.FIELDS.reduce((o, f) => { if (p[f] !== undefined) o[f] = p[f]; return o; }, {});
    (heldFlag === '1' ? held : dealt).push(card);
  });
  if (errors.length) fail(errors);
  return { dealt, held };
}

/* ---------- write ---------- */
function backup(html) {
  fs.mkdirSync(BACKUPS, { recursive: true });
  // timestamped, so a second import can never eat the only good backup
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const f = path.join(BACKUPS, `timber.${stamp}.html`);
  fs.writeFileSync(f, html);
  // prune to the last 20
  const olds = fs.readdirSync(BACKUPS).filter(f => /^timber\..*\.html$/.test(f)).sort();
  for (const o of olds.slice(0, -20)) fs.unlinkSync(path.join(BACKUPS, o));
  return f;
}

function summarise(before, after, label) {
  const b = new Map(before.map(p => [p.common, p]));
  const a = new Map(after.map(p => [p.common, p]));
  const added = [...a.keys()].filter(k => !b.has(k));
  const removed = [...b.keys()].filter(k => !a.has(k));
  const changed = [...a.keys()].filter(k => b.has(k) &&
    D.FIELDS.some(f => String(b.get(k)[f] ?? '') !== String(a.get(k)[f] ?? '')));
  console.log(`${label}: ${before.length} -> ${after.length}` +
    (added.length ? `\n  + added:   ${added.join(', ')}` : '') +
    (removed.length ? `\n  - REMOVED: ${removed.join(', ')}` : '') +
    (changed.length ? `\n  ~ changed: ${changed.join(', ')}` : ''));
  return { added, removed, changed };
}

function doImport({ dryRun }) {
  const { html, deck, hold } = readBoth();
  assertNoUnknownKeys(deck.concat(hold));
  const { dealt, held } = parseCsv();

  console.log(dryRun ? 'Dry run — nothing will be written.\n' : '');
  const dDeck = summarise(deck, dealt, 'deck');
  const dHold = summarise(hold, held, 'on hold');

  // A removal is the one thing that can lose work, so it needs an explicit nod.
  const removals = [...dDeck.removed, ...dHold.removed]
    .filter(n => !dHold.added.includes(n) && !dDeck.added.includes(n)); // moved between blocks is fine
  if (removals.length && !process.argv.includes('--allow-removals')) {
    fail([
      `this import would DELETE ${removals.length} plant(s) that exist in timber.html but not in plants.csv:`,
      ...removals.map(n => '    ' + n),
      'If that is genuinely what you want, re-run with --allow-removals.',
      'If not, your plants.csv is stale — run "node plants-tool.js export" first, then re-edit.',
    ]);
  }

  if (dryRun) { console.log('\nLooks importable. Run: node plants-tool.js import'); return; }

  /* Replace only each block's array literal — declarations, comments and the
     marker pairs are left byte-for-byte alone. */
  let out = D.writeBlock(html, 'deck', dealt);
  const withHold = D.writeBlock(out, 'hold', held);
  if (withHold) out = withHold;
  else if (held.length) fail('plants.csv has held rows but timber.html has no PLANTS_ON_HOLD block to write them into');

  // re-parse before committing the write: never leave a broken file behind
  try {
    const rd = D.readDeck(out), rh = D.readHold(out);
    if (rd.length !== dealt.length || rh.length !== held.length) {
      fail(`write-back verification failed (re-read ${rd.length} dealt / ${rh.length} held, expected ${dealt.length}/${held.length})`);
    }
  } catch (e) {
    fail('write-back produced a file that no longer parses: ' + e.message);
  }

  const bak = backup(html);
  fs.writeFileSync(HTML, out);
  console.log(`\nImported ${dealt.length} dealt + ${held.length} on-hold plants into timber.html.`);
  console.log(`Backup: ${path.relative(__dirname, bak)}`);
  console.log('Note: the app detects the changed plant list and starts everyone a fresh deck automatically.');
  console.log('Now run: node tools/data-audit.js && node tests/run-all.js');
}

const cmd = process.argv[2];
if (cmd === 'export') doExport();
else if (cmd === 'check') doImport({ dryRun: true });
else if (cmd === 'import') doImport({ dryRun: false });
else {
  console.log('Usage: node plants-tool.js export | check | import [--allow-removals]');
  process.exit(cmd ? 1 : 0);
}
