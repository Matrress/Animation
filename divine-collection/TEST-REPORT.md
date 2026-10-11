# Test report — Divine DunlopDreams Collection 2.1.0 (2026-10-10)

Environment: Chromium (Playwright 1.56) on `preview/sim.html`, an imitation of an Ecwid Instant Site category page: id-prefixed storefront CSS (uppercase serif headings, underlined bold links, black uppercase buttons, centred text, bordered images, inflated line-height), in-store navigation that re-renders the description through `innerHTML`, a stand-in `Ecwid.OnPageLoaded`, a sticky site header and the native grid with the £0 / £0.90 prices. jsDelivr URLs are served from the local repository (byte-identical pinned files). **Not yet tested on the live Ecwid store, on a physical iPad or phone, or in Safari / Firefox**: that is the Phase-1 probe and INSTALL.md step 4.

## Result: `node tests/interaction.mjs` → 321 passed, 0 failed

| Area | What is checked |
|---|---|
| Content | Exactly 8 mattress / 3 topper models, one tile each, in family order; every tile links to its verified product page and every model has three links (tile, Buy now on the tile, Buy now in the card); a decorative picture in the tile and a larger picture with alt text in the card; every model carries its family label (Premium, Essential, Orthopaedic, Partners, Best Value; toppers: Single firmness, Dual firmness, Partners); question, three-step path, every family name, every model explanation and the "you buy on the model page" text are in the HTML; no price, no gendered wording, no "No layers"; no script, style, link or inline style in the description |
| Build guards | Refuses prices, Her/Him wording, "No layers", approximations, cure / guarantee claims, an Ambient Topper, a wrong model set or link count, scripts / styles / ids / data- attributes / hidden in the description |
| CSS without the script | Four columns, cards stay hidden, hover does nothing (tiles are plain links) |
| One screen (11 sizes × 2 collections) | Heights below; no horizontal scroll; nothing clipped; tiles ≥ 44 px; every family underlined in its own colour; tile text ≥ 13.5 px; tablet and desktop: mattresses 4 columns × 2 rows, toppers 3 × 1; phones: one column |
| Desktop mouse (1440×900, 1280×720, 1920×1080) | Hover opens the right card after 120 ms; card fully on screen with Buy now visible; tile described by the card text; moving from the tile into the card keeps it; pointer away closes; fast crossing of four tiles opens nothing; second-row card opens upward and still fits; switching tiles; Escape closes; a click on the tile opens the model page; Buy now in the card opens the model page; no console errors |
| Keyboard | Tab onto a tile opens its card; Tab reaches the tile's Buy now and the card's Buy now; Escape closes and returns focus to the tile; Tab leaves the component (no trap); Enter opens the model page |
| Direct entrance | A click or tap on the small picture, on the tile's Buy now button, and (mouse) anywhere on the open card opens the model page; the Buy now button is not covered by anything; on touch only a tap on the name band opens the card first |
| Touch (iPad landscape 1180×820 and 1366×1024, portrait 820×1180 and 768×1024, phones 390×844 and 360×740) | First tap opens the card and stays on the page; card on screen, *View model* ≥ 44 px and visible; phones get a bottom sheet, tablets a card beside the tile; close button; another tile opens; second tap on the same tile opens the model page (tablets); Buy now opens it; a tap elsewhere closes |
| Ecwid navigation | Mattress → toppers in-store: initialised; hover works after navigation; Back and Forward re-render fresh with one instance and one close button per card; six more navigations keep one initialised instance; direct load |
| Isolation and performance | Computed styles of breadcrumbs, title, sort control, grid cards, header links identical with and without `ddc.css`; each picture requested once (≤ 8); opening a card downloads nothing; layout shift on load < 0.1; reduced motion: no animation |
| Accessibility (axe-core 4.10) | Overview and with a card open, both collections, 1440 and 390 wide: 0 violations |

## Measured component heights (px), everything on one screen
| Window | Mattresses | Toppers |
|---|---|---|
| Laptop 1280×720 | 551 | 372 |
| 1366×768 | 560 | 379 |
| Monitor 1440×900 | 610 | 413 |
| Monitor 1920×1080 | 874 | 621 |
| iPad landscape 1180×820 | 640 | 440 |
| iPad landscape 1024×768 | 650 | 412 |
| iPad portrait 820×1180 | 871 | 604 |
| iPad portrait 768×1024 | 859 | 634 |
| iPhone 390×844 | 789 | 420 |
| Phone 360×740 | 767 | 514 |
| Phone 430×932 | 824 | 405 |

The test asserts that on windows at least 700 px wide the component is at most (window height − 110 px), which leaves room for the site header. The Ecwid category title and breadcrumbs above the component are not counted. On phones five families, eight models and the path need about 720–750 px: this fits the screen below a compact header and otherwise needs one short swipe; the picture rows are as small as they can be while staying readable and tappable.

## Screenshots
`reports/<device>-<collection>-<overview|card>.webp` for laptop 1280×720, desktop 1440×900, large 1920×1080, iPad landscape 1180×820, iPad portrait 820×1180, iPhone 390×844 and phone 360×740 (viewport screenshots: what a visitor sees without scrolling; "card" shows Bio Comfort Dual Plush / Bio Support Dual open).

## Known limits / not yet verified
1. Everything in CAPABILITY-REPORT §1 marked "Unverified" (what Ecwid keeps on Save, description width, length limit, site-wide code on category pages) until the probe runs.
2. Safari / WebKit and real touch hardware; the layout uses container queries (Safari 16+, Chrome 105+, Firefox 110+). Older browsers get the plain, readable document.
3. First visit with a cold cache: if the stylesheet arrives after Ecwid has rendered the description, the page shows unstyled pictures for a moment (the pictures carry 280 px size attributes to limit the jump). Warm visits are not affected.
4. The simulator's storefront CSS imitates Ecwid; real Ecwid rules may differ in detail. The first tap on touch stops the click from reaching the storefront's own link handling; if Ecwid listens before the page (capture phase on `window`), the first tap could navigate: confirm on the real store.
5. The card sticks to the position of the tile when the page scrolls; it closes on resize and when the page is hidden.
