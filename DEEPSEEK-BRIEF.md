# DeepSeek Supercharge Brief — Timber

**How to use this file:** paste this ENTIRE document into DeepSeek, then attach/paste
`timber.html` (the whole file — it is the entire app) immediately after it. Optionally
attach `sw.js` (47 lines) and `tests/README.md`. Do NOT paste the design docs
(CARD-PROTOCOL.md etc.) — everything DeepSeek is allowed to change is described here,
and everything it isn't allowed to change is locked below.

---

## ROLE

You are a senior front-end engineer upgrading **Timber**, a production single-file
progressive web app. You will implement as many of the workstreams in this brief as
you can, in priority order, in one response. You work with surgical precision: you
extend the app without rewriting it, you never break the locked design, and you never
invent data.

## THE APP IN 60 SECONDS

Timber is "Tinder for plants" — it teaches garden-centre staff plant knowledge via a
swipe-card deck, and doubles as an instant lookup tool when a customer is standing at
the till. It is used on phones, often offline, by non-technical retail staff.

Current features (all live, all tested):

- **Swipe deck**: swipe right / tap ★ = LEARNED (gold stamp, counted); swipe left /
  tap ✕ = skipped (red stamp); ↺ undoes the last swipe. Cards render bottom-to-top
  into `#deck`; each card is a DOM node built by `renderCard(idx)`.
- **Card flip**: double-tap flips to the **Buyer Trade Sheet** (trade price, retail,
  margin, order week, bench life, shrink/return risk). Swiping locks while flipped.
- **Search** (🔍): substring match on common + latin name → full info sheet.
- **Customer view** (👥): plain-language sheet with retail price only — safe to show
  a customer (no margin/trade data).
- **Latin pronunciation** (🔊): Web Speech API with Italian phonology, feature-detected
  via `const TTS='speechSynthesis' in window` — hidden when unsupported.
- **Quiz mode**: multiple-choice from menu; clue picked from `QUIZ_CLUES` only when
  the clue value is UNIQUE to one plant; streak + best streak persisted.
- **Persistence**: `localStorage` key `timber-progress-v1` stores
  `{fp, stack, history, learnedCount}` where `fp` is `FINGERPRINT` (all latin names
  joined with `|`) — any change to the plant list auto-invalidates saved decks.
  Quiz best lives under `timber-quiz-v1`. All reads are wrapped in try/catch and
  validated (`okIdx`, duplicate checks) — corrupt storage falls back to a fresh deck.
- **PWA**: inline manifest in `timber.html`; `sw.js` caches the app shell under
  cache name `timber-v1` (bump on shell changes); `beforeinstallprompt` wired to an
  "Install app" menu row. Works fully offline after first visit.

## ARCHITECTURE — NON-NEGOTIABLE

1. **One file.** `timber.html` contains ALL markup, CSS, data, and JS. No frameworks,
   no build step, no npm dependencies, no external CDNs, no module imports. It must
   keep working when opened as a plain `file://` in a browser.
2. **Vanilla JS only**, features safe on mobile Safari (iOS 15+) and Chrome Android.
   No optional-chaining-into-assignment exotica, no top-level await.
3. **Graceful degradation everywhere**: every Web API use is feature-detected
   (see the TTS pattern). Every localStorage read is try/catch'd and validated.
4. **No invented plant data — ever.** Ratings, prices, months, facings come from the
   `PLANTS` array or are simply not shown. A blank field means "don't render the row",
   never "make up a value". The compass rule is the canon example: a facing direction
   is only ever shown if the data literally names one.
5. The repo's separate node tools (`plants-tool.js`, `tools/add-plant.js`,
   `tools/check-plant-json.js`, `plant-images-tool.js`) manage the data pipeline.
   Do not touch them unless a workstream says so.

## LOCKED — DO NOT MODIFY

These have been calibrated over 12+ design iterations and are protected by tests:

- **Card front & back visual design**: the wood frame, paper panels, hue strip,
  power-point widget rows (`getRatingSegments`, `wIcon`, `wRow`), compass logic
  (`extractFacing`), month parsing (`parseMonths`), size parsing (`parseSize`),
  the art assets in `art/`, and any CSS that positions elements on the card faces.
