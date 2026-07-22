# Timber Card Protocol

Status: **DESIGN ITERATING — not final.** This file is the working agreement for how
plant cards get designed, checked, and shipped. Follow it on every card mockup and
every card that goes into `timber.html`. Update the changelog when Oscar decides
something; never silently drift from a decision recorded here.

## 1. Card anatomy (current draft — v2)

- **Wood-grain frame** on all four sides (~13px, CSS gradients, original — no copied
  artwork). Rounded corners.
- **Photo is the cornerstone.** It fills the card edge-to-edge inside the frame,
  ≥50% of it clearly visible. Everything else floats over it in panels.
- **Top paper panel** (slim): common name, hardiness pill (top-right, gold), latin
  name in italic + 🔊 pronunciation.
- **Bottom paper panel**: fact oblongs (Water / Position / Soil / Prune), hue-tinted
  type strip, footer hint (⇅ double-tap) + tree-ring stamp.
- **Paper style**: aged vintage — cream base, subtle grain noise, coffee-ring and
  blotch stains, browned edges. Classy-worn, not dirty. Dark ink text on paper;
  white shadowed text only ever sits directly on photo.
- **Compass, not sun icon, for Position** when the aspect data names a direction
  (S, S/W, N-facing…): small compass rose with the stated direction(s) highlighted.
  If the data has no direction, use the plain wording without a compass — NEVER
  invent a facing the data doesn't state.
- Hue strip colour comes from the plant's `hue` field.

## 2. Content QA checklist — run on EVERY card before showing Oscar

- [ ] **Photo focal point**: the identifying feature is centred or given an explicit
      `object-position`; nothing important cropped off. Barcodes/labels not dominant.
- [ ] **Photo is the right plant** — matches the name Oscar supplied; if unsure, ask,
      don't assume.
- [ ] **No duplicate phrases across fields** — e.g. "well-drained" belongs in Soil
      OR Water, not both. Water = moisture regime; Soil = soil type/drainage.
      Trim drafted (Gemini/AI) text; it repeats itself.
- [ ] **Caption/visual line ≤ ~90 chars** at card size; trim drafted text to fit.
- [ ] **Compass rule** respected (see anatomy) — direction shown only if data states it.
- [ ] **Commercial fields**: blank stays blank. Never a guessed price/margin on a card.
- [ ] **Hardiness pill** matches the data row; latin spelling eyeballed.
- [ ] **Contrast**: dark ink on paper, shadowed white on photo, nothing marginal.
- [ ] **Render + screenshot + look at it** before sending. Measured, not assumed
      (frame padding equal on all sides; panels not overlapping).

## 3. Iteration workflow

1. Mock the change in scratchpad HTML (never straight into `timber.html`).
2. Screenshot, send to Oscar, get feedback.
3. Record his decisions in the changelog below.
4. When he declares the design FINAL: implement once in `renderCard()` in
   `timber.html` — every card (old and new) re-renders through that one template
   automatically. The only per-plant work is photos + focal points; no manual
   re-mapping of old cards.
5. Full Playwright suite must stay green before push.

## 4. Per-plant photo register

Photos live in `photos/<latin-slug>.jpg` (1200px wide, EXIF-corrected, ~250KB).
Focal point recorded here when off-centre:

| plant | file(s) | focal point |
|---|---|---|
| Chamaerops humilis | chamaerops-humilis.jpg | centre |
| Hydrangea 'Pink Annabelle' | hydrangea-arborescens-pink-annabelle.jpg | bottom bloom, ~50% 75% |
| Pittosporum 'Elizabeth' | pittosporum-tenuifolium-elizabeth.jpg | centre |
| Osmanthus 'Tricolor' | osmanthus-heterophyllus-tricolor.jpg | centre |
| Cercis 'Eternal Flame' | cercis-canadensis-eternal-flame-wide.jpg / -leaf.jpg | wide: centre · leaf: ~70% 40% (leaf sits right of centre) |
| Agastache 'Summerlong Coral' | agastache-summerlong-coral-flowers.jpg / -leaf.jpg | flowers: ~35% 40% (edges) · leaf: ~60% 45% windowed centre |
| Nandina domestica | (processed, not yet staged) | photo1 centre |

## 5. Decision changelog

- **v1** (original spec): dark gradient card + leaf watermark, no photos. Locked
  until Oscar reopened the design.
- **v2 feedback (Oscar)**: photos in; wood frame on ALL cards; trading-card layout
  fine to borrow as generic convention (no Pokémon art/fonts/symbols); LESS paper —
  photo dominant, slim top + bottom panels only; keep the fact oblongs; coffee-stain
  vintage paper; compass instead of sun for direction-bearing aspect data; fix leaf
  photo centring; dedupe "well-drained" repetition.
- **v3 (Oscar)**: two-photo merge recipe approved for trial — flower/habit photo
  full-bleed at edges, detail photo soft-windowed (elliptical mask ~46%x26% at
  50% 40%) into the clear band above the Water box. Dedupe rule caught its second
  live case (Agastache drainage stated in both Water and Soil; trimmed at source).
- **v4 (Oscar's vibe image, rebuilt original)**: gold hardiness SHIELD top-right;
  compass as a 44px parchment BADGE on the photo (solves legibility); stats header
  renamed "GROWER STATS" — Oscar correctly ruled "Cultivar Power Stats" wrong for
  straight species (cultivar = named cultivated variety in quotes only). Star
  ratings from the vibe image REJECTED as invented data; replaced with honest
  derivations only: hardiness as pips on the real H1–H7 scale + tolerance chips
  emitted only when the `resilience` field states them. Footer: front says
  "⇅ Double-tap to dig deeper"; rhyming line reserved for empty state. Back keeps
  the full trade sheet and gains a 🔖 Remember button (double-tap only flips;
  saving is a deliberate button press — no accidental saves).
- **Open**: final design not yet declared; v4 dropped the Position oblong (compass
  carries direction) but sun/shade wording is real data — restore slim Position row
  or caption the compass? Remember list feature approved in concept, not yet built;
  fallback for photo-less plants = gradient+watermark inside the same frame.
