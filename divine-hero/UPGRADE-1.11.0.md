# Divine DunlopDreams Hero 1.11.0: model selector and global size guide

An upgrade of the approved 1.10.9 hero, not a redesign. The photo, the LATEX lockup, the copy, the hotspots, the night mode, the
Bio Comfort screen, both Shop buttons and the one-section Ecwid embed are unchanged. What is new lives in the hover panels that
the Shop buttons already opened, plus one quiet trigger beside the buttons.

## 1. What changed

| Area | 1.10.9 | 1.11.0 |
|---|---|---|
| Shop Mattress / Shop Topper panels | 8 / 3 cards, every card linked to the collection | **Model selector**: a compact list (about 38% of the width) beside **one large preview** (about 62%). Every model links **straight to its product page**; "View the collection" stays once per panel |
| Card content | name, tag, heights, firmness | list row: thumbnail, name, positioning line, 2 benefits, arrow. Preview: large picture, tag, name, sub-line, explanation, 3 benefits, heights and firmness (Botanic Dual Plush pairings table, Partners Her/Him badges and Bio Support Dual layers kept), **View model** |
| Prices | the topper covers showed "Cashmere +£77" | **no prices anywhere** (the build refuses to publish a price in the panels) |
| Sizes | "All UK & EU Sizes" hotspot (unchanged) | plus one **global size guide**: a small "All UK & EU Sizes" pill beside the Shop buttons opens all 22 sizes + Custom (2 columns on computers, 1 on phones, no prices) |
| Bio Comfort point | hover opens (1.10.7) | unchanged |
| Site header | not connected | **optional bridge**: pointing at (or tabbing to) the header's own "Mattresses" / "Toppers" opens the same selector under the header; their click is untouched |

### Behaviour

- **Computer with a mouse.** Pointing at a Shop button opens its selector after 140 ms. Pointing at a model shows its preview after 90 ms, so crossing the list does not flicker. A click on a model goes to that product, and a click on the Shop button still goes to the collection. Leaving everything closes the panel after 280 ms and the hero is back to its first state.
- **Keyboard.** Focusing a Shop button (Tab) opens its selector. The next Tab goes into the model list, and focusing a model shows its preview. Enter opens the product. Tab past the last link leads back out next to the button. Escape closes the panel and returns focus to the button without reopening it.
- **Tablet / touch.** The first tap on a Shop button opens the selector full screen, with the preview on top and the list below. The first tap on a model shows its preview and scrolls it into view. A second tap, or the preview's View model button, opens the product.
- **Phone.** The selectors stay off, as decided for 1.10.1: phone pages stay light and the Shop buttons go straight to the collections. The size guide works on phones as a bottom sheet with one column that scrolls.
- **Size guide.** It opens on hover and closes when the pointer leaves. A click or tap pins it open. Escape, a click outside or focus moving away closes it, and focus returns to the trigger. It never covers the Shop buttons (this is tested).
- **Header bridge.** It works only with a real mouse on a computer, and only while the hero is on screen. Opened from the header, the mattress panel sits **under** the header so the header link stays clickable. Opened from the hero button, it still rises over the header as approved in 1.10.8. Nothing in the header is changed (no attributes, no listeners on its elements: one passive listener on the document reads the pointer). If Ecwid renames or re-renders the links, the bridge simply does nothing.

## 2. Files touched

