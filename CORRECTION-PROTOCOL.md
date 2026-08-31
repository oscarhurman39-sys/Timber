# Timber Correction Protocol — layout defects: observe, fix, insulate

This file is the runnable procedure for catching and correcting card-layout
defects. It exists because three defects shipped on live cards without being
noticed by the QA checklist ("render + screenshot + look at it" missed them),
and were spotted by Oscar on his phone (2026-07-24). The lesson: **eyeballing
does not catch 1–4px defects — measuring does.**

## 1. The observation tool

```sh
python3 -m http.server 8477 &            # from repo root
NODE_PATH=/opt/node22/lib/node_modules node design/audit-layout.js
```

`design/audit-layout.js` renders the live deck headlessly and measures every
card against four rule classes, exiting 1 on any violation:

| Rule | What it measures |
|---|---|
| `ink-fits-box` | every live text zone (`.val-ink`, title, latin): content must not overflow its box (scroll vs client, 1px tolerance) |
| `band-collisions` | wiggle-room label inside the band, right of the 38% line, clear of the sun icon; marker triangle within the bar span (40.4–93.2%) |
| `rail-alignment` | growth diamond's **visual** centre on the axis centreline within 0.5px (sprite alpha-bias compensated — see §4) |
| `rail-overflow` | spine H/S value text must fit its parchment patch (Range-measured; 2px tolerance for the feathered edge) |
| `rail-format` | spine H/S value must read in the one deck convention: `1.5–2.5 m` / `40–60 cm` / `12 m+` (en-dash, one space before the unit) — catches a data shape `normSizeSpan` can't parse |
| `rail-anchor` | spine H/S value must start exactly 7px under its baked HEIGHT/SPREAD lettering (±1.5px), whatever its length — the v14.43 fix for values drifting with their own centring |
| `within-card` | no live ink outside the card face |
| `band-collisions` (plaque) | no value patch overlaps a baked label row (the "blurred words" defect) |
| `focus-photo` | every PHOTO_FOCUS key is a current plant's **latin-slug** with a file on disk — catches staging a photo under the JSON `id` when the renderer keys off the latin name |

**It runs on every plant in the deck**, so a new plant with unusually long
data is caught the moment it's added, not when a customer sees it.

## 2. Standing run order (the insulation)

The audit is part of the build gate. Before any push that touches
`timber.html`, plant data, or `art/`:

```sh
NODE_PATH=/opt/node22/lib/node_modules node tests/app-test.js      # 94 checks
NODE_PATH=/opt/node22/lib/node_modules node tests/edge-test.js     # 8 checks
NODE_PATH=/opt/node22/lib/node_modules node tests/sw-update-test.js
NODE_PATH=/opt/node22/lib/node_modules node design/verify-cards.js # card builder
NODE_PATH=/opt/node22/lib/node_modules node design/audit-layout.js # layout audit
```

All five must pass. `tests/README.md` carries the same list.

Data-side guard: `tools/check-plant-json.js` now warns when `soil` (>45 chars)
or `soilWarning` (>60 chars) will force the soil panel to shrink its type —
trim at source rather than shrink at render when possible.

## 3. The defect log this protocol was built from (2026-07-24 audit)

Pre-fix baseline: **31 violations across 8 cards.** Oscar spotted three defect
classes from his phone; the audit found two more nobody had seen.

| # | Defect | Root cause | Fix |
|---|---|---|---|
| 1 | Aspect facing text overwrote painted artwork on every 3-facing card | `.t-baspect` box was 14.5% of the band (~50px); "East / South / West" needs ~78px | box widened to 25.5% into the space freed by the sun move (#5); painted divider covered, redrawn in CSS at 38.9% |
| 2 | "wiggle room" label written over the painted sun icon (low `sunMin` cards) | label always extends left from its leader | label flips to the right of the leader when the leader sits left of 51% (`.b-wiggle.flip`) |
| 3 | Growth diamond a hair right of the rail line on every card | sprite's visible diamond is +2px right of its bitmap centre (alpha bbox 7..40 in 44px) — placement maths were exact, the art is biased | rendered with `translateX(calc(50% - 0.8px))` compensation (0.8px = 2px × 17/44 display scale) |
| 4 | Pest/Thirst "n/5" values overflowed their boxes 2px vertically on **every rated card** (audit find) | `.pval` line-height 1.25 × 11px = 13.75px in a ~12px box | line-height 1 |
| 5 | Long soil warnings overflowed their zone — Potentilla by 29px (audit find) | fixed zone, unbounded text | `fitInk()` auto-shrink at render (floor 6.5px) + checker length warnings |

Sun icon relocation (Oscar's call, same session): the painted sun sat between
the aspect text and the *shade* end of the light bar — wrong end semantically,
and it blocked the aspect text's room to grow. Extracted as `art/sun-icon.png`
(70×80 from the band at x 272, y 18), painted original covered by the
`.b-sun-cover` patch, sprite re-placed at the **sun end** (88.4%, top 4%,
5.2% wide — sized to clear the marker triangle's zone).

## 4. Rules for the next correction

1. **Reproduce by measurement first.** Add or extend a rule in
   `design/audit-layout.js` that fails on the defect before touching the fix.
   A defect the audit can't see will ship again.
2. **Fix at the cheapest layer**: data (trim at source) → CSS (one token) →
   render maths → art. Touch `art/` last; every sprite change invalidates
   measured constants (the diamond bias, the sun crop) — re-measure and update
   the constants in the audit header when you do.
3. **Baseline before, clean after.** Run the audit pre-fix and keep the
   violation list in the changelog entry; run it post-fix to zero.
4. **Then the full gate** (§2) and screenshots of at least one affected card.
5. Record the decision in `CARD-PROTOCOL.md`'s changelog as usual.

## 5. Known deferred item

`design/card-builder.html` (the standalone template of record) still carries
the pre-fix band layout — same aspect-box, sun-position and diamond-bias
defects. The deck in `timber.html` is fixed and audited; syncing the builder
(and teaching `design/verify-cards.js` the same four rules) is the next brick
for the design pipeline. Until then, treat builder output as mockup-only.

The **spine rails** are the exception: the builder's `.railval .v` was synced
with the v14.43 fix (7px anchor under the lettering, antique-gold ink), so
rail styling no longer drifts between the two. Its sample values are hardcoded
in the canonical shape; the deck's `normSizeSpan` is not ported because the
builder renders no live data.
