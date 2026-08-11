#!/usr/bin/env node
/*
  photo-credits.js — keep a committed provenance record for every photo.

    node tools/photo-credits.js                 report coverage
    node tools/photo-credits.js --init          scaffold photos/CREDITS.json from git history
    node tools/photo-credits.js --check         fail if a photo has no entry at all
    node tools/photo-credits.js --set <file> --source <s> --licence <l> --author <a> [--url <u>]

  WHY
  "Unverified provenance" means: the repo carries 151 photos and, until now, no
  committed record of where any of them came from or what licence they carry.

  It is not that they were taken carelessly. `plant-images-tool.js` searches only
  Wikimedia Commons, actively excludes NC/ND licences, and writes a credit.json
  with the licence, author and source URL for every photo it fetches. The problem
  is where it wrote it: `plant-images/`, which is in .gitignore. So the records
  were created and never committed, and the directory did not survive the
  container. The photos are in git; the paperwork is gone.

  For a personal learning tool that is a non-issue. It becomes a real issue the
  moment a card is shown to a garden centre, because then the photos are being
  used commercially and "I think it was Commons" is not a licence.

  This tool makes the record a committed artefact instead of a scratch file.
  --init backfills what git history can actually establish and marks everything
  else "unrecorded" — honestly, rather than guessing a licence.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const PHOTOS = path.join(ROOT, 'photos');
const FILE = path.join(PHOTOS, 'CREDITS.json');

const argv = process.argv.slice(2);
const arg = f => { const i = argv.indexOf(f); return i === -1 ? null : argv[i + 1]; };
const files = () => fs.readdirSync(PHOTOS).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort();
const load = () => fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : null;

const README = [
  'Provenance for every file in photos/. One entry per image.',
  '',
  'source    : "oscar" (his own photograph), "wikimedia" (via plant-images-tool.js),',
  '            or "unrecorded" (came in before the record was committed).',
  'licence   : SPDX-ish short name, or "unknown". NEVER guess one — an unknown',
  '            licence is a fact worth recording; an invented one is a liability.',
  'commit    : the commit that added the file, and its subject line. This is',
  '            recovered from git history and is the strongest evidence available',
  '            for the older photos.',
  '',
  'plant-images-tool.js only ever fetched from Wikimedia Commons and excluded',
  'NC/ND licences, so the "unrecorded" files are very likely commercially usable —',
  'but "very likely" is not a licence. Before any commercial use, the unrecorded',
  'entries need their source URL re-established, or the photo replaced.',
];

/* ---------- init ---------- */
if (argv.includes('--init')) {
  const git = a => { try { return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }); } catch { return ''; } };
  /* Map file -> the commit that FIRST added it. --reverse matters: several photos
     were deleted and re-added in later bulk commits ("Recover 38 plant photos…"),
     so the most recent add is a restore, not the origin. Oldest add is the truth. */
  const log = git(['log', '--all', '--reverse', '--diff-filter=A', '--format=%H\x01%s', '--name-only', '--', 'photos/']);
  const origin = new Map();
  let sha = '', subj = '';
  for (const line of log.split('\n')) {
    if (line.includes('\x01')) { [sha, subj] = line.split('\x01'); continue; }
    const m = /^photos\/(.+)$/.exec(line.trim());
    if (m && !origin.has(m[1])) origin.set(m[1], { commit: sha.slice(0, 7), subject: subj });
  }

  const existing = load();
  const prev = new Map((existing?.photos || []).map(p => [p.file, p]));
  const out = { _readme: README, generated: new Date().toISOString().slice(0, 10), photos: [] };

  for (const f of files()) {
    if (prev.has(f) && prev.get(f).source !== 'unrecorded') { out.photos.push(prev.get(f)); continue; }
    const o = origin.get(f) || {};
    const s = (o.subject || '').toLowerCase();
    /* Only two things git history actually establishes: that Oscar supplied the
       photo (the commit says so), or nothing. Everything else stays unrecorded. */
    const oscar = /from oscar|oscar'?s (own |)?photo|oscar'?s own/.test(s);
    out.photos.push({
      file: f,
      source: oscar ? 'oscar' : 'unrecorded',
      licence: oscar ? "Oscar's own photograph — owned outright" : 'unknown',
      author: oscar ? 'Oscar Hurman' : 'unknown',
      sourceUrl: null,
      commit: o.commit || null,
      commitSubject: o.subject || null,
      commercialUseCleared: !!oscar,
    });
  }
  fs.writeFileSync(FILE, JSON.stringify(out, null, 1) + '\n');
  const own = out.photos.filter(p => p.source === 'oscar').length;
  console.log(`wrote photos/CREDITS.json — ${out.photos.length} photos, ${own} established as Oscar's own, ${out.photos.length - own} unrecorded`);
  process.exit(0);
}

