# Batch of 2026-10-01c — five pre-built cards, no photos yet

`batch-as-sent.json` is Oscar's paste exactly as supplied (five entries, sent after the 26-card
batch of the same day was closed). `batch-corrected.json` is the three entries that will go in,
with the standing layout conventions applied (table below). **Nothing is in `timber.html` yet**:
each card is added when its photo arrives, the 2026-09-26d routine.

Checks run on 2026-10-01 against deck 457 / hold 76:

**Already in the deck — not added (2).**
- #3 `Cephalanthus occidentalis [Fiber Optics] ('Bailoptics')` — dealt, with a photo, as
  `Cephalanthus occidentalis 'Bailoptics'` ("Button bush 'Fiber Optics'"). Second time this JSON
  has been sent today (#16 of the main batch). As with Cordyline Charlie Boy on 2026-09-29, the new
  JSON is not applied to the live card; swapping is one `plants.csv` row if Oscar wants it, and a
  new photo would replace the one it carries.
- #5 `Viburnum tinus 'Eve Price'` — dealt, with a photo, same latin ("Laurustinus 'Eve Price'").
  Same handling. [Unverified] whether this is the plant behind the genus-only "Viburnum sp." label
  of the main batch (#19); if so, that question is answered.

**To add when photos arrive (3):** #1, #2, #4. `tools/check-plant-json.js` on each entry of
`batch-corrected.json`: 3 pass, 0 errors; warnings are the 4–5 ratings on the 20-scale, as supplied.

**Worth knowing about #2.** `Camellia sasanqua` is a species-level card: Oscar's own `uncertain`
note says the label read "Les Camélias d'Automne / floraison automne", an autumn-camellia label
with no cultivar. The deck has three named sasanqua cultivars already; this is the plain-species
card alongside them, which the deck does for Laurus nobilis and Gaultheria mucronata too.

## Conventions applied in `batch-corrected.json` (Oscar's standing "go")

| # | latin (as it will go in) | soil | warning | aspect | size H / W |
|---|---|---|---|---|---|
| 1 | Berberis thunbergii f. atropurpurea 'Atropurpurea Nana' | Any soil, well-drained | No waterlogging; shade dulls the foliage | Any aspect ("South, east, west or north-facing") | 40–50 cm / 0.5–1 m |
| 2 | Camellia sasanqua | Humus-rich, drained, acid | No lime; shelter from cold winds and drought | Any aspect ("South, east, west or sheltered north-facing") | 2.5–4 m / 1–1.5 m (unchanged) |
| 4 | Ceratostigma willmottianum FOREST BLUE ('Lice') | Any, free-draining | No waterlogging; sun for flower and colour | South / East / West | 50–60 cm / 0.5–1 m |

#4 takes the deck's CAPS trade-name form, matching its dealt sibling SAPPHIRE RING ('Lissbrill').
Every other field is as supplied, `hardinessNote` included. Toxicity: #1 "should not be eaten"
lands on the orange Toxic rung as the sentence means; #2 and #4 are blank and print nothing.

## Photo order and the filename each photo should match

1. #1 Berberis thunbergii f. atropurpurea 'Atropurpurea Nana' → `berberis-thunbergii-f-atropurpurea-atropurpurea-nana`
2. #2 Camellia sasanqua → `camellia-sasanqua`
3. #4 Ceratostigma willmottianum FOREST BLUE ('Lice') → `ceratostigma-willmottianum-forest-blue-lice`

**Card 1 dealt** (Oscar's photo, Galaxy S24, 4000x3000 with EXIF orientation 6, staged upright at
1200x1600; no AI markers; "Nana and fiber optics"). Conventions exactly as in `batch-corrected.json`;
every other field as supplied. Deck 457 -> 458, hold 76 unchanged. `add-plant.js --quick`; credits
with `photo-credits.js --set`; restamped r317. The original here is byte-identical to the file sent.
Matches: small rounded purple-red leaves in rosettes, brighter red at the shoot tips.

**Fiber Optics photo, not used.** Sent with the Berberis for the already-dealt
`Cephalanthus occidentalis 'Bailoptics'`. That card carries Oscar's own foliage photo from
2026-08-21 (CREDITS.json; CARD-PROTOCOL photo register, VQ 58); the new shot (Galaxy S24,
2026-09-30, 3000x3718) is foliage too, sunlit, red stems more prominent, no flower heads either.
Which of his two photographs the card wears is his call, so nothing changed; the new file is kept
here as `cephalanthus-occidentalis-bailoptics-alt.jpg`. Swapping is the Clematis routine of
2026-10-01: stage through the canvas pipeline, rebuild the derivative, note it in CREDITS.

**Batch status:** 1 of 3 dealt. Still to come: #2 Camellia sasanqua, #4 Ceratostigma FOREST BLUE.

**Cards 2 and 4 dealt, Eve Price photo replaced** (all Oscar's; no AI markers in any file).
Conventions exactly as in `batch-corrected.json`; every other field as supplied. Deck 458 -> 460,
hold 76 unchanged. `add-plants-bulk.js --quick`; credits with `photo-credits.js --set`; restamped
r318. Originals here are byte-identical to the files sent.

| # | card | photo as sent | staged | notes |
|---|---|---|---|---|
| 2 | Camellia sasanqua | two-panel collage 2160x2425 (collage app, no camera EXIF) | 1200x1347 | left: a pink double over a pot and wooden decking; right: a white semi-double with golden stamens and pink-flushed buds. Two forms in one picture, which suits a species-level card. Both panels in the well. |
| 4 | Ceratostigma willmottianum FOREST BLUE ('Lice') | 4000x3000, EXIF orientation 6 (Galaxy S24) | 1200x1600 (upright) | one open blue flower at the left, bristly leaves, spent brown seed heads top and right. Matches. |

**Viburnum tinus 'Eve Price' photo replaced** at Oscar's request ("Better photo for viburnum
eves price"): his two-panel collage, 2160x3122, staged 1200x1734 through the same canvas pipeline
as the bulk tool, derivative rebuilt, CREDITS note added. Left: open white flowers with pink buds;
right: a deep-pink bud cluster over the leaves. The previous master, his berry close-up of
2026-08-23 (commit 533b0fa), is retired and lives in git history. `PHOTO_FOCUS` stays at
'50% 45%'; the render shows both panels. Card text and ratings unchanged.

Flagged to Oscar, not changed:
- #2 the left panel shows the pot rim and decking below the flower.
- #4 shot in early October with most heads gone over; the leaves are green, not yet the "vivid
  red autumn colour" the card promises.

**Batch complete: 3 of 3 dealt** (#1, #2, #4). Deck 457 -> 460 across the batch. Not added: #3
Fiber Optics and #5 Eve Price, both already dealt; Eve Price now wears the new photo, Fiber
Optics keeps its 08-21 photo with the new shot held as `-alt` pending Oscar's call.

## Doubles resolved under the 2026-10-01 protocol (see NEW-SESSION.md)

- **#3 Fiber Optics** (`Cephalanthus occidentalis 'Bailoptics'`): hue 0 → **48** (0 was an
  unset default on a cream-flowered plant); hardiness H5 → **H6** with the "H6 · approximately
  −20 to −15°C" note — the card's own note admitted its H5 was "inferred from cold tolerance"
  of USDA zone 4, which is colder than H6 needs ([Inference]); peak Jul-Sep, size 1.5–2 m and
  sunNeed/sunMin 82/48 kept (dealt card, no siblings, incoming 70/35 an icon apart). The
  2026-09-30 photo is now the card's **second frame** (`-sunlit`, `tools/add-swap.js`), not
  held as -alt any more.
- **#5 Viburnum tinus 'Eve Price'**: toxicity "Fruit is ornamental and should not be eaten;
  gloves are advisable when handling." taken (card was blank; prints Toxic as meant); peak
  Dec-Apr → **Nov-Apr** — Oscar's own photo, now on the card, has it in open flower on
  1 October, so the later band was wrong by his own evidence; sunNeed 70 / sunMin 30 kept
  (siblings 55–65 / 20–35; incoming 45 / 5 is an icon away). `cvs` "Eve Price" not added, it
  is the plant's own name.
