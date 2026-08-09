# Next-brick ledger

## timber  [active]
brick: Source 1200px photos for the five climbers (Nelly Moser, PPE, montana
  rubens, armandii, Russian Vine) — their cards still fall back to leaf gradients.
since: 2026-08-05  sessions-unchanged: 3
progress: 2026-08-09 (evening) — **Pink Kousa Dogwood: deck 131 -> 132. First card
  added deliberately WITHOUT a cultivar name.** Oscar sent three benched Cornus
  kousa photos with an AI-generated cultivar identification ('Milky Way',
  'Satomi', 'Heart Throb', 'Scarlet Fire', 'Venus') and asked what I made of it.
  Answer: confident and mostly unsupportable. Pink kousa bracts shift with
  temperature, light, flower age and plant maturity, so the same tree a fortnight
  apart reads as two cultivars — and the writeup's groupings were built on exactly
  that. Two claims are contradicted by the photos themselves: bract length ≈ leaf
  length **rules out 'Venus'** (bracts about double, and it is sold as C. ×
  elwinortonii anyway), and the narrow finely-acuminate bracts **argue against
  'Heart Throb'**, which is sold on broad rounded overlapping bracts. What the
  photos DO establish, and what went on the card: this is a genuinely pink-bracted
  selection, not a white form ageing pink — the colour is deep and even while the
  central head is still tight and green. Also found: **the two cream-bracted
  photos are different plants** (long-acuminate with gaps and pink tips vs rounded
  overlapping with a pink base flush); bract shape is far more stable than colour,
  so they must not be merged into one card.
  Oscar wanted the pink one in the deck, so it went in as a SPECIES card with cvs
  reading "unnamed pink form — the species is cream-white". Horticultural data is
  inherited from the deck's existing Cornus kousa 'Zuilb1' card rather than
  invented, and that is recorded in the JSON's uncertain list; only the size is
  changed, to the species' spreading 4-8m rather than the columnar cultivar's.
  This is the Sweet Cupcake lesson applied before the fact rather than after.
  Photo focus 50% 52% — the default clipped the hero bloom's lower bracts behind
  the stats plaque, and bract shape is the identifiable feature here.
  Good news on the tooling: this was the first plant added through add-plant.js
  since the trailing-comma fix, and it inserted cleanly — 131 -> 132 with the
  derived count agreeing. The EXIF path is also fine: the source reads 4000x3000
  landscape from its SOF header but carries an orientation tag, and the tool
  staged it correctly as 1200x1600 portrait.
  Build r24. Deck now has THREE Cornus kousa entries, two of which are the
  duplicate 'Flower Tower' pair from item 8 — worth resolving together.
progress: 2026-08-09 (later still) — **Jelena Witch Hazel + Mountain Hydrangea:
  deck 129 -> 131. Two real bugs in the add-plant tooling found by using it.**
  Both from Oscar's own photos, both first-of-kind in a small way: 'Jelena' is the
  second Hamamelis × intermedia (pairs with 'Arnold Promise' like the two Acer
  palmatums), Hydrangea serrata is the seventh hydrangea and the first species
  rather than a named cultivar.
  **THE TOOLING BUG THAT MATTERS: `add-plants-bulk.js` corrupted timber.html.**
  The r18 csv round-trip writes the deck's last row with NO trailing comma; both
  add-plant.js and add-plants-bulk.js append new rows straight before the `];`,
  assuming there is one. Result: `sunMin:40}` immediately followed by `{common:` —
  invalid JS, PLANTS unparseable, **the whole app dead**. This was armed the moment
  r18 reformatted the file and would have hit whoever added the next plant; it hit
  this one. The tools now insert the separator when the previous row needs it,
  verified by simulating a comma-less tail and re-parsing. Worse, the run left the
  broken file ON DISK — its count guard fired after the write, not before — so both
  tools now re-parse what they wrote and **roll timber.html back** if it doesn't
  come out clean, matching what r18 already did for plants-tool.js.
  Second bug, same run: the bulk tool counted the deck as every `latin:` in the
  file, so the 5 on-hold plants were included and 129+2 was reported as "136". It
  now counts dealt rows only. The single-plant add-plant.js always got this right,
  which is why it never showed up.
  PHOTO: the hydrangea shot is unusually tall (1200×2768) and the default 50% 40%
  crop showed only the red autumn foliage, clipping the flowers off the top edge —
  fighting the card's own Jul-Sep bloom band. Focus set to 45% 16% so a white
  lacecap sits in frame WITH the red leaves. Jelena needed no focus entry; the
  default frames the backlit copper ribbons perfectly.
  TWO THINGS FOR OSCAR, both in VERIFY-QUEUE rather than guessed at: the serrata
  card's hue is 220 (blue, the species archetype) while **his photo shows a
  white-flowered form** — and there is a nursery label in the shot, so this may
  want to be a cultivar card like the deck's other six hydrangeas; and the two
  Hamamelis × intermedia cards disagree on sunNeed (65 vs 80) and thirst (9 vs 11)
  for cultivars of one hybrid, which now sit side by side in any "witch hazel"
  search. Toxicity rides in `resilience` again (Lonicera precedent) — the fifth
  card to borrow a field for something the schema does not have.
  Build r23. Fast checks 5/5 throughout; full gate at the end.
