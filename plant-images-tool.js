#!/usr/bin/env node
/*
  plant-images-tool.js — find real, commercially-reusable plant photos on
  Wikimedia Commons and archive a chosen one locally with its licence record.

  NEVER auto-picks an image. It surfaces candidates for a human to eyeball —
  identification accuracy is not something to automate blind.

    node plant-images-tool.js search "<Latin name>"
        Queries Wikimedia Commons, writes a browsable HTML gallery to
        plant-images/<slug>/candidates.html (open it in any browser) plus
        the raw data to candidates.json. Every candidate shown is already
        licence-filtered: Commons doesn't host non-commercial-only content,
        and this tool additionally drops anything whose licence text
        contains -NC or -ND as a defensive double-check.

    node plant-images-tool.js pick "<Latin name>" <file title or #index>
        Re-resolves the candidate from your last search and downloads it
        (a reasonably-sized version, not the multi-MB original) to
        plant-images/<slug>/photo.jpg, plus credit.json recording the
        licence, author, source URL, and the date you fetched it — your
        permanent proof of the terms you received it under.

  IMPORTANT — this could not be executed against the live Wikimedia API from
  the session that wrote it (network policy blocks that environment from
  reaching external hosts). It's built against Wikimedia's documented
  MediaWiki API shape, but treat the first run as the real test: if
  "search" comes back with zero results for a common plant like
  "Nandina domestica", something in the request shape needs fixing before
  trusting it further.

  Zero dependencies — uses Node's built-in fetch (Node 18+).
*/
'use strict';
const fs = require('fs');
const path = require('path');

