# Timber — supercharge brief

Written 2026-08-10 at Oscar's request: a long plan for a large Claude budget
expiring 2026-08-11 01:00. Every number below was computed from the repo, not
recalled. Judgement calls are labelled `[Inference]` / `[Speculation]` /
`[Unverified]`.

---

## 0. The one thing to read before anything else

**The code is far ahead of the content, and both are far ahead of validation.**

| | State | Source |
|---|---|---|
| Cards | 239 — **134 dealt, 105 held with no photo** | `data-audit.js` |
| Photos on disk | 141 | `photos/*.jpg` |
| Card data provenance | 105 cards carry ratings, prices and prune advice **I wrote**, not Oscar's and not RHS's | VERIFY-QUEUE 15, 18 |
| Last time Oscar checked my data | **26 of 50 amended**, two legal facts backwards | LEDGER 2026-08-10 |
| Users other than Oscar | 0 | — |
| Revenue mechanism | none | MONETISATION-BRIEF |
| Engineering | 14 suites, self-publishing CI, data tools that refuse to lose data | `tests/run-all.js` |

The engineering is genuinely strong. The gaps are content and trust. **A big
credit spend on more features widens the widest gap**, which is the one risk
worth naming — and it is named once, here, and not repeated.

That is not an argument for spending nothing. It is an argument for spending on
the gaps. Everything below is sorted by three questions:

1. **Does it take Oscar off the critical path?**
2. **Does it make Oscar's scarce time go further?**
3. **Does it make the app safe to put in front of a stranger?**

Anything that is only "more feature" is in Track 5, last, on purpose.

---

## 1. The finding that reshapes the brick

The ledger's brick is *"photograph the first tranche of the 99 held cards"*
(105 now). Treated as one errand it is demoralising, and it has a hidden
property nobody has checked: **most of those plants do not look like anything
worth photographing today.**

Computed from each held card's own `peak` field against August:

```
HELD                                    105
  peak includes August — shoot now       57
  peak excludes August — return trip     48
```

The 48 are not evenly spread. Greedy cover over their peak months:

```
trip 1   May   23 cards
trip 2   March 15 cards
trip 3   Nov    8 cards
trip 4   June   2 cards
                --
                48   uncovered: 0
```

**So the brick is not 105. It is 57, plus a diary with four dates in it.**
Daphne 'Jacqueline Postill' (Jan–Mar), Christmas Box (Dec–Mar), Forsythia,
Kerria, Chaenomeles, Magnolia stellata, flowering currant — photographing those
in August produces a green blob that sells nothing, and a card with a bad photo
is worse than a held card, because a held card is honest.

`[Inference]` this is also why the brick has felt heavy: it was sized at 105
when the real August job is a bit over half that.

**Everything in Track 1 exists to make those 57 cost one lap of the centre.**

---

## Track 1 — Kill the photo bottleneck

This is the only track that moves the actual brick, so it goes first.

### 1.1 `tools/photo-run.js` — the run sheet

Generates a phone-readable shot list from the held block.

- Splits **shoot now** (57) from **return trip**, with the four-date diary.
- Groups the now-list by where the plant physically stands — derived from
  `type` (tree / shrub / climber / herbaceous / hedging / rose / conifer) so
  one lap of the centre covers a whole group instead of criss-crossing.
- Per card prints: common name, latin, **what feature to shoot** (pulled from
  `visual` — "berries", "bark", "flower"), size band so it is findable, and
  whether the card wants a **pair** (leaf ↔ flower) for `PHOTO_SWAP`.
- Emits both a terminal table and a static HTML page that works offline on a
  phone, with a tick per card.

**Done test:** running it produces a sheet Oscar can work from with no laptop,
and the counts reconcile with `data-audit.js`.
**Needs Oscar:** no. **Size:** one sitting.

### 1.2 `tools/photo-intake.js` — dump-and-assign

Today a photo has to arrive already named `<latin-slug>.jpg` or be passed
per-plant on a command line. For 57 phone photos that naming chore *is* the
friction, and it is the step most likely to put a photo on the wrong card.

- Drop everything into `intake/`; the tool opens a browser gallery: photos down
  one side, unassigned held cards down the other.
- Pre-sorts by EXIF timestamp against run-sheet order, so if he shot in sheet
  order most assignments are one click of "yes, next".
- On confirm: processes to 1200px, stages to `photos/`, moves the card from
  `PLANTS_ON_HOLD` into `PLANTS`, writes the `CREDITS.json` entry, runs the
  data gate. One pass for the whole batch, same validators as
  `add-plants-bulk.js`.
- Nothing is written unless the whole batch validates — the existing house rule.

