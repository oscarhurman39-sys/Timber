# Unidentified photos

Genuine photographs waiting on an identification — or, marked as such below,
identified but waiting on a card. Nothing here is wired into the app.

`photos/` is scanned non-recursively by `tools/data-audit.js`, so this
subdirectory is invisible to the audit and cannot be mistaken for a card photo.

## 2026-08-09-white-panicles-lanceolate-leaves.jpg

Arrived 2026-08-09 alongside the Waterlily 'Marliacea Carnea' and *Primula vialii*
JSONs, but matches neither. Opposite lance-shaped leaves on upright stems beneath
white panicles, with a small purple flower in the background and a few brown
spent leaves low down.

- 2084×2834, no C2PA manifest — the only one of that batch with no AI provenance
  markers, i.e. it reads as a straight camera capture
- Most consistent with *Phlox paniculata* (a white cultivar), but that is a guess
  from leaf and inflorescence shape alone and the flowers are out of focus
- Kept here rather than discarded because it is a real photograph and the session
  container is ephemeral

**To use it:** confirm the plant, then run the normal routine with a JSON for it —
`node tools/add-plant.js --quick <plant>.json photos/unidentified/<this file>`,
which will re-stage it under the correct latin slug.

## 2026-08-11-lotus-hirsutus-little-boy-blue-label.jpg

**Kept as an identification record, not a card photo.** The Knights bench label
for *Lotus hirsutus* LITTLE BOY BLUE (£14.99, location BLACKMOO, "PVR APPLIED"),
photographed beside the plant on 2026-08-11. It is the source for that card's
30cm × 30cm size — which is smaller than the 0.5m RHS gives — so it is worth
keeping legible rather than discarding once the card was written.

The plant photo it belonged to is now dealt as `photos/lotus-hirsutus-little-boy-blue-lisbob.jpg`.

## Cleared 2026-08-13

Three photos left this folder on 2026-08-13 when cards were written for them —
*Aronia melanocarpa*, *Lotus hirsutus* LITTLE BOY BLUE and Begonia BONFIRE. They
are now normal card photos under their latin slugs, staged from the full-resolution
originals held here. This is the folder working as intended: nothing was lost
while the cards did not yet exist.
