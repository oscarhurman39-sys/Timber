# Timber 🌳

**Tinder for plants.** Grow your knowledge, one swipe at a time.

A progressive web app that teaches garden-centre staff the key details of plants through a
swipe-card interface — and gets them accurate info fast when a customer is standing in front
of them.

**This repository contains only the customer-facing swipe-card application.** Its entry
point is `timber.html`; `index.html` redirects to it.

## Not to be confused with Plantatron

The employee-facing command-centre dashboard — Customer Match, Today, Plant Intelligence,
Team Learning, Curator Queue and Value Proof — is a **separate product in a separate
repository**: [Plantatron](https://github.com/oscarhurman39-sys/plantatron). It was
developed here for a while and moved out on 2026-07-28.

| | Timber (here) | Plantatron |
|---|---|---|
| Audience | Customers and floor staff learning plants | Employees running the centre |
| Product | Swipe-card plant discovery app | Command-centre dashboard |
| Entry point | `timber.html` | `index.html` |
| Storage keys | `timber-progress-v1`, `timber-quiz-v1` | `plantatron.demo.*` |

The two may later share plant data or schemas, but they are separate applications with
separate deployments. Neither imports the other, and neither is served from the other's
routes. **Never replace `timber.html` with a dashboard file** — that instruction appeared in
an old Command Centre handoff document and would destroy this app. The mixed pre-separation
state is preserved on the `backup/mixed-timber-plantatron` branch.

## Adding a plant

Per-plant work is data, not design. See **`NEW-SESSION.md`** for the routine and
what to paste into a fresh chat (short version: the plant JSON + your photo, and
nothing else — not the design docs).

| File | Purpose |
|---|---|
| `PLANT-BRIEF.md` | Paste into ChatGPT/Gemini; produces a plant JSON in our exact schema |
| `tools/check-plant-json.js` | Validates that JSON and prints the row to paste in |
| `CARD-STATS.md` | Rating scales, hardiness table, compass rule |
| `CARD-BACK.md` | Card-back spec + per-plant question checklist |
| `CARD-PROTOCOL.md` | Layout authority + full decision changelog |
| `VERIFY-QUEUE.md` | Card facts that need a horticultural call, and why |
| `tests/run-all.js` | One command for every check — run it green before pushing |

```sh
node tools/check-plant-json.js my-plant.json    # errors out rather than guessing
node tests/run-all.js                           # everything, one command
```

## Use it

- **Serve the repo, don't open the file.** `timber.html` loads `art/` and `photos/` over HTTP, so
  `file://` gives you a card with no frame and no photos. Any static server works:
  `python3 -m http.server 8477`, then open `http://localhost:8477/timber.html`.
- Hosted over HTTPS (e.g. GitHub Pages), it's installable as a PWA and works **offline** after
  the first visit (`sw.js` caches the app shell).

### Publishing

The live app is <https://oscarhurman39-sys.github.io/Timber/>. **`claude/timber-plant-pwa-j69h5e`
is the live branch** — whatever is on it is what the world sees.

Publishing is **one command**, from a session or anywhere else:

```sh
node tests/run-all.js --jobs 3                                    # full gate first, 14/14
git push origin HEAD:refs/heads/claude/timber-plant-pwa-j69h5e    # this deploys
```

That push triggers the workflow on its own — verified on 2026-08-10, run #21. Nothing else is
needed; no merge, no dispatch, no button.

Because it is a plain `git push` it is fast-forward-only: if the live branch has moved on, the
push is rejected rather than rewriting what is live. That is the whole safety mechanism, and it
is enough.

**Work on a feature branch does not deploy, and must not be assumed to.** A push to
`claude/plant-card-database-oismvy` on 2026-08-10 created no workflow run at all even with a
`claude/**` trigger in the pushed file, and a manual dispatch aimed at that branch failed in two
seconds with no step logs and no annotation — the shape of the `github-pages` environment
refusing a non-default branch. Neither cause was pinned down, so **do not build anything on a
theory of why**. The one thing established by evidence is the line above: fast-forwarding the
live branch publishes. If you need the deploy re-run without a new commit, dispatch
*Deploy to GitHub Pages* on the live branch from the Actions tab.

Once dispatched, the workflow runs the five data checks, deploys, and then **verifies the bytes
actually served** match this commit's build stamp before going green — so a green run means live,
not "probably live".

**On a phone, expect the old version for one load.** That is the service worker doing
stale-while-revalidate: it fetches the new shell in the background and posts `timber-updated`,
which raises the *Update ready · tap to refresh* pill. The second load is current, or the first if
the pill is tapped. The build number in the menu foot is the ground truth for which version a
device is actually running.

Before 2026-08-10 the workflow was pinned to two hard-coded branch names and nobody published
anything by pushing: all 19 deploys up to that date came from one branch that had to be
fast-forwarded by hand, which is why the ledger repeatedly records finished work sitting
unreleased for days.

### Publishing a standalone copy

To share Timber as one file with no server — a Claude Artifact, an email attachment, a USB stick —
build it:

```sh
node tools/build-standalone.js        # -> dist/timber-standalone.html (~3.7MB)
```

That re-encodes `art/` and `photos/` to WebP and inlines every one of them as a `data:` URI, so the
output has no external requests at all. **Always publish the build output, never a hand-edited
copy** — the repo is the source of truth, and editing a published copy directly is how the app and
the repo fork. If they do drift, reconcile back into the repo first, then rebuild.

## How it works

| Action | Result |
|---|---|
| Swipe right / tap ★ | Plant marked **LEARNED** (gold stamp), starred count +1 |
| Swipe left / tap ✕ | Plant **skipped** (red stamp), not counted |
| ↺ | Undo the last swipe (corrects the count) |
| Double-tap a card | Flip to the **Buyer Trade Sheet** (prices, margin, order weeks, risk) |
| Tap the back | Flip back — swiping is locked while flipped |
| 🔍 top right | **Search** — common/latin/cultivar/use, typo-tolerant ("choysia" finds Choisya); exact matches always rank above fuzzy ones. Arrow keys walk results; recently-viewed chips resurface till lookups; info sheets show the plant photo, a 12-month peak strip and a Share button (where supported) |
| 👥 Show customer | From a search result: big plain-language view with retail price only — safe to hand over |
| 🔊 next to latin name | Speaks the latin name aloud (built-in speech engine, Italian phonology; no files, works for every plant you add). Hidden on devices without speech support |
| ☰ menu | Learned count, Dictionary mode, **Quiz mode**, **Review due** (spaced repetition), **My progress** (stats), **Filter deck** chips, Install app, Reset progress |

**Spaced repetition:** every swipe schedules the plant in a Leitner box (`timber-srs-v1`,
keyed by latin name so it survives deck changes). Learn = box up, next review 1/3/7/16/35
days out by box; skip or a wrong quiz answer = back to box 1, due tomorrow. "Review due (N)"
in the menu opens a due-only deck; swipes there update the schedule but never touch your
saved full-deck progress, and it drops back to the full deck when the last due card is swiped.
Resetting the deck keeps review history.

**Quiz v2:** rounds mix three types — classic clue→name, reverse (common→latin) and trade
(unique retail price→plant); the answer plant is picked weighted toward your weakest
(lowest review box). Closing the quiz shows a session summary ("7/9 · weakest: X").
A question is only asked when its shown value is unique to one plant — never ambiguous.

**Filter deck:** chips discovered from the data at runtime — "In season now" (peak months
vs today), "Order in next 4 wks" (order week vs current ISO week), type category and
hardiness. Filters are ephemeral views: swipes update review scheduling but your saved
full-deck progress is untouched, and clearing the chip restores the deck exactly.

Progress (learned/skipped/undo history) and your best quiz streak persist in the browser via
localStorage — closing the app doesn't lose them. "Reset progress" / "Reset deck" clears the deck
state; adding or changing plants in `PLANTS` automatically starts a fresh deck.

## Files

- `timber.html` — the whole app: markup, styles, data, logic, inline PWA manifest. No frameworks.
  Needs `art/` and `photos/` alongside it, so it must be served rather than opened as a file.
- `art/`, `photos/` — the card artwork and plant photography `timber.html` loads at runtime.
- `tools/build-standalone.js` — inlines those assets into `dist/timber-standalone.html`, the
  single-file build to publish. Not needed for local development.
- `sw.js` — service worker (offline app-shell cache when hosted).
- `index.html` — redirect so the site root opens the app.

## Adding plants

Append objects to the `PLANTS` array in `timber.html`. Keep the exact field names
(`common, latin, hue, visual, water, aspect, soil, prune, source, peak, order, bench, root,
trade, retail, margin, type, shrink, returnRisk, pots, cvs, hardiness, resilience, uses, size`).
`hue` (0–360) sets the card's colour.

## Scaling the plant list (no hand-editing)

```
node plants-tool.js export   # dumps ALL plants (dealt + on-hold) to plants.csv
node plants-tool.js check    # validates the csv and shows what an import WOULD change
node plants-tool.js import   # writes it back into timber.html
```

The importer enforces the locked schema hard: only the locked columns, identity and
hardiness required, hue 0–360, ratings in range, no duplicate names across dealt and
held together. **It never invents values** — a missing cell is an error naming the row
and field, not a default. On import the app auto-detects the changed list and starts a
fresh deck (saved progress can't go stale). Timestamped backups go to `.backups/`
(gitignored, last 20 kept).

It also refuses to lose anything:

- The csv carries a **`held`** column and round-trips `PLANTS_ON_HOLD` as well as the
  deck. Before 2026-08-09 export could not see the hold block at all, so an
  export/import cycle deleted every held plant.
- If a card carries a field the csv has no column for, the tool **stops** rather than
  dropping it. `sunMin` — live on 132 cards — was missing from the column list, so one
  import would have wiped it deck-wide.
- An import that would **remove** a plant present in `timber.html` but absent from the
  csv refuses to run without `--allow-removals`.
- After writing, it re-parses the result and rolls back if the file no longer reads.

## Checking nothing has been lost or gone wrong

```
node tests/run-all.js --fast     # the four data checks below, ~2s, no browser
node tests/run-all.js            # the above plus all nine browser suites
node tools/install-hooks.js      # run the fast checks automatically before every push
```

| Tool | Answers |
|---|---|
| `tools/data-audit.js` | Do the deck, the hold block, `plants.csv` and `photos/` still agree? `--history` replays every commit and reports any card that ever vanished. |
| `tools/plant-sense.js` | Does any card contradict **itself** — prose saying drought-tolerant against a high thirst rating, a margin its own prices can't reach, a "dwarf" at 4m? |
| `tools/build-stamp.js` | Does the build number in the menu foot actually match the app's content? `--verify <url>` compares a deployed page's bytes. |
| `tools/template-geometry.js` | Have the card's overlay anchors drifted? `--reflow <px>` recomputes them all for a new card height. |
| `tools/deck-diff.js` | What plant data actually differs between two branches or commits? Semantic, not textual. |

Open questions these turned up that need a horticultural call live in
[VERIFY-QUEUE.md](VERIFY-QUEUE.md). Deliberate card renames are recorded in
`data/renames.json` so a rename never looks like a loss.

## Finding real, licence-safe plant photos

```
node plant-images-tool.js search "Nandina domestica"   # writes plant-images/.../candidates.html — open it, look
node plant-images-tool.js pick "Nandina domestica" 2    # downloads candidate #2 + its licence record
```

Queries Wikimedia Commons (which only hosts content free for reuse, including
commercially — non-commercial-only licences aren't accepted there at all). `search`
never auto-picks anything; it hands you a visual gallery with licence + credit per
image so you confirm it's actually the right plant before anything gets saved. `pick`
downloads the chosen image plus a `credit.json` recording the licence, author, source
URL, and the date — your permanent record, independent of whether the source page
still exists later (Creative Commons licences are irrevocable for a copy you've
already obtained).

### Photo provenance

**Oscar took every photograph in `photos/` himself** (established 2026-08-09). They
are his own work and his to use, commercial use included. `photos/CREDITS.json`
records that, one entry per image.

This section previously said the opposite — that 146 photos had "unverified
provenance" because `plant-images-tool.js` had fetched them from Wikimedia and
written the `credit.json` records into gitignored `plant-images/`. That inference
was wrong on the facts, and it is worth writing down why so it isn't re-derived:

- **the downloader has never been run.** It needs network access the build
  container did not have — this README says so a few paragraphs below.
- **`plant-images/` was never committed because nothing was ever downloaded.**
  The missing paperwork was read as "lost"; it never existed.
- **`CARD-PROTOCOL.md`'s photo register describes ~100 of these images in detail
  and never once records an external source** — every one is a "real photo", a
  "real garden shot", or a cutout/composite made from Oscar's own shots.

EXIF cannot settle it either way: `add-plant.js` re-encodes every photo through a
canvas, which strips all metadata. The evidence above and Oscar's own account are
what the record rests on, which is the right basis — the owner saying where his
photos came from beats a tool inferring it.

```sh
node tools/photo-credits.js            # coverage report
node tools/photo-credits.js --check    # fails if a photo has no entry (part of run-all)
node tools/photo-credits.js --set <file> --source oscar --licence "..." --author "..."
```

**Two images are AI-generated rather than photographed**, and they are the only
open question: `reynoutria-japonica.jpg` (Japanese Knotweed — Oscar generated it
with ChatGPT and Gemini) and `ajuga-reptans-burgundy-glow.jpg` (cropped from an
AI-remade card image, protocol v12.5). Both are marked
`commercialUseCleared: false`, not because anything is wrong with them but because
output rights for AI images depend on the generators' terms and nobody has checked
those. Every actual photograph is cleared.

⚠ **Do not run `--init` to "refresh" this file.** It re-derives each photo's origin
commit from `git log --all`, so its output changes depending on which remote
branches happen to be fetched locally — one run rewrote 56 unrelated records that
way. Use `--set` for individual entries.

**This tool needs an internet connection to run** (unlike everything else here) and
has not yet been run against the live API — Wikimedia isn't reachable from the
environment that built it. First run is the real test: if `search` for a common plant
comes back with zero results, something in the request needs fixing before trusting
it further. Downloaded photos aren't wired into `timber.html` yet — that's a separate
step once a batch of images has been chosen. The inline-vs-separate question is settled:
photos live as separate files under `photos/`, named `<latin-slug>.jpg`, and only
`tools/build-standalone.js` inlines them, so the source stays diffable and the file size
cost lands on the build output alone.
