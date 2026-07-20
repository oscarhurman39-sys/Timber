#!/usr/bin/env node
/*
  plants-tool.js — get plant data in and out of timber.html without hand-editing it.

    node plants-tool.js export   writes the current PLANTS array to plants.csv
                                 (open in Excel / Google Sheets, add rows, save as CSV)
    node plants-tool.js import   validates plants.csv and rewrites the PLANTS array
                                 inside timber.html (a timber.html.bak backup is kept)

  Rules the importer enforces — it NEVER invents values:
    - exactly the 25 required columns, no extras, any order
    - every cell filled (an empty cell is an error naming the row and field)
    - hue must be an integer 0-360
    - no duplicate common or latin names
  On any error, nothing is written.
*/
'use strict';
const fs = require('fs');
const path = require('path');

const FIELDS = ['common','latin','hue','visual','water','aspect','soil','prune',
  'source','peak','order','bench','root','trade','retail','margin','type','shrink',
  'returnRisk','pots','cvs','hardiness','resilience','uses','size'];
const HTML = path.join(__dirname, 'timber.html');
const CSV = path.join(__dirname, 'plants.csv');
const BEGIN = '/* PLANTS:BEGIN';
const END = '/* PLANTS:END */';

function fail(msgs) {
  for (const m of [].concat(msgs)) console.error('ERROR: ' + m);
  process.exit(1);
}

function readPlantsFromHtml() {
  const html = fs.readFileSync(HTML, 'utf8');
  const a = html.indexOf(BEGIN), b = html.indexOf(END);
  if (a === -1 || b === -1 || b < a) fail('PLANTS markers not found in timber.html');
  const section = html.slice(a, b);
  const arrStart = section.indexOf('[');
  const arrEnd = section.lastIndexOf(']');
  if (arrStart === -1 || arrEnd === -1) fail('PLANTS array not found between markers');
  let plants;
  try {
    plants = Function('"use strict";return (' + section.slice(arrStart, arrEnd + 1) + ')')();
  } catch (e) {
    fail('could not parse PLANTS array: ' + e.message);
  }
  return { html, a, b, plants };
}

/* ---------- CSV ---------- */
function csvEscape(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }

function csvParse(text) {
  const rows = [];
  let row = [], cell = '', inQ = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQ = false;
      } else cell += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/* ---------- commands ---------- */
function doExport() {
  const { plants } = readPlantsFromHtml();
  const lines = [FIELDS.map(csvEscape).join(',')];
  for (const p of plants) lines.push(FIELDS.map(f => csvEscape(p[f])).join(','));
  fs.writeFileSync(CSV, lines.join('\n') + '\n');
  console.log(`Exported ${plants.length} plants to plants.csv (${FIELDS.length} columns).`);
  console.log('Open it in a spreadsheet, add rows with YOUR verified values, then run: node plants-tool.js import');
}

function doImport() {
  if (!fs.existsSync(CSV)) fail('plants.csv not found — run "node plants-tool.js export" first to get the template');
  const rows = csvParse(fs.readFileSync(CSV, 'utf8'));
  if (rows.length < 2) fail('plants.csv has no data rows');
  const header = rows[0].map(h => h.trim());
  const errors = [];

  const missing = FIELDS.filter(f => !header.includes(f));
  const extra = header.filter(h => !FIELDS.includes(h));
  if (missing.length) errors.push('missing column(s): ' + missing.join(', '));
  if (extra.length) errors.push('unknown column(s): ' + extra.join(', ') + ' — only the 25 locked fields are allowed');
  const dupHdr = header.filter((h, i) => header.indexOf(h) !== i);
  if (dupHdr.length) errors.push('duplicate column(s): ' + dupHdr.join(', '));
  if (errors.length) fail(errors);

  const plants = [];
  const seen = { common: new Map(), latin: new Map() };
  rows.slice(1).forEach((cells, r) => {
    const rowNo = r + 2; // 1-based, after header
    if (cells.length !== header.length) {
      errors.push(`row ${rowNo}: has ${cells.length} cells, expected ${header.length}`);
      return;
    }
    const p = {};
    header.forEach((h, i) => { p[h] = cells[i].trim(); });
    for (const f of FIELDS) {
      if (p[f] === '') errors.push(`row ${rowNo} (${p.common || '?'}): "${f}" is empty — fill it with your real value, the importer never invents data`);
    }
    const hue = Number(p.hue);
    if (!Number.isInteger(hue) || hue < 0 || hue > 360) {
      errors.push(`row ${rowNo} (${p.common || '?'}): hue "${p.hue}" must be a whole number 0-360`);
    } else p.hue = hue;
    for (const k of ['common', 'latin']) {
      const key = p[k].toLowerCase();
      if (key && seen[k].has(key)) errors.push(`row ${rowNo}: duplicate ${k} "${p[k]}" (also row ${seen[k].get(key)})`);
      else seen[k].set(key, rowNo);
    }
    plants.push(FIELDS.reduce((o, f) => (o[f] = p[f], o), {}));
  });
  if (errors.length) fail(errors);

  const { html, a, b } = readPlantsFromHtml();
  const beginLine = html.slice(a, html.indexOf('\n', a) + 1);
  const body = 'const PLANTS = [\n' + plants.map(p => '  ' + JSON.stringify(p)).join(',\n') + '\n];\n';
  fs.writeFileSync(HTML + '.bak', html);
  fs.writeFileSync(HTML, html.slice(0, a) + beginLine + body + html.slice(b));
  console.log(`Imported ${plants.length} plants into timber.html (backup: timber.html.bak).`);
  console.log('Note: the app detects the changed plant list and starts everyone a fresh deck automatically.');
}

const cmd = process.argv[2];
if (cmd === 'export') doExport();
else if (cmd === 'import') doImport();
else {
  console.log('Usage: node plants-tool.js export | import');
  process.exit(cmd ? 1 : 0);
}
