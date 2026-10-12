import numpy as np, os, glob
from PIL import Image
import act1
FPS=30
O1=sorted(glob.glob('O1/o*.png')); T=sorted(glob.glob('T/t*.png'))
os.makedirs('F',exist_ok=True)
def L(p): return np.array(Image.open(p).convert('RGB'),np.float32)
X0,X1=3.55,3.95                       # milky white -> the stage with the model
n=0
def put(a):
    global n; Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(f'F/f{n:04d}.png'); n+=1
for i in range(int(X0*FPS)): put(L(O1[i]))
first=L(T[0])
k=int((X1-X0)*FPS)
for j in range(k):
    w=act1.ease((j+1)/k); put(L(O1[min(len(O1)-1,int(X0*FPS)+j)])*(1-w)+first*w)
for p in T[1:]: put(L(p))
last=L(T[-1])
for j in range(int(0.3*FPS)): put(last)
print('frames',n, 'seconds', n/FPS)
