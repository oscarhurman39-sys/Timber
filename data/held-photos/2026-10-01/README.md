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
