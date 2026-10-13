# Home Discovery 0.2.0: visual polish (preview; 0.1.0 is what is currently installed)

Visual pass only. Structure, product data (Collection 3.13.2 @ f4d9318), links, routes, preview behaviour, no-JS fallback, accessibility model, Hero: unchanged. Static section markup is identical to 0.1.0 (17,006 characters; only the pinned URLs differ).

## What changed visually
- **Surfaces:** cards, the need-guidance box and the preview panel are deep blue-graphite gradients (`#1e3548` to `#17293a`, never black) with a light "stage" behind each product picture, hairline ice borders, layered shadows. The mint/ice Hero seam above and the `#f9f9f9` exit below are unchanged.
- **Type:** snow `#f5fafc` for names and key copy, ice-blue `#cfe4ef` for descriptions, sky `#a5d3e6` for small labels; on the light mint area ink `#12283a` with a blue accent `#245f8a`. Green text is gone (the old teal accent became blue); mint `#9fe6d8` is only a small accent (match tag, hairline, glow, link underline).
- **Buttons:** "Compare & details" is a ghost button (ice hairline, soft fill, mint glow on hover); open state and the one primary action ("View ... & buy") use an ice gradient with navy type; chips and the active tab are blue-graphite gradients. No black blocks.
- **Dual Plush:** the preview shows one of the Collection 3.13.2 SVGs per approved combination (`dual-plush-s-m`, `m-f`, `f-x`: Botanic Dual Plush 3, Bio Comfort Dual Plush 2), with the Collection's captions ("Soft topper, above / Medium mattress, below") under the approved explanation. The previous mini-icon list is not repeated for these models.

## Verification (real homepage, new build injected in the live Ecwid tile wrapper, live 0.1.0 files blocked)
131 functional checks pass (109 existing + 22 new: SVG per combination, source URL = Collection asset, order, alt text, loaded, no second list, no green text, no pure-black surfaces); also against the pinned jsDelivr build. axe-core 0 violations in 8 state/size combinations (contrast on the dark surfaces included). Layout shift at script start 0 (desktop, iPad portrait, phone). 18 asset URLs (images, fonts, 3 SVGs) return 200. jsDelivr serves CSS/JS byte-identical to the build.

# Home Discovery 0.1.0: report (installed on the live site by the owner on 2026-10-13)

## Source map (verified 2026-10-13)
| Item | Finding |
|---|---|
| Product data | Collection **3.13.2**, `divine-collection/src/data.mjs` + `src/nav.mjs` at commit `f4d9318` (branch `claude/divine-collection`). Rebuilding the collection from that commit reproduces its committed descriptions, CSS and loader byte for byte; jsDelivr serves `ddc.js`/`ddc.css` identical to the repo. |
| Topper data | Same release, `collections.topper` (3 models). No separate topper version exists; text unchanged since 3.7.0. |
| Hero live | **1.20.2** @ `f727e88` (`hero.js`/`hero.css` byte-identical to the repo) + **BioDunlop intro 0.4.0-dev** @ `5560784` (labelled "development candidate, NOT for production" in its own code). Both untouched. |
| Collection live | Loader 3.13.2 @ `f4d9318` site-wide; both category descriptions carry the 3.13.2 markup. |
| Homepage order (Ecwid state) | Hero tile "HEADER Code" → *Cover & Headline (hidden)* → *Navigation & Custom Code (hidden, to be replaced)* → "Latex Mattress Benefits" (dark animated image band, then `#f9f9f9` row) → navy video section. |

## Decisions applied (from the owner)
Old navigator = replaced, used only as visual context. Bio Comfort URL = `/bio-comfort-100-organic-latex-mattress-innovation-cloud-comfort` (the `/latest-design-…` URL is blocked by a build guard). Bio Comfort Dual Plush depths 25 cm (20+5) and 28 cm (20+8) (asserted by a test). Hero unchanged. No H1 (h2 / h3 / h4 only; asserted).

