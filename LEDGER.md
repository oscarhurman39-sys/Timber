# Next-brick ledger

## timber  [active]
brick: Re-source the Ajuga 'Burgundy Glow' photo — it is the only card below the
  1200px standard (680x415, cropped from AI artwork, cultivar unverifiable) and the
  last known data-quality defect in the 47-card deck.
since: 2026-07-28  sessions-unchanged: 3
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
