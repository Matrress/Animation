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
chk=('<section class="card"><p class="step">Версия 30 (23.10)</p>'
 '<p class="meta"><b>Потвърдено:</b> секции 8 и 9 са на живия сайт и модулът работи. Причината беше шестнадесетичните ескейпове (<code>\\xB3</code>/<code>\\xB7</code>), които Ecwid не публикува. Премахнати са завинаги.</p>'
 '<p class="meta"><b>Какво е ново:</b></p>'
 '<p class="meta">1. <b>Долните плочки в сцената</b> (Твърдост/Топър и Модел) не се наслагват в нито една конфигурация. „MEDIUM + FIRM“ има собствена плочка, дългото име на модела се пренася на два реда, а текстът в пръстена стои вътре в него. Проверено на 1 000+ конфигурации, екрани от 320 до 1366 пиксела, с имитация на измерването на текста в Safari.</p>'
 '<p class="meta">2. <b>Отварянето в началото:</b> текстът се измерва наново, когато сцената за пръв път се покаже, при завъртане на екрана и при промяна на размера. Така резултатът не зависи от момента на зареждане.</p>'
 '<p class="meta">3. <b>Дясната карта до слайдерите</b> показва резултата: твърдостта, първия и втория избор с бутон „Go to model →“. Нивата Soft…Extra Firm са малки най-долу.</p>'
 '<p class="meta">4. <b>Точките</b> се отварят с ховър (мишка) и с докосване, без клик. Клик остава.</p>'
 '<p class="meta">5. <b>Две нови скици в най-долната секция</b> („Sit or lie: where a latex mattress is meant to work“): <i>Sitting</i> показва как седнал потъваш в матрака, защото тежестта е на малко място, и че седенето не е тест за матрака. <i>Lying</i> показва със същия модел и матрак как легнал тежестта се разпределя и латексът те държи отгоре над повърхността.</p>'
 '<p class="meta"><b>Какво да смениш: 4, 5, 6, 8 и 9.</b> Останалите шест секции (1, 2, 3, 7, 10, 11) са на живия сайт точно както трябва. Секция 9 е близо до лимита (19 511 от около 19 900 знака), постави я цялата.</p></section>\n'
 '<section class="card"><p class="step">Проверка след публикуване</p>'
 '<p class="meta">1. Отвори <b>divinedunlop.com/firmnesses#dn-chk</b>: тюркоазена лента горе и три зелени реда долу вляво.</p>'
 '<p class="meta">2. Постави курсора върху точка: панелът се отваря. Смени килограмите: горният монитор и дясната карта показват модели с линк.</p>'
 '<p class="meta">3. Превърти най-долу: под трите скици има нов заглавен блок и две нови скици, седнал и легнал.</p>'
 '<p class="meta">4. Ако нещо не излезе, прати снимка на проблема и какво показва <b>#dn-chk</b>.</p></section>\n')
out=s[:i].replace(old_meta,chk)+home+fine+s[j:]
open(B+'paste_everything_v25.html','w',encoding='utf8').write(out)
print(len(out)//1024,'KB', out.count('<textarea'), 'Секция 0' in out)
