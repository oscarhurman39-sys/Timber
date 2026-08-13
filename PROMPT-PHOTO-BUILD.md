# Photo-build handoff prompt

Paste the block below into a fresh Claude Code chat on this repo and attach the
photographs. It is written for the **live line**, `claude/timber-plant-pwa-j69h5e`.

> **A note on branches, because this bit has already gone wrong once.** An earlier
> version of this prompt targeted `claude/plant-build-timber-6ta360` and quoted
> 129 dealt / 55 held / 153 photos / build r17. That branch forked from the live
> line a long way back: as of 2026-08-13 live was **33 commits ahead of it** and
> carried **61 latins it does not have**, and the live build was **r42, not r17**.
> It also said PR #3 was unmerged; PR #3 merged on 2026-08-09 and its head commit
> is in live's history. Photo work done on that branch would be dealt onto a tree
> missing 61 cards, would not reach the phone, and would face an ugly merge.
>
> That branch does still hold real unmerged work — `PLANT-WISHLIST.md`,
> `RESEARCH-DUMP.md`, `data/incoming/`, `tools/fit-incoming.js`,
> `tools/ingest-batch.js`, `tools/unmapped-report.js`, `docs/atlas.html`,
> `docs/wishlist.html` — none of which exists on live. That is a separate porting
> job, and it is not this one. Conversely `tools/deal-plant.js` and
> `tools/photo-run.js`, which this prompt depends on, exist **only on live**.
>
> Do not trust the counts in this file either. The first instruction in the prompt
> is to recompute them, because they moved twice in a single afternoon.

---

