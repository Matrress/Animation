#!/usr/bin/env python3
"""Side-by-side comparison images from reports/matrix/* -> reports/compare/*.jpg"""
import json, os
from PIL import Image, ImageDraw, ImageFont
FP='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
F=ImageFont.truetype(FP,22) if os.path.exists(FP) else ImageFont.load_default()
def label(im,t):
    d=ImageDraw.Draw(im); d.rectangle((0,0,im.width,34),fill=(20,24,26)); d.text((10,6),t,fill=(255,255,255),font=F); return im
def pair(name,cols,out,maxw=1800,crop=None):
    ims=[]
    for lab,title in cols:
        im=Image.open(f'reports/matrix/{lab}/{name}.jpg').convert('RGB')
        if crop:
            m=json.load(open(f'reports/matrix/{lab}/metrics.json'))[name]; d=m['dpr']; L=m['lockup']
            im=im.crop((int((L['x']-40)*d),0,min(im.width,int((L['r']+30)*d)),int((L['b']+60)*d)))
        ims.append((im,title))
    tw=sum(i.width for i,_ in ims)+20*(len(ims)-1); s=min(1,maxw/tw)
    ims=[(i.resize((int(i.width*s),int(i.height*s)),Image.LANCZOS),t) for i,t in ims]
    H=max(i.height for i,_ in ims)+34; W=sum(i.width for i,_ in ims)+20*(len(ims)-1)
    c=Image.new('RGB',(W,H),(255,255,255)); x=0
    for i,t in ims:
        p=Image.new('RGB',(i.width,i.height+34),(255,255,255)); p.paste(i,(0,34)); label(p,t); c.paste(p,(x,0)); x+=i.width+20
    c.save(out,quality=84)
os.makedirs('reports/compare',exist_ok=True)
names=list(json.load(open('reports/matrix/polished-h50/metrics.json')).keys())
for n in names: pair(n,[('v26-h50',f'v26  {n}'),('polished-h50',f'1.0.0 baseline  {n}')],f'reports/compare/{n}.jpg')
for n in ['phone-360x800','phone-390x844','ipad-portrait-1024x1366','laptop-1440x900-retina','desktop-1920x1080']:
    pair(n,[('v26-h50','v26 lockup'),('polished-h50','1.0.0 lockup')],f'reports/compare/lockup-{n}.jpg',maxw=1400,crop=True)
for n in ['laptop-1440x900-retina','phone-390x844']:
    pair(n,[('polished-h50','1.0.0 baseline'),('variant-a-h50','Variant A "Tone" (optional)')],f'reports/compare/variant-a-{n}.jpg')
for n in ['desktop-2560x1440','4k-3840x2160']:
    pair(n,[('polished-h50','1.0.0 baseline'),('variant-b-h50','Variant B "Large display" (optional)')],f'reports/compare/variant-b-{n}.jpg')
