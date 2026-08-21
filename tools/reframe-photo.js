#!/usr/bin/env node
/* reframe-photo.js — apply a crop decision from PHOTO-REFRAME-BRIEF.md to a master.
   Run: NODE_PATH=/opt/node22/lib/node_modules node tools/reframe-photo.js <photo> <crop.json>
        ... --replace   overwrite the master in place (default writes *-reframed.jpg)
        ... --dry-run   validate and report, write nothing

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
   refusal here is the point of the tool, not a failure of it. */

const fs = require('fs');
const path = require('path');

/* ---- card geometry, from timber.html. See PHOTO-REFRAME-BRIEF.md §2. ---- */
const CARD_ASPECT   = 0.6165;  /* .tphoto 348.8x565.7 on a 420x600 card */
const PLAQUE_TOP    = 0.622;   /* below this fraction of the photo, furniture covers it */
const ASPECT_MIN    = 0.75;    /* 3:4 portrait — narrower starves the 16:10 detail sheet */
const ASPECT_MAX    = 1.00;    /* square — wider loses too much width to the card crop */
const SAFE_X        = [0.10, 0.90];   /* visible on card AND detail sheet */
const SAFE_Y        = [0.30, 0.60];
const EV_LIMIT      = 0.7;
const ROT_LIMIT     = 15;
const EPS           = 0.005;

const args  = process.argv.slice(2);
const flag  = f => { const i = args.indexOf(f); if (i >= 0) args.splice(i, 1); return i >= 0; };
const DRY   = flag('--dry-run');
const REPL  = flag('--replace');
const [photoArg, jsonArg] = args;

const die  = (...m) => { console.error('FAIL reframe-photo:', ...m); process.exit(1); };
const usage = () => die('usage: reframe-photo.js <photo.jpg> <crop.json> [--replace] [--dry-run]');

if (!photoArg || !jsonArg) usage();
if (!fs.existsSync(photoArg)) die(`no such photo: ${photoArg}`);
if (!fs.existsSync(jsonArg))  die(`no such crop json: ${jsonArg}`);

let crop;
try { crop = JSON.parse(fs.readFileSync(jsonArg, 'utf8')); }
catch (e) { die(`${jsonArg} is not valid JSON — ${e.message}`); }

/* ------------------------------------------------------------------ checks */
const problems = [], notes = [];
const num = v => typeof v === 'number' && Number.isFinite(v);
const box = b => b && ['x','y','w','h'].every(k => num(b[k]));

/* 1. the model's own verdict outranks every measurement below */
const verdict = crop.verdict;
if (!['crop','as-is','reshoot','ask'].includes(verdict))
  problems.push(`verdict must be crop|as-is|reshoot|ask, got ${JSON.stringify(verdict)}`);
if (verdict === 'reshoot' || verdict === 'ask') {
  console.error(`reframe-photo: verdict "${verdict}" — not cropping.`);
  console.error(`  reason: ${crop.reason || '(none given)'}`);
  (crop.concerns || []).forEach(c => console.error(`  concern: ${c}`));
  console.error('  This belongs in VERIFY-QUEUE.md, not in a crop.');
  process.exit(2);
}
if (crop.featureVisible === false)
  problems.push('featureVisible is false — a crop cannot recover a feature that is not in the frame');

/* 2. the crop box must be a real box inside the original */
if (!box(crop.crop)) problems.push('crop must be {x,y,w,h} numbers, fractions of the original');
else {
  const c = crop.crop;
  if (c.w <= 0 || c.h <= 0) problems.push('crop width and height must be positive');
  if (c.x < -EPS || c.y < -EPS) problems.push(`crop starts outside the frame (x ${c.x}, y ${c.y})`);
  if (c.x + c.w > 1 + EPS || c.y + c.h > 1 + EPS)
    problems.push(`crop extends past the frame (x+w ${(c.x+c.w).toFixed(3)}, y+h ${(c.y+c.h).toFixed(3)}) — no outpainting`);
}

/* 3. rotation and exposure stay inside what counts as correction, not alteration */
const rot = num(crop.rotateDeg) ? crop.rotateDeg : 0;
if (Math.abs(rot) > ROT_LIMIT) problems.push(`rotateDeg ${rot} exceeds ±${ROT_LIMIT}° — that is a reshoot, not a straighten`);
const ev = crop.exposure && num(crop.exposure.evAdjust) ? crop.exposure.evAdjust : 0;
if (Math.abs(ev) > EV_LIMIT) problems.push(`exposure.evAdjust ${ev} exceeds ±${EV_LIMIT} EV`);
if (ev !== 0) notes.push(`exposure: ${ev > 0 ? '+' : ''}${ev} EV requested — NOT applied by this tool, see §7`);
if (crop.exposure && crop.exposure.whiteBalance && crop.exposure.whiteBalance !== 'none')
  notes.push(`white balance: ${crop.exposure.whiteBalance} reported — NOT applied by this tool, see §7`);

