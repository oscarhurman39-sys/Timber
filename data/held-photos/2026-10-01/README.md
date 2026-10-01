# Batch of 2026-10-01 — 26 pre-built cards, no photos yet

`batch-as-sent.json` is Oscar's paste exactly as supplied (26 entries, one per line, values
unedited). `batch-corrected.json` is the 20 entries that will go in, with the standing layout
conventions applied (table below). **Nothing is in `timber.html` yet**: each card is added when
its photo arrives, five at a time in batch order, so Oscar can confirm each photo matches the
card — the 2026-09-26d routine. To deal a group: split the five out of `batch-corrected.json`,
then `node tools/add-plants-bulk.js --quick a.json a.jpg …`, `photo-credits.js --set` for each
(add-plant does not write a CREDITS entry), update this file, `node tests/run-all.js --jobs 3`.

Checks run on 2026-10-01 against deck 436 / hold 76 (`tools/data-audit.js`):

**Already in the deck — not added (4).** Three have a different latin form, so the exact-match
duplicate check in `add-plant.js` would not have caught them:
- #5 `Laurus nobilis` — dealt, same latin and same common name.
- #7 `Rosa [Vanessa Bell] ('Auseasel')` — dealt as `Rosa 'Auseasel'` ("English rose Vanessa Bell").
- #16 `Cephalanthus occidentalis [Fiber Optics] ('Bailoptics')` — dealt as
  `Cephalanthus occidentalis 'Bailoptics'` ("Button bush 'Fiber Optics'").
- #8 `Aster 'Rose Quartz' (Autumn Jewels Series)`, common "Rose Crystal Aster" — the deck deals
  `Symphyotrichum dumosum 'Rose Crystal'` ("Aster 'Rose Crystal'", from the 2026-09-26 batch).
  Oscar's own `uncertain` note says Rose Crystal "is also encountered under the cultivar name
  Rose Quartz". [Unverified] whether the two names are one cultivar. Waits on Oscar: replace
  the dealt card's text, add it as a second card, or skip.

As with Cordyline Charlie Boy on 2026-09-29, the new JSON for a plant that is already dealt is
not applied to the live card; swapping is one `plants.csv` row each if Oscar wants it.

**Already held (1).** #25 `Physocarpus [Little Devil] ('Donna May')` is
`Physocarpus opulifolius LITTLE DEVIL ('Donna May')` in PLANTS_ON_HOLD, written earlier with
its own text. A photo deals that card with `tools/deal-plant.js`. Oscar's new JSON differs from
the held text (H7 vs H6, 0.9–1.2 m vs 1–1.5 m, peak May-Jul vs May-Aug, several ratings).
Waits on Oscar: keep the held text, or replace it with his new JSON before dealing.

**Not a card (1).** #19 "Viburnum sp." — only the genus was readable from the label (Oscar's
`uncertain` says so). `check-plant-json.js` rejects it on four counts: hardiness "unknown", a
light level in `aspect`, and `peak` / `foliage` "species-dependent". Needs the species or
cultivar from the label; nothing else can be done with it.

**To add when photos arrive (20):** #1–4, 6, 9–15, 17, 18, 20–24, 26.

`tools/check-plant-json.js` on every entry of `batch-corrected.json`: **20 pass, 0 errors.**
Remaining warnings, none acted on: ratings of 3–5 on the 20-scale (as supplied; slow, low-care
plants read as intended — the same call as the 2026-09-29 Skimmias and Rhododendron), and
"moist" shared by `water` and `soil` on #1 (mirrors its dealt sibling Dancing Pixies Tini) and
#13.

## Conventions applied in `batch-corrected.json` (Oscar's standing "go")

Only the layout fields change. Every other field is as supplied, including `hardinessNote`
(the "H4 · −10 to −5°C" form the 2026-09-29 cards carry), `cvs`, prose and all ratings.

- `soil` cut to one short line (≤26 chars) plus one short warning (≤44); the two roses take
  the deck's rose default ("Fertile, drained, any pH" / "No waterlogging; renew old rose soil").
- Sub-metre sizes in cm; any range that reaches 1 m is unchanged.
- `aspect` in the deck's `North / East / West` form, in the order supplied. #24's
  "North, east, west or sheltered south-facing" is `Any aspect`.
