#!/usr/bin/env python3
# Keys Oscar's real Listen-ring ornament (chat upload, 2026-08-15) to true
# alpha: strips the black background AND the flat navy pill fill, keeping
# only the art-nouveau silver/gold ring and its white halo — the ring is
# what wraps his own painted Listen pill; his pill must show through, not be
# covered by a second one.
#
# Source lives outside the repo, like the Avondale animation source zip: it's
# Oscar's raw chat attachment, not a working asset. Run once, from repo root:
#   python3 tools/key-maria-listen-aura.py /root/.claude/uploads/<session>/<file>.png
# Output: art/holo/maria-listen-aura.png (RGBA master; optimise-art.js derives
# the .webp Timber actually loads).
#
# Needs: pip install pillow numpy.

import sys
import numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else \
    '/root/.claude/uploads/0093e2fd-e8e7-5928-87f7-111a974c4d2d/fa906d87-1000049084.png'
OUT = 'art/holo/maria-listen-aura.png'

im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.float64) / 255.0
lum = a.max(axis=2)

# background: pure black -> distance from (0,0,0) is just luminance
bg_dist = lum
# pill: flat navy ~(34,60,96)/255, sampled from the source's own fill
pill_ref = np.array([34, 60, 96]) / 255.0
pill_dist = np.sqrt(((a - pill_ref) ** 2).sum(axis=2))

# keep = far from BOTH reference colours; soft-edged (smoothstep) so the
# ring's own anti-aliased edge against black stays anti-aliased, not jaggy
def smooth_keep(dist, lo, hi):
    t = np.clip((dist - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)

keep_bg = smooth_keep(bg_dist, 0.05, 0.16)
keep_pill = smooth_keep(pill_dist, 0.05, 0.15)
alpha = np.clip(keep_bg * keep_pill, 0, 1)

# unpremultiply: colour is only meaningful where alpha is non-trivial
safe_a = np.maximum(alpha, 0.04)
rgb = np.clip(a / safe_a[..., None], 0, 1)
rgba = np.dstack([rgb, alpha])

# trim to the ring's own bounding box (drop the fully-transparent margin the
# source canvas carries) so the master isn't mostly empty pixels
cols = np.where(alpha.max(axis=0) > 0.02)[0]
rows = np.where(alpha.max(axis=1) > 0.02)[0]
pad = 6
x0, x1 = max(cols[0] - pad, 0), min(cols[-1] + pad, a.shape[1] - 1)
y0, y1 = max(rows[0] - pad, 0), min(rows[-1] + pad, a.shape[0] - 1)
rgba = rgba[y0:y1 + 1, x0:x1 + 1]

out = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')
out.thumbnail((900, 900), Image.LANCZOS)
out.save(OUT)
print(OUT, out.size)
