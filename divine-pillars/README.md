# Divine DunlopDreams · Four Laws of Good Sleep

Тъмна лента под Firmness блока на началната страница: защо Natural Dunlop латексът е различен, в четири закона,
всеки с измерима физика зад него. Под нея идва System („How We Are Different").

| Закон | Глагол | Пръстените около кръга | Ключово число |
|---|---|---|---|
| 1 Support | Carries | плътност kg/m³ | 1.8–2.4× плътността на стандартната пяна |
| 2 Adaptability | Adapts | support factor (SAG) | 4.5–5.4, memory foam 2.4–3.2 |
| 3 Ventilation | Breathes | брой мащаби на въздушния поток | 3 в Bio Comfort |
| 4 Natural & Bio Origin | Is Natural | четири факта | 100% natural Dunlop latex |

## Един източник

Всяка дума и всяко число са в `src/content.mjs`. `build.mjs` слага обобщението и таблицата в статичната плочка, а панелите в `dpl.js`.
Числата са от техническия бриф на собственика (2026-10-25): плътностите на нашето производство (Soft 63, Medium 75, Firm 83 kg/m³),
публикуваните стойности на TEMPUR®, типичните диапазони по клас материал и независими технически листове за 100% natural Dunlop latex.
TEMPUR® е отделен клас и никога не се смесва с обикновената memory foam.

## Правила, които build.mjs и тестовете пазят

- Без „layer", без „approximately" и „~", без цени, без Hotel Line.
- Без абсолютни обещания за температура („no more overheating") и без непроверени превъзходни степени. Вентилацията е „architecture, not chemical cooling".
- Където няма публикувано число (TEMPUR® resilience, Bio Comfort за цялото ядро), пише „Not published" или „To be measured", без догадки.
- Бутони в Title Case, текст 16 px и нагоре, контраст за тъмен фон, ambient hover на всички бутони.
- Всички id започват с `dpl` (без сблъсък с `ddhd-`, `dsys-`, `fq-`, `dn`).

## Файлове

- `src/content.mjs`, `src/dpl.css`, `src/dpl.js`, `build.mjs`
- `assets/` четирите снимки (кръгли кадри от SVG-тата на собственика, 480×480 WebP)
- `ecwid/pillars-<v>.html` (преглед), `ecwid/pillars-<v>-pinned.html` (за поставяне)
- `release/<v>/` dpl.css, dpl.js, снимките (jsDelivr)
- `tests/` pillars.mjs (поведение и правила), a11y.mjs (axe), shots.mjs (скрийншоти), lib.mjs