- Trade names: Oscar's `[Royal William] ('Korzaun')` square brackets are not the deck's form
  (`CHARLIE BOY ('Ric01')`, noted 2026-09-29). #3, #4, #12 and #26 take the CAPS form; #1 and
  #10 match their dealt siblings instead (`Saxifraga Dancing Pixies Tini ('Sh 1914')`,
  `Eucalyptus gunnii Azura ('Cagire')`). Photo slugs are unaffected — the slug rule is
  case-insensitive and drops the brackets either way.

| # | latin (as it will go in) | soil | warning | aspect | size H / W |
|---|---|---|---|---|---|
| 1 | Saxifraga Dancing Pixies Toni ('Sh 1925') | Moist, drained, any pH | Shade from hot afternoon sun; no winter wet | North / East / West | 10–30 cm / 20–40 cm |
| 2 | Stipa tenuissima 'Pony Tails' | Light, drained, any pH | No waterlogging; rich soil makes it floppy | South / East / West | 50–70 cm / 30–50 cm |
| 3 | Rosa ROYAL WILLIAM ('Korzaun') | Fertile, drained, any pH | No waterlogging; renew old rose soil | South / East / West | 0.7–1 m / 0.6–1 m (unchanged) |
| 4 | Rosa PRECIOUS LOVE ('Kirlowo') | Fertile, drained, any pH | No waterlogging; renew old rose soil | South / East / West | 50–80 cm / 50–80 cm |
| 6 | Leucothoe 'Little Flames' | Humus-rich, drained, acid | No lime or chalk; never let it dry out | East / West / South | 40–60 cm / 30–50 cm |
| 9 | Anemone 'Fantasy Aurora' | Humus-rich, well-drained | No waterlogging or dry exposed ground | East / West / South | 40–60 cm / 40–60 cm |
| 10 | Eucalyptus gunnii France Bleu ('Rengun') | Moist, drained, lime-free | No chalk, deep shade or stagnant winter wet | South / East / West | 1.5–2.5 m / 0.5–1 m (unchanged) |
| 11 | Gaultheria mucronata 'Lilian' | Humus-rich, drained, acid | No lime or chalk; never let it dry out | East / West / North | 0.5–1 m / 0.5–1 m (unchanged) |
| 12 | Sambucus nigra LACED UP ('Snr1292') | Any, moist but drained | Shade dulls the foliage; no waterlogging | South / East / West | 2–3 m / 0.8–1.2 m (unchanged) |
| 13 | Clematis cirrhosa var. purpurascens 'Freckles' | Fertile, humus-rich, moist | Shelter it; no winter wet or frost pockets | South / West | 2.5–4 m / 1.5–2.5 m (unchanged) |
| 14 | Leucothoe keiskei 'Burning Love' | Humus-rich, drained, acid | No lime; never let it dry out | East / West / North | 50–80 cm / 50–80 cm |
| 15 | Leucothoe axillaris 'Curly Red' | Humus-rich, drained, acid | No lime; never let it dry out completely | North / East / West | 40–60 cm / 40–60 cm |
| 17 | Coprosma 'Lemon and Lime' | Fertile, free-draining | No waterlogging; shelter from hard frost | South / West | 0.8–1 m / 0.8–1 m (unchanged) |
| 18 | Berberis thunbergii 'Admiration' | Any soil, well-drained | Shade dulls the foliage; no waterlogging | South / East / West | 40–60 cm / 40–60 cm |
| 20 | Escallonia 'Red Dream' | Any soil, well-drained | No winter wet or cold exposed inland sites | South / West | 0.5–1 m / 0.5–1 m (unchanged) |
| 21 | Hydrangea paniculata 'Quick Fire Fab' | Humus-rich, well-drained | Never let it dry out; no waterlogging | South / East / West | 1.5–2 m / 1.2–1.8 m (unchanged) |
| 22 | Camellia sasanqua 'Bonanza' | Humus-rich, drained, acid | No lime or drought; shade from morning sun | North / East / West | 1.5–2.5 m / 1.5–2 m (unchanged) |
| 23 | Camellia 'Fairy Blush' | Humus-rich, drained, acid | No lime or drought; shelter from frost | North / East / West | 1.5–2 m / 1–1.5 m (unchanged) |
| 24 | Ajuga reptans 'Black Scallop' | Rich, drained, any pH | No bone-dry ground or standing water | Any aspect | 10–20 cm / 0.5–1 m |
| 26 | Physocarpus opulifolius FIRESIDE ('UMNHarpell') | Any, moist but drained | Shade dulls the foliage; no waterlogging | South / East / West | 1.5–2 m / 1.2–1.8 m (unchanged) |

