# Timber test suites

## Run everything

```sh
node tests/run-all.js --jobs 3  # everything, 3 browser suites at a time — ~2m40s
node tests/run-all.js           # everything, one at a time — ~7m
node tests/run-all.js --fast    # data checks only — 0.3s, no browser
node tests/run-all.js --list    # what would run
```

Measured on a 4-core box at 128 cards: `--jobs 3` does 472s of work in **2m41s**
wall clock. Each suite launches its own Chromium against the shared static server
with its own browser context, so they don't interfere; budget ~500MB per job.

The six fast data/boot checks always run **first** and stop the run if they fail,
so a bad batch or a boot-bricking config error is caught before the browser suites.

`run-all.js` is the one to use. It starts a static server on :8477 if nothing is
already serving, runs each check, prints one line each, and dumps the tail of
anything that failed. Non-zero exit if any check fails, so hooks and CI can gate
on it. `node tools/install-hooks.js` wires the `--fast` set into a pre-push hook.

Six checks need no browser and run in about two seconds:

| Check | Guards |
|---|---|
| `tools/data-audit.js` | deck, hold block, `plants.csv` and `photos/` agree |
| `tools/plant-sense.js` | no card contradicts its own prose or arithmetic |
| `tools/build-stamp.js` | the menu-foot build number matches the app's content |
| `tools/template-geometry.js` | card overlay anchors have not drifted |
| `tools/photo-credits.js` | every committed photo has a provenance entry |
| `tools/check-boot.js` | inline JS compiles; special-card registries/assets/ANIM strips are boot-safe |

## Running a single suite by hand

All nine browser suites drive a real headless Chromium against a locally served
`timber.html`. Start a server at the repo root first, then run from the repo root:

```sh
python3 -m http.server 8477 &
NODE_PATH=/opt/node22/lib/node_modules node tests/app-test.js      # 94 checks: gestures, flip, search, quiz, persistence, a11y
NODE_PATH=/opt/node22/lib/node_modules node tests/edge-test.js     # 28 checks: corrupt storage, empty deck, undo edges, crash-loop light mode, problem report
NODE_PATH=/opt/node22/lib/node_modules node tests/sw-update-test.js#  service-worker update path
NODE_PATH=/opt/node22/lib/node_modules node tests/perf-test.js     #  9 checks: photo-fetch window, compositing budget, pixel parity, no layout on drag
NODE_PATH=/opt/node22/lib/node_modules node tests/deck-audit.js    #  whole-deck data audit (errors fail; honest gaps warn)
NODE_PATH=/opt/node22/lib/node_modules node tests/srs-test.js      # 24 checks: spaced repetition boxes, review mode, storage safety
NODE_PATH=/opt/node22/lib/node_modules node tests/features-test.js # 47 checks: quiz v2, filters, fuzzy search, stats, photos, shell polish, focus trap
NODE_PATH=/opt/node22/lib/node_modules node design/verify-cards.js # card builder: rating maths vs data, missing assets
NODE_PATH=/opt/node22/lib/node_modules node design/audit-layout.js # layout audit: ink fits zones, band collisions, rail alignment
```

`NPLANTS` is **derived** from `timber.html` (via `tools/plant-data.js`) in all four
suites that count the deck — do not hand-type it. It used to be a hardcoded number
in four places, and a deck change that updated only some of them made the others
fail for the wrong reason.

All must pass before pushing. The layout audit's rules and defect log
live in `CORRECTION-PROTOCOL.md`.

`perf-test.js` guards the deck's compositing budget: every plant stays in the DOM (the
layout audit needs that), but only the top few cards may paint and only the ones that
move may get a GPU layer. It also asserts that hiding buried content changes **no pixel**
— only hot cards carry the drop shadow (an always-on shadow stacked ~57 deep once built
a heavy black halo), and the `deep` toggle must never touch what's visible.

`deck-audit.js` audits the deck as a set — the gap between `check-plant-json.js` (one
incoming plant) and `verify-cards.js` (the 2-card design mock). It judges what the card
*renders*, not the raw fields, because the stored format differs from the incoming JSON.
Pre-existing defects live in its `KNOWN_GAPS` map so the suite is green today while still
printing them; fix a card and delete its line. Never add a line to silence a new defect.

### Boot-check negative test

`node tests/check-boot-test.js` deliberately makes three temporary broken copies
of `timber.html` (bad syntax, missing special-card asset, wrong ANIM duration count)
and proves `tools/check-boot.js` exits non-zero for each. It restores the app in a
`finally` block. Run it from a complete checkout containing the committed assets.
