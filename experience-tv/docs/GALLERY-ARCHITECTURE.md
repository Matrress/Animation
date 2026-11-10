# Ecwid gallery integration with the Product TV

Requirement: two coexisting presentation modes over the same Ecwid data. **Optimised Preview** (the Product TV, native gallery isolated, a *View Model Gallery* inside the TV) and **Standard Product View** (the original Ecwid page, native gallery restored). Ecwid owns the images and the commerce; the TV only presents them.

Status: development environment only. Nothing is published to the live storefront; no live product, gallery or image was modified.

**Evidence levels** (as in `TEST-MATRIX.md`): **E1** simulated store page; **E2** the real Ecwid DOM and runtime of the *public live* product 831592302 through local, read-only injection (nothing saved); **E3** the real test product 876405767 (**not done**); **E4** real Safari on iPad and iPhone (**not done**). A pass in E1 is not a live Ecwid verification.

---

## 1. Part A: the architecture as found

### 1.1 The Product TV before this work

| Piece | Behaviour found |
|---|---|
| Views | `interactive` (the TV) and `classic` (the original description). Buttons read "Interactive View" / "Classic View". |
| Native gallery | Column placement: the gallery's *children* were hidden with inline `display:none` (`layout.hideInColumn`). **Stacked placement (iPad portrait): the native gallery stayed visible**, which contradicts the new requirement. |
| Restore | Inline styles were remembered and put back on switching to Classic View. |
| Fail-safe | A failed start leaves the original page; a failure *after* the gallery was hidden was not covered. |
| Images | The TV never read the gallery's images. |
| Overlay | One overlay inside the monitor (`ddtv__overlay`), used by the full-length video player. |
| Mounting | A shadow-root host in the store's left column, or full width above the product block (stacked); idempotent start; Ecwid page-load events. |

Weaknesses that matter for this requirement: inline hiding is lost when Ecwid replaces the nodes (section 2.3); the stacked placement shows the native gallery; labels differ from the required names; there is no image data layer.

### 1.2 What stays

Product guard (`productIds`), `?ddtv=off`, Classic/Standard switching without reload, the shadow root, the hands-off rule for Ecwid's options, price and Add to Bag, the overlay mechanism, container-query layout.

---

## 2. Part B: the real Ecwid storefront (public live product, E2, read-only)

### 2.1 Gallery DOM

```
div.product-details__gallery.details-gallery.details-gallery--thumbnails-vertical
  div.details-gallery__wrap > div.details-gallery__wrap-inner
    div.details-gallery__spacer
    div.details-gallery__images > div.details-gallery__images-container   (main image; an <img class="details-gallery__picture">)
    div.details-gallery__thumbs   (14 × div.details-gallery__thumb, one --active)
  div.details-gallery__scroll     (dots, for narrow screens)
```
- The main image is a real `<img>` (`loading="eager"`, `srcset … 1x`, the 1500 px file, with `alt`).
- Thumbnails are **CSS `background-image: image-set(url(…) 1dppx, url(…) 2dppx)`**, both pointing at the same 800 px file.
- Initial requests: the main image and the first five thumbnails only (8 CDN requests in the first 4 s); the other nine thumbnails are not requested until shown. The native page is already lazy; what it has loaded is browser-cached for anything we show later.
- The CDN is `d2j6dbq0eux0bg.cloudfront.net/images/<storeId>/products/<productId>/<file>.webp`.
- At 820 px wide the gallery keeps the same layout (thumbnails shown, dots hidden).

### 2.2 Where image data lives

