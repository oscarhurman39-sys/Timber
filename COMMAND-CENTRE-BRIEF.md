# Command Centre — framework build brief

Paste-ready brief for a general model (ChatGPT / Gemini / Claude) to produce the **first
framework** of Timber Command Centre — the manager-and-shop-floor layer that sits on top of
the swipe deck.

This asks for a skeleton that runs, not a finished product. Scope is deliberate: **Customer
Match** built to depth, and each of the other five sections carrying exactly one complete
working loop. Thin is allowed; static is not. A section that can't be *used* is scenery.

The framework's job is to prove one commercially meaningful story end to end — not that six
navigation buttons exist.

Output lands at `command-centre/command-centre.html` — same zero-build philosophy as
`timber.html`, so it opens from the filesystem and works on a phone.

---

## Paste everything below this line

---

Build the first working framework of a single-page web app called **Timber Command Centre** —
sales, learning and plant-intelligence software for UK garden centres.

### Hard technical constraints

- **One self-contained `.html` file.** React 18 + ReactDOM + Babel standalone from CDN
  `<script>` tags. No build step, no npm, no bundler, no TypeScript, no router library,
  no chart library, no UI kit. It must run by double-clicking the file.
- All state in memory (`useState`/`useReducer`). No backend, no `fetch`, no localStorage.
- Plain CSS in one `<style>` block using CSS custom properties for the palette. No Tailwind
  CDN, no CSS-in-JS.
- Target ~1,200–1,800 lines. If you approach your output limit, **stop at a clean component
  boundary and list exactly what remains** — do not truncate mid-function or emit
  placeholder comments like `// ... rest of plants`.

### What the product does

A member of shop-floor staff has a customer in front of them asking for "something evergreen
for that awkward shady corner." Timber gets them from that sentence to a confident, safe,
**in-stock** recommendation in under a minute — and turns every one of those conversations
into buying intelligence for the manager.

The loop the whole interface serves:

**OBSERVE → IDENTIFY → RECOMMEND → ACT OR APPROVE → MEASURE**

Every number on screen must be attached to an action, a record, or a workflow. If a metric
leads nowhere, cut it. This is not an analytics wall.

**The acceptance test.** When you are finished, a user must be able to walk this entire path
without hitting a dead control, and the app must be visibly different at the end than it was
at the start:

1. A customer describes an awkward garden position.
2. Timber recommends plants that are genuinely in stock.
3. The employee sees the compromises and explains them.
4. The customer accepts some picks and rejects others, with reasons.
5. Timber records the outcome as a session.
6. Management sees what to stock next and what staff need to learn.

If step 6 doesn't move because of step 4, the framework has failed regardless of how it looks.

### Data model — use this exact schema

Seed a `PLANTS` array with **24 realistic UK garden-centre plants**. Each object:

```js
{
  id: 'acer-palmatum-bloodgood',        // slug: lowercase, hyphenated, from latin
  common: 'Japanese Maple',
  latin: "Acer palmatum 'Bloodgood'",
  tradeName: null,                       // e.g. 'BIG BLUE' where the cultivar is sold under one
  foliage: 'deciduous',                  // evergreen | semi-evergreen | deciduous
  hardiness: 'H6',                       // H1a H1b H1c H2 H3 H4 H5 H6 H7 only
  sunNeed: 60,                           // 0-100, preferred light
  sunMin: 35,                            // 0-100, minimum tolerated. NEVER above sunNeed
  aspect: 'Any aspect',                  // facing/shelter ONLY. Never a light level.
  soil: 'Moist, well-drained',
  soilWarning: 'Dislikes chalk',         // adds a CONSTRAINT. Never repeats soil. May be null.
  thirst: 12,                            // 0-20 integer
  careLevel: 8,                          // 0-20 integer
  growthSpeed: 6,                        // 0-20 integer
  pestRisk: 5,                           // 0-20 integer
  heightM: 4.0, spreadM: 3.5,            // ultimate, metres
  container: 'with care',                // yes | with care | no
  peak: 'Sep-Nov',                       // Mon-Mon, parseable. Season of interest.
  prune: 'Light shaping only, late winter',   // its own field
  toxicity: null,                        // its own field. null = no known concern.
  compliance: null,                      // UK biosecurity/plant-passport notes. Its own field.
  uses: ['Specimen', 'Courtyard'],
  stock: 14, potSize: '10L', priceGBP: 64.99, bench: 'Bench D3',
  confidence: 'verified',                // verified | probable | unverified
  uncertainty: [],                       // array of open research questions, plain strings
  mastery: 0.72,                         // 0-1, share of staff who can recommend it
  demand30d: 18                          // customer requests in last 30 days
}
```

Schema rules that are **errors**, not preferences:

- `sunMin` must never exceed `sunNeed`.
- `aspect` holds facing and shelter only — "shade", "full sun", "partial shade" belong in
  `sunNeed`/`sunMin`. Use `'Any aspect'` when there's no constraint.
- `soilWarning`, `prune`, `toxicity` and `compliance` are four separate fields and must never
  be merged, concatenated or rendered as one blob.
