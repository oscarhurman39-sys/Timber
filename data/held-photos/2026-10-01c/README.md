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
