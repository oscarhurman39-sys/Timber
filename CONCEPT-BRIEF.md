# Timber — two concepts

**Written 2026-08-17.** Two descriptions of the same product: the app as it
actually exists today, and the collection-game version where you scan a real
plant to unlock its card. Then an honest assessment of both.

Every figure here was measured against this repository on the date above.
Anything not measured is tagged `[Unverified]`, `[Inference]` or
`[Speculation]`, per the house rule. The parked idea itself lives in
`IDEAS.md` #1; this document is the long form.

---
---

# PART ONE — Timber as it is

## The one-line version

**Tinder for plants.** A swipe-card deck that teaches garden-centre staff their
plants, and gets them an accurate answer while a customer is standing in front
of them.

## The concept

One card, two depths, two audiences.

The **front** is the learn layer: the photograph, what the plant looks like,
water, aspect, soil, pruning, peak months, hardiness, and a set of 0–20 ratings
(sun need, thirst, care level, growth speed, pest risk, seasonal impact,
resilience).

Double-tap and the card flips to the **Buyer Trade Sheet**: trade price, retail
price, margin, order week, bench life, shrink, return risk, pot sizes, source.

That is the whole idea. The same object serves the eighteen-year-old on their
first Saturday shift and the buyer deciding what to put on order — and the
person learning the front is, without being told, being introduced to the
commercial reality on the back. A flashcard app would only have the front. A
stock system would only have the back.

The third audience is the customer. From a search result, **Show customer**
opens a large plain-language view with the retail price only — nothing about
margin or shrink — so the phone can be handed across the bench without exposing
the trade layer. That detail is a small thing that says the product was designed
by someone who has stood behind that bench.

## The goal

**Staff training, sold to garden centres.** `MONETISATION-BRIEF.md` reasons it
out and lands there: B2B is the route where every hard question gets easier —
distribution is a trade channel and a link rather than an app store, charging is
an invoice rather than in-app purchase, the card count is bounded by one shop's
range rather than by all of horticulture, and the revenue model needs tens of
customers rather than tens of thousands.

The stated validating step is one pilot: the centre Oscar already stands in
(Knights). That has not happened yet, and nothing else in this document matters
as much as it does.

## What is actually built — measured, not claimed

**The deck**

| | |
|---|---|
| Dealt cards (in the app, with photographs) | **188** |
| Held cards (researched and written, waiting on a photograph) | **84** |
| Total written | **272** |
| Fields per plant | **34** |
| Card photographs on disk | 205 |
| Photo masters / card artwork | 115 MB / 38 MB |

**The core loop**

| Action | Result |
|---|---|
| Swipe right / ★ | Marked **LEARNED** — gold stamp, starred count +1 |
| Swipe left / ✕ | **Skipped** — red stamp, not counted |
| ↺ | Undo the last swipe; press and hold to rewind the deck |
| Double-tap | Flip to the Buyer Trade Sheet (swiping locks while flipped) |

**Spaced repetition — a real engine, not a veneer.** Every swipe schedules the
plant in a Leitner box, keyed by *latin name* so the schedule survives the deck
changing underneath it. Learn moves the plant up a box with the next review
**1 / 3 / 7 / 16 / 35 days** out; a skip or a wrong quiz answer drops it back to
box 1, due tomorrow. **Review due (N)** opens a due-only deck whose swipes
update the schedule but never touch saved full-deck progress, and which drops
back to the full deck when the last due card is swiped. Resetting the deck keeps
review history.

**Quiz v2.** Rounds mix three types — classic clue→name, reverse common→latin,
and trade unique-retail-price→plant, roughly 50/30/20. The answer plant is drawn
weighted `1/(box+1)`, so unseen plants come up heaviest and mastered ones
lightest. A question is only asked when the value shown is **unique to one
plant** — the app refuses to ask an ambiguous question rather than accept a
near-miss. Closing shows a session summary ("7/9 · weakest: X").

**Search.** Common name, latin, cultivar and use; typo-tolerant ("choysia" finds
Choisya) with exact matches always ranked above fuzzy; arrow keys walk results;
recently-viewed chips resurface the last six lookups; info sheets carry the
photograph, a twelve-month peak strip and a Share button.

**Filter deck.** Chips are *discovered from the data at runtime and never
hardcoded*: "In season now" (peak months against today), "Order in next 4 wks"
(order week against the current ISO week), plus one chip per type category and
per hardiness rating present in the deck. Like Review, filters are ephemeral
views — clearing the chip restores the deck exactly.

**My progress.** Learned count and percentage, quiz best streak, the Leitner box
distribution as a bar chart, the next three reviews due, and the three weakest
plants.

**Also:** Dictionary mode; a speech button that pronounces the latin name using
the browser's built-in engine with Italian phonology, so it works for any plant
added without shipping an audio file; installable as a PWA with an offline
service-worker cache.

