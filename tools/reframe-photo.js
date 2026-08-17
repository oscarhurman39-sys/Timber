#!/usr/bin/env node
/* reframe-photo.js — apply a crop decision from PHOTO-REFRAME-BRIEF.md to a master.

     node tools/reframe-photo.js <photo> <crop.json> [--replace] [--dry-run]
     node tools/reframe-photo.js --audit <photo>      does this photo fit the card?
     node tools/reframe-photo.js --audit-all          the same over every master
     node tools/reframe-photo.js --selftest           the refusals still refuse

   Needs sharp:  NODE_PATH=/opt/node22/lib/node_modules

   WHY THIS EXISTS

   PHOTO-REFRAME-BRIEF.md asks a vision model for crop COORDINATES, never for an
   image, because image models re-render rather than crop: what comes back is
   resynthesised foliage carrying SynthID/C2PA markers, which is the class of
   thing two Verbena photographs were already refused for. This tool is the other
   half — it executes those coordinates on the original pixels with sharp, so no
   pixel is ever invented and the same JSON always produces the same file.

   It is also the gate, not just the cropper. Most of what follows is refusing a
   crop JSON that does not hold up: a verdict of reshoot/ask, a box outside the
   frame, an aspect that would starve the search detail sheet, a label the model
   claimed the stats plaque would hide when the arithmetic says otherwise. A
   refusal here is the point of the tool, not a failure of it.

   --audit needs no model and no JSON. It answers the one question worth asking
   of every photograph before it is dealt: does this shape survive both crops? */

'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

/* ---- card geometry, from timber.html. See PHOTO-REFRAME-BRIEF.md §2. ---- */
const CARD_ASPECT   = 0.6165;  /* .tphoto 348.8x565.7 on a 420x600 card */
const SHEET_ASPECT  = 1.6;     /* .d-photo img, aspect-ratio 16/10, centred */
const PLAQUE_TOP    = 0.622;   /* below this fraction of the photo, furniture covers it */
const ASPECT_MIN    = 0.75;    /* 3:4 portrait — narrower starves the 16:10 detail sheet */
const ASPECT_MAX    = 1.00;    /* square — wider loses too much width to the card crop */
const SAFE_X        = [0.10, 0.90];   /* visible on card AND detail sheet */
const SAFE_Y        = [0.30, 0.60];
const EV_LIMIT      = 0.7;
const ROT_LIMIT     = 15;
const EPS           = 0.005;

const ROOT   = path.resolve(__dirname, '..');
const PHOTOS = path.join(ROOT, 'photos');

const args = process.argv.slice(2);
const flag = f => { const i = args.indexOf(f); if (i >= 0) args.splice(i, 1); return i >= 0; };
const DRY  = flag('--dry-run');
const REPL = flag('--replace');
const AUDIT     = flag('--audit');
const AUDIT_ALL = flag('--audit-all');
const SELFTEST  = flag('--selftest');

const die = (...m) => { console.error('FAIL reframe-photo:', ...m); process.exit(1); };
const num = v => typeof v === 'number' && Number.isFinite(v);
const box = b => b && ['x','y','w','h'].every(k => num(b[k]));

function loadSharp() {
  try { return require('sharp'); }
  catch { die('needs sharp:  npm i -g sharp   (then run with NODE_PATH=/opt/node22/lib/node_modules)'); }
}

/* -------------------------------------------------------------- audit mode */
/* How much of a master each surface actually shows, given its aspect ratio.
   Both surfaces use object-fit:cover, so the narrower dimension is the one cut. */
function fit(aspect) {
  const cardWidthShown  = Math.min(1, CARD_ASPECT / aspect);
  const sheetHeightShown = Math.min(1, aspect / SHEET_ASPECT);
  let verdict = 'ok', why = '';
  if (aspect < ASPECT_MIN - 0.01) {
    verdict = 'tall';
    why = `detail sheet shows only ${(sheetHeightShown*100).toFixed(0)}% of the height`;
  } else if (aspect > ASPECT_MAX + 0.01) {
    verdict = 'wide';
    why = `card shows only ${(cardWidthShown*100).toFixed(0)}% of the width`;
  }
  return { cardWidthShown, sheetHeightShown, verdict, why };
}

async function auditOne(sharp, file, quiet) {
  const m = await sharp(file).metadata();
  const a = m.width / m.height;
  const f = fit(a);
  if (!quiet) {
    console.log(`${path.basename(file)}  ${m.width}x${m.height}  aspect ${a.toFixed(3)}  [${f.verdict}]`);
    console.log(`  card shows ${(f.cardWidthShown*100).toFixed(0)}% of the width · ` +
                `detail sheet shows ${(f.sheetHeightShown*100).toFixed(0)}% of the height`);
    if (f.why) console.log(`  ${f.why} — safe band is ${ASPECT_MIN}–${ASPECT_MAX}`);
  }
  return { file: path.basename(file), w: m.width, h: m.height, aspect: a, ...f };
}

