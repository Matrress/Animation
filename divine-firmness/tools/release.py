import re,os,glob
O='blocks/out/';R='/home/user/animation/divine-firmness/release/1.0.0-inline/'
rd=lambda f:open(O+f,encoding='utf8').read()
fonts={}
for f in glob.glob(R+'*Font_*.html'):
    n=os.path.basename(f);fonts['400' if '400' in n else '600']=open(f,encoding='utf8').read()
for f in glob.glob(R+'*.html'): os.remove(f)
wr=lambda n,s:open(R+n,'w',encoding='utf8').write(s)
wr('01_CSS_module.html',rd('1_CSS_module.html'))
wr('02_CSS_visual.html',re.sub(r'@font-face\{[^}]*\}\s*','',rd('2_CSS_visual.html')))
wr('03_Markup_intro_visual.html',rd('3_Markup_intro_visual.html'))
wr('04_Markup_zone_texts.html',rd('3b_Markup_zone_texts.html'))
wr('05_Markup_module.html',rd('4_Markup_module.html')+rd('4b_AI_layer.html'))
wr('06_Markup_sketches.html',rd('4s_Markup_sketch.html'))
wr('07_Markup_distribution.html',rd('4t_Markup_distribution.html'))
wr('08_Logic.html',rd('5_Logic.html'));wr('09_JS_module.html',rd('6_JS_module.html'));wr('10_JS_visual.html',rd('7_JS_visual.html'))
wr('11_Font_400.html',fonts['400']);wr('12_Font_600.html',fonts['600'])
for f in sorted(glob.glob(R+'*.html')):
    n=len(open(f,encoding='utf8').read());print(os.path.basename(f),n,'' if n<=19900 or 'Font' in f else 'TOO BIG')
