# 2026-09-27c — photos for cards Oscar had already supplied JSON for

Oscar's own photos (Galaxy S24). These deal cards that were already written and held.

- **Pyracantha 'Red Star'** — dealt from `pyracantha-red-star.jpg` (berry cluster, 15:06).
  `pyracantha-red-star-alt-foliage.jpg` (15:07, foliage-forward, berries soft) kept unused.
  Oscar sent both and said "add your fav"; the berry close-up is the card. Held card text
  and ratings unchanged. Deck 425 -> 426, hold 82 -> 81.

**Groundbreaker Blush (Hydrangea paniculata 'LC NO21')** — still held. Oscar had already
uploaded a photo on 2026-09-02 (`photos/hydrangea-groundbreaker-foliage-unconfirmed.jpg`,
VERIFY-QUEUE 67): foliage only, no flower, and never confirmed as this plant. Awaiting his
call: confirm and deal it, or send a shot with the blush panicles (peak Jul-Nov).

**Test note.** `tests/run-all.js --jobs 3` returned 17/18 once on this tree: deck-audit
reported two dealt cards as photo-missing and one fullart error. Standalone deck-audit passed
twice immediately after; the derivatives exist and serve 200. Third occurrence today of the
audit sampling images before they finish loading under 3-job load. See 2026-09-27b README.

- **Loropetalum chinense var. rubrum 'Fede'** — dealt from `loropetalum-fede.jpg` (15:41).
  Purple foliage with one pink tassel flower; matches the held card. Text and ratings
  unchanged. Deck 426 -> 427, hold 81 -> 80. run-all 18/18 first time.

- **Ficus elastica 'Belize'** — NEW card (deck 427 -> 428), not the held species card. Oscar's
  photo (15:57) is the variegated cultivar, so he asked for the JSON re-run. `ficus-elastica-belize.json`
  here is what went in: the held `Ficus elastica` JSON with only visual, hue (120 -> 345), cvs,
  soilWarning and resilience changed for the cultivar; every rating carried over. Provenance is
  in its `uncertain` list — Claude-derived plus T&M / Proven Winners retail text, not RHS-checked.
  The plain species card stays held. add-plant.js does not write a CREDITS entry (deal-plant.js
  does); added by hand. run-all 18/18.

- **Ophiopogon planiscapus 'Kokuryū'** — dealt from `ophiopogon-kokuryu-collage.jpg`, a
  three-panel collage Oscar asked for: his bud spray (top left) and white flowers (top right)
  with the foliage full-width below, cropped to keep the pink pots and label out. Built with
  sharp from the three originals kept here (`-buds`, `-flowers`, `-foliage`); plain crops and
  resizes, nothing blended or generated. Text and ratings unchanged. Deck 428 -> 429,
  hold 80 -> 79. run-all 18/18.

- **Hydrangea paniculata 'LC NO21' Groundbreaker Blush** — dealt from
  `hydrangea-groundbreaker-blush-foliage.jpg`, which is Oscar's 2026-09-02 photo previously
  staged as `photos/hydrangea-groundbreaker-foliage-unconfirmed.jpg` (VERIFY-QUEUE 67). Oscar
  confirmed it and said "use foliage for now"; the old file, its derivative and its credit
  entry are retired. Foliage only — the card text describes blush panicles, so a flowering shot
  would be an upgrade later. Text and ratings unchanged. Deck 429 -> 430, hold 79 -> 78.
  run-all 18/18.

- **Abelia × grandiflora 'Kaleidoscope'** — dealt from `abelia-kaleidoscope.jpg` (16:38), the
  card held since the 2026-09-23 batch. Variegated foliage with bronze-pink new growth and
  buds; matches the card. Text and ratings unchanged. Deck 430 -> 431, hold 78 -> 77.
  run-all 18/18.

- **Primula vialii** — dealt from `primula-vialii.jpg`, a crop of Oscar's own
  `primula-vialii-original.jpg` (EXIF 2025-12-02; note the photo is from last season, the
  plant is Jun-Aug). Crop removes the pot label at lower left; nothing else changed. Oscar
  first sent a copy with the label removed by an AI eraser, which carried an AI-content
  watermark; that copy was refused and is not in the repo. The CREDITS entry carries the
  note. Text and ratings unchanged. Deck 431 -> 432, hold 77 -> 76. run-all 18/18.
