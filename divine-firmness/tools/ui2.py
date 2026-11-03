# Round 2 (23.10): result inside the right-hand card, compact level tiles, ring caption fix. Idempotent.
rd=lambda p:open(p,encoding='utf8').read()
def wr(p,s): open(p,'w',encoding='utf8').write(s)
# 1) markup (section 5): the result list sits right under the "say" line
p='blocks/out/4_Markup_module.html'; s=rd(p)
if 'id="dn-ra"' not in s:
    a='<p class="dn-say" id="dn-say"></p>'; assert a in s
    s=s.replace(a,a+'<div class="dn-ra" id="dn-ra"></div>',1); wr(p,s)
# 2) module script source (section 8): fill #dn-ra in render(), track clicks in start()
p='v4/mod.js'; s=rd(p)
if "dn-ra" not in s:
    a="    var nb = S.two ? null : nearBorder(S.me), note = $('dn-note');"; assert a in s
    s=s.replace(a,"""    /* the result inside this card too: firmness is the plate above, the models with their links are here */
    var ra = '';
    for(var ri = 0; ri < recs.length && ri < 2; ri++){
      var rx = recs[ri];
      ra += '<a class="dn-rl' + (ri ? '' : ' first') + '" href="' + rx.url + '" target="_blank" rel="noopener" data-m="' + rx.model + '" data-pos="' + (ri ? 'second' : 'first') + '"><span class="dn-rt"><small>' + (ri ? 'Second choice' : recs.length === 1 && S.two ? 'For both of you' : 'First choice') + '</small><b>' + rx.model + '</b><em>' + fdesc(rx) + '</em></span><i>Go to model <u aria-hidden="true">\\u2192</u></i></a>';
    }
    $('dn-ra').innerHTML = ra;
"""+a,1)
    b="    $('dn-qs').addEventListener('change',"; assert b in s
    s=s.replace(b,"""    $('dn-ra').addEventListener('click', function(e){ var a = e.target.closest && e.target.closest('a'); if(a && window.dataLayer) window.dataLayer.push({event: 'firmness_go_to_model', model: a.getAttribute('data-m'), position: a.getAttribute('data-pos')}); });
"""+b,1)
    wr(p,s)
# 3) styles live in section 4 (it has room): right card, compact levels, ring caption
p='blocks/out/3b_Markup_zone_texts.html'; s=rd(p)
if '/*ui2*/' not in s:
    css=('<style>/*ui2*/'
     '.dn-ra{display:grid;gap:8px}.dn-ra:empty{display:none}'
     '.dn-ra a{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:14px;border:1.5px solid var(--l2);background:rgba(255,255,255,.06);color:#fff;text-decoration:none;min-height:48px}'
     '.dn-ra a:focus-visible{outline:2px solid var(--acc);outline-offset:2px}'
     '.dn-ra a.first{background:#fff;color:var(--ink);border-color:var(--acc);box-shadow:0 0 0 3px rgba(95,197,205,.2)}'
     '.dn-ra .dn-rt{display:grid;gap:1px;min-width:0}'
     '.dn-ra small{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--t2)}.dn-ra a.first small{color:var(--accd)}'
     '.dn-ra b{font-size:18px;line-height:1.2;font-weight:700;overflow-wrap:anywhere}'
     '.dn-ra em{font-style:normal;font-size:13.5px;line-height:1.35;opacity:.9}'
     '.dn-ra i{flex:none;font-style:normal;font-size:14px;font-weight:700;padding:9px 13px;border-radius:10px;background:var(--acc);color:#06191C;white-space:nowrap}.dn-ra u{text-decoration:none}'
     '.dn-ra a.first i{background:var(--ink);color:#fff}'
     '@media(max-width:480px){.dn-ra a{flex-direction:column;align-items:flex-start}}'
     '.dn-ans .dn-lvs{gap:5px;margin-top:auto}'
     '.dn-ans .dn-lvs div{padding:5px 4px;gap:0;border-radius:10px;opacity:.5}'
     '.dn-ans .dn-lvs div i{display:none}'
     '.dn-ans .dn-lvs div b{font-size:12px}.dn-ans .dn-lvs div em{font-size:10.5px;font-weight:600}.dn-ans .dn-lvs div span{font-size:9.5px;opacity:.85}'
     '.dn-ans .dn-lvs div.on{transform:none;opacity:.95;box-shadow:0 0 0 2px var(--acc)}'
     '.dn-ans .dn-lvn{font-size:11.5px;margin:4px 2px 0;color:var(--l2)}'
     '.ddv-dn figcaption{inset:14px;align-content:center;gap:1px}.ddv-dn b{line-height:1.12;max-width:100%}.ddv-dn span{font-size:9px;line-height:1.1;margin-top:2px;max-width:100%}'
     '</style>')
    wr(p,s+css)
print('ui2 applied')
# 2b: narrow screens keep the small level tiles small (density line is the least important one)
p='blocks/out/3b_Markup_zone_texts.html'; s=rd(p)
if '/*ui2b*/' not in s:
    wr(p,s+'<style>/*ui2b*/@media(max-width:560px){.dn-ans .dn-lvs div span{display:none}.dn-ans .dn-lvs div em{font-size:10px;line-height:1.2}.dn-ans .dn-lvs div b{font-size:11.5px}.dn-ans .dn-lvs div{min-width:0;padding:6px 3px;overflow-wrap:anywhere}}</style>')
print('ui2b applied')
