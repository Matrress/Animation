# Looping "natural sourcing" clip v2 (0.3.0-dev) for the Original Dunlop Technology card, 10.5 s:
#   1. the tapped rubber tree: latex is a heavy, creamy substance, not water: a thin matte film creeps along the cut, a fat drop swells slowly on a stretching
#      thread, lets go, falls and sinks into the cup (a soft mound, two slow low rings, no splash); the cup slowly fills
#   2. the mixture is poured: the supplied pouring footage (the last seconds of the origin film: thick cream folding into concentric layers), slowed down, caption cropped away
# The tree is the supplied footage (inpainted, lifted, graded into the hero's mint palette); the latex, drops and ripples are drawn here.
import numpy as np, cv2, sys, os
from PIL import Image
OW, OH = 768, 512; S = 0.8; CX0, CY0 = 200, 0          # source (1280x720) -> output: crop x180.., y80.., scale 0.8
FPS = 24; LOOP = 10.5; NF = int(LOOP * FPS); P = 3.2          # P: one drop every 3.2 s
def o(x, y): return (x - CX0) * S, (y - CY0) * S
# ---------- base: the tree --------------------------------------------------------------------------------------------------------------------------------
src = cv2.cvtColor(cv2.imread('../vid/B/f110.png'), cv2.COLOR_BGR2RGB)
lum = src.astype(np.float32).mean(-1)
ell = np.zeros(lum.shape, np.uint8); cv2.ellipse(ell, (634, 650), (200, 96), 0, 0, 360, 255, -1)
cap = ((lum > 120) & (ell == 0)); cap[:640] = False; cap[:, :780] = False                  # the burned-in caption (right of the cup)
cap = cv2.dilate(cap.astype(np.uint8) * 255, np.ones((5, 5), np.uint8))
# the source stream: the white component that touches the top edge near x 690
th = (lum > 190).astype(np.uint8); n, lab = cv2.connectedComponents(th)
st = (lab == lab[60, 684]).astype(np.uint8) * 255 if lab[60, 684] else np.zeros_like(th)
st[:, 760:] = 0; st[430:] = 0
st = cv2.dilate(st, np.ones((9, 9), np.uint8))
cup = cv2.dilate(((lum > 200) & (np.arange(720)[:, None] > 550)).astype(np.uint8) * 255, np.ones((7, 7), np.uint8))
mask = np.maximum.reduce([cap, st, cup]); mask[:, :300] = 0
base = cv2.inpaint(src, mask, 6, cv2.INPAINT_TELEA)
base = cv2.GaussianBlur(base, (0, 0), 1.3).astype(np.float32)
l = base @ np.array([.299, .587, .114], np.float32)
l2 = 255 * (np.clip(l, 0, 255) / 255) ** 0.50
xs = np.array([0, 40, 120, 200, 235, 255], np.float32)
cs = np.array([(16, 38, 40), (36, 70, 66), (104, 146, 140), (160, 202, 194), (200, 234, 226), (232, 250, 244)], np.float32)
LUT = np.stack([np.interp(np.arange(256), xs, cs[:, c]) for c in range(3)], 1).astype(np.float32)
g = LUT[np.clip(l2, 0, 255).astype(np.uint8)] + 0.42 * (base - l[..., None])
g = np.clip(g, 0, 255)
_r = np.random.default_rng(11).normal(0, 1, (720, 1280)).astype(np.float32)
_ridge = cv2.GaussianBlur(_r, (0, 0), sigmaX=3.6, sigmaY=34) * 9.0
_cyl = 0.80 + 0.30 * np.exp(-(((np.arange(1280, dtype=np.float32) - 770) / 300) ** 2))[None, :]
g = np.clip((g * _cyl[..., None]) * (1 + 0.55 * np.clip(_ridge, -1, 1)[..., None] * 0.16) + 5, 0, 255)
view = cv2.warpAffine(g, np.float32([[S, 0, -CX0 * S], [0, S, -CY0 * S]]), (OW, OH), flags=cv2.INTER_AREA)
yy, xx = np.mgrid[0:OH, 0:OW].astype(np.float32)
vig = 1 - 0.30 * (((xx - OW * .5) / (OW * .62)) ** 2 + ((yy - OH * .52) / (OH * .66)) ** 2)
view *= np.clip(vig, .55, 1)[..., None]
rng = np.random.default_rng(3)
# ---------- geometry (source px -> output px) --------------------------------------------------------------------------------------------------------------
sy = np.array([40, 150, 230, 300, 360, 396], np.float32); sx = np.array([694, 688, 676, 666, 656, 653], np.float32)
def centre(y): return np.interp(y, sy, sx)
SPOUT = (653.0, 398.0); CUPC = (640.0, 546.0); SURF_Y = 538.0
from scipy.interpolate import CubicSpline
_k = np.array([(500, -40, 11.0), (560, -10, 12.0), (624, 14, 13.5), (672, 42, 15.0), (697, 88, 16.0), (690, 160, 17.5), (676, 245, 17.5), (664, 320, 15.0), (656, 372, 12.5), (653, 398, 10.0)], np.float64)
_u = np.linspace(0, 1, len(_k)); _cs = CubicSpline(_u, _k, bc_type='natural'); PTS = [tuple(p) for p in _cs(np.linspace(0, 1, 46))]
def smoothstep(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def smin(a, b, k): h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1); return b * (1 - h) + a * h - k * h * (1 - h)
YS = (yy / S + CY0); XS = (xx / S + CX0)                   # source coordinates of every output pixel
def ease(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
IMPACT = 2.45                                               # seconds into a drop cycle at which the drop reaches the cup
def cyc(t): return t % P
def thread(t):
    """the drop cycle for clock t: returns (thread (x0, y0, x1, y1, r) or None, drop (cx, cy, rx, ry) or None)"""
    ph = cyc(t); r0 = 16.0
    if ph < 1.95:                                         # a fat drop swells slowly on a thread that stretches and thins
        g = ph / 1.95; e = ease(g)
        rb = r0 * (0.30 + 0.70 * e); yb = SPOUT[1] + 4 + 30 * e ** 1.25
        return (SPOUT[0], SPOUT[1] - 4, SPOUT[0] - 0.8 * e, yb, 3.6 * (1 - 0.66 * g)), (SPOUT[0] - 0.8 * e, yb + 0.35 * rb, rb * (1 - 0.08 * e), rb * (1 + 0.55 * e))
    u = ph - 1.95; yb0 = SPOUT[1] + 4 + 30
    v = 820 * u; y = yb0 + 0.5 * 820 * u * u
    surf = SURF_Y - 6
    th = None
    if u < 0.34:                                          # the thread lets go and draws back up to the spout
        h = ease(u / 0.34); th = (SPOUT[0], SPOUT[1] - 4, SPOUT[0] - 0.8 - 5 * h, yb0 - (yb0 - SPOUT[1]) * h * 0.92, 1.3 * (1 - h) + 0.2)
    if y < surf: return th, (SPOUT[0] - 0.8 - 4 * min(1, u / .8), y + 0.35 * r0, r0 * (1 - 0.12 * min(1, v / 700)), r0 * (1 + 0.62 * min(1, v / 700)))
    return th, None
def impacts(t):
    """(age) of the recent drops that fell into the cup"""
    out = []
    for k in range(-1, 4):
        ti = IMPACT + k * P
        if 0 <= t - ti < 3.6: out.append(t - ti)
    return out
def render(t, lvl_t=None):
    img = view.copy()
    # --- light shaft (breathing, periodic)
    shaft = np.exp(-(((xx - OW * (.72 + .012 * np.sin(2 * np.pi * t / 9.0))) - (yy - 0) * 0.35) / 120) ** 2) * (0.07 + 0.015 * np.sin(2 * np.pi * t / 9.0))
    img += shaft[..., None] * np.array([150, 230, 215], np.float32)
    # --- the cup: brim, dark inside edge, liquid
    cx, cy = o(*CUPC); a_o, b_o = 200 * S, 92 * S; a_i, b_i = 182 * S, 76 * S
    # the cup's outer body below the lip (a bowl, not a saucer)
    body = ((xx - cx) / a_o) ** 2 + ((yy - (cy + 40 * S)) / (b_o * 1.02)) ** 2
    bm = smoothstep(1.02, 0.97, body) * (yy > cy)
    bcol = np.array([44, 84, 82], np.float32) * (1.12 - 0.5 * np.clip((yy - cy) / (90 * S), 0, 1))[..., None] + np.array([22, 30, 28], np.float32) * np.clip(((xx - cx) / a_o), 0, 1)[..., None] * 0
    img = img * (1 - bm[..., None]) + bcol * bm[..., None]
    dist_o = ((xx - cx) / a_o) ** 2 + ((yy - cy) / b_o) ** 2; dist_i = ((xx - cx) / a_i) ** 2 + ((yy - cy) / b_i) ** 2
    rim = smoothstep(1.02, 0.97, dist_o)
    img = img * (1 - rim[..., None]) + np.array([70, 112, 108], np.float32) * rim[..., None]
    lip = smoothstep(1.0, 0.86, dist_o) * (1 - smoothstep(0.98, 0.86, dist_i * 0.92)) * 0
    wall = smoothstep(1.0, 0.9, dist_o) * smoothstep(0.80, 1.02, dist_i)               # lighter lip around the liquid
    img = img * (1 - 0.65 * wall[..., None]) + np.array([188, 224, 216], np.float32) * 0.65 * wall[..., None]
    lvl = 26.0 * S * (1 - ease(np.clip(t / 7.2, 0, 1)) * 0.95)      # the surface rises towards the brim while the cup collects
    dist_l = ((xx - cx) / a_i) ** 2 + ((yy - (cy + lvl)) / b_i) ** 2
    liq = smoothstep(1.0, 0.94, dist_i) * smoothstep(1.0, 0.94, dist_l)
    inner = smoothstep(1.0, 0.94, dist_i)
    img = img * (1 - 0.55 * (inner * (1 - liq))[..., None])         # the dark inner wall above the surface
    base_l = np.array([226, 232, 220], np.float32) * (0.90 + 0.10 * (1 - np.clip((yy - (cy - b_i)) / (2 * b_i), 0, 1)))[..., None]
    # ripples: concentric ellipses around the impact point
    ix, iy = o(SPOUT[0] - 4, SURF_Y + 4 - (lvl / S) * 0.0)
    d = np.sqrt(((xx - ix) / 1.0) ** 2 + ((yy - iy) / 0.36) ** 2)
    h = np.zeros_like(d)
    for age in impacts(t):                                  # heavy and creamy: a soft mound that sinks back, then two slow, low, fast-fading rings
        mound = 1.55 * np.exp(-age / 0.55) * (1 - np.exp(-age / 0.10)) * np.exp(-(d / (13 + 5 * age)) ** 2)
        r = 5 + age * 38 * S; amp = 0.55 * np.exp(-age / 1.1) * (1 - np.exp(-age / 0.25))
        h += mound + amp * np.sin((d - r) * 0.21) * np.exp(-((d - r) / (22 * S + age * 9)) ** 2)
    h += 0.05 * np.sin(2 * np.pi * (t / 9.0) + xx * 0.03) * np.cos(yy * 0.05 + 2 * np.pi * t / 9.0)
    shade = 1 + 0.10 * h
    liqc = base_l * shade[..., None] + np.array([6, 8, 8], np.float32) * (h[..., None] > 0.9)
    img = img * (1 - liq[..., None]) + liqc * liq[..., None]
    # a window highlight on the liquid
    hl = np.exp(-(((xx - (cx - 70 * S)) / (60 * S)) ** 2 + ((yy - (cy - 30 * S)) / (9 * S)) ** 2)) * liq * 0.16
    img += hl[..., None] * 40
    # --- latex: a thin matte film creeps along the cut (a slow, thicker patch slides down it), then the thread and the swelling drop at the spout
    D = np.full(XS.shape, 1e3, np.float32); gro = np.full(XS.shape, 1e3, np.float32); npts = len(PTS)
    for j, ((ax, ay, aw), (bx_, by_, bw)) in enumerate(zip(PTS[:-1], PTS[1:])):
        vx, vy = bx_ - ax, by_ - ay; L2 = vx * vx + vy * vy
        tt = np.clip(((XS - ax) * vx + (YS - ay) * vy) / L2, 0, 1)
        dd = np.sqrt((XS - (ax + tt * vx)) ** 2 + (YS - (ay + tt * vy)) ** 2)
        pos = (j + tt) / npts
        slug = 0.30 * np.exp(-((pos - ((t * 0.045) % 1.15 - 0.1)) / 0.12) ** 2)       # a slow, heavier patch sliding down
        wob = 0.62 * (1 + slug)
        D = np.minimum(D, dd - 0.5 * (aw + tt * (bw - aw)) * wob)
        if ay < 60: gro = np.minimum(gro, dd)
    # the cut in the bark that the latex runs along
    gm = smoothstep(15, 9, gro) * 0.55
    img = img * (1 - gm[..., None])
    th, dr = thread(t)
    if th is not None:
        x0, y0, x1, y1, rt = th; vx, vy = x1 - x0, y1 - y0; L2 = vx * vx + vy * vy + 1e-6
        tt = np.clip(((XS - x0) * vx + (YS - y0) * vy) / L2, 0, 1)
        dd = np.sqrt((XS - (x0 + tt * vx)) ** 2 + (YS - (y0 + tt * vy)) ** 2) - rt * (1 - 0.35 * np.sin(np.pi * tt) ** 2 * 0.0)
        D = smin(D, dd, 6.0)
    if dr is not None:
        bx, by, rx, ry = dr
        e = np.sqrt(((XS - bx) / rx) ** 2 + ((YS - by) / ry) ** 2) * min(rx, ry) - min(rx, ry)
        D = smin(D, e, 7.0 if th is not None else 0.01)
    # shading from the field
    Ds = cv2.GaussianBlur(D.astype(np.float32), (0, 0), 1.2)
    gy, gx = np.gradient(Ds); nz = np.sqrt(gx * gx + gy * gy) + 1e-6; nx, ny = gx / nz, gy / nz
    a = smoothstep(1.2, -1.2, Ds * S)
    depth = np.clip(-Ds / 8.0, 0, 1)
    ndl = np.clip(-0.62 * nx - 0.55 * ny + 0.30, 0, 1)
    col = np.array([228, 232, 218], np.float32) * (0.84 + 0.16 * depth[..., None]) + np.array([14, 14, 10], np.float32) * ndl[..., None] * (1 - depth[..., None])
    spec = np.exp(-(((-Ds) - 2.6) / 1.6) ** 2) * np.clip(-0.7 * nx - 0.6 * ny, 0, 1) * 0.34
    col = col + spec[..., None] * np.array([40, 40, 40], np.float32)
    col = np.minimum(col, 236)
    # soft contact shadow of the stream on the bark
    sh = cv2.GaussianBlur((a * 255).astype(np.uint8), (0, 0), 5).astype(np.float32) / 255
    sh = np.roll(sh, 4, axis=1)
    img = img * (1 - 0.35 * sh[..., None])
    # the film on the bark is translucent (it lets the bark show through); the thread and the drop are denser
    core = smoothstep(0.0, -3.0, Ds * S)
    a_eff = a * (0.62 + 0.38 * core)
    img = img * (1 - a_eff[..., None]) + col * a_eff[..., None]
    # --- camera: a slow push-in and drift
    z = 1.03 + 0.03 * ease(t / 8.0); dx = 5 * np.sin(2 * np.pi * t / 11.0 + .4); dy = 3 * np.cos(2 * np.pi * t / 11.0)
    M = np.float32([[z, 0, OW * (1 - z) * .5 + dx], [0, z, OH * (1 - z) * .55 + dy]])
    img = cv2.warpAffine(img, M, (OW, OH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return img
# ---------- the pour: the supplied footage (last seconds of the origin film), cropped (no caption), slowed, lightly toned into the window's palette ------------------------
PS0, PS1 = 24, 73                                           # lit frames of the pour (frame 0 = 5.9 s of the origin film, 30 fps)
_pf = [cv2.cvtColor(cv2.imread(f'../pour/fr/p{i:03d}.png'), cv2.COLOR_BGR2RGB).astype(np.float32) for i in range(PS0, PS1 + 1)]
_dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
_g = [cv2.cvtColor(f.astype(np.uint8), cv2.COLOR_RGB2GRAY) for f in _pf]
_fw = [_dis.calc(_g[i], _g[i + 1], None) for i in range(len(_pf) - 1)]; _bw = [_dis.calc(_g[i + 1], _g[i], None) for i in range(len(_pf) - 1)]
_gy, _gx = np.mgrid[0:OH, 0:OW].astype(np.float32)
def _warp(im, fl): return cv2.remap(im, _gx + fl[..., 0], _gy + fl[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
def pour_at(sf):
    """the pour at the fractional source frame sf (index into PS0..PS1): motion-compensated blend of the neighbours"""
    sf = float(np.clip(sf, 0, len(_pf) - 1.001)); i = int(sf); s_ = sf - i
    f01, f10 = _fw[i], _bw[i]
    Ft0 = -(1 - s_) * s_ * f01 + s_ * s_ * f10; Ft1 = (1 - s_) ** 2 * f01 - s_ * (1 - s_) * f10
    im = (1 - s_) * _warp(_pf[i], Ft0) + s_ * _warp(_pf[i + 1], Ft1)
    g = im.mean(-1) / 255
    xs_ = np.array([0, .3, .7, 1], np.float32); cs_ = np.array([(14, 34, 36), (70, 100, 98), (190, 214, 206), (240, 248, 243)], np.float32)
    lut = np.stack([np.interp(g, xs_, cs_[:, c]) for c in range(3)], -1)
    out = 0.5 * im + 0.5 * lut                              # half tinted: still the natural grey-white cream of the footage, no hot or cold cast
    out *= np.clip(vig, .62, 1)[..., None]
    return out
# ---------- the loop: tree (collecting) -> dissolve -> pour -> dissolve -> tree ---------------------------------------------------------------------------------------------
TREE_END, D_IN, D_OUT = 6.4, 0.8, 0.8                       # tree visible 0..6.4 s (clock 0.8..7.2), dissolve to the pour 6.4..7.2, pour until 9.7, dissolve back 9.7..10.5
def compose(t):
    tin = np.clip((t - TREE_END) / D_IN, 0, 1); tout = np.clip((t - (LOOP - D_OUT)) / D_OUT, 0, 1)
    w_pour = ease(tin) * (1 - ease(tout))                  # 0 = tree, 1 = pour
    tc = t - (LOOP - D_OUT) if t >= LOOP - D_OUT else t + D_OUT        # the tree's own clock: continuous through the loop point
    img = render(tc) if w_pour < 0.999 else None
    if w_pour > 0.001:
        sf = (PS1 - PS0) * np.clip((t - TREE_END) / (LOOP - TREE_END), 0, 1)
        pz = 1.02 + 0.03 * (t - TREE_END) / (LOOP - TREE_END) if t >= TREE_END else 1.02
        pr = pour_at(sf); M = np.float32([[pz, 0, OW * (1 - pz) * .5], [0, pz, OH * (1 - pz) * .5]])
        pr = cv2.warpAffine(pr, M, (OW, OH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        img = pr if img is None else img * (1 - w_pour) + pr * w_pour
    img = img + np.random.default_rng(100 + int(round(t * FPS))).normal(0, 1.1, img.shape).astype(np.float32)
    return np.clip(img, 0, 255).astype(np.uint8)
if __name__ == '__main__':
    os.makedirs('f2', exist_ok=True)
    idx = list(map(int, sys.argv[1:])) or range(NF)
    for i in idx:
        Image.fromarray(compose(i / FPS)).save(f'f2/l{i:03d}.png')
