# Timber — Full Deck Check, September 2026

One research pass over **every card in the deck**: 395 plants, 313 dealt and 82 held.
Answer the questions below for as many as you can and return **one JSON array**.

A held card has no photograph yet. That does not stop it being researched, and it is
not a reason to skip it.

Nothing here is a commercial question. Prices, suppliers, order weeks, pot sizes,
bench weeks, shrink and return risk come from Oscar and nowhere else — the validator
**rejects the whole file** if any of them is filled. See "Never answer these" below.

---

## THE THREE RULES

Carried verbatim from `PLANT-BRIEF.md`, because every defect this deck has shipped
came from breaking one of them.

1. **Never invent.** Unknown field → `""`, and name it in `uncertain` with why. A
   blank is correct. A plausible guess is a defect that reaches a customer.
2. **UK context.** RHS hardiness bands, UK flowering months, UK retail reality.
3. **Answer the plant in front of you.** An answer for the genus is not an answer for
   the cultivar. The importer matches on the **exact latin string** printed in the
   list below and applies nothing else, so a row for `Astilbe` cannot reach the card
   called `Astilbe 'Chocolate Shogun'`. Copy the latin exactly, punctuation included.

---

## THE EIGHT QUESTIONS

Counts are of 395 cards, measured 2026-09-14. Where a card already carries a value the
importer leaves it alone and reports the disagreement — so answering all 395 is welcome
and acts as a second opinion, it is not wasted.

### 1. `foliage` — 160 blank

**Will it look bare in winter?** The single most-asked question on the shop floor.

Must **name one** of: `evergreen` · `semi-evergreen` · `deciduous` · `herbaceous`.
Use `herbaceous` when the plant disappears to the ground rather than merely dropping
its leaves — that is the case customers ring up about thinking it has died.

A leaf description after a semicolon is welcome and prints on the card back:

```
"foliage": "deciduous; five-lobed leaves turning crimson and purple in autumn"
```

A value naming none of the four is **rejected**. "dark green" is a leaf colour, not an
answer to the question.

### 2. `toxicity` — 297 blank

Free prose, **printed verbatim** on the card front flag, the back plaque and the
press-and-hold lens. The card never paraphrases it and never infers it.

- Blank means **NOT RECORDED**. It does not mean safe, and it prints nothing at all
  rather than a reassurance.
- If a plant is genuinely untroublesome, say so explicitly — `"No known hazard."` —
  rather than leaving it blank. Those are different answers.
- Say what it does and to whom: `"Harmful if eaten · skin and eye irritant"`,
  `"Berries harmful if eaten, particularly to dogs"`.
- Edible parts are worth stating where they exist, and so is the trap where one part
  is edible and another is not (rhubarb leaf, cherry laurel stone).

### 3. `hardinessNote` — 185 blank

The qualifier **behind** the H rating, shown when you press and hold the hardiness
crest. Facts about this plant, not about the rating system.

```
"hardinessNote": "RHS H3; established plants may tolerate about -10°C in ideal sheltered sites"
```

It **must not contradict the `hardiness` the card already carries** — the note sits
directly under the crest. If your research disagrees with the card's rating, put that
in `uncertain` and do not quietly restate a different band.

### 4. `rootSize` — NEW FIELD, 395 unanswered

**Root depth × spread**, as a rough mature figure. Formatted to mirror the card's
existing stature line, which reads `1-1.5m H × 0.5-1m W`:

```
"rootSize": "0.3-0.5m D × 1-1.5m W"
```

**Expect to leave this blank often, and leave it blank.** Root architecture is poorly
documented for most garden cultivars — far worse than height and spread. A blank here
is a correct answer and a guessed one is worse than useless, because it is the figure
someone would dig a hole to. Where only one of the two is established, give that one
and say so in `uncertain`.

Genuinely useful where it IS known: anything sold for a wall, a drive, a raised bed,
a small garden, or near drains — which is most of the shrubs and every tree on the list.

### 5. `stockForm` — NEW FIELD, 395 unanswered

**How the trade sells it.** One of: `container` · `bare-root` · `both`.

This is a property of the plant and the trade, not of any one shop. It decides whether
something is a November-to-March order or an any-week order, which is the whole of the
bare-root buying rule.

### 6. `pollination` — NEW FIELD, 395 unanswered

**Does it need a partner to fruit?** Must **name one** of:
`needs partner` · `self-fertile` · `not applicable`.

Prose after a semicolon is welcome:

```
"pollination": "needs partner; female plants only berry with a male nearby"
```

`not applicable` is the honest answer for anything not grown for fruit or berries.
Use `needs partner` for dioecious plants and for any fruit needing a pollination group.
The deck carries *Ilex aquifolium*, two *Skimmia* and several fruiting shrubs where
this has a right answer and the card currently cannot say it.

### 7. `clay` — NEW FIELD, 395 unanswered

**Will it take heavy clay?** `yes` or `no`. Blank if not established — do not write
"unknown", a blank already means that.

The card's `soil` field is written as texture and drainage ("Any soil, well-drained")
and never as clay tolerance, so "what grows in my clay?" currently finds 11 cards out
of 395. This is the field that fixes it.

### 8. `cvs` — 104 blank

Sister cultivars, synonyms and the trade/cultivar-code pairing where one exists:

```
"cvs": "syn. Osmanthus heterophyllus 'Tricolor'"
"cvs": "'Flamenco' – shorter · 'Bees' Sunset' – soft orange"
"cvs": "trade name PETITE PERFUME PINK; cultivar code 'P1'"
```

