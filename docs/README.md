# docs/

Published pages. Each one is a self-contained HTML file with no external requests,
rendered as a private Artifact on claude.ai.

**Edit the file here and republish to the SAME url**, otherwise a second page gets
minted and the link you have already shared goes stale.

| File | Page | URL |
|---|---|---|
| `atlas.html` | Repository atlas — deck composition, the verification pipeline, where the weight sits, every known gap | https://claude.ai/code/artifact/86491165-c951-458c-977b-5081ce42780c |
| `wishlist.html` | 50 curated plants missing from the deck, with the one thing worth knowing about each | https://claude.ai/code/artifact/c6503139-805d-41c2-9ced-6d24279ab492 |

## Figures in the atlas

Every number was measured from the repo at build r21 on 2026-08-11, not estimated.
The measurements are reproducible:

```sh
node -e "const D=require('./tools/plant-data.js'),fs=require('fs');
  const h=fs.readFileSync('timber.html','utf8');
  const a=D.readDeck(h).concat(D.readHold(h));
  console.log('cards',a.length);"
node tools/plant-sense.js          # ratings coverage, contradictions
node tools/photo-credits.js        # provenance coverage
node tests/run-all.js --list       # the 14 checks
```

If the deck changes materially, the atlas figures go stale. It is a snapshot with
its date on it, not a live dashboard.
