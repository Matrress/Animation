import numpy as np, sys, os
from PIL import Image
from scipy import ndimage
from plate import SX,SY,TX,TY,BW,BH
H=np.array(Image.open('../repo/divine-hero/release/1.20.2/assets/hero-band-1640.webp').convert('RGB'),np.float32)
PL=np.array(Image.open('plate.png'),np.float32)
OW,OH=1280,988
w=int(round(1280*SX)); h=int(round(720*SY))
xx=np.arange(1280)
edge=(np.clip((1278-xx)/40,0,1)[None,:]*np.clip((np.arange(720)[:,None]-2)/50,0,1)**1.5).astype(np.float32)   # right edge and top edge (the raised arm leaves the frame) fade    # the source is cut at its right edge: fade into the stage's own pillow end
def load(i):
    a=np.array(Image.open(f'Am/a{i:03d}.png'),np.float32); return a[...,:3],a[...,3]/255*edge
def place(img,ch):
    out=np.zeros((BH,BW,ch),np.float32)
    r=np.array(Image.fromarray(np.clip(img,0,255).astype(np.uint8).squeeze()).resize((w,h),Image.LANCZOS),np.float32)
    if ch==1: r=r[...,None]
    x0,y0=TX,TY; xs=-x0 if x0<0 else 0
    ww=min(BW,x0+w)-max(0,x0)
    out[y0:y0+h, max(0,x0):max(0,x0)+ww]=r[:, xs:xs+ww]
    return out
def fit():
    F,A=load(116)
    Fb=place(F,3); Ab=place(A*255,1)[...,0]/255
    m=Ab>0.98
    for x0,y0,x1,y1 in [(560,320,1080,470),(0,560,720,790),(780,740,1600,940),(0,780,540,1010)]: m[y0:y1,x0:x1]=False
    m[:,:300]=False                                      # the arm differs between the two frames
    X=np.c_[Fb[m],np.ones(m.sum())]; Y=H[m]
    keep=np.ones(len(X),bool)
    for _ in range(3):
        M,_,_,_=np.linalg.lstsq(X[keep],Y[keep],rcond=None)
        r=np.abs(X@M-Y).sum(1); keep=r<np.percentile(r[keep],70)
    return M
if __name__=='__main__':
    if not os.path.exists('grade.npy'): np.save('grade.npy',fit())
    M=np.load('grade.npy'); print(np.round(M,3))
    os.makedirs('C',exist_ok=True)
    idx=list(map(int,sys.argv[1:])) or range(119)
    for i in idx:
        F,A=load(i)
        G=np.clip(np.c_[F.reshape(-1,3),np.ones(F.shape[0]*F.shape[1])]@M,0,255).reshape(F.shape)
        Gb=place(G,3); Ab=place(A*255,1)/255
        out=PL*(1-Ab)+Gb*Ab
        Image.fromarray(np.clip(out,0,255).astype(np.uint8)).resize((OW,OH),Image.LANCZOS).save(f'C/c{i:03d}.png')