progress: 2026-08-09 (later) — **Choisya settled + Japanese Knotweed added: deck
  128 -> 129. First plant work built on the r18 toolchain rather than the old
  per-plant routine.** Started on the old system by mistake — the card was built,
  the suites run card-by-card, and it cost minutes per gate at 129 cards. Redone
  on top of r18: `run-all.js --fast` gates the data work in **0.3s** and the
  browser suites run once, at the end. That is the whole difference; nothing about
  the card changed. The fast checks earned it immediately — they caught a stale
  `plants.csv` and a stale build stamp within a second of the row landing, both of
  which the old routine would only have surfaced after a full browser run.
  CHOISYA: the deck audit's last KNOWN_GAP, and VERIFY-QUEUE item 4. Filled from
  Oscar's JSON — aspect is now the real facing East / South / West (compass and
  light bar both render), growth 9 / thirst 6 / care 4 / sun 75 floor 40, plus
  visual, water, soil warning, prune, uses. **KNOWN_GAPS is empty for the first
  time.** Three calls went against the JSON and all are written up in VERIFY-QUEUE
  item 4 rather than buried here: pestRisk 3 not 8 (PLANT-BRIEF uses Choisya as
  its own "0–3 bulletproof" anchor — if 8 is right, the brief needs a new anchor
  plant, so this is a rubric question, not a card question); hue stays 150 per
  protocol v12.4, though the deck is genuinely split on white-flower hue and it is
  worth settling once; peak Apr–May -> May-Jun, which moves the card in the "In
  season now" filter. cvs merged, not replaced, so 'Sundance' and 'Aztec Pearl'
  survive alongside the synonym.
  KNOTWEED: the deck's **fourth compliance card and the first NEVER-STOCK one** —
  it is here to be recognised and reported, not sold. Compliance borrows the
  Gunnera fields again (v12.21). Deck records: growthSpeed 20 and careLevel 20 are
  both firsts — careLevel is the containment and legal burden, not difficulty
  keeping it alive — against pestRisk 2, genuinely pest-free. H7, hardiest card in
  the deck. plant-sense passes it clean, which is worth noting: a card whose prose
  says "rampant" and whose ratings say 20/20 is self-consistent.
  Photo is Oscar's AI composite (fire and lightning, deliberately) — recorded in
  CREDITS.json as his, `commercialUseCleared: false` because the generator's terms
  are unrecorded. VERIFY-QUEUE item 5 covers both that and the ID weakness: the
  red-flecked cane the card's own `visual` names is not visible in the shot.
  THE REAL FIND — **app-test was never flaky; the menu is broken on a phone.**
  It had been failing at a different line each run, which reads like timing, and
  the earlier session wrote it off as container slowness. It is not: the menu
  panel is `height:100%` with no overflow handling, and its filter chips are
  GENERATED FROM THE DECK, so the panel grows every time a plant is added. At 390
  × 844 the content is 1098px tall. **"Reset progress" sat 36px below the fold and
  could not be tapped at all** — Playwright's retry loop sometimes shifted enough
  to land the click and sometimes didn't, which is where the "flaky" impression
  came from. Japanese Knotweed's ⚠ NEVER STOCK chip pushed it to 68px. Fixed at
  the cheapest layer per CORRECTION-PROTOCOL §4.2 — `overflow-y:auto` +
  `overscroll-behavior:contain` on `.sheet .panel` (contained so the deck behind
  it can never pull-to-refresh, which perf/edge tests guard). Per §4.1 the defect
  is now something the suite can SEE: app-test asserts every menu row is reachable
  (95 checks, was 94), verified failing on an unfixed copy first. **This bug
  reached a real phone and grows with every plant added** — anything else keyed to
  deck size deserves the same look.
  PROVENANCE CORRECTED — **Oscar took every photo himself; the r18 record said
  otherwise.** CREDITS.json marked 146 of 152 photos "unrecorded / licence
  unknown", reasoning that plant-images-tool.js had fetched them from Wikimedia
  and written the paperwork into gitignored `plant-images/` where it was lost.
  Oscar says he shot them all, and the evidence backs him, not the inference:
  **the downloader has never been run** (the README says so in the same file that
  drew the conclusion, and it needs network the container lacked), `plant-images/`
  was never committed because nothing was ever downloaded, and the photo register
  describes ~100 images in detail without once naming an external source. The
  missing paperwork was read as lost; it never existed. All 150 photographs are now
  recorded as his own and cleared. EXIF can't corroborate either way — add-plant.js
  re-encodes through a canvas and strips metadata — so the record rests on the
  owner's account plus those three checks, which is the right basis. Only the two
  AI images stay uncleared: knotweed (**ChatGPT + Gemini**, per Oscar) and the
  Ajuga v12.5 remake. That closes the VERIFY-QUEUE photo section entirely and
  removes the "not fine for commercial use" warning the README carried.
  Worth noting as a pattern: this was a confident, well-written, thoroughly
  documented conclusion built on one unchecked assumption, and it had already been
  propagated into three files. Ask the owner before inferring provenance.
  ALSO: `photo-credits.js --init` re-derives every photo's origin commit from
  `git log --all`, so running it in a container with more remote branches fetched
  rewrote 56 unrelated provenance records. Backed out — the single new entry was
  added surgically instead. **The tool's output depends on which refs happen to be
  local**, which is worth a guard before anyone runs --init again.
  Build r19. Fast checks 5/5.
