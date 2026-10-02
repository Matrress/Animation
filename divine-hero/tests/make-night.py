#!/usr/bin/env python3
"""1.7.0: the "night mode" plate (desktop only), taken from the owner's own mockup (src/night/owner-mockup.png,
1586×992): same frame, moon, stars, Milky Way, clouds, sea and the woman's silhouette. Removed from it: the site
header, the headline and buttons (they are live HTML in the hero), and the faint photo inscriptions.
Placed in picture coordinates (3554×2744 aspect): the mockup covers v = 0.076…0.886 of the picture height
(u = x/1586, v = (y + 93)/1224.6); the strips above/below are continued from its own sky/sea.
usage: make-night.py <out-dir>"""
import sys, os, io
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, median_filter, binary_dilation
out = sys.argv[1]
src = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../src/night/owner-mockup.png')
m = np.asarray(Image.open(src).convert('RGB')).astype(float); H0, W0 = m.shape[:2]
rng = np.random.default_rng(26)

def clean(img, box, thr, grow=2, sig=5, whole=False):
    x0, y0, x1, y1 = box; p = 24
    X0, Y0, X1, Y1 = max(0, x0 - p), max(0, y0 - p), min(W0, x1 + p), min(H0, y1 + p)
    reg = img[Y0:Y1, X0:X1].copy(); L = reg.mean(-1)
    inside = np.zeros(L.shape, bool); inside[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = True
    if whole: mask = inside
    else:
        med = median_filter(L, size=25)
        mask = inside & (np.abs(L - med) > thr)
        mask = binary_dilation(mask, iterations=grow) & inside
    keep = (~mask).astype(float)
    fill = np.stack([gaussian_filter(reg[..., c] * keep, sig) / np.maximum(gaussian_filter(keep, sig), 1e-4) for c in range(3)], -1)
    big = np.stack([gaussian_filter(reg[..., c] * keep, sig * 4) / np.maximum(gaussian_filter(keep, sig * 4), 1e-4) for c in range(3)], -1)
    fill = np.where((gaussian_filter(keep, sig) < .05)[..., None], big, fill)
    hp = reg - np.stack([gaussian_filter(reg[..., c], 1.2) for c in range(3)], -1)
    sd = hp[~mask & inside].std(0) if (~mask & inside).any() else np.array([1.5] * 3)
    noise = rng.standard_normal(L.shape)[..., None] * sd
    soft = gaussian_filter(mask.astype(float), 1.2)[..., None]
    img[Y0:Y1, X0:X1] = reg * (1 - soft) + (fill + noise) * soft

def from_above(img, box, dy, feather=10):
    """water under the buttons: continue the sea texture from just above (same columns)"""
    x0, y0, x1, y1 = box
    patch = img[y0 - dy:y1 - dy, x0:x1].copy()
    a = np.ones((y1 - y0, x1 - x0)); a = gaussian_filter(np.pad(a, feather), feather / 2)[feather:-feather, feather:-feather]
    a = np.clip((a - .5) * 2.2, 0, 1)[..., None]
    img[y0:y1, x0:x1] = img[y0:y1, x0:x1] * (1 - a) + patch * a

img = m.copy()
from scipy.ndimage import maximum_filter
def star_sample(region):
    L = region.mean(-1); bg = gaussian_filter(L, 5); pk = (L == maximum_filter(L, 5)) & (L - bg > 10)
    ys, xs = np.nonzero(pk); return len(ys) / L.size, [region[y, x] - np.array([bg[y, x]] * 3) for y, x in zip(ys, xs)]
def restar(img, box, density, pool):
    x0, y0, x1, y1 = box; n = rng.poisson(density * (x1 - x0) * (y1 - y0))
    for _ in range(n):
        x, y = rng.uniform(max(x0, 3), min(x1, W0 - 4)), rng.uniform(max(y0, 3), min(y1, H0 - 4)); c = pool[rng.integers(len(pool))]
        gy, gx = np.mgrid[int(y) - 2:int(y) + 3, int(x) - 2:int(x) + 3]
        k = np.exp(-((gx - x) ** 2 + (gy - y) ** 2) / (2 * .55 ** 2))
        img[int(y) - 2:int(y) + 3, int(x) - 2:int(x) + 3] += k[..., None] * np.clip(c, 0, None)
img[0:16] = img[16:32][::-1]                                       # browser chrome line
img[14:20] = gaussian_filter(img[11:23], (2, 0, 0))[3:9]          # soften the mirror seam
clean(img, (752, 48, 832, 132), 8, grow=3)                         # header: logo
clean(img, (1168, 40, 1330, 100), 8, grow=3)                       # Email Us
clean(img, (1345, 40, 1545, 100), 8, grow=3)                       # search / account / bag
clean(img, (60, 150, 1535, 192), 7, grow=2)                        # menu row
dens, pool = star_sample(m[196:300, 60:1535])                     # the sky just under the menu row
for b in [(0, 0, 1586, 16), (752, 48, 832, 132), (1168, 40, 1330, 100), (1345, 40, 1545, 100), (60, 150, 1535, 192)]: restar(img, b, dens, pool)
clean(img, (435, 515, 1215, 592), 9, grow=3, sig=6)                # headline (live text now)
clean(img, (18, 480, 665, 660), 5, grow=2, sig=6)                  # faint benefit lettering + its ring
clean(img, (1188, 640, 1545, 742), 5, grow=2, sig=6)               # faint "Engineering NATURAL LATEX Sleep System"
clean(img, (10, 755, 300, 900), 5, grow=2, sig=6)                  # faint "Dual Plush" / "organic"
from_above(img, (552, 872, 1036, 946), 92)                         # buttons (live HTML now)

# continue to the full picture: sky above the frame, sea below it
S = 1640 / W0; WF, HF = 1640, round(1640 * 2744 / 3554)
mid = Image.fromarray(np.clip(img, 0, 255).astype('uint8')).resize((WF, round(H0 * S)), Image.LANCZOS)
top = round(.076 * HF); out_img = np.zeros((HF, WF, 3))
mm = np.asarray(mid).astype(float); out_img[top:top + mm.shape[0]] = mm
# sky above the frame: mirror of the frame's own top rows (real stars, no seam), slightly darker towards the top
mir = mm[1:top + 1][::-1].copy()
out_img[:top] = mir * np.linspace(.82, 1, top)[:, None, None]
b0 = top + mm.shape[0]
if b0 < HF:
    n = HF - b0; out_img[b0:] = mm[-n:][::-1] * .96                   # mirror the last rows of the sea
res = Image.fromarray(np.clip(out_img, 0, 255).astype('uint8'))
os.makedirs(out, exist_ok=True)
for w in (1640, 2560):
    r = res if w == WF else res.resize((w, round(w * HF / WF)), Image.LANCZOS)
    b = io.BytesIO(); r.save(b, 'WEBP', quality=84, method=6); open(os.path.join(out, f'night-{w}.webp'), 'wb').write(b.getvalue())
    print(f'night-{w}.webp', r.size, len(b.getvalue()), 'bytes')
res.save('/tmp/claude-0/night-preview.png')
