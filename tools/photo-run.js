#!/usr/bin/env node
/* photo-run.js — the shooting sheet, regenerated from the deck instead of remembered.

     node tools/photo-run.js                 this month
     node tools/photo-run.js --month may     plan a return trip
     node tools/photo-run.js --html          also write photo-run.html (phone sheet)
     node tools/photo-run.js --all           list the WAIT cards too, not just count them

   WHY THIS EXISTS. A sheet like this was worked out once in a session and used to
   deal cards on 2026-08-11 — the ledger refers to "the shooting sheet" and grep
   finds it nowhere else in the repo. It was a chat, so it could not be re-run, and
   its numbers started rotting the moment a photo landed: the August split moved
   from 57/48 to 52/46 in two days without anybody being wrong about anything. A
   figure that decays daily belongs in a command, not a document.

   THREE BUCKETS, NOT TWO, and that is the whole design. The obvious version splits
   held cards into "peak is now" and "peak is not now", and it would have told
   Oscar to skip Corylus avellana 'Contorta' in August. He shot it anyway, the
   corkscrew stem reads perfectly, and it is a dealt card now — because peak is the
   peak of INTEREST, not the only month a plant is worth photographing. So:

     SHOOT  peak covers the month — go
     LOOK   peak is elsewhere, but the card's own prose names something that does
            not depend on peak: bark, stem, evergreen, berries, coloured foliage
     WAIT   peak is elsewhere and the interest is flowers — named month, come back

   LOOK only ever promotes a card out of WAIT. A false positive costs one glance on
   a lap he is already walking; a false negative just leaves the card where WAIT
   would have put it anyway. That asymmetry is why the keyword matching is allowed
   to be rough, and why it must never be able to demote a SHOOT.

   GROUPING IS DERIVED AND SAYS SO. There is no category field on these cards:
   `type` is empty on 95 of 98 (it carries the Schedule 9 banner and nothing else),
   and `root`, `bench` and `pots` are empty too. So the group comes from the height
   in `size`, which is real data, with climber / hedging / rose lifted out only
   where `uses` prose is unambiguous. Anything whose size will not parse lands in
   "unsorted" under its own heading rather than being quietly filed somewhere
   plausible. The rule prints with --rules so it can be argued with.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const pd = require('./plant-data.js');       /* the ONE reader — nothing re-parses timber.html */

const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'timber.html');
const argv = process.argv.slice(2);
const has = f => argv.includes(f);
const flag = f => { const i = argv.indexOf(f); return i === -1 ? null : argv[i + 1]; };

const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const FULL = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const monIdx = s => MON.indexOf(String(s).trim().toLowerCase().slice(0, 3));

/* "May-Jun, Aug-Sep" -> [4,5,7,8]; "Year-round" -> all. Returns null if it cannot
   be read, and the caller treats null as a hard error rather than an empty set —
   a peak that silently parses to nothing would file a card under WAIT forever. */
function peakMonths(peak) {
  const p = String(peak || '').trim();
  if (!p) return null;
  if (/year|all\s*year|ever/i.test(p)) return [...Array(12).keys()];
  const out = new Set();
  for (const seg of p.split(',')) {
    const parts = seg.split(/[-–—]/).map(s => s.trim()).filter(Boolean);
    if (!parts.length) return null;
    const a = monIdx(parts[0]); if (a < 0) return null;
    const b = parts.length > 1 ? monIdx(parts[1]) : a; if (b < 0) return null;
    let i = a;
    for (let n = 0; n < 12; n++) { out.add(i); if (i === b) break; i = (i + 1) % 12; }
  }
  return [...out].sort((x, y) => x - y);
}

/* ---------- what the camera should be pointed at ----------
   Read off the card's own `visual`, never invented. The raw line is printed under
   every entry regardless, because a keyword list is a hint and the prose is data. */
const BARK = /\b(bark|trunk|peeling|flaking|shredding|corkscrew|contorted|cane|culm)/i;
const STEM = /\b(stems?|twigs?)\b/i;
/* "stem" on its own is grammar far more often than it is a subject. The deck says
   "arching stems hung with pink lockets", "bare stems buried under golden flowers",
   "slender green stems carrying pompom flowers" — in every one the stem is how the
   FLOWER is held, and out of season there is nothing there to photograph. Dicentra,
   Forsythia, Kerria, Weigela and Kolkwitzia all reached the August list that way.
   A carrier verb next to the stem is the tell, and it is a reliable one here: the
   cards that genuinely sell a stem never use one — "young stems glow coral-red",
   "stems graduating yellow through orange", "velvety antler-like stems". Anything
   with real bark is matched outright and never consults this at all. */
