# 2026-10-02d — three second frames for Honeysuckle 'Rhubarb and Custard'

Oscar, late on 2026-10-02: "Some flash between images for the clements rhubarb and custard" — the dealt
`Lonicera periclymenum 'Rhubarb and Custard'` card (the "clements" is a slip; the photos are the
honeysuckle). No JSON came with them, so nothing on the card changes: under the standing protocol a photo
for a card that already has one is a flash-between, never a replacement and never a question.

Three photos, all his own, no AI or C2PA markers, originals here byte-identical to the files he sent:

| file | as sent | frame | what it shows |
|---|---|---|---|
| `rhubarb-and-custard-1-flowers.jpg` | Galaxy S24, 2026-09-26 17:12, 4000x3000 landscape | `-flowers` | open flowers: raspberry-pink tubes with cream lips rolled back, long cream stamens, rain drops; a cane through the frame |
| `rhubarb-and-custard-2-buds.jpg` | Galaxy S24, 2026-09-26 17:13, 4000x3000 with EXIF orientation 6 | `-buds` | a whorl of deep raspberry buds radiating from the stem tip before they open, over a leaf pair and a cane |
| `rhubarb-and-custard-3-leaves.jpg` | collage-app crop, 2160x3840, no camera EXIF | `-leaves` | glossy paired leaves in the foreground, the flowers soft behind |

Added with `tools/add-swap.js "<latin>" <photo> --as <suffix> --note "…"` three times: the first run
created the `PHOTO_SWAP` entry, the next two appended to it (`alts:[…]`, focus 50% 45%, hold 3.5s), so the
card now cycles through four frames — the original master and these three. CREDITS entries written by the
tool with the note; `check-boot` run by the tool after each; restamped after the third.

The card's text says "fragrant pink flowers ageing custard-yellow"; the shots show exactly that stage
range, buds to cream-lipped open flowers. Bench photos from 26 September, inside the Jun-Sep band; no
text or rating was changed.

## Viburnum davidii — photo replaced

Oscar, same evening: "Replacement photo for viburnum davidii". Said in so many words, so this is the one case
where a photo is swapped rather than added (NEW-SESSION.md: replace only when Oscar says so — the Clematis
and Eve Price routine of 2026-10-01). `viburnum-davidii-replacement.jpg` here is his Galaxy S24 shot of
2026-09-29 11:34, 4000x3000 with EXIF orientation 6, no AI or C2PA markers, byte-identical to the file he
sent: glossy, deeply veined leaves with red stems and a pink-flushed new shoot at the centre, a brown old
leaf at the top right. Staged upright 1200x1600 through the same canvas pipeline as the bulk tool
(`stage-photo.js`), derivative rebuilt with `optimise-photos.js --only`, CREDITS note added. The previous
master — a 1200x1035 landscape shot from the 2026-09-13 deal (commit 80f7be2) — is retired and lives in git
history.

The old master needed a `PHOTO_FOCUS` override ('22% 55%', a landscape frame cropped into the portrait
well); the new one is portrait and frames whole at the default, so the override is removed. Card text and
ratings unchanged.
