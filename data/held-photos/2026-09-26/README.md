# Batch of 2026-09-26 — no photos yet

`batch.json` is Oscar's JSON, exactly as supplied.

- **Held (3):** Aster 'Rose Crystal', Aster 'Granat', Blueberry 'Brigitta'. The same
  conventions as the 2026-09-23 batch were applied: sub-metre sizes in cm, and soil cut
  to one short line plus one short warning. Hardiness notes were already compact.
- **Not added:** `Symphyotrichum dumosum Alpha® Light Purple`. The deck already deals
  this plant, with a photo, as `Aster 'Alpha Light Purple'`. The latin differs, so the
  duplicate check would not have caught it. It waits on Oscar: replace the old card's
  text with this JSON, or skip it.

**Update, same day:** Aster 'Rose Crystal' was dealt from `symphyotrichum-dumosum-rose-crystal.jpg`
(Oscar's photo, taken 2026-09-23, Galaxy S24), with the focus set to `50% 20%`. Oscar identified
it as Rose Crystal from the label. The flowers show bright violet-magenta, while the card's
`visual` says "dusky rose-pink" and its hue is 335. That is flagged to Oscar, not changed.

**Second drop, same day** (`batch-2.json` as supplied, `batch-2-corrected.json` as added):

- Dealt with photos: Gaultheria mucronata 'Signaal', Bergenia 'Bressingham Ruby' (Oscar's PNG
  cutout, placed with `tools/composite-hero.js` at hue 335; both files are kept here),
  Bistorta amplexicaulis 'Bokrafire', × Heucherella 'Solar Eclipse', plus the held
  Aster 'Granat' and Blueberry 'Brigitta'.
- Held without photos: Salvia × jamensis Magical® Mississippi, Goeppertia lietzei 'Stella'.
  The Goeppertia had two corrections: `H1A` → `H1a` (the only form the validator
  accepts), and peak "Year-round foliage" → `Jan-Dec` (a peak with no month in it
  renders a blank season row; PLANT-BRIEF.md says to use Jan-Dec).
- Not used: the first photo in the drop was byte-identical to the Rose Crystal photo
  already dealt. `unassigned-light-violet-aster.jpg` (2026-09-23 16:18) is kept for the
  Alpha Light Purple decision and is not on any card.

**Decisions applied (Oscar: "go do everything"):**
- Alpha Light Purple: the dealt card `Aster 'Alpha Light Purple'` was replaced in place by
  Oscar's new JSON as `Symphyotrichum dumosum Alpha® Light Purple` (same conventions). Its
  existing photo moved with it (photo and card file renamed, CREDITS entry updated). The
  light-violet photo in this folder is still unused.
- Rose Crystal: `visual` rewritten to match the photo (vivid violet-magenta, semi-double),
  and hue changed from 335 to 300.
- Brigitta's peak stays Aug-Sep (VQ 91). The honey-fungus pest ratings (VQ 85) are unchanged.
