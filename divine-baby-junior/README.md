# Divine DunlopDreams · Dunlop Baby & Junior · product description

Status: **0.1.0 prototype, not published.** Nothing in Ecwid has been changed.

- Analysis, design system, review questions and business model: [`ANALYSIS.md`](ANALYSIS.md)
- Prototype (open in a browser): [`preview/prototype.html`](preview/prototype.html)
- Paste-ready Ecwid Description: [`ecwid/description-0.1.0.html`](ecwid/description-0.1.0.html)
- Screenshots: [`docs/shots/`](docs/shots/)

## Build
```
python3 build.py
```
Edit only `src/description.html` and `src/dbj.css`. Blocks wrapped in `<!--R-->…<!--/R-->` (HTML) and `/*R*/…/*/R*/` (CSS) are review notes: they show in the prototype and are removed from the Ecwid file. The build fails if anything from review remains in the Ecwid file.

## Rules of this component
- One wrapper `.dbj`; every selector starts with it; every declaration is `!important` (added by the build) against Ecwid's id-prefixed storefront CSS.
- No JavaScript, no `id`-dependent behaviour, no inline `style=""`. Expandable sections are native `<details>`.
- Chillax 400/600 from the pinned files already used by Hero and Collection, as family `DBJChillax`.
- Images on jsDelivr pinned to commit `c3cafc0` (`release/0.1.0/assets`).
- No prices, no "organic", no unverified claims (no washability, waterproofing, hypoallergenic, newborn safety, SIDS or certification claims).

## Installing (only after approval)
1. Ecwid admin → the Baby & Junior **draft** product → Description → `<>` (HTML) mode.
2. Replace the content with the whole of `ecwid/description-0.1.0.html`. Save. Keep the product unpublished.
3. Preview the draft on desktop, iPad and iPhone.
4. If the description is truncated (length limit not yet verified; file is about 31,000 characters), move the CSS into a pinned jsDelivr file loaded by the existing site-wide loader.