(async () => {
  let sharp;
  try { sharp = require('sharp'); }
  catch (e) { die('needs sharp:  npm i -g sharp   (then run with NODE_PATH=/opt/node22/lib/node_modules)'); }

  const meta = await sharp(photoArg).metadata();
  /* EXIF ORIENTATION. sharp reports the SENSOR dimensions, but a phone photo with
     an orientation flag of 5-8 is displayed rotated, and that displayed frame is
     the one a vision model saw and wrote its coordinates against. Reading raw
     width/height here made every such photo fail with "wrong photo for this JSON"
     and a nonsense aspect — orientation 6 is the common case on this project's
     Galaxy captures, so it was roughly half of them. Swap the axes for the check
     and the arithmetic, and bake the rotation in before extracting so the crop
     box means what the model meant. Found 2026-08-17 on a Deutzia and a Magnolia. */
  const swapped = meta.orientation >= 5 && meta.orientation <= 8;
  const SW = swapped ? meta.height : meta.width;
  const SH = swapped ? meta.width  : meta.height;
  if (swapped) notes.push(`EXIF orientation ${meta.orientation} — sensor is ${meta.width}x${meta.height}, displayed ${SW}x${SH}; crop is applied to the displayed frame`);

  /* 4. if the model reported the source size, it must be the size we are holding —
        a mismatch means the coordinates describe a different file */
  if (crop.sourcePx && num(crop.sourcePx.w) && num(crop.sourcePx.h)) {
    if (crop.sourcePx.w !== SW || crop.sourcePx.h !== SH)
      problems.push(`sourcePx ${crop.sourcePx.w}x${crop.sourcePx.h} but ${path.basename(photoArg)} is ${SW}x${SH} — wrong photo for this JSON`);
  } else notes.push('sourcePx not reported — could not confirm the JSON describes this file');

  /* 5. output aspect: must serve BOTH the card (0.6165) and the detail sheet (16:10) */
  let outAspect = null;
  if (box(crop.crop)) {
    outAspect = (crop.crop.w * SW) / (crop.crop.h * SH);
    if (outAspect < ASPECT_MIN - 0.01 || outAspect > ASPECT_MAX + 0.01)
      problems.push(`crop aspect ${outAspect.toFixed(3)} is outside ${ASPECT_MIN}–${ASPECT_MAX}` +
        (outAspect < ASPECT_MIN
          ? ` — too tall; at ${outAspect.toFixed(2)} the 16:10 detail sheet shows only ${(outAspect/1.6*100).toFixed(0)}% of the height`
          : ` — too wide; the card would show only ${(CARD_ASPECT/outAspect*100).toFixed(0)}% of the width`));
    if (num(crop.cropAspect) && Math.abs(crop.cropAspect - outAspect) > 0.02)
      problems.push(`cropAspect says ${crop.cropAspect} but the box computes to ${outAspect.toFixed(3)} — the model's numbers disagree with each other`);
  }

  /* 6. does the identifying feature actually land in the zone both surfaces show?
        featureBox is in ORIGINAL coordinates, so map it into the crop first. */
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

  /* 7. labels. "furniture" is a claim the stats plaque will hide it — check that. */
  for (const l of (crop.labels || [])) {
    const reads = l.reads ? `"${l.reads}"` : 'unnamed label';
    if (l.resolution === 'reshoot') problems.push(`label ${reads} resolved as "reshoot" — this photo is not croppable, it is re-shootable`);
    if (!['crop','reframe','furniture','reshoot'].includes(l.resolution))
      problems.push(`label ${reads} has resolution ${JSON.stringify(l.resolution)} — no such rung. There is no inpainting rung.`);
    if (!box(l.box)) { notes.push(`label ${reads}: no box given, could not verify`); continue; }
    const c = crop.crop;
    if (!box(c)) continue;
    /* where does the label sit once the crop is applied? */
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

  /* ---------------------------------------------------------------- report */
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

  /* .rotate() with no argument applies the EXIF orientation, so extract() below
     operates on the displayed frame the crop box was measured against. */
  let pipe = sharp(photoArg).rotate().extract({ left, top, width, height });
  let finalW = width, finalH = height;
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
    finalW = Math.max(1, Math.floor(width * k)); finalH = Math.max(1, Math.floor(height * k));
    const buf = await pipe.rotate(rot, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
    const rm = await sharp(buf).metadata();
    pipe = sharp(buf).extract({
      left: Math.round((rm.width - finalW) / 2), top: Math.round((rm.height - finalH) / 2),
      width: finalW, height: finalH });
    console.log(`  after straightening: ${finalW}x${finalH} (${(100 - k * 100).toFixed(1)}% trimmed to remove the wedges)`);
  }

  const buf = await pipe.jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toBuffer();
  fs.writeFileSync(out, buf);
  console.log(`  wrote ${out}  ${(buf.length / 1024).toFixed(0)} KB`);
  if (!REPL) console.log('  master untouched — pass --replace once you have looked at the result');
  console.log('  NEXT: node tools/optimise-photos.js   (the app loads photos/card/*.webp, not the master)');
  if (crop.objectPosition && crop.objectPosition !== '50% 40%')
    console.log(`  NEXT: add PHOTO_FOCUS['<slug>']='${crop.objectPosition}' in timber.html`);
})();
