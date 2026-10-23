import re,subprocess
rd=lambda p:open(p,encoding='utf8').read()
def wr(p,s): open(p,'w',encoding='utf8').write(s)

# 1) tips hidden by CSS alone (no dependency on the scene script)
for p in ['visual/ddv.css','v2/ddv.css','blocks/out/2_CSS_visual.html']:
    s=rd(p); assert '.ddv-js .ddv-tip{display:none}' in s,p
    wr(p,s.replace('.ddv-js .ddv-tip{display:none}','.ddv-tip{display:none}'))

# 2) module script: wait for the markup and the engine, survive re-render, report status
m=rd('v4/mod.js')
old="""  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();"""
new="""  /* order-independent start: waits for the markup (#dn) and the engine (DDFT_API), starts again if the
     page builder re-renders the section, and reports its status on <html> for the page check (#dn-chk) */
  var bound = null, tries = 0, root = document.documentElement;
  function boot(){
    if(api()) root.classList.add('ddft-ok');
    var d = $('dn');
    if(!d || !api() || d === bound) return;
    bound = d;
    try{ start(); root.classList.add('dn-ok'); }catch(e){ root.classList.remove('dn-ok'); }
  }
  function tick(){ boot(); if(++tries < 700) setTimeout(tick, tries < 40 ? 150 : 1500); }
  document.addEventListener('DOMContentLoaded', boot); window.addEventListener('load', boot); tick();
})();"""
assert old in m; m=m.replace(old,new)
old2="    if(!$('dn') || !api()) return;\n"
assert old2 in m; m=m.replace(old2,'')
wr('v4/mod.js',m)

# 3) scene script: same idea; main(root) can run again for a fresh #ddv
v=rd('visual/ddv.js')
old="""(function(){
  var root = document.getElementById('ddv'); if(!root) return;
"""
new="""(function(){
  function main(root){
"""
assert old in v; v=v.replace(old,new,1)
old="""  document.addEventListener('ddn:state', function(e){ var st = e.detail; clearTimeout(timer); timer = setTimeout(function(){ apply(st); }, last ? 140 : 0); });"""
new="""  if(window.__ddvOff) window.__ddvOff();
  var onState = function(e){ var st = e.detail; clearTimeout(timer); timer = setTimeout(function(){ apply(st); }, last ? 140 : 0); };
  document.addEventListener('ddn:state', onState); window.__ddvOff = function(){ document.removeEventListener('ddn:state', onState); };"""
assert old in v; v=v.replace(old,new,1)
old="""  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if(last) apply(last); });
})();"""
new="""  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if(last) apply(last); });
  }
  /* order-independent start, see the module script */
  var bound = null, tries = 0, html = document.documentElement;
  function boot(){
    var r = document.getElementById('ddv');
    if(!r || r === bound) return;
    bound = r;
    try{ main(r); html.classList.add('ddv-ok'); }catch(e){ html.classList.remove('ddv-ok'); }
  }
  function tick(){ boot(); if(++tries < 700) setTimeout(tick, tries < 40 ? 150 : 1500); }
  document.addEventListener('DOMContentLoaded', boot); window.addEventListener('load', boot); tick();
})();"""
assert old in v; v=v.replace(old,new,1)
wr('visual/ddv.js',v)
for kind,src,out in [('js','v4/mod.js','blocks/out/6_JS_module.html'),('js','visual/ddv.js','blocks/out/7_JS_visual.html')]:
    subprocess.check_call(['node','blocks/min.js',kind,src,out])

# 4) page check, shown only for the address ...#dn-chk (CSS :target), invisible to customers
chk=('<style>.dnchk{display:none;position:fixed;left:12px;bottom:12px;z-index:2147483000;max-width:min(360px,calc(100vw - 24px));'
 'background:#10222B;color:#fff;font:13px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;padding:14px 16px;border-radius:14px;box-shadow:0 10px 36px rgba(0,0,0,.4)}'
 '.dnchk:target{display:block}.dnchk b{display:block;margin:0 0 6px;font-size:14px}.dnchk p{margin:5px 0 0}.dnchk .y{display:none;color:#6EE7B7}.dnchk .n{color:#FCA5A5}'
 'html.ddft-ok .dnchk .e .y,html.dn-ok .dnchk .m .y,html.ddv-ok .dnchk .s .y{display:inline}'
 'html.ddft-ok .dnchk .e .n,html.dn-ok .dnchk .m .n,html.ddv-ok .dnchk .s .n{display:none}</style>'
 '<aside class="dnchk" id="dn-chk" role="status"><b>Page check</b>'
 '<p class="e">Section 7 · engine: <span class="y">running</span><span class="n">NOT FOUND</span></p>'
 '<p class="m">Section 8 · module script: <span class="y">running</span><span class="n">NOT RUNNING</span></p>'
 '<p class="s">Section 9 · scene script: <span class="y">running</span><span class="n">NOT RUNNING</span></p>'
 '<p>If a line is red, that Custom code section is missing or empty on the published page.</p></aside>')
p='blocks/out/3b_Markup_zone_texts.html'; s=rd(p)
assert 'dn-chk' not in s; wr(p,s+chk)
print('ok')
