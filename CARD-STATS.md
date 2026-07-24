# Timber Card Stats — scoring, validation & render spec

**This file is the authority for how each stat on a Timber card is defined, scored,
validated, and rendered.** It supersedes the "Plant Power Points" rubric that lived
in `CARD-PROTOCOL.md` §1b (0–100 scale + flip-at-render). Follow it whenever you
rate a plant, fill a CSV row, or code `renderCard()`.

Priority order (from Oscar's production brief — if two rules conflict, the higher
one wins): **1 factual accuracy · 2 layout accuracy · 3 icon/rating accuracy ·
4 stylistic consistency · 5 aesthetics.**

---

## 0. Principles

- **Factual fields** (hardiness, dimensions, bloom, aspect, soil) come from the
  nursery label or RHS — **never guessed**. Missing = say it's missing. Uncertain =
  mark `[uncertain]`. A plausible guess is worse than a blank.
- **Editorial ratings** (pest risk, thirst, care, growth, sun) are judgements
  against the anchors below, drafted by AI, **reviewed by Oscar — he is the final
  arbiter and outranks the rubric.**
- **Ratings render as geometric quarter-fills, never opacity.** A half score is a
  half-clipped icon, not a faded one.
- **One icon row = 5 icons = 20 quarter-units.** So every icon-row rating is scored
  **0–20**, where **1 point = ¼ of an icon**. Boundaries:
  | score /20 | icons shown | /5 equivalent |
  |---|---|---|
  | 0 | 5 empty | 0/5 |
  | 2 | ½ + 4½ empty | 0.5/5 |
  | 4 | 1 full + 4 empty | 1/5 |
  | 10 | 2½ | 2.5/5 |
  | 20 | 5 full | 5/5 |
  Integers 0–20 give the full quarter-step resolution the widget can display — no
  finer scale is meaningful (don't store 0–100; it's false precision the card can't
  show).

---

## 1. The full stat set — what's on the card and where

| Stat | Card location | Type | Scale | Source |
|---|---|---|---|---|
| Common name | Title | text | — | label |
| Botanical name | Subtitle (italic) + 🔊 Listen | text | — | label / RHS |
| Hardiness | Green crest, top-right | RHS band | H1a–H7 | RHS / label |
| Stature (H × W) | Left vertical rail | dimensions | cm / m | label |
| **Bloom** | Plaque row 1 (flower emblem) | month calendar | Jan–Dec | RHS |
| **Pest & disease risk** | Plaque row 2 (mite + spray bottles) | rating | **0–20** | editorial |
| **Thirst** | Plaque row 3 (drop + droplets) | rating | **0–20** | editorial |
| **Care needed** | Plaque row 4 (care-cross + secateurs) | rating | **0–20** | editorial |
| **Growth speed** | Right rail marker (transparent, over photo) | rating | **0–20** | editorial |
| Aspect | Compass panel | facing text | N/S/E/W / any | label / RHS |
| **Sun need** | Light slider (shade→sun) | rating | **0–100** | editorial |
| Soil | Soil panel + warning | text | controlled vocab | label / RHS |

Everything visible on the front is in this table. Nothing else gets a row without a
protocol changelog entry.

---

## 2. The four icon rubrics (0–20)

Each stores **what the icons show, directly** — higher score = more filled icons =
more of the named thing. (This replaces the old model where we stored *resistance*
and *thrift* and inverted them at render; storing risk/thirst/care/growth directly
removes that whole class of flip bugs.)

