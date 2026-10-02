# 2026-10-02f — Acer palmatum 'Dissectum' dealt; a second frame for Cercis 'Eternal Flame'

Oscar, late on 2026-10-02, with two photos and one JSON: the laceleaf maple as a new card, and "also
another flash between photo for eternal flame".

## Acer palmatum 'Dissectum' — new card

`batch-as-sent.json` is the paste exactly as supplied; `batch-corrected.json` the same card with the
layout conventions and one wording change (below). `tools/compare-double.js`: not in the deck or the hold
block — the PROBABLE hit (Acer palmatum 'Firecracker', on the word "dissectum" in that card's text) is a
different cultivar. The JSON's own `uncertain` asks whether the plant is green or a red Dissectum Group
form: the photo settles it — green feathery leaves — so the card's identity stands as supplied.

| field | as supplied | as it went in |
|---|---|---|
| soil | Moist but well-drained, fertile soil; acidic to neutral conditions are preferred. | Moist, drained, lime-free (25) — as the dealt 'Seiryu' |
| soilWarning | Avoid waterlogging, severe drought and exposed drying positions. Fine foliage can scorch … | No waterlogging, drought or drying winds (40) |
| aspect | Full sun to partial shade | East / South / West (derived from sunNeed 65) |
| size | 1.5-2.5 m / 1.5-2.5 m | unchanged |
| visual | "… Small purplish-red **spring flowers** are followed by red winged fruits." | "… Small purplish-red **flowers in spring** are followed by red winged fruits." |

The visual change is the Golden King fix of 2026-10-02: `plant-sense --strict` reads "spring flowers" as a
flowering claim outside the Sep-Nov colour band and failed the bulk tool's data check on it; "flowers in
spring" says the same thing and passes. No fact changed. Written to the dealt row with
`compare-double.js --set visual=` after the insert, and mirrored in `batch-corrected.json`.

`check-plant-json.js`: pass, 0 errors; one warning ("moist" shared by water and soil, as on the other
maples). Toxicity blank, as supplied — the deck's other Acer cards print nothing.

Dealt with `add-plants-bulk.js --quick`, credit by basename, restamped r342. Deck 490 -> 491, hold 75
unchanged. Photo `acer-palmatum-dissectum.jpg`: Galaxy S24, 2026-09-26 11:48, 4000x3000 with EXIF orientation
6, no AI or C2PA markers, byte-identical to the file Oscar sent; staged upright 1200x1600. Finely dissected
green leaves on green stems, a brown-tipped lobe or two, bark mulch and a pot behind. Still green at the end
of September — the Sep-Nov band is the autumn colour, not yet on.

## Cercis canadensis 'Eternal Flame' — second frame

`cercis-canadensis-eternal-flame-autumn.jpg`: Galaxy S24, 2026-09-26 11:06, 4000x3000 with EXIF orientation
6, no AI markers, byte-identical; staged 1200x1600 through the canvas pipeline, derivative built with
`optimise-photos.js --only`, CREDITS note added. One gold heart-shaped leaf beaded with rain, burgundy ones
around it, a cosmos pink in the background — the card's "glossy burgundy-red through fiery orange to golden
yellow".

`add-swap.js` could not be used: the card's `PHOTO_SWAP` entry is the frame-art one (frame, plaque, soil,
band, swatch, edging, wisps) with no `alt`/`alts`, and the tool refuses such an entry by design. The frame
was added by hand instead, in the same shape the tool writes — an `alts` list, `focus:'50% 45%'`,
`hold:'3.5s'` — directly under the `frame:` line with a comment carrying Oscar's ask. `swapFrames()` reads
`alts` regardless of the other keys, the card is in neither `FULLART` nor `EDITION`, and a page check after
the edit confirms the card builds with the swap class and one alt image. Frame art and wisps untouched.
