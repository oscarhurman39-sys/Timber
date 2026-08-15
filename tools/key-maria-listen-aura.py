#!/usr/bin/env python3
# Keys Oscar's real Listen-ring ornament (chat upload, 2026-08-15) to true
# alpha: strips the black background AND the flat navy pill fill, keeping
# only the art-nouveau silver/gold ring and its white halo — the ring is
# what wraps his own painted Listen pill; his pill must show through, not be
# covered by a second one.
#
# r75 shipped a version of this that read wrong on the phone ("didn't shrink
# it to fit, cut the effect on either side") for two compounding reasons:
#   1. the trim bbox used a >0.02 alpha floor with only 6px of padding, which
#      cut into the halo's own soft glow before it ever reached the card —
#      the glow doesn't end at a hard edge, so a tight threshold reads as a
#      clipped edge, not a faded one.
#   2. the on-card rect (left/top/width/height) was hand-picked by eye rather
#      than measured, so the transparent pill-hole in the middle of the ring
#      did not actually line up with the button underneath it — the ring
#      LOOKED small/cramped because it was scaled to an arbitrary box, not to
#      the one box that makes the hole and the button coincide.
#
# Fix for both: loosen the trim (lower floor, generous padding, so the tall
# vertical scrollwork the source is actually generous with survives), then
# derive the on-card CSS rect from the pill hole's own measured bounding box
# rather than guessing — solve for the box that puts the hole exactly over
# the Listen button. Printed at the end; paste straight into the FULLART
# entry's `aura` rect in timber.html.
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

# the Listen button's own CSS rect, verbatim from the FULLART entry — this is
# what the pill-hole must land on. Keep these two in sync by hand; check-boot
# doesn't cross-reference them (they live in different registry entries).
BTN = {'left': 17.5, 'top': 14.9, 'width': 20.5, 'height': 5.6}   # % of a 420x600 card
CARD_W, CARD_H = 420.0, 600.0

im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.float64) / 255.0
lum = a.max(axis=2)

bg_dist = lum                                          # background: pure black
pill_ref = np.array([34, 60, 96]) / 255.0               # pill: flat navy, sampled from the source
pill_dist = np.sqrt(((a - pill_ref) ** 2).sum(axis=2))

def smooth_keep(dist, lo, hi):
    t = np.clip((dist - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)

# looser than r75's 0.05-0.16: lets the halo's own soft falloff survive
# instead of hard-zeroing partway through it
keep_bg = smooth_keep(bg_dist, 0.025, 0.13)
keep_pill = smooth_keep(pill_dist, 0.05, 0.15)
alpha = np.clip(keep_bg * keep_pill, 0, 1)

safe_a = np.maximum(alpha, 0.04)
rgb = np.clip(a / safe_a[..., None], 0, 1)

# trim bbox: lower floor (0.008 vs r75's 0.02) + generous padding (36px vs
# 6px) so the tall vertical scrollwork isn't cut at the crop edge
cols = np.where(alpha.max(axis=0) > 0.008)[0]
rows = np.where(alpha.max(axis=1) > 0.008)[0]
pad = 36
x0, x1 = max(cols[0] - pad, 0), min(cols[-1] + pad, a.shape[1] - 1)
y0, y1 = max(rows[0] - pad, 0), min(rows[-1] + pad, a.shape[0] - 1)

rgba = np.dstack([rgb, alpha])[y0:y1 + 1, x0:x1 + 1]
Wf, Hf = rgba.shape[1], rgba.shape[0]        # fractions below are resolution-independent,
                                               # so the thumbnail below can shrink freely after

out = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')
out.thumbnail((900, 900), Image.LANCZOS)      # on-card display is ~30% of a 420px-wide card;
out.save(OUT)                                 # 1536px native was 5-10x more than any phone needs
print(OUT, out.size)

# pill hole bbox, measured in ORIGINAL image coordinates then shifted into
# the trimmed/final image's own coordinate space
pillmask = pill_dist < 0.08
pcols = np.where(pillmask.any(axis=0))[0]
prows = np.where(pillmask.any(axis=1))[0]
fx0, fx1 = (pcols.min() - x0) / Wf, (pcols.max() - x0) / Wf
fy0, fy1 = (prows.min() - y0) / Hf, (prows.max() - y0) / Hf
print(f'pill hole in final image: x {fx0:.4f}-{fx1:.4f}  y {fy0:.4f}-{fy1:.4f}')

# solve for the on-card box that makes the hole coincide with the button:
# aura_box_size * (hole fraction) = button_size, in the SAME units (card %).
# WIDTH is solved exactly — that's the actual defect being fixed (the ring's
# own edges were getting clipped, reading as "cut off either side").
btn_left_px, btn_top_px = BTN['left'] / 100 * CARD_W, BTN['top'] / 100 * CARD_H
btn_w_px, btn_h_px = BTN['width'] / 100 * CARD_W, BTN['height'] / 100 * CARD_H
aura_w_px = btn_w_px / (fx1 - fx0)
aura_left_px = btn_left_px - fx0 * aura_w_px

# HEIGHT is not solved to the same exact fit: the source ring is genuinely
# ~3.6x the pill's own height (that's how far its scrollwork reaches above
# and below), and on Maria's actual card the button sits close under the
# painted title — an exact-fit height puts the ring's top curls over her
# name. VSCALE trades a little source-fidelity for staying clear of the
# title: it centres the ring's hole on the button's centre (rather than
# matching the hole's edges to the button's edges), at a fraction of the
# "faithful" height. The pill may show a sliver of ring-frame gap above/
# below at VSCALE<1 — a minor mismatch, not a defect, and far preferable to
# obscuring painted text. Tune by eye against Maria's specific card if this
# ever needs revisiting; there's no way to solve it purely from the source
# image, since the title's position isn't in it.
VSCALE = 0.66
faithful_h_px = btn_h_px / (fy1 - fy0)
aura_h_px = faithful_h_px * VSCALE
btn_center_y = btn_top_px + btn_h_px / 2
hole_center_frac_y = (fy0 + fy1) / 2
aura_top_px = btn_center_y - hole_center_frac_y * aura_h_px

print(f'faithful (uncropped source proportions) height would be {faithful_h_px/CARD_H*100:.3f}% — reads over the title on Maria\'s card, so VSCALE={VSCALE} is applied')
print('paste into the FULLART aura rect:')
print(f"aura:{{src:'art/holo/maria-listen-aura.webp', "
      f"left:'{aura_left_px/CARD_W*100:.3f}%', top:'{aura_top_px/CARD_H*100:.3f}%', "
      f"width:'{aura_w_px/CARD_W*100:.3f}%', height:'{aura_h_px/CARD_H*100:.3f}%'}},")
