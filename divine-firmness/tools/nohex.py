# Ecwid's publish drops custom-code sections that contain \xNN hex escapes (observed: only sections 8 and 9 had them).
# Replace every \xNN in a JS/HTML block with the equal \u00NN.
import re,glob,sys
def fix(s):
    def r(m):
        b=m.group(1)
        if len(b)%2==0: return m.group(0)      # an escaped backslash followed by x, not an escape
        return b[:-1]+'\\u00'+m.group(2).upper()
    return re.sub(r'(\\+)x([0-9A-Fa-f]{2})',r,s)
n=0
for f in ['blocks/out/6_JS_module.html','blocks/out/7_JS_visual.html']:
    s=open(f,encoding='utf8').read(); t=fix(s)
    open(f,'w',encoding='utf8').write(t); n+=len(re.findall(r'\\x[0-9A-Fa-f]{2}',s))-len(re.findall(r'\\x[0-9A-Fa-f]{2}',t))
print('replaced',n)

# Diagnostic banner at the top of section 8: only visible on an address ending in #dn-chk (customers never see it),
# so "section 8 is published" can be seen at a glance. No location.* access on purpose.
BANNER="<script>if(document.URL.indexOf('#dn-chk')>0)setTimeout(function(){var d=document,r=d.documentElement,x=d.getElementById('ddv-x'),L=[['3 scene',!!d.getElementById('ddv')],['4 texts+style',!!x&&getComputedStyle(x).display=='none'],['5 module',!!d.getElementById('dn')],['7 engine',!!window.DDFT_API],['8 script',r.classList.contains('dn-ok')],['9 script',r.classList.contains('ddv-ok')]],e=d.createElement('div');e.id='dn-t8';e.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;color:#fff;padding:8px 12px;font:600 14px/1.5 sans-serif;background:'+(L.every(function(a){return a[1]})?'#0B8A96':'#B42318');e.textContent=L.map(function(a){return a[0]+': '+(a[1]?'OK':'MISSING')}).join(' | ');d.body.insertBefore(e,d.body.firstChild)},2500)</script>\n"
f='blocks/out/6_JS_module.html'; s=open(f,encoding='utf8').read()
if 'dn-t8' not in s: open(f,'w',encoding='utf8').write(BANNER+s)
bad=[f for f in glob.glob('blocks/out/*.html') if re.search(r'(?<!\\)(?:\\\\)*\\x[0-9A-Fa-f]{2}',open(f,encoding='utf8').read())]
print('blocks still containing \\x:',bad)
sys.exit(1 if bad else 0)
