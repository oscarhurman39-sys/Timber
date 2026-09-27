# Batch of 2026-09-27b — five cards, all dealt

`batch-as-sent.json` is Oscar's JSON as supplied: three cards first, then re-sent with two more
(Temple of Bloom, Eclipse); the re-send is the stored version. Photos are Oscar's (Galaxy S24;
Gentian 2026-09-19, Evereste 2026-09-23, City Knights 2026-09-26; Temple of Bloom and Eclipse
are his collages).

Conventions as before (Oscar's standing "go"): soil panel shortened, sub-metre sizes in cm,
everything else as supplied.

| # | latin | soil | warning | size |
|---|---|---|---|---|
| 1 | Gentiana sino-ornata | Humus-rich, drained, acid | Hates lime, drought and winter wet | 5-10 / 10-50 cm |
| 2 | Malus 'Evereste' | Any drained soil, any pH | Avoid waterlogging | unchanged |
| 3 | Coprosma 'City Knights' | Drained loam, neutral-acid | Frost-tender: shelter or bring pots in | 60-90 / 60-90 cm |
| 4 | Heptacodium miconioides Temple of Bloom ('SMNHMRF') | Any drained soil, any pH | No waterlogging; best colour in sun | unchanged |
| 5 | Coprosma repens Eclipse ('Aldawn') | Drained, acid-neutral | Frost-tender: pot up and overwinter inside | 50-60 / 30-45 cm |

- **#2 Evereste replaced a held card** (hold 83 -> 82). The held `Malus 'Evereste'` had terser
  text but stricter ratings. Oscar was offered (a) new JSON wholesale, (b) new text with the
  held ratings, (c) keep held text; he did not answer before the photos arrived, so the
  recommended (b) was applied: Oscar's text, held ratings kept — pestRisk 11 (JSON said 9),
  thirst 10 (7), careLevel 7 (6), sunNeed 90 (80), sunMin 70 (45). Peak is Oscar's Apr-Dec.
  The held row is in git history; swapping to (a) is a five-number edit.
- **#4** is the compact cultivar; the deck also deals the species `Heptacodium miconioides`
  (3-5 m, H6). Different card, not a duplicate.
- **#4 and #5 latin:** Oscar's `[Temple of Bloom]` / `[Eclipse]` square brackets dropped to
  match the deck's trade-name convention (cf. `Cotinus coggygria Golden Spirit ('Ancot')`).
- Photo/text: all five match. #2 shows fruit only (no blossom; Apr-Dec peak covers it).
  #4 collage shows flowers, red bracts starting, and bark — the three features the card names.

**Known flaky check.** `tests/deck-audit.js` failed twice then passed on the same tree with
`Japanese Anemone 'Pretty Lady Maria' — fullart-art-missing`. The 320 KB full-art webp is
present and served 200; the audit samples `img.complete` and can catch it still decoding
when the machine is busy (both failures were right after a bulk add). Not this batch's
change; noted so the next person does not chase it.
