# BOTANIC mobile configurator, Graphite Blue: size selector and one-screen steps

Date: 2026-11-10. Design preview and tools only. **Nothing is deployed; the live site, desktop layout, Product TV and builds are untouched; Add to Bag was never clicked.**
Open: `docs/mobile/premium/preview/graphite.html` on a phone (add `?chrome=0` to hide the preview bar). The Ecwid block in it is a labelled stand-in; real-page proofs are E2 (public product, local, read-only).

## What follows the reference screenshot exactly
- Palette sampled from the screenshot: `#151C26` background, `#242D3C` panel, `#293649` chips, `#556A89` selected with a `#C3D5ED` edge, `#1A2332` bottom panel, `#A6B3C4` category headings.
- Heading **Choose Your Size**; category headings **SINGLE, DOUBLE, KING, SUPERKING · EMPEROR**, uppercase, unchanged; three columns; borders and spacing kept; `22 dimensions · Custom made to order`; `ALL DIMENSIONS IN CM` and `CUSTOM SIZES` (links to `divinedunlop.com/customsizes`, a page in the store's sitemap); `01 / 04`; the bottom panel with YOUR SELECTION, the price, `20 cm base depth · Price loaded from Ecwid` and `Continue to firmness`.
- The 22 chips are **built from Ecwid's own size list**, not typed: the dimensions are read from each native label and grouped by width. Checked on the real page: 22 distinct sizes in groups of 6, 5, 5 and 6, as in the screenshot (`tests/live/size-prices-e2.cjs`). Ecwid's extra choice "For More Options CONTACT US" is not a chip.

## Selected state and price
- A selected chip is filled `#556A89`, has a 2 px `#C3D5ED` edge, a soft ring, a dot and bold text. The same pattern marks selected cards on the next steps.
- The price is the text of Ecwid's own price element, shown with the selection in the bottom panel. It is **never computed**. While Ecwid recalculates (about 0.7 s) the old figure dims; it then updates, and **keeps updating when later options change** (observed through the adapter).
- **"Starting price" is only claimed when it is true.** With size alone, or size plus 20 cm, the label is *Starting price* and the caption says *20 cm base depth*. Once a firmness, a cover or another depth is chosen the label becomes *Your price*. Verified on the real page: for **all 22 sizes the price after choosing only the size equals the price after also choosing 20 cm** (22 of 22). The 20 cm depth adds nothing in Ecwid, which is why the size-only price is the base-depth price. The panel does not select 20 cm for the customer.
- The table of Ecwid's prices captured for that test is data, not content: `docs/mobile/premium/data/size-prices-e2.json` (not used by the panel).

## One screen per step
At 390 × 844, 390 × 700 and 360 × 640 every step fits without scrolling (`tools/graphite-shots.mjs`), by tightening sizes at shorter heights; below that the body would scroll inside, the bottom panel never moves.
- **Size** as above. **Firmness**: the two sliders you liked (they update the guidance without being replaced, so a drag is not interrupted: tested), the firmness scale, the guidance from the published Firmness Navigator rule, four choices, the approved description of the chosen or recommended one. **Depth**: three slabs to scale (20 / 24 / 26 cm) and the approved text. **Cover**: four tiles using the description's own texture files, loaded only when this step opens; where a texture cannot load (here, the media host is blocked) the pattern behind it shows. **Your Mattress**: the mattress drawing tinted by the firmness, the four choices with Change, Ecwid's price, and **Go to Add to Bag** (Ecwid's own button).
- **Four pillars at the side** show the steps (number, name, a tick when chosen) and are tappable.
- Step titles other than the size one follow the same pattern (Choose Your Firmness, Depth, Cover); that wording is mine, please confirm.

## Ecwid's own menus
Every screen carries **Use Ecwid's own menus instead**: it closes the panel and focuses the native dropdown for the current step. Both ways stay in step through the adapter (`sync.js`, proven on the real page). Recommendation: **panel first, menus always one tap away.** People who know what they want are faster in the menus; people who are unsure (firmness especially) gain from the guided screens. Which should lead is a question only real visitors can answer; it can be measured after a test release.

## The mattress SVG
From your line drawing (2732 × 2048, white strokes on transparency): `docs/mobile/premium/assets/botanic-mattress.svg` (three face fills, the outline, an empty `#mat-zones` layer; themed with `--mat-top`, `--mat-front`, `--mat-side`, `--mat-line`, `--mat-line-width`; lines keep a constant width at any size) and `botanic-mattress-outline.svg` (lines only, uses `currentColor`). 1.8 KB and 0.7 KB. Reproduce with `python3 tools/trace-mattress.py` then `node tools/build-mattress-svg.mjs`. The tracer lost the two right-hand diagonals at a junction; they were added as the straight lines they are, and the result was compared with the drawing by eye. Thickness variants for 20 / 24 / 26 cm are not drawn: the drawing's depth is not stated, so none was assumed.

## Colour
The configurator uses the Graphite Blue family only. The page behind it (the description's own identity, which you asked me to keep) was not recoloured in this pass; the earlier teal-green accents in the other three concepts are still there. Say if the whole page should move to graphite blue.

## Not verified
Real phones, the on-screen keyboard, VoiceOver, the test product (E3). The real cover textures (media host blocked here). The panel's behaviour on the real Ecwid page has the adapter proven (E2) but the Graphite screens themselves run on the stand-in. No user testing.

## Questions
1. Step titles and subtitles for firmness, depth and cover: confirm the wording.
2. Is the enabled button colour (`#556A89`) right? The screenshot's button is neutral grey `#414141`; I kept that for the disabled state.
3. Should the "CUSTOM SIZES" link go to `/customsizes`, or select Ecwid's contact option?
4. Panel first, or Ecwid's menus first (see above)?
5. Move the whole page to graphite blue?
6. I read "дамаските" as the cover textures and used the description's own files. Correct?