```
Timber, on the live branch claude/timber-plant-pwa-j69h5e. Work on a feature
branch off it — never commit to the deploy branch directly, because every push
there deploys and a half-finished batch goes live.

Read README.md and NEW-SESSION.md first. The repo carries the layout, the rubric
and the protocol, so nothing needs pasting except the photographs. Do not paste or
regenerate the design docs.

FIRST, ESTABLISH THE STATE YOURSELF. Do not trust any count you were given,
including in this prompt:

    node tools/data-audit.js        # dealt / held / total, and photo agreement
    ls photos/*.jpg | wc -l

These numbers move every time a photo lands — they changed twice in one afternoon
recently. Report what you actually find before doing anything else.

THE JOB. I have a folder of plant photographs. Some filenames name the exact plant
or species; others do not. Match them to cards that are already built and sitting
in PLANTS_ON_HOLD, then deal those cards. The card data is done. This is photo
work, not research work — do not research, rewrite or "improve" any card.

HOW A CARD FINDS ITS PHOTO. timber.html derives the filename from the card's latin
name. There is no lookup table. This is the exact rule — use it, do not invent your
own; it reproduces the filename of every dealt card currently on disk:

    const slug = l => l.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

So Betula utilis subsp. jacquemontii 'Doorenbos' must be saved as
photos/betula-utilis-subsp-jacquemontii-doorenbos.jpg. Note it flattens curly and
straight apostrophes identically, so Erysimum 'Bowles's Mauve' and Erysimum
'Bowles's Mauve' produce the same file.

GENERATE THE FULL EXPECTED-FILENAME LIST FIRST, then match against it. Read the
hold block with tools/plant-data.js — it is the one reader, and nothing else should
parse timber.html.

THE SINGLE MOST IMPORTANT TRAP. The card's <img> carries
onerror="this.style.display='none'". A misnamed or missing photo does not throw,
does not fail a test, and does not look broken — the card simply renders with no
picture. VERIFY BY FILENAME EQUALITY AGAINST THE GENERATED LIST, NEVER BY EYE, and
never by "the card looked fine".

GENUS-LEVEL NEAR-MISSES ARE NOT MATCHES. Several Acers, Rhododendrons and Clematis
in the hold block are different species from one another. A filename matching only
a genus tells you nothing about which card it belongs to.

DEALING A CARD — one command per photo:

    node tools/deal-plant.js "<latin>" <photo> [--focus "50% 30%"]

It stages the photo at 1200px under the derived slug, lifts the row out of
PLANTS_ON_HOLD into PLANTS as matched text (so the card comes out byte-identical
apart from where it sits), and records provenance. Photo and html roll back
together if the result does not re-parse. If you ever have to do it by hand
instead: set that card's `held` column to 0 in plants.csv, then
`node plants-tool.js check` and `node plants-tool.js import`.

PROVENANCE IS NOT OPTIONAL. tools/photo-credits.js --check runs in the suite, and
two AI-generated images have already reached the deck. deal-plant.js writes the
entry; if you need to set one by hand:

    node tools/photo-credits.js --set <file> --source oscar \
      --licence "own photo" --author "Oscar Hurman"

Never invent a licence. An unknown licence recorded as unknown is correct; an
invented one is a liability. Do NOT run photo-credits.js --init — it re-derives
every record from git log and one run rewrote 56 unrelated entries.

CHECK EVERY IMAGE BEFORE IT LANDS. Read C2PA/IPTC digitalSourceType and EXIF. Flag
anything under 1200px wide, and anything marked trainedAlgorithmicMedia or
compositeWithTrainedAlgorithmicMedia. Say plainly what you find rather than
quietly proceeding. Only Playwright/headless Chromium is available for image work
— no PIL, no ImageMagick — and playwright needs
NODE_PATH=/opt/node22/lib/node_modules.

NEVER RENAME A PLANT TO MATCH A FILENAME. If a file is called japanese-maple.jpg
and no card matches, that is an identification question for me, not a naming
decision for you. Never invent a card or a fact.

REPORT AMBIGUITY INSTEAD OF RESOLVING IT. A confident wrong match is far worse than
a short list of "these three could be it". A Sarcococca was refused on 2026-08-11
for exactly this: the species was unclear and the deck's only Sarcococca card is
S. confusa, so filing it there would have been a guess — VERIFY-QUEUE item 21. That
same shot was also ~60% bare soil and roof tile, and the card's portrait crop would
have shown mostly soil. Reject a photo where the plant is not really the subject.

WORK ORDER — follow it in this order and stop at the checkpoint:
  1. list every held card and its expected filename
  2. bucket my photos into: exact filename match / confident identification / unsure
  3. SHOW ME THE BUCKETS BEFORE MOVING ANY FILE
  4. deal the exact and confident buckets, with provenance
  5. give me the unsure ones as a numbered list, with what you think each is and why

WHICH HELD CARDS ARE EVEN WORTH A PHOTOGRAPH:

    node tools/photo-run.js            # what is worth shooting this month
    node tools/photo-run.js --html     # phone sheet with ticks

Splits the hold block into SHOOT (peak covers this month), LOOK (off-peak, but the
card sells bark, stems, berries or evergreen — there whatever the month) and WAIT
(flowers, not out, with the month to come back). Its advice is a default, not a
rule: Corylus 'Contorta' is a WAIT card in August, its corkscrew stem photographed
fine, and it is dealt.

GATES:
    node tests/run-all.js --fast     # 5 data checks, under a second
    node tests/run-all.js --jobs 3   # all 14, ~2m40s — once before pushing
    node tools/build-stamp.js --write   # before committing, or build-stamp fails

Look at tools/last-added-card.png for anything newly dealt.

STANDING TRAPS:
- an empty card never sits in the deck; no photo means it stays held
- hardiness is the most error-prone field
- the photo must be the plant it claims to be
- seasonalImpact is blank on all cards by design — leave it

Do not open a pull request unless I ask.
```

## Known open items — not this session's job

Checked against the live line on 2026-08-13, because several items carried in the
older version of this prompt had already been closed there:

| Item | State on live |
|---|---|
| Malus 'John Downie' never researched | **Closed** — dealt |
| Malus 'Evereste' "correctly not built" | It **is** built, and held |
| Hypericum missing from research entirely | A Hypericum card exists, held |
| Primula vialii held with a photo already on disk | On live it has **no** photo file; it is an ordinary held card |
| No toxicity/compliance field in the schema | **Still open.** Rhododendron luteum and Rosa rugosa and Cotoneaster horizontalis carry Schedule 9 wording in `resilience`/`returnRisk` on the Gunnera precedent. Schema change, queued. |