### Also, only where it applies: `compliance`

369 cards are blank here and **most of them are correctly blank**. Only fill it when a
real duty or restriction exists:

- **Statutory** — Schedule 9 of the Wildlife and Countryside Act, sale bans, controlled
  waste, plant health notices. A duty on whoever plants it.
- **Breeder's rights** — PBR. A restriction on propagation for trade, *not* a duty on
  the customer, and the card renders the two differently.

Do not write "none known" here. Leave it blank.

---

## OUTPUT — one JSON array

One object per plant. Include **only** the keys you actually answered plus `latin`;
omit the rest rather than sending empty strings.

```json
[
  {
    "latin": "Cornus sanguinea 'Midwinter Fire'",
    "foliage": "deciduous; green leaves turning soft yellow before falling to bare stems",
    "toxicity": "No known hazard.",
    "hardinessNote": "RHS H6; hardy throughout the UK",
    "stockForm": "container",
    "pollination": "not applicable",
    "clay": "yes",
    "uncertain": ["rootSize — no published rooting depth found for this cultivar",
                  "cvs — no sister cultivars traced"],
    "sources": ["RHS Plant Finder", "..."]
  }
]
```

`uncertain` is the most valuable key in the file and a human reads it every batch.
`sources` is read, not printed.

---

## NEVER ANSWER THESE

`source` · `order` · `bench` · `root` · `trade` · `retail` · `margin` · `type` ·
`shrink` · `returnRisk` · `pots`

These are Oscar's buying and trade data. `tools/check-plant-json.js` **rejects the
whole file** if any one of them is filled. Never produce prices, margins, suppliers,
order weeks, bench times or stock risk.

Note `root` in that list is **not** the same thing as `rootSize` in question 4.
`root` is a bench-rooting risk rating — how likely the plant is to root through its
pot into the bench — which Oscar knows from the nursery floor and does not need
researching. `rootSize` is the plant's own root depth and spread. Answer `rootSize`;
never touch `root`.

Also not wanted: `seasonalImpact` and the other 0–20 ratings on cards that already
carry them, and any `peak`, `soil`, `visual`, `water`, `prune`, `aspect`,
`resilience`, `uses`, `size` or `hardiness` value for a card that already has one —
this pass is about the gaps, not a rewrite.

---

## BEFORE YOU RETURN IT

- [ ] Every `latin` copied **exactly** from the list below, punctuation and accents included
- [ ] No commercial field filled
- [ ] `foliage` names one of the four words
- [ ] `pollination` names one of the three
- [ ] `hardinessNote` does not contradict the card's own H rating
- [ ] Every blank you left deliberately is named in `uncertain`
- [ ] `rootSize` blank wherever it was not genuinely established

---

## ALL EIGHT IMPORT TODAY

`rootSize`, `stockForm`, `pollination` and `clay` were added to the card schema on
2026-09-14, **with a place on the card each**, so every answer in this file lands the
moment it comes back. Where each one shows up:

| Field | Where it renders |
|---|---|
| `rootSize` | card back beside Size, and the customer sheet as **Roots to** |
| `stockForm` | card back as **Sold as**, and a `📦 Sold as` filter group — Container / Bare-root |
| `pollination` | press-and-hold lens, card back, and the customer sheet as **To get berries** when a partner is needed |
| `clay` | card back as **Clay**, and the `📍 Site` filter as **Heavy clay** |

`not applicable` on `pollination` prints on the back and stays off the front: "this
plant is not grown for fruit" is the absence of a story, not a power point. A blank is
a different thing again — it means nobody has looked.

---

## THE DECK — 395 plants

Latin name first, in backticks, exactly as the card carries it. Common name after the
dash, for your sanity only — the importer ignores it.

