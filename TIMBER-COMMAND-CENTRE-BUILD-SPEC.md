# TIMBER COMMAND CENTRE
## Comprehensive Build Goal and Agent Execution Specification

> ## AMENDMENT 1 — repository reality. Read before Phase 0.
>
> This amendment overrides the body of the specification wherever they conflict. Everything
> else in this document stands as written.
>
> **The deliverable is `command-centre/timber-command-centre.html`, NOT `timber.html`.**
>
> `timber.html` in this repository is already a different, working product: the Timber
> swipe-card learning deck — vanilla JavaScript, no React, with an inline PWA manifest. Six
> files depend on it remaining exactly that:
>
> | File | Dependency |
> |---|---|
> | `sw.js:6` | caches `timber.html` as the PWA app shell |
> | `plants-tool.js:36` | splices the `PLANTS` array in and out by marker |
> | `tools/add-plant.js:39` | inserts new plant rows before the `PLANTS:END` marker |
> | `tests/app-test.js` | loads it at `localhost:8477/timber.html` |
> | `tests/edge-test.js` | same |
> | `tests/sw-update-test.js` | verifies the stale-while-revalidate path against it |
>
> Rewriting `timber.html` as a React shell destroys all six. It will also appear intermittent
> rather than obviously broken, because `sw.js` keeps serving the cached copy to any device
> that has already visited.
>
> Therefore:
>
> - **Do not modify `timber.html`.** It is not the base for this build and §1.2's rewrite
>   clause does not apply to it. It is *structurally unusable as a React base* precisely
>   because it is a finished product of a different kind — that is a reason to leave it alone,
>   not a licence to replace it.
> - Build the Command Centre as a **new** file at `command-centre/timber-command-centre.html`.
>   Every other technical requirement in §5 (single self-contained file, React via CDN, no
>   build step, internal file order, self-tests) applies to that file unchanged.
> - `window.runTimberSelfTests()` (§5.6) is exposed by the new file. The Node suites in
>   `tests/` belong to the deck and must continue to pass untouched.
> - Read the deck's `timber.html` for **reference** — the card design rules in §11.4 are
>   implemented there and in `CARD-PROTOCOL.md`, `CARD-STATS.md` and `CARD-DESIGN-SYSTEM.md`.
>   Read, do not edit.
>
> **Second known divergence — the plant data contract.** §7 defines a nested plant record
> (`names.common`, `commercial.priceGBP`, `siteRequirements.sunNeed`). The deck uses a flat
> 25-field schema, locked by `CARD-PROTOCOL.md` and enforced by `tools/check-plant-json.js`
> and `plants.csv`. Both are correct for their own product. For Stage A, seed the Command
> Centre's demo data in the §7 nested shape and **do not alter the flat schema or
> `plants.csv`**. A mapping function between the two is Stage B work; note the assumption in
> the build log and move on. Do not stop to ask about it.

**Document status:** Authoritative build contract  
**Primary deliverable:** `command-centre/timber-command-centre.html` (see Amendment 1 — *not* `timber.html`)  
**Build mode:** Single self-contained HTML demonstrator using React via CDN  
**Target users:** UK garden-centre floor staff, department managers and buyers  
**Prototype purpose:** Prove that Timber can turn a vague customer requirement into a safe, explainable, in-stock recommendation, record the outcome, and convert that interaction into staff-learning and buying intelligence  
**Currency and locale:** English (United Kingdom), GBP (£), UK date formats  
**Current scope:** Polished, credible, fully interactive product demonstration  
**Future scope:** Pilot-ready product and production platform, only after the demonstrator passes the stage gate below  

---

# 0. THE GOAL

Build a polished and genuinely usable **Timber Command Centre** demonstrator that a garden-centre manager can open in a browser, understand within two minutes, and use to complete a believable assisted-selling workflow.

The product is not “a dashboard”.

The product is:

> The quickest route from “I need something evergreen for this awkward corner” to a confident, safe, in-stock recommendation.

The dashboard is the control room around that transaction.

The demonstrator must prove one complete commercial story:

1. A customer describes a planting requirement.
2. Timber translates that requirement into structured criteria.
3. Timber ranks plants that are actually in stock.
4. Every score is inspectable and defensible.
5. Compromises, uncertainty, toxicity and compliance warnings are visible.
6. The employee creates a shortlist and estimated basket.
7. The customer accepts or rejects recommendations.
8. Timber records why.
9. Demand intelligence updates.
10. Management can see what customers want, what stock is missing and what staff need to learn.
11. Curated plant knowledge improves the next recommendation.
12. Value Proof measures whether the pilot produces real benefit.

The prototype must follow this operational loop:

**OBSERVE → IDENTIFY → RECOMMEND → ACT OR APPROVE → MEASURE**

Every metric, card, alert and status must connect to a record or an action. Avoid decorative analytics that cannot be acted upon.

---

# 1. AGENT OPERATING CONTRACT

This document is intended to be read and executed by DeepSeek, Claude Code, Codex or another coding agent.

## 1.1 First action on every run

Before editing:

1. Read this entire document.
2. Inspect the repository.
3. Locate the current `timber.html`.
4. Locate any existing Timber briefs, JSON schemas, design references or plant-card implementations.
5. Open the existing application in a browser or preview environment.
6. Record what already works.
7. Preserve working behaviour unless this specification explicitly replaces it.
8. Continue from the next incomplete phase in the execution checklist.
9. Make the smallest complete change that advances the current phase.
10. Test the change before claiming completion.

## 1.2 Do not perform a blind rewrite

Do not replace a functioning `timber.html` with a wholly new file merely because rewriting feels easier.

Use the existing file as the product base where practical. Patch deliberately.

A full rewrite is permitted only when:

- the current file is structurally unusable;
- the rewrite preserves all accepted product behaviour and visual assets;
- a backup or version-control checkpoint exists;
- the agent documents why the rewrite was safer than incremental repair.

## 1.3 Checkpoint discipline

Before a substantial change:

- create a version-control commit, or
- create `timber.pre-<phase>.html` as a temporary backup.

After a phase:

- run the application;
- check browser console errors;
- run the built-in Timber self-tests;
- test the principal workflow manually;
- update `TIMBER-BUILD-LOG.md`;
- mark only genuinely completed checklist items.

Never report “finished” when controls are decorative, state changes are fake, buttons are dead, or the browser contains errors.

## 1.4 Decision discipline

When a detail is unspecified:

1. choose the option that best supports the central product story;
2. prefer understandable behaviour over cleverness;
3. prefer a smaller complete interaction over a larger incomplete section;
4. record the assumption in the build log;
5. do not stop the build merely to ask a minor design question.

## 1.5 No feature confetti

Do not add chatbots, generative text, social feeds, gamified currencies, excessive charts, warehouse management, payroll, rota planning, e-commerce checkout or full EPOS functionality.

The demonstrator exists to prove Timber’s intelligence layer between:

