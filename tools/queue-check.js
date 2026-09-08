#!/usr/bin/env node
/* queue-check.js — VERIFY-QUEUE.md item numbers are unique, and every reference
   to one resolves.

   WHY THIS EXISTS

   The queue is where every unresolved horticultural question lives, and prose
   all over the repo points at those questions by number: "VQ 49", "VQ 60",
   "VERIFY-QUEUE 34". The number IS the address. Nothing assigned it, though —
   a session read the highest heading it could see and added one.

   That is safe on one branch and broken on two. On 2026-09-06 the card-build
   branch and the live line had both been appending items for days; each
   numbered from its own high-water mark, the merge took both, and the file came
   out with THREE numbers meaning two plants each (58, 60, 66). One of those
   collisions was created by a renumber that moved an item onto a number the
   other branch had already used — the fix reproduced the bug, because there was
   no way to see the clash. "VQ 58" then meant a Rosa to one document and a
   Vitex to another, which is worse than an unnumbered note: a wrong address
   sends the reader confidently to the wrong plant.

   Two failures, both cheap to detect and neither visible by reading:
     - a number used by more than one item
     - a reference to a number no item carries

   Run: node tools/queue-check.js        (part of tests/run-all.js)
        node tools/queue-check.js --next prints the next free number to use
*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const QUEUE = path.join(ROOT, 'VERIFY-QUEUE.md');
/* the documents that address queue items by number */
const CITERS = ['VERIFY-QUEUE.md', 'CARD-PROTOCOL.md', 'LEDGER.md', 'README.md', 'NEW-SESSION.md'];

const queue = fs.readFileSync(QUEUE, 'utf8').split('\n');

/* ---- 1. collect the items ---- */
const items = new Map();            /* number -> [{line, title}, ...] */
queue.forEach((text, i) => {
  const m = text.match(/^### (\d+)\.\s*(.*)$/);
  if (!m) return;
  const n = Number(m[1]);
  if (!items.has(n)) items.set(n, []);
  items.set(n, [...items.get(n), { line: i + 1, title: m[2].slice(0, 72) }]);
});
if (!items.size) { console.error('FAIL queue-check: no "### <n>." items found in VERIFY-QUEUE.md'); process.exit(2); }

const numbers = [...items.keys()].sort((a, b) => a - b);
const next = numbers[numbers.length - 1] + 1;
if (process.argv.includes('--next')) { console.log(next); process.exit(0); }

const problems = [];

/* ---- 2. one number, one item ---- */
for (const n of numbers) {
  const hits = items.get(n);
  if (hits.length > 1) {
    problems.push(`item number ${n} is used by ${hits.length} items — a reference to "VQ ${n}" cannot resolve:`);
    hits.forEach(h => problems.push(`    line ${h.line}: ${h.title}`));
    problems.push(`    fix: renumber the newer one (next free number is ${next}) and update the prose that cites it`);
  }
}

/* ---- 3. every reference resolves ----
   Only the unambiguous forms are enforced. "item 58" also appears in the docs
   as a cross-reference, but "item" is a common enough word in prose that
   matching it produces false alarms, and a check that cries wolf gets muted. */
const REF = /\b(?:VQ|VERIFY-QUEUE)\s+(\d+)\b/g;
for (const file of CITERS) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  fs.readFileSync(p, 'utf8').split('\n').forEach((text, i) => {
    for (const m of text.matchAll(REF)) {
      const n = Number(m[1]);
      if (!items.has(n)) problems.push(`${file}:${i + 1} cites "VQ ${n}", which no queue item carries`);
    }
  });
}

if (problems.length) {
  problems.forEach(p => console.error('FAIL queue-check: ' + p));
  process.exit(1);
}
console.log(`queue-check: ${numbers.length} items, numbers unique, every VQ reference resolves (next free: ${next})`);
