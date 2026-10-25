# Four Laws of Good Sleep 0.10.0 · инсталация

## Какво е

Една Ecwid секция с custom code, в две части:

- **Част А, „Four Laws“:** четири кръга един до друг (Support, Adaptability, Ventilation, Natural & Bio Origin). Около всяка снимка са данните като дъги, отдолу са глаголът, заглавието, ключовото число и бутон „Explore“. Натискане отваря панела под кръговете: голямата графика, обяснението, числата и бележката за TEMPUR®. „Compare All Materials“ отваря таблицата за шестте материала.
- **Част Б, „How We Are Different“:** шест карти, по три на ред: чист латекс (и натурални кокосови влакна), твърдост по телесно тегло, Dual Plush (латекс топър за комфорт върху латекс матрак за поддръжка, нищо между тях), Mattress for Partners (две твърдости в едно легло), ортопедичен твърд комфорт, индивидуално производство. Под тях е изречението „Not one mattress for everyone. A natural latex solution made for you.“ и връзките.

**Ако 0.9.0 вече е поставена:** отвори същата секция в Ecwid и замени цялото ѝ съдържание с `ecwid/pillars-0.10.0-pinned.html`. Не добавяй втора.

В Ecwid се поставя само `ecwid/pillars-0.10.0-pinned.html` (около 13 000 знака, далеч под ~20 000).
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
2. Постави цялото съдържание на `ecwid/pillars-0.10.0-pinned.html` и запази.
3. Провери: кръговете се рисуват при скрол, кръг или ред отваря панела, „Compare All Materials“ отваря прозореца, Escape го затваря.

Връщане назад: `ecwid/pillars-0.9.0-pinned.html` (квадратна карта със сфера и 2×2 кръгове) или `ecwid/pillars-0.8.0-pinned.html` (четири кръга, без Част Б). Връщане към нищо: скрий или изтрий секцията. Нищо друго не зависи от нея.

## Дълбоки връзки (за Hero или менюто, по-късно)

`#dpl-support`, `#dpl-adapt`, `#dpl-breathe`, `#dpl-natural` отварят съответния закон. `#dpl-compare` отваря таблицата.

## Нова версия

```
npm i esbuild@0.24.0 axe-core
ESBUILD=node_modules/esbuild/lib/main.js DPL_BASE=https://dpl-preview.invalid/ node divine-pillars/build.mjs   # преглед
node divine-pillars/tests/pillars.mjs                                              # 179 проверки на живата страница
AXE_PATH=node_modules/axe-core/axe.min.js node divine-pillars/tests/a11y.mjs       # axe
node divine-pillars/tests/shots.mjs desktop ipad-portrait phone                     # скрийншоти в reports/
```

След commit на `release/<v>/`: `DPL_REF=<пълният sha> ESBUILD=... node divine-pillars/build.mjs` прави `ecwid/pillars-<v>-pinned.html`.
`dpl.js` и `dpl.css` не зависят от sha (снимките се намират спрямо адреса на самия скрипт), затова пинованият билд не ги променя.