- plant stock;
- plant knowledge;
- the employee;
- the customer;
- the manager;
- the buyer.

---

# 2. EXECUTION CHECKLIST

The coding agent should maintain these boxes honestly.

## Phase 0: Repository and baseline

- [ ] Existing `timber.html` inspected
- [ ] Existing behaviour documented
- [ ] Existing plant-card assets identified
- [ ] Baseline browser screenshot captured
- [ ] Console checked
- [ ] Backup or commit created
- [ ] `TIMBER-BUILD-LOG.md` created

## Phase 1: Application foundation

- [ ] Single-file React shell works
- [ ] State architecture implemented
- [ ] Demo-data versioning implemented
- [ ] Local persistence and reset implemented
- [ ] Role switcher works
- [ ] Navigation works
- [ ] Shared drawer, modal, toast and empty-state components work
- [ ] Responsive shell works at target widths
- [ ] No dead controls in the shell

## Phase 2: Customer Match spear tip

- [ ] Requirement wizard works
- [ ] Weighted scoring engine works
- [ ] Hard blockers work
- [ ] Score explanations work
- [ ] Compromises work
- [ ] Shortlisting works
- [ ] Basket totals work
- [ ] Rejection reasons work
- [ ] Save-session flow works
- [ ] Demand signals update
- [ ] Print view works
- [ ] Demo QR or customer-link view works

## Phase 3: Plant Intelligence

- [ ] Search works
- [ ] Filters work
- [ ] Plant detail works
- [ ] Warnings remain separated
- [ ] Substitutes work
- [ ] Demand history is visible
- [ ] Staff mastery is visible
- [ ] Plant can be launched into Customer Match
- [ ] Existing Timber card design is preserved

## Phase 4: Today

- [ ] Queue derives from real state
- [ ] Items open relevant records
- [ ] Assign action works
- [ ] Resolve action works
- [ ] Queue updates immediately
- [ ] Role-specific priorities work

## Phase 5: Team Learning

- [ ] Five-question quiz works
- [ ] Answer explanations work
- [ ] Individual mastery updates
- [ ] Team mastery updates
- [ ] Weak-cultivar list updates
- [ ] Assignment flow works
- [ ] Seasonal and department packs work

## Phase 6: Curator Queue

- [ ] Queue statuses work
- [ ] JSON editor works
- [ ] Validation errors work
- [ ] Validation warnings work
- [ ] Generated slug works
- [ ] Source photograph panel works
- [ ] Preview works
- [ ] Approve works
- [ ] Reject works
- [ ] Return-for-research works
- [ ] Approval updates Plants and Today

## Phase 7: Value Proof

- [ ] Editable assumptions work
- [ ] Calculations update immediately
- [ ] Estimates are clearly labelled
- [ ] Measured values are visually distinct
- [ ] Payback calculation is honest
- [ ] Pilot checklist works
- [ ] Role-specific framing works

## Phase 8: Polish and assurance

- [ ] All major buttons work
- [ ] All drawers and modals close correctly
- [ ] All destructive actions confirm or allow undo
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Mobile layout passes
- [ ] Tablet layout passes
- [ ] Desktop layout passes
- [ ] Print layout passes
- [ ] Self-tests pass
- [ ] Console is clean
- [ ] Demo can be reset
- [ ] Demo-data indicator is visible
- [ ] Final manager walkthrough passes

---

# 3. STAGE GATES

## Stage A: Demonstrator

The initial target is a single-file application that can be opened directly and shown to managers.

It may use:

- fictional demonstration stock;
- local state;
- browser `localStorage`;
- simulated staff and customers;
- simulated QR links;
- illustrative source confidence;
- static or remote demonstration photography with graceful fallbacks.

It must not pretend to be integrated with live EPOS.

## Stage A completion gate

Do not move to a backend, Vite, authentication or integrations until all of the following are true:

- a new user can complete Customer Match without explanation;
- the score can be inspected;
- rejecting a recommendation changes demand intelligence;
- completing a quiz changes mastery;
- approving a curator record changes the catalogue and Today queue;
- all six views contain a meaningful working loop;
- no primary control is decorative;
- a manager can explain Timber’s value after a five-minute walkthrough;
- the application works on a modern phone, tablet and desktop browser.

## Stage B: Pilot-ready front end

Only after Stage A approval:

- migrate to a proper project structure;
- add authentication and permissions;
- add persistent storage;
- add CSV stock import;
- add site and department administration;
- add customer-link hosting;
- add audit history;
- add source-backed plant research workflows.

## Stage C: Production platform

Only after a paid or committed pilot validates the workflow:

- EPOS integrations;
- supplier-file ingestion;
- multi-site permissions;
- production analytics;
- production security;
- data retention controls;
- observability;
- uptime and support processes.

---

# 4. NON-NEGOTIABLE PRODUCT PRINCIPLES

## 4.1 Customer Match is the spear tip

Customer Match receives the deepest functional and visual treatment.

The other views explain why the matcher can be trusted and how its value compounds.

## 4.2 Explainability over black-box cleverness

A score without reasons is not acceptable.

Every recommendation must expose:

- contributing factors;
- positive points;
- deductions;
- blockers;
- compromises;
- unknowns;
- research-confidence warnings.

## 4.3 Live state, not staged theatre

Actions must mutate shared state.

Examples:

- rejecting a plant increments a demand signal;
- saving a match session adds an activity event;
- accepting a substitute records the substitution;
- completing a quiz updates mastery;
- approving a curator item publishes or updates a plant;
- resolving an action removes it from Today;
- assigning an item changes ownership;
- resetting the demo restores the original state.

## 4.4 Safety and uncertainty are visible

Do not bury or merge:

- `soilWarning`;
- `prune`;
- `toxicity`;
- `compliance`;
- `uncertainty`.

Unknown safety data is not the same as safe.

A compliance hold must prevent a plant from being recommended for sale.

## 4.5 Stock reality matters

Primary recommendations must be saleable at the selected site.

Out-of-stock plants may appear only in a clearly separated “Demand opportunity” or “Not currently available” panel.

## 4.6 Prototype honesty

Display an unobtrusive but visible **Demo data** indicator.

Use language such as:

- “Estimated”
- “Illustrative”
- “Pilot assumption”
- “Demo stock”
- “Not connected to EPOS”

Never imply guaranteed sales uplift.

---

# 5. TECHNICAL ARCHITECTURE

## 5.1 Delivery form

Primary deliverable:

`timber.html`

The file must:

- open directly in a browser;
- require no build step;
- use React through CDN scripts;
- contain all application logic and CSS;
- avoid server-only assumptions;
- degrade gracefully when an optional external image or library fails;
- remain readable enough for another agent to modify.

Recommended CDN approach:

- React 18 UMD;
- ReactDOM 18 UMD;
- Babel Standalone for JSX.

Do not add a dependency merely to save a few lines.

Prefer inline SVG components over a large icon library.

## 5.2 Internal file order

