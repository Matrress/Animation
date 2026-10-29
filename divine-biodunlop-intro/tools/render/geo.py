import numpy as np, cv2
from PIL import Image
SX, SY, TX, TY = 1.275, 1.125, -100, 312           # video frame (1280x720) -> hero picture (1640x1266)
BW, BH = 1640, 1266
RW, RH = 1532, 810                                   # the region of the hero picture the film covers: x 0..1532, y 312..1122
RX0, RY0 = 0, 312
MAT = np.array([(26, 886), (240, 820), (500, 848), (508, 862), (505, 900), (300, 1000), (150, 975), (28, 925)], np.int32)   # the small mattress picture
def to_roi(img, interp=cv2.INTER_LINEAR):
    """a 1280x720 map -> ROI (1532x810) in hero-picture pixels"""
    w, h = int(round(1280 * SX)), int(round(720 * SY))
    r = cv2.resize(img, (w, h), interpolation=interp)
    x0 = RX0 - TX; y0 = RY0 - TY
    return r[y0:y0 + RH, x0:x0 + RW]
def mat_mask(grow=0, feather=1.2):
    m = np.zeros((BH, BW), np.uint8); cv2.fillPoly(m, [MAT], 255)
    if grow: m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1, 2 * grow + 1)))
    return cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), feather)
