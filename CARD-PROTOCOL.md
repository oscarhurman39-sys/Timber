# Timber Card Protocol

Status: **DESIGN ITERATING — not final.** This file is the working agreement for how
plant cards get designed, checked, and shipped. Follow it on every card mockup and
every card that goes into `timber.html`. Update the changelog when Oscar decides
something; never silently drift from a decision recorded here.

## 0. Two rules that exist because breaking them lost data

**0a. Every card field must be listed in `FIELDS` in `tools/plant-data.js`.**
That list is the csv column set, and `plants-tool.js import` rebuilds cards from
it. A field that is not in the list is not in the csv, and an import erases it.
This is not hypothetical: `sunMin` lived on 132 cards and was missing from the
list, so a single import would have wiped the sun-band floor across the whole
deck. Adding a new field means adding it to `FIELDS` **in the same change**.
`tools/data-audit.js` fails if a card carries a field the list doesn't know, and
`plants-tool.js` refuses to write rather than dropping one.

**0b. Both plant blocks are real data.** `PLANTS` is the dealt deck and
`PLANTS_ON_HOLD` is cards parked pending photos. Any tool that reads or writes
one must handle the other — export used to see only `PLANTS`, so a round-trip
deleted every held plant. Use `tools/plant-data.js`; never re-implement the
parsing.

Geometry has an equivalent rule: card-level overlay anchors live in
`data/template-anchors.json` and are applied by `tools/template-geometry.js`.
Change the card height with `--reflow`, not by hand.

## 0c. Holo cards (special editions)

A card can carry its own frame artwork instead of `art/frame-600.png`. Add its
latin-slug to the `HOLO` map in `timber.html`:

```js
const HOLO={'cercis-canadensis-eternal-flame':'art/frame-eternal-flame.png'};
```

That swaps the background and adds the `.holo` class. **Everything else is
unchanged** — crest, plaque, soil panel, band, growth rail and all live text are
the same overlays at the same anchors, so a holo card goes through the same
layout audit as any other and cannot drift on its own.

The standard frame bakes three things into its pixels that a commissioned frame
generally will not, so `.holo` supplies them in CSS:

| Baked into `frame-600.png` | Supplied by `.holo` |
|---|---|
| HEIGHT / SPREAD lettering on the spine | `.railval::before`, from `data-label` |
| DOUBLE TAP TO MASTER strip | `.tcard.holo::after` |
| A green spine the parchment rail patches are tinted for | patches hidden; values set in gold on the artwork |

The master strip sits at ~96% on a holo card rather than the baked ~98.2%,
because the ornate border on the Eternal Flame frame swallows text at that
height. If a future frame has a plain foot, move it back.

**Those three pieces sit on the ARTWORK, not on a panel** — the parchment rail
patch is hidden, so their contrast is whatever the frame gives them. The defaults
are Eternal Flame's warm cream on a red-brown shadow, which is right on a fire
card and illegible on a cool one. A frame that needs different ink says so in its
own entry; unset keys keep the current values, so existing cards do not move:

```js
'some-cool-frame':{
  frame:'art/frame-some-cool-frame.webp',
  ink:'#f4efff',            /* spine values  (--holo-ink) */
  labelInk:'#eee7ff',       /* HEIGHT / SPREAD  (--holo-label-ink) */
  masterInk:'#f7f2ff',      /* DOUBLE TAP TO MASTER  (--holo-master-ink) */
  shadow:'0 1px 3px rgba(26,18,40,.95),0 0 7px rgba(61,42,83,.8)',  /* all three */
},
```

The frame art must still leave those five rectangles flat and dark enough to
carry light type — no ink colour rescues lettering set on a pale silver spine.

### Effects: panels and wisps

A holo entry is a config object, so a card can take its own panel artwork and any
number of animated layers:

```js
const HOLO={
  'cercis-canadensis-eternal-flame':{
    frame:'art/frame-eternal-flame.png',
    plaque:'art/holo/eternal-flame-plaque.png',
    soil:'art/holo/eternal-flame-soil.png',
    band:'art/holo/eternal-flame-band.png',
    swatch:'art/holo/eternal-flame-swatch.png',
    wisps:[
      {src:'art/holo/eternal-flame-wisp.png', anim:'drift', dur:34, opacity:0.55, scale:1.7},
    ],
  },
};
```

**Panels — two commands, and one rule you must not break.**

```sh
node tools/extract-frame-assets.js art/frame-<name>.png <name>
```

Cuts the plaque, soil and band out of the frame at the slot rectangles **read from
the app's own CSS**, flattens each one against the standard parchment with a
multiply, and writes an opaque PNG. It also makes a matching swatch for the value
patches.

The rule: **the panels must stay fully opaque.** The parchment carries baked
SAMPLE values — `Jul–Oct`, `1/5`, `3/5`, `2/5`, lit month chips, filled widget
icons — and the `.patch` swatches exist to hide them before the live values are
printed. Doing the multiply in CSS instead of offline makes the panel translucent,
the samples show through, and every row reads double. That was tried; it looked
exactly as broken as it sounds. Flattening offline keeps the whole patch mechanism
working untouched, and flattening the swatch with the same artwork is what stops
the patches sitting on the panel as beige rectangles.

**Wisps — the generic effect layer.**

```sh
node tools/extract-wisps.js art/frame-<name>.png <name>-wisp --mode shards --region 18,4,74,52
```

Keys an effect out of any artwork onto transparency. `--mode rainbow` keeps
saturated iridescence, `--mode shards` keeps the brightest streaks and spikes,
`--mode bright` keeps everything luminous; `--region x,y,w,h` in percent crops
first, which is how you avoid pulling the border thorns into a layer meant to
drift across the middle.

Each entry in `wisps` becomes one animated layer inside the photo window. Three
generic animations are available and no card needs CSS of its own:

| `anim` | Motion |
|---|---|
| `drift` | slow wander with a little rotation — the base "alive" layer |
| `sweep` | a shine travelling diagonally across the card |
| `shimmer` | breathing glint, no travel |

Constraints the system holds to, and why:

- **Only `transform` and `opacity` animate**, so every layer stays on the
  compositor. `perf-test` guards the layer budget and it does not move.
- **Layers exist only on `.hot` cards** (`.card:not(.hot) .wisps{display:none}`),
  so a 129-card deck never carries three animated elements per card.
- **"Only ever adds light" lives in the ASSETS, not in a blend mode.** This line
  used to promise `mix-blend-mode:screen`; there is no blend mode in the CSS and
  there cannot usefully be one, because `contain:strict` isolates the stacking
  context and the blend never reaches the photograph. It shipped that way once
  and the layer composited plain, structure and all, reading as an image slapped
  on top rather than as light. `extract-wisps.js` keys layers
  bright-on-transparent instead, so plain source-over compositing can brighten
  but never darken. **Author wisp art as light on full transparency.**
- **`prefers-reduced-motion` holds a single frame** rather than hiding the layer,
  so the card keeps its character and simply stops moving.
- `perf-test` pauses all animations before its pixel-parity assertion, because
  that check is about the deep toggle and an animation would break it for
  unrelated reasons.