Keep `timber.html` visibly separated with large comments in this order:

```text
01. DOCUMENT HEAD AND CDN DEPENDENCIES
02. DESIGN TOKENS AND CSS
03. CONSTANTS AND ENUMERATIONS
04. DEMONSTRATION DATA
05. DATA NORMALISATION AND MIGRATIONS
06. VALIDATION RULES
07. MATCH SCORING ENGINE
08. STATE, REDUCER AND SELECTORS
09. SHARED UI COMPONENTS
10. CUSTOMER MATCH COMPONENTS
11. PLANT INTELLIGENCE COMPONENTS
12. TODAY COMPONENTS
13. TEAM LEARNING COMPONENTS
14. CURATOR QUEUE COMPONENTS
15. VALUE PROOF COMPONENTS
16. APPLICATION SHELL
17. SELF-TESTS
18. APPLICATION RENDER
```

Do not scatter demo data, reducers and business rules across visual components.

## 5.3 State approach

Use:

- one canonical application state;
- `useReducer` for state transitions;
- pure selectors for derived metrics;
- `useMemo` for expensive derived calculations;
- named action types;
- immutable updates;
- a central activity-event writer.

Do not maintain multiple contradictory copies of stock, mastery or queue status.

## 5.4 Persistence

Use `localStorage` for the demonstrator.

Suggested keys:

```js
timber.demo.state
timber.demo.version
timber.demo.preferences
```

Requirements:

- persist after meaningful state changes;
- include a schema version;
- support a simple migration function;
- provide a visible “Reset demo” control;
- require confirmation before reset;
- allow an undo toast after non-destructive changes where practical;
- never store sensitive real customer data.

## 5.5 Error containment

Add an application error boundary or equivalent fallback.

A failed plant image must not break the page.

A malformed curator JSON record must not break the application.

Show understandable errors inside the affected workflow.

## 5.6 Built-in self-test harness

Expose:

```js
window.runTimberSelfTests()
```

It must run deterministic assertions and return a readable summary.

Also provide a small developer-status panel accessible from the Demo data menu.

Tests must include at least:

- validation rejects `sunMin > sunNeed`;
- aspect rejects light terminology;
- ratings reject non-integers or values outside 0–20;
- strict pet-safe requirements block known toxic plants;
- compliance-hold plants are excluded;
- out-of-stock plants are not primary recommendations;
- rejected recommendations create demand signals;
- approved curator items update catalogue state;
- quiz completion updates mastery;
- demo reset restores original state;
- score result remains between 0 and 100;
- identical input produces identical ranking.

---

# 6. CANONICAL STATE MODEL

Use stable IDs. Do not identify records by array position.

Suggested top-level state:

```js
{
  meta: {
    schemaVersion: 1,
    demoData: true,
    activeSiteId: "site-oxted-demo",
    activeRole: "floor",
    activeUserId: "staff-amy",
    lastSavedAt: null
  },

  ui: {
    activeView: "today",
    activeDrawer: null,
    activeModal: null,
    toastQueue: [],
    catalogueQuery: "",
    catalogueFilters: {},
    matchWizardStep: 1
  },

  sites: [],
  plants: [],
  staff: [],
  matchSessions: [],
  learningAssignments: [],
  quizAttempts: [],
  curatorItems: [],
  demandSignals: [],
  actionItems: [],
  activityEvents: [],
  valueProof: {
    assumptions: {},
    pilotMeasurements: {}
  }
}
```

## 6.1 Required action types

At minimum:

```text
SET_ROLE
SET_ACTIVE_VIEW
OPEN_DRAWER
CLOSE_DRAWER
SHOW_TOAST
DISMISS_TOAST

MATCH_UPDATE_REQUIREMENTS
MATCH_RUN
MATCH_ADD_TO_SHORTLIST
MATCH_REMOVE_FROM_SHORTLIST
MATCH_RECORD_REJECTION
MATCH_SAVE_SESSION
MATCH_RESET

PLANT_SET_QUERY
PLANT_SET_FILTER
PLANT_SELECT_SUBSTITUTE

ACTION_ASSIGN
ACTION_RESOLVE
ACTION_REOPEN

QUIZ_START
QUIZ_ANSWER
QUIZ_COMPLETE
LEARNING_ASSIGN_PACK

CURATOR_UPDATE_JSON
CURATOR_VALIDATE
CURATOR_APPROVE
CURATOR_REJECT
CURATOR_RETURN

VALUE_UPDATE_ASSUMPTION
VALUE_RECORD_MEASUREMENT

RESET_DEMO
```

## 6.2 Activity events

Every meaningful action should write an event:

```js
{
  id: "event-...",
  type: "MATCH_SESSION_SAVED",
  actorId: "staff-amy",
  entityType: "matchSession",
  entityId: "match-...",
  siteId: "site-oxted-demo",
  createdAt: "2026-07-28T14:35:00.000Z",
  summary: "Saved a three-plant shortlist",
  metadata: {}
}
```

The Today timeline and recent activity panels must derive from these events.

---

# 7. PLANT DATA CONTRACT

Each plant represents an exact sellable plant record, preferably an exact cultivar.

Minimum shape:

```js
{
  id: "plant-acer-bloodgood",
  slug: "acer-palmatum-bloodgood",

  names: {
    common: "Japanese maple",
    botanical: "Acer palmatum",
    cultivar: "Bloodgood",
    display: "Acer palmatum 'Bloodgood'",
    tradeNames: [],
    synonyms: []
  },

  department: "Shrubs",
  status: "published",

  images: [
    {
      id: "image-1",
      url: "...",
      alt: "Dark red foliage of Acer palmatum 'Bloodgood'",
      kind: "plant"
    }
  ],

  commercial: {
    priceGBP: 39.99,
    potSize: "7.5L",
    stockQty: 8,
    locations: [
      {
        siteId: "site-oxted-demo",
        bench: "Shrubs S12",
        quantity: 8
      }
    ],
    supplierName: "Demo Nursery",
    supplierSku: "DEMO-ACER-001"
  },

  dimensions: {
    ultimateHeightM: 4,
    ultimateSpreadM: 3,
    timeToUltimateYears: 15,
    growthRate: "moderate"
  },

  appearance: {
    foliage: "deciduous",
    flowerColour: ["red"],
    foliageColour: ["purple", "red"],
    peakInterest: {
      startMonth: 4,
      endMonth: 11,
      label: "Apr–Nov"
    }
  },

  siteRequirements: {
    aspects: ["north", "east", "west"],
    sunNeed: 55,
    sunMin: 25,
    soils: ["loam", "sand", "clay"],
    moisture: ["moist-well-drained"],
    pH: ["acid", "neutral"],
    exposure: ["sheltered"]
  },

  suitability: {
    evergreen: false,
    container: "suitable-when-young",
    maintenance: 8,
    droughtTolerance: 7,
    resilience: 11,
    hardiness: "H6",
    uses: ["specimen", "courtyard", "container"]
  },

  care: {
    water: 10,
    prune: "Minimal pruning. Remove dead or crossing growth in the dormant season.",
    soilWarning: "Avoid prolonged waterlogging and exposed, scorching sites."
  },

  safety: {
    toxicity: {
      humans: "not-known-toxic",
      cats: "not-known-toxic",
      dogs: "not-known-toxic",
      severity: "none-known",
      notes: "Demo classification. Confirm against approved sources before production use."
    },
    compliance: {
      status: "clear",
      warnings: [],
      notes: "Demo record only."
    }
  },

  intelligence: {
    confidence: 88,
    uncertainty: [],
    sourceHierarchy: [
      {
        label: "Royal Horticultural Society",
        kind: "authority",
        confidence: "high",
        url: ""
      }
    ],
    lastReviewedAt: "2026-07-20"
  },

  merchandising: {
    companionProductIds: ["addon-ericaceous-compost"],
    substitutePlantIds: ["plant-acer-osakazuki"],
    promotionCandidate: false
  },

  analytics: {
    customerRequests30d: 12,
    recommendations30d: 8,
    accepted30d: 5,
    rejected30d: 3,
    acceptedSubstitute30d: 1
  },

  learning: {
    teamMastery: 67,
    commonlyConfusedWithIds: ["plant-acer-osakazuki"]
  }
}
```

