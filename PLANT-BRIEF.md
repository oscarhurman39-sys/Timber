# Timber — Plant Research Brief

**Paste everything above the APPENDIX line, then name your plant.**

You are researching one plant for **Timber**, a plant-knowledge app used by staff on
the floor of a UK garden centre. Return **one JSON object** in the schema below.

Your only job is accurate plant data in this exact shape. The card's layout, icons and
styling are built and locked — do not describe or comment on them.

---

## THE THREE RULES

1. **Never invent.** Unknown field → `""` (or `null` for numbers), and name it in
   `uncertain` with why. A blank is correct. A plausible guess is a defect that
   reaches a customer, and this deck has shipped several.
2. **UK context.** RHS hardiness bands, UK flowering months, UK retail reality.
3. **Ratings are 0–20 integers.** Not 0–5, not 0–1. The validator rejects a value
   above its ceiling and *warns* on any 0–20 field scoring 1–5, because that is
   almost always a 0–5 answer in a 0–20 box. A `pestRisk` of 4 means "trouble-free".
   If you meant "quite prone", that is **14**.

---

## OUTPUT — one JSON object

Every key here reaches a card, except the four marked **record only**, which are kept
as the research record and render nowhere. Nothing else is wanted: keys outside this
list are dropped silently, so answering them is wasted work.

```json
{
  "common": "Red Hot Poker",
  "latin": "Kniphofia 'Pyromania Orange Blaze'",
  "hue": 28,

  "hardiness": "H5",
  "hardinessNote": "Hardy in most places throughout the UK, approximately -15 to -10°C.",

  "height": "75 cm",
  "spread": "60 cm",

  "peak": "Jul-Oct",
  "visual": "Torch-like orange-red spikes over grassy foliage · long season",

  "pestRisk": 3,
  "thirst": 4,
  "careLevel": 6,
  "growthSpeed": 12,
  "sunNeed": 88,
  "sunMin": null,
  "pest": "",

  "aspect": "South / West",
  "soil": "Free-draining",
  "soilWarning": "Winter wet rots the crown",

  "water": "Low once established",
  "prune": "Cut spent spikes; tidy foliage in spring",

  "toxicity": "No known hazard.",
  "compliance": "",

  "cvs": "'Flamenco' – shorter · 'Bees' Sunset' – soft orange",
  "resilience": "Drought and wind tolerant once established; dislikes winter wet",
  "uses": "Borders · gravel gardens · coastal · cut flowers",

  "foliage": "deciduous",
  "container": "with care",
  "uncertain": ["every field left blank or judged, and why"],
  "sources": ["where the facts came from"]
}
```

**Record only — answer briefly, they render nowhere:** `foliage`, `container`,
`uncertain`, `sources`. `uncertain` is the most valuable of the four and is read by a
human every batch; `foliage` and `container` are kept in case a card row is built for
them.

**Never send these.** `source`, `order`, `bench`, `root`, `trade`, `retail`, `margin`,
`type`, `shrink`, `returnRisk`, `pots` are the owner's buying and trade data. The
validator **rejects the whole file** if any of them is filled. Never produce prices,
margins, suppliers, order weeks or stock risk.

---

## HARD LIMITS — measured, not stylistic

| Field | Warns over | **Rejected over** | Why |
|---|---|---|---|
| `soil` | 26 chars | **36** | narrow painted parchment strip |
| `soilWarning` | 44 chars | **60** | overflows into the warning triangle below it |

Write the short version in the field and put the detail in `uncertain`. Nearly every
batch supplied so far has broken this — one arrived at 114 and 160 characters.

Other rejections: `hue` outside 0–360 or not a whole number · `hardiness` outside
`H1a H1b H1c H2 H3 H4 H5 H6 H7` · any 0–20 score above 20 · `sunNeed`/`sunMin` above
100 · `aspect` containing a light level · `soil` and `soilWarning` restating each other
· a missing `common`, `latin` or `hardiness`.

**NO CITATION MARKERS ANYWHERE.** Never append reference numbers or footnote markers
to a value. A value ending `"...in summer or autumn. 0"` prints a stray digit on the
card. Sources go in `sources`, nowhere else.

---

## RATING SCALES — 0–20 integers, higher = more of the named thing

Each renders as five icons in quarter steps, so 4 points = one full icon.

**pestRisk** — more prone to pests and disease.
`0–3` bulletproof (Choisya, Abelia) · `8–10` occasional aphid or mildew ·
`14–16` needs watching (roses) · `18–20` chronic (box blight).

**thirst** — needs more water.
`0–3` drought-proof (lavender, Sedum) · `4–6` low (Kniphofia) · `10–12` average
border · `16–20` constantly moist (Hydrangea, bog plants).

**careLevel** — more work: pruning, deadheading, staking, feeding, lifting.
`0–3` plant-and-forget (grasses) · `6–8` light annual tidy · `12–14` regular
pruning (roses) · `18–20` high-maintenance (dahlias, topiary).

