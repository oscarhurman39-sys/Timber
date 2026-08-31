# Plinder Plant Card — Reusable UI Design System

## Decision

Use the generated card image as the **visual art-direction reference**, but build the production card as an **HTML/CSS component driven by plant data**.

This is the correct method for the Plinder app because it gives you:

- deterministic centring and spacing
- a permanently horizontal `PLANT POWER POINTS` heading
- reusable plant data
- accessible text and controls
- reliable half-filled and quarter-filled ratings
- responsive behaviour on different phone sizes
- easy corrections without regenerating the whole card
- consistent visual identity across every plant

Image generation remains useful for:

- testing visual direction
- producing plant photography or decorative textures
- exploring badge and icon ideas
- creating marketing screenshots

It should not control the final UI geometry.

---

# 1. Visual Reference

The target card is a premium botanical collectible:

- warm, lightly weathered parchment panels
- deep forest-green ornamental border
- thin antique-gold trim
- full-height plant photograph beneath translucent UI
- large serif common name
- italic botanical name
- blue `LISTEN` pill button
- green hardiness crest
- generous plant-image area
- compact information panels
- subtle shadows and embossed edges
- elegant, slightly playful horticultural iconography

The card must feel like a **beautiful collectible first** and a **functional field guide second**.

---

# 2. Non-Negotiable Layout Rules

## 2.1 Card centring

The complete card must be centred horizontally inside its viewport.

```css
.plant-card-shell {
  display: grid;
  place-items: center;
  width: 100%;
}

.plant-card {
  margin-inline: auto;
}
```

The left and right outer margins must be visually equal.

## 2.2 Heading orientation

`PLANT POWER POINTS` must always be:

- horizontal
- centred
- inside the main parchment plaque
- above the first data row
- never rotated
- never placed vertically along the side

```css
.power-points__title {
  writing-mode: horizontal-tb;
  transform: none;
  text-align: center;
  white-space: nowrap;
}
```

## 2.3 Main plaque

The main parchment plaque contains:

1. `PLANT POWER POINTS`
2. Bloom
3. Pests & diseases
4. Thirst
5. Care level

The plaque should sit low enough to preserve a large uninterrupted plant-photo area above it.

## 2.4 Bottom information row

The bottom row contains three functional zones:

1. Aspect / compass
2. Light requirement
3. Soil requirement

These may be rendered as three visually connected parchment panels or as a shared row with internal dividers.

The row must be compact. It must not push the main plaque upward unnecessarily.

---

# 3. Recommended Production Grid

```css
.plant-card {
  --side-strip: clamp(3rem, 8vw, 5.25rem);
  --card-gap: clamp(.55rem, 1.5vw, .9rem);

  position: relative;
  width: min(100%, 46rem);
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 2rem;

  display: grid;
  grid-template-columns:
    var(--side-strip)
    minmax(0, 1fr)
    minmax(0, 1fr)
    minmax(0, 1fr);

  grid-template-rows:
    auto
    minmax(0, 1fr)
    auto
    auto;

  gap: var(--card-gap);
  padding:
    clamp(.65rem, 1.7vw, 1rem)
    clamp(.65rem, 1.7vw, 1rem)
    clamp(.75rem, 1.8vw, 1.1rem);
}
```

## Suggested region map

```text
┌─────────┬──────────────────────────────────────────────┐
│ Stature │ Header: common name, botanical name, listen │
│ strip   │ Hardiness crest                             │
├─────────┼──────────────────────────────────────────────┤
│         │                                              │
│         │            Plant photograph                  │
│         │                                              │
├─────────┼──────────────────────────────────────────────┤
│         │        PLANT POWER POINTS plaque             │
├─────────┼──────────────┬──────────────┬────────────────┤
│         │ Aspect       │ Light        │ Soil           │
└─────────┴──────────────┴──────────────┴────────────────┘
```

---

# 4. Component Structure