- `soilWarning` must add a constraint, not restate `soil`.
- Ratings are integers: `thirst`/`careLevel`/`growthSpeed`/`pestRisk` on 0–20;
  `sunNeed`/`sunMin` on 0–100.
- `hardiness` must be one of the nine RHS bands listed.

**Do not silently invent horticultural facts.** Where you are not confident about a real
cultivar, set `confidence: 'probable'` or `'unverified'` and put the open question in
`uncertainty`. A blank or flagged field is honest; a confident wrong one reaches a customer.

Stock levels, prices, bench locations, mastery and demand figures are **fictional demo data**
— make them realistic (£8.99–£129.99, plausible pot sizes, some lines at zero stock) and
label them as demo.

Include these among the 24, plus a spread of your own that a real UK centre would stock
(shrubs, climbers, herbaceous, grasses, a tree or two, one aquatic, one tender):

`Acer palmatum 'Bloodgood'` · `Lonicera × purpusii 'Winter Beauty'` ·
`Viburnum tinus 'Eve Price'` · `Pittosporum tenuifolium 'Elizabeth'` · `Salvia 'Hot Lips'` ·
`Musa basjoo` · `Olea europaea` · `Cornus controversa 'Variegata'` ·
`Magnolia HONEY TULIP ('Jurmag5')` · `Citrus × meyeri 'Meyer'`

### Shared records — define all seven on day one

`PLANTS` is only one of the collections. Create all of these up front, seeded with plausible
demo content, and hold them in a single top-level state object:

| Collection | Holds |
|---|---|
| `plants` | the catalogue, schema above |
| `staff` | name, department, per-plant mastery, assigned learning, quiz history |
| `matchSessions` | each assisted-selling conversation: the brief, what was recommended, what was accepted, what was declined and why, basket total, timestamp, staff member |
| `learningAssignments` | who must learn what, by when, set by a manager, status |
| `curatorItems` | plants moving through the documentation pipeline, with status and validation results |
| `demandSignals` | aggregated requirements customers asked for — matched, unmatched, declined |
| `activityEvents` | append-only log of every state-changing action, with actor and timestamp |

**Every action writes to these records, and the consequences must be visible immediately in
other sections.** These specific chains are required, not optional:

- Declining a recommendation → writes a `demandSignal` → changes the Buyer's "reasons customers
  said no" figures and, when the reason is price or size, the slow-stock promotion list.
- A search returning zero in-stock matches → writes an unmatched `demandSignal` → appears in
  Today as a no-stock demand row and in the Buyer view as a buying recommendation.
- Completing a session → writes a `matchSession` → moves conversion and average assisted basket
  in Value Proof, and the recent-sessions list in Today.
- Approving or rejecting a `curatorItem` → changes its status → removes or adds the matching
  Today row, and on publish makes the plant available to Customer Match.
- Completing a quiz → updates that staff member's mastery → moves team mastery, the weakest-
  cultivars list, and clears the matching `learningAssignment`.

Counters that don't move when their source action fires are the single most common way a
prototype like this dies. Wire the writes before you style anything.

### Internal file structure

One file, but sectioned — in this order, each with a clear banner comment:

```
1. DEMO DATA              plants, staff, and the seeded records
2. CONSTANTS AND ENUMS    hardiness bands, foliage/container values, statuses, decline reasons
3. VALIDATION RULES       the schema rules below, as pure functions
4. MATCH SCORING          scoreMatch and its named weights
5. STATE MANAGEMENT       the single reducer + action creators over the seven collections
6. REUSABLE COMPONENTS    badge, stat bar, drawer, field block, empty state
7. SECTION COMPONENTS     the six views
8. APPLICATION SHELL      nav, role switcher, demo badge
9. RENDER
```

Validation and scoring must be **pure functions of their inputs**, defined before any
component and never reaching into component state. They are the two pieces most likely to be
lifted into the real product later.

### Shell

Top bar: Timber wordmark · six section tabs · role switcher · an unobtrusive **"Demo data"**
badge that is always visible.

Sections: **Today · Customer Match · Plants · Team Learning · Curator Queue · Value Proof**

Role switcher: **Floor Staff · Department Manager · Buyer**. Changing role must visibly change
what's prioritised — not just hide buttons. Floor Staff lands on Customer Match and sees the
day's learning assignment; Manager sees mastery gaps and approvals; Buyer sees no-stock demand
and slow lines. Wire this as a real filter over the action queue, not three hardcoded screens.

### Customer Match — build this to depth

The spear tip. A single-screen form (not a multi-step wizard; staff are standing up with a
customer waiting):

Inputs: aspect · available light (0–100 slider) · soil · moisture · max height · max spread ·
evergreen preference · season of interest · container required · maintenance tolerance ·
pet/child safety required · budget.

Rank **in-stock plants only** with an explicit, inspectable scoring function:

```js
function scoreMatch(plant, brief) → { score: 0-100, reasons: [], compromises: [], blockers: [] }
```

