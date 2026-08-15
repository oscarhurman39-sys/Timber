#!/usr/bin/env python3
# Keys Oscar's two real gloss reference images (chat upload, 2026-08-14) to
# true alpha: pulls out the rainbow streaks and star glints, drops both the
# near-black fill and the pale lavender field around them, so what lands on
# the card is the shine itself rather than a rectangle of someone else's
# background colour.
#
# Neither plain luminance-alpha nor plain saturation works for these: the
# pale lavender surround is bright AND mildly saturated (soft-focus bokeh in
# the source photo), so either trick keys it in solid alongside the actual
# streaks — measured as ~30% alpha across supposedly-empty background before
# this settled on local CONTRAST instead: a streak or star is brighter than
# its own immediate neighbourhood; the slow pastel gradient, by construction,
# is not. Two blur radii (streak shafts are broad, sparkles are tiny) each
# comparing a pixel to its own local blur, so a smooth field cancels to near
# zero everywhere regardless of its base brightness or hue.
#
# Source lives outside the repo (Oscar's raw chat attachments). Run once:
#   pip install pillow numpy scipy
#   python3 tools/key-maria-gloss.py <src1.png> <src2.png>
# Output: art/holo/maria-gloss-1.png, art/holo/maria-gloss-2.png (RGBA
# masters; optimise-art.js derives the .webp Timber actually loads).

import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

DEFAULT = [
    '/root/.claude/uploads/0093e2fd-e8e7-5928-87f7-111a974c4d2d/fae88999-1000049067.png',
    '/root/.claude/uploads/0093e2fd-e8e7-5928-87f7-111a974c4d2d/c6242b2b-1000049071.png',
]

def key(src, out):
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.float64) / 255.0
    lum = a.mean(axis=2)

    # a hard floor BEFORE any saturation math: the source's own dark region
    # (a silhouette/vignette in both uploads, not near-zero-noise) is not
    # exactly RGB 0 — (mx-mn)/mx on tiny near-equal channels amplifies
    # compression noise into spurious high "saturation" there. Measured on
    # both uploads: the dark region sits at lum 0.005-0.17; gate it out
    # before computing anything so no fog can survive from it.
    lum_s = gaussian_filter(lum, sigma=1.4)                     # denoise first
    gate = np.clip((lum_s - 0.05) / (0.24 - 0.05), 0, 1)
    gate = gate * gate * (3 - 2 * gate)                          # smoothstep

    amb_wide = gaussian_filter(lum, sigma=40)                    # streak shafts vs the slow pastel field
    amb_narrow = gaussian_filter(lum, sigma=6)                   # sparkle cores vs their immediate ring
    streak = np.clip((lum - amb_wide) * 6.5, 0, 1) * gate
    glint = np.clip((lum - amb_narrow) * 9.0, 0, 1) * gate
    alpha = np.clip(np.maximum(streak, glint) ** 0.8, 0, 1)

    safe_a = np.maximum(alpha, 0.04)
    rgb = np.clip(a / safe_a[..., None], 0, 1)
    rgba = np.dstack([rgb, alpha])

    out_im = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')
    out_im.thumbnail((700, 1050), Image.LANCZOS)
    out_im.save(out)
    print(out, out_im.size, f'mean alpha {alpha.mean():.3f}')

if __name__ == '__main__':
    srcs = sys.argv[1:] or DEFAULT
    for i, s in enumerate(srcs, 1):
        key(s, f'art/holo/maria-gloss-{i}.png')
