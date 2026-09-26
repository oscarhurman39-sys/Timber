# Batch of 2026-09-26d — 45 pre-built cards, no photos yet

`batch-as-sent.txt` is Oscar's paste exactly as supplied (four JSON arrays back to back).
`batch.json` is the same 45 entries merged into one array, one per line, unedited.

Nothing is in `timber.html` yet. Each card is added when its photo arrives, in the
order of `batch.json`, so Oscar can confirm each photo matches the card.

Checks run on 2026-09-26:
- No latin already in the deck (370) or hold (84).
- `tools/check-plant-json.js`: 43 pass, 2 hard errors awaiting Oscar's decision:
  - #25 Euonymus 'Silver Queen': peak "Year-round foliage" does not parse (precedent: Jan-Dec).
  - #31 Erica 'Kramer's Rote': the apostrophe inside the cultivar quotes fails the latin checker.
- Soil / soil-warning length warnings on most cards (the panel fits ~26 / ~44 chars).
  Earlier batches were shortened on Oscar's say-so; not applied here yet.
