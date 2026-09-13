# Unidentified photos

Genuine photographs waiting on an identification — or, marked as such below,
identified but waiting on a card. Nothing here is wired into the app.

`photos/` is scanned non-recursively by `tools/data-audit.js`, so this
subdirectory is invisible to the audit and cannot be mistaken for a card photo.

## 2026-08-09-white-panicles-lanceolate-leaves.jpg

**Confirmed *Phlox paniculata* by Oscar on 2026-08-13** — the guess made at the
time it arrived, from leaf and inflorescence shape alone, was correct. **Awaiting
stats from Oscar** rather than researched here: he said he'll send the JSON
through, and per PLANT-BRIEF's own rule this is exactly the kind of card that
should come from the person who can read the actual nursery label, not from a
second guess at a cultivar RHS lists dozens of.

2084×2834, no C2PA manifest — a straight camera capture.

**To use it:** once the JSON arrives, `node tools/add-plant.js --quick
phlox.json photos/unidentified/<this file>`.

## 2026-08-11-lotus-hirsutus-little-boy-blue-label.jpg

**Kept as an identification record, not a card photo.** The Knights bench label
for *Lotus hirsutus* LITTLE BOY BLUE (£14.99, location BLACKMOO, "PVR APPLIED"),
photographed beside the plant on 2026-08-11. It is the source for that card's
30cm × 30cm size — which is smaller than the 0.5m RHS gives — so it is worth
keeping legible rather than discarding once the card was written.

The plant photo it belonged to is now dealt as `photos/lotus-hirsutus-little-boy-blue-lisbob.jpg`.

## Resolved 2026-08-13 — five new cards, Oscar named every one

The five photos parked the same day were all identification questions, not
composition ones, and Oscar answered every one directly rather than leaving
them to guesswork:

| Was parked as | Oscar's answer | Now |
|---|---|---|
| Skimmia, female, red berries | "obsession" | *Skimmia japonica* OBSESSION ('Obsbolwi') — new card, dealt |
| Dark-leaved elder | "black beauty" | *Sambucus nigra* f. *porphyrophylla* 'Gerda' — new card, dealt |
| Silver trifoliate shrub | "it is cytisus battandieri" | *Argyrocytisus battandieri* (Pineapple Broom) — new card, dealt |
| Pyracantha, green berries | "orange star" | *Pyracantha coccinea* 'Orange Star' — new card, dealt |
| Purple wisteria, finger in frame | composition accepted ("i like the finger shots") | *Wisteria sinensis* — new card, dealt |

None of these went onto an existing held card — each is a genuinely different
plant from the deck's nearest sibling (Rubella is male-only, Black Lace has
finer foliage, the held Laburnum 'Vossii' is a different genus entirely,
SAPHYR ORANGE is a different cultivar, and the held wisteria is Japanese not
Chinese). See VERIFY-QUEUE 26–30 for the facts and hardiness sources behind
each. The wisteria finger-in-frame photo was used as-is on Oscar's explicit
call — composition is his to decide; it was the species that needed settling,
and he settled it.

The Chaenomeles 'Kinshiden' shot went through the same "parked, then Oscar
overruled the composition objection" path a day earlier — see VERIFY-QUEUE 25.
It lives at `photos/chaenomeles-speciosa-kinshiden.jpg`.

## Cleared 2026-08-13

Three photos left this folder on 2026-08-13 when cards were written for them —
*Aronia melanocarpa*, *Lotus hirsutus* LITTLE BOY BLUE and Begonia BONFIRE. They
are now normal card photos under their latin slugs, staged from the full-resolution
originals held here. This is the folder working as intended: nothing was lost
while the cards did not yet exist.

## 2026-09-12 — three photos from the eight-JSON batch

Parked rather than dealt. See VERIFY-QUEUE item 70 for the full reasoning.

### 2026-09-12-yellow-trailing-groundcover-round-leaves.jpg — CLEARED 2026-09-13

