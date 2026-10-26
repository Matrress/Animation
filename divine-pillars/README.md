# Divine DunlopDreams · Four Laws of Good Sleep

Тъмна секция под Firmness блока на началната страница, в две части (0.11.0). Под нея идва System.

**Част А, „Four Laws“:** четири кръга един до друг, всеки със снимка, дъги с данни, 12 фази на луната около кръга (светват една след друга), глагол, ключово послание и „Explore“. Между кръговете (десктоп и таблет) луна изгрява и залязва над пунктирен хоризонт: от новолуние през пълнолуние до новолуние. Натискане отваря панел с голяма графика и разгъващи се под-пера.

| Закон | Глагол | Дъгите | Ключово послание | Под-пера |
|---|---|---|---|---|
| 1 Natural & Bio Origin | Is Natural | четири факта | 100% natural Dunlop latex | |
| 2 Support | Carries | плътност на цялото ядро, kg/m³ (Extra Firm 88) | On, Not In | Seven Zones and the Stretching Effect |
| 3 Adaptability | Adapts | Progressive Response (SAG) | Instant | Four Levels of Adaptation in Bio Comfort |
| 4 Ventilation | Breathes | мащаби на въздушния поток | No More Overheating (верига вентилация → температурен комфорт → no more overheating) | Temperature Comfort; A Hygienic, Hypoallergenic Sleep Space |

**Между частите:** емблема с осем лунни фази и думите на собственика: „For us, a mattress is not a piece of furniture. For us, the mattress is a conception for healthy sleep.“ плюс реда за инженерното ниво.

**Част Б, „How We Are Different“:** шест карти (чист латекс и натурални кокосови влакна; твърдост по телесно тегло; Dual Plush; Mattress for Partners; ортопедичен твърд комфорт; индивидуално производство), изречението „Not one mattress for everyone“ и връзки към навигатора, Firmness и System.

Версии: 0.8.0 (четири кръга, без Част Б), 0.9.0 (квадратна карта със сфера), 0.10.0 (четири кръга и Част Б с шест карти), 0.11.0 (нов ред, луната, под-пера, Dual Plush System и Partner’s Comfort). Всяка има свой `release/<v>/` и `ecwid/pillars-<v>-pinned.html`.

## Един източник

Всяка дума и всяко число са в `src/content.mjs`. `build.mjs` слага числата, таблицата и Част Б в статичната плочка, а панелите в `dpl.js`. Частта „Pure latex“ и Dual Plush са по формулировките и данните на одобрената Collection 3.13.2 (3 двойки в Botanic, 2 в Bio Comfort).
Числата са от техническия бриф на собственика (2026-10-25 и 2026-10-26): плътностите на цялото ядро (Soft 63, Medium 75, Firm 83, Extra Firm 88 kg/m³; TEMPUR® 83–85 е за един материал от конструкцията),
публикуваните стойности на TEMPUR®, типичните диапазони по клас материал и независими технически листове за 100% natural Dunlop latex.
TEMPUR® е отделен клас и никога не се смесва с обикновената memory foam.

## Правила, които build.mjs и тестовете пазят

- Без „layer", без „approximately" и „~", без цени, без Hotel Line.
- Без непроверени превъзходни степени. „No More Overheating“ е ключовото послание на Ventilation по изрично решение на собственика (2026-10-26); защитата за него е махната.
- Където няма публикувано число (TEMPUR® resilience, Bio Comfort за цялото ядро), пише „Not published" или „To be measured", без догадки.
- Бутони в Title Case, текст 16 px и нагоре, контраст за тъмен фон, ambient hover на всички бутони.
- Всички id започват с `dpl` (без сблъсък с `ddhd-`, `dsys-`, `fq-`, `dn`).
- Секцията казва „Natural Latex Mattress“ и „Natural Latex Topper“ (проверява се при билд).
- Телесните тегла не се повтарят тук: те живеят в Firmness блока и в Hero картата.
- Кокосовите влакна (Orthopaedic) са натурален продукт (потвърдено от собственика) и се казват така. Dual Plush е винаги „латекс топър за комфорт върху латекс матрак за поддръжка“, никога „layer“.

## Файлове

- `src/content.mjs`, `src/dpl.css`, `src/dpl.js`, `build.mjs`
- `assets/` четирите снимки (кръгли кадри от SVG-тата на собственика, 480×480 WebP)
- `ecwid/pillars-<v>.html` (преглед), `ecwid/pillars-<v>-pinned.html` (за поставяне)
- `release/<v>/` dpl.css, dpl.js, снимките (jsDelivr)
- `tests/` pillars.mjs (поведение, геометрия и правила), a11y.mjs (axe), shots.mjs (скрийншоти), lib.mjs