progress: 2026-08-09 — **integrity pass: nothing was lost, and the paths that
  could lose things are closed.** Oscar asked for the five risks from the r17
  review fixed properly, worried progress had already gone missing.
  AUDIT FIRST: new `tools/data-audit.js --history` replays all 73 commits that
  touched timber.html. Verdict — **no card has ever been silently dropped.** All
  128 dealt cards have their photo. The single disappearance is Holly Osmanthus
  'Tricolor', deliberately renamed to Goshiki Holly Olive at 68d61a9 ('Goshiki'
  is the accepted name, 'Tricolor' the synonym, recorded in the card's cvs); the
  design line had separately ported a 'Goshiki' card so both names co-existed as
  duplicates at 2e91159 and the r17 merge correctly kept one. Recorded in
  data/renames.json so it never reads as a loss again.
  THE LIVE BOMB: `plants-tool.js import` rebuilt cards from its FIELDS list, and
  `sunMin` — on 132 cards — was not in it. One import would have wiped the sun-band
  floor deck-wide. Export also never saw PLANTS_ON_HOLD, so a round-trip deleted
  every held plant. Both fixed: csv carries a `held` column and round-trips both
  blocks, the tool REFUSES to write if it meets a card field with no column, an
  import that would remove a plant needs --allow-removals, backups are timestamped
  in .backups/ (the old single .bak was eaten by a second import), and the write is
  re-parsed and rolled back if it breaks. Round-trip verified lossless field-for-field
  across all 133 cards and idempotent (second pass = zero-byte diff). Cards are
  written back in the hand-authored style, not one-line JSON, so a two-field edit
  stays a two-line diff.
  SECOND VERIFICATION PASS: `tools/plant-sense.js` checks every card against
  ITSELF — prose vs ratings, margin arithmetic vs quoted prices, size vs "dwarf",
  peak vs claimed season. First run threw 35 "contradictions"; CARD-STATS.md showed
  my pest and care rules were inverted and three parsers were wrong, so the tool was
  fixed, not the data. Now 5 real findings, all written up in the new VERIFY-QUEUE.md
  rather than guessed at: five held climbers have no H × W split (rails blank),
  Meyer's Lemon and Kinme holly may be a size band too high, two margin bands sit
  below their own gross arithmetic, and Choisya's ratings are still open.
  ALSO: NPLANTS is now derived from timber.html in all four suites instead of
  hand-typed in four places (add-plant/add-plants-bulk patched to match — their
  regex had become a silent no-op); `tools/build-stamp.js` puts a content hash in
  the build number so a stale stamp fails the run instead of reaching a phone, and
  the Pages workflow now gates on it and verifies the SERVED BYTES after deploy;
  `tools/template-geometry.js` turns card-height changes into arithmetic — validated
  by reproducing the real v12 (543px) template from v14 to 4 decimal places, which
  also proved the rails are bottom-anchored, not top as the v14 comment says;
  `tools/deck-diff.js` compares plant data between branches semantically so the next
  two-line merge is not archaeology. One runner (`tests/run-all.js`) plus an optional
  pre-push hook.
  FOUND EN ROUTE: features-test's weakest-plant bias assertion was a coin flip. Its
  `bias >= 18` threshold was calibrated for a 57-plant deck; at 128 plants 18 IS the
  expected value, so it failed about half the time on chance alone and had been
  passing on luck. Threshold and sample size are now derived from the deck size with
  a 4-sigma margin — same disease as the hardcoded NPLANTS, same cure.
  PROVENANCE (the item Oscar asked to leave till last): `plant-images-tool.js` did
  record licence, author and source URL for every photo it fetched — into
  `plant-images/`, which is gitignored, so 146 records were written to scratch and
  lost with the container while the images stayed in git. New `photos/CREDITS.json`
  is a committed entry per photo; git history establishes 5 as Oscar's own, the rest
  are honestly marked unrecorded/unknown rather than given a guessed licence. `pick`
  now writes into the committed manifest. Fine for a learning tool; the unrecorded
  ones need re-establishing before any card is shown to a garden centre commercially.
  Build r18. All 14 checks green.
progress: 2026-08-08 (later still) — **v14 elongated template: the card is natively
  420×600.** Oscar wanted the card longer; a ChatGPT frame regeneration drifted
  (restyled gold, redrawn ornaments, dropped the baked DOUBLE TAP TO MASTER strip)
  and was rejected in favour of slicing the v12 art from its own pixels:
  art/frame-600.png = frame-full + 150px of plain spine mirror-tiled in at a
  measured plain row (row-continuous seams; interior seams invisible under the
  live photo). Top furniture keeps px-from-top, bottom furniture px-from-bottom,
  so overlays still land on their baked twins exactly. Extra height all goes to
  the photo; runtime stretch cap cut to 1.12. card-builder + manifest (v3) +
  protocol changelog updated in lockstep. Build r16. All nine suites + layout
  audit green, zero audit-rule changes. Parked from ChatGPT's spec, Oscar's
  call needed: folding SOIL into the aspect footer to widen the stats plaque.
progress: 2026-08-08 (later) — **deck fills the screen + two Euonymus: deck 88 -> 90.**
  Oscar flagged the dead space above/below the card and the grimy black fade over the
  action bar. Two causes, two fixes: (1) the 420x543 card is width-bound on phones and
  was centred with the spare height split into two gaps — the card now stretches
  vertically into that space (--csx/--csy split, capped at 1.25x; whole subtree scales
  as one raster so internal alignment is untouched, photos crop via the same transform);
  (2) the old always-on card shadow stacked ~57 deep into a near-solid ~60px halo — the
  drop shadow now sits on hot cards only (3 stacked, clean edge, perf pixel-parity test
  still green). Deck margins 12->8px. Added Emerald 'n' Gold + Emerald Gaiety Spindles
  (JSON + photos via add-plant.js). Tool/test debt paid down along the way: add-plant
  counted PLANTS_ON_HOLD rows into NPLANTS (set 96 with an 89 deck — suites imploded)
  and only bumped 2 of the 4 counting suites — both fixed; perf-test's no-layout-on-drag
  guard was timing-dependent on the photo trickle loader landing a load event inside
  the drag window (any deck-size change re-rolled that dice) — photos now settle before
  the measurement. plants.csv: note plants-tool.js export DROPS the 7 on-hold rows
  (they live outside the PLANTS markers), so the 2 new rows were appended by hand;
  export needs teaching about the hold block before it's safe to run again. Build r15.
  All nine suites green.
progress: 2026-08-08 — **plant-build line brought across: deck 65 -> 88 (95 known).**
  Oscar: "bring across all plant 80 something" — the claude/plant-build-timber-6ta360
  branch (another chat, forked at the 66-deck r8 shell) had built to 89, of which 23
  cards + 1200px photos were new to this line: Goshiki Osmanthus, Camellia 'Doctor
  King', Worcester Gold Caryopteris, two Achilleas, Leucothoe WHITEWATER, Hydrangea
  DAREDEVIL, Rhaphiolepis ENCHANTRESS, Philadelphus PETITE PERFUME PINK, Phlomis
  italica, Scabiosa FLUTTER, Cotoneaster 'Variegatus', Crinodendron, Prunus
  'Kojo-no-mai', Escallonia PINK ELLE, Euonymus 'Harlequin', Miscanthus 'Morning
  Light', Festuca INTENSE BLUE, Berberis 'Orange Ice', Pennisetum TINY TAILS, Katsura,
  Lobelia STARSHIP, Lomandra WHITE SANDS (Loquat already here). Cards + photos ported
  onto the current shell; that branch never synced plants.csv, so the 23 CSV rows were
  generated from the card objects (deck and csv both 95, no dupes). NPLANTS 88 in all
  four suites. Build r14. All nine suites green. Old Plantatron backup's ~105-name
  catalogue list is stock data, not cards — NOT ported.
progress: 2026-08-08 — **r13 LIVE on Pages.** Oscar: the artifact preview isn't his
  link — deployed for real. Feature branch fast-forwarded onto the pwa branch
  (289fc40 -> 6848ee9), Pages run #13 green. [Unverified] served bytes — github.io
  is egress-blocked from the container; verified via the successful deploy run on
  the exact commit. Phone note: the SW serves r12 once more, then r13 on next open.
progress: 2026-08-07 (later still) — **7 photo-less cards parked out of the deck.**
  Oscar's call: no photo = on hold. Choisya, Weigela and the five climbers moved to
  PLANTS_ON_HOLD (outside the plants-tool markers; data kept in-file + plants.csv —
  move an entry back into PLANTS to re-deal). Deck 65, NPLANTS 65 in all four suites;
  test refs to held plants repointed; features-test chip pick now needs n>=2 (the old
  type:Impulse n=2 chip was exactly Choisya+Weigela). All nine green. Preview artifact
  republished. Sourcing the climber photos (the standing brick) now also un-parks them.
progress: 2026-08-07 (later) — **action circles squished into slim card-styled bars;
  cards bigger.** Oscar's call: the three big round fabs were obnoxious. Now three
  38px space-bar panels (58px total vs ~110px) in the card's own language — Georgia
  small-caps, deep-green panel, thin gold trim, gold LEARNED primary, red-tinted
  SKIP, compact undo square. Deck margins 16→12px; card scale 0.852→0.871 at 390px
  wide, more on height-bound screens. IDs/aria/shortcuts untouched; all nine suites
  green. On claude/card-redesign-compact-buttons-ikf8ki pending Oscar's verdict on
  the preview artifact (photos + art inlined, build script in session scratchpad).
progress: 2026-08-07 (later) — **duplicate holdout retired.** Both chats were asked to
  park the photo-less cards and built it in parallel: this line's PHOTO_HOLDOUT filter
  (kept the 7 searchable/quizzable) lost the race to the deployed PLANTS_ON_HOLD move
  (7 gone from search/dictionary/quiz too until re-added). Deployed version adopted;
  lines converged on the blocker branch. One live-app change per chat at a time.
progress: 2026-08-07 — **parallel lines combined; nothing left stranded.** Oscar ran two
  sessions at once and their work forked at r10: voice change (blocker branch) vs edging
  assets + v13 mocks + monetisation brief (edging branch). Merged, then a branch sweep
  found four finished fixes never combined into ANY line: Winter Beauty Honeysuckle
  photo (deck-audit gap closed), gold-SVG chrome icon retheme, tradeBlocks() — trade
  sheet/search detail stop printing empty captions + customer PRICE box only when
  priced, and the soil-panel 3-line collision fix (8.5px). The 07-30 era commits
  (shuffled deals/photo quiz, drop-unfilled-facts) predate two shell rewrites — parked,
  likely superseded; Oscar to say if the quiz is missing anything he remembers. Build
  r12. Whole gate green.
progress: 2026-08-06 (later) — **v13 card redesign mock, three rounds.** Oscar supplied
  an AI reference (ornate scallop-corner parchment boxes, merged aspect/soil footer,
  no action buttons). Round 1: inset card mock. Round 2 (full-screen) rejected — his
  detailed critique: geometry wrong, chrome belongs outside the card, PPP must stay
  floating gold over the photo, rail max ~12%. Round 3 reproduces his locked second
  reference exactly: design/card-v13-mock.html + V13-REDESIGN-NOTES.md. Scallop
  cartouche borders are runtime SVG (scallopPath); icons unchanged per Oscar. Awaiting
  his verdict before any template work.
progress: 2026-08-06 — **v12.5 matching wooden edging shipped + monetisation research.**
  Oscar flagged the plaque and SOIL box missing the band's thin wooden rim; band's rim
  profile pixel-measured and baked onto both assets by design/bake-rim.py (idempotent,
  guard against double-bake). All nine suites + layout audit green. NOT yet live: sits
  on claude/timber-plant-card-edging-c661sc pending landing on the pwa branch. Also:
  MONETISATION-BRIEF.md written (app packaging, user acquisition, charging, card count,
  revenue — sourced, speculation labelled). Route decision pending: consumer app vs
  B2B staff-training; brief recommends validating B2B at Oscar's own centre first.
progress: 2026-08-05 (night) — **say-button voice anglicised.** Was it-IT (full Italian
  phonology — authentic but hard to parse); now prefers en-GB (falls back to any en),
  the RHS-style trade pronunciation. Spoken text only: "var." said as "variety", hybrid
  sign x silent; display text untouched. Rate .85 -> .9. app-test's utterance check
  updated to the spoken form. Build r11. All nine suites green. [Unverified] how it
  sounds on Oscar's phone — depends on the device's en-GB voice; needs his ear.
progress: 2026-08-05 (evening) — **climber sun values researched and corrected** (was
  the brick; Oscar said "just research and find out"). Sources: RHS plant pages +
  Gardeners' World shade guides via search (direct RHS fetch blocked from container).
  Nelly Moser 55/35 -> 45/25 (performs BETTER in part shade, sun bleaches the bars,
  classic north-wall pick); montana rubens sunMin 40 -> 30 (Group 1, among the most
  shade-tolerant, north walls fine); armandii sunMin 55 -> 45 (most shade-tolerant
  evergreen clematis, manages dappled shade, flowers less); Russian Vine sunMin
  20 -> 35 (semi-shade tolerant, but 20 = deep shade overstated it); PPE 65/40
  confirmed unchanged (viticellas want sun, tolerate some shade). CSV synced (Nelly
  only — CSV carries no sunMin). Build r10. All nine suites green. NOT yet live:
  sits on claude/timber-blocker-h7f5oo pending fast-forward of the pwa branch.
progress: 2026-08-05 (later) — **72-plant deck LIVE.** claude/timber-plant-pwa-j69h5e
  fast-forwarded c210f80 -> 8710df2 with Oscar's permission; Pages deploy run #10 green
  (deploy-pages step succeeded). Ajuga photo brick closed by decision: Oscar keeps the
  current photo — no longer a defect, it's the chosen art.
progress: 2026-08-05 — **deck 66 → 72: the last six stranded plants are in.** The five
  climbers (Clematis 'Nelly Moser', 'Purpurea Plena Elegans', montana var. rubens,
  armandii, Russian Vine) came in from their preserved plants.csv rows, and Japanese
  Loquat (card + 1200px photo) from the japanese-loquat-card branch — the deck and
  plants.csv are back in sync at 72. The climbers' deck-audit blocker (aspect light-info
  lost) is cleared by moving light into the rubric fields: aspect set to a facing
  ("Any aspect" / "Sheltered S / W" for armandii), sunNeed+sunMin set per CARD-STATS
  anchors (Nelly Moser 55/35, PPE 65/40, montana 65/40, armandii 75/55, Russian Vine
  70/20; "roots in shade" kept in the soil line). [Unverified] those five sunNeed/sunMin
  values are editorial calls from the rubric, not Oscar's portfolio — review and adjust.
  Climbers still carry no buyer-trade layer, other ratings, or photos (honest blanks —
  15 audit warnings, 0 errors). NPLANTS 72 in all four suites; whole gate green (app 94,
  edge 9, features 47, srs 24, perf 10, sw-update, deck-audit PASS). Build r9.
