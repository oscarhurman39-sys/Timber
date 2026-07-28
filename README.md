# Timber 🌳

**Tinder for plants.** Grow your knowledge, one swipe at a time.

A progressive web app that teaches garden-centre staff the key details of plants through a
swipe-card interface — and gets them accurate info fast when a customer is standing in front
of them.

## Adding a plant

Per-plant work is data, not design. See **`NEW-SESSION.md`** for the routine and
what to paste into a fresh chat (short version: the plant JSON + your photo, and
nothing else — not the design docs).

| File | Purpose |
|---|---|
| `PLANT-BRIEF.md` | Paste into ChatGPT/Gemini; produces a plant JSON in our exact schema |
| `tools/check-plant-json.js` | Validates that JSON and prints the row to paste in |
| `CARD-STATS.md` | Rating scales, hardiness table, compass rule |
| `CARD-BACK.md` | Card-back spec + per-plant question checklist |
| `CARD-PROTOCOL.md` | Layout authority + full decision changelog |
| `tests/` | Run all suites green before pushing |

```sh
node tools/check-plant-json.js my-plant.json    # errors out rather than guessing
```

## Use it

- **Serve the repo, don't open the file.** `timber.html` loads `art/` and `photos/` over HTTP, so
  `file://` gives you a card with no frame and no photos. Any static server works:
  `python3 -m http.server 8477`, then open `http://localhost:8477/timber.html`.
- Hosted over HTTPS (e.g. GitHub Pages), it's installable as a PWA and works **offline** after
  the first visit (`sw.js` caches the app shell).

### Publishing a standalone copy

To share Timber as one file with no server — a Claude Artifact, an email attachment, a USB stick —
build it:

```sh
node tools/build-standalone.js        # -> dist/timber-standalone.html (~3.4MB)
```

That re-encodes `art/` and `photos/` to WebP and inlines every one of them as a `data:` URI, so the
output has no external requests at all. **Always publish the build output, never a hand-edited
copy** — the repo is the source of truth, and editing a published copy directly is how the app and
the repo fork. If they do drift, reconcile back into the repo first, then rebuild.

## How it works

| Action | Result |
|---|---|
| Swipe right / tap ★ | Plant marked **LEARNED** (gold stamp), starred count +1 |
| Swipe left / tap ✕ | Plant **skipped** (red stamp), not counted |
| ↺ | Undo the last swipe (corrects the count) |
| Double-tap a card | Flip to the **Buyer Trade Sheet** (prices, margin, order weeks, risk) |
| Tap the back | Flip back — swiping is locked while flipped |
| 🔍 top right | **Search** — type a common or latin name, get the full info sheet instantly |
| 👥 Show customer | From a search result: big plain-language view with retail price only — safe to hand over |
| 🔊 next to latin name | Speaks the latin name aloud (built-in speech engine, Italian phonology; no files, works for every plant you add). Hidden on devices without speech support |
| ☰ menu | Learned count, Dictionary mode, **Quiz mode** (streak + best), Install app, Reset progress |

Progress (learned/skipped/undo history) and your best quiz streak persist in the browser via
localStorage — closing the app doesn't lose them. "Reset progress" / "Reset deck" clears the deck
state; adding or changing plants in `PLANTS` automatically starts a fresh deck.

## Files

- `timber.html` — the whole app: markup, styles, data, logic, inline PWA manifest. No frameworks.
  Needs `art/` and `photos/` alongside it, so it must be served rather than opened as a file.
- `art/`, `photos/` — the card artwork and plant photography `timber.html` loads at runtime.
- `tools/build-standalone.js` — inlines those assets into `dist/timber-standalone.html`, the
  single-file build to publish. Not needed for local development.
- `sw.js` — service worker (offline app-shell cache when hosted).
- `index.html` — redirect so the site root opens the app.

## Adding plants

Append objects to the `PLANTS` array in `timber.html`. Keep the exact field names
(`common, latin, hue, visual, water, aspect, soil, prune, source, peak, order, bench, root,
trade, retail, margin, type, shrink, returnRisk, pots, cvs, hardiness, resilience, uses, size`).
`hue` (0–360) sets the card's colour.

## Scaling the plant list (no hand-editing)

```
node plants-tool.js export   # dumps PLANTS to plants.csv — open in Excel / Google Sheets
node plants-tool.js import   # validates plants.csv and writes it back into timber.html
```

The importer enforces the locked schema hard: exactly the 25 fields, every cell filled,
hue 0–360, no duplicate names. **It never invents values** — a missing cell is an error
naming the row and field, not a default. On import the app auto-detects the changed list
and starts a fresh deck (saved progress can't go stale). A `timber.html.bak` backup is
written before every import.

## Finding real, licence-safe plant photos

```
node plant-images-tool.js search "Nandina domestica"   # writes plant-images/.../candidates.html — open it, look
node plant-images-tool.js pick "Nandina domestica" 2    # downloads candidate #2 + its licence record
```

Queries Wikimedia Commons (which only hosts content free for reuse, including
commercially — non-commercial-only licences aren't accepted there at all). `search`
never auto-picks anything; it hands you a visual gallery with licence + credit per
image so you confirm it's actually the right plant before anything gets saved. `pick`
downloads the chosen image plus a `credit.json` recording the licence, author, source
URL, and the date — your permanent record, independent of whether the source page
still exists later (Creative Commons licences are irrevocable for a copy you've
already obtained).

**This tool needs an internet connection to run** (unlike everything else here) and
has not yet been run against the live API — Wikimedia isn't reachable from the
environment that built it. First run is the real test: if `search` for a common plant
comes back with zero results, something in the request needs fixing before trusting
it further. Downloaded photos aren't wired into `timber.html` yet — that's a separate
step once a batch of images has been chosen. The inline-vs-separate question is settled:
photos live as separate files under `photos/`, named `<latin-slug>.jpg`, and only
`tools/build-standalone.js` inlines them, so the source stays diffable and the file size
cost lands on the build output alone.
