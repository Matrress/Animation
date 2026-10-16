#!/usr/bin/env python3
"""1.9.4: round the elbow in the hero photo (owner: "the elbow is sharp, it should be rounder"). At master scale the
arm's silhouette inside the elbow box is opened with a disk (corners tighter than the disk are trimmed), the trimmed
slivers are filled from the sky and her back around them (never from the arm), and the new contour is antialiased.
The same change, resampled, is applied to every width; each is re-encoded near its original size.
usage: round-elbow.py <assets-dir>  (in place)"""
import sys, os, io
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, binary_opening, binary_closing, binary_dilation, binary_fill_holes, gaussian_filter, label
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from inpaint import laplace_fill
A = sys.argv[1]
BOX = (0, 820, 440, 1130)          # master px
R = int(os.environ.get('ELBOW_R', 85))
x0, y0, x1, y1 = BOX
master = Image.open(os.path.join(A, 'hero-band-3554.webp')).convert('RGB')
img = np.asarray(master).astype(float)[y0:y1, x0:x1]
L = img.mean(-1)
mk = Image.open(os.path.join(A, 'sleeper-mask.webp')).convert('RGB')                 # her alpha, half scale from (0, 660)
her = np.asarray(mk.resize((mk.width * 2, mk.height * 2), Image.BILINEAR)).astype(float)[y0 - 660:y1 - 660, x0:x1, 0] / 255
gy, gx = np.mgrid[y0:y1, x0:x1]
CL = np.interp(gx[0], [0, 40, 60, 100, 140, 180, 220, 260, 300, 340, 380, 420, 460],
               [950, 955, 975, 1034, 1051, 1048, 1044, 1041, 1037, 1034, 1030, 1026, 1017])[None, :]   # the arm's measured underside
arm = (her > .5) & (gy < CL + 2 + 10 * (gx < 150))
lab, _ = label(arm); arm = lab == lab[960 - y0, 300 - x0]
yy, xx = np.mgrid[-R:R + 1, -R:R + 1]; disk = xx * xx + yy * yy <= R * R
pad = R + 2
big = np.pad(arm, pad, mode='edge')                                         # the arm runs on past the box: keep it open there
op = binary_opening(big, structure=disk)[pad:-pad, pad:-pad]
keep_right = np.zeros_like(arm); keep_right[:, 330 - x0:] = True             # only the elbow end changes
op |= arm & keep_right
cut = arm & ~op
soft = (her > .03) & (gy < CL + 6 + 10 * (gx < 150)) & (gx < 330) & ~binary_dilation(op, iterations=2)   # the old soft fringe too
U = binary_dilation(cut | (soft & binary_dilation(cut, iterations=10)), iterations=2) & ~op
fill = laplace_fill(img, U, wall=op & ~U)
hp = img - np.stack([gaussian_filter(img[..., c], 1.2) for c in range(3)], -1)
ring = binary_dilation(U, iterations=8) & ~arm & ~U
noise = gaussian_filter(np.random.default_rng(5).standard_normal(L.shape), .7)
fill[U] += (noise / noise.std() * hp[ring].mean(-1).std())[U][:, None]
a = np.clip(gaussian_filter(op.astype(float), 1.1), 0, 1)                   # antialiased new contour
din = distance_transform_edt(op); near_new = binary_dilation(cut, iterations=8)
img = img * (1 - (.3 * np.exp(-din / 3.) * near_new * op))[..., None]           # the skin's dark rim along the new edge
inner = binary_dilation(U, iterations=3)
new = np.where(inner[..., None], img * a[..., None] + fill * (1 - a[..., None]), img)
chg = gaussian_filter(inner.astype(float), 1.5)
new = img * (1 - chg[..., None]) + new * chg[..., None]
print('trimmed px', int(cut.sum()))
if os.environ.get('ELBOW_DEBUG'):
    v = np.concatenate([img, new], 1)
    Image.fromarray(np.clip(v, 0, 255).astype(np.uint8)).resize((v.shape[1] * 2, v.shape[0] * 2), Image.LANCZOS).save('/tmp/claude-0/elbow-cmp.png')
    sys.exit()
for f in sorted(os.listdir(A)):
    if not f.startswith('hero-band-'): continue
    p = os.path.join(A, f); im = Image.open(p).convert('RGB'); s = im.width / 3554; target = os.path.getsize(p)
    bx = [round(v * s) for v in BOX]; w, h = bx[2] - bx[0], bx[3] - bx[1]
    arr = np.asarray(im).astype(float)
    patch = np.asarray(Image.fromarray(np.clip(new, 0, 255).astype(np.uint8)).resize((w, h), Image.LANCZOS)).astype(float)
    m = np.asarray(Image.fromarray((chg * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)).astype(float)[..., None] / 255
    reg = arr[bx[1]:bx[3], bx[0]:bx[2]]; arr[bx[1]:bx[3], bx[0]:bx[2]] = reg * (1 - m) + patch * m
    res = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    if s == 1: res.save(p, 'WEBP', quality=92, method=6); print(f, target, '->', os.path.getsize(p)); continue
    best = None
    for q in range(70, 96, 2):
        b = io.BytesIO(); res.save(b, 'WEBP', quality=q, method=6)
        if best is None or abs(len(b.getvalue()) - target) < abs(len(best[1]) - target): best = (q, b.getvalue())
    open(p, 'wb').write(best[1]); print(f, target, '->', len(best[1]), 'q', best[0])