## Toxicity text — flagged to Oscar, not changed

The card picks its SAFETY tier by keyword (`TOX_LADDER` in `timber.html`) and does not read
meaning. Run through that ladder, two supplied sentences land on a tier the sentence does not mean:

- #2 Stipa 'Pony Tails': "Not generally considered poisonous, but fine leaves and awns may irritate
  skin, eyes or animals." — "poison" puts it on the orange **Toxic** rung for a grass the sentence
  calls not poisonous. Suggested, keeping Oscar's claim: "Fine leaves and seed awns can irritate
  the skin and eyes of people and animals." → Handle with care.
- #12 Sambucus LACED UP: "Raw leaves, stems and unripe fruit contain compounds that can cause
  illness if eaten; ripe berries should be cooked before consumption." — matches no keyword, so
  it falls to the amber **Handle with care** default; raw elder is the ladder's own worked example
  of a hazard (cyanogenic). Suggested: "Raw leaves, stems and unripe berries are harmful if eaten;
  ripe berries must be cooked before eating." → Toxic.
- #18 Berberis 'Admiration': "Berries should not be treated as food; thorny stems may cause
  injury." — no keyword either ("treated as food" is not "treated as edible"), so amber by
  default rather than by decision. Reasonable for a thorny shrub; noted only.

Every other non-blank sentence lands on **Toxic** ("harmful" / "should not be eaten"), consistent
with the deck's existing roses, Leucothoe, Anemone, Clematis, Hydrangea and Eucalyptus cards.
Seven of the 20 have no toxicity text and print nothing, the deck's norm.

## Photo order and the filename each photo should match

Asked for five at a time, in this order. The slug is what `photos/<slug>.jpg` will be called
(NEW-SESSION.md slug rule); a photo named like this pairs itself.

1. #1 Saxifraga Dancing Pixies Toni ('Sh 1925') → `saxifraga-dancing-pixies-toni-sh-1925`
2. #2 Stipa tenuissima 'Pony Tails' → `stipa-tenuissima-pony-tails`
3. #3 Rosa ROYAL WILLIAM ('Korzaun') → `rosa-royal-william-korzaun`
4. #4 Rosa PRECIOUS LOVE ('Kirlowo') → `rosa-precious-love-kirlowo`
5. #6 Leucothoe 'Little Flames' → `leucothoe-little-flames`
6. #9 Anemone 'Fantasy Aurora' → `anemone-fantasy-aurora`
7. #10 Eucalyptus gunnii France Bleu ('Rengun') → `eucalyptus-gunnii-france-bleu-rengun`
8. #11 Gaultheria mucronata 'Lilian' → `gaultheria-mucronata-lilian`
9. #12 Sambucus nigra LACED UP ('Snr1292') → `sambucus-nigra-laced-up-snr1292`
10. #13 Clematis cirrhosa var. purpurascens 'Freckles' → `clematis-cirrhosa-var-purpurascens-freckles`
11. #14 Leucothoe keiskei 'Burning Love' → `leucothoe-keiskei-burning-love`
12. #15 Leucothoe axillaris 'Curly Red' → `leucothoe-axillaris-curly-red`
13. #17 Coprosma 'Lemon and Lime' → `coprosma-lemon-and-lime`
14. #18 Berberis thunbergii 'Admiration' → `berberis-thunbergii-admiration`
15. #20 Escallonia 'Red Dream' → `escallonia-red-dream`
16. #21 Hydrangea paniculata 'Quick Fire Fab' → `hydrangea-paniculata-quick-fire-fab`
17. #22 Camellia sasanqua 'Bonanza' → `camellia-sasanqua-bonanza`
18. #23 Camellia 'Fairy Blush' → `camellia-fairy-blush`
19. #24 Ajuga reptans 'Black Scallop' → `ajuga-reptans-black-scallop`
20. #26 Physocarpus opulifolius FIRESIDE ('UMNHarpell') → `physocarpus-opulifolius-fireside-umnharpell`

