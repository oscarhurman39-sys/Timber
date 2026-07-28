# TIMBER /GOAL LAUNCHER

Use this at the start of a DeepSeek, Claude Code or Codex coding session.

---

Read `TIMBER-COMMAND-CENTRE-BUILD-SPEC.md` in full and treat it as the authoritative product and engineering contract.

**Read Amendment 1 at the top of that document first.** It overrides the deliverable path: you
are building `command-centre/timber-command-centre.html`. The existing `timber.html` is a
different, working product and must not be modified.

Then:

1. Inspect the repository. Read `timber.html` for reference only — do not edit it.
2. Read `TIMBER-BUILD-LOG.md` if it exists.
3. Identify the next incomplete phase and the smallest complete slice inside it.
4. Preserve existing accepted design assets and working behaviour.
5. Implement that slice.
6. Run `window.runTimberSelfTests()`.
7. Manually verify the relevant acceptance scenario and responsive layout.
8. Update `TIMBER-BUILD-LOG.md`.
9. Report only what was actually completed and verified.

Do not perform an uncontrolled full-file rewrite.
Do not touch `timber.html`, `sw.js`, `plants.csv`, `plants-tool.js`, `tools/` or `tests/`.
Do not create decorative placeholder views.
Do not add backend infrastructure before the Stage A gate passes.
Do not use an opaque AI-generated match score.
Do not merge soil warnings, pruning, toxicity or compliance.
Do not claim completion while primary controls are dead or the console contains errors.

The central product story is:

Customer requirement → explainable in-stock recommendation → shortlist or rejection → recorded outcome → demand, learning and management intelligence.

Begin now with the next incomplete build slice.
