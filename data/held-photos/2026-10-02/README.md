# Batch of 2026-10-02 — Coppertop viburnum and 'Golden King' holly, with photos

`batch-as-sent.json` is Oscar's two-entry paste exactly as supplied ("Pics in order"). Photos are
his, no AI markers: `viburnum-odoratissimum-coppertop-brant01.jpg` a two-panel collage (collage app,
no camera EXIF), `ilex-altaclerensis-golden-king.jpg` Galaxy S24, 2026-09-29.

`tools/compare-double.js`: neither is in the deck or the hold block. Both dealt with
`add-plants-bulk.js --quick`; credits; restamp r322. Deck 461 -> 463, hold 76 unchanged.

| # | card | fit (soil / warning / aspect) | size | photo |
|---|---|---|---|---|
| 1 | Viburnum odoratissimum COPPERTOP ('Brant01') — CAPS trade-name form | Any, moist but drained / No waterlogging; shelter from winter winds / East / South / West (as supplied) | 2.5–3 m / 1.5–2 m (unchanged) | collage, both panels whole at default framing: a stem with copper-green leaves left, the copper-red new growth right; the collage app's blurred fill shows as a band under the panels and around the stats panel, as on the Nerine card. |
| 2 | Ilex × altaclerensis 'Golden King' | Any, moist but drained / No waterlogging; shade dulls the gold / Any aspect (as supplied) | 4–8 m / 2.5–4 m (unchanged) | 2490x3340 -> 1200x1610; gold-edged leaves with two orange-red berries at the top right. |

Everything else as supplied, with two additions:
- **#2 `pollination`** set to "needs partner; female cultivar, berries only with a male holly nearby".
  [Inference] from Oscar's own `cvs` ("Female cultivar") — hollies are dioecious, so a female
  berries only with a male in range. It answers the card's "will it berry on its own?" question,
  which the deck's Ilex aquifolium card already answers the same way.
- **#2 `visual`** reordered by one phrase: "small white spring flowers followed by…" → "small white
  flowers in spring followed by…". `plant-sense --strict` reads "spring flowers" as a flowering claim
  outside the Sep-Dec berry band and fails the gate on it; "flowers in spring" says the same thing
  and passes. No fact changed. (The alternative, a KNOWN line plus a VERIFY-QUEUE entry, is the
  route for real two-season contradictions, not for a word order.)

Flagged to Oscar, not changed: #1's `hardinessNote` is a sentence rather than the "H4 · −10 to
−5°C" form; his own `uncertain` says listings vary H4–H5 and H4 was chosen conservatively, which
the card keeps. #1's `compliance` "Protected cultivar; commercial propagation may require
permission" prints on the card back as supplied.
