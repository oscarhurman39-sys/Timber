# Google Play wrapper (Trusted Web Activity)

Timber ships on Play as a TWA: a thin Android app that opens the live PWA at
https://oscarhurman39-sys.github.io/Timber/timber.html in full-screen Chrome.
Updating the app is just deploying the PWA — the Play listing only needs a new
upload when the wrapper itself changes (package name, icon, splash, min SDK).

## What is in the repo already

- `manifest.webmanifest` — static copy of the manifest `timber.html` builds
  dynamically. Bubblewrap and PWABuilder need a fetchable URL; the in-page
  `data:` manifest stays as-is (tests/app-test.js asserts on it).
- `art/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` — plain
  resizes of `art/app-logo.png`. The 512 also serves as the Play listing icon.

## What is NOT decided yet (Oscar)

- **Package name** — permanent once published. Must not reference Knights.
  Candidates: `com.oscarhurman.timber`, `uk.co.oscarhurman.timber`,
  `app.timber.cards`. Bubblewrap `init` asks for it.
- **Display name** on Play — can differ from the web manifest's "Timber".

## Steps (once the package name is fixed)

1. `npm i -g @bubblewrap/cli` (needs JDK 17 + Android cmdline tools; Bubblewrap
   offers to download both on first run — the download hosts are
   `dl.google.com` and `api.adoptium.net`).
2. `bubblewrap init --manifest=https://oscarhurman39-sys.github.io/Timber/manifest.webmanifest`
   Answer: package name (above), app name, launcher name, theme `#0c1810`,
   start URL `/Timber/timber.html`, create a NEW signing key (keep the
   keystore + passwords somewhere safe; losing them means a new package name).
3. `bubblewrap build` → `app-release-bundle.aab` + `app-release-signed.apk`.
4. Play Console → Create app → upload the `.aab` to a **closed testing** track.
   Personal accounts created after 13 Nov 2023 must run a closed test with at
   least 12 testers for 14 days before production is unlocked.
5. Play Console → App integrity → copy the **App signing key certificate**
   SHA-256 (Play re-signs the app, so this is NOT the upload key's print).
6. Put it in `.well-known/assetlinks.json` on the deploy branch:
   ```json
   [{"relation":["delegate_permission/common.handle_all_urls"],
     "target":{"namespace":"android_app","package_name":"<PACKAGE>",
     "sha256_cert_fingerprints":["<SHA256 FROM STEP 5>"]}}]
   ```
   Without it the app opens with a Chrome URL bar instead of full screen.
7. Listing needs: 512×512 icon (`art/icons/icon-512.png`), 1024×500 feature
   graphic, at least 2 phone screenshots, privacy-policy URL, content rating
   questionnaire, data-safety form (Timber stores progress in localStorage
   only — no accounts, no analytics).
