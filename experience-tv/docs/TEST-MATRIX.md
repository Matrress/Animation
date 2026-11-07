# Test matrix: Botanic Experience TV store embed

Date of the runs: 2026-11-07. Build: see `dist/embed/MANIFEST.txt` (hash of `botanic-tv.js`).

## Read this first: what each environment proves

| Id | Environment | What it can prove | What it cannot prove |
|---|---|---|---|
| **E1** | Chromium, offline, **simulated Ecwid** (`dist/embed/test-page.html`, `prototype/`) | The engine's own logic: guard, mounting, layout, tests of every screen. | Anything about the real Ecwid, the test product, or Safari. |
| **E2** | Chromium, **local injection into the public live product page** (831592302): the real Ecwid DOM and storefront runtime. Read-only for the store; nothing is saved, Add to Bag is never clicked. | The real class names, option texts, price events, `OnPageLoaded` events, real layout at each size, real Ecwid navigation. | The test product 876405767 (it is disabled; not reachable). Safari. The real Add to Bag action. |
| **E3** | The real test product 876405767 in the real store | The actual deployment. | **NOT DONE.** Needs the owner (see `DEPLOYMENT.md`, step 8). |
| **E4** | Real Safari on a real iPad and iPhone | iPadOS and iOS behaviour: touch, video playback, rotation. | **NOT DONE.** No WebKit and no device in this environment. |

A **PASS in E1 is not a live Ecwid verification.** Only E3 and E4 are, and neither has been run.

## Automated suites

| Suite | Env | Command | Result |
|---|---|---|---|
| `tests/smoke.mjs` | E1 | `node tools/build.mjs && node tests/smoke.mjs` | **104 / 104 pass**: all 14 chapters and every screen, no pills or circles, choices drive the native controls, price mirrors the store, Classic View (13 sections, 7 videos), iPad, iPhone, `?ddtv=off`. |
| `tests/embed.mjs` | E1 | `node tools/build-embed.mjs && node tests/embed.mjs` | **175 / 175 pass**: guard, events, navigation, rotation, device sweep, phones, Add to Bag (simulated), both placement modes. A mutation check (the product guard deliberately widened) made at least 8 of them fail (the listing was cut at 8), so they do detect a regression. |
| `tests/live/*.cjs` | E2 | see `tests/live/README.md` | Results below. |

## Device matrix

E1 = `tests/embed.mjs` on the simulated store. E2 = final build injected into the real Ecwid DOM (`tests/live/inject.cjs`).
"Column" = the TV sits at the top of the store's left column; "stacked" = full width above the store's product block, which stays untouched.

| Device (viewport) | Left column width (E2) | Placement E1 / E2 | TV width E2 | Chapter labels clipped E1 / E2 | Footer overlap E1 / E2 | Min font E2 | Tap targets (touch) E1 | Page errors E1 / E2* | Sideways scroll E1 / E2 |
|---|---|---|---|---|---|---|---|---|---|
| Desktop 1440×900 | 747 | column / column | 731 | none / none | none / none | 13.2 px | n/a (compact controls) | 0 / store's own | none / none |
| iPad Pro 12.9 landscape 1366×1024 | 747 | column / column | 731 | none / none | none / none | 13.2 px | ≥ 44 px | 0 / store's own | none / none |
| iPad Air landscape 1180×820 | 747 | column / column | 731 | none / none | none / none | 13.2 px | ≥ 44 px | 0 / store's own | none / none |
| iPad mini landscape 1133×744 | 715 | column / column | 699 | none / none | none / none | 12.6 px | ≥ 44 px | 0 / store's own | none / none |
| iPad 10.2 landscape 1080×810 | 680 | stacked / stacked | 1020 | none / none | none / none | 13.5 px | ≥ 44 px | 0 / store's own | none / none |
| iPad 9.7 landscape 1024×768 | 643 | stacked / stacked | 964 | none / none | none / none | 13.5 px | ≥ 44 px | 0 / store's own | none / none |
| iPad Air portrait 820×1180 | 443 | stacked / stacked | 760 | none / none | none / none | 13.5 px | ≥ 44 px | 0 / store's own | none / none |
| iPad 10.2 portrait 810×1080 | 437 | stacked / stacked | 750 | none / none | none / none | 13.5 px | ≥ 44 px | 0 / store's own | none / none |
| iPad 9.7 portrait 768×1024 | 413 | stacked / stacked | 708 | none / none | none / none | 12.7 px | ≥ 44 px | 0 / store's own | none / none |
| iPad mini portrait 744×1133 | 399 | stacked / stacked | 684 | none / none | none / none | 12.3 px | ≥ 44 px | 0 / store's own | none / none |
| iPhone 13 portrait 390×844 | n/a | Classic only (E1) | n/a | n/a | n/a | n/a | n/a | 0 / not run | none / not run |
| iPhone 13 landscape 844×390 | n/a | Classic only (E1) | n/a | n/a | n/a | n/a | n/a | 0 / not run | none / not run |
| iPhone Pro Max landscape 932×430 | n/a | Classic only (E1) | n/a | n/a | n/a | n/a | n/a | 0 / not run | none / not run |
| Android 412×915 | n/a | Classic only (E1) | n/a | n/a | n/a | n/a | n/a | 0 / not run | none / not run |

\* **Page errors in E2.** The public store itself logs `Uncaught (in promise) #<Object>` and `Timeout exceeded (250 ms)`. They appear identically with **no injection at all** and with the engine injected (`tests/live/errors-and-addtobag.cjs`), so none of them comes from the engine.

