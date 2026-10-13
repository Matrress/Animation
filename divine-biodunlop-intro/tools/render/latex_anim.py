# Natural-sourcing loop v3 (0.3.1-dev), 8.9 s, 24 fps, 768x512. The owner asked for the ORIGINAL footage again for the dripping and collecting: nothing is drawn any more.
#   1. the supplied footage of the tapped tree: the latex runs down the bark and the cup fills (it brightens) - graded into the window's teal palette, caption removed,
#      the flicker of the posterised bark calmed, a slow push-in
#   2. dissolve -> the supplied pouring footage (slowed) -> dissolve back
import numpy as np, cv2, sys, os
from PIL import Image
OW, OH = 768, 512; S = 0.8; CX0, CY0 = 180, 80                      # source (1280x720) -> output: crop x180.., y80.., scale 0.8
FPS = 24; TREE_END, DIS, POUR = 4.6, 0.8, 4.3; LOOP = TREE_END + POUR; NF = int(round(LOOP * FPS))
TAP0, TAPN = 3, 125                                                   # first lit frame of the tapping footage, last
def ease(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
xs = np.array([0, 40, 120, 200, 235, 255], np.float32)
cs = np.array([(16, 38, 40), (36, 70, 66), (104, 146, 140), (160, 202, 194), (214, 238, 230), (238, 246, 238)], np.float32)
LUT = np.stack([np.interp(np.arange(256), xs, cs[:, c]) for c in range(3)], 1).astype(np.float32)
yy, xx = np.mgrid[0:OH, 0:OW].astype(np.float32)
vig = np.clip(1 - 0.30 * (((xx - OW * .5) / (OW * .62)) ** 2 + ((yy - OH * .52) / (OH * .66)) ** 2), .55, 1)
_r = np.random.default_rng(11).normal(0, 1, (720, 1280)).astype(np.float32)
_ridge = cv2.GaussianBlur(_r, (0, 0), sigmaX=3.6, sigmaY=34) * 9.0
_cyl = 0.80 + 0.30 * np.exp(-(((np.arange(1280, dtype=np.float32) - 770) / 300) ** 2))[None, :]
ell = np.zeros((720, 1280), np.uint8); cv2.ellipse(ell, (634, 650), (205, 100), 0, 0, 360, 255, -1)
band = np.zeros((720, 1280), bool); band[630:, 640:] = True
_c0 = cv2.imread('../pour/tap720/t000.png').astype(np.float32).mean(-1)                # the first frame is black with only the caption on it
CAP = cv2.dilate((_c0 > 90).astype(np.uint8) * 255, np.ones((9, 9), np.uint8)); CAP[:600] = 0
_tc = {}
def tap(i):
    i = int(np.clip(i, TAP0, TAPN))
    if i not in _tc:
        if len(_tc) > 12: _tc.pop(next(iter(_tc)))
        src = cv2.cvtColor(cv2.imread(f'../pour/tap720/t{i:03d}.png'), cv2.COLOR_BGR2RGB)
        lum = src.astype(np.float32).mean(-1)
        cap = CAP                                                                       # the burned-in caption always sits in the same place
        _tc[i] = cv2.inpaint(src, cap, 5, cv2.INPAINT_TELEA).astype(np.float32)
    return _tc[i]
def tree(t):
    f = TAP0 + t * FPS * 0.80                                                          # a little slower than shot
    i0 = int(np.floor(f)); base = np.zeros((720, 1280, 3), np.float32); w = 0
    for k in range(-3, 4):                                                             # the bark's flicker is calmed over about 0.25 s
        wk = np.exp(-(k - (f - i0)) ** 2 / (2 * 1.5 ** 2)); base += wk * tap(i0 + k); w += wk
    base = cv2.GaussianBlur(base / w, (0, 0), 1.3)
    l = base @ np.array([.299, .587, .114], np.float32)
    l2 = 255 * (np.clip(l, 0, 255) / 255) ** 0.50
    g = LUT[np.clip(l2, 0, 255).astype(np.uint8)] + 0.42 * (base - l[..., None]); g = np.clip(g, 0, 255)
    rg = (1 + 0.55 * np.clip(_ridge, -1, 1)[..., None] * 0.16 * (1 - np.clip((l[..., None] - 50) / 50, 0, 1)))      # the bark's grain, not on the milk
    g = np.clip((g * _cyl[..., None]) * rg + 5, 0, 255)
    z = 1.02 + 0.045 * ease(t / TREE_END); dx = 6 * np.sin(2 * np.pi * t / 11 + .4); dy = 3 * np.cos(2 * np.pi * t / 11)
    M = np.float32([[S * z, 0, -CX0 * S * z + OW * (1 - z) * .5 + dx], [0, S * z, -CY0 * S * z + OH * (1 - z) * .5 + dy]])
    view = cv2.warpAffine(g, M, (OW, OH), flags=cv2.INTER_AREA if z < 1.0 else cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return view * vig[..., None]
PS0, PS1 = 24, 73                                           # lit frames of the pour (frame 0 = 5.9 s of the origin film, 30 fps)
_pf = [cv2.cvtColor(cv2.imread(f'../pour/fr/p{i:03d}.png'), cv2.COLOR_BGR2RGB).astype(np.float32) for i in range(PS0, PS1 + 1)]
_dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
_g = [cv2.cvtColor(f.astype(np.uint8), cv2.COLOR_RGB2GRAY) for f in _pf]
_fw = [_dis.calc(_g[i], _g[i + 1], None) for i in range(len(_pf) - 1)]; _bw = [_dis.calc(_g[i + 1], _g[i], None) for i in range(len(_pf) - 1)]
_gy, _gx = np.mgrid[0:OH, 0:OW].astype(np.float32)
def _warp(im, fl): return cv2.remap(im, _gx + fl[..., 0], _gy + fl[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
def pour_at(sf):
    sf = float(np.clip(sf, 0, len(_pf) - 1.001)); i = int(sf); s_ = sf - i
    f01, f10 = _fw[i], _bw[i]
    Ft0 = -(1 - s_) * s_ * f01 + s_ * s_ * f10; Ft1 = (1 - s_) ** 2 * f01 - s_ * (1 - s_) * f10
    im = (1 - s_) * _warp(_pf[i], Ft0) + s_ * _warp(_pf[i + 1], Ft1)
    gl = im.mean(-1) / 255
    xs_ = np.array([0, .3, .7, 1], np.float32); cs_ = np.array([(14, 34, 36), (70, 100, 98), (190, 214, 206), (240, 248, 243)], np.float32)
    lut = np.stack([np.interp(gl, xs_, cs_[:, c]) for c in range(3)], -1)
    return (0.5 * im + 0.5 * lut) * np.clip(vig, .62, 1)[..., None]
def compose(t):
    w_in = 1 - ease(t / DIS) if t < DIS else 0.0                                       # the pour fading out at the start of the loop
    w_out = ease((t - TREE_END) / DIS) if t > TREE_END else 0.0                        # and in again after the tree
    wp = max(w_in, w_out)
    img = tree(max(min(t, TREE_END) - 0.5, 0.0)) if wp < 0.999 else None
    if wp > 0.001:
        sf = (PS1 - PS0) if t < DIS else (PS1 - PS0) * np.clip((t - TREE_END) / POUR, 0, 1)
        pz = 1.02 + 0.03 * (np.clip((t - TREE_END) / POUR, 0, 1) if t >= DIS else 1.0)
        pr = pour_at(sf); M = np.float32([[pz, 0, OW * (1 - pz) * .5], [0, pz, OH * (1 - pz) * .5]])
        pr = cv2.warpAffine(pr, M, (OW, OH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        img = pr if img is None else img * (1 - wp) + pr * wp
    img = img + np.random.default_rng(100 + int(round(t * FPS))).normal(0, 1.1, img.shape).astype(np.float32)
    return np.clip(img, 0, 255).astype(np.uint8)
if __name__ == '__main__':
    os.makedirs('f3', exist_ok=True)
    idx = list(map(int, sys.argv[1:])) or range(NF)
    for i in idx: Image.fromarray(compose(i / FPS)).save(f'f3/l{i:03d}.png')
