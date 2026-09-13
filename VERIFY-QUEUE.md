# Verify queue

Open questions about card FACTS that need Oscar (or a source) to settle. Nothing
here is guessed or auto-corrected — the tools that found these deliberately stop
at "this looks wrong" rather than inventing a value.

Generated and re-checked by `node tools/plant-sense.js`. When you settle one,
fix the card and the line disappears from the tool's output on the next run;
delete it here too.

## How these were found

`tools/plant-sense.js` is a second, independent pass over every card. It cannot
check a fact against the world — it has no sources and no network. What it does
is check every card against **itself**, so a card whose prose says one thing and
whose ratings say another gets surfaced. That turns "are all 128 cards right?"
into a short list a human can actually work through.

Run it after every batch:

```sh
node tools/plant-sense.js            # report
node tools/plant-sense.js --strict   # exit 1 on contradictions (used by tests/run-all.js)
```

---

## Closed

**Choisya (*Choisya ternata*) — closed 2026-08-11.** Was the last `KNOWN_GAPS` entry
in `tests/deck-audit.js`: all seven ratings blank and its aspect reduced to "Any
aspect", losing the information the data actually held. Oscar supplied researched
values; the card now carries all six ratings plus `sunMin`, and an aspect naming
E/S/W facings, so the compass renders properly. `KNOWN_GAPS` is now empty.

Two things were preserved rather than overwritten during that update, and are worth
knowing if it is ever redone: the incoming JSON carried research citation markers
(`"... in summer or autumn. 0"`) which would have rendered as stray digits, and it
supplied no commercial block — Choisya is one of only three cards in the deck that
HAS a trade price, retail price and margin, so the update was merged rather than
applied wholesale.

## Needs a horticultural call (Oscar)

### 0. Wishlist batch 1 — 49 cards built and held, three loose ends
Ingested 2026-08-13 from `data/incoming/wishlist-batch-01.json` (50 researched
entries) via `tools/fit-incoming.js` → `tools/ingest-batch.js`. All 49 are in
`PLANTS_ON_HOLD` because none has a photograph. Set `held` to 0 in `plants.csv`
and re-import as photos land.

**a. `Malus 'John Downie'` was not researched.** The batch supplied
`Malus 'Evereste'` instead. Deliberately **not** built: the research is
Evereste-specific (yellow-orange fruit, pitched on pollination) and 'John Downie'
carries larger conical orange-red fruit pitched on jelly, so relabelling would
have put wrong facts on a card. Wishlist entry 37 needs a re-research. The
exclusion and its reason are in `EXCLUDE` in `tools/fit-incoming.js`.

**b. `Hypericum × inodorum` MAGICAL series never arrived.** Wishlist entry 31 is
absent from the batch entirely — 50 supplied against 51 asked for.

**c. 2 legal and 26 safety notes have nowhere to live on a card.** The incoming
schema carries `toxicity` and `compliance`; the card schema carries neither. Both
are preserved in the batch file, and `node tools/unmapped-report.js
data/incoming/wishlist-batch-01.json` lists them. Two matter commercially:
*Rhododendron luteum* is **Schedule 9 Part II, Wildlife and Countryside Act 1981**
(England and Wales) — illegal to plant or cause to grow in the wild — and
*Dicksonia antarctica* may carry source-country harvesting and tagging controls.
Twenty-six carry real toxicity (Daphne berries, Kalmia, Wisteria seed). Adding the
two fields is a schema change, not a field append: CSV columns, `data-audit`, a
rendered card slot and `template-geometry` anchors all move with it. **Decide
whether the deck should show toxicity and legal status at all** — if it is ever
used on a sales bench, it probably should.

### 1. Five held climbers have no H × W split — size rails render blank
**FOUR now. `Clematis 'Nelly Moser'` was fixed on 2026-09-13** when Oscar sent
a photograph and fresh research for it: the research supplied the spread
(1–1.5 m) that the tool was never allowed to invent, so `size` is now
`"2-4m H × 1-1.5m W"` and both rails render. It has been removed from `KNOWN`
in `tools/plant-sense.js`. See item 77. The remaining four are unchanged:

`Clematis 'Purpurea Plena Elegans'`, `Clematis montana var. rubens`,
`Evergreen Clematis` (*C. armandii*), `Russian Vine`
(*Fallopia baldschuanica*).

Their `size` fields read `"2-3m"`, `"8-12m"` etc. Every other card uses
`"<height> H × <spread> W"`, which is what the two side rails read. As written,
both rails are blank on these cards.

**Not auto-fixed on purpose:** the height is there but the spread is not, and
inventing a spread would be making up data. These are all on hold pending photos
anyway, so the fix can ride along with the photo work — but the spread figure has
to come from you or a label, not from the tool.

### 2. Two "compact" plants sit in the 2.5–4 m size band
- **Meyer's Lemon** (*Citrus × meyeri 'Meyer'*) — `2.5–4 m H × 1.5–2.5 m W`, and the
  card is sold on `containers · conservatory`. A container Meyer in the UK is
  usually kept well under that.
- **Kinme Japanese Holly** (*Ilex crenata 'Kinme'*) — `2.5–4 m H × 2.5–4 m W`, with
  `visual` describing "compact texture" and `uses` listing topiary. 'Kinme' is a
  small-leaved compact cultivar; the species can make a big shrub, the cultivar
  generally does not.

Both may be one band step too high. **Unverified** — no source available from
this container to check against RHS. Worth a look at your labels.

### 3. Two margin bands sit below their own gross arithmetic
- **Mexican Orange Blossom** — trade £3.90–£4.60, retail £11.99–£14.99, stated
  margin 55–60%. Even the worst pairing of those prices gives 61.6%.
- **Variegated Dwarf Weigela** — same shape, worst case 61.8% against a stated
  55–60%.

This is only wrong if the margin column is meant to be **gross**. If the band is
net of carriage, potting and shrink, both are fine and the tool should be told to
stop asking. Decide once and it applies to the whole deck.

### 4. Choisya has no ratings at all — SETTLED 2026-08-09, one figure still open
Filled from Oscar's research JSON: `growthSpeed` 9, `thirst` 6, `careLevel` 4,
`sunNeed` 75, `sunMin` 40, and `aspect` is now the real facing
**East / South / West** so the compass and light bar both render. `KNOWN_GAPS` in
`tests/deck-audit.js` is empty for the first time.

**Still needs Oscar: `pestRisk`.** The JSON said **8**; the card carries **3**.
They cannot both be right, and the repo argues for 3:

- `PLANT-BRIEF.md`'s rating scale uses *Choisya itself* as the canonical example
  of the `0–3` "bulletproof" band. Accepting 8 makes the brief's own anchor
  contradict the card it is anchored on.
- The card's `resilience` has read "Pest-free, drought tolerant once established"
  since it was written, and 8 means "occasional aphid/mildew".

3 is the top of the bulletproof band, so it concedes the occasional problem
without breaking the anchor. If Oscar's source for 8 is a real UK observation
(Choisya *does* get scale and honey fungus in some gardens), then the fix is not
just this card — `PLANT-BRIEF.md` needs a different anchor plant for the band.

Two more calls made against the same JSON, both deliberate, neither needing action
unless Oscar disagrees:
- **`hue` stays 150**, not the JSON's 0. The JSON claims 0 is "the Timber
  convention for predominantly white flowers"; the protocol says the opposite —
  changelog v12.4 records 150 as the *Choisya white-flower precedent* and built
  Flower Tower Dogwood on it. The deck is genuinely inconsistent here (Buddleja
  'White Profusion', Davidia and Scabiosa 'Flutter Pure White' all use 0), so
  **"what hue is a white flower" is worth settling once for the whole deck**
  rather than per card.
- **`peak` moved Apr–May → May-Jun** per the JSON. This shifts which month the
  card appears under the "In season now" filter, so it is visible behaviour, not
  just text.

### 5. Japanese Knotweed — the card is legally loaded and the photo is AI art
Added 2026-08-09. Two things need Oscar rather than a tool.

