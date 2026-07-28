# Timber Build Log

## Current phase

Phase 0 — partially complete. See "Remaining Phase 0 items" below before starting Phase 1.

## Latest completed slice

Repository baseline recorded (static inspection). Build spec and launcher placed in root with
Amendment 1 resolving the deliverable-path collision.

## Files changed

- `TIMBER-COMMAND-CENTRE-BUILD-SPEC.md` — added (ChatGPT's spec, verbatim, plus Amendment 1)
- `TIMBER-GOAL-LAUNCHER.md` — added (verbatim, plus the amendment pointer and a do-not-touch list)
- `TIMBER-BUILD-LOG.md` — added (this file)
- `COMMAND-CENTRE-BRIEF.md` — added earlier; a shorter framework brief covering the same
  product. Where it and the build spec disagree, **the build spec wins.**

No application code changed.

## Repository baseline — what already exists and works

This was established by reading the files, not by opening a browser. Treat the behavioural
claims as documented-but-unverified until Phase 0 is closed out.

**`timber.html` (118 KB) — the Timber swipe-card learning deck. A finished, separate product.**
Vanilla JavaScript, no framework, no build step, inline PWA manifest. Swipe-to-learn cards,
undo, search, customer view, quiz mode with streak, speech synthesis for botanical names,
localStorage progress. Holds the catalogue between `PLANTS:START` / `PLANTS:END` markers.

**Do not modify it.** Six files depend on it (`sw.js`, `plants-tool.js`, `tools/add-plant.js`,
and all three suites in `tests/`). See Amendment 1 in the build spec.

| Asset | State |
|---|---|
| `plants.csv` | 124 plant records, 25 locked fields each, round-trips via `plants-tool.js` |
| `art/` | 16 locked card assets (frame, plaque, band, crest, widget icons, growth diamond) |
| `photos/` | 13 plant photographs |
| `tools/check-plant-json.js` | schema validator — the Curator Queue rules in spec §14.3 already exist here |
| `tests/` | 3 Node/Playwright suites against `localhost:8477/timber.html` |
| `CARD-PROTOCOL.md`, `CARD-STATS.md`, `CARD-DESIGN-SYSTEM.md`, `CARD-BACK.md` | the locked card design rules referenced by spec §11.4 |

`tools/check-plant-json.js` already enforces most of spec §14.3: `sunMin > sunNeed` rejection,
light terminology in `aspect`, 0–20 integer ratings, 0–100 sun values, controlled `foliage` and
`container` values, `soilWarning` that merely restates `soil`, RHS hardiness bands, and
`Mon-Mon` peak parsing. **Port its rules rather than reinventing them** — it is the existing
source of truth and its error messages are already worded for this product.

## Behaviour added

None yet. No Command Centre code exists.

## Tests run

None. `window.runTimberSelfTests()` does not exist yet — it is a Phase 1 deliverable of the new
file.

## Known issues

- `plant-images-tool.js` has never been run against the live Wikimedia API (noted in README).
  Out of scope for the Command Centre.

## Assumptions made

1. **Deliverable path.** `command-centre/timber-command-centre.html`, not `timber.html`.
   Recorded as Amendment 1 in the build spec. Reason: the spec's stated deliverable filename
   collides with a working product.
2. **Plant data shape.** The Command Centre seeds its own demo data in the nested shape of spec
   §7. The deck's flat 25-field schema and `plants.csv` stay untouched. Mapping between the two
   is Stage B work.
3. **Self-tests.** `window.runTimberSelfTests()` belongs to the new file only. The Node suites
   in `tests/` remain the deck's and must keep passing unchanged.

## Remaining Phase 0 items

- [ ] Open `timber.html` in a browser and confirm the deck still works (baseline screenshot)
- [ ] Check the browser console is clean on the deck
- [ ] Run `node tests/app-test.js`, `edge-test.js`, `sw-update-test.js` and record the result

These are the "before" record. If a later phase breaks the deck, this is what proves it was
working beforehand. Backup is covered by version control — the repo is a git working tree, so
`timber.pre-<phase>.html` files are unnecessary and should not be created.

## Next smallest complete slice

Phase 1, first slice: create `command-centre/timber-command-centre.html` with the §5.2 section
banners in order, React 18 + Babel via CDN, design tokens from §17.2, the canonical state shape
from §6, the reducer skeleton with the §6.1 action types, and a shell that renders all six
routes with a working role switcher. No view content yet — but no dead controls either: a route
with nothing built states plainly that it is not built.
