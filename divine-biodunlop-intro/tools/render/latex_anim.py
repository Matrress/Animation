# Looping "natural sourcing" clip for the Original Dunlop Technology card: the tapped rubber tree, latex running down the bark and dripping into the cup.
# The tree is the supplied footage (inpainted, lifted, graded into the hero's mint palette); the latex, drops, ripples and splash are drawn here.
import numpy as np, cv2, sys, os
from PIL import Image
OW, OH = 768, 512; S = 0.8; CX0, CY0 = 200, 0          # source (1280x720) -> output: crop x180.., y80.., scale 0.8
T, FPS = 6.0, 24; NF = int(T * FPS)
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
def drops(t):
    """list of (cx, cy, rx, ry) in source px for the falling drops and the bulb at the spout, for loop time t"""
    out = []; per = 2.0; res = []
    for k in range(3):
        ph = (t - k * per) % T if False else (t - k * per)
        ph = ph % T
        tt = ph if ph < per else None
        if ph >= per: continue
        r = (15.0, 17.0, 14.0)[k]
        if tt < 0.85: out.append(('bulb', SPOUT[0], SPOUT[1] + 2 + 14 * smoothstep(0, .85, tt), r * (0.40 + 0.60 * smoothstep(0, .85, tt)), r * (0.40 + 0.85 * smoothstep(0, .85, tt))))
        elif tt < 1.4:
            u = tt - 0.85; y = SPOUT[1] + 16 + 0.5 * 1500 * u * u; v = 1500 * u
            if y < SURF_Y: out.append(('drop', SPOUT[0] - 0.5 * u, y, r * (1 - 0.1 * min(1, v / 900)), r * (1 + 0.55 * min(1, v / 900))))
    return out
def ripples(t):
    out = []
    for k in range(3):
        for rep in (0, 1):
            ph = (t - k * 2.0 - 1.4 - rep * T) % T
            if 0 <= ph < 2.4: out.append((ph, 2.4))
    return out
