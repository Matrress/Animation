#!/usr/bin/env python3
"""1.8.1: what lies behind the Dual Plush mattress once it rises to the owner's spot. Rebuilt from the photo itself by
transfinite (Coons-style) interpolation over the mattress footprint: each hidden row is continued from the photo on its
left and right (so the bed line and the body/strap bands run straight through), each hidden column from the photo just
above and below it; the two are blended by distance to the nearest side, plus the photo's own grain. No foreign pixels,
no edges. Alpha = footprint, feathered. usage: make-vacated.py <assets-dir>"""
import sys, os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, binary_dilation, distance_transform_edt
A = sys.argv[1]
BOX = (0, 1700, 1480, 2420)
hero = np.asarray(Image.open(os.path.join(A, 'hero-band-3554.webp')).convert('RGB')).astype(float)
x0, y0, x1, y1 = BOX; ref = hero[y0:y1, x0:x1]; h, w = ref.shape[:2]
yy, xx = np.mgrid[y0:y1, x0:x1].astype(float)
TOP = lambda x: np.interp(x, [55, 600, 1092], [1924, 1779, 1850]) - 10      # mattress top edge (outer)
BOT = lambda x: np.interp(x, [62, 650, 1092], [2042, 2163, 1950]) + 12      # mattress bottom edge (outer)
XL, XR = 46, 1104                                                          # left / right of the mattress
hole = (yy > TOP(xx)) & (yy < BOT(xx)) & (xx > XL) & (xx < XR)
# + the mattress's own cast shadow (right of its side panel and under its front edge), so no "ghost" outline stays
from PIL import ImageDraw
sh = Image.new('L', (w, h), 0)
ImageDraw.Draw(sh).polygon([(px - x0, py - y0) for px, py in [(1080, 1830), (1340, 1840), (1350, 2050), (700, 2330), (40, 2200), (40, 2000)]], fill=255)
mat_only = binary_dilation(hole, iterations=8)                               # the mattress itself (must be fully replaced)
hole = hole | (np.asarray(sh) > 0)
hole = binary_dilation(hole, iterations=4)
# harmonic (membrane) fill: smooth, and seamless against the photo all round the footprint (coarse-to-fine Jacobi)
from scipy.ndimage import zoom
def harmonic(img, mask):
    out = img.copy(); levels = [8, 4, 2, 1]; prev = None
    for f in levels:
        hs, ws = (h + f - 1) // f, (w + f - 1) // f
        im = np.stack([zoom(img[..., c], (hs / h, ws / w), order=1) for c in range(3)], -1)
        mk = zoom(mask.astype(float), (hs / h, ws / w), order=1) > .5
        cur = im.copy()
        if prev is not None:
            up = np.stack([zoom(prev[..., c], (hs / prev.shape[0], ws / prev.shape[1]), order=1) for c in range(3)], -1)
            cur[mk] = up[mk]
        else: cur[mk] = im[~mk].mean(0)
        for _ in range(400 if f > 1 else 250):
            avg = (np.roll(cur, 1, 0) + np.roll(cur, -1, 0) + np.roll(cur, 1, 1) + np.roll(cur, -1, 1)) / 4
            cur[mk] = avg[mk]
        prev = cur
    return prev
# two regions with a crisp edge between them, like the photo: the woman's body above the bed line, the bed below.
# Each is filled only from its own side (region-aware membrane), then the bed line itself is continued from the photo.
LINE = lambda x: np.interp(x, [0, 1300], [2058, 2062])                    # bed line, measured left (x<46) and right (x>1190)
upper = yy < LINE(xx)
def harmonic2(img, mask, region):
    cur = img.copy(); known = ~mask
    cur[mask & region] = img[known & region].mean(0); cur[mask & ~region] = img[known & ~region].mean(0)
    same = lambda sh: (np.roll(region, sh[0], sh[1]) == region)
    nb = [((1, 0)), ((-1, 0)), ((1, 1)), ((-1, 1))]
    ws = [same(n).astype(float) for n in nb]
    for it in range(3000):
        acc = sum(np.roll(cur, n[0], n[1]) * wgt[..., None] for n, wgt in zip(nb, ws)); den = sum(ws)
        avg = acc / np.maximum(den, 1)[..., None]
        cur[mask] = avg[mask]
    return cur
