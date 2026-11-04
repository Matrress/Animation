# prep3 (0.3.1-dev): a cleaner model layer per source frame: alpha without specks / holes / jagged hair edge, no light rim along the silhouette,
# the lace garment on the shoulder (it read as a glassy, translucent patch once the picture was graded): 0.3.4 keeps the embroidery and the shape of the cup, recoloured to a
# matte skin-toned lace (no brightness, no translucency); the lace mask is saved too (cache3/L###.npy) so the film can leave it out of the glint removal.
import numpy as np, cv2, os, sys
from PIL import Image
os.makedirs('cache3', exist_ok=True)
EL = lambda k: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
def clean_alpha(A):
    A8 = (np.clip(A, 0, 1) * 255).astype(np.uint8)
    Ab = (A8 > 127).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(Ab, 8)
    keep = np.array([0] + [1 if st[k, cv2.CC_STAT_AREA] >= 1500 else 0 for k in range(1, n)], np.uint8); Ab = keep[lab]
    inv = 1 - Ab; n, lab, st, _ = cv2.connectedComponentsWithStats(inv, 4)
    fill = np.array([0] + [1 if st[k, cv2.CC_STAT_AREA] < 900 else 0 for k in range(1, n)], np.uint8)[lab]
    Ab = np.maximum(Ab, fill)
    near = cv2.dilate(Ab, EL(7))
    A8 = np.where(fill > 0, 255, A8); A8 = (A8 * near).astype(np.uint8)
    A8 = cv2.medianBlur(A8, 7)                                   # the jagged hair edge
    A = cv2.GaussianBlur(A8.astype(np.float32) / 255, (0, 0), 1.0)
    return np.clip((A - 0.12) / 0.76, 0, 1)
def pushpull(F, A, er=11):
    core = (A > 0.98).astype(np.uint8); core = cv2.erode(core, EL(er)).astype(np.float32)   # about 5 px of the edge are not trusted (a light rim sat there)
    Fp = F * core[..., None]; filled = core > 0.5
    acc = np.zeros_like(F); wacc = np.zeros_like(core)
    for s in (3.0, 6.0, 12.0, 30.0, 70.0):
        num = cv2.GaussianBlur(Fp, (0, 0), s); den = cv2.GaussianBlur(core, (0, 0), s)
        ok = den > 0.02; est = np.where(ok[..., None], num / np.maximum(den, 1e-4)[..., None], 0)
        take = ok & (~filled) & (wacc < 0.5); acc[take] = est[take]; wacc[take] = 1
    return np.where(filled[..., None], F, np.where(wacc[..., None] > 0.5, acc, F))
def lace_mask(F, A, ylim=340):
    h, w = A.shape; roi = np.zeros((h, w), bool); roi[:ylim, :560] = True
    R, G, B = F[..., 0], F[..., 1], F[..., 2]; L = (R + G + B) / 3; ch = (R - B) / (R + G + B + 1)
    hp = np.abs(L - cv2.GaussianBlur(L, (0, 0), 2.5)); tex = cv2.GaussianBlur(hp, (0, 0), 5.0)                       # the lace pattern: light, low chroma, a lot of fine detail
    m = (A > 0.5) & roi & (L > 160) & (ch < 0.135) & (tex > 1.6)
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, EL(21)); m = cv2.morphologyEx(m, cv2.MORPH_OPEN, EL(5))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.array([0] + [1 if st[k, cv2.CC_STAT_AREA] >= 700 else 0 for k in range(1, n)], np.uint8)[lab]
    if keep.any():                                                                  # the smooth, pale parts of the cup next to the patterned ones
        smooth = ((A > 0.5) & roi & (L > 170) & (ch < 0.145)).astype(np.uint8)
        for _ in range(3): keep = np.maximum(keep, cv2.dilate(keep, EL(25)) & smooth)
        keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, EL(15))
    return cv2.dilate(keep, EL(17)), (L, ch, roi)
def de_lace(F, A, ylim=340):
    """matte skin-toned lace: the cup keeps its shape and shading, the embroidery stays (as fine detail), the cream brightness and the see-through look go"""
    lm, (L, ch, roi) = lace_mask(F, A, ylim)
    if not lm.any(): return F, lm
    ring = (cv2.dilate(lm, EL(61)) > 0) & (lm == 0) & (A > 0.9) & (ch > 0.14) & (ch < 0.23) & (L > 110)
    if ring.sum() < 300: return F, np.zeros_like(lm)
    sk = F[ring].mean(0); sL = sk.mean()
    Ls = cv2.GaussianBlur(L, (0, 0), 4.0); mL = Ls[lm > 0].mean()
    Lt = sL + 0.6 * (Ls - mL)                                                # the form of the cup, at the level of the skin around it
    pattern = L - cv2.GaussianBlur(L, (0, 0), 2.5)                           # the embroidery: threads and holes
    lace = sk[None, None, :] * (Lt / sL)[..., None] + (0.95 * pattern)[..., None]
    soft = cv2.GaussianBlur(lm.astype(np.float32), (0, 0), 4)[..., None]
    return F * (1 - soft) + np.clip(lace, 0, 255) * soft, lm
def calm_hair(F, A):
    """the hair is glossy and sleek: its bright sheen arcs read as a dome / cap / balloon once the picture is slowed down and graded. Done here, on each source picture, with one fixed
    per-pixel curve (no spatial filter, no noise), so it is stable in time and moves with the picture when the film is made: bright hair is pulled to a fraction above its dark level"""
    ls = F.mean(-1); ch = (F[..., 0] - F[..., 2]) / (F.sum(-1) + 1)
    dark = ((ls < 85) & (A > 0.5)).astype(np.uint8)
    reg = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, EL(41)) * (A > 0.5).astype(np.uint8) * (ch < 0.15).astype(np.uint8)
    w = cv2.GaussianBlur(reg.astype(np.float32), (0, 0), 6.0)
    Lc = np.where(ls < 52, ls, 52 + (ls - 52) * 0.38)
    k = Lc / np.maximum(ls, 1.0)
    return F * (1 + (k - 1) * w)[..., None]
def load(i):
    a = np.array(Image.open(f'../vid/Am/a{i:03d}.png'), np.float32)
    F, A = a[..., :3], a[..., 3] / 255
    A = clean_alpha(A)
    F2 = pushpull(F, A)
    lm = np.zeros(A.shape, np.uint8)
    if i < 80: F2, lm = de_lace(F2, A, 440 if i < 45 else 340)
    F2 = calm_hair(F2, A)
    return F2, A, lm
if __name__ == '__main__':
    for i in range(int(sys.argv[1]), int(sys.argv[2])):
        F2, A, lm = load(i)
        np.save(f'cache3/F{i:03d}.npy', np.clip(F2, 0, 255).astype(np.uint8)); np.save(f'cache3/A{i:03d}.npy', (A * 255).astype(np.uint8))
        np.save(f'cache3/L{i:03d}.npy', (cv2.GaussianBlur(lm.astype(np.float32), (0, 0), 6) * 255).astype(np.uint8))
        if i % 10 == 0: print(i, int(lm.sum()), flush=True)
