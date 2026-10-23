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
BANNER="<script>if(document.URL.indexOf('#dn-chk')>0)document.body.insertAdjacentHTML('afterbegin','<div id=\"dn-t8\" style=\"position:fixed;top:0;left:0;right:0;z-index:99999;background:#0B8A96;color:#fff;padding:8px 12px;font:600 15px sans-serif\">Section 8 is published and running</div>')</script>\n"
f='blocks/out/6_JS_module.html'; s=open(f,encoding='utf8').read()
if 'dn-t8' not in s: open(f,'w',encoding='utf8').write(BANNER+s)
bad=[f for f in glob.glob('blocks/out/*.html') if re.search(r'(?<!\\)(?:\\\\)*\\x[0-9A-Fa-f]{2}',open(f,encoding='utf8').read())]
print('blocks still containing \\x:',bad)
sys.exit(1 if bad else 0)
