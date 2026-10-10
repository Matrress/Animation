# Divine DunlopDreams Collection — research report

Version 1.0.0 · 2026-10-10 · branch `claude/divine-collection` · Hero 1.17.1 (commit `57479ca`) untouched.

## 0. What could and could not be checked from here

| Source | Reachable? | How it was used |
|---|---|---|
| Hero 1.17.1 repository (`divine-hero/`, commit `57479ca`) | Yes | Read in full: `src/` (CSS, JS, sheets, models.json), release folder, docs, tests |
| divinedunlop.com public pages (2 categories, 11 product pages) | Not directly (sandbox network policy blocks the host). **Read through a remote fetch service** | Every product name, URL, construction, firmness and depth below was read from the live page on 2026-10-10 |
| Ecwid admin (Description editor, `<>` mode, Save) | **No** (needs Martin's login) | Phase-1 tests are packaged as a self-reporting probe for Martin to paste (§2) |
| Ecwid documentation sites | No (blocked); search snippets only | Used only where quoted below |
| jsDelivr | No (blocked) | Local copies of the same pinned files serve the tests |

Nothing in the live store was changed. Nothing was published.

## 1. Ecwid Category Description capability table

Status words: **Stable** = expected to work and safe to rely on · **Limited** = works with a condition · **Removed/rewritten** · **Does not execute** · **Unverified** = must be confirmed with the probe (§2). The "Basis" column says why.

| Capability | Status | Basis |
|---|---|---|
| Semantic HTML: `div`, `h2`, `h3`, `p`, `ul/ol/li`, `strong/b`, `span`, `small` | **Stable** | The live descriptions already render headings, paragraphs and lists; the owner's product descriptions carry much richer HTML |
| Custom classes | **Stable (to confirm)** | Product descriptions on the live site are styled with their own class names ("Full Ecwid code · v1.47" blocks). Probe tests 1–5 and the source round trip confirm it for categories |
| Links `<a href>` to product pages | **Stable** | Live descriptions and product pages contain working links |
| Images `<img>` with external `src`, `width`/`height`, `loading="lazy"` | **Stable (to confirm)** | Rich product descriptions show pictures; probe test 13 |
| Custom wrapper elements (`section`, `article`, `figure`, `header`) | **Unverified** | The interface uses only `div`, `article`, `figure`: probe test 1 and the source round trip show whether `article`/`figure` survive. If they are rewritten to `div`, the CSS still works (it targets classes, not tags) |
| `data-*` attributes | **Unverified** · not used | Probe test 4. The interface does not rely on them |
| `id` attributes | **Unverified** · not used | Probe test 5. Ids are set at runtime by the script |
| `hidden` attribute | **Unverified** | Used on the eight hidden previews. If stripped: with the stylesheet, previews stay hidden by class; without any CSS they show as a long, readable document |
| Inline `style=""` | **Unverified** · not used | Probe test 3 |
| `<style>` block | **Unverified** · not used | Probe test 1 |
| `<link rel="stylesheet">` in the description | **Unverified** · not used | Probe test 2 |
| `<button>`, `<input type=radio>` / `:checked` tabs | **Unverified** · not used | Probe tests 8 and 11. The description contains no form controls: the script creates the row buttons |
| `<picture>` / `<source>` | **Unverified** · not used | Probe test 14. Plain `<img>` with WebP (every current browser shows WebP) |
| Inline SVG | **Unverified** · not used | Probe test 15. The Dual Plush icon is drawn with CSS instead |
| Inline `<script>` | **Does not execute** | Ecwid renders the storefront with JavaScript and inserts the description as HTML; scripts inserted that way never run (HTML specification for `innerHTML`). Ecwid's API documentation says scripts in product descriptions are not supported. Confirmed in the simulator; probe test 16 confirms it live |
| `<script src>` in the description | **Does not execute** | Same mechanism; probe test 17 |
| Inline event handlers (`onclick=` …) | **Not tested, not used** | Excluded by the brief (unsafe) |
| JavaScript from Ecwid's **site-wide custom code** + `Ecwid.OnPageLoaded` | **Stable (official route)** | Ecwid's documented JS API; Hero docs record the site-wide "Custom JavaScript code" field and its 4,000-symbol limit. Our loader is 499 characters. Exact menu name to confirm (INSTALL.md §3) |
| Re-creation on in-store navigation, Back / Forward, direct load | **Handled** | The description is rebuilt on each page view; `ddc.js` initialises every new `.ddc` once (Ecwid.OnPageLoaded + DOM observer). Verified in the simulator: repeated navigation, Back, Forward, direct load, one instance, no duplicate controls |
| Markup kept after Save / after reopening the editor | **Unverified** | Probe step 4: reopen `<>` and send the saved source back; I diff it against the original |
| Sanitising / rewriting | **Unverified** | Same round trip |
| CSS `:hover`, `:focus-visible`, `:has()`, container queries | **Stable (browser features)** | Independent of Ecwid once the stylesheet loads: Safari 16+, Chrome/Edge 105+, Firefox 121+. Older browsers get the plain, readable layout |
| Ecwid styles leaking into the interface | **Handled** | Ecwid styles description content with id-prefixed selectors (`html#ecwid_html body#ecwid_body …`). Every `.ddc` declaration carries `!important`, and the simulator reproduces the hostile rules (uppercase serif headings, underlined bold blue links, bullets, inflated line-height, black uppercase buttons, centred text, bordered images): the interface renders identically |
| Interface styles affecting Ecwid | **None** | Every selector starts with `.ddc`; a test compares the computed styles of breadcrumbs, title, sort control, product cards and header links with and without `ddc.css`: identical |
| Available width / position | **Unverified** | Probe "Description width" line and test 18 report it. The layout follows the description's own width (container queries), so it adapts to whatever Ecwid gives: split view from 860 px, detail-under-the-row below |
| Length limit | **Unverified** | The mattress description is 27,134 characters, the topper one 11,334. Probe test 20 shows markers at 15k, 20k, 28k, 35k. (Instant Site *sections* were found to cut pasted code at about 20k; the description field may differ) |

### Chosen architecture (smallest reliable, Ecwid-compatible)
1. **Description HTML** (`ecwid/description-*.html`): only classes, semantic elements, `img` and real links. Readable and indexable on its own; all eight (or three) models, the orientation map, the question, the selection path and the real product links are plain HTML.
2. **One stylesheet + one small script** (`release/1.0.0/ddc.css` 26 KB, `ddc.js` 6 KB) loaded by a 499-character **site-wide custom code** snippet. The stylesheet is tiny once compressed and cached, so it loads on every page to avoid an unstyled flash; the script does nothing on pages without `.ddc`.
3. **Graceful layers**: no CSS → readable document · CSS without script → full layout, hover/keyboard previews (CSS `:has`), rows are links · CSS + script → locked selection, Back to the overview, detail under the row on narrow screens, stable height, restored choice after browser Back.

If the probe shows that the site-wide code is not available on category pages but `<style>` survives, a fallback is to inline the stylesheet in the description (length permitting). Decide after the probe.

## 2. Phase-1 probe (for Martin)
`ecwid/probe-1.0.0.html` is a harmless test fragment: 20 numbered tests, each turns green when the feature works. No event handlers, no forms submitted, no tracking. The optional `ecwid/probe-loader-1.0.0.html` (site-wide, temporary) adds test 18: Ecwid page type, category id, description width and line-height, number of page loads. Steps in INSTALL.md §2.

## 3. Reusable Hero 1.17.1 resources (reused, not copied)
| Resource | How it is reused |
|---|---|
| `assets/m-*.webp` (8 mattress cut-outs), `t-bio.webp`, `t-bio-dual.webp` | Referenced at the pinned Hero URL (`…@57479ca…/divine-hero/release/1.17.1/assets/`): no duplicate files, shared browser cache with the homepage |
| `assets/chillax-400.woff2`, `chillax-600.woff2` | Same pinned URLs in `@font-face` (`DDCChillax`): the homepage and the collection share one download |
| `t-partners.webp` | **Not reused as is**: its upper part shows pink and blue male/female silhouettes. A 13.6 KB crop of the topper only (`release/1.0.0/assets/t-partners-sides.webp`, labelled MEDIUM / FIRM) is the only new asset |
| Colour system (HANDOVER §11, hero.css 1.17.x) | Ink #14223b, labels #1f4568, Pantone 7541–7546 / 7457–7460, firmness Soft #2f7da8 · Medium #25648a · Firm #4a5664 · Extra Firm #313d4c with white type, family accents, step strip #313d4c |
| Rules: white type in dark boxes, flat fills, no heavy outlines, "latex mattress" wording, no prices, no gendered wording, readability (16 px body, ≥13 px labels, ≥8:1 ink) | Applied throughout; the build refuses prices, gendered words, "No layers", approximations, cure claims |
| Dual Plush exploded isometric pair (thin topper slab over thick mattress slab), "Latex topper / Latex mattress" rows | Rebuilt in pure CSS (no SVG, so nothing for a sanitiser to strip) |
| Three-step strip "Pick your model → set size … → buy", "Back to the overview" beside "View model" | Same patterns, new namespace |
| Hover-intent, idempotent init, re-scan on Ecwid page changes, `any-hover` | Same principles as hero.js, rewritten small for `.ddc` |
| Test approach (Ecwid imitation with inflated builder CSS, Playwright, axe) | New simulator for a category page (`tests/make-sim.mjs`) |

## 4. Prices shown in the native grid (£0 and £0.90)
- Every product page shows **"£0 · Price incl. Taxes (20%) £0"** and its sizes add the real price as option surcharges (Botanic Dual Plush: "Small Single (+£800)" … "Emperor XL (+£1 939)"). Ecwid's category cards show a product's **base price**, so they show £0.
- Hotel Line has base price **£1** with a 10% discount ("was £1, Save 10%") → **£0.90**, "incl. Taxes £0.15".
- The Botanic page also says "Delivery date: today · You will receive an email with the product attachment today", which is the wording Ecwid uses for **downloadable (digital) products**. Please check that product's type.
- Options, from cleanest to quickest: (a) set each product's base price to its smallest real configuration and make the option surcharges relative to it (the grid, Google Shopping feed and structured data then show a true "from" price); (b) Ecwid's design setting that hides prices on product cards (affects every category grid and search, not only these two); (c) CSS scoped to the two category ids that hides the price line (cosmetic only: the £0 stays in feeds and structured data). **Recommendation: (a)**. Martin decides; the new interface shows no prices in any case.

## 5. Product data verification (live pages, 2026-10-10)
Published names on the grid → name used in the interface:

| Grid / product title (published) | Interface name | URL (`https://divinedunlop.com/products/…`) |
|---|---|---|
| BOTANIC- 100% Organic Latex Mattress -Dunlop Technology | Botanic | `botanic-100-organic-latex-mattress-dunlop-technology-831592302` |
| BOTANIC DUAL PLUSH 100% Organic Latex Mattress + Organic Latex topper- Dunlop Technology | Botanic Dual Plush | `botanic-dual-plush-100-organic-latex-mattress-organic-latex-topper-dunlop-technology` |
| BIO COMFORT 100% Organic Latex Mattress Innovation Cloud Comfort | Bio Comfort | `bio-comfort-100-organic-latex-mattress-innovation-cloud-comfort` |
| BIO COMFORT DUAL PLUSH 100% Organic Latex Mattress + Organic Latex Topper- Premium Latest Design- Cloud Comfort | Bio Comfort Dual Plush | `bio-comfort-dual-plush-100-organic-latex-mattress-innovation` |
| ORTHOPAEDIC Coconut Coirs + 100% Organic Latex Dunlop Technology | Orthopaedic Coconut Coir | `orthopaedic-coconut-coirs-100-organic-latex` |
| AMBIENT- Optimised Value 100% Natural Dunlop latex mattress | Ambient | `ambient-best-price-100-natural-dunlop-latex-mattress` |
| HOTEL LINE Optimised Value 100% Dunlop latex mattress | Hotel Line | `hotel-line-optimised-value-100-dunlop-latex-mattress` |
| Dunlop Natural Latex Mattress for PARTNERS -Zone for Her & Zone for Him with Individual Comfort | Mattress for Partners | `latex-mattress-for-partners-organic-latex` |
| BIO SUPPORT 100% Organic Latex Topper Dunlop Technology | Bio Support | `bio-support-100-organic-latex-topper-dunlop-technology` |
| BIO SUPPORT DUAL 100% Organic Latex Topper | Bio Support Dual | `bio-support-plus-100-organic-latex-topper` |
| Latex Topper for Partners - FIRM & MEDIUM 100% Natural Rubber Foam | Latex Topper for Partners | `topper-for-partners-firm-medium-from-100-organic-latex` |

Facts used (all from the product pages): Botanic 20/24/26 cm, Soft–Extra Firm, 7-zone map · Botanic Dual Plush 23 cm (18+5) / 28 cm (20+8), mixes Medium+Soft, Firm+Medium, Extra Firm+Firm (mattress+topper) · Bio Comfort 23/26 cm, Soft/Medium/Firm, 7-zone cellular-capsule core + 7-Zone Synchroniser layer · Bio Comfort Dual Plush 20 cm Bio Comfort + 5 or 8 cm Plush topper = 25/28 cm, mixes Medium+Soft, Firm+Medium, elastic straps · Orthopaedic Coconut Coir 17/20/25 cm, Extra Firm comfort, Hard Extra Firm side + Safe Firm side, coconut coir stabilising layers, for orthopaedic comfort needs or over 110 kg · Ambient 16/18/20/26 cm, four firmnesses, optimised (lighter) latex density · Hotel Line pressed shredded latex core between solid latex sheets, core 14/16/18/20 cm, Firm base, optional Medium 7-zone comfort layer 3/5/8 cm, fire-resistant zip cover · Mattress for Partners two mattresses + one shared topper, 21 cm (2×16+5) / 25 cm (2×20+5), Medium+Firm, Medium+Extra Firm, Firm+Extra Firm, from UK Double · Bio Support 8/10/12/14 cm, Soft/Medium/Firm · Bio Support Dual two equal non-glued layers, Medium–Soft and Firm–Medium (lower–upper), 10 (4+4) / 12 (5+5) / 14 (6+6) cm · Latex Topper for Partners Medium + Firm sections under a shared 2 cm layer, 10/12/14/16 cm, from Double.

Deliberately **not** shown: weight ranges (they differ between product pages, see §6), adjustable-bed compatibility (not stated on the Coconut Coir page), warranty and pillows (product-page content), prices.

### Where the live pages differ from Hero 1.17.1 (information only; the Hero stays unchanged)
| Model | Hero 1.17.1 | Live page |
|---|---|---|
| Mattress for Partners | One side Medium, other Firm | Three combinations: Medium+Firm, Medium+Extra Firm, Firm+Extra Firm; two mattresses + shared topper |
| Bio Comfort Dual Plush | 28 cm only | 25 cm or 28 cm |
| Hotel Line | 18 cm | Core 14/16/18/20 cm (+ optional comfort layer) |
| Orthopaedic Coconut Coir | Firm or Extra Firm | Extra Firm comfort with a Hard Extra Firm side and a Safe Firm side |
| Firmness weight ranges | Soft ≤48 · Medium 47–83 · Firm 85–110 · Extra Firm 120+ | See §6 |

## 6. Needs Martin's confirmation
1. **Run the probe** (INSTALL.md §2) and send the screenshot + the saved source back. This settles every "Unverified" row.
2. **Backups**: paste the exact HTML of both live descriptions into `backup/*-SOURCE.html` (or send it).
3. **Topper name**: product title says **Bio Support Dual**, the category text says **Bio Support Plus**, the URL says `bio-support-plus`. The interface uses *Bio Support Dual*. Which one?
4. **Gendered wording on the live store**: the Partners mattress title ("Zone for Her & Zone for Him") and the topper category text ("Firm for HIm and Soft for Her", which also contradicts the product: Medium + Firm) remain live. The new interface replaces the category text; the product title needs your decision.
5. **Weight ranges disagree between pages**: Botanic/Ambient/Bio Support Soft ≤48, Medium 49–87, Firm 88–114, Extra Firm 115+ · Bio Comfort Soft ≤~47, Medium 47–88, Firm 85–120 · Partners Medium 48–88, Firm 88–120, Extra Firm >120 · Partners Topper Medium ≤84, Firm 84–120 · Hero card Medium 47–83, Firm 85–110, Extra Firm 120+. The interface leaves them to the product pages. Should they be unified?
6. **Family order**: the navigator follows the eight-model order (Classic → Innovative → Orthopaedic → Best Value → Partners); your current list puts Innovative last. Keep or change?
7. **Prices / product type**: §4 (base price £0 / £0.90, Botanic shown as a downloadable product).
8. **Category ids** of Latex Mattresses Collection and Latex Toppers Collection (needed only for the later, optional grid-hiding CSS).
9. **Ortho wording**: "for orthopaedic comfort needs or a body weight over 110 kg" is quoted from the product page; confirm it is the message you want on the collection.
10. **Translations**: the collection pages are English only (the categories are English today). Say if the eight Hero languages are wanted.
