# Audit: `botanic-tv.js`, `ecwid-snippet.html`, `botanic-description.html`

Date: 2026-11-07. Scope: the files `tools/build-embed.mjs` generates into `dist/embed/`.
Companion documents: `TEST-MATRIX.md` (what was run, where) and `DEPLOYMENT.md` (the procedure).

**Evidence levels used throughout** (defined in `TEST-MATRIX.md`):
**E1** simulated Ecwid, **E2** real Ecwid DOM and runtime of the *public live* product 831592302 via local injection (read-only, nothing saved),
**E3** the real test product 876405767 (**not done**), **E4** real Safari on iPad and iPhone (**not done**).
Nothing in this document describes a simulation as a live Ecwid verification.

The live product was not published to, modified, or added to the shipped product list. The test product was not touched.

---

## 1. What the files are

| File | Purpose | Size | Depends on |
|---|---|---|---|
| `botanic-tv.js` | One self-starting script: styles, product data, engine, screens, start-up. | see `MANIFEST.txt` (about 193 KB) | Chillax font from `https://api.fontshare.com` (optional: the page works without it); media at `https://media.divinedunlop.com`; Ecwid's storefront API (`Ecwid.OnPageLoaded`) at run time. No library. |
| `ecwid-loader.js` | JavaScript that adds `botanic-tv.js` to the page. For a field that takes JavaScript. | under 1 KB | The hosted URL of `botanic-tv.js`. |
| `ecwid-snippet.html` | The same as one `<script src>` tag. For a field that takes HTML. | under 1 KB | The hosted URL. |
| `ecwid-snippet-sri.html` | Same tag with Subresource Integrity. **Optional**, see section 5. | under 1 KB | The hosted URL, a CORS header on it, and byte-exact serving. |
| `botanic-description.html` | The product description to put into the test product: the original Botanic description with the approved firmness figures. | about 142 KB | Nothing at run time. The engine reads it. |
| `test-page.html` | Offline page with a **simulated** Ecwid, for the automated tests. Not for deployment. | n/a | n/a |

### Loading order inside `botanic-tv.js`

1. `?ddtv=off` in the address: the script returns immediately and creates nothing (no engine, no font link, no host element).
2. Already loaded once: returns (guard `window.__ddtvEmbedLoaded`).
3. Adds the Chillax font link and a `<style id="ddtv-styles">` with all styles (the television copies them into its own shadow root).
4. Product data: `products/botanic.config.js`, then `products/botanic.zones.js` (the seven-zone drawing, picture only, no script).
5. Engine (`engine/ddtv-engine.js`), then screens (`engine/ddtv-scenes.js`).
6. Waits up to about 15 s for `Ecwid.OnPageLoaded`, then calls `DDTV.boot()`.

`boot()` subscribes to Ecwid's page-load event **and** reads the page already on screen (Ecwid's `…ProductPage-<id>` class, or a `#!/…/p/<id>` hash route), so a script that loads after the first announcement still starts.

### What the script does on a page

- On any page that is not product **876405767**: nothing is built, nothing hidden. (A `<style>` element and the font link are added, once; they match nothing on those pages.)
- On product 876405767: waits for `#bp-top` (the description), builds the television in a shadow root, places it (column or stacked), hides the long description and, in the column placement, the store's gallery, and mirrors the store's choices and price.
- It never moves, restyles, wraps or hides Ecwid's option blocks; the engine refuses to hide anything inside the options column or an option block.
- Classic View restores the original description; phones get Classic View.

---

## 2. Content completeness

| Check | Result | Evidence |
|---|---|---|
| Text of the supplied source equals the live page's description, **including text in collapsed accordions and hidden panels** | **Equal** except six lines that were deliberately changed (below): 441 text blocks in the source, 443 live; same 19 ids, 7 videos (same 7 files), 4 images, 32 SVG, 29 links, one 55 KB style block, 0 scripts. An earlier pass that compared only rendered text missed the collapsed accordions; this one reads every text node. | E2, `tests/live/compare-content.cjs`, read-only |
| Every sentence of the source appears on a monitor screen, or is listed in `notInTelevision` with a reason | **Yes** | E1, `tests/smoke.mjs` |
| 14 chapters, 35 screens, all render real content | **Yes** | E1 |
| Classic View has all 13 original sections in the original order, 7 videos, original numbering | **Yes** | E1 |
| All 11 registered media files are present in the source; no unregistered media | **Yes** (engine audit) | E1 |
| Seven-zone drawing taken from the front page, as a picture only | **Yes**, built with the HTML parser (an XML-imported node did not render inside the shadow root) | E1, screenshot |
| **Raw API length: 157,948 characters (API) vs 141,662 (source)** | **Not explained.** The rendered comparison above shows no missing visible content, no scripts and an equal style block, so the gap is not content the customer sees. The six firmness lines account for a few hundred characters at most. The cause (line endings, entities, wrappers, whitespace) cannot be told without the raw API string. | Open. `tools/compare-description.mjs` reports exactly where they differ; run it on the raw export (`DEPLOYMENT.md` step 1). |

