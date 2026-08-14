#!/usr/bin/env node
/*
  check-boot.js — fast, browser-free guard against shipping a blank Timber app.

    node tools/check-boot.js

  The Pages gate does not execute timber.html in a browser. This check covers the
  failures that can brick boot before any browser suite gets a chance to run:
    - syntax errors in inline <script> blocks
    - malformed special-card registries
    - registry entries that point at missing assets
    - ANIM strips whose width cannot be divided into the configured frame count
    - registry keys that do not belong to a current dealt/on-hold plant

  Keep this dependency-free: it is intentionally part of `run-all --fast`.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'timber.html');
const { readDeck, readHold } = require('./plant-data.js');

const REGISTRIES = ['HOLO', 'ANIM', 'PHOTO_SWAP', 'PHOTO_FOCUS', 'PEST'];
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fail(errors, msg) { errors.push(msg); }

/* Walk a JS object literal rather than trying to parse values with regex.
   Strings, template strings and comments are skipped so braces inside them do
   not affect the nesting depth. The special-card registries contain data only,
   but this deliberately remains safe if a comment later includes punctuation. */
function balancedObject(src, start) {
  let depth = 0;
  let quote = null;
  let lineComment = false;
  let blockComment = false;

  for (let i = start; i < src.length; i++) {
    const c = src[i], n = src[i + 1];

    if (lineComment) {
      if (c === '\n' || c === '\r') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (c === '*' && n === '/') { blockComment = false; i++; }
      continue;
    }
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '/' && n === '/') { lineComment = true; i++; continue; }
    if (c === '/' && n === '*') { blockComment = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  return null;
}

function extractRegistry(html, name, errors) {
  const re = new RegExp(`\\bconst\\s+${name}\\s*=`);
  const m = re.exec(html);
  if (!m) { fail(errors, `${name}: declaration not found`); return null; }
  const open = html.indexOf('{', m.index + m[0].length);
  if (open === -1) { fail(errors, `${name}: opening { not found`); return null; }
  const literal = balancedObject(html, open);
  if (!literal) { fail(errors, `${name}: object literal is unterminated`); return null; }
  try {
    return Function('"use strict";return (' + literal + ')')();
  } catch (e) {
    fail(errors, `${name}: object literal does not compile: ${e.message}`);
    return null;
  }
}

function syntaxCheckScripts(html, errors) {
  const scripts = [];
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) scripts.push(m[1]);
  if (!scripts.length) fail(errors, 'timber.html: no inline <script> bodies found');
  scripts.forEach((src, i) => {
    try { new Function(src); }
    catch (e) { fail(errors, `timber.html <script> #${i + 1}: syntax error: ${e.message}`); }
  });
  return scripts.length;
}

function localAsset(errors, owner, rel) {
  if (typeof rel !== 'string' || !rel.trim()) {
    fail(errors, `${owner}: asset path is empty or not a string`);
    return null;
  }
  const abs = path.resolve(ROOT, rel);
  const rootPrefix = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
  if (abs !== ROOT && !abs.startsWith(rootPrefix)) {
    fail(errors, `${owner}: asset path escapes repo root: ${rel}`);
    return null;
  }
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    fail(errors, `${owner}: missing asset ${rel}`);
    return null;
  }
  return abs;
}

/* Strip width, read straight out of the header. The app loads the WebP that
   tools/optimise-art.js derives from each PNG master, so a strip can arrive in
   either format and the frame-count check has to hold for both — a WebP strip
   whose width no longer divides by its frame count smears exactly the same way. */
function imageWidth(file, errors, owner) {
  let b;
  try { b = fs.readFileSync(file); }
  catch (e) { fail(errors, `${owner}: could not read image: ${e.message}`); return null; }
  let w = null;
  if (b.length >= 24 && b.subarray(0, 8).equals(PNG_SIG) && b.toString('ascii', 12, 16) === 'IHDR') {
    w = b.readUInt32BE(16);
  } else if (b.length >= 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = b.toString('ascii', 12, 16);
    if (chunk === 'VP8X') w = (b.readUIntLE(24, 3) & 0xffffff) + 1;               /* extended: canvas width-1, 24-bit */
    else if (chunk === 'VP8L') w = ((b.readUInt32LE(21) & 0x3fff)) + 1;           /* lossless: 14 bits after the 0x2f signature */
    else if (chunk === 'VP8 ') w = b.readUInt16LE(26) & 0x3fff;                   /* lossy: 14 bits of the keyframe header */
  } else {
    fail(errors, `${owner}: not a valid PNG or WebP header`);
    return null;
  }
  if (!w) { fail(errors, `${owner}: image width is zero`); return null; }
  return w;
}

