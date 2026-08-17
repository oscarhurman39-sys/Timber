# Timber — photo reframe brief

**How to get an AI to crop, balance and de-label a plant photograph for the card
without it inventing anything.** Written 2026-08-17.

This is the image-side counterpart to `PLANT-BRIEF.md`. That one is pasted into a
text model and returns plant JSON. This one is pasted into a **vision** model with
a photograph attached and returns **crop JSON** — numbers, not pixels.

Related but different: `PROMPT-PHOTO-BUILD.md` is the handoff prompt for a whole
Claude Code photo session. This file is the single-photo reframing step inside it.

---

## 1. Read this before writing any prompt

The obvious approach — "here is my photo, crop it nicely and remove the label" —
**fails on this project specifically**, and it is worth being clear why before
designing around it.

Image models do not crop. They re-render. Ask Gemini, ChatGPT or Firefly to
"crop and clean up" a photograph and what comes back is a *newly synthesised
image* that resembles the input. Leaf venation, petal count, stem colour and
bark texture are all redrawn from a prior, not preserved. That is exactly the
class of change this repository already refuses:

- the Verbena photograph was **rejected** for carrying a Google C2PA manifest
  declaring `trainedAlgorithmicMedia`, plus SynthID and a visible watermark;
- a second Verbena frame was **rejected** for a "Photo assist" edit marker even
  though the underlying plant was real.

A regenerated photo would trip the same checks, and it should. On a card that
tells a customer what a plant looks like, resynthesised foliage is invented data
wearing a photograph's clothes.

**So the prompt must never ask a model to produce an image.** It asks the model
to *look* and *return numbers*. A deterministic tool then executes the crop on
the original pixels — `sharp` is already in the pipeline for
`tools/optimise-photos.js`, and an extract-then-resize is about thirty lines.

That split gives you: zero generated pixels, no provenance problem, a crop you
can re-run and audit, and a decision you can argue with because it arrived as
JSON rather than as a fait accompli.

---

## 2. The geometry, derived from the template

Every number below was measured from `timber.html`, not assumed.

