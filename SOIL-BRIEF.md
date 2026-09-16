# Timber — Soil Research Brief

<!-- Do not paste this file by hand with a list copied from somewhere else.
     `node tools/backfill-field.js wet --paste --one > SOIL-ASK.md`
     prints this brief VERBATIM with the current plant list appended, as one
     file. The list is read from timber.html at that moment, so it cannot be
     stale and cannot miss a card added since. -->

You are answering **four soil questions** about plants sold in a UK garden
centre, for **Timber**, a card app garden-centre staff use on the shop floor.
These answers become **filters**: a customer says *"I've got a boggy corner
that never gets sun"* and the staff member taps a chip. So a wrong `yes` does
not read as a wrong word on a card — it sends someone home with a plant that
dies in their garden.

Return **one JSON array**, one object per plant, in exactly the schema below.

---

## WHY THESE ARE COLUMNS AND NOT A KEYWORD SEARCH

Timber already stores a `soil` line per card — prose about texture and drainage.
It cannot answer these questions, and this was measured rather than assumed.
Across all 432 cards, matching "wet" against that prose returns **113 cards**.
Stripping the negations still leaves 18, and **eight of those eighteen say the
plant dies in wet ground**:

- Heuchera 'Paris' — *"Wet soil rots the crown"*
- Melianthus major — *"Cold wet ground is what kills it"*
- Nepeta 'Walker's Low' — *"Rich wet ground makes it flop"*
- Dianthus barbatus — *"Waterlogged winter ground rots it"*

Those are **consequences, not negations**, so no amount of clever matching finds
them. That is why you are being asked directly, and why a blank from you is far
better than a guess.

---

## THE RULES — read before anything else

1. **Never invent.** No sourced statement → return `""` for that field and say
   why in `uncertain`. A blank chip is honest; a wrong `yes` is a dead plant.
2. **UK sources.** RHS plant profile first (its "Soil" / "Moisture" / "pH" lines
   are the direct answer), then Kew, then a reputable UK nursery listing. Name
   what you used per plant in `sources`.
3. **Answer for a plant in the GROUND in a UK garden**, not in a pot and not
   under glass. "It is fine in a container of ericaceous compost" is not an
   answer to `acid`.
4. **`yes` means it will grow acceptably there** — not that it is optimal, and
   not that it merely survives. If the honest answer is "it tolerates it but
   sulks", that is a `no` with a note in `uncertain`.
5. **Cultivars inherit the species** unless a source says otherwise. Say so in
   `uncertain` when you have done that.
6. **Do not reason from the other fields.** Drought tolerance does not make a
   plant a sand plant, and a high thirst rating does not make it a bog plant.
   Many thirsty plants rot in ground that actually stays wet.

---

## THE FOUR QUESTIONS

### `sand` — `"yes"` | `"no"` | `""`
Will it grow acceptably in a **light, sharply drained sandy soil**? This is the
dry, hungry, free-draining garden, not merely "well-drained". Mediterranean
shrubs, most silver foliage and most grasses are a clear yes.

### `clay` — `"yes"` | `"no"` | `""`
Will it grow acceptably on **heavy clay** — ground that is sticky and slow to
drain in winter and bakes hard in summer? This is the single most asked soil
question in a UK garden centre. Note that tolerating clay that has been improved
is not the same as tolerating clay; answer for the clay as found.

### `wet` — `"yes"` | `"no"` | `""`
Will it take ground that is **reliably wet or slow to drain** — a bog margin, a
damp corner, heavy ground that sits wet through winter? **This is the one that
matters most and the one the prose gets backwards.** Be strict: the bar is
"thrives in ground that stays wet", not "likes moisture". A plant that wants
"moist but well-drained" is a `no` here — that phrase means the opposite of
this question. Say so in `uncertain` when you answer `no` for that reason,
because it will come up constantly.

### `ph` — `"acid"` | `"alkaline"` | `"any"` | `""`
- `acid` — genuinely needs acid / ericaceous conditions and will show chlorosis
  on lime. Rhododendron, Camellia, Pieris, most Ericaceae.
- `alkaline` — genuinely happy on chalk and shallow alkaline soil, and named as
  such by a source.
- `any` — **a real answer and the most common one.** Most shrubs do not mind.
  Use it when a source says "any pH" or lists no pH preference at all while
  describing soil. It is NOT the same as blank.
- `""` — you could not establish it.

A plant that is fine on both acid and alkaline is `any`, not two answers.

---

## OUTPUT — one JSON array, exactly these keys per plant

```json
[
  {
    "latin": "exactly the name I gave you, unchanged",
    "sand": "yes | no | \"\"",
    "clay": "yes | no | \"\"",
    "wet": "yes | no | \"\"",
    "ph": "acid | alkaline | any | \"\"",
    "sourceLine": "the source's own soil/moisture/pH wording, verbatim, or \"\"",
    "sources": ["name each source actually consulted for THIS plant"],
    "uncertain": ["anything left blank, anything inherited from the species, and every case where the source says 'moist but well-drained' and you therefore answered wet: no"]
  }
]
```

- **`sourceLine` must be verbatim** or empty. It is what a human checks your
  four answers against, and four one-word answers with nothing behind them
  cannot be reviewed at all.
- An entry with an empty `sources` array will be rejected.
- Copy each latin name **exactly** as given, including any curly apostrophe or
  × sign — it is the only thing the importer matches on, so a retyped name
  silently fails to apply.

---

## HOW THE ANSWERS ARE USED

Each becomes a filter chip in the app's **🪨 Soil** group: *Sandy ·
free-draining*, *Heavy clay*, *Boggy · wet ground*, *Damp shade*, *Acid ·
ericaceous*, *Alkaline · chalk*. "Damp shade" is `wet: yes` combined with the
light data already on the card, which is why `wet` carries more weight than the
other three — it is the only one feeding two chips.

A chip shows its own count and is greyed out at zero, so a field you leave blank
costs nothing and misleads nobody. That is the trade this brief is built around.

---

## THE PLANT LIST

I will paste the list after this brief: one latin name per line, exactly as the
card carries it. Return them in the same order, `latin` unchanged. If a name is
ambiguous (a genus with no species, a trade name you cannot resolve), research
the most likely plant and put the ambiguity in `uncertain`.

Work in batches of no more than 25 plants per reply so nothing gets truncated,
and tell me which batch you are on.
