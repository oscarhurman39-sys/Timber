# Timber — app / monetisation research brief

Researched 2026-08-06 at Oscar's request. **Revised 2026-08-19** — the deck has
since tripled (72 -> 217 dealt / 82 held) and the revision found something in the
data that changes the recommendation more than the card count does. Sections 4 and
5 are rewritten; 6, 7 and 8 are new. Facts are cited; judgement calls are labelled
`[Inference]` / `[Speculation]` / `[Unverified]`. Where the two routes (consumer app
vs B2B staff-training tool) differ, both are given.

Live deck: **https://oscarhurman39-sys.github.io/Timber/** — deploys from
`claude/timber-plant-pwa-j69h5e`. At revision: **217 cards dealt, 82 written and
held for photographs** (299 written in total).

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

## 4. How many cards? — REVISED 2026-08-19

Deck at revision: **217 dealt, 82 held, 299 written.** The 2026-08-06 answer set a
target of 200-400 for the B2B route. That target has been met at the low end, and
the honest conclusion now is that **card count stopped being the release blocker
somewhere around 150.**

- **Consumer/free release:** 217 is far past sufficient. Ship it.
- **Paid B2B pitch:** the claim that has to survive contact with a buyer is "covers
  what your staff actually get asked about". 217 cards of core UK shrubs and
  perennials does that. [Inference] Doubling to 400 does not make the pitch
  meaningfully stronger, because the marginal cards are progressively rarer plants
  that generate progressively fewer floor questions.

**Suggested release line: ~250 dealt** — that is roughly the 33 held cards whose
peak falls in the current or next photography window, and it clears the most
visible holes. Not 400. The remaining ~50 holds want May / March / November / June
visits and should not gate a release.

**What should gate release instead, in order:**

1. **The 82 held cards are holes, not backlog.** A card written but photo-less
   still answers a search with an incomplete card. That is more damaging in front
   of a customer than the plant simply being absent.
2. **The trade sheet is 1% populated** — see §6. This is the actual blocker.
3. **Season.** [Inference] Both halves of the market are seasonal: consumer
   gardening interest and garden-centre training/buying decisions concentrate
   Feb-May. A release that slips past roughly February 2027 loses a full year of
   the only window that matters. Fifty more cards are not worth that trade.

## 5. How much money could it make? — REVISED 2026-08-19

Scoped to the question actually asked: **one person, limited ad spend, no team, no
funding, selling around shop-floor shifts.**

Baseline reality, unchanged: the **median subscription app makes under $50/month a
year after launch; ~81% never cross $1k/month** (RevenueCat, 115k apps). Nothing
about a bigger deck moves an app out of that distribution.

### Consumer route

[Speculation] **£0-100/month.** Unchanged from 2026-08-06 and unchanged by the deck
tripling, because content volume was never the consumer constraint — distribution
is, and one person with no ad budget has none. Treat any consumer revenue as noise,
not as a plan.

### B2B route (garden centres), realistic solo ramp

[Speculation] at **£30-60/site/month**, which is where a solo unknown vendor can
credibly price:

| Period | Paying sites | Monthly gross |
|---|---|---|
| Months 1-3 | 0 (Knights pilot, unpaid) | **£0** |
| Months 4-9 | 2-6 | **£60-360** |
| Month 12 | 8-15 | **£250-900** |
| Months 18-24, optimistic tail | 20-35 | **£600-2,100** |

**The single honest headline: £0 for the first quarter, and £200-800/month at
month 12 is the realistic centre of the distribution.** Real money, not a salary.

Two things move it off that curve, in opposite directions:

- **Upward — a group deal.** UK multi-site operators (Blue Diamond, British Garden
  Centres, Dobbies) run dozens to 100+ sites each [Unverified — not checked at
  revision]. One 20-site group at £40 is **£800/month from a single sale**, which
  is the entire year-one solo grind in one contract. [Inference] It is also a
  6-12 month procurement cycle with a material chance of nothing, and it is the
  only realistic solo path above ~£2k/month.
- **Upward — per-seat instead of per-site.** A 40-staff centre at £5/head/month is
  £200/month from one site against £40 flat. [Inference] Same product, same sales
  effort, ~5x the revenue per close. This is a larger lever on monthly gross than
  doubling the deck, and it costs no build work — only a pricing decision.