- **The `PLANTS` array contents and its marker comments**
  (`/* PLANTS:BEGIN */ ... /* PLANTS:END */`) — the CSV importer regex-targets these
  markers. You may READ plant data anywhere; you may not edit, reformat, reorder, or
  add plants.
- **The data schema** — exactly these fields per plant (CSV columns 1–31):
  `common, latin, hue, visual, water, aspect, soil, prune, source, peak, order,
  bench, root, trade, retail, margin, type, shrink, returnRisk, pots, cvs,
  hardiness, resilience, uses, size, seasonalImpact, growthSpeed, pestRisk,
  thirst, careLevel, sunNeed`. Never add, rename, or remove schema fields.
- **Existing localStorage shapes**: you may ADD new keys (namespaced `timber-*-v1`),
  but the existing `timber-progress-v1` and `timber-quiz-v1` shapes must keep
  loading exactly as before. Migrations must be silent and lossless.
- **Swipe/flip gesture mechanics and thresholds** — staff muscle memory exists.

If a workstream seems to require breaking a locked item, skip that part and say so
explicitly in your output. Do not "improve" locked things in passing.

## TEST GATE

The repo has a real headless-Chromium test harness that must stay green:

- `tests/app-test.js` — 94 checks: gestures, flip, search, quiz, persistence, a11y
- `tests/edge-test.js` — 8 checks: corrupt storage, empty deck, undo edge cases
- `tests/sw-update-test.js` — service-worker update path
- `design/verify-cards.js` — card rating maths vs data, missing assets

Rules for you:

- `NPLANTS` at the top of app-test.js / edge-test.js equals the plant count — do not
  change it (you are not adding plants).
- For every feature you add, ALSO output new test checks in the same style as
  `tests/app-test.js` (puppeteer-style: drive the page, assert DOM/storage state),
  appended in a clearly marked block, so they can be pasted into the suite.
- If a change could plausibly break an existing check (e.g. you add a menu row and a
  test counts menu rows), name the check and say what to verify.

---

# WORKSTREAMS — implement in this order, as many as you can

Each workstream is self-contained. Complete a workstream fully (code + tests +
notes) before starting the next. If you run out of room, stop cleanly at a
workstream boundary — half-implemented features are worse than fewer features.

## WS1 — Spaced repetition — ✅ ALREADY IMPLEMENTED, DO NOT REDO

WS1 is live in the attached `timber.html`. Do not re-implement or modify it. For
later workstreams, these are the real functions to hook into (all defined near the
top of the script, after the progress-persistence block):

- `loadSRS()` → validated `{ [latin]: {box: 1–5, due: 'YYYY-MM-DD'} }` object
- `srsOnSwipe(latin, learned)` / `srsOnQuizWrong(latin)` — the only writers
- `srsDueIdx()` → deck indexes due today/overdue · `srsNextDue()` → next future date
- `srsDateStr(offsetDays)` — LOCAL calendar dates; never use `toISOString()` for dates
- Review mode state: `reviewMode`, `enterReview()`, `exitReview()`; menu row
  `#reviewRow` with count in `#reviewDueMenu`
- Tests live in `tests/srs-test.js` (24 checks) — new tests must not break them

The original WS1 spec (kept for reference only):

**Problem:** "LEARNED" is currently one-and-done. Real retention needs review.
**Build:** a Leitner-box scheduler layered on top of the existing deck.

- New storage key `timber-srs-v1`: per-plant (keyed by latin name, NOT index —
  indexes shift when plants are added) store `{box: 1–5, due: ISO date string}`.
- Swipe right on a plant → box +1 (cap 5), due = today + [1, 3, 7, 16, 35] days by
  box. Swipe left → box = 1, due = tomorrow. Quiz wrong answer on a plant → box
  drops one, due = tomorrow (quiz feeds the scheduler — this is the loop that
  makes quiz mode matter).
- New menu row **"Review due (N)"**: shows count of plants due today or overdue;
  tapping it rebuilds the deck with ONLY due plants (reuse `renderCard` and the
  existing deck machinery — do not build a second deck implementation).
