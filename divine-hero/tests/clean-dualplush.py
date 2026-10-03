#!/usr/bin/env python3
"""1.6.0: remove the baked-in curved "Dual Plush / conception" lettering (and its faint reflection) from the floor
below the mattress; the brand line is now live HTML aligned with the mattress (owner request). Only pixels below the
mattress's front edge are touched: letters = local brightness excess; fill = smooth floor gradient (normalised
convolution) + the floor's own grain. usage: clean-dualplush.py <in-assets> <out-assets>"""
import sys, os, io
from PIL import Image
import numpy as np
from scipy.ndimage import gaussian_filter, binary_dilation, median_filter, zoom, distance_transform_edt
src, out = sys.argv[1], sys.argv[2]
# master (3554w) geometry: region, mattress front-bottom edge (x0,y0)-(x1,y1)
REG = (0, 2020, 1000, 2400)
EDGE = ((60, 2040), (650, 2170))  # measured: panel bottom at x=120 y=2053, x=360 y=2105, x=520 y=2141
def fix(img):
    s = img.width / 3554
    a = np.asarray(img.convert('RGB')).astype(float)
    x0, y0, x1, y1 = [round(v * s) for v in REG]
    reg = a[y0:y1, x0:x1].copy(); h, w = reg.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    (ex0, ey0), (ex1, ey1) = [(p[0] * s - x0, p[1] * s - y0) for p in EDGE]
    d = (yy - (ey0 + (xx - ex0) * (ey1 - ey0) / (ex1 - ex0))) / s   # distance below the mattress front edge (master px)
    zone = (d > 9) & (d < 250) & (xx / s < 650)
    work = (d > 4) & (d < 290) & (xx / s < 720)                         # reaches the image edge: no seam on the left
    db = np.clip(np.round(d / 3).astype(int), 0, 100)                  # 3-px bands parallel to the edge
    def profile(ok):
        P = np.zeros((101, 3))
        for b in range(101):
            sel = work & ok & (db == b)
            if sel.sum() > 5: P[b] = np.median(reg[sel], 0)
            elif b: P[b] = P[b - 1]
        return np.stack([gaussian_filter(P[:, c], 1.2) for c in range(3)], -1)
    P = profile(np.ones((h, w), bool))
    m = zone & (np.abs(reg - P[db]).mean(-1) > 4)
    for _ in range(2):                                                 # refine the floor model without the lettering
        m = binary_dilation(m, iterations=max(2, round(6 * s))) & work
        P = profile(~m)
        res = reg - P[db]
        tr = np.zeros((w, 3))
        for c in range(3):
            num = gaussian_filter((res[..., c] * (~m & work)).sum(0), 25 * s + .5); den = gaussian_filter((~m & work).sum(0).astype(float), 25 * s + .5)
            tr[:, c] = num / np.maximum(den, 1e-3)
        model = P[db] + tr[None, :, :]
        m = zone & (np.abs(reg - model).mean(-1) > 4)
    for k in range(1, 6):                                              # drop shadow down-right of the white letters
        o = round(4 * k * s); lit = zone & ((reg - model).mean(-1) > 4); m[o:, o:] |= lit[:-o or None, :-o or None]
    m = binary_dilation(m, iterations=max(2, round(6 * s))) & work
    rng = np.random.default_rng(7)
    grain = reg - np.stack([gaussian_filter(reg[..., c], 1.5 * s + .5) for c in range(3)], -1)
    sd = grain[work & ~m].std(0)
    noise = gaussian_filter(rng.standard_normal((h, w)), .6); noise /= noise.std()
    open_top = (d > -60) & (d < 290) & (xx / s < 720)         # the mattress edge is a natural border: no fade there
    taper = np.clip(distance_transform_edt(open_top) / (28 * s + 1), 0, 1)   # fade into the untouched photo at the other borders
    soft = (np.clip(gaussian_filter(m.astype(float), 2.5 * s + .5) * 1.5, 0, 1) * taper)[..., None]
    a[y0:y1, x0:x1] = np.clip(reg * (1 - soft) + (model + noise[..., None] * sd) * soft, 0, 255)
    return Image.fromarray(a.astype('uint8'))
for f in sorted(os.listdir(src)):
    if not f.startswith('hero-band-'): continue
    target = os.path.getsize(os.path.join(src, f)); res = fix(Image.open(os.path.join(src, f)))
    best = None
    for q in range(70, 96, 2):
        b = io.BytesIO(); res.save(b, 'WEBP', quality=q, method=6)
        if best is None or abs(len(b.getvalue()) - target) < abs(len(best[1]) - target): best = (q, b.getvalue())
    open(os.path.join(out, f), 'wb').write(best[1]); print(f, target, '->', len(best[1]), 'q', best[0])
