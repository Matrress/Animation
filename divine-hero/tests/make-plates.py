#!/usr/bin/env python3
"""1.4.2: rebuild the two "clean background" plates so they only cover the baked-in lettering.
The v26 plates replaced whole rectangles (benefits list; DIVINE logo) with a lower-resolution copy that also held
part of the mattress and the shoulder, so those visibly shifted/blurred when a hotspot opened. Here each plate is
re-registered to the photo, tone-matched to it (low-frequency correction measured outside the letters), and given an
alpha mask = the letters + a soft margin. Everywhere else the original photo shows through unchanged.
usage: make-plates.py <src-assets-dir> <out-assets-dir>"""
import sys
from PIL import Image, ImageChops, ImageFilter
import numpy as np
src, out = sys.argv[1], sys.argv[2]
hero = Image.open(src + '/hero-band-3554.webp').convert('RGB'); W, H = hero.size
# (css box in plane fractions, registration nudge in hero px, lettering zone in plate fractions x0,y0,x1,y1)
CFG = {'plate-back': ((.008, .4468, .457, .2396), (0, 0, 0, 0), (0, 0, .93, .70)),
       'plate-logo': ((.335, .246, .375, .1813), (-4, 0, 12, 0), (.06, 0, .82, .63))}
from scipy.ndimage import gaussian_filter
def blur(a, r): return gaussian_filter(a.astype(float), r)
for name, ((l, t, w, h), d, zone) in CFG.items():
    p = Image.open(src + f'/{name}.webp').convert('RGBA'); pw, ph = p.size
    css = [l * W, t * H, (l + w) * W, (t + h) * H]
    x0, y0, x1, y1 = css[0] + d[0], css[1] + d[1], css[2] + d[2], css[3] + d[3]
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0)); canvas.paste(p.resize((round(x1 - x0), round(y1 - y0)), Image.LANCZOS), (round(x0), round(y0)))
    cb = tuple(round(v) for v in css)
    warped = canvas.crop(cb).resize((pw, ph), Image.LANCZOS)
    under = np.asarray(hero.crop(cb).resize((pw, ph), Image.LANCZOS)).astype(float)
    rgb = np.asarray(warped.convert('RGB')).astype(float)
    text = np.abs(rgb - under).mean(-1) > 22
    zm = np.zeros(text.shape, bool); zm[int(zone[1] * ph):int(zone[3] * ph), int(zone[0] * pw):int(zone[2] * pw)] = True
    text &= zm  # mattress, strap and hair edges lie outside the lettering zone and must come from the photo
    text = np.asarray(Image.fromarray((text * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3))) > 0
    # tone match: residual (photo - plate) measured off the letters, spread smoothly under them
    wgt = (~np.asarray(Image.fromarray((text * 255).astype('uint8')).filter(ImageFilter.MaxFilter(15))).astype(bool)).astype(float)
    corr = np.stack([blur((under[..., c] - rgb[..., c]) * wgt, 10) / np.maximum(blur(wgt, 10), 1e-3) for c in range(3)], -1)
    fixed = np.clip(rgb + corr, 0, 255)
    m = np.asarray(Image.fromarray((text * 255).astype('uint8')).filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(4))).astype(float)
    a = np.minimum(np.clip(m * 1.8, 0, 255), np.asarray(warped.getchannel('A')).astype(float))
    res = Image.fromarray(np.dstack([fixed, a]).astype('uint8'), 'RGBA')
    res.save(out + f'/{name}.webp', 'WEBP', quality=92, method=6)
    print(name, 'cover %.0f%%' % (100 * (a > 8).mean()))