**growthSpeed** — faster to establish.
`0–4` very slow (Acer palmatum, box) · `8–12` steady (most shrubs) ·
`16–18` fast (Buddleja) · `20` rampant (Leylandii).

**sunNeed** *(0–100)* — position on shade→sun. `0` deep shade, `50` part shade,
`100` the most sun possible in an open spot on a median day.
**sunMin** *(0–100, optional)* — the lower edge of light it tolerates. Drives the
card's "wiggle room" marker. `null` if you cannot state it.

**hardiness** — the RHS band. **Check every plant; never assume H5.**
`H1a/b/c` glasshouse · `H2` tender, no frost · `H3` half-hardy (−5 to 1 °C) ·
`H4` hardy, average winter (−10 to −5) · `H5` cold winter (−15 to −10) ·
`H6` very cold (−20 to −15) · `H7` below −20.

---

## SAFETY — `toxicity` and `compliance`

These two carry consequences the other fields do not. 87 of 394 cards have a toxicity
note and 21 have a compliance note; the rest are blank, which is the single largest
gap in the deck.

### `toxicity` is printed VERBATIM

It appears on the card back under SAFETY and again in the press-and-hold panel on the
card front. Whatever sentence you write is the sentence a seventeen-year-old reads out
to a customer. Prose, not notes.

**The card picks its warning tier by keyword. Anything non-empty that matches no
keyword falls through to an amber "Handle with care" by accident** — live on five
cards today, including *"Thorns can injure skin"*.

| Tier shown | Flag | Must contain one of |
|---|---|---|
| **Highly toxic** | red | `highly toxic` · `highly poisonous` · `particularly dangerous` · `particularly poisonous` · `potentially dangerous` · `fatal` · `deadly` |
| **Toxic** | orange | `toxic` · `poison` · `harmful` · `cyanogenic` · `should not be eaten` · `not edible` · `do not eat` |
| **Handle with care** | amber | `irritant` · `irritat…` · `sap` · `allerg…` · `spine` · `sharp` · `glove` · `hairs` |
| **Edible parts** | none | `edible` — any toxic word outranks it, which is the safe order |
| **No known hazard** | none | the phrase `no known hazard` |
| *(blank)* | none | **BLANK IS NOT AN ANSWER** — it renders identically to safe |

**A worked example of the trap, from this brief's own earlier wording.** The example
value used to be `"No specific toxicity warning required"`. That sentence declares the
plant safe — and contains `toxic` inside *toxicity*, so it matches the **Toxic** rung
and puts an **orange hazard flag** on a card saying there is nothing to worry about.
The match does not read your meaning. Write to the table, not around it.

Answer all of these inside the sentence:

- **Which part** — whole plant, berries, seeds, sap, roots, bulb, leaves?
- **By what route** — eaten, skin contact, eye contact, smoke if burnt?
- **Who is at risk** — children, dogs, cats, horses, livestock?
- **What actually happens** — mild stomach upset, blistering, hospital?
- **If genuinely benign, write "No known hazard."** Do not hedge and do not leave it
  blank. `""` beats "may be harmful"; `"No known hazard."` beats both.
- **One or two sentences.** It is printed, not filed.

### `compliance` is about the law, not health

- **Schedule 9** of the Wildlife and Countryside Act — illegal to plant or cause to
  grow in the wild?
- **Plant breeders' rights / PBR** — illegal to propagate for sale? Give the number.
- **Plant passport** needed to move or sell it?
- **Biosecurity restriction** — Xylella host, ash dieback, an import ban?
- Anything else that could cost the business money or a prosecution.

If none apply, leave it `""`. Unlike `toxicity`, blank is a fine answer here.

---

## FIELD RULES

- **`aspect`** — a **compass facing only**: `"South / West"`, `"East"`, `"Any aspect"`.
  Never a light level. "Full sun" is a `sunNeed` value, not an aspect. If no source
  states a facing, write `"Any aspect"`. **The validator rejects light levels here.**
- **`soil`** — soil type and drainage only, from: free-draining · well-drained ·
  moisture-retentive · reliably moist · boggy · loam · clay · sand · chalk ·
  acid/ericaceous · neutral · alkaline · any pH.
- **`soilWarning`** — a real constraint, **not** a restatement of `soil`. "Winter wet
  rots the crown", "Shelter from frost". The validator rejects a restatement.
- **`water` vs `thirst`** — `thirst` is the number (how much), `water` is the sentence
  (how and when). Do not repeat the same phrase in both.
- **`peak`** — `"Mon-Mon"` only. The app parses it and wraps the year end, so
  `"Sep-Feb"` is valid. For non-flowering interest — berries, bark, autumn colour,
  year-round foliage — use the months of **that** feature and say which in `visual`.
  A plant with two seasons gets **one** band: choose the season it is *sold* on and
  name the other in `visual`.
