#!/usr/bin/env python3
"""1.4.3: remove a soft dark leaf-shaped smudge (and a speck) baked into the hero photo on the pillow, below
"Sleep System" (reported by the owner). Only the low-frequency darkening inside the ROI is lifted back to the
surrounding level, so the foam grain stays. Applied to every width; each is re-encoded near its original size.
usage: clean-smudge.py <in-assets> <out-assets>"""
import sys, os, io
from PIL import Image
import numpy as np
from scipy.ndimage import gaussian_filter, percentile_filter, zoom
src, out = sys.argv[1], sys.argv[2]
ROI = (2470, 2005, 2860, 2215)  # in 3554-wide master pixels
SPECK = (2755, 2025, 2800, 2055)
def lift(a, box, s, sig, win, pct):
    W, H = a.shape[1], a.shape[0]
    x0, y0, x1, y1 = [round(v * s) for v in box]; pad = round(win * s)
    X0, Y0, X1, Y1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)
    reg = a[Y0:Y1, X0:X1]; L = reg.mean(-1); Ls = gaussian_filter(L, sig * s + .3)
    k = 4 if s > .5 else 2  # robust local level: a high percentile over a window wider than the smudge
    small = Ls[::k, ::k]; ref = percentile_filter(small, pct, size=max(3, round(win * s / k)))
    ref = zoom(gaussian_filter(ref, 2), (Ls.shape[0] / small.shape[0], Ls.shape[1] / small.shape[1]), order=1)[:Ls.shape[0], :Ls.shape[1]]
    D = np.clip(ref - Ls - 1, 0, None)
    roi = np.zeros_like(L); roi[(y0 - Y0):(y1 - Y0), (x0 - X0):(x1 - X0)] = 1
    roi = gaussian_filter(roi, 8 * s + .5)
    a[Y0:Y1, X0:X1] = np.clip(reg + (D * roi)[..., None] * (reg / np.maximum(L[..., None], 1)), 0, 255)
def fix(img):
    s = img.width / 3554
    a = np.asarray(img.convert('RGB')).astype(float)
    lift(a, ROI, s, 5, 170, 70)
    lift(a, SPECK, s, 1.2, 40, 60)
    return Image.fromarray(a.astype('uint8'))
for f in sorted(os.listdir(src)):
    if not f.startswith('hero-band-'): continue
    im = Image.open(os.path.join(src, f)); target = os.path.getsize(os.path.join(src, f)); res = fix(im)
    best = None
    for q in range(70, 96, 2):
        b = io.BytesIO(); res.save(b, 'WEBP', quality=q, method=6)
        if best is None or abs(len(b.getvalue()) - target) < abs(len(best[1]) - target): best = (q, b.getvalue())
    open(os.path.join(out, f), 'wb').write(best[1]); print(f, target, '->', len(best[1]), 'q', best[0])
