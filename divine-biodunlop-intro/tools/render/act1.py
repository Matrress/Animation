# Act 1 (origin): forest at sunrise -> the tapped rubber tree -> natural latex milk, all in the hero's mint palette
import numpy as np, os, sys
from PIL import Image
from scipy import ndimage
OW,OH=1280,988
# luminance -> colour map taken from Hero 1.20.2 (hair, back, pillow and sky samples)
xs=np.array([0,40,150,205,235,255],float)
cs=np.array([(16,38,38),(31,58,52),(128,168,160),(190,232,226),(205,250,238),(238,252,248)],float)
LUT=np.stack([np.interp(np.arange(256),xs,cs[:,c]) for c in range(3)],1)
def grade(a, keep=0.12, lift=0.0):
    l=np.clip(a@[0.299,0.587,0.114],0,255)
    l=np.clip(l*(1-lift)+255*lift,0,255)
    m=LUT[l.astype(np.uint8)]
    return np.clip(m+keep*(a-l[...,None]),0,255)
def load(i): return np.array(Image.open(f'Bf/b{i:03d}.png').convert('RGB'),np.float32)
def zoom(a,z,ox=.5,oy=.5):
    if abs(z-1)<1e-4: return a
    w,h=OW/z,OH/z; x0=(OW-w)*ox; y0=(OH-h)*oy
    return np.array(Image.fromarray(a.astype(np.uint8)).resize((OW,OH),Image.BICUBIC,box=(x0,y0,x0+w,y0+h)),np.float32)
def ease(t): t=np.clip(t,0,1); return t*t*(3-2*t)
FPS=30
def src(t0,t1,t,dur):   # map output time within a shot to a source frame index (30 fps source)
    return int(round((t0+(t1-t0)*np.clip(t/dur,0,1))*FPS))
SHOTS=[ # name, start, end, src t0, src t1, zoom from, zoom to, origin, grade lift
  ('forest', 0.00,1.45, 0.00,1.00, 1.00,1.07,(.5,.55),0.00),
  ('tap',    1.10,2.65, 2.40,3.90, 1.05,1.20,(.5,.72),0.42),
  ('milk',   2.30,3.95, 6.35,7.95, 1.00,1.07,(.5,.35),0.00),
]
XF=0.35
def frame_at(T):
    out=None
    for k,(n,a,b,s0,s1,z0,z1,o,lift) in enumerate(SHOTS):
        if T<a or T>b: continue
        t=T-a; dur=b-a
        f=grade(load(src(s0,s1,t,dur)),keep=0.10 if n=='forest' else 0.06,lift=lift)
        if n=='tap': f=ndimage.gaussian_filter(f,(2.0,2.0,0))       # soften the posterised source: a misty memory, not a hard cut-out
        if n=='milk':                                               # the latex surface brightens into milky white
            w=ease((T-3.15)/0.8); f=f*(1-w)+np.array([236,250,246])*w
        f=zoom(f,z0+(z1-z0)*ease(t/dur),*o)
        wgt=1.0 if k==0 else ease(t/XF)
        out=f if out is None else out*(1-wgt)+f*wgt
    return out
if __name__=='__main__':
    os.makedirs('O1',exist_ok=True)
    N=int(round(3.95*FPS))
    for i in range(N):
        Image.fromarray(np.clip(frame_at(i/FPS),0,255).astype(np.uint8)).save(f'O1/o{i:03d}.png')
    print(N)
