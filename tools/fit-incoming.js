'use strict';
/*
  fit-incoming.js — maps a researched incoming JSON batch onto the card schema.

  The incoming shape (PLANT-BRIEF.md) and the card shape are deliberately
  different. Research prose is long; the card is a painted 420x600 template with
  measured slots. This script is where that gap is closed ON PURPOSE, in one
  reviewable place, instead of each batch being hand-edited differently.

  Three things it does that a naive mapper would get wrong:

  1. soil + soilWarning are JOINED into the card's single `soil` string, and the
     two halves have hard length budgets (26 / 44). Those are not style rules —
     the soil panel is a narrow parchment strip and longer text overflows into
     the warning triangle below it. Because research prose always blows the
     budget, the short forms are hand-authored in FIT below rather than
     machine-truncated: a clipped sentence on a printed card is worse than a
     short one that was written to be short.

  2. `aspect` on a card is a COMPASS FACING, because the card draws a compass.
     Incoming prose gives light levels ("full sun to partial shade") which is
     sunNeed, a different field. Facings are derived from the sun band, and any
     facing the research actually stated wins over the derivation.

  3. Long prose fields are trimmed at SENTENCE boundaries only, never mid-word,
     to budgets taken from what the existing deck already carries. A trimmed
     field always ends as a whole sentence.

  toxicity, compliance, hardinessNote and foliage ARE carried (they became card
  fields in Aug 2026, foliage on 2026-09-13). What the card schema still cannot
  carry (container, uncertain) is NOT dropped either: the raw batch stays committed
  in data/incoming/ and tools/unmapped-report.js lists what is being left there.

  Usage:  node tools/fit-incoming.js data/incoming/wishlist-batch-01.json [--json]
*/

/* Hand-authored short forms. Keyed by incoming `latin`.
   soil  <= 26 chars — soil TYPE and drainage only.
   warn  <= 44 chars — a real constraint, not a restatement of soil.
   face  — compass facing; omit to derive from the sun band. */
