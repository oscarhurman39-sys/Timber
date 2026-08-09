#!/usr/bin/env node
/*
  run-all.js — one command for every check, so "did I run them all?" stops being
  a question you answer from memory.

    node tests/run-all.js            everything
    node tests/run-all.js --fast     skip the browser suites (data checks only, ~2s)
    node tests/run-all.js --list     show what would run

  Starts its own static server if nothing is already serving :8477, and stops it
  again on the way out. Prints one line per check and a summary; exits non-zero
  if anything failed, so a hook or CI job can gate on it.
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

  const results = [];
  for (const c of todo) {
    process.stdout.write(c.name.padEnd(16));
    const t = Date.now();
    const r = spawnSync(c.cmd[0], c.cmd.slice(1), {
      cwd: ROOT, encoding: 'utf8',
      env: { ...process.env, NODE_PATH: process.env.NODE_PATH || '/opt/node22/lib/node_modules' },
    });
    const secs = ((Date.now() - t) / 1000).toFixed(1);
    const ok = r.status === 0;
    results.push({ ...c, ok, out: (r.stdout || '') + (r.stderr || '') });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${secs}s   ${c.why}`);
  }

  if (server) { try { process.kill(-server.pid); } catch {} }

  const failed = results.filter(r => !r.ok);
  for (const f of failed) {
    console.log(`\n--- ${f.name} output (last 25 lines) ---`);
    console.log(f.out.trimEnd().split('\n').slice(-25).join('\n'));
  }
  console.log(`\n${results.length - failed.length}/${results.length} passed` +
    (fast ? '  (--fast: browser suites skipped)' : ''));
  process.exit(failed.length ? 1 : 0);
})();