**Cards 1–5 dealt** (Oscar's photos, Galaxy S24, 2026-09-30; byte scan found no C2PA or
`trainedAlgorithmicMedia` markers in any file). Conventions exactly as in `batch-corrected.json`;
every other field as supplied. Deck 436 -> 441, hold 76 unchanged. Added with
`add-plants-bulk.js --quick` (data audit, plant-sense, deck audit green); CREDITS entries with
`photo-credits.js --set`, since the bulk tool does not write them; build restamped to r310.
The originals here are byte-identical to the files Oscar sent.

| # | card | photo as sent | staged | notes |
|---|---|---|---|---|
| 1 | Saxifraga Dancing Pixies Toni ('Sh 1925') | 3000x3750 | 1200x1500 | `PHOTO_FOCUS` '100% 40%': the flower cluster sits against the right edge and a centred crop lost the right-hand flowers. Not the same photograph as the dealt Tini card (that one is a green-leaf collage). |
| 2 | Stipa tenuissima 'Pony Tails' | 4000x3000, EXIF orientation 6 | 1200x1600 (upright) | matches: fine green threads with buff strands. |
| 3 | Rosa ROYAL WILLIAM ('Korzaun') | 4000x3000, EXIF orientation 6 | 1200x1600 (upright) | matches: high-centred velvety deep red, dark glossy leaves. A blurred pot label at lower right is unreadable. |
| 4 | Rosa PRECIOUS LOVE ('Kirlowo') | 3000x4000 (`-original.jpg`) | crop 3000x3040 -> 1200x1216 | Oscar pixelated the label at the bottom of the frame; the staged file is the top 3040 rows of the original (sharp extract, quality 92), which removes the pixelated block and nothing else. |
| 5 | Leucothoe 'Little Flames' | 3000x4000 | 1200x1600 | matches: red new growth, petioles and stems over green. |

Flagged to Oscar, not changed:
- #1 flowers read vivid magenta-pink rather than "delicate rose-pink edged darker pink", and the
  leaves read dark bronze-purple with a silvery sheen rather than "dark green flushed purple".
- #2 SAFETY prints the orange **Toxic** rung from the supplied sentence (see the toxicity section
  above); the rewrite waits on Oscar's go. One `plants.csv` row when he gives it.
- #3 and #4: both blooms are wider than the 0.62 photo well, so the outermost petal tips at each
  side fall just outside the frame. The whole head is in the detail view.
- #4 bloom is fully double with no stamens visible, against "semi-double"; the leaves at the right
  carry pale spots (spray residue or mildew, not confirmed).

**Test note.** `tests/run-all.js --jobs 3` returned 17/18 on this tree (599 s): edge-test timed
out clicking `#reset2` after its 441-click "clear the whole deck" walk, i.e. the deck was not
empty when it reloaded, with app-test (229 s) and features-test running beside it. Re-run alone,
edge-test passes 28/28. Same shape as the 2026-09-27c note: a fixed 420 ms settle per click under
3-job load, not a card defect; the 17 other checks, deck-audit included, were green in the same run.

**Cards 6–10 dealt** (Oscar's photos: #11 and #12 Galaxy S24 2026-09-30; #9, #10 and #13 are his
two-panel collages from the collage app, no camera EXIF, no AI markers in any file). Conventions
exactly as in `batch-corrected.json`; every other field as supplied. Deck 441 -> 446, hold 76
unchanged. Dealt in two `add-plants-bulk.js --quick` runs (three photos arrived, then the two
collages); credits with `photo-credits.js --set`; restamped to r311. Originals here are
byte-identical to the files Oscar sent; the collages are kept whole, as always.

