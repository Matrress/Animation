# the clean "stage": Hero 1.20.2's own band picture with the woman and the burned-in words lifted out, so the turning model can be laid into the same world
import numpy as np
from PIL import Image
from scipy import ndimage
SX,SY,TX,TY=1.275,1.125,-100,312          # video frame (1280x720) -> band (1640x1266)
H=np.array(Image.open('../repo/divine-hero/release/1.20.2/assets/hero-band-1640.webp').convert('RGB'),np.float32)
BH,BW=H.shape[:2]
def to_band(a, order=1):
    # place a 720x1280 map into band coordinates
    out=np.zeros((BH,BW),np.float32)
    w=int(round(1280*SX)); h=int(round(720*SY))
    r=np.array(Image.fromarray((a*255).astype(np.uint8)).resize((w,h),Image.BILINEAR),np.float32)/255
    x0,y0=TX,TY; xs=max(0,-x0); ys=max(0,-y0)
    out[y0+ys:y0+h, x0+xs:min(BW,x0+w)]=r[ys:, xs:xs+min(BW,x0+w)-(x0+xs)]
    return out
if __name__=='__main__':
    U=np.zeros((720,1280),np.float32)
    for i in range(0,119,2):
        U=np.maximum(U,np.array(Image.open(f'Am/a{i:03d}.png'))[...,3]/255)
    M=to_band((U>0.05).astype(np.float32))>0.5
    M=ndimage.binary_dilation(M,iterations=22)
    M[:,1522:]=False
    for x0,y0,x1,y1 in [(560,320,1080,470),(0,560,720,790),(780,740,1522,940),(0,780,540,1010)]:
        M[y0:y1,x0:x1]=True
    M[985:]=False
    np.save('platemask.npy',M)
    # sky model: per-row colour from the clear right margin, smooth in y, extrapolated downwards
    ys=np.arange(0,560); col=np.median(H[0:560,1460:1640],1)
    Y=np.arange(BH); sky=np.stack([np.polyval(np.polyfit(ys,col[:,c],2),np.minimum(Y,900)) for c in range(3)],1)
    R=H-sky[:,None,:]
    # residual (horizontal variation of the sky) filled from the sky only, by repeated blur (push-pull lite)
    known=(~M)&(Y[:,None]<640)
    Rf=np.where(known[...,None],R,0); W=known.astype(np.float32)
    acc=np.zeros_like(R); wacc=np.zeros_like(W)
    for s in (4,12,32,80,160):
        acc+= ndimage.gaussian_filter(Rf,(s,s,0)); wacc+=ndimage.gaussian_filter(W,s)
    Rfill=acc/np.maximum(wacc[...,None],1e-4)
    fade=np.clip((900-Y)/300,0,1)[:,None,None]
    fill=sky[:,None,:]+Rfill*fade
    P=np.where(M[...,None],fill,H)
    # soften the seam between kept and filled pixels
    e=ndimage.gaussian_filter(M.astype(np.float32),6)[...,None]
    P=H*(1-e)+fill*e
    P=np.where(M[...,None],fill,P)
    # the 'X' of the burned-in NATURAL LATEX on the pillow end: filled sideways from the plain pillow just right of it
    xr=slice(1522,1592); yr=slice(800,880)
    P[yr,xr]=np.repeat(ndimage.gaussian_filter(H[yr,1592:1600].mean(1),(2,0))[:,None,:],1592-1522,1)
    # under the bed on the left the hero's small mattress picture leaves a shadow: the bed rows just below are carried up over it
    # under the bed on the left the hero's small mattress picture leaves a long soft shadow (to y ~1085): each row is bridged
    # between the clean bed at x=40 and at x=640, then eased back into the original below
    ys=slice(955,1100); L=H[ys,36:44].mean(1); Rr=H[ys,636:644].mean(1); t=np.linspace(0,1,640)[None,:,None]
    br=L[:,None,:]*(1-t)+Rr[:,None,:]*t
    k=np.clip((1100-np.arange(955,1100))/20,0,1)[:,None,None]
    P[ys,:640]=br*k+P[ys,:640]*(1-k)
    P+=np.random.default_rng(7).normal(0,1.1,P.shape)
    Image.fromarray(np.clip(P,0,255).astype(np.uint8)).save('plate.png')
    Image.fromarray(np.clip(P,0,255).astype(np.uint8)).resize((820,633)).save('plate_small.jpg')
