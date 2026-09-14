#!/usr/bin/env node
/*
  research-run.js — hand Claude Code one batch of the deck check, and take the
  answers back.

    node tools/research-run.js status
    node tools/research-run.js next [--size 8] [--fields foliage,toxicity]
    node tools/research-run.js take <answers.json>

  WHY THIS SHAPE

  Oscar, 2026-09-14, on running the pass through a metered API: "Wait I dont want
  it to run on api aha". Claude Code already has web search, already sits next to
  FULL-DECK-CHECK.md, check-plant-json.js and backfill-field.js, and runs on the
  subscription he already pays for. So the harness is not a script that calls an
  API — it is a batch driver:

    next  writes a self-contained research task for the next few plants
          (only the questions each of them is actually missing)
    take  validates what came back and stages it for backfill-field.js

  WHAT IS DERIVED AND WHAT IS REMEMBERED

  The work list is derived from the DECK, never from a log: a card that carries a
  value is not asked again, so the tool cannot drift out of step with the cards no
  matter what happened in between. The log remembers exactly one thing — which
  plant/field pairs came back EMPTY, with the reason. Without that, a plant whose
  root depth is genuinely unpublished is re-asked on every single run, forever,
  and the pass never converges. `--retry-empty` overrides it when better sources
  turn up.

  Nothing here writes to a card. `take` stages into data/incoming/ and stops;
  backfill-field.js is still the only thing that edits the deck, and it still
  refuses to overwrite a value a card already holds.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const D = require('./plant-data.js');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'timber.html');
const INCOMING = path.join(ROOT, 'data', 'incoming');
const LOG = path.join(ROOT, 'data', 'research-log.json');
const BRIEF = path.join(ROOT, 'FULL-DECK-CHECK.md');
const TASK_DIR = path.join(ROOT, 'data', 'research-tasks');

/* The eight questions, and how to tell whether a card still needs each one.
   `ask` is what goes in the task; `needs` reads the card. Both live here so the
   question and the test for "already answered" cannot drift apart. */
const has = v => v != null && String(v).trim() !== '';
const QUESTIONS = [
  { id: 'foliage', needs: p => !has(p.foliage),
    ask: 'foliage — evergreen / semi-evergreen / deciduous / herbaceous. MUST name one of those four; a leaf description after a semicolon is welcome and prints on the back.' },
  { id: 'toxicity', needs: p => !has(p.toxicity),
    ask: 'toxicity — free prose, printed verbatim. Say "No known hazard." explicitly when that is the answer; that is NOT the same as leaving it blank.' },
  { id: 'hardinessNote', needs: p => !has(p.hardinessNote),
    ask: 'hardinessNote — the qualifier behind the H rating. Must NOT contradict the hardiness the card already carries (shown below).' },
  { id: 'rootSize', needs: p => !has(p.rootSize),
    ask: 'rootSize — root depth × spread as "0.3-0.5m D × 1-1.5m W". EXPECT TO LEAVE THIS BLANK: root architecture is poorly published for garden cultivars and a guess is one somebody digs a hole to. Must carry a digit or be omitted.' },
  { id: 'stockForm', needs: p => !has(p.stockForm),
    ask: 'stockForm — container / bare-root / both. How the TRADE sells it, not how one shop does.' },
  { id: 'pollination', needs: p => !has(p.pollination),
    ask: 'pollination — MUST name one of: needs partner / self-fertile / not applicable. Prose after a semicolon. "not applicable" is the honest answer for anything not grown for fruit.' },
  { id: 'clay', needs: p => !has(p.clay),
    ask: 'clay — yes or no. Blank when not established; do not write "unknown".' },
  { id: 'cvs', needs: p => !has(p.cvs),
    ask: 'cvs — sister cultivars, synonyms, trade-name/cultivar-code pairing.' },
];
const BY_ID = new Map(QUESTIONS.map(q => [q.id, q]));

/* ---------- argv ---------- */
const argv = process.argv.slice(2);
const cmd = argv.find(a => !a.startsWith('--')) || 'status';
const flag = (name, dflt) => { const i = argv.indexOf('--' + name); return i === -1 ? dflt : argv[i + 1]; };
const SIZE = Math.max(1, Math.min(40, parseInt(flag('size', '8'), 10) || 8));
const ONLY = (flag('fields', '') || '').split(',').map(s => s.trim()).filter(Boolean);
const RETRY_EMPTY = argv.includes('--retry-empty');
if (ONLY.some(f => !BY_ID.has(f))) {
  console.error(`unknown field in --fields. Known: ${QUESTIONS.map(q => q.id).join(', ')}`);
  process.exit(2);
}
const FIELDS = ONLY.length ? ONLY.map(f => BY_ID.get(f)) : QUESTIONS;

