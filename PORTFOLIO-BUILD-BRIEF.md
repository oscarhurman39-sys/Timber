# Timber — Portfolio Build Brief (paste this whole file to the AI)

You are filling a plant database for **Timber**, a plant-fact app for UK garden-centre
staff. For each plant you are given (a name, and optionally label text or photo notes),
output **one CSV row** in the exact schema below, plus a short human-readable review
block. This brief is self-contained — follow only what is written here.

---

## THE THREE RULES THAT MATTER MOST

1. **Never invent a fact.** If you don't know a field, **leave that CSV cell blank**
   and say so in the notes. A blank cell is correct; a plausible guess is a bug.
2. **Accuracy beats completeness.** Facts come from the nursery label first, then
   RHS / standard UK horticulture. Mark anything uncertain.
3. **Ratings are exact integers.** The scales are defined below. Don't approximate.

Priority when anything conflicts: **factual accuracy → layout/schema accuracy →
rating accuracy → style → looks.**

---

## OUTPUT FORMAT — per plant, in this order

```
## <Common name>

### VERIFIED FACTS
- Common name / Botanical name / Hardiness / Height×Spread / Bloom /
  Pest risk / Thirst / Care / Growth / Aspect / Sun / Soil / Warning
  (one line each, human readable)

### CONFIDENCE NOTES
- Uncertain: <list, or "none">
- From the label: <list>
- Inferred from horticulture: <list>

### CSV ROW
<one line: all 31 cells, each wrapped in double quotes, comma-separated, in the
column order given below. Blank cells are still written as "">
```

Never put an uncertain value in the CSV row — blank it and note it. Uncertainty lives
in the notes, never in the data.

---

## THE 31 COLUMNS — exact order, quote every cell

Header (row order is fixed; reproduce cells in exactly this order):

```
"common","latin","hue","visual","water","aspect","soil","prune","source","peak","order","bench","root","trade","retail","margin","type","shrink","returnRisk","pots","cvs","hardiness","resilience","uses","size","seasonalImpact","growthSpeed","pestRisk","thirst","careLevel","sunNeed"
```

