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
chk=('<section class="card"><p class="step">Версия 29 (23.10)</p>'
 '<p class="meta"><b>Потвърдено:</b> секции 8 и 9 вече са на живия сайт и модулът работи. Причината беше шестнадесетичните ескейпове <code>\\xB3</code>/<code>\\xB7</code>: Ecwid не публикува секции с тях. Премахнати са завинаги.</p>'
 '<p class="meta"><b>Какво е ново (по твоите три точки):</b></p>'
 '<p class="meta">1. <b>Долните плочки в сцената</b> (Твърдост/Топър и Модел) вече не се наслагват в нито една конфигурация. „MEDIUM + FIRM“ има собствена плочка, дългото име на модела се пренася на два реда, а текстът в пръстена стои вътре в него. Проверено на 984 конфигурации (екрани от 320 до 1366 пиксела), с имитация на измерването на текста в Safari, където беше грешката.</p>'
 '<p class="meta">2. <b>Дясната карта до слайдерите</b> показва резултата: твърдостта, първия и втория избор с бутон „Go to model →“ към продукта. Нивата Soft, Medium, Firm, Extra Firm са малки най-долу, с килограмите и плътността.</p>'
 '<p class="meta">3. <b>Точките</b> се отварят с ховър (мишка) и с докосване (пръст), без да е нужен клик. Клик остава като възможност. Панелът се затваря с „×“, с Escape или с докосване извън него, и остава отворен, докато го четеш.</p>'
 '<p class="meta"><b>Какво да смениш: 4, 5, 8 и 9.</b> Останалите седем секции са на живия сайт точно както трябва. Секция 9 е близо до лимита (19 360 от около 19 900 знака), затова я постави цялата, без да добавяш нищо.</p></section>\n'
 '<section class="card"><p class="step">Проверка след публикуване</p>'
 '<p class="meta">1. Отвори <b>divinedunlop.com/firmnesses#dn-chk</b>: тюркоазена лента „Section 8 is published and running“ и долу вляво три зелени реда.</p>'
 '<p class="meta">2. Постави курсора върху точка (или докосни я): панелът се отваря. Смени килограмите: горният монитор и дясната карта показват модели с линк.</p>'
 '<p class="meta">3. Ако нещо не излезе, прати ми снимка, на която се вижда проблемът, и какво показва <b>#dn-chk</b>.</p></section>\n')
out=s[:i].replace(old_meta,chk)+home+fine+s[j:]
open(B+'paste_everything_v25.html','w',encoding='utf8').write(out)
print(len(out)//1024,'KB', out.count('<textarea'), 'Секция 0' in out)
