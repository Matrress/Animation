# Two more sketches (23.10): SITTING (weight on one small spot, you sink) and LYING (weight spread, the latex carries you).
# Same model and mattress as the other sketches: <use href="#ddv-mp"> / <use href="#ddv-bd"> come from the scene.
p='blocks/out/4s_Markup_sketch.html'; s=open(p,encoding='utf8').read()
if 'dn-sk2' in s: print('already there'); raise SystemExit
RED='#E4572E'; TEAL='#17B3B8'
css=('<style>/*dn-sk2*/'
 '.dn-sk .sf{fill:none;stroke:#4B5A60;stroke-linecap:round;stroke-linejoin:round}.dn-sk .sf.i{stroke:#CBD5DA}'
 '.dn-sk .sh{fill:#CBD5DA;stroke:#4B5A60;stroke-width:9}'
 '.dn-sk .sz{fill:'+RED+';fill-opacity:.38;stroke:'+RED+';stroke-width:6;stroke-dasharray:16 12;animation:dnzp 2.6s ease-in-out infinite}'
 '.dn-sk .dm{stroke:'+RED+';stroke-width:7;fill:none}.dn-sk .dt{fill:'+RED+';font:700 46px system-ui,sans-serif;text-anchor:middle}'
 '.dn-sk .ok .dm{stroke:'+TEAL+'}.dn-sk .ok .dt{fill:#0B7F8B}'
 '.dn-sk .aw{stroke:#7F9099;stroke-width:9;stroke-linecap:round;fill:none}.dn-sk .au{stroke:'+TEAL+';stroke-width:9;stroke-linecap:round;fill:none}'
 '.dn-sk .tip{margin:14px 0 0;font-weight:600;color:var(--ink)}'
 '@media (prefers-reduced-motion:reduce){.dn-sk .sz{animation:none}}</style>')
def limb(d,w): return f'<path class="sf" stroke-width="{w+18}" d="{d}"/><path class="sf i" stroke-width="{w}" d="{d}"/>'
def bubble(n,x,y,c): return f'<g class="zb" style="--c:{c}"><circle cx="{x}" cy="{y}" r="38"/><text x="{x}" y="{y+17}">{n}</text></g>'
mk=lambda i,c: f'<marker id="{i}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto"><path d="M0 0L10 5L0 10z" fill="{c}"/></marker>'
# ---------- SITTING
sit=('<svg viewBox="170 -150 2500 840" role="img" aria-label="Sitting on a latex mattress: your weight is on one small area, the surface gives way and you sink in">'
 '<path class="m" d="M104 452H560C700 452 760 615 900 615C1040 615 1100 452 1240 452H2628V760H104Z"/>'
 '<path class="sz" d="M560 452C700 452 760 615 900 615C1040 615 1100 452 1240 452Z"/>'
 '<path class="rf" d="M520 452H1280"/>'
 +limb('M905 505C1040 480 1130 392 1290 392L1790 392',112)       # thigh and leg lying forward on the mattress
 +limb('M905 535L935 150',178)                                    # torso
 +'<circle class="sh" cx="950" cy="-10" r="72"/>'
 +limb('M935 175L1005 330L1150 345',58)                           # arm resting on the thigh
 +'<path class="dm" d="M700 655H1100M700 635V675M1100 635V675"/><text class="dt" x="1135" y="668" style="text-anchor:start;font-size:44px">small contact area</text>'
 +bubble(1,900,540,RED)+bubble(2,1350,570,RED)+bubble(3,1780,300,RED)
 +'</svg>')
# ---------- LYING (the same model as the rest of the section)
arrows=''.join(f'<path class="aw" marker-end="url(#la1)" d="M{x} -85V30"/>' for x in range(640,2330,190))
ups=''.join(f'<path class="au" marker-end="url(#la2)" d="M{x} 585V490"/>' for x in range(640,2330,190))
lie=('<svg viewBox="170 -150 2500 840" role="img" aria-label="Lying on a latex mattress: your weight is spread over the whole body and the latex carries you on the surface">'
 '<defs>'+mk('la1','#7F9099')+mk('la2',TEAL)+'</defs>'
 '<use class="m" href="#ddv-mp"/>'
 '<path class="pw" d="M205 482C150 390 190 292 320 282L590 286C700 292 730 400 700 482Z"/>'
 '<use class="b" href="#ddv-bd"/>'
 +arrows+ups+
 '<path class="dm" d="M700 668H2250M700 650V686M2250 650V686"/><text class="dt" x="1475" y="634" style="font-size:44px">weight spread over the whole body</text>'
 +bubble(1,1500,-120,TEAL)+bubble(2,1500,540,TEAL)+bubble(3,1950,215,TEAL)
 +'</svg>')
def item(c,n,b,t): return f'<li style="--c:{c}"><i>{n}</i><span><b>{b}</b> {t}</span></li>'
card_sit=('<div>'+sit+'<div><h3>Sitting: all your weight on one small spot</h3>'
 '<p>Seated, most of your weight rests on the small area under your pelvis. The same weight on a much smaller area means much higher pressure, so the surface gives way and you sink in. This is normal, and it says nothing about how the mattress carries you in sleep.</p>'
 '<ul class="lg">'+item(RED,1,'Small area, high pressure.','Most of your weight is gathered under the pelvis.')
 +item(RED,2,'The latex gives way.','The surface sinks much deeper than it ever does when you sleep.')
 +item(RED,3,'Do not judge it by sitting.','A good latex mattress is not meant to feel springy under a seated body.')+'</ul></div></div>')
card_lie=('<div class="ok">'+lie+'<div><h3>Lying: weight spread, the latex carries you</h3>'
 '<p>Lying down, the same weight is spread over the whole length of your body, from head to ankles. The open cells of the latex answer each zone in proportion, so you rest on top of the surface, not in it. This is where a latex mattress does its job, and where its resilience belongs.</p>'
 '<ul class="lg">'+item(TEAL,1,'Weight spread','over all seven zones, not one spot.')
 +item(TEAL,2,'The latex answers each zone','and pushes back evenly.')
 +item(TEAL,3,'Held on the surface,','with the spine in one line.')
 +'</ul><p class="tip">Test a latex mattress lying down, in your own sleeping position.</p></div></div>')
head=('<div class="dn-skh" style="margin-top:34px"><h2>Sit or lie: where a latex mattress is meant to work</h2>'
 '<p>A latex mattress is made for lying down. Sitting on it, or bouncing on it, tells you nothing about how it carries your sleep.</p></div>')
tail='</div></div></section>'
assert s.rstrip().endswith(tail)
s=s.rstrip()[:-len(tail)]+'</div>'+head+'<div class="dn-sk">'+card_sit+card_lie+'</div></div></section>'+css
open(p,'w',encoding='utf8').write(s); print('sketch2 added',len(s))
