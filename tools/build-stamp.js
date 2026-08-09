#!/usr/bin/env node
/*
  build-stamp.js — make the build stamp tell the truth.

    node tools/build-stamp.js            show local stamp + content hash
    node tools/build-stamp.js --check    fail if the stamp doesn't match the content
    node tools/build-stamp.js --write    restamp (bumps the revision, sets the hash)
    node tools/build-stamp.js --write --rev r19    restamp at an explicit revision
    node tools/build-stamp.js --verify <url>       fetch a deployed page and compare

  WHY
  The menu-foot build number is the only way to tell which version a phone is
  actually running, because the service worker serves the previous build once
  before swapping. But the number was typed by hand, so it could be bumped
  without a change, or a change could ship without a bump — in both cases the
  one signal you rely on is quietly wrong.

  So the stamp now carries a hash of the file's own content. --check recomputes
  it, which means a stale stamp fails the test run instead of reaching a phone.
  The hash covers everything in timber.html except the stamp line itself.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'timber.html');

/* The stamp: r<rev> · <date> · <hash>. The hash is optional in the pattern so an
   older, unhashed stamp is recognised (and reported as needing a restamp)
   rather than crashing the parser. */
const RE = /const BUILD\s*=\s*'([^']*)'/;
const PARTS = /^r(\d+)\s*·\s*([\d-]+)(?:\s*·\s*([0-9a-f]{7,}))?/;

function read() {
  const html = fs.readFileSync(HTML, 'utf8');
  const m = RE.exec(html);
  if (!m) { console.error('ERROR: no BUILD constant found in timber.html'); process.exit(1); }
  return { html, stamp: m[1], full: m[0] };
}

/* Hash the file with the stamp line neutralised, so restamping doesn't change
   the hash that the stamp is meant to describe. */
function contentHash(html) {
  const neutral = html.replace(RE, "const BUILD='<stamp>'");
  return crypto.createHash('sha256').update(neutral).digest('hex').slice(0, 7);
}

function parse(stamp) {
  const p = PARTS.exec(stamp);
  return p ? { rev: Number(p[1]), date: p[2], hash: p[3] || null } : null;
}

const argv = process.argv.slice(2);
const arg = f => { const i = argv.indexOf(f); return i === -1 ? null : argv[i + 1]; };

/* ---------- verify a deployed page ---------- */
if (argv.includes('--verify')) {
  const url = arg('--verify');
  if (!url) { console.error('usage: --verify <url>'); process.exit(1); }
  const { html } = read();
  const want = parse(read().stamp);
  const localHash = contentHash(html);
  const https = url.startsWith('http:') ? require('http') : require('https');
  https.get(url, { headers: { 'cache-control': 'no-cache' } }, res => {
    if (res.statusCode !== 200) {
      console.error(`ERROR: ${url} returned ${res.statusCode}`);
      process.exit(1);
    }
    let body = '';
    res.setEncoding('utf8');
    res.on('data', d => (body += d));
    res.on('end', () => {
      const m = RE.exec(body);
      if (!m) { console.error('ERROR: served page has no BUILD constant — is that the app?'); process.exit(1); }
      const served = m[1], sHash = contentHash(body);
      console.log(`local  : ${read().stamp}   (content ${localHash})`);
      console.log(`served : ${served}   (content ${sHash})`);
      if (sHash === localHash) {
        console.log('\nMATCH — the deployed page is byte-identical to your working tree.');
        process.exit(0);
      }
      console.log('\nDIFFERENT — the deployed page is not this working tree.');
      console.log(served === read().stamp
        ? '  Same stamp, different content: someone shipped without restamping. The stamp is lying.'
        : '  Different stamp too, so this is simply an older (or newer) deploy.');
      process.exit(1);
    });
  }).on('error', e => {
    console.error(`ERROR: could not fetch ${url}: ${e.message}`);
    console.error('(github.io is not reachable from every environment — run this from a machine that can see it.)');
    process.exit(1);
  });
  return;
}

/* ---------- local modes ---------- */
const { html, stamp } = read();
const hash = contentHash(html);
const cur = parse(stamp);

if (argv.includes('--write')) {
  const explicit = arg('--rev');
  const rev = explicit ? Number(String(explicit).replace(/^r/, '')) : (cur ? cur.rev + 1 : 1);
  const date = arg('--date') || new Date().toISOString().slice(0, 10);
  const next = `r${rev} · ${date} · ${hash}`;
  fs.writeFileSync(HTML, html.replace(RE, `const BUILD='${next}'`));
  // the hash covers content excluding the stamp, so it is stable across this write
  const after = contentHash(fs.readFileSync(HTML, 'utf8'));
  if (after !== hash) { console.error(`ERROR: hash moved during restamp (${hash} -> ${after})`); process.exit(1); }
  console.log(`stamped: ${stamp}  ->  ${next}`);
  process.exit(0);
}

if (argv.includes('--check')) {
  if (!cur) {
    console.error(`ERROR: BUILD "${stamp}" is not in the form r<n> · <date> · <hash>`);
    console.error('Run: node tools/build-stamp.js --write');
    process.exit(1);
  }
  if (!cur.hash) {
    console.error(`ERROR: BUILD "${stamp}" has no content hash, so it cannot be trusted to match the app.`);
    console.error('Run: node tools/build-stamp.js --write');
    process.exit(1);
  }
  if (cur.hash !== hash) {
    console.error(`ERROR: BUILD says content ${cur.hash} but timber.html hashes to ${hash}.`);
    console.error('The app changed since it was last stamped — a phone would show a build number that lies.');
    console.error('Run: node tools/build-stamp.js --write');
    process.exit(1);
  }
  console.log(`build-stamp OK: ${stamp}`);
  process.exit(0);
}

console.log(`stamp        : ${stamp}`);
console.log(`content hash : ${hash}`);
console.log(cur && cur.hash === hash ? 'in sync' : 'STALE — run --write');
