# Timber — Card Back Specification

The **front** is the collectible: photo, identity, and at-a-glance ratings. The
**back** is the working page — what staff need once the customer is actually
interested, plus Oscar's trade data.

Status: **PART BUILT.** As of 2026-08-23 the back carries the card's own trim
artwork, a SAFETY plaque (section B toxicity, 45 cards) and a LEGAL plaque
(section E, 20 cards). The rest of the buyer trade sheet is unchanged and the
remaining sections below are still spec. This file defines what it should become and what to collect per
plant. Front spec lives in `CARD-STATS.md`; layout authority in `CARD-PROTOCOL.md`.

---

## 0. Why this exists (the gap it closes)

Two problems the back has to solve:

1. **Homeless data.** Since the v12 card went live, `water`, `prune` and `visual`
   are in every plant row but **render nowhere on the card** — the new front has no
   fact list and the back never carried them. They survive only in the search view.
2. **Discarded research.** Every plant JSON we receive contains genuinely useful
   material we currently throw away: toxicity, pollinator value, pruning method,
   what pests to watch for, breeder/PBR status, flower-colour behaviour. That's the
   answer to most questions a customer actually asks.

The back is where both land.

---

## 1. Design rules (inherited, non-negotiable)

- **Same locked aesthetic** as the front — parchment, forest green, antique gold.
  The back is a *page*, not a dashboard: it can be denser, but it is the same card.
- **Blank stays blank.** A field with no data is omitted entirely — never a guess,
  never a placeholder. (Most commercial fields are blank until Oscar fills them.)
- **Trade data is staff-only.** The customer-facing view must never show trade,
  margin, shrink, source or return risk. That separation already exists in the app
  (`showCustomer`) and must survive on the back.
- **Text, not images.** Warnings and care instructions are live text — never baked
  into artwork (accessibility + they change).
- **Double-tap flips; only a deliberate button saves.** No accidental actions here.

---

## 2. The five sections

### A. Aftercare — "I've bought it, now what?"
The answers staff give at the till. **This is where the currently-invisible fields go.**

| Field | Source | Notes |
|---|---|---|
| Watering | `water` | Regime in words. Distinct from the Thirst rating on the front — the front says *how much*, this says *how*. |
| Pruning | `prune` | When and how. The single most-asked aftercare question. |
| Feeding | *new* `feed` | e.g. "Balanced feed in spring; high-potash while flowering". Blank if unknown. |
| Winter care | *new* `winterCare` | Fleece, move under cover, cut back, or "none needed". Critical for anything H3 or below. |
| First-year care | *new* `establishing` | Most complaints come from year one. e.g. "Water weekly through the first summer." |

### B. Customer questions — the ones asked every single day
| Field | Source | Why it matters |
|---|---|---|
| **Toxicity / pet safety** | *new* `toxicity` | Asked constantly ("is it safe for my dog?"). Both hydrangea and abelia JSONs supplied this and we discarded it. Must state plainly, including "no specific warning required". |
| **Wildlife value** | *new* `wildlife` | Bees/butterflies/birds. Sells plants and is asked for by name. RHS Plants for Pollinators badge if it holds one. |
| **Evergreen / deciduous** | *new* `foliage` | "Will it look bare in winter?" Not currently captured anywhere. |
| **Container suitable?** | *new* `container` | Yes / yes-with-care / not really. Huge for the patio-plant conversation. |
| **Time to full size** | *new* `maturity` | The stature rail says *how big*; this says *how long*. Hydrangea JSON gave "about 3 years". |
| **Honest downside** | *new* `caveat` | Where it disappoints: "flops without support", "hates cold winds", "black spot in a wet year". Builds trust and cuts returns. |

### C. The sell — turning knowledge into a sale
| Field | Source | Notes |
|---|---|---|
| Talk track | *new* `pitch` | One sentence a staff member can actually say out loud. Not marketing copy. |
| Sells alongside | *new* `companions` | Basket-builder: 2–3 plants that pair well. Directly grows transaction value. |
| Peak selling window | `peak` | Already on the front as the bloom calendar; here it's the *sales* signal. |
| Look-alikes | *new* `confusedWith` | Which plants it's mistaken for and the tell that distinguishes them. Genuinely useful on the shop floor. |

### D. Trade sheet — Oscar's data, staff-only
Unchanged from the current back: `source`, `order`, `bench`, `root`, `trade`,
`retail`, `margin`, `type`, `shrink`, `returnRisk`, `pots`. All blank until real
values are entered — **never estimated**.

### E. Provenance & legal
| Field | Source | Why it matters |
|---|---|---|
| Breeder / raiser | *new* `breeder` | Supplied in the JSONs already. |
| Series | *new* `series` | e.g. "Flair & Flavours®", "Pyromania". Customers ask by series. |
| **PBR / patent** | *new* `pbr` | **Propagation restriction.** A PBR-protected plant cannot legally be propagated for sale. A garden centre needs this visible; both recent JSONs supplied it. |
| Registered cultivar | `cvs` | The true cultivar code behind a trade name (e.g. 'ES14' sold as 'Sweet Cupcake'). |

---

## 3. Layout sketch (to be designed, not yet locked)

