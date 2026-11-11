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

## Direction D prototype: turquoise graphite instead of green (preview only)

`preview/graphite-turquoise.html` = direction C plus `src/description-turquoise.css`. Built from the same page; the configurator and tests are unchanged.

- **Why:** the green petrol `#2F565A` and the green leaf read as military and slightly dull. Turquoise graphite keeps the dark, premium weight of the bands but sits in the blue-cyan family (hue about 190°, not 186° green-teal).
- **Dark bands:** turquoise graphite gradient `#173842 → #12303A`, one hairline glint on top (`rgba(80,205,253,.38)`), one soft cyan light in the corner. No sparkle, no shine animation.
- **Primary button and links:** `#1B6676` (white text, 6.5:1). Outline buttons use the same hue.
- **Leaf:** turquoise gradient `#9FE8FA → #3FB8D6`. It is no longer green anywhere in the description.
- **Sky `#50CDFD`:** the glint on dark only (zone numbers, closing button, accordion markers); never text on light.

**Decision for the owner:** the owner's four colours are kept as base and ink (`#272D32`, `#3E474D`, `#1E3036`). The petrol `#2F565A` is the one colour replaced in D, because it is the green-leaning one. Keep it if the green-teal is wanted after all.

**Fixes made while checking the shots (both C and D):** the button labels had an inline white colour that made the outline button look empty; the video caption was too faint on the dark frame; the text inside the seven-zone band (headings and the opened "How each zone works" accordion) was dark on dark.

Contrast (`data/description-turquoise-contrast.json`): every text pair used on the page passes AA, the lowest at 5.45:1 (captions on the mist ground). The rejected pair (Sky as text on light) stays at 1.69:1 and is recorded.

Layout: no horizontal overflow at 360, 390 or 430 px for either C or D. `tools/graphite-full-test.mjs`: 62 of 62.

Evidence: `shots/description-colours/compare-c-d.jpg` (C and D side by side), `hero-c-d.jpg`, `turquoise/`, `light/`.

## Direction E: turquoise graphite gradient, white text (preview only)

`preview/graphite-gradient.html` = the turquoise layer (D) plus `src/description-gradient.css`. This is the working direction now.

- **Text:** pure `#FFFFFF` everywhere in the description, no grey shades. Verified in Chromium: 464 of 464 text elements compute to `rgb(255, 255, 255)`.
- **Ground:** one long gradient from turquoise graphite `#1A5F6E` (top) through `#163F4B` and `#0F2A33` to deep graphite `#0A1E24` (bottom). Text sits on a dark ground in every section.
- **Seven zones:** the gradient the owner singled out, `#173842 → #12303A` with a corner turquoise glint, kept as is.
- **Proof row and closing band:** the deepest graphite, to hold the white text firmly.
- **Lines and accents:** turquoise `#50CDFD` as hairlines, edges, glints and the marker glyphs only; never as text.
- **Leaf:** turquoise, the only ornament. No green anywhere.
- **Hero:** no card around the video; the frame keeps a turquoise edge.
- **Buttons:** turquoise graphite fill `#1B6676 → #163F4B` with white text (6.5:1 at the lightest point); outline in white.

Contrast (`data/description-gradient-contrast.json`): white on every background stop is at least 6.54:1; most stops are above 11:1.

Trade-off: white text needs a dark ground, so the light sections of C and D are retired in this version. C and D stay in the record for comparison.

Layout: no horizontal overflow at 360, 390 or 430 px. `tools/graphite-full-test.mjs`: 62 of 62.

Evidence: `shots/description-colours/compare-d-e.jpg` (D and E side by side), `gradient/` (E slices).

## Direction H (hybrid): light ground, turquoise video card (preview only)

`preview/graphite-hybrid.html` = the clean light ground (C) plus the turquoise layer (D) plus `src/description-hybrid.css`. This follows the owner's latest choice: the first, white-ground concept for the facts (the tiles "100 % Organic Dunlop Latex", "Custom Made to Order" and the rest stay white), and the video card itself in turquoise graphite.

- **Video card:** gradient `#1B6676 → #163F4B → #0A1E24`, a turquoise hairline edge and a soft shadow. The frame inside is a deeper inset. Text on the card is pure white; the buttons are a turquoise fill with white text and a white outline.
- **Facts on the light ground:** unchanged from C, dark text (`#272D32`, `#3E474D`) on white tiles. White text is used only on dark surfaces.
- **Dark bands:** the seven zones, the proof row and the closing call to action keep their turquoise graphite gradients from D.

**Interpretation to confirm.** The earlier request was white text in both colour versions. A white ground cannot carry white text, so on the light sections the text stays dark, and white is used on every dark surface (the video card, the zone band, the proof row, the closing band). If you want white text everywhere, the light ground has to go, which is direction E.

Contrast: white on the card and the bands is above 6.5:1 at every stop (the lightest is the card's `#1B6676` top at 6.54:1, measured in `data/description-gradient-contrast.json`). Dark text on the white tiles is above 12:1.

Layout: no horizontal overflow at 360, 390 or 430 px. `tools/graphite-full-test.mjs`: 62 of 62.

Evidence: `shots/description-colours/compare-c-hybrid.jpg` (C and H side by side), `hybrid/` (H slices).

## Decision: description direction H (owner approved, preview only)

The owner chose H: the clean light ground for the facts (the white tiles, dark text), the video card in turquoise graphite with white text, and the three turquoise graphite bands (seven zones, proof, closing call to action). The owner also confirmed that legibility and contrast are the priority.

Not yet decided, and not changed: the configurator steps (Size, Firmness, Depth, Cover) still use the Graphite Blue panel; whether they move to the turquoise family, whether H is merged into `graphite.html`, and the open wording questions in the earlier sections. None of these is deployed; the live store is untouched.
