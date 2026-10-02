# Batch of 2026-10-02c — 9 pre-built cards, no photos yet

`batch-as-sent.json` is Oscar's paste exactly as supplied (9 entries, pretty-printed, values unedited; his
third paste of 2026-10-02, sent after the 2026-10-02b batch was complete). `batch-corrected.json` is the
same 9 with the standing layout conventions applied (table below). **Nothing is in `timber.html` yet**:
each card is added when its photo arrives, five at a time in batch order — the routine of the previous
batches. To deal a group: split them out of `batch-corrected.json`, `node tools/add-plants-bulk.js --quick
a.json a.jpg …`, `photo-credits.js --set <basename>` for each, restamp, update this file, the sequential
`node tests/run-all.js`.

Checks run on 2026-10-02 against deck 479 / hold 76.

**Doubles: none.** `tools/compare-double.js` finds no card for any of the nine. Three PROBABLE word-hits
are different plants: #1 → Weigela florida 'Nana Variegata' ("roses" in that card's text), #2 → the held
Rodgersia 'Bronze Peacock' ("bronze"), #8 → the held Nepeta racemosa 'Walker’s Low' ("catmint" — a
different cultivar, so a second card, as Twinkie beside Toni).

`tools/check-plant-json.js` on every entry of `batch-corrected.json`: **9 pass, 0 errors.** Remaining
warnings, none acted on: ratings of 3–5 on the 20-scale (as supplied — #3, #4, #6, #8, #9; low-care,
pest-free plants read as intended, the same call as every batch since 2026-09-29), and "moist" shared by
`water` and `soil` on #1 and #7.

## Conventions applied in `batch-corrected.json` (Oscar's standing "go")

Only the layout fields change, plus two named exceptions below. Every other field is as supplied,
including `hardinessNote`, `cvs`, prose and all ratings.

- `soil` cut to one short line (≤26 chars) plus one short warning (≤44), written from the supplied
  sentences.
- `aspect`: the paste states light levels only, so the facing is derived from the sun band as
  `tools/fit-incoming.js` `deriveFacing` does it (≥90 → South / West; ≥60 → East / South / West; ≥40 →
  East / West).
- Sub-metre sizes in cm; any range that reaches 1 m is unchanged (#4's spread stays "0.6-1 m" beside a
  cm height, as the Ajuga of 2026-10-01).
