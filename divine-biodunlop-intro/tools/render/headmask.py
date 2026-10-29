# The static head: the hero picture's own hair and ear, plus every place the film's hair / ear ever is, so the film's head can never show. Built once from the source pictures.
import numpy as np, cv2
from PIL import Image
from geo import *
EL = lambda k: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
def build():
    H = np.array(Image.open('../repo/divine-hero/release/1.20.2/assets/hero-band-1640.webp').convert('RGB'), np.float32)
    poly = np.array([(905,590),(950,550),(1000,545),(1050,545),(1070,535),(1100,525),(1140,520),(1190,540),(1230,575),(1260,620),(1272,660),(1268,700),(1250,730),(1200,750),(1150,752),(1080,752),(1000,745),(940,730),(890,700),(865,665),(872,640)], np.int32)
    hero = np.zeros((BH, BW), np.uint8); cv2.fillPoly(hero, [poly], 1)
    un = np.zeros((BH, BW), np.uint8)
    for i in range(8, 118):
        F = np.load(f'cache3/F{i:03d}.npy').astype(np.float32); A = np.load(f'cache3/A{i:03d}.npy').astype(np.float32) / 255
        ls = F.mean(-1); dark = ((ls < 80) & (A > 0.5)).astype(np.uint8)
        reg = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, EL(41))
        full = np.zeros((BH, BW), np.float32); full[RY0:RY0 + RH, RX0:RX0 + RW] = to_roi(reg.astype(np.float32))
        un |= (full > 0.5).astype(np.uint8)
    un[:, :860] = 0; un[:490] = 0; un[780:] = 0; un[:, 1330:] = 0                    # only the head: not the shoulder, not the pillow far away
    n, lab, st, _ = cv2.connectedComponentsWithStats(un, 8)
    if n > 1: un = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    ext = np.zeros((BH, BW), np.uint8)                                                    # every place the film's head / skull ever is, right of the neck
    for i in range(8, 118):
        A = np.load(f'cache3/A{i:03d}.npy').astype(np.float32) / 255
        full = np.zeros((BH, BW), np.float32); full[RY0:RY0 + RH, RX0:RX0 + RW] = to_roi(A)
        ext |= (full > 0.004).astype(np.uint8)
    a116 = np.load('cache3/A116.npy').astype(np.float32) / 255; W = np.zeros((BH, BW), np.float32); W[RY0:RY0 + RH, RX0:RX0 + RW] = to_roi(a116)
    ext |= cv2.dilate((W > 0.04).astype(np.uint8), EL(141))                                # the seam of the clean-sky plate round the final silhouette (a faint arc) lies inside the static head too
    ext[:, :975] = 0; ext[:440] = 0; ext[790:] = 0
    ext = cv2.dilate(ext, EL(61))
    core = np.maximum(hero, un)
    core = cv2.dilate(cv2.morphologyEx(core, cv2.MORPH_CLOSE, EL(31)), EL(25))
    return core, ext, hero, un
if __name__ == '__main__':
    core, ext, hero, un = build()
    hm = np.maximum(cv2.GaussianBlur(core.astype(np.float32), (0, 0), 14), cv2.GaussianBlur(ext.astype(np.float32), (0, 0), 26))
    np.save('headmask.npy', hm.astype(np.float16)); m = (hm > 0.5).astype(np.uint8)
    H = np.array(Image.open('../repo/divine-hero/release/1.20.2/assets/hero-band-1640.webp').convert('RGB'))[..., ::-1].copy()
    vis = H.copy(); cnt, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); cv2.drawContours(vis, cnt, -1, (0, 0, 255), 2)
    cnt, _ = cv2.findContours(hero, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); cv2.drawContours(vis, cnt, -1, (0, 255, 0), 1)
    cv2.imwrite('headmask_vis.jpg', cv2.resize(vis[440:820, 560:1380], None, fx=1.4, fy=1.4), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(m.sum(), un.sum(), hero.sum())