## 7.1 Controlled values

### Foliage

```text
evergreen
semi-evergreen
deciduous
herbaceous
```

### Container suitability

```text
unsuitable
limited
suitable-when-young
suitable
ideal
```

### Compliance status

```text
clear
warning
hold
unknown
```

### Curator status

```text
awaiting-research
researching
needs-clarification
awaiting-photo-review
validation-failed
ready-for-approval
published
rejected
```

### Aspect

```text
north
east
south
west
```

Never put “sun”, “shade”, “bright” or equivalent light terminology inside `aspects`.

## 7.2 Numerical rules

- Timber ratings: integer from 0 to 20.
- `sunNeed`: integer from 0 to 100.
- `sunMin`: integer from 0 to 100.
- `sunMin` must not exceed `sunNeed`.
- confidence: integer from 0 to 100.
- stock quantity: integer zero or above.
- price: non-negative GBP number.
- dimensions: positive numeric values when known.

## 7.3 Research and commercial separation

Research may populate horticultural and safety information.

Research must not invent:

- live price;
- live stock quantity;
- bench location;
- supplier SKU;
- sales totals.

Commercial fields in demo data must be visibly fictional.

---

# 8. DEMONSTRATION DATA

Seed approximately 30 credible UK garden-centre plants across shrubs, trees, climbers, perennials, grasses, tender plants, fruit and aquatics.

Include:

1. Acer palmatum 'Bloodgood'
2. Acer palmatum 'Ōsakazuki'
3. Lonicera × purpusii 'Winter Beauty'
4. Viburnum tinus 'Eve Price'
5. Pittosporum tenuifolium 'Elizabeth'
6. Salvia 'Hot Lips'
7. Musa basjoo
8. Olea europaea
9. Cornus controversa 'Variegata'
10. Eryngium × olivierianum BIG BLUE ('Myersblue')
11. Nymphaea 'Marliacea Carnea'
12. Magnolia HONEY TULIP ('Jurmag5')
13. Carex punicea 'Belinda’s Find'
14. Citrus × meyeri 'Meyer'
15. Skimmia japonica 'Rubella'
16. Choisya ternata
17. Hydrangea paniculata 'Limelight'
18. Camellia japonica 'Donation'
19. Daphne odora 'Aureomarginata'
20. Fatsia japonica
21. Hebe rakaiensis
22. Lavandula angustifolia 'Hidcote'
23. Rosa 'Gertrude Jekyll'
24. Taxus baccata
25. Trachelospermum jasminoides
26. Wisteria floribunda 'Multijuga'
27. Heuchera 'Palace Purple'
28. Helleborus × hybridus
29. Betula utilis var. jacquemontii
30. Amelanchier lamarckii

Data should intentionally contain:

- several excellent matches;
- several partial matches;
- some low stock;
- some out-of-stock demand opportunities;
- at least one compliance hold;
- at least one unknown toxicity record;
- at least one unresolved taxonomy record;
- at least one missing photograph;
- several substitute relationships;
- several commonly confused plants;
- slow-moving stock;
- seasonal learning candidates.

Also seed:

- 6–8 staff members;
- 3 roles;
- 10–15 action items;
- 10+ historic match sessions;
- 8+ demand signals;
- 8+ curator records;
- 6+ learning assignments;
- enough activity events to make the app feel alive.

All names and commercial figures must be clearly fictional.

---

# 9. MATCH SCORING ENGINE

## 9.1 Requirements

The scorer must be:

- deterministic;
- inspectable;
- tunable;
- separate from rendering;
- testable;
- able to explain deductions;
- able to distinguish a compromise from a blocker.

Do not ask an AI model to invent the ranking.

## 9.2 Eligibility and blockers

Primary recommendation eligibility:

- stock quantity at active site is above zero;
- compliance status is not `hold`;
- record status is published;
- plant satisfies any explicit strict safety requirement;
- plant is not explicitly unsuitable for a mandatory container requirement.

Examples of blockers:

- “Must be safe for cats” and the plant is known toxic to cats;
- compliance hold;
- “Container required” and container suitability is `unsuitable`;
- plant is not for sale or not published.

Unknown safety data under a strict safety requirement should be excluded or placed in a clearly marked “Needs verification” group, never presented as safe.

Out-of-stock plants may be scored for demand intelligence but must not appear in the main saleable ranking.

## 9.3 Weighting

Default weights must total 100:

| Criterion | Weight |
|---|---:|
| Light range | 15 |
| Aspect | 5 |
| Soil | 10 |
| Moisture | 7 |
| Ultimate height | 7 |
| Ultimate spread | 5 |
| Evergreen preference | 8 |
| Peak interest season | 8 |
| Container suitability | 5 |
| Maintenance tolerance | 6 |
| Drought tolerance | 6 |
| Safety | 10 |
| Budget | 4 |
| Availability depth | 4 |
| **Total** | **100** |

Keep weights in one editable constant object.

## 9.4 Requirement strictness

Each relevant customer preference should support:

```text
required
preferred
neutral
```

Examples:

- evergreen required;
- pet safety required;
- budget preferred;
- flowering season preferred.

Required criteria may trigger blockers where appropriate.

Preferred criteria affect points.

Neutral criteria contribute no points and no deduction.

## 9.5 Scoring output

Each result must return:

```js
{
  plantId: "plant-...",
  eligible: true,
  score: 92,
  confidence: 88,
  blockers: [],
  reasons: [
    {
      criterion: "light",
      delta: 15,
      tone: "positive",
      label: "Suitable for partial shade"
    }
  ],
  compromises: [
    {
      criterion: "moisture",
      delta: -4,
      label: "Prefers slightly more moisture than requested"
    }
  ],
  unknowns: [],
  substituteIds: [],
  debug: {
    weightTotal: 100,
    awarded: 92
  }
}
```

