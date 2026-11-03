import re,json,copy
h=open('a2.html',encoding='utf8').read()
R='/home/user/animation/divine-firmness/release/1.0.0-inline/'
TEST="<script>document.body.insertAdjacentHTML('afterbegin','<div id=\"t8\" style=\"position:fixed;top:0;left:0;right:0;z-index:99999;background:#e00;color:#fff;padding:8px 12px;font:600 15px sans-serif\">TEST 8 OK</div>')</script>\n"
b8=TEST+open(R+'08_JS_module.html',encoding='utf8').read()
b9=open(R+'09_JS_visual.html',encoding='utf8').read()
# 1) state
key='window.initialState = '
i=h.find(key)+len(key); j=i+1
while True:
    if h[j]=='\\': j+=2; continue
    if h[j]=='"': break
    j+=1
lit=h[i:j+1]
state=json.loads(json.loads(lit))
tl=state['tile']['tileList']
idx=[n for n,t in enumerate(tl) if t.get('id')=='custom-code-7gvCX6'][0]
base=tl[idx]
def mk(tid,name,code,order):
    t=copy.deepcopy(base); t['id']=tid; t['tileName']=name; t['order']=order; t['content']['code']=code; return t
t8=mk('custom-code-SYN008','8 Firmness',b8,base['order']+1)
t9=mk('custom-code-SYN009','9 Firmness',b9,base['order']+2)
for t in tl[idx+1:]: t['order']+=2
tl[idx+1:idx+1]=[t8,t9]
new_lit=json.dumps(json.dumps(state,separators=(',',':')))
h=h[:i]+new_lit+h[j+1:]
# 2) SSR markup after the 7 Firmness tile
anchor='<!-- DDFT-END 3 -->\n</div>'
assert anchor in h
def tile(tid,code,n): return f'<div id="tile-{tid}" tile-type="CUSTOM_CODE" tile-id="{tid}" visibility="true" is-first-tile-with-title="false" class="" tile-index-in-list="{n}">{code}</div>'
h=h.replace(anchor,anchor+tile('custom-code-SYN008',b8,9)+tile('custom-code-SYN009',b9,10),1)
open('synth.html','w',encoding='utf8').write(h)
print('synthetic page built',len(h))
