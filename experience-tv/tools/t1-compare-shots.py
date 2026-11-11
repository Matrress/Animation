#!/usr/bin/env python3
"""T1: pixel comparison of two folders of screenshots (same file names). Prints one line per pair and a summary.
   python3 tools/t1-compare-shots.py <before-dir> <after-dir> [<label>]"""
import sys, os
from PIL import Image, ImageChops
a, b = sys.argv[1], sys.argv[2]
label = sys.argv[3] if len(sys.argv) > 3 else ''
names = sorted(f for f in os.listdir(a) if f.lower().endswith('.png'))
same = diff = missing = 0
for n in names:
    pb = os.path.join(b, n)
    if not os.path.exists(pb): missing += 1; print('MISSING', n); continue
    x, y = Image.open(os.path.join(a, n)).convert('RGB'), Image.open(pb).convert('RGB')
    if x.size != y.size: diff += 1; print('SIZE   ', n, x.size, y.size); continue
    bbox = ImageChops.difference(x, y).getbbox()
    if bbox is None: same += 1
    else:
        diff += 1; d = ImageChops.difference(x, y); px = sum(1 for p in d.getdata() if p != (0, 0, 0)); print('DIFF   ', n, 'bbox', bbox, 'pixels', px)
print(f'{label}: {len(names)} screenshots, identical {same}, different {diff}, missing {missing}')
sys.exit(0 if diff == 0 and missing == 0 else 1)
