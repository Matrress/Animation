# Four Laws of Good Sleep 0.8.0 · инсталация

## Какво е

Една нова Ecwid секция с custom code: тъмна лента с четирите закона (Support, Adaptability, Ventilation, Natural & Bio Origin).
Всеки закон е кръг със снимка и пръстени с данни около нея. При натискане под кръговете се отваря панелът с голямата графика, обяснението, числата и бележката за TEMPUR®.
„Compare All Materials" отваря прозорец с таблицата за шестте материала.

- В Ecwid се поставя само `ecwid/pillars-0.8.0-pinned.html` (8 866 знака, далеч под ~20 000).
- `dpl.css`, `dpl.js` и четирите снимки идват от jsDelivr, заключени към конкретен commit.
- Ако `dpl.js` не се зареди, секцията остава пълна статична страница: четирите закона, числата и таблицата (в разгъващ се блок).

## Къде

Редът на началната страница:

1. Hero
2. Home Discovery (колекцията)
3. Firmness: трите секции (`dn-a`, `dn-b`, `dn-c`)
4. **Four Laws (новата секция)** ← тук, веднага под последната Firmness секция
5. System (`divine-home-discovery/ecwid/system-0.7.0-pinned.html`), ако го включиш. Бутонът „See How We Build Your System" се показва само когато System е на страницата.
6. Старите секции, които се махат (твое решение): Quality CRITERIA, COOL in the Summer, Natural Latex rubber foam benefits, HOW WE ARE DIFFERENT?, Latex means Natural Elasticity & Support.

## Стъпки

1. Ecwid → Website → добави нова секция **Custom code** веднага под последната Firmness секция.
2. Постави цялото съдържание на `ecwid/pillars-0.8.0-pinned.html` и запази.
3. Провери: кръговете се рисуват при скрол, всеки отваря панела, „Compare All Materials" отваря прозореца, Escape го затваря.

Връщане назад: скрий или изтрий секцията. Нищо друго не зависи от нея.

## Дълбоки връзки (за Hero или менюто, по-късно)

`#dpl-support`, `#dpl-adapt`, `#dpl-breathe`, `#dpl-natural` отварят съответния закон. `#dpl-compare` отваря таблицата.

## Нова версия

```
npm i esbuild@0.24.0 axe-core
ESBUILD=node_modules/esbuild/lib/main.js DPL_BASE=https://dpl-preview.invalid/ node divine-pillars/build.mjs   # преглед
node divine-pillars/tests/pillars.mjs                                              # 153 проверки на живата страница
AXE_PATH=node_modules/axe-core/axe.min.js node divine-pillars/tests/a11y.mjs       # axe
node divine-pillars/tests/shots.mjs desktop ipad-portrait phone                     # скрийншоти в reports/
```

След commit на `release/<v>/`: `DPL_REF=<пълният sha> ESBUILD=... node divine-pillars/build.mjs` прави `ecwid/pillars-<v>-pinned.html`.
`dpl.js` и `dpl.css` не зависят от sha (снимките се намират спрямо адреса на самия скрипт), затова пинованият билд не ги променя.
