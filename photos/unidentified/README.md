# Unidentified photos

Genuine photographs waiting on an identification — or, marked as such below,
identified but waiting on a card. Nothing here is wired into the app.

`photos/` is scanned non-recursively by `tools/data-audit.js`, so this
subdirectory is invisible to the audit and cannot be mistaken for a card photo.

## 2026-08-09-white-panicles-lanceolate-leaves.jpg — CLEARED 2026-09-13

**Dealt as `Phlox paniculata` 'David'.** Oscar sent the JSON on 2026-09-13, a month
after confirming the identification. The card is built and in the deck.

**Flagged on the card, not a blocker:** the panicles are soft-focus and cut off at the
top of this frame, so the card's leading clause — *"Fragrant pure-white flower
panicles"* — reads as a pale blur. The foliage is unmistakably right. `peak` is Jul-Sep
and the flowering window closes within weeks; a flower shot this season would replace
it. See VERIFY-QUEUE item 84.

### Original record

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

### The two Myrtle frames — CLEARED 2026-09-13

`2026-09-13-small-glossy-leaves-red-stems-myrtle-or-callicarpa.jpg` -> **Luma apiculata**
`2026-09-13-larger-glossy-lanceolate-leaves-myrtle-or-callicarpa.jpg` -> **Myrtus communis**

**Neither is a Callicarpa; both are Myrtles, and they are not the same genus.**
Oscar photographed both pots with their labels: the larger light-green lanceolate
plant is labelled *Myrtus communis*; the small glossy red-stemmed one is labelled
*MYRTUS APICULATA (LUMA APICULATA)*. Both dealt.

The `[Inference]` logged here had the pairing right and the plant wrong — it
guessed the second was *M. communis* subsp. *tarentina*, a subspecies of the same
species. It is a different **genus**. Dealing that frame on leaf-size reasoning
would have put it on a Myrtus card and been wrong at genus level. The label
photograph settled in one frame what two rounds of leaf-margin argument could not.

The step that got the Callicarpa out of this pair was opening both frames and
finding no berries in either, which made "is the Callicarpa the one with the
purple berries" unanswerable from what was parked. Oscar then sent a berry
photograph; that card is dealt. See VERIFY-QUEUE items 79 and 80.

### `2026-09-13-variegated-evergreen-cream-margins-unidentified.jpg` — CLEARED 2026-09-13

**Euonymus japonicus 'Microphyllus Albovariegatus'.** Named by Oscar with a JSON;
card built and dealt from this exact frame. The `[Inference]` that it read as a
Pittosporum or Euonymus was half right, and the reason it was not guessed stands:
the deck already carries eight of those two genera and a wrong guess risked both a
wrong card and a duplicate. It is a seventh Euonymus, and not a duplicate of any
of the six already dealt.

### `2026-09-13-purple-shamrock-pink-flowers-unidentified.jpg` — CLEARED 2026-09-13

**Oxalis triangularis 'Mijke'.** Named by Oscar with a JSON; card built and dealt
from this exact frame. The `[Inference]` that the shape was *Oxalis triangularis*
was right; the cultivar was not readable from the frame and came off the label.
First Oxalis in the deck.

The frame is a two-panel collage with a large blurred area filling its lower half,
which looked likely to crop badly onto the card. Rendered before judging: the card
crops to the two panels and drops the blur entirely. The prediction was wrong and
the card is fine.


### `2026-09-13-paeonia-tom-cat-UNCROPPED-bystander.jpg` — ARCHIVE, not a parked frame

Not unidentified: this is the original of `photos/paeonia-lactiflora-tom-cat.jpg`,
kept because the card's copy is edited and the edit should be reversible.

A member of the public stands in the top right, out of focus but readable. The
first attempt cropped the frame below them, which decapitated the upper flower and
threw away the better half of Oscar's composition — he said so on 2026-09-14. The
card now carries the WHOLE frame with that one area blurred out: a redaction, not a
crop and not a fill. Every pixel is still his photograph, and nothing generative
went near it (see the note at the top of `tools/reframe-photo.js` for why that
matters).

This file still holds the un-redacted face and ships in every clone. Worth deleting
once Oscar is happy with the card's copy; kept for now because it is his original
and deleting someone's original is his call, not a tool's.

## 2026-09-14 — one frame from the six-photo batch

### `2026-09-14-double-daisy-white-pink-no-json.jpg`

**Parked because the batch has no JSON for it, not because the plant is a mystery.**

Six photographs arrived with six plant JSONs, and they are not the same six plants.
Five paired cleanly and are dealt (Fuchsia 'Alice Hoffman', *Berberis thunbergii*
'Desperados', *Symphyotrichum dumosum* 'Alpha White', *Viola* × *wittrockiana*
'Rose Blotch', *Gomphrena globosa*). The sixth JSON is *Cyclamen persicum* Super
Serie Djix F1 — a silver-marbled tuberous pot plant — and this frame is not that.
It is not a near miss or a cultivar question; they are different families.

`[Inference]` the frame shows a **double bedding daisy, *Bellis perennis***, read from
a basal rosette of spoon-shaped crenate leaves, solitary leafless flower stems, and
fully double pompom heads in white and pink with yellow discs. That habit is
characteristic of the double *Bellis* sold as bedding. `[Unverified]` which series
or cultivar — Tasso, Habanera, Bellissima, Pomponette and several others all look
like this at retail, and nothing in the frame settles it. No label is visible.

Nothing was built from it. Two things are needed before it can become a card:

1. **Confirmation of the plant** — ideally the bench label.
2. **A plant JSON** via `PLANT-BRIEF.md`, as for every other card. There is no
   *Bellis* in the deck and none on the wishlist, so there is no held card this
   could be dealt onto.

**To use it:** once the JSON arrives,
`node tools/add-plant.js --quick bellis.json photos/unidentified/2026-09-14-double-daisy-white-pink-no-json.jpg`

The reverse gap is also open: the **Cyclamen 'Djix' card is written and held** in
`PLANTS_ON_HOLD` with no photograph. See VERIFY-QUEUE item 85.