- The normal full deck and reset behaviour stay exactly as they are; SRS is an
  overlay, not a replacement. `FINGERPRINT` invalidation must NOT wipe SRS state
  (a new plant in the list shouldn't erase review history for the others — this is
  why the key is latin name).
- Dates: compare by local calendar date, not raw ms, so "due today" behaves at 7am.
- Empty state: if nothing is due, the row reads "Review due (0)" and tapping shows
  a small "All caught up — next review <date>" message.

**Acceptance:** learned plant comes due on schedule; failed quiz answer makes it
due tomorrow; adding a plant to PLANTS keeps other plants' SRS state; storage
corruption falls back silently to "no SRS data".

## WS2 — Quiz mode v2 — ✅ IMPLEMENTED

Current quiz: one clue → 4 name buttons, streak counter. Upgrade:

- **Reverse rounds** (~30% of rounds): show the common name, ask for the latin name
  (4 latin options). Keeps the existing uniqueness rule: only use a clue/answer
  pairing when it identifies exactly one plant.
- **Trade round** (~20%): show `retail` price + `type`, ask which plant. Only pick
  plants whose retail value is unique in the deck (same uniqueness discipline).
- **Weakest-first bias**: pick the answer plant weighted toward low SRS box —
  WS1 is implemented, so read boxes via `loadSRS()` keyed by `p.latin` (a plant
  with no record counts as weakest). Wrong answers already call
  `srsOnQuizWrong(answer.latin)` at the existing wrong-answer line — keep that
  call intact in any round type you add.