const FIT = {
  "Fuchsia 'Alice Hoffman'":
    { soil: 'Fertile, moist, drained', warn: 'Avoid winter wet and cold drying winds' },
  "Berberis thunbergii 'Desperados'":
    { soil: 'Any soil, well-drained', warn: 'Dislikes waterlogging; spines injure' },
  "Symphyotrichum dumosum 'Alpha White'":
    { soil: 'Fertile, moist, drained', warn: 'Winter wet; poor airflow brings mildew' },
  "Viola \u00d7 wittrockiana 'Rose Blotch'":
    { soil: 'Fertile, humus-rich, moist', warn: 'Wet compost rots it; hates summer heat' },
  "Gomphrena globosa":
    { soil: 'Fertile, free-draining', warn: 'Cold wet soil rots it; frost kills it' },
  "Cyclamen persicum Super Serie Djix F1":
    { soil: 'Free-draining loam compost', warn: 'Never let the tuber sit wet; crown rots' },
  "Allium stipitatum":
    { soil: 'Fertile, drained, any pH', warn: 'Winter wet rots the bulb' },
  "Phlox paniculata 'David'":
    { soil: 'Fertile, moist, drained', warn: 'Never let it dry out; keep air moving' },
  "Stachys byzantina 'Silver Carpet'":
    { soil: 'Any soil, well-drained', warn: 'Winter wet rots the crown' },
  "Acer palmatum 'Sango-kaku'":
    { soil: 'Fertile, drained, acidic', warn: 'Wind and drought scorch the leaves' },
  "Alchemilla mollis":
    { soil: 'Any, moist but drained', warn: "Self-seeds freely where it's happy" },
  "Anemone × hybrida 'Honorine Jobert'":
    { soil: 'Humus-rich, moist, drained', warn: 'Spreads by rhizome once settled' },
  "Astilbe 'Fanal'":
    { soil: 'Fertile, humus-rich, moist', warn: 'Never let it bake dry' },
  "Astrantia 'Roma'":
    { soil: 'Fertile, humus-rich, moist', warn: 'Struggles in hot dry positions' },
  "Berberis darwinii":
    { soil: 'Any soil, well-drained', warn: 'Spines injure; gloves when pruning' },
  "Brunnera macrophylla 'Jack Frost'":
    { soil: 'Humus-rich, moist, drained', warn: 'Sun and dry soil scorch the foliage' },
  "Buxus sempervirens":
    { soil: 'Any, moist but drained', warn: 'Box blight and box tree moth' },
  "Clematis 'Jackmanii'":
    { soil: 'Fertile, moist, drained', warn: 'Keep the root zone cool and shaded' },
  "Cornus sanguinea 'Midwinter Fire'":
    { soil: 'Any, moist but drained', warn: 'Shade dulls the winter stems' },
  "Cotoneaster horizontalis":
    { soil: 'Any soil, well-drained', warn: 'Schedule 9; do not spread in the wild' },
  "Crataegus laevigata 'Paul's Scarlet'":
    { soil: 'Any, reasonably drained', warn: 'Avoid permanently wet ground' },
  "Crocosmia 'Lucifer'":
    { soil: 'Fertile, moist, drained', warn: 'Winter wet rots the corms' },
  "Delphinium Black Knight Group":
    { soil: 'Fertile, moist, drained', warn: 'Stake it; wind snaps the spikes' },
  "Fagus sylvatica":
    { soil: 'Fertile, well-drained', warn: 'Dislikes prolonged waterlogging' },
  "Forsythia × intermedia 'Lynwood Variety'":
    { soil: 'Any, moist but drained', warn: 'Shade costs you the flowers' },
  "Fuchsia 'Mrs Popple'":
    { soil: 'Fertile, moist, drained', warn: 'Late frost damages new growth' },
  "Hebe 'Red Edge'":
    { soil: 'Any, free-draining', warn: 'Cold wet winters are the killer' },
  "Heuchera villosa 'Palace Purple'":
    { soil: 'Fertile, moist, drained', warn: 'Winter wet and summer drought' },
  "Hosta × tardiana 'Halcyon'":
    { soil: 'Fertile, humus-rich, moist', warn: 'Slugs and snails will shred it' },
  "Hydrangea petiolaris":
    { soil: 'Humus-rich, moist, drained', warn: 'Slow to start; hates dry soil' },
  "Hypericum × hidcoteense 'Hidcote'":
    { soil: 'Any, moist but drained', warn: 'Avoid prolonged waterlogging' },
  "Jasminum nudiflorum":
    { soil: 'Any soil, well-drained', warn: 'Avoid waterlogged ground' },
  "Kerria japonica 'Pleniflora'":
    { soil: 'Fertile, moist, drained', warn: 'Suckers well beyond where you plant it' },
  "Laburnum × watereri 'Vossii'":
    { soil: 'Any soil, well-drained', warn: 'Seeds are highly toxic to children' },
  "Lamprocapnos spectabilis":
    { soil: 'Humus-rich, moist, drained', warn: 'Dies back in summer; mark the crown' },
  "Laurus nobilis":
    { soil: 'Fertile, well-drained', warn: 'Winter wet and freezing wind' },
  "Lavandula angustifolia 'Hidcote'":
    { soil: 'Free-draining, alkaline', warn: 'Winter wet kills it, not the cold' },
  "Ligustrum ovalifolium":
    { soil: 'Any, reasonably drained', warn: "Berries spread it where it isn't wanted" },
  "Lonicera ligustrina var. yunnanensis 'Baggesen's Gold'":
    { soil: 'Any, moist but drained', warn: 'Shade turns the gold leaves green' },
  "Lupinus 'The Governor' (Band of Nobles Series)":
    { soil: 'Fertile, drained, acidic', warn: 'Slugs and aphids; dislikes lime' },
  "Magnolia stellata":
    { soil: 'Humus-rich, acid-neutral', warn: 'Late frost browns the flower buds' },
  "Mahonia × media 'Charity'":
    { soil: 'Fertile, moist, drained', warn: 'Shelter from severe drying winds' },
  "Parthenocissus tricuspidata":
    { soil: 'Any, moist but drained', warn: 'Will cover gutters, roofs and windows' },
  "Prunus 'Kanzan'":
    { soil: 'Fertile, moist, drained', warn: 'Never prune in winter; silver leaf' },
  "Prunus laurocerasus 'Rotundifolia'":
    { soil: 'Any, reasonably drained', warn: 'Cut with secateurs, not a trimmer' },
  "Prunus serrula":
    { soil: 'Fertile, moist, drained', warn: 'Avoid waterlogged soil' },
  "Pyracantha SAPHYR ORANGE ('Cadange')":
    { soil: 'Any, moist but drained', warn: 'Thorns injure; gloves when pruning' },
  "Rosa 'New Dawn'":
    { soil: 'Fertile, humus-rich, moist', warn: 'Never plant into old rose soil' },
  "Rosa GERTRUDE JEKYLL ('Ausbord')":
    { soil: 'Fertile, humus-rich, moist', warn: 'Never plant into old rose soil' },
  "Rosa ICEBERG ('Korbin')":
    { soil: 'Fertile, humus-rich, moist', warn: 'Old rose soil; black spot risk' },
  "Rosa rugosa":
    { soil: 'Any, even poor and sandy', warn: 'Suckers vigorously into a thicket' },
  "Rudbeckia fulgida var. sullivantii 'Goldsturm'":
    { soil: 'Fertile, moist, drained', warn: 'Shade costs you the flowers' },
  "Salvia rosmarinus 'Miss Jessopp's Upright'":
    { soil: 'Poor, very free-draining', warn: 'Winter wet kills it, not the cold' },
  "Spiraea japonica 'Goldflame'":
    { soil: 'Any, moist but drained', warn: 'Shade dulls the foliage colour' },
  "Verbena bonariensis":
    { soil: 'Any, well-drained', warn: 'Winter wet; self-seeds everywhere' },
  "Viburnum opulus 'Roseum'":
    { soil: 'Fertile, moist, drained', warn: 'Shade reduces the flower heads' },
  "Weigela 'Bristol Ruby'":
    { soil: 'Fertile, moist, drained', warn: 'Shade costs you the flowers' },
  "Acer palmatum 'Orangeola'":
    { soil: 'Fertile, drained, acidic', warn: 'Wind and dry soil scorch the lace leaf' },
  "Paeonia lactiflora 'Tom Cat'":
    { soil: 'Deep, fertile, humus-rich', warn: "Plant the crown shallow or it won't flower" },
  'Viburnum davidii':                 { soil: 'Humus-rich, moist, drained', warn: 'Needs a male nearby for berries' },
  'Luma apiculata':                   { soil: 'Any soil, well-drained',   warn: 'Young plants need shelter from hard frost' },
  "Euonymus japonicus 'Microphyllus Albovariegatus'":
                                       { soil: 'Any soil, well-drained',   warn: 'Avoid waterlogging; shade dulls the cream' },
  "Oxalis triangularis 'Mijke'":       { soil: 'Free-draining compost',    warn: 'Avoid waterlogging; dies back when dormant' },
  "Tetrapanax papyrifer 'Rex'":        { soil: 'Fertile, humus-rich, moist', warn: 'Suckers widely; avoid winter wet' },
  'Dicksonia antarctica':              { soil: 'Humus-rich, moist, acid',    warn: 'Never let trunk or roots dry out' },
  'Rhus typhina':                      { soil: 'Any, well-drained',          warn: 'Suckers metres from the parent plant' },
  "Rodgersia 'Bronze Peacock'":        { soil: 'Deep, fertile, moist', warn: 'Dry or hot sites scorch the foliage' },
  "Rhododendron 'Homebush'":           { soil: 'Humus-rich, ericaceous',     warn: 'No chalk or lime; keep evenly moist' },
  'Rhododendron luteum':               { soil: 'Moist, ericaceous',          warn: 'No chalk; contain — do not let it seed out' },
  'Trachycarpus fortunei':             { soil: 'Fertile, well-drained',      warn: 'Shelter from wind or leaves shred' },
  'Chamaerops humilis':                { soil: 'Free-draining, fertile',     warn: 'Sharp winter drainage; spiny leaf stalks' },
  'Melianthus major':                  { soil: 'Fertile, sharply drained',   warn: 'Cold wet soil kills; mulch the crown' },
  'Astelia chathamica':                { soil: 'Humus-rich, well-drained',   warn: 'Wet crowns rot in cold winters' },
  'Fargesia rufa':                     { soil: 'Fertile, humus-rich, moist', warn: 'Clump-forming, but widens with age' },
  'Phyllostachys nigra':               { soil: 'Fertile, humus-rich, moist', warn: 'Running — needs a rhizome barrier' },
  'Arbutus unedo':                     { soil: 'Well-drained; lime OK',      warn: 'Avoid cold wet heavy ground' },
  "Tamarix ramosissima 'Pink Cascade'":{ soil: 'Any, reasonably drained',    warn: 'Not shallow chalk; needs an open site' },
  "Pieris 'Forest Flame'":             { soil: 'Humus-rich, ericaceous',     warn: 'No chalk; shelter new growth from frost' },
  "Skimmia japonica 'Rubella'":        { soil: 'Moist, acid to neutral',     warn: 'Alkaline soil and hot sun yellow it' },
  "Ceanothus 'Concha'":                { soil: 'Free-draining, any pH',      warn: 'Winter wet is the main killer' },
  "Physocarpus opulifolius 'Diabolo'": { soil: 'Any, moist, well-drained',   warn: 'Shallow chalk can cause chlorosis' },
  "Sambucus nigra f. porphyrophylla 'Eva'": { soil: 'Any ordinary garden soil', warn: 'Rich ground makes it outgrow its space' },
  "Syringa meyeri 'Palibin'":          { soil: 'Fertile; alkaline OK', warn: 'Not wet ground or poor acid soil' },
  "Daphne bholua 'Jacqueline Postill'":{ soil: 'Humus-rich, well-drained',   warn: 'Will not forgive being moved' },
  'Sarcococca confusa':                { soil: 'Humus-rich, well-drained',   warn: 'Water in while establishing in dry shade' },
  "Chaenomeles × superba 'Crimson and Gold'": { soil: 'Any, reasonably drained', warn: 'Thorny — keep clear of narrow paths' },
  "Kolkwitzia amabilis 'Pink Cloud'":  { soil: 'Any, moist, well-drained',   warn: 'Give it width; clipping ruins the habit' },
  "Deutzia gracilis 'Nikko'":          { soil: 'Any, moist, well-drained',   warn: 'Avoid waterlogging and dry poor soil' },
  "Ribes sanguineum 'King Edward VII'":{ soil: 'Any, reasonably drained',    warn: 'Pungent foliage when handled' },
  "Aucuba japonica 'Crotonifolia'":    { soil: 'Any, reasonably drained',    warn: 'Direct sun scorches the leaves' },
  "Kalmia latifolia 'Ostbo Red'":      { soil: 'Humus-rich, ericaceous',     warn: 'Strictly lime-hating; roots resent moving' },
  'Enkianthus campanulatus':           { soil: 'Humus-rich, acid-neutral',   warn: 'Avoid chalk and prolonged drought' },
  'Fothergilla major':                 { soil: 'Humus-rich, acid-neutral',   warn: 'Avoid chalk and prolonged drought' },
  "Betula utilis subsp. jacquemontii 'Doorenbos'": { soil: 'Fertile, moist, drained', warn: 'Not for drought or standing water' },
  'Amelanchier lamarckii':             { soil: 'Moist, acid to neutral',     warn: 'Avoid shallow chalk and drought' },
  'Parrotia persica':                  { soil: 'Any drained; lime OK',       warn: 'Allow real width — it spreads broadly' },
  "Nyssa sylvatica 'Wisley Bonfire'":  { soil: 'Moist, acid to neutral',     warn: 'Lime intolerant; no chalk, no drought' },
  'Acer griseum':                      { soil: 'Fertile, moist, drained',    warn: 'Avoid drought and waterlogging' },
  "Corylus avellana 'Contorta'":       { soil: 'Any, reasonably drained',    warn: 'If grafted, pull straight suckers early' },
  "Malus 'John Downie'":               { soil: 'Fertile, moist, drained',    warn: 'Avoid waterlogging and starved soil' },
  'Koelreuteria paniculata':           { soil: 'Well-drained, any pH',       warn: 'Cold shade spoils flower and seed set' },
  "Gleditsia triacanthos f. inermis 'Sunburst'": { soil: 'Any well-drained soil', warn: 'A full tree — not a container plant' },
  "Eucalyptus gunnii Azura ('Cagire')":{ soil: 'Fertile, drained, any pH',   warn: 'Still woody and large if left unpruned' },
  'Wisteria floribunda f. multijuga':  { soil: 'Fertile, moist, drained',    warn: 'Needs a genuinely permanent support' },
  'Trachelospermum jasminoides':       { soil: 'Humus-rich, free-draining',  warn: 'Cold exposure and winter wet set it back' },
  "Hedera colchica 'Sulphur Heart'":   { soil: 'Any fertile, drained soil',  warn: 'Keep off gutters, roofs and soft mortar' },
  'Akebia quinata':                    { soil: 'Any fertile, moist soil',    warn: 'Will swamp small shrubs and weak trellis' },
  "Lonicera periclymenum 'Serotina'":  { soil: 'Humus-rich, moist, any pH',  warn: 'Not for dry starved soil; needs support' },
  "Geranium Rozanne ('Gerwat')":       { soil: 'Any fertile, drained soil',  warn: 'Rich soil or shade makes it sprawl' },
  "Erysimum 'Bowles's Mauve'":         { soil: 'Well-drained, lean',         warn: 'Wet winter soil shortens its life' },
  "Nepeta racemosa 'Walker's Low'":    { soil: 'Well-drained, lean',         warn: 'Rich wet soil makes it flop' },
  "Helleborus (Rodney Davey Marbled Group) Anna's Red ('Abcrd02')": { soil: 'Fertile, moist, drained', warn: 'No winter standing water at the crown' },
  "Hakonechloa macra 'Aureola'":       { soil: 'Humus-rich, moist',          warn: 'Emerges very late — do not dig it up' },

  /* --- 2026-09-14 batch: data/incoming/new-plant-builds-2026-09-14.json --- */
  "Mentha × piperita f. citrata 'Chocolate'":
    { soil: 'Fertile, moist, drained', warn: 'Runners take over; confine it to a pot' },
  "Salvia officinalis 'Tricolor'":
    { soil: 'Any, free-draining', warn: 'Winter wet kills it, not the cold' },
  "Origanum vulgare 'Compactum'":
    { soil: 'Well-drained, alkaline', warn: 'Rots where the ground stays wet' },
  "Monarda didyma":
    { soil: 'Fertile, moist, drained', warn: 'Dry roots in summer bring mildew' },
  /* warn reworded 2026-09-14 when Oscar re-researched this card: the new text
     names WHY it must not bake dry — drought stress is what brings the mildew on,
     and mildew resistance is this cultivar's whole selling point. */
  "Monarda didyma 'Balbeemav'":
    { soil: 'Humus-rich, moist, drained', warn: 'Drought brings mildew; no winter wet' },
  "Cornus sericea 'Flaviramea'":
    { soil: 'Any, moist but drained', warn: 'Young stems carry the winter colour' },
  "Weigela 'Red Prince'":
    { soil: 'Fertile, moist, drained', warn: 'Bone-dry or boggy soil costs you flowers' },
  "Chrysanthemum × morifolium Garden Mum Group":
    { soil: 'Fertile, moist, drained', warn: 'Winter hardiness varies by cultivar' },
  "Skimmia japonica 'Mystic Marlot'":
    { soil: 'Humus-rich, moist, acidic', warn: 'Dry lime yellows it; strong sun scorches' },
  "Gaultheria procumbens 'Gaubi'":
    { soil: 'Humus-rich, acid, drained', warn: 'Lime kills it; ericaceous compost in pots' },
  "Solanum pseudocapsicum":
    { soil: 'Loam-based, fertile, moist', warn: 'Frost kills it; keep it under glass' },
  "Digitalis purpurea Foxy Group":
    { soil: 'Any, moist but drained', warn: 'Avoid ground that stays waterlogged' },
  "Zantedeschia aethiopica":
    { soil: 'Fertile, reliably moist', warn: 'Protect the crown in a cold garden' },
  "Cyclamen persicum":
    { soil: 'Humus-rich, free-draining', warn: 'Frost, dry air and a wet crown kill it' },
  "Chamaecyparis pisifera 'Baby Blue'":
    { soil: 'Moist but drained, acidic', warn: 'Chalk and standing water both check it' },
  "Olearia × haastii":
    { soil: 'Any soil, well-drained', warn: 'Waterlogging and hard inland frost' },
  "Helichrysum petiolare":
    { soil: 'Any, moist but drained', warn: 'Needs sharp drainage and frost shelter' },
  "Dianthus 'Kledg12163'":
    { soil: 'Well-drained, alkaline', warn: 'Heavy winter wet rots the crown' },
  "Gaultheria mucronata":
    { soil: 'Moist but drained, acidic', warn: 'No lime; females need a male to berry' },
  "Pentas lanceolata Starcluster Mix":
    { soil: 'Fertile, moist, drained', warn: 'Frost kills it; lift or bin in autumn' },
  "Primula polyanthus":
    { soil: 'Humus-rich, moist, drained', warn: 'Hates baking dry and standing water' },
  "Viola Babyface Series 'White'":
    { soil: 'Fertile, humus-rich, moist', warn: 'Heat stops it; wet winter soil rots it' },
  "Dianthus barbatus":
    { soil: 'Well-drained, alkaline', warn: 'Waterlogged winter ground rots it' },
  "Calluna vulgaris 'Zilly'":
    { soil: 'Acid, humus-rich, drained', warn: 'Lime-hating; use ericaceous compost' },
  "Hylotelephium ewersii var. homophyllum 'Rosenteppich'":
    { soil: 'Well-drained, alkaline', warn: 'Damp heavy ground rots the crown' },
  "Aster 'Alpha Light Purple'":
    { soil: 'Fertile, moist, drained', warn: 'Avoid ground that stays wet for long' },
  "Garrya elliptica 'James Roof'":
    { soil: 'Any soil, well-drained', warn: 'Cold inland wind scorches the leaves' },
  "Deutzia × hybrida 'Mont Rose'":
    { soil: 'Fertile, moist, drained', warn: 'Deep shade and wet feet both cost you' },
  "Chimonanthus praecox":
    { soil: 'Any, moist but drained', warn: 'Needs a warm sheltered wall to flower' },
  "Heptacodium miconioides":
    { soil: 'Fertile, moist, drained', warn: 'Warmth and shelter bring the best bark' },
  "Pinus mugo 'Palmeter'":
    { soil: 'Any, free-draining sandy', warn: 'Waterlogging kills it; open sun for tips' },
};