progress: 2026-08-04 (later) — **deck 57 → 66: nine displaced plants restored.** Full
  branch+artifact audit found 14 plants stranded on four unmerged branches. Restored the
  9 that pass the gates with full data AND photos (recovered from donor branches, all
  1200px): Pink Annabelle Hydrangea, Pittosporum 'Elizabeth', Holly Osmanthus 'Tricolor',
  Cercis 'Eternal Flame', Agastache 'Summerlong Coral', Yucca 'Variegata', Alstroemeria
  INDIAN SUMMER, Cornus kousa FLOWER TOWER, Uncinia 'Everflame'. One layout defect found
  and fixed (Osmanthus bloom text trimmed to fit its zone). NOT restored: the 5 climbers
  (4 Clematis + Russian Vine) — deck-audit errors them (aspect info lost: light data but
  no sunNeed value), they lack the whole buyer-trade layer, ratings, and photos. They need
  a proper data pass with Oscar's sign-off; rows preserved on plant-card-addition-sbil3n.
  NPLANTS 66 in all four suites; whole gate green. Build r8.
progress: 2026-08-04 — **the real compositing monster found: 3D flip machinery.** Oscar's
  glitch screenshots (white screens, a slab of the previous card stuck over the new one)
  are GPU tile eviction. CDP LayerTree measurement showed the truth the will-change
  proxy never could: 228 REAL composited layers. Three per-card triggers, each removed
  for non-hot cards only (top card is the only tappable/flippable one): perspective +
  preserve-3d contexts, the back face's rotateY(180deg) — a 3D transform is a layer
  trigger even when backface-invisible, so 54 unseen trade sheets were rasterised —
  and backface-visibility:hidden itself, which layerised every front face and dragged
  buried cards along via overlap. 228 → 16 layers (3 hot cards × flip machinery + doc).
  Verified pixel-safe (max delta 1/255 AA jitter). perf-test now measures REAL layer
  count via CDP (≤24) instead of trusting will-change; 10 checks. All nine suites green.
  Phone re-test needed as ever — but this is the first fix aimed at the measured cause.
