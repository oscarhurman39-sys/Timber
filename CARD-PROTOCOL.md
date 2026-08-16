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

## 5. Decision changelog

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