```html
<article class="plant-card" data-plant-id="orange-blaze">
  <img class="plant-card__photo" alt="" />

  <aside class="stature-strip"></aside>

  <header class="plant-card__header">
    <div class="plant-card__identity">
      <h1 class="plant-card__common-name"></h1>
      <p class="plant-card__botanical-name"></p>
      <button class="listen-button" type="button"></button>
    </div>

    <div class="hardiness-crest"></div>
  </header>

  <div class="growth-speed" aria-label=""></div>

  <section class="power-points">
    <h2 class="power-points__title">Plant Power Points</h2>

    <div class="metric-row metric-row--bloom"></div>
    <div class="metric-row metric-row--pests"></div>
    <div class="metric-row metric-row--thirst"></div>
    <div class="metric-row metric-row--care"></div>
  </section>

  <section class="environment-row">
    <div class="aspect-panel"></div>
    <div class="light-panel"></div>
    <div class="soil-panel"></div>
  </section>

  <p class="mastery-hint">Double tap to master.</p>
</article>
```

---

# 5. Data Model

Every plant card should be populated from one structured object.

```json
{
  "id": "kniphofia-orange-blaze",
  "commonName": "Red Hot Poker",
  "botanicalName": "Kniphofia ‘Orange Blaze’",
  "series": "Pyromania Series",
  "image": {
    "src": "/images/plants/kniphofia-orange-blaze.webp",
    "alt": "Orange flower spikes of Red Hot Poker"
  },
  "audio": {
    "enabled": true,
    "src": "/audio/kniphofia-orange-blaze.mp3"
  },
  "hardiness": {
    "scheme": "RHS",
    "value": "H5"
  },
  "stature": {
    "height": "2–2.5 ft",
    "spread": "1.5–2 ft"
  },
  "growthSpeed": {
    "label": "Medium",
    "value": 0.55
  },
  "bloom": {
    "label": "Summer",
    "months": [7, 8, 9, 10],
    "display": "Summer (Jul–Oct)"
  },
  "pestsAndDiseases": {
    "rating": 0.5,
    "max": 5,
    "emblem": "red-spider-mite",
    "ratingWidget": "spray-bottle"
  },
  "thirst": {
    "rating": 2,
    "max": 5,
    "label": "Average"
  },
  "care": {
    "rating": 1.5,
    "max": 5,
    "label": "Easy",
    "emblem": "plant-care-cross",
    "ratingWidget": "secateurs"
  },
  "aspect": {
    "display": "South / West",
    "values": ["south", "west"]
  },
  "light": {
    "display": "Full sun",
    "scaleValue": 0.88,
    "toleratedRange": [0.62, 1],
    "optimalRange": [0.82, 1]
  },
  "soil": {
    "display": "Free-draining soil",
    "warning": "Avoid heavy clay and winter waterlogging."
  }
}
```

---

# 6. Rating-System Rules

## 6.1 Strict data binding

The visual rating must always be generated from the numeric value.

Never manually colour icons independently of the data.

```js
const getRatingSegments = (value, max = 5) =>
  Array.from({ length: max }, (_, index) => {
    const remaining = value - index;

    if (remaining >= 1) return 1;
    if (remaining <= 0) return 0;

    return Math.round(remaining * 4) / 4;
  });
```

Example:

```js
getRatingSegments(1.5);
// [1, 0.5, 0, 0, 0]
```

## 6.2 Fractional states

Allowed states:

- `0`
- `0.25`
- `0.5`
- `0.75`
- `1`

Partial ratings must use **geometric clipping**, not faded opacity.

```css
.rating-icon {
  position: relative;
}

.rating-icon__fill {
  position: absolute;
  inset: 0;
  overflow: hidden;
  width: calc(var(--fill) * 100%);
}

.rating-icon__outline {
  position: absolute;
  inset: 0;
}
```

Do not use low opacity to imply half ratings. Low opacity reads as disabled.

## 6.3 Row-specific rating widgets

