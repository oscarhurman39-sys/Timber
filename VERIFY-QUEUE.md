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

### 4. Two cards added 2026-08-09 need real photographs

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

### 5. Unidentified photo supplied 2026-08-09

A third photograph arrived with those two: opposite lance-shaped leaves under white
panicles, with a small purple flower in the background. It is the only one of the
three with no AI provenance markers and the largest at 2084×2834, but it matches
neither of the plants it came with. Most consistent with *Phlox paniculata*
(white). **Which plant is it for?** No card has been made from it.

---

## Accepted, not defects

Recorded so the same questions don't get re-litigated every batch.

- **`seasonalImpact` is blank on all 135 cards.** The column exists and validates,
  but nothing has been rated yet and the card renders no row for it. That's an
  empty column, not 135 defects.
- **Dual-season plants flagged by `peak-vs-prose`.** Kousa Dogwood 'Flower Tower'
  and Choshu-hizakura Flowering Cherry both describe autumn colour while their
  bloom band is spring. Both are correct: the card has one bloom band and these
  plants have two seasons of interest. The tool reports these as warnings, not
  contradictions, for exactly this reason.
- **Repeated size strings across many cards.** e.g. twelve cards share
  `"1–1.5 m H × 1–1.5 m W"`. These are banded estimates from a coarse ladder, not
  copy-paste errors. Coarse, but deliberate.

---

---

## Photo provenance (separate from card facts)

146 of the 152 photos have no committed licence record — see `photos/CREDITS.json`
and the README's *Photo provenance* section. They were fetched by a tool that only
searched Wikimedia Commons and refused NC/ND licences, so they are very likely
fine; the records were just written to a gitignored directory and lost. This is a
paperwork gap, not a card-data gap, and it only becomes urgent if the deck is ever
shown commercially.

