#!/usr/bin/env python3
"""1.10.6: solid slab silhouette for the cut-out topper pictures (owner: holes, dents and torn-off pieces along the sides).
A latex slab is convex, so the alpha becomes the convex hull of the opened silhouette (nubs removed); pixels the hull adds
over a dent are filled from the nearest real slab pixel; the edge is antialiased and pulled in 1 px.
usage: clean-topper-edge.py <assets-dir> <name>...   (in place)"""
import sys, os
import numpy as np
from PIL import Image
from scipy.ndimage import binary_opening, binary_fill_holes, label, distance_transform_edt, gaussian_filter
from scipy.spatial import ConvexHull
from PIL import ImageDraw
A = sys.argv[1]
for name in sys.argv[2:]:
    p = os.path.join(A, name + '.webp'); im = Image.open(p).convert('RGBA'); a = np.asarray(im).astype(float)
    S = 3; H, W = a.shape[:2]
    al = a[..., 3] > 128
    al = binary_fill_holes(al)
    yy, xx = np.mgrid[-5:6, -5:6]; disk = xx * xx + yy * yy <= 25
    op = binary_opening(al, structure=disk)
    lab, n = label(op); sizes = np.bincount(lab.ravel()); sizes[0] = 0; op = lab == sizes.argmax()
    ys, xs = np.nonzero(op); pts = np.c_[xs, ys]
    hull = pts[ConvexHull(pts).vertices]
    big = Image.new('L', (W * S, H * S), 0); ImageDraw.Draw(big).polygon([(x * S + S / 2, y * S + S / 2) for x, y in hull], fill=255)
    m = np.asarray(big.resize((W, H), Image.LANCZOS)).astype(float) / 255
    hm = m > .5
    solid = op | (al & hm)
    d, (iy, ix) = distance_transform_edt(~solid, return_indices=True)
    rgb = a[..., :3][iy, ix]                                     # dents and the pulled-in rim take the nearest slab colour
    inner = distance_transform_edt(hm)
    alpha = np.clip(gaussian_filter(m, .6), 0, 1) * np.clip(inner / 1.5, 0, 1)
    out = np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(p, 'WEBP', quality=90, method=6, alpha_quality=100)
    print(name, os.path.getsize(p), 'bytes, hull pts', len(hull), 'px added', int(hm.sum() - al.sum()))
