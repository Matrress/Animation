import re,json
exec(open('aud8.py').read().split("for fn in")[0])
corpus=[]
for fn in ['home_a.html','a1.html']:
    out=[]; tiles(state(fn),out)
    corpus+= [o['content'].get('code','') for o in out]
L='\n'.join(corpus)
R='/home/user/animation/divine-firmness/release/1.0.0-inline/'
b8=open(R+'08_JS_module.html',encoding='utf8').read(); b9=open(R+'09_JS_visual.html',encoding='utf8').read()
cands=[r'\\x[0-9A-Fa-f]{2}',r'\\u[0-9A-Fa-f]{4}',r'location\.href',r'window\.location',r'mailto:',r'fetch\(',r'new Event',r'CustomEvent',r'IntersectionObserver',
 r'preventDefault',r'\.click\(\)',r'scrollIntoView',r'dispatchEvent',r'matchMedia',r'createElementNS',r'cloneNode',r'\.submit',r'<form',r'addEventListener\(.submit',r'\beval\b',r'Function\(',r'atob',r'fromCharCode',r'document\.cookie',r'localStorage',r'<iframe',r'javascript:',r'\bon[a-z]+\s*=']
print('pattern'.ljust(34),'published'.rjust(10),'08'.rjust(5),'09'.rjust(5))
for p in cands:
    a=len(re.findall(p,L)); x=len(re.findall(p,b8)); y=len(re.findall(p,b9))
    flag='  <-- only in 8/9' if a==0 and (x or y) else ''
    print(p.ljust(34),str(a).rjust(10),str(x).rjust(5),str(y).rjust(5),flag)
