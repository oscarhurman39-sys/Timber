# Timber — Plant Research Brief (paste this whole file, then name your plant)

You are researching one plant for **Timber**, a plant-knowledge app for UK
garden-centre staff. Return **one JSON object** in exactly the schema below.

This replaces sending any design or template document. Do not describe the card,
the layout, the icons or the styling — those are already built and locked. Your
only job is accurate plant data in this exact shape.

---

## THE THREE RULES

1. **Never invent.** If you don't know a field, set it to `""` (or `null` for
   numbers) and list it under `uncertain`. A blank is correct; a plausible guess is
   a bug that reaches a customer.
2. **UK context.** RHS hardiness bands, UK flowering months, UK retail reality.
3. **Ratings are 0–20 integers** (see the scales). Do not use 0–5 or 0–1 —
   converting between scales is where errors creep in.

If the plant has a **registered cultivar code sold under a trade name**
(e.g. `'ES14'` sold as `'Sweet Cupcake'`), record both.

---

## RATING SCALES — 0–20 integers, higher = more of the named thing

Each renders as 5 icons in quarter steps, so 4 points = one full icon.

**pestRisk** — higher = more prone to pests/disease
`0–3` bulletproof (Choisya, Abelia) · `8–10` occasional aphid/mildew · `14–16`
needs watching (roses) · `18–20` chronic (box blight).

**thirst** — higher = needs more water
`0–3` drought-proof (lavender, Sedum) · `4–6` low (Kniphofia) · `10–12` average
border · `16–20` constantly moist (Hydrangea, bog plants).

**careLevel** — higher = more work (pruning, deadheading, staking, feeding, lifting)
`0–3` plant-and-forget (grasses) · `6–8` light annual tidy · `12–14` regular
pruning/deadheading (roses) · `18–20` high-maintenance (dahlias, topiary).

**growthSpeed** — higher = faster to establish
`0–4` very slow (Acer palmatum, box) · `8–12` steady (most shrubs) · `16–18` fast
(Buddleja) · `20` rampant (Leylandii).

**sunNeed (0–100)** — where it sits on shade→sun. `0` deep shade, `50` part shade,
`100` the most sun possible in an open spot on a median day.
**sunMin (0–100, optional)** — lower edge of the light it tolerates. Drives the
card's "wiggle room" marker. Leave `null` if you can't state it.

**Hardiness** — RHS band, check every plant, never assume H5:
`H1a/b/c` glasshouse · **`H2`** tender, no frost · `H3` half-hardy (−5 to 1 °C) ·
`H4` hardy, average winter (−10 to −5) · `H5` cold winter (−15 to −10) ·
`H6` very cold (−20 to −15) · `H7` (below −20).

---

## OUTPUT — one JSON object, exactly these keys

```json
{
  "id": "kebab-case-latin-slug",
  "common": "Red Hot Poker",
  "latin": "Kniphofia 'Pyromania Orange Blaze'",
  "registeredCultivar": "",
  "series": "",
  "hue": 28,

  "hardiness": "H5",
  "hardinessNote": "why this band, if it needed a judgement call",
  "height": "75 cm",
  "spread": "60 cm",
  "maturity": "about 3 years",

  "peak": "Jul-Oct",
  "bloomMonths": [7, 8, 9, 10],
  "visual": "one line, max ~90 chars: what it looks like and when",

  "pestRisk": 3,
  "pest": "",
  "thirst": 4,
  "careLevel": 6,
  "growthSpeed": 12,
  "sunNeed": 88,
  "sunMin": null,

  "aspect": "Any aspect",
  "soil": "Free-draining",
  "soilWarning": "Avoid winter waterlogging",

  "water": "Low once established",
  "prune": "Cut spent spikes; tidy foliage in spring",
  "feed": "",
  "winterCare": "",
  "establishing": "",

  "toxicity": "No known hazard.",
  "compliance": "",
  "wildlife": "Pollinator friendly — bees, butterflies",
  "foliage": "deciduous",
  "container": "with care",
  "caveat": "",

  "pitch": "one sentence a staff member can say out loud",
  "companions": "",
  "confusedWith": "",

  "breeder": "",
  "pbr": "none",
  "cvs": "notable cultivars of the species",
  "resilience": "tolerances the plant genuinely has",
  "uses": "borders, containers, coastal…",

  "uncertain": ["list every field you left blank or guessed at, and why"],
  "sources": ["where the facts came from"]
}
```

### Field rules that matter

