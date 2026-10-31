# Four Laws of Good Sleep 0.13.5 · инсталация

## Какво е

Една Ecwid секция с custom code, в две части:

- **Част А, „Four Laws“:** четири кръга един до друг (Natural & Bio Origin, Support, Adaptability, Ventilation), с фазите на луната около всеки и тънка линия със светеща точка, която ги свързва. Около всяка снимка са данните като дъги, отдолу са глаголът, заглавието, ключовото число и бутон „Explore“. Натискане отваря панела под кръговете: голямата графика, обяснението, числата и бележката за TEMPUR®. „Compare All Materials“ отваря таблицата за шестте материала.
- **Заглавие и критерии:** „One Natural Material. Four Laws and **Criteria** for Healthy Sleep.“ Думата „Criteria“ е бутон: с мишка се отваря при посочване, на докосване и с Enter при натискане; Escape затваря. Панелът „The Search Formula“ учи четирите критерия като формула за търсене (критериите се умножават: изключиш ли един, „Healthy Sleep“ пада и пише какво се губи) и може да копира четирите въпроса.
- **Долният край на секцията** тече в цветовете на Seven Zones (същият фон и същото тийл сияние през шева), без да се променя нищо в секцията за зоните.
- **Тропическата нощ (от 1180 px):** горе вдясно се върти Земята (колкото са високи първите три реда) със слогана „Healthy for Us / Healthy for Our Planet“ под нея (текстурите са тези на Hero 1.20.2, затова не струват допълнителен трафик, ако Hero вече е зареден), в горния ляв ъгъл свети само Орион, малък (седем звезди, които бавно просветват една след друга). Луната долу е чисто изображение. Листото го няма.
- **Между частите:** белегът Bio Dunlop (hover отваря „Fully Certified“) и думите „For us, a mattress is not a piece of furniture…“.
- **Част Б, „How We Are Different“:** девет клетки, по три на ред. Първа е Wellness by Engineering: бутонът „Full Wellness Concept“ разгъва пълния текст на цялата ширина. После: Engineering Research (рамките и регулациите, за спокойно онлайн пазаруване), чист латекс, твърдост по телесно тегло, The Dual Plush System, Partner’s Comfort, ортопедичен твърд комфорт, Custom Made in High Variety (вариации, височини, проверени сертифицирани решения) и Fine-Tuned Before It Is Made. Под тях е изречението „Not one mattress for everyone. A natural latex solution made for you.“ и връзките.

**Ако 0.9.0, 0.10.0, 0.11.x, 0.12.0 или 0.13.x вече е поставена:** отвори същата секция в Ecwid и замени цялото ѝ съдържание с `ecwid/pillars-0.13.5-pinned.html`. Не добавяй втора.

В Ecwid се поставя само `ecwid/pillars-0.13.5-pinned.html` (около 17 500 знака, далеч под ~20 000).
`dpl.css`, `dpl.js` и четирите снимки идват от jsDelivr, заключени към конкретен commit.
Ако `dpl.js` не се зареди, секцията остава пълна статична страница: четирите закона, шестте карти и таблицата (в разгъващ се блок).

## Къде

Редът на началната страница:

1. Hero
2. Home Discovery (колекцията)
3. Firmness: трите секции (`dn-a`, `dn-b`, `dn-c`)
4. **Four Laws (тази секция)** ← веднага под последната Firmness секция
5. System (`divine-home-discovery/ecwid/system-0.7.0-pinned.html`), ако го включиш. Бутонът „See How We Build Your System“ се показва само когато System е на страницата.
6. Старите секции, които се махат (твое решение): Quality CRITERIA, COOL in the Summer, Natural Latex rubber foam benefits, HOW WE ARE DIFFERENT?, Latex means Natural Elasticity & Support.

Връзките „Find Your Natural Latex Mattress“, „Find Your Natural Latex Topper“ (към навигатора, `#ddhd-mattress` и `#ddhd-topper`) и „Find Your Firmness“ (към Firmness блока, `#dn`) се показват само когато целта им е на страницата.

## Стъпки

1. Ecwid → Website → добави нова секция **Custom code** веднага под последната Firmness секция.
2. Постави цялото съдържание на `ecwid/pillars-0.13.5-pinned.html` и запази.
3. Провери: кръговете се рисуват при скрол, кръг или ред отваря панела, „Compare All Materials“ отваря прозореца, Escape го затваря.

Връщане назад: `ecwid/pillars-0.13.4-pinned.html` (старото заглавие, без критериите), `ecwid/pillars-0.13.3-pinned.html` (слоганът под Земята, с 12 px отстояние), `ecwid/pillars-0.13.2-pinned.html` (слоганът върху Земята, по-голям Орион), `ecwid/pillars-0.13.1-pinned.html` (по-голяма Земя), `ecwid/pillars-0.13.0-pinned.html` (звездно поле и мигащи звезди около луната), `ecwid/pillars-0.12.0-pinned.html` (без тропическата нощ), `ecwid/pillars-0.11.2-pinned.html` (шест клетки в Част Б), `ecwid/pillars-0.11.1-pinned.html` (с вятъра към перото), `ecwid/pillars-0.11.0-pinned.html` (емблема с луната, изгряваща луна между кръговете), `ecwid/pillars-0.10.0-pinned.html` (предишният ред, без луната), `ecwid/pillars-0.9.0-pinned.html` (квадратна карта със сфера и 2×2 кръгове) или `ecwid/pillars-0.8.0-pinned.html` (четири кръга, без Част Б). Връщане към нищо: скрий или изтрий секцията. Нищо друго не зависи от нея.

## Дълбоки връзки (за Hero или менюто, по-късно)

`#dpl-support`, `#dpl-adapt`, `#dpl-breathe`, `#dpl-natural` отварят съответния закон. `#dpl-compare` отваря таблицата.

## Нова версия

```
npm i esbuild@0.24.0 axe-core
ESBUILD=node_modules/esbuild/lib/main.js DPL_BASE=https://dpl-preview.invalid/ node divine-pillars/build.mjs   # преглед
node divine-pillars/tests/pillars.mjs                                              # 321 проверки на живата страница
AXE_PATH=node_modules/axe-core/axe.min.js node divine-pillars/tests/a11y.mjs       # axe
node divine-pillars/tests/shots.mjs desktop ipad-portrait phone                     # скрийншоти в reports/
```

След commit на `release/<v>/`: `DPL_REF=<пълният sha> ESBUILD=... node divine-pillars/build.mjs` прави `ecwid/pillars-<v>-pinned.html`.
`dpl.js` и `dpl.css` не зависят от sha (снимките се намират спрямо адреса на самия скрипт), затова пинованият билд не ги променя.