1. `× Cuprocyparis leylandii 'Gold Rider'` — Gold Rider Leyland Cypress
2. `Abelia 'Raspberry Profusion'` — Raspberry Profusion Abelia
3. `Abelia × grandiflora 'Sparkling Silver'` — Abelia 'Sparkling Silver'
4. `Acanthus hungaricus` — White Lips Bear's Breeches
5. `Acer griseum` — Paperbark Maple
6. `Acer palmatum 'Bloodgood'` — Bloodgood Japanese Maple
7. `Acer palmatum 'Firecracker'` — Japanese maple 'Firecracker'
8. `Acer palmatum 'Orangeola'` — Japanese Maple 'Orangeola'
9. `Acer palmatum 'Oridono-nishiki'` — Japanese maple 'Oridono-nishiki'
10. `Acer palmatum 'Ōsakazuki'` — Ōsakazuki Japanese Maple
11. `Acer palmatum 'Sango-kaku'` — Coral-bark Maple
12. `Acer palmatum 'Taylor'` — Japanese Maple 'Taylor'
13. `Acer rubrum 'October Glory'` — October Glory Red Maple
14. `Acer shirasawanum MOONRISE ('Munn 001')` — Shirasawa maple Moonrise
15. `Achillea 'The Beacon'` — Fanal Yarrow
16. `Achillea millefolium 'Summer Fruits Lemon'` — Summer Fruits Lemon Yarrow
17. `Achillea umbellata` — Umbellate Yarrow
18. `Actinidia kolomikta` — Variegated Kiwi Vine
19. `Agapanthus 'Ovatus'` — African lily 'Ovatus'
20. `Agapanthus POPPIN’ PURPLE ('PM003')` — Poppin' Purple Agapanthus
21. `Agastache 'Summerlong Coral'` — Giant Hyssop
22. `Ajuga reptans 'Burgundy Glow'` — Burgundy Glow Bugle
23. `Akebia quinata` — Chocolate Vine
24. `Albizia julibrissin` — Persian Silk Tree
25. `Albizia julibrissin 'Summer Chocolate'` — Silk Tree 'Summer Chocolate'
26. `Alchemilla mollis` — Lady's Mantle
27. `Allium karataviense 'Red Giant'` — Kara Tau garlic 'Red Giant'
28. `Allium stipitatum` — Persian shallot
29. `Aloe vera` — Aloe vera
30. `Alstroemeria INDIAN SUMMER ('Tesronto')` — Peruvian lily 'Indian Summer'
31. `Amelanchier lamarckii` — Snowy Mespilus
32. `Anemone × hybrida 'Honorine Jobert'` — Japanese Anemone 'Honorine Jobert'
33. `Anemone × hybrida 'Pretty Lady Emily'` — Pretty Lady Emily Japanese Anemone
34. `Anemone × hybrida Pretty Lady Maria ('Aneplaria')` — Japanese Anemone 'Pretty Lady Maria'
35. `Anisodontea capensis 'Ib201-7'` — Cape mallow 'Candy Apple'
36. `Araucaria araucana` — Monkey Puzzle
37. `Arbutus unedo` — Strawberry Tree
38. `Argyrocytisus battandieri` — Pineapple Broom
39. `Aronia melanocarpa` — Black Chokeberry
40. `Artemisia 'Powis Castle'` — Wormwood 'Powis Castle'
41. `Astelia chathamica` — Silver Spear
42. `Astilbe 'Chocolate Shogun'` — Astilbe 'Chocolate Shogun'
43. `Astilbe 'Fanal'` — Astilbe 'Fanal'
44. `Astrantia 'Roma'` — Masterwort 'Roma'
45. `Astrantia major 'Star of Love'` — Star of Love Masterwort
46. `Aucuba japonica 'Crotonifolia'` — Spotted Laurel 'Crotonifolia'
47. `Begonia BONFIRE ('Nzcone')` — Bonfire Begonia
48. `Begonia soli-mutata` — Solimutata Begonia
49. `Berberis darwinii` — Darwin's Barberry
50. `Berberis thunbergii 'Orange Ice'` — Orange Ice Japanese Barberry
51. `Betula utilis subsp. jacquemontii 'Doorenbos'` — Himalayan Birch 'Doorenbos'
52. `Brachyglottis Walberton’s Silver Dormouse ('Walbrach')` — Walberton’s Silver Dormouse
53. `Brunnera macrophylla 'Jack Frost'` — Siberian Bugloss 'Jack Frost'
54. `Buddleja 'Pugster Orchid'` — Pugster Orchid Butterfly Bush
55. `Buddleja davidii 'White Profusion'` — White Profusion Butterfly Bush
56. `Buddleja davidii LITTLE RUBY ('Botex 006')` — Butterfly bush 'Little Ruby'
57. `Butia capitata` — Jelly palm
58. `Buxus sempervirens` — Common Box
59. `Callicarpa bodinieri 'Profusion'` — Beautyberry 'Profusion'
60. `Callistemon citrinus 'Splendens'` — Crimson bottlebrush 'Splendens'
61. `Calycanthus 'Aphrodite'` — Sweetshrub 'Aphrodite'
62. `Camellia japonica 'Doctor King'` — Doctor King Camellia
63. `Campsis grandiflora` — Tropical Summer Trumpet Creeper
64. `Carpinus betulus` — Common Hornbeam
65. `Caryopteris × clandonensis` — Bluebeard 'Dark Knight'
66. `Caryopteris × clandonensis 'Worcester Gold'` — Bluebeard 'Worcester Gold'
67. `Cassinia fulvida` — Golden Cottonwood
68. `Catalpa × erubescens 'Purpurea'` — Purple Hybrid Catalpa
69. `Ceanothus 'Concha'` — Californian Lilac 'Concha'
70. `Ceanothus thyrsiflorus 'Cool Blue'` — Californian Lilac 'Cool Blue'
71. `Cedrus atlantica (Glauca Group) 'Horstmann’s Silberspitz'` — Atlas cedar 'Horstmann's Silberspitz'
72. `Cedrus deodara` — Deodar cedar
73. `Cephalanthus occidentalis 'Bailoptics'` — Button bush 'Fiber Optics'
74. `Ceratostigma willmottianum SAPPHIRE RING ('Lissbrill')` — Sapphire Ring Chinese Plumbago
75. `Cercidiphyllum japonicum` — Katsura Tree
76. `Cercis canadensis 'Eternal Flame'` — Eastern Redbud
77. `Cercis canadensis CAROLINA SWEETHEART ('NCCC1')` — Eastern redbud 'Carolina Sweetheart'
78. `Cercis chinensis 'Avondale'` — Chinese Redbud
79. `Chaenomeles × superba 'Crimson and Gold'` — Flowering Quince 'Crimson and Gold'
80. `Chaenomeles speciosa 'Kinshiden'` — Flowering Quince 'Kinshiden'
81. `Chamaerops humilis` — Dwarf Fan Palm
82. `Choisya ternata` — Mexican Orange Blossom
83. `Cistus × pulverulentus 'Sunset'` — Sunset Rock Rose
84. `Citrus × meyeri 'Meyer'` — Meyer's Lemon
85. `Clematis 'Jackmanii'` — Clematis 'Jackmanii'
86. `Clematis 'Nelly Moser'` — Clematis 'Nelly Moser'
87. `Clematis × cartmanii AVALANCHE ('Blaaval')` — Clematis 'Avalanche'
88. `Clematis armandii` — Evergreen Clematis
89. `Clematis JOSEPHINE ('Evijohill')` — Clematis 'Josephine'
90. `Clematis montana var. rubens` — Clematis montana var. rubens
91. `Clematis viticella 'Purpurea Plena Elegans'` — Clematis 'Purpurea Plena Elegans'
92. `Coprosma 'Inferno'` — Inferno Looking-glass Plant
93. `Cordyline australis 'Torbay Dazzler'` — Cabbage Palm 'Torbay Dazzler'
94. `Cordyline australis CHARLIE BOY ('Ric01')` — Cabbage palm Charlie Boy
95. `Cornus controversa 'Variegata'` — Wedding Cake Tree
96. `Cornus kousa` — Pink Kousa Dogwood
97. `Cornus kousa 'Flower Tower'` — Flower Tower Dogwood
98. `Cornus kousa FLOWER TOWER ('Zuilb1')` — Kousa Dogwood 'Flower Tower'
99. `Cornus sanguinea 'Midwinter Fire'` — Dogwood 'Midwinter Fire'
100. `Cornus sericea 'Variegata'` — Variegated red-osier dogwood
101. `Coronilla emerus` — Shrubby scorpion vetch
102. `Corylus avellana 'Contorta'` — Corkscrew Hazel
103. `Cotinus 'Grace'` — Grace Smoke Bush
104. `Cotinus coggygria 'Royal Purple'` — Royal Purple Smoke Bush
105. `Cotoneaster atropurpureus 'Variegatus'` — Variegated Wall Cotoneaster
106. `Cotoneaster horizontalis` — Wall Cotoneaster
107. `Crataegus laevigata 'Paul’s Scarlet'` — Midland Hawthorn 'Paul's Scarlet'
108. `Crinodendron hookerianum` — Chile Lantern Tree
109. `Crocosmia 'Lucifer'` — Montbretia 'Lucifer'
110. `Cryptomeria japonica 'Globosa Nana'` — Globosa Nana Japanese Cedar
111. `Cryptomeria japonica Serama ('FM5')` — Japanese cedar 'Serama'
112. `Cupressus macrocarpa 'Goldcrest'` — Monterey cypress 'Goldcrest'
113. `Cyclamen hederifolium var. hederifolium f. albiflorum` — White-flowered ivy-leaved cyclamen
114. `Dahlia 'Kelvin Floodlight'` — Decorative dahlia 'Kelvin Floodlight'
115. `Dahlia ELECTRO PINK ('71853-09')` — Dahlia 'Electro Pink'
116. `Daphne × transatlantica PINK FRAGRANCE ('Blapink')` — Daphne 'Pink Fragrance'
117. `Daphne bholua 'Jacqueline Postill'` — Daphne 'Jacqueline Postill'
118. `Davidia involucrata` — Handkerchief Tree
119. `Delphinium Black Knight Group` — Delphinium Black Knight Group
120. `Deutzia × hybrida 'Magicien'` — Deutzia 'Magicien'
121. `Deutzia gracilis 'Nikko'` — Deutzia 'Nikko'
122. `Dicksonia antarctica` — Soft Tree Fern
123. `Disporum sessile 'Variegatum'` — Sessile fairy bells 'Variegatum'
124. `Drosera capensis` — Cape Sundew
125. `Dryopteris erythrosora` — Copper Shield Fern
126. `Echinacea 'Delicious Strawberry'` — Delicious Strawberry Coneflower
127. `Echinacea SUNSEEKERS ROSY ('Ifecssrosy')` — SunSeekers Rosy Coneflower
128. `Edgeworthia chrysantha` — Paperbush
129. `Elaeagnus × submacrophylla 'Limelight'` — Oleaster 'Limelight'
130. `Elaeagnus ×submacrophylla` — Ebbinge's Silverberry
131. `Enkianthus campanulatus` — Redvein Enkianthus
132. `Epimedium × perralchicum 'Fröhnleiten'` — Barrenwort 'Fröhnleiten'
133. `Erigeron karvinskianus 'Profusion'` — Mexican fleabane 'Profusion'
134. `Eriobotrya japonica` — Japanese Loquat
135. `Eryngium × olivierianum BIG BLUE ('Myersblue')` — Big Blue Sea Holly
136. `Erysimum 'Bowles’s Mauve'` — Perennial Wallflower 'Bowles's Mauve'
137. `Escallonia 'Gold Brian'` — Escallonia 'Gold Brian'
138. `Escallonia laevis PINK ELLE ('Lades')` — Pink Elle Escallonia
139. `Eucalyptus gunnii Azura ('Cagire')` — Cider Gum 'Azura'
140. `Euonymus alatus` — Winged Spindle
141. `Euonymus fortunei 'Emerald 'n' Gold'` — Emerald 'n' Gold Spindle
142. `Euonymus fortunei 'Emerald Gaiety'` — Emerald Gaiety Spindle
143. `Euonymus fortunei 'Harlequin'` — Harlequin Spindle
144. `Euonymus japonicus 'Aureomarginatus'` — Golden Japanese Spindle
145. `Euonymus japonicus 'Green Spire'` — Green Spire Japanese Spindle
146. `Euonymus japonicus 'Microphyllus Albovariegatus'` — Spindle 'Microphyllus Albovariegatus'
147. `Eupatorium japonicum 'Pink Frost'` — Eupatorium 'Pink Frost'
148. `Euphorbia × martini 'Ascot Rainbow'` — Ascot Rainbow Martin's Spurge
149. `Euphorbia × martini MINER’S MERLOT ('Km-mm024')` — Miner's Merlot Martin's Spurge
150. `Euphorbia characias 'Silver Edge'` — Silver Edge Mediterranean Spurge
151. `Exochorda × macrantha` — Pearl Bush 'The Bride'
152. `Fagus sylvatica` — Common Beech
153. `Fagus sylvatica (Atropurpurea Group)` — Copper beech
154. `Fallopia baldschuanica` — Russian Vine
155. `Fargesia rufa` — Dragon Head Bamboo
156. `Fatsia japonica 'Tsumugi-shibori'` — Spider's Web Japanese Aralia
157. `Festuca glauca INTENSE BLUE ('Casblue')` — Intense Blue Fescue
158. `Ficus elastica` — Rubber plant
159. `Forsythia × intermedia 'Lynwood Variety'` — Forsythia 'Lynwood Variety'
160. `Fothergilla major` — Witch Alder
161. `Fuchsia 'Mrs Popple'` — Hardy Fuchsia 'Mrs Popple'
162. `Galium odoratum` — Sweet Woodruff
163. `Geranium 'Bob’s Blunder'` — Cranesbill 'Bob’s Blunder'
164. `Geranium Rozanne ('Gerwat')` — Cranesbill 'Rozanne'
165. `Ginkgo biloba` — Maidenhair Tree
166. `Gleditsia triacanthos f. inermis 'Sunburst'` — Honey Locust 'Sunburst'
167. `Griselinia littoralis` — New Zealand Broadleaf
168. `Gunnera manicata` — Brazilian Giant Rhubarb
169. `Hakonechloa macra 'Aureola'` — Japanese Forest Grass 'Aureola'
170. `Hamamelis × intermedia 'Arnold Promise'` — Arnold Promise Witch Hazel
171. `Hamamelis × intermedia 'Jelena'` — Jelena Witch Hazel
172. `Hebe 'Red Edge'` — Hebe 'Red Edge'
173. `Hedera colchica 'Sulphur Heart'` — Persian Ivy 'Sulphur Heart'
174. `Hedera helix 'Oro di Bogliasco'` — Ivy 'Goldheart'
175. `Helleborus (Rodney Davey Marbled Group) Anna’s Red ('Abcrd02')` — Hellebore 'Anna's Red'
176. `Helleborus × ericsmithii 'Winter Moonbeam'` — Hybrid Christmas rose 'Winter Moonbeam'
177. `Heuchera 'Paris'` — Heuchera 'Paris'
178. `Heuchera villosa 'Palace Purple'` — Alum Root 'Palace Purple'
179. `Heuchera villosa 'Timeless Night'` — Heuchera 'Timeless Night'
180. `Hibiscus syriacus 'Oiseau Bleu'` — Oiseau Bleu Rose of Sharon
181. `Hibiscus syriacus LAVENDER CHIFFON ('Notwoodone')` — Rose of Sharon 'Lavender Chiffon'
182. `Hosta 'Broadband'` — Broadband Hosta
183. `Hosta 'Emerald Charger'` — Plantain lily 'Emerald Charger'
184. `Hosta × tardiana 'Halcyon'` — Hosta 'Halcyon'
185. `Houttuynia cordata 'Pied Piper'` — Heart-leaved houttuynia 'Pied Piper'
186. `Hydrangea arborescens 'Pink Annabelle'` — Pink Annabelle Hydrangea
187. `Hydrangea aspera 'Rosemary Foster'` — Rosemary Foster Rough-Leaved Hydrangea
188. `Hydrangea DAREDEVIL ('Jpd01')` — Daredevil Hydrangea
189. `Hydrangea macrophylla 'Sweet Cupcake'` — Sweet Cupcake Hydrangea
190. `Hydrangea macrophylla 'Zorro'` — Lacecap hydrangea 'Zorro'
191. `Hydrangea macrophylla RENDEZ-VOUS FRENCH CANCAN BLEU` — French Cancan Bleu Hydrangea
192. `Hydrangea paniculata 'LC NO21'` — Groundbreaker Blush hydrangea
193. `Hydrangea paniculata 'Pink & Rose'` — Panicle Hydrangea 'Pink & Rose'
194. `Hydrangea paniculata 'Wim’s Red'` — Panicled hydrangea 'Wim’s Red'
195. `Hydrangea petiolaris` — Climbing Hydrangea
196. `Hydrangea quercifolia 'Ice Crystal'` — Oak-leaved Hydrangea 'Ice Crystal'
197. `Hydrangea serrata` — Mountain Hydrangea
198. `Hylotelephium 'Dream Dazzler'` — Dream Dazzler Stonecrop
199. `Hypericum × hidcoteense 'Hidcote'` — St John's Wort 'Hidcote'
200. `Hypericum × inodorum MIRACLE GRANDEUR ('Allgrandeur')` — St John's wort 'Miracle Grandeur'
201. `Hypericum × inodorum MIRACLE NIGHT ('Allmadne')` — St John's wort 'Miracle Night'
202. `Ilex aquifolium 'Argentea Marginata'` — Silver-Margined Holly
203. `Ilex crenata 'Jenny'` — Jenny Japanese Holly
204. `Ilex crenata 'Kinme'` — Kinme Japanese Holly
205. `Impatiens omeiana` — Omei Mountain Balsam
206. `Imperata cylindrica 'Rubra'` — Japanese blood grass 'Red Baron'
207. `Indigofera himalayensis 'Silk Road'` — Himalayan Indigo 'Silk Road'
208. `Jacobaea maritima` — Silver Leaf Cineraria
209. `Jasminum nudiflorum` — Winter Jasmine
210. `Jasminum officinale 'Devon Cream'` — Devon Cream Summer Jasmine
211. `Juniperus virginiana 'Blue Arrow'` — Juniper 'Blue Arrow'
212. `Kalmia latifolia 'Ostbo Red'` — Calico Bush 'Ostbo Red'
213. `Kerria japonica 'Pleniflora'` — Double-flowered Japanese Kerria
214. `Kniphofia 'Pyromania Orange Blaze'` — Red Hot Poker
215. `Koelreuteria paniculata` — Golden Rain Tree
216. `Kolkwitzia amabilis 'Pink Cloud'` — Beauty Bush 'Pink Cloud'
217. `Laburnum × watereri 'Vossii'` — Golden Chain 'Vossii'
218. `Lagerstroemia indica WITH LOVE BABE ('Milaperl')` — Crape Myrtle 'With Love Babe'
219. `Lamprocapnos spectabilis` — Bleeding Heart
220. `Laurus nobilis` — Bay Laurel
221. `Lavandula angustifolia 'Hidcote'` — English Lavender 'Hidcote'
222. `Lavandula stoechas 'Anouk Deluxe Purple'` — French Lavender 'Anouk Deluxe Purple'
223. `Leucophyta brownii` — Cushion Bush
224. `Leucothoe fontanesiana WHITEWATER ('Howw')` — Whitewater Dog Hobble
225. `Leycesteria formosa 'Golden Lanterns'` — Golden Lanterns Himalayan Honeysuckle
226. `Liatris spicata 'Cobalus'` — Cobalus Gayfeather
227. `Ligularia 'Treasure Island'` — Bigleaf golden ray 'Treasure Island'
228. `Ligustrum ovalifolium` — Oval-leaved Privet
229. `Ligustrum ovalifolium 'Aureum'` — Golden Privet
230. `Lilium formosanum var. pricei` — Dwarf Formosa lily
231. `Liquidambar styraciflua 'Slender Silhouette'` — Slender Silhouette Sweet Gum
232. `Liriodendron tulipifera 'Snow Bird'` — Snow Bird Tulip Tree
233. `Liriope muscari` — Big Blue Lilyturf
234. `Lithodora diffusa 'Heavenly Blue'` — Heavenly Blue
235. `Lobelia × speciosa STARSHIP DEEP ROSE ('Pas905518')` — Starship Deep Rose Lobelia
236. `Lomandra longifolia WHITE SANDS ('Roma 13')` — White Sands Lomandra
237. `Lonicera × purpusii 'Winter Beauty'` — Winter Beauty Honeysuckle
238. `Lonicera henryi 'Copper Beauty'` — Henry's honeysuckle 'Copper Beauty'
239. `Lonicera ligustrina var. yunnanensis 'Baggesen’s Gold'` — Golden Shrubby Honeysuckle
240. `Lonicera periclymenum 'Rhubarb and Custard'` — Honeysuckle 'Rhubarb and Custard'
241. `Lonicera periclymenum 'Serotina'` — Late Dutch Honeysuckle
242. `Loropetalum chinense var. rubrum 'Fede'` — Fede Chinese Fringe Flower
243. `Lotus hirsutus LITTLE BOY BLUE ('Lisbob')` — Hairy Canary Clover
244. `Luma apiculata` — Chilean Myrtle
245. `Lupinus 'The Governor' (Band of Nobles Series)` — Lupin 'The Governor'
246. `Lysimachia nummularia 'Aurea'` — Golden Creeping Jenny
247. `Magnolia 'Cameo'` — Magnolia 'Cameo'
248. `Magnolia acuminata` — Cucumber tree
249. `Magnolia HONEY TULIP ('Jurmag5')` — Honey Tulip Magnolia
250. `Magnolia stellata` — Star Magnolia
251. `Mahonia × media 'Charity'` — Mahonia 'Charity'
252. `Mahonia japonica` — Japanese Mahonia
253. `Malus 'Evereste'` — Crab Apple 'Evereste'
254. `Malus 'John Downie'` — Crab Apple 'John Downie'
255. `Malus 'Veitch’s Scarlet'` — Crab Apple 'Veitch’s Scarlet'
256. `Malva × clementii 'Rosea'` — Tree Mallow 'Rosea'
257. `Melianthus major` — Honey Bush
258. `Miscanthus sinensis 'Morning Light'` — Morning Light Eulalia
259. `Modiolastrum lateritium` — Modiolastrum lateritium
260. `Monarda didyma 'Bubblegum Blast'` — Bubblegum Blast Bee Balm
261. `Monstera deliciosa` — Swiss cheese plant
262. `Monstera deliciosa 'Thai Constellation'` — Swiss cheese plant 'Thai Constellation'
263. `Muehlenbeckia complexa` — Necklace Vine
264. `Musa basjoo` — Japanese Banana
265. `Myrtus communis` — Common Myrtle
266. `Nandina domestica` — Heavenly Bamboo
267. `Nemesia 'Confetti'` — Nemesia 'Confetti'
268. `Nepeta racemosa 'Walker’s Low'` — Catmint 'Walker's Low'
269. `Nerium oleander` — Oleander
270. `Nymphaea 'Marliacea Carnea'` — Waterlily 'Marliacea Carnea'
271. `Nyssa sylvatica 'Wisley Bonfire'` — Tupelo 'Wisley Bonfire'
272. `Oenothera lindheimeri 'Rosy Jane'` — Gaura 'Rosy Jane'
273. `Oenothera lindheimeri GAUDI ROSE ('Florgaucomro')` — Gaura 'Gaudi Rose'
274. `Oenothera lindheimeri PAPILLON ('Nugaupapil')` — White Gaura 'Papillon'
275. `Oenothera stricta 'Sulphurea'` — Evening primrose 'Sulphurea'
276. `Olea europaea` — Common Olive
277. `Ophiopogon planiscapus 'Kokuryū'` — Black mondo grass
278. `Osmanthus heterophyllus 'Goshiki'` — Goshiki Holly Olive
279. `Oxalis triangularis 'Mijke'` — False Shamrock 'Mijke'
280. `Paeonia 'Orange Victory'` — Orange Victory Itoh Peony
281. `Paeonia lactiflora 'Tom Cat'` — Peony 'Tom Cat'
282. `Parrotia persica` — Persian Ironwood
283. `Parrotia persica 'Bella'` — Persian ironwood 'Bella'
284. `Parthenocissus quinquefolia` — Virginia Creeper
285. `Parthenocissus tricuspidata` — Boston Ivy
286. `Parthenocissus tricuspidata 'Lowii'` — Boston Ivy 'Lowii'
287. `Passiflora ‘Damsel’s Delight’` — Damsel's Delight Passion Flower
288. `Pennisetum 'Rubrum'` — Purple Fountain Grass
289. `Pennisetum advena TINY TAILS ('TUS022')` — Tiny Tails Fountain Grass
290. `Persicaria affinis 'Darjeeling Red'` — Knotweed 'Darjeeling Red'
291. `Phalaenopsis Hybrid Group` — Cascading Moth Orchid
292. `Philadelphus PETITE PERFUME PINK ('P1')` — Petite Perfume Pink Mock Orange
293. `Phlomis italica` — Balearic Island Sage
294. `Phlox paniculata 'David'` — Garden phlox 'David'
295. `Photinia × fraseri PINK MARBLE ('Cassini')` — Pink Marble Christmas Berry
296. `Phygelius aequalis 'Trewidden Pink'` — Cape figwort 'Trewidden Pink'
297. `Phyllostachys nigra` — Black Bamboo
298. `Physocarpus opulifolius 'Diabolo'` — Ninebark 'Diabolo'
299. `Physocarpus opulifolius ALL BLACK ('Minall2')` — Ninebark 'All Black'
300. `Physocarpus opulifolius LITTLE DEVIL ('Donna May')` — Ninebark 'Little Devil'
301. `Picea glauca 'Echiniformis'` — White Spruce 'Echiniformis'
302. `Pieris 'Forest Flame'` — Pieris 'Forest Flame'
303. `Pieris japonica 'Mountain Fire'` — Pieris 'Mountain Fire'
304. `Pinus koraiensis 'Jack Corbit'` — Korean pine 'Jack Corbit'
305. `Pinus mugo` — Dwarf mountain pine
306. `Pittosporum tenuifolium 'Elizabeth'` — Pittosporum 'Elizabeth'
307. `Pittosporum tenuifolium 'Tom Thumb'` — Tawhiwhi 'Tom Thumb'
308. `Plumbago auriculata` — Cape Leadwort
309. `Potentilla fruticosa 'Pink Beauty'` — Pink Beauty Shrubby Cinquefoil
310. `Primula vialii` — Vial's primrose
311. `Prunus 'Chōshū-hizakura'` — Choshu-hizakura Flowering Cherry
312. `Prunus 'Kanzan'` — Japanese Flowering Cherry 'Kanzan'
313. `Prunus cerasifera 'Nigra'` — Black Cherry Plum
314. `Prunus incisa 'Kojo-no-mai'` — Kojo-no-mai Fuji Cherry
315. `Prunus laurocerasus 'Rotundifolia'` — Cherry Laurel 'Rotundifolia'
316. `Prunus lusitanica 'Angustifolia'` — Portuguese Laurel
317. `Prunus serrula` — Tibetan Cherry
318. `Pyracantha 'Red Star'` — Firethorn 'Red Star'
319. `Pyracantha coccinea 'Orange Star'` — Orange Star Firethorn
320. `Pyracantha SAPHYR ORANGE ('Cadange')` — Firethorn SAPHYR ORANGE
321. `Quercus robur` — English Oak
322. `Reynoutria japonica` — Japanese Knotweed
323. `Rhaphiolepis × delacourii ENCHANTRESS ('Moness')` — Enchantress Indian Hawthorn
324. `Rhodanthemum hosmariense 'Zagora Yellow'` — Moroccan daisy 'Zagora Yellow'
325. `Rhododendron 'Gartendirektor Glocker'` — Dwarf rhododendron 'Gartendirektor Glocker'
326. `Rhododendron 'Homebush'` — Deciduous Azalea 'Homebush'
327. `Rhododendron 'Hoppy'` — Rhododendron 'Hoppy'
328. `Rhododendron 'Horizon Monarch'` — Horizon Monarch Rhododendron
329. `Rhododendron luteum` — Yellow Azalea
330. `Rhus typhina` — Stag's Horn Sumach
331. `Rhus typhina 'Dissecta'` — Cut-leaved Stag's Horn Sumach
332. `Ribes sanguineum 'King Edward VII'` — Flowering Currant 'King Edward VII'
333. `Robinia pseudoacacia 'Lace Lady'` — False acacia 'Lace Lady'
334. `Rodgersia 'Bronze Peacock'` — Rodgersia 'Bronze Peacock'
335. `Rosa 'New Dawn'` — Rose 'New Dawn'
336. `Rosa 'Summer Song' ('Austango')` — English shrub rose 'Summer Song'
337. `Rosa FLIRT 2011 ('Korchakon')` — Patio Rose FLIRT 2011
338. `Rosa GERTRUDE JEKYLL ('Ausbord')` — Rose GERTRUDE JEKYLL
339. `Rosa ICEBERG ('Korbin')` — Rose ICEBERG
340. `Rosa rugosa` — Rugosa Rose
341. `Rudbeckia 'Fireball'` — Rudbeckia 'Fireball'
342. `Rudbeckia fulgida var. sullivantii 'Goldsturm'` — Black-eyed Susan 'Goldsturm'
343. `Salix × sepulcralis var. chrysocoma` — Golden Weeping Willow
344. `Salix integra 'Hakuro-nishiki'` — Flamingo Willow
345. `Salvia 'Blue Spire'` — Blue Spire Russian Sage
346. `Salvia 'Hot Lips'` — Hot Lips Sage
347. `Salvia guaranitica 'Black and Blue'` — Black and Blue Anise-Scented Sage
348. `Salvia rosmarinus 'Miss Jessopp’s Upright'` — Rosemary 'Miss Jessopp's Upright'
349. `Sambucus nigra f. porphyrophylla 'Eva'` — Black Elder 'Black Lace'
350. `Sambucus nigra f. porphyrophylla 'Gerda'` — Black Beauty Elder
351. `Sanguisorba 'Pink Brushes'` — Burnet 'Pink Brushes'
352. `Santolina chamaecyparissus 'Lambrook Silver'` — Cotton Lavender 'Lambrook Silver'
353. `Sarcococca confusa` — Christmas Box
354. `Sarcococca ruscifolia` — Fragrant Sweet Box
355. `Scabiosa columbaria FLUTTER PURE WHITE ('Balflutturite')` — Flutter Pure White Small Scabious
356. `Sempervivum arachnoideum` — Cobweb houseleek
357. `Skimmia japonica 'Rubella'` — Skimmia 'Rubella'
358. `Skimmia japonica OBSESSION ('Obsbolwi')` — Obsession Japanese Skimmia
359. `Solanum laxum 'Album'` — White potato vine
360. `Solanum pyracanthos` — Porcupine tomato
361. `Sorbaria sorbifolia 'Sem'` — Sem False Spirea
362. `Sorbus AUTUMN SPIRE ('Flanrock')` — Autumn Spire Rowan
363. `Spiraea 'Double Play Doozie'` — Double Play Doozie Spirea
364. `Spiraea japonica 'Goldflame'` — Japanese Spiraea 'Goldflame'
365. `Stachys byzantina 'Silver Carpet'` — Lamb's Ear 'Silver Carpet'
366. `Stachyurus praecox` — Early Stachyurus
367. `Styrax japonicus 'Evening Light'` — Japanese snowbell 'Evening Light'
368. `Syringa meyeri 'Palibin'` — Dwarf Lilac 'Palibin'
369. `Syringa vulgaris` — Common lilac
370. `Syringa vulgaris 'Znamya Lenina'` — Lilac 'Znamya Lenina'
371. `Tamarix ramosissima 'Pink Cascade'` — Tamarisk 'Pink Cascade'
372. `Taxus baccata 'Fastigiata Robusta'` — Fastigiata Robusta Yew
373. `Tetrapanax papyrifer 'Rex'` — Rice-paper Plant 'Rex'
374. `Teucrium fruticans` — Shrubby Germander
375. `Trachelospermum jasminoides` — Star Jasmine
376. `Trachycarpus fortunei` — Chusan Palm
377. `Uncinia 'Everflame'` — Everflame Red Hook Sedge
378. `Verbena bonariensis` — Purpletop Vervain
379. `Veronica 'Emerald Gem'` — Hebe 'Emerald Gem'
380. `Veronica 'Rhubarb Crumble'` — Hebe 'Rhubarb Crumble'
381. `Veronicastrum 'Red Arrows'` — Culver's root 'Red Arrows'
382. `Viburnum × bodnantense 'Charles Lamont'` — Charles Lamont Bodnant Viburnum
383. `Viburnum davidii` — David Viburnum
384. `Viburnum opulus` — Compact Guelder Rose
385. `Viburnum opulus 'Roseum'` — Snowball Bush
386. `Viburnum plicatum f. plicatum 'Popcorn'` — Japanese Snowball 'Popcorn'
387. `Viburnum tinus 'Eve Price'` — Laurustinus 'Eve Price'
388. `Vitex × 'Bailtexone'` — Chaste tree 'Flip Side'
389. `Vitex agnus-castus 'Piivac-I'` — Chaste tree 'Delta Blues'
390. `Weigela 'Bristol Ruby'` — Weigela 'Bristol Ruby'
391. `Weigela florida ‘Nana Variegata’` — Variegated Dwarf Weigela
392. `Weigela PRISM MAGIC CARPET ('VPWG18-06')` — Weigela 'Prism Magic Carpet'
393. `Wisteria floribunda f. multijuga` — Japanese Wisteria
394. `Wisteria sinensis` — Chinese Wisteria
395. `Yucca gloriosa 'Variegata'` — Variegated Spanish Dagger