/* Entries deliberately NOT built, with the reason. An excluded plant is not a
   silent drop: the batch file still holds its research, and the reason is
   printed so it can be re-researched rather than forgotten. */
const EXCLUDE = {
  "Malus 'Evereste'": "wishlist entry 37 is Malus 'John Downie', not 'Evereste'. The supplied " +
    "research is specific to 'Evereste' (yellow-orange fruit, pitched on pollination); " +
    "'John Downie' has larger conical orange-red fruit and is pitched on jelly. " +
    "Relabelling one as the other would put wrong facts on the card. Needs a re-research.",
};

/* Compass facing derived from the sun band. The card draws a compass, so a
   light level here renders nothing useful. A facing stated in the research
   overrides this. */
function deriveFacing(sunNeed) {
  if (sunNeed >= 90) return 'South / West';
  if (sunNeed >= 60) return 'East / South / West';
  if (sunNeed >= 40) return 'East / West';
  return 'North / East';
}
const STATED = {
  "Ceanothus 'Concha'": 'South / West',
  'Trachelospermum jasminoides': 'South / West',
  'Wisteria floribunda f. multijuga': 'South / West',
  "Aucuba japonica 'Crotonifolia'": 'North / East',
};
/* Point 2 above says a facing the research actually stated wins over the
   derivation. Until 2026-09-14 that was only true of the four latins hand-typed
   into STATED: every other incoming `aspect` was thrown away and replaced by
   deriveFacing(sunNeed), stated facing or not. Allium stipitatum arrived saying
   "East / South / West" and was filed as "South / West" — sunNeed 95 rounding a
   researched answer off the card without anyone being asked.
   So read it. A COMPASS FACING is compass words joined by / or , (plus the
   deck's own "Any aspect"); prose is not, and "Full sun" is a light level, not a
   facing, so both still fall through to the derivation as before. */