- **Downward — churn after the novelty.** [Speculation] A training tool that staff
  stop opening after week three does not renew. The spaced-repetition loop and the
  search path (staff use it *with a customer in front of them*) are the defences,
  and the pilot is what tests whether they hold.

## 6. The finding that outranks card count

Audited at revision, across all 299 rows of `plants.csv`:

| Commercial field | Populated |
|---|---|
| `trade` | 3 / 299 |
| `retail` | 3 / 299 |
| `margin` | 3 / 299 |
| `order` | 3 / 299 |
| `bench` | 3 / 299 |
| `shrink` | 3 / 299 |
| `returnRisk` | 10 / 299 |

**The Buyer Trade Sheet — the one feature no free flashcard app can copy — is
populated on about 1% of the deck.** Everything else Timber does (swipe learning,
spaced repetition, quiz, plant search) is replicable by a generic flashcard app
with a plant CSV. Trade prices, margin, order weeks, bench time, shrink and return
risk are not, because they require someone who works the floor.

[Inference] This inverts the release priority. 82 more photographs improve a deck
that is already good enough to demo. Populating the trade sheet is what converts it
from *a nice plant-learning app* into *a thing a garden centre manager has a budget
line for*. It is also the justification for £30-60/site/month rather than the £3
a consumer flashcard app can charge.

**Caveat, stated once:** per `CARD-STATS.md` §8, those fields are Oscar's *real*
trade data. At 3 cards that is immaterial. Fully populated and sold to a second
centre, it ships one employer's buying prices and margins to a competitor. The fix
is structural, not editorial — per-tenant commercial data, with the shipped deck
carrying horticulture only. Worth deciding before the field gets filled, not after.

## 7. The name

`[Inference]` **"Plant Deck" is a better product name than "Timber" for the B2B
route,** for three reasons:

- "Timber" reads as wood, lumber or forestry to anyone who has not had the Tinder
  pun explained. A name that needs explaining is a tax on every cold pitch.
- "Deck" is already the project's own working vocabulary — the ledger tracks
  "deck 217, hold 82" — so the internal and external language finally agree.
- On an invoice to a garden centre, "Plant Deck" is self-describing. "Timber" is
  not.

Against it: "Plant Deck" is generic and hard to own in search or as a domain
[Unverified — availability not checked at revision]. That matters for the consumer
route and barely at all for B2B, where the buyer arrives via a conversation rather
than a search box.

**Recommended rename scope — display name only, not the repository:**

| Change | Do it? | Why |
|---|---|---|
| In-app title, menu, install manifest, pitch material | **Yes** | The whole benefit, none of the cost |
| `localStorage` keys (`timber-progress-v1`, `timber-quiz-v1`, `timber-recent-v1`, `timber-srs-v1`) | **No** | Renaming these **wipes every existing user's learned progress and SRS schedule**, including the Knights pilot users. Keep the keys, or ship a migration first |
| GitHub repo / Pages URL | **Not yet** | Changing it breaks the live URL and every already-installed PWA |
| `timber.html`, tool and test internals (~200 occurrences across ~25 files) | **Not yet** | Pure churn against a live deploy path |

[Inference] The clean version of the full rename is a custom domain, which the
2026-08-06 research already wanted for a different reason: §1 flagged that the
`github.io` project path makes Digital Asset Links awkward for Google Play
packaging. **One ~£10/yr domain purchase fixes the branding and the Play Store
blocker at the same time** — that is the moment to move the repo and the URL, not
before.

## 8. Next brick, if the goal is revenue

Not more cards. **Populate the trade sheet for the top ~30 sellers and put the
completed Trade Sheet in front of one garden-centre manager who is not Oscar's own
employer.** That single conversation prices the product, tests the only
non-replicable feature, and costs no build work. Everything in §5 is speculation
until it happens.

## Recommendation (one line)

[Inference] B2B staff-training is the route where every question above gets
easier — distribution (trade channels, not app stores), charging (invoices,
not IAP), card count (bounded by one shop's range), and revenue (tens of
customers, not tens of thousands). Validate with the centre Oscar already
stands in before packaging for any store.

**Revised 2026-08-19:** unchanged, and now sharper — the deck is big enough, the
name should become Plant Deck in display only, and the binding constraint is a
Trade Sheet populated on 3 cards out of 299.

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