**Done test:** 10 arbitrarily-named phone photos land as 10 correctly-slugged
dealt cards with credits, in one command plus clicks.
**Needs Oscar:** no to build, yes to run. **Size:** the biggest item in Track 1.

### 1.3 Photo sanity gate

Cheap checks that catch the shot of the floor before it reaches a card:
dimensions and aspect, Laplacian-variance blur score, dominant-hue check against
the card's own `hue`, and a duplicate-image hash against everything in
`photos/`. Warn, never block — `[Inference]` a false reject on a good photo is
more expensive than a warning he overrides.

**Needs Oscar:** no. **Size:** half a sitting.

### 1.4 The seven orphan photos

`data-audit.js` reports 7 photo files no card claims — Agastache, Cercis
'Eternal Flame', Cercis 'Avondale' stem, Spiraea 'Double Play Doozie'. Some are
`PHOTO_SWAP` spares; at least one may be a card renamed away from its photo.
Resolve each to *used*, *spare*, or *delete*, and record which.

**Needs Oscar:** one question at most. **Size:** small.

---

## Track 2 — Trust: make the app say what it knows and what it is guessing

This is the track I would argue hardest for, and it is not a feature.

### 2.1 Per-card provenance — the liability item

**A card Oscar verified and a card I invented are visually identical.** 105
cards carry my estimates for `retail`, `margin`, `trade`, `hardiness` and
`prune`. When Oscar checked 50 of them he changed 26.

A staff member reads a price off a card with a customer standing there. If that
price is one I made up, that is a real-world error in a shop, not a data-quality
metric.

- Add a card field recording origin: `oscar-verified` / `source-supplied` /
  `claude-estimated`, per field-group (identity, ratings, trade, care).
- Surface it: quiet on the card front, **explicit on the trade sheet** — the
  trade sheet is where prices live and where the claim gets quoted.
- Held cards inherit `claude-estimated` until checked.

The migration path already exists: `FIELDS` in `tools/plant-data.js` is the
locked column list, `data-audit.js` fails the build on any unlisted field, and
the CSV round-trips both blocks. This is exactly the mechanism that stopped
`sunMin` being wiped deck-wide. Adding a column is a solved problem here.

**Done test:** every one of the 239 cards carries a provenance value, no card
defaults silently to "verified", and the trade sheet shows it.
**Needs Oscar:** no to build. **Size:** one sitting plus a data pass.

### 2.2 The verification loop, systematised

The one time Oscar checked a batch, it worked — a published worksheet went out,
corrections came back the same evening, a patch tool applied 26 of them and
reported 6 no-ops as confirmations rather than fixes.

Make that repeatable at 25 cards a time: worksheet generator → his corrections
in any rough format → patch tool → provenance flips to `oscar-verified` →
VERIFY-QUEUE entry closes itself.

**Why 25:** `[Inference]` 50 was enough work that it took an evening. 25 is a
bus ride, and four bus rides clears the batch.
**Needs Oscar:** yes, that is the point. **Size:** small to build.

### 2.3 Extend `plant-sense.js` — the highest-ROI tool in the repo

It already caught two of my self-contradicting cards on the last batch,
including one where the prose said the *opposite* of what a regex pattern-matched
it to. Every check added here is an error Oscar never has to find by reading.

New checks worth building, most valuable first:

- **Prune timing vs flowering wood.** A card telling staff to prune Forsythia,
  Kerria, Chaenomeles, Philadelphus, Weigela or Deutzia in early spring is
  telling them to cut off this year's flowers. Cross-check `prune` prose
  against `peak` for spring-flowering shrubs. **I wrote the prune line on 105
  cards and none of it has been checked.**
- **Toxicity silence on known-toxic genera.** Laburnum 'Vossii' and Taxus are in
  the held batch. A card that says nothing about Laburnum seed toxicity is a
  customer-safety gap, not a data gap. Flag any card in a known-toxic genus
  whose `resilience` never mentions it.
- **Hardiness vs borderline genera.** Trachycarpus, Dicksonia, Melianthus,
  Astelia — the ledger already records my hardiness bands running optimistic
  (five downward corrections against two up, on one batch of 50).
- **Aspect vs sunNeed.** The 50-card batch derived `aspect` from `sunNeed` by a
  stated rule (VERIFY-QUEUE 15). A checker that re-applies that rule catches
  drift and shows which cards were deliberate overrides.
- **Deck-wide margin arithmetic**, extended from the existing single-card check.
- **Evergreen prose vs a two-month peak** — under-selling a plant that has
  twelve months of interest.

