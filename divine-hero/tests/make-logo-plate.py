#!/usr/bin/env python3
"""1.9.2: plate-logo = ONLY the DIVINE / Dunlop Dreams lettering removed; transparent everywhere else.
History: 1.7.1 composited sky from the v26 plate and redrew the shoulder from a measured geometric contour; on iPad the
owner still saw the shoulder "tear and stick out" when Balance & Relief opened — any redrawn shoulder differs from the
photo's own (which has a soft, irregular corner behind the D). Now the plate covers nothing but the letters (and their
soft shadow), filled from what lies around each letter (sky or skin, harmonic fill + the photo's own grain): the photo
shows through the plate everywhere else, so the shoulder cannot change at all.
usage: make-logo-plate.py <assets-dir with hero-band-3554.webp>   (writes plate-logo.webp, 940×350 RGBA)"""
import sys, os
import numpy as np
from PIL import Image
from scipy.ndimage import median_filter, binary_dilation, label, gaussian_filter, distance_transform_edt
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from inpaint import laplace_fill
A = sys.argv[1]
m = np.asarray(Image.open(os.path.join(A, 'hero-band-3554.webp')).convert('RGB')).astype(float)
CB = (1191, 675, 2523, 1172)                                # the plate's box (CSS: 33.5% 24.6% 37.5% × 18.13%)
PW, PH = 940, 350
reg = m[CB[1]:CB[3], CB[0]:CB[2]]
L = reg.mean(-1)
yy, xx = np.mgrid[CB[1]:CB[3], CB[0]:CB[2]]
# letters: thin strokes standing off a smooth background (sky, or skin on the shoulder)
d = L - median_filter(L, size=45)
cand = (np.abs(d) > 7) & (xx >= 1290) & (xx < 2275) & (yy >= 700) & (yy < 968)
# the shoulder's right edge, measured row by row: the strongest skin→sky (dark→light) step within x 1482–1508
# (the I of DIVINE stands just right of it, from x ≈ 1512)
G = gaussian_filter(L, 1.5); gx = np.zeros_like(G); gx[:, 1:-1] = G[:, 1:-1] - G[:, :-2] * .5 - G[:, 2:] * .5
gx[:, 2:] = G[:, 2:] - G[:, :-2]
x0, x1 = 1482 - CB[0], 1508 - CB[0]
edge_x = CB[0] + x0 + np.argmax(np.maximum(gx[:, x0:x1], 0), axis=1)
edge_x = np.round(gaussian_filter(edge_x.astype(float), 6)).astype(int)
ex = edge_x[:, None]
on_edge = binary_dilation(cand & (np.abs(xx - ex) <= 12) & (yy > 745), iterations=7) & (np.abs(xx - ex) <= 16)   # letter strokes lying ON the edge
cand &= ~(np.abs(xx - ex) <= 3)                          # the shoulder's edge line itself is not a letter
lab, n = label(binary_dilation(cand, iterations=2))
keep = np.zeros_like(cand)
for i in range(1, n + 1):
    c = lab == i
    if c.sum() > 25: keep |= c
hump = (xx < ex) & (yy > 735)
sky = ~hump
# letters on the sky carry a wide soft shadow: a wide zone, filled from the sky only; letters on the shoulder: a narrow
# zone inside it, filled from the skin only. The shoulder's outline is never crossed.
comp, nc = label(keep); cx = np.zeros(nc + 1)
for i in range(1, nc + 1): cx[i] = xx[comp == i].mean()
glyph_sky = keep & (cx[comp] > 1503); glyph_skin = keep & (cx[comp] <= 1503)
letters_sky = binary_dilation(keep, iterations=22) & (xx > ex + 3)
letters_skin = binary_dilation(glyph_skin, iterations=6) & (xx < ex - 3) & (yy > 738)
letters = letters_sky | letters_skin
# fill from around each letter, then the photo's grain on top
# strokes lying on the shoulder's (vertical) edge: the edge is rebuilt under them column by column, interpolating
# between the clean rows just above and below, so its own profile carries straight through
fill = reg.copy()
for c in np.nonzero(on_edge.any(0))[0]:
    rows = np.nonzero(on_edge[:, c])[0]
    for run in np.split(rows, np.nonzero(np.diff(rows) > 1)[0] + 1):
        a, b = max(run[0] - 3, 0), min(run[-1] + 3, fill.shape[0] - 1)
        t = ((np.arange(a, b + 1) - a) / max(b - a, 1))[:, None]
        fill[a:b + 1, c] = fill[a, c] * (1 - t) + fill[b, c] * t
letters_sky &= ~on_edge; letters_skin &= ~on_edge; letters = letters_sky | letters_skin | on_edge
fill = laplace_fill(fill, letters_sky, wall=hump)
fill = laplace_fill(fill, letters_skin, wall=sky)
# a last pass on the sky side: any leftover stroke speck (darker than the sky around it) is refilled from the sky
FL = fill.mean(-1); speck = letters & (xx > ex + 1) & (np.abs(FL - median_filter(FL, size=41)) > 5)
if speck.any(): fill = laplace_fill(fill, binary_dilation(speck, iterations=9) & ~hump & (xx > ex + 1), wall=hump)
hp = reg - np.stack([gaussian_filter(reg[..., c], 1.2) for c in range(3)], -1)
ring = binary_dilation(letters, iterations=8) & ~letters
noise = gaussian_filter(np.random.default_rng(11).standard_normal(L.shape), .7)
fill[letters] += (noise / noise.std() * hp[ring].mean(-1).std())[letters][:, None]
alpha = np.clip(1 - distance_transform_edt(~letters) / 4, 0, 1)      # 4 px feather into the photo
rgba = np.dstack([np.clip(fill, 0, 255), alpha * 255]).astype(np.uint8)
out = Image.fromarray(rgba, 'RGBA').resize((PW, PH), Image.LANCZOS)
out.save(os.path.join(A, 'plate-logo.webp'), 'WEBP', quality=88, method=6, alpha_quality=100)
print('plate-logo.webp', os.path.getsize(os.path.join(A, 'plate-logo.webp')), 'bytes; letter px', int(letters.sum()))
if os.environ.get('PLATE_DEBUG'):
    v = reg.copy(); a = alpha[..., None]; v = v * (1 - a) + fill * a
    Image.fromarray(np.clip(v, 0, 255).astype(np.uint8)).save('/tmp/claude-0/plate-prev.png')