## The architecture, and why it is the point

- **One file.** `timber.html` is 443 KB and roughly 9,200 lines — markup,
  styles, plant data, logic and the PWA manifest. Vanilla HTML/CSS/JS. No
  frameworks, no dependencies, **no build step.** This is a locked project
  constraint, not an accident.
- **Zero network requests.** There is no `fetch`, no `XMLHttpRequest`, no
  `sendBeacon`, no `WebSocket`, no dynamic `import`, and no external host
  anywhere in the file — verified by search, count zero. Every byte the app
  needs is local. `sw.js` caches same-origin GETs; nothing ever leaves the
  device.
- **Data lives in the file**, between marker comments, managed by Node tools.
  `plants.csv` is a mirror for editing, never fetched at runtime.
- **A standalone build** inlines every asset into a single file that opens from
  `file://` with zero external requests — which is why the one-file constraint
  is load-bearing rather than stubborn.
- **The card is locked geometry**: a 420×600 template with nine anchors checked
  to 0.75 px tolerance by `tools/template-geometry.js --check`.
- **Special-card systems** exist and are sparsely used: HOLO frames (2 cards),
  ANIM stop-motion sprite packs (1), FULLART (1), PHOTO_SWAP two-photo blink
  cards (2), and per-card photo focus overrides (19).
- **The test gate** is one command: five fast data checks then nine Playwright
  suites. The deploy gate verifies the served bytes against the build stamp
  before it passes.

## The discipline that is the actual moat

This is worth stating plainly because it is unusual and easy to undervalue.

The project **refuses to invent plant data.** `PLANT-BRIEF.md` produces research
in a fixed schema; `tools/check-plant-json.js` errors out rather than guessing;
`VERIFY-QUEUE.md` holds every fact that needs a horticultural call, with the
reasoning; `CORRECTION-PROTOCOL.md` is an audit gate on layout. Cards have been
**refused** rather than shipped — a Verbena photograph rejected for carrying a
generative-AI C2PA manifest; a Sumach photograph rejected for being the right
species but the wrong cultivar; a *Cornus kousa* card shipped deliberately
species-level as "unnamed pink form" rather than guess a cultivar.

For a product whose buyer is a business that will repeat what it says to
customers, that habit *is* the product. It is also the constraint that Part Two
has to survive.

## Where it is genuinely weak

Six things, in order of how much they matter.

1. **The ★ Learned button is self-reported, and therefore worthless as
   evidence.** It is the app's entire measurement surface and it can be tapped
   from the sofa without ever seeing a plant. This is the weakness Part Two
   attacks directly.
2. **84 of 272 cards have no photograph**, and Oscar is the only photographer.
   The deck is gated on one person's camera and the seasons. This is the current
   brick in `LEDGER.md`.
3. **The spaced-repetition engine is invisible.** Boxes, due counts and
   weakest-first weighting are all real and all two taps deep in a menu. The
   retention mechanic exists and the user never sees it.
4. **No streak, no daily goal, no session summary on the deck.** The quiz has a
   summary; the deck does not. 188 cards is not a daily unit.
5. **No accounts, no sync, no multi-user.** Everything is `localStorage` on one
   device. The menu's *Account* and *Settings* rows are inert placeholders —
   markup with no handler attached, unlike every working row beside them. For a
   product sold per site, a manager currently cannot see anything at all, and a
   staff member who changes phone loses everything.
6. **No pilot.** Nothing has been in front of a paying user.

## Part One, summarised

A genuinely finished, unusually disciplined single-file learning app with a real
spaced-repetition engine and a commercial data layer that competitors do not
have — which has never been in front of a paying customer, and whose only
measurement of learning is a button anyone can press.

---
---

# PART TWO — The collection game

## The one-line version

**You do not get given the deck. You earn it.** Cards start locked. Point your
phone at a real plant, capture it, and the card unlocks — carrying the
photograph you just took. Build out your deck by walking the shop floor.

## The concept

The current app hands you 188 cards and asks you to swipe through them. The game
version hands you 188 **silhouettes** and a shop floor.

The change is one verb. *Learned* — self-reported, free, unfalsifiable — becomes
*Captured*: proof that you stood in front of the plant. The deck stops being a
stack you work through and becomes a **collection you complete**. Progress stops
being a percentage bar and becomes a binder.

That is the Pokémon insight, and it transfers unusually cleanly here for one
reason: Timber's users are already walking past the plants. Most collection
games have to invent a reason to go outside. A garden centre employee is already
standing in the board.

## What falls out of it for free

These are not additional features to design. They are consequences of the
change.