**Done test:** each new check fires on a deliberately broken fixture card and
stays silent across the current deck (or names real cards, which is a finding).
**Needs Oscar:** no to build, yes to adjudicate what it finds. **Size:** the
biggest item in Track 2, and worth it.

### 2.4 Close the VERIFY-QUEUE

20 items, several settled but still open in the file, several genuinely waiting
on a horticultural call (Dicksonia/CITES, the duplicate 'Flower Tower' Cornus,
Hydrangea serrata's blue card against a white photo). Sort into *settled — write
it up and close*, *needs Oscar — one line each*, *needs a source I cannot reach*.

**Needs Oscar:** for a subset. **Size:** one sitting.

---

## Track 3 — Give someone a reason to open it tomorrow

The SRS engine is real: Leitner boxes, 1/3/7/16/35-day intervals, review-due
deck, weakest-first quiz weighting. **Almost none of it is visible until you
open the menu.**

- **Due count on the app surface**, not buried in the menu. "12 due today" is
  the entire retention mechanic and it is currently two taps deep.
- **Streak** — days with at least one review. The quiz has a best-streak; the
  app itself has no notion of consecutive days.
- **Daily goal**, small and settable (10 cards). The deck is 134 dealt; "finish
  the deck" is not a daily unit, "10 cards" is.
- **Session-end summary** — the quiz has one, the deck does not.
- `[Unverified]` **notifications**: iOS PWA push requires an installed
  home-screen app and has been restricted historically; I cannot test iOS from
  this container. Treat as research, not a deliverable, and do the badge/due-count
  work first since it needs no permission at all.

**Needs Oscar:** no. **Size:** one to two sittings for the first four.

---

## Track 4 — Offline, honestly

`sw.js` is 60 lines and better than it looks: it caches **every** same-origin GET
it serves, not just the app shell, so photos do get cached — **but only ones
already seen.**

The failure case is specific: a staff member installs it in the staff room,
walks into a polytunnel with no signal, searches a plant they have never swiped,
and gets a card with no photo. That is the exact moment the app is meant to earn
its keep.

- **Warm the cache deliberately** — a "make available offline" action that
  fetches the dealt deck's photos in the background, with progress and a size
  figure. `photos/` is 74 MB total; the dealt subset is smaller and can be
  ordered by review-due so the useful ones land first.
- `[Unverified]` **iOS eviction**: Safari evicts aggressively and I cannot test
  it here. Measure on Oscar's phone before promising offline to anyone.
- **Cache versioning/cap** — `timber-v1` never evicts by size today.

**Needs Oscar:** a phone, for the measurement. **Size:** one sitting.

---

## Track 5 — Features, last and least

Real, but they widen the gap rather than closing it. In rough value order:
accessibility pass beyond the current keyboard support; performance at 239+
cards (`app-test` and `edge-test` are now ~135 s and ~170 s each because both
walk the whole deck — that is a test-harness cost that will keep growing);
richer filters; deck sharing.

---

## What I would deliberately not do

Named because with a big budget the instinct runs the other way.

- **Do not generate more cards.** 239 already exceeds the 200–400 the
  monetisation brief estimates covers a shop floor, and **105 have no photo and
  no verified data**. More cards makes both problems worse and the app look
  bigger than it is.
- **Do not split `timber.html` into modules.** 368 KB and ~6,500 lines is large
  for one file and small for an app. The single-file constraint is *why* the
  standalone build, the PWA and the offline story are all simple. A build step
  buys tidiness and costs the thing that makes this shippable.
- **Do not chase the App Store.** The monetisation brief already settled this:
  B2B distribution is a link and "Add to Home Screen". Apple is $99/yr and
  rejection roulette for a product with no users yet.
- **Do not build the manager dashboard.** It is the right B2B artifact and it is
  worthless before a pilot exists. The pilot is Oscar asking one manager at
  Knights — no credit buys that, and building the dashboard first is the
  expensive way to avoid asking.

---

## The order

**Tonight, no Oscar needed** — 1.1 run sheet → 1.2 intake → 2.3 plant-sense
checks → 2.1 provenance → 3 due-count and streak.

That order is deliberate: 1.1 and 1.2 mean the moment Oscar has 57 photos they
become 57 dealt cards with no chore; 2.3 finds my errors before he has to read
for them; 2.1 makes the deck honest about which half is guesswork.

**Needs Oscar, whenever he has it** — the 57-photo lap; four batches of 25
verification; the VERIFY-QUEUE calls; one phone for the offline measurement;
one conversation with a manager at Knights.

**Nothing here deploys itself.** The live branch is
`claude/timber-plant-pwa-j69h5e` and publishing is a fast-forward push to it.
Work lands on a feature branch and goes live only when Oscar says so.
