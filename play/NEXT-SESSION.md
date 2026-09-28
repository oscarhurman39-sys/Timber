# Handover: Play Store build session

Paste this file's "Prompt" section into the new Claude Code session, started
on repo **plantcards-app/Timber**, branch **claude/plant-card-database-7749ux**.

## Before starting the session

- Environment settings → Network access: allow `dl.google.com` and
  `api.adoptium.net` (Android SDK + JDK 17 downloads). Without these the
  build cannot run in the cloud container.
- Confirm the Claude GitHub App is installed on the `plantcards-app` org
  (done 2026-09-28).

## Decisions already made (do not re-ask)

| Item | Value |
|---|---|
| Play display name | Plant Cards (rebrand to Timber later is a listing edit only) |
| Package name | `com.scionstudios.plantcards` — permanent, never contains Oscar's surname or Knights |
| Publisher | Scion Studios — Play developer name and contact email use the Scion Studios Gmail |
| Site origin | `https://plantcards-app.github.io/Timber/` (repo transferred to the org; confirmed loading 2026-09-28) |
| Theme colour | `#0c1810` |
| Icons | `art/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` (plain resizes of `art/app-logo.png`, nothing AI-generated) |
| Static manifest | `manifest.webmanifest` at repo root (name "Plant Cards"); the in-page data: manifest stays untouched because tests/app-test.js asserts on it |

## State of the branches

- Feature branch `claude/plant-card-database-7749ux` carries the manifest,
  icons, `play/README.md` and this file. **It is not merged to the deploy
  branch yet**, so `manifest.webmanifest` is not live until the PR merges.
- Deploy branch `claude/timber-plant-pwa-j69h5e` — GitHub Pages deploys on
  push; the workflow's verify step prints the live URL it checked.
- Deck: 432 dealt, 76 on hold. Photo credits complete.

## Prompt

```
Repo plantcards-app/Timber, branch claude/plant-card-database-7749ux.
Read play/NEXT-SESSION.md and play/README.md first.

1. Merge the open PR from this branch into claude/timber-plant-pwa-j69h5e
   (Oscar says "merge" per PR — ask, then merge and watch the deploy).
2. Confirm https://plantcards-app.github.io/Timber/manifest.webmanifest is
   live (use the Pages workflow log or WebFetch — the container proxy
   blocks github.io directly).
3. npm i -g @bubblewrap/cli, then bubblewrap init with that manifest URL:
   package com.scionstudios.plantcards, app name "Plant Cards", theme
   #0c1810, start URL /Timber/timber.html, create a NEW signing keystore.
   Store the keystore + passwords OUTSIDE the repo and hand them to Oscar
   (losing them means a new package name forever).
4. bubblewrap build → app-release-bundle.aab. Send the .aab to Oscar.
5. After Oscar uploads to a closed-testing track and copies the App
   signing key SHA-256 from Play Console → App integrity, write
   .well-known/assetlinks.json (template in play/README.md step 6) on the
   deploy branch and push.
6. Listing assets still needed: 1024×500 feature graphic, 2+ phone
   screenshots, privacy-policy URL, data-safety answers (localStorage
   only, no accounts, no analytics).

Rules: reality filter (label [Unverified]/[Inference]), never guess, no
AI-generated images in the repo, no Knights or Oscar's surname anywhere
public, ask for photos in order 5 at a time when dealing cards.
```

## Known constraints

- Play personal accounts created after 13 Nov 2023 need a closed test with
  12 testers for 14 days before production. Start collecting testers now.
- Existing home-screen installs from the old `oscarhurman39-sys.github.io`
  address are dead; reinstall from the new origin. Progress does not carry.
- The Play developer name is public: set it to Scion Studios in Play
  Console → Account details before the first upload.
