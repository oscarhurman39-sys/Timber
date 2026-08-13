# Handoff prompt — deal the held cards from photographs

Copy everything below the line into a fresh Claude Code session on the Timber repo.

---

You are working on **`oscarhurman39-sys/Timber`**, branch
**`claude/plant-build-timber-6ta360`**. Read `README.md`, `PLANT-BRIEF.md` and
`VERIFY-QUEUE.md` before you change anything.

## The job

I have a folder of plant photographs. Some filenames name the exact plant or
species; others don't. **Match them to the cards that are already built and
waiting for a photo, then deal those cards.** The card data is done — this is
photo work, not research work.

## Where things stand

- **129 cards dealt** (in the `PLANTS` block of `timber.html`) — do not touch these
- **55 cards fully researched and held** (`PLANTS_ON_HOLD`) — every one of them is
  complete except for a photograph. That is the only thing keeping them out of
  the deck.
- **153 photos** in `photos/`, one provenance record each in `photos/CREDITS.json`
- Exactly **1 of the 55 held cards already has a photo file** (*Primula vialii*) and
  it is held deliberately — see VERIFY-QUEUE item 4. Don't deal it.

## How a card finds its photo

`timber.html` derives the filename from the latin name. There is no lookup table:

```js
const slugLatin = l => l.normalize('NFD').replace(/[̀-ͯ]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
// card face:  photos/<slug>.jpg
```

So `Betula utilis subsp. jacquemontii 'Doorenbos'` must be saved as
`photos/betula-utilis-subsp-jacquemontii-doorenbos.jpg`. Generate the exact
expected filename for every held card first, rather than guessing:

```sh
node -e "
const fs=require('fs');const {readHold}=require('./tools/plant-data.js');
const slug=l=>l.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+\$/g,'');
readHold(fs.readFileSync('timber.html','utf8'))
  .forEach(p=>console.log(slug(p.latin)+'.jpg\t'+p.latin));
"
```

**The single most important trap:** the `<img>` carries an `onerror` that hides
the element. A misnamed or missing photo does **not** throw, does **not** fail a
test, and does **not** look broken — the card just renders with no picture. Verify
by filename equality against the list above, never by eye.

## Dealing a card

1. Put the image at `photos/<slug>.jpg`
2. Record provenance — this is not optional, `tools/photo-credits.js --check` runs
   in the test suite and the deck has already had two AI-generated images slip in:
   ```sh
   node tools/photo-credits.js --set <file> --source oscar --licence "own photo" --author "Oscar Hurman"
   ```
3. Set that card's `held` column to `0` in `plants.csv`
4. `node plants-tool.js check` then `node plants-tool.js import`
5. `node tests/run-all.js` — 14 checks, about 2m40s. `--fast` runs the 5 data
   checks only (under a second) and is fine while iterating.
6. `node tools/build-stamp.js --write` before committing, or `build-stamp` fails

## Rules

- **Never rename a plant to match a filename.** If a file is called
  `japanese-maple.jpg` and no card matches, that is an identification question
  for me, not a naming decision for you. Ask.
- **Never invent a card, a fact or a licence.** An unknown licence recorded as
  unknown is correct; an invented one is a liability.
- **Check provenance on every image before it lands.** Two have already come in
  synthetic or AI-edited — one carried a C2PA manifest naming the OpenAI Media
  Service, one had a visible AI watermark burned into the pixels. Read the C2PA /
  IPTC `digitalSourceType` and the EXIF, and say plainly what you find. Flag
  anything under **1200px wide** (house standard) and anything
  `trainedAlgorithmicMedia` or `compositeWithTrainedAlgorithmicMedia`.
- **Only Playwright/headless Chromium is available for image work** — no PIL, no
  ImageMagick. `NODE_PATH=/opt/node22/lib/node_modules` is required for playwright.
- **Report ambiguity instead of resolving it.** A confident wrong match is much
  worse than a short list of "these three could be it".

## Work order I'd suggest

1. List the held cards and their expected filenames
2. Bucket my photos: exact filename match · confident identification · unsure
3. Show me the buckets **before** moving any file
4. Deal the exact and confident buckets, provenance included
5. Give me the unsure ones as a numbered list with what you think each is and why

## Known loose ends — aware of, not yours to fix

- `Malus 'John Downie'` was never researched (the dump supplied 'Evereste'
  instead, which is a different plant and was correctly not built)
- `Hypericum × inodorum` MAGICAL series is missing from the research entirely
- The card schema carries no `toxicity` or `compliance` field, so 26 safety notes
  and 2 legal ones — including *Rhododendron luteum*'s Schedule 9 listing — live
  only in `data/incoming/wishlist-batch-01.json`. Schema change, queued.
- `seasonalImpact` is blank on all cards by design
- Do not open a pull request unless I ask