## 9.6 Scoring behaviour

Use partial credit rather than binary scoring where sensible.

Examples:

- height slightly above target: modest deduction;
- height vastly above target: major deduction;
- exact requested season: full points;
- overlapping season: partial points;
- soil suitable but not ideal: partial points;
- low stock: small availability deduction;
- slightly over budget: small deduction;
- heavily over budget: larger deduction.

Do not allow a perfect score when meaningful uncertainty remains.

## 9.7 Explanation language

Reasons must be concise and concrete:

Good:

- “+15 fits partial shade”
- “+8 evergreen”
- “−4 exceeds the preferred budget by £5”
- “−6 likely to outgrow the requested width”
- “Blocked: toxic to cats”

Bad:

- “This is a great option”
- “AI confidence is high”
- “It should work well”

## 9.8 Ranking tiers

Suggested presentation:

- 85–100: Excellent fit
- 70–84: Strong fit
- 55–69: Possible with compromises
- below 55: Show only when the user expands alternatives

These labels do not override blockers.

---

# 10. CUSTOMER MATCH VIEW

This is the flagship workflow.

## 10.1 Layout

Desktop:

- left: structured requirement builder;
- centre: ranked recommendations;
- right: shortlist and basket.

Tablet:

- requirements and results as two primary panels;
- shortlist in drawer.

Mobile:

- step-by-step wizard;
- sticky “View matches” action;
- full-screen result cards;
- shortlist in full-screen drawer.

## 10.2 Inputs

Include:

- active site;
- customer label or initials, optional and non-sensitive;
- aspect;
- preferred light;
- minimum tolerated light;
- soil;
- moisture;
- desired maximum height;
- desired maximum spread;
- evergreen preference;
- flowering or ornamental-interest season;
- container requirement;
- maintenance tolerance;
- drought tolerance;
- pet safety;
- child safety;
- total or per-plant budget;
- quantity;
- optional customer notes.

Provide:

- sensible defaults;
- plain-English helper text;
- “Not sure” options;
- progressive disclosure;
- a compact summary of selected requirements.

## 10.3 Match results

Each recommendation card must show:

- plant image;
- full display name;
- match percentage;
- tier label;
- stock quantity;
- pot size;
- price;
- bench location;
- research confidence;
- top three match reasons;
- compromises;
- toxicity status;
- compliance status;
- buttons for:
  - inspect score;
  - view plant;
  - add to shortlist;
  - reject;
  - compare substitute.

## 10.4 Inspect score drawer

Show every criterion:

| Criterion | Requirement | Plant data | Weight | Awarded | Explanation |
|---|---|---|---:|---:|---|

Also show:

- blockers;
- unknowns;
- confidence warning;
- horticultural caveat;
- stock caveat.

## 10.5 Shortlist

The user can select multiple plants.

Show:

- quantity controls;
- line total;
- estimated basket total;
- companion products;
- optional add-ons;
- remove action;
- substitute action;
- confidence and warning summary.

Suggested add-ons may include fictional demo products:

- ericaceous compost;
- peat-free multipurpose compost;
- pot;
- stake and tie;
- slow-release feed;
- mulch;
- companion plant.

## 10.6 Rejection capture

Rejecting a recommendation opens a compact reason selector:

- too expensive;
- too large;
- too small;
- wrong appearance;
- unsafe for pet or child;
- customer wanted evergreen;
- maintenance too high;
- out of stock;
- customer changed mind;
- other.

Allow an optional note.

Rejection must:

- update the current match session;
- update plant analytics;
- create or update a demand signal;
- add an activity event;
- alter buyer or manager panels where relevant.

## 10.7 Save session

Saving creates a complete record:

```js
{
  id: "match-...",
  siteId: "...",
  staffId: "...",
  createdAt: "...",
  requirements: {},
  rankedPlantIds: [],
  shortlist: [],
  rejected: [],
  acceptedPlantIds: [],
  estimatedBasketGBP: 0,
  status: "saved",
  followUp: {
    requested: false,
    dueAt: null
  }
}
```

After saving:

- show confirmation;
- update Today;
- update Value Proof;
- update recent activity;
- offer print;
- offer customer-link view;
- offer “Start another match”.

## 10.8 Print and customer link

Print view must be clean and useful.

Include:

- customer requirement summary;
- selected plants;
- price and pot size;
- care highlights;
- warnings;
- bench location may be omitted from customer print;
- total;
- “Demo recommendation” label.

The QR may be simulated, but the customer-link panel must look credible and contain a copyable demo URL.

---

# 11. PLANT INTELLIGENCE VIEW

## 11.1 Catalogue

Support search by:

- common name;
- botanical name;
- cultivar;
- trade synonym;
- use;
- requirement;
- bench;
- department.

Filters:

- in stock;
- department;
- evergreen;
- light;
- aspect;
- soil;
- container;
- pet-safe;
- child-safe;
- confidence;
- curator status;
- promotion candidate.

Provide useful empty states and a clear reset-filter action.

## 11.2 Catalogue rows or cards

Show:

- image;
- display name;
- department;
- stock;
- price;
- bench;
- light;
- size;
- key warning;
- confidence;
- team mastery;
- recent demand.

## 11.3 Plant detail

Required sections:

1. Overview
2. Timber visual card
3. Stock and commercial
4. Suitability
5. Care
6. Safety and compliance
7. Research and uncertainty
8. Substitutes
9. Team mastery
10. Customer demand
11. Activity

Visibly separate:

- `soilWarning`;
- `prune`;
- `toxicity`;
- `compliance`.

Never combine them into a generic “Warnings” paragraph.

## 11.4 Existing Timber card is a locked product asset

Do not casually redesign the established Timber card.

Preserve these accepted rules where the component exists:

- plant photograph runs the full card height;
- upper areas may be translucent;
- paper tone is weathered and botanical, not grimy;
- “Double tap to master” is small footer text, not a large box;
- Height and Spread remain centred in the green left column;
- the central plaque must not overlap the green panel;
- Plant Power Points sit beneath the title plaque, not inside the green panel;
- Growth Speed remains a vertical translucent bar on the right;
- Aspect contains a real aspect string;
- the compass remains compact;
- the light scale runs from bright to dark;
- the tolerance line and optimal range are distinct;
- soil warning remains separate;
- geometric half and quarter ratings are used rather than opacity fades;
- care uses the accepted secateurs icon language;
- pest rating uses the accepted spray-bottle language;
- accepted card colours and textures are preserved unless a change is explicitly requested.

The dashboard may frame the card differently, but should not mutate the card’s internal design rules.

## 11.5 Substitute action

Selecting a substitute must:

- show why it is substitutable;
- show differences;
- permit launching it into Customer Match;
- record accepted substitutions when selected in a live session.

