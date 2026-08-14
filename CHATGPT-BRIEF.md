# CHATGPT-BRIEF — Timber hardening pass (2026-08-14)

HOW TO USE THIS FILE: paste this ENTIRE document into ChatGPT, then attach
`timber.html`. For WS2 also attach the tool files named in that section.
Your output will be applied and gated by an engineer with repo access —
quote your anchors precisely and produce whole replacement functions, never
fragments.

This brief came out of a full architecture audit (branch
`claude/timber-architecture-audit-je0qg0`, audited at r52). The audit's
verdict: the app is in good architectural shape — the special-card system,
animation runtime, performance budgets, mobile handling, accessibility and
reduced-motion support all exist and are tested. Do NOT rebuild any of them.
This brief is a short, ranked hardening list: the few things that actually
need doing. Work the workstreams in order; each is independently shippable
and should be a separate commit.

---

## 1. What Timber is

A single-file progressive web app (`timber.html`, ~8,400 lines) that teaches
garden-centre staff plants through a swipe-card deck. Vanilla HTML/CSS/JS,
no frameworks, no build step — this is a LOCKED project constraint (a
standalone build exists that inlines every asset into one artifact file, so
the app being one file is load-bearing). Data for 144 dealt + 98 held plants
is embedded in the file between marker comments and managed by Node tools;
`plants.csv` is a mirror, never fetched at runtime.

Key runtime structures (all in `timber.html`):

- `const PLANTS = [...]` between `/* PLANTS:BEGIN */` and `/* PLANTS:END */`
  — the dealt deck. `const PLANTS_ON_HOLD = [...]` between `HOLD:BEGIN/END`
  — researched cards awaiting photos. Never touch either block's contents.
