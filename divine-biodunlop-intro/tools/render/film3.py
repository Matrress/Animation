# Film v3 of the turning model (0.3.0-dev). Everything is laid into Hero 1.20.2's own picture (words, mattress, bed and sky stay the hero's), the model
# is slowed right down and relit from the hero photo. It is a plain, smooth ROTATION: no settling, no extra shoulder / blade / back movements (the owner
# asked for the earlier look back). The last frame is exactly the hero picture.
#   usage: film3.py A|B [first last]        A = the opening turn (supine -> side, 9.6 s), B = the turn again (hero pose -> rolls back -> turns forward again)
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
# ---------------------------------------------------------------- timeline
TURN_A, TURN_B, HOLD = 9.6, 7.8, 0.9      # seconds: the slow turn / the turn again / the last stretch in which the model's pixels become the hero photo's
BACK_R, BACK_U = 66, 0.30                 # B: rolls back by 66 of the 108 source frames (about 60 %), in the first 30 % of its time
def timeline(kind):
    Tt = TURN_A if kind == 'A' else TURN_B
    n = int(round((Tt + HOLD) * FPS)); return Tt, HOLD, n
def state(kind, t):
    Tt, Ts, n = timeline(kind)
    if t < Tt:
        u = t / Tt
        if kind == 'A': tau = 8 + 108 * ease(u); wg = sstep(.5, 1.0, u)               # slow start, a long soft arrival; the hero's light is ramped in as the body arrives
        else:
            tau = 116 - BACK_R * ease(u / BACK_U) if u < BACK_U else 116 - BACK_R + BACK_R * ease((u - BACK_U) / (1 - BACK_U)); wg = 1.0
        ts = -1
    else:
        tau = 116; ts = t - Tt; wg = 1.0
    wb = sstep(Ts - HOLD, Ts, ts) if ts >= 0 else 0.0
    return tau, ts, wg, wb
EDGE = (np.clip((1278 - np.arange(1280)) / 40, 0, 1)[None, :] * np.clip((np.arange(720)[:, None] - 2) / 50, 0, 1) ** 1.5).astype(np.float32)
def frame(kind, k):
    t = k / FPS; tau, ts, wg, wb = state(kind, t)
    P, A = interp(tau)
    P = P * EDGE[..., None]; A = A * EDGE
    Pr = to_roi(P); Ar = to_roi(A)
    Fr = Pr / np.maximum(Ar, 1e-3)[..., None]
    G = grade2.apply(np.clip(Fr, 0, 255), CURVE, GAIN, wg)
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
    os.makedirs(f'o3_{kind}', exist_ok=True)
    for k in range(a, min(b, n)):
        Image.fromarray(frame(kind, k)).save(f'o3_{kind}/f{k:04d}.png')
    print('frames', n)
