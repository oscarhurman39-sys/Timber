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
