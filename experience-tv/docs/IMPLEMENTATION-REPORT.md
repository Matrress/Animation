# Divine Product TV + Ecwid native gallery: consolidated implementation report

*This report covers the gallery and restoration phase. The reusable multi-model architecture that followed is in `docs/ARCHITECTURE-MULTI-MODEL.md`.*

Date: 2026-11-10. Build: `dist/embed/botanic-tv.js`, sha256 `72911e6e15bf3da29fd94c865c02bed990e2b035c93f95b08bfb99b7655e0c87`.
Branch `claude/funny-johnson-b4mod7`, draft PR #9. **Nothing has been deployed. Nothing was changed on the live storefront. Approval to deploy is NOT requested by this report: see section 10, the release blockers.**

The permanent requirements this report answers are in `docs/GALLERY-ARCHITECTURE.md`, section 0. The final rule: *Ecwid owns the product images, the native gallery and the commerce functionality. Divine Product TV owns the optimised interactive presentation. Both modes coexist, share the same underlying product data and switch reversibly without losing the native gallery or the customer configuration.*

---

## 1. What was already implemented before this brief

Audited in the code and re-run; kept, not rebuilt.

- *View Model Gallery* button in the television's header; gallery with left/right arrows, touch swipe, counter, Close/Back to presentation, Escape and keyboard, on-demand sizes and neighbour preload, original proportions, repeated opening and closing without a reload (`engine/ddtv-gallery.js`/`.css`).
- Video handling: opening the gallery stops what plays behind it, closing resumes the active screen's loops.
- Chillax typography (Fontshare, with a Helvetica Neue fallback); phones always get the standard Ecwid view.
- Scoped isolation of the native gallery (one attribute, one rule) with recovery when Ecwid re-renders, a fail-safe and a render watchdog; the image adapter with an optional manifest, stale/unlisted reporting and `tools/media-manifest.mjs`.
- Test suites reported at the start of this brief: gallery 123/123, embed 175/175, smoke 104/104, real-page 39/39. I re-ran them; they passed.

## 2. What was changed in this implementation

| Change | Where |
|---|---|
| **Automatic image source**: the storefront's own product records (1500 px files, alt, order, main flag), fetched once when the visitor reaches for the gallery, verified against the page, fail-safe. | `engine/ddtv-gallery.js` |
| **iPad portrait: the unused left column is gone.** While stacked and showing, the product block carries one attribute and the store's sidebar and description take the single column the store itself uses on small screens. | `engine/ddtv-engine.js` (`NativeGallery`), `products/botanic.config.js` (`layout.stacked`) |
| **Bug fixed**: a photo finishing loading after the gallery was closed ran its handler on a null element. | `engine/ddtv-gallery.js` |
| Gallery code budget set explicitly (48 KiB raw, 14 KiB gzip) after the above grew it. | `tests/gallery.mjs` |
| Stand-in page's native gallery given the sizes measured on the real page (thumbnails 100×75, photo limited to its column) so restoration is testable. | `prototype/template.html` |
| **New tests**: storefront source, real media playback, restoration over 12 cycles with options/price/listener counts, stacked layout, the real page (native thumbnails, lightbox, options, listeners, stacked layout, video, retina, iPhone). | `tests/gallery.mjs` (now 174), `tests/live/restore-e2.cjs` (39) |
| Permanent requirements, consolidated report, test matrix, deployment procedure, README. | `docs/` |

The button's design (297 × 48 px, Chillax 15 px / 600, 5.0:1 contrast, rounded corners, visible count) was **kept as the baseline**: responsive testing (desktop, iPad portrait, landscape, iPad mini) found no layout problem that justified changing it.

## 3. How the Ecwid image source is connected

Three sources, merged by the adapter (`docs/GALLERY-ARCHITECTURE.md` 4.3):

1. **The page's own gallery** (always): the thumbnails in Ecwid's order, one size each (about 800 px). This is the baseline and the fallback; with no manifest and no records it shows every image the store's gallery shows, so the area is never empty.
2. **The storefront's product records** (automatic): the same request Ecwid's page makes, repeated once with only `{"productIdentifier":{"type":"PUBLISHED","productId":N}}`. Verified on the real page to return the same 14 records in the same order, with 160/400/800/1500 px URLs, the original, id, main flag, dimensions and alt. Used only if every image the page shows is among them. Optional, undocumented, can be switched off (`modelGallery.storefront: false`).
3. **A manifest** (optional, owner-curated): classification only (customer photograph or supporting resource; category). It never needs URLs typed by hand; the tool copies what Ecwid returned.

No URL is constructed or derived (the five files of one image have unrelated numbers). A deleted image is detected because the page's gallery no longer lists it. **The "Divine DunlopDreams Ecwid Bridge" named in the brief does not exist in this repository and no description was available, so it was not used; no claim is made about it.**

## 4. How native gallery visibility is controlled

