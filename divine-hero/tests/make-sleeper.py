#!/usr/bin/env python3
"""1.9.1 "Natural Adaptation": the layers that let ONLY the sleeper move (hero.js settle).
Out of the master photo, inside the settle box ROI (master px), at half scale:
  sleeper-mask.webp  (lossless RGB)   R = the woman's alpha (soft edge)
                                      G = the baked white lettering lying on her, with its drop shadow, feathered: it
                                          stays put (the photo itself shows there); her skin under it is rebuilt in the
                                          plate so she moves under it without carrying a copy of the letters
                                      B = her contour band, where the background behind her is rebuilt
  sleeper-plate.webp (RGB)            the rebuilt pixels: background behind her contour band; her skin under the letters
The browser composites:  out = W(q) + (1 − A(q))·(Bg(p) − Bg(q)),  q = p − D(p)  (W: her, letters removed; Bg: clean
background), then lays the original lettering back on top. At rest (D = 0) this is exactly the photo.
usage: make-sleeper.py <assets-dir>"""
import sys, os
import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes, binary_opening, binary_closing, label, binary_dilation, distance_transform_edt, gaussian_filter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from inpaint import laplace_fill
A_DIR = sys.argv[1]
ROI = (1000, 760, 2960, 2160)
S = .5
x0, y0, x1, y1 = ROI
full = np.asarray(Image.open(os.path.join(A_DIR, 'hero-band-3554.webp')).convert('RGB')).astype(float)
img = full[y0:y1, x0:x1]
H, W = img.shape[:2]
L = img.mean(-1)
yy, xx = np.mgrid[y0:y1, x0:x1]
def rect(a, b, c, d): return (xx >= a) & (xx < c) & (yy >= b) & (yy < d)
# baked lettering boxes (master px)
DARK_LETTERS = [rect(1500, 690, 2270, 965), rect(1740, 1625, 2310, 1715), rect(1730, 1750, 3430, 1890), rect(2690, 1910, 3310, 2000)]
WHITE_ON_HER = [rect(900, 1280, 1530, 1430), rect(840, 1465, 1540, 1655)]
dark_letters = np.zeros_like(L, bool)
for r in DARK_LETTERS: dark_letters |= r
# 1. the woman: darker than everything around her (sky/pillow/mattress >= ~196, skin <= ~185, hair ~50)
hard = (L < 190) & ~dark_letters
hard &= yy < 2075                                           # never the mattress's shadows below her
hard = binary_opening(hard, iterations=2)
lab, n = label(hard); keep = lab[(1500 - y0), (1350 - x0)]   # seed in her back
body = lab == keep
body = binary_closing(body, iterations=3)
body = binary_fill_holes(body)                              # the white letters on her back are her too
# soft edge from the luminance ramp at the contour (anti-aliasing / hair wisps), only near the hard edge
edge = binary_dilation(body, iterations=3) & ~binary_dilation(~body, iterations=3) if False else None
near = binary_dilation(body, iterations=9) & ~binary_opening(body, iterations=4)
ramp = np.clip((219 - L) / 42, 0, 1)                       # her soft fringe reaches ~6 px into the sky: it goes with her
alpha = body.astype(float)
zone = near & ~dark_letters
alpha[zone] = np.maximum(ramp[zone] * binary_dilation(body, iterations=9)[zone], 0)
alpha[body & ~near] = 1
alpha = np.clip(gaussian_filter(alpha, .6), 0, 1)
# 2. the white lettering on her (overlay) and where her skin under it is rebuilt
white = np.zeros_like(L, bool)
for r in WHITE_ON_HER: white |= r
white &= binary_dilation(body, iterations=6)
G = np.clip((L - 172) / 34, 0, 1) * white
core = binary_dilation(G > .05, iterations=8)           # the letters and their soft drop shadow
lettered = binary_dilation(core, iterations=4)           # rebuilt under the letters (never shown at rest: see STAY)
plateau = binary_dilation(core, iterations=3)
STAY = np.clip(1 - distance_transform_edt(~plateau) / 10, 0, 1)   # what stays put: 1 over letters+shadow, feathered outward
skin = img.copy()
skin = laplace_fill(skin, lettered)
hp = img - np.stack([gaussian_filter(img[..., c], 1.2) for c in range(3)], -1)
ring = binary_dilation(lettered, iterations=10) & ~lettered & body
noise = gaussian_filter(np.random.default_rng(7).standard_normal(L.shape), .7)
skin[lettered] += (noise / noise.std() * hp[ring].mean(-1).std())[lettered][:, None]
# 3. the background behind her contour band (what shows where she moves away): harmonic fill of her whole area
#    from the background around her (lettering on the background is rebuilt too, never used as a source)
unknown = (binary_dilation(alpha > .02, iterations=10)) | dark_letters
small = lambda a, mode=Image.BILINEAR: np.asarray(Image.fromarray(a).resize((round(W * S), round(H * S)), mode))
img_s = np.stack([small(img[..., c].astype(np.float32)) for c in range(3)], -1).astype(float)
unk_s = small(unknown.astype(np.uint8) * 255, Image.BILINEAR) > 30
unk_s[0, :] = unk_s[-1, :] = False; unk_s[:, 0] = unk_s[:, -1] = False
bg_s = laplace_fill(img_s, unk_s)
dist_in = distance_transform_edt(alpha > .02)
band = np.clip((40 - dist_in) / 12, 0, 1) * (alpha > .02)
band = np.maximum(band, (binary_dilation(alpha > .002, iterations=8) & (dist_in < 60)) * 1.0)   # reaches past her soft edge: no trace of the old contour
# 4. pack at half scale
skin_s = np.stack([small(skin[..., c].astype(np.float32)) for c in range(3)], -1)
let_s = small((lettered * 255).astype(np.uint8)).astype(float) / 255
band_s = small((band * 255).astype(np.uint8)).astype(float) / 255
plate = np.where(let_s[..., None] > .02, skin_s, bg_s)
mask = np.dstack([small((alpha * 255).astype(np.uint8)), small((STAY * 255).astype(np.uint8)), (band_s * 255).astype(np.uint8)])
Image.fromarray(mask.astype(np.uint8), 'RGB').save(os.path.join(A_DIR, 'sleeper-mask.webp'), 'WEBP', lossless=True, quality=100, method=6)
Image.fromarray(np.clip(plate, 0, 255).astype(np.uint8)).save(os.path.join(A_DIR, 'sleeper-plate.webp'), 'WEBP', quality=82, method=6)
for f in ('sleeper-mask.webp', 'sleeper-plate.webp'): print(f, os.path.getsize(os.path.join(A_DIR, f)), 'bytes', mask.shape[1::-1])
if os.environ.get('SLEEPER_DEBUG'):
    v = img.copy(); v[..., 0] = np.where(alpha > .5, v[..., 0] * .5 + 127, v[..., 0])
    Image.fromarray(v[::2, ::2].astype(np.uint8)).save('/tmp/claude-0/sl-alpha.png')
    Image.fromarray(np.clip(bg_s, 0, 255).astype(np.uint8)).save('/tmp/claude-0/sl-bg.png')
    Image.fromarray(np.clip(skin[::2, ::2], 0, 255).astype(np.uint8)).save('/tmp/claude-0/sl-skin.png')