Not touched by the engine: the order, wording and structure of the description. The firmness figures (the two figure lines, the two stone lines and the two sentences "When we say Medium from 49 kg to …" in the accordions) are the only change to it.

### Firmness (item 6 of the review)

- The description now shows **Medium 49 – 83 kg** and **Firm 83 – 114 kg** (the homepage specification). Soft (0 – 48 kg, "up to 7.5 st") and Extra Firm (115+ kg, "18+ st") are the original text.
- An earlier build also showed stone values for Medium and Firm that **I had computed** from the kilograms. They are numbers no approved source gave, so they are **removed**: those two cards show kilograms only. The screens handle a missing stone line.
- **Not resolved, needs the owner:**
  1. 83 kg belongs to both Medium and Firm on the homepage.
  2. The approved Firmness page was not available to me (no address reached); only the homepage was reconciled. If the Firmness page differs, the description must follow it.
  3. The live Ecwid options read: Up to 47 kg, 48–85 kg, 85–110 kg, Over 120 kg. That is a third set, and it leaves **110–120 kg without an option**. The engine maps by the option's words (SOFT, MEDIUM, FIRM, EXTRA FIRM), not by the numbers, so it works with any ranges, but the customer sees different numbers in the options and in the description. Changing the options is a store change and needs approval; **no price modifier or combination was touched**.

---

## 3. Defects found in the earlier build and what was done

| # | Defect | Fix | Verified |
|---|---|---|---|
| 1 | The only snippet carried `integrity` and `crossorigin="anonymous"`: with no CORS header on the host the browser silently refuses the script. | Default snippet has no SRI; SRI is a separate, optional file with two preconditions (section 5). | E1 (hash generated), not E3 |
| 2 | If Ecwid had announced the page before the script loaded, the television never started. | `boot()` also reads the page on screen. | E1 and **E2 (real)** |
| 3 | Every page-load event destroyed and rebuilt the television; a second `boot()` added a second handler; a pending wait could fire after leaving the page. | Idempotent start (`alive()`), generation token, cancelable wait, single-boot guard, stale-host cleanup. | E1 and **E2 (real events)** |
| 4 | `?ddtv=off` still injected styles and the font link. | The embed exits before creating anything. | E1 |
| 5 | A phone held sideways (window 844–932 px) got the television. | Phone = short side of the screen under 600 px, whatever the orientation. | E1 |
| 6 | iPad portrait: the left column is 399–443 px wide; chapter labels clipped, footer controls overlapped, sidebar left 259 px of content. Seen in the real DOM. | Stacked placement: full width above the store's product block when the column is under 700 px. | E1 and **E2 (10 sizes)** |
| 7 | Tap targets 32–40 px. | 44 px for every tap target of the shell on touch devices (`pointer: coarse`). | E1 (emulated touch) |
| 8 | The price mirror looked for a class that does not exist in the store, so the earlier price and the discount were never shown. | Real selectors (`…price-compare__container s`, `…price-discount`). | E1 and **E2** |
| 9 | The stand-in page used invented option titles and classes, collapsed to one column at 768 px (the real store does not), and had a hardcoded demo price. | Rebuilt from the real DOM: real classes, titles and option texts; price is the sum of the "(+£…)" amounts like the store; real geometry. | n/a |
| 10 | CSS: negative offsets, `!important`, window media queries and `vw` type sizes mixed with measured layout. | One system: container queries on the television's own width, type in container units, no negative offsets, `!important` only in two `prefers-reduced-motion` rules, spacing variables of the old alignment code removed. | E1, E2 |
| 11 | Derived stone values in customer copy. | Removed (section 2). | E1 |
| 12 | In the column placement the 90% minimum height pushed the unit below the options when the 'size' alignment was used. | The floor applies to the default placement only. | E1 and E2 |
| 13 | Two of my own tests checked Add to Bag before scrolling to it and reported "not reachable". They were wrong, not the product. | Fixed; checked again. | E1, E2 |

---

## 4. Product guard and repeated events (item 7)

- The engine starts only for ids in `productIds` of `products/botanic.config.js`: **`[876405767]`**. The live product 831592302 is deliberately not listed.
- Verified (E1): starts on 876405767; does not start on 111; does not start on 831592302; navigating away removes the television and restores the description (3 rounds); five repeated events keep one television and the same instance; a second load of the file adds no second engine; a re-rendered description rebuilds once; a mutation of the guard (widened) makes the guard tests fail, so they are real.
- Verified (E2, real events): product, then category (television removed), `history.back()` (one television), `openPage` of the same product (still one). Real Ecwid delivered `PRODUCT` then `CATEGORY`, and `PRODUCT` again on back.
- Hash navigation: the live store uses clean URLs (`/products/<slug>`, empty hash). The `#!/…/p/<id>` fallback exists for hash-routed stores and was tested **in simulation only**.
- **Not covered:** a re-render of the product page by Ecwid that fires no page-load event. The engine rebuilds only when told; it does not watch the page for a vanished host.