- **Session summary**: after quiz close, show "7/9 this session · weakest: <plant>"
  using per-session counters only (no new storage needed beyond WS1's).
- Keep the existing overlay, streak, best-streak persistence, and timing intact.

**Acceptance:** all round types render inside the existing quiz overlay; a plant
with non-unique retail price never appears in a trade round; streak/best logic
unchanged for classic rounds.

## WS3 — Deck filters & seasonal mode — ✅ IMPLEMENTED

- New menu section **Filter deck**: chips for `type` (values discovered from data at
  runtime — never hardcode the list), `hardiness`, and evergreen/deciduous if
  derivable from `type` text (if not cleanly derivable, omit — no guessing).
- **"In season now"** filter: using the device date and the existing `parseMonths`
  helper on the `peak` field, show plants at peak this month. Same for an
  **"Order now"** view using the `order` field ("Book Wk25" — parse the week number,
  compare to current ISO week; if a value doesn't parse, that plant simply doesn't
  match the filter, no errors).
- Filtering rebuilds the visible deck via the existing machinery; clearing the
  filter restores the saved full-deck state EXACTLY (progress must not be lost by
  entering/leaving a filter — treat filtered decks as ephemeral views: swipes in a
  filtered deck still update learned/SRS state but do not overwrite the saved
  full-deck stack).
- Filter state is NOT persisted — reopening the app always starts on the full deck.

**Acceptance:** filter chips reflect actual data values; entering + leaving a filter
leaves `timber-progress-v1` byte-identical if no swipes happened; unparseable
`order`/`peak` values never throw.

## WS4 — Fuzzy search — ✅ IMPLEMENTED

Current search is substring-only; retail staff type fast with typos ("choysia").

- Upgrade the search in place: rank by (1) prefix match, (2) substring, (3) fuzzy —
  edit-distance ≤ 2 on any word of common/latin/cvs fields. Implement a tiny
  bounded Levenshtein inline (≤ 30 lines, early-exit past distance 2). No libraries.
- Also index the `cvs` field (cultivar names like 'Firepower') and `uses` — a
  search for "firepower" or "patio" should hit.
- Show a subtle "did you mean" ordering, not a separate UI — best matches first in
  the existing results list. Zero-result queries with a fuzzy hit ≤ 2 show those
  hits rather than nothing.
- Must stay instant at 500 plants: precompute a lowercase search index once at
  startup, not per keystroke.

**Acceptance:** "choysia", "nandena", "hydranga" each find their plant; exact
matches always outrank fuzzy ones; empty query behaves as today.

## WS5 — Stats dashboard — ✅ IMPLEMENTED

New menu row **"My progress"** opening an overlay (same pattern as the quiz overlay):

- Learned X / N with a simple progress bar (CSS only, hue-neutral).
- Quiz: best streak, and if WS1 exists: box distribution (5 small bars, "box 5 = 
  mastered") and "next 3 due" list.
- **Weakest plants**: bottom 3 by SRS box (WS1) or most-skipped (fallback: count
  left-swipes per latin name in a new `timber-stats-v1` key — additive, validated,
  try/catch'd like everything else).
- No charts libraries, no canvas — plain DOM + CSS bars.

**Acceptance:** overlay opens/closes like the quiz overlay including focus return
to the menu button (mirror `closeQuiz()`'s focus handling); numbers derive live
from storage, never cached stale.

## WS6 — Photo layer plumbing — ✅ IMPLEMENTED (sw.js untouched: the existing worker already runtime-caches photos)

The repo has curated photos in `photos/` (e.g. `nandina-domestica.jpg` naming
pattern: lowercase latin, spaces→hyphens) but cards don't use them yet. Do the
plumbing WITHOUT touching card layout:

- Add a helper `photoFor(p)` → `photos/<latin-slugified>.jpg` and a capability
  probe: attempt load, on error mark that plant photo-less for the session (a
  `Map`, not storage).
- In the SEARCH info sheet and CUSTOMER view only (not the swipe cards — those are
  design-locked), show the photo at the top if it loads, silently omit if not.
- `sw.js`: add a `photos/` runtime-cache (cache-first, separate cache name
  `timber-photos-v1` so shell updates don't evict photos). Bump shell cache to
  `timber-v2`. Keep the existing update flow working (`sw-update-test.js` guards it).
- Lazy: photos load only when a sheet opens, never at startup.

**Acceptance:** app behaves identically for plants with no photo file; offline
after first view of a photo, that photo still shows; startup network waterfall
unchanged (no photo requests before user action).

## WS7 — A11y + polish pass — ✅ IMPLEMENTED

- Every new interactive element from WS1–6: `role`, `tabindex`, `aria-label`,
  Enter/Space activation — match the existing `dictRow` pattern exactly.
- Overlays: focus trap while open, Escape closes, focus returns to opener (the
  quiz overlay is the reference implementation).
- `prefers-reduced-motion`: guard any NEW animations you add (do not touch existing
  card animations — locked).
- Audit your own new code for: unhandled promise rejections, listeners leaked on
  overlay close, layout thrash in loops (batch DOM writes).

**Acceptance:** keyboard-only user can operate every new feature; the 94 existing
a11y-inclusive checks still pass.

---

# OUTPUT FORMAT — follow exactly

For EACH workstream you complete, output in this order:

1. `## WSn — <name> — IMPLEMENTED` (or `SKIPPED: <one-line reason>`)
2. **Placement map**: for each code block, the exact anchor in `timber.html` — quote
   the existing line the block goes after (e.g. "insert after line
   `const QUIZ_KEY='timber-quiz-v1';`"). Never say "somewhere in the script".
3. **Code**: complete, paste-ready blocks. If you modify an existing function,
   output the ENTIRE replacement function, never a fragment or "..." elision.
4. **New test checks**: paste-ready block for `tests/app-test.js` style.
5. **Risk notes**: existing tests that could be affected, and any locked-item
   boundary you deliberately stopped at.

Global rules for the whole response:

- NO rewrites of the whole file. Output only new/changed blocks with anchors.
- NO renaming existing functions, ids, classes, or storage keys.
- NO placeholder code, no `// TODO: implement`, no pseudo-code. Everything you
  output must run as-is.
- NO invented plant data anywhere, including in tests — use the real deck via
  `PLANTS` lookups.
- If you are uncertain a locked constraint applies, treat it as locked and note it.
- End your response with a **VERIFICATION CHECKLIST**: the exact commands to run
  (`python3 -m http.server 8477 &` then the four test files) and a 5-item manual
  phone QA list for the features you built.

All seven workstreams are implemented. This brief is retained as the project record.