---

# 12. TODAY VIEW

Today is an operational queue, not a motivational homepage.

## 12.1 Summary strip

Use a restrained summary:

- urgent curator items;
- unresolved customer follow-ups;
- new deliveries to learn;
- high-demand no-stock requirements;
- low-stock popular plants;
- assignments due.

Every figure must open a filtered list or relevant record.

## 12.2 Action queue

Each item contains:

- urgency;
- type;
- concise title;
- linked entity;
- owner;
- due state;
- reason it matters;
- primary action;
- secondary action.

Types include:

- new delivery;
- missing photograph;
- taxonomy uncertainty;
- missing toxicity;
- compliance warning;
- no-stock demand;
- slow-moving stock;
- learning due;
- match follow-up;
- curator approval.

## 12.3 Actions

The user can:

- inspect;
- assign;
- resolve;
- snooze;
- open linked record.

Resolving or assigning must update shared state.

## 12.4 Role differences

### Floor Staff

Prioritise:

- customer follow-ups;
- plants to learn;
- new deliveries;
- unresolved customer questions.

### Department Manager

Prioritise:

- queue ownership;
- curator approvals;
- staff gaps;
- promotion candidates;
- unresolved safety data.

### Buyer

Prioritise:

- repeated no-stock requirements;
- substitute acceptance;
- low-stock high-demand plants;
- supplier naming discrepancies;
- seasonal demand.

---

# 13. TEAM LEARNING VIEW

## 13.1 Dashboard

Show:

- team mastery;
- department mastery;
- weakest cultivars;
- commonly confused plants;
- new deliveries not learned;
- assignments due;
- recent improvement.

Keep charts restrained and actionable.

## 13.2 Quiz

A five-question quiz must be fully functional.

Question types:

- identify from photograph;
- choose correct light range;
- choose safe customer scenario;
- distinguish two commonly confused cultivars;
- recommend the best plant for a scenario.

Each answer must show:

- correct or incorrect;
- explanation;
- relevant plant record link;
- effect on mastery.

## 13.3 Mastery model

Use a simple transparent model.

Suggested range: 0–100.

Each plant can have staff mastery records:

```js
{
  staffId: "staff-amy",
  plantId: "plant-...",
  mastery: 62,
  attempts: 4,
  correct: 3,
  lastAttemptAt: "..."
}
```

Completing a quiz must update:

- staff mastery;
- team mastery;
- weak-cultivar ranking;
- assignment status;
- activity events.

Do not award mastery merely for opening a card.

## 13.4 Assignments

Managers can assign:

- seasonal pack;
- department pack;
- new-delivery pack;
- selected plants.

Assignment must have:

- assignee;
- due date or due label;
- plant list;
- status;
- progress.

---

# 14. CURATOR QUEUE VIEW

## 14.1 Queue

Statuses:

- Awaiting research
- Researching
- Needs clarification
- Awaiting photo review
- Validation failed
- Ready for approval
- Published

Provide:

- filters;
- ownership;
- status counts;
- urgency;
- source photograph thumbnail;
- plant name;
- validation state;
- uncertainty count.

## 14.2 Editor

The editor must allow:

- paste;
- direct editing;
- format JSON;
- validate;
- restore last valid version;
- copy;
- preview.

Malformed JSON must show a parse error without breaking the app.

## 14.3 Validation

### Errors

Errors prevent approval.

Validate:

- required fields;
- correct types;
- ratings are integers 0–20;
- `sunNeed` and `sunMin` are integers 0–100;
- `sunMin <= sunNeed`;
- controlled foliage values;
- controlled container values;
- parseable peak-interest range;
- field-length limits;
- valid stock and price types;
- exact separation of `soilWarning`, `prune`, `toxicity`, `compliance`;
- aspect contains no light terminology;
- required uncertainty array exists;
- commercial data is not presented as research output;
- valid slug.

### Warnings

Warnings permit approval but require judgement.

Examples:

- confidence below 70;
- missing secondary source;
- unknown toxicity;
- unresolved synonym;
- no substitute;
- no photograph;
- unusual ultimate size;
- stale review date.

## 14.4 Approval flow

Approve:

- validates;
- requires no blocking errors;
- changes status to published;
- inserts or updates plant record;
- removes approval action from Today;
- writes activity event;
- shows success toast.

Reject:

- requires a reason;
- changes status;
- keeps audit detail;
- writes activity event.

Return for research:

- records requested changes;
- assigns an owner;
- updates Today;
- writes activity event.

## 14.5 Preview

Preview must show:

- source photograph;
- rendered Timber card;
- key catalogue fields;
- warnings;
- confidence;
- uncertainty.

The source photograph and rendered result should be visible together on desktop.

---

# 15. VALUE PROOF VIEW

## 15.1 Purpose

This view does not promise ROI.

It estimates what a pilot might measure and makes assumptions inspectable.

## 15.2 Editable assumptions

Include:

- number of staff;
- training hours per staff member per month;
- average employment cost per hour;
- estimated training-time reduction;
- assisted plant conversations per week;
- current recommendation conversion rate;
- estimated pilot conversion rate;
- average assisted basket;
- gross margin percentage;
- estimated monthly software price;
- working weeks per month.

Use UK currency formatting.

## 15.3 Calculations

Suggested formulas:

```text
monthlyTrainingCost =
staff × trainingHoursPerStaff × hourlyCost

estimatedTrainingSaving =
monthlyTrainingCost × trainingTimeReduction

monthlyAssistedConversations =
weeklyConversations × workingWeeksPerMonth

currentConvertedSales =
monthlyAssistedConversations × currentConversionRate

pilotConvertedSales =
monthlyAssistedConversations × pilotConversionRate

additionalConvertedSales =
pilotConvertedSales − currentConvertedSales

additionalMonthlyGrossSales =
additionalConvertedSales × averageBasket

additionalMonthlyGrossProfit =
additionalMonthlyGrossSales × grossMargin

estimatedMonthlyBenefit =
estimatedTrainingSaving + additionalMonthlyGrossProfit

estimatedNetMonthlyBenefit =
estimatedMonthlyBenefit − monthlySoftwarePrice

estimatedPaybackMonths =
monthlySoftwarePrice / max(estimatedMonthlyBenefit, smallPositiveValue)
```

Clearly label:

- assumptions;
- estimates;
- observed demo data;
- pilot measurements.

Do not calculate payback from gross sales alone without showing the gross-margin assumption.

## 15.4 Pilot checklist

Track:

- recommendation conversion;
- average assisted basket;
- customer-match completion time;
- no-stock demand;
- employee mastery improvement;
- accepted substitutes;
- return or complaint rate;
- staff adoption;
- curator throughput.

Each metric must state:

- baseline;
- pilot target;
- measured value;
- status;
- collection method.

---

# 16. ROLE SWITCHER

Roles:

- Floor Staff
- Department Manager
- Buyer

Changing role must alter:

- default landing view;
- priority cards;
- copy;
- available primary actions;
- Today queue order;
- Value Proof framing;
- catalogue emphasis.

Do not merely change a label in the header.

Suggested defaults:

| Role | Landing view |
|---|---|
| Floor Staff | Customer Match or Today |
| Department Manager | Today |
| Buyer | Today with demand emphasis |

The demonstrator need not implement security-grade permissions, but role differences must be believable.

---

# 17. DESIGN SYSTEM

## 17.1 Character

The interface should feel:

- horticulturally literate;
- calm;
- premium;
- tactile;
- modern;
- operational;
- trustworthy.

It should not feel:

- rustic craft-market;
- generic enterprise software;
- neon startup dashboard;
- children’s learning software;
- a Tinder imitation;
- a Pokémon imitation;
- a collage of unrelated cards.

## 17.2 Suggested palette

Use CSS custom properties.

```css
--ink: #18382D;
--ink-soft: #52655E;
--paper: #F3F0E6;
--surface: #FBFAF6;
--surface-strong: #FFFFFF;
--green: #2E6A4E;
--green-dark: #204B39;
--green-soft: #DDE8DF;
--turquoise: #3D8B83;
--timber: #8A6543;
--timber-soft: #D8C6AF;
--amber: #B98032;
--amber-soft: #F3E4C8;
--danger: #A94A45;
--danger-soft: #F4DAD7;
--border: rgba(24, 56, 45, 0.14);
--shadow: 0 14px 40px rgba(20, 42, 33, 0.10);
```

Values may be refined, but preserve the green, cream, timber and muted-turquoise identity.

## 17.3 Typography

Use reliable system fonts.

Suggested:

- UI: `Inter`, `Segoe UI`, `Roboto`, system sans-serif;
- botanical or editorial headings: `Georgia`, `Cambria`, serif.

Do not load several decorative fonts.

## 17.4 Texture

Create weathered paper subtly through CSS gradients and noise-like patterns.

Texture must never reduce text clarity.

## 17.5 Layout

Use:

- generous but efficient spacing;
- strong hierarchy;
- compact operational tables;
- restrained radii;
- clear dividers;
- sticky actions where useful;
- predictable drawers.

Avoid endless floating cards with no hierarchy.

## 17.6 Motion

Use restrained transitions:

- 120–220ms;
- opacity and small transforms;
- no bouncing;
- respect `prefers-reduced-motion`.

## 17.7 Status language

Use both text and colour.

Never rely on colour alone.

---

# 18. RESPONSIVE BEHAVIOUR

Test at minimum:

- 360 × 800;
- 390 × 844;
- 768 × 1024;
- 1024 × 768;
- 1280 × 800;
- 1440 × 900.

Requirements:

- no horizontal page overflow;
- touch targets at least approximately 44px;
- modals become full-screen sheets on mobile;
- tables collapse into cards or horizontal scroll containers with labels;
- sticky footer actions do not cover content;
- navigation remains understandable;
- Customer Match remains completable;
- print output remains clean.

Suggested navigation:

- desktop: persistent top navigation;
- mobile: compact bottom navigation with a “More” sheet if needed.

All six views must remain reachable.

---

# 19. ACCESSIBILITY

Minimum requirements:

- semantic headings;
- labelled form controls;
- keyboard-operable controls;
- visible focus states;
- correct button elements;
- usable tab order;
- Escape closes drawers and modals;
- focus returns to the triggering control;
- status changes announced through an ARIA live region;
- sufficient contrast;
- alt text for plant imagery;
- errors linked to fields;
- no information communicated by colour alone;
- reduced-motion support.

---

# 20. PERFORMANCE AND RELIABILITY

For the demonstrator:

- no console errors;
- no uncaught promise rejections;
- no broken-image icons;
- no infinite render loops;
- no state mutation bugs;
- avoid re-scoring all plants on unrelated UI changes;
- use lazy or deferred rendering for image-heavy galleries where practical;
- keep animations light;
- avoid enormous base64 images;
- display a graceful image fallback.

The application should feel immediate on a recent mid-range Android phone.

---

# 21. CROSS-VIEW WORKFLOWS

These are mandatory integration paths.

## 21.1 Customer rejection to buyer intelligence

1. Staff rejects a recommendation.
2. Reason is recorded.
3. Match session updates.
4. Demand signal updates.
5. Plant analytics update.
6. Activity event is written.
7. Buyer’s Today queue or demand panel reflects the signal.

## 21.2 Curator approval to sale recommendation

1. Manager opens curator item.
2. JSON validates.
3. Item is approved.
4. Plant is inserted or updated.
5. Plant becomes searchable.
6. Today approval action disappears.
7. Activity event is written.
8. Plant becomes eligible for Customer Match if stock and compliance permit.

## 21.3 Learning to mastery

1. Staff completes quiz.
2. Answers are scored.
3. Plant mastery updates.
4. Team mastery selector updates.
5. Weak-cultivar list changes.
6. Assignment progress updates.
7. Activity event is written.

## 21.4 Plant substitute to match session

1. Staff opens a plant.
2. Staff selects a substitute.
3. Comparison opens.
4. Substitute launches into the active match.
5. Accepted substitute is recorded if shortlisted or purchased.
6. Demand intelligence records the substitution relationship.

## 21.5 Today resolution

1. User opens an action item.
2. User resolves or assigns it.
3. Action state changes.
4. Today counts update.
5. Related record updates where appropriate.
6. Activity event is written.

---

# 22. ACCEPTANCE SCENARIOS

The final demonstrator must pass these manually.

## Scenario 1: Evergreen awkward corner

Customer wants:

- evergreen;
- partial shade;
- medium moisture;
- maximum 2m spread;
- low maintenance;
- cat-safe;
- budget £45.

Expected:

- ranked in-stock matches;
- inspectable score;
- unsafe plants blocked;
- unknown-safety plants clearly withheld or warned;
- shortlist can be saved.

## Scenario 2: No perfect stock

Customer wants a pet-safe climber for deep shade.

Expected:

- no false perfect result;
- compromises visible;
- saleable substitutes shown;
- out-of-stock demand opportunity shown separately;
- rejection or no-stock reason updates demand intelligence.

## Scenario 3: Slightly over budget

A strong match costs £5 over the preferred budget.

Expected:

- plant remains visible;
- receives a clear deduction;
- explanation states the amount over budget;
- result is not silently excluded unless budget is marked required.

## Scenario 4: Compliance hold

A plant otherwise scores highly but has `compliance.status = "hold"`.

Expected:

- excluded from primary recommendations;
- reason visible to manager;
- linked action appears in Today.

## Scenario 5: Curator validation

Paste JSON with:

- `sunMin` higher than `sunNeed`;
- “full shade” in aspect;
- rating of 21;
- merged toxicity and soil warning.

Expected:

- clear separate errors;
- approval disabled;
- valid fields remain visible;
- editor does not crash.

