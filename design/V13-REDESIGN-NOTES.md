# v13 redesign — measured breakdown of Oscar's reference (2026-08-06)

Source: AI-generated reference mock Oscar supplied (941×1672 px ≈ 390 CSS-px
phone at 2.41×). This file records what was measured from it and how the
built mock (`card-v13-fullscreen-mock.html`) maps it onto our system. The
reference is a *mood with proportions* — exact values below are what the
built mock committed to.

## Overall composition

| Element | Reference | Built mock (390×844) |
|---|---|---|
| Card | inset in page, buttons below | **full screen**, no app bar, no buttons |
| Wood frame | ~10px gold, rounded | 9px CSS gold woodgrain, radius 20 |
| Left rail | ~15% width, dark green | 52px (13.4%), green gradient + gold edge line |
| Photo | ~54% of card height | 470px (56%), dark fade top and bottom |
| Plaque | ~34% height, full content width | 458→732, spans content width minus 8px gaps |
| Bottom band | ~10% height, aspect+soil split | 740→808, split 1.3 : 1 |
| Brand | app bar above card | floats top-left over photo, gold, 82% opacity |
| Menu | chunky button in app bar | faded ☰ top-right over photo, 48% opacity |

## The box aesthetic (the part Oscar loves)

Border construction, outside → in, measured off the reference corner zoom:
1. **cream halo** (~1px parchment showing outside the dark line)
2. **thick dark-brown outline** ~2.6px (#3b2a10)
3. parchment margin ~5px
4. **thin gold-brown pinstripe** ~1.2px (#7c5a1e)
5. parchment field: `parch-swatch` tile + edge vignette (wide soft brown
   stroke clipped inside the shape, opacity ~.26)

**Corners are concave scallops** ("architectured divits") — not chamfers,
not rounds: the border bites *inward* in a quarter-circle (r≈10px outer,
r≈6.5px pinstripe). Implemented as real SVG paths (`scallopPath()` in the
mock — arcs with sweep=0), so background, vignette, and all three border
lines follow the bite exactly. This is the signature shape; keep it
identical on every box.

Plaque title sits INSIDE the box: dark-brown letterspaced caps flanked by
gold arrow-vine flourishes; thin warm-brown row dividers (rgba(92,74,40,.42))
between rows only — no outer rules.

## Left rail composition (top → bottom)

Leaf-diamond finial → space → HEIGHT (gold small-caps 8.5px, ls 2.2) →
bud-on-line ornament → value in cream serif 17px on two lines ("4–8" / "m")
→ diamond-node axis segment → SPREAD group (same) → long thin hairline →
bottom finial. All centred in the column, everything gold (#c9a24b) on
green except the cream values. The neatness = one centred column, one
accent colour, generous vertical gaps.

## Spacing rhythm

- Plaque rows ~57px tall — icon column 30px, text column 74px, widgets
  fill the rest, all vertically centred; the row height is the luxury.
- Month tiles: 12 across the widget zone, ~11×20px, 2px gaps, radius 3.
- Band cells: label (9px caps) → value (11.5px) → widget/warning lines,
  stacked with 1–3px gaps; vertical hairline divider between cells.
- Uniform icon language: flower / mite / drop / secateurs — no boxed icons.

## Round 3 corrections (Oscar, 2026-08-06 — supersedes the full-screen round)

Oscar rejected the full-screen round: geometry wrong, not aesthetics. Locked
target = his second reference image. Corrections applied in
`card-v13-mock.html` (round 3, now the canonical mock):
- App chrome (Timber brand, search, menu, progress) OUTSIDE the card; nothing
  app-level inside it. Card margins ~14px, height extended only into the
  space the three action buttons used to occupy. Frame thinned to 6px.
- Left rail 44px ≈ 12% — ornamental measurement rail only.
- One-line serif title; compact crest top-right; growth speed a narrow gold
  instrument hugging the photo's right edge (no right column).
- PLANT POWER POINTS: floating gold lettering over the photo above the panel
  — never a header row inside it. Panel starts at the Bloom row, 4 equal rows,
  spans rail edge → near right card edge. Aspect/Soil footer fully visible.
- Icons locked as-is: painted flower, spider mite, drop, yellow secateurs.

## Deviations from the locked v12 template (decisions for Oscar)

1. Card is full-screen 390×844 — swipe/tap gestures replace the three
   action buttons; deck chrome (search, counts) moves behind the menu.
2. Frame + rail are CSS/SVG in the mock, not `frame-full.png` (the baked
   art stretches at this aspect). Baking real art again is a later step.
3. Growth-speed marker is data-positioned (growthSpeed 9 → near Slow).
4. `PLANT POWER POINTS` no longer floats over the photo — inside the plaque.
5. Photo share of card ≈56%, satisfying the "photo is the cornerstone" rule
   even with the bigger plaque, because the buttons' space was reclaimed.
