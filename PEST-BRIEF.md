# Pest brief — commissioning the "Pests & diseases" icon family

Everything an image model needs to draw a Timber pest icon that drops straight
into a card, and everything a research model needs to decide which plant gets
which one.

Written after the slug shipped. The slug is the reference: a first pack drawn
without these constraints was binned for being loose, inconsistent and unreadable
at card size.

---

## 0. Read this first

The icon is displayed at **about 26 px on a phone.** Not 256. Twenty-six.

That single number decides everything below. At 26 px a drawing has roughly a
silhouette, two or three tones, and one readable gesture. Legs thinner than the
outline vanish. Texture turns to mud. A face reads as a smudge. Every rejection
so far has been art that looked good at full size and dissolved in the slot.

The already-shipped assets prove both sides:

| | |
|---|---|
| **Baked red spider mite** (`art/plaque-full.png`) | one oval body, six thick legs, black outline, two reds. Reads perfectly. |
| **Slug** (`art/pest/slugs.png`) | one curved body, thick outline, orange over brown, one highlight. Reads perfectly. |
| **First pack (binned)** | fine linework, many tones, mascot faces, varied scales. Read as grey blobs. |

---

## 1. Canvas and delivery

| Property | Value |
|---|---|
| Canvas | **square**, 1000 × 1000 px or larger (1254 was fine) |
| Background | **fully transparent** — real alpha, not white |
| Subject | centred, filling **60–90%** of the frame |
| Format | PNG with alpha |
| Colour | full opacity in the body — peak alpha must reach 255 |

Do **not** try to match the final size or margin. `tools/fit-pest-icon.js` crops
to the drawing's own alpha bounds and re-squares it, so the family lands at one
optical weight whatever size you deliver. It will warn if the art is too soft or
was scaled up too far.

---

## 2. House style — match the mite and the slug

- **Victorian natural-history specimen plate.** Top-down or three-quarter, as if
  pinned in a collection drawer.
- **One dominant body shape.** The eye must resolve the silhouette instantly.
- **Thick dark outline**, near-black brown, unbroken, heavier than any internal line.
- **Two or three tones only** — a lit face, a shadow side, one soft sheen highlight.
- **Glossy painted finish**, slightly wet-looking. Not flat vector, not photoreal.
- **Serious.** It is a specimen, not a character.

### Never
faces, eyes, smiles, mascots · fine hair-thin legs or antennae · dense texture or
speckle · text, numbers, labels · drop shadows on the ground · long thin subjects
that shrink to a line · more than one insect unless the pest IS a cluster (scale,
whitefly)

### Palette, sampled from the baked mite

| Role | Hex |
|---|---|
| Body, lit | `#D03000` |
| Body, shadow | `#601000` |
| Outline / legs | `#501000` → near-black brown |

Keep new icons in the same saturation register. Greens and browns are fine —
what must match is the **weight of the outline and the number of tones**, not the
hue.

### Diseases are drawn as an affected LEAF

A fungal problem drawn as an abstract blob is unreadable and unteachable. Draw
**one leaf, viewed flat, carrying the symptom** — powdery bloom, dark blotch,
orange pustules. Same outline weight, same tone count. This is what keeps
diseases instantly distinguishable from insects at 26 px.

---

## 3. The canonical key list

The `key` is the value that goes in a card's `pest` field and the filename.
Lower-case, hyphenated. **Anything not on this list fails `check-boot`.**

### Insects and animals

| key | Subject | Drawing note |
|---|---|---|
| `mite` | Red spider mite | **already baked into the plaque — the default.** No file needed. |
| `slugs` | Slug | **done.** `art/pest/slugs.png` |
| `aphid` | Single aphid, three-quarter | pear-shaped body, short legs, two cornicles at the rear |
| `vine-weevil` | Adult weevil, three-quarter | matte black, ribbed wing cases, elbowed snout |
| `caterpillar` | Caterpillar, side-on | plump, segmented; covers box tree caterpillar |
| `scale` | Scale insects on a stem | 4–6 domed brown limpets clustered on one short stem |
| `whitefly` | Whitefly, top-down | tiny white moth-like wings, one clear body |
| `sawfly` | Sawfly larva on a leaf edge | green grub curled over a chewed leaf margin |
| `lily-beetle` | Scarlet lily beetle | brilliant red wing cases, black head and legs |
| `viburnum-beetle` | Viburnum beetle larva | pale yellow grub with black spots on a lacy leaf |
| `leaf-miner` | Mined leaf | one leaf with a pale winding tunnel |
| `browsing` | Nibbled shoot | a shoot with cleanly bitten-off stems — deer/rabbit damage, **not an animal** |

### Diseases — all drawn as one affected leaf