const COMPASS = /^(north|south|east|west)(-?(east|west))?$/i;
function statedFacing(aspect) {
  const t = String(aspect || '').trim();
  if (!t) return null;
  if (/^any aspect$/i.test(t)) return 'Any aspect';
  const parts = t.split(/\s*[/,]\s*/).filter(Boolean);
  if (!parts.length || !parts.every(w => COMPASS.test(w))) return null;
  return parts.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' / ');
}

/* Budgets from what the deck already carries, not invented. Trimming happens on
   sentence boundaries so a card never shows a clipped clause. The first sentence
   is always kept even if it alone exceeds the budget. */
const BUDGET = { visual: 190, water: 120, prune: 165, resilience: 165, uses: 150 };

function trimSentences(text, budget) {
  if (!text || text.length <= budget) return text || '';
  const parts = text.match(/[^.]+\.\s*/g);
  if (!parts) return text;
  let out = parts[0].trim();
  for (let i = 1; i < parts.length; i++) {
    const next = (out + ' ' + parts[i].trim()).trim();
    if (next.length > budget) break;
    out = next;
  }
  return out;
}

/* "4-8m" + "2.5-4m" -> "4-8m H × 2.5-4m W". Both rails read this one string, so
   a card missing either half renders blank rails (see VERIFY-QUEUE item 1). */
