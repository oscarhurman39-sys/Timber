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

  "toxicity": "No specific toxicity warning required",
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

- **`aspect`** — a **compass facing only**: `"South / West"`, `"East"`,
  `"Any aspect"`. Never put light levels here — "full sun" is a `sunNeed` value,
  not an aspect. If nothing states a facing, use `"Any aspect"`.
- **`soil`** — soil type/drainage only, from: free-draining · well-drained ·
  moisture-retentive · reliably moist · boggy · loam · clay · sand · chalk ·
  acid/ericaceous · neutral · alkaline · any pH.
- **`soilWarning`** — a real constraint, *not* a restatement of `soil`
  (e.g. "Avoid winter waterlogging", "Shelter from frost").
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

### Before you answer, check
- [ ] Hardiness verified, not assumed
- [ ] All five ratings are integers within their scale
- [ ] `aspect` contains a facing or "Any aspect", never a light level
- [ ] `soil` and `soilWarning` don't repeat each other
- [ ] `bloomMonths` matches `peak`
- [ ] Everything unknown is blank **and** listed in `uncertain`