Phones: in E1 every phone profile (both orientations) shows no television and no view switch, and the complete Classic View (13 / 13 sections, 7 / 7 videos). A phone is recognised by the short side of its screen, so a phone held sideways is still a phone.

Window-width sweep on a large screen (E1): 640 and 700 px give the complete Classic View; 720, 744, 768, 820, 900, 1024, 1100 px give the stacked placement; 1180, 1280, 1440, 1700 px give the column. No clipped label, no overlap and no sideways scroll at any of them.

Rotation without reload (E1): 1180×820 → 820×1180 → 1180×820 moves the TV column → stacked → column; always one television; the chapter the customer was on is kept; the store's options column is byte-identical afterwards.

## Scenario matrix

| Scenario | E1 simulated | E2 real Ecwid DOM / runtime | E3 test product | E4 real Safari |
|---|---|---|---|---|
| Chapter navigation, all 14 chapters and 35 screens render real content | PASS (smoke) | partly: Discover screen and chapter changes exercised | NOT DONE | NOT DONE |
| Content: every source sentence appears on a screen or is listed as intentionally not shown | PASS (smoke) | **PASS**: every text node of the live page's description (collapsed accordions included) equals the source (441 vs 443 blocks, 19 ids, 7 videos, 4 images, 32 SVG, 29 links, same style block) apart from the six firmness lines edited | NOT DONE | n/a |
| Media: 7 videos in place, none duplicated; loops muted and `playsinline`; full video opens inline with controls | PASS (attributes only) | not exercised | NOT DONE | **NOT DONE.** Playback was not tested anywhere: the sandbox cannot reach `media.divinedunlop.com`. |
| Classic View: original page restored, 13 sections, order, numbering, selection highlight | PASS | not exercised | NOT DONE | NOT DONE |
| Selectors: choosing in the TV changes the real Ecwid dropdowns | PASS | **PASS**: Medium, Deep Comfort (−24 cm), Cotton & Wool set the three real `<select>`s | NOT DONE | NOT DONE |
| Selectors: choosing in the Ecwid dropdown shows in the TV | PASS | not exercised | NOT DONE | NOT DONE |
| Price: the TV shows exactly what the store shows | PASS (simulated price and discount note) | **PASS**: store £140.40, was £156, Save 10% = monitor £140.40, £156, Save 10%. (Earlier build looked for a class that does not exist in the real store and missed the old price and the discount; fixed.) | NOT DONE | NOT DONE |
| Store column unchanged by the TV | PASS (markup identical) | **PASS** by control (`tests/live/column-diff.cjs`): after the same three choices the store's column changes in exactly the same way with and without the television (Ecwid's own price row leaves its zero-price state, the dropdowns lose their "empty" class). The engine adds nothing to it. | NOT DONE | n/a |
| Add to Bag | PASS (simulated: refuses with no options, accepts with 4, TV does not cover it) | PASS: the real button is present, enabled and **not covered**. **It was not clicked.** | **NOT DONE** (the only real test of it) | NOT DONE |
| Product guard: 876405767 yes; 111 and live 831592302 no | PASS (+ mutation check) | n/a (the live product is not in the shipped list) | NOT DONE | n/a |
| Repeated `OnPageLoaded` events: one television, same instance | PASS (5 events) | PASS: re-announcing the same product keeps one television | NOT DONE | n/a |
| Navigation between products and back | PASS (3 rounds, simulated) | **PASS** with real events: product → category (television removed) → `history.back()` (one television) → `openPage` of the same product (still one) | NOT DONE | n/a |
| Page announced before the script ran (missed event) | PASS (class and hash routes) | **PASS**: injected after load, mounted from the product-page class | NOT DONE | n/a |
| Description re-rendered by the store | PASS (simulated) | not exercised | NOT DONE | n/a |
| Script loaded twice | PASS (no second engine) | n/a | NOT DONE | n/a |
| `?ddtv=off` | PASS: nothing created at all (no engine, font, host) | not run on the real page (trivial) | NOT DONE | n/a |
| Rotation | PASS | not exercised (resize only) | NOT DONE | **NOT DONE** |
| Placement `top` and `size` | PASS both; `size` aligns the top row with SIZE to the pixel | **PASS**: `size` = 706 px vs SIZE 706 px, and the unit ends at 1387 px like the options column | NOT DONE | n/a |
| Touch: tap navigation, sidebar tabs, choices by tap | PASS (emulated touch) | emulated only | NOT DONE | **NOT DONE** |
| Store CSP / script loading from another host | n/a | The public store sends **no Content-Security-Policy** and already loads scripts from several hosts | NOT DONE | n/a |

## Not verified anywhere (needs the owner or a device)

1. The real test product 876405767: its options' exact titles and texts, its description, whether Ecwid keeps the description and any script as pasted. (`DEPLOYMENT.md`, steps 5 to 8.)
2. Safari on a real iPad and iPhone: touch feel, momentum scrolling inside the monitor, video autoplay of muted loops, full video playback, rotation.
3. Video and cover-photo playback from `media.divinedunlop.com` (blocked from this environment).
4. Whether the store's Custom JavaScript field accepts a ~190 KB script pasted inline, and where exactly it is in the admin. A hosted file with a one-line loader avoids the question.
5. A re-render of the product page by Ecwid that fires no `OnPageLoaded` event. The engine rebuilds only when told; it does not watch the page.
