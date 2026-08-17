#!/usr/bin/env node
/*
  run-all.js — one command for every check, so "did I run them all?" stops being
  a question you answer from memory.

    node tests/run-all.js            everything, browser suites one at a time
    node tests/run-all.js --jobs 3   run browser suites 3 at a time (much faster)
    node tests/run-all.js --fast     data checks only, ~2s, no browser
    node tests/run-all.js --list     show what would run

  Starts its own static server if nothing is already serving :8477, and stops it
  again on the way out. Prints one line per check and a summary; exits non-zero
  if anything failed, so a hook or CI job can gate on it.

  The data checks always run FIRST and in order, because they cost 0.3s and catch
  the mistakes most likely to be in a fresh batch. Discovering a duplicate latin
  name after five minutes of browser tests is a waste of five minutes.

  --jobs: each browser suite launches its own Chromium against the shared static
  server and keeps its state in its own browser context, so they don't interfere.
  Budget ~500MB per job. 3 is a good default on a 4-core box; the wall clock then
  falls to roughly the slowest single suite instead of the sum of all of them.
*/
'use strict';
const { spawn, spawnSync } = require('child_process');
const http = require('http');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 8477;

/* Browser suites need a served page; data checks read the file directly. */
const CHECKS = [
  { name: 'data-audit', cmd: ['node', 'tools/data-audit.js'], browser: false,
    why: 'deck / hold / csv / photos all agree' },
  { name: 'plant-sense', cmd: ['node', 'tools/plant-sense.js', '--strict'], browser: false,
    why: 'no card contradicts itself' },
  { name: 'build-stamp', cmd: ['node', 'tools/build-stamp.js', '--check'], browser: false,
    why: 'BUILD matches the committed content' },
  { name: 'template-geom', cmd: ['node', 'tools/template-geometry.js', '--check'], browser: false,
    why: 'card overlay anchors have not drifted' },
  { name: 'photo-credits', cmd: ['node', 'tools/photo-credits.js', '--check'], browser: false,
    why: 'every photo has a provenance entry' },
  { name: 'check-boot', cmd: ['node', 'tools/check-boot.js'], browser: false,
    why: 'app syntax and special-card assets/config cannot brick boot' },
  /* The app loads derived WebP, not the masters beside them. Nothing else notices
     if a master is repainted and its derivative is not re-run, so the deployed
     card would quietly keep showing the old artwork. Both checks no-op with a
     note where sharp is not installed, which includes the Pages runner. */
  { name: 'optimise-art', cmd: ['node', 'tools/optimise-art.js', '--check'], browser: false,
    why: 'every art master has a current .webp derivative' },
  { name: 'optimise-photos', cmd: ['node', 'tools/optimise-photos.js', '--check'], browser: false,
    why: 'every photo master has a current card-sized derivative' },
  { name: 'reframe-photo', cmd: ['node', 'tools/reframe-photo.js', '--selftest'], browser: false,
    why: 'the crop gate still refuses outpainting, false label claims and inpainting' },
  { name: 'app-test', cmd: ['node', 'tests/app-test.js'], browser: true,
    why: 'gestures, flip, search, quiz, persistence, a11y' },
  { name: 'edge-test', cmd: ['node', 'tests/edge-test.js'], browser: true,
    why: 'corrupt storage, empty deck, undo edges' },
  { name: 'sw-update-test', cmd: ['node', 'tests/sw-update-test.js'], browser: true,
    why: 'service-worker update path' },
  { name: 'perf-test', cmd: ['node', 'tests/perf-test.js'], browser: true,
    why: 'photo window, compositing budget, pixel parity' },
  { name: 'deck-audit', cmd: ['node', 'tests/deck-audit.js'], browser: true,
    why: 'whole-deck rendered-output audit' },
  { name: 'srs-test', cmd: ['node', 'tests/srs-test.js'], browser: true,
    why: 'spaced repetition boxes, review mode' },
  { name: 'features-test', cmd: ['node', 'tests/features-test.js'], browser: true,
    why: 'quiz v2, filters, fuzzy search, stats, focus trap' },
  { name: 'verify-cards', cmd: ['node', 'design/verify-cards.js'], browser: true,
    why: 'card builder: rating maths vs data' },
  { name: 'audit-layout', cmd: ['node', 'design/audit-layout.js'], browser: true,
    why: 'ink fits zones, band collisions, rail alignment' },
];

