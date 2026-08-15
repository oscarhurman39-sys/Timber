#!/usr/bin/env python3
# Stand-in "magical white" aura for Pretty Lady Maria's Listen pill.
#
# Oscar attached an ornament image in chat (2026-08-15): an art-nouveau silver
# filigree ring wrapping the blue Listen pill, to appear in place of the flat
# blue tap-flash. Chat attachments don't land on this container's filesystem,
# so this script builds a procedural stand-in with the same read: a glowing
# white stadium ring around the pill with wavy filigree-ish orbits and star
# glints. Output is TRUE-ALPHA RGBA (luminance keyed to alpha) because the
# deck bans mix-blend-mode — see the wispsHTML note in timber.html. His real
# ornament replaces the output file 1:1 with no code change, but must be
# keyed to alpha the same way first; its black chat ground would paint
# literally if dropped in raw.
#
# Output: art/holo/maria-listen-aura.webp (900x600 = the aura slot's 3:2).
# The pill sits centred in the slot at 64% x 37.5% — the geometry the FULLART
# aura rect was derived from; keep the two in step if either changes.
#
# Needs: pip install pillow numpy.  Run from the repo root.

import numpy as np
from PIL import Image

W, H = 900, 600
rng = np.random.default_rng(15)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
dx, dy = xx - W / 2, yy - H / 2

# stadium SDF of the pill: half-size 288x112.5, fully-rounded ends
bx, r = 288.0 - 112.5, 112.5
qx = np.maximum(np.abs(dx) - bx, 0)
sdf = np.sqrt(qx * qx + dy * dy) - r
theta = np.arctan2(dy, dx)

img = np.zeros((H, W, 3))

def ring(offset, sigma, col, gain):
    m = np.exp(-(sdf - offset) ** 2 / (2 * sigma * sigma))
    t = xx + yy
    for c in range(3):
        wave = 0.82 + 0.18 * np.sin(t / 210 + c * 2.1)
        img[..., c] += gain * m * (0.4 * col[c] + 0.6) * wave

ring(8, 4, (1.0, 1.0, 1.0), 1.0)                       # bright core ring at the pill edge
ring(8, 30, (0.85, 0.85, 1.0), 0.42)                    # soft halo

# wavy filigree-ish orbits — the ornament's tendrils, abstracted
m = np.exp(-(sdf - (26 + 14 * np.sin(6 * theta + 0.8))) ** 2 / (2 * 3.0 ** 2))
for c in range(3):
    img[..., c] += 0.6 * m * (0.9, 0.86, 1.0)[c]
m = np.exp(-(sdf - (42 + 18 * np.sin(4 * theta + 2.4))) ** 2 / (2 * 2.6 ** 2))
for c in range(3):
    img[..., c] += 0.38 * m * (1.0, 0.9, 0.82)[c]

def star(x0, y0, size, gain):
    sx, sy = xx - x0, yy - y0
    core = np.exp(-(sx * sx + sy * sy) / (2 * (size * 0.22) ** 2))
    aw = max(size * 0.06, 0.9)
    arms = (np.exp(-sx * sx / (2 * size * size)) * np.exp(-sy * sy / (2 * aw * aw))
          + np.exp(-sy * sy / (2 * size * size)) * np.exp(-sx * sx / (2 * aw * aw)))
    m = np.clip(core + 0.75 * arms, 0, 1) * gain
    for c in range(3):
        img[..., c] += m * (0.98, 0.97, 1.0)[c]

placed = 0
while placed < 22:
    sx, sy = rng.uniform(0, W), rng.uniform(0, H)
    qxs = max(abs(sx - W / 2) - bx, 0)
    s = np.hypot(qxs, sy - H / 2) - r
    if 4 < s < 52:
        star(sx, sy, rng.uniform(4, 18), rng.uniform(0.4, 0.95))
        placed += 1

# fade before the canvas edge so the aura never hard-clips in the slot
edge = np.minimum(np.minimum(xx, W - 1 - xx), np.minimum(yy, H - 1 - yy))
img *= np.clip(edge / 14, 0, 1)[..., None]
# and keep the pill's interior dark — the painted pill is Oscar's, not ours
img *= np.clip((sdf + 6) / 10, 0, 1)[..., None]

out = np.clip(img, 0, 1) ** 0.92
# key luminance to alpha: brightest channel becomes coverage, colour is
# unpremultiplied so the glow keeps its pearl tint at every opacity
alpha = out.max(axis=2)
rgb = np.where(alpha[..., None] > 0.003, out / np.maximum(alpha[..., None], 0.003), 1.0)
rgba = np.dstack([np.clip(rgb, 0, 1), alpha])
Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').save(
    'art/holo/maria-listen-aura.webp', format='WEBP', quality=82, method=6)
print('art/holo/maria-listen-aura.webp')
