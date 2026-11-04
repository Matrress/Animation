# Reference layers made from Hero 1.20.2's own picture: H (the picture), H_inp (the same with the burned-in words lifted off), TM (the words as a soft mask)
import numpy as np, cv2
from PIL import Image
HP = '../repo/divine-hero/release/1.20.2/assets/hero-band-1640.webp'
H = np.array(Image.open(HP).convert('RGB'))
B_ON = [(22, 585, 700, 775), (800, 752, 1075, 800), (800, 808, 1600, 876), (1240, 884, 1545, 930)]   # words lying on the model / the pillow: lifted off
B_SKY = [(590, 320, 1075, 460)]                                                                           # DIVINE / Dunlop Dreams: on the sky, kept as an overlay
def build():
    g = cv2.cvtColor(H, cv2.COLOR_RGB2GRAY).astype(np.float32)
    med = cv2.medianBlur(g.astype(np.uint8), 45).astype(np.float32)
    d = np.abs(g - med)
    def mk(boxes):
        m = np.zeros(g.shape, np.uint8)
        for x0, y0, x1, y1 in boxes: m[y0:y1, x0:x1] = (d[y0:y1, x0:x1] > 13).astype(np.uint8) * 255
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
        return cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    m1, m2 = mk(B_ON), mk(B_SKY); m = np.maximum(m1, m2)
    np.save('TM1.npy', cv2.GaussianBlur(m1.astype(np.float32) / 255, (0, 0), 1.4).astype(np.float16)); np.save('TM2.npy', cv2.GaussianBlur(m2.astype(np.float32) / 255, (0, 0), 1.4).astype(np.float16))
    inp = cv2.inpaint(cv2.cvtColor(H, cv2.COLOR_RGB2BGR), m1, 7, cv2.INPAINT_TELEA)
    inp = cv2.cvtColor(inp, cv2.COLOR_BGR2RGB)
    tm = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 1.6)
    return inp, tm, m
if __name__ == '__main__':
    inp, tm, m = build()
    np.save('H_inp.npy', inp); np.save('TM.npy', tm.astype(np.float16)); Image.fromarray(inp).save('H_inp.png')
    Image.fromarray(np.dstack([H, (tm * 255).astype(np.uint8)])).save('text_layer.png')
    Image.fromarray(inp).resize((820, 633)).save('H_inp_small.jpg', quality=88)
    Image.fromarray((m)).resize((820, 633)).save('textmask.png')
