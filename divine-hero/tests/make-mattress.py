#!/usr/bin/env python3
"""1.8.0: the Dual Plush mattress as its own layer (for the "sunrise" bloom on the system point). Cut from the hero
master along its measured silhouette (convex hexagon, 3554×2744 px), anti-aliased and slightly rounded; exported at
master resolution with alpha. usage: make-mattress.py <assets-dir>"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
A = sys.argv[1]
BOX = (40, 1760, 1112, 2190)                                       # crop (master px)
POLY = [(62, 1924), (100, 1911), (600, 1779), (1080, 1836), (1092, 1850), (1092, 1950), (650, 2163), (600, 2163), (62, 2042)]
hero = Image.open(os.path.join(A, 'hero-band-3554.webp')).convert('RGB')
crop = hero.crop(BOX); w, h = crop.size; S = 4
m = Image.new('L', (w * S, h * S), 0)
ImageDraw.Draw(m).polygon([((x - BOX[0]) * S, (y - BOX[1]) * S) for x, y in POLY], fill=255)
from scipy.ndimage import gaussian_filter
mm = np.asarray(m.resize((w, h), Image.LANCZOS)).astype(float) / 255
mm = gaussian_filter(mm, .9)                                          # soft ~1.5 px edge, slightly rounded corners
a = (np.clip((mm - .5) * 2.4 + .5, 0, 1) * 255).astype('uint8')
out = crop.convert('RGBA'); out.putalpha(Image.fromarray(a))
Image.fromarray(a).save('/tmp/claude-0/mat-alpha.png')
out.save(os.path.join(A, 'mattress.webp'), 'WEBP', quality=88, method=6)
print('mattress.webp', out.size, os.path.getsize(os.path.join(A, 'mattress.webp')), 'bytes')
# CSS geometry (picture %): box + transform origin at the front-bottom-left corner
W, H = 3554, 2744; P = (60, 2052)
print('left %.3f%% top %.3f%% width %.3f%% height %.3f%% origin %.2f%% %.2f%%' % (BOX[0] / W * 100, BOX[1] / H * 100, w / W * 100, h / H * 100, (P[0] - BOX[0]) / w * 100, (P[1] - BOX[1]) / h * 100))
