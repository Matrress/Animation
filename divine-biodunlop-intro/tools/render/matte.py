import numpy as np, sys, os
from PIL import Image
import seg
seg.NORM='m11'
def box(a,r):
    # box filter via integral image, same size
    c=np.cumsum(np.cumsum(np.pad(a,((r+1,r),(r+1,r)),mode='edge'),0),1)
    return (c[2*r+1:,2*r+1:]-c[:-2*r-1,2*r+1:]-c[2*r+1:,:-2*r-1]+c[:-2*r-1,:-2*r-1])/((2*r+1)**2)
def guided(I,p,r=8,eps=2e-3):
    mI=box(I,r); mp_=box(p,r); cIp=box(I*p,r)-mI*mp_; vI=box(I*I,r)-mI*mI
    a=cIp/(vI+eps); b=mp_-a*mI
    return np.clip(box(a,r)*I+box(b,r),0,1)
def ss(e0,e1,x): t=np.clip((x-e0)/(e1-e0),0,1); return t*t*(3-2*t)
def frame(i): return np.array(Image.open(f'A/f{i:03d}.png').convert('RGB'),np.float32)
def bgcol(a): return np.median(a[0:30,1180:1280].reshape(-1,3),0)
def key(a,bg):
    d=np.sqrt(((a-bg)**2).sum(-1)); return ss(16,48,d)
if __name__=='__main__':
    # static bed+pillow mask from black-background frames
    ks=[key(frame(i),bgcol(frame(i))) for i in range(62,117,6)]
    S=(np.median(np.stack(ks),0)>.5).astype(np.float32)
    S[:300]=0          # bed/pillow live in the lower part only
    np.save('S.npy',S)
    Image.fromarray((S*255).astype(np.uint8)).save('S.png')
    print('bg', [tuple(bgcol(frame(i)).astype(int)) for i in (0,20,30,40,50,60,116)])