/* ---------- the deck, and what it is still missing ---------- */
const html = fs.readFileSync(HTML, 'utf8');
const CARDS = [...D.readDeck(html).map(p => ({ p, block: 'dealt' })),
               ...D.readHold(html).map(p => ({ p, block: 'held' }))];

const log = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : { empty: {}, batches: [] };
const emptied = (latin, field) => !RETRY_EMPTY && !!(log.empty[latin] && log.empty[latin][field]);

/* A card's outstanding questions: missing on the card AND not already answered
   "nothing published" by an earlier batch. */
const gaps = ({ p }) => FIELDS.filter(q => q.needs(p) && !emptied(p.latin, q.id)).map(q => q.id);

function report() {
  const n = CARDS.length;
  console.log(`\ndeck ${CARDS.filter(c => c.block === 'dealt').length} dealt · ${CARDS.filter(c => c.block === 'held').length} held · ${n} cards\n`);
  console.log('field           on cards   still asking   closed as unpublished');
  for (const q of QUESTIONS) {
    const onCard = CARDS.filter(c => !q.needs(c.p)).length;
    const closed = CARDS.filter(c => q.needs(c.p) && emptied(c.p.latin, q.id)).length;
    const asking = n - onCard - closed;
    console.log('  ' + q.id.padEnd(15) + String(onCard).padStart(4) + '/' + n
      + String(asking).padStart(13) + String(closed).padStart(23));
  }
  const open = CARDS.filter(c => gaps(c).length);
  console.log(`\n${open.length} card(s) have an outstanding question · ${log.batches.length} batch(es) taken`);
  if (open.length) console.log(`next: node tools/research-run.js next --size ${SIZE}`);
}

/* ---------- next: write the task ---------- */
function next() {
  const queue = CARDS.map(c => ({ ...c, gaps: gaps(c) })).filter(c => c.gaps.length).slice(0, SIZE);
  if (!queue.length) { console.log('nothing outstanding — every card carries every field, or the rest are closed as unpublished.'); return; }

  const rules = fs.readFileSync(BRIEF, 'utf8').split('## THE EIGHT QUESTIONS')[0].trim();
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const out = path.join(TASK_DIR, `batch-${stamp}.md`);
  const answersPath = `data/incoming/answers-${stamp}.json`;

  const body = [
`# Research task — ${queue.length} plants`,
``,
`Answer ONLY the questions listed under each plant. A question is absent because`,
`the card already carries it, or because an earlier batch established that it is`,
`not published — either way, do not answer it.`,
``,
`Search the web for each plant. UK sources and UK conditions. Put the URL you`,
`actually used in \`sources\`, per plant, and put every deliberate blank in`,
`\`uncertain\` with the reason.`,
``,
`Write the result as a JSON array to **${answersPath}**, then run:`,
``,
'```',
`node tools/research-run.js take ${answersPath}`,
'```',
``,
`---`,
``,
rules,
``,
`---`,
``,
`## The questions in this batch`,
``,
...[...new Set(queue.flatMap(c => c.gaps))].map(id => `- **${id}** — ${BY_ID.get(id).ask}`),
``,
`---`,
``,
`## The plants`,
``,
...queue.flatMap(c => [
  `### \`${c.p.latin}\` — ${c.p.common}`,
  `Card already says: hardiness **${c.p.hardiness || '—'}** · peak ${c.p.peak || '—'} · ${c.block}`,
  `Answer: ${c.gaps.join(' · ')}`,
  ``,
]),
  ].join('\n');

  fs.mkdirSync(TASK_DIR, { recursive: true });
  fs.writeFileSync(out, body);
  /* WHAT WAS ACTUALLY ASKED, written beside the task. `take` must not infer this
     from the deck: the first run of this tool did, and closed toxicity,
     hardinessNote and rootSize as "unpublished" on three plants that were never
     asked about them — a batch run with --fields foliage,pollination,stockForm,clay.
     Over a full pass that silently buries three questions on 395 cards. */
  fs.writeFileSync(out.replace(/\.md$/, '.asked.json'),
    JSON.stringify(Object.fromEntries(queue.map(c => [c.p.latin, c.gaps])), null, 2) + '\n');
  console.log(`\nwrote ${path.relative(ROOT, out)}  —  ${queue.length} plants, ${[...new Set(queue.flatMap(c => c.gaps))].length} question(s)`);
  queue.forEach(c => console.log(`  ${c.p.latin}  →  ${c.gaps.join(', ')}`));
  console.log(`\nanswers go to ${answersPath}`);
}