# exact region-aware membrane: sparse Laplace system over the hole, solved with conjugate gradients per channel
import scipy.sparse as sp
from scipy.sparse.linalg import cg
idx = -np.ones((h, w), int); ys_, xs_ = np.nonzero(hole); idx[ys_, xs_] = np.arange(len(ys_)); N = len(ys_)
rows, cols, vals = [], [], []; rhs = np.zeros((N, 3)); deg = np.zeros(N)
for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
    ny, nx = ys_ + dy, xs_ + dx; ok = (ny >= 0) & (ny < h) & (nx >= 0) & (nx < w)
    ok[ok] &= upper[ny[ok], nx[ok]] == upper[ys_[ok], xs_[ok]]          # never across the bed line
    i = np.nonzero(ok)[0]; deg[i] += 1
    unk = idx[ny[i], nx[i]] >= 0
    rows += list(i[unk]); cols += list(idx[ny[i[unk]], nx[i[unk]]]); vals += [-1.0] * int(unk.sum())
    kn = i[~unk]; rhs[kn] += ref[ny[kn], nx[kn]]
M = sp.csr_matrix((vals + list(deg), (rows + list(range(N)), cols + list(range(N)))), shape=(N, N))
fill = ref.copy()
for c in range(3):
    x0_ = np.full(N, ref[~hole, c].mean()); sol, info = cg(M, rhs[:, c], x0=x0_, rtol=1e-6, maxiter=20000)
    fill[ys_, xs_, c] = sol
# the bed line: its vertical profile measured right of the footprint, laid along LINE through the hole
prof = ref[int(LINE(1250) - y0) - 14:int(LINE(1250) - y0) + 14, 1230 - x0:1290 - x0].mean(1)       # 28 rows
base = np.stack([np.interp(np.arange(28), [0, 27], [prof[0, c], prof[-1, c]]) for c in range(3)], -1)
delta = prof - base
for k in range(28):
    yrow = (LINE(xx[0]) - y0 - 14 + k).round().astype(int)
    for c in range(3):
        sel = (yrow >= 0) & (yrow < h)
        cols = np.nonzero(sel)[0]; rows = yrow[sel]
        m = hole[rows, cols]
        fill[rows[m], cols[m], c] += delta[k, c]

hp = ref - np.stack([gaussian_filter(ref[..., c], 1.2) for c in range(3)], -1)
rng = np.random.default_rng(4); fill += gaussian_filter(rng.standard_normal((h, w)), .7)[..., None] * hp[~hole].std(0) * 1.6
d = distance_transform_edt(~hole)
alpha = np.clip(1 - d / 30, 0, 1)
# in the cast-shadow margin, melt the rebuilt surface into the photo over ~90 px (no kink, no seam);
# over the mattress itself the rebuilt surface is used fully
din = distance_transform_edt(hole)
k = np.where(mat_only, 1.0, np.clip(din / 90, 0, 1))
k = gaussian_filter(k, 6) * hole + 0
k = np.where(mat_only, 1.0, k)[..., None]
blend = ref * (1 - k) + fill * k
out = np.dstack([np.clip(np.where(hole[..., None], blend, ref), 0, 255), alpha * 255]).astype('uint8')
Image.fromarray(out, 'RGBA').save(os.path.join(A, 'mattress-bed.webp'), 'WEBP', quality=86, method=6)
W, H = 3554, 2744
print('mattress-bed.webp', (w, h), os.path.getsize(os.path.join(A, 'mattress-bed.webp')), 'bytes; css left %.3f%% top %.3f%% width %.3f%% height %.3f%%' % (x0 / W * 100, y0 / H * 100, w / W * 100, h / H * 100))
prev = hero.copy(); a = alpha[..., None]; prev[y0:y1, x0:x1] = ref * (1 - a) + out[..., :3] * a
Image.fromarray(prev[1450:2350, 0:1800].astype('uint8')).save('/tmp/claude-0/vac-prev.png')
if os.environ.get('DEBUG'):
    r = 1950 - y0
    print('hole', [int(hole[r, x]) for x in range(1180, 1220, 4)])
    print('fill', [int(fill[r, x].mean()) for x in range(1180, 1220, 4)])
    print('ref ', [int(ref[r, x].mean()) for x in range(1180, 1220, 4)])
    print('cg info', info, 'N', N)
