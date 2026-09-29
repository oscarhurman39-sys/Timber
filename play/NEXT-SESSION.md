# Handover: Play Store build session

Paste this file's "Prompt" section into the new Claude Code session, started
on repo **plantcards-app/Timber**, branch **claude/timber-plant-pwa-j69h5e** (the deploy branch).

## Before starting the session

- No network change is needed any more: the bundle is built by the
  `play-bundle` GitHub workflow on a GitHub runner, not in the Claude
  container. Run #3 on 2026-09-28 produced the first signed .aab.
- The Claude GitHub App is installed on the `plantcards-app` org (done
  2026-09-28); pushes and workflow dispatches work from a session opened on
  either repo name.

## Decisions already made (do not re-ask)

| Item | Value |
|---|---|
| Play display name | Oscar set the listing name to **Timber** on 2026-09-29 (the release is labelled "Plant Cards" internally; the launcher name in the bundle is still "Plant Cards" — a new build fixes that if he wants it to match). Changeable any time; only the package name is fixed |
| Package name | `com.scionstudios.plantcards` — permanent, never contains Oscar's surname or Knights |
| Publisher | Scion Studios — Play developer name and contact email use the Scion Studios Gmail |
| Site origin | `https://plantcards-app.github.io/Timber/` (repo transferred to the org; confirmed loading 2026-09-28) |
| Theme colour | `#0c1810` |
| Icons | `art/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` (plain resizes of `art/app-logo.png`). Oscar ticked the icon and feature graphic as AI-generated in Play's asset declaration on 2026-09-29, so the logo itself is; the no-AI-images rule is about plant photos |
| Static manifest | `manifest.webmanifest` at repo root (name "Plant Cards"); the in-page data: manifest stays untouched because tests/app-test.js asserts on it |

## State of the branches

- Feature branch `claude/plant-card-database-7749ux` carries the manifest,
  icons, `play/README.md` and this file. **It is not merged to the deploy
  branch yet**, so `manifest.webmanifest` is not live until the PR merges.
- Deploy branch `claude/timber-plant-pwa-j69h5e` — GitHub Pages deploys on
  push; the workflow's verify step prints the live URL it checked.
- Deck: 436 dealt, 76 on hold. Photo credits complete.
- `.well-known/assetlinks.json` is live on the deploy branch with the Play
  app-signing SHA-256 and the upload key; the Pages workflow verifies it is
  served on every deploy (run #122, 2026-09-29).

## Play Console state (2026-09-29, done from Oscar's phone)

- App created, package `com.scionstudios.plantcards`, developer name Scion Studios.
- Bundle v1 (workflow run #3) uploaded to closed track **"Testers"** (a second
  empty track "Alpha" exists; ignore it). Play App Signing on.
- Listing, all ten App content declarations, category, countries (UK) done.
- **Submitted for review 2026-09-29 13:55 BST** (submission 1: closed track,
  listing, app content, store settings). Check Publishing overview →
  Submission activity for the verdict; Google quotes up to seven days.
- **Testers not yet added.** 12 opted-in for 14 continuous days before
  production; the clock starts at the 12th opt-in.
- Upload keystore: `PLAY_KEYSTORE_B64` + `PLAY_KEYSTORE_PASSWORD` secrets
  verified working (run #4 restored the same key as run #3).

## Prompt

```
Repo plantcards-app/Timber, branch claude/timber-plant-pwa-j69h5e (the
deploy branch; open a feature branch off it and PR back, Oscar says "merge").
Read play/NEXT-SESSION.md and play/README.md first.

State: Play app created and bundle v1 on the closed "Testers" track; listing
and declarations filled; assetlinks.json live and verified. See "Play Console
state" above for what was mid-flight.

1. Ask Oscar what Submission activity says (in review / approved / rejected)
   and whether the 12 testers are added and opted in. Nothing on our side
   blocks either.
2. Any new bundle: bump version_code (v1 is used), run the play-bundle
   workflow, send the .aab. The launcher name is still "Plant Cards" while
   the listing says "Timber"; ask Oscar if he wants them to match before the
   next build.
3. Cards: deal from photos as before (data/held-photos/<date>/README.md is
   the record; conventions in the 2026-09-27b and 2026-09-29 READMEs).
4. After the 14-day test: Play Console -> apply for production access.

Rules: reality filter (label [Unverified]/[Inference]), never guess, no
AI-generated plant photos in the repo, no Knights or Oscar's surname anywhere
public, ask for photos in order 5 at a time when dealing cards.
```

## Known constraints

- Play personal accounts created after 13 Nov 2023 need a closed test with
  12 testers for 14 days before production. Start collecting testers now.
- Existing home-screen installs from the old `oscarhurman39-sys.github.io`
  address are dead; reinstall from the new origin. Progress does not carry.
- The Play developer name is public: set it to Scion Studios in Play
  Console → Account details before the first upload.
