import re,base64
B='/tmp/claude-0/-home-user-animation/578b9d4c-a6ae-55a4-a36b-c2fabe1ee389/scratchpad/'
s=open(B+'build/concept4.html',encoding='utf8').read()
b=lambda p:base64.b64encode(open(B+p,'rb').read()).decode()
for w in ('400','600'):
    s=re.sub(r'url\(https://cdn\.jsdelivr\.net/gh/Matrress/Animation@[0-9a-f]+/divine-hero/release/[\d.]+/assets/chillax-%s\.woff2\)'%w,'url(data:font/woff2;base64,%s)'%b('fonts/chillax-%s.woff2'%w),s)
s=re.sub(r'https://cdn\.jsdelivr\.net/gh/Matrress/Animation@[0-9a-f]+/divine-firmness/assets/model-(900|1400)\.webp','data:image/webp;base64,'+b('visual/model2_1400.webp'),s)
s=s.replace('Концепция 4 · не е код за поставяне</p><p>Визуалният слой е най-горе. Секциите отдолу са същите 7 блока, които се поставят на страницата.</p>','Концепция 4 · преглед на цялата архитектура</p><p>Това е страница Fine-Tuning така, както ще изглежда. Кодът ѝ е в 10 номерирани секции (01 и 02 стилове, 03 екран 1, 04 модул, 05 схемите, 06 логика, 07 и 08 навигация, 09 и 10 шрифтове). Не е публикувано в Ecwid.</p>')
def mark(sel,txt): 
    global s
    assert sel in s,sel; s=s.replace(sel,'<div class="cx-s">%s</div>'%txt+sel,1)
mark('<section class="dn dn-a"','Секция 03 · Екран 1: заглавие и интерактивна сцена')
mark('<section class="dn dn-c" id="dn">','Секция 04 · Екран 2: модулът (въпроси, резултат, обяснения, контакт)')
mark('<section class="dn dn-b" id="dn-sk">','Секция 05 · Екран 3: схемите Too firm, Too soft, Correct (най-отдолу)')
s=s.replace('</style>','.cx-s{max-width:1160px;margin:22px auto 8px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));font:600 12px/1.4 Outfit,system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#5D6B6E}\n</style>',1)
open(B+'build/concept4_preview.html','w',encoding='utf8').write(s);print(len(s)//1024,'KB',s.count('cx-s'))
