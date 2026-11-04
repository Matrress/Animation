# Per source frame: the model layer with clean edges (no dark fringe), and the motion between consecutive frames (dense optical flow)
import numpy as np, cv2, os, sys
from PIL import Image
os.makedirs('cache', exist_ok=True)
def pushpull(F, A):
    """colour of the semi-transparent edge pixels replaced by the colour of the solid interior next to them"""
    core = (A > 0.97).astype(np.float32); core = cv2.erode(core, np.ones((3, 3), np.uint8), iterations=2)
    Fp = F * core[..., None]; out = F.copy(); filled = core > 0.5
    acc = np.zeros_like(F); wacc = np.zeros_like(core)
    for s in (2.0, 5.0, 12.0, 30.0):
        num = cv2.GaussianBlur(Fp, (0, 0), s); den = cv2.GaussianBlur(core, (0, 0), s)
        ok = den > 0.02; est = np.where(ok[..., None], num / np.maximum(den, 1e-4)[..., None], 0)
        take = ok & (~filled) & (wacc < 0.5); acc[take] = est[take]; wacc[take] = 1
    out = np.where(filled[..., None], F, np.where(wacc[..., None] > 0.5, acc, F))
    return out
def load(i):
    a = np.array(Image.open(f'../vid/Am/a{i:03d}.png'), np.float32)
    F, A = a[..., :3], a[..., 3] / 255
    A = np.clip((cv2.GaussianBlur(A, (0, 0), 0.8) - 0.10) / 0.80, 0, 1)            # a hair tighter: the dark fringe sat in the outermost pixels
    F2 = pushpull(F, A)
    return F2, A
if __name__ == '__main__':
    lo, hi = 8, 117
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    prevg = None
    for i in range(lo, hi + 1):
        F2, A = load(i)
        comp = F2 * A[..., None] + 128 * (1 - A[..., None])
        g = cv2.cvtColor(comp.astype(np.uint8), cv2.COLOR_RGB2GRAY)
        np.save(f'cache/F{i:03d}.npy', F2.astype(np.uint8)); np.save(f'cache/A{i:03d}.npy', (A * 255).astype(np.uint8))
        if prevg is not None:
            fw = dis.calc(prevg, g, None); bw = dis.calc(g, prevg, None)
            np.save(f'cache/fw{i-1:03d}.npy', fw.astype(np.float16)); np.save(f'cache/bw{i-1:03d}.npy', bw.astype(np.float16))
        prevg = g
    print('done')
