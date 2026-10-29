#!/usr/bin/env python3
"""1.8.2: what the visitor sees under the risen Dual Plush mattress — the owner's own picture of it
(src/night/owner-dualplush-mockup.jpg: the woman's hip, the lower strap, the bed under her), mapped onto the hero master
(registration by the two straps + shoulder: master = (1496,1100) + (mockup1932 − (818,885)) × 1.944), its white
"Dual Plush" lettering and the lettering's faint mirror removed, tone-matched to the photo, feathered into it.
usage: make-vacated.py <assets-dir>"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, binary_dilation, distance_transform_edt, map_coordinates
A = sys.argv[1]
BOX = (0, 1700, 1480, 2420)
hero = np.asarray(Image.open(os.path.join(A, 'hero-band-3554.webp')).convert('RGB')).astype(float)
mk = np.asarray(Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../src/night/owner-dualplush-mockup.jpg')).convert('RGB')).astype(float)
J = mk.shape[1] / 1932
# 1. clean the mockup: its "Dual Plush" lettering + faint mirror, and its own floating mattress (ours covers it, but a
# sliver would peek out under ours): harmonic fill from the surrounding hip, plus the hip's own fine grain; then the
# lower strap, cut by the lettering, is drawn on up the hip with its own measured cross-section
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from inpaint import laplace_fill
BAND = [(55, 1160), (300, 1200), (530, 1250), (535, 1330), (470, 1328), (420, 1305), (395, 1296), (360, 1290), (55, 1232)]
# everything above the mockup mattress's lower edge (its mattress, and the body it floats over, which ours covers) is
# rebuilt from the hip below it only (the crop's top/left edges are free), so the tone continues the hip, not the mist
MATT = [(20, 900), (916, 900), (916, 1256), (566, 1378), (56, 1232), (20, 1232)]
# the strap where it shows below the letters (its diagonal run and the run along the bed, with the buckle) is kept,
# except under the letters' own white pixels
STRAP = [[(343, 1280), (357, 1280), (380, 1328), (560, 1330), (560, 1352), (366, 1350)]]
STRAP_RUN = [(366, 1340), (560, 1340), (620, 1334), (700, 1330), (780, 1318), (820, 1302), (860, 1275), (900, 1243)]   # traced
def poly(ps):
    m = Image.new('L', mk.shape[1::-1], 0); d = ImageDraw.Draw(m)
    for p in ps: d.polygon([(x * J, y * J) for x, y in p], fill=255)
    if ps is STRAP: d.line([(x * J, y * J) for x, y in STRAP_RUN], fill=255, width=round(20 * J), joint='curve')
    return np.asarray(m) > 0
lx0, ly0, lx1, ly1 = [round(v * J) for v in (20, 900, 960, 1420)]
cut = lambda a: a[ly0:ly1, lx0:lx1]
sub = mk[ly0:ly1, lx0:lx1]; sub0 = sub.copy()
white = binary_dilation(cut(mk.mean(-1)) > 196, iterations=6)
U = (cut(poly([BAND, MATT])) & ~cut(poly(STRAP))) | (white & cut(poly([BAND])))
U = binary_dilation(U, iterations=3) & ~(cut(poly(STRAP)) & ~white) | (white & cut(poly([BAND])))
f = laplace_fill(sub, U)
hp = sub - np.stack([gaussian_filter(sub[..., c], 1.5) for c in range(3)], -1)
ring = binary_dilation(U, iterations=30) & ~U; ring[:round((1300 - 900) * J)] = False
noise = gaussian_filter(np.random.default_rng(3).standard_normal(U.shape), .9)
noise *= .8 * hp[ring].mean(-1).std() / noise.std()
f[U] += noise[U][:, None]
# strap: visible from (350,1286) to (372,1338); its cross-section (strap minus skin), averaged along that run
A0, A1 = np.array([350., 1286.]), np.array([372., 1338.]); t = (A1 - A0) / np.linalg.norm(A1 - A0); nrm = np.array([-t[1], t[0]])
S = np.linspace(-9, 9, 37); prof = np.zeros((len(S), 3))
for u in np.linspace(.25, .85, 13):
    P = A0 + (A1 - A0) * u; pts = (P[None] + S[:, None] * nrm[None]) * J
    prof += np.stack([map_coordinates(mk[..., c], [pts[:, 1], pts[:, 0]], order=1) for c in range(3)], -1)
prof /= 13; prof -= np.linspace(prof[:4].mean(0), prof[-4:].mean(0), len(S))
prof[np.abs(S) > 7.5] = 0
# path: the strap climbs on up the hip, straight, under the risen mattress
B0, B1, B2 = A1, A0 - 60 * t, A0 - 160 * t
u = np.linspace(0, 1, 1200)[:, None]
C = (1 - u) ** 2 * B0 + 2 * u * (1 - u) * B1 + u * u * B2
T = 2 * (1 - u) * (B1 - B0) + 2 * u * (B2 - B1); T /= np.linalg.norm(T, axis=1, keepdims=True); N = np.stack([-T[:, 1], T[:, 0]], 1)
from scipy.spatial import cKDTree
ys, xs = np.nonzero(U); P = np.stack([(xs + lx0) / J, (ys + ly0) / J], 1)
dist, k = cKDTree(C).query(P); sd = ((P - C[k]) * N[k]).sum(1); near = dist < 9
for c in range(3): f[ys[near], xs[near], c] += np.interp(sd[near], S, prof[:, c])
mk[ly0:ly1, lx0:lx1] = f
if os.environ.get('VAC_DEBUG'): Image.fromarray(np.clip(np.vstack([sub0, f]), 0, 255).astype('uint8')).crop((round(250 * J), 0, round(560 * J), 2 * (ly1 - ly0))).save('/tmp/claude-0/mk-strap.png')
# 2. map onto the master
x0, y0, x1, y1 = BOX; yy, xx = np.mgrid[y0:y1, x0:x1].astype(float)
mx = (818 + (xx - 1496) / 1.944) * J; my = (885 + (yy - 1100) / 1.944) * J
src = np.stack([map_coordinates(mk[..., c], [my, mx], order=1, mode='nearest') for c in range(3)], -1)
ref = hero[y0:y1, x0:x1]
# 3. the area to replace: the old mattress footprint + its cast shadow
sh = Image.new('L', (x1 - x0, y1 - y0), 0)
ImageDraw.Draw(sh).polygon([(px - x0, py - y0) for px, py in [(0, 1925), (55, 1910), (600, 1765), (1100, 1825), (1340, 1840), (1350, 2060), (700, 2330), (0, 2200)]], fill=255)
hole = binary_dilation(np.asarray(sh) > 0, iterations=4)
def nconv(img, k, sig): return np.stack([gaussian_filter(img[..., c] * k, sig) / np.maximum(gaussian_filter(k, sig), 1e-6) for c in range(3)], -1)
# 4. tone match on a ring past the melt zone (low-frequency difference photo − mockup)
dout = distance_transform_edt(~hole)
ring = (dout > 36) & (dout < 90)
corr = nconv(ref - src, ring.astype(float), 50)
src = np.clip(src + corr, 0, 255)
# 5. the whole old footprint is the mockup; it melts into the photo OUTSIDE it, over ~40 px (the plate fades out there)
alpha = np.clip(1 - dout / 40, 0, 1); alpha = alpha * alpha * (3 - 2 * alpha)
out_rgb = src
out = np.dstack([np.clip(out_rgb, 0, 255), alpha * 255]).astype('uint8')
Image.fromarray(out, 'RGBA').save(os.path.join(A, 'mattress-bed.webp'), 'WEBP', quality=86, method=6)
W, H = 3554, 2744
print('mattress-bed.webp', out.shape[1::-1], os.path.getsize(os.path.join(A, 'mattress-bed.webp')), 'bytes; css left %.3f%% top %.3f%% width %.3f%% height %.3f%%' % (x0 / W * 100, y0 / H * 100, (x1 - x0) / W * 100, (y1 - y0) / H * 100))
prev = hero.copy(); a = alpha[..., None]; prev[y0:y1, x0:x1] = ref * (1 - a) + out[..., :3] * a
Image.fromarray(prev[1450:2350, 0:1800].astype('uint8')).save('/tmp/claude-0/vac-prev.png')