const CARRIER = /\b(hung|buried|lined|carry|carrying|carries|smothered|studding|studded|clothing|clothed|covered|laden|wreath)/i;
const FEATURES = [
  ['flower', /\b(flower|bloom|blossom|catkin|panicle|raceme|umbel|floret|plume|spike|bell|star|trumpet|daisy|tassel|locket|pompom)/i],
  ['berries', /\b(berr|fruit|hip|haw|cone|pod|seedhead|lantern)/i],
  ['bark / stem', v => BARK.test(v) || (STEM.test(v) && !CARRIER.test(v))],
  ['evergreen', /\bevergreen|\bever-green/i],
  ['autumn colour', /autumn (colour|color|tint|foliage)|fiery|blaz/i],
  ['foliage', /\b(variegat|golden|gold\b|purple|silver|glossy|marbled|bronze|felted|frond|chartreuse|lime|dissected|fern-like|aromatic)/i],
  ['form', /\b(architectural|weeping|columnar|arching|rosette|clump|habit|canopy|tiered)/i],
];
const featuresOf = c => FEATURES
  .filter(([, t]) => typeof t === 'function' ? t(c.visual || '') : t.test(c.visual || ''))
  .map(([n]) => n);

/* Off-peak features that are still PHYSICALLY THERE out of season. Deliberately
   narrow, and narrower than it first was. Promoting on "foliage" or "form" put
   Dicentra spectabilis on the August list — it is fully dormant by then, there is
   nothing above ground to point a camera at — and Delphinium, whose leaves are
   tatty the moment the spike is over. Bark, stems and berries persist; leaves and
   shape are exactly what dies back. A flower out of season is what WAIT is for. */
const OFF_PEAK_OK = new Set(['berries', 'bark / stem', 'evergreen']);

/* ---------- where the plant physically stands ---------- */
const RULES = [
  ['Climbers', c => /\b(wall|trellis|obelisk|pergola|arch|climb|twin|through shrubs|structures)/i.test(c.uses || '')],
  ['Hedging & structure', c => /\b(hedg|topiary|screen)/i.test(c.uses || '')],
  ['Roses', c => /^rosa\b/i.test(c.latin || '')],
];
/* metres, taking the TOP of the band — "0.4-0.6m H × 0.2-0.3m W" -> 0.6, "60-90 cm H" -> 0.9 */
function heightM(size) {
  const h = String(size || '').split(/[x×]/i)[0];
  if (!h.trim()) return null;
  const nums = h.match(/[\d.]+/g);
  if (!nums) return null;
  const top = Math.max(...nums.map(Number));
  if (!isFinite(top)) return null;
  return /\bcm\b/i.test(h) ? top / 100 : top;
}
const BANDS = [
  [5, Infinity, 'Trees & tall specimens'],
  [1.5, 5, 'Shrubs'],
  [0.6, 1.5, 'Low shrubs & large perennials'],
  [0, 0.6, 'Herbaceous & low planting'],
];
function groupOf(c) {
  for (const [name, test] of RULES) if (test(c)) return name;
  const m = heightM(c.size);
  if (m === null) return 'Unsorted — size did not parse';
  for (const [lo, hi, name] of BANDS) if (m >= lo && m < hi) return name;
  return 'Unsorted — size did not parse';
}
const GROUP_ORDER = ['Trees & tall specimens', 'Shrubs', 'Low shrubs & large perennials',
  'Herbaceous & low planting', 'Climbers', 'Hedging & structure', 'Roses',
  'Unsorted — size did not parse'];

/* ---------- build ---------- */
const html = fs.readFileSync(HTML, 'utf8');
const held = pd.readHold(html);
const dealt = pd.readDeck(html);

/* Self-check before any counting: every peak string in the WHOLE file must parse,
   dealt cards included. A silent parse failure would mis-sort a card, and a sheet
   that is quietly wrong is worse than no sheet. */
