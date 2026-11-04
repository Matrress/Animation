# Film v8 (0.3.5-dev): hair is calmed at the source (prep3.calm_hair), no per-frame hair filtering or grain (it boiled), and the key pictures are blended only where the flow
# can be trusted (no ghost / smoke at the hair-pillow edge) | v7 (0.3.4-dev): + the lace keeps its embroidery (matte, skin-toned) and is left out of the glint removal; the garment's vertical edge is no longer part of the static
# 'words' layer (it moves with the body); hair gloss capped harder | v6 (0.3.3-dev): + exact mattress mask (its own cut-out + the shadow below it, always the hero's), hair kept crisp and matte, the last blend into the hero is a MORPH
# (the film's last pose is slid onto the hero's pixels while it fades, so thin things like the bra strap never show twice) | v5 (0.3.2-dev): + glints and gloss on skin and hair are taken down (no balloon / reflection look) | v4 (0.3.1-dev): film3 + a clean matte (cache3: no specks, no rim, no lace) + the clip's real 10 pictures/s timeline (no ticking). Everything is laid into Hero 1.20.2's own picture (words, mattress, bed and sky stay the hero's), the model
# is slowed right down and relit from the hero photo. It is a plain, smooth ROTATION: no settling, no extra shoulder / blade / back movements (the owner
# asked for the earlier look back). The last frame is exactly the hero picture.
#   usage: film8.py A|B [first last]        A = the opening turn (supine -> side, 9.6 s), B = the turn again (hero pose -> rolls back -> turns forward again)
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
        F = np.load(f'cache3/F{i:03d}.npy').astype(np.float32); A = np.load(f'cache3/A{i:03d}.npy').astype(np.float32) / 255
        Lm = np.load(f'cache3/L{i:03d}.npy').astype(np.float32) / 255
        _cache[i] = (F * A[..., None], A, Lm)
    return _cache[i]
_fl = {}
def flow(kind, i):
    k = (kind, i)
    if k not in _fl:
        if len(_fl) > 8: _fl.pop(next(iter(_fl)))
        _fl[k] = np.load(f'cache3/{kind}{i:03d}.npy').astype(np.float32)
    return _fl[k]