const fast = process.argv.includes('--fast');
const list = process.argv.includes('--list');
const ji = process.argv.indexOf('--jobs');
const JOBS = Math.max(1, ji === -1 ? 1 : Number(process.argv[ji + 1]) || 1);
const todo = CHECKS.filter(c => !(fast && c.browser));

if (list) {
  for (const c of todo) console.log(`${c.name.padEnd(16)} ${c.why}`);
  process.exit(0);
}

const alive = () => new Promise(res => {
  const r = http.get({ host: '127.0.0.1', port: PORT, path: '/timber.html', timeout: 700 },
    x => { x.resume(); res(x.statusCode === 200); });
  r.on('error', () => res(false));
  r.on('timeout', () => { r.destroy(); res(false); });
});

(async () => {
  let server = null;
  if (todo.some(c => c.browser) && !(await alive())) {
    server = spawn('python3', ['-m', 'http.server', String(PORT)],
      { cwd: ROOT, stdio: 'ignore', detached: true });
    for (let i = 0; i < 40 && !(await alive()); i++) await new Promise(r => setTimeout(r, 250));
    if (!(await alive())) {
      console.error(`could not start a static server on :${PORT}`);
      if (server) process.kill(-server.pid);
      process.exit(1);
    }
    console.log(`(started a static server on :${PORT})\n`);
  }

  const ENV = { ...process.env, NODE_PATH: process.env.NODE_PATH || '/opt/node22/lib/node_modules' };
  const results = [];

  /* One check, as a promise. Output is captured rather than inherited so parallel
     suites don't interleave their lines into mush. */
  const runOne = (c) => new Promise(resolve => {
    const t = Date.now();
    const p = spawn(c.cmd[0], c.cmd.slice(1), { cwd: ROOT, env: ENV });
    let out = '';
    p.stdout.on('data', d => (out += d));
    p.stderr.on('data', d => (out += d));
    p.on('close', code => resolve({ ...c, ok: code === 0, out, secs: (Date.now() - t) / 1000 }));
  });

  const report = r => console.log(`${r.name.padEnd(16)}${r.ok ? 'PASS' : 'FAIL'}  ${r.secs.toFixed(1)}s   ${r.why}`);

  /* Data checks first, serially: they are ~0.1s each and they catch the errors a
     fresh batch is most likely to contain. Fail here and the browser suites are
     never paid for. */
  for (const c of todo.filter(x => !x.browser)) {
    const r = await runOne(c);
    results.push(r); report(r);
  }
  if (results.some(r => !r.ok)) {
    console.log('\ndata checks failed — stopping before the browser suites (they would take minutes and tell you nothing new).');
  } else {
    const browser = todo.filter(x => x.browser);
    if (JOBS > 1 && browser.length) console.log(`(running ${browser.length} browser suites, ${JOBS} at a time)`);
    const queue = browser.slice();
    const workers = Array.from({ length: Math.min(JOBS, queue.length) }, async () => {
      while (queue.length) {
        const c = queue.shift();
        const r = await runOne(c);
        results.push(r); report(r);
      }
    });
    await Promise.all(workers);
  }

  if (server) { try { process.kill(-server.pid); } catch {} }

  const failed = results.filter(r => !r.ok);
  for (const f of failed) {
    console.log(`\n--- ${f.name} output (last 25 lines) ---`);
    console.log(f.out.trimEnd().split('\n').slice(-25).join('\n'));
  }
  const wall = results.reduce((m, r) => Math.max(m, r.secs), 0);
  const cpu = results.reduce((s, r) => s + r.secs, 0);
  const skipped = todo.length - results.length;
  console.log(`\n${results.length - failed.length}/${results.length} passed` +
    (fast ? '  (--fast: browser suites skipped)' : '') +
    (skipped > 0 ? `  (${skipped} not run)` : '') +
    (JOBS > 1 ? `  — ${cpu.toFixed(0)}s of work across ${JOBS} jobs, slowest suite ${wall.toFixed(0)}s` : ''));
  process.exit(failed.length ? 1 : 0);
})();