function makeSize(height, spread) {
  if (!height || !spread) return '';
  return `${height} H × ${spread} W`;
}

function fitCard(p) {
  const problems = [];
  /* A batch researched straight into the card's budgets is already pre-fitted:
     its own soil/soilWarning ARE the short forms the FIT table exists to supply,
     so use them rather than demanding a duplicate entry here. The length
     assertions below still apply, so a "pre-fitted" batch that is actually over
     budget is rejected exactly as a bad FIT entry would be. */
  const fit = FIT[p.latin] ||
    (p.soil && p.soilWarning ? { soil: p.soil, warn: p.soilWarning } : null);
  if (!fit) { problems.push(`no FIT entry for ${p.latin}, and it supplies no soil/soilWarning of its own`); return { problems }; }
  if (fit.soil.length > 26) problems.push(`${p.latin}: soil ${fit.soil.length}>26`);
  if (fit.warn.length > 44) problems.push(`${p.latin}: warn ${fit.warn.length}>44`);
  const size = makeSize(p.height, p.spread);
  if (!size) problems.push(`${p.latin}: missing height or spread`);

  const card = {
    common: p.common,
    latin: p.latin,
    hue: p.hue,
    visual: trimSentences(p.visual, BUDGET.visual),
    water: trimSentences(p.water, BUDGET.water),
    aspect: fit.face || STATED[p.latin] || statedFacing(p.aspect) || deriveFacing(p.sunNeed),
    soil: `${fit.soil}; ${fit.warn}`,
    prune: trimSentences(p.prune, BUDGET.prune),
    /* The commercial block, empty. It is never researched — tools/check-plant-json.js
       REFUSES a JSON that fills any of it, because those figures come from Oscar and
       nowhere else. But the keys still have to EXIST: tests/app-test.js asserts that
       every card in PLANTS carries all 25 required field names, and add-plant.js has
       always written them as "". A card built here without them passes every check
       while it sits in PLANTS_ON_HOLD and fails app-test the moment it is dealt —
       which is exactly how it was found, on Abelia Sparkling Silver, 2026-09-13. */
    source: "", order: "", bench: "", root: "", trade: "", retail: "",
    margin: "", type: "", shrink: "", returnRisk: "", pots: "",
    peak: p.peak,
    cvs: p.cvs || '',
    hardiness: p.hardiness,
    resilience: trimSentences(p.resilience, BUDGET.resilience),
    uses: trimSentences(p.uses, BUDGET.uses),
    size,
    growthSpeed: p.growthSpeed,
    pestRisk: p.pestRisk,
    thirst: p.thirst,
    careLevel: p.careLevel,
    sunNeed: p.sunNeed,
    sunMin: p.sunMin,
  };
  /* toxicity, compliance and hardinessNote became card fields in Aug 2026 (see
     FIELDS in tools/plant-data.js), and foliage on 2026-09-13. The header above
     still said the card could not carry them; it can, and dropping researched
     safety text on the floor is not a mapping decision worth keeping. Blank
     stays absent, not empty. */
  for (const k of ['toxicity', 'compliance', 'hardinessNote', 'foliage']) {
    if (p[k] != null && String(p[k]).trim()) card[k] = p[k];
  }
  return { card, problems };
}