/* ---------- set one entry ---------- */
if (argv.includes('--set')) {
  const data = load();
  if (!data) { console.error('no photos/CREDITS.json — run --init first'); process.exit(1); }
  const f = arg('--set');
  let e = data.photos.find(p => p.file === f);
  /* A photo that has just been staged has no entry yet, and --set was the only
     way in — so a new photo could not be recorded at all without hand-editing
     this file. Create the entry when the file is genuinely on disk; still refuse
     when it is not, because that means a typo in the filename. */
  if (!e) {
    if (!files().includes(f)) {
      console.error(`no entry for "${f}" and no such file in photos/ — check the filename`);
      process.exit(1);
    }
    e = { file: f, source: 'unrecorded', licence: 'unknown', author: null, sourceUrl: null,
          commit: null, commitSubject: 'staged after CREDITS.json was created — not yet committed',
          commercialUseCleared: false };
    data.photos.push(e);
    data.photos.sort((a, b) => a.file.localeCompare(b.file));
    console.log(`new entry created for ${f}`);
  }
  if (arg('--source')) e.source = arg('--source');
  if (arg('--licence')) e.licence = arg('--licence');
  if (arg('--author')) e.author = arg('--author');
  if (arg('--url')) e.sourceUrl = arg('--url');
  e.commercialUseCleared = !/unknown|unrecorded/i.test(e.licence + e.source);
  fs.writeFileSync(FILE, JSON.stringify(data, null, 1) + '\n');
  console.log(`updated ${f}: ${e.source} / ${e.licence} / ${e.author}`);
  process.exit(0);
}

/* ---------- report / check ---------- */
const data = load();
if (!data) {
  console.error('photos/CREDITS.json does not exist — run: node tools/photo-credits.js --init');
  process.exit(1);
}
const onDisk = files();
const known = new Map(data.photos.map(p => [p.file, p]));
const missing = onDisk.filter(f => !known.has(f));
const stale = data.photos.filter(p => !onDisk.includes(p.file));
const cleared = data.photos.filter(p => p.commercialUseCleared);
const unrecorded = data.photos.filter(p => p.source === 'unrecorded');

console.log(`photos on disk      : ${onDisk.length}`);
console.log(`entries in CREDITS  : ${data.photos.length}`);
console.log(`cleared for commercial use : ${cleared.length}`);
console.log(`unrecorded provenance      : ${unrecorded.length}`);
if (missing.length) console.log(`\nNO ENTRY (${missing.length}): ${missing.join(', ')}`);
if (stale.length) console.log(`\nENTRY BUT NO FILE (${stale.length}): ${stale.map(p => p.file).join(', ')}`);

if (argv.includes('--check')) {
  /* Deliberately does NOT fail on "unrecorded" — 151 unrecorded photos would make
     this a permanently red check that everyone learns to ignore. It fails only on
     a photo with no entry at all, so NEW photos must arrive with their paperwork. */
  const problems = [];
  if (missing.length) problems.push(`${missing.length} photo(s) have no CREDITS.json entry: ${missing.join(', ')}`);
  if (stale.length) problems.push(`${stale.length} CREDITS.json entr(y/ies) reference a file that is gone: ${stale.map(p => p.file).join(', ')}`);
  if (problems.length) {
    console.error('');
    problems.forEach(p => console.error('  ✗ ' + p));
    console.error('\nRun: node tools/photo-credits.js --init   (then fill in what you know with --set)');
    process.exit(1);
  }
  console.log('\nphoto-credits OK: every photo has a provenance entry.');
}
