# Unidentified photos

Genuine photographs waiting on an identification — or, marked as such below,
identified but waiting on a card. Nothing here is wired into the app.

`photos/` is scanned non-recursively by `tools/data-audit.js`, so this
subdirectory is invisible to the audit and cannot be mistaken for a card photo.

## 2026-08-09-white-panicles-lanceolate-leaves.jpg

**Confirmed *Phlox paniculata* by Oscar on 2026-08-13** — the guess made at the
time it arrived, from leaf and inflorescence shape alone, was correct. **Awaiting
stats from Oscar** rather than researched here: he said he'll send the JSON
through, and per PLANT-BRIEF's own rule this is exactly the kind of card that
should come from the person who can read the actual nursery label, not from a
second guess at a cultivar RHS lists dozens of.

2084×2834, no C2PA manifest — a straight camera capture.

**To use it:** once the JSON arrives, `node tools/add-plant.js --quick
phlox.json photos/unidentified/<this file>`.

## 2026-08-11-lotus-hirsutus-little-boy-blue-label.jpg

**Kept as an identification record, not a card photo.** The Knights bench label
for *Lotus hirsutus* LITTLE BOY BLUE (£14.99, location BLACKMOO, "PVR APPLIED"),
photographed beside the plant on 2026-08-11. It is the source for that card's
30cm × 30cm size — which is smaller than the 0.5m RHS gives — so it is worth
keeping legible rather than discarding once the card was written.

The plant photo it belonged to is now dealt as `photos/lotus-hirsutus-little-boy-blue-lisbob.jpg`.

## Resolved 2026-08-13 — five new cards, Oscar named every one

The five photos parked the same day were all identification questions, not
composition ones, and Oscar answered every one directly rather than leaving
them to guesswork:

| Was parked as | Oscar's answer | Now |
|---|---|---|
| Skimmia, female, red berries | "obsession" | *Skimmia japonica* OBSESSION ('Obsbolwi') — new card, dealt |
| Dark-leaved elder | "black beauty" | *Sambucus nigra* f. *porphyrophylla* 'Gerda' — new card, dealt |
| Silver trifoliate shrub | "it is cytisus battandieri" | *Argyrocytisus battandieri* (Pineapple Broom) — new card, dealt |
| Pyracantha, green berries | "orange star" | *Pyracantha coccinea* 'Orange Star' — new card, dealt |
| Purple wisteria, finger in frame | composition accepted ("i like the finger shots") | *Wisteria sinensis* — new card, dealt |

None of these went onto an existing held card — each is a genuinely different
plant from the deck's nearest sibling (Rubella is male-only, Black Lace has
finer foliage, the held Laburnum 'Vossii' is a different genus entirely,
SAPHYR ORANGE is a different cultivar, and the held wisteria is Japanese not
Chinese). See VERIFY-QUEUE 26–30 for the facts and hardiness sources behind
each. The wisteria finger-in-frame photo was used as-is on Oscar's explicit
call — composition is his to decide; it was the species that needed settling,
and he settled it.

The Chaenomeles 'Kinshiden' shot went through the same "parked, then Oscar
overruled the composition objection" path a day earlier — see VERIFY-QUEUE 25.
It lives at `photos/chaenomeles-speciosa-kinshiden.jpg`.

## Cleared 2026-08-13

Three photos left this folder on 2026-08-13 when cards were written for them —
*Aronia melanocarpa*, *Lotus hirsutus* LITTLE BOY BLUE and Begonia BONFIRE. They
are now normal card photos under their latin slugs, staged from the full-resolution
originals held here. This is the folder working as intended: nothing was lost
while the cards did not yet exist.