const unreadable = [...dealt, ...held].filter(c => peakMonths(c.peak) === null);
if (unreadable.length) {
  console.error('ABORT: ' + unreadable.length + ' card(s) have a peak this tool cannot read:');
  unreadable.forEach(c => console.error('   ' + c.common + ' — ' + JSON.stringify(c.peak)));
  console.error('Fix the data or teach peakMonths() the format; do not ship a sheet built on a guess.');
  process.exit(1);
}

const monthArg = flag('--month');
let TARGET = new Date().getMonth();
if (monthArg) {
  const m = monIdx(monthArg);
  if (m < 0) { console.error('ABORT: unknown month ' + JSON.stringify(monthArg)); process.exit(1); }
  TARGET = m;
}

const cards = held.map(c => {
  const months = peakMonths(c.peak);
  const feats = featuresOf(c);
  const inSeason = months.includes(TARGET);
  const offPeakHold = feats.filter(f => OFF_PEAK_OK.has(f));
  return {
    ...c, months, feats, group: groupOf(c),
    bucket: inSeason ? 'SHOOT' : (offPeakHold.length ? 'LOOK' : 'WAIT'),
    why: inSeason ? feats : offPeakHold,
    /* PHOTO_SWAP exists because Avondale sells two things that cannot share a
       frame — bare-branch blossom and summer leaf. Name the actual pair rather
       than always saying "leaf + flower", which was wrong on every card whose
       two features were, say, berries and bark. */
    pair: feats.length >= 2 ? feats.slice(0, 2).join(' + ') : null,
  };
});
const shoot = cards.filter(c => c.bucket === 'SHOOT');
const look = cards.filter(c => c.bucket === 'LOOK');
const wait = cards.filter(c => c.bucket === 'WAIT');

/* Fewest return visits that catch every WAIT card in one of its own peak months.
   Greedy: repeatedly take the month covering the most cards not yet covered. */
function trips(list) {
  const left = new Set(list.map(c => c.latin));
  const out = [];
  while (left.size) {
    let best = -1, bestN = 0;
    for (let m = 0; m < 12; m++) {
      if (m === TARGET) continue;
      const n = list.filter(c => left.has(c.latin) && c.months.includes(m)).length;
      if (n > bestN) { bestN = n; best = m; }
    }
    if (best < 0) break;
    const got = list.filter(c => left.has(c.latin) && c.months.includes(best));
    got.forEach(c => left.delete(c.latin));
    out.push({ month: best, cards: got });
  }
  return { out, stranded: [...left] };
}
const diary = trips(wait);

/* ---------- terminal ---------- */
const byGroup = list => GROUP_ORDER
  .map(g => ({ group: g, items: list.filter(c => c.group === g) }))
  .filter(g => g.items.length);

console.log('');
console.log(`TIMBER SHOOTING SHEET — ${FULL[TARGET]}${monthArg ? ' (planned)' : ''}`);
console.log(`${dealt.length} dealt · ${held.length} held and waiting on a photograph`);
console.log('');
console.log(`  SHOOT  ${String(shoot.length).padStart(3)}  peak covers ${FULL[TARGET]}`);
console.log(`  LOOK   ${String(look.length).padStart(3)}  off-peak, but sells bark, stems, berries or evergreen — there anyway`);
console.log(`  WAIT   ${String(wait.length).padStart(3)}  flowers, and they are not out — come back`);
console.log('');

for (const bucket of [['SHOOT', shoot], ['LOOK', look]]) {
  const [name, list] = bucket;
  if (!list.length) continue;
  console.log('─'.repeat(72));
  console.log(name === 'SHOOT' ? 'SHOOT NOW' : 'WORTH A LOOK WHILE YOU ARE THERE');
  console.log('─'.repeat(72));
  if (name === 'LOOK') console.log('  Bark, stems, berries and evergreen do not wait for a flowering month.\n  Judge it on the day — this is read off the card\'s prose, not a horticultural call.');
  for (const { group, items } of byGroup(list)) {
    console.log('\n  ' + group.toUpperCase() + '  (' + items.length + ')');
    for (const c of items) {
      const shot = c.why.length ? c.why.join(' + ') : 'whatever the card sells';
      console.log(`    ${c.common}`);
      console.log(`      ${c.latin}  ·  ${c.size || 'size not given'}  ·  peak ${c.peak}`);
      console.log(`      shoot: ${shot}${c.pair ? `   [two shots: ${c.pair} — a PHOTO_SWAP pair]` : ''}`);
      if (c.visual) console.log(`      card:  ${c.visual.slice(0, 96)}${c.visual.length > 96 ? '…' : ''}`);
    }
  }
  console.log('');
}