| # | column | what to put | required? |
|---|---|---|---|
| 1 | common | Common name, e.g. `Red Hot Poker` | **required** |
| 2 | latin | Botanical name, e.g. `Kniphofia 'Pyromania Orange Blaze'` (see latin rules) | **required** |
| 3 | hue | Integer 0–360: the HSL hue of the plant's dominant feature (flower, or foliage for foliage plants). Guide: red 0 · orange 30 · yellow 55 · green 120 · blue 210 · purple 275 · pink 330 | **required** |
| 4 | visual | ≤ 90 chars: what it looks like / main season of interest | if known |
| 5 | water | Watering regime in words, e.g. `Low once established` (NOT soil drainage — that's col 7) | if known |
| 6 | aspect | Facing only: `S`, `S/W`, `N`, `Any aspect`… Never put "full sun" here (that's sun, col 30) | if known |
| 7 | soil | Soil type/drainage from the controlled list (see soil rules). NOT the watering regime | if known |
| 8 | prune | Pruning in words, e.g. `Cut old foliage to base in spring` | if known |
| 9 | source | **LEAVE BLANK** — Oscar's trade data | never fill |
| 10 | peak | Months of main display as `Mon-Mon`, e.g. `Jul-Oct`. Grasses/berries: use the feature's months | if known |
| 11 | order | **LEAVE BLANK** | never fill |
| 12 | bench | **LEAVE BLANK** | never fill |
| 13 | root | **LEAVE BLANK** | never fill |
| 14 | trade | **LEAVE BLANK** | never fill |
| 15 | retail | **LEAVE BLANK** | never fill |
| 16 | margin | **LEAVE BLANK** | never fill |
| 17 | type | **LEAVE BLANK** | never fill |
| 18 | shrink | **LEAVE BLANK** | never fill |
| 19 | returnRisk | **LEAVE BLANK** | never fill |
| 20 | pots | **LEAVE BLANK** | never fill |
| 21 | cvs | Notable cultivars of the species, comma-separated, if relevant | optional |
| 22 | hardiness | RHS band `H1a`–`H7` (see table) | **required** |
| 23 | resilience | Tolerances the plant genuinely has, e.g. `Drought-tolerant, coastal` | if known |
| 24 | uses | Where it's used, e.g. `Borders, gravel gardens, containers` | if known |
| 25 | size | `<H> H × <W> W` metric, e.g. `60–90 cm H × 45–60 cm W` | if known |
| 26 | seasonalImpact | 0–20 year-round visual drama (optional stat) or blank | 0–20 / blank |
| 27 | growthSpeed | 0–20 vigour (see rubric) | 0–20 / blank |
| 28 | pestRisk | 0–20 pest & disease **risk** (higher = more prone) | 0–20 / blank |
| 29 | thirst | 0–20 water **need** (higher = thirstier) | 0–20 / blank |
| 30 | careLevel | 0–20 work **needed** (higher = more care) | 0–20 / blank |
| 31 | sunNeed | 0–100 light the plant wants (0 deep shade → 100 open full sun) | 0–100 / blank |

If you can only confirm the 4 required fields, do that and blank the rest — a partial
row is valid and imports fine.

---

## RATING SCALES

All 0–20 rows render as 5 icons in quarter steps (so 4 points = 1 full icon,
2 points = half an icon). Store **what the icon shows, directly** — higher = more.

**pestRisk (0–20)** — higher = more prone to pests/disease
`0–3` bulletproof (Choisya, Kniphofia) · `8–10` occasional aphid/mildew · `14–16`
needs watching (roses) · `18–20` chronic (box blight).

**thirst (0–20)** — higher = needs more water
`0–3` drought-proof (lavender, Sedum) · `4–6` low (Kniphofia, Pennisetum) · `10–12`
average border · `16–20` wants constant moisture (Hydrangea, bog plants).

**careLevel (0–20)** — higher = more work (pruning, deadheading, staking, feeding, lifting)
`0–3` plant-and-forget (grasses, Sarcococca) · `6–8` light annual tidy (Kniphofia) ·
`12–14` regular pruning/deadheading (roses) · `18–20` high-maintenance/tender lifting (dahlias).

**growthSpeed (0–20)** — higher = faster to establish
`0–4` very slow (Acer palmatum, box) · `8–12` steady (most shrubs) · `16–18` fast
(Buddleja) · `20` rampant (Leylandii).

**sunNeed (0–100)** — where it sits on shade→sun; 100 = the most sun a plant could get,
an open unshaded spot on a median day
`0–20` deep shade (Sarcococca, ferns) · `35–50` part shade (Hydrangea, Choisya) ·
`60–75` sun/light shade · `85–100` full open sun (lavender, Kniphofia, Pennisetum).
Sun is *how much light it wants*; **aspect** (col 6) is *which way the site faces* — keep them separate.

**seasonalImpact (0–20, optional)** — year-round drama: flowering cherry ≈19, Nandina ≈17,
plain hedge ≈3. Blank is fine if unsure.

---

## HARDINESS — RHS bands (col 22). Check every plant; don't assume H5.

| Band | Withstands | Note |
|---|---|---|
| H1a/b/c | > 5 °C | Glasshouse / tender indoor |
| **H2** | 1–5 °C | Tender, no frost — e.g. *Pennisetum* 'Rubrum' |
| H3 | −5–1 °C | Half-hardy / coastal |
| H4 | −10–−5 °C | Hardy, average winter |
| H5 | −15–−10 °C | Hardy, cold winter |
| H6 | −20–−15 °C | Hardy, very cold |
| H7 | < −20 °C | Very hardy |
If the label states a hardiness and RHS differs, prefer the label and note it.

---

## LATIN NAME rules (col 2)
- *Genus* capitalised, *species* lowercase. Cultivar in single quotes, capitalised,
  e.g. `Kniphofia 'Pyromania Orange Blaze'`. Hybrids use `×`. Only quote a cultivar you
  can confirm. If unsure of the cultivar, give `Genus species` and note it.

## SOIL rules (col 7) — pick from this vocabulary, don't free-write
Drainage: `free-draining` · `well-drained` · `moisture-retentive` · `reliably moist` · `boggy`.
Type: `loam` · `clay` · `sand` · `chalk`. pH: `acid/ericaceous` · `neutral` · `alkaline` · `any pH`.
**Do not repeat the watering regime here** — drainage belongs in soil OR water, not both.
Put any real constraint (e.g. "avoid winter waterlogging", "shelter from frost") in `resilience` or `visual`, not duplicated.

---

## WORKED EXAMPLE

## Red Hot Poker

### VERIFIED FACTS
- Common: Red Hot Poker · Botanical: *Kniphofia* 'Pyromania Orange Blaze' · Hardiness: H5
- Height×Spread: 75 cm × 60 cm · Bloom: Jul–Oct
- Pest risk 3/20 · Thirst 4/20 · Care 8/20 · Growth 12/20
- Aspect: any · Sun: 88/100 · Soil: free-draining · Warning: avoid winter waterlogging

### CONFIDENCE NOTES
- Uncertain: none material
- From the label: cultivar name, dimensions
- Inferred: hardiness H5 (RHS), all four ratings (editorial, Oscar reviews)

### CSV ROW
```
"Red Hot Poker","Kniphofia 'Pyromania Orange Blaze'","28","Orange-yellow torch spikes over grassy clumps, summer–autumn","Low once established","Any aspect","Free-draining","Cut spent spikes; tidy foliage in spring","","Jul-Oct","","","","","","","","","","","","H5","Drought-tolerant once established","Borders, gravel gardens, pollinators","75 cm H × 60 cm W","","12","3","4","8","88"
```

---

## BATCH MODE
When given several plants, output the per-plant blocks in order, then a final fenced
CSV block containing every row (no header) so they can be pasted in one go. Keep the
column order identical in every row. Do not add, remove, reorder, or rename columns.
