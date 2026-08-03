# Timber test suites

All seven drive a real headless Chromium against a locally served `timber.html`.
Start a server at the repo root first, then run from the repo root:

```sh
python3 -m http.server 8477 &
NODE_PATH=/opt/node22/lib/node_modules node tests/app-test.js      # 94 checks: gestures, flip, search, quiz, persistence, a11y
NODE_PATH=/opt/node22/lib/node_modules node tests/edge-test.js     #  9 checks: corrupt storage, empty deck, undo edge cases
NODE_PATH=/opt/node22/lib/node_modules node tests/sw-update-test.js#  service-worker update path
NODE_PATH=/opt/node22/lib/node_modules node tests/perf-test.js     #  8 checks: compositing budget, pixel parity, no layout on drag
NODE_PATH=/opt/node22/lib/node_modules node tests/deck-audit.js    #  whole-deck data audit (errors fail; honest gaps warn)
NODE_PATH=/opt/node22/lib/node_modules node design/verify-cards.js # card builder: rating maths vs data, missing assets
NODE_PATH=/opt/node22/lib/node_modules node design/audit-layout.js # layout audit: ink fits zones, band collisions, rail alignment
```

`NPLANTS` at the top of app-test.js / edge-test.js must match the number of
plants in the PLANTS array. Bump it when you add a plant.

All seven must pass before pushing. The layout audit's rules and defect log
live in `CORRECTION-PROTOCOL.md`.

`perf-test.js` guards the deck's compositing budget: every plant stays in the DOM (the
layout audit needs that), but only the top few cards may paint and only the ones that
move may get a GPU layer. It also asserts that hiding buried content changes **no pixel**
— the deck's halo is ~30 stacked card shadows, so hiding whole cards visibly lightens it.

`deck-audit.js` audits the deck as a set — the gap between `check-plant-json.js` (one
incoming plant) and `verify-cards.js` (the 2-card design mock). It judges what the card
*renders*, not the raw fields, because the stored format differs from the incoming JSON.
Pre-existing defects live in its `KNOWN_GAPS` map so the suite is green today while still
printing them; fix a card and delete its line. Never add a line to silence a new defect.