---

## 5. Subresource Integrity (item 10)

- `botanic-tv.js` has a SHA-384 hash in `MANIFEST.txt` and `ecwid-snippet-sri.html`.
- SRI with `crossorigin="anonymous"` needs **two things the build cannot guarantee**:
  1. the host answers with `Access-Control-Allow-Origin` (a plain file on shared hosting usually does not);
  2. the host serves the file **byte for byte** (no minifier, combiner or "optimizer" in between).
  If either fails the browser blocks the script **silently**: no television, and the only trace is a console message.
- Therefore the **default is the snippet without SRI**, with a cache-buster (`?v=<hash>`). SRI is optional and must be switched on only after the two commands in `DEPLOYMENT.md` step 4 pass.
- The hash changes on every build; a new upload needs the new snippet.
- The public store sends no Content-Security-Policy and already loads scripts from several hosts, so a hosted file is not blocked by a policy (E2). Not checked for the test product's pages (same store, so expected).

---

## 6. Actual Ecwid compatibility

**Confirmed against the real Ecwid DOM and runtime of the public live product (E2):**

- The class names the engine uses exist: `.product-details`, `.product-details__gallery`, `.product-details__sidebar`, `.details-product-option` blocks (`--SIZE`, `--Select-Mattress-Depth`, `--FIRMNESS-BY-BODY-WEIGHT`, `--COVERS`), `.details-product-option__title`, the price classes, the Add to Bag button, and `ecwid-productBrowser-ProductPage-<id>` on the page.
- Option titles: SIZE, Select Mattress Depth, FIRMNESS BY BODY WEIGHT, COVERS. Option texts include "(+£…)" modifiers and odd spacing ("H -24 cm (9.5”)"); all are recognised.
- Choosing inside the television sets the real `<select>`s and fires the events Ecwid listens to: the store's price and the monitor agree (store £140.40, was £156, Save 10% = monitor £140.40, £156, Save 10%).
- The store's options column is changed by Ecwid's own reaction to a valid choice, **identically with and without the television** (control run, `tests/live/column-diff.cjs`). The engine adds nothing to it.
- Add to Bag is present, enabled and not covered. **It was never clicked.**
- Ecwid's two-column product layout stays down to 744 px wide; at iPad sizes the engine places correctly (10 sizes, section TEST-MATRIX).
- The page errors seen on the live page (`Uncaught (in promise) #<Object>`, `Timeout exceeded (250 ms)`) occur with no injection at all; the engine adds none.
- A late-registered `OnPageLoaded` handler received a `PRODUCT` event in one run (observed, cause not established); the engine does not depend on it.

**Assumptions not confirmed (need E3):**

1. The test product has the same four options with the same titles; the engine matches by words (`size`, `depth|height`, `firmness`, `cover`) not by position.
2. The test product's description keeps `<style>` and the ids when pasted (the live product proves Ecwid keeps them for that markup).
3. Where, and in what form, the store accepts custom JavaScript, and whether it accepts a script tag in a description. The loader works wherever a script may run; I could not see the admin.
4. The disabled test product renders with the same classes as the public one.
5. Whether Add to Bag works with the choices made through the television: the mechanism (setting the real dropdown and firing the events) is the same one that produced the correct price in E2, but the real Add to Bag action was never run.

**Not verified at all (E4):** Safari on iPadOS and iOS (touch feel, momentum scrolling inside the monitor, muted-loop autoplay, full-video playback, rotation); video and cover-photo loading from `media.divinedunlop.com` (blocked from the sandbox).

---

## 7. Layout decision that needs the owner (item 4)

Two instructions conflict:

- **Earlier (annotated screenshot):** raise the monitor to the top of the left column so it covers the space above the options.
- **This review (item 4):** align the top navigation with the native SIZE control.

Both are built, selected by one line in `products/botanic.config.js`: `layout.placement: 'top'` (default, the earlier decision) or `'size'`.

On the real DOM at 1440×900: `'size'` puts the top row of chapter buttons at 706 px, level with SIZE (706 px), and ends the unit at 1387 px, level with the end of the options column; there is a roughly 300 px empty band above it on the left (the store's gallery is replaced by the television). `'top'` starts at the column top and ends at 1225 px. Screenshots of both are in the delivery.

`'size'` applies only in the column placement. In the stacked placement (iPad portrait and some landscape sizes) there is no column to align with.
