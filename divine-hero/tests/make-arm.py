#!/usr/bin/env python3
"""1.9.4 the upper arm as its own layer, so it can roll in toward her chest (behind her body) and come back out.
Inside the arm box AZ (master px), at half scale:
  arm-mask.webp  (lossless RGB)  R = the upper arm's alpha at rest (elbow to shoulder cap)
                                 G = signed distance to her back's top line hidden behind the arm: .5 + (y - Ct)/400
                                 B = the zone where the plate below differs from the photo
  arm-plate.webp (RGB)           her body without the arm: her back rebuilt up to that line, the sky above it
usage: make-arm.py <assets-dir>"""
import sys, os
import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, distance_transform_edt, gaussian_filter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from inpaint import laplace_fill
A_DIR = sys.argv[1]
AZ = (0, 680, 1600, 1320)
ROI = (0, 660)
x0, y0, x1, y1 = AZ
img = np.asarray(Image.open(os.path.join(A_DIR, 'hero-band-3554.webp')).convert('RGB')).astype(float)[y0:y1, x0:x1]
H, W = img.shape[:2]
yy, xx = np.mgrid[y0:y1, x0:x1].astype(float)
def up(name, ch=None):
    im = Image.open(os.path.join(A_DIR, name)).convert('RGB')
    big = im.resize((im.width * 2, im.height * 2), Image.BILINEAR)
    a = np.asarray(big).astype(float)[y0 - ROI[1]:y1 - ROI[1], x0 - ROI[0]:x1 - ROI[0]]
    return a if ch is None else a[..., ch] / 255
her = up('sleeper-mask.webp', 0)
sky = up('sleeper-plate.webp')
def curve(pts):
    px, py = zip(*pts)
    return np.interp(xx[0], px, py)[None, :].repeat(H, 0)
# the arm's underside where it lies on her back (the crease), and her back's top line hidden behind the arm
CL = curve([(0, 950), (40, 955), (60, 975), (100, 1034), (140, 1051), (180, 1048), (220, 1044), (260, 1041), (300, 1037),
            (340, 1034), (380, 1030), (420, 1026), (460, 1017), (500, 1010), (540, 1002), (580, 997), (620, 993), (660, 977),
            (700, 966), (740, 955), (780, 945), (820, 936), (860, 922), (900, 912), (940, 908), (1000, 898), (1150, 872),
            (1300, 860), (1600, 860)])                         # measured: the step from her dark arm to her lighter back
CT = curve([(0, 1076), (100, 1062), (200, 1046), (300, 1031), (450, 1010), (580, 988), (700, 956), (800, 929), (900, 903),
            (1000, 884), (1120, 856), (1210, 822), (1270, 784), (1310, 745), (1340, 730), (1600, 730)])
right = np.clip((1295 - xx) / 45, 0, 1)                      # the shoulder cap beyond (and the logo letters on it) stays with the body
edge = binary_dilation(her > .02, iterations=3) & (yy < CL + 3)     # her soft outline and the photo's light halo around it
arm = np.maximum(her, edge * .0) * np.clip((CL + 3 - yy) / 1.5 + .5, 0, 1) * right
arm = np.clip(gaussian_filter(arm, .5), 0, 1)
s = yy - CT
zone = binary_dilation(arm > .02, iterations=10)
Za = np.clip(gaussian_filter(zone.astype(float), 1.5) * 1.2, 0, 1) * right
# her back behind the arm: harmonic fill from her back below, never from the sky (no-flux wall above the line)
above = s < 0
U = ((arm > .02) | ((yy - CL < 12) & (yy - CL > -1) & (her > .3))) & ~above & (right > 0)
src_ok = (her > .5) & (arm < .02) & ~above
U &= binary_dilation(src_ok | U, iterations=1)
back = laplace_fill(img, U, wall=above & ~U)
# rim shading: her back turns away from us just under its top line
d = np.clip(s, 0, None)
back *= (1 - .11 * np.exp(-d / 22) * np.clip((CL + 8 - yy) / 15, 0, 1) * U)[..., None]
hp = img - np.stack([gaussian_filter(img[..., c], 1.2) for c in range(3)], -1)
ring = binary_dilation(U, iterations=12) & src_ok
noise = gaussian_filter(np.random.default_rng(11).standard_normal((H, W)), .7)
back[U] += (noise / noise.std() * hp[ring].mean(-1).std())[U][:, None]
tA = np.clip(s / 1.5 + .5, 0, 1)
body_wo_arm = back * tA[..., None] + sky * (1 - tA[..., None])
plate = np.where((Za > 0)[..., None], body_wo_arm, img)            # pure (the browser blends it by B)
G = np.clip(.5 + s / 400, 0, 1)
half = lambda a: np.asarray(Image.fromarray(a.astype(np.float32)).resize((W // 2, H // 2), Image.BILINEAR))
mask = np.dstack([half(arm * 255), half(G * 255), half(Za * 255)])
Image.fromarray(np.clip(np.round(mask), 0, 255).astype(np.uint8), 'RGB').save(os.path.join(A_DIR, 'arm-mask.webp'), 'WEBP', lossless=True, quality=100, method=6)
ps = np.dstack([half(plate[..., c]) for c in range(3)])
Image.fromarray(np.clip(ps, 0, 255).astype(np.uint8)).save(os.path.join(A_DIR, 'arm-plate.webp'), 'WEBP', quality=86, method=6)
for f in ('arm-mask.webp', 'arm-plate.webp'): print(f, os.path.getsize(os.path.join(A_DIR, f)), 'bytes', (W // 2, H // 2))
if os.environ.get('ARM_DEBUG'):
    Image.fromarray(np.clip(body_wo_arm * Za[..., None] + img * (1 - Za[..., None]), 0, 255).astype(np.uint8)).save('/tmp/claude-0/arm-plate-full.png')
