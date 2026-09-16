# Timber — Toxicity Research Brief

<!-- Do not paste this file by hand with a list copied from somewhere else.
     `node tools/backfill-field.js toxicity --paste --one > TOXICITY-ASK.md`
     prints this brief VERBATIM with the current plant list appended, as one
     file. The list is read from timber.html at that moment, so it cannot be
     stale and cannot miss a card added since. -->

You are researching the **toxicity** of plants sold in a UK garden centre, for
**Timber**, a card app that garden-centre staff read out to customers. Each
answer you give will be printed **verbatim** on a card under a red hazard rule
and repeated to a person buying a plant for a house with children or pets. That
is the standard: nothing you write may be a guess.

Return **one JSON array**, one object per plant, in exactly the schema below.

---

## THE RULES — read before anything else

1. **Never invent.** If you cannot find a specific, citable statement about
   this plant's toxicity, return `"toxicity": ""` and say why in `uncertain`.
   A blank is correct. A plausible guess reaches a customer.
2. **UK sources first, in this order.** (a) the RHS plant profile's
   "Potentially harmful" line, (b) the HTA *Potentially Harmful Plants* code of
   practice category (A / B / C), (c) Kew / Poisons Information Service /
   veterinary-poison references for pets. Name which one you used, per plant,
   in `sources`. If they disagree, print the **more cautious** wording and note
   the disagreement.
3. **Say what part, what route, and who.** "Toxic" alone is useless to a
   customer. The card needs: which part (sap, berries, bulbs, all parts, hairs,
   spines); by which route (eaten, skin contact, eyes, inhaled); and to whom
   (people, dogs, cats, livestock) *when the source says so*. Do not add a
   species of animal the source does not mention.
4. **A note is not always a hazard, and you must not force it to be.** Some
   plants carry an *edibility* note ("ripe berries are edible") or a sourced
   *all-clear*. Write those honestly. Do not write "may be harmful" to sound
   safe — an unsupported hedge is still an invention.
5. **Do not mix in legal status.** Schedule 9, sale bans, plant-passport duties
   go in a different field this brief does not cover. Toxicity only.
6. **Do not paraphrase a source into something stronger or weaker.** "Harmful
   if eaten" and "Highly toxic" are different tiers on the card and are chosen
   by the exact words you return. Use the source's own strength word.

---

## THE STYLE — how each line must read

The line is spoken aloud across a counter. Keep it to **one or two short
sentences, under ~140 characters**, plain English, no Latin, no hedging
filler. Lead with the hazard, then the part, then the practical instruction.

Good, in the deck's own voice:

- `Harmful if eaten · skin and eye irritant`
- `Bulbs not to be eaten · highly toxic to cats if eaten`
- `Milky sap can irritate skin and the plant should not be eaten.`
- `All parts are harmful if eaten, with the berries particularly dangerous. Sap may also irritate skin.`
- `Fine hairs on young growth may irritate skin, eyes or airways in sensitive people; gloves are sensible when handling.`
- `Sap is a severe irritant — burns skin, and eye contact is an A&E matter. Wear gloves and eye protection when cutting.`
- `Ripe berries are edible and are also readily taken by birds.`
- `No known hazard to humans is reported by Kew.`

Bad:

- `May be toxic.` — no part, no route, no source.
- `Generally considered safe.` — "generally" is a hedge, and a card cannot say safe without a source.
- `Contains grayanotoxins that inhibit sodium channels…` — true, and useless at a till.

---

## OUTPUT — one JSON array, exactly these keys per plant

```json
[
  {
    "latin": "exactly the name I gave you, unchanged",
    "toxicity": "the line as it will print — or \"\" if unsourced",
    "parts": "all parts | sap | berries | fruit | bulbs | seeds | leaves | roots | hairs | spines | \"\"",
    "route": "eaten | skin | eyes | inhaled | mechanical | \"\" (list more than one with ' · ')",
    "affects": "people | dogs | cats | rabbits | rodents | poultry | horses | livestock | pets | \"\" (only what the source states; 'pets' where the source is general)",
    "rhsWording": "the RHS 'Potentially harmful' text verbatim, or \"\" if the profile carries none",
    "htaCategory": "A | B | C | \"\"",
    "sources": ["name each source actually consulted for THIS plant"],
    "uncertain": ["anything left blank, hedged, or where sources disagree — and why"]
  }
]
```

### Field rules that matter

- **`toxicity` is the only field the card prints.** The rest exist so the
  person checking your work can see where each line came from. A line with an
  empty `sources` array will be rejected.
- **`rhsWording` must be verbatim** or empty. It is the anchor the card's tier
  is checked against. If you did not open the RHS profile, leave it empty and
  say so.
- **Cultivars inherit the species unless a source says otherwise.** If I give
  you *Pieris japonica* 'Mountain Fire' and only the species is documented,
  use the species and note that in `uncertain`.
- **Trade names.** A plant given as `Geranium Rozanne ('Gerwat')` is the
  cultivar 'Gerwat'. Research the plant, not the marketing name.
- **Ornamental fruit** on a plant that is not otherwise documented as toxic
  gets `Fruit ornamental · not to be eaten` only if a source says the fruit
  should not be eaten. Otherwise blank.
- **Do not blank a field because the list looks short.** `parts` and `affects`
  are lists of the values seen so far, not a closed set — 2026-09-16 returned
  three plants with `parts: ""` because "fruit" was not listed, and two with the
  poultry / rabbit / rodent detail dropped from `affects` for the same reason,
  while the sources named all of them. If the source names something the list
  does not, **write what the source says** and note it in `uncertain`. Only
  `toxicity` is printed on the card; these fields exist so a human can check
  where the line came from, and a dropped detail is lost evidence.

---

## HOW THE CARD WILL USE WHAT YOU RETURN

The card tiers your line by its **strongest word** (this is how it decides the
colour of the corner flag and the plaque, and it is why rule 6 matters):

| your words include | card shows |
|---|---|
| highly toxic · particularly dangerous · fatal · deadly | **Highly toxic** (red) |
| toxic · poison · harmful · not to be eaten · do not eat | **Toxic** (orange) |
| irritant · sap · allergen · spines · sharp · hairs · gloves | **Handle with care** (amber) |
| edible · cooked for · for preserves | **Edible parts** (no flag) |
| no known hazard | **No known hazard** (no flag) |

A blank prints **nothing** — not "safe", nothing. So a blank is always better
than a hedge.

---

## THE PLANT LIST

I will paste the list after this brief: one latin name per line, exactly as
the card carries it. Return them in the same order, `latin` unchanged. If a
name is ambiguous (a genus with no species, a trade name you cannot resolve),
research the most likely plant, and put the ambiguity in `uncertain`.

Work in batches of no more than 25 plants per reply so nothing gets truncated,
and tell me which batch you are on.
