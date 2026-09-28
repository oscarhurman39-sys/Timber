# Google Play wrapper (Trusted Web Activity)

Timber ships on Play as a TWA: a thin Android app that opens the live PWA at
https://plantcards-app.github.io/Timber/timber.html in full-screen Chrome.
Updating the app is just deploying the PWA — the Play listing only needs a new
upload when the wrapper itself changes (package name, icon, splash, min SDK).

## What is in the repo already

- `manifest.webmanifest` — static copy of the manifest `timber.html` builds
  dynamically. Bubblewrap and PWABuilder need a fetchable URL; the in-page
  `data:` manifest stays as-is (tests/app-test.js asserts on it).
- `art/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` — plain
  resizes of `art/app-logo.png`. The 512 also serves as the Play listing icon.

## What is NOT decided yet (Oscar)

- **Display name** on Play: **Plant Cards** (Oscar, 2026-09-28 — "gets the
  general idea across as quickly as possible, could always rebrand to Timber
  once it's going well"). `manifest.webmanifest` carries that name; the in-page
  manifest and the browser-installed PWA still say Timber.
- **Package name**: `com.scionstudios.plantcards` — permanent once published. Must not
  reference Knights or Oscar's surname (Oscar, 2026-09-28: the package name is
  public — it sits in the Play Store URL `play.google.com/store/apps/details?id=…`,
  in Android's app-info screen and in `assetlinks.json`). No domain ownership is
  needed for a reverse-domain package name. A later rebrand to Timber changes
  only the display name, never the package.
- **Publisher identity**: Scion Studios (Oscar, 2026-09-28). The repo moved to
  the `plantcards-app` GitHub organisation so the site origin is
  `plantcards-app.github.io`, and the Play developer name + contact email are
  the Scion Studios ones. Nothing public carries Oscar's surname.

## How the bundle is built (working since 2026-09-28, run #3)

`.github/workflows/play-bundle.yml` — Actions tab → "Build Play Store bundle"
→ Run workflow. About two minutes. It runs Bubblewrap on a GitHub runner
(JDK 17 + Android SDK are already there; the Claude cloud container cannot
download them). Outputs are run artifacts:

- `play-bundle` — `app-release-bundle.aab` (upload this to Play) and the
  signed `.apk` (sideload it on a phone to test).
- `upload-keystore` — only when no `PLAY_KEYSTORE_B64` secret exists: the
  freshly generated upload keystore + `PASSWORD.txt`.

**Do this once, before the second build:** download `upload-keystore` from
run #3 (the run whose .aab went to Play), keep both files somewhere safe,
then add two repository secrets (Settings → Secrets and variables → Actions):

- `PLAY_KEYSTORE_B64` = the keystore file base64-encoded
  (`base64 -w0 upload.keystore` on Linux/Mac, or any base64 tool)
- `PLAY_KEYSTORE_PASSWORD` = the password from PASSWORD.txt

Without the secrets every run mints a new key, and Play rejects a bundle
signed with a different upload key once the first one is registered. If the
key is lost, Play Console → App integrity → "Request upload key reset".

Each Play upload needs a higher `appVersionCode`: either bump it in
`play/twa/twa-manifest.json` or type it into the workflow's `version_code`
box when running it.

## Remaining steps

1. Play Console → Create app: name **Plant Cards**, default language
   English (UK), app, free. Set the public developer name to Scion Studios
   under Account details first.
2. Testing → Closed testing → create a track, upload `app-release-bundle.aab`,
   add testers (email list). Personal accounts created after 13 Nov 2023
   need 12 testers opted in for 14 days before production unlocks.
3. Play Console → Test and release → App integrity → copy the **App signing
   key certificate** SHA-256 (Play re-signs the app, so this is NOT the
   upload key's fingerprint printed in the workflow log).
4. Put it in `.well-known/assetlinks.json` on the deploy branch:
   ```json
   [{"relation":["delegate_permission/common.handle_all_urls"],
     "target":{"namespace":"android_app","package_name":"com.scionstudios.plantcards",
     "sha256_cert_fingerprints":["<SHA256 FROM STEP 3>"]}}]
   ```
   Without it the app opens with a Chrome URL bar instead of full screen.
5. Listing needs: 512×512 icon (`art/icons/icon-512.png`), 1024×500 feature
   graphic, at least 2 phone screenshots, privacy-policy URL, content rating
   questionnaire, data-safety form (Plant Cards stores progress in
   localStorage only — no accounts, no analytics).