async function auditAll(sharp) {
  const files = fs.readdirSync(PHOTOS).filter(f => /\.jpg$/i.test(f)).sort();
  if (!files.length) die('no masters in photos/');
  const rows = [];
  for (const f of files) rows.push(await auditOne(sharp, path.join(PHOTOS, f), true));
  const ok   = rows.filter(r => r.verdict === 'ok');
  const tall = rows.filter(r => r.verdict === 'tall').sort((a, b) => a.aspect - b.aspect);
  const wide = rows.filter(r => r.verdict === 'wide').sort((a, b) => b.aspect - a.aspect);
  const pc = n => `${n} (${(n / rows.length * 100).toFixed(1)}%)`;
  console.log(`reframe-photo --audit-all: ${rows.length} masters`);
  console.log(`  in the ${ASPECT_MIN}–${ASPECT_MAX} safe band : ${pc(ok.length)}`);
  console.log(`  too tall  (detail sheet loses height): ${pc(tall.length)}`);
  console.log(`  too wide  (card loses width)         : ${pc(wide.length)}`);
  const show = (label, list) => {
    if (!list.length) return;
    console.log(`\n  ${label}`);
    for (const r of list.slice(0, 12))
      console.log(`    ${r.file.padEnd(46)} ${r.aspect.toFixed(2)}  ${r.why}`);
    if (list.length > 12) console.log(`    ... and ${list.length - 12} more`);
  };
  show('widest — the card sees least of these:', wide);
  show('tallest — the detail sheet sees least of these:', tall);
  console.log('\nThis is information, not a gate: every one of these already ships.');
  console.log('It tells you which masters are worth re-cropping when you next touch them.');
}

