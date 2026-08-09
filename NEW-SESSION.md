# Starting a fresh session for card creation

Yes — start a new chat for card work. This repo carries everything a new session
needs; nothing has to be re-derived, and nothing needs pasting except the plant
itself.

## What to paste into a new chat

**Just two things per plant:**

1. the **plant JSON** (produced with `PLANT-BRIEF.md`)
2. your **photo** of that plant

That's it. **Do not paste the design system / locked-template master doc.** The
new session reads this repo, which already contains the calibrated layout, the
extracted artwork, the stat rubric and the protocol. Re-sending a regenerated
master doc has twice re-introduced settled decisions (light tolerance bands that
were deliberately removed, an uncalibrated card aspect ratio) — it costs accuracy
and buys nothing.

If you're using a plain chat rather than one attached to this repo, paste
`CARD-STATS.md` and `PLANT-BRIEF.md` instead of the master doc.

## Opening message that works

> New plant for Timber. Read CARD-PROTOCOL.md, CARD-STATS.md and PLANT-BRIEF.md
> for the rules, then add this plant to the deck from the JSON + photo below.
> Run tests/ before pushing. Branch: claude/timber-plant-pwa-j69h5e

## What the repo already knows

| File | What it settles |
|---|---|
| `CARD-PROTOCOL.md` | Layout authority, QA checklist, full decision changelog (v1 → v12.3) |
| `CARD-STATS.md` | The 0–20 rating scales, hardiness table, compass rule, latin/soil checkers |
| `CARD-BACK.md` | Card-back spec + the per-plant question checklist |
| `PLANT-BRIEF.md` | The prompt that produces a plant JSON in our exact schema |
| `PORTFOLIO-BUILD-BRIEF.md` | Bulk CSV generation for many plants at once |
| `data/plinder-layout-manifest.json` | Measured card coordinates (locked test values) |
| `art/` | The painted assets extracted from the approved card |
| `design/card-builder.html` | Standalone card builder — JSON in, card out |
| `tests/` | 94 app checks + 8 edge checks + service-worker update + card verifier |
| `CORRECTION-PROTOCOL.md` | Layout-defect audit (`design/audit-layout.js`), defect log, correction rules |

## The routine, per plant — ONE command

```sh
node tools/add-plant.js plant.json photo.jpg
```

That one command does the whole routine:

1. Photo → processed to 1200px and staged in `photos/<latin-slug>.jpg`
2. JSON → converted into a `PLANTS` row in `timber.html`
3. `NPLANTS` bumped in `tests/app-test.js` and `tests/edge-test.js`
4. All suites run green — including `design/audit-layout.js` (layout audit) —
   screenshot checked, then committed and pushed

That validates the JSON (refuses bad data), processes + stages the photo, inserts
the `PLANTS` row, bumps the test counts, runs both suites, and screenshots the new
card to `tools/last-added-card.png`. **Look at the screenshot**, then commit and
push. A duplicate latin name or any failed check aborts before anything is written.

## Adding SEVERAL plants — verify once, not once per plant

```sh
node tools/add-plants-bulk.js a.json a.jpg b.json b.jpg c.json c.jpg
```

The suites are the whole cost of an add (one edge check walks every card with a
~420ms settle, so suite time grows with the deck — minutes per run at 120+
cards). `add-plant.js` pays that per plant; the bulk tool validates and
dedup-checks *everything* up front (nothing is written if any plant fails),
stages all photos, inserts all rows, then runs the suites **once** for the whole
batch. Same validator, same row format, same gates. Two or more plants → use
bulk; a single plant → `add-plant.js` is fine.

Adding a plant never involves touching the design.

## Two standing gotchas

- **Hardiness is the most error-prone field.** Early mock-ups carried H5 on
  everything. Check every plant against the label or RHS.
- **The photo must be the plant it claims to be.** The Sweet Cupcake photo shows
  blue/purple mopheads while the cultivar is sugar-pink — noted in the protocol's
  photo register, still to be re-shot.