**Your photograph on your card.** The card you unlock carries the frame you
shot. Two staff members hold visibly different decks of the same 188 plants.
That is ownership, and it costs nothing to produce — no extra content, no extra
art. It may be the single strongest thing in the whole idea.

**Rarity that is real rather than invented.** The deck already stores `peak`
months, `seasonalImpact` and `hardiness`. A plant that flowers in one month
genuinely is harder to capture than an evergreen. A *Syringa vulgaris* card you
can only take in May is legitimately scarce — and the scarcity is horticultural
fact, not a spawn table. No other collection game gets to say that.

**The special cards get a reason to exist.** HOLO, ANIM, FULLART and PHOTO_SWAP
are built, beautiful and used on four cards total. As an aesthetic they are
decoration. As a reward tier they are the point.

**Duplicates and trading.** The card back is already called a trade sheet.

**Every retention mechanic becomes native.** Streak, daily capture goal, "12 due
today" — the work `SUPERCHARGE-BRIEF.md` Track 3 lists as bolt-ons are simply
how a collection game works.

**Onboarding stops being a chore.** "Here are 188 cards, swipe through them" is
homework. "Here are 188 locked cards, go find them" is a game.

## What it fixes that nothing else fixes

**The measurement problem — this is the real argument.** A capture log is
evidence. A manager can be shown *"Sarah has captured 140 of the 188 plants on
your shop floor, including all 22 in the tree line."* That is a training record
worth money. *"Sarah tapped Learned 140 times"* is worth nothing and any manager
will see that instantly.

`SUPERCHARGE-BRIEF.md` says not to build the manager dashboard because it is
worthless before a pilot exists. That stays true. But capture is what makes the
dashboard have anything to show — it creates the data the B2B product would
eventually be sold on. It is the missing input, not a competing output.

**The photo bottleneck, potentially inverted.** 84 cards are held for want of a
photograph and there is one photographer. If capture produces usable frames,
every user is a photographer. Large caveats — licensing, quality, and the
provenance rules in `README.md` are strict for good reason — but the direction
of the arrow reverses, and that is a structural change rather than an
improvement.

## What would kill it — the cultivar wall

This is the objection that decides the idea, and it is specific to Timber rather
than general scepticism about camera ID.

Measured against `plants.csv`:

- **192 of 272 cards — 71% — are cultivar-level**, named with a quoted epithet.
- **37 cards sit in 16 same-species clusters** where a species-level answer
  cannot pick a card at all: *Cornus kousa* ×3, *Acer palmatum* ×3, *Euonymus
  fortunei* ×3, *Anemone* × ×3, *Hypericum* × ×3, *Hydrangea macrophylla* ×2,
  *Euonymus japonicus* ×2, *Ilex crenata* ×2, and eight more.

No general-purpose plant-ID model resolves cultivar reliably [Inference — none
of PlantNet, Google Lens or PictureThis claims to; they target species]. And
this repository has already been burned by exactly that gap, three times, on the
record:

- *Rhus typhina* — the photograph was the right species but a **cut-leaf
  cultivar**, and was refused rather than dealt onto the plain-species card
  (VERIFY-QUEUE 33);
- *Geranium* 'Bob's Blunder' — parked unidentified for days beside a held
  cranesbill it did not match (VERIFY-QUEUE 37);
- *Cornus kousa* — cultivar **deliberately not guessed**, card shipped
  species-level.

So a naive scan would confidently hand the user the wrong card several times a
session. In an app whose entire credibility rests on refusing to guess, **that
is not a feature with a bug in it. It is the opposite of the product.**

## The version that survives: read the label, not the leaf

[Speculation, but it is the direction to test first.]

Every plant on a nursery bench carries a printed label with the cultivar name on
it. Optical character recognition is a far easier and far more accurate problem
than cultivar morphology; it returns the exact string the deck already stores in
`latin` and `cvs`; and it **fails legibly** — a blurred label reads as nothing,
rather than as the wrong Acer.

It also flips the competitive position. `MONETISATION-BRIEF.md` warns that
camera-ID apps are a different game with enormous paid-acquisition budgets, and
it is right: competing with PictureThis on identification quality is a losing
fight. But PictureThis can only tell you that something is an *Acer palmatum*.
It cannot tell you the retail price, the order week and the margin of the
'Ōsakazuki' on bench four at Knights. **Narrow beats general here, and reading
the label is the narrowness.**

The two approaches are not exclusive, and the hybrid is probably the answer:
leaf ID narrows to a species → the deck's own data narrows to the cards for that
species → if more than one card matches, read the label or ask the user. Which
gives two design rules worth writing down now:

- **Never a single confident answer where the species has more than one card.**
  Offer a shortlist; the user taps. One extra tap, and the app stays honest.
- **An unrecognised capture is "found something new", not a failure** — which is
  the same pipeline as `photos/unidentified/` already is.