- **`pest`** — the plant's **single biggest** pest or disease, as one of the keys
  below, or `""`. It picks the icon on the card's "Pests & diseases" row. It is a
  KEY, not prose: the pests a plant actually gets are described in `resilience`
  and always were, and this does not replace that.

  Leave it blank unless one problem clearly dominates. Blank means the card keeps
  the default red spider mite, which is a fair generic and is what 166 of the 167
  cards show. Do not reach for a key just because the field exists — a hosta is
  slugs, a box is box tree caterpillar, and most plants are honestly nothing in
  particular.

  | Available now | |
  |---|---|
  | `slugs` | slugs and snails |

  Planned, and **not yet valid** — using one fails `node tools/check-boot.js`
  rather than silently showing the wrong icon: `aphid`, `vine-weevil`,
  `caterpillar`, `scale`, `mildew`, `blight`, `whitefly`, `sawfly`,
  `lily-beetle`, `rust`, `black-spot`, `honey-fungus`, `browsing`.

  Adding a new one is three steps and no code:

  ```sh
  NODE_PATH=/opt/node22/lib/node_modules node tools/fit-pest-icon.js <drawing.png> aphid --margin 2
  NODE_PATH=/opt/node22/lib/node_modules node tools/optimise-art.js
  # then add   aphid:'art/pest/aphid.webp'   to the PEST registry in timber.html
  ```

  `fit-pest-icon.js` does the sizing so the family holds one optical weight —
  it crops to the drawing's own alpha bounds and squares it by the longer edge,
  because generated art arrives at whatever size and offset the model felt like.
  It also warns if the art is too soft or was scaled up too far.

  The art direction, which the slug meets and a first pack did not: the slot is
  **76 x 77 px in the plaque art, about 29 CSS px on the card, about 26 px on a
  phone.** At that size only the silhouette survives. Match the baked red spider
  mite — compact, one dominant body shape, thick dark outline, glossy painted
  finish, two or three tones, no fine detail, no text, no faces, specimen plate
  rather than mascot. Diseases are drawn as an **affected leaf** (powdery bloom,
  dark blotch, orange pustules) so they stay distinguishable from insects at that
  size. Deliver square, centred, transparent PNG; 1000px+ is plenty.

### SAFETY — `toxicity` and `compliance`, the two that carry real consequences

**`toxicity` is printed VERBATIM.** It appears on the card back under SAFETY and
again in the press-and-hold panel on the card front. Whatever sentence you write is
the sentence a seventeen-year-old reads out to a customer. Write it as prose, not
notes.

**The card picks the warning tier by keyword, in this order, and anything non-empty
that matches nothing falls through to an amber "Handle with care".** That is live on
five cards today: *"Thorns can injure skin"* and *"may cause stomach upset if eaten"*
both got amber by accident, because neither contains a listed word.

| Tier shown | Flag | The text must contain one of |
|---|---|---|
| **Highly toxic** | red | `highly toxic` · `highly poisonous` · `particularly dangerous` · `particularly poisonous` · `potentially dangerous` · `fatal` · `deadly` |
| **Toxic** | orange | `toxic` · `poison` · `harmful` · `cyanogenic` · `should not be eaten` · `not edible` · `do not eat` |
| **Handle with care** | amber | `irritant` · `irritat…` · `sap` · `allerg…` · `spine` · `sharp` · `glove` · `hairs` |
| **Edible parts** | none | `edible` — but any toxic word outranks it, which is the safe order |
| **No known hazard** | none | the phrase `no known hazard` |
| *(blank)* | none | **BLANK IS NOT AN ANSWER** — it renders identically to safe |

**A worked example of the trap, from this brief's own previous wording.** Until
2026-09-13 the example value in the schema above was:

> `"toxicity": "No specific toxicity warning required"`

That sentence declares the plant safe. It contains the letters `toxic` inside
*toxicity*, which matches the **Toxic** rung — so it would have put an **orange
hazard flag** on the front of a card that was saying there is nothing to worry about.
The keyword match does not read your meaning. Write to the table, not around it.

Answer all of these inside the sentence:

- **Which part** — whole plant, berries, seeds, sap, roots, bulb, leaves?
- **By what route** — eaten, skin contact, eye contact, smoke if burnt?
- **Who is at risk** — children, dogs, cats, horses, livestock?
- **What actually happens** — mild stomach upset, blistering, hospital?
- **If it is genuinely benign, write "No known hazard."** Do not leave it blank and
  do not hedge. `""` beats "may be harmful"; `"No known hazard."` beats both.
- Keep it to **one or two sentences**. It is printed, not filed.

**`compliance` is a separate field and it is about the law, not about health.**
Blank on 373 of 394 cards. Answer:

- Is it listed on **Schedule 9** of the Wildlife and Countryside Act — illegal to
  plant or cause to grow in the wild?
- Is it under **plant breeders' rights / PBR**, and therefore illegal to propagate
  for sale? (Give the number if there is one.)
- Does it need a **plant passport** to be moved or sold?
- Is it subject to a **biosecurity restriction** — Xylella host, ash dieback, an
  import ban?
- Anything else that could cost the business money or a prosecution.

If none apply, leave it `""`. Unlike `toxicity`, blank here is a fine answer.

- **`aspect`** — a **compass facing only**: `"South / West"`, `"East"`,
  `"Any aspect"`. Never put light levels here — "full sun" is a `sunNeed` value,
  not an aspect. If nothing states a facing, use `"Any aspect"`.
