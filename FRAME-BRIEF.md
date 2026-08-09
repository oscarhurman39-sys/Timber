# Frame brief — commissioning a new card outline / backing

Everything an image model needs to draw a Timber card frame that the live app can
actually use. Hand it the prompt in §7; the rest is why the numbers are what they
are.

Written for the Eternal Flame holo card, but it is the general spec — any future
frame regeneration should start here.

---

## 0. Read this first: how this went wrong last time

A ChatGPT frame regeneration has already been attempted and **rejected**. It came
back looking good in isolation and unusable in practice, because it:

- restyled the gold (so the new frame didn't match the crest, plaque, soil patch
  and band, which are separate images and were not regenerated),
- redrew the spine ornaments at different positions (so the HEIGHT / SPREAD value
  patches no longer sat on their baked lettering),
- **deleted the baked DOUBLE TAP TO MASTER strip** along the bottom.

The lesson is not "don't use AI for the frame". It is that **the frame is not a
standalone picture — it is one layer of a registered stack.** Six other painted
assets and about thirty live text overlays are positioned to land on it to the
pixel. A frame that is 20px off, or a different shade of gold, breaks all of them
at once.

So the brief below separates two things, and the split matters more than any
other instruction here:

| | |
|---|---|
| **Load-bearing** | Canvas size, the photo window, the spine width, the bottom strip, and the gold. Change any of these and the app breaks. |
| **Free** | Ornament styling, grain, texture, holo treatment, the *character* of the metalwork. Go wild here — this is where a Pokémon-inspired look actually lives. |

---

## 1. Canvas

| Property | Value |
|---|---|
| Artboard | **1103 × 1576 px** |
| Aspect ratio | **0.700** (portrait) |
| Displayed at | 420 × 600 CSS px (art is 2.626× the display size) |
| Corner radius | 15px at display size ≈ **39px on the artboard** |
| Format | PNG, RGB, no transparency needed outside the rounded corners |

The artboard is the **whole card**, edge to edge. It is used as
`background-size: 100% 100%`, so it is stretched to fit — never add a margin or
bleed, and never change the aspect ratio.

**On Pokémon proportions:** a real Pokémon card is 63 × 88 mm, ratio 0.716.
Timber is 0.700 — very close, which is why the Pokémon look transfers well. If
you ever print one, 63 mm wide gives a 90 mm tall card and the artboard lands at
about 445 DPI. Do **not** change the ratio to match Pokémon exactly; 0.700 is
baked into every overlay position.

---

## 2. The photo window — the single most important zone

A live plant photograph is drawn **on top of the frame**, covering this rectangle:

```
x 154 → 1072      (918 px wide)
y  30 → 1506      (1476 px tall)
```

Which means, as insets from each edge:

| Edge | Inset (art px) | As % |
|---|---|---|
| Left | **154** | 13.96% |
| Top | **30** | 1.90% |
| Right | **31** | 2.81% |
| Bottom | **70** | 4.44% |

**Everything inside that rectangle is invisible in the finished card.** Whatever
is painted there gets covered by the photo. This is genuinely liberating: the
interior does not need to be beautiful, or even coherent. (The current frame has
mirror-tiled seams running through it from the v12 → v14 elongation, and nobody
can tell, because the photo hides them.)

So the visible frame is only four bands:

```
┌──────────────────────────────────────────┐  ← top trim, 30px
│  ┌────┬──────────────────────────────┐   │
│  │    │                              │   │
│  │ S  │                              │   │
│  │ P  │      PHOTO COVERS THIS       │ R │  R = right trim, 31px
│  │ I  │      918 × 1476              │   │
│  │ N  │      (paint anything)        │   │
│  │ E  │                              │   │
│  │154 │                              │   │
│  └────┴──────────────────────────────┘   │
│        DOUBLE TAP TO MASTER              │  ← bottom strip, 70px
└──────────────────────────────────────────┘
```

---

## 3. The left spine — 154 px wide, full height

The most characterful visible area and the only one carrying baked text. It must
contain, top to bottom:

| Element | Vertical position (art px) | Notes |
|---|---|---|
| Top ornament / flourish | roughly y 40–300 | free styling |
| **HEIGHT** lettering | reads upward beside y 690–850 | vertical, small caps |
| Height value patch | **x 30, y 690, 84 × 160** | app pastes a parchment patch here |
| **SPREAD** lettering | reads upward beside y 1080–1242 | vertical, small caps |
| Spread value patch | **x 30, y 1080, 84 × 162** | app pastes a parchment patch here |
| Bottom ornament / flourish | roughly y 1300–1540 | free styling |
| Vertical rule + tick marks | full height | free styling |

The two value patches are separate images (`rail-patch-h.png`, `rail-patch-s.png`)
laid over the spine with the plant's dimensions written on them. The spine
artwork behind them can be anything — but the **lettering must sit beside those
rectangles, not under them**, or the label disappears under its own value.

---

## 4. The bottom strip — 70 px tall

Carries the baked text **DOUBLE TAP TO MASTER**, centred, in gold small caps with
a decorative flourish either side. This is the only instruction the user gets for
the card's core interaction, and deleting it is exactly how the last attempt
failed. It must be legible at display size, where the strip is only 27 px tall.

---

## 5. What NOT to draw

These are painted by **separate images** that sit on top of the photo. If the
frame also draws them, they double up:

| Do not draw | Because | Its slot (art px) |
|---|---|---|
| Hardiness shield / crest | `crest-blank.png` (190 × 212) | x 886, y 46 |
| Stats plaque + its Bloom / Pests / Thirst / Care rows | `plaque-full.png` (700 × 446) | x 167, y 946 |
| SOIL panel | `soil-full.png` (172 × 344) | x 886, y 1049 |
| ASPECT band + light gradient | `band-full.png` (900 × 118) | x 158, y 1392 |
| GROWTH SPEED rail, Fast/Slow labels, diamond | drawn in CSS, not art | right side of photo |
| Plant name, latin name, Listen button | live text | x 50, y 50 |
| PLANT POWER POINTS strapline | live text | x 167, y 918 |

