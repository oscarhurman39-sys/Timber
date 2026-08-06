# Timber — app / monetisation research brief

Researched 2026-08-06 at Oscar's request. Facts are cited; judgement calls are
labelled `[Inference]` / `[Speculation]` / `[Unverified]`. Where the two routes
(consumer app vs B2B staff-training tool) differ, both are given.

Live deck: **https://oscarhurman39-sys.github.io/Timber/** — deploys from
`claude/timber-plant-pwa-j69h5e`; latest Pages run #11 green (2026-08-05).
Note: the wooden-edging fix (v12.5) is on `claude/timber-plant-card-edging-c661sc`
and is NOT live until that lands on the pwa branch.

## 1. How hard is it to turn this into an "app"?

Timber is already a PWA (installable, offline via service worker). Store
presence is packaging, not a rebuild:

- **Google Play — easy.** Package the PWA as a Trusted Web Activity with
  PWABuilder/Bubblewrap. Needs: $25 one-off developer account, a passing
  Lighthouse score, and a Digital Asset Links file served at the origin root.
  [Inference] our github.io project path makes assetlinks awkward — a custom
  domain (~£10/yr) is the clean fix and better branding anyway. Realistic
  effort: a weekend.
- **Apple App Store — the hard one.** Apple rejects bare "repackaged website"
  submissions (guideline 4.2 minimum functionality); a pure PWA wrapper is a
  known rejection. Route is a Capacitor wrapper plus enough native behaviour
  (offline bundle, notifications) to pass review. $99/every year, review-risk
  never zero. [Inference] days of work plus review roulette; do Play first,
  iOS only if demand shows up.
- **No store at all — easiest.** The PWA installs from the browser today.
  For B2B (staff phones at a garden centre) stores add nothing: send the link,
  "Add to Home Screen", done.

## 2. Advertising / getting users

- **Paid installs don't fit this product.** UK CPI benchmarks ~£1–2 on
  Android, more on iOS. [Inference] paid UA at those rates never pays back on
  a cheap niche app — this is why the big plant apps (PictureThis) are
  VC-scale subscription machines.
- **Organic consumer channels:** gardening TikTok/Instagram (the card art is
  genuinely shareable), Reddit r/GardeningUK, ASO on "plant flashcards".
  Slow, unpaid, unpredictable. [Speculation] hundreds of installs, not
  thousands, without a viral break.
- **Trade channels (fits the B2B route):** Garden Centre Association, garden
  trade press (HortWeek, Garden Forum), Glee trade show, and word-of-mouth
  between centres. The GCA already runs a staff e-learning platform (GROW) —
  that's validation that centres pay for staff training, and it's the
  competition to be sharper than.
- **The unfair advantage:** Oscar works on a shop floor. The first "user
  acquisition" is colleagues at Knights using it — which is also the proof
  screenshot every later pitch needs.

## 3. How easy is it to charge?

- **Web (no stores): easiest.** Stripe/Gumroad link, keep ~97%. No review, no
  store cut. Works today with the PWA.
- **Google Play:** paid-upfront listing is simple; in-app purchases inside a
  TWA need Play Billing via the Digital Goods API (PWABuilder supports it) —
  more plumbing. Store cut 15% under $1M/yr.
- **Apple:** 15% small-business cut, but you must be in the store first (see
  §1).
- **B2B invoicing: simplest of all.** A garden centre paying £X/month per
  site is an invoice or a Stripe subscription — no store involved at all.

Comparable price points: Anki mobile is a **$24.99 one-off** and funds the
whole project; PictureThis charges **~$30–40/yr** consumer; garden-centre
training courses run **£345+** (Horticultural Correspondence College).

## 4. How many cards?

Current deck: 72 plants, all gates green.

- **Consumer flashcard app:** content volume isn't the moat — polish and the
  learning loop are. 72 is already a real product.
- **B2B staff-training:** the claim that sells is "covers your shop floor".
  [Inference] a centre's plant area runs to a few thousand lines but queries
  concentrate on the core sellers; **200–400 cards** covers the plants staff
  actually get asked about (no solid published SKU figure found — Oscar's
  own centre is the best data source: count the core range). At the current
  pipeline rate that's the long pole, so the deck target should follow the
  route decision, not precede it.

## 5. How much money could it make?

Honest numbers first: the **median subscription app makes under $50/month a
year after launch; ~81% never cross $1k/month** (RevenueCat, 115k apps).
PictureThis-scale outcomes (~$5M/mo [Unverified — analytics-firm estimate])
are camera-ID apps with huge paid-UA budgets — a different game entirely.

- **Consumer route:** [Speculation] £0–100/month is the likely band for a
  niche paid flashcard app with no ad budget; a few hundred £/month if it
  finds an audience. Real but small.
- **B2B route:** [Speculation] at £20–50/site/month: 10 centres ≈
  £2.4k–6k/yr; 100 centres ≈ £24k–60k/yr. The UK has on the order of 2,000
  garden centres/nurseries [Unverified]; GCA membership is a concentrated,
  reachable slice. One pilot centre (Knights) is the harness-first
  validating step before any of this is real.

## Recommendation (one line)

[Inference] B2B staff-training is the route where every question above gets
easier — distribution (trade channels, not app stores), charging (invoices,
not IAP), card count (bounded by one shop's range), and revenue (tens of
customers, not tens of thousands). Validate with the centre Oscar already
stands in before packaging for any store.

## Sources

- https://www.mobiloud.com/blog/publishing-pwa-app-store
- https://web.dev/articles/pwas-in-app-stores
- https://blog.pwabuilder.com/posts/publish-your-pwa-to-the-ios-app-store/
- https://www.blog.udonis.co/user-acquisition/cost
- https://thesocialoutline.com/blog/mobile-app-cpi-benchmarks-2026
- https://www.flashcardslearn.com/en/blog/how-much-does-anki-cost
- https://identifythis.app/blog/picture-this-plant-identification-app
- https://dataintelo.com/report/plant-identification-apps-market
- https://fungies.io/indie-developer-market-analysis-2026/ (RevenueCat 2026 figures)
- https://www.hccollege.co.uk/index.php/course/garden-centre
- https://gca.org.uk/gca-grow-information/