def render(t):
    img = view.copy()
    # --- light shaft (breathing, periodic)
    shaft = np.exp(-(((xx - OW * (.72 + .02 * np.sin(2 * np.pi * t / T))) - (yy - 0) * 0.35) / 120) ** 2) * (0.07 + 0.02 * np.sin(2 * np.pi * t / T))
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
    liq = smoothstep(1.0, 0.94, dist_i)
    base_l = np.array([226, 246, 240], np.float32) * (0.90 + 0.10 * (1 - np.clip((yy - (cy - b_i)) / (2 * b_i), 0, 1)))[..., None]
    # ripples: concentric ellipses around the impact point
    ix, iy = o(SPOUT[0] - 3, SURF_Y + 6)
    d = np.sqrt(((xx - ix) / 1.0) ** 2 + ((yy - iy) / 0.36) ** 2)
    h = np.zeros_like(d)
    for ph, dur in ripples(t):
        r = 6 + ph * 95 * S; amp = (1 - ph / dur) ** 1.6
        h += amp * np.sin((d - r) * 0.30) * np.exp(-((d - r) / (16 * S + ph * 7)) ** 2)
    h += 0.10 * np.sin(2 * np.pi * (t / T * 2) + xx * 0.03) * np.cos(yy * 0.05 + 2 * np.pi * t / T)    # a slow swell
    shade = 1 + 0.085 * h
    liqc = base_l * shade[..., None] + np.array([8, 10, 12], np.float32) * (h[..., None] > 0.5)
    img = img * (1 - liq[..., None]) + liqc * liq[..., None]
    # a window highlight on the liquid
    hl = np.exp(-(((xx - (cx - 70 * S)) / (60 * S)) ** 2 + ((yy - (cy - 30 * S)) / (9 * S)) ** 2)) * liq * 0.28
    img += hl[..., None] * 60
    # --- latex: the stream down the bark, the bulb, the falling drop (one smooth field)
    D = np.full(XS.shape, 1e3, np.float32); gro = np.full(XS.shape, 1e3, np.float32)
    for (ax, ay, aw), (bx_, by_, bw) in zip(PTS[:-1], PTS[1:]):
        vx, vy = bx_ - ax, by_ - ay; L2 = vx * vx + vy * vy
        tt = np.clip(((XS - ax) * vx + (YS - ay) * vy) / L2, 0, 1)
        dd = np.sqrt((XS - (ax + tt * vx)) ** 2 + (YS - (ay + tt * vy)) ** 2)
        wob = 1 + 0.16 * np.sin(2 * np.pi * ((ay + tt * vy) / 85.0 - t / 1.5))
        D = np.minimum(D, dd - 0.5 * (aw + tt * (bw - aw)) * wob)
        if ay < 60: gro = np.minimum(gro, dd)
    # the cut in the bark that the latex runs along
    gm = smoothstep(15, 9, gro) * 0.55
    img = img * (1 - gm[..., None])
    for kind, bx, by, rx, ry in drops(t):
        e = np.sqrt(((XS - bx) / rx) ** 2 + ((YS - by) / ry) ** 2) * min(rx, ry) - min(rx, ry)
        D = smin(D, e, 14.0 if kind == 'bulb' else 0.01)
    # shading from the field
    Ds = cv2.GaussianBlur(D.astype(np.float32), (0, 0), 1.2)
    gy, gx = np.gradient(Ds); nz = np.sqrt(gx * gx + gy * gy) + 1e-6; nx, ny = gx / nz, gy / nz
    a = smoothstep(0.9, -0.9, Ds * S)
    depth = np.clip(-Ds / 8.0, 0, 1)
    ndl = np.clip(-0.62 * nx - 0.55 * ny + 0.30, 0, 1)
    col = np.array([232, 247, 243], np.float32) * (0.80 + 0.20 * depth[..., None]) + np.array([20, 20, 14], np.float32) * ndl[..., None] * (1 - depth[..., None])
    spec = np.exp(-(((-Ds) - 2.6) / 1.6) ** 2) * np.clip(-0.7 * nx - 0.6 * ny, 0, 1) * 0.9
    col = col + spec[..., None] * np.array([40, 40, 40], np.float32)
    col = np.minimum(col, 252)
    # soft contact shadow of the stream on the bark
    sh = cv2.GaussianBlur((a * 255).astype(np.uint8), (0, 0), 5).astype(np.float32) / 255
    sh = np.roll(sh, 4, axis=1)
    img = img * (1 - 0.35 * sh[..., None])
    img = img * (1 - a[..., None]) + col * a[..., None]
    # --- splash droplets at the impact
    for k in range(3):
        for rep in (0, 1):
            ph = (t - k * 2.0 - 1.4 - rep * T) % T
            if 0 <= ph < 0.42:
                for j in range(5):
                    ang = (-0.5 + j / 4.0) * 1.7; sp = 150 + 30 * ((j * 7 + k) % 3)
                    px = SPOUT[0] - 3 + np.sin(ang) * sp * ph; py = SURF_Y - np.cos(ang) * sp * ph * 1.0 + 0.5 * 900 * ph * ph
                    px, py = o(px, py); rr = max(0.8, 3.2 * S * (1 - ph / 0.45))
                    dd = np.sqrt((xx - px) ** 2 + (yy - py) ** 2); al = smoothstep(rr + .8, rr - .8, dd) * (1 - ph / 0.45)
                    img = img * (1 - al[..., None]) + np.array([240, 252, 248], np.float32) * al[..., None]
    # --- camera: a slow push-in and drift (periodic)
    z = 1.035 + 0.02 * np.sin(2 * np.pi * t / T - 1.2); dx = 6 * np.sin(2 * np.pi * t / T + .4); dy = 4 * np.cos(2 * np.pi * t / T)
    M = np.float32([[z, 0, OW * (1 - z) * .5 + dx], [0, z, OH * (1 - z) * .55 + dy]])
    img = cv2.warpAffine(img, M, (OW, OH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    img += rng.normal(0, 1.1, img.shape).astype(np.float32)
    return np.clip(img, 0, 255).astype(np.uint8)
if __name__ == '__main__':
    os.makedirs('frames', exist_ok=True)
    idx = list(map(int, sys.argv[1:])) or range(NF)
    for i in idx:
        Image.fromarray(render(i / FPS)).save(f'frames/l{i:03d}.png')