## Scenario 6: Curator approval

Correct the record and approve it.

Expected:

- item publishes;
- plant appears in catalogue;
- Today queue updates;
- event appears in activity.

## Scenario 7: Quiz completion

Staff completes five questions.

Expected:

- score displayed;
- explanations displayed;
- mastery changes;
- weak-cultivar list changes;
- assignment progresses.

## Scenario 8: Value Proof

Change staff count, basket value and conversion assumption.

Expected:

- calculations update immediately;
- all results labelled estimates;
- gross margin is visible;
- software payback is not presented as guaranteed.

## Scenario 9: Mobile

Complete a match at 390px width.

Expected:

- no clipped controls;
- wizard usable;
- results readable;
- shortlist accessible;
- save works.

## Scenario 10: Reset

Modify several areas, reload, then reset.

Expected:

- state persists across reload;
- reset confirmation appears;
- reset returns original demo state;
- no stale derived state remains.

---

# 23. QUALITY BAR

The demonstrator is not complete if any of these are true:

- navigation buttons open empty shells;
- a primary button does nothing;
- metrics do not connect to records;
- all roles show identical priorities;
- rankings cannot be explained;
- unsafe plants are presented as safe;
- out-of-stock plants appear as normal recommendations;
- actions update only local component visuals and not shared state;
- values are hard-coded in several contradictory places;
- mobile requires desktop zooming;
- plant card rules have been casually replaced;
- estimates look like guarantees;
- console errors remain;
- the app cannot be reset;
- the build log claims tests that were not run.

---

# 24. IMPLEMENTATION PHASES IN DETAIL

## Phase 0: Inspect and stabilise

Deliver:

- repository notes;
- baseline screenshot;
- backup;
- build log;
- list of existing assets and behaviours;
- decision on incremental patch versus controlled rewrite.

Stop condition:

- existing application can be restored.

## Phase 1: Foundation

Build:

- design tokens;
- responsive shell;
- role switcher;
- navigation;
- canonical reducer;
- local persistence;
- demo reset;
- drawers;
- modals;
- toasts;
- activity events;
- basic sample data;
- self-test harness.

Stop condition:

- shell is stable and all six routes render meaningful skeleton content without dead controls.

## Phase 2: Customer Match

Build the complete central workflow before polishing secondary pages.

Stop condition:

- Scenario 1, 2 and 3 pass.

## Phase 3: Plant Intelligence

Build catalogue, plant detail, substitute and match-launch flows.

Stop condition:

- Plant records are usable as the source of truth for matching and learning.

## Phase 4: Today

Derive queue items from real state and add assign/resolve flows.

Stop condition:

- queue reacts to prior actions.

## Phase 5: Learning

Build quiz, mastery and assignment flows.

Stop condition:

- mastery changes are real and visible elsewhere.

## Phase 6: Curator

Build editor, validation and publication flow.

Stop condition:

- curator approval updates the saleable catalogue.

## Phase 7: Value Proof

Build editable calculations and pilot-measurement checklist.

Stop condition:

- no estimate can be mistaken for a measured outcome.

## Phase 8: Polish

Perform:

- visual refinement;
- interaction refinement;
- responsive testing;
- accessibility checks;
- print testing;
- self-test completion;
- manager walkthrough.

Stop condition:

- Stage A gate passes.

---

# 25. BUILD LOG FORMAT

Create `TIMBER-BUILD-LOG.md`.

Use this structure:

```md
# Timber Build Log

## Current phase
Phase X

## Latest completed slice
- ...

## Files changed
- timber.html

## Behaviour added
- ...

## Tests run
- window.runTimberSelfTests()
- Manual: Scenario X
- Widths tested: ...

## Known issues
- ...

## Assumptions made
- ...

## Next smallest complete slice
- ...
```

Do not use the build log as a substitute for fixing known breakage.

---

# 26. MANAGER DEMO SCRIPT

The final product should support this five-minute walkthrough:

1. Switch to Floor Staff.
2. Open Customer Match.
3. Enter an awkward partial-shade, evergreen, pet-safe requirement.
4. Inspect the top match score.
5. Add two plants and a companion product to the shortlist.
6. Reject one option as too expensive.
7. Save and print the session.
8. Switch to Buyer.
9. Show the rejection reflected in demand intelligence.
10. Switch to Manager.
11. Open Today and resolve a curator issue.
12. Approve the corrected plant record.
13. Open Team Learning and complete one quiz.
14. Show mastery update.
15. Open Value Proof and change assumptions.
16. Explain what a real pilot would measure.

The manager should leave understanding:

- what Timber does;
- how staff use it;
- why recommendations are trustworthy;
- what management learns;
- how it differs from EPOS;
- what a paid pilot would test.

---

# 27. FUTURE PRODUCTION ROADMAP

This section is directional only. Do not implement it during Stage A.

## 27.1 Likely project structure

```text
apps/
  web/
  api/

packages/
  plant-schema/
  match-engine/
  ui/
  validation/

services/
  catalogue/
  stock-import/
  analytics/
```

## 27.2 Likely production capabilities

- authenticated users;
- role-based permissions;
- multi-site catalogues;
- PostgreSQL or equivalent;
- audit history;
- CSV import;
- EPOS connectors;
- hosted customer links;
- source-backed research;
- approval workflows;
- exportable demand reports;
- monitoring and error reporting.

## 27.3 Migration trigger

Migrate from single-file HTML only when:

- the workflow is accepted;
- pilot scope is known;
- data ownership is understood;
- integration targets are known;
- a manager is willing to test or pay.

Do not prematurely build a cathedral for a congregation that has not yet arrived.

---

# 28. FINAL DELIVERY REQUIREMENTS

At Stage A completion provide:

1. `timber.html`
2. `TIMBER-COMMAND-CENTRE-BUILD-SPEC.md`
3. `TIMBER-BUILD-LOG.md`
4. a concise list of demo limitations
5. self-test output
6. tested browser widths
7. a five-minute manager walkthrough
8. screenshots of:
   - Today;
   - Customer Match results;
   - score inspection;
   - Plant detail;
   - Learning quiz result;
   - Curator validation;
   - Value Proof.

The final report must state honestly:

- what works;
- what is simulated;
- what remains;
- what should be tested with a garden-centre manager.

---

# 29. AGENT COMPLETION RESPONSE FORMAT

After each run, respond with:

```md
## Completed
- ...

## Verified
- ...

## State changes now connected
- ...

## Known limitations
- ...

## Next build slice
- ...
```

Do not provide a celebratory summary that conceals unfinished work.

---

# 30. STARTING INSTRUCTION

Begin with Phase 0.

Inspect the existing Timber repository and `timber.html`, preserve working assets, create a baseline checkpoint and build log, then implement the next smallest complete slice.

Do not attempt all six views in one uncontrolled rewrite.

Customer Match is the commercial spear tip. Build its state, scoring and outcome loop first, then connect the supporting views around it.
