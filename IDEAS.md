# IDEAS — the parked bench

Ideas that are worth keeping but are **not** being built. Nothing in this file is
committed to, scheduled, or implied. It exists so a good idea has somewhere to go
that isn't the active brick in `LEDGER.md`.

Rules:

- One block per idea. Whose it was, and when.
- Every block records **what would kill it**, not just why it's good. An idea with
  no honest objection recorded has not been thought about yet.
- Nothing moves from here into the deck without becoming a brick in `LEDGER.md`
  first. Parking is the default state; leaving is the exception.
- Same evidence tags as the rest of the repo: `[Unverified]`, `[Inference]`,
  `[Speculation]`. Claims about cost or third-party APIs that were never checked
  say so.

---

## 1. Scan to collect — capture the plant, earn the card

**Oscar, 2026-08-17. Status: PARKED.**

> Long form: **`CONCEPT-BRIEF.md`** — the app as built vs. the collection game,
> side by side, with the recommendation. This block is the summary.

> "What if, just like you collect Pokémon cards — rather than Learned / whatever
> buttons in the middle, we had a *scan to collect* feature. You capture the plant
> through the camera with a basic AI agent that identifies them, or pay to use a
> Google image API. Would this make it more like a game?"

### Why it's a real idea, not just a fun one

**It fixes the weakest part of the current loop.** The ★ Learned button costs
nothing. You tap it whether or not you know the plant, so the number it produces
means nothing to anyone — not to the user, and certainly not to a garden centre
manager. A scan cannot be faked from the sofa: it is *proof of encounter*. You
stood in front of the plant. That is the entire Pokémon Go insight, and it applies
here more cleanly than it does to most apps, because Timber's users are already
walking past the plants.

**It makes the B2B metric exist.** `MONETISATION-BRIEF.md` lands on B2B staff
training as the route where every question gets easier, and `SUPERCHARGE-BRIEF.md`
says not to build the manager dashboard because it is worthless before a pilot.
Both stay true — but a scan log is the first data Timber would hold that a
manager would actually pay to see. "Sarah has captured 140 of the 188 plants on
your shop floor" is a training record. "Sarah tapped Learned 140 times" is not.

**The card metaphor is already load-bearing.** The whole deck is built as trading
cards — frames, plaques, stats, a trade back, a card-back design doc. Collection
is the native verb for that object. "Learned" was always the flashcard app wearing
a trading-card costume.

### What would kill it — cultivars

This is the objection that matters, and it is specific to Timber rather than
general camera-ID scepticism.

Measured against the current `plants.csv` (272 rows):

- **192 of 272 cards — 71% — are cultivar-level**, named with a quoted epithet.
- **37 cards sit in 16 same-species clusters** where a species-level answer cannot
  pick a card at all: *Cornus kousa* ×3, *Acer palmatum* ×3, *Euonymus fortunei*
  ×3, *Anemone* × ×3, *Hypericum* × ×3, *Hydrangea macrophylla* ×2, and so on.

No general-purpose plant-ID model resolves cultivar reliably [Inference — none
claims to; PlantNet, Lens and PictureThis all target species]. And this repo has
already been burned by exactly that gap, three times on record:

- the *Rhus typhina* photo that was the right species but a **cut-leaf cultivar**,
  refused rather than dealt (VERIFY-QUEUE 33);
- *Geranium* 'Bob's Blunder', parked unidentified for days beside a held cranesbill
  it did not match (VERIFY-QUEUE 37);
- *Cornus kousa*, where the cultivar is **deliberately not guessed** and the card
  ships species-level with "unnamed pink form".

So a naive scan would confidently hand the user the wrong card several times a
session, in an app whose entire credibility rests on `CORRECTION-PROTOCOL.md`,
`VERIFY-QUEUE.md`, and the habit of refusing to guess. **A scan feature that
guesses cultivars is not a feature with a bug in it; it is the opposite of the
product.**

### The version that probably survives that

[Speculation, but it's the direction I'd test first] **Read the label, not the
leaf.** Every plant on a nursery bench carries a printed label with the cultivar
name on it. OCR is a far easier and far more accurate problem than cultivar
morphology, it returns the exact string the deck already stores in `latin`/`cvs`,
and it fails *legibly* — a blurry label reads as nothing, rather than as the wrong
Acer.

Fallbacks worth designing in either case:

- Scan resolves to a **shortlist**, never a single answer, whenever the species has
  more than one card. The user picks. That is one extra tap and it keeps the app
  honest.
- Unrecognised capture goes to a **"found something new"** state rather than a
  failure — which is, incidentally, the same pipeline as `photos/unidentified/`.

### What it would cost architecturally — the part to be honest about

- `timber.html` makes **zero network requests today** (verified: no `fetch`, no
  `XMLHttpRequest`, no external hosts anywhere in the file). Every byte is local.
  A scan is the first thing that would ever phone home.
- There is **no backend and no build step**. An API key cannot ship inside a
  single-file app that anyone can View Source on, so this needs a proxy — the first
  server-side component Timber has ever had. That is a threshold crossing, not a
  feature.
- It is **online-only**, in an app whose Track 4 selling point is the polytunnel
  with no signal. That's survivable if scanning is an additive layer over the
  existing swipe deck rather than a replacement for it — but it does mean the
  answer to Oscar's "rather than the Learned button" is probably *alongside*, not
  *instead of*.
- On-device instead of an API avoids the key and the backend, but means shipping a
  model into a 456 KB single file. [Unverified] — not costed.

### Open questions, none of them researched yet

- Cost per scan for Google Cloud Vision vs PlantNet vs a hosted VLM. [Unverified] —
  **no pricing has been checked**; do not quote a number from this file.
- Whether label OCR on real bench labels at Knights actually works, in real light,
  on a real phone. Nobody has tried it.
- Whether user-captured photos could ever feed the 84 held cards, and what that
  does to licensing and to the photo-provenance rules in `README.md`. Probably a
  separate idea; noted so it isn't lost.
- `MONETISATION-BRIEF.md` already warns that camera-ID apps are a different game
  with huge paid-UA budgets. Competing with PictureThis on ID quality is a losing
  fight. Using ID *only* to unlock cards from one shop's curated 188-card range is
  a much narrower, more defensible thing — narrow is the whole bet here.

### The smallest honest test, if this is ever picked up

Not a feature. One sitting, phone only, no code in `timber.html`: photograph twenty
bench labels at Knights, run them through one OCR API, and count how many return a
string that resolves to exactly one card in the deck. If that number is high, the
idea is real and the rest is engineering. If it is low, it dies here for the price
of an afternoon.