**The card's photo window** is `.tphoto` at `left 13.96% / top 1.332% /
right 2.992% / bottom 4.378%` of a 420×600 card — **348.8 × 565.7 px, aspect
0.6165 (1 : 1.622)**. `object-fit: cover`, `object-position` default `50% 40%`.

**Card furniture sits on top of the photograph.** Converted to positions *within
the photo window*:

| Element | Covers | Photo-relative position |
|---|---|---|
| `.thead` — title + botanical name | top-left and centre | from **2.0%** down, out to **77%** across |
| `.crest` — hardiness crest | top-right corner | from **1.7%** down, from **80%** across |
| `.plaque` — stats plaque | the lower middle | everything below **62.2%** down |
| `.band` — bottom band | the foot | everything below **92.3%** down |

So on the card the readable photograph is a band from roughly **12% to 62% of
its own height**, full width, minus the top-right corner.

**The same master is cropped a second way.** The search detail sheet renders
`.d-photo img` at `aspect-ratio: 16/10`, `object-fit: cover`, no
`object-position` — a **landscape 1.6 crop taken from the dead centre**. A
photograph therefore has to survive one tall crop and one wide crop.

How much of the master each surface shows, by master aspect ratio:

| Master | Card shows | Detail sheet shows |
|---|---|---|
| 9:16 (0.562) | 100% of width | **35% of height** |
| 2:3 (0.667) | 93% of width | 42% of height |
| **3:4 (0.750)** | **82% of width** | **47% of height** |
| 1:1 (1.000) | 62% of width | 63% of height |
| 4:3 (1.333) | **46% of width** | 83% of height |

Two conclusions, and they are the useful part:

- **Never pre-crop a master to the card's 0.6165.** It looks right on the card
  and reduces the detail sheet to a 39%-height sliver. Masters stay generous.
- **Portrait between 3:4 and 1:1 is the safe band.** 3:4 is the best all-rounder;
  1:1 is the mathematically balanced point where both surfaces show about 62%.
  Landscape masters lose almost half their width on the card.

**The intersection — the zone visible everywhere, always:** horizontal middle
**80%**, vertical band from about **30% to 60%** down. Which is why the default
`object-position` is `50% 40%`: it already points there. Put the identifying
feature in that box and no per-card override is needed.

---

## 3. What the AI is allowed to change

The rule is one line: **it may change the framing and the exposure. It may not
change the plant.**

**Allowed** — these do not alter what the photograph is evidence of:

- Crop, straighten, rotate to level a horizon.
- Exposure and contrast within about ±0.7 EV, recovering blown highlights or
  crushed shadows.
- White balance correction *toward neutral* where the cast is clearly the light
  (polytunnel green, late-afternoon orange), never toward "nicer".
- Downscale. Never upscale — upscaling hallucinates leaf texture.

**Forbidden** — every one of these has already caused a refusal or a correction
somewhere in this repo:

- **Any generative fill, inpaint, outpaint, object removal or "cleanup" brush.**
- **Hue shifts on plant material.** Colour is diagnostic. Coprosma 'Inferno' had
  a photo *replaced* because the old one showed summer colouring on a card that
  sells the winter tones — the season was the correction. A saturation slider
  that pushes a pink bract toward red is fabricating a cultivar difference.
- **Removing "distracting" stems, leaves, buds or seedheads.** Habit is data.
- Background replacement or blur that was not in the lens.
- Sharpening beyond mild output sharpening; it invents venation.
- Compositing two frames into one. (Two-photo cards exist — that is `PHOTO_SWAP`,
  two separate files, declared. Not a merge.)

---

## 4. Plant labels — crop them out, never paint them out

Labels are the common case and the tempting one, because inpainting a label is
exactly what these models are good at. The policy is a ladder, and you stop at
the first rung that works:

1. **Crop it out.** Most labels sit at a frame edge or in the foreground gravel.
   A crop that removes the label and still holds the feature is the whole answer.
2. **Reframe around it.** If the label is inside the useful area but off to one
   side, shift the crop box; the window only needs the centre 80%.
3. **Let it sit behind the furniture.** A label low in the frame lands under the
   stats plaque below 62%, where nothing reads it. The QA checklist says
   "barcodes/labels not dominant" — not "absent". A half-visible label at the
   foot of a photograph is honest and invisible.
4. **Reshoot.** If the label overlaps the plant itself, the photo is a reshoot.
   One step to the left with the phone costs nothing; a painted-out label costs
   the card's provenance.
5. **Never inpaint.** There is no rung five. If Oscar overrides this for a
   specific photo, the edit is recorded in `photos/CREDITS.json` and in the
   card's row of the per-plant photo register in `CARD-PROTOCOL.md`, so nobody
   later mistakes it for a camera original.

The point of the ladder: a label is a framing problem, and framing problems have
framing solutions.

---

## 5. The prompt

Paste this with **one photograph attached**. It returns JSON and nothing else.

```
You are preparing a photograph for a plant trading card. You will NOT edit,
generate, redraw or output an image. You will look at the attached photograph
and return ONE JSON object describing how it should be cropped. A separate
deterministic tool performs the crop on the original pixels. If you output an
image, or describe an image you have made, you have failed the task.

THE PLANT: <common name> — <Latin name incl. cultivar>
THE IDENTIFYING FEATURE THE CARD PROMISES: <e.g. "coral-red young stems with
butter-yellow palmate leaves" — take this from the card's visual line>

WHERE THE CROP HAS TO WORK. The same file is displayed two ways:
  - Card: a tall window, aspect 0.6165 (1 : 1.622), object-fit cover,
    object-position 50% 40%. Card furniture covers the top 12% and everything
    below 62% of the photo's height, plus the top-right corner beyond 80% across.
  - Search detail sheet: a landscape 1.6 crop taken from the dead centre.
  The zone visible on BOTH is the horizontal middle 80% and the vertical band
  from 30% to 60% down. The identifying feature must land inside that box.

CROP RULES
  1. Output crop aspect ratio must be between 0.75 (3:4 portrait) and 1.0
     (square). Never crop to the card's 0.6165 — that starves the detail sheet.
     Never return a landscape crop.
  2. Crop only as much as the job needs. A generous master survives future
     template changes; a tight one does not.
  3. Keep the horizon level. Report any rotation needed, in degrees, separately.
  4. Never extend beyond the original frame. No outpainting, no padding.

