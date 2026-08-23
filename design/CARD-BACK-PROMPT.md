# Gemini prompt — Timber card BACK artwork

Send Gemini **one photo of an existing Timber card front** (any card, full bleed,
no phone chrome) plus the prompt below. The front is the style reference; the
output is its matching back.

---

## THE PROMPT

> Here is the FRONT of a collectible plant trading card. Design the **BACK** of
> the same card, in the same house style, as a single flat printed artwork.
>
> **Match this card's existing style exactly:**
> - Deep bottle-green leather-textured ground, near-black at the edges
>   (#0c1810 → #14301f), with a subtle mottled enamel sheen — not flat colour.
> - Warm antique gold for every line and ornament (#D8BD78 mid, #f5c451
>   highlight, #8a6a2a shadow). Gold is bevelled and slightly three-dimensional,
>   like stamped foil on card stock.
> - A double gold hairline border inset about 4% from the trimmed edge, with
>   small filigree fleurons in each of the four corners.
>
> **Composition — take Yu-Gi-Oh card backs as the structural reference:**
> - Strongly **symmetrical**, radiating outward from a **circular medallion in
>   the exact centre** of the card.
> - The medallion is a raised gold ring holding a simple emblem: **two stylised
>   gold leaves on a single stem**, the same emblem as on this card's hardiness
>   shield. Nothing else inside the ring.
> - Around the medallion, concentric ornament radiating to the edges: fine gold
>   scrollwork, botanical filigree, seedhead rays, and faint concentric growth
>   rings like a tree cross-section, all on the dark green ground.
> - Ornament is **densest in the ring around the medallion and along the border**,
>   and **calmest in the four broad areas between** — those quiet zones matter.
>
> **Hard requirements:**
> - **Absolutely no text, letters, numerals, words or logos anywhere.** No
>   wordmark, no signature, no watermark.
> - Portrait, 5:7 aspect ratio, artwork bleeding to all four edges.
> - Flat printed-card look — even lighting, no cast shadow, no 3D mockup, no
>   card floating on a surface, no perspective, no rounded-corner cutout, no
>   background behind the card. The image IS the card face, edge to edge.
> - Ornate but legible at thumbnail size: no fine noise or busy micro-detail
>   that turns to mush when the card is 3cm tall.
> - Botanical, not occult or heraldic-medieval: leaves, seeds, roots, tendrils
>   and rings — no dragons, runes, crystals, eyes or wizardry.

---

## Notes for us

- **Ask for two variants.** One as above, and one with the mid-field ornament
  toned down further — the flip side has to carry the trade panels, and the
  quiet zones are where they sit. The busier version can be kept for a future
  face-down / deck-stack look.
- **Watch for invented text.** Image models add flourishes that read as letters.
  Reject any output with mark-like shapes inside the medallion.
- **Check it tiles as a stack.** Every card back in a deck is identical, so it
  will be seen twenty at a time, overlapping. Anything that only works as a
  single hero image will look wrong fanned out.
- Deliver at 1200 px on the short edge minimum, PNG. Staged like the other
  art in `art/`, with a `.webp` derivative built by `tools/optimise-art.js`.
- Provenance: whatever comes back is **generated art**, not a photograph, and
  goes in `CREDITS.json` saying so plainly. It is decoration with no plant in
  it — which is exactly why generated art is acceptable here when it is not
  acceptable for a plant photograph.
