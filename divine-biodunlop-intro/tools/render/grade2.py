# Colour and light of the film, matched to Hero 1.20.2's own photo: (1) the fitted 3x4 colour transform, (2) a luminance curve (histogram match on the final pose),
# (3) a low-frequency shading map (where the hero photo is lighter or darker than the film at the same place)
import numpy as np, cv2
from geo import *
H_inp = np.load('H_inp.npy').astype(np.float32); TM = np.load('TM.npy').astype(np.float32)
M34 = np.load('../vid/grade.npy').astype(np.float32)
def colour(F):                       # F: HxWx3 float (0..255)
    sh = F.shape; X = np.concatenate([F.reshape(-1, 3), np.ones((F.shape[0] * F.shape[1], 1), np.float32)], 1)
    return np.clip(X @ M34, 0, 255).reshape(sh)
def luma(a): return a @ np.array([.299, .587, .114], np.float32)
def build():
    F = np.load('cache/F116.npy').astype(np.float32); A = np.load('cache/A116.npy').astype(np.float32) / 255
    Fr = to_roi(F); Ar = to_roi(A)
    G = colour(Fr)
    hero = H_inp[RY0:RY0 + RH, RX0:RX0 + RW]
    tm = cv2.dilate(TM[RY0:RY0 + RH, RX0:RX0 + RW], np.ones((9, 9), np.uint8))
    mm = mat_mask(10, 4)[RY0:RY0 + RH, RX0:RX0 + RW]
    R = (cv2.erode((Ar > 0.99).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0) & (tm < 0.05) & (mm < 0.05)
    R[:, :200] = False; R[:, -80:] = False; R[:60] = False
    lf, lh = luma(G)[R], luma(hero)[R]
    # histogram match film luma -> hero luma
    qs = np.linspace(0, 100, 101); cf = np.percentile(lf, qs); ch = np.percentile(lh, qs)
    curve = np.interp(np.arange(256), cf, ch); curve = cv2.GaussianBlur(curve.astype(np.float32).reshape(1, -1), (0, 0), 3).ravel()
    curve[0] = max(curve[0], 0)
    # shading map after the curve
    Lc = np.interp(luma(G), np.arange(256), curve)
    m = R.astype(np.float32)
    num = cv2.GaussianBlur(luma(hero) * m, (0, 0), 45); den = cv2.GaussianBlur(Lc * m, (0, 0), 45)
    den2 = cv2.GaussianBlur(m, (0, 0), 45)
    gain = np.where(den2 > 0.02, (num / np.maximum(den2, 1e-4)) / np.maximum(den / np.maximum(den2, 1e-4), 1), 1.0)
    gain = np.clip(gain, 0.75, 1.3)
    wgt = np.clip(cv2.GaussianBlur(m, (0, 0), 60) * 2.0, 0, 1)                       # fades to neutral away from where it was measured
    gain = 1 + (gain - 1) * wgt
    return curve.astype(np.float32), gain.astype(np.float32)
def apply(Fr, curve, gain, wgain):
    """colour -> luma curve -> shading (wgain 0..1 how much of the shading map)"""
    G = colour(Fr); L = luma(G); L2 = np.interp(L, np.arange(256), curve)
    k = (L2 / np.maximum(L, 1.0))[..., None]
    out = G * k
    g = (1 + (gain - 1) * wgain)[..., None]
    return np.clip(out * g, 0, 255)
if __name__ == '__main__':
    curve, gain = build(); np.save('curve.npy', curve); np.save('gain.npy', gain)
    F = np.load('cache/F116.npy').astype(np.float32); A = np.load('cache/A116.npy').astype(np.float32) / 255
    Fr = to_roi(F); Ar = to_roi(A)
    hero = H_inp[RY0:RY0 + RH, RX0:RX0 + RW]
    o = apply(Fr, curve, gain, 1.0); o0 = colour(Fr)
    m = (cv2.erode((Ar > 0.99).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0)
    for n, a in (('before', o0), ('after', o)): print(n, 'mean |film-hero| on body', np.abs(a - hero)[m].mean().round(2))
    from PIL import Image
    W = np.vstack([hero, o0, o]).astype(np.uint8)
    Image.fromarray(W).resize((W.shape[1] // 2, W.shape[0] // 2)).save('grade_cmp.jpg', quality=90)
