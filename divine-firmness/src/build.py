import re,subprocess,base64,json,os,sys
B='/tmp/claude-0/-home-user-animation/578b9d4c-a6ae-55a4-a36b-c2fabe1ee389/scratchpad/'
LOGO='https://d2gt4h1eeousrn.cloudfront.net/100333285/header-fcHJMd/tZLmG6B-200x200.webp'
def rd(p): return open(B+p).read()
def wr(p,s): open(B+p,'w').write(s)
def sh(kind,src,out): subprocess.check_call(['node',B+'blocks/min.js',kind,B+src,B+out],stdout=subprocess.DEVNULL)

# ---- css: prune dead rules from module css
mc=rd('v4/mod.css')
mc=re.sub(r'\.dn-(?:bal|pan|fulc)[^{}]*\{[^{}]*\}','',mc)
mc=re.sub(r'@media\s*\([^)]*\)\{\s*\}','',mc)
mc+='\n.dn-a{padding-bottom:14px;background:var(--ground)}.dn-b,.dn-c{background:var(--ground);padding-top:0;padding-bottom:14px}.dn-c{padding-bottom:48px}\n'
wr('blocks/mod_pruned.css',mc)
# ---- visual css with a no-image fallback that reuses the stacked layout
vc=rd('visual/ddv.css')
wr('blocks/ddv_full.css',vc)
sh('css','blocks/mod_pruned.css','blocks/m_css.txt'); sh('css','blocks/ddv_full.css','blocks/v_css.txt')
# ---- js
sh('js','v4/mod.js','blocks/m_js.txt'); sh('js','visual/ddv.js','blocks/v_js.txt')
def minhtml(h):
    h=re.sub(r'<!--.*?-->','',h,flags=re.S); h=re.sub(r'>\s+<','><',h); h=re.sub(r'\n\s*',' ',h); h=re.sub(r'\s{2,}',' ',h); return h.strip()
vis=minhtml(rd('visual/ddv.html'))
mod=minhtml(rd('v4/mod.html'))
# split module markup: intro head | body
head_m=re.search(r'<div class="dn-head">.*?</div></div>|<div class="dn-head">.*?<img[^>]*></div>',mod)
head=re.search(r'<div class="dn-head">.*?<img src="LOGO"[^>]*></div>',mod).group(0)
head=head.replace('src="LOGO"','src="'+LOGO+'"')
body=mod.replace(re.search(r'<div class="dn-head">.*?<img src="LOGO"[^>]*></div>',mod).group(0),'@@')
# body is: <section class="dn" id="dn"><div class="dn-pin"...>...<div class="dn-w">@@@VISUAL@ ...
body=body.replace('<section class="dn" id="dn">','<section class="dn dn-c" id="dn">').replace('@@','',1).replace('@VISUAL@','')
# the dn-w wrapper stays in body with its pin bar
blk3='<section class="dn dn-a"><div class="dn-w">'+head+'</div></section>\n<section class="dn dn-b" id="ddv-sec"><div class="dn-w">'+vis+'</div></section>'
IMGURL='https://cdn.jsdelivr.net/gh/Matrress/Animation@33b9eb8bede4af6b33023e5a154fca1482aee68b/divine-firmness/assets/model-1400.webp'
blk3=blk3.replace('@IMG@',IMGURL)
blk4=body
engine=rd('live/new/ft_all_logic_min2.html')
blocks=[('1','CSS_module','<style>'+rd('blocks/m_css.txt')[7:-8]+'</style>' if False else rd('blocks/m_css.txt')),
 ('2','CSS_visual',rd('blocks/v_css.txt')),
 ('3','Markup_intro_visual',blk3),
 ('4','Markup_module',blk4),
 ('5','Logic',engine),
 ('6','JS_module',rd('blocks/m_js.txt')),
 ('7','JS_visual',rd('blocks/v_js.txt'))]
os.makedirs(B+'blocks/out',exist_ok=True)
for n,name,t in blocks:
    wr(f'blocks/out/{n}_{name}.html',t); print(n,name,len(t),'OK' if len(t)<=19900 else 'TOO BIG')

# ---- preview = the same seven blocks, image + logo inlined so the sandbox can show them
old=rd('build/concept.html'); head='\n'.join(old.split('\n')[:16])
logo=re.search(r'<img src="(data:image/webp;base64,[^"]+)" alt="Divine DunlopDreams"',old).group(1)
img='data:image/webp;base64,'+base64.b64encode(open(B+'visual/model2_1400.webp','rb').read()).decode()
pv='\n'.join(t for _,_,t in blocks)
pv=pv.replace(IMGURL,img).replace(LOGO,logo)
hdr='<header class="cx"><div class="cx-w"><p class="cx-e">Концепция 4 · не е код за поставяне</p><p>Визуалният слой е най-горе. Секциите отдолу са същите 7 блока, които се поставят на страницата.</p></div></header>\n'
head=head.replace('<title>Firmness Navigator</title>','<title>Firmness Navigator Visual</title>')
wr('build/concept4.html',head+'\n'+hdr+pv+'\n'); print('preview',len(head+pv)//1024,'KB')