| Metric | Left emblem | Rating widgets |
|---|---|---|
| Bloom | Flower | Bloom should preferably use a month timeline rather than a score |
| Pests & diseases | Scientifically accurate red spider mite | Generic green spray bottles |
| Thirst | Water drop | Water drops |
| Care level | White plant-care board with red cross | Secateurs |

## 6.4 Bloom treatment

Preferred production version:

- display `Summer (Jul–Oct)`
- use a 12-month timeline
- highlight Jul, Aug, Sep and Oct
- do not imply that a flowering date is “5 out of 5”

```text
J F M A M J [J][A][S][O] N D
```

If the collectible flower markers are retained as decoration, they must not be presented as a numeric score.

---

# 7. Icon Requirements

## 7.1 Style system

Use one consistent icon style:

- clean outlined vector
- softly antiqued ink
- restrained duotone fills
- same stroke width
- same optical size
- same baseline
- same bounding box

Recommended implementation:

- custom SVG sprite
- Phosphor or Lucide as the structural base
- bespoke botanical replacements where needed

Avoid mixing photorealistic 3D icons with flat line art.

## 7.2 Red spider mite emblem

The red spider mite emblem should be a clear micro-vector, not a generic beetle.

Required anatomy:

- arachnid, not insect
- eight legs
- oval red or crimson body
- compact head/body silhouette
- two darker dorsal spots where visually legible
- strong outline against parchment
- same visual size as the row’s other emblem icons

## 7.3 Pest spray bottle widget

The bottle is generic and must not use a real pesticide brand.

Allowed tiny label:

```text
PEST
NO!
```

At phone scale, omit this microtext when it becomes illegible.

## 7.4 Secateurs widget

The rating widget should be a simplified but mechanically plausible Japanese bypass secateur.

Visual requirements:

- bypass blade geometry
- dark forged-steel head
- compact V-shaped open spring
- bottom handle latch
- high-visibility handle coating
- same orientation for all five rating widgets
- slightly tilted only if it reduces row height
- filled, fractional and outline states must share identical geometry

The card can use yellow or red handles, but one colour must be selected for the entire design system.

---

# 8. Light Requirement Component

## 8.1 Semantic direction

The scale must move from:

```text
Shade → Full sun
```

The visual brightness must increase toward `Full sun`.

Do not use a thermal hot-to-cold rainbow.

## 8.2 Main scale

Recommended:

- left: deep muted indigo or forest shadow
- centre: soft grey-green / warm neutral
- right: pale luminous yellow

```css
.light-scale__track {
  background:
    linear-gradient(
      90deg,
      #2D2A4A 0%,
      #59656F 28%,
      #A8B58C 58%,
      #FFE469 82%,
      #FFF57B 100%
    );
}
```

## 8.3 Tolerance and optimal ranges

Use a small secondary band above the main scale:

- blue = tolerated range
- green = optimal range
- geometric edges
- no blurred or faded rating logic

```css
.light-tolerance {
  position: relative;
  height: .22rem;
}

.light-tolerance__accepted {
  position: absolute;
  left: 62%;
  width: 38%;
  background: #4B8FCB;
}

.light-tolerance__optimal {
  position: absolute;
  left: 82%;
  width: 18%;
  background: #4C8D45;
}
```

## 8.4 Labels

Use only:

- `Shade`
- `Full sun`

The plant’s current requirement appears once as the panel value:

```text
Full sun
```

Do not repeat `Full sun` as both a title and a duplicate floating label unless the endpoint label is necessary.

---

# 9. Growth-Speed Indicator

The preferred growth-speed control is:

- transparent
- placed directly over the photo
- positioned on the right middle edge
- not enclosed in a parchment box
- narrow and visually secondary

Recommended text layout:

```text
Fast
  │
  ◆
  │
Slow

GROWTH SPEED
```

The marker must be generated from data.

```css
.growth-speed__marker {
  inset-block-end: calc(var(--growth-value) * 100%);
}
```

For a medium value:

```css
--growth-value: .55;
```

Do not use a detached leaf unless it directly functions as the marker.

---

# 10. Stature Strip