## Customer journey
1. **Switch**: Latex mattresses (8) | Latex toppers (3). 2. **"What matters most to you?"**: the six approved routes; choosing one highlights the matching models with "Matches your need", shows the approved need and answer text with real links, dims (never hides) the rest; "All 8 models" / "Show all models" resets. 3. **Cards**: picture, family label, name (a real link), function line, "Compare & details". 4. **One inline preview** under the card's row: picture, what it is, who it suits, how it is built, firmness (Dual Plush: topper-over-mattress combinations, layer and side splits), depths, "How it differs" (links jump between models), the approved "what Dual Plush means" note, and "View <model> & buy". 5. Link to the full Collection Page in each view.
Toppers have no approved need routes, so none were invented. Hotel Line belongs to no route (as in 3.13.2) and is always reachable via "All 8 models".

## Responsive behaviour (measured in situ on the live page)
4 × 2 mattresses at 1440, 1366, 1280 and 1180 px (tighter type from 1059 px down); 2 × 4 on iPad portrait (820 px); one compact picture-left row per model on phones (390 px). Toppers: 3 across, one wide row each below 900 px. Preview: inline at every size (no modal, no scroll lock, no stacking-context problems with Ecwid's header); the pointer notch tracks the chosen card and recomputes on resize/rotation.

## Joining the mint homepage
The section starts at the Hero's own seam colour `#d6f3fb` (`--ddh-seam-bottom`), fades to the benefits row's `#f9f9f9`, then meets the dark image band with the same hard cut that band always had. Chillax 400/600 (the files the Hero loads), Comfortaa fallback, 9 px buttons with the Hero's graphite hover, teal `#006b73` / ink `#0b3b45`. Firmness colours are the approved collection ones, parsed from its `build.mjs`.

## Ecwid architecture: one section, and why
Measured: 17.0k characters (embed) + 4 KB gzip CSS + 8 KB gzip JS, in one custom-code section; no zero-height seams, no repeated headings, no iframe. The documented truncation in this project is ~20.1–21.9k characters, so there is ~3k margin. If the editor ever truncates it, only the trailing bootstrap script is lost and the section remains a complete static page. A two-section split was not needed and would add a seam risk.

## Findings about the live site (for the owner)
- Ecwid's storefront CSS sets `opacity:.5` on bare anchors: every anchor/button of this tool forces `opacity:1`.
- Ecwid's CSS inflates `p/span` line-height and is id-prefixed: the build adds `!important` to every declaration, with zero-specificity `:where()` resets so components still override them.
- The homepage has two H1s (the Hero's screen-reader H1 and the video tile's title). Not changed here.
- No JSON-LD was found in the initial HTML of the homepage or product pages; this tool adds none (avoids duplicate Product markup). Revisit after checking the rendered DOM.
- GA4 `G-TMGW71XT02`, GTM `GTM-TWQ3G549`, Clarity are present. This tool sends nothing; it fires `ddhd:*` DOM events so GTM can listen later.
- The Instant Site script error `Cannot set properties of undefined (setting 'OnPageLoaded')` occurs on the live page before and after injection; it is not from this tool, the Hero or the Collection.

## Verification (all run against the real homepage, section injected in situ)
- **109 functional checks pass** (`tests/interaction.mjs`), also against the pinned jsDelivr build: all 11 names/links/image sizes equal the approved data; one preview at a time; Escape/outside/keyboard/touch; rotation; need state kept across view switches; five simulated Ecwid re-renders give one listener set; reduced motion; no-JS (all 11 models and 11 links visible).
- **axe-core: 0 violations** (WCAG 2.0–2.2 A/AA + best practice) in default, need, preview-open and topper states, desktop and phone.
- **Layout shift at script start: 0** on desktop, iPad portrait, phone. Tap targets ≥ 44 px, no card text < 14 px.
- jsDelivr serves `dhd.css`/`dhd.js` byte-identical to the build at the pinned commit; all 15 asset URLs return 200.

## Not verified / limits
- Real-device Safari/iPad hover-vs-touch behaviour (tested with emulated touch in Chromium only).
- Google's rendering of the new section (it is static HTML in the Ecwid field, like the Hero's, but this must be re-checked with `curl` and URL Inspection after installation; the tile is hidden today so I could not confirm server-side inclusion of this tile's HTML).
- Conflict resolved by decision, not by data: the retired `/latest-design-…` page is still live (200, own canonical); consider a redirect later.
- Source of the Collection could not change under us: `DHD_SOURCE_REF` is pinned. A future Collection release means bumping that ref deliberately.