### 2a. Pest & disease risk — *higher = more prone to trouble*
Emblem: red spider-mite. Widgets: spray bottles.
| score | meaning | anchor plants |
|---|---|---|
| 0–3 | Bulletproof, never sprayed | Choisya, Nandina, Kniphofia (~3) |
| 8–10 | Occasional aphid/mildew, easily managed | most perennials, Weigela |
| 14–16 | Regularly needs watching | roses (~15), Aquilegia (sawfly) |
| 18–20 | Chronic trouble in the UK | box/*Buxus* (blight ~18), some apples (scab) |

### 2b. Thirst — *higher = needs more water*
Emblem + widgets: water droplets. (This is the "Thirst" Oscar chose over "water
thrift" — it reads as the plant's demand, not its thrift.)
| score | meaning | anchor plants |
|---|---|---|
| 0–3 | Survives on rainfall once established; drought-proof | lavender, *Sedum*, *Stipa* |
| 4–6 | Low — occasional deep water in a dry spell | Kniphofia (~4), Pennisetum |
| 10–12 | Average border moisture | most shrubs |
| 16–20 | Wants consistently moist / never dries | Hydrangea (~16), *Ligularia*, bog plants (20) |

### 2c. Care needed — *higher = more work*
Emblem: white care-board with red cross. Widgets: secateurs.
Weigh: pruning demand, deadheading, staking, feeding, lifting/overwintering, pest vigilance.
| score | meaning | anchor plants |
|---|---|---|
| 0–3 | Plant and forget | Sarcococca, most ornamental grasses |
| 6–8 | Light annual tidy | Kniphofia (~8, cut back + divide) |
| 12–14 | Regular deadheading / seasonal pruning | roses, wisteria |
| 18–20 | High-maintenance / tender lifting | dahlias in cold gardens, topiary |

### 2d. Growth speed — *higher = faster to establish and fill space*
Rendered as the marker on the right-hand growth rail (Low → High), **not** icons.
Marker position = `score / 20`.
| score | meaning | anchor plants |
|---|---|---|
| 0–4 | Very slow | *Acer palmatum*, box, *Daphne* |
| 8–12 | Steady | most shrubs, Kniphofia (~12), Pennisetum (~14) |
| 16–18 | Fast | Buddleja, *Lonicera* |
| 20 | Rampant | Leyland cypress, *Fallopia* |

---

## 3. Sun need (0–100) — the light slider

The slider position, **not** an icon row. Oscar's definition:

> **0 = deep shade. 100 = the most sun a plant could get — a very open, unshaded spot
> on a median day.** It's the plant's *preferred* light, i.e. where the marker sits on
> the shade→sun spectrum.

| score | meaning | anchor plants |
|---|---|---|
| 0–20 | Deep / full shade | Sarcococca (~15), ferns, *Aspidistra* |
| 35–50 | Part shade / dappled | *Hydrangea*, Choisya (~55) |
| 60–75 | Sun to light shade | most border perennials |
| 85–100 | Full open sun, thrives on heat | lavender, Kniphofia (~88), Pennisetum (~90) |

- **Distinct from Aspect.** Sun need = *how much light the plant wants*. Aspect = *which
  way the site faces* (§4d). A plant can be "any aspect" yet want full sun (open bed),
  or south-facing yet shade-tolerant (wall shrub). Keep them separate.
- **Optional tolerance range** (`sunMin`–`sunMax`) may be recorded for the card back or
  a future tolerance band — but the v11 front slider shows a single marker only (the
  reference art has no bands; don't add them without instruction).

---

## 4. Factual fields (never scored, never guessed)

### 4a. Hardiness — RHS band, shown on the crest
The single most error-prone field (the mock-ups all carried H5 from the template —
**check every plant against RHS/label**). Full scale:

| Band | Withstands | Type |
|---|---|---|
| H1a | >15 °C | Heated glasshouse — tropical |
| H1b | 10–15 °C | Heated glasshouse — subtropical |
| H1c | 5–10 °C | Warm temperate; outside in summer |
| **H2** | 1–5 °C | **Tender** — no frost (e.g. *Pennisetum* 'Rubrum') |
| H3 | −5 to 1 °C | Half-hardy / coastal |
| H4 | −10 to −5 °C | Hardy — average winter |
| H5 | −15 to −10 °C | Hardy — cold winter |
| H6 | −20 to −15 °C | Hardy — very cold winter |
| H7 | < −20 °C | Very hardy |

Card renders the number over the blank crest (`art/crest-blank.png` + CSS numeral) —
any band displays. If the label and RHS disagree, prefer the label for the plant
you're actually holding, and note it.

### 4b. Bloom months — the calendar
Highlight the months of **main display**. Twelve cells J–D; on-months filled forest
green. Rules:
- Flowering plants → flowering months (from RHS, cross-checked to label).
- **Non-flower interest** (grasses, berries, autumn colour): highlight the months of
  that feature and it stays labelled "Bloom" (e.g. Pennisetum plumes = Jul–Oct;
  Nandina berries = Oct–Feb). If the interest isn't floral, note it in confidence.
- Stored as a month list or a `peak` phrase the renderer parses (e.g. `"Jul-Oct"`).

### 4c. Stature — height × spread
Ultimate (or nursery-label) H × W, **metric primary** (`"60–90 cm H × 45–60 cm W"`).
Record which basis the label used (ultimate vs 10-year) in confidence if it matters.

### 4d. Aspect — which way the site faces
Values: `N`, `S`, `E`, `W` and combinations (`S/W`), or **"Any aspect"**.
**Compass rule (hard):** the compass needle/facing shows **only** when the data names
a direction. No direction → muted compass + "Any aspect". Never invent a facing.
"Full sun" is a *sun-need* value, not an aspect — don't put it in the aspect panel
(that was a mock-up error).

### 4e. Soil — see the checker in §6.

---

## 5. Feature — Latin name checker

A validator run on the `latin` field before a card ships. It **flags, never silently
autocorrects** (a wrong autocorrect is an invented fact).

Format rules it enforces:
- Genus capitalised, species lowercase, both italic on the card: *Kniphofia uvaria*.
- Cultivar in single quotes, Roman (not italic), each word capitalised: 'Pyromania
  Orange Blaze'.
- Hybrids use `×` (multiplication sign, not letter x): *Pennisetum ×advena*.
- Rank abbreviations lowercase Roman: `subsp.`, `var.`, `f.`.
- Trade designations (selling names) in SMALL CAPS without quotes — distinct from the
  true cultivar epithet.

Checks it runs:
1. Genus exists in a known-genera list → else flag "unrecognised genus, verify spelling".
2. Cultivar present and quote-balanced → else flag.
3. Common typos (double letters, `ii`/`i` endings, `-ae`/`-a`) → suggest, don't apply.
4. Duplicate-word / obvious OCR noise from a label read.

Also powers **🔊 Listen**: speech-synthesis reads the validated latin (Italian voice
preferred for botanical Latin). Pronunciation uses the *checked* string, so a flagged
name isn't spoken until confirmed.

---

## 6. Feature — Soil requirements checker

Normalises the `soil` field to a controlled vocabulary and validates the warning.

Controlled terms (pick from these, don't free-write):
- **Drainage:** free-draining · well-drained · moisture-retentive · reliably moist · boggy
- **Type:** loam · clay · sand · chalk
- **pH:** acid / ericaceous · neutral · alkaline · any pH

Checks:
1. Every soil phrase maps to a controlled term → else flag for rewording.
2. **Dedupe against Thirst.** Moisture/drainage belongs in *either* Soil *or* the
   Thirst row, not both. "Well-drained" stated in Soil AND Water was the recurring
   bug — the checker rejects the repeat. Soil = soil *type/drainage*; Thirst =
   *watering regime*.
3. **Warning** must be a real constraint, distinct from the soil line — e.g. "Avoid
   winter waterlogging", "Needs shelter from frost", "Chalk intolerant". Not a
   restatement of the soil text.

---

## 7. Optional / proposed additions (not on the front card yet)

Useful for shop-floor lookup — the app's core job — but not shown on the v11 front.
Proposed as data fields / card-back rows, pending Oscar's call:
- **Toxicity / pet-safe** — "Harmful if eaten / skin irritant / pet-safe". Common
  customer question; factual from RHS.
- **Wildlife value** — RHS Plants for Pollinators badge, bee/butterfly friendly.
- **Evergreen / deciduous / semi-evergreen.**
- **Uses / position** — borders, containers, hedging, coastal (exists as `uses`).
- **Seasonal impact (0–20)** — the old `powerSeasonal`. **Deprecated from the front**
  (v11 shows Bloom instead). Keep only if we add a card-back "year-round interest"
  meter; otherwise retire.

---

## 8. Commercial fields — separate, never editorialised

`source, order, bench, root, trade, retail, margin, type, shrink, returnRisk, pots`
are Oscar's real trade data. They are **not** ratings and **never** guessed or shown
on the public/customer card. Blank stays blank until Oscar enters the real value.

---

## 9. CSV schema & migration

Current score columns are the old 0–100 model. Target model (this spec):

| New column | Scale | Replaces | Conversion from old |
|---|---|---|---|
| `pestRisk` | 0–20 | `powerPest` (resistance) | `round((100 − powerPest) / 5)` |
| `thirst` | 0–20 | `powerWater` (thrift) | `round((100 − powerWater) / 5)` |
| `careLevel` | 0–20 | *(new — resolves the pending Care column)* | draft per §2c |
| `growthSpeed` | 0–20 | `powerGrowth` | `round(powerGrowth / 5)` |
| `sunNeed` | 0–100 | `lightLevel` (rename only) | `= lightLevel` |
| `seasonalImpact` | 0–20 | `powerSeasonal` | `round(powerSeasonal / 5)` — optional §7 |

Spot-check (Kniphofia old → new): powerPest 85 → pestRisk 3 (0.75/5 ✓);
powerWater 80 → thirst 4 (1/5 ✓); powerGrowth 60 → growthSpeed 12 (marker 60% ✓);
lightLevel 88 → sunNeed 88 ✓.

**Implementation is a separate brick** (rename columns in `plants.csv` + `plants-tool.js`
FIELDS/SCORE_FIELDS, update the 0–20 validation, update `renderCard()` formulas). Not
done here — this file defines the target; migrating the data + tooling comes next and
must keep the Playwright suite green.

---

## 10. Exact render formulas (reference)

```js
// icon rows: score 0–20 → per-icon quarter fills
const fills = getRatingSegments(score / 4);        // score/4 is 0–5 in 0.25 steps
// pestRisk, thirst, careLevel all use this directly (no inversion)

// growth rail marker: fraction up the Low→High axis
const growthFrac = growthSpeed / 20;

// light slider marker: fraction along shade→sun
const sunFrac = sunNeed / 100;

// bloom calendar: highlight on-months
const on = bloomMonths.includes(monthIndex);       // 1–12
```

`getRatingSegments` (design-system rule — clip width, never opacity):
```js
const getRatingSegments = (value, max = 5) =>
  Array.from({ length: max }, (_, i) => {
    const r = value - i;
    if (r >= 1) return 1;
    if (r <= 0) return 0;
    return Math.round(r * 4) / 4;   // quarter-step
  });
```
