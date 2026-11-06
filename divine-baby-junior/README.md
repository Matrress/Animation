# Divine DunlopDreams · Dunlop Baby & Junior · product description

Status: **0.9.0 prototype (Bio Comfort model, 50/50 selection and presentation), not published.** Nothing in Ecwid has been changed.

- Analysis, design system, review questions and business model: [`ANALYSIS.md`](ANALYSIS.md)
- Prototype (open in a browser): [`preview/prototype.html`](preview/prototype.html)
- Paste-ready Ecwid Description: [`ecwid/description-0.9.0.html`](ecwid/description-0.9.0.html)
- Screenshots: [`docs/shots/`](docs/shots/)
- Earlier builds (0.1.0, 0.2.0) are in git history only, so an old description cannot be pasted by mistake.

## Build
```
python3 build.py
```
Edit only `src/description.html` and `src/dbj.css`. Blocks wrapped in `<!--R-->…<!--/R-->` (HTML) and `/*R*/…/*/R*/` (CSS) are review notes: they show in the prototype and are removed from the Ecwid file. The build fails if anything from review remains in the Ecwid file.

## Selector (dbs.js)
`src/dbs.js` (copied to `release/0.9.0/dbs.js`) builds two equal cubes side by side: selection (type, size, height, summary, Add to bag proxy) on the left and a tabbed presentation on the right; pressing a selection button opens the matching panel (a size opens the dimensioned drawing in centimetres and inches, a height opens the height comparison). It fills Ecwid's own option dropdowns (price, bag and checkout stay with Ecwid). It is loaded by a 283-character site-wide loader (`ecwid/loader-0.9.0.html`, pinned to the commit that holds the script); **not installed, needs approval**. Without it the description still shows the full static list. Tests: `node tests/dbs-test.js preview/prototype.html OUT_DIR` and `node tests/dbs-live.js src/dbs.js` (reads the live Bio Comfort page in the browser only).

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
2. Replace the content with the whole of `ecwid/description-0.9.0.html`. Save. Keep the product unpublished.
3. Preview the draft on desktop, iPad and iPhone.
4. If the description is truncated (length limit not yet verified; file is about 42,500 characters), move the CSS into a pinned jsDelivr file loaded by the existing site-wide loader.