| File | Change |
|---|---|
| `src/models.json` | **new**: the 11 models (data structure, §4) |
| `src/sizes.json` | **new**: the size guide (data structure, §5) |
| `src/sheets.html` | mattress and topper panels restructured into list + previews (the old cards' pictures and specs moved into the previews); `+£77` removed; `<!--MODELS:…-->` / `<!--SIZES-->` placeholders |
| `src/sheets-i18n/*.txt` | 58 new keys × 8 languages (positioning lines, explanations, benefits, size guide, "View model") |
| `src/section.html` | one hidden `<button class="ddh__sz">` in the Shop row (shown only once the JS runs) |
| `src/i18n/*.json` | `sz` (the trigger's label) in 8 languages |
| `src/hero.js` | model previews, keyboard flow, size guide, header bridge (all inside the existing hero closure, no globals) |
| `src/hero.css` | one appended 1.11.0 block, all under `.ddh` |
| `tests/build.mjs` | generates the list rows and the size guide from the JSON; checks every model has one preview linking to the same URL; refuses prices; refuses one key carrying two English texts |
| `tests/interaction.mjs`, `tests/guards.mjs` | new tests (§8) |

## 3. Explanation of the design choices

- **Master-detail inside the existing panels** rather than a new layer. The panels already opened from the buttons and closed by themselves, so nothing new pops up. The list is quiet (one line of purpose, two benefits), the preview carries the detail, and only one preview is shown at a time.
- **The list is a list of links.** It works without JS, search engines follow it, and Ctrl/⌘-click opens a new tab. The preview is an extra.
- **Copy** is calm and factual and does not overclaim. There is no seven-zone claim for Hotel Line or Ambient, and no fixed firmness per side for Partners. The positioning lines follow the brief.
- **Fit.** The panels never scroll on computers. The selector adapts to the **panel's own height** (container queries from 1.10.7). On low panels the list's benefit line and the topper's large picture step aside first.

## 4. Product data structure (`src/models.json`)

```json
{
  "collections": { "mattress": "…/latex-mattresses-collection", "topper": "…/latex-toppers-collection", "pillows": "…/latex-pillows" },
  "models": [
    {
      "id": "botanic", "group": "mattress", "row": "core",
      "name": "Botanic", "nameKey": "(optional, when the name is translated)",
      "url": "https://divinedunlop.com/products/botanic-100-organic-latex-mattress-dunlop-technology-831592302",
      "image": { "src": "assets/m-botanic.webp", "width": 560, "height": 207 },
      "positioning": { "key": "p_botanic", "en": "Original Dunlop latex, clean natural support" },
      "benefits": [ { "key": "b1_botanic", "en": "100% organic Dunlop latex" }, { "key": "b2_botanic", "en": "Seven comfort zones" }, { "key": "b3_botanic", "en": "Four firmness options" } ],
      "explanation": { "key": "x_botanic", "en": "Our original 100% organic Dunlop latex mattress: …" },
      "claimNote": "(optional) why a claim is or is not made"
    }
  ]
}
```

Order: Botanic, Botanic Dual Plush, Bio Comfort, Bio Comfort Dual Plush (`row: core`), Orthopaedic Coconut Coir, Mattress for
Partners, Ambient, Hotel Line (`row: purpose`); toppers Bio Support, Bio Support Dual, Partners Topper. **No Ambient Topper.**
To add or edit a model: edit `models.json` and its preview in `sheets.html` (the build checks they agree), and add the keys to
the 8 language files (the build fails on a missing key).

## 5. Size guide data structure (`src/sizes.json`)

```json
{ "sizes": [ { "name": "Small Single", "cm": [75, 190], "in": ["29.5", "74.8"] } ], "custom": { "key": "sz_custom" }, "contactUrl": null }
```

All 22 sizes from the brief, in its order. The build checked every inch value against cm ÷ 2.54. Size names stay in UK English in
every language, because they are the store's size names. The heading, sub-line, "Custom size", "Contact us" and the note are
translated. `contactUrl` is `null`, so "Contact us" is plain text (see §9). Set it to a URL and it becomes a link.

## 6. Performance impact (measured, 1.10.9 → 1.11.0)

| File | raw | gzip |
|---|---|---|
| hero.css | 67.8 → 81.9 KB | **+2.6 KB** |
| hero.js | 19.5 → 24.8 KB | **+1.3 KB** |
| sheets/en.html (stage 2, after load) | 16.5 → 32.1 KB | **+2.0 KB** |
| pasted section | 8,912 → 9,091 characters | +179 |
| images | none new | 0 |

- **No new images and no duplicates.** The list thumbnails and the large previews are the same WebP files, so a preview is already cached when it opens.
- **Hidden previews are never loaded eagerly** (this is tested). Only the first preview and the thumbnails load in stage 2, as the cards did before.
- **First paint is unchanged.** The panels still arrive only after page load (stage 2). Lab LCP 356–824 ms, CLS 0 / 0.024–0.032 as before, long tasks ≤ 40 ms. Phone transfer +5 KB (text only).

## 7. Accessibility

- **Links and states:** list rows and View model are real links. `aria-current="true"` marks the previewed model. `aria-expanded` and `aria-controls` are set on the Shop buttons and on the size trigger. The size guide is `role="dialog"` with `aria-modal="false"` and a heading label.
- **Focus:** keyboard flow as in §1. Focus is visible on every element and nothing traps focus except the existing full-screen (touch) dialog.
- **Not hover-only:** everything reachable by hover is also reachable by focus and by tap. Escape always closes.
- **Reduced motion and forced colours:** reduced motion turns the transitions off and makes the scroll-into-view instant. Forced colours outline the previewed row and the size guide.
- **axe-core:** 0 violations on the hero and on every panel, at 1440×900 and 390×844.

## 8. Tests (all green)

Interaction 370/370 (366 on the bare harnesses), panels 792, guards (incl. the language-structure guard), axe 0, perf.

New checks:
- 11 rows and previews link to the exact product URLs.
- One preview at a time, and hover shows the right one.
- No prices anywhere.
- Keyboard: focus opens the selector, Tab enters the list, focusing a row changes the preview, Escape returns to the button.
- Mouse click on a row opens the product.
- iPad: the first tap on a row previews it, the second opens the product.
- Size guide: hover opens, leaving closes, a click pins it, Escape returns focus, it does not cover the Shop buttons. Phone: bottom sheet, one column, tap outside closes it.
- Header bridge: hovering "Mattresses" opens the selector under the header, the link stays clickable, and the selector closes on leaving.

Fit: every model's preview and every row, in en/de/fr/fi/el, at 1280×720, 1366×768, 1440×900, 1536×864 and 1920×1080. Nothing overflows and nothing scrolls.

## 9. URLs to verify by hand

The sandbox cannot reach divinedunlop.com, so none of these were opened from here. They are exactly as supplied:

- **All 11 product URLs** in `src/models.json`. One click each on the live site. Pay attention to:
  - Botanic, whose URL ends in `-831592302`.
  - "Partners Mattress Collection", which points to a product URL.
- **Contact link for the size guide:** none known. "Contact us" is plain text until a URL is set in `src/sizes.json` → `contactUrl`.
- **Header bridge on the live header:** it matches the link text "Mattresses" / "Toppers" or an href containing the collection slugs. If the live header labels differ, it does nothing (safe).

## 10. Recommended Ecwid embed

Keep the 1.10.x approach: **one Embed & Custom Code section** (9,091 characters, well under the ~20k paste limit) loading
`hero.css`, `hero.js` and, after load, `sheets/<lang>.html` from the pinned jsDelivr commit (later from
`assets.divinedunlop.com`, see INSTALL.md). Nothing is added to the site outside the section; all CSS is under `.ddh`; the JS
lives in one closure and cleans up after itself (`DDHero.destroy()`); with JS blocked, the Shop buttons are plain links to the
collections and the size trigger stays hidden.

## Mock-up / prototype

The working prototype is the release itself. `reports/compare/1.11.0-*.png` shows:

| Screenshot | State |
|---|---|
| `closed` | the hero at rest, with the quiet size pill beside the buttons |
| `mattress-open` | Shop Mattress hovered: list + Botanic preview |
| `mattress-hover` | pointing at Bio Comfort Dual Plush in the list |
| `botanic-dp` | the three pairings table in the preview |
| `topper-open` | toppers with the Bio Support Dual layers |
| `sizes` | the global size guide |
| `tablet` | full-screen selector, preview first |
| `phone-sizes` | the size guide as a bottom sheet on a phone |