| # | card | photo as sent | staged | notes |
|---|---|---|---|---|
| 9 | Anemone 'Fantasy Aurora' | collage 2160x3840 (leaves left, flower and buds right) | 1200x2133 | both panels in the well; the collage app's blurred fill below them sits behind the stats panel bar a sliver at the right, same as the dealt Tini card. |
| 10 | Eucalyptus gunnii France Bleu ('Rengun') | collage 2160x3840 (buds left, foliage right) | 1200x2133 | both panels in the well, as #9. Cream flower buds visible in the left panel. |
| 11 | Gaultheria mucronata 'Lilian' | 4000x3000, EXIF orientation 6 | 1200x1600 (upright) | matches: pink berries with the star calyx, spine-tipped glossy leaves, red stems. |
| 12 | Sambucus nigra LACED UP ('Snr1292') | 4000x3000, EXIF orientation 6 | 1200x1600 (upright) | deeply cut near-black foliage on a red stem. |
| 13 | Clematis cirrhosa var. purpurascens 'Freckles' | collage 2160x2475 (two portrait panels side by side) | 1200x1375 | `PHOTO_FOCUS` '100% 40%': the sharp freckled bells and leaves are the right panel; a centred crop showed the soft-focus left panel (canes, a nursery label) with the title over it. |

Flagged to Oscar, not changed:
- #9 the open flower shows a single row of petals and reads vivid magenta-pink, against
  "semi-double rose-pink". The buds and golden stamens match.
- #12 the foliage carries bronze-orange late-season tints rather than the near-black of summer.
  [Unverified] the cultivar from foliage alone — the held Black Lace card looks the same in leaf;
  this is filed as Laced Up because that is the card the photo was sent for.
- #12 SAFETY prints the amber **Handle with care** default from the supplied sentence (see the
  toxicity section above): it under-warns for raw elder. The rewrite waits on Oscar's go.
- #13 the left panel is soft-focus and carries an unreadable nursery label with a Union Jack;
  the right panel's older bells have brown-spotted petals. Flowers out at the start of October
  against a Nov-Feb band.

