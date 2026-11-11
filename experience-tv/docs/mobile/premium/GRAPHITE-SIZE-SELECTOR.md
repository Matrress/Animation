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

---

# Refinements (second round, approved by the owner)

Applied to `docs/mobile/premium/preview/graphite.html` first. Preview only; nothing is deployed, the live Ecwid store and the test product 876405767 are untouched. The three-concept preview (`index.html`) keeps its earlier content; its zone block is unchanged.

## 1. Extra Firm and Orthopaedic Coconut Core
- All four levels stay visible. Under **Extra Firm**, a quiet label: `Specialist Model: Orthopaedic Coconut Core`. Soft, Medium and Firm are unchanged buttons.
- Extra Firm is a **plain link** (`<a href>`), followed only when the customer taps it (or presses Enter): the weight and height sliders can show Extra Firm as the guided result, fade the other three and say that choosing it opens the specialist model, but **never navigate** (tested with a real drag through the range). The panel writes nothing to Ecwid when it routes.
- The URL, **verified on the public site before use** (`tests/live/specialist-url-check.cjs`, `docs/mobile/premium/data/specialist-url-check.json`): `https://divinedunlop.com/products/orthopaedic-coconut-coirs-100-organic-latex` answers 200 with no redirect, its canonical is the same address, it is indexable, and Ecwid reports a PRODUCT page (id 644846882) with options and Add to Bag. It is the address the published Firmness Navigator and the site's home page use. Note: the page's own name is "Orthopaedic Coconut **Coirs**"; the label uses your wording ("Core").
- The URL and label are data in the build (`DDDATA.specialist`), not hard-coded in the panel.
- **To note**: the native Ecwid Firmness menu of BOTANIC still lists Extra Firm (+£88). The panel routes away; the native menu does not. Changing that is an Ecwid Admin edit and was not made.

## 2. Review Your Order
Heading `Review Your Order`, every word capitalised, **Order** heavier (500 against 700), Chillax kept. The cover-step button reads `Review Your Order` with **Order** bold to match; "Continue to **Depth**" is unchanged for Soft, Medium and Firm.

## 3. Seven-zone construction
The seven-zone illustration is the one already reused by the television (`products/botanic.zones.js`, from the front page's "Seven Zones 2.7.0"): the mattress and body paths are **unchanged, path for path** (checked against the original). Changes: a static tone per zone, the numbers Z1 to Z7 on the mattress, a dark Graphite card behind it, and a legend made of the seven approved zone names and notes.
- Tones come from the approved zone texts and say nothing about firmness (the text states the latex firmness is consistent and perforation differs): **softer response** Z2, Z6, Z7 (softer perforation, softer response, soft landing); **reinforced** Z4; **calibrated** Z1, Z3, Z5.
- Stationary: no SMIL, no CSS animation, no transition, no script; two captures 1.5 s apart are pixel-identical. 127 nodes, 12 KB, nothing external. The earlier teal of the illustration was recoloured to the Graphite family (the paths were not touched).

## Tests
`tools/graphite-full-test.mjs`: **62 checks pass** (`docs/mobile/premium/data/graphite-full-test.json`): the full flow, the button and heading typography, the four cards and their types, Extra Firm routing by tap and by keyboard, no navigation from the sliders or a drag, the native option left unset, zone geometry, tones, legend, stillness, weight, three widths without overflow, every step on one screen at 390×844, 390×700 and 360×640, and Size and Depth screens identical byte for byte to the previously approved preview. `tools/graphite-firmness-shots.mjs` (fade behaviour) also passes.

## Not verified
Real phones; the redirect on a real device; the test product; the real cover textures. The cover-tile redesign (`graphite-cover-proposal.html`) is still a separate proposal, not merged.

## Third round: firmness typography and description colours (preview only)

**Firmness step (typography only, nothing functional changed).** Top line `Dunlop **Firmness Regulations**` (light, with the bold part in Sky `#50CDFD`, not uppercase); title `Choose **Your Firmness**`; bold `Body Weight` and `Height` with their values; bold card names; the header leaf beside the price on this step only; button `Continue to **Depth**`. Every step still fits one screen at 390×844, 390×700 and 360×640 (the brand line is kept on one row at every height).

**Description colours (`src/description-dark.css`, injected only into `graphite.html`, after `content.css`).** The owner's four colours are used exactly: `#272D32` base, `#3E474D` second level (cards, tiles, accordions), `#1E3036` depth (hero media, seven-zone block, proof row, notices, call to action), `#2F565A` petrol accent (edges, the "Who is this mattress for" pill, mark fills). The description is not painted 100 % in those four: accents are blue-led — Sky `#50CDFD` (key words, zone numbers, kickers, links, "+" markers, the primary button), Mist `#C3D5ED` (legends, hover) and Steel `#8CA2C2` (quiet lines). Green is not a surface or a text colour; it appears only on the leaf ornament (the header leaf: `border-radius:100% 0`, gradient `#9bd26b → #63b963`, rotated −28°) in front of each section heading, plus a faint blue leaf watermark in the seven-zone block. Content, structure, the configurator cards and the other previews (`index.html`) are unchanged.

Contrast (WCAG 2.x, `data/description-contrast.json`): all 15 text/background pairs reach AA (lowest 4.84:1). Two pairs were lifted after the first check (quiet text on cards `#9AA8B4 → #B8C4CE`, Sky marks on petrol `#50CDFD → #8BE0FF`).

Evidence: `shots/description-colours/before-after.jpg`, `before/`, `after/`, `palette.png`; `preview/description-palette.html`; `tools/description-shots.mjs`. `tools/graphite-full-test.mjs`: 62 of 62 checks pass. Nothing is deployed; this is E1/E2-level preview evidence only (a stand-in page, no live device).

## Direction C prototype: clean light, earned dark (preview only)

`preview/graphite-light.html` is the same page with only the description colour layer swapped (`src/description-light.css`). The configurator, the firmness step and all tests are identical to `graphite.html`.

- **Ground:** cool mist `#F2F7F9` (not pure white), white cards with `#D3E0E5` hairlines.
- **Ink:** `#272D32` headings, `#3E474D` body, `#5B666E` captions.
- **Petrol `#2F565A`:** links, marks, the primary button (white text) and the outline button.
- **Depth `#1E3036`:** three earned dark bands only: the seven zones, the proof row and the closing call to action.
- **Sky `#50CDFD`:** never text on light (about 1.7:1). On light it is only a hairline; on the dark bands it marks the zone numbers and the closing button.
- **Leaf:** the only green in the description.

Contrast (`data/description-light-contrast.json`): every text pair used on the page reaches AA, the lowest at 5.45:1. The rejected pair, Sky as text on light, is recorded at 1.69:1 so the rule is visible.

Layout: no horizontal overflow at 360, 390 or 430 px. `tools/graphite-full-test.mjs` still passes 62 of 62.

Evidence: `shots/description-colours/compare-three.jpg` (original light, dark B, clean light C, side by side), `light/` (C slices), `before/`, `after/`.