The stature strip remains:

- vertically centred on the left side
- integrated into the dark green ornamental border
- secondary in hierarchy
- readable without covering the plant image

Display:

```text
STATURE
2–2.5 ft H × 1.5–2 ft W
```

For accessibility, duplicate the content in screen-reader-only horizontal text.

---

# 11. Main Plaque Spacing

The plaque should use generous but economical padding.

```css
.power-points {
  padding:
    clamp(.75rem, 1.8vw, 1.15rem)
    clamp(.8rem, 2vw, 1.25rem);
}

.metric-row {
  min-height: clamp(3.1rem, 8vw, 4.4rem);
  display: grid;
  grid-template-columns:
    clamp(2.25rem, 7vw, 3.4rem)
    minmax(7rem, .85fr)
    minmax(10rem, 1.5fr);
  align-items: center;
  column-gap: clamp(.55rem, 1.5vw, .9rem);
}
```

Each row must have:

- visible separation
- aligned icon baselines
- consistent rating spacing
- no text collision
- no unnecessary empty top layer

---

# 12. Responsive Behaviour

## Wide phone / tablet

Use the full collectible layout.

## Narrow phone

Keep the visual card, but scale typography and icon gaps with `clamp()`.

Do not rotate additional text to save space.

## Accessibility mode

Provide a simplified semantic list beneath the visual card:

```html
<dl class="plant-card__accessible-data">
  <dt>Bloom</dt>
  <dd>Summer, July to October</dd>
  <dt>Pests and diseases</dt>
  <dd>0.5 out of 5</dd>
  <dt>Water need</dt>
  <dd>2 out of 5</dd>
  <dt>Care level</dt>
  <dd>Easy, 1.5 out of 5</dd>
</dl>
```

---

# 13. Decorative Tokens

```css
:root {
  --ink: #27351D;
  --forest: #173B24;
  --forest-deep: #0F2A19;
  --gold: #B99345;
  --gold-light: #D8BD78;
  --paper: #EED9AE;
  --paper-light: #F6E8CB;
  --paper-shadow: rgba(52, 37, 16, .28);
  --blue-button: #0F6196;
  --warning: #D89319;
}
```

Texture should be applied as a subtle overlay and must never reduce text contrast.

---

# 14. Implementation Safeguards

## Never allow

- vertical or sideways `PLANT POWER POINTS`
- unbound visual ratings
- opacity-based half ratings
- inconsistent numbers and filled icons
- duplicated `Full sun` labels
- hot-to-cold light gradients
- growth speed inside a bulky box
- real pesticide branding
- mixed icon rendering styles
- cropped text
- unequal left and right margins
- new rows appearing because the image generator improvised

## Must always pass

- visual rating equals database value
- all icons use one SVG view box size
- all rows share the same grid
- card is centred
- heading remains horizontal
- plant photo keeps the largest visual area
- text remains selectable and accessible
- warnings are real text, not baked into an image

---

# 15. Suggested File Structure

```text
src/
  components/
    PlantCard/
      PlantCard.tsx
      PlantCard.css
      PlantPowerPoints.tsx
      RatingScale.tsx
      BloomTimeline.tsx
      LightScale.tsx
      GrowthSpeed.tsx
      icons/
        RedSpiderMite.svg
        SprayBottle.svg
        Secateurs.svg
        WaterDrop.svg
        Compass.svg
        Soil.svg
  data/
    plants/
      kniphofia-orange-blaze.json
```

---

# 16. Claude Code Build Brief

Copy this section directly into Claude Code:

```md
Build a reusable responsive HTML/CSS/TypeScript `PlantCard` component based on this specification.

Hard requirements:

1. The card must be centred with equal left and right margins.
2. `PLANT POWER POINTS` must remain horizontal and centred inside the main parchment plaque. It must never rotate.
3. All content must come from a plant-data object.
4. Rating fills must be calculated from numeric values and support 0.25, 0.5 and 0.75 using SVG clipping masks, never opacity fading.
5. Bloom should use a Jan–Dec timeline with the active flowering months highlighted.
6. Pests use a red spider mite row emblem and generic green spray-bottle rating widgets.
7. Thirst uses water-drop rating widgets.
8. Care uses a white plant-care emblem with a red cross and secateurs rating widgets.
9. Light runs from dark shade on the left to bright full sun on the right. Include a thin accepted-range band and narrower green optimal-range band.
10. Growth speed is a transparent vertical overlay on the right side of the photograph, not a boxed panel.
11. Use semantic HTML and include a screen-reader-readable text version of all metrics.
12. Do not bake any functional text into background images.
13. Use the plant photo only as the card background image.
14. Preserve the visual style: weathered cream parchment, deep forest green, antique gold, elegant serif headings, blue Listen button and green hardiness crest.
15. Create a sample card using the supplied `kniphofia-orange-blaze` data object.
```

---

# 17. Acceptance Checklist

Before calling the template complete:

- [ ] Card centred in viewport
- [ ] Equal outside margins
- [ ] Horizontal `PLANT POWER POINTS`
- [ ] Heading inside plaque
- [ ] Bloom months correct
- [ ] Pests numeric score matches bottle fills
- [ ] Thirst numeric score matches droplet fills
- [ ] Care numeric score matches secateur fills
- [ ] Partial icons use geometric clipping
- [ ] Growth speed is transparent and right-aligned
- [ ] Stature values sit 7px under their HEIGHT/SPREAD lettering on the left rail, in the one deck convention (`1.5–2.5 m` / `40–60 cm` / `12 m+`)
- [ ] Light runs shade to full sun
- [ ] Brightest end corresponds to full sun
- [ ] Tolerated and optimal light ranges are distinct
- [ ] Soil warning legible
- [ ] No brand logos
- [ ] Icons share one visual style
- [ ] Text selectable
- [ ] Keyboard and screen-reader support
- [ ] Mobile layout tested
- [ ] Plant photograph remains visually dominant

---

# Final Recommendation

Claude’s recommendation is correct.

Use the image as the **visual blueprint**, then code the card as a real component. Trying to regenerate every plant as a complete image will repeatedly introduce drifting margins, rotated labels, corrupted icons and mismatched ratings.

The strongest workflow is:

1. lock this design in HTML/CSS
2. define one plant-data schema
3. render each plant from JSON
4. use generated imagery only for plant photos and decorative art
5. validate horticultural facts separately from the visual layer

That gives Plinder a recognisable collectible identity without sacrificing accuracy, responsiveness or maintainability.

---

# Timber addendum — how this maps onto OUR data (added by Claude, agreed with Oscar)

This document arrived written for "Plinder" with a React/TypeScript file structure.
Timber adopts its **design rules, tokens, rating mechanics and acceptance checklist**
verbatim, with these deltas:

1. **Stack**: vanilla HTML/CSS/JS inside single-file `timber.html` — no React, no
   build step (locked project constraint). Component = `renderCard()` template.
2. **Data source**: `plants.csv` columns, not per-plant JSON files:
   - pests bottles  = (100 − powerPest) / 20   → quarter-step segments
   - thirst drops   = (100 − powerWater) / 20
   - growth-speed marker = powerGrowth / 100
   - light marker   = lightLevel / 100
   - bloom timeline = parsed from `peak` (month ranges); non-month values
     ("Year-round foliage") fall back to text display
   - stature        = `size` string
3. **Missing data — never faked** (rows hidden until columns exist / are rated):
   - `careLevel` (Care row) — NOT yet a column; shown in mockups as [demo] only
   - light tolerated/optimal ranges — doc's example values are demo; a
     deterministic mapping from `aspect` wording is to be defined
   - aspect facing — compass needle only when data states one; muted "any aspect"
     otherwise. The generated reference image invented "South / West" for
     Kniphofia; the production card must not.
4. The generated image also showed bloom "June–August"; real `peak` data says
   Jul–Oct. Image = art direction; data = truth. Always.
