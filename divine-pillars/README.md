# Divine DunlopDreams · Four Laws of Good Sleep

Тъмна секция под Firmness блока на началната страница, в две части (0.10.0). Под нея идва System.

**Част А, „Four Laws“:** четири кръга един до друг, всеки със снимка, дъги с данни, глагол, ключово число и „Explore“. Натискане отваря панел с голяма графика.

| Закон | Глагол | Дъгите около кръга | Ключово число |
|---|---|---|---|
| 1 Support | Carries | плътност kg/m³ | 1.8–2.4× плътността на стандартната пяна |
| 2 Adaptability | Adapts | support factor (SAG) | 4.5–5.4, memory foam 2.4–3.2 |
| 3 Ventilation | Breathes | брой мащаби на въздушния поток | 3 в Bio Comfort |
| 4 Natural & Bio Origin | Is Natural | четири факта | 100% natural Dunlop latex |

**Част Б, „How We Are Different“:** шест карти (чист латекс и натурални кокосови влакна; твърдост по телесно тегло; Dual Plush; Mattress for Partners; ортопедичен твърд комфорт; индивидуално производство), изречението „Not one mattress for everyone“ и връзки към навигатора, Firmness и System.

Версии: 0.8.0 (четири кръга, без Част Б), 0.9.0 (квадратна карта със сфера), 0.10.0 (четири кръга и Част Б с шест карти). Всяка има свой `release/<v>/` и `ecwid/pillars-<v>-pinned.html`.

## Един източник

Всяка дума и всяко число са в `src/content.mjs`. `build.mjs` слага числата, таблицата и Част Б в статичната плочка, а панелите в `dpl.js`. Частта „Pure latex“ и Dual Plush са по формулировките и данните на одобрената Collection 3.13.2 (3 двойки в Botanic, 2 в Bio Comfort).
Числата са от техническия бриф на собственика (2026-10-25): плътностите на нашето производство (Soft 63, Medium 75, Firm 83 kg/m³),
публикуваните стойности на TEMPUR®, типичните диапазони по клас материал и независими технически листове за 100% natural Dunlop latex.
TEMPUR® е отделен клас и никога не се смесва с обикновената memory foam.

## Правила, които build.mjs и тестовете пазят

- Без „layer", без „approximately" и „~", без цени, без Hotel Line.
- Без абсолютни обещания за температура („no more overheating") и без непроверени превъзходни степени. Вентилацията е „architecture, not chemical cooling".
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