progress: 2026-08-03 (evening) — **phone tearing diagnosed from screen recording.** Frame
  extraction of Oscar's Pages recording showed the real failure the 07-03 compositing fix
  predicted it couldn't verify headless: the moving card tears into strips (its rail
  renders detached and rotated over the next card) and the revealed card flashes a black
  unpainted photo panel. Cause: markHot() promoted (will-change) and first-painted cards
  in the same frame the fling starts — layer + raster churn on visible content. Fix:
  buffer one card deeper than anything a swipe can reveal (hot = top 3, PAINT_DEPTH = 4)
  so churn only ever touches fully occluded cards, decode upcoming photos while still
  buried (img.decode()), and move per-swipe SRS bookkeeping to a 360ms timer so the
  animation frame carries zero extra work. perf-test budgets raised 3→4 to match (still
  O(1) vs 57). All nine suites green. Real-phone confirmation still needed — headless
  cannot reproduce GPU raster scheduling.
progress: 2026-08-03 (later) — **learning layer merged onto deck 57; site live.** The
  feature line built earlier today against the stale 8-plant branch (spaced repetition +
  review-due deck, quiz v2 with reverse/trade rounds + weakest-first picking + session
  summary, data-discovered deck filters, typo-tolerant ranked search, My-progress stats,
  photos on search/customer sheets, focus traps) is re-based onto this branch and adapted
  to its conventions: deck rebuilds go through releaseCard()/markHot() so the compositing
  budget holds (perf suite green), review/filter are ephemeral views that never persist
  over saved progress, statsEl joins overlayOpen(). Two new suites (srs-test 24,
  features-test 38) recalibrated for 57 plants; all NINE suites green. GitHub Pages
  enabled (self-deploying workflow; Oscar flipped the one admin toggle) — the app is
  live at https://oscarhurman39-sys.github.io/Timber/ and redeploys on every push to the
  default branch.
