# Batch of 2026-10-02b — 19 pre-built cards, no photos yet

`batch-as-sent.json` is Oscar's paste exactly as supplied (19 entries, pretty-printed, values
unedited; his second paste of 2026-10-02, after the Coppertop/Golden King pair). `batch-corrected.json`
is the 16 entries that will go in, with the standing layout conventions applied (table below).
**Nothing new is in `timber.html` yet**: each card is added when its photo arrives, five at a time in
batch order, so Oscar can confirm each photo matches the card — the 2026-09-26d routine. To deal a
group: split the five out of `batch-corrected.json`, then `node tools/add-plants-bulk.js --quick a.json
a.jpg …`, `photo-credits.js --set` for each (the bulk tool does not write a CREDITS entry), update this
file, restamp, `node tests/run-all.js` (sequential — `--jobs 3` has twice timed edge-test out).

Checks run on 2026-10-02 against deck 463 / hold 76.

**Doubles — three, resolved with `tools/compare-double.js` under the NEW-SESSION protocol.** Nothing
was added for them; the dealt card took the incoming only where it was blank, and keeps everything
else. Build restamped r323 after the three writes; `plants.csv` re-exported by the tool each time.
- #8 `Cotinus 'Grace'` — exact latin, dealt. Took `foliage` "deciduous" and `toxicity` "Sap may
  irritate sensitive skin." (ladder: Handle with care, the tier the sentence means). Kept: hue 335
  (incoming 330 — hue stays), peak May-Oct (incoming Jun-Oct; the siblings' Apr-Oct, Apr-Nov and
  Aug-Oct side with neither, so the dealt card keeps), ratings all within an icon, prose.
- #12 `Heuchera 'Timeless Night'` — the dealt `Heuchera villosa 'Timeless Night'`, matched by genus +
  cultivar. Took `foliage` "semi-evergreen". Kept: hue 320 (incoming 285), peak May-Sep (May-Oct), size
  0.1-0.5 m band (incoming 30 cm / 30–40 cm — the Heuchera siblings carry the same band and settle
  nothing, so the dealt card keeps), pestRisk 12 (incoming 8; siblings 7, 7, 11 split, and the card's own
  resilience line names vine weevil), sunNeed 50 (incoming 70; siblings 55, 55, 25 side with the card),
  sunMin 15 (incoming 35; siblings 10, 25, 30 — within their range, dealt keeps).
- #17 `Elaeagnus × submacrophylla` — the dealt `Elaeagnus ×submacrophylla` (same name, no space after
  the ×), matched with brackets/quotes/case stripped. Took `water` and `uses` (both blank). Kept peak
  Oct-Nov (incoming Sep-Nov; the two Elaeagnus siblings are Jan-Dec foliage cards and settle nothing).
  Ratings all within an icon.

**PROBABLE hits that are not doubles (5).** The tool's last matching step — a cultivar word found in
one card only — and each is a different plant, so all five go in as new cards:
- #3 Acer palmatum var. coreanum → Pinus koraiensis 'Jack Corbit' ("korean" in that card's common).
- #6 Prunus pissardii → Prunus cerasifera 'Nigra' ("Pissardii Nigra" in that card's `cvs`). 'Nigra' and
  'Pissardii' are two cultivars of the cherry plum, and Oscar's latin and common both say Pissardii.
- #9 Euphorbia × martini 'Waleulitr' → Brachyglottis Walberton's Silver Dormouse ("walberton").
- #15 and #18 Elaeagnus 'Viveleg' / 'Moonlight' → Elaeagnus 'Limelight' ("oleaster").
- #16 Photinia 'Carré Rouge' → Photinia PINK MARBLE ("fraseri").

**To add when photos arrive (16):** #1–7, 9–11, 13–16, 18, 19.

`tools/check-plant-json.js` on every entry of `batch-corrected.json`: **16 pass, 0 errors.** Remaining
warnings, none acted on: ratings of 3–5 on the 20-scale (as supplied — #1, #7, #9, #14, #15, #18, #19;
slow, low-care plants read as intended, the same call as the 2026-09-29 and 2026-10-01 batches), and
"moist" shared by `water` and `soil` on #2, #4, #11 and #13.

## Conventions applied in `batch-corrected.json` (Oscar's standing "go")

