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

**Cards 1-5 dealt** (Oscar's photos, Galaxy S24 2026-09-26; #4 and #5 are his collages).
Oscar said "go" to shortening the layout fields only; every other field is as supplied:
- soil + warning: "Rich, drained, not acid" (#1), "Fertile, drained, any pH" (#2-5);
  warning "No waterlogging; renew old rose soil", except #3 "Pots dry fast but must never sit wet".
- sizes in cm: #1 70 / 50 cm, #3 50 cm / 0.5-1 m ("up to 50 cm" collided with the HEIGHT
  label, so 50 cm is the stated maximum), #4 60 / 50 cm, #5 75 / 50-90 cm. #2 unchanged.
- #25 Euonymus peak will be Jan-Dec (Oscar: yes). #31 apostrophe still open.
Flagged to Oscar, not changed: #1 photo does not show the dark eye/stamens the text
describes; #4 blooms look double with no stamens visible vs "semi-double"; #5 leaves
show dark spots that may be black spot.
