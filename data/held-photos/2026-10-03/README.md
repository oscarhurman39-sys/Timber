# Batch of 2026-10-03 — 42 pre-built cards, no photos yet

`batch-as-sent.json` is Oscar's paste exactly as supplied (42 entries, pretty-printed, values unedited;
"Some new card jsons strait from gpt", his first paste after PR #53 merged). `batch-corrected.json` is
the same 42 with the standing layout conventions applied (table below) plus two named exceptions.
**Nothing is in `timber.html` yet**: each card is added when its photo arrives, five at a time in batch
order — the routine of every batch since 2026-09-26d. To deal a group: split them out of
`batch-corrected.json`, `node tools/add-plants-bulk.js --quick a.json a.jpg …`, `photo-credits.js --set
<basename>` for each, restamp, update this file, the sequential `node tests/run-all.js`.

Checks run on 2026-10-03 against deck 491 / hold 75 (the merged head of PR #53, 5ebd536, r342).

**Doubles: none.** `tools/compare-double.js` finds no card for any of the 42. Ten PROBABLE word-hits are
different plants, so all 42 go in as new cards: #1 → Oenothera 'Rosy Jane' ("jane"), #4 and #5 → the dealt
Gentiana sino-ornata ("gentian" — a species card; these are two named cultivars, as Twinkie beside Toni),
#6 → Citrus × meyeri ("citrus"), #10 → Uncinia 'Everflame' ("sedge"), #13 → Caryopteris × clandonensis
("dark"), #24 → Agapanthus 'Ovatus' ("african"), #26 → Leucophyta brownii ("brown"), #29 → Lotus LITTLE
BOY BLUE ("canary"), #38 → the dealt Euonymus alatus ("winged" — the species; 'Compactus' is a cultivar
of it, a second card as Cordyline australis sits beside Charlie Boy), #42 → Hibiscus LAVENDER CHIFFON
("chiffon" — a sibling in the same series, different code). Nearest real neighbour in the deck:
#36 'LC NO19' beside the dealt 'LC NO21' (Groundbreaker Blush) — a different code, so a different card.

`tools/check-plant-json.js` on every entry of `batch-corrected.json`: **42 pass, 0 errors.** As sent, one
hard error: #27's hardiness "H1C" (the band list is case-sensitive; corrected to H1c, see below). Remaining
warnings, none acted on: ratings of 3–5 on the 20-scale as supplied (#4, #5, #6, #7, #9, #10, #11, #12,
#13, #14, #15, #17, #18, #19, #24, #25, #32, #33, #34, #38, #39, #40, #41, #42 — low-care, pest-free or
slow plants read as intended, the same call as every batch since 2026-09-29), and "moist" shared by
`water` and `soil` on #1, #2, #20 and #30.

