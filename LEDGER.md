# Next-brick ledger

## timber  [active]
brick: Photograph the next tranche of the 52 held cards that peak in August —
  `node tools/deal-plant.js "<latin>" <photo>` now deals each one in a single
  command. The other 46 want a May / March / November / June visit.
since: 2026-08-11  sessions-unchanged: 2
progress: 2026-08-14 (Pretty Lady Maria groundwork) — **the one piece of that
  card that could be built without its artwork is built; the card itself is
  blocked on three things that do not exist yet (r58).** Oscar brought a full
  build brief for an Anemone 'Pretty Lady Maria' special card — cool silver-lilac
  frame, one static edging overlay, two wisps (shimmer + sweep), no ANIM pack.
  The architecture call in that brief is right and needs no new mechanism.
  BLOCKED, and stated plainly rather than worked around: **the plant is not in
  the deck** (only *Anemone x hybrida* 'Honorine Jobert' is, and 'Pretty Lady
  Maria' has no card, no `latin` string and therefore no slug), **none of the
  four assets are on disk**, and there is no photograph. The brief's own Step 1
  says confirm the record exists first. It does not. Nothing was invented to
  paper over that — a HOLO entry keyed to a guessed slug and pointing at four
  missing files is worse than no entry, because check-boot would then be
  asserting against fiction.
  SHIPPED, because it is real work that is needed whichever way the frame lands:
  the three CSS-supplied holo pieces are **tokenised**. The spine values, the
  HEIGHT/SPREAD labels and the master strip are set straight onto the frame
  ARTWORK — the parchment rail patch is hidden on a holo card, so there is no
  panel under them and their contrast is whatever the frame gives them. The
  literals were Eternal Flame's warm cream on a red-brown shadow, which is right
  on a fire card and would be invisible on a cool one. Now `--holo-ink`,
  `--holo-label-ink`, `--holo-master-ink` and `--holo-shadow`, each with the
  original value as its var() FALLBACK, settable per card from its HOLO entry
  (`ink` / `labelInk` / `masterInk` / `shadow`).
  Verified in both directions in a real browser, not by reading the diff: unset
  computes to exactly `rgb(255,233,168)` / `rgb(255,223,154)` / `rgb(255,238,194)`
  with the original two-part shadows, and the Pretty Lady Maria values override
  all four including the comma-carrying shadow. perf-test's pixel-parity check
  covers both existing holo cards and is green.
  The colours ride the SAME `lateBG` deferral as the frame artwork, deliberately:
  they are only ever read against that artwork, so landing together means a card
  can never flash cool ink on the standard frame. The build brief's own snippet
  proposed a plain `style=` attribute here, which would have undone r57's
  special-card deferral and re-fetched 2.3 MB for cards a hundred deep.
  ALSO CORRECTED: CARD-PROTOCOL's wisp section promised `mix-blend-mode:screen`.
  There is no blend mode in the CSS and there cannot usefully be one —
  `contain:strict` isolates the stacking context, so it never reaches the
  photograph. The "only ever adds light" guarantee is keyed into the ASSETS by
  extract-wisps.js. That line would have had the next batch of wisp art authored
  against a blend mode that does not run, which is exactly the mistake this
  card's overlays are about to be drawn into.
  A NOTE FOR THE FRAME ITSELF: no ink colour rescues lettering set on a pale
  silver spine. The artwork must leave five rectangles flat and dark enough to
  carry light type — the two rail-value slots (x 19.9-33.9, y 268-318 and
  y 416-467), their two labels just above (y 221.5-262.6 and y 370-411), and the
  master strip (x 58.8-403.2, y 575.7-584.7), all in 420x600 template px.
  Gate 17/17 serially. `--jobs 3` flaked twice on this box (a timed rewind hold
  and a features-test timeout); both pass alone and neither touches this change.
progress: 2026-08-14 (link performance) — **the link did not open, and the
  cause was measured rather than guessed: 76 seconds of forced layout and 16.9 MB
  of images. Both fixed; a throttled phone now opens the deck in 4.4s instead of
  81s, on 1.77 MB instead of 16.9 MB (r57).** Reproduced first: a 390x844 Chromium
  at 4x CPU throttle on a 9 Mbps link took 81s to `load`, and on a 1.6 Mbps link
  never finished at all — past a 120s timeout, which is exactly what "won't open"
  looks like from a phone.
  1. **`fitInk` was the 76 seconds**, confirmed by V8 CPU profile: 76.6s of self
     time in one closure. It shrank each ink zone by a quarter-point and re-read
     `scrollWidth` between every write, so each step forced a synchronous layout
     of a 166-card deck — ~1,325 zones actually shrink, up to 18 steps each. Now
     batched: all writes then all reads, binary search over the same quarter-point
     grid, so a round costs one layout instead of thousands. Proved equivalent,
     not assumed — an A/B against pre-change bytes compared the final `fontSize`
     of all **1,823** ink zones across every card: **identical, zero differences.**
     All six bulk deals go through a new `dealCards()`; `undo` still fits inline.
  2. **The artwork was the 16.9 MB.** `art/frame-600.png` alone was 3.6 MB, and
     the two special cards pulled another 8.5 MB from ~100 cards down because
     their frames, strips and edging were inline `background-image` on elements
     that render at any depth. Now: `tools/optimise-art.js` derives WebP from each
     master (20.3 MB -> 3.8 MB, q90 with `smartSubsample` — the default 4:2:0
     visibly costs saturated gold on green, measured), `tools/optimise-photos.js`
     derives card-sized photos (44.8 MB -> 19.1 MB at 1000px, the card window is
     ~350 CSS px), and special-card art rides the same ten-card `data-bg` window
     the photographs already use, so boot pays nothing for buried cards.
  **Checked what could have broken.** Screenshot A/B of the rendered Avondale and
  Eternal Flame cards, old build vs new: RMS 2.3 and 2.5 out of 255, under 0.04%
  of subpixels off by more than 24 — both cards fully dressed, no missing art, no
  page errors. Masters stay in the repo (design tools read them, and a returning
  phone's cached shell still resolves the old paths). `check-boot` learned to read
  WebP strip widths; `build-standalone` now keys on `photoSrc()`, which also fixes
  two pre-existing gaps there — `art/holo/` and `art/anim/` were never inlined,
  and only the first of the two detail sheets was rewired. Two new `--check`
  gates fail if a derivative goes stale. Full gate 17/17.
progress: 2026-08-14 (consolidation) — **three parallel sessions merged into one
  live line (r56).** Swipe-release feel, WS1 boot safety, and search Go-to-card
  were each written against r52 in separate sessions, each stamped itself "r53",
  and none could see the others — so their entries below overlap in numbering
  and all three collided in `timber.html`. Two collisions were the BUILD stamp;
  the real one was `attachGestures`/`fling`, where the swipe line's velocity
  tracking and the search line's `stopGoto()` touch the same lines — combined so
  a touch or real swipe cancels an auto-run AND carries the velocity-matched
  throw. Checked before trusting it: the goto run advances via `tuckUnder`/
  `undo`, never `fling`, so the added `stopGoto()` in `fling` cannot cancel the
  run that scheduled it. Re-stamped r56, full gate 15/15 (727s, --jobs 3) on the
  merged build — including app-test's gesture checks and features-test's new
  Go-to-card cases. The three branch entries below record the sessions as they
  happened; their "r53/r54" stamps were branch-local and are superseded by r56.
progress: 2026-08-14 (later) — **WS1 boot safety landed from ChatGPT, r53.
  Reviewed, applied, and the bug it fixes was CONFIRMED REAL by control test
  rather than taken on faith.** `tools/check-boot.js` (new, 205 lines) +
  non-fatal ANIM validation in the app + `check-boot` as the 6th fast check,
  so the Pages gate now compiles the app's script before deploying.
  **THE CONTROL IS THE POINT.** Loaded pre-patch r52 with one deliberately
  broken ANIM duration array: **0 cards, blank app, pageerror**. Same
  breakage on r53: 167 cards, no error, only that one overlay dropped. The
  premise in the brief was an inference; it is now measured both ways.
  VERIFIED BEYOND WHAT ITS OWN TEST COVERS. `tests/check-boot-test.js` ships
  three negative cases (syntax, missing asset, duration mismatch) and all
  three pass — but ChatGPT wrote the checker with **no image binaries in its
  copy of the repo** (the zip I sent strips 110MB of art/photos and carries
  an ASSET-LISTING instead), so every asset and PNG-header path in it was
  written blind. Tested those separately against the real files: strip width
  not divisible by frame count is caught reading real IHDR bytes (5120px /
  9 frames), missing wisp asset caught, registry key that is not a current
  plant caught, and **the historical r18 "whole app dead" trailing-comma
  class is caught** — which was the entire justification for WS1.
  The build stamp it shipped (r53 · 34f5880) verifies clean, so it ran
  build-stamp properly rather than hand-typing a number.
  Full gate **15/15** (~760s at --jobs 3). Zero geometry drift.
  MY OWN FIRST TEST WAS THE THING THAT WAS WRONG: I asserted `cards>200` from
  the ledger's "144 dealt" and got three red lines against a healthy app. The
  deck is **167 dealt / 86 held**; the 144/98 figure has been stale in this
  file since r41. Fixed the assertion, not the app — and the ledger's counts
  are not to be trusted over `tools/plant-data.js`.
  TWO THINGS LEFT ALONE, both flagged rather than silently changed:
  `check-boot-test.js` is deliberately NOT in `run-all.js` (it rewrites
  timber.html, and `sw-update-test` already does that *inside* the parallel
  pool — a latent race in the existing harness, not one to double); and
  check-boot's `<script>` regex would truncate if a future edit ever put the
  literal `</script>` inside a JS string, which would silently shrink the
  region being syntax-checked.
progress: 2026-08-14 — **architecture audit → `CHATGPT-BRIEF.md`. No code
  changed; Oscar asked for the audit and a prompt, not edits.** The audit's
  honest headline: the mega-prompt's wishlist (config-driven special cards,
  stop-motion animation runtime, reduced-motion, offscreen pausing, asset
  extraction tooling, geometry locks) is ALREADY BUILT and tested — the brief
  refuses to rebuild any of it. What it does ask for, ranked: (1) the Pages
  deploy gate never executes or syntax-checks the app's JS, and
  `buildAnimCSS()` throws at boot on a bad ANIM entry — one config typo on
  the live branch deploys a blank app, the trailing-comma failure class with
  no gate in front of it → new fast check `tools/check-boot.js` + non-fatal
  pack validation; (2) small tool bugs found by reading, not running:
  `plant-data.js` out-of-scope `decl` in an error path, `deal-plant.js`
  hardcoded `/opt/node22` playwright path, `check-plant-json.js` carrying two
  different soil budgets 20 lines apart, slug function duplicated 8× with
  `plant-images-tool.js` divergent (no NFD fold); (3) boot does O(deck)
  forced layouts — `fitInk` per card × 242 — defer to first promotion +
  idle trickle; (4) "Reset progress" wipes history on one tap, unrecoverable
  by design of the reset itself → two-tap confirm. Deliberately REJECTED
  after costing: moving PLANTS_ON_HOLD out of the file (~90KB dead payload,
  but gzip makes it ~15KB and the §0b tool contract depends on it), deck
  virtualization at 242 cards (spec'd as WS6, parked until ~400+), visual
  regression infra. Brief follows the DEEPSEEK-BRIEF format because that one
  verifiably completed all seven workstreams.
progress: 2026-08-14 — **swipe release feel fixed (r53).** Oscar: too much
  resistance / glitch right before a card goes. Cause was threefold: commit was
  distance-only (95px — a fast flick released at 90px snapped back), and every
  fling ran a fixed 350ms ease-out, so a hard swipe visibly decelerated at the
  moment of release. Now: threshold 88px (~7% easier, inside his 5–9% ask),
  a flick ≥0.6px/ms commits from 65px (smoothed velocity; an 80ms finger-pause
  before lifting voids stale speed), and the throw duration matches finger
  speed (200–350ms). Verified with a 10-check synthetic-touch script — flick
  paths, snap-backs, tap/flip untouched — plus the full suite; the one failure
  (app-test reload timeout) reproduces identically on unmodified HEAD in this
  sandbox, so it is environmental, not the change. NOTE: that reload hang
  aborts app-test at line 344, so its own touch checks (§15) don't run here.
progress: 2026-08-13 (later) — **`tools/photo-run.js` — the shooting sheet is a
  command now.** The 08-11 sheet was a chat: it could not be re-run and its
  numbers rotted immediately.
  **THREE BUCKETS, NOT TWO, and Corylus 'Contorta' is why.** A sheet that splits
  on "does peak cover this month" would have said skip it in August; the shot
  reads perfectly and it is dealt. Peak is the peak of INTEREST, not the only
  month worth a photograph. So SHOOT (52) / LOOK (16, off-peak but still
  physically there) / WAIT (30, flowers, named month). LOOK only ever promotes
  out of WAIT, so a wrong guess costs one glance on a lap already being walked.
  **TWO BUGS FOUND BY READING THE OUTPUT RATHER THAN TRUSTING IT.** Promoting on
  "foliage" and "form" put *Dicentra spectabilis* on the August list — it is
  fully dormant by August, there is nothing above ground — and Delphinium, tatty
  the moment the spike is over. Narrowed to bark / stem / berries / evergreen:
  30 -> 22. Then "stem" turned out to be grammar more often than subject —
  "arching stems hung with pink lockets", "bare stems buried under golden
  flowers" — where the stem is how the FLOWER is held. Forsythia, Kerria,
  Weigela and Kolkwitzia all arrived in August that way. A carrier verb beside
  the stem is the tell and it separates cleanly: the cards that genuinely sell a
  stem never use one. 22 -> 16, all sixteen defensible.
  **MY OWN BRIEF WAS WRONG ABOUT THE GROUPING.** It proposed grouping by `type`.
  `type` is empty on 95 of 98 held cards — it carries the Schedule 9 banner and
  nothing else, and `root`, `bench`, `pots` are empty too. There is no category
  field at all. Grouping now comes from the height in `size` with climber /
  hedging / rose lifted out of `uses` prose, unparseable sizes under their own
  heading, and `--rules` printing the lot so it can be argued with.
  Every peak string in the file must parse before any counting happens.
  `--html` writes a phone sheet, ticks persisted per month; gitignored, because a
  committed generated sheet is the stale document this replaces. 14/14.
progress: 2026-08-13 — **hold-to-rewind shipped and IS LIVE (r41, run #27).**
  Oscar asked to hold the undo button to reset the deck; I built a 2s
  hold-to-commit with a filling progress bar, and he corrected the design before
  it ever went out: hold should *rewind*, fast but slow enough to stop partway,
  "in case someone's only trying to go back that far", with the cards animating
  back in.
  **HIS VERSION IS STRICTLY BETTER AND IT IS WORTH KNOWING WHY.** A threshold has
  two outcomes and needs a confirmation affordance to be safe. A scrub has no
  outcome to confirm at all, because every frame of the gesture is a state you
  could have reached by tapping — so letting go is the whole safety mechanism and
  the progress bar became meaningless. I had designed the guard rail before
  asking whether the cliff needed to exist. The readout is now the glyph spinning
  anticlockwise, which says "running backwards" rather than "about to commit".
  PACING is the feature: 340ms before anything repeats so a tap stays a tap, then
  190ms decaying x0.82 to a 40ms floor — ~10 cards in the first second with
  enough separation to stop on the one you meant, ~25/s after, ~6s for the whole
  deck. The step counter resets on every press, so release-and-re-press gives the
  slow zone back for fine-tuning.
  Cards re-enter from the side they were flung to — asserted at +523.6px and
  -523.6px rather than assumed. Fly-in duration is DERIVED from the gap (gap x2.4,
  clamped 90-300ms) because `markHot()` only promotes three live cards: a fixed
  300ms flight at full tilt would leave cards stacked mid-air below the hot
  window and losing their layer, which is the white-flash failure the compositing
  comments already describe. perf-test green.
  Reduced motion deliberately departs from the "card animations are locked as-is"
  note: that note governs the existing swipe, and 25 cards a second flying across
  the screen is the exact thing the preference asks us not to do. Cards cut
  straight to place; the rewind still works, and there is a test for it.
  **THE AUGUST SPLIT WAS ALREADY YOURS — I re-derived it, I did not find it.**
  Wrote `SUPERCHARGE-BRIEF.md` off the pre-08-11 tree and led it with "the brick
  is not 105 photos, it is 57 and a diary". Rebasing surfaced that the 08-11
  session had reached the same conclusion two days earlier and it is sitting in
  the brick line above. Independent agreement is worth something as corroboration
  and nothing as news; the brief now says so.
  What the re-derivation did add is that **the counts rot and the months do not**.
  Computed twice a few hours apart across ten new photographs: 57/48 became
  52/46, same four months in the same order (May 22, Mar 14, Nov 8, Jun 2, zero
  uncovered). **And the shooting sheet exists only as a chat — grep finds it
  nowhere but this ledger.** A number that moves daily, held in a document nobody
  regenerates, is the argument for committing `tools/photo-run.js`.
  `deal-plant.js` also rescoped the brief's intake tool down to a front end over
  logic that already works, rather than a reimplementation of it.
  Build r41. Full gate 14/14 against the rebased tree. csv 242 rows (144 + 98).
progress: 2026-08-11 — **the first photos arrived and the brick moved for real:
  deck 134 -> 136.** Oscar sent three from the centre. Two dealt, one refused.
  **NEW TOOL, `tools/deal-plant.js`** — the missing half of the toolchain.
  `add-plant.js` creates a new card from JSON; nothing existed to attach a
  photograph to a card already written and sitting in hold, which is the state
  105 cards are in. One command now stages the photo at 1200px, lifts the row out
  of `PLANTS_ON_HOLD` into `PLANTS`, and records provenance. The row is moved as
  matched TEXT rather than re-serialised, so a dealt card is byte-identical apart
  from where it sits; photo and html roll back together if the result does not
  re-parse.
  FOUND BY USING IT: `photo-credits.js --set` could only ever UPDATE an existing
  entry, so a newly staged photo could not be recorded at all without hand-editing
  CREDITS.json — and the whole point of that file is that it is not hand-edited.
  It now creates the entry when the file is genuinely on disk, and still refuses
  when it is not, so a typo'd filename is still an error rather than a phantom
  record.
  DEALT: *Corylus avellana* 'Contorta' (2198x3586 -> 736x1200) and *Eucalyptus
  gunnii* Azura (2498x4000 -> 749x1200). Both render clean — checked, not assumed.
  The hazel is interesting: August is a "wait" month for it on the shooting sheet,
  but the shot shows the corkscrew stem legibly, so it earns its card now. The
  sheet's advice is a default, not a rule.
  REFUSED: the third, a Sarcococca. Oscar could not remember the species and the
  deck's only Sarcococca card is *S. confusa* — so filing it would put it there.
  The leaves are narrow and lanceolate on reddish stems, which reads as
  *S. hookeriana* var. *digyna* rather than confusa. Separately, ~60% of the frame
  is bare soil and roof tile, so the card's portrait crop would show mostly soil.
  Written up as VERIFY-QUEUE item 21 with what would settle it. **A photo on the
  wrong card is worse than no photo** — the deck's value is that it can be
  trusted.
  Build r34. Full gate 14/14. csv 239 rows (136 dealt + 103 held).
progress: 2026-08-10 (night, later) — **Oscar checked the 50 and corrected 26 of
  them. Two were legal facts I had backwards.** Sent him a published worksheet
  laying the batch out for verification — prose quiet, my invented numbers on
  parchment strips — and he came back the same evening with a correction list.
  All 26 applied; deck still 134 dealt / 105 held, 239 total, no duplicates.
  **THE TWO THAT MATTER: I asserted a reassuring legal negative twice and was
  wrong twice.** *Cotoneaster horizontalis* — I wrote "carries no Schedule 9
  restriction in England and Wales". *Rosa rugosa* — I wrote "No UK legal
  restriction". **Both ARE on Schedule 9.** They are now compliance cards on the
  Gunnera pattern, both stating what Schedule 9 actually means: not a sale ban,
  an offence to plant or cause to grow in the wild. Deck now carries SEVEN
  compliance cards. The lesson is narrower than "check the law" — nobody asked
  me whether these were restricted. I volunteered the negative. A card silent on
  legal status is honest; a card that says "no restriction" is a claim needing a
  source, and I had none.
  TEN ACCEPTED NAMES CHANGED, which matters because the photo filename derives
  from `latin` — every one changed which file its card is waiting for. Nothing
  had to be moved on disk, because all 50 are held with no photograph. That is
  the reverse build paying for itself: a name correction that would have meant
  renaming files and rewriting CREDITS entries cost nothing at all. Superseded
  names all kept in `cvs` as `syn.` so old-name searches still land.
  ONE RENAME REFUSED, on his instruction: *Hebe* 'Red Edge' stays *Hebe*, because
  current RHS material uses both *Hebe* and *Veronica* treatments and a
  destructive rename trades one right answer for another. Synonyms recorded.
  SIZES: the deck means ULTIMATE size and several of mine were maintained size —
  Box 1.5-2.5m -> 4-8m, Bay 4-8m -> 8-12m, Privet 2.5-4m -> 4-8m. Clipped
  subjects invite exactly that error.
  HARDINESS moved on seven cards and my bands were optimistic more often than
  not (five downward, two up) — a bias worth remembering for any other
  Claude-estimated card.
  Six values he restated were already correct; the patch tool reported them as
  confirmations rather than treating a no-op as an applied fix.
  Build r33 — NOT r30. Rebuilding the rows meant restoring timber.html from the
  batch-1 commit, which carried r29 and would have deployed r30 over a live r32:
  a lower number on newer content, breaking the one signal that tells a phone
  which version it has. Bumped past the high-water mark instead.
  Still open on these 50: the four 0-20 ratings and the sun/aspect figures. His
  pass did not cover them.
progress: 2026-08-10 (night) — **r32 IS LIVE, and I got the reason wrong once on
  the way.** Publishing is ONE command: fast-forward the live branch
  `claude/timber-plant-pwa-j69h5e` and the push triggers the deploy itself.
  Verified — run #21, push event, commit 2c6862a, success, and its last step
  fetches the Pages URL and compares the served build stamp, so "green" means
  live rather than probably-live. Today's 234 cards are on Oscar's link.
  THE CORRECTION: I had already written into the README and a commit message
  that **"a push made by a Claude session does not create a workflow run"**,
  after pushing a feature branch produced no run while a dispatch on the same
  commit produced one. Then my own push to the live branch created run #21 four
  seconds before the dispatch I did not need. **The claim was false and is now
  removed from both files.** What is actually established: pushing the live
  branch deploys; pushing a feature branch produced no run (cause unknown); a
  dispatch aimed at a feature branch died in 2s with no logs, which LOOKS like
  the github-pages environment refusing a non-default branch but was never
  confirmed. Both files now say that rather than a tidy theory.
  Third time today that confident-and-specific-and-wrong is the failure mode
  (the Avondale frame, the photo provenance, now this). Same shape every time:
  a real observation, a plausible mechanism invented to explain it, and the
  mechanism written down as fact before it was tested. The observation was
  sound; the "because" was not.
progress: 2026-08-10 (later still) — **the live app publishes itself now.** Oscar:
  make the GitHub preview always update with new features. It wasn't updating,
  and the reason was exact rather than vague.
  **The workflow was pinned to two hard-coded branch names.** Every Claude
  session works on a fresh `claude/<topic>-<id>` branch, and none of them was in
  that list — so no session's work has ever published on its own. Checked
  against the API rather than assumed: **all 19 Pages deploys came from
  `claude/timber-plant-pwa-j69h5e`**, and the newest, run #19, is commit 5e2abc3
  — precisely the commit this branch forked from. **Today's 100 cards were not
  live and would not have gone live.** That is the same fact the ledger keeps
  recording as "NOT yet live: sits on branch X pending fast-forward"; it was a
  missing trigger, not forgetfulness.
  Now `pages.yml` fires on `claude/**`, so a push publishes. Four things guard it:
  (1) it REFUSES a commit that does not contain the current live commit, because
  two sessions at once is not hypothetical here (2026-08-07) and the second to
  push would otherwise silently roll the app back — force is available from the
  Actions tab and says what it is about to replace; (2) the deploy gate is now
  `run-all --fast`, all five data checks (~1s), up from the two it ran before —
  plant-sense is in that set, and it caught two bad cards of mine this morning;
  (3) the served-bytes verification was already there and stays; (4) only after
  that does it fast-forward the default branch, so ONE branch still records what
  is live. Plain push, so fast-forward-only; GITHUB_TOKEN pushes don't retrigger
  workflows, so it cannot loop. `[skip ci]` opts a commit out.
  The CLIENT half was already right and needed nothing: sw.js is
  stale-while-revalidate and posts `timber-updated` when a fresher shell lands,
  which raises the "Update ready · tap to refresh" pill. One load stale at worst,
  and the pill closes even that.
  NOT put in CI: the nine browser suites. They need Playwright and ~8 minutes,
  which is too slow in front of every deploy — so the full gate stays a local
  pre-push step. Worth revisiting if a bad push ever reaches the live app.
  [Unverified] the first real run — the workflow change publishes itself, so the
  proof is Actions run #20 going green and the live build reading r32.
progress: 2026-08-10 (later) — **second batch of 50: UK garden favourites. Hold
  block 55 -> 105; the deck itself is unchanged at 134.** Oscar asked for a list
  of 50 favourites; built it straight through the same pipeline rather than
  leaving a list in chat.
  **The thing to know about this batch is whose data it is.** The morning's 50
  came from Oscar's RHS-style JSON and I condensed it. **This 50 I chose and
  wrote myself**, with no network and no RHS page — so every rating, size band,
  hardiness value and hue is an editorial estimate. Written up as VERIFY-QUEUE
  item 18 in exactly those terms. Nothing is dealt, so none of it can reach a
  customer before he has looked at it. `origin` in the source file records it as
  claude-generated, not customer-verified.
  CHOSEN TO FILL REAL HOLES, not to pad a count. Before this the deck had **no
  rose at all** — no box, no beech, no privet, no Lavandula angustifolia, no
  hosta, no heuchera, no delphinium, no lupin. 40 of the 50 are genera the deck
  did not have; the other 10 are distinct species in genera it did (Prunus
  'Kanzan' and serrula, Acer 'Sango-kaku', Magnolia stellata, Viburnum opulus
  and davidii, Mahonia 'Charity', Cotoneaster horizontalis, Clematis 'Jackmanii',
  Lonicera nitida). Zero duplicates, checked against all 189 existing entries.
  DELIBERATELY EXCLUDED: bulbs. Galanthus, Narcissus, Allium and Cyclamen are
  unarguably favourites, but the card's prune / container / H×W fields fit them
  badly and that is a schema decision for Oscar, not one to make silently.
  **plant-sense earned its keep on new data.** It caught two of my own cards
  contradicting themselves: Pyracantha's `visual` led with spring flowers against
  a Sep-Jan peak (berries are what it is bought for — prose reordered, peak was
  right), and Astilbe 'Fanal' read as drought-tolerant at thirst 18/20 because
  `soilWarning` said "Dry soil crisps it within days" — a phrase that means the
  opposite of what it pattern-matches to. Reworded. That second one matters: a
  regex misread it, and a member of staff skimming the card would too.
  0 validator errors across all 50; the 41 remaining warnings are the
  0-5-vs-0-20 scale heuristic on genuinely low ratings.
  Build r32. Full gate 14/14. csv 239 rows (134 dealt + 105 held).
progress: 2026-08-10 — **reverse build: 50 cards created from data, 1 dealt, 49
  held. Deck 133 -> 134.** Oscar supplied a 50-plant RHS-style JSON and asked for
  the cards built first, photos to follow — with the standing rule that an empty
  card never sits in the deck.
  **The photo answer is 1 of 50, and it is worth knowing precisely.** Every latin
  was slugged the way the app slugs it and matched against `photos/`: only
  *Chamaerops humilis* has a file. Genus-level near-misses (three Rhododendrons,
  five Acers, one Lonicera) are all different species and unusable. No photos
  arrived in the chat either — the message was data only. So 49 cards go straight
  to `PLANTS_ON_HOLD`, which is not a failure of the batch: it IS the batch. The
  data is now in place so each card deals the moment a photograph lands.
  The one dealt card closes a loop that was already open: CREDITS.json records
  commit 799dc96 as *"Stage Oscar's own Chamaerops humilis photo (not wired into
  the app yet)"*. The photo has been sitting at 1200x1600 since 09 Aug with no
  card to hang it on. This batch supplied the card.
  ZERO duplicates against the existing 133 — every one of the 50 is new to the
  deck. `check-plant-json.js` passes all 50 with **0 errors**; the 49 remaining
  warnings are all the 0-5-vs-0-20 scale heuristic firing on genuinely low
  ratings (pestRisk 4/20 etc.), which the deck is full of already.
  **The one real schema fight was `aspect`.** Oscar's JSON gives it as a light
  level ("Full sun in a warm, sheltered position") and the validator rejects that
  BY DESIGN — the card's aspect is a compass facing and light already lives in
  sunNeed/sunMin. Rather than guess 50 times, one rule was applied across the
  batch from the supplied sunNeed (90+ → South/West, 70-89 → East/South/West,
  45-69 → Any aspect, 25-44 → North/East/West, under 25 → North/East), with two
  deliberate overrides where the source explicitly warns off afternoon sun:
  Dicksonia and Skimmia 'Rubella' go North/East, not North/East/West. Written up
  as VERIFY-QUEUE item 15 and marked [Unverified] — editorial calls from a rubric,
  same basis as the five climbers, not Oscar's portfolio.
  **Fifth compliance card: *Rhododendron luteum*.** Schedule 9 Part II, WCA 1981
  (England and Wales) — an offence to plant it or cause it to grow in the wild.
  Deliberately NOT given knotweed's ⚠ NEVER STOCK banner: Schedule 9 is not a
  sale ban, and a banner that over-reads the law costs Oscar sales of a plant he
  is allowed to sell. Uses the Gunnera fields (`type` + `returnRisk`).
  **One source claim was refused rather than repeated.** The JSON asserts
  *Dicksonia antarctica* "is not currently listed under CITES for trade
  restrictions". My recollection is the opposite and I could not check it from
  this container, so the card carries the true-either-way wording ("check the
  supplier's documentation") and VERIFY-QUEUE item 16 holds the real question.
  Two sessions running, confident-and-specific-and-wrong has been the failure
  mode here; this is the same trap declined.
  Nothing from the source was thrown away: `foliage`, `container`,
  `hardinessNote`, `toxicity` and the declared-`uncertain` lists have no home in
  the card schema, so they are committed at `data/source-batch-2026-08-10.json`,
  keyed by latin. Toxicity is folded into `resilience` (Lonicera precedent).
  Build r29. Fast checks 5/5; csv re-exported at 189 rows (134 dealt + 55 held).
progress: 2026-08-09 (night) — **two-photo cards and the Avondale blossom frame both
  ship.** Oscar asked for Cercis 'Avondale' as a special card alternating two
  photos every 3.5s with quick cuts through black, and supplied blossom frame art
  plus a component breakdown sheet.
  SHIPPED: `PHOTO_SWAP`, a new capability — a card can name a second photograph
  and blink between the pair. Built as CSS keyframes, not JS timers, and gated on
  `.hot`, so a 133-card deck never runs 133 animations and perf-test's compositing
  budget still holds; it also stops under prefers-reduced-motion. Deliberately a
  PAIR, not a carousel. Avondale is the case that earns it: peak Apr-May, "dense
  rose-purple pea flowers wreathe the bare branches", and the deck's photo was
  summer foliage — the card was showing none of what it sells. Leaf ↔ flower says
  it in one card. Oscar asked for 1ms fades; **1ms is under one frame** (16.7ms at
  60Hz) so it would render as a hard cut with no fade at all. Used ~105ms each way,
  the fastest that still reads as a fade, with the hold exposed as `--holo-swap`.
  Say the word and it becomes a true instant cut.
  THE FRAME: shipped — but only after I got it wrong. Oscar sent two files, an
  assembled frame and a component breakdown sheet. **I used the breakdown sheet as
  the frame**, rendered the mess that produced, and wrote a detailed VERIFY-QUEUE
  entry declaring HIS artwork off-spec on three counts: wrong canvas ratio, wrong
  spine width, panels painted where the photo covers them. Every measurement was
  accurate and every conclusion wrong, because they were taken against the wrong
  file. The assembled frame is 1049x1499, ratio 0.6998 — the same artboard as
  Eternal Flame, needing no rescale and no rebuild. It went straight on, and the
  spine ornaments carry the HEIGHT and SPREAD values exactly as drawn. Item 12 is
  retracted in full and rewritten. Second time today that confident, specific and
  wrong has been the failure mode (see the photo-provenance correction); the common
  cause is concluding from a derived artefact without checking it is the artefact I
  think it is.
  PANELS STAY PARCHMENT, on both special cards. Oscar on Eternal Flame: he could not
  read the stats and they were all over the place. He is right — dark label ink on
  orange flame, with the month strip and the n/5 values worst hit. The extracted
  fire panels are out and standard parchment is back; Avondale never got its panels
  swapped, for the same reason. **New rule for special cards: holo where it
  decorates, parchment where it informs.** The plaque, soil box and band are the one
  part of a card with a job, and a card whose numbers cannot be read has failed at
  it however good the border looks. Extracted panels kept in art/holo/ for a future
  frame drawn light enough behind the ink.
  ITEM 13 SETTLED same session: Oscar confirms early spring is right, so `peak`
  Apr-May stands and the blink stays on *C. chinensis* 'Avondale'. No change.
  CLIMBERS: asked after the held climber photos — **there are none on disk.** That
  is why all five are held, and their `size` fields still carry no H × W split
  ("2-3m", "8-12m"), so both rails would render blank even with a photo. One
  errand fixes both.
  Build r27. Full gate 14/14 at --jobs 3.
progress: 2026-08-09 (evening) — **Pink Kousa Dogwood: deck 131 -> 132. First card
  added deliberately WITHOUT a cultivar name.** Oscar sent three benched Cornus
  kousa photos with an AI-generated cultivar identification ('Milky Way',
  'Satomi', 'Heart Throb', 'Scarlet Fire', 'Venus') and asked what I made of it.
  Answer: confident and mostly unsupportable. Pink kousa bracts shift with
  temperature, light, flower age and plant maturity, so the same tree a fortnight
  apart reads as two cultivars — and the writeup's groupings were built on exactly
  that. Two claims are contradicted by the photos themselves: bract length ≈ leaf
  length **rules out 'Venus'** (bracts about double, and it is sold as C. ×
  elwinortonii anyway), and the narrow finely-acuminate bracts **argue against
  'Heart Throb'**, which is sold on broad rounded overlapping bracts. What the
  photos DO establish, and what went on the card: this is a genuinely pink-bracted
  selection, not a white form ageing pink — the colour is deep and even while the
  central head is still tight and green. Also found: **the two cream-bracted
  photos are different plants** (long-acuminate with gaps and pink tips vs rounded
  overlapping with a pink base flush); bract shape is far more stable than colour,
  so they must not be merged into one card.
  Oscar wanted the pink one in the deck, so it went in as a SPECIES card with cvs
  reading "unnamed pink form — the species is cream-white". Horticultural data is
  inherited from the deck's existing Cornus kousa 'Zuilb1' card rather than
  invented, and that is recorded in the JSON's uncertain list; only the size is
  changed, to the species' spreading 4-8m rather than the columnar cultivar's.
  This is the Sweet Cupcake lesson applied before the fact rather than after.
  Photo focus 50% 52% — the default clipped the hero bloom's lower bracts behind
  the stats plaque, and bract shape is the identifiable feature here.
  Good news on the tooling: this was the first plant added through add-plant.js
  since the trailing-comma fix, and it inserted cleanly — 131 -> 132 with the
  derived count agreeing. The EXIF path is also fine: the source reads 4000x3000
  landscape from its SOF header but carries an orientation tag, and the tool
  staged it correctly as 1200x1600 portrait.
  Build r24. Deck now has THREE Cornus kousa entries, two of which are the
  duplicate 'Flower Tower' pair from item 8 — worth resolving together.
progress: 2026-08-09 (later still) — **Jelena Witch Hazel + Mountain Hydrangea:
  deck 129 -> 131. Two real bugs in the add-plant tooling found by using it.**
  Both from Oscar's own photos, both first-of-kind in a small way: 'Jelena' is the
  second Hamamelis × intermedia (pairs with 'Arnold Promise' like the two Acer
  palmatums), Hydrangea serrata is the seventh hydrangea and the first species
  rather than a named cultivar.
  **THE TOOLING BUG THAT MATTERS: `add-plants-bulk.js` corrupted timber.html.**
  The r18 csv round-trip writes the deck's last row with NO trailing comma; both
  add-plant.js and add-plants-bulk.js append new rows straight before the `];`,
  assuming there is one. Result: `sunMin:40}` immediately followed by `{common:` —
  invalid JS, PLANTS unparseable, **the whole app dead**. This was armed the moment
  r18 reformatted the file and would have hit whoever added the next plant; it hit
  this one. The tools now insert the separator when the previous row needs it,
  verified by simulating a comma-less tail and re-parsing. Worse, the run left the
  broken file ON DISK — its count guard fired after the write, not before — so both
  tools now re-parse what they wrote and **roll timber.html back** if it doesn't
  come out clean, matching what r18 already did for plants-tool.js.
  Second bug, same run: the bulk tool counted the deck as every `latin:` in the
  file, so the 5 on-hold plants were included and 129+2 was reported as "136". It
  now counts dealt rows only. The single-plant add-plant.js always got this right,
  which is why it never showed up.
  PHOTO: the hydrangea shot is unusually tall (1200×2768) and the default 50% 40%
  crop showed only the red autumn foliage, clipping the flowers off the top edge —
  fighting the card's own Jul-Sep bloom band. Focus set to 45% 16% so a white
  lacecap sits in frame WITH the red leaves. Jelena needed no focus entry; the
  default frames the backlit copper ribbons perfectly.
  TWO THINGS FOR OSCAR, both in VERIFY-QUEUE rather than guessed at: the serrata
  card's hue is 220 (blue, the species archetype) while **his photo shows a
  white-flowered form** — and there is a nursery label in the shot, so this may
  want to be a cultivar card like the deck's other six hydrangeas; and the two
  Hamamelis × intermedia cards disagree on sunNeed (65 vs 80) and thirst (9 vs 11)
  for cultivars of one hybrid, which now sit side by side in any "witch hazel"
  search. Toxicity rides in `resilience` again (Lonicera precedent) — the fifth
  card to borrow a field for something the schema does not have.
  Build r23. Fast checks 5/5 throughout; full gate at the end.
progress: 2026-08-09 (later) — **Choisya settled + Japanese Knotweed added: deck
  128 -> 129. First plant work built on the r18 toolchain rather than the old
  per-plant routine.** Started on the old system by mistake — the card was built,
  the suites run card-by-card, and it cost minutes per gate at 129 cards. Redone
  on top of r18: `run-all.js --fast` gates the data work in **0.3s** and the
  browser suites run once, at the end. That is the whole difference; nothing about
  the card changed. The fast checks earned it immediately — they caught a stale
  `plants.csv` and a stale build stamp within a second of the row landing, both of
  which the old routine would only have surfaced after a full browser run.
  CHOISYA: the deck audit's last KNOWN_GAP, and VERIFY-QUEUE item 4. Filled from
  Oscar's JSON — aspect is now the real facing East / South / West (compass and
  light bar both render), growth 9 / thirst 6 / care 4 / sun 75 floor 40, plus
  visual, water, soil warning, prune, uses. **KNOWN_GAPS is empty for the first
  time.** Three calls went against the JSON and all are written up in VERIFY-QUEUE
  item 4 rather than buried here: pestRisk 3 not 8 (PLANT-BRIEF uses Choisya as
  its own "0–3 bulletproof" anchor — if 8 is right, the brief needs a new anchor
  plant, so this is a rubric question, not a card question); hue stays 150 per
  protocol v12.4, though the deck is genuinely split on white-flower hue and it is
  worth settling once; peak Apr–May -> May-Jun, which moves the card in the "In
  season now" filter. cvs merged, not replaced, so 'Sundance' and 'Aztec Pearl'
  survive alongside the synonym.
  KNOTWEED: the deck's **fourth compliance card and the first NEVER-STOCK one** —
  it is here to be recognised and reported, not sold. Compliance borrows the
  Gunnera fields again (v12.21). Deck records: growthSpeed 20 and careLevel 20 are
  both firsts — careLevel is the containment and legal burden, not difficulty
  keeping it alive — against pestRisk 2, genuinely pest-free. H7, hardiest card in
  the deck. plant-sense passes it clean, which is worth noting: a card whose prose
  says "rampant" and whose ratings say 20/20 is self-consistent.
  Photo is Oscar's AI composite (fire and lightning, deliberately) — recorded in
  CREDITS.json as his, `commercialUseCleared: false` because the generator's terms
  are unrecorded. VERIFY-QUEUE item 5 covers both that and the ID weakness: the
  red-flecked cane the card's own `visual` names is not visible in the shot.
  THE REAL FIND — **app-test was never flaky; the menu is broken on a phone.**
  It had been failing at a different line each run, which reads like timing, and
  the earlier session wrote it off as container slowness. It is not: the menu
  panel is `height:100%` with no overflow handling, and its filter chips are
  GENERATED FROM THE DECK, so the panel grows every time a plant is added. At 390
  × 844 the content is 1098px tall. **"Reset progress" sat 36px below the fold and
  could not be tapped at all** — Playwright's retry loop sometimes shifted enough
  to land the click and sometimes didn't, which is where the "flaky" impression
  came from. Japanese Knotweed's ⚠ NEVER STOCK chip pushed it to 68px. Fixed at
  the cheapest layer per CORRECTION-PROTOCOL §4.2 — `overflow-y:auto` +
  `overscroll-behavior:contain` on `.sheet .panel` (contained so the deck behind
  it can never pull-to-refresh, which perf/edge tests guard). Per §4.1 the defect
  is now something the suite can SEE: app-test asserts every menu row is reachable
  (95 checks, was 94), verified failing on an unfixed copy first. **This bug
  reached a real phone and grows with every plant added** — anything else keyed to
  deck size deserves the same look.
  PROVENANCE CORRECTED — **Oscar took every photo himself; the r18 record said
  otherwise.** CREDITS.json marked 146 of 152 photos "unrecorded / licence
  unknown", reasoning that plant-images-tool.js had fetched them from Wikimedia
  and written the paperwork into gitignored `plant-images/` where it was lost.
  Oscar says he shot them all, and the evidence backs him, not the inference:
  **the downloader has never been run** (the README says so in the same file that
  drew the conclusion, and it needs network the container lacked), `plant-images/`
  was never committed because nothing was ever downloaded, and the photo register
  describes ~100 images in detail without once naming an external source. The
  missing paperwork was read as lost; it never existed. All 150 photographs are now
  recorded as his own and cleared. EXIF can't corroborate either way — add-plant.js
  re-encodes through a canvas and strips metadata — so the record rests on the
  owner's account plus those three checks, which is the right basis. Only the two
  AI images stay uncleared: knotweed (**ChatGPT + Gemini**, per Oscar) and the
  Ajuga v12.5 remake. That closes the VERIFY-QUEUE photo section entirely and
  removes the "not fine for commercial use" warning the README carried.
  Worth noting as a pattern: this was a confident, well-written, thoroughly
  documented conclusion built on one unchecked assumption, and it had already been
  propagated into three files. Ask the owner before inferring provenance.
  ALSO: `photo-credits.js --init` re-derives every photo's origin commit from
  `git log --all`, so running it in a container with more remote branches fetched
  rewrote 56 unrelated provenance records. Backed out — the single new entry was
  added surgically instead. **The tool's output depends on which refs happen to be
  local**, which is worth a guard before anyone runs --init again.
  Build r19. Fast checks 5/5.
progress: 2026-08-09 (latest+) — **holo effects: panels, and a generic wisp layer.**
  Oscar asked to isolate the rainbow patterns and spiky shards from his frame and
  float them over the photo, to have a reusable animation he can hang any effect
  on, and to swap the plaque / soil / aspect boxes for the ones drawn in his art —
  keeping all of it generic for future special cards.
  Two new tools, both reading geometry from the app rather than duplicating it.
  `extract-frame-assets.js` cuts the three panels at the slot rectangles read from
  timber.html's own CSS; `extract-wisps.js` keys an effect onto transparency with
  rainbow / shards / bright modes and an optional region crop (the region matters —
  keying the whole frame drags the border thorns into a layer meant to drift
  across the middle).
  THE PANEL TRAP, found by building it wrong first: doing artwork-x-parchment as a
  CSS multiply makes the panel translucent, so the parchment's baked SAMPLE values
  (Jul-Oct, 1/5, 3/5, 2/5) stop being hidden by the .patch swatches and every row
  renders double. Flattened offline into an opaque PNG instead, the whole patch
  mechanism keeps working untouched — and flattening the swatch with the same
  artwork is what stops the patches sitting on a glowing panel as beige blocks.
  Lifting the ink off the parchment was tried before that and looked worse: the
  parchment's uneven vignette survives as a veil and the cleared value regions
  stand out flat against it.
  WISPS are the generic part: any transparent PNG, one of three animations (drift /
  sweep / shimmer), declared per card in its HOLO entry with no new CSS. Only
  transform and opacity animate so everything stays on the compositor; layers exist
  only on .hot cards so a 129-card deck never carries 3x129 animated elements;
  screen blending means an effect can only add light, never muddy the photo;
  reduced-motion holds one frame rather than hiding it. Verified moving (three
  distinct live transform matrices, frames differing over time).
  ALSO removed a latent flake: perf-test's pixel-parity assertion compares two
  screenshots a second apart, which any animation breaks regardless of what the
  assertion is about. It passed only because the one holo card is buried and its
  wisps are display:none. Animations are now paused for that check, verified to
  give zero drift even with the holo card forced hot. Build r21.
progress: 2026-08-09 (latest) — **the Eternal Flame holo card is real.** Oscar
  commissioned a frame from FRAME-BRIEF.md and it came back at aspect 0.6998
  against the specified 0.700 — effectively exact — with the plaque and soil boxes
  drawn within ~0.5% of their real overlay slots, so the parchment covers them
  cleanly. What it did NOT carry, despite the brief spelling both out with
  coordinates: the HEIGHT/SPREAD spine lettering and the DOUBLE TAP TO MASTER
  strip. It also drew panels the brief listed as do-not-draw. Recorded in the brief
  as the lesson: the model follows proportions and box positions reliably and
  ignores small baked text and negative instructions.
  Rather than re-commission, added a scoped `.holo` treatment: a HOLO map keyed by
  latin-slug swaps the frame and adds a class that supplies the spine lettering
  (from data-label), the master strip, and gold rail values with the parchment
  patches hidden — those patches are tinted for the green spine and read as dark
  blocks on a red one. Everything else is the standard overlay stack at the
  standard anchors, so the holo card goes through the same layout audit as any
  other and cannot drift on its own. Master strip sits at ~96% not the baked 98.2%
  because this frame's ornate border swallows text at that height. Build r20.
progress: 2026-08-09 (later) — **deck 129 + 1 held; the new photo-provenance check
  earned its keep on day one.** Two plants arrived with three photos. Reading the
  embedded C2PA manifests before building anything: the waterlily image is WHOLLY
  AI-GENERATED (OpenAI Media Service API, gpt-image v2.0, IPTC
  digitalSourceType=trainedAlgorithmicMedia), and its JSON had reasoned the cultivar
  ID *from* that invented picture — a circle. The Primula vialii shot is a real
  Galaxy S24 capture that has been AI-edited (Photo assist,
  compositeWithTrainedAlgorithmicMedia) with an "AI-generated content" watermark
  burned into the pixels. Oscar's calls: deal the waterlily on his own knowledge of
  his pond (his ID, his authority — recorded honestly in CREDITS.json as a synthetic
  image, not cleared for commercial use), and hold the primula for a clean re-shoot.
  A third photo matched neither plant (probably Phlox paniculata) — parked as a
  question, no card invented.
  The validator caught real data faults too: the waterlily's aspect was a light
  level not a facing (would have silently shown "Any aspect"), and both had soil /
  soilWarning 2-6x over the measured panel limits.
  TWO BUGS FOUND AND FIXED IN MY OWN WORK: (1) the pretty-printer from the integrity
  pass stopped emitting a trailing comma after the last card, so add-plant's
  append-style insert butted two object literals together and timber.html stopped
  parsing — the trailing comma is load-bearing and is now commented as such;
  (2) nothing ever wrote plants.csv back after an insert, so it drifted every time —
  both add tools now re-export it, which is only safe because export finally
  round-trips the hold block.
  NEW AUDIT RULE: the waterlily's height read "0.1–0.15m above water" — 133px of
  vertical ink in a 61px rail patch, a 72px overrun straight across the baked HEIGHT
  lettering. The layout audit passed it, because it had no rule for rail overflow
  and .v is absolutely positioned so its own rect never grows (the overflow is only
  visible by measuring the text with a Range). Added rule C2 rail-overflow, verified
  by negative test: it reports the 72.5px overrun and passes on the shortened value.
  Build r19. All 14 checks green.
progress: 2026-08-09 — **integrity pass: nothing was lost, and the paths that
  could lose things are closed.** Oscar asked for the five risks from the r17
  review fixed properly, worried progress had already gone missing.
  AUDIT FIRST: new `tools/data-audit.js --history` replays all 73 commits that
  touched timber.html. Verdict — **no card has ever been silently dropped.** All
  128 dealt cards have their photo. The single disappearance is Holly Osmanthus
  'Tricolor', deliberately renamed to Goshiki Holly Olive at 68d61a9 ('Goshiki'
  is the accepted name, 'Tricolor' the synonym, recorded in the card's cvs); the
  design line had separately ported a 'Goshiki' card so both names co-existed as
  duplicates at 2e91159 and the r17 merge correctly kept one. Recorded in
  data/renames.json so it never reads as a loss again.
  THE LIVE BOMB: `plants-tool.js import` rebuilt cards from its FIELDS list, and
  `sunMin` — on 132 cards — was not in it. One import would have wiped the sun-band
  floor deck-wide. Export also never saw PLANTS_ON_HOLD, so a round-trip deleted
  every held plant. Both fixed: csv carries a `held` column and round-trips both
  blocks, the tool REFUSES to write if it meets a card field with no column, an
  import that would remove a plant needs --allow-removals, backups are timestamped
  in .backups/ (the old single .bak was eaten by a second import), and the write is
  re-parsed and rolled back if it breaks. Round-trip verified lossless field-for-field
  across all 133 cards and idempotent (second pass = zero-byte diff). Cards are
  written back in the hand-authored style, not one-line JSON, so a two-field edit
  stays a two-line diff.
  SECOND VERIFICATION PASS: `tools/plant-sense.js` checks every card against
  ITSELF — prose vs ratings, margin arithmetic vs quoted prices, size vs "dwarf",
  peak vs claimed season. First run threw 35 "contradictions"; CARD-STATS.md showed
  my pest and care rules were inverted and three parsers were wrong, so the tool was
  fixed, not the data. Now 5 real findings, all written up in the new VERIFY-QUEUE.md
  rather than guessed at: five held climbers have no H × W split (rails blank),
  Meyer's Lemon and Kinme holly may be a size band too high, two margin bands sit
  below their own gross arithmetic, and Choisya's ratings are still open.
  ALSO: NPLANTS is now derived from timber.html in all four suites instead of
  hand-typed in four places (add-plant/add-plants-bulk patched to match — their
  regex had become a silent no-op); `tools/build-stamp.js` puts a content hash in
  the build number so a stale stamp fails the run instead of reaching a phone, and
  the Pages workflow now gates on it and verifies the SERVED BYTES after deploy;
  `tools/template-geometry.js` turns card-height changes into arithmetic — validated
  by reproducing the real v12 (543px) template from v14 to 4 decimal places, which
  also proved the rails are bottom-anchored, not top as the v14 comment says;
  `tools/deck-diff.js` compares plant data between branches semantically so the next
  two-line merge is not archaeology. One runner (`tests/run-all.js`) plus an optional
  pre-push hook.
  FOUND EN ROUTE: features-test's weakest-plant bias assertion was a coin flip. Its
  `bias >= 18` threshold was calibrated for a 57-plant deck; at 128 plants 18 IS the
  expected value, so it failed about half the time on chance alone and had been
  passing on luck. Threshold and sample size are now derived from the deck size with
  a 4-sigma margin — same disease as the hardcoded NPLANTS, same cure.
  PROVENANCE (the item Oscar asked to leave till last): `plant-images-tool.js` did
  record licence, author and source URL for every photo it fetched — into
  `plant-images/`, which is gitignored, so 146 records were written to scratch and
  lost with the container while the images stayed in git. New `photos/CREDITS.json`
  is a committed entry per photo; git history establishes 5 as Oscar's own, the rest
  are honestly marked unrecorded/unknown rather than given a guessed licence. `pick`
  now writes into the committed manifest. Fine for a learning tool; the unrecorded
  ones need re-establishing before any card is shown to a garden centre commercially.
  Build r18. All 14 checks green.
progress: 2026-08-08 (later still) — **v14 elongated template: the card is natively
  420×600.** Oscar wanted the card longer; a ChatGPT frame regeneration drifted
  (restyled gold, redrawn ornaments, dropped the baked DOUBLE TAP TO MASTER strip)
  and was rejected in favour of slicing the v12 art from its own pixels:
  art/frame-600.png = frame-full + 150px of plain spine mirror-tiled in at a
  measured plain row (row-continuous seams; interior seams invisible under the
  live photo). Top furniture keeps px-from-top, bottom furniture px-from-bottom,
  so overlays still land on their baked twins exactly. Extra height all goes to
  the photo; runtime stretch cap cut to 1.12. card-builder + manifest (v3) +
  protocol changelog updated in lockstep. Build r16. All nine suites + layout
  audit green, zero audit-rule changes. Parked from ChatGPT's spec, Oscar's
  call needed: folding SOIL into the aspect footer to widen the stats plaque.
progress: 2026-08-08 (later) — **deck fills the screen + two Euonymus: deck 88 -> 90.**
  Oscar flagged the dead space above/below the card and the grimy black fade over the
  action bar. Two causes, two fixes: (1) the 420x543 card is width-bound on phones and
  was centred with the spare height split into two gaps — the card now stretches
  vertically into that space (--csx/--csy split, capped at 1.25x; whole subtree scales
  as one raster so internal alignment is untouched, photos crop via the same transform);
  (2) the old always-on card shadow stacked ~57 deep into a near-solid ~60px halo — the
  drop shadow now sits on hot cards only (3 stacked, clean edge, perf pixel-parity test
  still green). Deck margins 12->8px. Added Emerald 'n' Gold + Emerald Gaiety Spindles
  (JSON + photos via add-plant.js). Tool/test debt paid down along the way: add-plant
  counted PLANTS_ON_HOLD rows into NPLANTS (set 96 with an 89 deck — suites imploded)
  and only bumped 2 of the 4 counting suites — both fixed; perf-test's no-layout-on-drag
  guard was timing-dependent on the photo trickle loader landing a load event inside
  the drag window (any deck-size change re-rolled that dice) — photos now settle before
  the measurement. plants.csv: note plants-tool.js export DROPS the 7 on-hold rows
  (they live outside the PLANTS markers), so the 2 new rows were appended by hand;
  export needs teaching about the hold block before it's safe to run again. Build r15.
  All nine suites green.
progress: 2026-08-08 — **plant-build line brought across: deck 65 -> 88 (95 known).**
  Oscar: "bring across all plant 80 something" — the claude/plant-build-timber-6ta360
  branch (another chat, forked at the 66-deck r8 shell) had built to 89, of which 23
  cards + 1200px photos were new to this line: Goshiki Osmanthus, Camellia 'Doctor
  King', Worcester Gold Caryopteris, two Achilleas, Leucothoe WHITEWATER, Hydrangea
  DAREDEVIL, Rhaphiolepis ENCHANTRESS, Philadelphus PETITE PERFUME PINK, Phlomis
  italica, Scabiosa FLUTTER, Cotoneaster 'Variegatus', Crinodendron, Prunus
  'Kojo-no-mai', Escallonia PINK ELLE, Euonymus 'Harlequin', Miscanthus 'Morning
  Light', Festuca INTENSE BLUE, Berberis 'Orange Ice', Pennisetum TINY TAILS, Katsura,
  Lobelia STARSHIP, Lomandra WHITE SANDS (Loquat already here). Cards + photos ported
  onto the current shell; that branch never synced plants.csv, so the 23 CSV rows were
  generated from the card objects (deck and csv both 95, no dupes). NPLANTS 88 in all
  four suites. Build r14. All nine suites green. Old Plantatron backup's ~105-name
  catalogue list is stock data, not cards — NOT ported.
progress: 2026-08-08 — **r13 LIVE on Pages.** Oscar: the artifact preview isn't his
  link — deployed for real. Feature branch fast-forwarded onto the pwa branch
  (289fc40 -> 6848ee9), Pages run #13 green. [Unverified] served bytes — github.io
  is egress-blocked from the container; verified via the successful deploy run on
  the exact commit. Phone note: the SW serves r12 once more, then r13 on next open.
progress: 2026-08-07 (later still) — **7 photo-less cards parked out of the deck.**
  Oscar's call: no photo = on hold. Choisya, Weigela and the five climbers moved to
  PLANTS_ON_HOLD (outside the plants-tool markers; data kept in-file + plants.csv —
  move an entry back into PLANTS to re-deal). Deck 65, NPLANTS 65 in all four suites;
  test refs to held plants repointed; features-test chip pick now needs n>=2 (the old
  type:Impulse n=2 chip was exactly Choisya+Weigela). All nine green. Preview artifact
  republished. Sourcing the climber photos (the standing brick) now also un-parks them.
progress: 2026-08-07 (later) — **action circles squished into slim card-styled bars;
  cards bigger.** Oscar's call: the three big round fabs were obnoxious. Now three
  38px space-bar panels (58px total vs ~110px) in the card's own language — Georgia
  small-caps, deep-green panel, thin gold trim, gold LEARNED primary, red-tinted
  SKIP, compact undo square. Deck margins 16→12px; card scale 0.852→0.871 at 390px
  wide, more on height-bound screens. IDs/aria/shortcuts untouched; all nine suites
  green. On claude/card-redesign-compact-buttons-ikf8ki pending Oscar's verdict on
  the preview artifact (photos + art inlined, build script in session scratchpad).
progress: 2026-08-07 (later) — **duplicate holdout retired.** Both chats were asked to
  park the photo-less cards and built it in parallel: this line's PHOTO_HOLDOUT filter
  (kept the 7 searchable/quizzable) lost the race to the deployed PLANTS_ON_HOLD move
  (7 gone from search/dictionary/quiz too until re-added). Deployed version adopted;
  lines converged on the blocker branch. One live-app change per chat at a time.
progress: 2026-08-07 — **parallel lines combined; nothing left stranded.** Oscar ran two
  sessions at once and their work forked at r10: voice change (blocker branch) vs edging
  assets + v13 mocks + monetisation brief (edging branch). Merged, then a branch sweep
  found four finished fixes never combined into ANY line: Winter Beauty Honeysuckle
  photo (deck-audit gap closed), gold-SVG chrome icon retheme, tradeBlocks() — trade
  sheet/search detail stop printing empty captions + customer PRICE box only when
  priced, and the soil-panel 3-line collision fix (8.5px). The 07-30 era commits
  (shuffled deals/photo quiz, drop-unfilled-facts) predate two shell rewrites — parked,
  likely superseded; Oscar to say if the quiz is missing anything he remembers. Build
  r12. Whole gate green.
progress: 2026-08-06 (later) — **v13 card redesign mock, three rounds.** Oscar supplied
  an AI reference (ornate scallop-corner parchment boxes, merged aspect/soil footer,
  no action buttons). Round 1: inset card mock. Round 2 (full-screen) rejected — his
  detailed critique: geometry wrong, chrome belongs outside the card, PPP must stay
  floating gold over the photo, rail max ~12%. Round 3 reproduces his locked second
  reference exactly: design/card-v13-mock.html + V13-REDESIGN-NOTES.md. Scallop
  cartouche borders are runtime SVG (scallopPath); icons unchanged per Oscar. Awaiting
  his verdict before any template work.
progress: 2026-08-06 — **v12.5 matching wooden edging shipped + monetisation research.**
  Oscar flagged the plaque and SOIL box missing the band's thin wooden rim; band's rim
  profile pixel-measured and baked onto both assets by design/bake-rim.py (idempotent,
  guard against double-bake). All nine suites + layout audit green. NOT yet live: sits
  on claude/timber-plant-card-edging-c661sc pending landing on the pwa branch. Also:
  MONETISATION-BRIEF.md written (app packaging, user acquisition, charging, card count,
  revenue — sourced, speculation labelled). Route decision pending: consumer app vs
  B2B staff-training; brief recommends validating B2B at Oscar's own centre first.
progress: 2026-08-05 (night) — **say-button voice anglicised.** Was it-IT (full Italian
  phonology — authentic but hard to parse); now prefers en-GB (falls back to any en),
  the RHS-style trade pronunciation. Spoken text only: "var." said as "variety", hybrid
  sign x silent; display text untouched. Rate .85 -> .9. app-test's utterance check
  updated to the spoken form. Build r11. All nine suites green. [Unverified] how it
  sounds on Oscar's phone — depends on the device's en-GB voice; needs his ear.
progress: 2026-08-05 (evening) — **climber sun values researched and corrected** (was
  the brick; Oscar said "just research and find out"). Sources: RHS plant pages +
  Gardeners' World shade guides via search (direct RHS fetch blocked from container).
  Nelly Moser 55/35 -> 45/25 (performs BETTER in part shade, sun bleaches the bars,
  classic north-wall pick); montana rubens sunMin 40 -> 30 (Group 1, among the most
  shade-tolerant, north walls fine); armandii sunMin 55 -> 45 (most shade-tolerant
  evergreen clematis, manages dappled shade, flowers less); Russian Vine sunMin
  20 -> 35 (semi-shade tolerant, but 20 = deep shade overstated it); PPE 65/40
  confirmed unchanged (viticellas want sun, tolerate some shade). CSV synced (Nelly
  only — CSV carries no sunMin). Build r10. All nine suites green. NOT yet live:
  sits on claude/timber-blocker-h7f5oo pending fast-forward of the pwa branch.
progress: 2026-08-05 (later) — **72-plant deck LIVE.** claude/timber-plant-pwa-j69h5e
  fast-forwarded c210f80 -> 8710df2 with Oscar's permission; Pages deploy run #10 green
  (deploy-pages step succeeded). Ajuga photo brick closed by decision: Oscar keeps the
  current photo — no longer a defect, it's the chosen art.
progress: 2026-08-05 — **deck 66 → 72: the last six stranded plants are in.** The five
  climbers (Clematis 'Nelly Moser', 'Purpurea Plena Elegans', montana var. rubens,
  armandii, Russian Vine) came in from their preserved plants.csv rows, and Japanese
  Loquat (card + 1200px photo) from the japanese-loquat-card branch — the deck and
  plants.csv are back in sync at 72. The climbers' deck-audit blocker (aspect light-info
  lost) is cleared by moving light into the rubric fields: aspect set to a facing
  ("Any aspect" / "Sheltered S / W" for armandii), sunNeed+sunMin set per CARD-STATS
  anchors (Nelly Moser 55/35, PPE 65/40, montana 65/40, armandii 75/55, Russian Vine
  70/20; "roots in shade" kept in the soil line). [Unverified] those five sunNeed/sunMin
  values are editorial calls from the rubric, not Oscar's portfolio — review and adjust.
  Climbers still carry no buyer-trade layer, other ratings, or photos (honest blanks —
  15 audit warnings, 0 errors). NPLANTS 72 in all four suites; whole gate green (app 94,
  edge 9, features 47, srs 24, perf 10, sw-update, deck-audit PASS). Build r9.
progress: 2026-08-04 (later) — **deck 57 → 66: nine displaced plants restored.** Full
  branch+artifact audit found 14 plants stranded on four unmerged branches. Restored the
  9 that pass the gates with full data AND photos (recovered from donor branches, all
  1200px): Pink Annabelle Hydrangea, Pittosporum 'Elizabeth', Holly Osmanthus 'Tricolor',
  Cercis 'Eternal Flame', Agastache 'Summerlong Coral', Yucca 'Variegata', Alstroemeria
  INDIAN SUMMER, Cornus kousa FLOWER TOWER, Uncinia 'Everflame'. One layout defect found
  and fixed (Osmanthus bloom text trimmed to fit its zone). NOT restored: the 5 climbers
  (4 Clematis + Russian Vine) — deck-audit errors them (aspect info lost: light data but
  no sunNeed value), they lack the whole buyer-trade layer, ratings, and photos. They need
  a proper data pass with Oscar's sign-off; rows preserved on plant-card-addition-sbil3n.
  NPLANTS 66 in all four suites; whole gate green. Build r8.
progress: 2026-08-04 — **the real compositing monster found: 3D flip machinery.** Oscar's
  glitch screenshots (white screens, a slab of the previous card stuck over the new one)
  are GPU tile eviction. CDP LayerTree measurement showed the truth the will-change
  proxy never could: 228 REAL composited layers. Three per-card triggers, each removed
  for non-hot cards only (top card is the only tappable/flippable one): perspective +
  preserve-3d contexts, the back face's rotateY(180deg) — a 3D transform is a layer
  trigger even when backface-invisible, so 54 unseen trade sheets were rasterised —
  and backface-visibility:hidden itself, which layerised every front face and dragged
  buried cards along via overlap. 228 → 16 layers (3 hot cards × flip machinery + doc).
  Verified pixel-safe (max delta 1/255 AA jitter). perf-test now measures REAL layer
  count via CDP (≤24) instead of trusting will-change; 10 checks. All nine suites green.
  Phone re-test needed as ever — but this is the first fix aimed at the measured cause.
progress: 2026-08-03 (evening) — **phone tearing diagnosed from screen recording.** Frame
  extraction of Oscar's Pages recording showed the real failure the 07-03 compositing fix
  predicted it couldn't verify headless: the moving card tears into strips (its rail
  renders detached and rotated over the next card) and the revealed card flashes a black
  unpainted photo panel. Cause: markHot() promoted (will-change) and first-painted cards
  in the same frame the fling starts — layer + raster churn on visible content. Fix:
  buffer one card deeper than anything a swipe can reveal (hot = top 3, PAINT_DEPTH = 4)
  so churn only ever touches fully occluded cards, decode upcoming photos while still
  buried (img.decode()), and move per-swipe SRS bookkeeping to a 360ms timer so the
  animation frame carries zero extra work. perf-test budgets raised 3→4 to match (still
  O(1) vs 57). All nine suites green. Real-phone confirmation still needed — headless
  cannot reproduce GPU raster scheduling.
progress: 2026-08-03 (later) — **learning layer merged onto deck 57; site live.** The
  feature line built earlier today against the stale 8-plant branch (spaced repetition +
  review-due deck, quiz v2 with reverse/trade rounds + weakest-first picking + session
  summary, data-discovered deck filters, typo-tolerant ranked search, My-progress stats,
  photos on search/customer sheets, focus traps) is re-based onto this branch and adapted
  to its conventions: deck rebuilds go through releaseCard()/markHot() so the compositing
  budget holds (perf suite green), review/filter are ephemeral views that never persist
  over saved progress, statsEl joins overlayOpen(). Two new suites (srs-test 24,
  features-test 38) recalibrated for 57 plants; all NINE suites green. GitHub Pages
  enabled (self-deploying workflow; Oscar flipped the one admin toggle) — the app is
  live at https://oscarhurman39-sys.github.io/Timber/ and redeploys on every push to the
  default branch.
progress: 2026-08-03 — **swipe glitch root-caused; two new suites.** The tearing on the
  phone was compositing pressure, not gesture logic: `will-change` sat on all 57 cards
  (57 GPU layers, ~200MB, which also defeats occlusion culling) and every buried card
  stayed painted though the stack is fully occluded. markHot() now promotes only the card
  mid-fling plus the top two, and paints only the top three. Buried cards keep their BOX
  painted — ~30 stacked box-shadows build the deck's halo, so hiding whole cards lightens
  it; hiding only their contents is pixel-identical (0/1,316,640 px differ). Measured: 57
  layers -> 2, 54 painted photos -> 3, no layout during a drag. NOT verifiable here —
  headless has no GPU memory pressure, so the smoothness gain needs confirming on a real
  phone. New: tests/perf-test.js (8 checks, locks the compositing budget + pixel parity)
  and tests/deck-audit.js (whole-deck audit; judges rendered output, not raw fields —
  auditing the stored format directly gave ~120 false alarms). Seven suites now, all
  green. Deck audit found 2 genuinely broken cards (Choisya, Weigela: no photo, all
  ratings blank, aspect "Full sun / pt shade" silently rendered as "Any aspect" with no
  light bar) — recorded in KNOWN_GAPS. Also confirmed NOT problems: soil-length warnings
  (the card splits the joined field), rating scales (genuinely 0-20), H5 (evenly spread,
  not the mock-up pattern), quiz (no empty questions, no crash path).
progress: 2026-07-30 — **artifact re-synced, deck 57.** The published artifact had forked
  again: artifact-side sessions had added 10 cards (Ligularia 'Treasure Island', Dream Dazzler
  Stonecrop, Hydrangea aspera 'Rosemary Foster', Ginkgo, Cordyline Charlie Boy, Gaura 'Gaudi
  Rose', Hydrangea 'Wim's Red', Rhododendron 'Gartendirektor Glocker', Acer shirasawanum
  Moonrise, Callistemon 'Splendens') that never landed in the repo, while main sat at 47 and
  the artifact showed only 18. All 10 rows + their photos are merged into main's newer app
  shell (deck 57), NPLANTS bumped, all five suites green, standalone rebuilt (4.6MB, 54/57
  photos) and republished to BOTH artifact URLs so either link now shows the full deck.
  Photo caveat: the 10 photos came back through one webp→jpeg re-encode of the artifact's
  inlined copies (still ~1200px). Photo-less (never had one anywhere): Choisya ternata,
  Weigela 'Nana Variegata', Winter Beauty Honeysuckle. Improvements-branch note: 6 plants
  (Pink Annabelle, Pittosporum 'Elizabeth', Osmanthus 'Tricolor', Cercis 'Eternal Flame',
  Agastache 'Summerlong Coral', Yucca 'Variegata') exist only on the old timber-improvements
  branch — left out, as the 07-28 consolidation excluded them; their photos are already in
  photos/. Say the word if they should be resurrected.
progress: 2026-07-28 — **repository separated.** The Command Centre dashboard moved
  out to its own repo (Plantatron); Timber is now only the customer-facing swipe-card
  app. **Deck consolidated**: the flower-tower branch merged in, resolving the split
  between the two lines. No plant data was recovered because none was missing — main
  already held all 46 of flower-tower's cards plus Winged Spindle. What came back were
  the 1200px photo originals that the published-artifact round-trip had downgraded to
  800px re-encodes, plus 16 -cutout.png source assets, CORRECTION-PROTOCOL.md and
  design/audit-layout.js. Deck 47, photos all at 1200px except the Ajuga. All five
  suites green; standalone build verified at 3.7MB, opening offline from file:// with
  zero external requests. Fixed two test defects found on the way: a duplicate NPLANTS
  declaration the merge introduced silently, and a hardcoded absolute path in
  sw-update-test.js that made it fail from any checkout other than /home/user/Timber.
progress: 2026-07-25 — deck now 17: Cornus, Ajuga, Spiraea, Potentilla, Cercis, Prunus, Salvia, Mahonia (photo staged), Leycesteria, Buddleja Pugster Orchid, Flamingo Willow, Cape Leadwort, Golden Japanese Spindle (cutouts composited), Bubblegum Blast Bee Balm, Common Hornbeam, Ebbinge's Silverberry, Gunnera, October Glory Red Maple, Spider's Web Fatsia, Griselinia, Himalayan Indigo 'Silk Road', Cascading Moth Orchid, Laurustinus 'Eve Price', Orange Victory Itoh Peony, French Lavender 'Anouk', Meyer's Lemon, Green Spire Spindle, Jenny Japanese Holly, Gold Rider Leyland Cypress, Horizon Monarch Rhododendron, Ōsakazuki Japanese Maple, Musa basjoo, Wedding Cake Tree, Common Olive, Bloodgood Japanese Maple, Hot Lips Sage, Honey Tulip Magnolia, Big Blue Sea Holly, Winter Beauty Honeysuckle (real photos + cutouts). Deck 46. Lonicera on gradient fallback — both supplied photos unusable (water lily + cat-blocked); needs a winter flower shot. First populated toxicity field (Lonicera fruit). Eryngium is the FIRST populated compliance field (PBR) — surfaced on the back; three compliance cards now (Gunnera ban, Olive Xylella, Eryngium PBR). Tiered compliance display is the clear next brick. Hot Lips JSON is first with the new toxicity+compliance fields (empty, captured but not yet rendered — the hook for the compliance ribbon). Firsts: houseplant/H1b, edible/citrus, cultivar pair, conifer/nothogenus, macron-name slug fold, single-facing aspect. TWO biosecurity/compliance cards now (Gunnera legal ban + Olive Xylella) — parked compliance-ribbon decision increasingly worth doing. NEW: Gunnera carried a compliance/legal block (UK-restricted) — surfaced on the trade back; OPEN DECISION on a front compliance banner (see protocol v12.21). New audit rule (focus-photo) catches id-vs-latin-slug drift after the Euonymus shipped blank. Recurring: JSON soil warnings keep carrying pruning/toxicity — worth a source-prompt fix. 2026-07-24 — portfolio batch DONE: Cornus, Ajuga, Spiraea, Potentilla added + Nandina photo & ratings (deck 11, all with photos). Layout correction pass done: audit gate live (CORRECTION-PROTOCOL.md), 31+4 violations fixed incl. blurred-labels + photo pointer-events bug. Pending: sync card-builder.html to fixed band/plaque; Nandina data conflicts need Oscar's call (aspect E/W vs S/W, bloom Jun-Jul vs Sep-Feb, soil warning).

## garden-centre-bot  [parked]
brick: (not set — pick up from skill notes when resumed)
since: 2026-07-20  sessions-unchanged: 0