**Was:** no card and no JSON. Oscar's note was *"the flow ground cover yellow
thing"*. Trailing stems, opposite rounded yellow-green leaves, nursery pots.
`[Inference]` at the time was *Lysimachia nummularia* 'Aurea' (golden creeping
Jenny) from habit and leaf alone, with nothing in the repo to confirm it — no
Lysimachia in the deck, none on the wishlist, no label in the frame. Nothing was
built from it.

**Oscar sent the JSON on 2026-09-13 and the inference was right.** The card is
dealt as `Lysimachia nummularia 'Aurea'` and the photo is now
`photos/lysimachia-nummularia-aurea.jpg`, staged from the full-resolution
original held here. Same pattern as the Aronia / Lotus / Begonia clearances of
2026-08-13: the folder held the frame until the card existed, and nothing was
lost or guessed in between.

### 2026-09-12-actinidia-kolomikta-red-flush-no-variegation.jpg

Oscar's note was *"pinktipped climber"*, and the batch carried an
*Actinidia kolomikta* JSON. The card is **written and held**. The frame shows
cordate, bristle-margined leaves with red petioles under a whole-leaf
red-bronze flush — no silver-white tip and no pink band, which is the
variegation the card's `visual` line sells. `[Unverified]` whether this is a
plant that has not yet variegated (young, or the wrong sex — the species is
dioecious and the research says so) or a different plant. Same shape as the
'Dark Knight' case in item 69: dealing it would put a picture on the card that
contradicts the card's own words.

**Oscar's call, 2026-09-13: keep the card held and wait.** *"keep the climber
il just get a new photo at some point."* So this frame stays parked and the card
stays in `PLANTS_ON_HOLD` — not because the photograph is of the wrong plant,
but because it does not show the variegation the card is written around. See
VERIFY-QUEUE item 75A.

### 2026-09-12-pieris-japonica-mountain-fire-awaiting-json.jpg — CLEARED 2026-09-13

**Oscar named the cultivar: 'Mountain Fire'** — neither of the two the question
offered. He had hedged between 'Forest Flame' and 'Forest Fire', and the label
said neither, which is the whole argument for asking rather than dealing it onto
the held card it superficially fitted.

It needed a **new** card, not the held `Pieris 'Forest Flame'`: those are two
different plants, not two names for one. The JSON arrived the same day and the
card is dealt as `Pieris japonica 'Mountain Fire'`, with the photo now at
`photos/pieris-japonica-mountain-fire.jpg`. The held 'Forest Flame' card is
untouched and still has no photograph of its own.

See VERIFY-QUEUE item 72 — including a correction to a size claim this file's
earlier draft carried as `[Inference]` and Oscar's figures contradicted.

## 2026-09-13 — four photos from the sixteen-frame batch

### The Myrtle / Callicarpa pair

`2026-09-13-small-glossy-leaves-red-stems-myrtle-or-callicarpa.jpg`
`2026-09-13-larger-glossy-lanceolate-leaves-myrtle-or-callicarpa.jpg`

Both cards are **written and held**: *Myrtus communis* and
*Callicarpa bodinieri* 'Profusion'. These two frames are those two plants in
some order and **the order is not settled**. Leaf size says the small
red-stemmed one is the Myrtle and the larger lanceolate one the Callicarpa;
leaf margin says otherwise, because Callicarpa leaves are normally toothed and
the larger frame's look entire. `[Inference]` either way, which is not enough to
put a photograph on a card. **Oscar's call.** Once he says which is which:
`node tools/deal-plant.js "<latin>" <photo>` for each, then
`node tools/optimise-photos.js`.

### `2026-09-13-variegated-evergreen-cream-margins-unidentified.jpg`

No JSON. Thick obovate leaves in whorls at the shoot tips, broadly edged cream.
`[Inference]` reads as a Pittosporum or a Euonymus, but the deck already carries
**eight** of those between them, so a guess here risks both a wrong card and a
duplicate. **Needs Oscar to name it, then a JSON.**

### `2026-09-13-purple-shamrock-pink-flowers-unidentified.jpg`

No JSON. Deep purple triangular trifoliate leaves with pale pink funnel flowers.
`[Inference]` the shape is *Oxalis triangularis*, but nothing in the deck is an
Oxalis and the cultivar is not readable from the frame. **Needs Oscar to name
it, then a JSON.**