progress: 2026-08-03 — **swipe glitch root-caused; two new suites.** The tearing on the
  phone was compositing pressure, not gesture logic: `will-change` sat on all 57 cards
  (57 GPU layers, ~200MB, which also defeats occlusion culling) and every buried card
  stayed painted though the stack is fully occluded. markHot() now promotes only the card
  mid-fling plus the top two, and paints only the top three. Buried cards keep their BOX
  painted — ~30 stacked box-shadows build the deck's halo, so hiding whole cards lightens
  it; hiding only their contents is pixel-identical (0/1,316,640 px differ). Measured: 57
  layers -> 2, 54 painted photos -> 3, no layout during a drag. NOT verifiable here —
  headless has no GPU memory pressure, so the smoothness gain needs confirming on a real
  phone. New: tests/perf-test.js (8 checks, locks the compositing budget + pixel parity)
  and tests/deck-audit.js (whole-deck audit; judges rendered output, not raw fields —
  auditing the stored format directly gave ~120 false alarms). Seven suites now, all
  green. Deck audit found 2 genuinely broken cards (Choisya, Weigela: no photo, all
  ratings blank, aspect "Full sun / pt shade" silently rendered as "Any aspect" with no
  light bar) — recorded in KNOWN_GAPS. Also confirmed NOT problems: soil-length warnings
  (the card splits the joined field), rating scales (genuinely 0-20), H5 (evenly spread,
  not the mock-up pattern), quiz (no empty questions, no crash path).
