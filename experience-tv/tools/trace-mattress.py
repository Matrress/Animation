#!/usr/bin/env python3
"""Trace a white line drawing (alpha channel) into clean SVG centre lines.

Used once to turn the owner's mattress line drawing (a white outline on transparency, 2732 x 2048) into
docs/mobile/premium/assets/botanic-mattress.svg. It thins the strokes (Zhang-Suen), walks the skeleton between
end and junction points, simplifies with Ramer-Douglas-Peucker and writes polylines. Pure numpy and Pillow.

    python3 tools/trace-mattress.py <input.webp|png> <out-polylines.json> [epsilon-px]

The SVG itself is then assembled by tools/build-mattress-svg.mjs (faces, zones, theming) from the polylines.
"""
import sys, json
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
eps = float(sys.argv[3]) if len(sys.argv) > 3 else 1.2
a = np.array(Image.open(src).convert('RGBA'))[..., 3]
ys, xs = np.where(a > 20)
x0, y0, x1, y1 = xs.min() - 8, ys.min() - 8, xs.max() + 8, ys.max() + 8
b = (a[y0:y1 + 1, x0:x1 + 1] > 40)
H, W = b.shape

def zs(img):
    img = img.copy()
    while True:
        changed = False
        for step in (0, 1):
            p = np.pad(img, 1)
            P2, P3, P4, P5, P6, P7, P8, P9 = (p[0:-2, 1:-1], p[0:-2, 2:], p[1:-1, 2:], p[2:, 2:], p[2:, 1:-1], p[2:, :-2], p[1:-1, :-2], p[0:-2, :-2])
            nb = [P2, P3, P4, P5, P6, P7, P8, P9]
            B = sum(n.astype(np.uint8) for n in nb)
            seq = nb + [P2]
            A = sum(((~seq[i]) & seq[i + 1]).astype(np.uint8) for i in range(8))
            if step == 0: c = (~(P2 & P4 & P6)) & (~(P4 & P6 & P8))
            else: c = (~(P2 & P4 & P8)) & (~(P2 & P6 & P8))
            rm = img & (B >= 2) & (B <= 6) & (A == 1) & c
            if rm.any(): img = img & ~rm; changed = True
        if not changed: return img

sk = zs(b)
pts = set(map(tuple, np.argwhere(sk)))
def _n(p, S):
    y, x = p
    return [(y + dy, x + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and (y + dy, x + dx) in S]
# remove staircase corner pixels (a pixel whose two neighbours already touch each other) so lines are unit width
changed = True
while changed:
    changed = False
    for p in list(pts):
        n = _n(p, pts)
        if len(n) == 2 and max(abs(n[0][0] - n[1][0]), abs(n[0][1] - n[1][1])) <= 1:
            pts.discard(p); changed = True
def nbrs(p):
    y, x = p
    return [(y + dy, x + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and (y + dy, x + dx) in pts]
deg = {p: len(nbrs(p)) for p in pts}
nodes = {p for p in pts if deg[p] != 2}
# cluster adjacent node pixels into one junction
cluster, cid = {}, 0
for p in nodes:
    if p in cluster: continue
    stack = [p]; cluster[p] = cid
    while stack:
        q = stack.pop()
        for n in nbrs(q):
            if n in nodes and n not in cluster: cluster[n] = cid; stack.append(n)
    cid += 1
cent = {}
for p, c in cluster.items(): cent.setdefault(c, []).append(p)
cent = {c: (np.mean([p[0] for p in v]), np.mean([p[1] for p in v])) for c, v in cent.items()}
seen = set(); chains = []
def walk(start, prev):
    path = [start]; cur = start; last = prev
    while True:
        nx = [n for n in nbrs(cur) if n != last]
        if not nx: break
        n = nx[0]
        if n in nodes: path.append(n); break
        if n in seen: break
        seen.add(n); path.append(n); last, cur = cur, n
    return path
for p in nodes:
    for n in nbrs(p):
        if n in nodes or n in seen: continue
        seen.add(n)
        ch = [p] + walk(n, p)
        chains.append(ch)
for p in pts:                              # closed loops without a node
    if p not in seen and p not in nodes:
        seen.add(p); chains.append([p] + walk(p, None))

def rdp(P, e):
    if len(P) < 3: return P
    P = np.array(P, float); a_, b_ = P[0], P[-1]; d = b_ - a_; L = np.hypot(*d)
    dist = np.abs(d[0] * (P[:, 1] - a_[1]) - d[1] * (P[:, 0] - a_[0])) / L if L else np.hypot(*(P - a_).T)
    i = dist.argmax()
    if dist[i] > e: return list(rdp(P[:i + 1], e))[:-1] + list(rdp(P[i:], e))
    return [P[0], P[-1]]
lines = []
for ch in chains:
    P = [(x, y) for y, x in ch]
    s = rdp([(float(x), float(y)) for x, y in P], eps)
    s = [(round(float(x), 1), round(float(y), 1)) for x, y in s]
    if len(s) >= 2 and len(ch) >= 12: lines.append(s)
json.dump({'width': int(W), 'height': int(H), 'offset': [int(x0), int(y0)], 'epsilon': eps, 'polylines': lines}, open(out, 'w'))
print('skeleton px', len(pts), 'chains', len(chains), 'polylines', len(lines), 'points', sum(len(l) for l in lines), 'size', W, 'x', H)