`data-ddtv-gallery="isolated"` on the native gallery container, set only while this product's television is showing, plus one injected stylesheet whose rules match only that attribute (`…[data-ddtv-gallery="isolated"] > :not(.ddtv-host) { display: none }`). The gallery stays mounted, untouched, with all its data and handlers. Ecwid re-creating its children is covered by the rule at once; Ecwid replacing the container or the product block is caught by a childList observer on the container, its parent and the block's parent, which re-applies the mode. Other products, `?ddtv=off` and phones never get the attribute.

## 5. How Standard Product View restores the original gallery

Switching to Standard Product View removes both attributes and the stylesheet. That is the whole restoration: nothing was cloned, moved or edited, so there is nothing to put back. Verified on the real Ecwid page after 12 cycles: the gallery's children have exactly the display values they had before the television existed, the 14 thumbnails are 75 px high, a click on a native thumbnail changes the main picture, the store's own PhotoSwipe lightbox opens on the selected photo, navigates with its own arrow and closes with Escape; the television leaves no overlay and one hidden host; on iPad portrait the sidebar, description and product block measure exactly what the store had.

## 6. How product configuration is preserved

The television never owns the configuration: it drives and mirrors the store's own dropdowns and price. Switching views changes no value. Verified on the real page: four options chosen in Optimised Preview stayed chosen through 12 cycles, the price (£854.10) never changed, a cover changed in Standard Product View was kept on return, and the television showed the store's price. Add to Bag is the store's own button, never moved or wrapped: present, enabled and uncovered in both views (**never clicked**).

## 7. Which tests passed

| Suite | Result |
|---|---|
| `tests/gallery.mjs` | 174 / 174 |
| `tests/embed.mjs` | 175 / 175 |
| `tests/smoke.mjs` | 104 / 104 |
| `tests/live/gallery-e2.cjs` | 39 / 39 |
| `tests/live/restore-e2.cjs` | 39 / 39 |

Mutation checks (isolation, restore, video resume, stacked attribute removal deliberately broken) made the matching checks fail; reverted and re-verified by hash.

## 8. Which tests were simulated

`tests/gallery.mjs`, `tests/embed.mjs` and `tests/smoke.mjs` run against a **stand-in store page** (real gallery markup and the 14 real image records, but not Ecwid), with a **fake storefront endpoint** and a **synthetic MP4** for the media host. They prove the engine's logic. They are **not** a live Ecwid verification.

## 9. Which tests were performed on real browsers or devices

- **Real Ecwid DOM and runtime of the *public* product 831592302** through local read-only injection in Chromium (E2): `gallery-e2.cjs` and `restore-e2.cjs`. This is the real store's markup, scripts, requests and CDN images. It is **not** the test product 876405767.
- The browser's media engine really played a **synthetic** H.264 test pattern; the production media host is not reachable from this environment.
- **No real Safari, no real iPad, no real iPhone, no real Add to Bag click, no Ecwid admin upload** was performed. Device sizes were emulated in Chromium.

## 10. Unresolved risks and release blockers

**Release blockers (the brief asks for these before deployment approval):**

1. **E3: nothing has run on the test product 876405767.** Its gallery markup, options and description are assumed to match the public product. First step: `DEPLOYMENT.md`, step 7 (`DDTV.current.modelGallery.adapter.report()`).
2. **E4: no real Safari on iPad or iPhone.** Touch feel, swipe, momentum scrolling, rotation, older-device memory and performance are unverified.
3. **Video on the production media and on iPadOS/iOS** is unverified (muted-loop autoplay, inline playback, the full video with sound, the seven-zone video). Do not describe video as validated beyond the behaviour logic.
4. **Image upload in Ecwid Admin** was not exercised (the engine makes no write request, which is evidence by construction, not by test).

**Risks and decisions for the owner:**

5. The storefront source is an **undocumented** Ecwid endpoint. If Ecwid changes it, the gallery silently uses the page's own 800 px images; it does not break. Accept the dependency, or set `storefront: false`.
6. The store's dropdowns keep their native width on iPad portrait (blank space to their right); widening them would restyle the store's controls.
7. Native images are still downloaded by Ecwid itself before the television exists; isolation hides them, it cannot prevent the download.
8. The test product has no manifest; classification (which photographs are customer-facing) is the owner's decision. New uploads are hidden from the model gallery until classified when a manifest exists, and shown when none exists.
9. `!important` is used on five properties of the store's sidebar and description, behind `data-ddtv-stacked`, because the store's own selectors are more specific than any reasonable selector; it applies in no other state.

**Rollback** (unchanged and tested): add `?ddtv=off` to the address (the engine does not start); remove the one loader line (the television disappears and the store's page is untouched); *Standard Product View* is always one click away. Re-running the suites after any change is the regression gate.

**Do not deploy until the blockers above are cleared and the deployment is explicitly approved.**
