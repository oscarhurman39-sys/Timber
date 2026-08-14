'use strict';
/*
  plant-data.js — the ONE place that knows how to read and write the plant data
  inside timber.html. Every tool imports this; nothing re-implements the parsing.

  Two blocks hold plants and they are both real data:
    PLANTS          the dealt deck
    PLANTS_ON_HOLD  cards parked out of the deck (no photo yet). Same shape.
                    Moving an entry between the two blocks is how a card is
                    held or re-dealt — so a tool that only knows about PLANTS
                    will happily delete the hold block's contents.
*/
const DECK = { begin: '/* PLANTS:BEGIN', end: '/* PLANTS:END */', decl: 'const PLANTS = [' };
const HOLD = { begin: '/* HOLD:BEGIN', end: '/* HOLD:END */', decl: 'const PLANTS_ON_HOLD=[' };

/* The locked CSV columns. Order is the CSV column order.
   ANY key that can appear on a card must be listed here or a csv round-trip
   silently drops it — tools/data-audit.js fails the build if one isn't. */
const FIELDS = ['common', 'latin', 'hue', 'visual', 'water', 'aspect', 'soil', 'prune',
  'source', 'peak', 'order', 'bench', 'root', 'trade', 'retail', 'margin', 'type', 'shrink',
  'returnRisk', 'pots', 'cvs', 'hardiness', 'resilience', 'uses', 'size',
  // `pest` picks the icon on the Pests & diseases row (see the PEST registry in
  // timber.html); blank means the baked red spider mite. It is a KEY, not prose —
  // the pest a card actually names lives in `resilience` and always did.
  'pest',
  // Card stats (CARD-STATS.md). Editorial ratings, not measurements — blank = not
  // yet rated. 0-20 rows map 1:1 to the 5-icon quarter-fill widgets; sunNeed 0-100.
  'seasonalImpact', 'growthSpeed', 'pestRisk', 'thirst', 'careLevel', 'sunNeed',
  // sunMin is the lower end of the sun band drawn on the aspect dial. It lives on
  // cards but was missing from this list until the 2026-08-09 audit; an import
  // before that date would have erased it from every card that had one.
  'sunMin'];
/* Nothing speculative belongs in this list. It is exactly the set of fields that
   exist on cards today, which is what makes the "unknown field" guard meaningful:
   a key not listed here is a mistake worth stopping for, not a column nobody
   filled in. Photo licensing lives in photos/CREDITS.json, not on the card. */

const SCORE_MAX = { seasonalImpact: 20, growthSpeed: 20, pestRisk: 20, thirst: 20, careLevel: 20, sunNeed: 100, sunMin: 100 };
const SCORE_FIELDS = new Set(Object.keys(SCORE_MAX));
const REQUIRED = ['common', 'latin', 'hardiness'];

function sliceArray(html, block, { optional = false } = {}) {
  const a = html.indexOf(block.begin);
  if (a === -1) {
    if (optional) return null;
    throw new Error(`${block.begin} marker not found in timber.html`);
  }
  const b = html.indexOf(block.end, a);
  if (b === -1) throw new Error(`${block.end} marker not found in timber.html`);
  const section = html.slice(a, b);
  const s = section.indexOf('['), e = section.lastIndexOf(']');
  if (s === -1 || e === -1) throw new Error(`array not found between ${block.begin} markers`);
  return { a, b, text: section.slice(s, e + 1) };
}

function evalArray(text, what) {
  try {
    return Function('"use strict";return (' + text + ')')();
  } catch (e) {
    throw new Error(`could not parse ${what}: ${e.message}`);
  }
}

function readDeck(html) {
  const sl = sliceArray(html, DECK);
  return evalArray(sl.text, 'PLANTS array');
}

/* The hold block predates the marker pair, so fall back to locating the
   declaration itself. Returns [] when the block genuinely isn't there. */
function readHold(html) {
  const marked = sliceArray(html, HOLD, { optional: true });
  if (marked) return evalArray(marked.text, 'PLANTS_ON_HOLD array');
  const i = html.indexOf('const PLANTS_ON_HOLD');
  if (i === -1) return [];
  const s = html.indexOf('[', i);
  // walk to the matching bracket, skipping string literals
  let depth = 0, q = null;
  for (let j = s; j < html.length; j++) {
    const c = html[j];
    if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '[') depth++;
    else if (c === ']' && --depth === 0) return evalArray(html.slice(s, j + 1), 'PLANTS_ON_HOLD array');
  }
  throw new Error('PLANTS_ON_HOLD array is unterminated');
}

