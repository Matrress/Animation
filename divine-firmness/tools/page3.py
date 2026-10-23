import re,html,glob
B='build/'
s=open(B+'paste_everything_v21.html',encoding='utf8').read()
R='/home/user/animation/divine-firmness/release/1.0.0-inline/'
files=sorted(glob.glob(R+'*.html'))
titles=['Дизайн на модула (CSS)','Дизайн на визуалната сцена (CSS)','Екран 1: заглавие и интерактивна сцена','Екран 1б: обяснения на точките (текст и стил на панела)','Екран 2: модулът (въпроси, резултат, форма)','Екран 3: схемите Too firm, Too soft, Correct','Логика: правилата на двигателя','Навигация на модула (JS)','Навигация на сцената (JS)','Шрифт Chillax 400','Шрифт Chillax 600']
assert len(files)==11
def block(prefix,i,code,title):
    num=i+1; key=prefix+str(num); kb=len(code.encode('utf8'))/1024
    return ('  <section class="card">\n    <p class="step">Секция %d</p>\n    <h2>%s</h2>\n    <p class="meta">Изтрий всичко вътре в секция %d и постави целия код. Размер %.1f KB.</p>\n'
     '    <div class="row"><button type="button" data-t="%s">Копирай</button><span class="st" id="%ss" role="status" aria-live="polite"></span></div>\n'
     '    <textarea id="%s" readonly spellcheck="false" aria-label="Секция %d">%s</textarea>\n  </section>\n')%(num,title,num,kb,key,key,key,num,html.escape(code,quote=False))
codes=[open(f,encoding='utf8').read() for f in files]
home=('<h2 style="margin-top:8px">Страница Начало (divinedunlop.com)</h2>\n'
 '<section class="card"><p class="step">Начало · 11 секции</p><p class="meta">Хедърът си остава както е. Под него поставете секции 1 до 11 в този ред. Това е същият модул като на /firmnesses, качен на двете места. Първо качете /firmnesses, проверете, после Начало.</p></section>\n')
for i,c in enumerate(codes): home+=block('h',i,c,titles[i])
fine=('<h2 style="margin-top:8px">Страница Fine-Tuning (divinedunlop.com/firmnesses)</h2>\n'
 '<section class="card"><p class="step">Качвате първо тук</p><p class="meta">Секции 1 до 11 в този ред. Същият код като на Начало. Настройки за SEO: canonical към https://divinedunlop.com/ (или noindex, ако canonical не е възможен). Не публикувайте, докато не прегледате визията: <a href="https://claude.ai/artifact/CWJ3H1ngp7SPxTFBJfRuq1">отвори прегледа</a>.</p></section>\n')
for i,c in enumerate(codes): fine+=block('f',i,c,titles[i])
i=s.index('<h2 style="margin-top:8px">Страница Начало'); j=s.index('</main>')
old_meta=s[s.index('<section class="card"><p class="meta">Първо страница Начало'):s.index('</section>',s.index('Първо страница Начало'))+10]
chk=('<section class="card"><p class="step">Одит от 23.10 (версия 28)</p>'
 '<p class="meta"><b>Какво е на живия сайт</b> (сравнено знак по знак с тази инструкция): секции 1, 2, 3, 4, 6, 10 и 11 са <b>точно както трябва</b>. Секции 5 и 7 се различават само по адреса на Botanic. Секции <b>8 и 9 липсват</b> на живия сайт, въпреки че са в редактора. Затова нищо интерактивно не работи.</p>'
 '<p class="meta"><b>Какво намерих.</b> Секции 8 и 9 са единствените, които съдържат шестнадесетични ескейпове (<code>\\xB3</code>, <code>\\xB7</code>), знак за „³“ и „·“. Нито една от 15-те публикувани секции на двете страници няма такъв. Всички други особености на кода ги има и в публикуваните секции. Най-вероятно Ecwid отхвърля тези секции при публикуване. Заместих ги с <code>\\u00B3</code> и <code>\\u00B7</code> (същият знак, формат, който Ecwid вече приема). Това е най-доброто обяснение, но не е доказано: ще го видим от проверката по-долу.</p>'
 '<p class="meta"><b>Какво да смениш: 5, 7, 8 и 9.</b> Останалите седем не пипай. Всяка секция е цял готов блок: изтрий всичко в нея и постави целия код.</p></section>\n'
 '<section class="card"><p class="step">Проверка след публикуване</p>'
 '<p class="meta">1. Публикувай и отвори <b>divinedunlop.com/firmnesses#dn-chk</b>. Горе се появява тюркоазена лента „Section 8 is published and running“, долу вляво панел „Page check“ с три реда. Лентата се вижда само с този адрес, клиентите не я виждат.</p>'
 '<p class="meta">2. Лентата я има и трите реда са зелени: прехвърли слайдера за килограми. Числото се сменя, горният монитор и моделът реагират, точките отварят панел.</p>'
 '<p class="meta">3. Лентата я няма: секция 8 пак не е публикувана. Прати ми снимка на редактора и ще минем към външен файл (GitHub, фиксиран commit), което нарушава правилото „всичко инлайн“, затова чакам твоето съгласие.</p>'
 '<p class="meta">4. Лентата я има, но редовете са червени: секцията е публикувана, но не работи. Прати ми какво показва.</p></section>\n')
out=s[:i].replace(old_meta,chk)+home+fine+s[j:]
open(B+'paste_everything_v25.html','w',encoding='utf8').write(out)
print(len(out)//1024,'KB', out.count('<textarea'), 'Секция 0' in out)
