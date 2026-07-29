# Next-brick ledger

## timber  [active]
brick: Re-source the Ajuga 'Burgundy Glow' photo — it is the only card below the
  1200px standard (680x415, cropped from AI artwork, cultivar unverifiable) and the
  last known data-quality defect in the 47-card deck.
since: 2026-07-28  sessions-unchanged: 1
progress: 2026-07-29 — customer-view empty-field fix. The portfolio batch left 44/47
  plants with retail:"" and up to 20 with empty water/prune/uses/cvs text; the
  customer view rendered every one as a bare label — worst case an empty gold PRICE
  box on the screen meant to be handed to a customer. Now a fact with no value (and
  the price box with no price) is dropped, never invented; the "Bench · Root" cells
  on both trade sheets stop printing a stray "·" when both halves are empty. Two new
  app-test checks lock it in (96 total). All five suites green; standalone rebuilt
  (3.74MB, 47 cards, zero external requests) and republished to the existing artifact
  URL. The Ajuga-photo brick was ATTEMPTED and is blocked from this session's
  environment: the agent proxy denies CONNECT to commons.wikimedia.org (policy), so
  plant-images-tool.js cannot reach the Commons API here. Needs either a network
  policy that allows wikimedia.org or a photo supplied by hand.
progress: 2026-07-28 — **repository separated.** The Command Centre dashboard moved
  out to its own repo (Plantatron); Timber is now only the customer-facing swipe-card
  app. **Deck consolidated**: the flower-tower branch merged in, resolving the split
  between the two lines. No plant data was recovered because none was missing — main
  already held all 46 of flower-tower's cards plus Winged Spindle. What came back were
  the 1200px photo originals that the published-artifact round-trip had downgraded to
  800px re-encodes, plus 16 -cutout.png source assets, CORRECTION-PROTOCOL.md and
  design/audit-layout.js. Deck 47, photos all at 1200px except the Ajuga. All five
  suites green; standalone build verified at 3.7MB, opening offline from file:// with
  zero external requests. Fixed two test defects found on the way: a duplicate NPLANTS
  declaration the merge introduced silently, and a hardcoded absolute path in
  sw-update-test.js that made it fail from any checkout other than /home/user/Timber.
progress: 2026-07-25 — deck now 17: Cornus, Ajuga, Spiraea, Potentilla, Cercis, Prunus, Salvia, Mahonia (photo staged), Leycesteria, Buddleja Pugster Orchid, Flamingo Willow, Cape Leadwort, Golden Japanese Spindle (cutouts composited), Bubblegum Blast Bee Balm, Common Hornbeam, Ebbinge's Silverberry, Gunnera, October Glory Red Maple, Spider's Web Fatsia, Griselinia, Himalayan Indigo 'Silk Road', Cascading Moth Orchid, Laurustinus 'Eve Price', Orange Victory Itoh Peony, French Lavender 'Anouk', Meyer's Lemon, Green Spire Spindle, Jenny Japanese Holly, Gold Rider Leyland Cypress, Horizon Monarch Rhododendron, Ōsakazuki Japanese Maple, Musa basjoo, Wedding Cake Tree, Common Olive, Bloodgood Japanese Maple, Hot Lips Sage, Honey Tulip Magnolia, Big Blue Sea Holly, Winter Beauty Honeysuckle (real photos + cutouts). Deck 46. Lonicera on gradient fallback — both supplied photos unusable (water lily + cat-blocked); needs a winter flower shot. First populated toxicity field (Lonicera fruit). Eryngium is the FIRST populated compliance field (PBR) — surfaced on the back; three compliance cards now (Gunnera ban, Olive Xylella, Eryngium PBR). Tiered compliance display is the clear next brick. Hot Lips JSON is first with the new toxicity+compliance fields (empty, captured but not yet rendered — the hook for the compliance ribbon). Firsts: houseplant/H1b, edible/citrus, cultivar pair, conifer/nothogenus, macron-name slug fold, single-facing aspect. TWO biosecurity/compliance cards now (Gunnera legal ban + Olive Xylella) — parked compliance-ribbon decision increasingly worth doing. NEW: Gunnera carried a compliance/legal block (UK-restricted) — surfaced on the trade back; OPEN DECISION on a front compliance banner (see protocol v12.21). New audit rule (focus-photo) catches id-vs-latin-slug drift after the Euonymus shipped blank. Recurring: JSON soil warnings keep carrying pruning/toxicity — worth a source-prompt fix. 2026-07-24 — portfolio batch DONE: Cornus, Ajuga, Spiraea, Potentilla added + Nandina photo & ratings (deck 11, all with photos). Layout correction pass done: audit gate live (CORRECTION-PROTOCOL.md), 31+4 violations fixed incl. blurred-labels + photo pointer-events bug. Pending: sync card-builder.html to fixed band/plaque; Nandina data conflicts need Oscar's call (aspect E/W vs S/W, bloom Jun-Jul vs Sep-Feb, soil warning).

## garden-centre-bot  [parked]
brick: (not set — pick up from skill notes when resumed)
since: 2026-07-20  sessions-unchanged: 0
