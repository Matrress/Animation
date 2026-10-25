# Four Laws of Good Sleep 0.9.0 · инсталация

## Какво е

Една Ecwid секция с custom code, в две части:

- **Част А, „Four Laws“:** една квадратна карта, в нея голям кръг („сферата“), в нея четирите кръга 2×2 (Support, Adaptability, Ventilation, Natural & Bio Origin). Около всяка снимка са данните като дъги. Под всеки кръг има дъга-бутон с глагола („Carries +“). Отстрани са четирите числа. Натискане на кръг или ред отваря панела под картата: голямата графика, обяснението, числата и бележката за TEMPUR®. „Compare All Materials“ отваря таблицата за шестте материала.
- **Част Б, „How We Are Different“:** текст и три връзки отляво, квадратен модул с четири плочки отдясно: чист латекс, твърдост по телесно тегло, Dual Plush без трети материал между двете твърдости, Made to Order.

В Ecwid се поставя само `ecwid/pillars-0.9.0-pinned.html` (до 11 500 знака, далеч под ~20 000).
`dpl.css`, `dpl.js` и четирите снимки идват от jsDelivr, заключени към конкретен commit.
Ако `dpl.js` не се зареди, секцията остава пълна статична страница: числата, четирите плочки и таблицата (в разгъващ се блок).

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
2. Постави цялото съдържание на `ecwid/pillars-0.9.0-pinned.html` и запази.
3. Провери: кръговете се рисуват при скрол, кръг или ред отваря панела, „Compare All Materials“ отваря прозореца, Escape го затваря.

Връщане назад към 0.8.0 (четири колони, без Част Б): постави `ecwid/pillars-0.8.0-pinned.html`. Връщане към нищо: скрий или изтрий секцията. Нищо друго не зависи от нея.

## Дълбоки връзки (за Hero или менюто, по-късно)

`#dpl-support`, `#dpl-adapt`, `#dpl-breathe`, `#dpl-natural` отварят съответния закон. `#dpl-compare` отваря таблицата.

## Нова версия

```
npm i esbuild@0.24.0 axe-core
ESBUILD=node_modules/esbuild/lib/main.js DPL_BASE=https://dpl-preview.invalid/ node divine-pillars/build.mjs   # преглед
node divine-pillars/tests/pillars.mjs                                              # 190 проверки на живата страница
AXE_PATH=node_modules/axe-core/axe.min.js node divine-pillars/tests/a11y.mjs       # axe
node divine-pillars/tests/shots.mjs desktop ipad-portrait phone                     # скрийншоти в reports/
```

След commit на `release/<v>/`: `DPL_REF=<пълният sha> ESBUILD=... node divine-pillars/build.mjs` прави `ecwid/pillars-<v>-pinned.html`.
`dpl.js` и `dpl.css` не зависят от sha (снимките се намират спрямо адреса на самия скрипт), затова пинованият билд не ги променя.