/* Absolute [start,end) indices of the array LITERAL itself — the `[` through the
   matching `]`. Callers replace exactly that span, so declarations, comments and
   the marker pair are never touched by a rewrite. Returns null if the block
   isn't present. */
function matchBracket(html, from) {
  const s = html.indexOf('[', from);
  if (s === -1) return null;
  let depth = 0, q = null;
  for (let j = s; j < html.length; j++) {
    const c = html[j];
    if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '[') depth++;
    else if (c === ']' && --depth === 0) return { start: s, end: j + 1 };
  }
  return null;
}

function bounds(html, which) {
  const block = which === 'hold' ? HOLD : DECK;
  /* "const PLANTS" is a PREFIX of "const PLANTS_ON_HOLD", so a plain indexOf for
     the deck can land on the hold block if the marker is ever missing. Match the
     declaration with a boundary so the two can never be confused. */
  const declRe = which === 'hold'
    ? /const\s+PLANTS_ON_HOLD\s*=/g
    : /const\s+PLANTS\s*=(?!=)/g;
  const m = html.indexOf(block.begin);
  declRe.lastIndex = m !== -1 ? m : 0;
  const hit = declRe.exec(html);
  const from = hit ? hit.index : -1;
  if (from === -1) {
    if (which === 'hold') return null;
    throw new Error('PLANTS declaration not found in timber.html');
  }
  const b = matchBracket(html, from);
  if (!b) throw new Error(`${decl} array is unterminated`);
  return b;
}

/* ---------- formatting ----------
   Cards are written back in the hand-authored house style, not one-line JSON.
   That matters for more than looks: a whole-block reformat turns a two-field
   edit into a 1500-line diff, which is unreviewable, and it makes the
   fine-grained git history for a single card useless. Style:

     {common:"X", latin:"Y", hue:5,
      visual:"…",
      water:"…",
      seasonalImpact:"", growthSpeed:9, …, sunMin:40},

   Line 1 carries identity; each prose field gets its own line; the numeric
   ratings share the final line. */
const HEAD = ['common', 'latin', 'hue'];
const TAIL = ['seasonalImpact', 'growthSpeed', 'pestRisk', 'thirst', 'careLevel', 'sunNeed', 'sunMin'];

/* JS source for one value. Keys are emitted bare (valid identifiers), strings
   double-quoted with only the necessary escapes so accented and · characters
   stay literal and readable. */
function lit(v) {
  if (typeof v === 'number') return String(v);
  return '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    .replace(/\r/g, '\\r').replace(/\n/g, '\\n')
    // U+2028/U+2029 are literal line terminators in JS source - must stay escaped
    .replace(/[\u2028\u2029]/g, m => '\\u' + m.charCodeAt(0).toString(16)) + '"';
}
const pair = (k, v) => `${k}:${lit(v)}`;

function formatCard(p, indent = '  ') {
  const inner = indent + ' ';
  const has = k => p[k] !== undefined;
  const lines = [];
  lines.push(indent + '{' + HEAD.filter(has).map(k => pair(k, p[k])).join(', ') + ',');
  const mid = FIELDS.filter(k => !HEAD.includes(k) && !TAIL.includes(k) && has(k));
  for (const k of mid) lines.push(inner + pair(k, p[k]) + ',');
  const tail = TAIL.filter(has);
  if (tail.length) lines.push(inner + tail.map(k => pair(k, p[k])).join(', ') + '}');
  else {
    // no ratings yet — close on the last prose line instead of leaving a dangling comma
    lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '}');
  }
  return lines.join('\n');
}

/* Replace a block's array literal in place, preserving declarations, comments
   and markers byte-for-byte. */
function writeBlock(html, which, cards, indent = '  ') {
  const b = bounds(html, which);
  if (!b) return null;
  /* Note the TRAILING comma after the final card. It is legal in a JS array
     literal, and it is load-bearing: tools/add-plant.js appends a new row just
     before the closing bracket, so a comma-less last card leaves two object
     literals butted together and the file stops parsing. Leaving the comma keeps
     append-style insertion working. */
  const literal = '[\n' + cards.map(p => formatCard(p, indent)).join(',\n\n') + ',\n' + indent.slice(1) + ']';
  return html.slice(0, b.start) + literal + html.slice(b.end);
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

module.exports = { DECK, HOLD, FIELDS, SCORE_MAX, SCORE_FIELDS, REQUIRED,
  readDeck, readHold, bounds, writeBlock, formatCard, csvEscape, csvParse };
