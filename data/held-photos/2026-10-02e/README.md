# 2026-10-02e — Euonymus europaeus 'Red Cascade', one card with its photo

`batch-as-sent.json` is Oscar's single-entry paste exactly as supplied (late on 2026-10-02, sent with the
photo, no text). `batch-corrected.json` is the same card with the standing layout conventions applied; every
other field as supplied.

`tools/compare-double.js`: not in the deck or the hold block. The one PROBABLE hit (the held Tamarix
ramosissima 'Pink Cascade', on the word "cascade") is a different plant. The deck's nine Euonymus cards are
japonicus, fortunei and alatus; this is the first europaeus.

| field | as supplied | as it went in |
|---|---|---|
| soil | Moist but well-drained or well-drained soil; tolerant of chalk, clay, loam and sand and a wide range of pH. | Any well-drained soil (21) |
| soilWarning | Avoid permanently waterlogged soil and deep shade, which can reduce flowering, fruiting and autumn colour. | No waterlogging or deep shade (29) |
| aspect | Full sun to partial shade | East / South / West (derived from sunNeed 80, as `fit-incoming.js` does it) |
| size | 2.5-4 m / 1.5-2.5 m | unchanged |

`check-plant-json.js`: pass, 0 errors; one warning (careLevel 4 on the 20-scale, as supplied — an easy
shrub). Toxicity "Harmful if eaten to humans and pets; wear gloves when handling." lands on **Toxic** in the
card's ladder, as the three Euonymus cards that carry text.

**Dealt** with `add-plants-bulk.js --quick`, credit by basename, restamped r341. Deck 489 -> 490, hold 75
unchanged. Photo: `euonymus-europaeus-red-cascade.jpg`, a two-panel collage from the collage app, 2124x3582,
no camera EXIF, a 23:35 timestamp from the collage; no AI or C2PA markers; byte-identical to the file Oscar
sent; staged 1200x2024, collage kept whole. Left panel: one rose-pink lobed fruit hanging from a green stem,
yellowing leaves above, grasses behind; right panel: a scarlet autumn leaf with pink-red neighbours. Both
panels in the well at default framing; the collage app's blurred fill sits behind the stats panel. The fruit
is still closed (no orange seed showing yet) — the card's "split open to reveal striking orange seeds" is the
later stage. In fruit and colour at the start of October, inside the Sep-Nov band.
