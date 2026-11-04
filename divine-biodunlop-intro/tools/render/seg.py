import numpy as np, sys
from PIL import Image
from ai_edge_litert.interpreter import Interpreter
it=Interpreter(model_path='../models/selfie_multiclass_256x256.tflite', num_threads=4); it.allocate_tensors()
inp=it.get_input_details()[0]['index']; out=it.get_output_details()[0]['index']
NORM='m11'
def run(t):
    x=np.array(Image.fromarray(t).resize((256,256),Image.BILINEAR),np.float32)
    x = x/127.5-1 if NORM=='m11' else x/255
    it.set_tensor(inp,x[None]); it.invoke(); o=it.get_tensor(out)[0]
    if o.min()<0 or o.sum(-1).mean()>1.5: o=np.exp(o-o.max(-1,keepdims=True)); o/=o.sum(-1,keepdims=True)
    return o
def person(a):
    H,W,_=a.shape; res=np.zeros((H,W),np.float32)
    for x0 in (0,(W-H)//2,W-H):
        o=run(np.ascontiguousarray(a[:,x0:x0+H])); p=1-o[...,0]
        p=np.array(Image.fromarray((p*255).astype(np.uint8)).resize((H,H),Image.BILINEAR),np.float32)/255
        res[:,x0:x0+H]=np.maximum(res[:,x0:x0+H],p)
    return res
if __name__=='__main__':
    NORM=sys.argv[1]
    for i in map(int,sys.argv[2:]):
        a=np.array(Image.open(f'A/f{i:03d}.png').convert('RGB'))
        Image.fromarray((person(a)*255).astype(np.uint8)).save(f'p{i:03d}_{NORM}.png')