progress: 2026-07-30 — **artifact re-synced, deck 57.** The published artifact had forked
  again: artifact-side sessions had added 10 cards (Ligularia 'Treasure Island', Dream Dazzler
  Stonecrop, Hydrangea aspera 'Rosemary Foster', Ginkgo, Cordyline Charlie Boy, Gaura 'Gaudi
  Rose', Hydrangea 'Wim's Red', Rhododendron 'Gartendirektor Glocker', Acer shirasawanum
  Moonrise, Callistemon 'Splendens') that never landed in the repo, while main sat at 47 and
  the artifact showed only 18. All 10 rows + their photos are merged into main's newer app
  shell (deck 57), NPLANTS bumped, all five suites green, standalone rebuilt (4.6MB, 54/57
  photos) and republished to BOTH artifact URLs so either link now shows the full deck.
  Photo caveat: the 10 photos came back through one webp→jpeg re-encode of the artifact's
  inlined copies (still ~1200px). Photo-less (never had one anywhere): Choisya ternata,
  Weigela 'Nana Variegata', Winter Beauty Honeysuckle. Improvements-branch note: 6 plants
  (Pink Annabelle, Pittosporum 'Elizabeth', Osmanthus 'Tricolor', Cercis 'Eternal Flame',
  Agastache 'Summerlong Coral', Yucca 'Variegata') exist only on the old timber-improvements
  branch — left out, as the 07-28 consolidation excluded them; their photos are already in
  photos/. Say the word if they should be resurrected.
