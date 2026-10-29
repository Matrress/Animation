import numpy as np
from PIL import Image
q=4
H=Image.open('../repo/divine-hero/release/1.20.2/assets/hero-band-1640.webp').convert('L')
HW,HH=H.size
h=np.array(H.resize((HW//q,HH//q),Image.LANCZOS),float)
def grad(a):
    gx=np.zeros_like(a); gy=np.zeros_like(a); gx[:,1:-1]=a[:,2:]-a[:,:-2]; gy[1:-1]=a[2:]-a[:-2]; g=np.hypot(gx,gy); return g
# mask out the text/clouds areas of the hero: use only band y in [0.25,0.75] and x in [0.3,1.0] (head, back, pillow)
hg=grad(h)
m=np.zeros_like(hg); y0,y1=int(.28*h.shape[0]),int(.62*h.shape[0]); x0=int(.40*h.shape[1]); m[y0:y1,x0:]=1
# remove 'DIVINE' text (x .35-.65, y .25-.36) and engineering text (.48-.97, .58-.76)
hgm=hg*m
V=Image.open('A/f116.png').convert('L')
best=(-1,)
for sx in np.arange(1.10,1.55,0.025):
  for sy in np.arange(1.10,1.75,0.025):
    w=int(1280*sx/q); hh=int(720*sy/q)
    v=np.array(V.resize((w,hh),Image.BILINEAR),float); vg=grad(v)
    # correlate: slide vg over hero; compute via FFT
    P=np.zeros((h.shape[0]+hh, h.shape[1]+w)); 
    F1=np.fft.rfft2(hgm, s=P.shape); F2=np.fft.rfft2(vg[::-1,::-1], s=P.shape)
    c=np.fft.irfft2(F1*F2, s=P.shape)
    # normalise by energy of hero under window
    F3=np.fft.rfft2(np.ones_like(vg), s=P.shape); e=np.fft.irfft2(np.fft.rfft2(hgm**2,s=P.shape)*F3,s=P.shape)
    sc=c/np.sqrt(np.maximum(e,1e-6))/np.sqrt((vg**2).sum())
    i=np.unravel_index(sc.argmax(),sc.shape)
    if sc[i]>best[0]: best=(sc[i],sx,sy,(i[1]-w+1)*q,(i[0]-hh+1)*q)
print(best)