/* ------------------------------------------------------------ crop mode */
function validate(crop, SW, SH, fileLabel) {
  const problems = [], notes = [];

  if (!['crop','as-is','reshoot','ask'].includes(crop.verdict))
    problems.push(`verdict must be crop|as-is|reshoot|ask, got ${JSON.stringify(crop.verdict)}`);
  if (crop.featureVisible === false)
    problems.push('featureVisible is false — a crop cannot recover a feature that is not in the frame');

  if (!box(crop.crop)) problems.push('crop must be {x,y,w,h} numbers, fractions of the original');
  else {
    const c = crop.crop;
    if (c.w <= 0 || c.h <= 0) problems.push('crop width and height must be positive');
    if (c.x < -EPS || c.y < -EPS) problems.push(`crop starts outside the frame (x ${c.x}, y ${c.y})`);
    if (c.x + c.w > 1 + EPS || c.y + c.h > 1 + EPS)
      problems.push(`crop extends past the frame (x+w ${(c.x+c.w).toFixed(3)}, y+h ${(c.y+c.h).toFixed(3)}) — no outpainting`);
  }

  const rot = num(crop.rotateDeg) ? crop.rotateDeg : 0;
  if (Math.abs(rot) > ROT_LIMIT) problems.push(`rotateDeg ${rot} exceeds ±${ROT_LIMIT}° — that is a reshoot, not a straighten`);
  const ev = crop.exposure && num(crop.exposure.evAdjust) ? crop.exposure.evAdjust : 0;
  if (Math.abs(ev) > EV_LIMIT) problems.push(`exposure.evAdjust ${ev} exceeds ±${EV_LIMIT} EV`);
  if (ev !== 0) notes.push(`exposure: ${ev > 0 ? '+' : ''}${ev} EV requested — NOT applied by this tool, see §7`);
  if (crop.exposure && crop.exposure.whiteBalance && crop.exposure.whiteBalance !== 'none')
    notes.push(`white balance: ${crop.exposure.whiteBalance} reported — NOT applied by this tool, see §7`);

  if (crop.sourcePx && num(crop.sourcePx.w) && num(crop.sourcePx.h)) {
    if (crop.sourcePx.w !== SW || crop.sourcePx.h !== SH)
      problems.push(`sourcePx ${crop.sourcePx.w}x${crop.sourcePx.h} but ${fileLabel} is ${SW}x${SH} — wrong photo for this JSON`);
  } else notes.push('sourcePx not reported — could not confirm the JSON describes this file');

  let outAspect = null;
  if (box(crop.crop)) {
    outAspect = (crop.crop.w * SW) / (crop.crop.h * SH);
    const f = fit(outAspect);
    if (f.verdict !== 'ok')
      problems.push(`crop aspect ${outAspect.toFixed(3)} is outside ${ASPECT_MIN}–${ASPECT_MAX} — ` +
        `too ${f.verdict}; ${f.why}`);
    if (num(crop.cropAspect) && Math.abs(crop.cropAspect - outAspect) > 0.02)
      problems.push(`cropAspect says ${crop.cropAspect} but the box computes to ${outAspect.toFixed(3)} — the model's numbers disagree with each other`);
  }

  if (box(crop.featureBox) && box(crop.crop)) {
    const c = crop.crop, f = crop.featureBox;
    const fx = (f.x + f.w / 2 - c.x) / c.w, fy = (f.y + f.h / 2 - c.y) / c.h;
    const inX = fx >= SAFE_X[0] && fx <= SAFE_X[1], inY = fy >= SAFE_Y[0] && fy <= SAFE_Y[1];
    const where = `feature centre lands at ${(fx*100).toFixed(0)}% across, ${(fy*100).toFixed(0)}% down the crop`;
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) problems.push(`${where} — the crop cuts the identifying feature out entirely`);
    else if (!inX || !inY) {
      const hasOverride = crop.objectPosition && crop.objectPosition !== '50% 40%';
      const msg = `${where}, outside the safe box (x ${SAFE_X[0]}–${SAFE_X[1]}, y ${SAFE_Y[0]}–${SAFE_Y[1]})`;
      if (!inY && hasOverride) notes.push(`${msg} — objectPosition override "${crop.objectPosition}" supplied; add it to PHOTO_FOCUS`);
      else problems.push(`${msg}${!inY ? ' and no objectPosition override was given' : ''}`);
    } else notes.push(where);
    if (crop.featureInSafeBox === true && !(inX && inY))
      problems.push('featureInSafeBox claims true but the arithmetic says otherwise');
  } else notes.push('featureBox not reported — could not verify the feature survives the crop');

  for (const l of (crop.labels || [])) {
    const reads = l.reads ? `"${l.reads}"` : 'unnamed label';
    if (l.resolution === 'reshoot') problems.push(`label ${reads} resolved as "reshoot" — this photo is not croppable, it is re-shootable`);
    if (!['crop','reframe','furniture','reshoot'].includes(l.resolution))
      problems.push(`label ${reads} has resolution ${JSON.stringify(l.resolution)} — no such rung. There is no inpainting rung.`);
    if (!box(l.box)) { notes.push(`label ${reads}: no box given, could not verify`); continue; }
    const c = crop.crop;
    if (!box(c)) continue;
    const lx0 = (l.box.x - c.x) / c.w, lx1 = (l.box.x + l.box.w - c.x) / c.w;
    const ly0 = (l.box.y - c.y) / c.h, ly1 = (l.box.y + l.box.h - c.y) / c.h;
    const gone = lx1 <= 0 || lx0 >= 1 || ly1 <= 0 || ly0 >= 1;
    if (l.resolution === 'crop' || l.resolution === 'reframe') {
      if (!gone) problems.push(`label ${reads} resolved as "${l.resolution}" but the crop still contains it ` +
        `(x ${(lx0*100).toFixed(0)}–${(lx1*100).toFixed(0)}%, y ${(ly0*100).toFixed(0)}–${(ly1*100).toFixed(0)}%)`);
      else notes.push(`label ${reads}: cropped out`);
    }
    if (l.resolution === 'furniture') {
      if (gone) notes.push(`label ${reads}: claimed hidden by furniture, actually cropped out entirely — fine`);
      else if (ly0 < PLAQUE_TOP) problems.push(`label ${reads} resolved as "furniture" but its top sits at ` +
        `${(ly0*100).toFixed(0)}% down the crop, above the stats plaque at ${(PLAQUE_TOP*100).toFixed(1)}% — it would be visible on the card`);
      else notes.push(`label ${reads}: sits at ${(ly0*100).toFixed(0)}% down, below the plaque — hidden`);
    }
  }
  return { problems, notes, outAspect, rot };
}

