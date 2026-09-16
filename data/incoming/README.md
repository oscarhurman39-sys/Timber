# Incoming plant JSONs

The validated source JSON for plants that have been through
`tools/check-plant-json.js`, kept because the card format in `timber.html` is
**not** the format the tools consume. `add-plant.js` and `add-plants-bulk.js` take
this incoming shape (with `soilWarning`, `height` and `spread` as separate fields);
the card flattens them (`soil` joined with `; `, `size` as `H × W`). Reconstructing
one from a card is fiddly and lossy, so the originals live here.

Worth keeping specifically for **held** plants: their data is already in
`PLANTS_ON_HOLD`, but if you want to re-run the tool once a photo lands, this is
the file to point it at.

## Files

| File | Card state | Notes |
|---|---|---|
| `primula-vialii.json` | **HELD** | Vial's primrose. Waiting on a clean photograph — the shot supplied on 2026-08-09 was AI-edited with a visible watermark (see `VERIFY-QUEUE.md`). To deal it: `node tools/add-plant.js --quick data/incoming/primula-vialii.json <photo>`, then remove the duplicate entry from `PLANTS_ON_HOLD`, or set `held` to 0 in `plants.csv` and import. |
| `nymphaea-marliacea-carnea.json` | dealt | Waterlily. Kept as the record of the corrected values: `aspect` was a light level rather than a facing, and both soil fields were far over the panel limits. |
| `new-plant-builds-2026-09-14-as-sent.json` | — | **The record, verbatim.** All 35 entries exactly as Oscar sent them on 2026-09-14, including the four that were not built. Never edit this file; it is what "as sent" means. |
| `toxicity-2026-09-16-batch1.json` | 9 applied | **A single-field pass, not a plant build.** Batch 1 of the toxicity backfill, exactly as ChatGPT returned it against `CHATGPT-TOXICITY-BRIEF.md`. 25 plants asked, 9 carried a sourced value and were applied with `backfill-field.js toxicity --apply`; **16 came back deliberately blank** and that is the brief working — RHS carries no "Potentially harmful" line and HTA has no entry, so a blank is the honest answer and the card prints nothing rather than a hedge. The `parts` / `route` / `affects` / `rhsWording` / `htaCategory` / `sources` / `uncertain` keys are NOT card fields and are not applied; they are the audit trail for the one field that is. Kept verbatim. |
| `new-plant-builds-2026-09-14.json` | 20 dealt, 11 held | The 31 entries actually ingested, via `tools/ingest-batch.js`. Differs from the as-sent file by four deliberate drops (two plants the deck already owned, two duplicate `Dianthus barbatus` colour selections) and by the `H1C`/`H1B` → `H1c`/`H1b` case fix the validator requires. See VERIFY-QUEUE item 86 for the full reasoning. |

The first two were edited after their first validation run — the checker's output is the
reason, not a preference. Don't "restore" the original wording without re-reading
`CARD-STATS.md` on soil length and the compass rule.
