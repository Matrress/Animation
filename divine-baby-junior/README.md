# Divine DunlopDreams · Dunlop Baby & Junior · product description

Status: **1.1.0 (Bio Comfort model, swipe gallery beside the title, 50/50 selection and presentation, prices read from Ecwid), not published.** The product in Ecwid stays disabled; this code has not been pasted into Ecwid.

- Analysis, design system, review questions and business model: [`ANALYSIS.md`](ANALYSIS.md)
- Prototype (open in a browser): [`preview/prototype.html`](preview/prototype.html)
- Paste-ready Ecwid Description: [`ecwid/description-1.1.0.html`](ecwid/description-1.1.0.html)
- Screenshots: [`docs/shots/`](docs/shots/)
- Earlier builds (0.1.0, 0.2.0) are in git history only, so an old description cannot be pasted by mistake.

## Build
```
python3 build.py
```
Edit only `src/description.html` and `src/dbj.css`. Blocks wrapped in `<!--R-->…<!--/R-->` (HTML) and `/*R*/…/*/R*/` (CSS) are review notes: they show in the prototype and are removed from the Ecwid file. The build fails if anything from review remains in the Ecwid file.

## Selector (dbs.js)
`src/dbs.js` (copied to `release/1.1.0/dbs.js`) builds two equal cubes side by side: selection (type, size, height, summary, Add to bag proxy) on the left and a tabbed presentation on the right; pressing a selection button opens the matching panel (a size opens the dimensioned drawing in centimetres and inches, a height opens the height comparison, a Prices tab shows a size-by-height matrix). It fills Ecwid's own option dropdowns (price, bag and checkout stay with Ecwid) and shows prices only as Ecwid gives them: after the customer chooses, it reads the other height of that size; "Show every price" reads all combinations. No price is typed into the page or the script. Heights: 10 and 14 cm. The hero gallery is a swipe carousel placed beside the title, the Botanic TV pattern (CSS scroll-snap; dbs.js adds dots, mouse drag and arrow keys). It is loaded by a 283-character site-wide loader (`ecwid/loader-1.1.0.html`, pinned to the commit that holds the script); **not installed, needs approval**. Without it the description still shows the full static list. Tests: `node tests/dbs-test.js preview/prototype.html OUT_DIR` and `node tests/dbs-live.js src/dbs.js` and `node tests/dbs-live-prices.js src/dbs.js` (read the live Bio Comfort page in the browser only; nothing is bought or saved).

## Preview as a web page
```
mkdir /tmp/preview && curl -o /tmp/preview/chillax-400.woff2 <jsDelivr URL in build.py> && curl -o /tmp/preview/chillax-600.woff2 <jsDelivr URL in build.py>
python3 tools/make_artifact_preview.py /tmp/preview
```
The result is one HTML file plus `assets/` that can be published as a private preview.

## Rules of this component
- One wrapper `.dbj`; every selector starts with it; every declaration is `!important` (added by the build) against Ecwid's id-prefixed storefront CSS.
- No JavaScript, no `id`-dependent behaviour, no inline `style=""`. Expandable sections are native `<details>`.
- Chillax 400/600 from the pinned files already used by Hero and Collection, as family `DBJChillax`.
- Images on jsDelivr pinned to the commits that added them (`release/0.1.0/assets` and `release/0.2.0/assets`, see `build.py`). Detail crops are taken from the approved photos without retouching.
- Palette and structure follow the live Bio Comfort description (its `--bc-*` tokens): ink #003A68 for all text, surface #E4E8F0 with fine outlines, #B2E3FB (55%) for key numbers, strong blue #006591 with white text only on small bars (label, chips, facts strip, toggles). The build fails on any hex colour outside those six. No dark panels, no gradients. One firmness only (Medium); no Soft/Firm anywhere.
- The Bio Dunlop logo is `src/assets/bio-dunlop.svg` (the same file the 7 zones section uses), pinned on jsDelivr.
- Motion is CSS only (transform and opacity), off under reduced motion; no JavaScript and no blur filters.
- Layout follows the width of the description (container queries), not the screen, because Ecwid decides how wide the description area is.
- No mention of coconut coir anywhere (the build fails if it appears). No prices, no "organic", no unverified claims (no washability, waterproofing, hypoallergenic, newborn safety, SIDS or certification claims).

## Installing (only after approval)
1. Ecwid admin → the Baby & Junior **draft** product → Description → `<>` (HTML) mode.
2. Replace the content with the whole of `ecwid/description-1.1.0.html`. Save. Keep the product unpublished.
3. Preview the draft on desktop, iPad and iPhone.
4. If the description is truncated (length limit not yet verified; file is about 42,500 characters), move the CSS into a pinned jsDelivr file loaded by the existing site-wide loader.

## Experience 2.0.0 (the Botanic TV scheme, for this model)

`experience/` is the Baby & Junior version of the Botanic Experience TV system. Source in `experience/src`, built by `python3 experience/build.py` into `experience/dist`:

- `baby-tv-<20 hex>.js`: the television. **Optimised Preview** (Explore topics, Select & Buy steps, parts rail, stage, "Your selection" with the shop's price and the one bag button) and **Standard Product View** (the shop's own page; the description folds and unfolds). Desktop and tablets.
- `baby-phone-<20 hex>.js`: the phone layer, a guided configuration (Size, Height, Review) over the shop's own options.
- `pointer.html`: the hidden `#ddtv-pointer` element for the description (model `baby`, channel `test`, product 876311857). File names follow the shop's loader rule `^[a-z][a-z0-9-]{0,45}-[0-9a-f]{20}\.js$`.
- `loader-baby.js`: an alternative loader that serves the two files from jsDelivr.
- The description with the pointer: `ecwid/description-2.0.0.html`. Handoff page: `handoff/ecwid-experience-2.0.0.html`.

Ecwid stays the executor: the engine sets Ecwid's own dropdowns, shows Ecwid's own price (never calculated or typed in), and presses Ecwid's own Add to Bag only when the customer asks. Selection laws: the bag button is READY only when size and height are chosen (firmness Medium and the 100% cotton cover are fixed); what is missing is named; once in the bag the same button is Go to Checkout (the shop's cart); a changed choice makes it Add to Bag again.

Tests: `node experience/tests/experience-test.js docs/shots` (53 checks on an imitation of the product page), `node experience/tests/live-ecwid.js` (the same engine pointed at Bio Comfort's real options on the live page, client-side only: 10 prices equal to Ecwid's own, both views, the phone flow). Nothing is bought or saved.