/* ---------- take: validate, log the blanks, stage ---------- */
function take(file) {
  if (!file) { console.error('usage: node tools/research-run.js take <answers.json>'); process.exit(2); }
  const src = path.resolve(ROOT, file);
  let rows;
  try { rows = JSON.parse(fs.readFileSync(src, 'utf8')); }
  catch (e) { console.error(`could not read ${file}: ${e.message}`); process.exit(1); }
  if (!Array.isArray(rows)) { console.error('expected a JSON ARRAY of plant objects'); process.exit(1); }

  /* The manifest names the plant/field pairs this batch asked about. Without it
     nothing is closed — a wrong "asked and came back empty" is unrecoverable
     without editing the log by hand, so the safe default is to record none. */
  const stamp = (path.basename(src).match(/(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})/) || [])[1];
  const manifestPath = stamp ? path.join(TASK_DIR, `batch-${stamp}.asked.json`) : null;
  let asked = null;
  if (manifestPath && fs.existsSync(manifestPath)) asked = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  else console.log(`\n! no batch manifest beside ${path.basename(src)} — answers still import, but no question will be closed as unpublished`);

  const live = new Map(CARDS.map(c => [c.p.latin, c.p]));
  const problems = [], staged = [];
  for (const r of rows) {
    const latin = String(r && r.latin || '').trim();
    if (!latin) { problems.push('a row has no latin'); continue; }
    if (!live.has(latin)) { problems.push(`${latin} — matches no card. The importer is exact-match; check the string.`); continue; }
    const card = live.get(latin);
    const keep = { latin };
    for (const q of QUESTIONS) {
      const v = r[q.id];
      if (!has(v)) continue;
      if (!q.needs(card)) { problems.push(`${latin}.${q.id} — the card already carries a value; backfill-field will leave it alone and report it`); }
      keep[q.id] = String(v).trim();
    }
    /* remember the deliberate blanks so the same dead end is not asked again —
       ONLY for the fields this batch actually put to the researcher */
    const thisAsked = (asked && asked[latin]) || [];
    const blank = thisAsked.filter(f => !has(r[f]));
    if (blank.length) {
      log.empty[latin] = log.empty[latin] || {};
      const notes = Array.isArray(r.uncertain) ? r.uncertain.map(String) : [];
      blank.forEach(f => {
        /* attach the reason that names this field, not the whole uncertain list —
           otherwise every closed field carries every other field's excuse */
        const mine = notes.filter(n => n.toLowerCase().includes(f.toLowerCase()));
        log.empty[latin][f] = mine.join(' · ') || 'returned blank, no reason given';
      });
    }
    if (Object.keys(keep).length > 1) staged.push(keep);
  }

  console.log(`\n${rows.length} row(s) in · ${staged.length} carrying at least one answer`);
  if (problems.length) { console.log('\nnotes:'); problems.forEach(p => console.log('  ! ' + p)); }

  if (!staged.length) { console.log('\nnothing to stage.'); }
  else {
    fs.mkdirSync(INCOMING, { recursive: true });
    const dest = path.join(INCOMING, path.basename(src));
    fs.writeFileSync(dest, JSON.stringify(staged, null, 2) + '\n');
    console.log(`\nstaged ${path.relative(ROOT, dest)}`);
    const fields = [...new Set(staged.flatMap(r => Object.keys(r).filter(k => k !== 'latin')))];
    console.log('\nimport with:');
    fields.forEach(f => console.log(`  node tools/backfill-field.js ${f} --apply`));
  }
  log.batches.push({ at: new Date().toISOString(), file: path.basename(src), rows: rows.length, staged: staged.length });
  fs.writeFileSync(LOG, JSON.stringify(log, null, 2) + '\n');
  console.log(`\nlog updated — ${Object.keys(log.empty).length} plant(s) have at least one question closed as unpublished`);
}

if (cmd === 'status') report();
else if (cmd === 'next') next();
else if (cmd === 'take') take(argv.filter(a => !a.startsWith('--'))[1]);
else { console.error(`unknown command "${cmd}". Use: status | next | take`); process.exit(2); }
