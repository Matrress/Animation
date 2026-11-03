# 24.10: partners picture instead of the drawn stack (mattress + mattress), icon, and only the relevant level tiles. Idempotent.
SHA=open('ASSET_SHA').read().strip()
rd=lambda p:open(p,encoding='utf8').read()
def wr(p,s): open(p,'w',encoding='utf8').write(s)
p='v4/mod.js'; s=rd(p)
if 'PM =' not in s:
    def rep(a,b):
        global s
        assert a in s,a[:70]; s=s.replace(a,b,1)
    rep("  function api(){ return window.DDFT_API; }",
"""  function api(){ return window.DDFT_API; }
  /* the two-core partner mattress is shown with the product picture; the level names are set as text on the cores */
  var CDN = 'https://cdn.jsdelivr.net/gh/Matrress/Animation@"""+SHA+"""/divine-firmness/assets/', PM = CDN + 'partners-mattress-1000.webp', PI = CDN + 'partners-icon.webp';
  function isPP(x){ return /Partners/.test(x.model) && x.firmness.length === 2; }""")
    rep("""    if(/Partners/.test(model) && f.length === 2){
      return '<span class="dn-stack" aria-hidden="true" style="grid-template-columns:1fr 1fr"><i class="t" style="grid-column:1/3;background:#A3AAA3">SHARED LATEX TOP</i>' +
        '<i class="c" style="background:' + LV[f[1]].c + '">' + nm(f[1]).toUpperCase() + '<br>LATEX CORE</i><i class="c" style="background:' + LV[f[0]].c + '">' + nm(f[0]).toUpperCase() + '<br>LATEX CORE</i></span>';
    }""","""    if(/Partners/.test(model) && f.length === 2){
      return '<span class="dn-pm" aria-hidden="true"><img src="' + PM + '" alt="" width="1000" height="387" loading="lazy" decoding="async"><b class="l">' + nm(f[0]) + '</b><b class="r">' + nm(f[1]) + '</b></span>';
    }""")
    rep("""      h += '<article class="dn-pick' + (first ? ' first' : '') + '"><div><small>' + title""","""      h += '<article class="dn-pick' + (first ? ' first' : '') + (isPP(x) ? ' pp' : '') + '">' + (isPP(x) ? '<img class="dn-pi" src="' + PI + '" alt="" width="40" height="72" loading="lazy">' : '') + '<div><small>' + title""")
    # right card: partner entry carries the icon
    rep("""\'"><span class="dn-rt"><small>\' +""","""\'">\' + (isPP(rx) ? \'<img class="dn-ri" src="\' + PI + \'" alt="" width="24" height="43" loading="lazy">\' : \'\') + \'<span class="dn-rt"><small>\' +""")
    # only the levels that belong to this result stay in the small tiles
    rep("""    var lt = $('dn-lvs').children; for(var q = 0; q < lt.length; q++) lt[q].className = (q + 1 === L.n) ? 'on' : '';""","""    var lt = $('dn-lvs').children, rel = {};
    rel[L.n] = 1; if(S.two){ var sp = lvl(S.pt.w, S.pt.h); if(sp) rel[LV[sp.display].n] = 1; }
    recs.forEach(function(x){ x.firmness.forEach(function(k){ rel[LV[k].n] = 1; }); });
    for(var q = 0; q < lt.length; q++){ lt[q].className = (q + 1 === L.n) ? 'on' : ''; lt[q].hidden = !rel[q + 1]; }""")
    wr(p,s)
q='blocks/out/3b_Markup_zone_texts.html'; t=rd(q)
if '/*pp*/' not in t:
    css=('<style>/*pp*/'
     '.dn-pm{position:relative;display:block;width:100%;max-width:560px;aspect-ratio:1000/387;margin:2px auto 0;border-radius:14px;overflow:hidden;background:#fff}'
     '.dn-pm img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover}'
     '.dn-pm b{position:absolute;top:84.4%;transform:translate(-50%,-50%);font:600 clamp(10px,2.6vw,17px)/1.1 DDVChillax,Chillax,system-ui,sans-serif;letter-spacing:.28em;text-transform:uppercase;color:#14191C;white-space:nowrap}'
     '.dn-pm .l{left:23.9%}.dn-pm .r{left:71.8%}'
     '.dn-pick{position:relative}.dn-pick .dn-pi{position:absolute;top:16px;right:18px;width:40px;height:auto}.dn-pick.pp>div:first-of-type{padding-right:58px}'
     '.dn-ra .dn-ri{flex:none;width:24px;height:auto}'
     '.dn-ans .dn-lvs div[hidden]{display:none}'
     '.dn-ans .dn-lvs{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(0,170px);justify-content:start}'
     '</style>')
    wr(q,t+css)
print('pp applied; asset sha',SHA[:7])
