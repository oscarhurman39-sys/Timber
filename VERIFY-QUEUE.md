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
`Clematis 'Nelly Moser'`, `Clematis 'Purpurea Plena Elegans'`,
`Clematis montana var. rubens`, `Evergreen Clematis` (*C. armandii*),
`Russian Vine` (*Fallopia baldschuanica*).

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

### 44. A summer-flowering Daphne that is not the deck's Daphne — and a Forsythia photo its own card denies
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


### 49. 'Zagora Yellow' — the only flower supplied for it is CREAM-WHITE, not yellow
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


### 57. Should 'Zagora Yellow' get its flower panel back?
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


### 59. An inset panel DID go on a card face — does that reopen VQ 57?
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