function slugLatin(l) {
  return String(l).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function checkRegistryKeys(registries, html, errors) {
  let plants;
  try { plants = readDeck(html).concat(readHold(html)); }
  catch (e) { fail(errors, `plant blocks: ${e.message}`); return; }
  const slugs = new Set(plants.map(p => slugLatin(p.latin)));
  /* PEST is the one registry NOT keyed by latin-slug — its keys are pest names
     shared across cards, checked against the cards by checkPestKeys instead. */
  for (const name of REGISTRIES.filter(n => n !== 'PEST')) {
    const reg = registries[name];
    if (!reg) continue;
    for (const key of Object.keys(reg)) {
      if (!slugs.has(key)) fail(errors, `${name}: key "${key}" is not the latin-slug of a current dealt/on-hold plant`);
    }
  }
}

function checkAssets(registries, errors) {
  const holo = registries.HOLO || {};
  for (const [slug, h] of Object.entries(holo)) {
    if (!h || typeof h !== 'object') { fail(errors, `HOLO ${slug}: config is not an object`); continue; }
    for (const key of ['frame', 'plaque', 'soil', 'band', 'swatch', 'edging']) {
      if (h[key] != null) localAsset(errors, `HOLO ${slug}.${key}`, h[key]);
    }
    if (h.wisps != null && !Array.isArray(h.wisps)) fail(errors, `HOLO ${slug}.wisps: expected an array`);
    for (const [i, w] of (Array.isArray(h.wisps) ? h.wisps : []).entries()) {
      if (!w || typeof w !== 'object') fail(errors, `HOLO ${slug}.wisps[${i}]: expected an object`);
      else localAsset(errors, `HOLO ${slug}.wisps[${i}].src`, w.src);
    }
  }

  const anim = registries.ANIM || {};
  for (const [slug, a] of Object.entries(anim)) {
    if (!a || typeof a !== 'object') { fail(errors, `ANIM ${slug}: config is not an object`); continue; }
    if (!Number.isInteger(a.frames) || a.frames < 2) fail(errors, `ANIM ${slug}: frames must be an integer >= 2`);
    if (!Array.isArray(a.durations)) fail(errors, `ANIM ${slug}: durations must be an array`);
    else if (a.durations.length !== a.frames)
      fail(errors, `ANIM ${slug}: ${a.durations.length} durations for ${a.frames} frames`);
    if (!Array.isArray(a.layers)) { fail(errors, `ANIM ${slug}: layers must be an array`); continue; }
    for (const [i, layer] of a.layers.entries()) {
      if (!layer || typeof layer !== 'object') { fail(errors, `ANIM ${slug}.layers[${i}]: expected an object`); continue; }
      const abs = localAsset(errors, `ANIM ${slug}.layers[${i}].src`, layer.src);
      if (abs && Number.isInteger(a.frames) && a.frames > 0) {
        const w = imageWidth(abs, errors, `ANIM ${slug}.layers[${i}] ${layer.src}`);
        if (w != null && w % a.frames !== 0)
          fail(errors, `ANIM ${slug}.layers[${i}]: strip width ${w}px is not divisible by ${a.frames} frames`);
      }
    }
  }

  const swaps = registries.PHOTO_SWAP || {};
  for (const [slug, s] of Object.entries(swaps)) {
    if (!s || typeof s !== 'object') { fail(errors, `PHOTO_SWAP ${slug}: config is not an object`); continue; }
    if (s.alt != null) localAsset(errors, `PHOTO_SWAP ${slug}.alt`, s.alt);
  }

  /* Every pest icon must be on disk, and every `pest` a card claims must be a key
     in the registry. The app deliberately falls back to the baked mite on an
     unknown key rather than punching a parchment hole and drawing nothing, so a
     typo is invisible in the browser — which is exactly why it is caught here. */
  const pests = registries.PEST || {};
  for (const [key, rel] of Object.entries(pests)) localAsset(errors, `PEST ${key}`, rel);
}

function checkPestKeys(registries, errors) {
  const pests = registries.PEST || {};
  const html = fs.readFileSync(HTML, 'utf8');
  /* the latin IMMEDIATELY before each pest — (?!latin:") stops the match reaching
     back over a card boundary and blaming the wrong plant, which it did once */
  for (const m of html.matchAll(/latin:"([^"]+)"(?:(?!latin:")[\s\S])*?pest:"([^"]*)"/g)) {
    const [, latin, key] = m;
    if (!key) fail(errors, `card ${latin}: pest is empty — omit the field instead`);
    else if (!(key in pests)) fail(errors, `card ${latin}: pest "${key}" is not in the PEST registry`);
  }
}

function main() {
  const errors = [];
  let html;
  try { html = fs.readFileSync(HTML, 'utf8'); }
  catch (e) { console.error(`check-boot FAIL: could not read timber.html: ${e.message}`); process.exit(1); }

  const scriptCount = syntaxCheckScripts(html, errors);
  const registries = {};
  for (const name of REGISTRIES) registries[name] = extractRegistry(html, name, errors);
  checkRegistryKeys(registries, html, errors);
  checkAssets(registries, errors);
  checkPestKeys(registries, errors);

  if (errors.length) {
    console.error(`check-boot FAIL: ${errors.length} problem(s)`);
    errors.forEach(e => console.error('  ✗ ' + e));
    process.exit(1);
  }
  const counts = REGISTRIES.map(n => `${n} ${Object.keys(registries[n] || {}).length}`).join(' · ');
  console.log(`check-boot OK: ${scriptCount} script body syntax-checked · ${counts}`);
}

main();