console.log('─'.repeat(72));
console.log('COME BACK FOR THESE  (' + wait.length + ')');
console.log('─'.repeat(72));
for (const t of diary.out) {
  console.log(`\n  ${FULL[t.month].toUpperCase()} — ${t.cards.length} card${t.cards.length > 1 ? 's' : ''}`);
  if (has('--all')) t.cards.forEach(c => console.log(`      ${c.common}  ·  peak ${c.peak}`));
}
if (diary.stranded.length) console.log('\n  NOT COVERED BY ANY VISIT: ' + diary.stranded.join(', '));
console.log(`\n  ${diary.out.length} visit${diary.out.length > 1 ? 's' : ''} catches all ${wait.length}.` +
  (has('--all') ? '' : '  Add --all to list them.'));

console.log('\nWhen a photo lands:  node tools/deal-plant.js "<latin>" <photo>');
console.log('Then once:           node tests/run-all.js --jobs 3\n');

if (has('--rules')) {
  console.log('GROUPING RULE (derived — there is no category field on these cards)');
  console.log('  1. uses mentions wall/trellis/obelisk/pergola/arch/climb  -> Climbers');
  console.log('  2. uses mentions hedge/topiary/screen                     -> Hedging & structure');
  console.log('  3. latin begins Rosa                                      -> Roses');
  console.log('  4. otherwise the top of the height band in `size`:');
  BANDS.forEach(([lo, hi, n]) => console.log(`       ${lo}m${hi === Infinity ? '+' : '–' + hi + 'm'}  -> ${n}`));
  console.log('  5. size will not parse                                    -> Unsorted\n');
}