All of these land **over the photo**, not over the frame, so the frame simply
should not include them. They are listed so you can see where they will end up
and avoid competing detail bleeding out from the trim behind them.

---

## 6. Palette — must match, this is load-bearing

The frame is one of seven images that have to look like the same object.

| Role | Hex | Where |
|---|---|---|
| Gold (primary trim) | `#f5c451` | frame edge, lettering, ornaments |
| Gold (deep / shadow) | `#e0a52f` | gradient partner |
| Card ground dark | `#0c1810` | deepest green-black |
| Card ground | `#0f2117` | spine base |
| Leaf light | `#4cd787` | accent only, sparing |
| Leaf mid | `#159a52` | accent only, sparing |
| Parchment ink | `#4d4131` | text on the parchment patches |
| Parchment cream | `#ecd7a0` / `#f2e8c8` | strapline and rail values |

If the gold shifts, the crest and plaque stop matching and the whole card reads as
assembled from two different decks.

---

## 7. Prompt to paste into ChatGPT

> Draw a trading-card frame, portrait, on a **1103 × 1576 px** canvas — the full
> card, edge to edge, no margin, no bleed, corners rounded by 39 px.
>
> Style: ornate fantasy trading card in the spirit of a holographic Pokémon card,
> but botanical rather than creature-based — aged gold metalwork on deep
> green-black, engraved botanical flourishes, subtle holo shimmer in the metal.
> Rich and collectible, not clean and modern.
>
> **Layout — these measurements are exact and must be followed:**
>
> - Leave the rectangle from **x 154 to x 1072, y 30 to y 1506** as plain, flat,
>   unobtrusive background. A photograph is pasted over it and covers it
>   completely. Do not put ornament, text or detail there.
> - **Left spine: 154 px wide, full height.** This is the showpiece. Include a
>   decorative flourish near the top, a vertical rule with tick marks running its
>   length, and a flourish near the bottom. Also engrave the word **HEIGHT**
>   reading upward, positioned *beside* (not inside) a clear rectangle at
>   x 30–114, y 690–850; and the word **SPREAD** reading upward, beside a clear
>   rectangle at x 30–114, y 1080–1242. Those two rectangles must be left plain —
>   labels are pasted onto them.
> - **Top trim: 30 px.** **Right trim: 31 px.** Simple gold edge moulding.
> - **Bottom strip: 70 px tall, full width.** Centred gold small-caps text
>   **DOUBLE TAP TO MASTER**, with a small decorative flourish on each side. It
>   must stay legible when the card is shown at 420 × 600.
>
> **Colours — match exactly:** gold `#f5c451` with `#e0a52f` for depth; grounds
> `#0c1810` and `#0f2117`; green accents `#4cd787` / `#159a52` used sparingly.
>
> **Do not draw:** any shield, badge, stat panel, table, icons, compass, gradient
> bar, plant name, or any text other than HEIGHT, SPREAD and DOUBLE TAP TO
> MASTER. Those are separate layers added by the app and will collide.
>
> Output a single PNG at exactly 1103 × 1576.

---

## 7b. What actually came back (Eternal Flame, 2026-08-09)

The first frame commissioned from this brief. Worth recording, because it shows
which parts of the spec survive a round trip and which do not.

**Got right:**

| | |
|---|---|
| Aspect ratio | 0.6998 against a specified 0.700 — effectively exact |
| Canvas | 1049 × 1500 rather than 1103 × 1576. Harmless: the art is stretched to the card with `background-size:100% 100%`, so only the ratio matters |
| Plaque slot | drawn box within ~0.5% of the real 15.14% / 60.02% / 63.46% slot |
| Soil slot | drawn box within ~0.5% of the real 80.33% / 66.55% / 15.59% slot |
| No crest, no icons, no compass | correctly left to the overlays |

**Got wrong:**

- **No HEIGHT / SPREAD lettering on the spine**, despite being spelled out with
  coordinates. Supplied in CSS by `.holo` instead.
- **No DOUBLE TAP TO MASTER strip**, despite being called out as the thing the
  previous attempt got closed for. Also supplied by `.holo`.
- **Drew the plaque, soil panel and band boxes** despite an explicit do-not-draw
  list. No harm as it turned out, because they land under the real parchment —
  but that was luck, not compliance.
- **Spine is ~16.2% wide against a specified 13.96%**, so the photo window
  overlaps the spine's inner gold edge by about 2%. Barely visible in practice.

**The lesson for next time:** the model reliably follows *proportions and box
positions* and reliably ignores *"do not draw X"* and *small baked text*. So
assume any lettering will have to be added in CSS, and assume anything on the
do-not-draw list may arrive anyway — check that it lands where the real overlay
will cover it.

## 8. Checking what comes back

Before wiring a new frame in:

```sh
node tools/template-geometry.js --check   # anchors still line up
node tests/run-all.js                     # includes the layout audit
```

The layout audit measures whether live ink still fits its zones and whether the
rail values sit on their axis, so it catches a frame that has drifted even when
it looks fine. Save the new file as `art/frame-600.png` (keep the old one until
the audit is green).

Two things the tools cannot check, so check them by eye:

1. the gold matches the crest and plaque,
2. the DOUBLE TAP TO MASTER strip is still there and readable at phone size.

If the card height ever changes, do **not** re-derive the overlay positions by
hand — `node tools/template-geometry.js --reflow <new height>` does the
arithmetic, and it has been validated against the real v12 → v14 change.