progress: 2026-07-28 — **repository separated.** The Command Centre dashboard moved
  out to its own repo (Plantatron); Timber is now only the customer-facing swipe-card
  app. **Deck consolidated**: the flower-tower branch merged in, resolving the split
  between the two lines. No plant data was recovered because none was missing — main
  already held all 46 of flower-tower's cards plus Winged Spindle. What came back were
  the 1200px photo originals that the published-artifact round-trip had downgraded to
  800px re-encodes, plus 16 -cutout.png source assets, CORRECTION-PROTOCOL.md and
  design/audit-layout.js. Deck 47, photos all at 1200px except the Ajuga. All five
  suites green; standalone build verified at 3.7MB, opening offline from file:// with
  zero external requests. Fixed two test defects found on the way: a duplicate NPLANTS
  declaration the merge introduced silently, and a hardcoded absolute path in
  sw-update-test.js that made it fail from any checkout other than /home/user/Timber.
progress: 2026-07-25 — deck now 17: Cornus, Ajuga, Spiraea, Potentilla, Cercis, Prunus, Salvia, Mahonia (photo staged), Leycesteria, Buddleja Pugster Orchid, Flamingo Willow, Cape Leadwort, Golden Japanese Spindle (cutouts composited), Bubblegum Blast Bee Balm, Common Hornbeam, Ebbinge's Silverberry, Gunnera, October Glory Red Maple, Spider's Web Fatsia, Griselinia, Himalayan Indigo 'Silk Road', Cascading Moth Orchid, Laurustinus 'Eve Price', Orange Victory Itoh Peony, French Lavender 'Anouk', Meyer's Lemon, Green Spire Spindle, Jenny Japanese Holly, Gold Rider Leyland Cypress, Horizon Monarch Rhododendron, Ōsakazuki Japanese Maple, Musa basjoo, Wedding Cake Tree, Common Olive, Bloodgood Japanese Maple, Hot Lips Sage, Honey Tulip Magnolia, Big Blue Sea Holly, Winter Beauty Honeysuckle (real photos + cutouts). Deck 46. Lonicera on gradient fallback — both supplied photos unusable (water lily + cat-blocked); needs a winter flower shot. First populated toxicity field (Lonicera fruit). Eryngium is the FIRST populated compliance field (PBR) — surfaced on the back; three compliance cards now (Gunnera ban, Olive Xylella, Eryngium PBR). Tiered compliance display is the clear next brick. Hot Lips JSON is first with the new toxicity+compliance fields (empty, captured but not yet rendered — the hook for the compliance ribbon). Firsts: houseplant/H1b, edible/citrus, cultivar pair, conifer/nothogenus, macron-name slug fold, single-facing aspect. TWO biosecurity/compliance cards now (Gunnera legal ban + Olive Xylella) — parked compliance-ribbon decision increasingly worth doing. NEW: Gunnera carried a compliance/legal block (UK-restricted) — surfaced on the trade back; OPEN DECISION on a front compliance banner (see protocol v12.21). New audit rule (focus-photo) catches id-vs-latin-slug drift after the Euonymus shipped blank. Recurring: JSON soil warnings keep carrying pruning/toxicity — worth a source-prompt fix. 2026-07-24 — portfolio batch DONE: Cornus, Ajuga, Spiraea, Potentilla added + Nandina photo & ratings (deck 11, all with photos). Layout correction pass done: audit gate live (CORRECTION-PROTOCOL.md), 31+4 violations fixed incl. blurred-labels + photo pointer-events bug. Pending: sync card-builder.html to fixed band/plaque; Nandina data conflicts need Oscar's call (aspect E/W vs S/W, bloom Jun-Jul vs Sep-Feb, soil warning).

## garden-centre-bot  [parked]
brick: (not set — pick up from skill notes when resumed)
since: 2026-07-20  sessions-unchanged: 0
