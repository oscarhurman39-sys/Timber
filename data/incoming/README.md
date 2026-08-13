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

Both were edited after their first validation run — the checker's output is the
reason, not a preference. Don't "restore" the original wording without re-reading
`CARD-STATS.md` on soil length and the compass rule.
