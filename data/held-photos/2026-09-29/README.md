# Batch of 2026-09-29 — four new cards dealt, one photo replaced

`batch-as-sent.json` is Oscar's JSON as supplied (five entries). Photos are Oscar's own
(Galaxy S24), sent from his phone with the JSON.

Conventions as before (Oscar's standing "go"): soil panel shortened to fit, sub-metre sizes
in cm, aspect written in the deck's `North / East / West` form. Everything else as supplied,
including the ratings that `check-plant-json.js` flags as "suspiciously low" (4–5 on the
20-scale for the two Skimmias and the dwarf Rhododendron — slow, low-care plants, so they
read as intended).

| # | latin | soil | warning | size | photo |
|---|---|---|---|---|---|
| 1 | Fuchsia 'Dollar Princess' | Fertile, moist, drained | No waterlogging; shelter from cold winds | 40–50 / 40–50 cm | double flowers + buds, matches |
| 2 | Skimmia japonica 'Nymans' | Humus-rich, moist, drained | Hot dry sun scorches and yellows leaves | unchanged | red berries, matches (female) |
| 3 | Skimmia × confusa 'Kew Green' | Humus-rich, moist, drained | Hot dry sun scorches and yellows leaves | unchanged | green bud clusters, matches (male) |
| 4 | Rhododendron 'Scarlet Wonder' | Humus-rich, moist, acid | No lime or waterlogging; rainwater best | 30–50 / 30–50 cm | red buds only, no open flower — a shot in Apr-May would be an upgrade |

Deck 432 -> 436, hold 76 unchanged (none of the four was held). `add-plant.js` does not write
a CREDITS entry (see 2026-09-27c); the four were added with `photo-credits.js --set`.

- **#5 Cordyline australis Charlie Boy ('Ric01') was already dealt**, so no card was added.
  The photo it carried had an "AI-generated content" watermark at lower left, which breaks
  the no-AI-images rule; Oscar's new photo replaces it. `cordyline-charlie-boy-original.jpg`
  is as sent; `cordyline-charlie-boy.jpg` is the same file with the bottom 750 px cropped
  off to remove a purple marker scribble (plain crop with sharp, nothing else). The master,
  the card derivative and the CREDITS note are updated. **Card text and ratings unchanged.**
  Oscar's JSON differs from the dealt card (his prose is longer; sunNeed 75 vs 65, sunMin
  35 vs 45, thirst 7 vs 5, hardinessNote "H3 · −5 to 1°C" vs the deck's sentence). Not
  applied because the card is live, not held; swapping is one `plants.csv` row if he wants it.
- Oscar's `[Charlie Boy]` square brackets are not the deck's form (`CHARLIE BOY ('Ric01')`);
  irrelevant since no card was added.

run-all 18/18 (`--jobs 3`, 608 s), first time.