Only the layout fields change. Every other field is as supplied, including `hardinessNote`, `cvs`,
prose and all ratings.

- `soil` cut to one short line (≤26 chars) plus one short warning (≤44), written from the supplied
  sentences.
- `aspect`: this batch states light levels only ("Full sun to partial shade"), no facings, so the facing
  is derived from the sun band exactly as `tools/fit-incoming.js` `deriveFacing` does it: sunNeed ≥90 →
  `South / West`; ≥60 → `East / South / West`; ≥40 → `East / West`. (The 2026-10-01 batch stated its
  facings and kept them in the supplied order.)
- Sub-metre sizes in cm; any range that reaches 1 m is unchanged, hyphen included (the deck carries
  both "4–8 m" and "8-12m"). #6's "8 m+" matches the deck's Akebia quinata.
- #2's latin takes the deck's typographic apostrophe inside the cultivar name (`'Cunningham’s White'`,
  as `'Bob’s Blunder'` and `'Veitch’s Scarlet'`): `check-plant-json.js` rejects the straight form as
  unbalanced quotes and the bulk tool would not take it. `common` and `cvs` are untouched.
- Latin forms kept as supplied. The code-only forms `'Waleulitr'`, `'Ifhepr'` and `'Bremdream'` with the
  trade name in `common` match the deck's `Cotinus 'Londus'` (Dusky Maiden) and `Cephalanthus
  occidentalis 'Bailoptics'` (Fiber Optics); nothing arrived in the square-bracket form that the
  2026-10-01 batch converted. `Sedum 'Surrender Rose'` stays under Sedum although the deck's border
  stonecrops sit under Hylotelephium.
- `hue` 0 on #2 (white flowers) kept: 23 white-flowered dealt cards carry hue 0.

| # | latin (as it will go in) | soil | warning | aspect (sunNeed) | size H / W |
|---|---|---|---|---|---|
| 1 | Cordyline australis | Fertile, well-drained | No wet or waterlogged soil in winter | East / South / West (85) | 4-8 m / 2.5-4 m (unchanged) |
| 2 | Rhododendron 'Cunningham’s White' | Humus-rich, moist, acid | No lime or chalk; no prolonged waterlogging | East / South / West (60) | 1.5-2.5 m / 2.5-4 m (unchanged) |
| 3 | Acer palmatum var. coreanum | Humus-rich, moist, drained | No waterlogging, exposure or hot dry sites | East / South / West (65) | 4-6 m / 3-5 m (unchanged) |
| 4 | Acer palmatum 'Seiryu' | Moist, drained, lime-free | No waterlogging; shelter from drying winds | East / South / West (70) | 2.5-4 m / 2.5-4 m (unchanged) |
| 5 | Malus domestica 'Red Belle de Boskoop' | Deep, fertile, drained | No waterlogging, shallow chalk or acid soil | South / West (90) | 4-8 m / 4-8 m (unchanged) |
| 6 | Prunus pissardii | Any fertile, well-drained | No permanently waterlogged ground | South / West (90) | 8-12 m / 8 m+ (unchanged) |
| 7 | Sedum 'Surrender Rose' | Poor, sharply drained | No wet or heavy soil, above all in winter | South / West (95) | 30 cm / 40 cm |
| 9 | Euphorbia × martini 'Waleulitr' | Drained, neutral to chalky | Sharp drainage; no heavy wet winter soil | East / South / West (85) | 30–40 cm / 30–40 cm |
| 10 | Heuchera 'Black Forest Cake' | Fertile, moist, drained | Crown must drain, especially in winter | East / South / West (70) | 20–30 cm / 30–40 cm |
| 11 | Heuchera 'Winterberry' | Humus-rich, moist, drained | No winter waterlogging around the crown | East / South / West (60) | 30 cm / 40 cm |
| 13 | Heuchera 'Ifhepr' | Fertile, moist, drained | No winter wet; never let the roots dry out | East / West (50) | 30 cm / 40 cm |
| 14 | Geranium 'Bremdream' | Any fertile, well-drained | No persistently waterlogged soil | East / South / West (75) | 30–40 cm / 40–50 cm |
| 15 | Elaeagnus × submacrophylla 'Viveleg' | Any well-drained soil | No waterlogging; yellows on shallow chalk | East / South / West (75) | 2.5-4 m / 2.5-4 m (unchanged) |
| 16 | Photinia × fraseri 'Carré Rouge' | Any fertile, well-drained | No wet, heavy or compacted ground | East / South / West (85) | 2-3 m / 1.5-2 m (unchanged) |
| 18 | Elaeagnus × submacrophylla 'Moonlight' | Any well-drained soil | No waterlogging; yellows on shallow chalk | East / South / West (75) | 2-3 m / 2-3 m (unchanged) |
| 19 | Euonymus japonicus 'Extravaganza' | Any fertile, well-drained | No prolonged waterlogging | East / South / West (75) | 1.5-2 m / 1-1.5 m (unchanged) |

## Toxicity text — run through the card's ladder (`TOX_LADDER`), nothing changed

The card picks its SAFETY tier by keyword and does not read meaning. Every supplied sentence:
- #2 Rhododendron → **Toxic** ("harmful"), as the deck's four Rhododendron cards with text.
- #5 Malus 'Red Belle de Boskoop' "Fruit flesh is edible; seeds should not be deliberately eaten in
  quantity." → **Edible parts** (green leaf). "deliberately" breaks the ladder's "should not be eaten"
  keyword, so the seed caveat never reaches the Toxic rung and the sentence lands on its first half.
  For an eating apple that is the tier the sentence means; the deck's Malus 'Evereste' ("seeds contain
  potentially harmful compounds") prints Toxic instead. Noted only.
- #6 Prunus pissardii → **Toxic** ("cyanogenic", "should not be eaten"), as 'Kanzan' and the cherry laurel.
- #8 Cotinus (written to the dealt card) → **Handle with care** ("sap", "irritate").
- #9 Euphorbia → **Toxic** ("toxic"); the deck's three Euphorbia cards carry no text.
- #19 Euonymus → **Toxic**, as the two Euonymus cards that carry text.
- 13 of 19 have no toxicity text and print nothing, the deck's norm.

## Oscar's own `uncertain` flags — carried here, not resolved

- #1 Cordyline: the label ("idéal en pot et bac") names no cultivar; the card goes in as the species.
  If the photo shows a coloured-leaf cultivar (the deck has Charlie Boy and 'Torbay Dazzler'), the
  latin needs the cultivar before dealing — the photo slug follows the latin.
- #3 Acer coreanum: Kew treats var. coreanum as a synonym of subsp. amoenum; 'Korean Gem' not assumed.
- #5 Malus: size depends on rootstock; "Boskoop Rouge" on the label is Red Belle de Boskoop.
- #6 Prunus pissardii: RHS lists Prunus pissardii with P. cerasifera 'Atropurpurea' as a synonym.
- #7 Sedum: the label word "Improved" is not part of the registered name; retailers give H6 and H7, H6 kept.
- #8 Cotinus: hybrid, syn. C. × dummeri 'Grace' — the dealt card's `cvs` already says so.
- #11 Heuchera 'Winterberry': "a reliable cultivar record could not be verified". A web search on
  2026-10-02 found none either — the RHS lists 'Winter Red' and 'Winter Joy', and 'Wildberry' (Dolce
  series) exists. **[Unverified] that this plant is a 'Winterberry'.** The label in Oscar's photo settles
  it; if it reads differently, rename in `batch-corrected.json` before dealing.
- #13 Heuchera 'Ifhepr': trade designation Cranberry, Indian Summer Series — as the `cvs` says.
- #15, #17, #18 Elaeagnus: × ebbingei is the trade synonym of × submacrophylla; the label word "ERWIAM"
  is not a cultivar name; 'Moonlight' is an unresolved name at the RHS.
- #16 Photinia: the label OCR "carrray rouge" was corrected to 'Carré Rouge'.
- #19 Euonymus: limited cultivar information, conservative spread and care scores; the label word
  "Sense" treated as noise.

None of these were checked against the RHS from here (its site is blocked from the build container).

## Photo order and the filename each photo should match

Asked for five at a time, in batch order. The slug is what `photos/<slug>.jpg` will be called
(NEW-SESSION.md slug rule). The three doubles' photos become a **second frame on the dealt card** with
`tools/add-swap.js "<latin>" photo.jpg --as <suffix>` — never a replacement, never a question.

1. #1 Cordyline australis → `cordyline-australis`
2. #2 Rhododendron 'Cunningham’s White' → `rhododendron-cunningham-s-white`
3. #3 Acer palmatum var. coreanum → `acer-palmatum-var-coreanum`
4. #4 Acer palmatum 'Seiryu' → `acer-palmatum-seiryu`
5. #5 Malus domestica 'Red Belle de Boskoop' → `malus-domestica-red-belle-de-boskoop`
6. #6 Prunus pissardii → `prunus-pissardii`
7. #7 Sedum 'Surrender Rose' → `sedum-surrender-rose`
8. #8 Cotinus 'Grace' → second frame on the dealt `Cotinus 'Grace'`
9. #9 Euphorbia × martini 'Waleulitr' → `euphorbia-martini-waleulitr`
10. #10 Heuchera 'Black Forest Cake' → `heuchera-black-forest-cake`
11. #11 Heuchera 'Winterberry' → `heuchera-winterberry` (name [Unverified], see above)
12. #12 Heuchera 'Timeless Night' → second frame on the dealt `Heuchera villosa 'Timeless Night'`
13. #13 Heuchera 'Ifhepr' → `heuchera-ifhepr`
14. #14 Geranium 'Bremdream' → `geranium-bremdream`
15. #15 Elaeagnus × submacrophylla 'Viveleg' → `elaeagnus-submacrophylla-viveleg`
16. #16 Photinia × fraseri 'Carré Rouge' → `photinia-fraseri-carre-rouge`
17. #17 Elaeagnus × submacrophylla → second frame on the dealt `Elaeagnus ×submacrophylla`
18. #18 Elaeagnus × submacrophylla 'Moonlight' → `elaeagnus-submacrophylla-moonlight`
19. #19 Euonymus japonicus 'Extravaganza' → `euonymus-japonicus-extravaganza`

**Photos 1–5 arrived** (Oscar, 2026-10-02 afternoon, no text: #2–#4 Galaxy S24 12:50–12:53, #1 and #5
two-panel collages from the collage app with no camera EXIF; a byte scan found no C2PA or
`trainedAlgorithmicMedia` markers in any file). **Cards 2–5 dealt**; conventions exactly as in
`batch-corrected.json`; every other field as supplied. Deck 463 -> 467, hold 76 unchanged.
`add-plants-bulk.js --quick` (data audit, plant-sense and deck audit green once the CREDITS entries were
written — the bulk tool stops on NO ENTRY until `photo-credits.js --set <basename>` runs); restamped r324.
All four frame whole at default framing, no `PHOTO_FOCUS` entries. Originals here are byte-identical to
the files Oscar sent; the collages are kept whole.

| # | card | photo as sent | staged | notes |
|---|---|---|---|---|
| 2 | Rhododendron 'Cunningham’s White' | 3000x3062 | 1200x1225 | one open flower, white with a mauve-pink inner bud, over dark green leaves; a brown spot on the upper petal and one brown-edged petal (an ageing bloom). Open on the bench in October against a May-Jun band — a bench photo says nothing about flowering time (protocol rule 3). |
| 3 | Acer palmatum var. coreanum | 2908x3716 | 1200x1533 | matches: green five-to-seven-lobed serrated leaves on red petioles, still green (the Sep-Nov colour not yet on). |
| 4 | Acer palmatum 'Seiryu' | 2478x3374 | 1200x1634 | matches: finely dissected green leaves with red-tinted tips on yellow-green shoots. |
| 5 | Malus 'Red Belle de Boskoop' | collage 2160x3840 (leaves and stem left, backlit leaves and the graft union right) | 1200x2133 | foliage only: serrated ovate leaves with felted undersides, no fruit in the shot. [Unverified] the cultivar from leaf alone; filed as Red Belle de Boskoop because that is the card the photo was sent for. Both panels whole; the collage app's blurred fill sits behind the stats panel, as on the Nerine and Coppertop cards. |

**#1 Cordyline — not dealt, photo stored as `cordyline-australis-as-sent.jpg`.** The collage (2160x3840,
two panels of the same plant) shows a red-leaved cordyline: deep burgundy-red sword leaves with pinker
midribs on a short trunk. That is a coloured-leaf cultivar, not the plain green species the JSON describes
(hue 110, no leaf colour in `visual`), and the JSON's own `uncertain` says the label named no cultivar.
[Unverified] which cultivar it is — nothing in the photo names it. Waits on Oscar reading the label. When
he does: set `latin` (the slug follows it), `common` and `hue` in `batch-corrected.json`, and
hardiness if the label gives one (the dealt Charlie Boy card is H3; the JSON's H4 is the species'
rating), then deal it from the stored file. A species card under a red-leaf photo would tell a customer
the species is red.

**Card 6 dealt** (Oscar's photo, "The prunus": Galaxy S24, 2026-10-02 12:48, 3000x2804, no AI or C2PA
markers; staged 1200x1122). Conventions exactly as in `batch-corrected.json`; every other field as
supplied. Deck 467 -> 468, hold 76 unchanged. `add-plants-bulk.js --quick` with the one pair, credit by
basename, restamped r325. The original here is byte-identical to the file Oscar sent.

| # | card | notes |
|---|---|---|
| 6 | Prunus pissardii | matches: dark red-purple serrated leaves backlit against blue sky, orange-red veins showing through, on a dark stem. The landscape frame crops to the portrait well at default framing with both main leaves and the branch inside it. Foliage only; [Unverified] 'Pissardii' rather than another purple-leaved cherry plum from leaf alone — filed as sent. The "8 m+" spread renders on the rail. |

**Card 7 dealt** (Oscar's photo, "Sedum u asked 4": a two-panel collage from the collage app, 2160x3840,
no camera EXIF, no AI or C2PA markers; staged 1200x2133). Conventions exactly as in `batch-corrected.json`;
every other field as supplied. Deck 468 -> 469, hold 76 unchanged. `add-plants-bulk.js --quick` with the
one pair, credit by basename, restamped r326. The original here is byte-identical to the file Oscar sent;
the collage is kept whole. (The Prunus gate of the same evening was stopped two minutes in so that one
gate covers cards 6 and 7.)

| # | card | notes |
|---|---|---|
| 7 | Sedum 'Surrender Rose' | matches: broad heads of starry rosy-pink flowers, some heads still in green bud, over fleshy blue-green leaves. Both panels in the well at default framing; the collage app's blurred pink-green fill sits behind the stats panel, as on the other collages. In flower on the bench at the start of October, inside the Aug-Oct band. |

**Cards 9 and 10 dealt** (Oscar's photos, "The heuchera and the euphorbia": the Heuchera a Galaxy S24
shot of 2026-10-02 11:07, 4000x3000 with EXIF orientation 6, staged upright 1200x1600; the Euphorbia a
three-panel collage from the collage app, 2160x3840, no camera EXIF, staged 1200x2133; no AI or C2PA
markers in either). Conventions exactly as in `batch-corrected.json`; every other field as supplied.
Deck 469 -> 471, hold 76 unchanged. One `add-plants-bulk.js --quick` run, credits by basename, restamped
r327. Originals here are byte-identical to the files Oscar sent; the collage is kept whole. (The gate for
cards 6–7 was stopped a minute in so that one gate covers cards 6, 7, 9 and 10.)

| # | card | notes |
|---|---|---|
| 9 | Euphorbia × martini 'Waleulitr' | matches: narrow lime-to-yellow-green leaves in whorls with rusty-orange new tips, two small panels above one large; all three panels in the well at default framing, the title over the top-left panel. No flowers in the shot. |
| 10 | Heuchera 'Black Forest Cake' | Oscar wrote "the heuchera" without a cultivar; filed as Black Forest Cake because the near-black ruffled leaves with vivid cherry-red bells match its card and no other heuchera in the batch has red flowers ([Inference] from the flowers — Timeless Night's are pink, Ifhepr's pale). The cluster sits right of centre; its rightmost bells tuck under the growth rail, as on the Escallonia card. Red bells open on the bench in October against a May-Sep band — a bench photo says nothing about flowering time. |

**Batch status:** 8 of 16 dealt (#2–#7, #9, #10). #1 waits on the cultivar. Next five in order: #8
Cotinus 'Grace' (second frame on the dealt card), #11 Heuchera 'Winterberry' (label in the shot, please
— the name is unverified), #13 Heuchera 'Ifhepr', #14 Geranium 'Bremdream', #15 Elaeagnus 'Viveleg'.