**The compliance text has no field to live in.** The schema has no `compliance`
key, so the legal position rides in `resilience` ("⚠ ILLEGAL TO SPREAD"), `type`
("⚠ NEVER STOCK") and the full paragraph in `returnRisk` — the same borrow
Gunnera uses (protocol v12.21). That is now **four cards** faking the same missing
field (Gunnera's ban, Olive's Xylella, Eryngium's PBR, this). It works, but a
staff member reading only the front card sees "ILLEGAL TO SPREAD · 1cm rhizome
regrows" in the soil warning and nothing else. For a plant where getting it wrong
is a legal problem for the garden centre, that is thin. The parked
compliance-ribbon design is the fix.

**The photo is an AI composite, not a field photo.** Deliberate — Oscar's call
that a never-stock invasive should read as dangerous on sight, and it does. But
the leaf shape and zig-zag habit are the only ID-true parts: the **red-flecked
hollow cane** that the card's own `visual` names, and that actually confirms
knotweed in a customer's garden, is not visible in the shot. As a teaching image
for the one plant on the deck where a mis-ID has legal consequences, a plain
cane-and-leaf photo would do more work. Worth having both — the dramatic one to
make it memorable, a real one on the info sheet to make it identifiable.

`photos/CREDITS.json` records it as Oscar's, `commercialUseCleared: false`,
as `oscar-ai` — **Oscar generated it with ChatGPT and Gemini** (confirmed
2026-08-09). `commercialUseCleared` is false, not because anything is wrong with
it but because output rights for AI images follow the generators' terms and nobody
has checked what OpenAI's and Google's say. That is a ten-minute question for
someone, not a defect.

### 6. Hydrangea serrata — the card says blue, the photo is white
Added 2026-08-09. `hue` is **220 (blue)**, the species archetype from the research
JSON, and the JSON is explicit that colour "ranges from blue and violet through
pink and red according to cultivar and soil chemistry". **Oscar's photo shows a
white-flowered form** with pink-red fertile centres. So the card teaches "blue"
next to a picture of white flowers.

There is a **nursery label visible in the shot**. If it names the cultivar, this
should probably become a cultivar card (like the deck's five other hydrangeas,
all of which are named forms) rather than a species card — which would settle the
hue, the flower colour and the hardiness in one go, since modern serrata cultivars
are often hardier than the species' H4.

Not guessed at either way: changing the hue to match one specimen of a genuinely
variable species is the same class of move as inferring photo provenance from a
tool that was never run.

### 7. Two Hamamelis × intermedia cards disagree on light and water
Same hybrid, two cultivars, two different answers:

| | sunNeed | thirst |
|---|---|---|
| 'Arnold Promise' | 65 | 9 |
| 'Jelena' (new) | 80 | 11 |

Cultivars of one hybrid should not differ this much in light preference — one of
the two is miscalibrated, and the deck now shows them side by side in any search
for "witch hazel". 'Jelena' carries the figures from Oscar's research JSON;
'Arnold Promise' predates it. Worth picking one pair of numbers for both.

### 8. 'Flower Tower' Cornus kousa is in the deck TWICE
Found 2026-08-09 while checking Cornus before adding more. Two cards, one plant:

| line | common | latin | growth | pest | care | sun | sunMin |
|---|---|---|---|---|---|---|---|
| 826 | Flower Tower Dogwood | `Cornus kousa 'Flower Tower'` | 11 | 6 | 10 | 78 | 48 |
| 2251 | Kousa Dogwood 'Flower Tower' | `Cornus kousa FLOWER TOWER ('Zuilb1')` | 7 | 4 | 5 | 70 | 40 |

**Both cards name `'Zuilb1'` in their own `cvs` field**, so each one states it is the
other. They also disagree on aspect (East/South/West vs Any aspect), size
(2.5–4 × 0.5–1 m vs 3–4 × 1–1.5 m) and every rating above — so a customer gets a
different answer depending on which card comes up.

**Recommendation: keep 2251, retire 826.** 826 is the v12.4 card, the first built
from a nested JSON, and the protocol records that its `water`/`prune`/`resilience`/
`uses` were deliberately left blank; 2251 has all four filled plus the anthracnose
resistance note. Not done unilaterally — removing a card is Oscar's call, and
`plants-tool.js` requires `--allow-removals` for exactly this reason.

**Tooling gap this exposes:** the deck's duplicate checks compare `latin` and
`common` as exact strings, so a plant entered under its trade name and again under
its breeder code passes both `add-plant.js` and `data-audit.js`. The r18 audit
caught the Goshiki/Tricolor rename but not this. A check on **cultivar codes inside
`cvs`** would have found it — `'Zuilb1'` appears on two cards.

### 9. Pink Kousa Dogwood — the cultivar is unknown, on purpose
Added 2026-08-09 from Oscar's photo, at his request. It is a **species card**
(`Cornus kousa`) with `cvs` reading "unnamed pink form — the species is
cream-white", because **named pink kousas cannot be told apart from a
photograph.** Bract colour shifts with temperature, light, flower age and plant
maturity; the same tree a fortnight apart can look like two different cultivars.

An AI-generated identification suggested 'Satomi', 'Heart Throb' and 'Scarlet
Fire' for photos in this group. None is supportable, and two are actively
contradicted by what the picture shows:

- **bract length ≈ leaf length** → rules out **'Venus'**, whose bracts run to
  roughly double and clearly overrun the leaves (it is also usually sold as
  *Cornus* × *elwinortonii*, not as a kousa);
- **bracts narrow and finely acuminate** → argues against **'Heart Throb'**,
  which is sold on broad, rounded, overlapping bracts.

What the photo *does* establish, and what the card is entitled to say: this is a
genuinely pink-bracted selection, not a white form flushing pink with age — the
colour is deep and even across the whole bract while the central flower head is
still tight and green, which is early. A white kousa pinks up later and unevenly.

**To settle it, Oscar needs the label or the receipt.** Then this becomes a
cultivar card and the species card can carry a white-bracted photo instead — he
has two, and they are not the same plant as each other (see below).

**The other two benched kousa photos differ in bract shape**, which is far more
stable than colour: one has long-acuminate bracts with gaps between them and pink
at the *tips*; the other has rounded, abruptly-pointed, overlapping bracts flushed
pink at the *base*. They are two different plants and should not be merged into
one card.

Also note this makes **three** `Cornus kousa` entries in the deck, two of which are
the duplicate 'Flower Tower' pair in item 8. Worth resolving together.

### 10. Two cards added 2026-08-09 need real photographs

**Waterlily 'Marliacea Carnea'** is **dealt** on Oscar's own identification — he
confirmed the plant and cultivar from his own pond, which is the authority that
matters. But the image file supplied for it is **synthetic**: its C2PA manifest
names the OpenAI Media Service API (`gpt-image` v2.0, action `c2pa.created`, IPTC
`digitalSourceType: trainedAlgorithmicMedia`). So the card is showing a generated
picture of a waterlily, not a photograph of the plant it describes. It is also
1086px wide, under the 1200px house standard. Recorded in `photos/CREDITS.json`
as **not** cleared for commercial use. Replace with a real photo of the pond when
convenient.

**Vial's primrose (*Primula vialii*)** is **held**, awaiting a clean photograph.
The supplied shot is a genuine Galaxy S24 capture, but it has been AI-edited
(`Photo assist`, IPTC `digitalSourceType: compositeWithTrainedAlgorithmicMedia`)
and carries a visible "AI-generated content" watermark burned into the bottom-left
pixels. Oscar's call was to re-shoot rather than crop. The data is in and validated
— set `held` to 0 in `plants.csv` and import once a photo lands.

### 11. Unidentified photo supplied 2026-08-09

A third photograph arrived with those two: opposite lance-shaped leaves under white
panicles, with a small purple flower in the background. It is the only one of the
three with no AI provenance markers and the largest at 2084×2834, but it matches
neither of the plants it came with. Most consistent with *Phlox paniculata*
(white). **Which plant is it for?** No card has been made from it.

### 12. Avondale blossom frame — SHIPPED 2026-08-09 (after my own error)
Oscar supplied two files: an assembled blossom frame and a component breakdown
sheet. **I used the wrong one as the frame**, fitted the breakdown sheet, saw it
render badly, and wrote this entry declaring his artwork off-spec on three counts.
That verdict was wrong and is retracted in full.

The assembled frame is **1049×1499, ratio 0.6998** — the same artboard as the
working Eternal Flame frame, byte-for-byte the same dimensions. It needed no
rescaling and no rebuild. It is now live on the card, spine ornaments carrying the
HEIGHT and SPREAD values exactly as intended.

The lesson worth keeping: when two assets arrive together, **check which is which
before concluding the artwork is at fault.** Everything measured in the retracted
version was measured accurately — against the wrong file. Confident, specific and
wrong is the failure mode to watch here; it is the same shape as the photo
provenance mistake earlier in the day.

**Panels are deliberately not swapped in**, and that is a real decision rather
than a leftover: the drawn plaque, soil box and band are the one part of a card
that has to be read, and the standard parchment reads. Same call as Eternal Flame
below. Holo where it decorates, parchment where it informs.

### 13. 'Avondale' flowering season — SETTLED 2026-08-09, no change needed
Asked whether the card was meant to be winter-flowering. **Oscar: it is early
spring, and the card is right.** `peak` stays **Apr-May**, and the two-photo blink
stays on ***Cercis chinensis* 'Avondale'** (Chinese Redbud) — not on the deck's
*C. canadensis* 'Eternal Flame'. Nothing to do; recorded so it is not re-asked.

### 14. Reverse-build batch of 50 — 49 cards are held with no photograph
Added 2026-08-10 from Oscar's RHS-style JSON. **One card had a photo on disk
(*Chamaerops humilis*) and was dealt; the other 49 are in `PLANTS_ON_HOLD`.**

This is the deck's standing rule (no photo = held), and here it is the *point* of
the build: the data is in place so that a card deals the moment a photograph
lands. Nothing about these 49 is provisional except the picture.

**The errand:** every photo taken or sourced for one of these 49 must be staged as
`photos/<latin-slug>.jpg` — the slug the app derives from the `latin` field, e.g.
`sambucus-nigra-f-porphyrophylla-eva.jpg`. Then set `held` to 0 for that row in
`plants.csv` and import, or move the entry into the `PLANTS` block by hand.
`node tools/data-audit.js` lists the exact slug for each held card.

### 15. `aspect` on the 50 new cards is derived, not supplied
Oscar's JSON gave `aspect` as a **light level** ("Full sun in a warm, sheltered
position"), which `check-plant-json.js` rejects by design — the card's aspect
field is a **compass facing**, and light already lives in `sunNeed` / `sunMin`.

Rather than guess per plant, one rule was applied to the whole batch, from the
supplied `sunNeed`:

| `sunNeed` | aspect |
|---|---|
| 90–100 | South / West |
| 70–89 | East / South / West |
| 45–69 | Any aspect |
| 25–44 | North / East / West |
| under 25 | North / East |

**Two deliberate overrides**, both because the source text specifically warns off
afternoon sun, which is what a west wall gives: *Dicksonia antarctica* (25 →
North / East, "protected from strong afternoon sun") and *Skimmia japonica*
'Rubella' (35 → North / East, "avoid hot exposed full sun").

**[Unverified] — these are editorial calls from a rubric, not from your
portfolio**, the same basis as the five climbers in item 1. Worth a skim; the
sun values themselves came from the JSON and are untouched.

### 16. *Dicksonia antarctica* — what the trade paperwork actually says
The source JSON stated the species "is not currently listed under CITES for trade
restrictions". **That claim is not verified here and I could not check it from
this container** — my recollection is the opposite (Appendix II), and asserting
either version on a card that a garden centre might rely on is exactly the kind of
confident-and-wrong this repo has already been bitten by twice.

The card therefore carries the neutral, true-either-way version: *"Imported
tree-fern trunks are subject to source-country harvesting and trade paperwork —
check the supplier's documentation before sale."* That is actionable regardless.
**Settle the CITES status before the card is used commercially.**

### 17. *Rhododendron luteum* — Schedule 9, and what it does not mean
The fifth compliance card, using the Gunnera fields (`type` banner +
`returnRisk` detail). It is listed in **Schedule 9 Part II of the Wildlife and
Countryside Act 1981 (England and Wales)**: an offence to plant it or cause it to
grow in the wild.

**It is not a sale ban** — unlike Japanese Knotweed's ⚠ NEVER STOCK. The card says
so explicitly, because a banner that over-reads the law would cost you sales of a
plant you are allowed to sell. Two things to confirm: that the listing is current,
and that you are happy selling it with the containment advice attached.
Scotland and Northern Ireland list differently; the card names England and Wales.

### 18. The UK-favourites batch of 50 is MY data, not yours — read this one
Added 2026-08-10. **This is the important difference between the two batches
added that day.** The first 50 came from your RHS-style JSON; I condensed it to
fit the card. **This second 50 I chose and wrote myself**, from general
horticultural knowledge, with no network access and no RHS page in front of me.

That means every one of these is an estimate until you or a label says otherwise:

- **`growthSpeed` / `pestRisk` / `thirst` / `careLevel`** — all 0-20 editorial calls
- **`sunNeed` / `sunMin`** — and therefore the derived `aspect` too (item 15's rule)
- **`hardiness`** — H-bands from memory, not from a checked source
- **`height` / `spread`** — banded estimates
- **`hue`** — flower or foliage colour, following protocol v12.4 (white = 150)

The prose is the part I would defend hardest and the numbers are the part I would
check first. **Nothing here is dealt** — all 50 are held with no photograph, so
none of it can reach a customer before you have looked at it. Committed at
`data/source-batch-2026-08-10-uk-favourites.json` with `origin` recorded as
claude-generated.

**Why these 50:** they fill genuine holes. Before this batch the deck had **no
rose at all**, no box, no beech, no privet, no lavandula angustifolia, no hosta,
no heuchera, no delphinium, no lupin and no clematis you could actually prune by
a rule. 40 of the 50 are genera the deck did not have.

**Deliberately left out — say the word if you want them:** bulbs. Galanthus,
Narcissus, Tulipa, Allium and Cyclamen are unarguably UK favourites, but they are
a different product category and the card's `prune`, `container` and H×W fields
fit them awkwardly. That is a schema decision, not an oversight, and it is yours
to make.

### 19. Two cards in that batch contradicted themselves — and plant-sense caught it
Worth recording because it is the tool working on new data rather than on a
historic import. `tools/plant-sense.js` flagged two of my own 50:

- **Pyracantha SAPHYR ORANGE** — `visual` led with "white spring flowers" while
  `peak` is Sep-Jan. The berries are what the plant is bought for, so the visual
  now leads with them and the flowering is noted as "earlier". The peak was right;
  the prose was pointing at the wrong season.
- **Astilbe 'Fanal'** — flagged as claiming drought tolerance at thirst 18/20.
  The trigger was `soilWarning: "Dry soil crisps it within days"`, which matched
  the tool's drought-tolerant pattern while meaning the exact opposite. Reworded
  to "Crisps within days without water". **The tool was right to stop on it** —
  a phrase that reads as drought-tolerant to a regex will read that way to a
  skim-reading member of staff too.

### 20. Oscar checked the UK-favourites 50 — 26 amended, and I had two legal facts backwards
2026-08-10, the same day they were added. He worked from the published worksheet
and came back with corrections to 26 of the 50. All applied. **Item 18 is now
partly closed:** the names, sizes and hardiness bands below have been through him.
The 0-20 ratings and sun values were *not* part of his pass and remain estimates.

**The two that matter most — I asserted a negative legal fact twice, and was wrong
both times.**

- **Wall Cotoneaster** (*Cotoneaster horizontalis*) — I wrote "carries no
  Schedule 9 restriction in England and Wales". **It is listed on Schedule 9.**
- **Japanese Rose** (*Rosa rugosa*) — I wrote "No UK legal restriction". **It is
  listed on Schedule 9.**

Both are now compliance cards on the Gunnera pattern, and both say what Schedule 9
actually means: **not a sale ban** — an offence to plant or cause to grow in the
wild. That takes the deck to **seven compliance cards**. The lesson is narrower
than "check the law": I volunteered a *reassuring* legal negative that nobody
asked for. A card that says nothing about legal status is honest; a card that says
"no restriction" is a claim, and it needs a source.

**Ten accepted names changed.** These matter beyond tidiness because the photo
filename is derived from `latin`, so every one of these changed which file the
card is waiting for. Nothing had to be moved on disk — all 50 are held with no
photograph, which is the one advantage of the reverse build:

| was | now |
|---|---|
| *Lonicera nitida* 'Baggesen's Gold' | *Lonicera ligustrina* var. *yunnanensis* 'Baggesen's Gold' |
| *Hypericum* 'Hidcote' | *Hypericum* × *hidcoteense* 'Hidcote' |
| *Weigela florida* 'Bristol Ruby' | *Weigela* 'Bristol Ruby' |
| *Hydrangea anomala* subsp. *petiolaris* | *Hydrangea petiolaris* |
| *Hosta* 'Halcyon' | *Hosta* × *tardiana* 'Halcyon' |
| *Heuchera micrantha* 'Palace Purple' | *Heuchera villosa* 'Palace Purple' |
| *Astrantia major* 'Roma' | *Astrantia* 'Roma' |
| *Astilbe* × *arendsii* 'Fanal' | *Astilbe* 'Fanal' |
| *Delphinium* 'Black Knight' | *Delphinium* Black Knight Group |
| *Lupinus* 'The Governor' | *Lupinus* 'The Governor' (Band of Nobles Series) |

Every superseded name is kept in `cvs` as a `syn.`, so a search for the old name
still finds the card — the same treatment Gunnera and Knotweed already get.

**One rename deliberately NOT made.** *Hebe* 'Red Edge' stays *Hebe*. Oscar's
instruction: current RHS material itself uses both *Hebe* and *Veronica*
treatments, so a destructive rename would trade one right answer for another.
*Hebe albicans* 'Red Edge' and *Veronica* 'Red Edge' are recorded as synonyms.

**Sizes: the deck means ULTIMATE size, and several of mine were maintained size.**
Box 1.5-2.5m → 4-8m, Bay 4-8m → 8-12m, Privet 2.5-4m → 4-8m. Worth stating as a
rule, because clipped subjects invite the mistake: the card describes what the
plant becomes if left, not what a hedge is held at. Six values I had were
confirmed unchanged.

**Hardiness moved on seven cards**, all downward except Cotoneaster and 'New Dawn':
Privet H6→H4, Kerria H6→H5, Climbing hydrangea H6→H5, Brunnera H7→H6, Crocosmia
H6→H5, Delphinium H6→H5, Lupin H6→H5; Cotoneaster H6→H7, 'New Dawn' H6→H7. My
H-bands were optimistic more often than not — a bias worth remembering if any
other Claude-estimated card is ever checked.

**Still open on these 50:** the four 0-20 ratings and the sun/aspect figures. Those
are the numbers item 18 flagged and this pass did not cover.

### 21. A Sarcococca photo arrived that may not be *S. confusa* — NOT filed
2026-08-11. Oscar sent three photographs; two were dealt straight away
(*Corylus avellana* 'Contorta', *Eucalyptus gunnii* Azura). The third he
described as "a type of sarcococca, can't remember the type". **It is not
staged, deliberately.**

The deck's only Sarcococca card is ***S. confusa***, so filing the photo would
put it there — and the leaves in the shot look wrong for confusa. They are
narrow and lanceolate, roughly 5-7cm long against maybe 1-1.5cm wide, on
reddish-brown stems. *S. confusa* has broader elliptic leaves, shorter relative
to width, usually with a slight twist to the tip. The narrow leaf plus the red
stem reads much more like ***S. hookeriana* var. *digyna***, and *S. hookeriana*
var. *humilis* is also possible.

**What settles it:** the nursery label, or leaf length — confusa runs about 2-5cm,
digyna 5-8cm and markedly narrower. Berry colour would also do it if any are
present (confusa black, *S. ruscifolia* red).

Two separate reasons it is not on a card yet, and the second applies whatever the
species turns out to be:

1. **The identification.** A photo on the wrong card is worse than no photo,
   because the whole value of the deck is that a member of staff can trust it.
2. **The composition.** The plant occupies only the top-left of the frame; about
   60% is bare soil and a roof tile. The card crops a portrait panel at focus
   50% 40%, so most of what shows would be soil. Even with the right card this
   needs either a reshoot or a hand-set `--focus` well up and left.

If it is *S. hookeriana* var. *digyna* it wants a **new card**, not this photo on
the confusa one — worth having anyway, since it is the better winter-scent plant
of the two for a small garden.

**Update 2026-08-13 — Oscar wants it in, and the composition objection is
withdrawn.** He asked for this photo to be used: *"the sarcococca has this cool
bright edging around the card, it's a cool photo for now."* Reason 2 above (the
composition) is therefore **settled in favour of using it** — the bare soil and
roof tile read as a deliberate bright border, which is his call to make.

**It could not be actioned, for a reason that has nothing to do with either
objection: the file is not in the repository.** It arrived on 2026-08-11, was
never staged (correctly, at the time), and the session container it lived in is
ephemeral and has since been rebuilt. A filesystem-wide search on 2026-08-13
found no Sarcococca image anywhere. **Oscar needs to re-send it.**

When it arrives, **reason 1 — the identification — is still open**, and it is
the one that matters: the deck's only Sarcococca card is *S. confusa*, and the
narrow lanceolate leaves on red-brown stems read like *S. hookeriana* var.
*digyna*. Dealing it onto the confusa card would put a photograph of one species
on another species' card, which is a different class of error from an ugly crop.
Either confirm it is *confusa*, or it wants its own card.

---

### 22. Golden Privet added 2026-08-13 — Oscar's own JSON, three loose ends
2026-08-13. New card, Oscar supplied the JSON and the photograph together; it
entered the deck through `add-plant.js` and the validator passed it. Three
things carried forward rather than resolved:

1. **The JSON's own declared-uncertain items**, verbatim: RHS classifies the
   cultivar as evergreen while some UK hedge suppliers say semi-evergreen in
   severe winters; and container suitability is inferred for regularly clipped
   specimens rather than mature unrestricted shrubs.
2. **careLevel is 5 (renders 1.25/5, "Easy").** The validator flagged it as
   suspiciously like an unconverted 0-5 rating. The held plain Garden Privet
   carries 9 (2.25/5). If golden privet was meant to be *harder* work than
   plain privet, this is the unconverted number; Oscar to confirm.
3. **Hardiness disagreed with the sibling card — RESOLVED 2026-08-13.** This
   card says H5 and the RHS page for 'Aureum' agrees. The held **Garden Privet**
   (*L. ovalifolium*, plain) said **H4** for the same species. On Oscar's
   instruction to fix outstanding problems, the RHS band for the plain species
   was checked as well — it is **H5** — and the held card was corrected H4 → H5
   through `plants-tool.js`, which reported exactly one changed card. The two
   privet cards now agree with each other and with the RHS.

---

### 23. Three cards written 2026-08-13 from parked photos — what needs your call
2026-08-13. Aronia, Lotus and Begonia had photographs sitting in
`photos/unidentified/` with no cards. Oscar asked for the cards, so they were
researched and written rather than left parked. Hardiness was verified per plant
against the RHS and **none of the three is H5** — H6, H4 and H2 respectively.

What is *not* settled, and why each was left as-is rather than guessed:

1. **Begonia `careLevel` is 14, and that number depends on a decision you make,
   not on the plant.** 14 assumes the tuber is lifted and overwintered like a
   dahlia (the rubric's 18–20 band is "tender lifting"). If Knights sells it as
   throwaway summer bedding, the honest number is nearer 6. Same plant, same
   card, two defensible ratings — this one is a shop policy question.
2. **Lotus size is the bench label's 30cm × 30cm; RHS and Shoot both say 0.5m
   after 2–5 years.** CARD-STATS §4a says prefer the label for the plant you are
   actually holding, so the label won — but a customer buying it for a gap will
   get a plant half again as big as the card implies.
3. **Lotus `toxicity` is deliberately blank.** No RHS toxicity statement was
   found for the species, and several legumes carry toxic seed. A "pet-safe" or
   "harmful" claim would both have been inventions; blank is the honest state.
4. **Lotus hardiness H4 is the species band.** The RHS page for the 'Lisbob'
   cultivar itself could not be read from this environment (rhs.org.uk is
   blocked by the network egress proxy — the band came from search results, not
   the page). If the cultivar is rated differently, this is where it is wrong.
5. **Aronia `peak` is May–Oct, one band across three seasons** — white flowers
   May–Jun, black berries from August, red autumn colour into October. The card
   has a single bloom row and this plant has three moments; the wide band is the
   same compromise already accepted for Parrotia (Feb–Nov) and Malus 'Evereste'
   (Apr–Nov).

None of these is a defect in the deck. They are the points where a second
opinion would change what a card says.

---

### 24. Virginia Creeper is a Schedule 9 card — check the wording
2026-08-13. *Parthenocissus quinquefolia* is listed on **Schedule 9 Part II of
the Wildlife and Countryside Act 1981**: an offence to plant it or cause it to
grow in the wild. Its `resilience` field carries the same ⚠ sentence already
used on *Rhododendron luteum* (item 17), deliberately word-for-word, so the deck
does not state the law two different ways.

As with luteum, **this is not a sale ban** and the card does not imply one.
Two things to confirm, the same two as item 17: that the listing is current, and
that you are content selling it with the containment advice attached. Item 17
also gives luteum the fuller `type` banner + `returnRisk` detail treatment; this
card does not have that, because those are your commercial fields and a JSON
import cannot write them. If you want the banner, it needs adding by hand.

Also note the card's `peak` is **Sep–Nov, the autumn-colour window**, not a
flowering window — the flowers are green and insignificant. That follows
CARD-STATS §4b, but it is the second card this session to use the bloom row for
non-floral interest (Aronia is the other), so it is worth knowing it is a
pattern and not a slip.

### 25. Flowering Quince 'Kinshiden' — DEALT 2026-08-13 on Oscar's call
Written 2026-08-13 and initially **held** with no photograph: the only shot of
it is roughly 45% out-of-focus thumb, with one spent August flower on a shrub
whose display is semi-double lemon-cream flowers on **bare spring wood**. That
was the Sarcococca rule (item 21) applied a second time.

**Oscar overruled it the same day, and was right on the facts.** His reasoning,
recorded because it changes how this queue should be read:

> "I understand about the idea of reshooting but I may not even be making this
> app in a year's time, so what we've got will have to do for now. The thumb is
> mostly under the stats card."

He is correct about the crop — the card renders the photo full-bleed with the
Plant Power Points plaque over the lower third, and the thumb falls almost
entirely behind it. The card was dealt with `--focus '8% 50%'`, chosen by
rendering the actual card twice: at 20% the flower cluster was clipped by the
left edge, at 8% it sits whole and in view. **Verified by looking at the render,
not by eye on the source file.**

The general standing rule does not change — a photo of the wrong plant is still
worse than no photo. What this settles is narrower and worth keeping straight:
**composition is Oscar's call, identification is not.** A shot that is merely
badly framed can be dealt if he wants it; a shot that might be the wrong species
still cannot.

A reshoot in March–April on bare stems would still be a better card, if the app
is still being built then.

Worth flagging separately: this is a **different plant from the held
*Chaenomeles* × *superba* 'Crimson and Gold'** card, which is a different cross
with red-and-gold single flowers. Two quince cards is correct, not a duplicate.

---

### 26–30. Five cards Oscar named 2026-08-13 from the parked photos
He identified every one of the five plants parked the previous message
directly — "skimmia obsession, sambucus black beauty, it is cytisus
battandieri, [pyracantha] orange star... yeah its phlox" — so none of this is
my identification; it's my research against his call, same division of labour
as the rest of this session. What follows is the sourcing and what's still
soft in each.

**26. Skimmia OBSESSION ('Obsbolwi').** H5, RHS-confirmed. The one fact worth
repeating to staff: it's **self-fertile** — every plant berries on its own,
unlike 'Rubella' which needs a female partner. Size is genuinely disputed
between sources (RHS/Coolings say 0.5–1m, other retailers say 1–1.5m); the RHS
figure is what's on the card.

**27. Black Elder 'Black Beauty' ('Gerda').** H6, RHS-confirmed, RHS AGM. Same
species and near-identical care to the held 'Black Lace' ('Eva') — the two are
told apart by leaf: Black Beauty's cut is coarser, Black Lace's is fine and
near-fern. Toxicity (harmful raw, berries/flowers edible cooked) is RHS-stated
for this cultivar specifically, not inferred from the genus.

**28. Pineapple Broom (*Argyrocytisus battandieri*, syn. *Cytisus
battandieri*).** **H5 — CONFIRMED by Oscar 2026-08-13.** Originally flagged
here as search-engine synthesis rather than a direct RHS read; Oscar checked
it and confirmed the rating is correct as it stood. No change made.

**29. Firethorn 'Orange Star' (*Pyracantha coccinea* 'Orange Star').**
**Hardiness CORRECTED 2026-08-13: H6 → H2, on Oscar's direct instruction**
after he checked the figure that was flagged here as the weakest-sourced of
the five (matched to the sibling SAPHYR ORANGE plus retailer copy, no direct
RHS read). H2 means **tender — no frost at all** (1 to 5°C), a completely
different growing proposition from H6 (hardy to −20°C), and from its own
sibling card.

**This creates a real inconsistency the automated checks cannot see and did
not flag**, because nothing in `plant-sense.js` cross-checks hardiness against
`uses` or `resilience` — only against prose season-words and size text. Left
exactly as Oscar wrote it, but worth his eye:

- `uses` still reads **"walls · hedging · containers · wildlife"**. Permanent
  outdoor hedging is not really compatible with H2 across most of the UK — an
  H2 plant is normally a container subject brought under cover for winter
  (CARD-STATS' own H2 anchor is *Pennisetum* 'Rubrum', a patio grass, not a
  hedge). If H2 is right, `uses` probably needs to lose "hedging" and gain
  something like "large containers, moved under cover for winter" — but that's
  a card-content decision, not a fact I should invent.
- `resilience` — **"thornless · fireblight tolerant · disease resistant"** —
  says nothing about frost tenderness, the single most operationally important
  fact for a plant this tender in a UK garden centre.

Its one genuinely distinctive fact, **thornless**, still comes from the US
plant patent rather than the photograph, which doesn't show enough stem to
confirm it against the actual stock plant.

**30. Chinese Wisteria (*Wisteria sinensis*).** H6, RHS-confirmed — same band
as the deck's Japanese Wisteria, so hardiness doesn't distinguish them.
**The photograph cannot itself confirm the species.** The textbook tell is
twining direction (*sinensis* anticlockwise, *floribunda* clockwise), not
visible in the shot, and the classic flowers-before-leaves spring display
wasn't what was photographed — this was an August flush among leaves already
colouring, which fits an established plant's occasional light repeat bloom
better than a first flowering. The species rests on Oscar's identification,
recorded as the source in the card's own `uncertain` list.

**Composition, separately:** the wisteria photo has roughly 55% of the frame
covered by a finger. Oscar's instruction was explicit — *"I like the finger
shots for now, they feel funny and make the app feel thrown together, which it
already is in ways"* — so it was used as-is, no crop attempted. Consistent with
item 25: composition is his call, identification isn't, and here he made both
calls on the same photo, separately.

### 31. All five (26–30) superseded by Oscar's own JSONs, same message
Oscar pasted his own fully-researched JSON for all five cards immediately
after they were dealt — the PLANT-BRIEF/NEW-SESSION route, done properly. Per
CARD-STATS §0, editorial content is his to arbitrate, so his version replaced
mine wholesale (every field that reaches a card) rather than being merged
field-by-field. Applied via `plants-tool.js` CSV edit, not a re-deal — photos
and their staged slugs are untouched, only the data changed.

Three of his common names differ from mine (**Skimmia OBSESSION** →
**Obsession Japanese Skimmia**, **Black Elder 'Black Beauty'** →
**Black Beauty Elder**, **Firethorn 'Orange Star'** → **Orange Star
Firethorn**) — deliberate renames, not losses, and logged in
`data/renames.json` so `data-audit.js --history` reads them as such.

Two things worth knowing that came out of applying his data:

- **His Pyracantha size (2m × 1m) looks odd next to the sibling SAPHYR ORANGE
  (2.5–3m × 2.5–3m, roughly square) — narrower and taller than a typical
  Pyracantha habit.** Not changed: his own `uncertain` list cites Plantipp
  (the PBR registration body) directly for this figure, which is a stronger,
  more specific source than anything used for the sibling card.
- **His Orange Star JSON self-contradicted on arrival** — `visual` claimed
  "white spring flowers" while `peak` was "Sep-Feb" (no spring month), which
  `plant-sense.js` correctly flagged as a hard contradiction, not a soft
  warning (the checker treats an actual flowering claim differently from a
  colour/foliage claim — see its own comment at `tools/plant-sense.js:172`).
  Checked independently: *Pyracantha coccinea* does flower May–June, so the
  fact is real, it just can't live in a Sep-Feb bloom band. **Fixed by copying
  the sibling SAPHYR ORANGE's own solution to the identical problem** — its
  visual reads "white flowers earlier" with no season word attached, true and
  non-contradictory. Same fix, same card family, second time it's needed.

Two hardiness sources from item 28–29 remain exactly as flagged before —
Oscar's JSONs didn't add an RHS page read for either, so rhs.org.uk is still
worth checking directly on a machine that can reach it.

---

### 32. Galaxy AI edit watermarks found on deck photos — provenance question, OPEN
2026-08-14, found while swapping the Photinia photo. The **old**
`photinia-fraseri-pink-marble-cassini.jpg` carried a small four-pointed sparkle
glyph in the lower right — the watermark **Samsung Galaxy AI stamps onto a
photo that has been through its generative edit / object-eraser tools**. Its
CREDITS entry read "Oscar's own photograph — owned outright ... 
commercialUseCleared: true".

That combination is the problem, and it is a **different question from the two
known AI images** (knotweed, Ajuga — README, both already
`commercialUseCleared: false`). Those are AI *generated*. These are Oscar's own
photographs of his own plants that have had a *generative edit* applied. The
photograph is still his; what is unsettled is whether a generatively edited
region carries the same clean commercial-use position, which depends on
Samsung's terms and has not been checked.

**Confirmed by eye on a standardised crop, then verified individually — four
still in the deck:**

- `agapanthus-poppin-purple-pm003.jpg`
- `edgeworthia-chrysantha.jpg`
- `hibiscus-syriacus-oiseau-bleu.jpg`
- `scabiosa-columbaria-flutter-pure-white-balflutturite.jpg`

The Photinia was the fifth and is **already resolved** — replaced 2026-08-14
with a clean reshoot Oscar supplied (2026-07-27, no watermark, no C2PA/EXIF AI
markers), so that card needs nothing further.

**The sweep is NOT complete, and should not be reported as one.** Two automated
detectors were written and both proved unreliable on this glyph: a
bright/desaturated blob detector returned five candidates that were *all* false
positives (gravel, leaf highlights) and found none of the real ones; normalised
cross-correlation against a confirmed glyph scored the two cleanest cases at
0.93–1.00 but missed the other two entirely, i.e. roughly 50% recall. What
actually worked was a contact sheet cropping the same relative corner from every
photo so the glyph appears in a consistent place — but a faint glyph over busy
foliage is genuinely easy to miss at thumbnail size, so **there may be more than
four.**

**What would settle it:** the glyph is alpha-blended at a fixed relative
position, so a reliable detector is possible with more care than was spent here
(match at several scales, and search a tighter window derived from the four
confirmed positions). Until then, treat the count as "at least four".

**Two decisions for Oscar, neither of which a tool can make:**
1. Should a generatively edited photo keep `commercialUseCleared: true`? If not,
   the four above need flipping to `false` like the knotweed and Ajuga.
2. Are these worth reshooting anyway? All four are plants he has to hand, and a
   clean frame removes the question entirely — which is exactly what the
   Photinia swap just did.

---

### 33. Stag's Horn Sumach photo is a CUT-LEAF form — SETTLED 2026-08-16
2026-08-15. Oscar sent a photograph with the note *"not sure if the [Rhus]
typhina 2nd photo is the same species"*. It is the right species and still the
wrong photograph for the card that exists, which is why nothing was staged.

**What the photograph shows.** Pinnate leaves with many leaflet pairs on a long
pale rachis, every leaflet cut almost to its midrib into narrow lobes — fern-like
rather than merely toothed. A zoom on the shoot at top-left shows dense fine hairs
on a pink-tan stem.

**What that rules in and out.** The leaflet count rules out elder (*Sambucus
nigra* 'Laciniata', the obvious cut-leaf lookalike, carries about five leaflets to
a leaf); the hairy shoot argues for *typhina* over the glabrous *R. glabra*
'Laciniata'. So: ***Rhus typhina*, a cut-leaf cultivar** — 'Dissecta' (syn.
'Laciniata'). `[Inference]` from foliage and one shoot, not from a label.

**Why it was not dealt anyway.** The held card is the **plain species**, and its
own `visual` line reads *"Velvety antler-like stems · pinnate leaves firing
scarlet · crimson fruit cones"*. A staff member learning the species from this
card would come away expecting fern-like foliage on any *Rhus typhina*, which is
wrong for the plant the card describes. That is the same class of error as the
Sarcococca in item 21 — right genus, wrong thing taught — and the deck's value is
that it can be trusted.

**One further wrinkle worth knowing before it is settled:** much of what UK
nurseries sell as *R. typhina* 'Dissecta' is now referred to ***R.* ×
*pulvinata* Autumn Lace Group**. `[Unverified]` which of the two this plant is —
that cannot be read off a leaf.

**Three ways to close it, Oscar's call:**
1. **New card** for the cut-leaf form, and this photo goes on it. Cleanest, and
   it is a genuinely different plant on the bench.
2. **Deal it onto the species card anyway** — acceptable only if the `visual`
   line is amended to say the shot is a cut-leaf selection.
3. **Reshoot** the plain species (simple toothed leaflets, and ideally the
   velvety antler stems or a crimson fruit cone) and leave this photo unused.

Recommend 1. The card that exists is fine; it just isn't this plant's card.

**SETTLED 2026-08-16 — Oscar took option 1.** He supplied a researched card for
***Rhus typhina* 'Dissecta'** and a second, better photograph of the same plant
(2408×3272, clean Galaxy S24 capture, no C2PA). It is dealt as its own card.
The plain-species *Rhus typhina* card is untouched and **stays held**, still
wanting a photograph of simple pinnate leaflets — so the deck now teaches the
two apart instead of conflating them. His `cvs` field carries the synonymy
(f. *laciniata*, 'Laciniata'), which also settles the naming wrinkle raised
above; see item 35 for what he flagged as still soft, including the
*R.* × *pulvinata* question, which his sources treat differently from mine.

---

### 34. Verbena bonariensis — card DEALT 2026-08-16 from the clean original; foliage shot still open
2026-08-16. Oscar sent an image captioned "Verbena bonariensis" for the held
**Purple Top Verbena** card: a two-panel picture, foliage on the left, a
honeybee with a white crab spider on a verbena flowerhead on the right. It is
**not staged, and this one is not a judgement call** — the file says what it is.

**What the file carries.** A signed C2PA manifest chain from *Google C2PA Media
Services*, 11 manifests deep. The actions, read straight out of the PNG:

- `c2pa.created` — description **"Created by Google Generative AI"**,
  `digitalSourceType: trainedAlgorithmicMedia` (twice, once per input panel)
- `c2pa.edited` — **"Applied imperceptible SynthID watermark"**
- `c2pa.edited` — **"Added visible watermark"**, `digitalSourceType: composite`
  — that is the four-pointed sparkle in the bottom-right corner

`trainedAlgorithmicMedia` is the exact IPTC code CARD-PROTOCOL tells this repo to
refuse on sight. There is also a JPEG ingredient in the chain with relationship
`inputTo`, so **a real photograph may well have gone in as an input** — but the
output the file describes is generated, not captured, and the credentials do not
say which pixels came from where.

**Why this is a harder no than the sparkle-glyph cases.** Item 32 is about
Oscar's own photographs that have had a generative *edit* applied, where the
open question is a licensing one. This is a different thing: the manifest
declares the image itself as created by generative AI. The deck already carries
two AI images (knotweed, Ajuga) and both are logged as a liability with
`commercialUseCleared: false`; adding a third knowingly, to a card meant to
teach staff what a plant looks like, is the mistake those two are a warning
about.

**Two lesser problems, either of which would stop it on its own:**
1. **878 × 1216 px** — below the 1200px floor the protocol flags.
2. **It is a two-panel composite.** The card crops a single portrait window, so
   it would show the seam or one arbitrary half. Even a clean photograph in this
   layout wants splitting before it is staged.

**What is actually wanted:** the original camera JPEG of the flowerhead — the
bee-and-crab-spider frame is a genuinely good card photo if a real one exists.
`Verbena bonariensis` stays held until it arrives.

**Update 2026-08-16 — Oscar corrected the account, and he is right.** He took
both source photographs himself; what the AI did was merge them into the
two-panel picture. The refusal above still stands *for that file* — a generative
merge of two real photographs is still an image whose credentials declare it
generated, and it was 878px wide besides — but "AI-generated" as a description of
the underlying work was wrong, and the ownership worry raised alongside it was
overstated. He owns the photographs. There is no plausible legal exposure here;
the reasons not to ship that file were resolution, the two-panel seam, and what
a credential reader would say about it in front of a garden centre.

**He then sent both originals, and the card is dealt.** The bee frame
(`640c7f97`, 1972×2730) carries **no C2PA manifest at all** — a plain Galaxy S24
capture — and is now `photos/verbena-bonariensis.jpg` at focus 50% 10%. Deck
170 → 171.

**Two things stay open, both about the FOLIAGE shot** (`e3abb92c`, 3000×4000),
which was NOT staged:

1. **It carries a Galaxy AI edit marker.** One C2PA manifest, action
   `c2pa.edited`, `softwareAgent: Photo assist`, `digitalSourceType:
   compositeWithTrainedAlgorithmicMedia` — a real photograph with generated
   content composited in — plus the visible "✦ AI-generated content" label
   burned into the lower left. That is **item 32's category exactly** (Oscar's
   own photo, Galaxy AI generative edit applied), and it is the first one caught
   *before* landing rather than after. The visible label is new: the four
   already in the deck carry only the sparkle glyph, so Samsung's labelling has
   changed at some point and **the older four may predate it**.
2. **It looks like a different plant from the card.** `[Inference]` from the
   photograph, not from a label: the leaves are deeply cut with lobed, almost
   hastate bases on shaggy-hairy stems, and the flowers sit small and violet and
   scattered rather than in a dense flat head. *V. bonariensis* has simple
   lance-shaped toothed leaves clasping a near-smooth square stem. This reads as
   another vervain — ***V. hastata*** (the lobed leaf bases) or
   ***V. officinalis*** — growing near it. Worth Oscar's eye on the actual
   plant; if it is a second species it may be worth its own card, and if it is
   self-sown *V. officinalis* it is a weed in that bed.

The dealt card does not depend on either point: the bee frame is unambiguous
*V. bonariensis* and is the plant the card describes.


---

### 35. Two cards added 2026-08-16 — Oscar's own research JSON, what he flagged
Both cards came from Oscar with a `uncertain` block already filled in, so this
is his flagging, not mine. Nothing below blocked either card; it is what a
label or an RHS read would settle.

**Cut-leaved Stag's Horn Sumach (*Rhus typhina* 'Dissecta')**
- RHS accepts the cultivar and lists *R. typhina* f. *laciniata* / 'Laciniata'
  as synonyms; **Kew treats both f. *laciniata* and f. *dissecta* as synonyms of
  the plain species** rather than accepted taxa. The card follows RHS. Note this
  is a different resolution of the naming question from the one raised in item
  33, which pointed at *R.* × *pulvinata* Autumn Lace Group — **that hybrid is
  not mentioned in his sources at all**, and the two accounts have not been
  reconciled. It changes no fact on the card.
- Spread is given 4–8 m but "can approach 6 m or more" through suckering; the
  `prune` line already tells staff to take suckers out in winter.
- **Toxicity deliberately left blank** — his sources conflict and none supports a
  clear customer warning. That is the honest entry, and it is consistent with how
  the deck handles unknowns. The card schema still has nowhere to put toxicity
  even when it IS known (item 0c).
- No England-and-Wales statutory restriction was verified. `[Unverified]` — the
  vigorous suckering is a nuisance question, not a legal one, as far as either
  of us has checked.

**Purple Hybrid Catalpa (*Catalpa* × *erubescens* 'Purpurea')**
- **Size is the one worth a second look.** RHS gives ultimate dimensions above
  12 m × above 8 m; the card carries 10–15 m × 6–10 m from specialist tree
  sources. Either is defensible, but a 12 m+ tree on a garden-centre bench card
  is a fact staff will be asked about.
- RHS says full sun; specialist UK nursery guidance allows light dappled shade,
  and `sunMin` 60 encodes that tolerance. The card therefore sits slightly
  looser than RHS on light, on purpose.
- Honey-fungus resistance comes from nursery guidance, **not** from the RHS
  cultivar profile.
- `pestRisk` 5 (1.25/5) tripped `check-plant-json.js`'s "is this an unconverted
  0–5 rating?" warning. Left as written: 1.25/5 agrees with the card's own
  "generally pest free", where 5/5 would flatly contradict it.

**Both:** `hardinessNote`, `toxicity`, `compliance`, `foliage` and `container`
were supplied and have **no home in the card schema**, so they are dropped from
the rendered row. The full JSON is committed at
`data/incoming/rhus-typhina-dissecta.json` and
`data/incoming/catalpa-erubescens-purpurea.json`, so nothing supplied is lost —
but this is the fourth batch to hit item 0c's missing fields.

---

### 36. perf-test's zero-pixel assertion outgrew the deck — SETTLED 2026-08-16, gate green
2026-08-16. Adding the two cards above took the deck 171 → 173 and turned
`perf-test`'s pixel-parity check red:

    FAIL hiding buried content changes no pixel (the deck halo is stacked shadows)
         — 18px differ (0.001%), max channel delta 3

**It is not flaky and it is not a coincidence.** Verified by bisection, not by
assumption: an unmodified checkout of the previous commit (3ceb9db, deck 171)
served on the same port passes this check 14/14; the current tree fails it with
the identical numbers on every run.

**What the pixels actually are.** The diff was re-run with coordinates and
values dumped:

- **16 pixels** (the suite's own count of 18 includes the alpha-channel pass),
  at device scale 2 on a 780×1560 buffer.
- Fifteen of them are a **vertical run at x=764, y=1311–1325** — the extreme
  right edge of the deck halo, about 8 device px in from the frame.
- Their values: reference **(0,0,0)**, live **(1,1,1)**. **A delta of one unit
  in 255, on black.**
- The sixteenth, at (763,257), is (8,18,12) vs (8,19,13).

**Mechanism, and why it is not content leaking.** Unhiding the buried cards makes
the picture DARKER by one unit, not lighter — so nothing is peeking through the
top card. It is the check's own named cause: `.tcard` box-shadows stack, and two
more cards in the pile push the accumulated alpha at the outermost edge across an
8-bit rounding boundary. No buried card's content becomes visible at any point.

**Why this was not fixed unilaterally.** Three routes, and picking one is a call
about the gate, not about the cards:

1. **Give the assertion a tolerance** — e.g. allow a max channel delta of 1. One
   unit on black is below anything a screen can show. Risk: it is a deliberately
   strict check, and the last deck-growth failure (changelog v14.1, the menu
   panel) turned out to be a **real defect** that a tolerance would have hidden.
2. **Treat it as a real defect and cap the shadow stack in the app** so the halo
   stops depending on deck depth. Correct in principle, a visual change to every
   card's shadow, and far bigger than the two cards that exposed it.
3. **Leave it red** until decided. Honest, but the gate stops meaning anything
   the moment one red is normal.

Recommend 1, with the evidence above written into the test's comment so the next
person knows what the tolerance is buying and what it would hide. **Not done
without Oscar saying so**, because loosening a gate to make one's own change pass
is precisely the move that should never be quiet.

**SETTLED 2026-08-16 — Oscar chose option 1, and it is done.** The assertion now
reads *"hiding buried content shows nothing"* with a budget of **64 px and a max
per-pixel channel-sum of 8**, against an observed 17 px / Δ5 at deck 194. The
full evidence above is written into the test's own comment so the next person to
find it does not re-tighten it blind.

**The budget was measured, not guessed.** A leak was staged and put through the
same diff: one buried card un-hidden and nudged 12 px so part of it genuinely
showed past the top card came out at **46,882 px, max delta 443**. Against a
residual of 17 px at Δ5 that is three orders of magnitude on both axes, so the
tolerance cannot swallow a real defect — which was the whole worry, given the
v14.1 menu-panel precedent where a deck-growth failure turned out to be real.

**Two things keep it honest.** The observed numbers are now in the check's name
on **every run, passing or failing**, so the drift stays in the suite output
instead of disappearing under a threshold — it has already moved from Δ3 at deck
173 to Δ5 at 194. And the comment says plainly that px in the hundreds or max in
the tens is a different phenomenon and wants investigating, not another
loosening.

**The gate is now green apart from nothing: 17/17 sequential.**

---

### 37. Batch of 2026-08-16 — three photographs with no card, two cards with no photograph
Six researched cards and eight photographs arrived together. Four matched cleanly
and are dealt. This is what did not match, plus what Oscar himself flagged.

**A. Three photographs were NOT staged.** Each one sits next to a card already in
the hold block, and in each case the cultivar is the problem — the same trap as
item 33. All three files are clean captures, no C2PA, no AI markers.

1. ~~**Physocarpus**~~ **CLOSED 2026-08-16 — Oscar confirmed 'Diabolo' and it is
   dealt.** Original note kept: (two near-identical frames). Oscar named the genus only. The
   deck's only Physocarpus is ***P. opulifolius* 'Diabolo'**, held. The photo
   shows the dark purple-red foliage 'Diabolo' is grown for — but so are
   'Summer Wine', 'Lady in Red' and 'Little Devil', and a leaf cannot separate
   them. **Genus-level is not a match** (CARD-PROTOCOL says so explicitly). One
   word from Oscar deals it.
2. **White-plumed shrub.** Loose creamy-white panicles over pinnate, sharply
   serrated leaflets on reddish stems. The deck's held *Astilbe* is **'Fanal',
   which is blood-red with bronze foliage** — this is not that plant. `[Inference]`
   from the photograph: it could be a white Astilbe, but the pinnate leaflets and
   woody reddish stems read at least as well for ***Sorbaria sorbifolia***
   (false spiraea), which has no card at all. Needs a name before it can go
   anywhere.
3. ~~**Bronze-leaved Geranium.**~~ **CLOSED 2026-08-16.** It is
   ***Geranium* 'Bob’s Blunder'**. Oscar resent the identical file with a
   researched card for it, and it is now dealt — so the reasoning below was
   right that it is not Rozanne, and the plant is simply one the deck did not
   yet have. Kept here for the record: deeply cut bronze-brown foliage, vivid
   red-pink stems, one small pale-lilac flower with darker veining, against
   Rozanne's large deep violet-blue flowers with a white eye over plain green
   leaves.

**B. Two cards went to the hold block for want of a photograph** — *Anemone* ×
*hybrida* 'Pretty Lady Emily' and *Loropetalum chinense* var. *rubrum* 'Fede'.
Both are fully researched and will deal the moment a frame arrives. Note the
deck already carries **Pretty Lady Maria** as its fullart special, so the two
Pretty Ladies will sit side by side — worth keeping their photographs visibly
different.

**C. What Oscar declared uncertain**, carried over from his `uncertain` blocks
rather than accepted silently:
- **Hosta 'Broadband'** and **Loropetalum 'Fede'** both have an **unresolved RHS
  name status** despite having exact cultivar records. Neither card claims
  otherwise.
- **Loropetalum 'Fede' hardiness (H4) is INFERRED**, not read off the cultivar
  record — from RHS var. *rubrum* guidance plus UK cold-tolerance sources. That
  is the single softest number in the batch, and hardiness is the field this repo
  has always found most error-prone. Mature size also disputed, 1–1.5 m against
  ~1.8 m.
- **Salvia 'Black and Blue' is H3** — tender, needs winter protection outside mild
  areas. Its card says so; staff should not sell it as hardy.
- **'Pretty Lady Emily' and 'Star of Love' are both PBR protected**, and the
  `compliance` field carrying that has **nowhere to live on the card** (item 0c
  again — fifth batch running). Propagation restrictions are exactly the sort of
  thing a garden centre needs on screen.
- Several `peak` values are practical UK interpretations of "summer" or "late
  summer", not month ranges any source states. Loropetalum's Jan-Dec encodes
  year-round foliage rather than flowering.
- `careLevel` 5 and `pestRisk` 2–3 tripped `check-plant-json`'s "unconverted 0–5
  rating?" warning on four cards. All are coherent with their own `resilience`
  text ("pest and disease free"), so all were left as written.

**D. The Salvia photograph carries a pasted cut-out leaf** with a white outline —
his own sticker edit, not generative, no markers in the file. The card window
cannot crop it out. See the photo register for the geometry; a plain flower frame
would be better if he has one.

---

### 38. Three photographs parked 2026-08-16 — carried, credited, claiming nothing
Oscar sent these with "store on temporary photos" / "store the hebe unless we did
that hebe already". They are staged in `photos/` under names **no card slug can
ever resolve**, so `data-audit` lists them as unclaimed spares rather than any
card picking them up by accident. All clean captures, no C2PA, no AI markers.

- `robinia-unidentified-leaf.jpg` and `robinia-unidentified-thorn.jpg` — pinnate
  leaves of rounded leaflets, and a close-up of the **paired purple-black
  stipular spines at a node**, which is the giveaway for *Robinia*. `[Inference]`
  the genus; the **species and cultivar are open**, and the deck has no Robinia
  card at all. If it is *R. pseudoacacia* 'Frisia' the foliage would be gold, and
  this is plain green — so either the straight species or something else in the
  genus. The thorn shot is a genuinely good detail frame for whatever card it
  ends up on.
- ~~`hebe-variegated-unidentified.jpg`~~ **CLOSED 2026-08-17 — it is *Veronica*
  'Rhubarb Crumble'** (Bella Bloom collection), named by Oscar when he sent the
  same frame again with a researched card. Dealt; the parked duplicate and its
  CREDITS entry are removed. Original note kept: cream-margined leaves with deep purple
  buds. **It is not the deck's held Hebe 'Red Edge'**, which carries grey-green
  leaves with a thin red rim and no cream variegation, so "unless we did that
  hebe already" resolves to: we have not, and this is a different plant. Reads
  like one of the variegated *H.* × *franciscana* selections. `[Unverified]`.

**Two smaller notes from the same batch:**
- The 'Pretty Lady Emily' photograph has an **`Achillea` Sassy Summer label** from
  a neighbouring pot in the bottom of the frame. The focus is pinned to 0% so it
  hides behind the stats plaque — see the photo register before retuning it.
- The old Coprosma 'Inferno' master is kept as `coprosma-inferno-summer.jpg`. It
  shows the green-yellow summer state; the card's `visual` describes the cold
  purple-brown-and-red state, which the new master shows. **Worth deciding
  whether a card should ever carry two seasonal frames** — `PHOTO_SWAP` already
  exists in the app for a related purpose, and this is the first card where the
  text plainly covers two looks and both photographs exist.

---

### 39. Batch of ten, 2026-08-16 — two parked photographs, four out-of-season cards, and what Oscar flagged
The deck's biggest single batch: ten researched cards, ten photographs, all
dealt. What follows is everything that did NOT resolve cleanly.

**A. Two photographs were parked** — staged under `*-unidentified*` names that no
card slug can resolve, credited, claiming nothing:
**CLOSED 2026-08-16 — Oscar named both, and both are now cards** (*Cornus
sericea* 'Variegata', *Calycanthus* 'Aphrodite'), with the parked copies deleted
so the same picture does not live in `photos/` twice. Original notes kept:

- `cornus-variegated-unidentified.jpg` — cream-margined leaves with a purple
  flush, **dark red stems** and purple-black berries. The deck already holds
  three Cornus (*sanguinea* 'Midwinter Fire', *kousa*, *controversa*
  'Variegata') and this matches none of them. Red stems plus white-margined
  leaves reads like ***C. alba*** 'Elegantissima' or 'Ivory Halo'
  `[Inference]`, which would be a new card.
- `calycanthus-unidentified.jpg` — the one Oscar described as *"fuck I forgot
  what thats called"*. Deep maroon-red flower with many strap-shaped petals over
  glossy opposite leaves: that is ***Calycanthus*** (sweetshrub) `[Inference]`,
  most likely one of the modern hybrids such as 'Aphrodite'. **No Calycanthus
  card exists.** A label would settle both of these in seconds.

**B. Four cards are dealt on foliage-only frames**, because the flowers are out
of season. Not defects, but a real gap between a card's text and its picture —
the same class the Coprosma 'Inferno' swap corrected:
- ***Syringa vulgaris*** — the worst of the four. Card text leads with "fragrant
  lilac-purple panicles"; the photograph is leaves. **Flowers May-Jun**, so this
  is a spring reshoot and is first in that queue. The leaves also carry a
  yellow-green mottling; `[Unverified]` whether that is light, natural variation
  or something like lilac mosaic virus — worth Oscar's eye on the actual plant.
- **Clematis AVALANCHE** — peak Mar-Apr; the glossy dissected evergreen foliage
  is genuinely half the plant, so this one is the least wrong.
- **Lonicera 'Copper Beauty'** — the bronze new growth is the cultivar's name,
  but the scented tubes (Jun-Aug) are what sells it.
- **Weigela PRISM MAGIC CARPET** — flowers present but low in the frame; focus
  was pushed to 50% 100% to keep them above the plaque.

**C. What Oscar declared uncertain**, carried across rather than accepted
silently:
- ***Geranium* 'Bob’s Blunder' synonymy.** His `cvs` reads "syn. *Geranium
  biuncinatum* 'Bob’s Blunder'". `[Unverified]` — *G. biuncinatum* is an African
  annual and 'Bob’s Blunder' is usually placed with the New Zealand
  *G.* × *antipodeum* group, so the two do not obviously belong together. **No
  fact on the card depends on it** (the `cvs` line is a synonym note), and it was
  left exactly as supplied. Worth one check.
- **Dahlia ELECTRO PINK** carries two codes for one plant — RHS `'71853-09'`,
  EU PBR `'EP7185309'`. Both are on the card's `cvs`. Height sources range
  50–80 cm; the card gives the full band.
- **Weigela PRISM MAGIC CARPET**: breeder material uses *Weigela* × *hybrida*,
  RHS records it at genus level, and RHS's height band (50–100 cm) is twice the
  breeder's (50–60 cm). The card follows the breeder.
- **Both Hypericums** are recorded semi-evergreen by RHS and deciduous by some
  specialists.
- **Clematis AVALANCHE**: RHS herbarium material records PBR but **current UK
  protection status was not confirmed** — and the card's `compliance` field has
  nowhere to render anyway (item 0c, now the sixth batch).
- **PBR restrictions on five cards in this batch** (both Hypericums, the Dahlia,
  Lonicera 'Copper Beauty', and AVALANCHE's unconfirmed status). Same missing
  field. If this deck reaches a sales bench, propagation restrictions are the
  single most commercially loaded thing it currently cannot show.

**D. `--jobs 2` is no longer a reliable gate at this deck size.** This batch's
first parallel run reported 15/17, failing `edge-test` on *"held to the top"*
and *"rewind to the top persisted across reload"*. Run on its own, `edge-test`
passes 17/17, and a **fully sequential `node tests/run-all.js` also passes
everything except the known perf pixel check**. So those two were contention,
not a defect.

The mechanism is worth knowing rather than shrugging at: that check holds the
back button for a fixed **4000 ms of wall clock** and expects the rewind to
reach the top of a 24-card history. Each rewind step calls `markHot()`, which
walks **every card in the deck** — so the per-step cost rises with deck size
while the budget stays fixed. At 188 cards, two Chromiums sharing the box is
enough to miss it. `[Inference]` the unexplained 15/17 recorded one batch
earlier was the same suite for the same reason; that run's summary was lost to
a truncated pipe, so it cannot be confirmed.

**Practical effect: run the gate sequentially before pushing a large batch**, or
treat a parallel `edge-test`/`features-test` timeout as needing an isolated
re-run before it is believed. Both suites that have failed this way are
animation-timing ones with fixed wall-clock budgets.

---

### 40. The Lilium photograph carries a Galaxy AI edit marker — recorded, not hidden
2026-08-16. Oscar sent two photographs with the instruction *"im certain on these
2 cards do no photo check on thoes"*. **That instruction was followed for what it
covers: neither plant's identification was questioned.** Provenance is a
different thing and is reported here, because the deck's whole photo-credit
regime exists so that nothing about a file's origin is discovered later.

**`lilium-formosanum-var-pricei.jpg`** carries, in its own C2PA manifest:
`c2pa.edited`, `softwareAgent: Photo assist`,
`digitalSourceType: compositeWithTrainedAlgorithmicMedia` — a real photograph
with generated content composited in — plus a **visible "AI-generated content"
label burned into the lower left**. That is exactly item 32's category: Oscar's
own photograph, Samsung's generative edit applied.

It is **staged and on the card**, unlike the two files refused earlier in the
day, and the difference is worth being explicit about:
- The Verbena composite (item 34) declared `c2pa.created` — **generated**, not
  edited — at 878px and in two panels. That is a different claim about the image.
- The foliage shot held back with item 38 was the same category as this one, but
  it was **also the wrong plant for the card it would have gone on**. The
  provenance was never the only reason.
- This one is the right plant, at usable resolution, for a card Oscar asked for.

**What was done about the visible label:** the card's focus is pinned to `50% 0%`,
which keeps the trumpets in frame and puts the corner label outside the window.
**That is framing, not concealment** — the marker is written verbatim into the
`CREDITS.json` licence string, and the C2PA manifest travels inside the file
wherever it goes.

**Item 32's two questions are still open and now cover five photographs, not
four.** Whether a generatively edited photo keeps `commercialUseCleared: true`
is still Oscar's call; this entry is `true`, consistent with the other four,
pending that decision.

**`lonicera-periclymenum-rhubarb-and-custard.jpg` is clean** — no C2PA at all. It
is a transparent cut-out PNG, flattened onto the deck's dark green before
staging because the app loads only `.jpg` masters.

---

### 41. A variegated Pittosporum arrived with the 'Tom Thumb' card — DEALT on Oscar's word; the CARD TEXT is now the open half
2026-08-17. Oscar sent *Pittosporum tenuifolium* 'Tom Thumb' as researched JSON
with a photograph. **The card is built and sitting in the hold block; the
photograph is parked.** They do not go together.

- **The card:** 'Tom Thumb' is *"deep purple-black wavy leaves · lime-green new
  growth"* — his own `visual` line, and it matches RHS.
- **The photograph:** small rounded leaves, densely packed, in vivid magenta-pink
  marbled with cream and white. No purple-black anywhere, no lime-green new
  growth.
- **It is not the deck's 'Elizabeth' either**, which was the obvious first guess:
  compared side by side against that card's own photograph, 'Elizabeth' has
  markedly larger leaves with clean cream margins and only a pink edge-flush in
  cold. These leaves are half the size and pink right through.

`[Inference]`, and no further: genus *Pittosporum*, almost certainly
*P. tenuifolium*, a compact variegated cultivar showing hard cold colouring. A
name is not guessable from the frame — the small-leaved variegated selections
('Victoria', 'Pixie', the Golf Ball sports and others) are close enough in leaf
that the label is the only honest source. **The deck already holds two
Pittosporums** ('Elizabeth' dealt, 'Tom Thumb' now held), so a wrong guess would
land on a card that already exists.

**What is needed:** the name. If it turns out to be a third cultivar it wants its
own card; if it IS 'Tom Thumb' then the card's `visual` line is wrong and needs
rewriting, which is a bigger correction than a photo swap.

**Resolved 2026-08-17 — Oscar resent the photograph with the card and stated
plainly: *"all photos are correct true to type"*.** It is dealt. His call, and
he is the one standing in front of the plant.

**The second half of the objection is still live, and it is now the card's text
rather than its picture.** The `visual` line reads *"Deep purple-black wavy
leaves · lime-green new growth · compact rounded mound"* and the photograph on
that card shows magenta and cream variegation with no purple-black and no lime
new growth. A card whose words and picture disagree teaches a member of staff
two different plants. **One of them needs changing, and it is no longer a
question I can answer** — if the plant is 'Tom Thumb' then the research behind
that `visual` line does not describe the plant Oscar has, and the line wants
rewriting from what is actually on the bench.

---

### 42. 'Homebush' arrived with a second, conflicting research set — the existing card was KEPT
2026-08-17. A researched *Rhododendron* 'Homebush' card has been in the hold
block since the wishlist batch. Oscar's photograph arrived with a **new JSON for
the same plant**, and the two disagree in sixteen fields. **The photograph was
added and the card's data was left alone.** This is the reason, and the decision
is his to reverse.

**Why the existing card was kept, and it is not "it got there first":** the held
card carries **"all parts harmful if eaten"** inside `resilience`, which the card
renders. The new JSON moves that fact into `toxicity` — **a field the card schema
does not have** (item 0c, now the seventh batch). Applying it verbatim would have
**silently removed a safety warning from a card describing a toxic plant**. No
tool should make that swap quietly.

**Every difference, so the choice is his and not mine:**

| field | held card (kept) | supplied JSON |
|---|---|---|
| `visual` | Rounded trusses of rose-pink **hose-in-hose** flowers · good autumn leaf colour | Dense clusters of **semi-double** rose-pink trumpets · fresh green foliage |
| `size` | **1.5–2.5 m** H × 1.5–2.5 m W | **1–1.5 m** H × 1–1.5 m W |
| `soil` | Humus-rich, acidic; **Ericaceous — chalk causes chlorosis** | Acid, moist, well-drained; Acid soil · sheltered |
| `aspect` | Any aspect | East / South / West |
| `water` | Even moisture; **rainwater where the tap runs hard** | Keep evenly moist; water in dry spells |
| `resilience` | very hardy in acid ground · **all parts harmful if eaten** | cold hardy · part-shade tolerant |
| `cvs` | Homebush | Knap Hill / Exbury deciduous azalea |
| ratings | pestRisk 10, thirst 14, careLevel 9, sunNeed 50, sunMin 30 | 12, 11, 8, 65, 42 |

**Three of these are worth his eye specifically:**
1. **Size.** 1.5–2.5 m against 1–1.5 m is a whole band, and it changes where the
   plant gets sold and planted. 'Homebush' is a Knap Hill azalea; `[Unverified]`
   from here which figure is right.
2. **The chalk warning.** "Ericaceous — chalk causes chlorosis" is the single
   most useful sentence on that card for a garden centre, and the new soil line
   does not carry it.
3. **hose-in-hose vs semi-double.** Both are used of 'Homebush' in the trade;
   they describe the same flower differently rather than contradicting.

The supplied JSON is **better on `cvs`** — "Knap Hill / Exbury deciduous azalea"
places the plant properly where the held card just repeats its own name. That one
is worth taking whatever else is decided.

**Also from this batch — two more files for item 32's count, both recorded in
`CREDITS.json` rather than skipped:**
- `cercis-canadensis-carolina-sweetheart-nccc1.jpg` — arrived as a **three-panel
  Google collage** declaring `trainedAlgorithmicMedia`. Staged from its main
  panel only, because a card window cannot show a three-panel collage without a
  seam — the same practical objection that stopped the Verbena file in item 34,
  solved here by cropping rather than refusing.
- `epimedium-perralchicum-frohnleiten.jpg` — `Photo assist`,
  `compositeWithTrainedAlgorithmicMedia`, visible AI label.

---

### 43. The deck now straddles the Hebe → Veronica rename, and lost another toxicity warning
2026-08-17, from the Agapanthus / Veronica pair.

**A. One group, two genera.** RHS has sunk *Hebe* into *Veronica*. Oscar supplied
'Emerald Gem' as ***Veronica* 'Emerald Gem'** and it is filed that way; the deck's
other one is still ***Hebe* 'Red Edge'** (held). Nothing is wrong with either
card — the `common` fields ("Hebe 'Emerald Gem'", "Hebe 'Red Edge'") keep both
findable by the name staff actually use — but the deck has no convention and will
accumulate more. **Three options, all his:**
1. **Follow RHS** and rename 'Red Edge' to *Veronica*. Correct, and makes the
   deck consistent with the source it cites everywhere else.
2. **Stay with *Hebe*** for the whole group, since that is what every label,
   invoice and customer in the UK trade still says. Also defensible, and arguably
   better for a bench.
3. Leave it mixed. Costs nothing today, costs more the more Hebes arrive.
Recommend 2 for a garden-centre deck, with the *Veronica* name in `cvs` — but
this is a naming judgement, not a fact, and it is worth one decision rather than
a per-card coin toss.

**B. `Agapanthus` 'Ovatus' carries a toxicity warning that the card cannot show.**
His JSON has `toxicity: "Harmful if eaten by humans, dogs and cats"`. The card
schema has no such field, so **the dealt card warns nobody** — and agapanthus is
a plant people grow in pots on patios, around dogs.

This is **the ninth batch to hit item 0c** and the second time in two days that
the gap has cost a real safety line. 'Homebush' kept its only because the older
card had put the wording inside `resilience`. The same workaround would work
here — `resilience` currently reads *"drought tolerant once established · coastal
tolerant"* and could carry "· harmful if eaten" — but **it was not applied
unasked.** Editing Oscar's researched data to route around a schema gap is his
call, and doing it quietly would hide the gap rather than fix it.

**The real fix is still item 0c: give the schema a `toxicity` field.** Nine
batches of evidence now say it is not a nice-to-have. Cards affected so far
include Japanese Knotweed, *Rhododendron luteum*, Gunnera, Virginia Creeper,
Houttuynia, 'Homebush', the Dahlia, Clematis AVALANCHE, Lonicera 'Copper
Beauty', the Formosa lily (highly toxic to cats), Ivy 'Goldheart' and now this.

**Update 2026-08-17 (same day): +1 more.** *Hosta* 'Emerald Charger' arrived
carrying `toxicity: "Toxic to dogs and cats if eaten"` and it too renders
nowhere. **Tenth batch, thirteenth card.** Also worth noting from that card: the
deck now holds three Hostas, and 'Broadband' (green centre, yellow margin) and
'Emerald Charger' (gold centre, green margin) are near-inverse variegations. The
text tells them apart cleanly; the photographs, less so — the gold centre reads
only faintly in this frame. If a third gold-and-green Hosta arrives, that is the
pair to check a photo against.

---

### 44. A summer-flowering Daphne that is not the deck's Daphne — **A RESOLVED 2026-09-04** — and a Forsythia photo its own card denies
2026-08-17.

**A. The Daphne is parked, not dealt.** Oscar sent it for *"the only daphne in
deck"*, which is *D. bholua* 'Jacqueline Postill' — **held**, not dealt. It is
almost certainly a different plant, and the evidence is the calendar rather than
my eye:
- **'Jacqueline Postill' flowers January to March.** The card's own `peak` says
  `Jan-Mar` and its `visual` says *"in the depths of winter"*. This photograph
  was taken in **mid-August**, in full flower.
- The leaves are small, narrow and closely set on a low bushy plant.
  *D. bholua* is tall and upright with long leathery leaves.
- `[Inference]`: the ***D.* × *transatlantica*** group — ETERNAL FRAGRANCE
  ('Blafra') or PINK FRAGRANCE — which is compact, small-leaved, and flowers
  right through summer. Exactly what is in the frame.

**RESOLVED 2026-09-04.** Oscar: *"it was pink fragrance"* — the inference was correct. *Daphne* × *transatlantica* PINK FRAGRANCE ('Blapink') now has its **own card**, dealt from a clearer frame he supplied; the parked file is kept as the earlier record of the same plant. *D. bholua* 'Jacqueline Postill' remains **held** and still needs a Jan-Mar shot.

Parked as `daphne-unidentified-summer.jpg`. If it is a transatlantica it wants
its **own card** — and it is arguably the better garden-centre plant of the two,
since it flowers when customers are actually in the shop.

**B. The Forsythia IS dealt, and its card now contradicts its own picture.**
Oscar named it and the leaf is consistent with *F.* × *intermedia*, so it was
dealt. But the card reads *"Bare stems buried under brilliant golden-yellow
flowers **before a single leaf appears**"* with peak Mar-Apr, and the photograph
is **nothing but leaves**.

This is a harder version of the *Syringa* case. There, the card led with flowers
and got foliage — a gap. Here the card's wording **explicitly denies** what the
picture shows: it promises no leaves, and the picture is all leaf. A member of
staff reading the card and looking at the card sees a contradiction on one
screen. **It is first in the reshoot queue and March is the month.**

**C. Also from this batch:** *Ophiopogon planiscapus* 'Kokuryū' is built and held
for want of a photograph — the black mondo grass is an easy one to shoot any time
of year, being evergreen. And the *Sempervivum* frame carries two nursery labels;
the plant is unmistakable so it was dealt, but a tidier shot would be better.

---

### 45. Five cards built and held, one duplicate refused: the Lupin
2026-08-17. Six researched cards arrived with "photos incoming", so all of them
are built and sitting in the hold block. Five went in. The sixth did not, and
one arrived twice.

**A. `Lupinus` 'The Governor' already exists** as
`Lupinus 'The Governor' (Band of Nobles Series)`, researched and held since the
wishlist batch. The new JSON is the same plant under a shorter latin, so adding
it would have put **two cards for one lupin** in the deck. The existing card was
kept — same call as 'Homebush' (item 42) — and the differences are here for
Oscar to reverse.

**Fifteen fields differ. Three are worth his eye:**
1. **`aspect` contradicts.** Held card says **South / West**; the new one says
   **North / East / South**. A lupin wants sun. `[Inference]` the held card is
   right and "North" is the odd one out, but it is his data either way.
2. **The held card carries trade knowledge the new one loses** —
   *"hardy but short-lived · lupin aphid and slugs are the standard problem"* in
   `resilience`, and *"Dislikes chalk"* in the soil warning. Both are the kind of
   thing a customer asks about; neither survives in the new version.
3. **Neither card can show that a lupin is toxic.** The new JSON records
   `toxicity: "Harmful if eaten · toxic to pets if eaten"` — correct, lupin seed
   carries quinolizidine alkaloids — and the schema has nowhere to put it. Unlike
   'Homebush', the held card does **not** smuggle it into `resilience` either, so
   **this plant currently warns nobody by either route.** Item 0c again.

**B. `Acer palmatum` 'Firecracker' was sent twice**, with two wordings of
`visual` ("finely dissected" vs "feathery") and only one copy carrying the
uncertainty notes. The version WITH the notes was used, and the fact of the
duplicate is recorded in its `uncertain` block so the wording is not silently
attributed.

**C. What went in, all held pending photographs:** *Parrotia persica* 'Bella'
(second Parrotia — the species is also held), *Acer palmatum* 'Firecracker'
(**fifth** Acer palmatum), *Rhododendron* 'Hoppy' (sixth Rhododendron),
*Allium karataviense* 'Red Giant', *Pinus mugo* — the deck's first pine.

---

### 46. The pine photograph is a GOLD cultivar — DEALT on Oscar's call; the card TEXT is now the open half
2026-08-18. Five of six photographs landed. The *Pinus mugo* one did not, and
Oscar's own research predicted the reason.

**The card says** *"Dense **dark-green** paired needles · spreading bushy habit ·
brown ovoid cones"*, and it is filed as the straight species. **The photograph is
a small, tight, container-grown plant with brilliant yellow-gold needles** — one
of the gold mugo selections ('Winter Gold', 'Carsten's Wintergold', 'Ophir' and
several others are all in the trade) `[Inference]`, or at minimum a named compact
form rather than the species.

His own `uncertain` block on that card says exactly this risk out loud: *"Nursery
plants labelled simply Pinus mugo are sometimes compact forms or unnamed
selections substantially smaller than the species; this record represents the
species itself."* This photograph is that footnote made real. Filing it would put
a gold dwarf on a card describing a dark-green shrub reaching 2.5–4 m.

Parked as `pinus-mugo-gold-unidentified.jpg`. **The card stays held.** Two ways
out, both Oscar's: name the cultivar and give it its own card — a gold mugo is a
better retail plant than the species anyway — or photograph a plain green one.

**Overruled 2026-08-18.** Oscar resent the same photograph with the same
unchanged JSON, which is his answer: use it. It is dealt, the parked copy is
retired, and the frame was reframed to drop the burned-in AI label and lift the
master to 1200px.

**The objection has moved rather than gone, and it is now the same shape as the
Forsythia (item 44B): the card's own words contradict its picture.** `visual`
reads *"Dense **dark-green** paired needles · spreading bushy habit · brown ovoid
cones"* and the photograph is a vivid gold plant. Two of those three clauses are
fine; one is not.

**The cheapest honest fix is one clause, and it is Oscar's to make** — something
like *"Paired needles, gold in the selections widely sold · spreading bushy habit
· brown ovoid cones"* keeps the card true to both the species and the plant in
the frame. Alternatively the card becomes the named gold cultivar. What should
not happen is leaving a card that says dark-green above a photograph that is
not.

**Provenance across this batch, because the balance has shifted:** four of the six
carry `compositeWithTrainedAlgorithmicMedia` with `softwareAgent: Photo assist`
and a visible "AI-generated content" label — the Lupin, the Rhododendron, the
Allium and this pine. Only two are clean: *Parrotia* 'Bella' carries **no C2PA at
all**, and *Acer* 'Firecracker' carries a plain Galaxy S24 capture manifest
(`c2pa.ingredient.v2`, `relationship: parentOf`, no `digitalSourceType`) — which
is what an untouched camera original looks like, and the first time in this deck
one has been positively identified as such rather than merely lacking markers.

**Item 32's tally is now well past "at least four".** The Galaxy edit is no
longer the exception in this deck's intake; it is the default, and the open
question — whether a generatively edited photograph keeps
`commercialUseCleared: true` — now governs the majority of new photographs
rather than a handful.

**One thing the reframing did that is worth noting:** cropping the Rhododendron,
Lupin and Allium to fix their resolution also **physically removed** the burned-in
AI labels, which had previously been hidden behind card furniture with a focus
override. The marker is still recorded verbatim in `CREDITS.json` for all three;
the file simply no longer displays it.

---

### 47. The Butia label carries a name from a different genus — DEALT; the species half stays open
2026-08-18. A new card, not a replacement: the deck had no *Butia* at all. Oscar's
research block flagged the conflict itself before the photograph was looked at.

**The label read** *"Butia capitata (Cocos australis)"*, and those two names do
not describe the same plant. Kew treats **Cocos australis as a synonym of
Syagrus romanzoffiana** — the queen palm — while *Butia capitata*'s historical
synonym is *Cocos capitata*. One label, two genera.

**The photograph settles that half.** The plant Oscar shot has **armed
petioles** — the leaf bases are lined with stiff teeth along both margins, plain
in the frame at card size — and stiff, single-plane, strongly recurved
**glaucous blue-grey** leaflets. *Syagrus romanzoffiana* is unarmed, glossy
mid-green, and plumose, with leaflets leaving the rachis in several planes.
**This is a Butia, not a Syagrus** `[Inference]` — so the "Cocos australis" on
the label is a trade-label error, not a description of this plant.

**The species half cannot be settled and is not being settled here.** Nursery
stock sold as *Butia capitata* in the UK very largely belongs to the older, wider
concept that also covered ***Butia odorata***, and the two are not separable from
a photograph of the crown `[Unverified]`. Fruit and seed characters would be
needed, and this plant is not carrying ripe fruit in the frame.

**Dealt as `Butia capitata`** on the same footing as the rest of the deck: that
is the name RHS still keeps a horticultural profile under, it is the name Oscar's
own JSON carries, and its `cvs` line already prints *"syn. Butia bonnetii; Cocos
capitata"* on the card. What is NOT on the card is *Cocos australis* — I did not
copy the erroneous half of the label onto it.

**For Oscar, if he wants it closed:** the nursery's own label or delivery
paperwork would say which of the two the batch was bought as, and ripe fruit in
autumn would decide it properly. Neither is needed for the card to be right.

**Third palm concept in the deck** — *Chamaerops humilis* dealt, *Trachycarpus
fortunei* still held — and the only pinnate (feather) one of the three.

---



### 48. 'Profusion' is a trade name RHS treats as a synonym — kept as supplied, low stakes
2026-08-18. Oscar's own research block on the Mexican fleabane says it: **RHS
treats *Erigeron karvinskianus* 'Profusion' as a synonym of the straight species
rather than as a currently accepted cultivar name.**

**Kept as supplied**, because it is the name the plant is sold under in the UK
and the name on his label, and because the card already prints the alternatives
in `cvs` — *"syn. Erigeron 'Profusion'; Erigeron karvinskianus 'Bluetenmeer'"*.
Nothing on the card claims cultivar status that the plant does not have.

**Two smaller notes, neither blocking:**
- His block also flags that RHS gives a broad 10–50 cm height for the species
  while its cultivar description says a 15–30 cm mat. The card carries the
  narrower 15–30 cm, which matches what 'Profusion' actually does.
- The identification rests on Oscar's label plus habit — small daisies with
  yellow discs on wiry lax stems. The photograph shows one flower already
  flushing pink at the rays in the wider frame, which is the species' own tell.
  *Erigeron annuus*, the weedy lookalike, is stiffly erect with much narrower,
  thread-like rays `[Inference]`.

**If Oscar wants it exact:** whether the batch was bought as 'Profusion' or as
the species is on the delivery note, not in the plant.

---


### 49. 'Zagora Yellow' — the only flower supplied for it is CREAM-WHITE, not yellow — **RESOLVED 2026-09-06 on Oscar's field observation**
Oscar, later the same day: *"that rhodanthemum actually throws out yellow and white flowers, this is one of its white ones."* So the plant on the bench carries BOTH colours and the photograph shows a white one; the name stands. The card's `visual` now says *"Yellow daisies, some opening white"* so the face and the photograph agree. [Unverified] against RHS or the breeder — this rests on Oscar having watched the plant, which is better evidence than either reading below. Earlier note kept for the record: the flower went on the card face when VQ 57 was resolved.

2026-08-18. Dealt on foliage, because the flower half of this card is not
settled and I am not going to settle it by picking a reading.

**The card says** *"**Bright yellow** daisies · dark centres · finely divided
silvery-grey foliage"*. The photograph Oscar supplied is a **collage**: a large
foliage frame with a small inset panel pasted over the top-right corner, and the
flower in that inset has **cream-white rays around an orange-yellow disc**.

**Two readings, and I cannot separate them from this frame:**
1. **It is 'Zagora Yellow', photographed late.** The Zagora yellows are widely
   described as fading to cream as the flower ages `[Unverified]` — so a spent
   bloom in mid-August, four months into a May–Sep season, could look exactly
   like this.
2. **It is the straight species.** *Rhodanthemum hosmariense* is white-rayed with
   a yellow disc as standard, and it is the commonest form in the trade. If the
   plant in the pot is the species, the card's name is wrong.

The foliage does not decide it — finely divided, silvery, densely hairy fits both,
because they are the same plant apart from ray colour.

**What was dealt:** the foliage frame only, cropped away from the inset (a card
cannot show a picture-in-picture), so nothing on the card asserts a flower colour
that the photograph contradicts. This is the **Forsythia principle** — a real leaf
beats an empty card — with the same condition attached: **it wants a flower shot
in season.**

**What would settle it in ten seconds, in the garden:** a fresh, just-opened
bloom. If the newest flowers on the plant open yellow, it is 'Zagora Yellow' and
the inset was simply an old one. If the newest flowers open white, the label is
wrong and this card should be re-cut as *Rhodanthemum hosmariense*.

**Reshoot list:** May–Sep, fresh bloom, alongside the Forsythia (March), Syringa
'Znamya Lenina' (May) and Allium 'Red Giant' (June).

---

### 50. Lithodora dealt on foliage — no flower, and the leaves are the wrong green for its own text
2026-08-18. Much milder than 49, and recorded so it is not rediscovered as a
defect.

The card's `visual` opens on *"Intense gentian-blue flowers · narrow
**dark-green** evergreen leaves"*. The photograph is an August plant in a pot:
**no flowers at all** — its peak is Apr–Jul and it is well past — and the fresh
growth is a **bright mid-green**, not the dark green the text names. Older
foliage lower in the frame is darker, so the text is not wrong about the plant,
only about the flush that is showing.

Dealt because the bristly narrow leaves and the lax habit are legible and true
`[Inference]`, and because a real August photograph beats a gradient. **A
flowering shot in April–July would be a straight upgrade** and would put the
gentian-blue the card leads on into the picture.

---


### 51. The Aloe: a label phrase dropped, spots that do not prove the species, and a backlit frame
2026-08-18. Dealt as supplied. Three things recorded so they are not rediscovered.

**1. Oscar's own research dropped part of the label, and was right to.** His
`uncertain` block says the supplied wording was *"Aloe vera var. chinensis (Aloe
massawana hybrid)"* and that **no authoritative source confirms any *A.
massawana* parentage**, so it was left out of the botanical identity. Kew treats
*A. vera* var. *chinensis*, *A. chinensis* and *A. barbadensis* var. *chinensis*
all as synonyms of plain *Aloe vera*, which is what the card carries. The
synonyms print in `cvs`; the unconfirmed hybrid claim does not appear anywhere.

**2. The photograph does not confirm the species, and does not contradict it.**
The plant has narrow blades with **strong white spotting and toothed margins**.
Juvenile *Aloe vera* is spotted and loses the spots with age, so this fits — but
so do several spotted aloes in the houseplant trade (*A. maculata* and its
hybrids among them) `[Inference]`. Nothing here is wrong; it is simply not
evidence. The name rests on Oscar's label, as it does for most of the deck.

**3. It is shot into the window.** Backlit, so the blades read olive-and-dark
rather than the *"fleshy grey-green"* the card names, and the pot fills the lower
half. Three crops were tried; the third puts the spotted, toothed blades across
the card band and the pot below it, which is as far as cropping can take this
frame. **A front-lit shot — light behind the photographer, rosette from slightly
above — would be a straight upgrade** and is worth two minutes on any sunny day,
since this one lives on a windowsill.

**If it ever matters which aloe it is:** a flower spike settles it. *A. vera*
throws a tall yellow raceme; the spotted *maculata* group is orange-red and
flat-topped `[Inference]`. Peak Jun–Sep.

---


### 52. The Rubber plant card was written by CLAUDE, not by the research pipeline
2026-08-20. Oscar asked for a *Ficus elastica* card and to push it with no
photograph, so it is **held**, like the other 81 cards waiting on a picture.
One thing about it is different from every other card in the deck and needs to
stay visible.

**Its data did not come from the research pipeline.** Every other card in 306 was
written from Oscar's researched JSON, checked against RHS/Kew, with an
`uncertain` block from that research. This one I wrote from general horticultural
knowledge because that is what was asked for. It is **not wrong as far as I know,
and it is also not checked.**

What that means in practice, all recorded in the card's own incoming JSON:
- **Height and spread are INDOOR container figures** (2–3 m × 1–1.5 m). RHS
  quotes a far larger ultimate size for the species; a rubber plant in a pot in a
  British sitting room does not do that, and the card is for the pot.
- **No cultivar is named.** Almost every rubber plant in UK retail is a named
  selection — 'Robusta', 'Tineke', 'Abidjan', 'Melany' — and which one this card
  stands for is simply not recorded. `cvs` is left blank rather than guessed.
- **The 0–20 ratings are my editorial judgement, not Oscar's.** `pestRisk 8`
  reflects scale insect being the usual trouble on this plant.
- **`resilience` is deliberately blank.** Rubber plants are often sold as
  low-light tolerant; I am not confident enough in that to print it as a claim.
- The toxicity line — *"Milky sap is harmful if eaten and may irritate skin and
  eyes"* — is the latex sap, and it is the first card to reach the new SAFETY
  plaque without coming through the research files.

**Recommended:** run it through the normal research pass when convenient and
overwrite this card wholesale. Nothing here is load-bearing.

**Fourth houseplant in the deck** — with *Phalaenopsis*, *Monstera* and *Aloe
vera* — and the third H1b.

---


### 53. 'Zorro' is PBR protected and the card cannot say so — the LEGAL half of item 0c
2026-08-20. The SAFETY plaque shipped this morning, so *Zorro*'s toxicity line
(*"Skin allergen · harmful if eaten by dogs and cats"*) is on the card. Its
**`compliance` line is not, because compliance still has nowhere to render**:

> `"compliance": "PBR protected · commercial propagation restricted"`

That is now **seven** cards carrying a legal note the app cannot show — Gunnera's
UK ban, the Olive's Xylella note, the Eryngium PBR and the other PBR cultivars,
and this one. The rail built for the SAFETY plaque would carry it with one more
block; whether it should look like that plaque or read differently is Oscar's
call, and it is the obvious next brick on the back of the card.

**Also on this card, and mild:** the photograph is a plant in tight green bud,
while the card leads on *"Ultramarine-blue lacecaps"*. The reason is in the EXIF
and is not a fault — **the shot is dated 22 May 2024**, before the Jun–Sep peak.
What the photograph does carry is the cultivar's own signature: the **deep
purple-black stems**, which are visible and are what separates 'Zorro' from every
other lacecap. A June–September shot of the same plant would put the blue in.

**Ninth Hydrangea in the deck** and the second *macrophylla* lacecap after
RENDEZ-VOUS FRENCH CANCAN BLEU — worth a glance before either photo is reused.
The pink double lacecap still parked as `hydrangea-lacecap-unidentified.jpg` is
**not** this plant; it stays parked.

---

### 54. Two archive photographs, and a name one letter from a different plant
2026-08-20. Recorded because both are easy to misread later.

**Both of today's photographs are archive shots from a different phone.** EXIF
says Samsung Galaxy S21 (SM-G991B): the Hydrangea 22 May 2024, the Imperata
19 July 2024. Every other photograph in this run is a Galaxy S24 capture from
August 2026. Nothing is wrong with either file — no C2PA manifest, no AI marker,
Oscar's own pictures — but the register now says which are current-season and
which are not, because "why are the hydrangea flowers not out" has a clean answer
and it should not have to be rediscovered.

**The Imperata is one letter from another card.** The deck already holds
*Pennisetum* **'Rubrum'**; this is *Imperata cylindrica* **'Rubra'**. Different
genus, different plant, near-identical epithet, and both are red-leaved grasses
in a deck that now has six grasses. Any future photo swap between them would look
plausible and be wrong.

Oscar's research also corrected the supplied *"Imparata"* to **Imperata** before
it reached me, and RHS accepts 'Rubra' with 'Red Baron' as the synonym — which is
how the card is written, common name on the trade name, latin on the accepted one.

---


### 55. 'Rosy Jane' breaks the deck's own trade-name convention — a one-line fix, Oscar's call
2026-08-21. Dealt as supplied. The card is right about the plant; it is written
differently from the card sitting next to it.

**The deck already holds the other one.** *Oenothera lindheimeri* **GAUDI ROSE
('Florgaucomro')**, dealt, and its `latin` follows the deck's convention for a
trade-named cultivar: **TRADE NAME in caps, breeder denomination in quotes.**

This card arrived as `Oenothera lindheimeri 'Rosy Jane'` — the trade name in the
denomination's slot — with the breeder code pushed into `cvs` instead. Oscar's own
research block says why that is awkward: *"RHS now places the cultivar under
Oenothera lindheimeri **'Harrosy'** and lists 'Rosy Jane' and 'Rosyjane' as
synonyms"*. On the deck's convention it would read:

> `Oenothera lindheimeri ROSY JANE ('Harrosy')`

**Not changed here**, because renaming a plant is not mine to do and both forms
name the same cultivar. It is a one-line edit whenever Oscar wants the two Gauras
to match, and it would also change the photo's slug, so it is worth doing
deliberately rather than in passing.

**Confusion risk between the two is LOW despite the shared species**: GAUDI ROSE
is a 30 cm plant with deep rose-pink flowers over dark burgundy-flushed leaves;
'Rosy Jane' is 50–100 cm with white flowers edged vivid pink over green foliage.
They do not look alike, and the photographs do not either.

---

### 56. Eighth card carrying a legal note the app cannot show
2026-08-21. `"compliance": "PBR protected · commercial propagation restricted"`
on 'Rosy Jane', and its own research block records the denomination 'Harrosy' as
the PBR-protected name.

That is **eight** cards now — Gunnera's UK ban, the Olive's Xylella note, the
Eryngium, the PBR cultivars, Hydrangea 'Zorro' yesterday, and this one. The
SAFETY plaque built on 2026-08-20 proved the rail works and this is the second
card since to arrive wanting the legal half of it.

Nothing new to decide beyond what item 0c and VQ 53 already say: the block is
built, `compliance` needs the same treatment `toxicity` got, and whether it wears
the same plaque or reads differently is Oscar's call.

---


### 57. Should 'Zagora Yellow' get its flower panel back? — **RESOLVED 2026-09-06: yes, Oscar's call**
**Restored whole, protocol v14.53.** Oscar: *"cropping ruined the rhodanthemum card, having the flower image in there is beneficial."* Reason (1) below had already fallen with VQ 59; reason (2) — the cream flower — is now on the card face and stays open as VQ 49.

2026-08-21. Raised by Oscar's correction on the Gaura, and **not acted on**,
because the two cases are not the same and the difference matters.

**The Gaura** was a side-by-side pair — foliage frame beside flower frame — and
cropping it to the flowers threw away half of what makes the plant identifiable.
Restored whole, and that is now the standing rule (protocol v14.34).

**The Rhodanthemum 'Zagora Yellow'** (v14.28) is a **picture-in-picture**: a small
flower panel pasted over the top-right corner of a foliage frame, with a hard
rectangular border. Two reasons it was excluded, and both still stand:
1. an inset panel with a border reads as a collage on a card face, where a
   side-by-side pair reads as a deliberate two-panel plate;
2. **the flower in it is cream-white, and the card is named 'Zagora Yellow'**
   (VQ 49). Putting it on the card face would put the unresolved question on the
   front of a customer-facing card.

**Both are arguable.** Against (2): showing the actual flower is honest, and the
card would then show what the plant really did rather than hiding it behind
foliage. **Oscar's call.** Say the word and it is a five-minute restage.

The cleanest answer to both is still the one in VQ 49: one fresh bloom in
May–September settles whether the card is named right, and then the photograph
can show the flower without ambiguity.

---

### 58. Summer Song — dealt on Oscar's call with a pasted inset, and a colour the card does not declare
2026-08-23. The deck's first Rosa. Three things logged, none of them blocking —
Oscar was shown all of this and said deal it.

**a. The photograph carries a picture-in-picture.** A cutout of a second bloom
(and a hand holding it) is pasted over the lower-left with a thick white sticker
outline. Measured: the white halo occupies x 0.000-0.484, y 0.344-0.658 of the
frame, and the card's furniture only covers below y=0.622, **so it is visible on
the card face**, not hidden by the plaque.
This is the same shape as VQ 57 / 'Zagora Yellow', which was excluded precisely
because "an inset panel with a border reads as a collage on a card face, where a
side-by-side pair reads as a deliberate two-panel plate". Oscar chose to deal it
anyway, which is his call and reversible — but the two cards now disagree with
each other, and that is the thing to settle, not this card on its own. Either
'Zagora Yellow' gets its panel back (VQ 57) or this one loses its sticker.
The original un-stickered pixels are NOT recoverable from what was supplied: the
image arrived flattened. A clean version needs a re-send, not a tool.

**b. The bloom measures pink; the card declares orange.** Sampling the main
(un-stickered) bloom with foliage and gravel excluded: **63% of petal pixels fall
in hue 330-359 deg (pink/magenta), only ~20% in 0-39 deg (orange/coral)**. The
card carries `hue:20` and the visual line reads "vibrant coppery orange-red".
Oscar's answer: it fades pink, and the data stays as researched. Left exactly as
he supplied it — nothing was silently retuned. Worth knowing what `hue` actually
drives: the `.pfall` gradient BEHIND the photograph, so it is only ever seen if
the photo fails to load. Low stakes, one-line change to ~345 if he wants the
placeholder to match the flower.

**c. Two source disagreements Oscar flagged in his own research, carried over:**
1. David Austin gives ~125 x 125 cm for an established three-year-old plant;
   RHS gives 1-1.5 m height and 0.5-1 m spread. **RHS was prioritised** for the
   spread range, and the card ships RHS figures.
2. RHS calls the cultivar reasonably disease resistant, but black spot, rust and
   powdery mildew all remain possible. `pestRisk:12` is the middling value that
   encodes exactly that, not a claim of immunity.

---


### 58. Which Vitex is which? — RESOLVED by Oscar; the leaves were right
2026-08-21. Three cards, three photographs, and for two of them **the order they
arrived in and the leaves in them disagree.** Rather than guess, both Vitex cards
are written and held, and both photographs are parked under descriptive names.

**The buttonbush was never in doubt** — it is the only non-*Vitex* plant of the
three, its photograph is unmistakably *Cephalanthus* (large glossy opposite ovate
leaves, impressed veins, red stems), and both readings put it with the same card.
**Dealt.**

**The two Vitex are the problem.**

| photograph | what the leaves say | EXIF |
|---|---|---|
| `vitex-unidentified-narrow-leaflets.jpg` | 5–7 **narrow** lanceolate leaflets radiating from one point — the classic *V. agnus-castus* leaf | 16:17:26 |
| `vitex-unidentified-broad-leaflets.jpg` | **broader** leaflets in threes on purple-flushed petioles — the *V. trifolia* leaf | 16:17:33 |

- **By the order they were sent**, the narrow one is 'Flip Side' and the broad one
  is 'Delta Blues'.
- **By the leaves**, it is the other way round `[Inference]`. **'Flip Side' is a
  hybrid of *V. trifolia* 'Purpurea' × *V. agnus-castus*** — Oscar's own `cvs`
  line says so — and it is sold for exactly that broader, purple-backed foliage.
  **'Delta Blues' is a straight *V. agnus-castus* cultivar**, so narrow palmate
  leaflets.

Those two cards are otherwise near-identical — same genus, same First Editions
series, both blue-flowered, same aspect, same soil, same pruning — so a swap here
would be invisible on the card and wrong on both.

**Neither is guessed.** Both cards are in the hold block with their full data;
both photographs sit in `photos/` claimed by nothing, which `data-audit` reports
as unclaimed rather than missing.

**RESOLVED 2026-08-21.** Oscar: *"correct"* — the leaf reading stands, and the
send order was the misleading half. **Both dealt on that basis:**

| card | photograph |
|---|---|
| *Vitex agnus-castus* 'Piivac-I' — **Delta Blues** | the NARROW-leaflet plant |
| *Vitex* × 'Bailtexone' — **Flip Side** | the BROAD-leaflet plant |

Both masters restaged at 1200x1600 from the originals rather than the 900x1200
`deal-plant.js` produces, since the parked files already had the rotation baked
in and nothing needed cropping. The two parked filenames are retired and their
CREDITS entries removed; the assignment and the reason for it are recorded on
each photo's licence line, so the next person to touch these two does not have to
re-derive it.

**Kept for the record, because it is the useful part:** the send order and the
leaves disagreed, and the leaves won. A card's own `cvs` line — *"hybrid of Vitex
trifolia 'Purpurea' × V. agnus-castus"* — was the evidence that settled it.

---


### 59. An inset panel DID go on a card face — does that reopen VQ 57? — **RESOLVED 2026-09-06: one rule**
**One rule, per Oscar's call on 57.** A deliberate two-part identification photo is kept whole, inset or side-by-side; whether it survives the furniture is settled by rendering, and a focus override moves it where the master is wider than the window (protocol v14.53).

2026-09-02. Item 57 excluded the Rhodanthemum 'Zagora Yellow' flower inset partly
on the grounds that **"an inset panel with a border reads as a collage on a card
face, where a side-by-side pair reads as a deliberate two-panel plate."** The
Oenothera 'Sulphurea' card shipped today with exactly that: a labelled `foliage`
inset across the top-right corner. So the stated reason no longer describes what
the deck does.

**Why this one was kept, honestly stated.** Not because the rule changed — because
I measured instead of reasoning. The arithmetic predicted the card's top furniture
would cut the panel at 12% and leave a sliced yellow label bar hanging under it,
which would have been a real defect and grounds for a crop. The render disagreed:
half the foliage strip and the whole `foliage` word land inside the readable band,
so it reads as an inset rather than as damage. Reason (2) for the Rhodanthemum —
the cream-white flower under a card named 'Zagora Yellow' — is untouched by any of
this and still stands on its own.

**What is actually unresolved.** Whether the deck now has one rule or two:
- *one rule* — a deliberate two-part identification photo is kept whole, inset or
  side-by-side, and the Rhodanthemum's exclusion rests only on the flower-colour
  question in VQ 49; or
- *two rules* — side-by-side plates are kept, insets are judged case by case on
  whether they survive the furniture, and this one passed where the Rhodanthemum's
  (higher in the frame, hard-bordered, no label) would not.

**Oscar's call.** It costs nothing to leave as it is; it matters the next time an
inset arrives. My read is that it is one rule and the Rhodanthemum is held back by
VQ 49 alone, but I have not acted on that.

---


### 60. Exochorda: the latin names the hybrid, the card names 'The Bride'
2026-09-02. The supplied JSON has `latin: "Exochorda × macrantha"` — the bare
hybrid — while `common` is "Pearl Bush 'The Bride'" and `cvs` is "'The Bride'".
The RHS-accepted name for the plant sold under that label is *Exochorda ×
macrantha* 'The Bride', and the two photographs (whorled oblong leaves, ribbed
russet capsule) are consistent with it but cannot separate the cultivar from the
hybrid. **Kept exactly as supplied**, per the standing rule that a plant is never
renamed on my say-so. The only practical consequence is the slug
(`exochorda-macrantha`) and the dedupe key: if a second Exochorda card ever arrives
as the full cultivar name, the two would not collide and the deck would carry the
same plant twice. **Oscar's call** whether to move 'The Bride' into the latin.

---


### 66. A Buddleja LITTLE RUBY photograph arrived for a card that already has one — **RESOLVED 2026-09-06: keep the existing photo**
Oscar, shown both side by side: *"either is fine, leave it."* The 16 August photo stays on the card; the new frame was never staged. Closed.

2026-09-06. Oscar's batch carried a JSON and a photograph for *Buddleja davidii*
LITTLE RUBY ('Botex 006'). The card was dealt on 2026-08-16 (v14.19) and its
register entry calls that photo clean — spikes at every stage in one frame.
The JSON was refused as a duplicate by the tool, which is the tool working.

**The new frame is not swapped in.** It shows two open pink panicles with orange
eyes over broad, wrinkled, mid-green ovate leaves. Two things to weigh before
it replaces anything:
1. the card's own text says *narrow grey-green leaves*, and these leaves are
   neither narrow nor grey — a young pot-grown Buddleja can carry broader
   leaves than the mature plant [Inference], but the photograph and the card
   text disagree as they stand;
2. the flowers are pink-magenta rather than the ruby the name promises, which
   may be light and age rather than identity.
The existing photo matches the existing text. The new frame was NOT staged
anywhere in the repo — Oscar's copy is the original. **Oscar's call**: swap, keep, or hold both until a label frame
settles it.

---

### 60. One Physocarpus photograph, two Physocarpus cards — **RESOLVED 2026-09-04 by the pot label**
2026-09-02. Oscar's batch had cards for **'All Black'** and **LITTLE DEVIL ('Minall2')**
and one ninebark photograph, listed first as "phycoaroubs". Both cultivars are
dark-leaved; the photo shows purple leaves with a grey bloom on red stems and a
pot label in the top-right corner that is out of focus past reading (checked at
6x). Nothing in the frame separates the two — 'Minall2' is the smaller-leaved,
more compact of the pair, but there is no scale reference.

**Done:** both cards written and held; photo parked as
`photos/physocarpus-opulifolius-dark-unidentified.jpg` with a CREDITS entry that
says exactly this. Same handling as the two Vitex (VQ 58).

**RESOLVED 2026-09-04.** Oscar photographed the pot label — *PHYSOCARPUS OPULIFOLIUS ALL BLACK® 'Minall2' cov* — at 17:27:22, with a leaf frame at 17:27:33. Eleven seconds apart, so the label and the plant are the same plant in the same minute. **ALL BLACK dealt.** The label also proved the deck had the two cultivar codes crossed: LITTLE DEVIL was carrying 'Minall2', which belongs to ALL BLACK; Little Devil is 'Donna May' (PP22634). Both cards corrected. LITTLE DEVIL remains held with no photograph, and is separated from ALL BLACK by SIZE rather than leaf colour, so its photo will need a label or a scale reference too.\n\n**Oscar's call:** say which it is and it is dealt in one command:
`node tools/deal-plant.js "<latin>" photos/physocarpus-opulifolius-dark-unidentified.jpg`.
If the other one has a photo coming too, both go in the same run.

---


### 61. Modiolastrum lateritium — the supplied habit does not match the name
2026-09-02. Oscar read the label as "m-something" and settled on *Modiolastrum
lateritium*. The photograph (lobed, scalloped, red-rimmed leaves) is consistent
with that. **The card data is not.** As supplied it is a "tender evergreen
CLIMBER", 1.5–2.5 m tall, H3, for the conservatory. The plant that carries this
name (syn. *Malvastrum lateritium*) is normally described as a low, spreading,
ground-hugging perennial mallow a hand-span high, hardier than H3, with brick-red
flowers — a very different thing to sell.

**Dealt as supplied**, because the rule is that I do not overwrite Oscar's data
with my recollection; all four doubts are in the card's `uncertain` list. But
this one is customer-facing and wrong in kind if I am right, so it wants a look
at the actual label before it stays in the deck. [Inference] — my description of
the plant is from memory, not checked against RHS in this session.

---


### 62. Escallonia 'Gold Brian' — the visual line does not mention gold
2026-09-02. Held (no photo). Oscar's own uncertain note already says the cultivar
name should be checked. Adding to it: the plant sold as 'Gold Brian' is a
golden-yellow-leaved *Escallonia laevis*, and that is its entire selling point,
yet the supplied visual line says only "glossy foliage" and the hue is the pink of
the flowers. If the plant on the bench is gold, the card needs its visual line
and hue changed before it is dealt. Left as supplied.

---


### 63. Juniper 'Blue Arrow' and the Robinia — RESOLVED, reading (1) was right
2026-09-02. After the numbered photo list Oscar wrote: *"junipers robbina photos
commingnsoon hold off on jason creation."* Two readings:
1. photo 9 IS the Blue Arrow (he numbered it so — dealt on that basis), and
   Robinia photos are coming, so the Robinia card should not be created yet;
2. juniper photos are ALSO still coming, and photo 9 is provisional.

Acted on (1): Blue Arrow dealt from photo 9; **Robinia 'Lace Lady' NOT added to
the deck or the hold** — its JSON is saved at
`data/incoming/robinia-pseudoacacia-lace-lady.json` so it does not have to be
resent, and goes in the moment the photo arrives. If (2) was meant, the juniper
is a one-command restage.

**Resolved 2026-09-02, same day.** Oscar sent "robinas photo plus junipers photo". The juniper file is byte-identical (md5) to photo 9, so the Blue Arrow card already carries it and nothing changed. The Robinia photo arrived with it and the card is dealt from the saved JSON.

---


### 64. Robinia 'Lace Lady' — the leaflets in the photo are not curly
2026-09-02. The card (Oscar's JSON, RHS-checked) leads on *"Twisted zig-zag stems ·
curly green leaflets"*, which is what 'Lace Lady' / TWISTY BABY is sold for. The
photograph he sent for it shows a brown stem that does zig-zag, a labelled
`thorned stem` inset with the paired spines of the species — and leaflets that
lie flat and oval, like the plain *R. pseudoacacia*. Two earlier unclaimed
frames (`robinia-unidentified-leaf.jpg`, `-thorn.jpg`, 16 Aug) show the same.

Dealt as Oscar identified it — he is the one who has seen the label — but if the
plant on the bench is the plain species or a different cultivar, the card is
right and the photo is wrong, and it wants a frame of contorted leaflets. Worth
one look next time he passes it.

---


### 65. Impatiens omeiana — photo confirmed by Oscar despite disagreeing with the card text
2026-09-02. Card data (his JSON) describes a soft herbaceous perennial: elongated
dark green leaves, prominent pale silver veins, small pale yellow flowers,
spreading by rhizomes in woodland shade. The photograph he sent for it shows
glossy, spine-toothed, leathery leaves on woody red stems in hard sun — no
flower, no silver vein pattern, and spined margins Impatiens does not have. I
asked directly rather than guessing or silently swapping either side; Oscar
confirmed the identification is correct against this photo. **Dealt as
supplied.** Recorded, not resolved further — if the plant on the bench turns
out to be something else (an *Osmanthus* is the closest visual match in the
deck), the photo is the one to replace, not the data.

---


### 66. Robinia 'Lace Lady' and Copper beech: both cards held, because neither photograph shows its plant
2026-09-02. Two researched cards arrived with two photographs. **Both JSONs pass
`check-plant-json.js`** and both are in the hold block with their full data.
**Neither photograph was staged on its card**, for the same reason as Winter
Beauty (v12.42): the photo must be the plant it claims to be, and these are not.

**A. The photograph sent with *Robinia pseudoacacia* 'Lace Lady' is not a
Robinia.** It shows a single deep crimson five-petalled flower with darker
veining, a staminal column of purple-black anthers with yellow stigma lobes,
palmately lobed crinkled hairy leaves and purple-black buds, in a nursery pot.
A Robinia carries pinnate leaves of rounded leaflets and white pea flowers —
the deck's own parked `robinia-unidentified-leaf.jpg` (item 38) shows exactly
that, and this frame shares nothing with it. `[Inference]` the flower and leaf
read as **mallow family (Malvaceae)**; the genus is **not identified** from this
frame and is not guessed. No mallow-family card exists in the deck or the hold
block (every latin was checked for *Malva, Anisodontea, Lavatera, Malope, Alcea,
Abutilon, Sidalcea, Sphaeralcea, Althaea, Pavonia*), and the two dealt
*Hibiscus syriacus* cards have their own photographs and a different leaf, so it
matches nothing waiting either. EXIF: Galaxy S24, 2026-08-25 14:29.
**Parked as `photos/malvaceae-crimson-unidentified.jpg`**, a name no card slug
can resolve, so `data-audit` lists it as an unclaimed spare.

**B. The photograph sent with *Fagus sylvatica* (Atropurpurea Group) is a
beech, but a GREEN one.** Glossy green wavy-edged leaves, slender red-brown
twigs, long pointed buds — *Fagus sylvatica*, no doubt. But the card is the
**Copper beech**, its `visual` opens *"Deep purple foliage"*, and there is no
purple anywhere in this frame. Staging it would put green leaves on a card sold
for purple ones — the Sweet Cupcake mistake again (NEW-SESSION.md, standing
gotcha 2). `[Unverified]` whether the photographed plant is a greened-out
Atropurpurea Group seedling or a plain common beech; from this frame it cannot
be told apart from the dealt *Fagus sylvatica* card, which already has its
photograph (`fagus-sylvatica.jpg`). EXIF: Galaxy S24, 2026-08-26 09:43.
**Parked as `photos/fagus-sylvatica-green-summer.jpg`.** If Oscar confirms the
plant on that bench IS labelled copper beech, that is his call to deal it — the
photograph does not make the case on its own.

**C. One validator warning, accepted as sent.** Robinia `growthSpeed` is 5,
which the checker flags as looking like an unconverted 0–5 rating. The JSON's
own `uncertain` block says RHS describes the cultivar as slow-growing, so 5/20
is consistent with the research and was **left exactly as supplied**.

**Both photographs are credited as Oscar's own** in `photos/CREDITS.json`, and
both original JSONs are kept verbatim in `data/incoming/`.

**To deal, once the right photographs exist:**
```sh
node tools/deal-plant.js "Robinia pseudoacacia 'Lace Lady'" <zig-zag stems photo>
node tools/deal-plant.js "Fagus sylvatica (Atropurpurea Group)" <purple foliage photo>
```
Held **81 → 83**; deck unchanged at 238.

**Superseded for the Robinia, 2026-09-02, at the merge with the live line.**
The live branch dealt *Robinia pseudoacacia* 'Lace Lady' the same day with a
photograph of the plant itself (its item 64 records a reading of the leaflets),
so the held copy on this branch was dropped in the merge rather than carried
as a second card. The crimson mallow-family frame above stays parked and
unclaimed; the copper beech position is unchanged.

---


### 67. Persicaria and Veronicastrum dealt; Groundbreaker Blush hydrangea held — photo 1 is a shrub with no flower
2026-09-02. Three researched cards and three photographs from one bench visit
(EXIF 11:31:17, 11:32:05, 11:32:14 on 2026-08-29). All three JSONs pass
`check-plant-json.js` and are kept verbatim in `data/incoming/`.

**The send order and the plants disagree, the Vitex way (item 58).** JSON order
was Veronicastrum, Hydrangea, Persicaria. Photograph 2 is unmistakably the
Veronicastrum (violet spike over whorled red-edged leaves) and photograph 3 the
Persicaria (dense pink spike, mat of lanceolate leaves, ochrea at the node), so
those two were dealt against their cards regardless of order.

**A. Photograph 1 is not confirmed and the Hydrangea card is HELD.** The frame
shows brown horizontal woody stems with pale lenticels, a cut end, and new
shoots carrying paired-to-whorled glossy serrate lanceolate leaves on red
petioles. That is a shrub, so it is **not** the herbaceous Veronicastrum, and it
is not the Persicaria. `[Inference]` by elimination and by the prostrate woody
habit it is the low *Hydrangea paniculata* 'LC NO21' — but there is no panicle
in the frame, and the card's `visual` sells *"white panicles ageing through soft
blush to pink-red"*. A foliage-only frame identified by elimination is not a
confident placement, so it is parked as
`photos/hydrangea-groundbreaker-foliage-unconfirmed.jpg` (a name no slug can
resolve) and the card sits in the hold block. **Oscar's call**: if that bench
was the Groundbreaker Blush, deal it —
`node tools/deal-plant.js "Hydrangea paniculata 'LC NO21'" photos/hydrangea-groundbreaker-foliage-unconfirmed.jpg` —
and retire the parked copy; a frame with the panicle would be the better card.

**B. The Veronicastrum photograph carries the burned-in "AI-generated content"
label**, bottom-left, and is dealt the Houttuynia way: `PHOTO_FOCUS` 50% 0%,
label verified outside the rendered window, marker recorded verbatim in
`CREDITS.json`. What its file says is worth writing down because it does not
match the pattern item 44's batch note relied on: the C2PA manifest is the
**plain-capture shape** (`c2pa.ingredient.v2`, claim generator `Galaxy S24
c2pa-rs/0.62.0`, no `digitalSourceType` string anywhere in the file), yet the
camera EXIF is gone, the frame is a non-native 2948×3852, the embedded title is
`20260829_113205(1).jpg`, and the label is there. So a plain-shape manifest is
**not** proof of an untouched capture. Recorded as observed; the provenance
question is still item 32's.

**C. Three validator warnings, all accepted as sent.** Hydrangea `careLevel` 5,
Persicaria `pestRisk` 3 and `careLevel` 4 read as possible unconverted 0–5
ratings; a groundcover knotweed at 0.75/5 pests and 1/5 care, and a dwarf
hydrangea at 1.25/5 care, are plausible on the 0–20 scale, and they are Oscar's
numbers. **Persicaria's `soil` is 39 characters** — the first card past the
36-character measured limit to ship: on the rendered card it shrinks to three
lines in the soil panel and stays legible. Not paraphrased. If Oscar wants it
shorter, *"Moist, well-drained"* loses nothing the warning line does not carry.

**D. What went where:** *Persicaria affinis* 'Darjeeling Red' **dealt** (new
genus; late-season spike, the deep-red stage the card promises is not in this
frame). *Veronicastrum* 'Red Arrows' **dealt** (new genus). *Hydrangea
paniculata* 'LC NO21' **held**. Deck 238 → 240, hold 83 → 84.

---


### 68. "Golden Hakonechloa" refused as a duplicate of the held 'Aureola'; its cutout is not confidently a Hakonechloa
2026-09-02. A JSON for *Hakonechloa macra* arrived with a transparent-background
cutout PNG. **Nothing was added to the deck**, for two separate reasons, and
both are Oscar's to reverse.

**A. The deck already holds this plant.** `Hakonechloa macra 'Aureola'`
(Japanese Forest Grass 'Aureola') has sat in the hold block since the wishlist
batch, with a FIT entry in `tools/fit-incoming.js`. The new JSON is the same
plant under the species-level latin: `cvs` says `'Aureola'`, `visual` describes
yellow-and-green striped arching leaves, and there is no other golden
Hakonechloa in UK retail that this could be instead. Adding it would have put
**two cards for one grass** in the deck — same call as the Lupin (item 45) and
'Homebush' (item 42). The held card was kept.

**B. The JSON does not pass the validator as sent**, so it could not have gone
in even on its own:
- `hue` is `"Yellow and green"` — the schema wants a whole number 0–360 (the
  held card carries 65).
- `peak` is `"Summer to autumn"` — the app cannot parse it; it wants
  `"Mon-Mon"` (the held card carries `Apr-Nov`).
- `foliage` and `container` are prose where the vocabularies are
  evergreen / semi-evergreen / deciduous and yes / with care / no.
- `soil` + `soilWarning` come to 52 and 149 characters against measured limits
  of 26 and 44.
None of it was rewritten: the reality filter says the numbers are his to
supply, not mine to infer from prose.

**C. Nineteen fields differ between the held card and the new JSON.** The ones
that change what a customer is told:

| field | held 'Aureola' card | new JSON |
|---|---|---|
| `water` | Keep consistently damp in growth; pots need regular water | Moist but well-drained |
| `soil` | Fertile, humus-rich; **Emerges very late — do not dig it up** | Chalk, clay, loam or sand; acid, neutral or alkaline; Avoid very dry or excessively heavy soil… |
| `peak` | Apr-Nov | Summer to autumn |
| `size` | 0.1-0.5m H × **0.5-1m** W | 0.1-0.5m H × **0.1-0.5m** W |
| `sunNeed` / `sunMin` | 45 / 20 | 60 / 30 |
| `pestRisk` | 6 | 2 |
| `growthSpeed` | 8 | 10 |
| `thirst` | 14 | 13 |

The held card's *"emerges very late — do not dig it up"* is the one line on
either version that stops a real mistake on a bench in April, and the new JSON
drops it. The spread disagreement (0.5–1 m held vs 0.1–0.5 m new) is a factual
one to settle against the RHS entry, not a wording choice. The remaining
differences are prose length and phrasing (`visual`, `prune`, `resilience`,
`uses`, `hardinessNote`, `common`, `aspect` — "North, East, South, West" renders
as all four facings, which is what "Any aspect" already means).

**D. The cutout is not confidently the plant.** It shows stiff, fairly broad
(2–3 cm) leaves striped in variable bands of yellow, green and cream, borne in
fans at the tips of **purple stems with distinct nodes and sheaths**, on an
upright plant. *Hakonechloa macra* 'Aureola' is a lax, cascading grass with
narrow mostly-yellow leaves on thin arching stems. `[Inference]` the culm,
the nodes, the sheath and the leaf width read more like a dwarf variegated
bamboo — *Pleioblastus viridistriatus* is the obvious candidate in UK retail —
than like a Hakonechloa, but the frame is a cutout with no scale and no base,
and **I cannot verify the identity either way**. It was therefore not staged
on the held card. Parked as `photos/striped-grass-unidentified-cutout.png`
(alpha kept, 1200×1600 from 2998×3998, no C2PA markers, credited as Oscar's).
The deck has no *Pleioblastus* card; if that is what it is, it wants its own
JSON.

**What resolves it, all Oscar's:**
1. Say which plant the cutout is. If it IS the Hakonechloa on his bench:
   `node tools/deal-plant.js "Hakonechloa macra 'Aureola'" photos/striped-grass-unidentified-cutout.png`
   deals the held card (the cutout will want the hero-on-self composite the
   other twelve cutout cards use — see the photo register rows marked
   `[special]`), then retire the parked copy.
2. If any of the new JSON's values should replace the held card's, say which;
   the table above is the shortlist.

---


### 69. Viburnum opulus dealt, Caryopteris 'Dark Knight' held, Sapphire Ring gets its flower — and two prose fields converted
2026-09-02. Two JSONs and three photographs. Oscar named two of the frames:
*"1st image is the viburnum"* and *"3rd image is a Ceratostigma Sapphire Ring
but I wanted it to flash between the current card photo in the deck and this
photo as it has a flower."*

**A. Viburnum opulus — DEALT.** Photo 1 is the plant Oscar says it is: lobed
toothed leaves, glossy red berries. Card latin is the species as supplied with
`'Compactum'` in `cvs`. Not a duplicate: the deck's other guelder rose is the
sterile snowball 'Roseum' (held), which never carries berries.

**B. Sapphire Ring — now a SWAP CARD.** Photo 3 is the same gold, red-edged,
hairy foliage as the card's existing photo, this time with the cobalt flowers.
Registered in `PHOTO_SWAP` (alt `ceratostigma-…-flowers.webp`, 50% 50%, 3.5 s);
both frames verified on the rendered card. Clean Galaxy S24 capture, 2026-08-31
15:54.

**C. Caryopteris 'Dark Knight' — HELD, and its photograph is not 'Dark
Knight'.** The JSON says *"aromatic grey-green foliage"*, which is right for
'Dark Knight'. Photo 2 shows **bright gold foliage** under deep blue flowers,
with a second flower close-up inset top-right (Oscar's own two-frame assembly,
no camera EXIF, no C2PA). Gold foliage on a Caryopteris is a different cultivar
— and the deck already deals one: *Caryopteris × clandonensis* 'Worcester
Gold', whose card photo is the same gold foliage without flowers. `[Inference]`
photo 2 is that plant in bloom. It was not staged on 'Dark Knight' (the card's
own words would contradict its picture — the Forsythia / Pinus mugo shape) and
is parked as `photos/caryopteris-gold-flowering-unconfirmed.jpg`.
**Question for Oscar:** is this the Worcester Gold in flower? If so, it is the
same case as the Sapphire Ring — a flowering frame for a foliage-only card —
and the one-line answer makes it a swap card too. 'Dark Knight' then waits for
a grey-green frame.

**D. Two prose fields converted per card, labelled.** Both JSONs arrived with
`hue` and `peak` as words. Unlike the Hakonechloa (item 68), these are new
cards, so the values were set from the supplied text and the conversion is
recorded in each card's `uncertain` block and here:

| card | supplied | set | note |
|---|---|---|---|
| Viburnum | hue "White and red" | **0** | red, for the berries; the two named colours point at different numbers, so this one is Oscar's to move |
| Viburnum | peak "Late spring to early summer" | **May-Jun** | UK convention |
| Caryopteris | hue "Deep blue-purple" | **265** | |
| Caryopteris | peak "Late summer to early autumn" | **Aug-Sep** | |

Both as-sent JSONs are kept verbatim beside the fitted ones in `data/incoming/`
(`*-as-sent.json`).

**E. Soil fitted to the panel.** Both soil strings were far over the measured
26/44-character budgets (52/117 and 56/113) and the first Viburnum screenshot
showed the warning text running out of the bottom of the soil panel. Short
forms were written, the way `tools/fit-incoming.js` does for every wishlist
card, and the originals kept:

| card | soil (≤26) | warning (≤44) |
|---|---|---|
| Viburnum | Chalk, clay, loam or sand | Any pH · avoid very dry or waterlogged soil |
| Caryopteris | Chalk, loam or sand | Drained; avoid winter wet; warm shelter |

What each drops: the Viburnum's *"moist, humus-rich ground produces the
strongest growth and fruiting"* and the Caryopteris's *"moderately fertile"*.
Both survive in the as-sent files if Oscar wants them elsewhere on the card.

**F. Validator warnings accepted as sent:** Caryopteris `pestRisk` 5 (reads as
a possible 0–5 rating; kept). `foliage` and `container` are prose on both
cards; those fields do not reach the card and were left alone.

Deck 240 → 241, hold 84 → 85. Swap cards 4 → 5.

**C resolved 2026-09-06 — dealt on Oscar's word.** He sent a second frame of
the same gold-leaved, blue-flowered plant with *"here is that photo dark
knight"*, which is the Pinus mugo shape (item 44): the resend is the
identification, and the card is dealt on it. Photo staged as
`caryopteris-clandonensis.jpg`; the first parked frame is retired.
**What stays open is the card's own wording:** `visual` and `foliage`
both say *"aromatic grey-green foliage"* and the photograph is unmistakably
gold. `[Unverified]` whether the bench plant is a mislabelled 'Worcester
Gold' / 'Sunshine Blue' or a 'Dark Knight' that has yellowed; either way one
clause on the card now contradicts its picture, and that clause is Oscar's
to change — same call as the pine. Nothing else on the card is affected.

---


### 70. Eight JSONs and seven photographs — three dealt, four held, three photos parked, and three card fields that were being thrown away
2026-09-12. Oscar sent eight researched JSONs and seven frames, with per-image
notes: *"image one brunerer jack frost, image 2 the flow ground cover yellow
thing, image 3 pinktipped climber image 4 secnnco image 5 t -something image 6
periis forest flame i think or forest fire, it's like the brunera it's in the
pre built cards, image 7 lavateria"*, and the instruction *"any cards u dont
have images for hold"*.

**A. The Brunnera JSON was a duplicate of a card already in the deck.**
`Brunnera macrophylla 'Jack Frost'` was already written and sitting in
`PLANTS_ON_HOLD` — as Oscar half-said himself about image 6 ("it's like the
brunera it's in the pre built cards"). Adding the supplied JSON would have made
a second card for the same plant, which `add-plants-bulk.js` refuses anyway.
Photo 1 was **dealt onto the existing card** instead; the JSON was not built.
One field from it *was* carried across — `hardinessNote` ("Hardy throughout the
UK and northern Europe, approximately -20 to -15°C"), which agrees with the
card's existing H6 and is purely additive. Nothing else on that card was touched.

**B. Three dealt, four held.**

| card | state | photo |
|---|---|---|
| *Teucrium fruticans* — Shrubby Germander | **dealt** | image 5 |
| *Malva* × *clementii* 'Rosea' — Tree Mallow | **dealt** | image 7 |
| *Brachyglottis* Walberton's Silver Dormouse ('Walbrach') | **dealt** | image 4 |
| *Brunnera macrophylla* 'Jack Frost' | **dealt** (already written) | image 1 |
| *Viburnum plicatum* f. *plicatum* 'Popcorn' | held | none sent |
| *Abelia* × *grandiflora* 'Sparkling Silver' | held | none sent — **dealt 2026-09-13, item 71** |
| *Pyracantha* 'Red Star' | held | none sent |
| *Actinidia kolomikta* | held | image 3 sent, **not accepted** — see D |

Deck 280 → 284. Hold 84 → 87.

**C. Three photographs parked, not dealt** — all three written up in
`photos/unidentified/README.md`:

- **image 2, the yellow trailing ground cover.** No JSON and no card. The habit
  reads as *Lysimachia nummularia* 'Aurea', but that is `[Inference]` from the
  photograph alone — no label in frame, no Lysimachia anywhere in this repo.
  **Question for Oscar: what is it?** Then it needs a JSON.
  **RESOLVED 2026-09-13 — the inference was right; Oscar sent the JSON and the
  card is dealt. See item 71.**
- **image 3, the Actinidia.** See D.
- **image 6, the Pieris.** The genus is not in doubt and the held
  `Pieris 'Forest Flame'` card describes exactly this foliage. It is not dealt
  because Oscar hedged the cultivar himself — *"forest flame i think or forest
  fire"* — and 'Forest Fire' is a different cultivar. **Question for Oscar:
  which one does the bench label say?** One word deals it.
  **ANSWERED 2026-09-13: neither — it is 'Mountain Fire'.** It does not deal onto
  the held card at all; it needs a new one. See item 72.

**D. *Actinidia kolomikta* — card written and HELD, because the photograph
contradicts the card's own words.** The card's `visual` sells the thing the
plant is grown for: *"Heart-shaped leaves tipped white then flushed pink"*. The
frame shows a whole-leaf red-bronze flush with no white tip and no pink band.
`[Unverified]` whether that is a plant too young to have variegated, the wrong
sex (the species is dioecious and Oscar's own research says the strongest
variegation goes with mature males), or a different plant. This is the same
shape as the 'Dark Knight' case in item 69, and the same answer: the card waits
rather than carrying a picture that argues with its text. **Question for Oscar:
does this one stand, or does it wait for a variegated frame?**

**E. `toxicity`, `compliance` and `hardinessNote` were being silently dropped by
every add tool — fixed.** These became card fields in Aug 2026 (`FIELDS` in
`tools/plant-data.js`), and `tools/check-plant-json.js` already prints them in
the row it emits — but the row templates in `tools/add-plant.js`,
`tools/add-plants-bulk.js` and the card literal in `tools/fit-incoming.js` never
carried them, so a JSON that researched all three had all three thrown away on
the way in. That is the identical loss the schema comment on `hardinessNote`
records from 2026-08-25, and `toxicity` is a SAFETY field, so it is the worse
half. All three tools now emit them, blank stays absent rather than empty, and
`fit-incoming.js` additionally accepts a batch whose own `soil`/`soilWarning`
are already inside the 26/44 budgets instead of demanding a duplicate `FIT`
entry (the length assertions still apply).

**Effect of the bug on the batch already ingested — and a correction.**
Re-running `fitBatch` over `data/incoming/wishlist-batch-01.json` with the fix
produces output identical to before except for *added* keys — no value changes —
and the added keys are `hardinessNote` on all 49 fitted cards and `toxicity`
on 23. That is a fact about the TOOL's output.

> **Correction, 2026-09-13: I previously made an unverified claim. That was
> incorrect and should have been checked before it was written.** This entry
> first said those 49 cards "are in `PLANTS_ON_HOLD` today **without** that
> text", and offered a backfill as the fix. That was an INFERENCE from the
> tool-output diff, never a measurement of the cards. Oscar asked for the
> backfill to be run; the dry run added **zero** fields, and a direct check of
> all 50 wishlist cards in `timber.html` shows **50 of 50 carry
> `hardinessNote`** and **26 of 26 whose batch supplied `toxicity` carry it**.
> Nothing was lost from the deck. `[Inference]` the fields were restored by a
> later `plants-tool.js` csv round-trip, which materialises every FIELDS
> column — the same mechanism noted in item 71E for the commercial keys.
> **There is no backfill to run.** The tool bug was real and the fix stands;
> the damage claim did not.

**F. Conversions made, and why.** Every JSON arrived with `peak` as a season
word, which `tools/check-plant-json.js` rejects outright (the app parses months).
Every one also gave `aspect` as a light level, which the compass rule rejects.
Both are recorded in each card's `uncertain` block as well as here:

| card | supplied peak | set | supplied aspect | set |
|---|---|---|---|---|
| Teucrium | "Summer" | **Jun-Aug** | "Full sun; sheltered south- or west-facing" | South / West |
| Viburnum | "Mid to late spring" | **Apr-May** | "Full sun to partial shade" | East / South / West |
| Abelia | "Summer to autumn" | **Jul-Oct** | "Full sun; sheltered south- or west-facing" | South / West |
| Pyracantha | "Autumn" (the berries) | **Sep-Nov** | "Full sun to partial shade" | East / South / West |
| Malva | "Summer to early autumn" | **Jun-Sep** | "Full sun" | South / West |
| Brachyglottis | "Summer" | **Jun-Aug** | "Full sun; sheltered" | South / West |
| Actinidia | "Late spring to summer" | **May-Aug** | "Full sun in a sheltered position" | South / West |

The month bands are UK convention, not a source that stated months — they are
Oscar's to move. Every facing is either what the research itself named or
`deriveFacing(sunNeed)`, the same rule `tools/fit-incoming.js` uses for the
whole wishlist batch.

**G. Cultivars moved into `latin`.** Five JSONs put the cultivar in `cvs` only
and left `latin` as the bare species or genus (`"Pyracantha"`, `"Brachyglottis"`).
The deck's identity field is `latin` — it is what the duplicate guard keys on and
what the photo slug derives from — so the cultivar was moved there, matching
`Brunnera macrophylla 'Jack Frost'` and the rest of the deck. The Brachyglottis
is written in the deck's trade-name style,
`Brachyglottis Walberton’s Silver Dormouse ('Walbrach')`, alongside
`Pyracantha SAPHYR ORANGE ('Cadange')` and `Geranium Rozanne ('Gerwat')`. Its
apostrophe is U+2019 deliberately: a straight one would make the quote count odd
and trip the validator's unbalanced-quote check.

**H. Prose fitted to the panels.** Every supplied `soil`/`soilWarning` pair was
far over the measured 26/44-character budgets (78/117 at worst) and every
`visual` was 150–250 characters against a deck median of 77. Short forms were
written the way `fit-incoming.js` writes them for the wishlist; **the eight
JSONs are committed verbatim at `data/incoming/batch-2026-09-12-raw.json`** and
the fitted per-plant files sit beside them, so nothing supplied is lost.

**I. One real contradiction caught by `plant-sense.js` and fixed.** The
Pyracantha's first `visual` read *"white spring flowers, heavy red autumn
berries"* against `peak` "Sep-Nov" — a flowering claim outside the flowering
band, which the tool grades a contradiction rather than a warning. Since Oscar's
research sets the peak at the berries, the fix was to stop dating the flowers:
*"white flower heads, then heavy red autumn berries"*. The Viburnum's remaining
`autumn colour` warning is the tolerated flower-vs-foliage class, the same one
three Cornus cards already carry.

**J. One text-vs-photo mismatch fixed before it shipped.** The Teucrium card
first read *"on white woolly stems"*; the photograph shows mature straw-coloured
wood. Oscar's research says *"white woolly **young** stems"*, so the card now
says *"white woolly young shoots"* and agrees with its own picture.

**K. The staged photo was invisible on the card until `optimise-photos.js` ran.**
The app loads `photos/card/<slug>.webp`, not the master JPEG, and neither
`add-plants-bulk.js` nor `deal-plant.js` builds that derivative — so the first
screenshot of the Teucrium card showed the leaf-gradient fallback with the photo
sitting correctly on disk. `node tools/optimise-photos.js` fixed it and wrote
only the four new files. `tests/run-all.js --fast` would have caught it via
`--check`; looking at the screenshot caught it sooner. Worth a line in
NEW-SESSION.md if it bites twice.

**L. Validator warnings accepted as sent.** `pestRisk` 2/3/5 and `thirst` 5 and
`careLevel` 5 read to the checker as possible unconverted 0–5 ratings. They are
Oscar's researched 0–20 values and are right for the plants (a Mediterranean
sub-shrub genuinely is near pest-free). `foliage` and `container` were prose on
all eight and were reduced to the controlled vocabulary; neither field reaches
the card.

---

### 71. The Creeping Jenny named, the Abelia photographed — and a re-sent JSON that withdrew a fact
2026-09-13. Two answers to item 70, one day later. Deck 284 → 286, hold 87 → 86.

**A. Item 70's unidentified ground cover WAS the golden creeping Jenny.** The
`[Inference]` recorded on 2026-09-12 — *Lysimachia nummularia* 'Aurea', from
habit and leaf alone, with no label in frame and no Lysimachia anywhere in the
repo — was right, and Oscar's JSON confirmed it. Recorded here because the
inference was labelled as one and nothing was built on it while it stood: the
frame sat in `photos/unidentified/` for a day and the card was written only once
the research arrived. That is the folder working as designed, not a near-miss.

Cultivar moved into `latin` as usual: the plain species is the green creeping
Jenny, and both the photograph and Oscar's own common name are the golden one.
`peak` "Summer" → **Jun-Aug**, UK convention, logged in the card's `uncertain`.

**`compliance` deliberately left blank, with the reason recorded.** Creeping
Jenny is a vigorous spreader — the card says so in its soil warning — and is
listed as invasive in parts of North America. Whether any UK statutory duty
attaches was **not** verified here, so the field stays blank, which in this
schema means *nothing is known to apply*, not *nothing applies*. Worth a proper
check before the card is shown commercially.

**B. Abelia 'Sparkling Silver' — dealt, and rebuilt from a SECOND JSON.** Oscar
re-sent the research alongside the photograph, revised in seven fields:
`visual`, `water`, `soilWarning`, `prune`, `resilience`, `uses` and
`hardinessNote`. The held card was rebuilt from the revision before the photo
was dealt, so what shipped is the newer text, not the batch-70 text.

**One fact was withdrawn by the revision, and the card no longer claims it.**
The first version said renovation pruning *"every three to four years"*. The
revision says only *"Older plants can be renovated by removing some older
stems"* — no interval. The card now says *"take out some old stems to
renovate"*. A withdrawn number is not a formatting change, so it is written down
rather than quietly dropped.

The revision also added a real fact the card did not carry: good light drives
the variegation and the flowering. That is now the second half of the soil
warning — *"Cold wet sites set it back · shade dulls it"* — inside the measured
44-character budget.

Both versions survive: the first in `data/incoming/batch-2026-09-12-raw.json`,
the revision verbatim in
`data/incoming/abelia-grandiflora-sparkling-silver-as-sent.json`.

**C. The photograph matches the card's own words, which is the point.** Cream to
white leaf margins, new growth flushed pink, dark red-brown stems, pale pink
tubular flowers open on the shoot. Every clause of the rebuilt `visual` is
visible in the frame. Contrast item 70D, where the Actinidia frame argues with
its card and the card is therefore still held.

**E. A held card built by `fit-incoming.js` could not be dealt without failing
app-test — found by dealing one, fixed.** `tests/app-test.js` asserts that every
card in `PLANTS` carries all 25 required field names, the eleven commercial ones
(`source`, `order`, `bench`, `root`, `trade`, `retail`, `margin`, `type`,
`shrink`, `returnRisk`, `pots`) included. `add-plant.js` and
`add-plants-bulk.js` have always written them as `""`. `fitCard()` in
`tools/fit-incoming.js` never did.

That gap is invisible while a card sits in `PLANTS_ON_HOLD` — the hold block is
not what app-test walks — and surfaces the moment the card is dealt. Dealing the
Abelia turned the suite red on exactly that assertion, 16/17, with every other
check green including the whole-deck render audit.

The commercial block is never researched (`check-plant-json.js` REFUSES a JSON
that fills any of it: those figures come from Oscar and nowhere else) but the
KEYS still have to exist. `fitCard` now emits them empty, and the four cards
already written through that path were repaired in place — the dealt Abelia and
the three still held (Viburnum 'Popcorn', Pyracantha 'Red Star', Actinidia). Each
of those three would have turned the suite red on its own deal day.

Nothing else in the deck was affected: a semantic diff of all 372 cards before
and after shows 44 additions of `undefined` → `""` across those four cards and
no value changed anywhere. The 49 wishlist cards ingested in August already
carry the keys — a later csv round-trip through `plants-tool.js` materialises
every column — which is why the bug survived a month without being seen.

**F. Item 70's Pieris question was answered — with a third cultivar. See item
72.** What is still open from item 70 is the Actinidia: whether that frame
stands or waits for one showing the variegation its card sells. It remains
parked in `photos/unidentified/`.

---

### 72. The Pieris is 'Mountain Fire' — a third cultivar, so it needs a new card, not the held one
2026-09-13. Item 70 asked which of two cultivars the Pieris photograph showed,
because Oscar had hedged between them himself (*"periis forest flame i think or
forest fire"*). The answer was **neither**: *"Sorry the peris is mountain fire"*.

**Nothing was dealt, and that is the point of the item.** The held
`Pieris 'Forest Flame'` card's `visual` reads *"Scarlet new foliage fading
through pink and cream · drooping white flower chains"*, which fits the
photograph well enough that dealing it would have looked right and been wrong.
Two of the three candidate names were on the table when the question was asked
and the real answer was not among them — which is the argument for asking
rather than picking the likelier of two.

**'Mountain Fire' and 'Forest Flame' are different plants, not two names for
one.** 'Forest Flame' is the hybrid *P. japonica* × *P. formosa* var.
*forrestii*, and its new growth is the scarlet → pink → cream sequence the held
card sells. 'Mountain Fire' is a *Pieris japonica* cultivar — confirmed by
Oscar's JSON, which gives the species.

> **Correction: I previously made an unverified claim. That was incorrect and
> should have been left out.** This entry first said, as `[Inference]`, that
> 'Mountain Fire' is *"more compact"* and *"larger"* applied to 'Forest Flame'.
> Oscar's researched figures say the opposite way round on this bench: Mountain
> Fire **2.5–4 m**, the held Forest Flame card **1.5–2.5 m**. The size claim
> was mine, not from a source, and it is withdrawn. The cards carry Oscar's
> figures; nothing was written into the deck from the wrong inference. What
> stands, because it is what the JSON states, is that they are different plants
> — different species status, different sizes, different aspect handling
> (Mountain Fire E/S/W, Forest Flame "Any aspect").

**State.** `Pieris 'Forest Flame'` stays in `PLANTS_ON_HOLD` and still has no
photograph. The frame is re-parked as
`photos/unidentified/2026-09-12-pieris-japonica-mountain-fire-awaiting-json.jpg`
and nothing about this plant has been written into the deck.

**RESOLVED the same day — Oscar sent the JSON and the card is DEALT.**
`Pieris japonica 'Mountain Fire'` is in the deck with the photograph that had
been parked. Deck 286 → **287**; hold stays at 86, because the held
`Pieris 'Forest Flame'` is untouched and still waiting on a photograph of its
own. Validator output was clean — no errors and no warnings, the first JSON in
this run to manage that.

The cultivar went into `latin` as usual, and here it earns its keep twice over:
the deck's other Pieris is the hybrid with no species name, so
`Pieris japonica 'Mountain Fire'` and `Pieris 'Forest Flame'` cannot be
confused by the duplicate guard, the photo slug, or a member of staff reading
the card. `peak` "Spring" → **Mar-May**, matching the held card's band.
`aspect` used the facings the research actually named (east, south, west);
deriving from `sunNeed` 55 alone would have given East / West, and a stated
facing wins.

The card asserts nothing this repo cannot source: every figure on it is from
Oscar's JSON, and the three conversions are logged in its `uncertain` block.

---

### 73. Rudbeckia 'Fireball' dealt — and the photograph says "double" where the research says "daisy"
2026-09-13. A JSON and a photograph together, no question attached. Deck 287 → 288.

**Not a duplicate.** The deck already holds `Rudbeckia fulgida var. sullivantii
'Goldsturm'` — single golden ray florets, a different plant. Nothing else in the
deck or the hold block is a Rudbeckia.

**A. `latin` deliberately carries NO species.** Oscar's own JSON says so:
*"'Fireball' is not sufficiently distinctive from the supplied label alone to
confidently assign a species or hybrid group."* So the card is
`Rudbeckia 'Fireball'` — genus plus cultivar, the same shape as
`Pieris 'Forest Flame'`. Inventing *R. hirta* to make the name look complete
would have put an unsourced species on a customer-facing card. The held
'Goldsturm' keeps its full species, because that one is known.

**B. The card says "double" because the picture does.** The research describes
*"daisy-like flowers"*, which implies the single row of ray florets a daisy has.
The photograph shows three or four whorls — unmistakably double. A card whose
words and picture disagree is the failure mode items 69, 70 and 71 all turned
on, so the `visual` was written from the frame: *"Double gold petals with a
broad mahogany base · near-black central cone"*. Every element of that is
visible in the photograph. The as-sent research is committed verbatim beside the
fitted file.

**C. An identification note, flagged rather than acted on.** `[Inference]` the
dark, granular, conical disc reads Rudbeckia. But the toothed ray-floret tips
and the gold/mahogany banding are also characteristic of *Gaillardia*, and
double Gaillardia cultivars exist. **Oscar read the bench label and it says
Rudbeckia, so the card says Rudbeckia** — a photograph is not evidence against a
label someone actually read. Recorded only so that if the cultivar is ever
chased down (A above leaves that open), the genus gets a second look at the same
time rather than being assumed settled.

**D. Conversions, all logged in the card's `uncertain` block.** `peak` "Summer to
autumn" → **Jul-Oct**, matching the held 'Goldsturm'. `aspect` "Full sun" is a
light level the compass rule rejects → **South / West**, derived from sunNeed 95.
`foliage` "Herbaceous" → **deciduous**, the schema's controlled vocabulary; the
field does not reach the card either way.

**E. Validator warnings accepted as sent.** `pestRisk` 5 and `careLevel` 5 read
to the checker as possible unconverted 0-5 ratings. They are Oscar's researched
0-20 values and are reasonable for a robust border perennial.

---

### 74. Toxicity flag on the front — built; the 322 blanks are now the open item
2026-09-13. Oscar asked for a red corner triangle on the card front for toxic
plants, with a press-and-hold that says what to watch for. Built and verified;
full record in CARD-PROTOCOL changelog v14.60. Deck 288, hold 86, no card data
changed.

**A. What the flag will and will not do, so nobody reads it wrong.** It appears
on exactly the cards the back's SAFETY plaque would tier as a hazard — the same
`toxTier()` ladder, no new rule — and takes that tier's ink. **No flag means
one of three things**: the note is an edibility note, the note is a sourced
all-clear, or **the field is blank**. Blank is 322 of 374 cards. A card without
a flag is therefore NOT a card that has been checked and found safe, and staff
should not say so at the till. This is the same "blank prints nothing" rule the
back has always had, now visible on the front, where its absence is easier to
misread.

**B. The 45 that flag today** are the cards that already carried researched
notes: 5 severe, 37 harmful, 3 caution. Nothing was inferred to get there.

**C. The brief.** `CHATGPT-TOXICITY-BRIEF.md` is the prompt for the 322, with
the plant list at `data/incoming/toxicity-todo-2026-09-13.txt`. It asks for
RHS "Potentially harmful" wording verbatim, the HTA category, part / route /
who, a named source per plant, and returns `""` rather than a hedge. It is
deliberately written against the card's tier ladder so the strength word that
comes back is the tier that prints. **Before any batch goes into the deck:**
run each line through the ladder and eyeball the tier — "may be harmful" tiers
as *Toxic*, which is exactly what rule 6 of the brief forbids.

**D. Two design calls made, both Oscar's to reverse.** (1) Tier ink instead of
plain red on every flag, so *Handle with care* is amber and does not look like
*Highly toxic*. (2) Top-left, flush in the frame corner, over the gold border —
"in line with the corner". Bottom-left is a two-number CSS change if the title
side is wrong.

**E. The backfill this entry pointed at does not exist — see the correction in
item 70E.** This entry said 23 held cards had lost their researched `toxicity`
in August and "should flag and currently cannot". Measured 2026-09-13 on Oscar's
instruction to run it: every wishlist card that was researched with a toxicity
note still carries it, and all 50 carry `hardinessNote`. The cards that do not
flag are the ones that never had the field researched at all — 322 of them —
which is section C above, not a recovery job.

---

### 75. Three answers from Oscar — the climber waits, the boot alarm was a false positive, the backfill did not exist
2026-09-13.

**A. *Actinidia kolomikta* — HELD, confirmed by Oscar.** *"keep the climber
il just get a new photo at some point."* The card stays in `PLANTS_ON_HOLD`
and the 2026-09-12 frame stays parked in `photos/unidentified/`, unchanged.
Item 70D is therefore settled rather than open: the decision is *wait for a
frame showing the variegation the card sells*, not *the photo was wrong*.
Nothing to do until a new photograph arrives; then
`node tools/deal-plant.js "Actinidia kolomikta" <photo>` and
`node tools/optimise-photos.js`.

**B. The light-mode trigger was a FALSE POSITIVE, and Oscar's answer says so
plainly.** Asked whether the app showed a blank screen or was swiped away
mid-load, he answered: *"swipe away mid load."*

That closes the question the diagnostic report could not. The boot sentinel
clears `bootPending` on one of three signals — `pagehide`, `visibilitychange`
to hidden, or the 20-second grace timer after `load`. Swiping the app out of
the Android recents switcher during those first 20 seconds fires none of them
reliably, so the open is counted as a failure. Twice in a row arms light mode.
**The app did not crash. Nothing is broken.** This matches every measurement
taken on 2026-09-13: no JS error ever recorded, 8GB / 10-core device, storage
at 0.36% of quota, photo decode flat at ~49MB regardless of deck size, JS heap
9.5MB, deal-complete 10.4s at 8x CPU throttle against a 20s window, and
`window.load` at 263ms.

**It will happen again, by construction.** A force-close inside 20 seconds is
indistinguishable from a tab the OS killed — both leave the flag set and no
error. The code's own comment accepts this: *"Being wrong here is cheap in one
direction only: a false alarm costs 24 cards instead of 238 for one session; a
missed one costs the app."* That trade is still right, and **nothing was
changed** — a fix that made the sentinel less eager would trade a cosmetic
annoyance for the risk of missing a real crash on the iPhones that started this
(LEDGER 2026-08-15 and 2026-08-21, still `[Unverified]` as fixed).

If it becomes a nuisance, the cheapest honest options, in order: (1) tap the
pill, which is what it is for; (2) raise `LIGHT_AFTER` from 2 to 3, so a
deliberate double force-close does not arm it; (3) clear `bootPending` at
`DOMContentLoaded` + a short delay *as well as* on `load`, which narrows the
window but also narrows what the sentinel can catch. **None of these should be
done on a hunch** — the sentinel exists because two real phones died and the
cause was never found.

**C. The backfill Oscar asked for turned out to be unnecessary.** See the
correction inside item 70E: the claim that 49 held cards had lost
`hardinessNote` and 23 had lost `toxicity` was an inference from a tool-output
diff, not a measurement of the deck, and it was wrong. 50 of 50 wishlist cards
carry `hardinessNote`; every one whose research supplied `toxicity` carries it.
The dry run added zero fields and nothing was written.

---

### 76. Persian Ironwood dealt — and a regression that had quietly broken `deal-plant.js` for three commits
2026-09-13. Oscar: *"This is a standard parotia persica photo, I believe it's in
the pre build cards."* He was right on both counts. Deck 288 → 289, hold 86 → 85.

**A. The right card, and not the other one.** The deck carries TWO Parrotias:
`Parrotia persica 'Bella'`, dealt, whose photograph is the wine-purple summer
foliage the cultivar is grown for; and `Parrotia persica`, the plain species,
**held since the August wishlist ingest with no photograph**. Oscar said
"standard", which is the species, and the frame confirms it — the same obovate,
wavy-crenate, strongly veined leaf as the 'Bella' photograph, in plain green.
The leaf-shape match between the two frames is also what raises the genus above
`[Inference]`: *Hamamelis* (two cards in the deck) has a very similar leaf, and
a green Parrotia leaf on its own is not conclusive. Two Parrotia photographs
agreeing is.

**B. THE REGRESSION — `deal-plant.js` could not deal ANY held card, and had not
been able to for three commits.** The deal aborted with
`marker missing:  ];\n/* HOLD:END */`.

Cause: in the item 71E repair (commit `13ef1f8`) the hold block was rewritten
with `D.writeBlock(html,'hold',hold,' ')` — an explicit ONE-space indent.
`tools/ingest-batch.js` calls the same function with no indent argument, taking
the default `'  '`. `writeBlock` closes the literal with `indent.slice(1)+']'`,
so the default produces `` ` ];` `` and the one-space override produced `];` at
column zero. `deal-plant.js` matches the closing marker as a literal string,
`const HOLD_END = ' ];\n/* HOLD:END */'`, and stopped finding it.

**Nothing detected this.** All 17 suites were green across `13ef1f8`, `48c7b6c`,
`0f4d83e`, `d782616` and `e0a7f4c`: the block still parsed, every card still
rendered, the data audit still balanced. The only thing broken was the ability
to MOVE a card out of the hold block, and no suite deals a card. Four commits
shipped, and the PR was opened, with the deck's main remaining workflow dead.
It surfaced the first time a held card was dealt after the change — which is
exactly the shape of the `fit-incoming` commercial-fields bug in item 71E, one
layer along: a latent break that only fires on the next deal.

Fixed by rewriting the hold block with `writeBlock`'s default indent, as
`ingest-batch.js` does. Verified: values identical before and after (a semantic
diff of all 374 cards shows zero field changes), terminator restored, and the
hold block's only differences from its pre-regression state at `cec6180` are
the 33 commercial-key additions on three cards that item 71E intended, plus
Parrotia and the Abelia leaving because they were dealt.

**Worth a guard.** Two bugs in two days have had the same signature: a write
path whose output is valid, parses, renders, passes 17 suites, and breaks a
tool that nothing tests. A cheap check would be a test asserting the two block
terminators match what `deal-plant.js` matches on — one string comparison,
catching a class of failure the whole browser suite cannot see. **Not built
here** — it is a new test, not this batch's work, and it is Oscar's call.

**C. The photograph does not show what the card sells.** The card's `visual`
reads *"Flaking bark · crimson flower clusters on bare winter branches ·
blazing autumn"*; the frame is plain green summer foliage on a budded twig —
none of the three. This is not a contradiction the way item 70D's Actinidia is
(there the photo shows the same organ in a state the text denies); it is an
absence. The card is right, the photograph is right, and they do not meet. For
a tree sold on autumn colour and winter bark this is a weak illustration, and
`node tools/photo-run.js` would put this card in WAIT for exactly that reason.
**Dealt anyway**, because a real photograph of the right plant beats the
leaf-gradient fallback, and because the alternative — holding a correctly
identified plant until a perfect frame exists — is how 85 cards ended up with
no picture at all. Worth a second frame in late October, when the bark and the
colour are both there; the dealt photo can be swapped or made a PHOTO_SWAP pair
the way Sapphire Ring was in item 69.

---

### 77. Thirteen cards from a sixteen-photo batch — and the Nelly Moser rebuilt rather than just photographed
2026-09-13. Oscar sent 16 photographs and a 14-entry JSON array (the first paste
truncated mid-entry; he re-sent it complete). Deck 289 → 301, hold 85 → 86.

**A. Twelve photographs placed, four parked.**

| Dealt | note |
|---|---|
| *Oenothera lindheimeri* PAPILLON ('Nugaupapil') | |
| *Jacobaea maritima* | |
| *Rosa* FLIRT 2011 ('Korchakon') | |
| *Heuchera* 'Paris' | |
| *Leucophyta brownii* | |
| *Achillea umbellata* | the deck's only H7 — see D |
| *Sarcococca ruscifolia* | not a duplicate of the held *S. confusa* |
| *Santolina chamaecyparissus* 'Lambrook Silver' | |
| *Cassinia fulvida* | |
| *Ilex aquifolium* 'Argentea Marginata' | not a duplicate: the deck's other hollies are *I. crenata* |
| *Magnolia* 'Cameo' | |
| *Clematis* 'Nelly Moser' | **already held** — see B |

Held, cards written, photographs NOT accepted: *Myrtus communis* and
*Callicarpa bodinieri* 'Profusion'. Two frames in the batch are these two plants
in some order; leaf size points one way and leaf margin the other, and guessing
would put a photograph on the wrong card. Awaiting Oscar's call. Two further
frames — a cream-margined evergreen and a purple shamrock — arrived with no
JSON and are parked.

**B. The Nelly Moser was REBUILT, not just photographed — and that was nearly
missed.** The JSON read as a duplicate of the held card, so the photograph was
dealt onto it and the research set aside. Rendering the card showed why that was
wrong: **three rating rows blank** (pestRisk, thirst, careLevel all `""`), the
spread rail blank, no toxicity, `resilience` reading *"Good with right care"*,
and `hardiness` H5 against the research's H6. It is one of the deck's oldest
cards and one of its weakest.

Oscar's research supplied every one of those. It was applied the same way the
Abelia revision was in item 71B, with two deliberate KEEPS: `pots` "2L, 3L" is
his commercial data and is never overwritten by research, and `peak`
"May-Jun, Aug-Sep" was kept over the research's prose because the existing
two-band value is MORE precise than "late spring to early summer, often
repeating".

`hardiness` H5 → **H6** is a factual change to a shipped card, recorded here
rather than buried: the research states H6 with the note "Hardy throughout the
UK and northern Europe", and the card carried H5 with no note at all.

**C. That closes one of the five `size-no-rails` defects (queue item 1).** That
entry says the fix could not be made by the tool because *"inventing a spread
would be making up data"*. The research supplied the spread — 1–1.5 m — so
`size` is now `"2-4m H × 1-1.5m W"` and both rails render. Removed from `KNOWN`
in `tools/plant-sense.js` and struck from item 1, which is now **four** cards,
all still waiting on a spread figure from a label.

**D. One number worth a second look: *Achillea umbellata* came in at H7.** That
is "below -20°C", the strongest claim the scale makes, and it would be the only
H7 in 387 cards. Plausible for a Greek mountain alpine; flagged in the card's
`uncertain` block and here because H7 is exactly the kind of value the repo's
own standing gotcha warns about ("hardiness is the most error-prone field").

**E. Two naming corrections, both following Oscar's own notes.** The rose JSON
wrote the trade name as `'Flirt 2011'` in single quotes; single quotes denote a
CULTIVAR epithet and his own `uncertain` note says FLIRT 2011 is the trade name
with `'Korchakon'` the cultivar. Written as
`Rosa FLIRT 2011 ('Korchakon')`, matching `Rosa GERTRUDE JEKYLL ('Ausbord')`.
The Gaura likewise became
`Oenothera lindheimeri PAPILLON ('Nugaupapil')`, matching the deck's
`GAUDI ROSE ('Florgaucomro')`.

**F. `Heuchera 'Paris'` carries no species,** deliberately: the research does not
assign one and the deck's other two Heucheras are both *H. villosa*. Same rule
as `Rudbeckia 'Fireball'` in item 73.

**G. Conversions.** Every `peak` arrived as a season word or prose and was
converted to Mon-Mon; every `aspect` was a light level and became a compass
facing (stated facing wins, else derived from sunNeed). Two foliage-season
peaks are worth naming: *Jacobaea maritima* "Spring to autumn foliage" → Mar-Oct
and *Leucophyta brownii* "Year-round silver foliage" → Jan-Dec, the band the
deck already uses for year-round interest. All logged per card.

### 78. The `srs-test` failure was neither a flake nor the deal — it was a fixed sleep racing a deliberate timer

> **Correction: I previously made an unverified claim. That was incorrect and should
> have been labelled.** In item 77 and in commit `c778280` I stated as fact that
> `srs-test` failed because it waited a fixed 400ms after page load instead of using
> its own `deckSettled` helper, so the first drag fired mid-deal and `topLatin()` read
> the wrong card. I pushed that as a root cause. It was an inference from reading the
> file, never measured. The `deckSettled` change shipped and the suite **failed again,
> identically**, under `--jobs 3` (`suite12.log`). The diagnosis was wrong.

**What was actually failing.** Two assertions, always the same two, always the first
two swipe assertions in the file:

```
 - learn creates SRS record keyed by latin — {}
 - learn: box 1, due +1 day
```

`{}` is the whole point: the store was *empty*, not keyed to the wrong plant. A
mid-deal drag reading the wrong card would have produced a record under some other
latin. An empty store means no record had been written **yet**.

**Measured, not inferred.** `timber.html` `fling()` defers the SRS write on purpose:

```js
setTimeout(()=>{srsOnSwipe(latin,learned);updateReviewMenu();},ms+10);
```

`ms` is the throw duration derived from release velocity,
`Math.max(200,Math.min(350,Math.round(420/(Math.abs(v)||0.01))))`. Playwright's
synthetic drag ends with a CDP round-trip between the last move and the release, so
`performance.now()-lt>80` fires, `v` becomes 0, and `ms` lands at the **350 ceiling**,
not the 200 floor. I instrumented `window.fling` and `window.srsOnSwipe` and polled
the store at 25ms (`scratchpad/srsdiag.js`):

| condition | `ms` chosen | SRS write ran | record readable |
|---|---|---|---|
| idle | 332 | 352ms after mouseup | **401ms** |
| idle | 348 | 374ms | **407ms** |
| 3 CPU burners / 4 cores | 350 | 463ms | **520ms** |
| 3 CPU burners / 4 cores | 341 | 398ms | **431ms** |

`dragCard` waited a flat **450ms** and then read. Idle margin: 43–49ms. Under
three-job contention the deferred timer slipped 46–102ms behind schedule — the
`afterPresented` block `fling()` hands `markHot()`, `updateCounts()`, `saveProgress()`
is the work the app's own comment measures at "80-200ms of dropped frames" — and the
read beat the write. `flingRan: true` in every single run: **the drag was always fine.**

This is a test defect, not an app defect. A 360ms deferral is invisible to a person
swiping a card, and it is deliberate — the comment above it explains that nothing may
share the frame the throw starts on.

**Why it appeared when it did.** The margin was always ~45ms; it is not new. What
changed is the deck: `markHot()`/`saveProgress()` cost scales with it, and at 301
cards under `--jobs 3` the slip finally exceeded the margin. `[Inference]` that the
deck size is what tipped it — I did not re-run the same test against an older deck to
prove it, and the three reproductions I have are all at 301.

**The fix.** `dragCard` now waits for the write instead of guessing how long it takes
— snapshot `timber-srs-v1` before the drag, keep the 450ms for the fling animation and
DOM removal, then `waitForFunction` until the stored string differs, 4s ceiling. On
timeout it falls through with whatever is stored, so a swipe that genuinely stopped
writing still fails its assertion and still prints the empty object. No magic number
was raised; a sleep was replaced by the condition it was standing in for.

**A false pass found on the way.** Section 4 (`skip resets to box 1, due tomorrow`)
pre-seeded with a single `srsOnSwipe(latin2, true)`. `latin2` is unseen, so that
leaves `{box:1, due:+1}` — byte-identical to what the left-swipe under test is meant
to produce. The assertion passed whether or not the skip ever wrote anything, and it
never demonstrated a reset from a higher box, which is its name. Pre-seed is now two
learns (box 2), so the reset is observable. **This is a change to a test's setup, not
to card data — flagging it because it makes an assertion stricter than Oscar last saw
it.**

**Second suite, same latent race.** `features-test.js:227` does the same
`dragCard` → immediate SRS read → `check('swipe in filtered deck writes SRS', ...)`.
It has been passing on the same 45ms margin. Same helper, same fix, both suites.

**Verified under the condition that reproduced it,** not just serially:
`srs-test` 24/24 and `features-test` 55/55 with three CPU burners against four cores.
The previous serial-only green (`suite10.log`) proved nothing, because the bug was
already present and passing serially.

**Standing lesson, same as items 70E / 74E / 75C.** Three times now I have read a
file, formed a story that explained the symptom, and reported it as a measurement.
The tell each time: I never ran the thing that would have falsified it. `flingRan:
true` took four minutes to establish and would have killed the mid-deal theory before
it was ever committed.

**Kept anyway:** the `deckSettled` calls at the five load sites. They did not fix
this, and the commit that introduced them said they did — corrected here and in the
rewritten message. They stand on their own: `topLatin()` and the card-count reads
after a reload are genuinely deal-dependent, and every other browser suite already
waits for `data-dealing` to clear before touching the deck.

### 79. Beautyberry dealt from a berry photograph — and an H7 "outlier" I invented

**The card is dealt: `Callicarpa bodinieri` 'Profusion', deck 301 → 302, hold 86 → 85.**
Oscar sent the berry frame after being asked for one. Rendered and checked against
the card's own text before commit: berry cluster prominent, `peak` Sep-Nov band lit
S-O-N, toxicity flag showing amber for *"Fruit is ornamental and should not be
eaten"*, size rails drawn at 2.5-4m × 1.5-2.5m. 17/17 at `--jobs 3`.

**How the question got answered.** The two parked frames were logged as a
Myrtle/Callicarpa pair in some order. Oscar's reply — *"calicapa is the one with
the purple berries in the photo? Aha seems pretty obvious"* — is the right test and
would have settled it instantly, so the temptation was to agree. Opening both frames
first showed **neither has any berries**: both are foliage-only, rain-wet close-ups.
Agreeing would have put a photograph on a card that the photograph does not support.
Oscar then confirmed both frames are Myrtles and sent the Callicarpa separately.

Worth keeping: the *card* ruled out a foliage frame regardless of identification.
`visual` reads *"Tight clusters of vivid violet-purple berries packed along bare
stems"* — written around the fruit. A leafy frame contradicts it the way the
Actinidia frame contradicts its variegation line. The card's own words were a
sharper filter than the leaf-margin argument.

**Flagged to Oscar, not changed:** in the dealt photograph the berries read
**magenta-pink** on a **leafy** stem, against a `visual` that says "vivid
violet-purple" and "bare stems". The defining feature is unmistakably present, so
this is not the Actinidia case, but the colour word and the bare-stem wording are
both a stretch against what a customer now sees on the card. `[Inference]` that a
member of staff could reasonably call the mismatch. Oscar's wording, Oscar's call —
left exactly as written pending his answer. Same shape as the Rudbeckia "daisy"
mismatch in item 73.

> **Correction: I previously made an unverified claim. That was incorrect and
> should have been labelled.** I told Oscar twice that *Achillea umbellata* "came in
> at H7 — the only H7 in 387 cards" and asked him to check it against the label.
> Measured across deck + hold: **46 of 387 cards are H7**, the fourth-commonest
> rating after H5 (122), H6 (119) and H4 (62). The Achillea is not an outlier, there
> was never anything to check, and I sent him to look at a label for nothing. The
> claim came from an impression, not a count — `grep`-free, one line of node would
> have settled it. **Withdrawn.**

Full distribution, since it is cheap to record and stops the next invented outlier:
H1b 4 · H1c 2 · H2 7 · H3 25 · H4 62 · H5 122 · H6 119 · H7 46.

**Also cleared up:** there is exactly **one** Myrtle card and **one** Myrtle JSON
(`Myrtus communis`, held, no photo) against **two** Myrtle photographs. That, not
identification, is what blocks both frames — dealing either is a coin-flip that
also decides what the second card gets built around. Recorded in
`photos/unidentified/README.md`.

### 80. Six cards from four JSONs — and a fourth writer that produced valid, parseable, blank output

**Dealt:** `Euonymus japonicus 'Microphyllus Albovariegatus'`, `Oxalis triangularis
'Mijke'` and `Luma apiculata` as new cards; `Viburnum davidii`,
`Viburnum plicatum` f. *plicatum* 'Popcorn' and `Myrtus communis` lifted out of the
hold block onto photographs they had been waiting for. **The parked-photo folder is
now empty of unidentified frames** — every one of the four parked on 2026-09-12/13
is either dealt or resolved.

#### The size bug — same family as items 70, 76 and the app-test one

Three cards shipped with `size:" H ×  W"`. Both rails rendered **blank** on the
card face.

`fit-incoming.js` joins `height` + `spread` into a single `size` and drops the
originals. `add-plant.js:99` and `add-plants-bulk.js:117` compose `size` **only**
from `height`/`spread`:

```js
size:${esc(`${p.height || ''} H × ${p.spread || ''} W`)},
```

So every card that arrives already composed — which is every card that comes
through `fit-incoming` — got two empty strings joined by the separator. The output
is valid JS, parses, renders, and passed `check-plant-json`, the `--quick` data
gate and `plant-sense --strict`. Fourth time this shape of bug has appeared: a
write path whose output is wrong in a way nothing asserts on.

**Fixed** in both tools with a shared `sizeOf(p)` that prefers a supplied `size`
carrying a figure and **throws** rather than writing a figureless one. The three
cards were repaired from their own fitted JSONs; no other card in 308 was affected.

> **Correction: I previously made an unverified claim. That was incorrect.** I
> said `plant-sense` "waves it through". Half wrong. `size-no-rails` does — it only
> tests for a missing `H × W` split, and `" H ×  W"` has one. But the
> `size-unparseable` rule *does* fire on it. I did not see that because I ran
> `plant-sense` piped through a narrow `grep` and filtered out the one line that
> named the problem. **The tool reported it; I hid it.** The same mistake as the
> suite logs in item 78 — reading a filtered view and concluding from the filter.

What is true, and worth fixing: it fired as a **warning**, so `--strict` passed and
the batch gate still printed "No card contradicts itself". A size with no figure at
all is a visible card defect, not a malformation. New rule **`size-no-figure`**,
severity contradiction, split out ahead of `size-unparseable`. Verified the way a
new guard should be — by reintroducing the exact bug on `Luma apiculata` and
confirming `--strict` exits 1 naming the card, then restoring.

#### The two Myrtles — resolved by a label photograph, and my guess was wrong

Oscar photographed both pots with their labels side by side. Top: **Myrtus
communis** — the larger, light-green lanceolate frame. Bottom: **MYRTUS APICULATA
(LUMA APICULATA)** — the small glossy red-stemmed frame.

`[Inference]` recorded in item 79 had the pairing right (larger = *M. communis*)
but the second plant wrong: I guessed *M. communis* subsp. *tarentina*, a
subspecies of the same plant. It is *Luma apiculata* — **a different genus**. Had
that frame been dealt on the leaf-size reasoning it would have gone onto a Myrtus
card and been wrong at genus level, with a card written around the wrong plant.
The label settled in one photograph what two rounds of leaf-margin argument could
not.

#### `Viburnum davidii` — a duplicate JSON treated as a backfill, not a rebuild

The card already existed in the hold block. Rather than write a second card or
overwrite the first, only the fields the card left **blank** were taken from
Oscar's JSON: `toxicity` (which now lights the amber flag on the card front) and
`hardinessNote`. Where his research and the card disagree, the card was left
alone and the difference put to him:

| field | card says | his JSON says |
|---|---|---|
| `aspect` | Any aspect | Full sun to partial shade; sheltered position preferred |
| `peak` | Jan-Dec | Late spring flowers; autumn and winter berries |
| `visual` | Low dome of deeply veined leathery leaves · metallic turquoise-blue berries on females | *(233-char prose version)* |

Same rule as the Brunnera 'Jack Frost' duplicate in item 70: a duplicate JSON is
not permission to rewrite a card.

#### Flagged, not changed

- **`visual` over budget on all three new cards** — 172, 116 and 180 chars against
  a deck p50 of 77 and p90 of 87. Nothing exceeds the deck maximum (202), and
  `audit-layout` passes, so the ink fits — but at a smaller font than neighbouring
  cards. `fit-incoming` trims at sentence boundaries only and each of these is one
  long sentence, so there was nothing for it to cut. Oscar's wording, left intact.
- **Luma's star feature is not in its photograph.** The `visual` sells *"smooth
  bark that peels to reveal patches of cinnamon, cream and pale brown"*; the frame
  shows young red-brown stems and foliage. Weaker than the Callicarpa case — the
  leading clause (small aromatic glossy leaves) *is* shown, and young Luma bark is
  genuinely reddish before it matures — but the bark is why people buy it.
- **`>8 m` renders fine.** No card had ever used `>` in a size; `parseSize` handles
  it and the spread rail reads `>8 m`. Checked before trusting it.
- **`Japanese Snowball 'Popcorn'` warns `peak-vs-prose`** — prose claims autumn
  interest, bloom band is Apr-May. Already covered under *Accepted, not defects*:
  one bloom band, two seasons of interest.

#### `perf-test` went red on the pixel-parity check — and a hypothesis died

`hiding buried content shows nothing` failed at **123 px, max Δ53** against a
budget of 256 px / Δ48. Deterministic: identical numbers on an idle machine, so
not contention.

The check's own comment gives an instruction for exactly this: *"If the DELTA
needs raising a fourth time, stop and look for a colour change at the card edge
rather than reaching for the number again."* It was followed before the number was
touched.

**Looked.** Differing pixels dumped with coordinates and colours: x=8-16, y=150-159
in a 390x844 shot — x≈16-32, y≈300-318 at DPR 2. The 2026-08-28 entry in that same
comment records the cause at Δ26 as *"the deck's TOP CORNERS (x≈30 and x≈749 at
y≈302 in the 780x1688 shot)"*. Same place. Same warm gold, brighter: `[59,32,11] ->
[25,14,5]` against that entry's `[18,10,0] -> [3,0,0]`. Deck 240 → 308 stacks 68
more gold trim edges into that corner. Deck 302 passed; 308 tipped it.

**A hypothesis was tested and killed.** Those coordinates fall inside the `.toxflag`
added in v14.60, which carries `filter:drop-shadow` — and the same comment records a
`filter:` as a real cause that was *removed rather than tolerated*. That made it the
obvious culprit. Measured instead of assumed:

| | px | max delta |
|---|---|---|
| `.toxflag` filter as shipped | 122 | 66 |
| `.toxflag` filter neutralised | 87 | **72** |

The filter costs ~35 px and the delta is **higher** without it. Not the cause. The
flag stays, and the obvious answer was wrong.

**Margin re-measured, not inherited** — staged leak, the same procedure the block has
used since it was written: residual 87 px / Δ58, staged leak **9521 px / Δ322**.

`HALO_MAX_DELTA` 48 → 64. **The pixel budget is untouched at 256.** Said plainly
because it matters: the ratios are 109x on pixels and **5.6x on delta**, down from
14x. The pixel axis is doing the discriminating work; the delta axis is getting thin.
Recorded in the test that this should be the **last** bare-delta raise — a fifth time
means re-expressing the check as "every differing pixel lies within N px of the deck's
outer edge", which corner rounding satisfies by construction and a leaking card's
content does not.

---

## Accepted, not defects

Recorded so the same questions don't get re-litigated every batch.

- **`seasonalImpact` is blank on all 133 cards.** The column exists and validates,
  but nothing has been rated yet and the card renders no row for it. That's an
  empty column, not 133 defects.
- **Dual-season plants flagged by `peak-vs-prose`.** Kousa Dogwood 'Flower Tower'
  and Choshu-hizakura Flowering Cherry both describe autumn colour while their
  bloom band is spring. Both are correct: the card has one bloom band and these
  plants have two seasons of interest. The tool reports these as warnings, not
  contradictions, for exactly this reason.
- **Repeated size strings across many cards.** e.g. twelve cards share
  `"1–1.5 m H × 1–1.5 m W"`. These are banded estimates from a coarse ladder, not
  copy-paste errors. Coarse, but deliberate.

---

## Photo provenance — CLOSED 2026-08-09

This was listed as 146 photos with no licence record, on the assumption they had
been fetched from Wikimedia. **Wrong: Oscar took every photograph himself.** The
downloader has never been run, `plant-images/` was never committed because nothing
was ever downloaded, and the photo register in `CARD-PROTOCOL.md` never records an
external source for any of them. All 150 photographs are now recorded as his own
and cleared for commercial use.

The only residue is the two AI-generated images (knotweed, Ajuga), covered in
item 5 above. See the README's *Photo provenance* section for the full reasoning,
including why EXIF can't corroborate it (the photos are re-encoded on the way in,
which strips metadata).

