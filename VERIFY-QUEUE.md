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

## Needs a horticultural call (Oscar)

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