| key | Subject |
|---|---|
| `mildew` | Leaf with white powdery bloom across the surface |
| `black-spot` | Leaf with ringed black blotches and yellowing around them |
| `rust` | Leaf with rusty-orange pustules on the underside, curling |
| `blight` | Leaf with a dark spreading blotch and a dying tip — covers box blight |
| `canker` | Woody stem with a sunken dark lesion and cracked bark |
| `scab` | Fruit or leaf with olive-brown scabbed patches — apple/pear scab |
| `honey-fungus` | A cluster of honey-coloured toadstools at a stem base |
| `root-rot` | A root ball with blackened, collapsing roots — phytophthora / crown rot |

**20 keys, of which 18 need drawing** (`mite` is baked, `slugs` is done).

---

## 4. Prompt to paste, one per key

Replace the two bracketed parts. Keep everything else identical — the constant
block is what makes the family look like a set.

> A single **[SUBJECT — from the table above]**, drawn as a Victorian
> natural-history specimen plate illustration.
>
> Style: ornate antique entomological specimen art. **[VIEW — top-down /
> three-quarter / side-on]**. One dominant body shape with a strong readable
> silhouette. Thick unbroken near-black brown outline, heavier than any internal
> line. Only two or three tones — a lit face, a shadow side, and one soft glossy
> highlight. Slightly wet, glossy painted finish. Serious and scientific, not
> cartoon.
>
> Composition: subject centred, filling about 80% of a square frame, on a
> **fully transparent background**. No ground shadow, no scenery, no border.
>
> Must NOT include: any face, eyes or expression; hair-thin legs or antennae;
> fine speckled texture; any text, numbers or labels; more than one subject.
>
> It must stay readable when shrunk to 26 × 26 pixels — silhouette first, detail
> last.
>
> Output a square PNG with a real alpha channel, 1000 × 1000 px or larger.

For the disease keys, replace the first line with:

> A single leaf viewed flat, showing **[SYMPTOM]**, drawn as a Victorian
> botanical-pathology specimen plate illustration.

---

## 5. Wiring a finished drawing in — three steps, no code

```sh
NODE_PATH=/opt/node22/lib/node_modules node tools/fit-pest-icon.js <drawing.png> aphid --margin 2
NODE_PATH=/opt/node22/lib/node_modules node tools/optimise-art.js
# then add   aphid:'art/pest/aphid.webp'   to the PEST registry in timber.html
```

Then `node tools/check-boot.js` proves the asset exists and every card's key is
real, and `node tests/run-all.js` runs the layout audit.

---

## 6. Assigning pests to plants — the research pass

`data/pest-survey.csv` lists all 254 plants with a blank `pest` column. Hand it
to a research model with the block below, get it back filled, then:

```sh
node tools/apply-pest-survey.js data/pest-survey.csv --dry   # report only
node tools/apply-pest-survey.js data/pest-survey.csv         # write it
```

### The question, asked once per plant

> For **[COMMON NAME]** (*[LATIN]*), grown in a UK garden or garden centre:
> what is the single biggest pest or disease problem this plant suffers from?
>
> Answer with exactly one key from the canonical list, or blank.

### Paste-ready block for the research model

> You are filling in the `pest` column of a CSV about UK garden plants.
>
> For each row, decide the **single biggest** pest or disease that plant suffers
> from in UK gardens, and write **one key** from this list in the `pest` column:
>
> `aphid`, `black-spot`, `blight`, `browsing`, `canker`, `caterpillar`,
> `honey-fungus`, `leaf-miner`, `lily-beetle`, `mildew`, `mite`, `root-rot`,
> `rust`, `sawfly`, `scab`, `scale`, `slugs`, `vine-weevil`, `viburnum-beetle`,
> `whitefly`
>
> **Rules:**
> 1. One key only. Never a list. If two problems are equally common, pick the one
>    a garden centre customer is most likely to actually see.
> 2. **Leave it BLANK if no single problem dominates.** Most plants are honestly
>    trouble-free, and a blank correctly shows the generic red spider mite. Do
>    not reach for a key to fill the cell. A deck where every card names a
>    different pest teaches less than one where thirty do.
> 3. Use `mite` only when red spider mite genuinely is the worst problem
>    (typically glasshouse or hot dry wall shrubs), not as a default.
> 4. `browsing` means deer or rabbit damage.
> 5. The `hint_from_card_text` column shows pests already named in that card's own
>    text. Where it is filled, it is strong evidence — but it may list several,
>    and your job is to pick the one worst.
> 6. Do not change any other column. Do not add rows. Do not reorder.
> 7. Return the complete CSV, same columns, same order.

---

## 7. What good looks like when it lands

Check on a phone, not a monitor:

1. Can you tell what it is at arm's length?
2. Does it sit at the same visual weight as the other icons in the deck?
3. Is the outline as heavy as the mite's?
4. Does a disease read as a leaf-with-a-problem, not as an insect?
5. Is the row still legible — icon, label, value, five widgets?
