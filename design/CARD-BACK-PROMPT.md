# Gemini prompt — Timber card-back FRAME

## Read this first — v1 asked for the wrong thing

The first version of this prompt asked for a Yu-Gi-Oh-style card back: a
symmetrical design radiating from a central medallion. Gemini did that well and
the result was unusable, because **a Yu-Gi-Oh back is decorative precisely
because nothing is ever printed on it.** Our flip side is a working page — a
safety plaque, a legal plaque, price cells and a data grid. A centred medallion
with cross-bars quarters the card into four small panels, which is the one
layout that cannot hold any of that.

So this is not a card back. **It is a frame**, in the same family as the front's
`frame-full.png`: ornament around the edge, and a large empty middle that the
app fills with content.

The medallion from the v1 attempt is worth keeping — it makes a good face-down
/ deck-stack image for later, and a good small crest. It is just not this.

---

## THE PROMPT

> Here is the FRONT of a collectible plant trading card. Design a matching
> **FRAME for the reverse**, in the same house style. The reverse is a printed
> information page: the app will lay panels of text over the middle of it, so
> the middle must stay empty.
>
> **Layout — this is the part that matters most:**
> - Portrait, 5:7 aspect ratio, artwork bleeding to all four edges.
> - A **narrow ornamental border** around the perimeter, no more than 7% of the
>   card width deep on each side.
> - A **header band across the top**, about 12% of the card height, holding a
>   small circular gold medallion no wider than 15% of the card, centred, with a
>   simple two-leaf-and-stem emblem inside it. Fine scrollwork either side of it.
> - A **narrow footer band** across the bottom, about 7% of the card height, with
>   a single fine gold rule and small corner fleurons.
> - **Everything between the header and the footer — the central 80% of the card
>   — is ONE uninterrupted empty field.** No medallion, no cross-bars, no rules,
>   no quartering, no panels, no ornament floating in it. It must read as a
>   single clear surface waiting to be written on.
> - The only thing permitted in that central field is an extremely faint
>   texture: concentric growth rings like a tree cross-section, at very low
>   contrast, barely visible — no more than a whisper against the ground.
>
> **Match this card's existing style exactly:**
> - Deep bottle-green leather-textured ground, near-black at the edges
>   (#0c1810 → #14301f), with a subtle mottled enamel sheen — not flat colour.
> - Warm antique gold for every line and ornament (#D8BD78 mid, #f5c451
>   highlight, #8a6a2a shadow), bevelled like stamped foil on card stock.
> - Small filigree fleurons in each of the four corners, matching the front.
> - Botanical, not occult or heraldic-medieval: leaves, seeds, tendrils, rings —
>   no dragons, runes, crystals, eyes or wizardry.
>
> **Hard requirements:**
> - **Absolutely no text, letters, numerals, words or logos anywhere.** No
>   wordmark, no signature, no watermark.
> - Flat printed-card look — even lighting, no cast shadow, no 3D mockup, no
>   card floating on a surface, no perspective, no rounded-corner cutout, no
>   background behind the card. The image IS the card face, edge to edge.
> - The central field must stay dark enough that pale text laid over it is
>   legible, and even enough that text does not sit half on ornament.

---

## Notes for us

- **The test is simple:** cover the middle 80% of the output with a rectangle.
  If anything was lost, the frame has failed.
- Ask for the header medallion **small**. Every model wants to make it the hero.
- Deliver at 1200 px on the short edge minimum, PNG with transparency if it can,
  otherwise flat. Staged in `art/`, `.webp` derivative via `tools/optimise-art.js`.
- Provenance: generated art, recorded as such in `CREDITS.json`. Acceptable here
  because there is no plant in it — it is decoration, not evidence.

## The alternative, if the frame keeps coming back wrong

This can be built in CSS and inline SVG instead of generated art: border, corner
fleurons, header band and medallion, all drawn to the card's real geometry. It
would match the palette exactly, cost nothing in page weight, scale cleanly to
any card size, need no provenance note, and — the point — the empty field would
be empty by construction rather than by asking nicely. Slightly less painterly
than good generated art. Say the word.