Make the weights named constants at the top of the function so they can be argued with and
tuned. The breakdown must be **shown, not just computed** — an expandable panel on each result
listing every contribution that produced the score, signed and itemised:

```
92% match
+25  tolerates partial shade (needs 35, position gives 45)
+20  mature size within 2.5m × 2m
+15  evergreen, as asked
+12  no known toxicity — safe with the dog
+10  14 in stock, Bench D3
 −6  prefers more moisture than this border holds
 −4  £64.99 is over the £50 budget
```

A manager must be able to disagree with a specific line. "Timber says this Pittosporum is
perfect" is worthless; "Timber gave it 15 points for being evergreen and that's too many" is a
product conversation.

Rules that must hold:

- A hard blocker (`sunMin` above available light; toxic when pet-safe is required; ultimate
  height over the stated maximum) removes the plant from the ranked list — it does not merely
  score low. Show blocked plants in a collapsed "ruled out, and why" section.
- Every result shows: match %, **why it matches** (plain sentences, not field dumps), **what
  the compromise is**, stock, pot size, price, bench location, and any `toxicity` /
  `compliance` warning rendered as a distinct badge.
- Where a good match is out of stock, surface the nearest in-stock substitute and say what
  the customer gives up.
- Suggest one companion/add-on per pick (compost, feed, pot, stake) with a price.

Staff can add picks to a **shortlist** showing basket total, a print view, and a
**"customer declined"** control with a reason (too expensive · too big · wrong look · wanted
evergreen · other). Declines and zero-result searches must feed the demand figures shown
elsewhere in the app — that is the point of the feature.

### The other five — one complete loop each

Thin is fine. Static is not. Each of these must support **one interaction that runs all the way
through and changes the shared records.** Nothing else in the section needs depth.

| Section | The one loop that must work |
|---|---|
| Today | Open an issue, then resolve or assign it |
| Plants | Search, inspect a cultivar, and swap to a substitute |
| Team Learning | Complete a five-question quiz and see mastery move |
| Curator Queue | Paste JSON, validate it, approve or reject |
| Value Proof | Change assumptions and recalculate the pilot estimate |

**Today** — the action queue, no decorative statistics. Rows for: deliveries awaiting
documentation · cultivars with unresolved taxonomy (`confidence !== 'verified'`) · plants
missing toxicity or compliance research · most-requested requirements currently out of stock ·
slow-moving lines needing promotion · learning assignments due · recent match sessions needing
follow-up. Each row states the count, why it matters, and opens the relevant record. Resolving
or assigning a row must remove it from the queue and write an `activityEvent`. Filtered by role.

**Plants** — searchable list plus detail panel. Detail renders `soilWarning`, `prune`,
`toxicity` and `compliance` as four visually separate blocks, plus the `confidence` badge, the
`uncertainty` list, stock/price/bench, staff mastery and 30-day demand. Substitutes must be
clickable and navigate to that plant.

**Team Learning** — team mastery %, mastery by department, weakest cultivars, most-confused
pairs, individual staff progress, and a working **five-question** quiz drawn from `plants`.
Finishing the quiz updates that staff member's mastery, moves the team figure, and clears any
matching `learningAssignment`. A manager role can assign a plant to a staff member.

**Curator Queue** — plants grouped by status (Awaiting research · Researching · Needs
clarification · Awaiting photo review · Validation failed · Ready for approval · Published),
with approve / reject / return-for-research buttons that actually move the item between
columns. A JSON paste box that runs the validation rules above and lists errors separately from
warnings, showing the generated slug. Publishing adds the plant to the catalogue Customer Match
searches.

**Value Proof** — editable calculator: staff count, monthly training hours, hourly cost,
assisted conversations per week, current conversion rate, average basket, assumed improvement.
Outputs training hours saved, additional converted sales, additional monthly gross, payback
period — **every output labelled an estimate, with its assumptions listed beside it.** Never
phrase an output as a guaranteed result. Seed the current conversion rate and average basket
from the actual `matchSessions` in state, so the calculator reflects what the demo just did.
Include the pilot measurement checklist: recommendation conversion · average assisted basket ·
match completion time · no-stock demand · mastery improvement · accepted substitutes · return
rate.

### Design direction

Weathered botanical reference material meets precise modern SaaS. Muted greens, cream, timber
brown, a restrained turquoise accent. Highly legible typography, generous whitespace, tactile
cards that never read as rustic or homemade. Restrained animation. Status colours that survive
a colourblind check, and text contrast at WCAG AA.

Do not imitate Tinder, Notion, Linear or Pokémon. No emoji used as interface icons — inline
SVG or nothing. No purple-to-pink gradients. No lorem ipsum anywhere. Responsive for desktop
and tablet; Customer Match must remain usable on a phone held one-handed.

### Deliver

The complete file in one code block, then a short list of:

- which of the six required loops fully work, and which don't
- which of the five cross-record chains you wired, named individually
- any horticultural fact you flagged as unverified
- the three weakest assumptions in your match scorer

Before you answer, walk the six-step acceptance test yourself and say honestly where it breaks.