- **`visual`** — one line, **about 90 characters**, separated by `·`. What it looks
  like and when. This is the line that sells the plant, so lead with the feature
  someone buys it for.
- **`hue`** — HSL hue 0–360 of the dominant feature: red 0 · orange 30 · yellow 55 ·
  green 120 · blue 210 · purple 275 · pink 330.
- **`hardinessNote`** — a plain sentence naming the band in words *and* the °C range,
  e.g. *"Hardy in most places throughout the UK, approximately −15 to −10°C."* It is
  printed verbatim in the hold-down panel on the hardiness shield.
- **`cvs`** — notable **sibling cultivars of the species**, `·` separated, with a few
  words each on how they differ. Put this plant's own registration in `compliance`,
  not here. Where the plant is sold under a trade name over a raw cultivar code
  (`'ES14'` sold as SWEET CUPCAKE), record **both**, clearly labelled.
- **`height` / `spread`** — separate fields; the tooling joins them into the card's
  size rails. A spread is required for the rails to draw. `">8 m"` is acceptable.
- **`pest`** — the **single biggest** pest or disease as a KEY, or `""`. It picks the
  icon on the "Pests & diseases" row; the pests a plant actually gets belong in
  `resilience`. **Only `slugs` is valid today.** Anything else falls back to the
  default red spider mite, which 392 of 394 cards show and which is a fair generic.
  Leave it blank unless one problem plainly dominates.

---

## BEFORE YOU ANSWER, CHECK

- [ ] Hardiness verified, not assumed
- [ ] Every 0–20 rating is an integer on the **0–20** scale, not 0–5
- [ ] `aspect` is a facing or "Any aspect", never a light level
- [ ] `soil` ≤26 chars and `soilWarning` ≤44 (hard limits 36 / 60)
- [ ] `soil` and `soilWarning` do not repeat each other
- [ ] No value ends in a citation number
- [ ] `peak` is `Mon-Mon`, and is the season the plant is sold on
- [ ] `toxicity` contains a tier keyword, or says "No known hazard." — **a non-empty
      line matching nothing becomes an amber flag by accident**
- [ ] `toxicity` names the part, the route, who is at risk and what happens
- [ ] `compliance` checked against Schedule 9, PBR, plant passport, biosecurity
- [ ] `pest` is blank or `slugs`
- [ ] No commercial field filled — the file is rejected outright if one is
- [ ] Everything unknown is blank **and** listed in `uncertain`

---
---

# APPENDIX — NOT PART OF THE PROMPT

Everything below is for whoever maintains Timber. Do not paste it into a research
tool; it is about producing card art, not plant data.

## Adding a pest icon

`pest` is a key into the `PEST` registry in `timber.html`. Only `slugs` exists.
Planned and **not yet valid** — using one fails `node tools/check-boot.js` rather than
silently showing the wrong icon: `aphid`, `vine-weevil`, `caterpillar`, `scale`,
`mildew`, `blight`, `whitefly`, `sawfly`, `lily-beetle`, `rust`, `black-spot`,
`honey-fungus`, `browsing`.

Three steps, no code:

```sh
NODE_PATH=/opt/node22/lib/node_modules node tools/fit-pest-icon.js <drawing.png> aphid --margin 2
NODE_PATH=/opt/node22/lib/node_modules node tools/optimise-art.js
# then add   aphid:'art/pest/aphid.webp'   to the PEST registry in timber.html
```

`fit-pest-icon.js` crops to the drawing's own alpha bounds and squares it by the
longer edge, so the family holds one optical weight whatever size the art arrives at.
It warns if the art is too soft or was scaled up too far.

**Art direction**, which the slug meets and a first pack did not: the slot is
**76 × 77 px in the plaque art, about 29 CSS px on the card, about 26 px on a phone.**
At that size only the silhouette survives. Match the baked red spider mite — compact,
one dominant body shape, thick dark outline, glossy painted finish, two or three
tones, no fine detail, no text, no faces, specimen plate rather than mascot. Diseases
are drawn as an **affected leaf** (powdery bloom, dark blotch, orange pustules) so
they stay distinguishable from insects at that size. Deliver square, centred,
transparent PNG; 1000px+ is plenty.

## Fields that exist in the card schema but are not requested above

- **`seasonalImpact`** — specified in `CARD-STATS.md` as a 0–20 rating, but the stat
  row it feeds (`powerSeasonal`) **was never built**. Blank on all 394 cards; filling
  it would change nothing. Keep it out of the brief until the row exists.
- **The eleven commercial fields** — Oscar's own trade data, never researched.

## Keeping this file honest

This brief drifted out of step with the app for months: it asked for eighteen keys
that render nowhere, omitted `compliance` entirely, and its own `toxicity` example
would have put an orange hazard flag on a plant it was calling safe. Nothing compared
the two. If it drifts again, the symptom is the same — research effort spent on fields
that never appear, and card fields nobody is asked for.