```text
┌──────────────────────────────────────────┐
│  Common name                       [H5]  │   identity strip (matches front)
│  Latin name (italic)                     │
├──────────────────────────────────────────┤
│  AFTERCARE                               │   section A — the till answers
│  Water · Prune · Feed · Winter           │
├──────────────────────────────────────────┤
│  GOOD TO KNOW                            │   section B — customer questions
│  ⚠ Toxicity   🐝 Wildlife                │
│  Evergreen?   Containers?   To full size │
│  Watch out: <caveat>                     │
├──────────────────────────────────────────┤
│  ON THE FLOOR                            │   section C — the sell
│  "<pitch>"                               │
│  Sells with: … | Not to be confused with │
├──────────────────────────────────────────┤
│  TRADE  (staff only)                     │   section D — Oscar's data
│  Trade · Retail · Margin · Order · Risk  │
├──────────────────────────────────────────┤
│  Breeder · Series · PBR 18358            │   section E — provenance
│              [ 🔖 Remember ]             │   deliberate save (approved v4)
└──────────────────────────────────────────┘
```

Sections with no data collapse away entirely. A plant with only trade blanks and a
pruning line shows just that line — it never renders empty scaffolding.

---

## 4. New CSV columns this requires

Added to the end of the locked schema (all optional, all blank-safe):

```
feed, winterCare, establishing, toxicity, wildlife, foliage, container,
maturity, caveat, pitch, companions, confusedWith, breeder, series, pbr
```

Rules: free text, no controlled vocabulary except `foliage`
(`evergreen` / `semi-evergreen` / `deciduous`) and `container`
(`yes` / `with care` / `no`). `pbr` holds the registration number or `none`.
Everything blank-safe — the importer already only requires common/latin/hue/hardiness.

---

## 5. What to ask for, per plant  ← the checklist you asked for

Everything below is already produced by the plant-JSON prompt
(`PLANT-BRIEF.md`). This is the human-readable version of the same list, in the
order it's useful to collect:

**Identity**
- [ ] Common name · botanical name · registered cultivar code · series
- [ ] Breeder / raiser · PBR or patent number (or "none")

**Front-of-card (already specified in CARD-STATS.md)**
- [ ] Hardiness band · height × spread · bloom months
- [ ] Pest risk / thirst / care / growth speed (0–20) · sun need (0–100) + `sunMin`
- [ ] Aspect (facing only) · soil type + soil warning

**Back-of-card — aftercare**
- [ ] Watering regime in words
- [ ] Pruning: when and how
- [ ] Feeding
- [ ] Winter care (or explicitly "none needed")
- [ ] First-year establishing care

**Back-of-card — customer questions**
- [ ] Toxicity / pet safety (state plainly, including when there's no concern)
- [ ] Wildlife value (bees / butterflies / birds; pollinator badge)
- [ ] Evergreen, semi-evergreen or deciduous
- [ ] Container suitable?
- [ ] Time to reach full size
- [ ] Honest downside / where it disappoints

**Back-of-card — the sell**
- [ ] One-sentence talk track
- [ ] 2–3 companion plants
- [ ] Plants it gets confused with, and the distinguishing tell

**Trade (Oscar only — never AI-generated)**
- [ ] source, order, bench, root, trade, retail, margin, type, shrink, returnRisk, pots

---

## 6. Open decisions

- Card-back **aspect**: same 1103×1426 footprint as the front (it flips in place),
  so long sections need scroll or tighter type. Current back already scrolls.
- Whether **Remember** (the 🔖 bookmark approved back in v4) ships with this build.
- Whether the **customer view** should gain a safe subset of the back (aftercare +
  toxicity + wildlife, no trade) — likely yes, it's the natural hand-over screen.


---

## 6. The back's artwork (built 2026-08-23)

`art/back-600.webp`. Composed, not generated whole:

- **The trim is the FRONT's own edge**, lifted from `art/frame-600.webp` pixel
  for pixel, so the two faces of a card match exactly at the rim. Insets are
  measured per edge against the front's baked content — top 20px, sides and
  bottom 30px — because the front's photo window opens at 21px and its
  "double tap to master" strip sits 69px off the bottom. A uniform inset leaked
  a strip of somebody's photograph along the top edge of every card back.
- **The field inside it is a crop of a Gemini image** — dark leather with faint
  etched seedheads. A clean region was chosen that never contained Gemini's
  corner sparkle badge, so nothing was painted out to hide it.
- **The inner double rule and corner ticks are drawn**, not generated, in the
  front's own gold (#a77629 / #d8bd78 sampled from the art).

**Why generated art is acceptable here when it is refused for photographs:**
there is no plant in it. It is a leather texture. The rule this project has held
to all along is that a *photograph of a plant* must be a real photograph of that
plant; decoration carries no such claim. Recorded plainly: the field is
AI-generated, produced by Gemini on 2026-08-23 from a prompt in
`design/CARD-BACK-PROMPT.md`, and SynthID may persist in those pixels.

**What was tried first and rejected:** a Yu-Gi-Oh-style back radiating from a
central medallion. It looked good and was unusable — that layout quarters the
card into four small panels, and this face has to hold two plaques and a data
grid. A Yu-Gi-Oh back works precisely because nothing is ever printed on it.
The medallion is worth keeping for a real face-down/deck-stack image later.
