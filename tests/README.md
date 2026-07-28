# Timber test suites

All three drive a real headless Chromium against a locally served `timber.html`.
Start a server at the repo root first, then run from the repo root:

```sh
python3 -m http.server 8477 &
NODE_PATH=/opt/node22/lib/node_modules node tests/app-test.js      # 115 checks: gestures, flip, keys, search, quiz, persistence, a11y
NODE_PATH=/opt/node22/lib/node_modules node tests/edge-test.js     #  8 checks: corrupt storage, empty deck, undo edge cases
NODE_PATH=/opt/node22/lib/node_modules node tests/sw-update-test.js#  service-worker update path
NODE_PATH=/opt/node22/lib/node_modules node design/verify-cards.js # card builder: rating maths vs data, missing assets
```

`NPLANTS` at the top of app-test.js / edge-test.js must match the number of
plants in the PLANTS array. Bump it when you add a plant.

All four must pass before pushing.