_gy, _gx = np.mgrid[0:720, 0:1280].astype(np.float32)
def warp(img, fl): return cv2.remap(img, _gx + fl[..., 0], _gy + fl[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
import json
_K = json.load(open('cache3/keys.json')); SP = _K['spikes']; _LN = np.array(_K['len'])
_sm = np.convolve(np.pad(_LN, (3, 3), mode='edge'), np.ones(7) / 7, 'valid')                  # the pace of the movement, smoothed: no quicker-slower-quicker beat
CUM = np.concatenate([[0], np.cumsum(_sm)]); LT = float(CUM[-1])
def interp(lam):
    """the model at path position lam (0 = first real picture, LT = last): motion-compensated blend of the two real pictures around it"""
    lam = float(np.clip(lam, 0, LT - 1e-6)); k = int(np.searchsorted(CUM, lam, 'right') - 1); k = min(max(k, 0), len(SP) - 1)
    s = float((lam - CUM[k]) / (CUM[k + 1] - CUM[k])); j = SP[k]
    P0, A0, L0 = src(j); P1, A1, L1 = src(j + 1); f01, f10 = flow('kfw', j), flow('kbw', j)
    Ft0 = -(1 - s) * s * f01 + s * s * f10; Ft1 = (1 - s) ** 2 * f01 - s * (1 - s) * f10
    W0 = np.dstack([P0, A0]); W1 = np.dstack([P1, A1])
    c0 = flow('kcf', j) / 255.0; c1 = flow('kcb', j) / 255.0
    w0 = (1 - s) * (0.04 + warp(c0, Ft0)); w1 = s * (0.04 + warp(c1, Ft1))                       # trusted flow: both pictures; doubtful: mostly the nearer one
    q = w0 + w1 + 1e-6
    out = (w0 / q)[..., None] * warp(W0, Ft0) + (w1 / q)[..., None] * warp(W1, Ft1)
    lw = (1 - s) * warp(L0, Ft0) + s * warp(L1, Ft1)
    return out[..., :3], out[..., 3], lw
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
def build_mat():
    """the small mattress picture: its OWN cut-out (assets/mattress.webp placed as hero.css places it) and the shadow under it; everything in them is the hero's, in every frame"""
    M = Image.open('../repo/divine-hero/release/1.20.2/assets/mattress.webp').convert('RGBA')
    x0, y0, w, h = round(0.01125 * BW), round(0.6414 * BH), round(0.30163 * BW), round(0.15671 * BH)
    a = np.array(M.resize((w, h), Image.LANCZOS))[..., 3].astype(np.float32) / 255
    A = np.zeros((BH, BW), np.float32); A[y0:y0 + h, x0:x0 + w] = a
    Ab = (A > 0.5).astype(np.uint8)
    body = cv2.GaussianBlur(cv2.dilate(Ab, np.ones((3, 3), np.uint8)).astype(np.float32), (0, 0), 1.0)
    down = cv2.dilate(Ab, np.ones((81, 1), np.uint8), anchor=(0, 80))                       # downwards only: the bed in front of the mattress, where its shadow lies
    cut = np.zeros((BH, BW), np.float32); cut[:, :440] = 1; cut[:, 440:520] = np.linspace(1, 0, 80)[None, :]     # not as far as the model's hip
    shadow = cv2.GaussianBlur(down.astype(np.float32), (0, 0), 14) * cut
    return np.maximum(body, shadow)[..., None]
MATM = build_mat()
HM = np.load('headmask.npy').astype(np.float32)[..., None]      # the head: the hero photo's own hair, ear and crown stay for the whole film
TM1 = np.load('TM1.npy').astype(np.float32); TM2 = np.load('TM2.npy').astype(np.float32)
# the garment's vertical edge beside 'HIGH SUPPORT' was caught by the words mask: laid as a static layer it stayed put while the body moved. Only real letters (bright white) stay in the mask.
_L = H_.mean(-1); _strip = np.zeros(TM1.shape, bool); _strip[560:800, 240:300] = True
_letters = cv2.dilate((_L >= 222).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0          # real letters (and a margin round them) stay
_strip &= ~_letters
_strip = cv2.dilate(_strip.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0 & ~_letters
TM1[_strip] = 0; TM2[_strip] = 0
TM1 = TM1[..., None]; TM2 = TM2[..., None]
# the hero's words are laid over the picture as a difference (word minus the picture around it), so no patch of the hero's own sky can show
_med = np.dstack([cv2.medianBlur(H_.astype(np.uint8)[..., c], 31) for c in range(3)]).astype(np.float32)
DELTA = (H_ - H_INP) * TM1 + (H_ - _med) * TM2 * DS      # words on the model / pillow; words on the sky only where the clean sky replaced the picture
# ---------------------------------------------------------------- timeline
TURN_A, TURN_B, HOLD, BLEND = 8.2, 6.6, 0.5, 1.6      # seconds: the turn / the turn again / the still end / the last stretch of the turn in which the model's pixels become the hero photo's
BACK_R, BACK_U = 0.62, 0.29                           # B: rolls back by 62 % of the path in the first 29 % of its time
def timeline(kind):
    Tt = TURN_A if kind == 'A' else TURN_B
    n = int(round((Tt + HOLD) * FPS)); return Tt, HOLD, n
def state(kind, t):
    Tt, Ts, n = timeline(kind)
    u = min(t / Tt, 1.0)
    if kind == 'A': lam = LT * ease(u); wg = sstep(.5, 1.0, u); wb = sstep(1 - BLEND / Tt, 1.0, u)               # slow start, a long soft arrival; the hero's light ramps in as the body arrives
    else:
        R = BACK_R * LT
        lam = LT - R * ease(u / BACK_U) if u < BACK_U else LT - R + R * ease((u - BACK_U) / (1 - BACK_U)); wg = 1.0
        wb = max(sstep(1 - BLEND / Tt, 1.0, u), 1 - sstep(0.0, 0.5, t))                                          # the first and the last moments are the hero's own pixels: nothing pops in or out
    return lam, wg, wb
EDGE = (np.clip((1278 - np.arange(1280)) / 40, 0, 1)[None, :] * np.clip((np.arange(720)[:, None] - 2) / 50, 0, 1) ** 1.5).astype(np.float32)
def tame(G, Fr, Ar, Lw):
    """skin: small bright glints and the broad shiny highlight are pulled back (edge-preserving medians at about 9 px and 60 px). Hair is NOT touched here: it was calmed at the
    source (prep3.calm_hair), because any per-frame filter or grain on hair boils (the owner saw 'bubbling hair')"""
    L = G @ np.array([.299, .587, .114], np.float32); L8 = np.clip(L, 0, 255).astype(np.uint8)
    m1 = cv2.medianBlur(L8, 9).astype(np.float32)
    sm = cv2.resize(L8, (RW // 4, RH // 4), interpolation=cv2.INTER_AREA)
    m2 = cv2.resize(cv2.medianBlur(sm, 15), (RW, RH), interpolation=cv2.INTER_LINEAR).astype(np.float32)
    ex = 0.80 * np.maximum(L - m1 - 3, 0) + 0.70 * np.maximum(L - np.maximum(m2, m1) - 5, 0)
    ex = cv2.GaussianBlur(ex, (0, 0), 1.0)
    R, Gc, B = Fr[..., 0], Fr[..., 1], Fr[..., 2]; ls = (R + Gc + B) / 3; ch = (R - B) / (R + Gc + B + 1)
    skin = np.clip((ch - 0.08) / 0.06, 0, 1) * np.clip((ls - 85) / 25, 0, 1) * (1 - np.clip(Lw * 1.6, 0, 1))      # skin only (not hair, not the lace: its embroidery stays)
    skin = cv2.GaussianBlur(skin, (0, 0), 2.0)
    return G * (np.maximum(L - ex * skin, 1) / np.maximum(L, 1))[..., None]
def compose(kind, k, wb_off=True):
    t = k / FPS; lam, wg, wb = state(kind, t)
    P, A, Lw = interp(lam)
    P = P * EDGE[..., None]; A = A * EDGE
    Pr = to_roi(P); Ar = to_roi(A); Lwr = to_roi(Lw)
    Fr = Pr / np.maximum(Ar, 1e-3)[..., None]
    G = grade2.apply(np.clip(Fr, 0, 255), CURVE, GAIN, wg)
    G = tame(G, Fr, Ar, Lwr)
    sh = cv2.GaussianBlur(G, (0, 0), 1.5); G = np.clip(G + 0.12 * (G - sh), 0, 255)
    nz = cv2.GaussianBlur(np.random.default_rng(1000 + k).normal(0, 1, (RH, RW)).astype(np.float32), (0, 0), 0.7) * 2.0
    G = np.clip(G + nz[..., None] * (1 - wb), 0, 255)
    out = KEEP.copy()
    roi = out[RY0:RY0 + RH, RX0:RX0 + RW]
    roi[:] = roi * (1 - Ar[..., None]) + G * Ar[..., None]
    out = out * (1 - MATM) + H_ * MATM                                                     # the mattress picture and its shadow are always the hero's own
    out = out * (1 - HM) + (H_ - DELTA) * HM                                                         # the head never turns: it is the hero's
    out = out + DELTA                                                                      # the hero's words lie over everything, as in the hero
    return out, wb
_FLOW = None
def end_flow():
    """where the film's last pose lies against the hero's pixels: dense flow hero -> film (tiny, a few px; it is what made the bra strap show twice in a plain cross-fade)"""
    global _FLOW
    if _FLOW is None:
        o, _ = compose('A', int(round((TURN_A + HOLD) * FPS)) - 1)
        g = lambda x: cv2.cvtColor(np.clip(cv2.resize(x, (BW // 2, BH // 2), interpolation=cv2.INTER_AREA), 0, 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        d = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM); d.setFinestScale(1)
        f = d.calc(g(H_), g(o), None) * 2.0
        f = cv2.resize(f, (BW, BH), interpolation=cv2.INTER_LINEAR)
        f = cv2.GaussianBlur(f, (0, 0), 3.0)
        mag = np.linalg.norm(f, axis=-1, keepdims=True); f = f * np.minimum(1.0, 12.0 / np.maximum(mag, 1e-3))       # a few px at most
        np.save('endflow.npy', f.astype(np.float16)); _FLOW = f.astype(np.float32)
    return _FLOW
_GY, _GX = np.mgrid[0:BH, 0:BW].astype(np.float32)
def frame(kind, k):
    out, wb = compose(kind, k)
    if wb > 0:
        f = end_flow(); wgeo = float(sstep(0.0, 0.7, wb)); wcol = float(sstep(0.3, 1.0, wb))
        if wgeo > 0: out = cv2.remap(out, _GX + wgeo * f[..., 0], _GY + wgeo * f[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        out = out * (1 - wcol) + H_ * wcol
    return np.clip(out, 0, 255).astype(np.uint8)                                          # full size (1640 x 1266): the encoder makes the smaller ones
if __name__ == '__main__':
    kind = sys.argv[1]; Tt, Ts, n = timeline(kind)
    a, b = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (0, n)
    os.makedirs(f'o9_{kind}', exist_ok=True)
    for k in range(a, min(b, n)):
        Image.fromarray(frame(kind, k)).save(f'o9_{kind}/f{k:04d}.png', compress_level=1)
    print('frames', n)