**Batch status:** 10 of 20 dealt (#1–4, 6, 9–13). Next five in order: #14 Leucothoe keiskei
'Burning Love', #15 Leucothoe axillaris 'Curly Red', #17 Coprosma 'Lemon and Lime', #18 Berberis
thunbergii 'Admiration', #20 Escallonia 'Red Dream'.

**#13 Clematis 'Freckles' photo replaced** the same evening: Oscar sent a second two-panel
collage ("this might be a better photo") with the bells and fresh leaves sharp in the left panel
and a second bell by a cane in the right. It is the card now (2160x2988, staged 1200x1660 through
the same canvas pipeline as the bulk tool); the first collage is kept unused as
`clematis-cirrhosa-var-purpurascens-freckles-alt.jpg`. `PHOTO_FOCUS` moved from '100% 40%' to
'0% 40%' because the sharp panel is now the left one and starts at the edge. Card text and ratings
unchanged; CREDITS entry carries the note; restamped r312. optimise-photos, photo-credits,
data-audit, check-boot and deck-audit re-run green after the swap.

**Test note, second run.** `run-all --jobs 3` on the cards 6–10 tree: 17/18 again, edge-test only,
the same `#reset2` timeout after the whole-deck walk (now 446 clicks); app-test ran beside it at
229 s. Re-run alone it passes — see the ledger line for the result that was in hand at the push.

**Cards 11–12 dealt** (Oscar's photos, Galaxy S24, 2026-09-30; "both leucothoe, starting with
curly, image 1"; no AI markers). Conventions exactly as in `batch-corrected.json`; every other
field as supplied. Deck 447 -> 449 (the Nerine one-off of 2026-10-01b sits between), hold 76
unchanged. `add-plants-bulk.js --quick`; credits with `photo-credits.js --set`; restamped r314.
Originals here are byte-identical to the files Oscar sent.

| # | card | photo as sent | staged | notes |
|---|---|---|---|---|
| 15 | Leucothoe axillaris 'Curly Red' | 4000x3000, EXIF orientation 6 | 1200x1600 (upright) | matches: tightly curled glossy leaves, red margins over green. |
| 14 | Leucothoe keiskei 'Burning Love' | 3000x3484 | 1200x1394 | matches: lance-shaped glossy leaves, red-purple new growth on red stems over green. A nursery label at the far left edge of the frame (part-shade pictogram text, no plant name) falls outside the card's well. |

Nothing flagged on either beyond what the card already says.

**Batch status:** 12 of 20 dealt (#1–4, 6, 9–15). Next five in order: #17 Coprosma 'Lemon and
Lime', #18 Berberis thunbergii 'Admiration', #20 Escallonia 'Red Dream', #21 Hydrangea paniculata
'Quick Fire Fab', #22 Camellia sasanqua 'Bonanza'. Then #23, #24, #26.

**Cards 13–15 dealt** (Oscar's photos, "Lemlime, Admiration and the Escallonia in order":
#18 and #20 Galaxy S24, #17 his two-panel collage; no AI markers). Conventions exactly as in
`batch-corrected.json`; every other field as supplied. Deck 449 -> 452, hold 76 unchanged.
`add-plants-bulk.js --quick`; credits with `photo-credits.js --set`; restamped r315. Originals
here are byte-identical to the files Oscar sent; the collage is kept whole.

| # | card | photo as sent | staged | notes |
|---|---|---|---|---|
| 17 | Coprosma 'Lemon and Lime' | collage 2160x3840 | 1200x2133 | both panels in the well, default framing; the collage app's fill sits behind the stats panel bar a sliver at the right. |
| 18 | Berberis thunbergii 'Admiration' | 4000x3000, EXIF orientation 6 | 1200x1600 (upright) | matches: coral-red to burgundy leaves with the fine yellow margin. |
| 20 | Escallonia 'Red Dream' | 4000x3000, EXIF orientation 6 | 1200x1600 (upright) | glossy small leaves on red stems, one red flower cluster at the right edge of the frame, partly under the growth rail. |

Flagged to Oscar, not changed:
- #17 the leaves carry orange and coral tints as well as the lime, lemon and green the card
  describes (autumn colouring in the shot).
- #20 one flower cluster only, shot in October against a Jun-Sep band; a summer shot in full
  bloom would be an upgrade.

**Batch status:** 15 of 20 dealt (#1–4, 6, 9–15, 17, 18, 20). Last five in order: #21 Hydrangea
paniculata 'Quick Fire Fab', #22 Camellia sasanqua 'Bonanza', #23 Camellia 'Fairy Blush', #24 Ajuga
reptans 'Black Scallop', #26 Physocarpus opulifolius FIRESIDE ('UMNHarpell').

**Cards 16–20 dealt** (Oscar's photos, Galaxy S24, all five 4000x3000 with EXIF orientation 6,
staged upright at 1200x1600; no AI markers). Conventions exactly as in `batch-corrected.json`;
every other field as supplied. Deck 452 -> 457, hold 76 unchanged. `add-plants-bulk.js --quick`;
credits with `photo-credits.js --set`; restamped r316. Originals here are byte-identical to the
files Oscar sent.

| # | card | notes |
|---|---|---|
| 21 | Hydrangea paniculata 'Quick Fire Fab' | two big conical panicles, creamy white with a pink flush on the outer florets, over the leaves. |
| 22 | Camellia sasanqua 'Bonanza' | one open semi-double flower with golden stamens, buds beside it, glossy leaves; a cane and a tie in the background. |
| 23 | Camellia 'Fairy Blush' | foliage only: copper-orange new leaves over green. |
| 24 | Ajuga reptans 'Black Scallop' | foliage only: glossy near-black scalloped rosettes, a few bronzing outer leaves. |
| 26 | Physocarpus opulifolius FIRESIDE ('UMNHarpell') | foliage only: deep purple-maroon lobed leaves on red stalks; a purple label is a blur in the background. |

Flagged to Oscar, not changed:
- #21 the panicles are at the white-with-a-blush stage; the card leads with the watermelon and
  reddish-pink they turn later.
- #22 the flower reads deep cerise-pink rather than "deep crimson-red" (hue 355).
- #23 no flower in the shot (peak Feb-Apr); a flowering photo in spring would be an upgrade.
- #26 [Unverified] the cultivar from foliage alone — the deck's other dark ninebarks look the same
  in leaf; filed as Fireside because that is the card the photo was sent for.

**Batch complete: 20 of 20 dealt** (#1–4, 6, 9–15, 17, 18, 20–24, 26). Deck 436 -> 457 over the
day, with the Nerine of 2026-10-01b in between. Not added, as recorded at the top: #5, #7, #8, #16
(already dealt), #25 (held, a photo deals it), #19 (genus only). Still waiting on Oscar: the two
toxicity rewrites (#2, #12), the Viburnum species, Rose Quartz vs the dealt Rose Crystal, and
whether Little Devil keeps its held text.