- `renderCard(idx)` — the one card template. `order[]` (deck indexes,
  top-of-deck last), `history[]` (swipes, for undo), `markHot()` (promotes
  only the top ~3 cards to GPU layers; `.deep` cards don't paint).
- `const HOLO = {...}` — special-edition frames keyed by latin-slug.
  `const ANIM = {...}` — stop-motion sprite-strip overlay packs.
  `const PHOTO_SWAP = {...}` — two-photo blink cards.
  `const PHOTO_FOCUS = {...}` — per-slug `object-position` overrides.
- `buildAnimCSS()` — generates one `@keyframes` per ANIM pack; runs at boot.
- `fitInk(root)` — shrinks overflowing live text (`.val-ink`) to fit its
  measured zone; currently called per card inside `renderCard`.

Test gate (all local, `node tests/run-all.js --jobs 3`, ~2m41s): 5 fast
data checks (data-audit, plant-sense --strict, build-stamp --check,
template-geometry --check, photo-credits --check) then 9 Playwright suites
(app ~95 checks, edge 9, srs 24, features 47, perf 9, deck-audit,
sw-update, design/verify-cards, design/audit-layout). The GitHub Pages
deploy gate runs only the 5 fast checks.

---

## 2. LOCKED — do not modify

- Card front/back visual design: the frame art, parchment panels, every CSS
  rule that positions elements on the card faces (the comment "Do not
  restyle" at the v14 template block is binding), `getRatingSegments`,
  `wIcon`/`wRow`, `extractFacing`, `parseMonths`, `parseSize`, everything
  in `art/`.
- Card geometry: 420×600 template, the 9 anchors locked in
  `data/template-anchors.json`, checked by `tools/template-geometry.js
  --check` at 0.75px tolerance. Height changes go through `--reflow`, never
  by hand.
- The `PLANTS` / `PLANTS_ON_HOLD` contents and their marker comments.
- The 31-column data schema. No new fields, no renames.
- Swipe/flip gesture mechanics and thresholds — staff muscle memory exists.
- Existing localStorage shapes (`timber-progress-v1`, `timber-srs-v1`,
  `timber-quiz-v1`, `timber-recent-v1`). New keys allowed, `timber-*-v1`
  namespaced.
- Architecture: one file, vanilla JS, no dependencies, no build step,
  feature-detection everywhere, no invented plant data — ever.
- The special-card systems (HOLO / ANIM / PHOTO_SWAP) as designed. WS1
  makes them fail safe; it does not redesign them.
- The existing HOLO/ANIM registry entries' visual output. The rule for
  special cards is "holo where it decorates, parchment where it informs".

---

## 3. WS1 — boot-safety: the deploy gate cannot see a bricked app

**Problem (highest-priority finding of the audit).** The Pages deploy gate
runs only the 5 fast data checks — nothing in the gate executes, parses, or
syntax-checks the app's JavaScript. A stray syntax error, or one bad entry
in `ANIM`, deploys a blank app. Two concrete holes:

1. `buildAnimCSS()` throws at boot on a malformed pack
   (`if(a.durations.length!==a.frames)throw new Error(...)`). It is called
   at top level, so the throw kills the entire script: no deck, blank app,
   for a config error on ONE special card.
2. Nothing validates that the asset paths named in `HOLO`, `ANIM`,
   `PHOTO_SWAP` exist on disk, or that a sprite strip's pixel width is an
   exact multiple of its frame count. (The layout audit's Rule E already
   does this for `PHOTO_FOCUS` — extend the same idea to the other three
   registries, but as a fast Node check so the deploy gate sees it.)

**Deliverable A — make special-card config errors non-fatal.** Rework
`buildAnimCSS()` so a bad pack is skipped with `console.error` and every
other card still works. Same for `groveHTML(slug)`: if the pack failed
validation, return `''`. Validate inside one place (a small
`validAnimPack(slug, a)` helper) so the check exists once.

**Deliverable B — new fast check `tools/check-boot.js`.** Node script,
no browser, exit 1 on failure:

1. Extract every `<script>` body from `timber.html` and syntax-check it
   with `new Function(src)` (construction compiles without executing).
   This alone would have caught the historical trailing-comma incident
   class ("the whole app dead") at the gate.
2. Extract the `HOLO`, `ANIM`, `PHOTO_SWAP`, `PHOTO_FOCUS` object literals
   (marker-comment or balanced-brace walk — mirror how
   `tools/plant-data.js` walks the plant arrays; do not regex-parse
   values). For every referenced asset path (`frame`, `plaque`, `soil`,
   `band`, `swatch`, `edging`, `wisps[].src`, `layers[].src`, `alt`):
   assert the file exists.
3. For every `ANIM` pack: `durations.length === frames`; every layer's
   strip PNG width divisible by `frames` (read width from the PNG IHDR —
   bytes 16-19 big-endian — no image library).
4. Assert every `HOLO`/`ANIM`/`PHOTO_SWAP`/`PHOTO_FOCUS` key is the
   latin-slug of a current plant (dealt or held), using
   `tools/plant-data.js` to read the blocks and the same slug rule the app
   uses.

**Deliverable C — wire it in.** Add `check-boot` to the `CHECKS` list in
`tests/run-all.js` as a sixth data check (it then rides into the pre-push
hook and the Pages gate automatically, since both call `run-all --fast`).
Update the fast-check count in `tests/README.md`. Add one negative test to
prove it fails: temporarily broken copies (bad syntax; missing asset;
wrong duration count) each exit 1 — same pattern `tests/sw-update-test.js`
uses (mutate a copy, assert, restore in `finally`).

**Must not change:** the animation output of the existing Avondale pack,
any existing check's behaviour.

---

## 4. WS2 — tooling correctness pass (small, zero-risk-to-app)

Attach when working this WS: `tools/plant-data.js`, `tools/deal-plant.js`,
`tools/check-plant-json.js`, `tools/add-plant.js`,
`tools/add-plants-bulk.js`, `tools/data-audit.js`,
`tools/template-geometry.js`, `plant-images-tool.js`.

Each item is one commit or grouped into one "tool fixes" commit:

1. `tools/plant-data.js` (~line 120): the "array is unterminated" error
   path references `decl`, which is not in scope (`block.decl` is) — it
   throws `ReferenceError` instead of the intended message. Fix the
   reference.
2. `tools/deal-plant.js` (~line 69): hardcoded
   `require('/opt/node22/lib/node_modules/playwright')` — every other tool
   uses bare `require('playwright')`. Match them, with the absolute path as
   a guarded fallback if you must keep it.
3. `tools/check-plant-json.js`: two different soil/soilWarning length
   budgets in the same file (~lines 77-80 warn at 60/36; ~lines 101-102
   error at 26/44, which matches `fit-incoming.js`). Keep 26/44 as the
   single truth; delete or align the other pair.
4. `tools/add-plants-bulk.js` patches count literals in 2 test suites where
   `tools/add-plant.js` patches 4. Since all four suites now DERIVE
   `NPLANTS` via `plant-data.js`, first check whether the patch blocks are
   vestigial; if so delete both, if not make them identical. Also fix the
   stale instruction printed by `check-plant-json.js` (~line 155) telling
   the user to hand-bump `NPLANTS`.
5. `tools/template-geometry.js` (~line 143): `const TOL = 0.75` shadows
   `"toleratePx": 0.75` in `data/template-anchors.json`, which is never
   read. Read the tolerance from the JSON; keep 0.75 as fallback.
6. The latin→filename slug function is duplicated 8 times across the app
   and tools, and `plant-images-tool.js` carries a DIVERGENT version (no
   NFD diacritic fold) that can produce a different filename for the same
   plant. Create `tools/slug.js` exporting the canonical function (copied
   exactly from the app's `slugLatin`), point all 7 Node copies at it
   (the in-page copy in `design/audit-layout.js` and the app's own stay as
   they are — the app is the reference), and add a check to
   `tools/data-audit.js` that the exported function's source matches the
   app's inline `slugLatin` body so they can never drift silently.
7. `data/plinder-layout-manifest.json` is read by no code — it is a third
   copy of the card geometry that can silently rot. Add a `"_readme"` key
   at the top stating: documentation only, not read by code; the lock is
   `data/template-anchors.json` + the CSS; update it manually when the
   protocol changes or ignore it.

**Must not change:** tool behaviour beyond the listed fixes, any output
format other tools parse, the CSV column order.

---

## 5. WS3 — boot cost: defer ink-fitting off the critical path

**Problem.** `buildDeck()` renders all 242 cards at boot and calls
`fitInk(c)` per card. `fitInk` reads `getComputedStyle` + `scrollWidth`
per `.val-ink` element (~12 per card) and writes font-size on overflow —
roughly 242 forced synchronous layout passes before first paint, on a
phone, growing linearly with the deck.

**Deliverable.** Remove `fitInk(c)` from `renderCard`. Instead:

1. In `markHot()`, when a card first leaves the `.deep` set (first
   promotion toward paint), run `fitInk` on it once (guard with
   `c._inkFit = true`). This covers every card before it can become
   visible, because promotion happens 4 deep while cards are still
   occluded.
2. After boot, trickle-fit the rest in idle time (same pattern as the
   existing `tricklePhotos()` — a few cards per `setTimeout` tick), so
   whole-deck audits still see fitted ink. Set `window.__inkFitDone = true`
   when the trickle completes.
3. `design/audit-layout.js` (Rule A measures ink overflow on ALL cards)
   and `tests/deck-audit.js` must wait for `window.__inkFitDone` before
   measuring. Add that wait to both.

`fitInk` measurements remain valid on `.deep` cards (`visibility:hidden`
preserves layout), so ordering is safe. Undo and review/filter rebuilds go
through `renderCard`+`markHot` already and need no special handling —
verify this rather than assuming it.

**Acceptance:** full gate green, including `audit-layout` (the ink rule is
the regression detector here); `perf-test`'s LayoutCount-on-drag and
pixel-parity checks unchanged; measure and report boot timing before/after
(`performance.now()` around `buildDeck()`; two runs each).

**Must not change:** rendered ink sizes (the same cards must end at the
same font sizes — audit-layout proves it), `PAINT_DEPTH`/`FETCH_DEPTH`
values, the photo trickle loader.

---

## 6. WS4 — Reset progress needs a confirmation

**Problem.** Menu → "Reset progress" (`#resetRow`) calls `buildDeck()`
immediately: deck order, swipe history and the learned count are wiped on
a single tap, with no undo (`history` is cleared, so hold-to-rewind cannot
recover it). SRS data deliberately survives — keep that.

**Deliverable.** Two-tap confirm in place, no new overlay: first tap turns
the row into "Tap again to reset" (visually distinct, e.g. the row text
swaps and gains a warning colour), second tap within 4s resets; the row
reverts on timeout, on menu close, or when any other row is tapped. The
empty-deck "Reset deck" button (`#reset2`) stays single-tap — the deck is
already finished there, nothing is lost. Keyboard path (Enter/Space on the
row) goes through the same two-step. Add app-test coverage: one tap does
NOT reset (progress unchanged), two taps do, timeout reverts.

**Must not change:** `buildDeck()` itself, SRS survival on reset.

---

## 7. WS5 (optional, flag to Oscar before doing) — service-worker photo cap

`sw.js` caches every same-origin GET into one never-evicted cache. The
photo library is ~86MB and grows with every dealt plant; the trickle
loader eventually fetches the whole deck. On iOS, blowing the storage
quota can evict the ENTIRE cache including the app shell. Add a simple
cap: after writing a `photos/` response, if the count of `photos/` entries
exceeds N (start N=400), delete oldest-inserted first (keep insertion
order in a small IndexedDB-free scheme: a JSON index entry in the cache
itself, or `cache.keys()` order which is insertion order in practice —
verify, don't assume). Keep `timber.html` and `art/` untouched by
eviction. Update `tests/sw-update-test.js`'s neighbourhood only if the
update-signalling path is touched (it shouldn't be).

This changes offline completeness (>N photos means some cards fall back
to their gradient offline), which is a product trade-off — hence flag
first.

---

## 8. WS6 (deferred — do NOT build until Oscar asks) — deck virtualization

Recorded here so the design isn't lost. When the deck approaches ~400+
cards, stop materializing every card in the DOM at boot: keep `order[]`
as the source of truth, render only the top K (~12) cards' DOM, and
top up from below after each fling (insert before `deck.firstChild`,
i.e. bottom of the visual stack). `renderCard(idx)` already supports
on-demand creation (undo uses it). The hard part is not the deck — it is
that `design/audit-layout.js` and `tests/deck-audit.js` measure EVERY
card in the DOM; they would need a test-only hook
(`window.__materializeAll()`) to keep whole-deck coverage. Do not start
this without that hook in the same commit, and do not start it at all at
the current deck size — the payoff isn't there yet.

---

## 9. Output format (for every workstream)

1. **Placement map** — for each edit, quote the exact existing line(s)
   you anchor to, so the change can be applied without guessing.
2. **Whole replacement functions/blocks** — never "add this somewhere" or
   diff fragments of a function.
3. **New files complete** — full file contents for `tools/check-boot.js`,
   `tools/slug.js`, and any test additions.
4. **Test blocks paste-ready** — matching the house style of the suite
   they extend (look at how `tests/edge-test.js` structures per-context
   checks before writing).
5. **Risk note per workstream** — what could break and which existing
   check would catch it.

---

## 10. Commands and completion criteria

After each workstream, the applying engineer runs:

```
node tests/run-all.js --fast          # 5 (then 6) data checks, ~1s
node tests/run-all.js --jobs 3        # full gate before push, ~3min
node tools/build-stamp.js --write     # ONLY if timber.html changed
```

A workstream is complete when:

- The full gate is green (all existing checks plus any it added).
- `tools/template-geometry.js --check` passes untouched — zero geometry
  drift is a hard requirement for every workstream in this brief.
- `timber.html` changes are restamped (`build-stamp --check` enforces it).
- The commit touches only the files its workstream names.
- Nothing in the LOCKED list (§2) changed.

Things this brief deliberately does NOT ask for (audit conclusions —
don't "improve" them in passing): no file splitting, no moving
`PLANTS_ON_HOLD` out of `timber.html` (gzip makes it cheap; the tool
contract §0b depends on it), no framework or dependency, no rework of the
HOLO/ANIM/wisp systems, no visual-regression screenshot infrastructure,
no changes to swipe physics, no restyling anything on the card.
