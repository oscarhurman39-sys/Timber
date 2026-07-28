# Claude Handoff: Timber Phase 2

Use `timber-polished-phase1.html` as the new authoritative `timber.html`.

Before editing:

1. Replace or back up the current repository `timber.html`.
2. Open this exact file in a browser.
3. Run `window.runTimberSelfTests()` and confirm the returned summary is `Self-tests: 27 / 27 passed`.
4. Preserve the Phase 1 architecture, accessibility, portal overlays, persistence helpers, migration behaviour, toast service, responsive navigation and developer panel.
5. Do not rewrite the foundation.

Then begin **Phase 2 Recovery and Verification** from `TIMBER-COMMAND-CENTRE-BUILD-SPEC.md`.

Build only the next smallest complete Customer Match slice:

- expand the 30 demo plant records into the canonical scoring shape;
- implement the structured customer requirement model;
- implement the deterministic weighted scoring engine as pure functions;
- separate eligible, needs-verification and unavailable results;
- implement the real four-step wizard;
- implement a criterion-by-criterion score drawer;
- add shortlist line items with quantities and GBP totals;
- add a controlled rejection modal;
- save a truthful `shortlist-created` session without marking plants as purchased;
- create follow-up actions only when requested;
- derive Today and demand intelligence from shared state;
- add side-effect-free tests for every scoring and state rule.

Do not use `alert()`, `prompt()`, dead buttons, placeholder completion claims or opaque AI scores.

After the slice:

- run the existing Phase 1 tests;
- add and run Phase 2 tests;
- test at 360px, 390px, 768px and 1280px;
- check the browser console;
- update `TIMBER-BUILD-LOG.md`;
- report only behaviour verified in the exact repository file.
