# Timber 🌳

**Tinder for plants.** Grow your knowledge, one swipe at a time.

A progressive web app that teaches garden-centre staff the key details of plants through a
swipe-card interface — and gets them accurate info fast when a customer is standing in front
of them.

## Use it

- Open `timber.html` in any browser — it's fully self-contained and works straight from the file.
- Hosted over HTTPS (e.g. GitHub Pages), it's installable as a PWA and works **offline** after
  the first visit (`sw.js` caches the app shell).

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

- `timber.html` — the whole app: markup, styles, data, logic, inline PWA manifest. No frameworks, no build step.
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