**Commissioning a new frame:** `FRAME-BRIEF.md` has the exact geometry and a
paste-ready prompt. Note that the Eternal Flame frame came back without the
spine lettering and master strip despite the brief asking for them, and with the
plaque and soil panels drawn in despite the brief saying not to — those drawn
panels happen to sit within ~0.5% of the real overlay slots, so the real
parchment covers them and no harm is done. Measure a returned frame with the
same method before wiring it in.

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
- **Plant Power Points** (Oscar's call, v5): playful 0–100 ratings rendered as
  star rows — data lives in real CSV columns, never invented at render time.
  Front shows the four Power Points; `lightLevel` is a spectrum slider for the
  card back. Blank score = row simply not shown (never a fake value).

## 1b. Plant Power Points rubric — SUPERSEDED by CARD-STATS.md

> **The authoritative stat spec is now `CARD-STATS.md`** (0–20 icon scale mapping 1:1
> to the quarter-fill widgets, sun need 0–100, plus the latin/soil checker features
> and the factual-field rules). The 0–100 table below is the earlier model, kept for
> history — where the two differ, CARD-STATS.md wins.

Ratings are **editorial judgements against this rubric**, not measurements.
Generated by AI against the anchors below, then reviewed by Oscar — he outranks
the rubric. Stored in columns 26–30 of plants.csv.

| column | meaning | anchor examples |
|---|---|---|
| powerSeasonal | Visual drama across the whole year | flowering cherry ≈95 (blossom+autumn), Nandina ≈85 (colour shift+berries), plain Leyland hedge ≈15 |
| powerGrowth | Vigour — speed to establish and fill space | Leyland ≈95, Buddleja ≈90, Japanese maple ≈25 |
| powerPest | Pest & disease resistance / trouble-free-ness | Choisya ≈90, rose ≈40, box ≈30 (blight) |
| powerWater | Water thrift — 100 thrives on minimal water | lavender ≈90, Kniphofia ≈80, Hydrangea ≈30 |
| lightLevel | Position on light spectrum, NOT quality: 0 deep shade → 50 part shade → 100 blazing full sun | Sarcococca ≈15, Choisya ≈65, lavender ≈95 |

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
| Kniphofia 'Pyromania Orange Blaze' | kniphofia-pyromania-orange-blaze.jpg | torches, ~42% 40% |
| Nandina domestica | nandina-domestica.jpg | leaflet, 45% 35% — Oscar's photo, red-flushed new growth + buds; EXIF-rotated to portrait |
| Pennisetum 'Rubrum' | pennisetum-rubrum.jpg | plumes, ~50% 40% |
| Abelia 'Raspberry Profusion' | abelia-raspberry-profusion.jpg | ~50% 45% — correct cultivar, pink bells + raspberry sepals |
| Hydrangea 'Sweet Cupcake' | hydrangea-macrophylla-sweet-cupcake.jpg | ~50% 45% — [flag] photo is a blue/purple mophead close-up, not the pink cultivar |
| Cornus kousa 'Flower Tower' | cornus-kousa-flower-tower.jpg | centre (default 50% 40%) — leaf close-up, arcuate kousa veining; no bracts or columnar habit in shot, re-shoot at bloom if wanted |
| Ajuga 'Burgundy Glow' | ajuga-reptans-burgundy-glow.jpg | spike, 57% 45% — [flag] cropped from an AI-remade card image titled 'Pink Lightning'; cultivar unverifiable from artwork; 680px source, below the 1200px standard |
| Spiraea 'Double Play Doozie' | spiraea-double-play-doozie.jpg (merged) / -flowers.jpg / -leaf.jpg | cluster, 55% 38% — merged: leaf photo full-bleed + sharp bud cluster soft-windowed (v3 recipe, first live use); both source photos staged |
| Potentilla 'Pink Beauty' | potentilla-fruticosa-pink-beauty.jpg | flower, 25% 32% — [flag] blooms in photo are near-white with a faint blush, not deep pink; consistent with the cultivar's documented heat fade (and it was shot in a July heat spell) but unverifiable; orange potentilla visible in background (mixed bench) |
| Cercis chinensis 'Avondale' | cercis-chinensis-avondale.jpg | leaf, 45% 30% — glossy cordate Cercis foliage; no flowers in shot (Apr–May bloomer, shot in July); cultivar unverifiable from leaves, re-shoot at bloom if wanted |
| Prunus lusitanica 'Angustifolia' | prunus-lusitanica-angustifolia.jpg | leaf, 50% 35% — narrow glossy leaves + red stems (species-confirming feature); no racemes in shot (June bloomer, July shot) |
| Salvia 'Blue Spire' | salvia-blue-spire.jpg | 55% 35% — dissected grey-green leaves, felted stems, violet-blue buds breaking; species-confirming, best-verified photo of the batch |
| Mahonia japonica | mahonia-japonica.jpg | bronze young shoot, 25% 50% — spiny pinnate leaflets confirm mahonia; sharp zone is the bronze new growth, mature green foliage soft-focus; replaced the mis-sent Leycesteria shot |
| Buddleja 'Pugster Orchid' | buddleja-pugster-orchid.jpg (composited) / -cutout.png | 62% 30% — [special] Oscar sent a transparent-background CUTOUT, not a garden photo. Composited onto the card's own hue-315 fallback gradient (composite-cutout.js) so it reads as a specimen plate; raw cutout kept as -cutout.png for re-compositing |
| Salix 'Hakuro-nishiki' | salix-integra-hakuro-nishiki.jpg (composited) / -cutout.png | 50% 28% — [special] cutout composited over a darkened+blurred copy of ITSELF (hero-on-self, composite-hero.js, hue 130) per Oscar's "darken the background, slap the boy on top in full colour"; melts into the card's dark frame with no seam; raw cutout kept |
| Plumbago auriculata | plumbago-auriculata.jpg (composited) / -cutout.png | 50% 30% — [special] cutout, hero-on-self composite (hue 215, dark navy backdrop); blue flowers pop; raw cutout kept |
| Euonymus japonicus 'Aureomarginatus' | euonymus-japonicus-aureomarginatus.jpg (composited) / -cutout.png | 30% 28% — [special] cutout, hero-on-self (hue 50). NOTE filename is the LATIN-slug (aureomarginatus), NOT the JSON id (elegantissimus-aureus) — staged under the id first and shipped blank; caught, now an audit rule |
| Monarda didyma 'Bubblegum Blast' | monarda-didyma-bubblegum-blast.jpg | flower, 78% 18% — real garden shot; hot-pink whorl top-right, leaves show minor mildew spotting (true to the species) |
| Carpinus betulus | carpinus-betulus.jpg | leaf, 55% 40% — pleated corrugated doubly-serrate leaves, textbook hornbeam; species positively confirmed from foliage |
| Elaeagnus ×submacrophylla | elaeagnus-submacrophylla.jpg | leaf, 45% 48% — silver-scaled leaf undersides (the ID feature) sharp in centre; species confirmed |
| Gunnera manicata | gunnera-manicata.jpg (composited) / -cutout.png | 50% 35% — [special] cutout hero-on-self (hue 120). ⚠ UK-RESTRICTED plant — see compliance note in changelog v12.21 |
| Acer rubrum 'October Glory' | acer-rubrum-october-glory.jpg | leaf, 50% 62% — red petioles (the A. rubrum ID feature) on summer-green leaves; species confirmed |
| Fatsia japonica 'Tsumugi-shibori' | fatsia-japonica-tsumugi-shibori.jpg (composited) / -cutout.png | 50% 30% — [special] cutout hero-on-self (hue 120). Filename uses the true cultivar 'Tsumugi-shibori' NOT the selling name 'Spider's Web' (apostrophe breaks the slug/checker) |
| Griselinia littoralis | griselinia-littoralis.jpg (composited) / -cutout.png | 55% 22% — [special] cutout hero-on-self (hue 95, apple-green); glossy oval leaves |
| Indigofera himalayensis 'Silk Road' | indigofera-himalayensis-silk-road.jpg | 55% 15% — real photo; pinnate leaves + lilac-pink pea spikes against a moody sky, focus high to skip the blurred foreground |
| Phalaenopsis Hybrid Group | phalaenopsis-hybrid-group.jpg (composited) / -cutout.png | 40% 25% — [special] cutout hero-on-self (hue 320 magenta, chosen from the visible bloom colour not the JSON's foliage default) |
| Viburnum tinus 'Eve Price' | viburnum-tinus-eve-price.jpg (composited) / -cutout.png | 50% 45% — [special] cutout hero-on-self (hue 330); glossy leaves + metallic blue-purple berries in umbels, species-confirming |
| Paeonia 'Orange Victory' | paeonia-orange-victory.jpg | 50% 45% — real photo; divided foliage + red semi-woody Itoh stems (species-consistent); no blooms in shot |
| Lavandula stoechas 'Anouk Deluxe Purple' | lavandula-stoechas-anouk-deluxe-purple.jpg (composited) / -cutout.png | 45% 25% — [special] cutout hero-on-self (hue 275); rabbit-ear bracts confirm L. stoechas |
| Citrus × meyeri 'Meyer' | citrus-meyeri-meyer.jpg (composited) / -cutout.png | 50% 30% — [special] cutout hero-on-self (hue 45 gold); glossy citrus foliage, no fruit in shot |
| Euonymus japonicus 'Green Spire' | euonymus-japonicus-green-spire.jpg | 50% 45% — real photo; dense glossy plain-green foliage (distinct from the deck's gold-margined 'Aureomarginatus') |
| Ilex crenata 'Jenny' | ilex-crenata-jenny.jpg | 30% 55% — real photo; fine glossy small leaves on twiggy stems, species-consistent (the box-blight-safe box substitute) |
| × Cuprocyparis leylandii 'Gold Rider' | cuprocyparis-leylandii-gold-rider.jpg (composited) / -cutout.png | 50% 30% — [special] cutout hero-on-self (hue 55 gold); brilliant golden conifer sprays |
| Rhododendron 'Horizon Monarch' | rhododendron-horizon-monarch.jpg (composited) / -cutout.png | 45% 20% — [special] cutout hero-on-self (hue 48); leathery whorled foliage + developing bud, no open truss |
| Acer palmatum 'Ōsakazuki' | acer-palmatum-osakazuki.jpg | 50% 45% — real photo; palmate leaves + red petioles, species-confirmed; slug folds the macron ō→o |
| Musa basjoo | musa-basjoo.jpg (composited) / -cutout.png | 50% 20% — [special] cutout hero-on-self (hue 120); huge paddle leaves; nursery barcode in source sits below the visible band |
| Cornus controversa 'Variegata' | cornus-controversa-variegata.jpg | 42% 48% — real photo; cream-margined arcuate-veined leaves, species-confirmed; focus left of the background pot/paving |
| Olea europaea | olea-europaea.jpg (composited) / -cutout.png | 45% 30% — [special] cutout hero-on-self (hue 75); narrow silver-grey leaves, species-confirmed |
| Acer palmatum 'Bloodgood' | acer-palmatum-bloodgood.jpg (composited) / -cutout.png | 50% 22% — [special] single dark red-purple palmate leaf, hero-on-self (hue 350); second Acer palmatum (pair with Ōsakazuki) |
| Salvia 'Hot Lips' | salvia-hot-lips.jpg | 40% 45% — real photo; red + red/white bicolour lipped flowers, cultivar-confirmed; focus off the finger top-right |
| Magnolia HONEY TULIP ('Jurmag5') | magnolia-honey-tulip-jurmag5.jpg | 40% 48% — real photo; single honey-yellow goblet flower in hand, cultivar-consistent; focus left of the hand |
| Eryngium × olivierianum BIG BLUE ('Myersblue') | eryngium-olivierianum-big-blue-myersblue.jpg | 35% 50% — real photo; electric-blue spiny flowerheads, species-confirmed |
| Lonicera × purpusii 'Winter Beauty' | (no photo — gradient fallback) | supplied photos were a water lily (wrong plant) + a cat blocking the Lonicera (label-confirmed ID); needs a winter shot of the scented cream flowers on bare stems |
| Leycesteria 'Golden Lanterns' | leycesteria-formosa-golden-lanterns.jpg | 40% 55% — golden red-rimmed leaves + claret lantern bracts, species-confirming; the photo originally mis-sent with the Mahonia JSON |
| Euonymus alatus | euonymus-alatus.jpg | ~50% 40% — summer macro. ID confirmed: corky wings visible as tan ridges on the green stems, leaves opposite + finely serrate. Shows none of the card's headline interest (autumn crimson, fruit); a September re-shoot would sell the plant better |
| Cornus kousa | cornus-kousa.jpg | **50% 52%** — real photo, Oscar's; deep rose-pink bracts, gravel bed behind. Default 50% 40% clipped the hero bloom's lower bracts behind the stats plaque; raised so the whole four-bract shape and the green button clear it, since bract *shape* is the identifiable feature here. **The cultivar is NOT known and is deliberately not guessed** — the card is species-level with `cvs` reading "unnamed pink form". What the photo does establish: narrow finely-acuminate bracts, colour deep and uniform while the central head is still tight and green, so it is a genuinely pink selection rather than a white form ageing pink. Bract length ≈ leaf length rules out 'Venus'; the narrow points argue against 'Heart Throb'. See VERIFY-QUEUE item 9 |
| Hamamelis × intermedia 'Jelena' | hamamelis-intermedia-jelena.jpg | 50% 40% (default) — real photo, Oscar's; backlit copper-orange ribbons on bare stems against blue winter sky, frost on the ground behind. Cultivar-confirming: the copper-orange colour with red bases is exactly what separates 'Jelena' from the deck's yellow 'Arnold Promise'. Second Hamamelis × intermedia, so the pair works like the two Acer palmatums |
| Hydrangea serrata | hydrangea-serrata.jpg | **45% 16%** — real photo, Oscar's; nursery shot, unusually tall crop (1200×2768). The default 50% 40% showed only the red autumn foliage and clipped the flowers off the top edge, which fought the card's own Jul-Sep bloom band. Raised to 16% so a white lacecap head sits in frame WITH the red leaves — flower form and autumn colour both visible. ⚠ The lacecaps here are WHITE with pink-red fertile centres while the card's hue is 220 (blue, the species archetype) — see VERIFY-QUEUE item 6; there is a nursery label in the shot that may name the cultivar |
| Reynoutria japonica | reynoutria-japonica.jpg | 50% — [special] **AI composite, not a field photo** (Ajuga v12.5 class): broad shovel leaves on a zig-zag stem over a fire/lightning treatment. The dramatic ground is deliberate — Oscar's call that a NEVER-STOCK invasive should read as dangerous on sight. Leaf shape and stem habit are ID-true; the red-flecked hollow cane the card's `visual` names is NOT visible, so this sells the danger better than it teaches the ID. A real cane-and-leaf shot would be the stronger teaching photo. ⚠ UK-INVASIVE plant — compliance carried the Gunnera way (v12.21) |

| Rosemary 'Miss Jessopp's Upright' | salvia-rosmarinus-miss-jessopp-s-upright.jpg | 50% 45% — real photo, Oscar's; whorled needle leaves with rolled margins on a woody grey stem, genus/species-confirming. **The cultivar is not verifiable from a foliage macro** — 'Miss Jessopp's Upright' is told from other rosemaries by HABIT, and a close-up shows no habit. Filed on Oscar's own statement that it is the same variety as the held card, not on the photograph. Source is portrait once EXIF rotation is applied (the raw file reads landscape), so only the vertical position bites; a fingertip at the far left edge falls under the stats plaque |
| Acer palmatum 'Sango-kaku' | acer-palmatum-sango-kaku.jpg | 52% 45% — real photo, Oscar's; coral-red stems behind butter-yellow and orange palmate leaves. Cultivar-confirming rather than species-only: the coral bark IS the cultivar, and it is in the same frame as the foliage. Third Acer palmatum in the deck (with Ōsakazuki and Bloodgood), distinct slug |
| Nerium oleander | nerium-oleander.jpg (**replaced 2026-08-15**) | 50% 40% default — swapped for a photo Oscar sent to replace the previous image. Pink five-lobed flowers with narrow leathery leaves in whorls against sky; species-confirming, and it now matches the plain phone-camera character of the rest of the deck rather than reading as a stock bokeh plate. Old file not kept |
| Corylus avellana 'Contorta' | corylus-avellana-contorta.jpg (**replaced 2026-08-15**) | 50% 22% — swapped on Oscar's instruction. The old frame showed one twisted stem behind a lot of leaf; this one has several corkscrew stems reading at once, which is the whole point of the plant. Focus raised from the 50% 40% default because the source is unusually tall (810×1200 after staging) and the default pushed the best stems off the top; 22% keeps them in the band above the plaque. Crumpled rounded hazel leaves confirm it |

| Verbena bonariensis | verbena-bonariensis.jpg | 50% 10% — real photo, Oscar's, **no C2PA manifest at all** (the clean original of a frame first offered inside an AI-merged two-panel composite, refused; see VERIFY-QUEUE 34). Flat-topped head of small five-lobed lilac flowers, species-confirming, with a honeybee taken by a white crab spider on it — the pollinator story the card sells, in the photograph. Focus pushed high because the head sits in the top third and the default dropped it behind the plaque |

| Rhus typhina 'Dissecta' | rhus-typhina-dissecta.jpg | 50% 50% — real photo, Oscar's, clean capture. Fern-like dissected leaflets fill the frame, which is exactly the character that made this photo wrong for the plain-species card (VERIFY-QUEUE 33) and right for this one. The plain *Rhus typhina* card remains held and still wants simple pinnate leaflets — **do not let these two photos swap** |
| Catalpa × erubescens 'Purpurea' | catalpa-erubescens-purpurea.jpg | 45% 50% — real photo, Oscar's; the canopy shot from below against sky, leaf shape and the branching pattern both legible. Note the card sells "black-purple young leaves" and the frame shows mature green foliage with one bronze-purple cluster at centre — species and habit confirming, cultivar colour only hinted. A spring reshoot of the purple flush would sell the plant harder |

| Muehlenbeckia complexa | muehlenbeckia-complexa.jpg | 50% 45% — real photo, Oscar's; wiry red-brown stems with tiny rounded leaves, the whole character of the plant in one frame. Deck's first Muehlenbeckia |
| Astrantia major 'Star of Love' | astrantia-major-star-of-love.jpg | 62% 35% — real photo, Oscar's; wine-red pincushions with the pointed bracts legible. A nursery label is in the lower left of the source, pushed out of the card window by the focus — **check it stays out if the focus is ever retuned** |
| Salvia guaranitica 'Black and Blue' | salvia-guaranitica-black-and-blue.jpg | 50% 100% — real photo, Oscar's, and the one composition to look at before reusing. The source carries a **cut-out leaf sticker with a white outline** pasted over the top-left (his own edit, no AI markers in the file — this is a phone sticker tool, not generative). The card window cannot lose it: the source is 3000×4000 into a 0.84 frame, so the width fits exactly and only ~11% of the height can be cropped away. Focus is set to the bottom of that range, which makes the inset read as a deliberate inset rather than a cut-off smear. A plain flower frame would beat it |
| Hosta 'Broadband' | hosta-broadband.jpg | 35% 45% — real photo, Oscar's; the broad yellow margin against dark green, which IS the cultivar. `check-plant-json` warned its 28-char soil string would overflow the soil panel; it wraps to two lines and does not, so the data was left as he wrote it |

| Anemone × hybrida 'Pretty Lady Emily' | anemone-hybrida-pretty-lady-emily.jpg | 50% 0% — real photo, Oscar's; pale-pink semi-double with the yellow boss, which is the card's own description. Focus pinned to the TOP for a specific reason: **a nursery label for `Achillea` Sassy Summer sits in the bottom of the frame**, belonging to a neighbouring pot. At 0% it falls behind the stats plaque. If this focus is ever retuned downward, that label comes back and the card starts naming the wrong plant |
| Euphorbia characias 'Silver Edge' | euphorbia-characias-silver-edge.jpg (**replaced 2026-08-16**) | 50% 40% default — like-for-like upgrade. **The deck holds three Euphorbias and two of them are variegated**, so this was matched against the cards' own photographs before staging, not by eye alone: the new frame's narrow blue-grey leaves with soft cream margins track the outgoing 'Silver Edge' photo closely, where 'Ascot Rainbow' is unmistakably yellow with an orange-pink flush. Do not let these two swap |
| Coprosma 'Inferno' | coprosma-inferno.jpg (**replaced 2026-08-16**) | 50% 45% — the card sells "leaves deepen purple-brown with vivid red margins **in cold**", and the outgoing frame showed the green-yellow summer state instead. The new one is the cold colouring, i.e. the thing the card is actually about. **The old frame was kept** as `coprosma-inferno-summer.jpg` rather than discarded — same plant, other season, and the card describes both |
| Chamaerops humilis | chamaerops-humilis.jpg (**replaced 2026-08-16**) | 50% 35% — Oscar's call, and he was right: the outgoing frame was a whole plant in a white pot on gravel, most of the card being decking, gravel and a stuck-on label. The new one is a single fan frond filling the window |

| Hypericum × inodorum MIRACLE NIGHT ('Allmadne') | hypericum-inodorum-miracle-night-allmadne.jpg | 50% 40% default — real photo, Oscar's; the orange-yellow flower against the purple-flushed foliage, which is exactly what separates NIGHT from GRANDEUR. **The deck now holds three Hypericums** (also × *hidcoteense* 'Hidcote', held) — check the slug, not the genus |
| Hedera helix 'Oro di Bogliasco' | hedera-helix-oro-di-bogliasco.jpg | 50% 40% default — small three-lobed leaves with the gold centre. **The deck's other gold ivy is *Hedera colchica* 'Sulphur Heart'**, whose leaves are large and unlobed — the two photographs must never swap, and leaf shape is what tells them apart |
| Lonicera henryi 'Copper Beauty' | lonicera-henryi-copper-beauty.jpg | 50% 40% default — the bronze-maroon new foliage the cultivar is named for. Foliage only; the card leads on scented orange-yellow tubes (Jun-Aug), so a flower frame would sell it harder |
| Solanum laxum 'Album' | solanum-laxum-album.jpg | 50% 40% default — white stars with the yellow beak, species-confirming |
| Clematis × cartmanii AVALANCHE ('Blaaval') | clematis-cartmanii-avalanche-blaaval.jpg | 50% 40% default — the glossy dissected evergreen foliage, which is half the plant's selling point and the half that is there in August. Card peak is Mar-Apr, so the white flowers want a spring return |
| Weigela PRISM MAGIC CARPET ('VPWG18-06') | weigela-prism-magic-carpet-vpwg18-06.jpg | 50% 100% — pushed to the bottom of its range deliberately: the pink bells sit low in the frame and the default dropped them behind the stats plaque, leaving a card of foliage on a card whose text leads with the flower |
| Geranium 'Bob’s Blunder' | geranium-bob-s-blunder.jpg | 50% 40% default — bronze foliage, red stems, the pale lilac-pink flower. **This is the same file that was parked unidentified in VERIFY-QUEUE 37**, resent with its card; that question is closed. Note the deck's other cranesbill, Rozanne, is still held and looks nothing like this |
| Dahlia ELECTRO PINK ('71853-09') | dahlia-electro-pink-71853-09.jpg | 50% 40% default — neon cactus bloom over the mahogany foliage, both halves of the card in one frame |
| Hypericum × inodorum MIRACLE GRANDEUR ('Allgrandeur') | hypericum-inodorum-miracle-grandeur-allgrandeur.jpg | 50% 40% default — red autumn berries on green foliage. Reads as the deliberate opposite of MIRACLE NIGHT above, which is the useful thing for staff |
| Syringa vulgaris | syringa-vulgaris.jpg | 50% 30% — the weakest frame of the batch and known to be: **foliage only, on a card whose text leads with "fragrant lilac-purple panicles"**. Lilac flowers May-Jun, so it cannot be fixed until spring. Dealt rather than held because a real leaf beats an empty card, but it is first in the queue for a reshoot |

| Tetrapanax papyrifer 'Rex' | tetrapanax-papyrifer-rex.jpg | 50% 40% default — real photo, Oscar's; two enormous palmate leaves filling the frame, which is the entire point of this plant. **The one photo in the deck whose SOURCE was cropped before staging, and the reason is arithmetic, not taste:** the file arrived 1244×2960, a ratio of 0.42 against the card window's 0.84. Staging caps the LONG edge at 1200, so the master would have come out **504 px wide** — half the ~1000 px the card renders at, i.e. visibly soft — and object-fit would have thrown away half the height anyway. Cropping to the lower 1244×1500 (the two big leaves, above the tarmac) makes the long edge the *height*, so the master lands at **995×1200** and the card gets its full width of real pixels. Uncropped source kept out of the repo; if it is ever restaged, redo the crop or accept the softness |

| Cornus sericea 'Variegata' | cornus-sericea-variegata.jpg | 50% 40% default — real photo, Oscar's, and **the file that sat parked as `cornus-variegated-unidentified.jpg` until he named it**; the parked copy was deleted once this card existed. Cream-edged leaves with the purple flush and the red stems, which is the whole card. Fourth Cornus in the deck — check the slug |
| Calycanthus 'Aphrodite' | calycanthus-aphrodite.jpg | 50% 40% default — the one Oscar sent as *"fuck I forgot what thats called"*, parked as `calycanthus-unidentified.jpg`, then named by him. Large magnolia-like purple-red flower with the yellow-tipped centre, cultivar-confirming. Parked copy deleted |
| Syringa vulgaris 'Znamya Lenina' | syringa-vulgaris-znamya-lenina.jpg | 50% 40% default — **this photograph moved here from the plain-species card.** See the changelog: the plant was the cultivar all along. Still foliage only, and the card's text still leads with the flowers, so a May reshoot remains the fix |
| Lonicera periclymenum 'Rhubarb and Custard' | lonicera-periclymenum-rhubarb-and-custard.jpg | 50% 40% default — **a transparent cut-out PNG, not a photograph in the usual sense.** Flattened onto the deck's own dark green (`#0d1408`) before staging, because the app only loads `.jpg` masters and a transparent PNG would have gone black at an arbitrary edge. The white sticker outline reads as deliberate against the frame. The pink-to-custard flower ageing is all in one head, which is exactly what the name promises |
| Lilium formosanum var. pricei | lilium-formosanum-var-pricei.jpg | 50% 0% — pinned to the top for **two** reasons. The trumpets sit in the top third and the default buried them behind the plaque; and the source carries a **visible "AI-generated content" label burned into its lower left**, which the top-anchored window excludes. **That is framing, not concealment** — the marker is recorded verbatim in `CREDITS.json` and the C2PA manifest travels inside the file. Its credentials read `c2pa.edited`, `softwareAgent: Photo assist`, `digitalSourceType: compositeWithTrainedAlgorithmicMedia`, i.e. VERIFY-QUEUE 32's category |
| Physocarpus opulifolius 'Diabolo' | physocarpus-opulifolius-diabolo.jpg | 50% 40% default — **dealt on Oscar's direct confirmation of the cultivar**, which is the whole reason it was refused twice before: the deck's only ninebark is 'Diabolo' and a dark leaf cannot separate it from 'Summer Wine', 'Lady in Red' or 'Little Devil'. One word from him settled what no amount of looking could |

| Hibiscus syriacus LAVENDER CHIFFON ('Notwoodone') | hibiscus-syriacus-lavender-chiffon-notwoodone.jpg | 50% 100% — real photo, Oscar's, clean. Pushed to the bottom of its range because the flower sits low in the frame; the master is 1200×1600 so only ~11% of height is available to move, and the bloom still shares the window with a leaf. **Second Hibiscus syriacus in the deck** — 'Oiseau Bleu' is the single blue-violet one, this is the lilac semi-double. Also worth knowing: the 'Oiseau Bleu' photograph is one of VERIFY-QUEUE 32's four Galaxy-glyph files, this one is not |
| Viburnum × bodnantense 'Charles Lamont' | viburnum-bodnantense-charles-lamont.jpg (**replaced 2026-08-17**) | 50% 40% default — Oscar reshot it deliberately with the shoot **lower in the frame so it lands in the card's photo window instead of behind the stats plaque**, which is the clearest statement yet that the window's geometry is worth shooting for. The new frame also drops the roofline the old one had in the background. The `-leaf.jpg` spare is untouched. Note the deck holds the species *V.* × *bodnantense* as well — different slug, different card |

| Crinodendron hookerianum | crinodendron-hookerianum.jpg (**replaced 2026-08-17**) | 50% 40% default — **this one closes a text-vs-picture gap rather than just upgrading a frame.** The card's `visual` reads *"Crimson lantern-shaped flowers hang beneath narrow glossy evergreen leaves"* and the outgoing photograph had **no flowers in it at all** — a flash-lit night shot of spotted foliage on a black ground. The lanterns ARE the plant. **Second source crop in the deck** (after Tetrapanax) and for the same arithmetic: at 1423×2202 the long-edge cap would have produced a 776 px-wide master against the ~1000 px the card renders. Cropping to the upper 1423×1694 — lanterns and foliage, above the bark mulch and pot rim — makes the long edge the height, so the master lands at 1008×1200 |

| Cercis canadensis CAROLINA SWEETHEART ('NCCC1') | cercis-canadensis-carolina-sweetheart-nccc1.jpg | 50% 40% default — **staged from ONE panel of a three-panel Google collage**, whose C2PA declares `digitalSourceType: trainedAlgorithmicMedia`. The panel crop is not a preference: a card window cannot render a three-panel collage without showing a seam, which is the same objection that stopped the Verbena file (VERIFY-QUEUE 34). The marker is recorded verbatim in `CREDITS.json`. Third Cercis in the deck, after 'Avondale' and 'Eternal Flame' |
| Elaeagnus × submacrophylla 'Limelight' | elaeagnus-submacrophylla-limelight.jpg | 50% 40% default — real photo, Oscar's, clean. Gold-centred leaves with the dark margin. **The deck's other Elaeagnus is the plain × submacrophylla**, whose card sells silver-scaled leaves — the two photographs must not swap, and the gold centre is what separates them at a glance |
| Acer palmatum 'Oridono-nishiki' | acer-palmatum-oridono-nishiki.jpg | 50% 40% default — real photo, Oscar's, clean. The half-green half-shocking-pink leaf is the cultivar's whole party trick and it is dead centre. **Fourth Acer palmatum** (Ōsakazuki, Bloodgood, Sango-kaku) |
| Epimedium × perralchicum 'Fröhnleiten' | epimedium-perralchicum-frohnleiten.jpg | 50% 40% default — bronze-red veined young foliage against the green. **Carries a Galaxy AI generative-edit marker** (`Photo assist`, `compositeWithTrainedAlgorithmicMedia`) and a visible "AI-generated content" label in the lower left, recorded verbatim in `CREDITS.json`. VERIFY-QUEUE 32's category, fifth and sixth files now |
| Pittosporum tenuifolium 'Tom Thumb' | pittosporum-tenuifolium-tom-thumb.jpg | 50% 40% default — **dealt on Oscar's explicit confirmation after being held once.** Read the card and the photograph together before reusing either: the `visual` line says *"deep purple-black wavy leaves · lime-green new growth"* and the photograph is magenta and cream variegation. He has confirmed the plant twice; **the card's text is what now needs his eye**, not the picture. VERIFY-QUEUE 41 |
| Rhododendron 'Homebush' | rhododendron-homebush.jpg | 50% 40% default — real photo, Oscar's, clean; the dense rose-pink truss the card is sold on. **The card's own data was left exactly as it was**, not replaced by the JSON supplied alongside the photograph — see the changelog, and VERIFY-QUEUE 42 |

| Houttuynia cordata 'Pied Piper' | houttuynia-cordata-pied-piper.jpg | 50% 0% — pinned to the top so the frame's **visible "AI-generated content" label**, bottom-left of the source, falls outside the window; the master is 1200×1529 so ~6.5% of height is available and the label sits inside it. Framing, not concealment — the marker is written verbatim into `CREDITS.json` and the manifest stays in the file. Credentials: `Photo assist`, `compositeWithTrainedAlgorithmicMedia`, i.e. VERIFY-QUEUE 32's category again. The leaves carry the full red-orange-yellow splash **and** a white flower spike, which is the whole card in one frame |

| Agapanthus 'Ovatus' | agapanthus-ovatus.jpg | 50% 40% default — real photo, Oscar's, clean. Buds and open trumpets together, which is how the plant is actually sold. **Second Agapanthus** — POPPIN' PURPLE ('PM003') is the other, and note *that* one is a VERIFY-QUEUE 32 sparkle-glyph file while this is not. Small text-vs-picture wrinkle: the card says *"pale-mid blue"* and the photograph reads deep violet-blue. Arguable — agapanthus colour shifts hard with light and phone camera — so his wording was left alone |
| Veronica 'Emerald Gem' | veronica-emerald-gem.jpg | 50% 40% default — real photo, Oscar's, clean. Tiny scale-like leaves packed into the dense mound, which is the whole plant. **Filed under *Veronica*, following RHS's move of Hebe into it** — the deck's other one is still `Hebe 'Red Edge'`, so the two now sit under different genera. The `common` field carries "Hebe 'Emerald Gem'" so a staff search for Hebe still finds it |

| Hosta 'Emerald Charger' | hosta-emerald-charger.jpg | 50% 45% — a two-sided compromise worth understanding before retuning. The source is unusually tall (1654×3074) so 36% of its height can be excluded, and the bottom carries a **visible "AI-generated content" label**; 0% hid the label but pushed the foliage behind the plaque, 45% keeps the label out AND brings leaf into the window. Credentials (`Photo assist`, `compositeWithTrainedAlgorithmicMedia`) are in `CREDITS.json`. **Third Hosta, and the risky one:** 'Broadband' is green-centred with YELLOW MARGINS, this is GOLD-CENTRED with green margins — visual inverses. In this frame the gold centre reads only faintly, so the two cards are harder to tell apart by photograph than by text |

| Buddleja davidii LITTLE RUBY ('Botex 006') | buddleja-davidii-little-ruby-botex-006.jpg | 50% 40% default — real photo, Oscar's, clean. Spikes at every stage in one frame: open ruby-pink, spent brown, and the tight buds behind, which is what a compact Buddleja actually looks like on a bench in August. **Third Buddleja** (with 'White Profusion' and 'Pugster Orchid') and the only ruby-pink of the three, so no confusion risk |

| Clematis JOSEPHINE ('Evijohill') | clematis-josephine-evijohill.jpg | 50% 40% default — real photo, Oscar's, clean; the layered rosette centre that is the whole reason for this cultivar. **Sixth Clematis** in the deck and the only double — the others are AVALANCHE (dealt) plus four held |
| Sempervivum arachnoideum | sempervivum-arachnoideum.jpg | 50% 40% default — the cobweb hairs are legible, which is the species' one identifying feature. Two nursery labels are in frame; a tidier shot would be better but the plant is unmistakable and it is a real bench photograph |
| Forsythia × intermedia 'Lynwood Variety' | forsythia-intermedia-lynwood-variety.jpg | 50% 40% default — **and read this before reusing it.** The card's `visual` says *"Bare stems buried under brilliant golden-yellow flowers **before a single leaf appears**"*, peak Mar-Apr, and this photograph is nothing but leaves. That is the sharpest text-vs-picture gap in the deck — sharper than the *Syringa*, because this card's wording explicitly denies what its picture shows. Dealt rather than held on the principle that a real leaf beats an empty card, but **it wants a March reshoot before anything else on the list** |
| Euphorbia × martini MINER'S MERLOT ('Km-mm024') | euphorbia-martini-miner-s-merlot-km-mm024.jpg (**replaced 2026-08-17**) | 50% 40% default — a proper rosette from directly above, wine-red midribs against the blue-green, which is the cultivar. **Third Euphorbia photo swapped or checked in two days** — the deck holds three and two are variegated, so every Euphorbia photo now gets matched against the other cards before staging |
| Gunnera manicata (swap frame) | gunnera-manicata-underside.jpg | **PHOTO_SWAP alt at 50% 30%, not a replacement.** The card's own photo is the plant from above — the scale, which is the point. This is the UNDERSIDE, shot from below against sky: leaf ribs and a stem armed with spines, the other half of why people either want this plant or back away from it. Source rotated to its EXIF-correct portrait and cropped so the long edge became the height, which took the master from 675 px wide to 1008 |

| Deutzia × hybrida 'Magicien' | deutzia-hybrida-magicien.jpg | 50% 40% default — **first photo in the deck reframed through `tools/reframe-photo.js`** rather than by hand: crop coordinates written against the card geometry, executed by sharp on the original pixels, no generated content. Second Deutzia (with held *D. gracilis* 'Nikko') and the only pink one |
| Magnolia acuminata | magnolia-acuminata.jpg | 50% 40% default — the cucumber-like aggregate fruit, green flushing red, which is the whole reason for the common name and what the card's `visual` leads on. Also reframed through the tool. **Third Magnolia** (HONEY TULIP, *stellata*) and the only one carrying fruit rather than flower |

| Veronica 'Rhubarb Crumble' | veronica-rhubarb-crumble.jpg | 50% 40% default — **the clearest case yet for reframing.** As shot, the plant is a spray in the top-right corner of a concrete slab: roughly two thirds of the frame is paving. Cropped through `reframe-photo.js` to a 1:1 on the shoot, which puts the cream variegation AND the burgundy buds — both halves of what the card promises — into the band both surfaces show. **Third Veronica/Hebe in the deck**, and it is the same photograph that was parked as `hebe-variegated-unidentified.jpg` in VERIFY-QUEUE 38; that file is retired now the plant has a name |

| Butia capitata | butia-capitata.jpg | 50% 40% default — shot from below into a white sky, so the crown reads as a silhouette: arching glaucous fronds sweeping out of frame, the stout trunk with its old leaf-base collar, and the **armed petioles** that place it in *Butia* rather than the *Syagrus* its label also named (VQ 47). Reframed through `reframe-photo.js` from 0.561 to 0.780 — the phone frame was far too tall, and half of it was empty sky. A 1:1 crop was tried first and rejected: it read as trunk-and-spines with the arching fronds cut off, which is the half of the plant the card's `visual` leads on. **First palm with pinnate (feather) fronds** — *Chamaerops* is fan-leaved, *Trachycarpus* is held |

| Erigeron karvinskianus 'Profusion' | erigeron-karvinskianus-profusion.jpg | 50% 40% default — a wet macro: the sharp daisy with rain still on its rays, a fresher flower opening beside it, and the green buds behind. **Cropped away from the photograph's own subject.** As shot, the lower 40% of the frame is one enormous out-of-focus bloom shot from inches away; the crop takes the upper half, where everything is actually in focus, and leaves the bokeh below the plaque line. Also the first photo in the register where the CHAT preview and the file disagreed — EXIF orientation 6 means the file displays portrait 3000x4000 while the preview showed the un-rotated sensor frame, so the crop coordinates had to be written against the rotated frame that `reframe-photo.js` (and the app) actually use |

| Lithodora diffusa 'Heavenly Blue' | lithodora-diffusa-heavenly-blue.jpg | 50% 40% default — an August plant in its pot on gravel: dense bristly narrow leaves, the lax habit legible, the grey pot rim cropped off the bottom. **No flowers, and the flush showing is bright mid-green where the card's text says dark-green** — both true of the plant in August, both recorded in VQ 50. Wants an April–July reshoot for the gentian-blue the card leads on |
| Rhodanthemum hosmariense 'Zagora Yellow' | rhodanthemum-hosmariense-zagora-yellow.jpg | 50% 40% default — **the supplied file was a COLLAGE**, an inset flower panel pasted over the top-right of a foliage frame, and a card cannot show a picture-in-picture. Cropped to the foliage frame only, inset excluded. First crop put the soft upper corner in the visible band and was redone lower, onto the sharp divided rosette — the card band is fixed to the master's own 12–62%, so the sharp region has to be placed there by the CROP, not by a focus override. **The inset flower is cream-white, not the yellow the card names: VQ 49.** |

| Monstera deliciosa | monstera-deliciosa.jpg | 50% 40% default — one mature fenestrated leaf across the whole card band, splits and oval holes both legible, the second leaf and the aerial-rooted stem behind it. The best photograph in this batch and one of the plainest reads in the deck: nothing else in 224 cards looks like it |
| Aloe vera | aloe-vera.jpg | 50% 40% default — **shot into the window**, so the blades read olive-and-dark rather than the "fleshy grey-green" the card names, and the pot fills the lower half of the frame. **Three crops.** The first two put sky and pot in the card band and it read as grass behind glass; the third pulls in to the blades, where the white spotting and the toothed margins are both legible, and drops the pot below the plaque. That is as far as cropping takes this frame — a front-lit shot would be a straight upgrade. VQ 51 |

| Hydrangea macrophylla 'Zorro' | hydrangea-macrophylla-zorro.jpg | 50% 40% default — a plant in tight green bud, not the ultramarine lacecap the card leads on, and **the EXIF says why**: shot 22 May 2024, before the Jun–Sep peak. What it does carry is the cultivar's signature, the **deep purple-black stems**, which is what separates 'Zorro' from every other lacecap. A black nursery label along the bottom-left was cropped out, verified by the tool. **Ninth Hydrangea**, second *macrophylla* lacecap — check against FRENCH CANCAN BLEU before reusing either. VQ 53 |
| Imperata cylindrica 'Rubra' | imperata-cylindrica-rubra.jpg | 50% 40% default — **the best photograph of the day**: backlit crimson-over-green blades filling the frame, which is the entire reason anyone buys this grass. Frame arrived already at 0.75 and inside the gate; the crop only trims the bottom fifth of pots, compost and a white plastic label. Archive shot, 19 July 2024. **Sixth grass in the deck, and one letter from *Pennisetum* 'Rubrum'** — VQ 54 |

| Artemisia 'Powis Castle' | artemisia-powis-castle.jpg | 50% 40% default — **the first photograph this run that needed no crop at all.** The EXIF-rotated frame is already portrait 3000x4000 at exactly 0.75, and already composed: one silvery filigree shoot against sky sitting in the card's own band, the dense mound beneath it. Run through `reframe-photo.js` at `verdict: as-is` purely to bake the orientation into the pixels, so the master is the full 1200x1600 — the largest in the deck this week. Current-season capture, Galaxy S24, 21 Aug 2026 |

| Oenothera lindheimeri 'Rosy Jane' | oenothera-lindheimeri-rosy-jane.jpg | 50% 40% default — **kept WHOLE as a two-frame composite, on Oscar's call.** Foliage left, flowers right, seam at x=0.630. It was first cropped to the flower frame alone; Oscar's correction: *"this shows off both parts of the plant which is helpful for ident"* — and he is right, a garden-centre card is an identification aid before it is a photograph. Restaged at `verdict: as-is`, master back up to the full 1200x1600. **Second *Oenothera lindheimeri*** after GAUDI ROSE; they look nothing alike (30 cm rose-pink over burgundy vs 50–100 cm white picotee over green). VQ 55 |

| Cephalanthus occidentalis 'Bailoptics' | cephalanthus-occidentalis-bailoptics.jpg | 50% 40% default — large glossy opposite leaves with impressed veins on red stems, filling the frame. Already 0.75 with no label and no dead space, so it went through at `verdict: as-is` and nothing was cropped (protocol v14.34, second card running under the new rule). **The one card of three whose photograph was never in doubt** — the only non-*Vitex* plant of the batch, and both possible orderings put this picture with this card. VQ 58 |

## 5. Decision changelog

- **v14.35 (229 dealt / 84 held — one dealt, two held on a mapping question)**:
  three cards and three photographs arrived together, and for two of them the
  order they came in and the leaves inside them disagree.
  - ***Cephalanthus* 'Fiber Optics' dealt.** Its photograph is unmistakable and
    both readings agree on it.
  - **Both *Vitex* cards HELD, both photographs parked.** By arrival order the
    narrow-leaflet photo is 'Flip Side'; by the leaves it is 'Delta Blues'.
    **'Flip Side' is a *V. trifolia* 'Purpurea' × *V. agnus-castus* hybrid** —
    Oscar's own `cvs` line says so — sold for broad, purple-backed foliage, while
    'Delta Blues' is a straight *V. agnus-castus* with narrow palmate leaflets
    `[Inference]`. The two cards are otherwise near-identical: same genus, same
    First Editions series, both blue, same aspect, soil and pruning. **A swap
    would be invisible on the card and wrong on both**, which is exactly the
    condition for parking rather than guessing. VQ 58.
  - **EXIF settled the arrival order and did NOT settle the question.** Capture
    times are 16:17:26 (narrow), 16:17:33 (broad), 16:19:05 (buttonbush) — so the
    upload order was not the capture order, which is worth knowing when reasoning
    from "he sent them in this order" ever feels safe. It tells us which was shot
    first; it cannot tell us which card either belongs to.
  - Parked names describe the LEAF, not a guess at the plant:
    `vitex-unidentified-narrow-leaflets.jpg`, `vitex-unidentified-broad-leaflets.jpg`.

- **v14.34 (crop less — a standing correction from Oscar)**: the Gaura composite
  was cropped to its flower frame and Oscar reversed it: *"don't change the image
  so much... this shows off both parts of the plant which is helpful for ident."*
  He is right, and the principle is broader than one card.
  - **A garden-centre card is an identification aid before it is a photograph.**
    A frame carrying leaf AND flower together is doing MORE work than a prettier
    frame carrying one of them. Two panels are a feature, not a defect to tidy
    away.
  - **The standing rule from here: crop to fix a PROBLEM, not to improve a
    composition.** Real problems are the aspect gate (0.75–1.0), a legible label
    or price ticket, a subject that would land outside the card band, and dead
    space that pushes the plant out of the frame. "It would look better tighter"
    is not on that list, and neither is symmetry.
  - Restaged at `verdict: as-is`, which put the master back up from 1098 px to the
    full **1200×1600** — so the tighter crop had also been the lower-resolution
    one. On the card the seam now falls about two-thirds across: foliage left,
    flowers right, both legible.
  - **One open consequence.** The *Rhodanthemum* 'Zagora Yellow' (v14.28) was
    cropped the same way — its pasted inset flower panel was excluded. That case
    is not identical: the inset is a picture-in-picture overlay rather than a
    side-by-side pair, and its flower is the cream one that contradicts the card's
    own name (VQ 49), so restoring it would put the open question on the card
    face. **Oscar's call, flagged not acted on.**

- **v14.33 (228 dealt / 82 held — Gaura 'Rosy Jane')**: a second composite, a
  naming inconsistency left for Oscar, and the eighth homeless compliance line.
  - **The seam was measured, not guessed.** A column-to-column difference scan
    put the join at x=0.630 with a clear spike above every other edge in the
    frame, and the crop starts at 0.634 — clear of it. Worth doing that way every
    time: a crop that clips a composite seam puts a hard vertical line down the
    middle of a card and it is the kind of thing nobody notices until it ships.
  - **The right frame was the whole card.** Left panel soft foliage, right panel
    sharp flowers showing exactly what the `visual` promises. Taking the flowers
    costs resolution — 1098 px master against a 1200 standard — and that is the
    correct trade, because the card derivative is capped at 1000 px so nothing
    visible is lost, while a soft foliage macro would have lost the plant.
  - **It breaks the deck's own trade-name convention and was NOT corrected.** The
    deck writes trade-named cultivars as `TRADE NAME ('code')` — the sibling card
    is *Oenothera lindheimeri* **GAUDI ROSE ('Florgaucomro')**. This one arrived
    as `'Rosy Jane'` with the code in `cvs`, where the convention would give
    `ROSY JANE ('Harrosy')`. Renaming a plant is not mine to do; VQ 55 has the
    one-line fix, including that it moves the photo slug.
  - **Eighth card with a `compliance` line and nowhere to put it.** VQ 56. The
    rail built for the SAFETY plaque is still waiting for its legal half.

- **v14.32 (227 dealt / 82 held — Artemisia 'Powis Castle')**: the deck's first
  *Artemisia*, and the first photograph in this whole run that wanted **no crop**.
  - The frame arrived at exactly 0.75 with the subject already in the card band,
    so `reframe-photo.js` ran at `verdict: as-is` — a full-frame pass whose only
    job is to bake the EXIF rotation into the pixels. Master 1200×1600, the
    largest staged this week. **Worth remembering that "as-is" is a real verdict**:
    the tool is a gate, not a cropper, and a good frame should be allowed through
    intact rather than trimmed to look like it was worked on.
  - `hue: 0` on a silver-leaved plant looks wrong and is not. `hue` drives ONLY
    the fallback gradient behind a photo that fails to load, so on a card with a
    working photograph it is never seen — and the deck already carries hue 0 on a
    pure-white Scabiosa. Checked rather than "corrected".
  - Ratings tripped the un-converted-scale warning again; `growthSpeed 9` settles
    it, same as the Erigeron. That check has now fired on four cards in two days
    and been a false alarm every time — the growthSpeed test resolves it in
    seconds and is the reason it stays cheap to ignore.

- **v14.31 (226 dealt / 82 held — Zorro and the blood grass)**: two new cards,
  the first to arrive after the SAFETY plaque shipped, and between them they show
  both halves of what is now built and what is not.
  - ***Zorro*** carries **both** a toxicity line and a `compliance` line. The
    toxicity is on the card, on the new plaque. The compliance — *"PBR protected ·
    commercial propagation restricted"* — **still has nowhere to go**, and that is
    now seven cards with a legal note the app cannot show. VQ 53; the rail is
    built and one block would carry it.
  - **A real bug in `plant-sense`, found by the Zorro card.** It flagged
    *"prose says drought tolerant but thirst is 14/20"* on a hydrangea whose card
    says *"Avoid dry soil · Keep evenly moist"* — the dry-side pattern was matching
    the words "dry soil" **inside a negation**. Fixed by stripping negated phrases
    before the test rather than widening the pattern. It turns out **three other
    moisture-loving cards** carried the same latent mis-signal (*H. paniculata*
    'Wim's Red', *Sorbaria* 'Sem', *Hosta* 'Emerald Charger') and only escaped the
    flag by sitting below thirst 14. This is the **third negation bug in two days**
    — after "should not be treated as edible" in the toxicity ladder — and the
    lesson is the same one both times: **test the negation before the keyword.**
  - **The photo register now records which shots are current-season.** Both of
    these are Galaxy S21 archive frames — Hydrangea 22 May 2024, Imperata 19 July
    2024 — where every other photo this run is an August 2026 S24 capture. That is
    not a fault, and it is the whole explanation for the Hydrangea being in bud
    rather than in flower, so it belongs in the register rather than being
    rediscovered later. VQ 54.
  - The Imperata is one letter from *Pennisetum* **'Rubrum'**, already dealt.
    Different genus, both red grasses, six grasses in the deck now.

- **v14.30 (the SAFETY plaque — `toxicity` finally has somewhere to go)**: item
  0c is closed for toxicity. `toxicity` is now a card field, a CSV column and a
  rendered block on the trade back, and **44 researched notes that had been
  sitting unreadable in `data/incoming/` are on their cards.**
  - **The plaque is written in the FRONT's language, not the back's.** Aged
    paper, ink, Georgia small-caps, a painted hazard rule along the top. It sits
    ABOVE the buyer figures, because a safety line outranks a margin. This is
    also the first piece of the "make the back cool" work — the back is still a
    plain data sheet everywhere else, and now has one thing on it that looks
    like the card it belongs to.
  - **The field turned out not to be only hazards, and that changed the design.**
    Reading all 44 notes before writing the tiering: most are hazards, six are
    EDIBILITY notes (*"Ripe berries are edible and are also readily taken by
    birds"*), and one is a sourced all-clear from Kew. Printing "ripe berries are
    edible" under a red hazard rule would be worse than printing nothing, so the
    ladder carries five tiers — **Highly toxic / Toxic / Handle with care /
    Edible parts / No known hazard** — with their own inks and glyphs.
  - **Every rule was checked against the real corpus, one note at a time.** The
    ordering matters and was found by doing it: *"should not be treated as
    edible"* (Sarcococca) must be read as a hazard, so the negations are tested
    BEFORE the word "edible" is looked for; and a hazard word anywhere beats an
    edible mention in the same sentence, so Sambucus — cyanogenic leaves, edible
    flowers — lands on Toxic. Final split: 5 severe, 29 harmful, 3 caution,
    6 edible, 1 clear. An unrecognised note falls to *Handle with care*, never to
    *Toxic*.
  - **TIER IS A RENDERING DECISION, NOT A CLAIM.** The researched prose is always
    printed verbatim underneath; the tier only picks ink and glyph, exactly as
    `careLabel()` turns 11 into "Moderate" without altering the number.
  - **A blank prints nothing at all.** Blank means not researched, which is not
    the same as safe. A card that said "no toxicity recorded" would be read in a
    shop as "safe to eat", so the plaque simply does not appear.
  - Still open: **`compliance`** — the LEGAL half — has the same problem and the
    same rail is now there for it (Gunnera's ban, the Olive's Xylella note, six
    PBR cards). One block away, and Oscar's call whether it looks like this
    plaque or reads differently.

- **v14.29 (224 dealt / 81 held — the first two houseplants of this run)**:
  *Monstera deliciosa* and *Aloe vera*, both new, both indoor (H1b).
  - **`hardiness` was supplied as `H1B` and the schema refused it.** The rating
    is written `H1a`/`H1b`/`H1c` in the RHS scale, so the capital was normalised
    to `H1b` — same rating, same meaning, no data changed. Worth knowing that
    `check-plant-json` catches the casing rather than silently accepting a value
    the card renderer would then print inconsistently against every other H1b.
  - **Toxicity again, and this time it is the sharpest case yet.** Both cards
    carry populated `toxicity` — Monstera *"Harmful if eaten · skin and eye
    irritant"*, Aloe *"Harmful if eaten"* — and neither has anywhere to render.
    These are **houseplants**: handled indoors, pruned over a kitchen worktop,
    within reach of children and cats in a way a border shrub is not. The deck
    now has 15+ cards carrying safety text that no surface shows. **Item 0c is
    no longer a schema tidiness question.**
  - The Aloe took three crops and is still the weakest photograph of the batch —
    backlit, pot-heavy. Recorded in VQ 51 along with two identity notes: the
    unconfirmed *"Aloe massawana hybrid"* wording Oscar's own research correctly
    discarded, and the fact that heavy leaf spotting fits juvenile *A. vera* but
    fits several other spotted aloes just as well.
  - Both files: EXIF orientation 6 — landscape in a preview, portrait in the
    app — Galaxy S24, no C2PA manifest, no AI marker. **Second batch running
    where the preview orientation and the file orientation disagree**; reading
    the displayed frame before writing crop coordinates is now routine, not a
    catch.

- **v14.28 (222 dealt / 81 held — Lithodora and Rhodanthemum)**: two new cards,
  neither genus previously in the deck. Both photographs are August foliage; both
  cards lead on a flower.
  - **The Rhodanthemum is the one to read.** Its supplied file is a two-frame
    collage, and the flower in the pasted inset has **cream-white rays**, where
    the card is named and written for **bright yellow** daisies. Either it is
    'Zagora Yellow' photographed late — the yellows fade to cream with age
    `[Unverified]` — or the plant is the straight white species and the label is
    wrong. The foliage cannot separate them; they differ only in ray colour.
    Dealt on the foliage frame with the inset cropped out, so **the card asserts
    no flower colour at all** rather than asserting one the picture denies.
    VQ 49, and one fresh bloom in the garden settles it.
  - The Lithodora is the mild version of the same shape: no flowers in August,
    and the new flush is brighter than the "dark-green" its text names. Dealt;
    VQ 50; an April–July reshoot is a straight upgrade.
  - **A crop lesson worth keeping.** The Rhodanthemum's first crop looked right
    as a picture and read as a green blur on the card. When the master is WIDER
    than the card's 0.6165 slot, cover crops the sides and shows the master's
    full height, so the visible band is always the master's own 12–62% — an
    `object-position` Y override cannot move it. **The sharp region has to be
    put there by the crop box.** Re-cropped 0.09 lower and the leaves came up
    legible. Same geometry that made the Butia's focus override a no-op (v14.26),
    seen from the other side.
  - Both photos: EXIF Samsung Galaxy S24, Ultra HDR with a gain map, **no C2PA
    manifest at all** and no AI or generative marker — the same profile as the
    Erigeron, and recorded as that rather than as "clean C2PA". The collage is
    recorded as a collage in CREDITS.

- **v14.27 (220 dealt / 81 held — Mexican fleabane)**: *Erigeron karvinskianus*
  'Profusion', a NEW card; the deck held no *Erigeron* and no small daisy of any
  kind.
  - **The rating scale warning was a false alarm, and there is a way to prove
    it.** `check-plant-json` flags `pestRisk 3`, `thirst 4`, `careLevel 3` as
    possibly un-converted 0–5 ratings. `growthSpeed 12` settles it: 12 cannot
    exist on a 0–5 scale, so the whole set is on the app's 0–20 scale and the
    card reads *Easy 0.75/5, Thirst 1/5, Pests 0.75/5* — which is what a
    self-seeding wall daisy should say, and consistent with its own *"Low once
    established"* and *"drought tolerant"*. **Whenever that warning fires, check
    `growthSpeed` first**: it is the field most likely to exceed 5 and therefore
    the cheapest proof of which scale the JSON is on.
  - **EXIF orientation caught a second way.** The preview in chat was landscape;
    the file is orientation 6 and displays portrait. Crop coordinates read off
    the preview would have been rotated 90° from the frame the app renders.
    `reframe-photo.js` already handles the rotation (v14.21 fix) — but it
    handles it by trusting that the coordinates describe the DISPLAYED frame, so
    the frame has to be looked at before the numbers are written, not after.
  - Photo carries no C2PA manifest at all — no JUMBF box — unlike the Galaxy
    captures that do. It is a Samsung Ultra HDR capture (gain map in the XMP)
    with EXIF naming the Galaxy S24, and no AI or generative marker anywhere in
    the file. Recorded exactly that way rather than as "clean C2PA".
  - Oscar's own `uncertain` block notes RHS treats 'Profusion' as a synonym
    rather than an accepted cultivar. Kept on the card as supplied — VQ 48.

- **v14.26 (219 dealt / 81 held — the Jelly palm)**: *Butia capitata*, a NEW
  card rather than a replacement; the deck held no *Butia*. Oscar's own
  `uncertain` block flagged the taxonomic conflict before the photograph was
  opened, and the conflict is real: the label read *"Butia capitata (Cocos
  australis)"*, and **Cocos australis is a synonym of Syagrus romanzoffiana**,
  a different genus.
  - **The photograph settles the genus and not the species.** Armed petioles
    and stiff, single-plane, glaucous recurved leaflets are *Butia*; *Syagrus*
    is unarmed, glossy green and plumose. So the "Cocos australis" half of the
    label is a trade-label error `[Inference]`. *B. capitata* vs *B. odorata*
    is NOT separable from a crown photograph and has not been guessed at —
    VQ 47 carries it.
  - Dealt under the name Oscar's JSON carries and RHS still profiles. The
    card's `cvs` prints *"syn. Butia bonnetii; Cocos capitata"*; the erroneous
    *Cocos australis* was deliberately not copied onto it.
  - Photo: plain Galaxy S24 C2PA capture manifest — `c2pa.ingredient.v2`,
    `relationship parentOf`, no `digitalSourceType` and no *Photo assist*
    marker. An untouched original, recorded as such.
  - **A focus override was tried and then removed rather than left in.** At a
    0.780 master against the card's 0.6165 slot the photo is width-constrained,
    so `object-position`'s Y term changes nothing — two screenshots at `50% 40%`
    and `50% 50%` were pixel-identical. An entry that does nothing is worse than
    no entry, because the next person reads it as a decision.
  - **Fifth card to lose data at the schema, and the loss is a real one here**:
    `hardinessNote` ("H3; established plants may tolerate about -10°C in ideal
    sheltered sites"), `foliage`, `container`, `toxicity` and `compliance` all
    have nowhere to render. For a borderline-hardy palm being sold in the UK,
    the hardiness qualifier is the single most useful sentence on the card and
    it is the one that does not survive. Item 0c.
  - **A perf-test check was measuring the container, not the app.** "The card is
    already moving two frames after the release" asserted a 50ms wall-clock
    budget, but the sampler can only see movement on a frame it is given: traced
    here, the card had moved 60px by the sampler's SECOND frame, and that frame
    landed anywhere from 23ms to 63ms depending on machine load. It failed 4 runs
    out of 4 at deck 218 — the commit already pushed and green an hour earlier —
    so it was neither the new card nor the riffle change. It now asserts frame
    INDEX, which is what its own name always claimed, with a loose 250ms ceiling
    underneath to catch a genuine stall. Not a loosening: a stalled throw still
    fails, and the ms figure is still printed every run.

- **v14.25 (the riffle stops being O(deck), and a gate claim corrected)**: the
  previous commit's message said *"Gate: 17/17 sequential"*. It was not — that
  run came back **16/17**, `features-test` failing, and the message was written
  before the result was read. The failure was real and reproduced on its own,
  outside any parallel-run contention: **go-to-card took ~34s to reach the
  deepest card in a 218-card deck**, past the suite's 30s wait.
  - The cause is not the animation tempo and not photo priming — both were
    measured and neither dominates. **Re-stacking a single card costs ~108ms of
    layout at 218 cards** (idle frame 16ms), and the riffle moved one card per
    frame, so the cost of reaching the bottom card grew with the deck and had
    been growing quietly for weeks. One card tipped it over the cap; the slide
    started long before.
  - Fix: `cutUnder(n)` moves the far portion of the cut in **one DOM pass**
    through a fragment, and only the last `GOTO_SHOW` (10) tucks still fly. The
    landing order is identical to tucking one at a time, `order`/`history` are
    untouched exactly as before, and the visible flourish is unchanged.
    **34.2s → 2.6s**, same card on top.
  - The suite's 30s wait was a backstop that silently absorbed the whole slide.
    Both riffle waits are now a **12s budget** (~4x headroom) with the measured
    numbers written in, so the next regression fails loudly instead of creeping.
  - Standing lesson, and it is the second time this session: **a gate result is
    not a gate result until it has been read.** No commit message may state a
    gate outcome the run has not actually returned.

- **v14.24 (MIRRORED effect; five cards held, one duplicate refused)**: the
  kaleidoscope Oscar spotted in a contact sheet is now a real effect. The card's
  own `<img>` becomes the left half pulled to `object-position:100%`, a mirrored
  copy forms the right half, and a masked backdrop-blur strip smudges the seam,
  so the two halves meet as a reflection rather than a cut. **Rendering only —
  the master is untouched**, for the same reason as the edition blur: a mirrored
  plant is not evidence of a plant that grew symmetrically.
  **One bug worth keeping:** the first build gave Rhubarb Crumble the Magnolia's
  orange treatment, because the `edition` class was applied whenever an EDITION
  entry existed. Theme and effect are now separate — `edition` needs
  `ink`/`dark`/`masterText`, `mirrored` needs `mirror` — so a card can take an
  effect without inheriting someone else's colours.
  Five new cards are **held** pending photographs, and `Lupinus` 'The Governor'
  was refused as a duplicate of a card already in the hold block (VERIFY-QUEUE 45).

- **v14.23 (212 dealt / 82 held)**: *Veronica* 'Rhubarb Crumble', and it closes
  the unidentified variegated Hebe from VERIFY-QUEUE 38 — same frame, now named.
  The parked file and its CREDITS entry were removed rather than left as a
  duplicate of a dealt card's photo.
  **The naming split from VERIFY-QUEUE 43 is now 2:1 and worth settling.** The
  deck files 'Emerald Gem' and 'Rhubarb Crumble' under *Veronica* and 'Red Edge'
  under *Hebe*. Every one carries "Hebe" in its `common`, so nothing is unfindable
  — but the botanical column now disagrees with itself three times over, and the
  next Hebe makes it four.
  **Worth flagging on this card specifically: H3.** Oscar's own note says the
  rating comes from trade material because the cultivar is too new for an
  exact-name RHS profile. H3 means it needs frost protection — a real
  sales-counter fact on a plant being sold as a patio container shrub.

- **v14.22 (EDITION: one-off themed cards, and the Magnolia recrop)**: Oscar
  asked for four things on *Magnolia acuminata* and all four are in.
  **The recrop.** The first crop cut the seed pod off, which he disliked and was
  right to — the pod is the whole reason for the common name. Recut through
  `reframe-photo.js` trimming ONLY from the top, which lifts the entire pod clear
  of the stats plaque while keeping the branch, stalk and full leaf structure.
  **A new `EDITION` registry**, keyed by slug like `HOLO` and `FULLART`, giving
  one card an orange-and-black treatment: a coloured edge, outlined data panels,
  a feathered background blur, and a replacement for the bottom strip's text.
  **The blur is a RENDER effect, not a photo edit — deliberately.**
  `PHOTO-REFRAME-BRIEF.md` forbids baking a background blur into a master,
  because that edits the evidence. So the file on disk stays an untouched camera
  original and the blur lives in CSS: a `backdrop-filter` behind a radial mask,
  sharp in the middle, soft at the edges. Same look, provenance intact.
  **What it costs, and why it is per-slug:** the bottom strip is the only place
  the app teaches its own core gesture, so an EDITION card no longer says
  "double tap to master". Fine once; a deck where every card is themed is a deck
  with no template.
  **Three bugs found while building it, all worth keeping:**
  1. `box-shadow` for the edge was silently beaten by `.card.hot .tcard`, which
     sets box-shadow further down the sheet. Now an `outline`, which nothing else
     touches.
  2. The replacement strip text arrived as a lone apostrophe. The value is a
     CSS string carried inside a **double-quoted HTML attribute**, and the
     literal quotation marks in it ended the attribute early. `editionStyle()`
     entity-escapes them. The HOLO block's own comment warns about exactly this;
     it was still walked into.
  3. The first cover strip was positioned inside `.band` and covered the aspect
     rail instead of the baked text, which sits in CARD coordinates.
  Verified no other card is reached: `Sango-kaku` and `Avondale` both render with
  no outline and their normal strip, and the registry holds exactly one slug.

- **v14.21 (211 dealt / 82 held)**: *Deutzia* 'Magicien' and *Magnolia
  acuminata* — **the first two cards framed with `tools/reframe-photo.js`**,
  ported onto this branch from `claude/plant-collection-scan-y2j7fp` along with
  `PHOTO-REFRAME-BRIEF.md`. Worth knowing what it changed:
  **It caught an arithmetic error of mine.** My first Magnolia crop box claimed
  `cropAspect 0.795` while its width and height actually multiplied out to
  **1.023** — outside the allowed 0.75–1.0. The tool refused to write and said
  so. Every hand-crop before this (Tetrapanax, Crinodendron, the Cercis panel,
  the Gunnera underside) happened to land inside the band, but nothing was
  checking.
  **And it needed a fix before it worked at all here: it ignored EXIF
  orientation.** `sharp` reports sensor dimensions, so a phone photo flagged
  `orientation 6` — roughly half of this project's Galaxy captures — failed with
  "wrong photo for this JSON" and a nonsense aspect, because the vision model's
  coordinates describe the *displayed* frame. It now swaps the axes for the
  checks and calls `.rotate()` before `extract()`. Fixed here rather than
  reported, since both branches share the tool.

- **v14.20 (209 dealt / 82 held)**: *Clematis* JOSEPHINE and *Sempervivum
  arachnoideum* built; *Forsythia* 'Lynwood Variety' dealt out of hold;
  MINER'S MERLOT re-photographed; **Gunnera gets the deck's third PHOTO_SWAP
  pair**, and the first where the two frames show opposite sides of the same
  leaf. ***Ophiopogon planiscapus* 'Kokuryū' was built and HELD** — no
  photograph came with it.
  **Two identifications were refused, both on seasonal evidence rather than
  taste.** The Daphne photograph is **not** the deck's held *D. bholua*
  'Jacqueline Postill': that card's own peak is Jan-Mar and its text says "in
  the depths of winter", and this plant is in full flower in mid-August with
  small narrow leaves — the *D.* × *transatlantica* summer-flowering group.
  Parked as `daphne-unidentified-summer.jpg`. And the Forsythia, though dealt on
  Oscar's naming, carries a picture its own card text contradicts. VERIFY-QUEUE 44.

- **v14.19 (206 dealt / 82 held)**: *Buddleja davidii* LITTLE RUBY. **PBR
  protected, and the card cannot say so** — its `compliance` field reads "PBR
  protected · commercial propagation restricted" and there is nowhere to render
  it. Item 0c again, and this is the *other* half of that gap: not a safety
  warning this time but a **commercial** one, on a plant a garden centre might
  otherwise propagate from its own stock. Six cards now carry PBR wording that
  no one can see.

- **v14.18 (205 dealt / 82 held)**: *Hosta* 'Emerald Charger'. Oscar's own note
  records that the supplied name 'Emerald Changer' was corrected to the accepted
  'Emerald Charger' — worth keeping, because the deck now holds three Hostas and
  two of them are near-inverse variegations. **Its `toxicity` — "Toxic to dogs
  and cats if eaten" — has nowhere to render: the tenth batch to hit item 0c**,
  and the thirteenth affected card.

- **v14.17 (204 dealt / 82 held)**: *Agapanthus* 'Ovatus' and *Veronica*
  'Emerald Gem'.
  **The deck now straddles a genus rename.** RHS has moved *Hebe* into
  *Veronica*; 'Emerald Gem' is filed as Oscar supplied it, under *Veronica*,
  while the held 'Red Edge' is still a *Hebe*. Both are defensible and the
  common names keep them findable, but **the deck should pick one convention**
  before it has six of them. VERIFY-QUEUE 43.
  **And a safety fact was dropped again, on a toxic plant.** The Agapanthus JSON
  carries `toxicity: "Harmful if eaten by humans, dogs and cats"` and the card
  schema has nowhere to put it, so **that card currently warns nobody**. This is
  the ninth batch to hit item 0c and the second time in two days it has cost a
  real toxicity warning — 'Homebush' only kept its because the older card had
  smuggled the wording into `resilience`. That workaround is available here too
  and was NOT applied unasked, because editing his researched data to route round
  a schema gap is his call, not a tool's.

- **v14.16 (the Listen button stops sounding like a robot)**: two separate faults
  were making it sound bad, and only one of them was the voice.
  **The voice.** `speakLatin` took `voices.find(en-GB)` — *the first* en-GB voice
  the device offered, which on a phone is usually the oldest one installed
  (Apple's "compact" Daniel, Android's legacy en-GB). Every modern platform also
  exposes a good neural voice through the same API. It is now scored and chosen:
  Edge's *Online (Natural)* voices (Sonia, Libby, Maisie, Ryan) rank highest,
  then Apple *Premium* and *Enhanced* (Serena, Stephanie, Kate, Jamie), then
  Google UK English, with anything named "compact" explicitly demoted.
  **What it was told to say — the bigger fault.** The button spoke `latin`
  verbatim, so **41 cards were reading their breeder code aloud**: "Magnolia
  Honey Tulip **Jurmag five**", "Oenothera lindheimeri Gaudi Rose
  **Florgaucomro**", "Cordyline australis Charlie Boy **Ric zero one**". A
  further **38 carry an all-caps trade name**, which some engines spell out
  letter by letter. A new `sayable()` drops bracketed codes and quotes, silences
  the hybrid sign, title-cases trade names, and speaks `subsp.` / `var.` / `f.`
  in full. Verified across all 284 cards: none still contains a bracket, a
  capital run or a hybrid sign after the transform.
  **Two things this cost, both worth recording.** A smoke test caught a
  `ReferenceError` I introduced — `loadVoices()` runs at boot and clears `VOICE`,
  which was declared with `let` further down, so every page load threw until the
  declaration moved up. And `app-test` went red because it carried **its own copy
  of the old transform**; it now asks the page for `sayable()` and asserts the
  guarantees (no brackets, no capital runs, no hybrid sign, still opens with the
  genus) instead of duplicating the rule. That is the same drift `NPLANTS` caused
  in four suites.
  **What this cannot do:** ChatGPT-style voices are server-side neural TTS behind
  an API key. This app is a static offline PWA on Pages with no server to keep a
  key in, so that route would mean publishing the key. The Edge *Natural* voices
  are the best thing reachable without one.

- **v14.15 (202 dealt / 82 held)**: *Houttuynia cordata* 'Pied Piper'. **Its
  `soilWarning` is doing real work** — *"Contain rhizomes · spreads
  aggressively"* — and it is worth noting that the deck now has a small set of
  cards whose warning field carries a containment or legal message (Gunnera,
  Virginia Creeper, *Rhododendron luteum*, the knotweed, and now this). That is
  the closest the schema gets to the `compliance` field it still does not have
  (item 0c, eighth batch). Houttuynia is not scheduled in the UK, but it is a
  plant that escapes, and the card says so where staff will read it.

- **v14.14 (201 dealt / 82 held)**: four new cards — *Cercis* CAROLINA
  SWEETHEART, *Elaeagnus* 'Limelight', *Acer palmatum* 'Oridono-nishiki',
  *Epimedium* 'Fröhnleiten' — plus **two held cards dealt on Oscar's word**:
  'Tom Thumb' and 'Homebush'.
  **'Homebush' is the one to read.** A researched card for it already existed in
  the hold block, and the JSON supplied with the photograph differs from it in
  **sixteen fields** — size (1.5–2.5 m against 1–1.5 m), five of the six ratings,
  aspect, soil, and the flower description itself. **The existing card was kept
  and only the photograph added.** The deciding reason is not seniority: the held
  card carries *"all parts harmful if eaten"* inside `resilience`, where the card
  can actually render it, while the new JSON moves that fact into `toxicity` —
  **a field the card schema drops** (item 0c). Applying the new version verbatim
  would have silently deleted a safety warning from a card describing a toxic
  plant. That is not a merge a tool should make quietly, so it is Oscar's call:
  VERIFY-QUEUE 42 lists every difference.

- **v14.13 (Chile Lantern Tree gets its lanterns)**: photo replaced. The old
  frame carried no flowers on a card whose text leads with them, which is the
  same class of fault the Coprosma 'Inferno' swap fixed and the *Syringa* card
  still has. **Note the crop count: this is the second source crop in the deck,
  and both were forced by the same arithmetic** — a tall narrow phone frame plus
  a long-edge cap of 1200 yields a master far narrower than the card renders.
  Worth considering whether `deal-plant.js` should cap the SHORT edge instead
  when a source is unusually tall; `add-plant.js` already caps width, which is
  why its masters come out 1200×1600. The two tools disagree, and that
  disagreement is what makes the crop necessary in one path and not the other.

- **v14.12 (195 dealt / 84 held)**: *Hibiscus syriacus* LAVENDER CHIFFON added;
  *Viburnum* × *bodnantense* 'Charles Lamont' reshot and replaced — Oscar framed
  the new one **for the card's photo window rather than for the photograph**,
  which is the first time a shot has been composed around the template.
  ***Pittosporum tenuifolium* 'Tom Thumb' was built and HELD**, not dealt: the
  photograph that arrived with it is a small-leaved pittosporum in vivid magenta
  and cream, and 'Tom Thumb' is solid purple-black with lime-green new growth. It
  is also **not** the deck's existing 'Elizabeth', whose leaves are markedly
  larger with cream margins. Photo parked as
  `pittosporum-variegated-unidentified.jpg`; VERIFY-QUEUE 41.

- **v14.11 (the perf pixel assertion is settled: gate 17/17)**: `perf-test`'s
  zero-pixel check has been given a measured tolerance — 64 px and a max
  per-pixel channel-sum of 8, against an observed 17 px / Δ5 — closing
  VERIFY-QUEUE 36 on Oscar's decision. **The bound was measured rather than
  picked:** a staged leak (one buried card un-hidden and nudged 12 px so it
  genuinely showed) diffs at 46,882 px / Δ443, so there are three orders of
  magnitude between the residual being tolerated and the defect being guarded
  against. The evidence, the bisection and that measurement all live in the
  test's own comment, and the observed numbers now appear in the check's name on
  every run so the drift stays visible instead of hiding under the threshold.

- **v14.10 (Oscar names the parked ones: 194 dealt / 83 held)** — five new cards
  and one long-refused card dealt, all on his identifications rather than mine.
  **The correction worth reading: *Syringa vulgaris* has been sent back to the
  hold block and its photograph moved to a new card.** The species card was
  built from his JSON one batch ago and dealt with a leaf photograph; he has
  since supplied the actual plant, ***S. vulgaris* 'Znamya Lenina'**. So the
  photograph was never the species' — it was the cultivar's. Rather than delete
  the species card, it goes back to hold with its research intact and no
  photograph, which is exactly what the hold block is for. `photos/
  syringa-vulgaris.jpg` and its derivative were removed and the CREDITS entry
  pruned.
  **Two parked files became cards** (`cornus-variegated-unidentified.jpg`,
  `calycanthus-unidentified.jpg`) and their parked copies were deleted so the
  same picture does not sit in `photos/` twice. **Robinia stays parked** at
  Oscar's request. **The white-plumed shrub from VERIFY-QUEUE 37 is still open.**
  **One provenance flag, stated rather than buried:** the Lilium photograph
  carries a Galaxy AI generative-edit marker and a visible AI label. Oscar asked
  for no photo checks on that card and its identification was not questioned;
  the provenance is a separate matter and is recorded in full in `CREDITS.json`
  rather than skipped. See VERIFY-QUEUE 40.

- **v14.9 (Rice-paper Plant dealt: 189 / 83)**: *Tetrapanax papyrifer* 'Rex',
  held since the wishlist batch, photographed and dealt. Moved via the
  `plants.csv` `held` flag and `plants-tool.js import` — **the first use of that
  documented path since the `pest:""` bug was fixed in v14.6**, and it round-
  tripped clean. The photograph needed a source crop for a resolution reason
  set out in the register above; that is the only cropped source in the deck and
  it should stay rare.

- **v14.8 (ten cards from Oscar's research: 188 dealt / 84 held)** — the largest
  single batch the deck has taken. All ten came with his own JSON and his own
  photographs, all clean captures.
  **One validator catch worth keeping:** `Geranium 'Bob's Blunder'` failed
  `check-plant-json` on unbalanced quotes — three straight apostrophes, because
  the possessive sits inside the cultivar epithet. Fixed to the deck's existing
  convention (straight quotes delimit the cultivar, a curly ’ for the internal
  possessive) which is what `'Wim’s Red'`, `'Baggesen’s Gold'` and
  `'Miss Jessopp’s Upright'` already do. The slug is unchanged either way.
  **Near-miss genus checks done before staging, not after:** three Hypericums,
  two gold-variegated ivies in different species, three Weigelas and four
  Loniceras now live in the deck. Every one of these was confirmed distinct.
  **Four cards are dealt on foliage-only frames** — Lonicera 'Copper Beauty',
  Clematis AVALANCHE, Weigela (partly) and *Syringa vulgaris* — because their
  flowers are out of season. That is a real gap between a card's text and its
  picture, of the same kind the Coprosma swap fixed, and it is logged rather
  than left to be rediscovered. Two further photographs were **parked**: a
  variegated red-stemmed *Cornus* and the shrub Oscar could not name, which
  reads as a *Calycanthus*. VERIFY-QUEUE 39.

- **v14.7 (one deal, three photo replacements, three parked: 178 dealt / 84 held)**:
  **'Pretty Lady Emily' is dealt** one batch after being held for want of a
  photograph — the fastest a held card has turned around. **Silver Edge, Inferno
  and Chamaerops humilis got new masters**, each with its `photos/card/*.webp`
  re-derived. The Inferno swap is worth reading as more than an upgrade: its old
  frame showed the summer state while the card text sells the winter colouring,
  so the card and its picture were describing different seasons.
  **Three photographs were parked rather than filed** — two of a spined,
  pinnate-leaved tree (Robinia, cultivar unknown) and one of a cream-variegated
  Hebe that is plainly not the deck's held 'Red Edge'. They sit in `photos/` under
  `*-unidentified-*` names, which no card slug can resolve, so they are carried
  and credited without claiming anything. VERIFY-QUEUE 38.

- **v14.6 (six cards from Oscar's research, four photographed: 177 dealt / 85 held)**:
  *Muehlenbeckia complexa*, *Astrantia major* 'Star of Love', *Salvia guaranitica*
  'Black and Blue' and *Hosta* 'Broadband' are dealt; **Anemone × hybrida 'Pretty
  Lady Emily' and *Loropetalum chinense* var. *rubrum* 'Fede' went to the hold
  block** because no photograph came with them — an empty card never sits in the
  deck. Three of the photographs sent have **no card in this batch** (a
  *Physocarpus*, a white-plumed *Astilbe*-or-*Sorbaria*, and a bronze-leaved
  *Geranium*); each one lands near a HELD card whose cultivar it does not
  obviously match, so none was staged — VERIFY-QUEUE 37.
- **A real bug was found and fixed on the way through: `plants-tool.js import`
  wrote `pest:""` onto every card that had never carried the key** — 260 of
  them — because `csvParse` gives every column a value and `'' !== undefined`.
  `check-boot.js` rejects an empty `pest` outright (it would fall through to the
  baked mite icon), so **the documented "edit plants.csv, then import" path was
  broken for the whole deck**, not just for this batch. Fixed at source with the
  reason in a comment, then verified the round-trip is lossless: all 256
  pre-existing cards compared field-by-field against the previous commit, zero
  differences. Anyone who ran an import since the `pest` field was introduced
  would have hit this.

- **v14.5 (two cards from Oscar's own research: 173)**: *Rhus typhina* 'Dissecta'
  and *Catalpa* × *erubescens* 'Purpurea', both built from JSON he supplied with
  a filled-in `uncertain` block, both photographed by him on clean captures.
  The sumach closes VERIFY-QUEUE 33 the way it recommended — a **separate card**
  for the cut-leaf form, with the plain species left held rather than given a
  photograph of the wrong leaf. What he flagged as soft is in VERIFY-QUEUE 35
  rather than silently accepted; the one worth staff's attention is the Catalpa's
  size, where RHS says 12 m+ and the card carries 10–15 m from specialist
  sources. **`add-plant.js` does not write provenance** — unlike `deal-plant.js`
  it stops at the CREDITS check with the row already inserted, so
  `photo-credits.js --set` has to follow it by hand. Worth fixing in the tool.
  **The gate on this commit is 16/17, not 17/17.** The two cards took the deck to
  173 and tripped `perf-test`'s zero-pixel assertion — 16 pixels at the deck's
  right edge differing by ONE unit in 255 on black, caused by two more `.tcard`
  shadows stacking. Bisected against the previous commit to prove it is deck
  size and not flake. **The test was deliberately left failing** rather than
  given a tolerance, because quietly loosening a gate so one's own change passes
  is the move that must never be quiet — VERIFY-QUEUE item 36 lays out the three
  options and recommends one.

- **v14.4 (Verbena dealt from the original; the composite still refused)**: Oscar
  corrected the record — he took both halves of the refused two-panel image
  himself, and the AI merged them. The refusal of *that file* stands (declared
  generated, 878px, a seam a portrait crop cannot avoid), but "AI-generated" was
  the wrong description of his underlying work and the ownership concern raised
  with it was overstated. He then sent the originals: the bee frame carries no
  C2PA manifest at all and is now on the card. Deck 170 → 171.
  **The foliage original was still not staged** — `softwareAgent: Photo assist`,
  `compositeWithTrainedAlgorithmicMedia`, and a visible "AI-generated content"
  label, i.e. VERIFY-QUEUE item 32's category caught before landing instead of
  after; and its leaves read as a different vervain from the card's plant.
  **The lesson worth keeping: read the credentials, then say what they say and
  no more.** They establish how a file was made. They do not establish who owns
  the work that went into it, and the first version of this refusal blurred the
  two.

- **v14.3 (an image was offered for Purple Top Verbena and refused)**: the file
  carries a signed Google C2PA chain declaring `c2pa.created` — "Created by
  Google Generative AI", `digitalSourceType: trainedAlgorithmicMedia` — plus a
  SynthID watermark and the visible sparkle glyph added as a `composite` edit.
  That is the exact marker this protocol says to refuse on sight, so
  *Verbena bonariensis* stays held and nothing was staged. Two further faults
  would each have stopped it anyway: 878×1216 px is under the 1200px floor, and
  it is a two-panel composite that a single portrait card window cannot crop
  without showing the seam. **The scan is the reason this was caught before it
  landed, not after** — read the credentials before staging, every time.
  VERIFY-QUEUE item 34.

- **v14.2 (five photos in, one refused: 170 dealt)**: Oscar sent five phone
  photographs against cards that already existed — three held, two dealt and
  wanting a better frame. **Dealt: Rosemary 'Miss Jessopp's Upright' and Coral
  Bark Maple** (deck 168 → 170, hold 86 → 84). **Replaced: Oleander and
  Corkscrew Hazel** masters, with `photos/card/*.webp` re-derived — the app
  loads ONLY the WebP (`photoSrc`), so a swapped master with a stale derivative
  changes nothing on the phone and does not fail a test. **Refused: the Stag's
  Horn Sumach**, which is the one Oscar himself asked about. It is *Rhus
  typhina* — the shoot in frame is densely hairy, and the leaf has far more
  leaflet pairs than an elder — but the leaflets are deeply cut, i.e. a
  **cut-leaf cultivar** ('Dissecta' / 'Laciniata', and much of what is sold
  under that name is now *R.* × *pulvinata* Autumn Lace Group). The held card is
  the plain species and its own `visual` line promises simple pinnate leaflets,
  so the photograph would teach the wrong leaf. Card stays held; see
  VERIFY-QUEUE item 33 — it is a naming call for Oscar, not one for me.
  All five files scanned first: Galaxy S24 captures, no C2PA or
  `trainedAlgorithmicMedia` markers, and no Galaxy AI sparkle glyph in the
  corner crops (VERIFY-QUEUE item 32's concern), so provenance is recorded as
  his own work with commercial use cleared.
- **v14.1 (menu panel scrolls — a defect that grew with the deck)**: not a card
  change, but a layout defect found by the plant work and logged here per
  CORRECTION-PROTOCOL §4.5. `.sheet .panel` was `height:100%` with no overflow
  handling while its filter chips are **generated from the deck**, so it grew with
  every plant added. At 390×844 the content reached 1098px: "Reset progress" sat
  36px below the fold and was untappable on a phone; adding Japanese Knotweed's
  ⚠ NEVER STOCK chip took it to 68px. This is why `app-test` had been failing at a
  varying line and being written off as container flakiness — Playwright's retry
  loop occasionally landed the click. Fixed at the cheapest layer (§4.2):
  `overflow-y:auto` + `overscroll-behavior:contain`, contained so the deck behind
  the sheet can never pull-to-refresh. Per §4.1 the defect is now visible to the
  suite — app-test asserts every menu row is reachable, and the assertion was
  verified failing against an unfixed copy before the fix went in. 95 checks
  (was 94); full gate 14/14.
- **v14 (ELONGATED TEMPLATE — card is now 420×600)**: Oscar wanted the card
  longer without a reckless redesign (a ChatGPT frame regen drifted: restyled
  gold, redrawn ornaments, deleted the baked master strip — rejected). Instead
  the v12 art was elongated from its own pixels: 150 art-px of plain spine/trim
  inserted into `frame-full.png` at row 323 (a measured plain window between
  the top flourish and the HEIGHT lettering), mirror-tiled in two 75px
  reflected segments so every seam is row-continuous → `art/frame-600.png`
  (1103×1576). Only trim/spine/bottom-strip are ever visible (the live photo
  covers the whole window), so interior seams don't matter. Re-anchoring rule:
  regions above the insert keep px from the TOP edge (title, crest, listen,
  growth rail), regions below keep px from the BOTTOM edge (ppp, plaque, soil,
  band, both rail values) — identical to the art shift, so every overlay still
  lands exactly on its baked twin (verified: plaque baked 0.60025 vs anchor
  60.02%). All extra height goes to the photo. Deck runtime stretch cap cut
  1.25 → 1.12 (near-invisible). Manifest v3 remapped the same way.
  `design/card-builder.html` updated in lockstep. All nine suites + layout
  audit green with zero rule changes.
- **v12.6 (soil-panel 3-line overflow fixed)**: the standing brick — a long
  hyphenated soil value ("Rich, moisture-retentive", 24 chars, under the
  validator's 26-char warning threshold) wrapped to 3 lines and its third line
  visually collided with the warning-triangle icon below (measured: 3-line
  text needs ~32.4px, only ~30.7px of clearance exists before the warning
  zone starts). Fixed by matching `.s-val-ink` to the warning text's existing
  8.5px/1.15 sizing (was 9px/1.2) — not a new invented size, reuses
  `.s-warn-ink`'s token. Confirmed on Ligularia 'Treasure Island' (the
  flagged case): now wraps to 2 clean lines with margin to spare. Shared CSS,
  applies to every card. All suites green (94 app + 8 edge + sw-update).
- **v12.5 (matching wooden edging on all parchment boxes)**: Oscar: the aspect
  band had a nice thin wooden edging but the Plant Power Points plaque and the
  SOIL box didn't — the card wasn't cohesive. Fixed in the assets so every card
  gets it automatically: the band's rim profile was pixel-measured from
  `art/band-full.png` (dark outline → 2–3px lit gold → 1px dark inner line →
  parchment) and baked onto `art/plaque-full.png` and `art/soil-full.png` by
  `design/bake-rim.py` (erosion bands traced from each asset's own alpha
  contour, so the rim hugs the rounded corners; deterministic + idempotent).
  All three boxes now carry the same rim at the same on-card scale. Suites
  green, layout audit clean.
- **v12.5 (value-patch label bleed fixed)**: Oscar flagged Bloom and Care Level
  specifically as having "an overly dramatic paper effect covering" the words,
  and asked whether it was a card-piecing issue and whether the patch outline
  needed trimming. Measured (not eyeballed) the baked label/value ink bands in
  `art/plaque-full.png` by luminance-thresholding each row's text column: the
  live-value cover patches (`.p-bloom-val`, `.p-pest-val`, `.p-care-val`) all
  started above their own row's label bottom edge, so the flat parchment patch
  was painting over the tail of the baked label text before the live value
  drew on top — worst on Care Level (14px overlap) and Bloom (14px), smaller on
  Pests (8px), and confirmed zero overlap on Thirst (which is why Oscar never
  flagged that row). Fixed by lowering each patch's `top` and shrinking its
  `height` by the same amount, keeping the previously-unchanged bottom edge so
  value-text coverage isn't reduced. Verified on a blank-rating card (label
  crispness, card-agnostic) and on the Callistemon card's real two-line Care
  value ("Moderate" + "2.25/5", the tallest case) — clean, no clipping. This is
  a shared-CSS change, so it applies to every card, old and new, automatically.
  App (94), edge (8) and sw-update suites green; `design/verify-cards.js` was
  not re-run since it targets the separate `design/card-builder.html`
  prototype, not `timber.html`'s live `renderCard()` — unaffected by this fix.
- **v12.4b (leader-tick remnant erased)**: verifying the sun fix across all seven
  bands side-by-side made the last accepted blemish untenable — the baked
  wiggle-leader's tip peeked between the pointer-cover patch and the bar as a
  1–2px tick at ~85% on every card. Clone-stamped out of `art/band-full.png`
  (bar columns copied from 11px left). All seven bands now carry only their own
  data-driven marks. Suites green.
- **v12.4 (sun repositioned to the sun end + one-command pipeline)**: Oscar: the
  band's sun icon sat washed-out at the wrong place — it should be tiny and
  directly parallel at the *sun end* of the shade→sun bar, adjacent to it, or gone.
  Root cause found: the painted sun sits LEFT of the bar (the shade side,
  semantically backwards) and its pale golds are genuinely low-contrast. Fixed in
  the assets, so it's correct on every card automatically: the sun was cut from the
  painted band as a radial-feathered chip (colour-keying failed — too close to
  parchment, which is *why* it looked faded), its old position inpainted to clean
  parchment (glow included; first attempt left a smudge), and the chip re-placed at
  12px, centred on the bar line just right of its end cap (94.4% band). A generic
  `.band>img{width:100%}` rule was silently stretching the chip to a 292px smear —
  scoped override added. Verified on all 7 cards; suites green.
  **Pipeline de-slopped**: `tools/add-plant.js` is now the whole routine in one
  command (validate → photo → row → test counts → both suites → screenshot),
  tested end-to-end in a sandboxed repo copy (8-plant deck, 94/94 + 8/8 green,
  correct card screenshot). Validator gained soil-length overflow warnings after
  the test card showed a 3-line soil value grazing the warning triangle.

- **v12.42 (Winter Beauty Honeysuckle — photo mismatch, first populated
  toxicity)**: pre-converted schema. **Two supplied photos, neither usable**:
  one was a water lily (Nymphaea — wrong plant entirely), the other a tuxedo cat
  in front of the Lonicera (the nursery label 'Lonicera Winter Beauty' in-shot
  confirms the ID, but the plant is blocked; a foliage crop was weak backlit
  summer leaves and misses the point — Winter Beauty is bought for scented cream
  winter flowers on BARE stems). Refused to stage the water lily (reality
  filter) and shipped on the **gradient fallback** with verified data instead —
  needs a proper winter shot. Also **first JSON with a populated `toxicity`
  field** ("Fruit harmful if eaten · wear gloves") — surfaced in resilience
  (no toxicity render yet; another argument for the toxicity/compliance display
  build). Dec–Mar bloom (valuable winter-scent gap-filler). Gate green: 94/94,
  8/8, SW, verifier, audit clean.
- **v12.41 (Big Blue Sea Holly — FIRST populated compliance field)**: pre-
  converted schema + real photo. **First plant to carry a non-empty
  `compliance` value**: "PBR protected · propagation rights restricted" (Plant
  Breeders' Rights — propagating 'Myersblue' for resale needs a licence).
  Lower severity than Gunnera (sale ban) or Olive (Xylella) — a trade note, not
  a customer safety issue — so surfaced on the **trade back** (type +
  returnRisk), no front warning. This is the concrete trigger for a **tiered
  compliance display**: three cards now carry compliance data at two severity
  levels (legal-ban/biosecurity = front flag; PBR = back-only note). Recommend
  building it next — the `compliance` field now feeds it directly. Records:
  **sunNeed 98 (new deck max** — sea holly wants blazing sun), thirst 3
  (near drought-proof). Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.40 (Honey Tulip Magnolia)**: pre-converted schema + real photo. First
  **trade-name-with-cultivar-code latin** on the card (Magnolia HONEY TULIP
  ('Jurmag5')) — renders fine in the subtitle, slugs to
  magnolia-honey-tulip-jurmag5. A yellow magnolia (goblet honey-yellow flowers)
  — species/cultivar consistent with Oscar's in-hand photo. growth 6 (slow,
  magnolias take years), container "no" (a 4 m tree), Mar-Apr bloom (early —
  frost-vulnerable, kept the caveat). Fourth flower-in-hand shot handled by
  focusing off the hand. Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.39 (Hot Lips Sage — first JSON with the new toxicity + compliance
  fields)**: Oscar updated the ChatGPT prompt per the v12.38 feedback, and this
  JSON is the first to arrive with dedicated **`toxicity` and `compliance`
  fields** (both empty here — correctly, Hot Lips is neither toxic nor
  restricted). They're captured but **not yet rendered** on the card — when a
  future plant populates them, that's the hook for the parked compliance-ribbon
  + a toxicity row (the fields now exist to drive them cleanly instead of
  improvising into soilWarning/resilience). Second Salvia in the deck (with
  'Blue Spire'), distinct slug. Real photo; the red + red/white bicolour lipped
  flowers confirm the cultivar (Hot Lips' blooms shift colour with temperature).
  Clean pass. Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.38 (Bloodgood Japanese Maple)**: pre-converted schema + cutout, hero-on-
  self (hue 350). Second Acer palmatum in the deck — the dark red-purple
  'Bloodgood' paired with the autumn-scarlet 'Ōsakazuki', distinct slug. Single
  dramatic leaf composited on the dark ground. growth 5 (slow, matches Acer
  palmatum anchor). Clean pass, nothing to relocate — pre-converted format
  continues to run straight through. Gate green: 94/94, 8/8, SW, verifier,
  audit clean.
- **v12.37 (Common Olive — a second biosecurity flag)**: pre-converted schema +
  cutout, hero-on-self (hue 75). **Xylella note kept on the FRONT card**
  ("Shelter from frost · Xylella high-risk host" in the soil warning) — olive is
  a top-tier host of Xylella fastidiosa, a notifiable quarantine pathogen that
  garden centres genuinely watch under plant-health/passport rules, so unlike a
  care preference this is a material trade fact worth front-and-centre. Second
  biosecurity-flagged card after Gunnera (v12.21) — reinforces the case for the
  parked compliance-ribbon design. Data: sunNeed 95 (ties lavender for sunniest),
  thirst 4 (drought-lover), single-facing South, H4. growth 5 (slow). Gate
  green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.36 (Wedding Cake Tree — deck reaches 40 plants)**: pre-converted schema
  + real photo. Cornus controversa 'Variegata' — the tiered "wedding cake"
  architectural specimen; second Cornus in the deck (with Flower Tower), distinct
  slug. Cream-margined arcuate-veined leaves confirm it. growth 6 (slow, as this
  choice specimen is), container "no" (a 4–8 m tree), pest 5 (trouble-free).
  Focus set left (42%) to keep the background nursery pot/paving out of the
  visible band. Gate green: 94/94, 8/8, SW, verifier, audit clean. **Deck
  milestone: 40 plants, every one photographed and audited.**
- **v12.35 (Musa basjoo — the deck's extremes card)**: pre-converted schema +
  cutout, hero-on-self. The hardy banana sets several deck records: **growth 18
  (fastest — near-rampant suckering), thirst 16 and careLevel 15** (needs
  feeding, watering and winter crown-wrapping), **first single-facing "South"
  aspect** (it needs the warmest wall). H2 tender — the leaves are botanically
  evergreen but frost-shredded outdoors in the UK (kept Oscar's caveat; peak
  Jun-Oct is the foliage display). A nursery barcode tag in the source cutout
  falls below the visible band (hidden under the plaque — QA "labels not
  dominant" satisfied by focus 50% 20%). Gate green: 94/94, 8/8, SW, verifier,
  audit clean.
- **v12.34 (Ōsakazuki Japanese Maple — a macron/diacritic slug fix)**: pre-
  converted schema + real photo (palmate leaves + red petioles confirm Acer
  palmatum). Exposed a slug bug: the macron **Ō** is non-ASCII, so the old
  slug fn collapsed 'Ōsakazuki' to `sakazuki` (dropping the o entirely).
  Fixed `slugLatin` (and the matching computations in check-plant-json.js and
  audit-layout.js — all three kept identical) to fold diacritics first
  (`NFD` normalize + strip combining marks), so ō→o → `acer-palmatum-osakazuki`.
  Handles any future macron cultivar (Shōjō, Ōgon…). Existing ASCII slugs are
  unaffected. The Ō renders correctly in the card title/subtitle. growth 5
  (Acer palmatum is famously slow, matches the rubric anchor), autumn colour
  Oct-Nov (§4b). Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.33 (Horizon Monarch Rhododendron)**: pre-converted schema + cutout,
  hero-on-self (hue 48). thirst 14 (rhododendrons need constant moisture),
  shade-tolerant (sunNeed 45, sunMin 25), H4. The soil is **acid/ericaceous —
  a genuine hard requirement** (rhododendrons fail on alkaline/limey soil), so
  I flagged it in confidence as a real customer point, not a mere preference.
  Photo is species-consistent foliage + a developing flower bud (no open
  yellow truss). Kept the Hillier 'Planter'-format caveat. Gate green: 94/94,
  8/8, SW, verifier, audit clean.
- **v12.32 (Gold Rider Leyland Cypress — a nothogenus checker fix)**: pre-
  converted schema + cutout, hero-on-self (hue 55). Exposed a checker bug: the
  latin starts with the intergeneric hybrid sign **× Cuprocyparis** (a
  nothogenus), which the "must start with a capitalised genus" rule wrongly
  rejected. Fixed the rule to allow a leading `× ` — handles any future
  intergeneric hybrid. **First conifer in the deck.** growth 15 (fast — it's
  Leyland, though 'Gold Rider' is a shade tamer than the rampant green species
  at 20), sunNeed 90 (gold colour needs sun), container "no" (only card so far
  that can't go in a pot — a 25 m tree). Renders the × correctly in the card
  subtitle. Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.31 (Jenny Japanese Holly)**: pre-converted schema + real photo. Ilex
  crenata — the box-blight-safe substitute for Buxus, sold clipped as bush/ball/
  pyramid. Third clip-and-shape evergreen alongside the two Euonymus (topiary
  cluster forming in the deck). Evergreen (peak Jan-Dec), growth 6 (slow, as
  clipped topiary should be), PBR cultivar caveat kept. Gate green: 94/94, 8/8,
  SW, verifier, audit clean.
- **v12.30 (Green Spire Japanese Spindle — deck's first cultivar pair)**: pre-
  converted schema + real photo. Second Euonymus japonicus in the deck — the
  plain-green upright 'Green Spire' (topiary/ball form) alongside the earlier
  gold-margined 'Aureomarginatus'; distinct latin-slugs so no photo collision.
  Evergreen (peak Jan-Dec, all cells lit), narrow columnar (spread 0.1–0.5 m,
  narrowest in the deck), pestRisk 9 (spindle mildew/vine weevil). Kept the
  retail-'bol'-suffix caveat. Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.29 (Meyer's Lemon — first edible/citrus card)**: pre-converted schema +
  cutout, hero-on-self (hue 45). First edible-fruit card. H2 (tender — needs a
  frost-free winter indoors, correct for citrus in the UK), careLevel 14 (joint-
  highest with the Plumbago — citrus are demanding: feeding, overwintering, pest
  vigilance). Kept the Kew synonymy caveat (C. × meyeri sunk under C. × limon).
  Photo is genus-consistent glossy foliage; no fruit so cultivar unverifiable.
  Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.28 (French Lavender 'Anouk Deluxe Purple' — sunniest card in the deck)**:
  pre-converted schema + cutout, hero-on-self (hue 275). The rabbit-ear bracts
  atop the flower heads confirm Lavandula stoechas (French/Spanish lavender, vs
  English L. angustifolia). **sunNeed 95 / sunMin 80 — the most sun-demanding
  card yet**, marker hard right; thirst 4 (drought-lover). H4 — the tender
  French lavender, correctly a notch softer than hardy English types. Clean
  pass. Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.27 (Orange Victory Itoh Peony)**: pre-converted schema + real photo.
  The photo's red semi-woody stems + divided leaflets confirm an Itoh
  (intersectional) peony — herbaceous peonies die to the ground, Itohs keep
  woody-based stems. growth 5 (peonies are famously slow to establish, honest),
  sunNeed 88. Kept the plant's own caveats (no cultivar-specific RHS/APS
  profile, hardiness inferred from comparable Itohs). Clean pass. Gate green:
  94/94, 8/8, SW, verifier, audit clean.
- **v12.26 (Laurustinus 'Eve Price' — deck reaches 30 plants)**: pre-converted
  schema + cutout, hero-on-self (hue 330). Winter bloomer (Dec–Apr, useful
  off-season colour), the metallic blue-purple berries in the photo are
  species-confirming. pestRisk 9 (viburnum beetle is the real risk — honest).
  Clean pass, nothing to relocate — the pre-converted JSON format is now
  reliably the smoothest path. Gate green: 94/94, 8/8, SW, verifier, audit
  clean. **Deck milestone: 30 plants, every one photographed and audited.**
- **v12.25 (Cascading Moth Orchid — first houseplant / H1b / full-year bloom)**:
  pre-converted schema + cutout, hero-on-self. Firsts: **H1b hardiness** (heated
  glasshouse — the tenderest crest in the deck, correct for an indoor orchid);
  **peak Jan-Dec = all 12 calendar cells lit** (Phalaenopsis flowers year-round
  indoors, spikes last months). Hue call: the JSON defaulted hue to 120 (foliage)
  because "flower colour was not supplied" — but the photo shows cream-yellow
  petals with vivid magenta lips, so I overrode to 320 magenta and the backdrop
  now matches the bloom (a case where the photo beats the JSON's own stated
  uncertainty). careLevel 9, sunNeed 45 (bright indirect). Kept the Pulsatio
  supplier-brand caveat. Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.24 (Himalayan Indigo 'Silk Road' — first pre-converted JSON in the
  Timber schema)**: Oscar's JSON arrived already in the exact PLANTS schema
  (0–20 ratings, sunNeed 0–100, prune/water split correctly, foliage/container
  fields) — no conversion or field-splitting needed, first of the batch like
  this. Converted mechanically. pestRisk 3 is a genuine 0–20 value (0.75/5), the
  checker's ×4 heuristic warning is a false positive here. sunMin 80 — narrow,
  sun-demanding tolerance. Real photo, focus high (55% 15%) to skip the blurred
  garden foreground. Kept the plant's own `uncertain` notes (name status
  unresolved at RHS, flowering/spread source variance) as honest caveats. Gate
  green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.23 (Spider's Web Fatsia + Griselinia — two cutouts; an apostrophe bug)**:
  both cutouts, hero-on-self. The Fatsia exposed a **cultivar-apostrophe bug**:
  the selling name 'Spider's Web' has an apostrophe that (a) fails the checker's
  quote-balance test and (b) slugs to `spider-s-web`, not `spiders-web` (the
  JSON id) — so no filename would ever match. Resolved the botanically-correct
  way per CARD-STATS §5: the card's latin uses the true cultivar epithet
  'Tsumugi-shibori' (Japanese, no apostrophe); 'Spider's Web' is recorded as the
  English selling name in the common name + cvs. Photo staged under the correct
  latin-slug. Fatsia data: growth 0.3→6 (joint-slowest), **sunMin 5 — most
  shade-tolerant card in the deck** (deep-shade architectural evergreen), autumn
  drumstick flowers. Griselinia: growth 0.74→15 (fast coastal hedge), sunNeed 88,
  salt/wind tolerance added to resilience (littoralis = 'of the shore'). Both
  soil warnings split (siting/toxicity/care tips out of the soil field as usual).
  Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.22 (October Glory Red Maple — a bloom-months judgment call)**: from
  nested JSON + Oscar's photo (red petioles confirm A. rubrum). **Changed the
  bloom months**: the JSON gave [3,4] (the small spring flowers), but the tree's
  entire selling point is October scarlet and §4b says highlight the main
  DISPLAY not the flowers — so peak = Oct-Nov. Flagged for Oscar to veto. Data:
  thirst 14 (needs moisture for best colour), pestRisk 10, growth 0.58→12, H6,
  sunNeed 84. Soil warning split (alkaline/wet kept; dryness → Thirst; coastal
  wind kept, space implied by 15–18 m size). Second soil-VALUE overflow in three
  cards ("Moist, acidic to neutral, well-drained", 38 chars) — trimmed to
  "acid–neutral" and tightened the checker soil threshold 38→36. Gate green
  after fix: 94/94, 8/8, SW, verifier, audit clean.
- **v12.21 (Gunnera — FIRST COMPLIANCE/LEGAL CARD, needs a design decision)**:
  the JSON carried a new **`compliance` block**: Gunnera manicata is UK-
  restricted (invasive-species law) and most plants sold as manicata are the
  banned hybrid G. ×cryptica — do not sell/propagate/plant without verified ID.
  **No card field renders compliance.** Interim handling: headline surfaced in
  `resilience` + `type` ("⚠ UK RESTRICTED — verify ID before any sale") and the
  full warning in `returnRisk`, so it renders on the **trade back** (verified in
  screenshot); the full block is preserved in the plant JSON. **The FRONT card
  shows no legal warning** — for a customer-facing "learn plants" deck that's a
  real gap. OPEN DECISION for Oscar: (a) add a front compliance ribbon/banner
  (design change — a red corner flag when a plant has compliance data), (b)
  keep it back-only as now, or (c) hold restricted plants out of the public
  deck entirely. Recommend (a) — the card's value here is precisely as a "DO
  NOT SELL" staff reference. Ratings: **thirst 20 — first max-thirst card**
  (bog/waterside), care 16, growth 0.82→16. `[Unverified]` current exact legal
  status — the JSON asserts it and it matches known GB invasive-species listings
  c.2023–24; defer to official RHS/DEFRA guidance for the live position. This is
  also the first plant carrying a compliance field at all — CARD-STATS should
  gain a compliance section if more arrive. Gate green: 94/94, 8/8, SW,
  verifier, audit clean.
- **v12.20 (Ebbinge's Silverberry)**: from nested JSON + Oscar's photo (silver
  scurf = confirmed ×ebbingei). Naming: card uses the current RHS name
  ×submacrophylla, the familiar ×ebbingei kept in cvs alongside the variegated
  forms (Gilt Edge / Limelight). growth 0.76→15.2 rounded to 15 (fast). Autumn
  bloomer (Oct–Nov, tiny fragrant flowers). Soil warning split again: wet+chalk
  kept (real soil constraints), hedge trim → prune. Wind/coastal tolerance +
  nitrogen fixing added to resilience (well-established Elaeagnus traits). Gate
  green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.19 (Common Hornbeam — the deck's biggest plant)**: from nested JSON +
  Oscar's leaf photo (pleated corrugated leaves = textbook Carpinus). H7 (joint-
  hardiest with Ajuga/Potentilla), and by far the **largest — 15–25 m**. The
  JSON's soil warning bundled three things: siting for a large tree (kept —
  genuine constraint), establishment watering (→ Thirst) and hedge clipping
  (→ prune). growth 0.66→13.2 rounded to 13. Apr–May "bloom" = catkins, real
  interest is foliage + hop-like seeds (§4b). Named upright forms (Fastigiata /
  Frans Fontaine) in cvs — relevant since the species itself is too big for
  most gardens. Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.18 (Bubblegum Blast Bee Balm — back to a real photo)**: first non-cutout
  in a while. Data: thirst 14 (Monarda sulks if dry), pestRisk 8 (mildew-prone —
  the leaves in Oscar's own photo show early spotting), growth 0.58→12, H5.
  The JSON's soil warning again mixed a moisture regime ("do not let dry out" →
  Thirst) with mildew airflow (kept as a real siting constraint); soilWarning
  trimmed to the two genuine constraints. Pollinator note → resilience. The
  audit caught a 2px soil-VALUE overflow ("Fertile, humus-rich, moist but
  well-drained", 43 chars) that slipped under the checker's old 45-char soil
  threshold — trimmed "Fertile," (redundant with humus-rich) and tightened the
  checker threshold to 38 so it flags at source next time. Gate green after the
  fix: 94/94, 8/8, SW, verifier, audit clean.
- **v12.17 (Golden Japanese Spindle + a photo-slug audit rule)**: fourth
  cutout, hero-on-self (hue 50). Exposed a real bug: I staged the photo under
  the JSON **id** (`euonymus-japonicus-elegantissimus-aureus`) but the renderer
  derives the photo slug from the **latin** name
  (`euonymus-japonicus-aureomarginatus`), so the card shipped on the gradient
  fallback with the leaf watermark showing. The checker had printed the correct
  path; I didn't follow it. Fixed the filename + PHOTO_FOCUS key, and added
  audit rule **E (focus-photo)**: every PHOTO_FOCUS key must be a current
  plant's latin-slug with a file on disk — catches id-vs-latin drift without
  flagging secondary source photos or out-of-deck photos. Data: growth 0.55→11
  (exact), pestRisk 12 (spindle is vine-weevil/mildew prone), evergreen so the
  "Bloom" cell marks the minor Jun–Jul flowers while the real draw is the gold
  foliage (§4b). Reverted-shoot removal kept as a care note in the warning,
  toxicity → resilience. Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.16 (Cape Leadwort — H2 tender, hero-on-self cutout)**: third cutout,
  hero-on-self composite in blue (hue 215). Data: **H2 — most tender card in
  the deck** (crest correctly shows it; needs frost-free overwintering),
  careLevel 14 (highest so far — tender lifting + pruning), sunNeed 94 (joint
  with Buddleja/Salvia), growth 0.68→13.6 rounded to 14. The JSON's soil
  warning bundled three things — frost-tenderness (kept as the soil/siting
  warning), sap irritation + toxicity (moved to resilience). syn. capensis in
  cvs. Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.15 (Flamingo Willow — hero-on-self cutout treatment)**: second cutout
  input. Oscar's brief: "the background is too over the top, maybe darken it,
  then slap this back boy on top in full colour." Built `composite-hero.js`:
  a darkened + blurred + enlarged copy of the cutout as an ambient backdrop
  over a dark hue-130 base, then the sharp full-colour cutout on top. Result
  melts into the card's dark frame with no cutout seam — now the preferred
  treatment for busy-background cutouts (flat-gradient composite still fine
  for clean specimens like the Buddleja). Data: growth 0.8→16 (exact, joint-
  fastest with Ajuga), thirst 16 + pestRisk 12 (willows are thirsty and
  mite/rust prone — highest-maintenance card so far), H5, "Bloom" cell marks
  the pink-FOLIAGE season Mar–Apr not flowers (§4b). Pruning instruction in
  the soil warning again (5th) — moved to prune. Gate green: 94/94, 8/8, SW,
  verifier, audit clean.
- **v12.14 (Pugster Orchid Buddleja + Mahonia photo staged)**: Mahonia's real
  photo arrived (spiny pinnate leaflets, bronze new shoot) — swapped off the
  gradient fallback. Buddleja is the first **cutout** input: a transparent-
  background specimen PNG, not a garden photo. Rather than flatten to black,
  composited onto the card's own hue-315 fallback gradient (design uses the
  same formula) so it reads as an intentional botanical plate; raw cutout
  kept as -cutout.png. Data: growth 0.55→11 (exact), pestRisk 10 (Buddleja
  earns it — spider mite prone), sunNeed 88, H6, Jun–Oct. Pruning instruction
  again lived in the JSON's soil warning ("Cut back to 20–25 cm") — moved to
  prune (4th time this batch; source-prompt fix still pending). Butterfly/bee
  nectar note added to resilience. Gate green: 94/94, 8/8, SW, verifier,
  audit clean.
- **v12.13 (Japanese Mahonia + Golden Lanterns Leycesteria — first wrong-photo
  catch)**: the photo sent with the Mahonia JSON showed soft wavy golden
  red-rimmed leaves and claret hanging bracts — not a mahonia. Flagged
  instead of staged (QA rule: photo must be the plant); Oscar confirmed it
  was Leycesteria 'Golden Lanterns' and supplied its JSON. Mahonia shipped
  photo-less on the gradient fallback (first live fallback card) — photo
  pending. Mahonia: H5, sunNeed 28 (most shade-loving card), **sunMin 0**
  (leader at the bar start, flip rule exercised), Nov–Mar calendar wraps
  year-end, berry toxicity moved from soil warning to resilience.
  Leycesteria: H4, growth 0.68→13.6 rounded to 14, pests 0.5/5→2, trade
  name on card + 'Notbruce' (registered) in cvs, same berry-warning
  treatment. Both JSONs' soil warnings carried non-soil content (toxicity)
  — recurring pattern in the nested-JSON prompt worth fixing at source.
  Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.12 (Blue Spire Russian Sage)**: from nested JSON + Oscar's photo
  (dissected grey foliage + felted stems + breaking violet buds — species
  confirmed, flowers in shot). Conversions per v12.2 (growth 0.58→11.6
  rounded to 12; pestRisk 4, thirst 6, careLevel 8, sunNeed 94 — highest
  sun marker in the deck, sunMin 72). Field correction: the JSON's soil
  warning carried a pruning instruction ("Cut stems back hard in early
  spring") — moved to `prune` per CARD-STATS §4e/§6 rules (warning must be
  a soil constraint), first live use of the prune field from the nested
  pipeline. Latin uses the current RHS name Salvia 'Blue Spire'; Perovskia
  synonym in cvs. Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.11 (Portuguese Laurel 'Angustifolia')**: from nested JSON + Oscar's
  photo (red stems confirm the species). Naming call: card carries the selling
  name 'Angustifolia' (matches the JSON's own id/slug); the JSON's
  botanicalName 'Myrtifolia' (accepted name) + syn. 'Pyramidalis' recorded in
  cvs — Oscar to confirm what his labels carry. Conversions per v12.2 (growth
  0.58→11.6 rounded to 12; pestRisk 10, thirst 10, careLevel 8, sunNeed 66,
  sunMin 30 — widest tolerance leader yet). First single-month bloom card
  (peak "Jun" → one calendar cell; parser handles it). soilWarning condensed:
  "ripe fruit may also be harmful if bitter" → "fruit harmful if eaten" —
  slightly stronger than source, flagged. Gate green: 94/94, 8/8, SW,
  verifier, audit clean.
- **v12.10 (Chinese Redbud 'Avondale')**: from nested JSON + Oscar's leaf
  photo. Conversions per v12.2 (growth 0.42→8.4 rounded to 8; rest exact:
  pestRisk 8, thirst 12, careLevel 10, sunNeed 78, sunMin 52). H5, S/W
  facing, Apr–May calendar. soilWarning lightly trimmed ("Plant in a
  sheltered position" → "Plant sheltered") to fit the panel — meaning
  unchanged, flagged in the JSON's uncertain list. Photo is leaf-only
  (July shot of an April bloomer) — registered like the Cornus. First card
  through the full corrected pipeline (audit gate + label-safe patches +
  fitInk) with zero violations on first render. Gate green: 94/94, 8/8,
  SW, verifier, audit clean.
- **v12.9 (blurred-labels fix + Nandina photo & ratings)**: Oscar reported
  "strange blur" on the bottoms of Bloom/Care etc. Measured cause: the plaque's
  value patches reached up into the baked label rows, laying feathered
  parchment over the text. Label rows luminance-measured in plaque-full.png
  (Bloom 9.0–12.3%, diseases →38.8%, Thirst →59.2%, Care Level →79.6%);
  patches re-cut to start below their labels with a tight 2px top feather
  (`.patch.lbl`), heights extended to keep the baked painted values fully
  covered (no ghosting). New audit rule: no plaque patch may intersect the
  measured label rows (x<36%; widget patches exempt). Nandina: Oscar's photo
  staged + ratings merged into the legacy row from his JSON (1→pestRisk 4,
  2.5→thirst 10, 2→careLevel 8, growth 0.44→8.8 rounded to 9, sunNeed 72,
  sunMin 40). Kept as-is pending Oscar's call — his JSON conflicts with the
  row's settled data: aspect (JSON E/W vs row "S/W best for colour"), bloom
  (JSON Jun–Jul flowers vs Sep–Feb berry display per §4b's own example), and
  soil (JSON adds shelter + toxicity; row shows legacy "· Adaptable" as its
  warning). Fixed en route: photo imgs now `pointer-events:none` — the top
  deck card had never had a photo before, and a visible img intercepted
  swipe/undo pointer events (caught by app-test, 4 failures). Potentilla
  photo re-sent this session is the identical file — no change. Gate green:
  94/94, 8/8, SW, verifier, audit clean.
- **v12.8 (layout correction pass + the audit gate)**: Oscar spotted three
  layout defects from his phone: long facings overwriting the band artwork,
  "wiggle room" written over the painted sun, and the growth diamond a hair
  off its rail. Built `design/audit-layout.js` (measures every card: ink fits
  its zone, band collisions, rail alignment, nothing leaks the card) — the
  pre-fix baseline logged **31 violations across 8 cards**, including two
  nobody had seen: every rated card's Pests/Thirst value overflowed its box
  2px (`.pval` line-height), and long soil warnings overflowed their zone
  (Potentilla by 29px — **correction: v12.7's claim that it "fits with 16.6px
  clearance" was wrong; that measurement compared the wrong container**).
  Fixes: `.pval` line-height 1; `fitInk()` auto-shrink for overflowing ink;
  aspect box widened 14.5%→25.5%; **sun icon relocated to the sun end**
  (Oscar's call — extracted `art/sun-icon.png`, painted sun + divider covered,
  divider redrawn in CSS, exposed a `.band>img` cascade collision that blew
  the sprite to full band width, now an audit rule); wiggle label flips right
  of its leader when it would cross the light zone's left edge; diamond
  rendered with −0.8px sprite-bias compensation (alpha bbox 7..40/44px,
  measured). Insulation: audit added to the standing five-suite gate
  (tests/README, NEW-SESSION), checker warns on soil >45 / soilWarning >60
  chars, full procedure + defect log in **CORRECTION-PROTOCOL.md**. Deferred:
  `design/card-builder.html` still has the old band (see protocol §5).
  Gate green: 94/94, 8/8, SW, verifier, audit clean.
- **v12.7 (Pink Beauty Potentilla)**: from nested JSON + Oscar's photo. All
  conversions exact (0.5/5→pestRisk 2 — second live half-icon card; growth
  0.5→10). H7. First live "Any aspect" card from the nested-JSON pipeline —
  compass correctly muted, no facing invented. Photo flagged: blooms shot
  near-white (documented heat fade of this cultivar; July heat spell) —
  photo-colour honesty flag, same class as Sweet Cupcake's. Long soil warning
  measured against its panel: fits with 16.6px clearance (checked, not
  eyeballed). syn. 'Lovely Pink' recorded in cvs. Suites green: 94/94, 8/8,
  SW PASS, verifier PASS.
- **v12.6 (Double Play Doozie Spirea — v3 two-photo merge goes live)**: Oscar
  supplied the nested JSON + two of his own photos, asking for a clean in-frame
  leaf with the flowers merged in. First live use of the v3 merge recipe:
  leaf photo full-bleed (cropped to the 0.77 card-window ratio) + the sharp
  bud cluster from the flower photo soft-windowed in with a feathered ellipse
  (~46%×26% at 55% 38% — positioned for the v12 card's clear zone rather than
  v3's "band above the Water box", which no longer exists). Both source photos
  staged alongside the merged file per the Agastache precedent. Conversions
  per v12.2; growthSpeed 0.58→11.6 rounded to 12. Flag: supplied JSON labels
  thirst "Average" but rates 2/5 (→8/20, low-average) — number taken as
  authority. Suites green: 94/94, 8/8, SW PASS, verifier PASS.
- **v12.5 (Burgundy Glow Ajuga — the remade-image test)**: Oscar supplied the
  nested JSON + an AI-remade full card image to test whether a remade image
  helps. Verdict: **as data, it drifts — as a photo source, it's usable.** The
  remade card contradicted the JSON on five fields (title 'Pink Lightning' vs
  'Burgundy Glow', H6 vs H7, spread 30–45 cm vs 0.5–1 m, thirst 2/5 vs 3/5,
  bloom M–J–J vs May–Jun, plus aspect/soil text) — the same drift failure as
  regenerated master docs, so the standing rule held: JSON outranks the image
  everywhere. The image's clean photo region was cropped out (card furniture
  excluded) and staged as the card photo; flagged in the register as AI
  artwork of an unverifiable cultivar at 680px (below the 1200px standard).
  Conversions per v12.2; growthSpeed 0.78→15.6 rounded to 16 (first non-exact
  conversion). Suites green: 94/94, 8/8, SW PASS, verifier PASS.
- **v12.4 (Flower Tower Dogwood — first card from the new nested-JSON shape)**:
  Oscar supplied a nested card JSON (0–5 ratings, 0–1 scale values) + his leaf
  photo. Converted per the v12.2 rule: pests 1.5→pestRisk 6, thirst 3→12, care
  2.5→careLevel 10, growth 0.55→11, light 0.78→sunNeed 78, tolerated floor
  0.48→sunMin 48. H6 per the JSON. Latin follows the Sweet Cupcake precedent
  (trade name in quotes, registered 'Zuilb1' in cvs). hue 150 is an editorial
  pick (Choisya white-flower precedent) — the JSON carries no hue. water/prune/
  resilience/uses left blank (not in the JSON; blank is honest). checker PASS,
  zero warnings. Test hygiene: edge-test.js and app-test.js had the deck size
  hardcoded as literal 7s — both now use a real `NPLANTS` const (NEW-SESSION.md
  already claimed they did). Suites green: 94/94, 8/8, SW PASS, verifier PASS.
- **v12.3 (growth label on the rail + Raspberry Profusion Abelia)**: Oscar: the
  vertical GROWTH SPEED text "was meant to be like inside the line… it's now
  outside the line". Correct — the painted rail breaks and the label runs *through*
  the axis path. Fixed: label centred on the axis centreline (measured offset now
  0.0px) and letter-spacing tightened 3px→1.5px so its height matches the painted
  label exactly (206→285.6 vs the reference's 206→285.7 in card units), which also
  stops it colliding with the lower tick stub. Abelia added from its plant JSON —
  first live card with a **half-icon rating** (pestRisk 2/20 → 0.5/5, one half-filled
  spray bottle) and a real South / West facing. Photo is Oscar's own and correctly
  shows the pink tubular bells with raspberry sepals. Suites green: 94/94, 8/8, SW.
- **v12.2 (Sweet Cupcake Hydrangea — first card built from an external JSON spec)**:
  Oscar supplied a ChatGPT-generated plant JSON + a v5 master doc + his own photo,
  asking whether the locked-template docs still help. Verdict recorded: **the JSON
  fact payload is genuinely useful** (sourced ranges, notes, toxicity — it converts
  mechanically to our schema: 0–5 ratings ×4 → our 0–20, 0–1 scale values ×100/×20),
  but **regenerating the whole master doc each time causes drift** — the v5 doc
  re-introduced light tolerance/optimal *bands* that the locked template (§18.2)
  had already removed, and still carried an uncalibrated `cardAspectRatio: 0.8`
  (measured: 0.774). Rule going forward: **send the plant JSON, not a new master
  doc**; CARD-STATS.md + the calibrated manifest are the authority.
  The build exposed and fixed two real renderer bugs: `extractFacing()` only
  matched letter aspects (`S/W`) so "East / West" silently fell back to "Any
  aspect" — now parses full words and orders them N/E/S/W; and `splitSoil()` cut
  at the first comma, mangling "Moist, fertile, humus-rich" — now splits on
  `;`/`·` or a comma only before an instruction word. Soil value wraps to two
  lines. This is also the first card to exercise a real compass facing and the
  wiggle-room leader together. Test suites moved out of scratchpad into `tests/`
  (they were lost on every container restart); `tests/README.md` documents the run
  order. Suites green: 94/94, 8/8, SW PASS, card verifier PASS.
- **v12.1 (LIVE — the locked template is now the app's deck card)**: `renderCard()`
  in `timber.html` now builds the v12 card for every deck card. The fixed-geometry
  420×543 card scales to any phone via a `--cs` transform (gestures untouched — the
  scale wrapper sits inside the flip faces; the trade-sheet back is wrapped to the
  same footprint). Data mapping from the locked PLANTS schema: `size` → HEIGHT/
  SPREAD rail values; `peak` → bloom calendar (range parser wraps year-end, e.g.
  Nandina Sep–Feb); `soil` splits at the first separator into value + warning
  (warning triangle auto-hidden when none); aspect passes the compass rule
  (facing shown only when the data names one — Nandina "S/W" shows, "Full sun"
  plants show Any aspect); photos load from `photos/<latin-slug>.jpg` with the
  hue-gradient + leaf watermark as the photo-less fallback; blank scores render
  blank rows (never faked). Kniphofia + Pennisetum added to the demo deck as the
  first complete v12 rows (real photos, 0–20 scores); their commercial fields
  stay blank until Oscar fills them. Regression suites updated for a 5-plant deck
  and green: 94/94 app tests, 8/8 edge tests, SW update path PASS.
- **v12 (NEW LOCKED TEMPLATE — full aesthetic re-sync)**: Oscar supplied the
  final approved card image (aa4c9fc4, 1103×1426) + the locked-template asset-kit
  master doc, declared it perfect, and asked for every saved aesthetic part to
  match it. Every painted asset was re-extracted from the new image at
  luminance-measured (not eyeballed) edges: frame, plaque, soil panel, band,
  blank crest (row-flank inpaint of the numerals), parchment swatch, and the six
  rating widgets — **secateurs are now yellow-handled Niwaki style per §18.3 (red
  banned)**. New template changes implemented: left rail is now two sections
  (HEIGHT value + SPREAD value, labels baked, values patched+live); growth
  marker is the extracted **faceted gold diamond** riding the capped scale
  segment; PPP heading is serif gold; soil panel restacks value → warning
  triangle → warning text (triangle auto-covered when a plant has no warning);
  aspect area drops the redundant "Full sun" prose (§18.2); **"wiggle room"
  leader implemented** — drawn at `sunMin` on the light scale only when that
  field has data (compass-style honesty; Pennisetum demo value flagged). Card
  aspect is now 1103:1426 (0.774). MD-file gems also implemented: **calibrated
  coordinate manifest** (`data/plinder-layout-manifest.json`, §26), **missing
  assets error visibly instead of being substituted** (§27), and a
  **verification script** `design/verify-cards.js` (§29 visual regression +
  rating-math assertions; baseline screenshot saved). Superseded v11 assets and
  mockups removed (git history keeps them); `design/card-builder.html` is the
  template of record. Both sample cards verified: fills equal data, months
  correct, zero missing assets.
- **v11.2 (data-driven card builder)**: Oscar supplied the locked "Plinder Plant
  Card — Reusable UI Design System" and asked to "code this into a slide builder,
  no aesthetic changes." Built `design/card-builder.html`: one `renderCard(plant)`
  turns any JSON plant object into the locked v11.1 card — no per-plant HTML.
  Plant objects use the **plants.csv / CARD-STATS.md schema** (scores 0–20,
  sunNeed 0–100) so the builder, CSV, and portfolio brief are one pipeline.
  Aesthetic untouched; the only changes are structural: IDs→classes (many cards
  per page), all values bound from data, the hardiness crest uses the blank shell
  + code-rendered H-number (any band, per spec §22), a screen-reader `<dl>` mirror
  (spec §12), and geometric quarter-fill ratings verified per card (Kniphofia
  0.75/1/1.5, Pennisetum 1/3/2). Sample data: `data/plinder-cards.sample.json`.
  Deferred from the spec (noted, not skipped): light tolerance/optimal bands are
  omitted because the LOCKED treatment (spec §18.2) drops them; a rotating compass
  needle is pending a separated needle asset (both current samples are "Any
  aspect", so no needle is shown — compass rule holds). Not yet wired into
  `timber.html`'s live deck — that's the next brick.
- **v11.1 (Oscar refinement pass, via ChatGPT micro-edit brief)**: three layout
  edits, no restyle. (1) **Growth-speed scale** restored to the earlier preferred
  treatment — thin warm-off-white vertical line, small **gold diamond marker**
  (45°), `Fast`/`Slow` ends, `GROWTH SPEED` vertical, transparent over the photo
  (replaces the painted-leaf marker + High/Low). (2) **`PLANT POWER POINTS`** added
  as a delicate horizontal gold heading floating just above the main plaque; the
  now-redundant **vertical PPP baked on the left rail was patched out** (clean rail
  texture overlay) so it isn't shown twice — the one frame change in this pass,
  flagged for Oscar. (3) **Aspect/light band decomposed & compacted**: sun icon
  removed, compass shrunk ~20% (separate `compass-sm` sprite), `Full sun` relocated
  into the left ASPECT text block, gradient bar kept as a marker-free sprite
  (`light-bar`, stale baked tick clone-patched out) with a code-drawn marker driven
  by `sunNeed`; painted band interior blanked to clean parchment, painted border
  kept; panel ~15% shorter. New assets: `art/compass-sm.png`, `art/light-bar.png`.
  Data still outranks art (aspect "Any aspect" not the painted "South/West").
- **v11 (built from the reference's own pixels)**: Oscar rejected hand-drawn
  icons ("the emojis suck, the aesthetic is far worse than chatgpt's model") and
  asked for the ChatGPT reference card to be used directly, changing nothing of
  its layout or aesthetic. Strategy: the reference image IS the card —
  `art/frame-full.png` is the base; the live photo covers the interior; the
  painted plaque / soil panel / aspect band / crest / stature label are cropped
  whole (`art/*-full.png`, rounded feathered masks at MEASURED pixel edges, not
  eyeballed ones) and overlaid at their exact reference positions; only
  plant-specific value zones are covered with matched parchment patches
  (feather-compensated oversize) and re-rendered live from plants.csv. Rating
  widgets re-extracted as true-alpha sprites (parchment keyed out) so chips
  carry no background tone. Data outranked the art everywhere they disagreed:
  painted "South / West" → "Any aspect" (compass rule; the painted rose names
  no facing so it stays), painted "June–August" → Jul–Oct timeline (v10 rule),
  painted 2/5 thirst → 1/5 (powerWater 80), painted 0.5/5 pests → 0.75/5
  (powerPest 85), painted light marker (~76%) → 88% (lightLevel), imperial
  stature → "75 cm H × 60 cm W" (size field). Tolerance bands dropped from the
  light slider — the reference art has none. The pristine painted H5 crest is
  used as-is (Kniphofia IS H5). Known open items: crest variants for other
  hardiness numbers (inpaint attempt looked patchy, parked); careLevel still
  demo 1.5/5 pending the column decision; ~2px painted-marker-tip remnant on
  the track edge (reads as a tick mark); 4:5 card vs full-height deck aspect
  unresolved. Assets in `art/`, mockup + extraction scripts in `design/`.
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
- **v4b (Kniphofia)**: proposed resolution to the Position question demonstrated —
  compass badge only when aspect names a facing; otherwise the Position oblong
  stays on the card (sun/shade wording is real data, never dropped). Awaiting
  Oscar's sign-off. Dedupe caught cases 3 and 4 (drought in Water+Resilience,
  winter-wet in Soil+Resilience).
- **v10 (design-system doc adopted)**: Oscar supplied a full "Plinder Plant Card
  Design System" md + generated reference image. Adopted as CARD-DESIGN-SYSTEM.md
  (with Timber addendum mapping it to our CSV columns and vanilla stack). Key
  changes vs v9: forest-green ornamental border + gold trim replaces walnut;
  STATURE vertical rail; growth-speed transparent overlay on photo; plaque rows
  become Bloom (month timeline, not a score), Pests (mite emblem + spray-bottle
  widgets = (100−powerPest)/20), Thirst (drops = (100−powerWater)/20), Care
  (secateurs — needs new careLevel column, demo until then); light scale
  shade→sun with tolerance bands; quarter-step geometric clipping (never
  opacity). Measured acceptance: centred, heading horizontal, fills match data,
  timeline unclipped. Generated image's invented "South/West" aspect and
  "June–August" bloom rejected — data outranks art.
- **v9 (Oscar's refined composition — "so much closer")**: unified warm-cream
  paper card with FRAMED photo window (photo unobstructed inside its window —
  replaces the full-bleed-photo paradigm); Power Points panel overlaps the
  window's bottom edge; ornate vintage compass gets its own "facing" panel
  (needle to stated facing; muted + "any aspect" caption when data names none —
  compass rule survives); LIGHT promoted to a front spectrum slider
  (navy→gold, marker from lightLevel); blue LISTEN pill for pronunciation;
  Water text + Prune move to the card BACK (front = at-a-glance). Thirst =
  100 − droughtTolerance rendered as blue droplet pips (v8 decision kept);
  detailed hand-drawn icons (sprout/berries+flower/ladybird/watering-can)
  replace system emoji (v8). Wholesome cream palette from Oscar's reference.
- **v6 (Oscar art-direction brief — major pivot)**: from "playful trading card"
  to "premium botanical collectible". Thin matte aged-walnut frame (not glossy,
  not thick) + ONE antique-brass keyline; warm ivory translucent panels; deep
  green serif plant name + restrained sans-serif care text; monochrome ENGRAVED
  botanical emblems (no emoji, no cartoon icons); H5 as an enamel-style medallion
  in the title plaque; Water/Light/Soil/Care unified into ONE parchment panel
  separated by thin rules (not four boxes); footer "Double tap to master."
  Photo target raised to >=70% unobstructed. To hit it, PLANT POWER POINTS +
  the lightLevel spectrum slider MOVE TO THE CARD BACK (front = photo + plaque +
  care panel only); leaf pips replace gold stars, with numeric score alongside.
  Measured front photo-clear: 63% fully-opaque (panels are ~91% translucent so
  more shows through) — short of strict 70%; closing the gap needs single-line
  care values or a shorter care panel. Awaiting Oscar's call on that + overall
  sign-off. This supersedes the v2/v4 wood+coffee-paper look if approved.
- **v5 (Oscar)**: stats section renamed **PLANT POWER POINTS**; star ratings
  REINSTATED on Oscar's structural fix — scores become real reviewable CSV
  columns (26–30) generated against the rubric in §1b, resolving the earlier
  "invented data" objection. Tooling extended: importer accepts 0–100 or blank
  for score columns; export bug fixed (missing keys wrote literal "undefined").
  All 124 existing rows migrated with blank scores — to be rated in Gemini
  batches and reviewed by Oscar.
- **Open**: final design not yet declared; Position rule (v4b) awaiting sign-off;
  Remember list feature approved in concept, not yet built; fallback for
  photo-less plants = gradient+watermark inside the same frame.
