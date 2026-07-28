# Timber Build Log

## Current phase

Phase 2 — Customer Match slice complete and verified. Phases 3–8 not started.

## Latest completed slice

Phase 2 Customer Match, built onto the approved Phase 1 foundation in
`command-centre/timber-command-centre.html`. The Phase 1 architecture (reducer,
persistence, migration, portal overlays with focus trap, toast timer service,
error boundary, developer panel, responsive shell) was preserved, not rewritten.

**Deliverable path deviation.** `CLAUDE-TIMBER-PHASE2-HANDOFF.md` instructs that
`timber-polished-phase1.html` become the repository `timber.html`. That was not
done, for the reason recorded in Amendment 1 of the build spec: `timber.html` is
the swipe-card learning deck, and `sw.js`, `plants-tool.js`, `tools/add-plant.js`
and all three suites in `tests/` depend on it. Overwriting it would have taken
out six files, and the service-worker cache would have made the damage look
intermittent. The Phase 1 file was placed at
`command-centre/timber-command-centre.html` instead. Nothing outside
`command-centre/` was modified.

## Files changed

- `command-centre/timber-command-centre.html` — added (Phase 1 file, then the Phase 2 slice)
- `CLAUDE-TIMBER-PHASE2-HANDOFF.md` — added verbatim
- `TIMBER-BUILD-LOG.md` — this file

`timber.html`, `sw.js`, `plants.csv`, `plants-tool.js`, `tools/` and `tests/`
are untouched.

## Behaviour added

**Catalogue.** 30 plant records expanded from a readable seed table into the
canonical §7 nested shape via `normalisePlant`. Horticultural and safety fields
are researched values; price, stock, bench and supplier are fictional and
labelled as such. Toxicity uses three values — `not-known-toxic`, `toxic`,
`unknown` — and `unknown` is never treated as safe anywhere in the system.
The data deliberately contains a compliance hold (Olea europaea, Xylella host),
an unrecorded passport (Carex punicea), four unverified-toxicity records, two
unresolved-taxonomy records, a record with no photograph, two out-of-stock lines
and several substitute relationships.

**Scoring engine.** Pure functions with no React, no state, no `Date` and no
randomness. Fourteen weighted criteria totalling exactly 100. Each criterion
returns partial credit rather than a binary pass. Requirement strictness
(`required` / `preferred` / `neutral`) is per criterion: `required` can block,
`preferred` deducts, `neutral` is excluded from the denominator so unanswered
questions never drag a score down. Results split into three panels — saleable,
needs verification, and ruled out with the reason attached.

**Customer Match.** Four-step wizard, ranked results with signed per-factor
reasons, a criterion-by-criterion score drawer showing weight and awarded points
per row, shortlist with quantities, companion add-ons and a running GBP basket,
a controlled rejection modal that cannot be submitted without a reason, session
save, print view, and a simulated (explicitly labelled) customer QR link.

**Today.** The queue is now derived from the catalogue, curator queue, demand
signals, sessions and learning assignments — nothing is hand-listed.
`state.actionItems` holds only manual overrides. Resolve, assign and reopen all
work and change the derived queue immediately. Role changes the ordering.

**Cross-view chains wired and tested.** Declining a recommendation writes a
demand signal with its reason and moves the buyer's panel; a search that ranks
nothing is recorded as unmet demand and reaches the buyer's queue; saving a
session moves the session count and, when requested, creates a follow-up action.

## Tests run

- `window.runTimberSelfTests()` — **68 / 68 passed** (27 Phase 1, 41 added for
  Phase 2). Phase 1 confirmed at 27/27 in a real browser *before* any edits, as
  the handoff requires.
