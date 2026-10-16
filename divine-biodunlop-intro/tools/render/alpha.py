import numpy as np, sys, os
from PIL import Image
from matte import *
S=np.load('S.npy')
S=(box(S,6)>0.5).astype(np.float32)        # closing-ish: fill small holes
S=(box(S,3)>0.98).astype(np.float32)*0+np.maximum(S,(box(S,8)>0.6))
H,W=720,1280
yy,xx=np.mgrid[0:H,0:W]
crop=(1-ss(604,648,yy)).astype(np.float32)          # the burned-in caption sits at y 660-692: everything below 648 goes
def alpha(i):
    a=frame(i); bg=bgcol(a); bl=bg.mean(); lum=a.mean(-1)
    P=seg.person(a.astype(np.uint8))
    d=np.sqrt(((a-bg)**2).sum(-1))
    black=bl<10                                            # the studio went fully black: the key can be very sensitive (dark hair on black)
    K=ss(5,17,d) if black else (ss(30,70,d) if bl<100 else ss(18,50,d))
    K=K*(box(K,4)>(0.55 if black else 0.35))                                   # speckles of compression noise go
    Ph=(0*P) if black else ss(.45,.75,P)*(lum<110)*(xx>760)                   # dark hair on a dark background: the person model (the head is always on the right)
    Pl=ss(.25,.45,P) if bl>150 else 0*P                   # lace on a white background: the person model
    A=np.maximum.reduce([K,S,Ph,Pl])
    A=guided(lum/255,A,3 if black else 5,5e-4 if black else 1e-3)
    A=np.clip((A-.06)/.88,0,1)*crop
    from scipy import ndimage
    lab,n=ndimage.label(A>0.3)
    if n>1:
        sz=ndimage.sum(np.ones_like(A),lab,range(1,n+1)); keep=np.zeros(n+1,bool); keep[1:]=sz>=4000
        A=A*ndimage.binary_dilation(keep[lab],iterations=3)
    al=np.maximum(A,1e-3)[...,None]
    F=np.where(A[...,None]>0.02,(a-(1-al)*bg)/al,a)
    return A,np.clip(F,0,255),a
if __name__=='__main__':
    os.makedirs('Am',exist_ok=True)
    idx=list(map(int,sys.argv[1:])) or range(119)
    for i in idx:
        A,F,a=alpha(i)
        Image.fromarray(np.dstack([F,A*255]).astype(np.uint8),'RGBA').save(f'Am/a{i:03d}.png')