## What it costs — the part to be honest about

**The first backend.** The app makes zero network requests today. An API key
cannot ship inside a single file that anyone can View Source on, so this needs a
proxy. That is a threshold crossing, not a feature: the first server, the first
per-user running cost, the first component that can be down, and the first
privacy question — you would be uploading photographs of a commercial shop floor
to a third party.

**Online-only, in an offline-first app.** The scenario `SUPERCHARGE-BRIEF.md`
Track 4 is built around is a staff member walking into a polytunnel with no
signal. Every identification call needs signal. That is survivable — queue
captures locally, resolve when signal returns — but it does mean the honest
answer to "rather than the Learned button" is **alongside it, not instead of
it.** Capture is an additive layer over the swipe deck. The deck still has to
work with the phone in aeroplane mode.

**Accounts.** A collection you lose by changing phone is not a collection.
Everything today is `localStorage` with no account and no sync, and *Account* is
an inert menu row. A collection game effectively requires auth and sync — a
second backend piece, and the one that turns a hobby project into a service with
an on-call rota.

**It is the first feature that makes the one-file constraint hurt.** Camera UI,
a binder grid, a capture queue, auth screens — that is real weight in a 443 KB
file with no build step. Not impossible. But the constraint has been free until
now, and this is where it starts costing something.

**Cost per scan is not known.** Google Cloud Vision, PlantNet and hosted
vision-language models all have published pricing and **none of it has been
checked** — no figure should be quoted from this document. On-device inference
avoids the key, the backend and the running cost entirely, but means shipping a
model into the single file; also not costed. [Unverified]

## Where it could go wrong strategically

**Scope, not merit.** The current app is finishable by one person. The game
version has a backend, accounts, an API bill and a moderation surface (user
photographs of real premises). The idea is good; the size is the risk.

**It pulls toward consumer, where the money is not.** `MONETISATION-BRIEF.md`
records that the median subscription app makes under $50/month a year after
launch and roughly 81% never cross $1k/month, and that PictureThis-scale
outcomes need paid-acquisition budgets that do not exist here. The B2B case for
capture — proof of training — is much stronger than the consumer case. If this
is built, it should stay pointed at staff training and resist becoming a plant-ID
app with a card skin.

**It is a very enjoyable way to defer the pilot.** The highest-value action
available remains asking one manager at Knights whether they would use this.
That costs nothing and unblocks everything. Building a game first is the
expensive way to avoid asking.

---
---

# Side by side

| | **Timber as built** | **The collection game** |
|---|---|---|
| Core verb | Review | Collect |
| The commitment asked of the user | A tap | A walk to the plant |
| What progress means | Self-reported | Proof of encounter |
| Value to a manager | None that survives scrutiny | A training record |
| Deck source | Oscar's camera | Potentially every user's |
| Network | Zero requests, fully offline | Needs signal to identify |
| Backend | None | Proxy + auth + sync |
| Accounts | None (inert menu rows) | Effectively required |
| Running cost | £0 | Per scan, unknown |
| Biggest risk | Nobody is using it | Confidently unlocking the wrong cultivar |
| Buildable by one person | Yes — it is built | Not without new infrastructure |

---

# The recommendation

**Capture is the strongest strategic idea in the project**, because it is the
only one that converts Timber's output into evidence a buyer would pay for. It
should still not be built next, and the reason is sequencing rather than doubt.

The honest order:

**1. Ask one manager at Knights.** Costs nothing, unblocks every question in
both briefs, and no amount of building substitutes for it.

**2. Run the twenty-label test.** One afternoon, phone only, no code in
`timber.html`: photograph twenty bench labels at Knights, run them through one
OCR API, and count how many return a string that resolves to exactly one card in
the deck. A high number means the idea is real and the rest is engineering. A
low number kills it for the price of an afternoon. This is the cheapest possible
answer to the question that decides everything.

**3. Then — and only then — decide whether Timber grows a backend.**

## The cheap version worth considering first

There is a version of this that captures most of the value with none of the
cost, and it is worth naming because it is easy to miss while thinking about AI:

> **"Seen it" — take a photo, pick the card yourself. No AI at all.**

The user photographs the plant and attaches it to a card they choose manually
from the deck they already have. That delivers: proof of encounter, your own
photograph on your own card, the collection binder, locked and unlocked states,
seasonal rarity, and the manager metric — with **zero API cost, zero backend,
zero identification risk and no cultivar problem**, because the human resolves
the cultivar, which is the one thing humans standing in front of a labelled
plant are reliably good at.

And it settles the real question cheaply. If that loop is fun, identification is
only removing a tap, and it is worth paying for. If that loop is not fun, no
amount of AI will fix it — and finding that out costs one sitting instead of a
backend.

[Inference] That is where I would start.
