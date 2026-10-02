#!/usr/bin/env python3
"""1.7.1: plate-logo without the v26 shoulder drawing (owner, iPad: opening "Balance & Relief" made the shoulder's corner
bulge — the v26 plate draws that corner larger and higher than the photo). Composite of three sources:
  sky       → the aligned, tone-matched v26-derived plate (clean, proven: tests/make-plates.py, release 1.4.2+)
  shoulder  → the photo's own shoulder; letters on it filled from the shoulder only (normalised convolution, grain)
  the plate's own darker "bulge" lying over the photo's sky → photo sky
usage: make-logo-plate.py <assets-dir with hero + 1.4.2+ plate-logo> (rewrites plate-logo.webp at 940×350)"""
import sys, os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, binary_dilation, binary_fill_holes, label
A = sys.argv[1]
hero = Image.open(os.path.join(A, 'hero-band-3554.webp')).convert('RGB'); W, H = hero.size
cb = (round(.335 * W), round(.246 * H), round(.71 * W), round(.4273 * H)); PW, PH = 940, 350
reg = np.asarray(hero.crop(cb).resize((PW, PH), Image.LANCZOS)).astype(float)
pl = np.asarray(Image.open(os.path.join(A, 'plate-logo.webp')).convert('RGBA').resize((PW, PH), Image.LANCZOS)).astype(float)
prgb, pa = pl[..., :3], pl[..., 3] / 255
L = gaussian_filter(reg.mean(-1), 2)
# the shoulder's contour, read off the photo (box coords, 3554-master px; tests: grid render): top edge y 57 at x 0,
# rising ~1 px per 50 px, flat-ish to x 120, then a quarter ellipse to the vertical right side at x 305 (from y 205).
k = PW / (cb[2] - cb[0]); yy, xx = np.mgrid[0:PH, 0:PW].astype(float) / k
top = np.where(xx < 120, 57 - xx / 50, 205 - (205 - 54.6) * np.sqrt(np.clip(1 - ((xx - 120) / 185) ** 2, 0, 1)))
inside = np.clip(np.minimum((yy - top) * k, (305 - xx) * k) + .5, 0, 1)            # anti-aliased shape
inside = np.where(xx > 305, 0, inside)
shape = inside > .5
zone = np.zeros(L.shape, bool); zone[0:int(.60 * PH), :int(.82 * PW)] = True
letters = binary_dilation(zone & (pa > .3) & (np.abs(prgb - reg).mean(-1) > 10), iterations=9)
def fill_from(sel):
    kk = sel.astype(float); outp = np.zeros_like(reg); done = np.zeros(sel.shape, bool)
    for sig in (4, 8, 16, 32, 64):
        den = gaussian_filter(kk, sig); num = np.stack([gaussian_filter(reg[..., c] * kk, sig) for c in range(3)], -1)
        ok = (den > .05) & ~done; outp[ok] = (num / np.maximum(den, 1e-9)[..., None])[ok]; done |= ok
    outp[~done] = (num / np.maximum(den, 1e-9)[..., None])[~done]
    return outp
rng = np.random.default_rng(9)
hp = reg - np.stack([gaussian_filter(reg[..., c], 1.2) for c in range(3)], -1)
good_body = shape & ~letters & (L < 200)
body_fill = fill_from(good_body) + rng.standard_normal((PH, PW))[..., None] * hp[good_body].std(0)
fix_in = shape & (letters | (L >= 200))                              # letters (and light letter rims) on the shoulder
# outside the contour: the aligned v26 plate where it paints sky; elsewhere (photo shoulder beyond the contour) photo sky
sky_ok = ~binary_dilation(shape, iterations=3) & (L >= 196) & ~binary_dilation(letters, iterations=14)
sky_fill = fill_from(sky_ok) + rng.standard_normal((PH, PW))[..., None] * hp[sky_ok].std(0)
# sky: from the photo's own sky too (the v26 plate's sky had a slightly different tone that showed as a faint box)
core = zone & (pa > .3) & (np.abs(prgb - reg).mean(-1) > 35)
halo = binary_dilation(core, iterations=30) & zone & (np.abs(prgb - reg).mean(-1) > 3)          # emboss + soft shadow
sky_mask = binary_dilation(binary_dilation(core, iterations=9) | halo, iterations=5) & ~shape
out_rgb = sky_fill
outside_fix = sky_mask | (~shape & (L < 196) & (xx < 360) & (yy < 300))   # letters on the sky; dark beyond the contour near it (not the hair)
rgb = np.where(shape[..., None], body_fill, out_rgb)
a = np.where(shape, fix_in.astype(float), outside_fix.astype(float))
# anti-aliased contour: blend the two sides along it
edge = (inside > 0) & (inside < 1)
rgb = np.where(edge[..., None], body_fill * inside[..., None] + out_rgb * (1 - inside[..., None]), rgb)
a = np.where(edge & (a > 0), 1, a)
a = np.clip(gaussian_filter(a, 1.6) * 1.3, 0, 1)
Image.fromarray(np.dstack([np.clip(rgb, 0, 255), a * 255]).astype('uint8'), 'RGBA').save(os.path.join(A, 'plate-logo.webp'), 'WEBP', quality=90, method=6)
print('plate-logo.webp', (PW, PH), os.path.getsize(os.path.join(A, 'plate-logo.webp')), 'bytes')