- Trade names take the deck's form, following the 2026-10-02b decision on the Geranium ("did the json
  really get made with the name beamland"): a code alone reads as a mistake on the card. Where the genus
  already has a dealt trade-name card its form is copied — `Anemone × hybrida Pretty Lady Maria
  ('Aneplaria')` and `Helleborus × hybridus ViV® Celestina` are Title Case, so #7 is `Anemone Frilly
  Knickers ('Fp007')` and #1 `Helleborus Ice N’ Roses Early Rose ('Coseh 4000')` (the "HGC" brand prefix
  in `cvs` stays there). Where it has none, the CAPS form of CHARLIE BOY / DREAMLAND: #3 `Pittosporum
  tenuifolium BANNOW BAY ('Breebay')`, #6 `Achillea millefolium NEW VINTAGE RED ('Balvinred')`, #9
  `Coreopsis SOLANNA GOLDEN SPHERE ('Dcoreo16')`. Oscar's genus-only latins (#1, #7, #9) keep the genus
  only. `common` and `cvs` untouched.
- Typographic apostrophe inside a cultivar or trade name (#1 "N’", #8 `'Cat’s Pajamas'`, as the held
  `'Walker’s Low'`): the validator rejects the straight form as unbalanced quotes.
- **#2 hardiness "H3-H5" is not a band the card can carry.** It takes **H4**: the deck's own
  `Chrysanthemum × morifolium Garden Mum Group` is H4, and H4 is the middle of Oscar's range. His
  `hardinessNote` ("Hardiness depends on the exact cultivar sold under this name; some autumn pot
  chrysanthemums require winter protection") stays verbatim and prints. [Unverified] the exact clone —
  his own `uncertain` says the name "AUTUMN BRONZE" cannot pin it; by the label rule the bench name is the
  card's name.

| # | latin (as it will go in) | soil | warning | aspect (sunNeed) | size H / W |
|---|---|---|---|---|---|
| 1 | Helleborus Ice N’ Roses Early Rose ('Coseh 4000') | Humus-rich, moist, drained | No waterlogging or dry exposed ground | East / South / West (65) | 40–50 cm / 40–50 cm |
| 2 | Chrysanthemum 'Autumn Bronze' — H4, see above | Fertile, moist, drained | No winter wet; pots must drain freely | South / West (95) | 30–60 cm / 30–60 cm |
| 3 | Pittosporum tenuifolium BANNOW BAY ('Breebay') | Any well-drained soil | No waterlogging or frost pockets | East / South / West (75) | 0.6-1 m / 0.6-1 m (unchanged) |
| 4 | Achillea millefolium 'Sassy Summer Sangria' | Well-drained, any pH | No wet or rich soil; feeding makes it flop | South / West (95) | 70–90 cm / 0.6-1 m |
| 5 | Camellia sasanqua 'Elfin Rose' | Humus-rich, moist, acid | No lime or chalk; no cold waterlogging | East / West (50) | 4-8 m / 2.5-4 m (unchanged) |
| 6 | Achillea millefolium NEW VINTAGE RED ('Balvinred') | Well-drained, any pH | No waterlogging or heavy feeding | South / West (95) | 40–50 cm / 40–50 cm |
| 7 | Anemone Frilly Knickers ('Fp007') | Humus-rich, moist, drained | No drought; no stagnant waterlogging | East / South / West (65) | 50–70 cm / 30–50 cm |
| 8 | Nepeta 'Cat’s Pajamas' | Well-drained, even poor | No winter wet or waterlogging | South / West (95) | 30–35 cm / 45–50 cm |
| 9 | Coreopsis SOLANNA GOLDEN SPHERE ('Dcoreo16') | Fertile, well-drained | No heavy waterlogged winter ground | South / West (90) | 30–45 cm / 30–45 cm |

## Toxicity text — run through the card's ladder (`TOX_LADDER`), nothing changed

- #1 Hellebore → **Toxic** ("harmful"); #7 Anemone → **Toxic** ("harmful"), as the dealt Fantasy Aurora.
- #2 Chrysanthemum, #4 and #6 Achillea → **Handle with care** ("irritat"); each sentence means a mild
  skin and stomach hazard, which is the tier it prints.
- #3, #5, #8, #9 have no toxicity text and print nothing, the deck's norm.

## Oscar's own `uncertain` flags — carried here, not resolved

- #2 Chrysanthemum: the exact clone behind "AUTUMN BRONZE" (Poppins / Prelude) is unknown; see the
  hardiness note above.
- #3 Pittosporum: the label word "Ball" is the trained form, not the name. The card is the plant, not the
  topiary; `uses` already names topiary balls.
- #4 Achillea: the label word "Choice" is nursery wording, not the name.

Not checked against the RHS from here (its site is blocked from the build container); #5's 4-8 m height
for a sasanqua is as supplied (the deck's species card says 2.5–4 m) and noted only.

## Photo order and the filename each photo should match

Asked for five at a time, in batch order. The slug is what `photos/<slug>.jpg` will be called.

1. #1 Helleborus Ice N’ Roses Early Rose ('Coseh 4000') → `helleborus-ice-n-roses-early-rose-coseh-4000`
2. #2 Chrysanthemum 'Autumn Bronze' → `chrysanthemum-autumn-bronze`
3. #3 Pittosporum tenuifolium BANNOW BAY ('Breebay') → `pittosporum-tenuifolium-bannow-bay-breebay`
4. #4 Achillea millefolium 'Sassy Summer Sangria' → `achillea-millefolium-sassy-summer-sangria`
5. #5 Camellia sasanqua 'Elfin Rose' → `camellia-sasanqua-elfin-rose`
6. #6 Achillea millefolium NEW VINTAGE RED ('Balvinred') → `achillea-millefolium-new-vintage-red-balvinred`
7. #7 Anemone Frilly Knickers ('Fp007') → `anemone-frilly-knickers-fp007`
8. #8 Nepeta 'Cat’s Pajamas' → `nepeta-cat-s-pajamas`
9. #9 Coreopsis SOLANNA GOLDEN SPHERE ('Dcoreo16') → `coreopsis-solanna-golden-sphere-dcoreo16`

**Batch status:** 0 of 9 dealt. First five asked for: #1–#5.
