#!/usr/bin/env python3
"""Bake the aspect-band's thin wooden/gold rim onto plaque-full.png and
soil-full.png so all three parchment boxes share the same edging.

Rim spec measured from art/band-full.png cross-sections (outside -> in):
  feather (alpha<200): dark outline colour, alpha kept
  d=0..1  : dark outline  (~35,22,8 / 80,52,18)
  d=2     : gold, darker  (~198,148,66)
  d=3     : gold, bright  (~226,183,108)
  d=4     : inner shade   (~120,80,30)
  d=5     : 40% inner-shade blend into parchment (soft transition)
where d = erosion depth (px) inside the alpha>=200 core.

Run from the repo root: python3 design/bake-rim.py
Safe to re-run: assets that already carry the rim are detected and skipped
(the d=5 soft blend samples the current pixels, so a second pass would
darken it — hence the guard rather than a blind re-bake).
"""
import random
from PIL import Image, ImageFilter

random.seed(12)

RIM = {
    0: (35, 22, 8),
    1: (80, 52, 18),
    2: (198, 148, 66),
    3: (226, 183, 108),
    4: (120, 80, 30),
}
FEATHER_DARK = (25, 15, 6)


def bake(path):
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    a = im.getchannel('A')

    # core mask: fully-painted parchment area
    core = a.point(lambda v: 255 if v >= 200 else 0)

    # erosion bands: band[d] = pixels at depth d inside the core
    masks = []
    cur = core
    for _ in range(6):
        eroded = cur.filter(ImageFilter.MinFilter(3))
        ring = Image.new('L', (w, h), 0)
        ring.paste(255, (0, 0), cur)
        ring.paste(0, (0, 0), eroded)  # ring = cur minus eroded
        masks.append(ring)
        cur = eroded

    px = im.load()
    corepx = core.load()
    ringpx = [m.load() for m in masks]

    # already-baked guard: if the outermost core ring is already the dark
    # outline colour, this asset has its rim — don't double-bake
    samples = [px[x, y][:3] for y in range(h) for x in range(w) if ringpx[0][x, y]]
    if samples:
        n = len(samples)
        mr = sum(s[0] for s in samples) / n
        mg = sum(s[1] for s in samples) / n
        mb = sum(s[2] for s in samples) / n
        if abs(mr - RIM[0][0]) + abs(mg - RIM[0][1]) + abs(mb - RIM[0][2]) < 60:
            print('rim already present, skipping:', path)
            return

    for y in range(h):
        # slight vertical light gradient on the gold so it reads as lit brass
        shade = 1.05 - 0.12 * (y / h)
        for x in range(w):
            r, g, b, al = px[x, y]
            if al == 0:
                continue
            if corepx[x, y] == 0:
                # feather / soft shadow edge -> dark outline colour
                if al < 200:
                    px[x, y] = (*FEATHER_DARK, al)
                continue
            for d in range(5):
                if ringpx[d][x, y]:
                    cr, cg, cb = RIM[d]
                    if d in (2, 3):  # gold bands: light gradient + grain jitter
                        j = random.randint(-6, 6)
                        cr = min(255, int(cr * shade)) + j
                        cg = min(255, int(cg * shade)) + j
                        cb = min(255, int(cb * shade)) + j
                    px[x, y] = (max(0, min(255, cr)),
                                max(0, min(255, cg)),
                                max(0, min(255, cb)), al)
                    break
            else:
                if ringpx[5][x, y]:  # soft blend row into parchment
                    cr, cg, cb = RIM[4]
                    px[x, y] = ((r * 6 + cr * 4) // 10,
                                (g * 6 + cg * 4) // 10,
                                (b * 6 + cb * 4) // 10, al)

    im.save(path)
    print('baked rim:', path)


bake('art/plaque-full.png')
bake('art/soil-full.png')
