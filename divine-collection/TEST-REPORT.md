# Test report — Divine DunlopDreams Collection 1.1.0 (2026-10-10)

Environment: Chromium (Playwright 1.56) on `preview/sim.html`, an imitation of an Ecwid Instant Site category page with Ecwid-style id-prefixed storefront CSS, in-store navigation that re-renders the description through `innerHTML`, a stand-in `Ecwid.OnPageLoaded`, and the native grid with the £0 / £0.90 prices. jsDelivr URLs are served from the local repository (byte-identical pinned files). **Not yet tested on the live Ecwid store, on a physical iPad or in Safari**: that is the Phase-1 probe and the step-4 check in INSTALL.md.

## Result: `node tests/interaction.mjs` → 153 passed, 0 failed (two consecutive runs)

| Area | What is checked | Result |
|---|---|---|
| Family rows | Every family row has its name and its own underline colour (5 distinct colours for mattresses); two columns per row; thumbnails are lazy and each picture downloads at most once | Pass |
| Content | Exactly 8 mattress / 3 topper models, in the brief's order and names; every row links to its verified product URL; one picture per model; question, selection path and every family present; no price, no gendered words; readable without CSS and JS | Pass |
| Build guards | Refuses prices, Her/Him wording, "No layers", approximations, cure / guarantee claims, an Ambient Topper, missing links, scripts / styles / ids / data- attributes in the description | Pass |
| CSS only (no script) | Overview first; hover and keyboard focus preview a model through `:has`; rows stay links | Pass |
| Desktop 1440×900, 1920×1080, 1280×720 | No model preselected; hover previews after 110 ms and highlights the family; crossing rows at 40 ms does not switch; leaving returns to the overview; click locks (aria-pressed); hovering another row previews it while the lock is kept; pointer leaves → locked model returns; moving from a row into the stage keeps that preview; component height never shrinks while exploring; Back to the overview returns focus to the row; ArrowUp / ArrowDown / Home move and preview; Enter locks; Tab reaches View model and Back, then leaves the component (no trap); focus leaving shows the locked model; no console errors | Pass |
| Touch: iPad landscape 1180×820, 1366×1024 | Tap selects, split layout kept, tap another changes the selection | Pass |
| Touch: iPad portrait 820×1180, 768×1024, phones 390×844, 360×740 | Detail opens right after the tapped row, the tapped row stays where the finger left it, a second tap closes it; no horizontal scroll; no clipped names, chips or steps; every control ≥ 44 px | Pass |
| Ecwid navigation | Mattress → Toppers in-store: initialised; View model opens the product page; browser Back restores the topper page with the chosen model; Back again shows the mattress overview; Forward: one instance, one Back button per preview; 6 more navigations: still one initialised instance; direct load of the topper page | Pass |
| Isolation | Computed styles of breadcrumbs, title, sort control, grid and cards, header links identical with and without `ddc.css` | Pass |
| Performance | No model picture downloaded before a model is previewed; hover loads only that picture; layout shift on load < 0.1 (measured 0.028 at 1440×900, mostly the web font swapping in; 0.000 at 390×844) | Pass |
| Reduced motion | No animation | Pass |
| Accessibility (axe-core 4.10) | Overview and a selected model, both collections, 1440 and 390 wide: 0 violations | Pass |

Sizes: `ddc.css` 26.8 KB (≈ 5 KB compressed), `ddc.js` 5.9 KB, loader 527 characters, mattress description 27,134 characters, topper 11,362, one new picture 13.6 KB.

## Screenshots
`reports/<device>-<collection>-<overview|selected>.webp` for desktop 1440, large 1920, iPad landscape 1180, iPad portrait 820 and phone 390 (the selected state is Botanic Dual Plush / Bio Support Dual). Fonts in the screenshots are the real Chillax files.

## Known limits / not yet verified
1. Everything in CAPABILITY-REPORT §1 marked "Unverified" (what Ecwid keeps on Save, width, length limit, site-wide code on category pages) until the probe runs.
2. Safari / WebKit and real iPad touch: the layout uses `:has` and container queries (Safari 16+). Older browsers show the plain readable layout.
3. The simulator's storefront CSS imitates Ecwid; real Ecwid rules may differ in detail. The `!important` reset covers the properties Ecwid styles in descriptions.
4. The real product links could not be opened from this sandbox; they were read from the live pages on 2026-10-10 and are identical to the Hero's verified links.