- **`soil`** — soil type/drainage only, from: free-draining · well-drained ·
  moisture-retentive · reliably moist · boggy · loam · clay · sand · chalk ·
  acid/ericaceous · neutral · alkaline · any pH.
- **`soilWarning`** — a real constraint, *not* a restatement of `soil`
  (e.g. "Avoid winter waterlogging", "Shelter from frost").
- **LENGTH LIMITS on the soil pair — these are measured, not stylistic.**
  `soil` must be **26 characters or fewer**; `soilWarning` **44 or fewer**. The
  soil panel is a narrow painted parchment strip and text over those lengths
  overflows into the warning triangle below it. Write the short version here and
  put the detail in `uncertain` if it matters. Every plant supplied so far has
  broken this — Choisya arrived at 114 and 160 characters.
- **NO CITATION MARKERS ANYWHERE.** Do not append reference numbers, footnote
  markers or source indices to any field value. A value ending
  `"...later in summer or autumn. 0"` puts a stray digit on the printed card.
  Sources belong in the `sources` array, nowhere else.
- **`water` vs `thirst`** — `thirst` is the number (how much); `water` is the
  sentence (how and when). Don't repeat the same phrase in both.
- **`peak`** — `"Mon-Mon"` format; the app parses it and wraps year-end correctly
  (`"Sep-Feb"` works). For non-flowering interest (grasses, berries, autumn colour)
  use the months of *that* feature and say so in `visual`.
- **`hue`** — HSL hue 0–360 of the dominant feature: red 0 · orange 30 · yellow 55 ·
  green 120 · blue 210 · purple 275 · pink 330.
- **`pbr`** — registration/patent number, or `"none"`. Flags whether the plant may
  legally be propagated for sale.
- **`foliage`** — `evergreen` / `semi-evergreen` / `deciduous`.
  **`container`** — `yes` / `with care` / `no`.
- **Commercial fields are deliberately absent.** Never produce prices, margins,
  suppliers, order weeks or stock risk — those are the owner's real trade data.

### WHAT REACHES A CARD, AND WHAT DOES NOT

Measured against the live schema on 2026-09-13, 394 cards. Answering a field in the
left column is work that never appears anywhere.

**Never reaches a card — do not spend effort on these:**
`id` · `registeredCultivar` · `series` · `maturity` · `bloomMonths` · `feed` ·
`winterCare` · `establishing` · `wildlife` · `caveat` · `pitch` · `companions` ·
`confusedWith` · `breeder` · `pbr` · `foliage` · `container` · `sources`

They are kept verbatim in `data/incoming/` as the research record, and
`tools/unmapped-report.js` lists them — but no card renders them. Two are worth a
decision rather than silent loss: **`foliage`** (evergreen/deciduous) and
**`container`** are genuinely useful shop-floor facts with nowhere to go. Either drop
them from the brief or ask for a home to be built.

**Merged, not dropped:** `height` + `spread` become the single `size` string and both
size rails; `soil` + `soilWarning` are joined into the one soil panel, which is why
the 26/44 limits are hard.

**Specified but NOT WIRED — do not add it:** `seasonalImpact` exists as a column and
`CARD-STATS.md` specs it as a 0–20 rating, but the stat row it feeds
(`powerSeasonal`) **was never built**. It is blank on all 394 cards and filling it
would change nothing on the card. Leave it out of the brief until the row exists.

**`cvs` is used two ways in the deck and that is worth knowing.** On most cards it
lists *sibling cultivars of the species* ("'Sundance' – yellow foliage · 'Aztec Pearl'
– fine leaves"); on others it carries *this plant's own registration* ("PBR 18358",
"trade name LITTLE DEVIL; cultivar 'Donna May' (PP22634)"). Both render under
"Cultivars" on the back and both are searchable. Prefer the sibling-cultivar reading,
and put registration in `compliance` where it has legal weight.

### Before you answer, check
- [ ] Hardiness verified, not assumed
- [ ] All five ratings are integers within their scale
- [ ] `pest` is blank, or one of the keys listed under Field rules. It is the
      single biggest problem, not a list — the list belongs in `resilience`.
- [ ] Ratings are on the **0–20** scale, not 0–5. A `pestRisk` of 4 means 1/5 —
      trouble-free. If you meant "quite prone", that is 14, not 4.
- [ ] `aspect` contains a facing or "Any aspect", never a light level
- [ ] `soil` is ≤26 characters and `soilWarning` ≤44
- [ ] **No field value ends in a citation number**
- [ ] `soil` and `soilWarning` don't repeat each other
- [ ] `bloomMonths` matches `peak`
- [ ] `toxicity` contains one of the tier keywords, or says "No known hazard."
      **A non-empty line that matches nothing becomes an amber flag by accident**
- [ ] `toxicity` names the part, the route and who is at risk, in a sentence a
      teenager can read out loud
- [ ] `compliance` checked against Schedule 9, PBR, plant passport and biosecurity
- [ ] Nothing answered from the "never reaches a card" list
- [ ] Everything unknown is blank **and** listed in `uncertain`