WHAT YOU MAY RECOMMEND CHANGING
  Exposure within ±0.7 EV, and a white-balance correction TOWARD NEUTRAL where
  the cast is clearly the light. Nothing else. You must not recommend hue or
  saturation changes to plant material, removal of any leaf, stem, bud or
  seedhead, background blur, sharpening, upscaling, or any generative fill.
  Colour is diagnostic on these cards; changing it fabricates a cultivar.

PLANT LABELS AND PRICE TICKETS
  Find every label, price ticket, barcode, pot logo and handwritten stake in the
  frame. For each, decide in this order and report which rung you reached:
    "crop"      — a crop that meets the rules above removes it entirely
    "reframe"   — shifting the crop box removes it while keeping the feature
    "furniture" — it survives but sits below 62% height, hidden by the card's
                  stats plaque, and is not dominant
    "reshoot"   — it overlaps the plant itself, or removing it would cost the
                  identifying feature
  NEVER propose painting, patching, healing or generatively removing a label.
  "reshoot" is a perfectly good answer and is preferred over a compromised crop.

HONESTY RULES — these outrank everything above
  - If you cannot see the identifying feature in the photograph, say so and set
    verdict "reshoot". Do not crop toward where you assume it is.
  - If you are not confident the plant in the photograph matches the Latin name
    given — especially at CULTIVAR level — say so in "concerns" and set verdict
    "ask". 71% of this deck is cultivar-level and several species have three
    separate cards, so "it's an Acer palmatum" is not enough.
  - Never guess a measurement. Every number you return must be something you can
    point at in the image.

OUTPUT — exactly this JSON object, no prose before or after, no code fence:

{
  "sourcePx":        {"w": 0, "h": 0},
  "featureVisible":  true,
  "featureSeen":     "what you can actually see, in your own words",
  "featureBox":      {"x": 0.0, "y": 0.0, "w": 0.0, "h": 0.0},
  "crop":            {"x": 0.0, "y": 0.0, "w": 0.0, "h": 0.0},
  "cropAspect":      0.0,
  "rotateDeg":       0.0,
  "featureInSafeBox": true,
  "objectPosition":  "50% 40%",
  "labels": [
    {"box": {"x":0.0,"y":0.0,"w":0.0,"h":0.0}, "reads": "", "resolution": "crop"}
  ],
  "exposure":        {"evAdjust": 0.0, "whiteBalance": "none|warm-cast|green-cast|cool-cast"},
  "verdict":         "crop|as-is|reshoot|ask",
  "concerns":        [],
  "reason":          "one or two sentences on why this crop and not another"
}

All box and crop values are fractions of the ORIGINAL image, 0..1, x/y at the
top-left corner. "objectPosition" is the CSS value the card should use if the
default 50% 40% would not centre the feature after cropping; return the default
string when no override is needed.
```

---

## 6. Checking the answer

Four checks, in the order that catches the most for the least effort.

1. **Did it return an image?** Then it ignored the brief. Start again; do not
   salvage the picture.
2. **Does `cropAspect` sit between 0.75 and 1.0, and does `crop` fall entirely
   inside 0..1?** Arithmetic, and it catches outpainting instantly.
3. **Is `featureBox` inside the safe box** — x between 0.10 and 0.90, y between
   0.30 and 0.60 *after* the crop is applied? If not, either the crop is wrong or
   `objectPosition` has to move, and the model should have said which.
4. **Run the crop, then look at it.** `CARD-PROTOCOL.md` §2 already requires
   "render + screenshot + look at it before sending", measured not assumed. That
   still applies. A crop that satisfies every rule above can still be an ugly
   photograph, and that judgement is Oscar's.

Any `verdict` of `reshoot` or `ask` goes to `VERIFY-QUEUE.md` rather than being
worked around.

---

## 7. What this brief does not do

It does not balance a photograph *aesthetically* beyond framing and exposure —
no dodging, burning, or local contrast, because each of those is a per-pixel
change to plant material and the line has to sit somewhere defensible.

It also does not build the executing tool. The prompt returns coordinates; a
`tools/reframe-photo.js` that reads the JSON, calls `sharp().extract().rotate()`
and writes the master is roughly thirty lines and has not been written. Until it
exists, apply the numbers by hand in any editor that crops without re-encoding
the whole frame.
