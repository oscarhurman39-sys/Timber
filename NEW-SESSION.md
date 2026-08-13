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

## Two routes, and they use different tools

Which one you are on depends on whether the card already exists.

| You have | The card is | Route |
|---|---|---|
| A photo of a plant already written into `PLANTS_ON_HOLD` | written, waiting on a photograph | `tools/deal-plant.js` — **the common case**, 98 cards are in that state |
| A plant with no card at all | does not exist | plant JSON first, then `tools/add-plant.js` / `add-plants-bulk.js` |

`node tools/data-audit.js` prints the live held count; it moves every time a
photo lands.

## Opening message that works — photo for a card already on hold

> New photo batch for Timber. Read README.md and NEW-SESSION.md first; the repo
> carries the layout, rubric and protocol, so nothing needs pasting but the
> photos. Most are named after the plant or species they show. Work out which
> held card each belongs to using the slug rule in NEW-SESSION.md, **show me the
> pairing before writing anything**, then deal each with
> `node tools/deal-plant.js "<latin>" <photo>`. Anything you cannot place
> confidently, stop and ask — a photo on the wrong card is worse than no photo.
> Feature branch, not the deploy branch. `node tests/run-all.js --jobs 3` once
> before pushing.

## Opening message that works — a plant with no card yet

> New plant for Timber. Read CARD-PROTOCOL.md, CARD-STATS.md and PLANT-BRIEF.md
> for the rules, then add this plant to the deck from the JSON + photo below.
> Work on a feature branch, not the deploy branch. Add with
> `node tools/add-plants-bulk.js --quick`, then `node tests/run-all.js --jobs 3`
> once before pushing.

## Matching a photo filename to a held card

The app derives a photo's filename from the card's `latin`, and this is the exact
rule — use it rather than inventing one. It reproduces the filename of every one
of the 144 dealt cards currently on disk:

```js
const slug = l => l.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
```

So `Clematis montana var. rubens` → `clematis-montana-var-rubens`, and
`Tamarix ramosissima 'Pink Cascade'` → `tamarix-ramosissima-pink-cascade`.
Slug every held card's `latin`, slug each photo's filename stem, and match the
two. Read the hold block with `tools/plant-data.js` — it is the one reader, and
nothing else should parse `timber.html`.

Genus-level near-misses are **not** matches. Five Acers and three Rhododendrons
in the hold block are different species from each other; a filename that only
matches a genus tells you nothing about which card it belongs to.

## Which held cards are even worth photographing

```sh
node tools/photo-run.js            # this month
node tools/photo-run.js --month may
node tools/photo-run.js --html     # phone sheet, ticks saved as you walk
```

Splits the hold block into **SHOOT** (peak covers this month), **LOOK**
(off-peak, but the card sells bark, stems, berries or evergreen — there whatever
the month) and **WAIT** (flowers, not out, with the month to come back and the
fewest visits that catch them all).

Its advice is a default, not a rule. *Corylus avellana* 'Contorta' is a WAIT card
in August; the corkscrew stem photographed fine and it is dealt.

### Which branch

Add plants on a **feature branch** (e.g. `claude/plant-build-timber-6ta360`), then
PR into `claude/timber-plant-pwa-j69h5e`, which is the default branch and the one
GitHub Pages deploys from.

Do **not** add plants directly on the deploy branch. Every push there triggers a
deploy, so a half-finished batch goes live, and the deploy gate (build stamp +
data audit) turns a mid-batch mistake into a red deployment instead of a local
test failure. A feature branch keeps the fast local loop completely free of CI.

Nothing about adding a plant needs the deploy branch — the whole routine below is
local.

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

## The routine — ONE command

```sh
node tools/add-plants-bulk.js --quick a.json a.jpg b.json b.jpg ...   # 2+ plants
node tools/add-plant.js plant.json photo.jpg                          # a single plant
```

That one command does the whole routine:

1. Photo → processed to 1200px and staged in `photos/<latin-slug>.jpg`
2. JSON → converted into a `PLANTS` row in `timber.html`
3. Data checks + the whole-deck audit run green (~15s with `--quick`)
4. Screenshot written to `tools/last-added-card.png` — **look at it**

`NPLANTS` is no longer bumped anywhere: all four counting suites derive it from
`timber.html`. It used to be hand-typed in four places, and a deck change that
updated only some of them made the rest fail for the wrong reason.

### Why `--quick`, and what it skips

Adding a plant is a **data** change. It cannot alter how gestures, undo, corrupt
storage or the service worker behave — only the data those behaviours read. So the
per-batch gate that matters is the data gate:

| | Runs | Measured cost at 128 cards |
|---|---|---|
| `--quick` | data audit, plant-sense, photo credits, whole-deck render audit | **17s** |
| default | the above plus app-test and edge-test | ~5 min |
| `run-all.js --jobs 3` | all 14 checks, 3 at a time | **2m41s** |
| `run-all.js` | all 14 checks, one at a time | ~7 min |

`app-test` and `edge-test` are the expensive pair because both walk the entire
deck — the learn-every-card loop alone is 128 × 400ms. That cost grows with the
deck, which is why a batch feels slower now than it did at 66 cards. Nothing was
added to make it slower; the deck doubled.

So: `--quick` per batch, and once before you push:

```sh
node tests/run-all.js --jobs 3
```

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