| Source | What it gives | Verdict |
|---|---|---|
| **The native gallery DOM** | The 14 thumbnail URLs (800 px), the active main image (1500 px), `alt` of the main image, order. No other sizes, no dimensions. | Usable at runtime, always current. Not enough for a large viewer. |
| **Storefront API response** (`POST …/storefront/api/v1/<store>/catalog/product`, what Ecwid's own page calls) | Per image: `id`, `isMain`, `width`, `height`, `image160pxUrl`, `image400pxUrl`, `image800pxUrl`, `image1500pxUrl`, `imageOriginalUrl`, `alt`, `altType`, `borderInfo`. Verified field by field. | Authoritative and complete, but an **internal endpoint**: not documented as ours to call, requires its own request body, can change. **The adapter does not call it.** It is the format the adapter understands and the source for a manifest. |
| `window.initialState` | Site, categories, translations. **No product media** (only the product's share image URL). | Not a source. |
| Ecwid JS API (`window.Ecwid`) | Page events (`OnPageLoaded`, `OnProductOptionsChanged` …), `openPage`, configuration. **No product-data accessor.** | Used for events only. |
| REST API v3 (`/products/{id}`, token) | Documented to carry `media.images[]` with the same size fields. **The documentation host is blocked from this environment (403), so the REST field names were not verified here**; they match the storefront names above. Needs the owner's token. | For the owner's tooling (manifest generation), not for the browser. |
| **GitHub manifest** | Whatever we write into it: every size URL, categories, flags. | Permitted by the requirement ("image URL manifests"). The runtime source for sizes beyond 800 px. |

**Consequence for the design (a real constraint):** the five files of one image have **unrelated numbers** (160: …049, 400: …048, 800: …050, 1500: …104, original: …102). A URL of one size cannot be derived from another. Only URLs that Ecwid returned may be used. With no manifest the TV gallery works from the 800 px URLs in the DOM; with a manifest it gets 1500 px for the large view.

Real `id` values are Ecwid's own and not sequential (0, 26, 22, 29, 27, …). All 14 images have an `alt` (one `Main`, thirteen `Fallback`). Dimensions vary (2732×2048, 1536×1024, 3600×1800, 1920×880, 1080×1080 …), so the viewer must not assume an aspect ratio.

### 2.3 Gallery lifecycle (what the native page does)

| Event | Native gallery element | Its children |
|---|---|---|
| Click a thumbnail | same element | main image area re-rendered (4 nodes replaced) |
| **Choose product options** | same element | re-rendered; **the main image changed to a file that is not among the product's 14 media** (an option-driven image) |
| Navigate to another page and back | **a new element** | all new |
| Resize 1180 → 820 | re-laid out, same classes | n/a |

Consequences: hiding must **not** depend on inline styles of nodes Ecwid replaces; the TV gallery must show the product's media set and **must not** adopt the option-driven swaps; the DOM is read once as a snapshot at TV start (and refreshed on page load), not continuously.

### 2.4 Layout when the gallery is hidden

Hiding the gallery's children, or the container itself, gives the same result: the options column stays in its right-hand grid column and the left column is empty (the description, which the TV also hides, would move up into it). Collapsing the left column would mean restyling Ecwid's layout grid around the options, which the hands-off rule forbids. **Result: in the stacked placement (iPad portrait and some landscape sizes) there is an empty left column beside the options.** It is a visual cost of the requirement; options in section 5.

---

## 3. Feasibility assessment

| Requirement | Feasible | How, and the limit |
|---|---|---|
| Ecwid stays the image store; no new upload system; no migration | Yes | The TV only **reads**. No write to Ecwid, SiteGround or GitHub images. |
| Native gallery hidden only in Optimised Preview, not deleted | Yes | Scoped attribute plus a stylesheet that only matches that attribute (section 4.2). Survives Ecwid re-render. |
| Restore without reload, no duplicates | Yes | Remove the attribute. No cloning of the native gallery, ever. |
| View Model Gallery inside the TV | Yes | Overlay inside the monitor, built on demand. |
| Image URLs retrieved, normalised, not invented | Yes, with one honest limit | Native DOM gives 800 px; sizes up to 1500 px/original need the manifest. |
| Do not hardcode URLs in components | Yes | Components read the adapter; URLs live in a manifest (data), not in code. |
| Deleting an image must not be assumed to keep its URL | Yes | Runtime cross-check against the native DOM plus `onerror` fallback; stale entries are dropped and reported. |
| Media categories; customer gallery vs supporting resources | Yes | Manifest fields `category`, `customerGallery`, `usedIn`. Ecwid itself has no such classification; it exists only in the manifest. |
| Upload must not force an image into the TV gallery | Yes | With a manifest, unlisted images are **not** shown (policy `unlisted: 'hide'`), reported instead. Without a manifest (product not yet migrated) all native images are shown, so the area is never empty. |
| Works with dynamic pages and client-side navigation | Yes | Page-load events, an observer that re-asserts isolation and re-mounts if Ecwid replaces the container. |
| Lightweight; gallery on demand; sized CDN images | Yes | No image request from the TV before the gallery opens; URL chosen by size; lazy thumbnails. |
| Fail-safe; never an empty image area; purchasing never blocked | Yes | Isolation applies only after the TV rendered; a render check restores the native gallery on failure; Standard Product View is always one click away. |
| Existing products unaffected | Yes | Everything is guarded by `productIds`. |
| **Native gallery images not downloaded at all in Optimised Preview** | **No** | Ecwid has already requested the main image and the first thumbnails before the TV exists, and we may not alter Ecwid's code. Hiding stops painting, not what Ecwid already fetched. What we avoid is *additional* downloads and duplicates. |

---

## 4. Part C: the proposed mechanism

### 4.1 Modules

- `engine/ddtv-engine.js`: the **mode controller** (views, native-gallery isolation, observer, fail-safe) and an extension hook (`DDTV.use`).
- `engine/ddtv-gallery.js` / `.css`: the **gallery adapter** (reads, normalises, merges, verifies) and the **gallery component** (button, overlay).
- `products/<model>.media.js`: the **media manifest** (data).
- `tools/media-manifest.mjs`: drafts a manifest from a product export.

### 4.2 Scoped isolation (instead of inline styles)

On entering Optimised Preview the controller sets `data-ddtv-gallery="isolated"` on **the native gallery container of this product page** and injects one stylesheet whose only rule matches that attribute:

```css
.product-details__gallery[data-ddtv-gallery="isolated"] > :not(.ddtv-host) { display: none; }
```
- It matches nothing on any page where the attribute is absent (other products, Standard view, `?ddtv=off`).
- Ecwid replacing the gallery's children does not matter: the rule applies to the new children at once, with no flash.
- If Ecwid replaces the *container*, an observer re-applies the attribute and re-inserts the TV host into the new container.
- Standard Product View removes the attribute: the native gallery, untouched, is back. No reload.
- The same attribute is used in the stacked placement (the gallery stays in its column, hidden).

### 4.3 Adapter and manifest

Normalised image: `productId, id, key, order, isMain, width, height, alt, urls{160,400,800,1500,original}, category, customerGallery, usedIn, source ('manifest'|'native'), verified`.

Merge rules:
1. Read the native gallery once (snapshot): thumbnail URLs in order.
2. If a manifest exists: its images, in Ecwid's order from the snapshot where verified, each marked *verified* if one of its URLs is in the snapshot. Images in the snapshot but not in the manifest are **unlisted**: hidden from the customer gallery, listed in `report()`. Manifest images not in a non-empty snapshot are **stale** (deleted or replaced in Ecwid): dropped, listed in `report()`.
3. If no manifest: the snapshot images, all shown (800 px).
4. Every URL in the result is a URL that Ecwid or the manifest supplied. Nothing is constructed.

### 4.4 Gallery component

The button **View Model Gallery** sits in the monitor's header row, on every screen. The overlay shows one large image (size chosen from the viewer's width and the screen density), previous/next, a counter, a thumbnail strip (smallest sufficient size, lazy), category chips when more than one category is present, swipe on touch, arrow keys, Escape, and **Back to presentation**, which returns to the screen the customer was on. Nothing is requested before it opens.

### 4.5 Fail-safe

The native gallery is isolated only after the TV has built; if building or the first render fails, or a render check 2.5 s later finds no visible TV, the controller restores the native gallery and the original page. The Standard Product View button, `?ddtv=off` and a failed start all leave the native product page fully working. The TV never overlays the options, the price or Add to Bag.

---

## 5. Decisions and limits for the owner

1. **Empty left column in the stacked placement** (section 2.4). Alternatives: accept it (implemented); keep the native gallery visible in the stacked placement only (contradicts requirement 3); restyle Ecwid's grid (violates the hands-off rule).
2. **Unlisted images**: with a manifest they stay out of the TV gallery until classified. The alternative (show everything) would let an upload appear without review.
3. **Manifest production**: sizes above 800 px need a manifest generated from a product export (`tools/media-manifest.mjs`). It must be regenerated when images are added or replaced; until then new images are reported as unlisted and replaced images as stale.
4. **Option-driven images**: Ecwid swaps in images when options are chosen. The TV gallery does not follow them.
5. The test product's own images and their classification are not known to this work; the repository carries a draft with no classification for it, and a real-data fixture from the public product for tests.

---

## 6. Test plan

| # | Acceptance criterion | How it is tested | Level |
|---|---|---|---|
| 1 | Images can still be uploaded in Ecwid | Cannot be tested without the Ecwid admin. Evidence by design: the engine issues **no write request of any kind**, checked by recording every request method. | E1 (by construction), E3 needed |
| 2 | URLs retrieved and usable | Adapter tests on the real public-product records; DOM-only mode on the real DOM; every output URL must be one supplied; image requests to the CDN succeed. | E1, E2 |
| 3 | Native gallery hidden only during Optimised Preview | Computed `display` of every native gallery child in each mode, both placements; unaffected on another product; unaffected with `?ddtv=off`. | E1, E2 |
| 4 | View Model Gallery opens the correct images | Opened gallery compared with the expected set and order; displayed `src` belongs to that image; `alt` used. | E1, E2 |
| 5 | Close returns to the TV | Same chapter and screen, focus returns, overlay removed. | E1, E2 |
| 6 | Standard Product View restores the gallery | Visible, same element, same thumbnails, no reload (page marker unchanged). | E1, E2 |
| 7 | Repeated switching, no duplicates | 25 round trips; counts of hosts, style elements, thumbnails, observers; no errors. | E1, E2 |
| 8 | Configuration, price, Add to Bag operational | With the gallery open and after; simulated Add to Bag; real price. Real Add to Bag is **not clicked**. | E1, E2 (not the action) |
| 9 | iPad portrait, iPad landscape, iPhone, desktop | Device sweep; iPhone keeps the native gallery. | E1, E2 (Chromium emulation only; **E4 not done**) |
| 10 | Existing products unaffected | Guard tests; no attribute, no style change on other products. | E1, E2 |
| P | Performance | Zero gallery image requests before opening; request count and sizes after opening; bundle size. | E1, E2 |
| F | Fail-safe | Forced failures (scene error, build error, host removed) restore the native gallery. | E1 |

---

## 7. Verified results

Build under test: `dist/embed/botanic-tv.js`, sha256 `767a7f725e824ff4356e4cb665da5a4652f1ae0ff2f230ef867dec9421302364`. Runs of 2026-11-10, Chromium only.

| Suite | Level | Result |
|---|---|---|
| `tests/gallery.mjs` | E1, simulated store with the real gallery markup and the 14 real image records | **123 / 123** (incl. the primary-button and video ↔ photos checks of 7.2.1) |
| `tests/embed.mjs` | E1 | **175 / 175** (three assertions rewritten: the stacked placement now isolates the native gallery as well; see below) |
| `tests/smoke.mjs` | E1 | **104 / 104** |
| `tests/live/gallery-e2.cjs` | **E2**, the real Ecwid DOM and runtime of the public product 831592302, local injection, read-only | **39 / 39** (log: `tests/live/gallery-e2.last-run.txt`) |

Mutation checks on the new tests: switching off `apply()` made 11 or more of the gallery checks fail, and switching off the restore made 5 fail; both were reverted and the build re-verified. The tests do detect a broken controller.

### 7.1 The ten acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Images can still be uploaded in Ecwid | **Not testable here** (needs the Ecwid admin). By construction the engine only reads: no write request of any kind was made in E1 (45 requests, all GET) or in E2. | E1, E2; E3 needed |
| 2 | URLs retrieved and usable | The adapter read the real gallery's 14 thumbnails; each address is one of the five files the store supplies for that image (13 at 800 px, one at 400 px), in the store's order; none invented. The photo loaded from the CDN (800×600). | E2 |
| 3 | Native gallery hidden only during Optimised Preview | Every child of the real gallery is `display:none` while the TV shows, and back to exactly its previous value in Standard Product View (the store's own touch scroller is hidden by the store on wide screens and stays so). Leaving the product through Ecwid removes the attribute and the rule; the iPhone page is untouched. | E1, E2 |
| 4 | View Model Gallery opens the correct images | No manifest: photo 1 of 14 is the store's own 800 px file. With a manifest present at start: 12 customer images, all verified against the real gallery, the 2 supporting resources kept out, store order, 8 category chips, a category narrows the list. | E1, E2 |
| 5 | Close returns to the TV | Escape and the close button return to the same chapter; focus returns to the button (E1). | E1, E2 |
| 6 | Standard Product View restores the gallery | The same children, 14 thumbnails with their original boxes (75 px high on desktop and iPad landscape, 48 px on iPad portrait), no reload. | E1, E2 |
| 7 | Repeated switching, no duplicates | 25 round trips on the real page: one television, one rule, thumbnails still 14, state correct every time. In E1 also 25 round trips and the store re-creating its gallery children and its whole container. | E1, E2 |
| 8 | Configuration, price, Add to Bag operational | With the gallery open the real options still change the real price and the TV mirrors it (£854.10 for the combination tried). The real Add to Bag is present, enabled and not covered. **It was not clicked.** Simulated Add to Bag in E1. | E1, E2 (not the action) |
| 9 | iPad portrait, iPad landscape, iPhone, desktop | Desktop 1440×900, iPad 820×1180 (stacked) and 1180×820 (column), iPhone 390×844. Gallery fits the monitor, buttons 44 px, no sideways scroll. **Chromium emulation only.** | E1, E2; **E4 not done** |
| 10 | Existing products unaffected | The shipped build lists the test product only; other products and `?ddtv=off` get no attribute, no rule, no host (E1). In E2 the live product's id was added to the injected copy only. | E1, E2 |

### 7.2 Performance (measured)

- Build: `botanic-tv.js` 235.1 KiB raw, 59.1 KiB gzip. The gallery (JS and CSS) adds 34.1 KiB raw, 10.2 KiB gzip.
- The TV adds **no image request** on load. Gallery images are requested only after *View Model Gallery* is pressed.
- Opening, no manifest: 9 image requests, 351 KB (the store's page supplies one size per image, about 800 px, so the strip uses those).
- Opening, manifest: 12 requests, 29 KB (160 px thumbnails; the large photo is the smallest supplied size that fits the stage, 800 px at a 531 px stage). The full-size originals are never requested.
- The strip is lazy; the neighbouring photo is preloaded unless the visitor has data saving on.

### 7.2.1 The View Model Gallery as a primary feature (added 2026-11-10)

| Requirement | Result |
|---|---|
| Prominent, premium button inside the television | The one solid, saturated control in the monitor's header: 297×48 px, 15 px / 600 in Chillax (the television's typeface, loaded from Fontshare; if it is blocked the stack falls back to Helvetica Neue), white on `#2C7894` at 5.0:1, rounded corners, picture-set icon, photo count set off by a divider. On the title row beside the heading, above the screen: it never covers the video or the options. |
| Left and right arrows, swipe, counter, close | 48 px arrows with a stronger outline, swipe on touch (tested on iPad sizes), counter `1 / 12`, *Back to presentation*, Escape. |
| Largest practical size, proportions kept | The photo fills the stage with `object-fit: contain`; the file size is the smallest supplied one that fits the stage at the device pixel ratio. |
| Real Ecwid addresses, store order | Yes (section 7.1, criteria 2 and 4). |
| Full size on demand, neighbour preloaded | The strip is lazy; the next photo is preloaded; originals are never requested. Without a manifest the largest size the store's page supplies is about 800 px, so the "full size" is that until a manifest provides 1500 px. |
| Repeated switching without a reload | Ten round trips: one gallery while open, none after, no video playing behind it, the page never reloaded; the looping videos start again on each return. |
| Never leave Optimised Preview to see photos | The gallery is inside the monitor; the store's own gallery stays isolated and is available in Standard Product View. |
| Phones | Unchanged: a phone always gets the standard page with the store's own gallery. No television, no button, no gallery module work (E1 iPhone portrait; E2 iPhone 390×844; phones of either orientation are recognised by the screen's short side). |

### 7.3 What this does not prove

1. **The test product 876405767 (E3)**: not reached. Its gallery markup is assumed to match the public product's; the first check on it is the adapter report in `DEPLOYMENT.md`.
2. **Real Safari, iPad and iPhone (E4)**: not done. Chromium emulation only.
3. **Uploading in the Ecwid admin**: the engine never writes, but the upload flow itself was not exercised.
4. **Native images are still downloaded by Ecwid.** Ecwid fetches its gallery images before the TV exists; isolation hides them, it cannot prevent that download. This is the one place the requirement "do not load unnecessary images" cannot be met from outside Ecwid.
5. **The REST API's field names for media** are not verified (the documentation host was blocked). The manifest tool accepts the storefront's `mediaItems`, which were verified, and a REST-shaped export on a best-effort basis.
6. **The classification used in the tests** (which of the 14 public images is "seven-zone", "covers" and so on) is arbitrary and exists only to exercise the categories. The test product has no manifest yet; until it has one, its gallery shows every image its own gallery shows.
7. **Option-driven images**: the store swaps in other images when options are chosen (observed on the real page). The TV gallery stays on the product's own images.
8. **An empty left column in the stacked placement** (section 2.4) is a visible consequence of hiding the gallery and needs an owner decision.
