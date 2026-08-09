#!/usr/bin/env node
/*
  data-audit.js — the "have we silently lost anything?" check.

    node tools/data-audit.js            audit the working tree
    node tools/data-audit.js --history  also replay every commit and report any
                                        card that once existed and is now gone

  Four independent copies of the plant data can drift apart: the PLANTS deck,
  the PLANTS_ON_HOLD block, plants.csv, and the photos directory. Nothing in
  the app reads all four, so a divergence is invisible until someone goes
  looking. This is the someone.

  Exit code 1 on any finding, so CI/hooks can gate on it.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const { readDeck, readHold, FIELDS, csvParse } = require('./plant-data.js');

const findings = [];
const note = (level, msg) => findings.push({ level, msg });

/* Deliberate renames/merges, so a rename doesn't masquerade as a vanished card. */
const RENAMES = (() => {
  const f = path.join(ROOT, 'data', 'renames.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).renames || [] : [];
})();
const renamedAway = new Map(RENAMES.map(r => [r.from, r]));

/* ---------- working tree ---------- */
function auditTree() {
  const html = fs.readFileSync(path.join(ROOT, 'timber.html'), 'utf8');
  const deck = readDeck(html);
  const hold = readHold(html);
  const all = deck.concat(hold);
  console.log(`deck ${deck.length} · on-hold ${hold.length} · total ${all.length}`);

  /* 1. keys present on cards that the CSV round-trip would destroy */
  const keys = new Set();
  for (const p of all) for (const k of Object.keys(p)) keys.add(k);
  const unmapped = [...keys].filter(k => !FIELDS.includes(k));
  if (unmapped.length) {
    const counts = unmapped.map(k => `${k} (on ${all.filter(p => p[k] !== undefined).length} cards)`);
    note('FAIL', `card fields not covered by the CSV column list — an export/import round-trip would erase them: ${counts.join(', ')}`);
  }

  /* 2. csv vs cards */
  const csvPath = path.join(ROOT, 'plants.csv');
  if (!fs.existsSync(csvPath)) {
    note('FAIL', 'plants.csv missing');
  } else {
    const rows = csvParse(fs.readFileSync(csvPath, 'utf8'));
    const hdr = rows[0].map(h => h.trim());
    const ci = hdr.indexOf('common');
    const csvNames = rows.slice(1).map(r => (r[ci] || '').trim()).filter(Boolean);
    const cardNames = all.map(p => p.common);
    const missingFromCsv = cardNames.filter(n => !csvNames.includes(n));
    const missingFromCards = csvNames.filter(n => !cardNames.includes(n) && !renamedAway.has(n));
    if (missingFromCsv.length)
      note('FAIL', `${missingFromCsv.length} card(s) absent from plants.csv (csv is stale): ${missingFromCsv.join(', ')}`);
    if (missingFromCards.length)
      note('FAIL', `${missingFromCards.length} plants.csv row(s) have no card — data that exists only in the csv: ${missingFromCards.join(', ')}`);
    const dupCsv = csvNames.filter((n, i) => csvNames.indexOf(n) !== i);
    if (dupCsv.length) note('FAIL', `duplicate common name(s) in plants.csv: ${[...new Set(dupCsv)].join(', ')}`);
  }

  /* 3. duplicate identities across deck+hold */
  for (const k of ['common', 'latin']) {
    const seen = new Map();
    for (const p of all) {
      const key = String(p[k] || '').toLowerCase().replace(/[‘’']/g, "'");
      if (!key) { note('FAIL', `a card has no ${k}`); continue; }
      if (seen.has(key)) note('FAIL', `duplicate ${k} "${p[k]}" appears twice (deck+hold combined)`);
      seen.set(key, true);
    }
  }

  /* 4. a card in both blocks at once */
  const holdNames = new Set(hold.map(p => p.common));
  for (const p of deck) if (holdNames.has(p.common)) note('FAIL', `"${p.common}" is dealt AND on hold`);

  /* 5. orphan / missing photos.
     The app resolves a card's photo as photos/<slugLatin(latin)>.jpg — mirrored
     from timber.html's slugLatin so this check tracks what actually renders. */
  const slugLatin = l => String(l).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const photoDir = path.join(ROOT, 'photos');
  if (fs.existsSync(photoDir)) {
    const files = new Set(fs.readdirSync(photoDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)));
    const dealtNoPhoto = deck.filter(p => !files.has(slugLatin(p.latin) + '.jpg'));
    if (dealtNoPhoto.length)
      note('FAIL', `${dealtNoPhoto.length} DEALT card(s) have no photos/<latin-slug>.jpg and will render a bare leaf gradient: ${dealtNoPhoto.map(p => `${p.common} (wants ${slugLatin(p.latin)}.jpg)`).join(', ')}`);
    const holdNoPhoto = hold.filter(p => !files.has(slugLatin(p.latin) + '.jpg'));
    if (holdNoPhoto.length)
      note('INFO', `${holdNoPhoto.length} on-hold card(s) still awaiting a photo (expected — that is why they are held): ${holdNoPhoto.map(p => p.common).join(', ')}`);
    const claimed = new Set();
    for (const p of all) { claimed.add(slugLatin(p.latin) + '.jpg'); claimed.add(slugLatin(p.latin) + '-cutout.png'); }
    const orphans = [...files].filter(f => !claimed.has(f));
    if (orphans.length)
      note('INFO', `${orphans.length} photo file(s) not claimed by any card (variants/spares, or a card was renamed away from them): ${orphans.join(', ')}`);
  }
}

/* ---------- history replay ---------- */
function auditHistory() {
  const git = a => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
  const commits = git(['log', '--format=%H %s', '--reverse', '--', 'timber.html']).trim().split('\n');
  console.log(`\nreplaying ${commits.length} commits that touched timber.html…`);
  const everSeen = new Map();          // common -> {first, last}
  let prev = null;
  for (const line of commits) {
    const sha = line.slice(0, 40), subj = line.slice(41);
    let html;
    try { html = git(['show', `${sha}:timber.html`]); } catch { continue; }
    let names;
    try {
      names = readDeck(html).concat(readHold(html)).map(p => p.common);
    } catch { continue; }                 // unparseable old shape — skip, not a finding
    const set = new Set(names);
    for (const n of set) {
      if (!everSeen.has(n)) everSeen.set(n, { first: sha, firstSubj: subj });
      everSeen.get(n).last = sha;
      everSeen.get(n).lastSubj = subj;
      everSeen.get(n).present = true;
    }
    if (prev) for (const n of prev) if (!set.has(n)) everSeen.get(n).present = false;
    prev = set;
  }
  const gone = [...everSeen.entries()].filter(([, v]) => !v.present);
  const unexplained = gone.filter(([n]) => !renamedAway.has(n));
  const explained = gone.filter(([n]) => renamedAway.has(n));
  for (const [n] of explained) {
    const r = renamedAway.get(n);
    // a recorded rename is only benign if the destination card actually exists
    const stillHere = readDeck(fs.readFileSync(path.join(ROOT, 'timber.html'), 'utf8'))
      .concat(readHold(fs.readFileSync(path.join(ROOT, 'timber.html'), 'utf8')))
      .some(p => p.common === r.to);
    if (stillHere) console.log(`  renamed (recorded): "${n}" -> "${r.to}" at ${r.commit}`);
    else note('FAIL', `"${n}" is recorded as renamed to "${r.to}" but "${r.to}" does not exist either — both are gone`);
  }
  if (!unexplained.length) {
    console.log(`no card has ever been silently dropped — every plant added is still present (${explained.length} recorded rename(s) accounted for).`);
  } else {
    for (const [n, v] of unexplained)
      note('FAIL', `"${n}" existed at ${v.last.slice(0, 7)} ("${v.lastSubj}") and is gone from the working tree, with no entry in data/renames.json`);
  }
}

auditTree();
if (process.argv.includes('--history')) auditHistory();

console.log('');
const fails = findings.filter(f => f.level === 'FAIL');
for (const f of findings) console.log(`${f.level}: ${f.msg}`);
if (!findings.length) console.log('clean — all copies of the plant data agree.');
console.log(`\n${fails.length} problem(s), ${findings.length - fails.length} note(s).`);
process.exit(fails.length ? 1 : 0);