const API = 'https://commons.wikimedia.org/w/api.php';
// Wikimedia asks all API clients to identify themselves — see
// https://meta.wikimedia.org/wiki/User-Agent_policy
const UA = 'Timber-PlantImagesTool/1.0 (garden-centre plant ID app; contact: oscarhurman39@gmail.com)';
const OUT_DIR = path.join(__dirname, 'plant-images');
const THUMB_WIDTH = 640; // review-size thumbnail; "pick" downloads at this width, not the multi-MB original

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function api(params) {
  const url = new URL(API);
  url.search = new URLSearchParams({ format: 'json', formatversion: '2', ...params }).toString();
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons API HTTP ${res.status} for ${params.action || '?'}`);
  const data = await res.json();
  if (data.error) throw new Error(`Commons API error: ${data.error.info || JSON.stringify(data.error)}`);
  return data;
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

async function findFileTitles(latin) {
  const titles = new Set();

  // Primary: Commons organizes photos by taxon category — usually exact.
  try {
    const cat = await api({
      action: 'query', list: 'categorymembers',
      cmtitle: `Category:${latin}`, cmtype: 'file', cmlimit: '40',
    });
    (cat.query?.categorymembers || []).forEach(m => titles.add(m.title));
  } catch (e) { /* category may not exist under this exact name — fall through */ }

  // Fallback / supplement: full-text search restricted to the File namespace (6).
  if (titles.size < 5) {
    const search = await api({
      action: 'query', generator: 'search',
      gsrsearch: latin, gsrnamespace: '6', gsrlimit: '20',
    });
    Object.values(search.query?.pages || {}).forEach(p => titles.add(p.title));
  }

  return [...titles];
}

async function fetchImageInfo(titles) {
  const results = [];
  for (const group of chunk(titles, 50)) {
    const data = await api({
      action: 'query', titles: group.join('|'),
      prop: 'imageinfo',
      iiprop: 'url|size|mime|extmetadata',
      iiurlwidth: String(THUMB_WIDTH),
    });
    Object.values(data.query?.pages || {}).forEach(p => {
      const info = p.imageinfo?.[0];
      if (!info) return;
      results.push({ title: p.title, info });
    });
  }
  return results;
}

const PHOTO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function toCandidate({ title, info }) {
  const meta = info.extmetadata || {};
  const val = k => meta[k]?.value?.replace(/<[^>]+>/g, '').trim() || '';
  const licenseShort = val('LicenseShortName');
  const license = val('License').toLowerCase();
  return {
    title,
    mime: info.mime,
    width: info.width, height: info.height,
    thumbUrl: info.thumburl || info.url,
    originalUrl: info.url,
    descriptionUrl: info.descriptionurl,
    license: licenseShort || license || 'unknown',
    licenseUrl: val('LicenseUrl'),
    artist: val('Artist') || val('Credit') || 'uncredited',
    isNcOrNd: /-nc|-nd|noncommercial|nonderiv/i.test(license + ' ' + licenseShort),
  };
}

function writeGallery(latin, candidates, dir) {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cards = candidates.map((c, i) => `
    <div class="card">
      <img src="${esc(c.thumbUrl)}" loading="lazy" alt="${esc(c.title)}">
      <div class="meta">
        <div class="idx">#${i}</div>
        <div class="license ${c.isNcOrNd ? 'bad' : 'ok'}">${esc(c.license)}${c.isNcOrNd ? ' — NOT commercial-safe, excluded from "pick"' : ''}</div>
        <div class="credit">${esc(c.artist)}</div>
        <div class="dims">${c.width}×${c.height}px</div>
        <a href="${esc(c.descriptionUrl)}" target="_blank" rel="noopener">View on Commons ↗</a>
        <div class="title">${esc(c.title)}</div>
      </div>
    </div>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Candidates: ${esc(latin)}</title>
<style>
  body{font-family:system-ui,sans-serif;background:#111;color:#eee;margin:0;padding:20px}
  h1{font-weight:700} .hint{color:#aaa;font-size:14px;margin-bottom:20px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
  .card{background:#1c1c1c;border-radius:12px;overflow:hidden;border:1px solid #333}
  .card img{width:100%;height:200px;object-fit:cover;display:block;background:#000}
  .meta{padding:10px 12px;font-size:13px;line-height:1.5}
  .idx{font-weight:800;color:#f5c451}
  .license.ok{color:#4cd787} .license.bad{color:#ff6b6b;font-weight:700}
  .title{color:#888;font-size:11px;word-break:break-all;margin-top:6px}
  a{color:#5b9bd5}
</style></head><body>
<h1>${esc(latin)} — ${candidates.length} candidate(s)</h1>
<div class="hint">Pick one, then run: node plant-images-tool.js pick "${esc(latin)}" &lt;#index&gt; [label] — e.g. add "wide" or "leaf" as a label to pick more than one shot per plant</div>
<div class="grid">${cards || '<p>No candidates found.</p>'}</div>
</body></html>`;
  fs.writeFileSync(path.join(dir, 'candidates.html'), html);
}

async function doSearch(latin) {
  if (!latin) { console.error('Usage: node plant-images-tool.js search "<Latin name>"'); process.exit(1); }
  const dir = path.join(OUT_DIR, slug(latin));
  fs.mkdirSync(dir, { recursive: true });

  console.log(`Searching Wikimedia Commons for "${latin}"...`);
  const titles = await findFileTitles(latin);
  if (!titles.length) {
    console.log('No files found. Try the common English name too, or check the latin spelling.');
    writeGallery(latin, [], dir);
    return;
  }

  const raw = await fetchImageInfo(titles);
  const candidates = raw
    .filter(r => PHOTO_MIME.has(r.info.mime))
    .map(toCandidate)
    .filter(c => !c.isNcOrNd); // defensive: Commons shouldn't host NC/ND-only content, but double-check

  fs.writeFileSync(path.join(dir, 'candidates.json'), JSON.stringify(candidates, null, 2));
  writeGallery(latin, candidates, dir);

  console.log(`${candidates.length} commercial-safe candidate(s) found.`);
  candidates.slice(0, 10).forEach((c, i) => console.log(`  #${i}  ${c.license}  ${c.artist}  — ${c.title}`));
  console.log(`\nOpen plant-images/${slug(latin)}/candidates.html in a browser to review them visually.`);
}

async function doPick(latin, which, label) {
  if (!latin || !which) { console.error('Usage: node plant-images-tool.js pick "<Latin name>" <#index or exact file title> [label]'); process.exit(1); }
  const dir = path.join(OUT_DIR, slug(latin));
  const jsonPath = path.join(dir, 'candidates.json');
  if (!fs.existsSync(jsonPath)) { console.error(`No search results for "${latin}" yet — run "search" first.`); process.exit(1); }
  const candidates = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  let chosen;
  if (/^#?\d+$/.test(which)) chosen = candidates[parseInt(which.replace('#', ''), 10)];
  else chosen = candidates.find(c => c.title === which || c.title === `File:${which}`);
  if (!chosen) { console.error(`Could not find candidate "${which}" — check the index or title from candidates.json.`); process.exit(1); }
  if (chosen.isNcOrNd) { console.error('Refusing to pick: this candidate is NC/ND-licensed, not commercial-safe.'); process.exit(1); }

  const tag = label ? `-${label.replace(/[^a-z0-9]+/gi, '-')}` : ''; // e.g. "wide"/"leaf" — lets you pick more than one shot per plant without overwriting

  console.log(`Downloading: ${chosen.title} (${chosen.license}, credit: ${chosen.artist})`);
  const res = await fetch(chosen.thumbUrl, { headers: { 'User-Agent': UA } });
  if (!res.ok) { console.error(`Download failed: HTTP ${res.status}`); process.exit(1); }
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = chosen.mime === 'image/png' ? 'png' : chosen.mime === 'image/webp' ? 'webp' : 'jpg';
  fs.writeFileSync(path.join(dir, `photo${tag}.${ext}`), buf);
  fs.writeFileSync(path.join(dir, `credit${tag}.json`), JSON.stringify({
    title: chosen.title,
    license: chosen.license,
    licenseUrl: chosen.licenseUrl,
    artist: chosen.artist,
    sourceUrl: chosen.descriptionUrl,
    retrievedAt: new Date().toISOString().slice(0, 10),
  }, null, 2));
  console.log(`Saved plant-images/${slug(latin)}/photo${tag}.${ext} + credit${tag}.json (${(buf.length / 1024).toFixed(0)} KB)`);
  console.log('Not wired into timber.html yet — that\'s a separate step once you\'ve picked images for a batch of plants.');
}

const [, , cmd, arg1, arg2, arg3] = process.argv;
(async () => {
  try {
    if (cmd === 'search') await doSearch(arg1);
    else if (cmd === 'pick') await doPick(arg1, arg2, arg3);
    else { console.log('Usage:\n  node plant-images-tool.js search "<Latin name>"\n  node plant-images-tool.js pick "<Latin name>" <#index or file title> [label]'); process.exit(cmd ? 1 : 0); }
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
})();