async function doCrop(sharp, photoArg, jsonArg) {
  let crop;
  try { crop = JSON.parse(fs.readFileSync(jsonArg, 'utf8')); }
  catch (e) { die(`${jsonArg} is not valid JSON — ${e.message}`); }

  /* the model's own verdict outranks every measurement below */
  if (crop.verdict === 'reshoot' || crop.verdict === 'ask') {
    console.error(`reframe-photo: verdict "${crop.verdict}" — not cropping.`);
    console.error(`  reason: ${crop.reason || '(none given)'}`);
    (crop.concerns || []).forEach(c => console.error(`  concern: ${c}`));
    console.error('  This belongs in VERIFY-QUEUE.md, not in a crop.');
    process.exit(2);
  }

  const meta = await sharp(photoArg).metadata();
  const SW = meta.width, SH = meta.height;
  const { problems, notes, outAspect, rot } = validate(crop, SW, SH, path.basename(photoArg));

  console.log(`reframe-photo: ${path.basename(photoArg)}  ${SW}x${SH}`);
  notes.forEach(n => console.log('  note: ' + n));
  if (problems.length) {
    problems.forEach(p => console.error('  PROBLEM: ' + p));
    die(`${problems.length} problem${problems.length > 1 ? 's' : ''} — nothing written. Fix the JSON or reshoot; do not hand-wave the crop.`);
  }

  const c = crop.crop;
  const left = Math.round(c.x * SW), top = Math.round(c.y * SH);
  const width = Math.min(Math.round(c.w * SW), SW - left), height = Math.min(Math.round(c.h * SH), SH - top);
  console.log(`  crop: ${width}x${height} at ${left},${top}  (aspect ${outAspect.toFixed(3)})`);
  if (rot) console.log(`  rotate: ${rot}° — applied after the crop, then trimmed inward to drop the wedges`);

  const out = REPL ? photoArg : photoArg.replace(/\.jpg$/i, '-reframed.jpg');
  if (DRY) { console.log(`  dry run — would write ${out}`); return; }

  let pipe = sharp(photoArg).extract({ left, top, width, height });
  if (rot) {
    /* rotate the cropped tile, then take the largest same-aspect rect that
       contains no transparent wedge, so the file never carries invented edges */
    const t = Math.abs(rot) * Math.PI / 180, s = Math.sin(t), co = Math.cos(t);
    const denom = co * co - s * s;
    let iw, ih;
    if (Math.abs(denom) < 1e-9) { iw = width / 2; ih = height / 2; }
    else { iw = (width * co - height * s) / denom; ih = (height * co - width * s) / denom; }
    const k = Math.min(iw / width, ih / height, 1);
    if (!(k > 0)) die(`a ${rot}° rotation leaves nothing of this crop — reduce the angle or the box`);
    const fw = Math.max(1, Math.floor(width * k)), fh = Math.max(1, Math.floor(height * k));
    const buf = await pipe.rotate(rot, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
    const rm = await sharp(buf).metadata();
    pipe = sharp(buf).extract({
      left: Math.round((rm.width - fw) / 2), top: Math.round((rm.height - fh) / 2),
      width: fw, height: fh });
    console.log(`  after straightening: ${fw}x${fh} (${(100 - k * 100).toFixed(1)}% trimmed to remove the wedges)`);
  }

  const buf = await pipe.jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toBuffer();
  fs.writeFileSync(out, buf);
  console.log(`  wrote ${out}  ${(buf.length / 1024).toFixed(0)} KB`);
  if (!REPL) console.log('  master untouched — pass --replace once you have looked at the result');
  console.log('  NEXT: node tools/optimise-photos.js   (the app loads photos/card/*.webp, not the master)');
  if (crop.objectPosition && crop.objectPosition !== '50% 40%')
    console.log(`  NEXT: add PHOTO_FOCUS['<slug>']='${crop.objectPosition}' in timber.html`);
}

/* ----------------------------------------------------------- selftest mode */
/* Spawns the real CLI against synthetic fixtures, so the refusals are tested
   through the same path a session uses — not through an internal shortcut. */
async function selftest(sharp) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reframe-selftest-'));
  const img = path.join(dir, 'plant.jpg');
  await sharp({ create: { width: 900, height: 1200, channels: 3, background: { r: 90, g: 120, b: 70 } } })
    .jpeg().toFile(img);

  const good = {
    sourcePx: { w: 900, h: 1200 }, featureVisible: true,
    featureBox: { x: 0.35, y: 0.28, w: 0.20, h: 0.18 },
    crop: { x: 0.05, y: 0.10, w: 0.80, h: 0.60 }, cropAspect: 1.0, rotateDeg: 0,
    featureInSafeBox: true, objectPosition: '50% 40%',
    labels: [{ box: { x: 0.60, y: 0.85, w: 0.18, h: 0.08 }, reads: 'BENCH TICKET', resolution: 'crop' }],
    exposure: { evAdjust: 0, whiteBalance: 'none' }, verdict: 'crop', concerns: [], reason: 'test'
  };
  const at = (over) => { const d = JSON.parse(JSON.stringify(good)); Object.assign(d, over); return d; };

  const cases = [
    ['happy path crops',            good,                                                          0, /crop: 720x720/],
    ['verdict reshoot refuses',     at({ verdict: 'reshoot' }),                                    2, /VERIFY-QUEUE/],
    ['verdict ask refuses',         at({ verdict: 'ask' }),                                        2, /VERIFY-QUEUE/],
    ['outpainting refuses',         at({ crop: { x: 0.30, y: 0.10, w: 0.80, h: 0.60 } }),          1, /no outpainting/],
    ['too-tall aspect refuses',     at({ crop: { x: 0.10, y: 0.05, w: 0.55, h: 0.67 }, cropAspect: 0.554 }), 1, /detail sheet/],
    ['too-wide aspect refuses',     at({ crop: { x: 0.02, y: 0.30, w: 0.96, h: 0.40 }, cropAspect: 1.8 }),   1, /card shows only/],
    ['aspect self-contradiction',   at({ cropAspect: 0.62 }),                                      1, /disagree with each other/],
    ['wrong source size refuses',   at({ sourcePx: { w: 3024, h: 4032 } }),                        1, /wrong photo for this JSON/],
    ['feature cropped out refuses', at({ featureBox: { x: 0.05, y: 0.80, w: 0.15, h: 0.12 } }),    1, /cuts the identifying feature out/],
    ['inpaint rung refuses',        at({ labels: [{ box: { x: 0.4, y: 0.3, w: 0.1, h: 0.05 }, reads: 't', resolution: 'inpaint' }] }), 1, /no inpainting rung/],
    ['false furniture claim refuses', at({ labels: [{ box: { x: 0.40, y: 0.25, w: 0.12, h: 0.06 }, reads: 't', resolution: 'furniture' }] }), 1, /would be visible on the card/],
    ['uncropped label refuses',     at({ labels: [{ box: { x: 0.40, y: 0.30, w: 0.12, h: 0.06 }, reads: 't', resolution: 'crop' }] }), 1, /still contains it/],
    ['over-rotation refuses',       at({ rotateDeg: 30 }),                                         1, /reshoot, not a straighten/],
    ['over-exposure refuses',       at({ exposure: { evAdjust: 1.5, whiteBalance: 'none' } }),     1, /exceeds ±0\.7 EV/],
  ];

  let pass = 0, fail = 0;
  for (const [name, json, wantCode, wantRe] of cases) {
    const jf = path.join(dir, 'c.json');
    fs.writeFileSync(jf, JSON.stringify(json));
    let code = 0, output = '';
    try {
      output = execFileSync(process.execPath, [__filename, img, jf, '--dry-run'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
    } catch (e) { code = e.status; output = (e.stdout || '') + (e.stderr || ''); }
    const ok = code === wantCode && wantRe.test(output);
    if (ok) { pass++; console.log(`  ok    ${name}`); }
    else {
      fail++;
      console.error(`  FAIL  ${name} — exit ${code} (wanted ${wantCode})` +
        (wantRe.test(output) ? '' : `, message did not match ${wantRe}`));
      console.error('        ' + output.trim().split('\n').slice(-2).join(' | '));
    }
  }
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`reframe-photo --selftest: ${pass}/${pass + fail} refusals behave`);
  if (fail) process.exit(1);
}

/* ------------------------------------------------------------------- main */
(async () => {
  if (SELFTEST || AUDIT_ALL) {
    /* these two run inside tests/run-all.js --fast, which must stay green on a
       checkout without sharp — same contract as optimise-photos --check */
    let s; try { s = require('sharp'); }
    catch { console.log('reframe-photo: sharp not installed — skipping'); return; }
    return SELFTEST ? selftest(s) : auditAll(s);
  }
  const sharp = loadSharp();
  if (AUDIT) {
    const [p] = args;
    if (!p) die('usage: reframe-photo.js --audit <photo.jpg>');
    if (!fs.existsSync(p)) die(`no such photo: ${p}`);
    return void await auditOne(sharp, p, false);
  }
  const [photoArg, jsonArg] = args;
  if (!photoArg || !jsonArg) die(
    'usage: reframe-photo.js <photo.jpg> <crop.json> [--replace] [--dry-run]\n' +
    '       reframe-photo.js --audit <photo.jpg>\n' +
    '       reframe-photo.js --audit-all\n' +
    '       reframe-photo.js --selftest');
  if (!fs.existsSync(photoArg)) die(`no such photo: ${photoArg}`);
  if (!fs.existsSync(jsonArg))  die(`no such crop json: ${jsonArg}`);
  await doCrop(sharp, photoArg, jsonArg);
})();