- Acceptance Scenario 1 driven through the actual interface with Playwright —
  **20 / 20 checks passed**: ranking, in-stock-only primaries, toxic plants
  excluded, verification bucket separated, ruled-out reasons shown, score drawer
  contents, Escape closing the drawer, basket totals, add-on affecting the total,
  decline blocked without a reason, session saved as "shortlist created",
  decline reaching the buyer view, resolving removing a queue row, roles showing
  different top priorities, session surviving reload, no uncaught page errors.
- Widths tested: 360, 390, 768, 1280 — no horizontal overflow at any width,
  navigation reachable at all four.
- Console: clean apart from Babel's expected in-browser-transformer notice,
  which is inherent to the no-build CDN delivery form the spec mandates.

Verification note: `unpkg.com` is blocked by this environment's network policy,
so the runs above served the exact repository file with only the three pinned
CDN `<script src>` values rewritten to identical local copies of the same pinned
versions. No application code was altered for testing.

## Defects found and fixed in this slice

1. **Phase 1 responsive failure.** `.header-actions` overflowed the viewport by
   37px at 360px and 7px at 390px. Fixed by giving the header actions their own
   row below 560px rather than dropping a control.
2. **Unverified toxicity was being treated as toxic.** The generic
   required-criterion blocker fired on safety, so unverified plants were blocked
   outright instead of being held for verification. Safety is now excluded from
   the generic rule and handled by an explicit pass that distinguishes "toxic"
   from "unverified".
3. **Two score labels contradicted their sign** — a deduction captioned
   "4 on the bench" and a `+13` captioned "shadier than ideal". Both notes now
   read consistently with the points they carry.
4. **`PlantsView` read the old flat plant shape** and would have displayed
   zero in-stock records. Repointed at `stockAtSite`.
5. **Console 404** on `/favicon.ico`. Silenced with an empty data URI so a
   spurious 404 cannot be mistaken for an application error.

## Known issues

- `handleReset` still uses `window.confirm`. It is Phase 1 code and outside this
  slice; it should become a Modal in Phase 8 polish.
- Views 3–7 (Plants, Learning, Curator, Value Proof) remain Phase 1 summary
  shells. Their counts are read from live state and are correct, but they carry
  no working loop yet.
- Plant photography is not wired in — `images` is empty for every record, which
  is why "missing photograph" appears in the Today queue for all 30.
- The horticultural data is demonstration-grade. It has not been checked against
  RHS or another primary source by a human. Records where I was not confident
  carry a populated `uncertainty` array and a reduced `confidence`, but the
  absence of an uncertainty entry is not proof of correctness.

## Assumptions made

1. Deliverable is `command-centre/timber-command-centre.html`, not `timber.html`
   (Amendment 1). Nothing outside `command-centre/` was touched.
2. The Command Centre seeds its own catalogue in the §7 nested shape. The deck's
   flat 25-field schema and `plants.csv` are untouched; mapping between the two
   is Stage B work.
3. Spec §10.2 lists both "preferred light" and "minimum tolerated light" as
   customer inputs without defining them. They are read here as describing the
   **position**: `light.preferred` is the light the spot normally gets,
   `light.minimum` the lowest it drops to. A plant must cope with the worst case;
   it is then scored on how well the normal level suits it.
4. Spec §9.2 does not list light as a blocker but the requirement model allows
   any criterion to block when set to `required`. Light therefore blocks only
   when the customer marks it "must have"; otherwise it is a heavy deduction.
5. Session status is `shortlist-created` and the record has no
   `acceptedPlantIds`, no `sold` and no `purchased` field. Whether a customer
   bought is an EPOS fact this demonstrator does not have. A self-test asserts
   those fields are absent.

## Next smallest complete slice

Phase 3, first slice: Plant Intelligence catalogue — search across common,
botanical, cultivar and trade names, the in-stock and department filters, and a
detail panel that renders `soilWarning`, `prune`, `toxicity` and `compliance` as
four visually separate blocks with the confidence badge and uncertainty list.
Substitutes clickable. Do not start the Timber card render until the four-block
separation is in place and tested.
