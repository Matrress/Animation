# Film v2 of the turning model. Everything is laid into Hero 1.20.2's own picture (words, mattress, bed and sky stay the hero's), the model is
# slowed, relit from the hero photo, moved by a few soft anatomical motions (shoulder, shoulder blade, back, weight sinking into the bed),
# and the last frame is exactly the hero picture.
#   usage: film2.py A|B [first last]        A = the opening turn, B = the re-settle (hero pose -> a small roll back -> hero pose)
import numpy as np, cv2, os, sys
from PIL import Image
from geo import *
import grade2
FPS = 30
H_ = np.array(Image.open('../repo/divine-hero/release/1.20.2/assets/hero-band-1640.webp').convert('RGB'), np.float32)
H_INP = np.load('H_inp.npy').astype(np.float32); TM = np.load('TM.npy').astype(np.float32)
PLATE = np.array(Image.open('../vid/plate.png').convert('RGB'), np.float32)
CURVE = np.load('curve.npy'); GAIN = np.load('gain.npy')
OW, OH = 1280, 988
def sstep(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def ease(t): t = np.clip(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10)
# ---------------------------------------------------------------- source frames (cached by prep2.py)
_cache = {}
def src(i):
    if i not in _cache:
        if len(_cache) > 6: _cache.pop(next(iter(_cache)))
        F = np.load(f'cache/F{i:03d}.npy').astype(np.float32); A = np.load(f'cache/A{i:03d}.npy').astype(np.float32) / 255
        _cache[i] = (F * A[..., None], A)
    return _cache[i]
_fl = {}
def flow(kind, i):
    k = (kind, i)
    if k not in _fl:
        if len(_fl) > 8: _fl.pop(next(iter(_fl)))
        _fl[k] = np.load(f'cache/{kind}{i:03d}.npy').astype(np.float32)
    return _fl[k]
_gy, _gx = np.mgrid[0:720, 0:1280].astype(np.float32)
def warp(img, fl): return cv2.remap(img, _gx + fl[..., 0], _gy + fl[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
def interp(tau):
    """the model at a fractional source frame: motion-compensated blend of the two neighbours (premultiplied colour + alpha)"""
    i = int(np.floor(tau)); s = float(tau - i)
    i = min(max(i, 8), 116)
    if s < 1e-3 or i >= 116: P, A = src(min(max(int(round(tau)), 8), 116)); return P, A
    P0, A0 = src(i); P1, A1 = src(i + 1); f01, f10 = flow('fw', i), flow('bw', i)
    Ft0 = -(1 - s) * s * f01 + s * s * f10; Ft1 = (1 - s) ** 2 * f01 - s * (1 - s) * f10
    W0 = np.dstack([P0, A0]); W1 = np.dstack([P1, A1])
    out = (1 - s) * warp(W0, Ft0) + s * warp(W1, Ft1)
    return out[..., :3], out[..., 3]
# ---------------------------------------------------------------- static layers
def build_keep():
    """the base picture: the hero's own pixels everywhere, except behind the model's final silhouette, where the clean sky is used (the model moves; the hero's sky, bed and pillow do not)"""
    a = np.load('cache/A116.npy').astype(np.float32) / 255; W = np.zeros((BH, BW), np.float32); W[RY0:RY0 + RH, RX0:RX0 + RW] = to_roi(a)
    Wd = cv2.dilate((W > 0.04).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
    Ws = cv2.GaussianBlur(Wd.astype(np.float32), (0, 0), 9)
    S = np.load('../vid/S.npy').astype(np.float32); Sr = np.zeros((BH, BW), np.float32); Sr[RY0:RY0 + RH, RX0:RX0 + RW] = to_roi(S)
    Sr = cv2.GaussianBlur(cv2.erode((Sr > 0.5).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32), (0, 0), 3)
    Ws = (Ws * (1 - Sr))[..., None]
    return H_INP * (1 - Ws) + PLATE * Ws, Ws
KEEP, DS = build_keep()
MATM = mat_mask(2, 1.2)[..., None]
TM1 = np.load('TM1.npy').astype(np.float32)[..., None]; TM2 = np.load('TM2.npy').astype(np.float32)[..., None]
# the hero's words are laid over the picture as a difference (word minus the picture around it), so no patch of the hero's own sky can show
_med = np.dstack([cv2.medianBlur(H_.astype(np.uint8)[..., c], 31) for c in range(3)]).astype(np.float32)
DELTA = (H_ - H_INP) * TM1 + (H_ - _med) * TM2 * DS      # words on the model / pillow; words on the sky only where the clean sky replaced the picture
# ---------------------------------------------------------------- motion
BLOBS = dict(scap=(470, 690, 85), shoulder=(330, 500, 120))
YY, XX = np.mgrid[RY0:RY0 + RH, RX0:RX0 + RW].astype(np.float32)
W_SINK = (sstep(760, 960, YY) * (1 - sstep(1000, 1200, XX))).astype(np.float32)
def gauss(cx, cy, s): return np.exp(-(((XX - cx) / s) ** 2 + ((YY - cy) / s) ** 2) / 2).astype(np.float32)
G_SCAP = gauss(*BLOBS['scap']); G_SH = gauss(*BLOBS['shoulder']); G_BACK = gauss(560, 640, 150)
R2 = ((XX - 560) ** 2 + (YY - 760) ** 2)
def disp(ts, breathe):
    """displacement field (dx, dy) in hero-picture pixels for settle-time ts (seconds after the turn ended); all of it is zero when ts >= Ts"""
    Ts = 2.0
    fin = 1 - sstep(1.55, Ts, ts)                                                           # everything is back to the hero pose exactly at the end
    sink = ease(ts / 0.55) * (1 - ease((ts - 0.55) / 1.35)) - 0.14 * np.sin(np.pi * np.clip((ts - 1.3) / 0.7, 0, 1))
    env = np.exp(-ts / 0.85) * fin
    sc = 5.5 * env * np.sin(2 * np.pi * 2.3 * ts) * (1 - np.exp(-max(ts, 0) / 0.12))
    relax = -8.0 * sstep(0, 0.35, ts) * (1 - ease((ts - 0.35) / 1.4))                      # the upper shoulder rises a little with the arrival, then lets go (delayed)
    bump = sstep(0, 0.5, ts) * (1 - ease((ts - 0.5) / 1.3))                                   # the upper back gives a little, a moment later
    br = breathe * np.sin(2 * np.pi * (ts / 3.2) - np.pi / 2)
    dx = np.zeros_like(XX); dy = np.zeros_like(XX)
    if ts >= 0:
        dy += 9.0 * sink * W_SINK
        dx += 0.74 * sc * G_SCAP; dy += -0.67 * sc * G_SCAP
        dy += relax * G_SH; dx += 0.15 * relax * G_SH
        dy += 4.0 * bump * G_BACK; dx += -1.6 * bump * G_BACK
    k = br * np.exp(-R2 / (2 * 330.0 ** 2)) * fin                                          # the back breathes: a very slight swell around the middle of the back
    dx += (XX - 560) * k; dy += (YY - 760) * k * 0.8
    return dx, dy
# ---------------------------------------------------------------- timeline
def timeline(kind):
    if kind == 'A': Tt, Ts = 6.4, 2.0
    else: Tt, Ts = 3.2, 2.0
    n = int(round((Tt + Ts) * FPS)); return Tt, Ts, n
def state(kind, t):
    Tt, Ts, n = timeline(kind)
    if t < Tt:
        u = t / Tt
        if kind == 'A': tau = 8 + 108 * ((1 - 0.85) * u + 0.85 * ease(u) + 0.014 * np.sin(2 * np.pi * 1.6 * u) * np.sin(np.pi * u) ** 2); ts = -1; wg = sstep(.5, 1.0, u); br = 0.0035 * sstep(.6, 1, u)
        else: b = np.sin(np.pi * ease(u)) ** 2; tau = 116 - 20 * b; ts = -1; wg = 1.0; br = 0.0012
    else:
        tau = 116; ts = t - Tt; wg = 1.0; br = 0.0035 * (1 - sstep(1.2, 2.0, ts)) if kind == 'A' else 0.0030 * (1 - sstep(1.2, 2.0, ts))
    wb = sstep(Ts - 0.9, Ts, ts) if ts >= 0 else 0.0                                       # the last 0.9 s: the model's pixels become the hero photo's
    return tau, ts, wg, br, wb
EDGE = (np.clip((1278 - np.arange(1280)) / 40, 0, 1)[None, :] * np.clip((np.arange(720)[:, None] - 2) / 50, 0, 1) ** 1.5).astype(np.float32)
def frame(kind, k):
    t = k / FPS; tau, ts, wg, br, wb = state(kind, t)
    P, A = interp(tau)
    P = P * EDGE[..., None]; A = A * EDGE
    Pr = to_roi(P); Ar = to_roi(A)
    Fr = Pr / np.maximum(Ar, 1e-3)[..., None]
    G = grade2.apply(np.clip(Fr, 0, 255), CURVE, GAIN, wg)
    if ts >= 0 or br:
        dx, dy = disp(ts if ts >= 0 else -1, br)
        mx, my = XX - RX0 - dx, YY - RY0 - dy
        pk = np.dstack([G * Ar[..., None], Ar]).astype(np.float32)
        pk = cv2.remap(pk, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        Ar = np.clip(pk[..., 3], 0, 1); G = pk[..., :3] / np.maximum(Ar, 1e-3)[..., None]
    if True:
        sh = cv2.GaussianBlur(G, (0, 0), 1.5); G = np.clip(G + 0.28 * (G - sh), 0, 255)
        nz = cv2.GaussianBlur(np.random.default_rng(1000 + k).normal(0, 1, (RH, RW)).astype(np.float32), (0, 0), 0.7) * 2.0
        G = np.clip(G + nz[..., None] * (1 - wb), 0, 255)
    out = KEEP.copy()
    roi = out[RY0:RY0 + RH, RX0:RX0 + RW]
    roi[:] = roi * (1 - Ar[..., None]) + G * Ar[..., None]
    out = out * (1 - MATM) + H_ * MATM                                                     # the mattress picture stays in front of the bed and the model
    out = out + DELTA                                                                      # the hero's words lie over everything, as in the hero
    if wb > 0: out = out * (1 - wb) + H_ * wb
    return cv2.resize(np.clip(out, 0, 255).astype(np.uint8), (OW, OH), interpolation=cv2.INTER_AREA)
if __name__ == '__main__':
    kind = sys.argv[1]; Tt, Ts, n = timeline(kind)
    a, b = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (0, n)
    os.makedirs(f'out_{kind}', exist_ok=True)
    for k in range(a, min(b, n)):
        Image.fromarray(frame(kind, k)).save(f'out_{kind}/f{k:04d}.png')
    print('frames', n)