**`plant-sense` pre-check, new this batch.** The Dissectum maple failed `plant-sense --strict` only at
deal time (PR #53), so this batch was checked first: the 42 fitted rows were appended to the hold block of
a scratch copy of `timber.html` (`tools/plant-data.js` `writeBlock`, deck 491 / hold 117 re-read) and
`plant-sense.js` run on it. Its issue list is byte-identical to the live deck's — no new contradiction, no
new warning — and `--strict` exits 0. Not checked: `tests/deck-audit.js` (it judges the rendered card and
needs the photo), which runs with the bulk tool on dealing.

## Conventions applied in `batch-corrected.json` (Oscar's standing "go")

Only the layout fields change, plus the two named exceptions. Every other field is as supplied, including
`hardinessNote`, `cvs`, `common`, prose, foliage class and all ratings. The fields that differ from
`batch-as-sent.json`: `soil`, `soilWarning`, `aspect`, `height`/`spread` where sub-metre, `latin` on eight
entries, `hardiness` on one.

- `soil` cut to one short line (≤26 chars) plus one short warning (≤44), written from the supplied
  sentences; lengths asserted by the build script, not counted by hand.
- `aspect`: all 42 state light levels only ("Full sun to partial shade", "Bright light to partial shade"),
  no facings, so the facing is derived from the sun band exactly as `tools/fit-incoming.js` `deriveFacing`
  does it (the function itself was called): sunNeed ≥90 → `South / West`; ≥60 → `East / South / West`;
  ≥40 → `East / West`; below 40 → `North / East` (#18 Skimmia and #28 Hosta, both 35).
- Sub-metre sizes in cm with an en dash ("40–50 cm"); any range that reaches 1 m is unchanged, hyphen
  included (#7's spread stays "0.5-1 m" beside a cm height, as the Ajuga of 2026-10-01). "12 m+" and
  "8 m+" on #29, #39 and #40 match the deck's Akebia quinata and Prunus pissardii.
- **Trade names take the deck's form** (the Geranium lesson of 2026-10-02b: a breeder code alone reads as
  a mistake on the card). Every genus concerned already carries a CAPS trade-name card, so its form is
  copied: #1 `Hydrangea paniculata LITTLE LIME ('Jane')` and #36 `Hydrangea paniculata LIVING RED VELVET
  ('LC NO19')` after `Hydrangea DAREDEVIL ('Jpd01')`; #8 `Rosa CUTIE PIE ('Rop007')` after `Rosa ROYAL
  WILLIAM ('Korzaun')`; #19 `Echinacea MOOODZ FEARLESS ('Hilmofear')` after `Echinacea SUNSEEKERS ROSY
  ('Ifecssrosy')`; #30 `Clematis BIG & EASY PURPLE ('Tumaini')` after `Clematis JOSEPHINE ('Evijohill')`;
  #33 `Cordyline obtecta SUPERSTAR ('Albatross')` after `Cordyline australis CHARLIE BOY ('Ric01')`; #34
  `Physocarpus opulifolius MAGIC BALL ('Lp1')` after `LITTLE DEVIL ('Donna May')`; #42 `Hibiscus syriacus
  STARBURST CHIFFON ('Rwoods6')` after `LAVENDER CHIFFON ('Notwoodone')`. The code-to-trade-name pairings
  are GPT's own (its `cvs` field names both) and are **[Unverified]** from here — the RHS site is blocked
  from the build container; the label photo settles each when it arrives. Cultivar names that are not
  codes stay in quotes as supplied, including #24's `'Dalina Compact White Pink Blush'` (Dalina is a
  series name — [Inference]; no Osteospermum sibling in the deck sets a form) and #26's `'Toncka Green &
  Brown'`. `common` and `cvs` untouched.
- **#27 hardiness "H1C" → `H1c`.** The validator's band list is `H1a H1b H1c …` and rejects the capital;
  the band itself is as supplied (keep above about 5°C, glasshouse or indoors in winter), as is the note.
- `hue` 0 on #16 Delphinium 'Pure White' kept: white flowers; 53 cards, dealt and held, carry hue 0, the
  2026-10-02b Rhododendron 'Cunningham’s White' among them.
- Foliage classes as supplied. Three carry a qualifier the parser reads past: #9 "deciduous to
  semi-evergreen" reads **deciduous**, #22 "evergreen in frost-free conditions" reads **evergreen**, #25
  "semi-evergreen to deciduous" reads **semi-evergreen** (the app takes the first class word to appear;
  checked against `FOLIAGE_WORD` in `timber.html`). Several herbaceous perennials arrived as "deciduous"
  (#13, #16, #17, #28, #37); the deck carries both words for such plants (Hosta 'Broadband' deciduous,
  the held 'Halcyon' herbaceous), so nothing was changed.
- #11 Vinca major: "ground cover" in its prose with a 2.5 m spread sits exactly on `plant-sense`'s
  dwarf/ground-cover size ceiling (the rule fires above 2.5 m, not at it). Noted so nobody widens the
  spread later without knowing why the check then fails.

| # | latin (as it will go in) | soil | warning | aspect (sunNeed) | size H / W |
|---|---|---|---|---|---|
| 1 | Hydrangea paniculata LITTLE LIME ('Jane') — trade-name form | Fertile, moist, drained | No severe drought; no waterlogging | East / South / West (75) | 1-1.5 m / 1-1.5 m (unchanged) |
| 2 | Rhododendron 'Ramapo' | Humus-rich, moist, acid | No alkaline or chalky soil | East / South / West (60) | 0.5-1 m / 0.5-1 m (unchanged) |
| 3 | Robinia pseudoacacia 'Frisia' | Any well-drained soil | No persistently waterlogged ground | South / West (95) | 8-12 m / 4-8 m (unchanged) |
| 4 | Gentiana 'The Caley' | Moist, drained, lime-free | No drought; no stagnant wet soil | East / South / West (65) | 10 cm / 10–50 cm |
| 5 | Gentiana 'Berrybank Dome' | Moist, drained, lime-free | No drought or waterlogging | East / South / West (65) | 10 cm / 10–50 cm |
| 6 | Echinacea 'Princess Citrus' | Fertile, well-drained | No heavy wet winter soil | South / West (95) | 40–50 cm / 40–50 cm |
| 7 | Amsonia 'Blue Ice' | Moist or well-drained | No prolonged waterlogging | East / South / West (75) | 30–50 cm / 0.5-1 m |
| 8 | Rosa CUTIE PIE ('Rop007') — trade-name form | Fertile, humus-rich, moist | No prolonged waterlogging | South / West (90) | 15–30 cm / 30 cm |
| 9 | Oenothera lindheimeri 'Gambit Variegata Rose' | Fertile, well-drained | No wet heavy winter soil | South / West (95) | 40–60 cm / 40–50 cm |
| 10 | Carex oshimensis 'Evergold' | Moist but well-drained | No permanently waterlogged ground | East / West (55) | 30–40 cm / 40–50 cm |
| 11 | Vinca major 'Variegata' | Any soil, even damp ground | Spreads strongly by rooting stems | East / West (50) | 30–45 cm / 1.5-2.5 m |
| 12 | Vinca minor 'Illumination' | Moist or well-drained | Spreads by rooting stems | East / West (45) | 10–20 cm / 0.5-1.5 m |
| 13 | Symphyotrichum novae-angliae 'Dark Purple' | Fertile, moist, drained | No severe summer drought | South / West (90) | 1-1.5 m / 0.5-1 m (unchanged) |
| 14 | Hesperantha coccinea 'Pink Princess' | Fertile, moist, drained | No long drought; no winter waterlogging | South / West (90) | 50–70 cm / 30–50 cm |
| 15 | Hesperantha coccinea 'Major' | Fertile, moist, drained | No severe drought or stagnant winter wet | South / West (90) | 50–70 cm / 30–50 cm |
| 16 | Delphinium 'Pure White' | Rich, moist, well-drained | No waterlogging or exposed windy sites | East / South / West (85) | 60–80 cm / 30–50 cm |
| 17 | Crocosmia × crocosmiiflora 'Babylon' | Moist but well-drained | No heavy stagnant winter soil | East / South / West (80) | 0.5-1 m / 30–50 cm |
| 18 | Skimmia japonica 'Perosa' | Humus-rich, moist, drained | No hot dry sun or poor dry soil | North / East (35) | 0.5-1 m / 0.5-1 m (unchanged) |
| 19 | Echinacea MOOODZ FEARLESS ('Hilmofear') — trade-name form | Fertile, well-drained | No wet winter soil | South / West (95) | 35–45 cm / 35–45 cm |
| 20 | Hydrangea macrophylla 'HI Ocean' | Humus-rich, moist, drained | No drought; soil pH shifts flower colour | East / South / West (60) | 0.8-1.2 m / 0.8-1.2 m (unchanged) |
| 21 | Acer palmatum 'Moonfire' | Moist, drained, lime-free | No drought, waterlogging or drying wind | East / South / West (70) | 2.5-4 m / 2.5-4 m (unchanged) |
| 22 | Lantana camara | Fertile, sharply drained | Frost tender; no waterlogged roots | South / West (95) | 0.5-1.5 m / 0.5-1.5 m (unchanged) |
| 23 | Polygala myrtifolia | Fertile, free-draining | Frost tender; no wet winter roots | South / West (90) | 1-2 m / 1-1.5 m (unchanged) |
| 24 | Osteospermum ecklonis 'Dalina Compact White Pink Blush' | Well-drained soil | No heavy wet clay or winter waterlogging | South / West (95) | 30 cm / 30 cm |
| 25 | Cynara cardunculus | Fertile, well-drained | No winter waterlogging | South / West (95) | 1.5-2.5 m / 1-1.5 m (unchanged) |
| 26 | Heuchera 'Toncka Green & Brown' | Fertile, moist, drained | No waterlogging around the crown | East / South / West (60) | 30 cm / 30–40 cm |
| 27 | Scadoxus katherinae 'Flame' — H1c, see above | Rich, drained loam compost | Frost tender; no cold wet conditions | East / South / West (70) | 1-1.2 m / 30–50 cm |
| 28 | Hosta 'Autumn Frost' | Humus-rich, moist, drained | No prolonged drought | North / East (35) | 30–50 cm / 0.5-1 m |
| 29 | Phoenix canariensis | Loam-based, free-draining | Not reliably frost hardy in the UK | East / South / West (80) | 12 m+ / 8 m+ (unchanged) |
| 30 | Clematis BIG & EASY PURPLE ('Tumaini') — trade-name form | Fertile, moist, drained | No hot dry roots; no waterlogging | East / South / West (70) | 1.2-1.8 m / 0.5-1 m (unchanged) |
| 31 | Clematis 'Niobe' | Moist but well-drained | Keep the roots cool and shaded | East / South / West (70) | 1.5-2.5 m / 0.5-1 m (unchanged) |
| 32 | Schisandra sphenanthera | Fertile, moist, drained | No severe drought | East / South / West (65) | 4-8 m / 2.5-4 m (unchanged) |
| 33 | Cordyline obtecta SUPERSTAR ('Albatross') — trade-name form | Fertile, free-draining | Shelter pots from hard frost and winter wet | South / West (90) | 1.5 m / 80 cm |
| 34 | Physocarpus opulifolius MAGIC BALL ('Lp1') — trade-name form | Most soils, moist, drained | No prolonged waterlogging | East / South / West (75) | 0.8-1.2 m / 0.8-1.2 m (unchanged) |
| 35 | Hydrangea paniculata 'Little Fresco' | Fertile, moist, drained | No prolonged drought | East / South / West (75) | 70–80 cm / 60–70 cm |
| 36 | Hydrangea paniculata LIVING RED VELVET ('LC NO19') — trade-name form | Fertile, moist, drained | No prolonged drought | East / South / West (75) | 1 m / 80 cm |
| 37 | Alstroemeria sp. | Fertile, moist, drained | No severe winter waterlogging | East / South / West (80) | 40–80 cm / 30–60 cm |
| 38 | Euonymus alatus 'Compactus' | Any well-drained soil | Needs good light for autumn colour | East / South / West (75) | 0.5-1 m / 1-1.5 m (unchanged) |
| 39 | Acer platanoides 'Crimson King' | Moist or well-drained | Needs substantial space at maturity | East / South / West (80) | 8-12 m / 8 m+ (unchanged) |
| 40 | Acer pseudoplatanus 'Drummondii' | Fertile, moist, drained | Cut out reverted all-green shoots at once | East / South / West (70) | 8-12 m / 8 m+ (unchanged) |
| 41 | Abelia × grandiflora 'Radiance' | Moist but well-drained | Shelter from hard cold and drying winds | South / West (90) | 0.5-1 m / 1-1.5 m (unchanged) |
| 42 | Hibiscus syriacus STARBURST CHIFFON ('Rwoods6') — trade-name form | Fertile, moist, drained | Flowers best in a warm sunny sheltered spot | South / West (95) | 1.5-2.5 m / 1-1.5 m (unchanged) |


## Toxicity text — run through the card's ladder (`TOX_LADDER`), nothing changed

The card picks its SAFETY tier by keyword and does not read meaning. Every supplied sentence, checked
against the ladder copied from `timber.html`:
- **Toxic** (orange, "harmful" / "toxic" / "should not be eaten"): #1, #2, #3, #11, #12, #16, #18 ("Plant
  material should not be eaten."), #20, #22, #27, #28, #30, #31, #33, #35, #36, #38, #40 — 18 cards. Each
  sentence means a plant not to eat, which is the tier it prints. #27 Scadoxus "potentially toxic" lands
  on Toxic, not Highly toxic (the red rung needs "highly toxic" or "potentially dangerous"); as supplied.
- **Handle with care** (amber): #7 Amsonia ("Milky sap may irritate sensitive skin."), #29 Phoenix ("Sharp
  leaf bases and spines can cause physical injury."), #37 Alstroemeria ("Sap can irritate sensitive
  skin.") — each a contact hazard, the tier it means.
- 21 of 42 have no toxicity text and print nothing, the deck's norm (#4, #5, #6, #8, #9, #10, #13, #14,
  #15, #17, #19, #21, #23, #24, #25, #26, #32, #34, #39, #41, #42).

## GPT's own `uncertain` flags — carried here, not resolved

The JSON was read from bench labels, so the label names are the card names (NEW-SESSION.md, Oscar
2026-10-02) and these are notes for the record, not holds:

- **OCR corrections GPT made and declared** — #1 "Little Line" → Little Lime; #12 "Illuminations" →
  'Illumination'; #14 "Pirik Princess" → 'Pink Princess'; #15 "Maior" → 'Major'; #20 "Hi Ocean Blue" →
  'HI Ocean' (blue read as the flower-colour presentation, not a cultivar); #26 "Tonka Green" → 'Toncka
  Green & Brown'; #27 "x katherinae" → katherinae (label formatting, not a hybrid sign); #29 "canadensis"
  → canariensis, with "Ciotola" read as a pot description; #32 "Schigndsa Spedtandra" → Schisandra
  sphenanthera; #34 "Magic Ba" → Magic Ball; #40 "pesudoplaanus" → pseudoplatanus. Each photo should
  show the label; if a label disagrees with the correction, the label wins.
- **Identity doubts GPT declared** — #8 Rose Cutie Pie: the RHS lists two roses under that name
  ('Rop007' and 'Wekruruwel'); GPT assumed the low thornless pink-edged 'Rop007'. #13 'Dark Purple':
  cultivar-level registration thin; values are the species'. #16 'Pure White': no breeding series on the
  label, not assumed to be Magic Fountains. #22 Lantana camara: no cultivar on the label, generic yellow.
  #23 Polygala: label gave the genus only; P. myrtifolia is GPT's choice of the usual UK retail plant —
  species **[Unverified]**, confirm from the photo. #9 Gaura filed under Oenothera (the deck's form, four
  Oenothera lindheimeri cards). #26 Heuchera 'Toncka Green & Brown': trade records only, thin
  documentation. #6 Echinacea H6 is GPT's reading of a stated cold-hardiness range.
- **#37 Alstroemeria "Valley Paper" has no card name yet.** GPT deliberately did not invent one: a nursery
  production list carries Valley Girl, Valley River, Valley Spring, Valley Time and Valley Wild with
  "Paper" in an adjacent packaging column, so "Valley Paper" is probably two fields read as one. The
  entry is stored as `Alstroemeria sp.` with its stats; **before it is dealt the latin must be set from the
  label in Oscar's photo** (the photo slug follows the latin), in the deck's form `Alstroemeria <TRADE
  NAME> ('<code>')` if the label gives a code, as `Alstroemeria INDIAN SUMMER ('Tesronto')`. H4 is a
  genus-level placeholder until then.
- #20 'HI Ocean' is kept as a quoted cultivar as supplied; whether HI Ocean is a cultivar or a trade name
  over a code is **[Unverified]** from here.

Not checked against the RHS from here (its site is blocked from the build container). Hardiness bands,
sizes and peaks are as supplied; two worth a glance when the labels arrive: #36 H7 on a Hydrangea
paniculata (the deck's paniculatas are H5–H6; GPT cites the breeder's −30°C) and #6 H6 on an Echinacea
(the deck's three are H5).

## Photo order and the filename each photo should match

Asked for five at a time, in batch order. The slug is what `photos/<slug>.jpg` will be called (#37's
changes with its latin).

1. Hydrangea paniculata LITTLE LIME ('Jane') → `hydrangea-paniculata-little-lime-jane`
2. Rhododendron 'Ramapo' → `rhododendron-ramapo`
3. Robinia pseudoacacia 'Frisia' → `robinia-pseudoacacia-frisia`
4. Gentiana 'The Caley' → `gentiana-the-caley`
5. Gentiana 'Berrybank Dome' → `gentiana-berrybank-dome`
6. Echinacea 'Princess Citrus' → `echinacea-princess-citrus`
7. Amsonia 'Blue Ice' → `amsonia-blue-ice`
8. Rosa CUTIE PIE ('Rop007') → `rosa-cutie-pie-rop007`
9. Oenothera lindheimeri 'Gambit Variegata Rose' → `oenothera-lindheimeri-gambit-variegata-rose`
10. Carex oshimensis 'Evergold' → `carex-oshimensis-evergold`
11. Vinca major 'Variegata' → `vinca-major-variegata`
12. Vinca minor 'Illumination' → `vinca-minor-illumination`
13. Symphyotrichum novae-angliae 'Dark Purple' → `symphyotrichum-novae-angliae-dark-purple`
14. Hesperantha coccinea 'Pink Princess' → `hesperantha-coccinea-pink-princess`
15. Hesperantha coccinea 'Major' → `hesperantha-coccinea-major`
16. Delphinium 'Pure White' → `delphinium-pure-white`
17. Crocosmia × crocosmiiflora 'Babylon' → `crocosmia-crocosmiiflora-babylon`
18. Skimmia japonica 'Perosa' → `skimmia-japonica-perosa`
19. Echinacea MOOODZ FEARLESS ('Hilmofear') → `echinacea-mooodz-fearless-hilmofear`
20. Hydrangea macrophylla 'HI Ocean' → `hydrangea-macrophylla-hi-ocean`
21. Acer palmatum 'Moonfire' → `acer-palmatum-moonfire`
22. Lantana camara → `lantana-camara`
23. Polygala myrtifolia → `polygala-myrtifolia`
24. Osteospermum ecklonis 'Dalina Compact White Pink Blush' → `osteospermum-ecklonis-dalina-compact-white-pink-blush`
25. Cynara cardunculus → `cynara-cardunculus`
26. Heuchera 'Toncka Green & Brown' → `heuchera-toncka-green-brown`
27. Scadoxus katherinae 'Flame' → `scadoxus-katherinae-flame`
28. Hosta 'Autumn Frost' → `hosta-autumn-frost`
29. Phoenix canariensis → `phoenix-canariensis`
30. Clematis BIG & EASY PURPLE ('Tumaini') → `clematis-big-easy-purple-tumaini`
31. Clematis 'Niobe' → `clematis-niobe`
32. Schisandra sphenanthera → `schisandra-sphenanthera`
33. Cordyline obtecta SUPERSTAR ('Albatross') → `cordyline-obtecta-superstar-albatross`
34. Physocarpus opulifolius MAGIC BALL ('Lp1') → `physocarpus-opulifolius-magic-ball-lp1`
35. Hydrangea paniculata 'Little Fresco' → `hydrangea-paniculata-little-fresco`
36. Hydrangea paniculata LIVING RED VELVET ('LC NO19') → `hydrangea-paniculata-living-red-velvet-lc-no19`
37. Alstroemeria sp. → `alstroemeria-sp`
38. Euonymus alatus 'Compactus' → `euonymus-alatus-compactus`
39. Acer platanoides 'Crimson King' → `acer-platanoides-crimson-king`
40. Acer pseudoplatanus 'Drummondii' → `acer-pseudoplatanus-drummondii`
41. Abelia × grandiflora 'Radiance' → `abelia-grandiflora-radiance`
42. Hibiscus syriacus STARBURST CHIFFON ('Rwoods6') → `hibiscus-syriacus-starburst-chiffon-rwoods6`
