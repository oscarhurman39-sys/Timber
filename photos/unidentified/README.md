# Unidentified photos

Genuine photographs waiting on an identification. Nothing here is wired into the
app, and nothing here has had a plant name guessed for it.

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
