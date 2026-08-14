#!/usr/bin/env python3
# Stand-in gloss textures for Pretty Lady Maria's shine pass.
#
# Oscar supplied two gloss reference images in chat (2026-08-14) for the Maria
# fullart card — pale iridescent light and star glints on black. The originals
# never reached the repo's filesystem (chat attachments don't land on disk in a
# remote session), so this script builds procedural stand-ins to the same look,
# drawn for `mix-blend-mode:screen` where black contributes nothing. His real
# textures replace the two output files 1:1 with no code change: anything
# light-on-black works in the same slots.
#
# Outputs, at the card's 0.700 ratio:
#   art/holo/maria-gloss-streaks.webp   diagonal pearl streaks -> sweep layer
#   art/holo/maria-gloss-frame.webp     border glow + ribbons  -> shimmer layer
#
# Needs: pip install pillow numpy.  Run from the repo root.

import numpy as np
from PIL import Image

W, H = 840, 1200
rng = np.random.default_rng(69)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)

PASTELS = [
    (0.78, 0.74, 1.00),  # lavender
    (1.00, 0.78, 0.90),  # pink
    (0.72, 0.95, 1.00),  # cyan
    (1.00, 0.92, 0.74),  # gold
    (0.96, 0.94, 1.00),  # pearl
]

def add(img, mask, col, gain, period=260.0):
    # iridescence: each channel breathes at a different phase along the mask's
    # own coordinate, so one streak drifts lavender->pink->cyan like foil
    t = xx + yy
    for c in range(3):
        wave = 0.78 + 0.22 * np.sin(t / period + c * 2.1)
        # pull well toward white: the references read pearl, not rainbow —
        # the tint should only be visible inside a mostly-white sheen
        img[..., c] += gain * mask * (0.45 * col[c] + 0.55) * wave

def streak(x0, y0, ang, sig_p, sig_l):
    u, v = np.cos(ang), np.sin(ang)
    dx, dy = xx - x0, yy - y0
    t = dx * u + dy * v
    d = -dx * v + dy * u
    return np.exp(-d * d / (2 * sig_p * sig_p)) * np.exp(-t * t / (2 * sig_l * sig_l))

def star(img, x0, y0, size, gain):
    dx, dy = xx - x0, yy - y0
    r2 = dx * dx + dy * dy
    core = np.exp(-r2 / (2 * (size * 0.22) ** 2))
    arm_w = max(size * 0.06, 0.9)
    arms = (np.exp(-dx * dx / (2 * size * size)) * np.exp(-dy * dy / (2 * arm_w * arm_w))
          + np.exp(-dy * dy / (2 * size * size)) * np.exp(-dx * dx / (2 * arm_w * arm_w)))
    m = np.clip(core + 0.75 * arms, 0, 1) * gain
    for c in range(3):
        img[..., c] += m * (0.98, 0.96, 1.0)[c]

def save(img, path):
    out = np.clip(img, 0, 1) ** 0.92
    Image.fromarray((out * 255).astype(np.uint8), 'RGB').save(
        path, format='WEBP', quality=82, method=6)
    print(path)

# ---- streaks: shafts of pearl light crossing lower-left -> upper-right ----
A = np.zeros((H, W, 3))
ang = np.deg2rad(-48)
for i in range(7):
    x0 = rng.uniform(-80, W + 80)
    y0 = rng.uniform(-80, H + 80)
    col = PASTELS[i % len(PASTELS)]
    body = streak(x0, y0, ang + rng.uniform(-0.05, 0.05), rng.uniform(38, 85), rng.uniform(520, 820))
    add(A, body, col, rng.uniform(0.28, 0.5))
    # sharp bright core riding each broad shaft — the glint line
    core = streak(x0, y0, ang, rng.uniform(1.6, 3.4), rng.uniform(320, 620))
    add(A, core, (0.98, 0.97, 1.0), rng.uniform(0.55, 0.9))
for _ in range(26):
    star(A, rng.uniform(0, W), rng.uniform(0, H), rng.uniform(5, 34), rng.uniform(0.3, 0.85))
save(A, 'art/holo/maria-gloss-streaks.webp')

# ---- frame: light living at the card edge, centre left dark for the portrait ----
B = np.zeros((H, W, 3))
m = np.minimum(np.minimum(xx, W - 1 - xx), np.minimum(yy, H - 1 - yy))
add(B, np.exp(-m / 64), (0.9, 0.87, 1.0), 0.5, period=200)
for cx, cy in [(0, 0), (W, 0), (0, H), (W, H)]:
    add(B, np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * 150.0 ** 2)),
        (1.0, 0.93, 0.85), 0.4)
# flowing ribbons: near-vertical S-curves hugging left/right, near-horizontal top/bottom
for cx, amp, lam, sig in [(70, 46, 240, 7), (W - 66, 52, 300, 8), (150, 30, 180, 4)]:
    d = xx - (cx + amp * np.sin(yy / lam + rng.uniform(0, 6)))
    add(B, np.exp(-d * d / (2 * sig * sig)), PASTELS[int(rng.integers(5))], 0.5)
for cy, amp, lam, sig in [(64, 30, 260, 6), (H - 70, 38, 320, 7)]:
    d = yy - (cy + amp * np.sin(xx / lam + rng.uniform(0, 6)))
    add(B, np.exp(-d * d / (2 * sig * sig)), PASTELS[int(rng.integers(5))], 0.5)
# keep the middle dark: the shimmer must never sit light over Maria's face
B *= (1 - 0.72 * np.exp(-(((xx - W / 2) ** 2) / (2 * (W * 0.30) ** 2)
                        + ((yy - H / 2) ** 2) / (2 * (H * 0.30) ** 2))))[..., None]
for _ in range(30):
    while True:
        sx, sy = rng.uniform(0, W), rng.uniform(0, H)
        if min(sx, W - sx, sy, H - sy) < 190: break
    star(B, sx, sy, rng.uniform(5, 30), rng.uniform(0.35, 0.9))
save(B, 'art/holo/maria-gloss-frame.webp')