/* ---------- phone sheet ---------- */
if (has('--html')) {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const card = c => `<li data-k="${esc(c.latin)}">
      <label><input type="checkbox"><span class="tick" aria-hidden="true"></span>
        <span class="b">
          <b>${esc(c.common)}</b>
          <i>${esc(c.latin)}</i>
          <em>${esc(c.why.length ? c.why.join(' + ') : 'whatever the card sells')}${c.pair ? ' · two shots' : ''}</em>
          <small>${esc(c.size || 'size not given')} · peak ${esc(c.peak)}</small>
          <p>${esc(c.visual || '')}</p>
        </span></label></li>`;
  const section = (title, sub, list) => !list.length ? '' : `
  <section><h2>${esc(title)}</h2><p class="sub">${esc(sub)}</p>
  ${byGroup(list).map(g => `<h3>${esc(g.group)} <span>${g.items.length}</span></h3>
    <ul>${g.items.map(card).join('')}</ul>`).join('')}
  </section>`;
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Timber shooting sheet — ${FULL[TARGET]}</title>
<style>
 :root{--bg:#0c1810;--bg2:#0f2117;--panel:#11241a;--line:rgba(216,189,120,.18);
   --ink:#f4f1e8;--muted:rgba(244,241,232,.6);--faint:rgba(244,241,232,.38);
   --gold:#f5c451;--leaf:#4cd787;--warn:#ff9c94}
 *{box-sizing:border-box}
 body{margin:0;background:var(--bg);background-image:radial-gradient(120% 60% at 50% -10%,var(--bg2),var(--bg));
   background-attachment:fixed;color:var(--ink);
   font:16px/1.55 ui-sans-serif,-apple-system,"Segoe UI",Roboto,sans-serif;
   padding:20px 16px 80px;max-width:44rem;margin:0 auto;-webkit-text-size-adjust:100%}
 h1{font:700 26px/1.15 Georgia,serif;margin:0 0 4px}
 .meta{font:11px/1.5 ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:18px}
 .tot{display:flex;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden;margin-bottom:26px}
 .tot div{flex:1;background:var(--panel);padding:11px 12px}
 .tot b{display:block;font:700 22px/1 Georgia,serif;color:var(--gold)}
 .tot b.k{color:var(--leaf)} .tot b.w{color:var(--warn)}
 .tot span{font:10px/1.4 ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
 h2{font:700 19px/1.2 Georgia,serif;margin:30px 0 2px;padding-top:18px;border-top:2px solid var(--gold)}
 .sub{margin:0 0 6px;color:var(--muted);font-size:14px}
 h3{font:11px/1.4 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;
   color:var(--gold);margin:22px 0 8px;display:flex;gap:8px;align-items:baseline}
 h3 span{color:var(--faint)}
 ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:1px;
   background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden}
 li{background:var(--panel)}
 label{display:flex;gap:12px;padding:12px 14px;cursor:pointer;align-items:flex-start}
 input{position:absolute;opacity:0;width:0;height:0}
 .tick{flex:0 0 20px;width:20px;height:20px;margin-top:2px;border:1.5px solid var(--line);
   border-radius:6px;display:grid;place-items:center;transition:background .15s,border-color .15s}
 .tick::after{content:"";width:9px;height:5px;border:2px solid #0c1810;border-top:0;border-right:0;
   transform:rotate(-45deg) scale(0);transition:transform .15s}
 input:checked+.tick{background:var(--leaf);border-color:var(--leaf)}
 input:checked+.tick::after{transform:rotate(-45deg) scale(1)}
 input:focus-visible+.tick{outline:2px solid var(--gold);outline-offset:2px}
 .b{display:flex;flex-direction:column;gap:1px;min-width:0}
 b{font-size:16px} i{font-style:italic;color:var(--muted);font-size:13px}
 em{font-style:normal;color:var(--gold);font-size:13px;font-weight:600}
 small{color:var(--faint);font:11px/1.5 ui-monospace,monospace}
 p{margin:4px 0 0;color:var(--muted);font-size:13px}
 li:has(input:checked) .b{opacity:.42}
 li:has(input:checked) b{text-decoration:line-through}
 footer{margin-top:34px;padding-top:16px;border-top:1px solid var(--line);color:var(--faint);font-size:13px}
 code{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:var(--gold)}
 @media (prefers-reduced-motion:reduce){.tick,.tick::after{transition:none}}
</style></head><body>
<h1>Shooting sheet</h1>
<div class="meta">${esc(FULL[TARGET])} · ${dealt.length} dealt · ${held.length} held</div>
<div class="tot">
  <div><b class="k">${shoot.length}</b><span>shoot</span></div>
  <div><b>${look.length}</b><span>worth a look</span></div>
  <div><b class="w">${wait.length}</b><span>come back</span></div>
</div>
${section('Shoot now', `Peak covers ${FULL[TARGET]}. Ticks are saved on this device.`, shoot)}
${section('Worth a look', 'Off-peak, but the card sells bark, stems, berries or evergreen foliage — things that are there whatever the month. Read the prose and judge it on the day; this is a hint from the card, not a horticultural call.', look)}
<section><h2>Come back for these</h2>
<p class="sub">${wait.length} cards whose flowers are not out. ${diary.out.length} visit${diary.out.length > 1 ? 's' : ''} catches all of them.</p>
<ul>${diary.out.map(t => `<li><label><span class="b"><b>${esc(FULL[t.month])}</b>
  <em>${t.cards.length} card${t.cards.length > 1 ? 's' : ''}</em>
  <p>${esc(t.cards.map(c => c.common).join(' · '))}</p></span></label></li>`).join('')}</ul></section>
<footer>Generated by <code>node tools/photo-run.js --html</code> from the deck itself.
Counts move every time a photo lands — regenerate rather than trusting this copy.
When a photo arrives: <code>node tools/deal-plant.js "&lt;latin&gt;" &lt;photo&gt;</code></footer>
<script>
 /* ticks survive closing the page — a lap of the centre is not one sitting */
 var K='timber-shoot-'+${JSON.stringify(FULL[TARGET])};
 var done={};try{done=JSON.parse(localStorage.getItem(K))||{}}catch(e){}
 document.querySelectorAll('li[data-k]').forEach(function(li){
   var k=li.dataset.k,box=li.querySelector('input');
   if(!box)return;
   box.checked=!!done[k];
   box.addEventListener('change',function(){
     if(box.checked)done[k]=1;else delete done[k];
     try{localStorage.setItem(K,JSON.stringify(done))}catch(e){}
   });
 });
</script></body></html>`;
  const out = path.join(ROOT, 'photo-run.html');
  fs.writeFileSync(out, page);
  console.log('phone sheet -> ' + path.relative(ROOT, out) + '  (gitignored; open it on the phone you shoot with)\n');
}