function fitBatch(batch) {
  const cards = [], problems = [], excluded = [];
  for (const p of batch) {
    if (EXCLUDE[p.latin]) { excluded.push({ latin: p.latin, reason: EXCLUDE[p.latin] }); continue; }
    const r = fitCard(p);
    problems.push(...r.problems);
    if (r.card) cards.push(r.card);
  }
  return { cards, problems, excluded };
}

module.exports = { fitBatch, fitCard, FIT, EXCLUDE, BUDGET, trimSentences, makeSize, deriveFacing };

if (require.main === module) {
  const path = require('path');
  const file = process.argv[2];
  if (!file) { console.error('usage: node tools/fit-incoming.js <batch.json> [--json]'); process.exit(2); }
  const batch = require(path.resolve(file));
  const { cards, problems, excluded } = fitBatch(batch);
  if (process.argv.includes('--json')) { console.log(JSON.stringify(cards, null, 2)); process.exit(problems.length ? 1 : 0); }
  console.log(`fitted ${cards.length} of ${batch.length} cards`);
  for (const c of cards) {
    console.log(`\n${c.latin}`);
    console.log(`  aspect ${c.aspect}`);
    console.log(`  soil   ${c.soil}  (${c.soil.length})`);
    console.log(`  size   ${c.size}`);
  }
  if (problems.length) { console.log('\nPROBLEMS:'); problems.forEach(p => console.log('  ' + p)); process.exit(1); }
  console.log('\nno problems');
}
