# Integration plan: the Botanic Experience into the Ecwid product page

Status: **22 November 2026.** Written before the build. Owner decisions in force (DECISIONS.md, rounds XXXI–XXXIII and the talks of 21–22 November):
one address, one text; two layouts chosen by the device only (television for tablet, laptop and monitor; the phone layer for phones);
the shop's own description stays underneath as the fallback; nothing is written to the store without the owner's confirmation.

## 1. What the platform is (checked, not assumed)

| Fact | Evidence |
|---|---|
| The site is **Ecwid Instant Site** (`<meta name="generator" content="ec-instant-site">`), store 100333285, storefront `app.ecwid.com/script.js?100333285`. | Raw HTML of the public product page, 22 Nov. |
| The product page is **server-rendered with the whole description**: all 260 sentences of the live description are in the raw HTML before any script runs. Google reads the description without JavaScript. | `live-page.html` against the API description (compare script, 22 Nov). |
| Ecwid's own Product **JSON-LD** is on the page (name, images, SEO description). We do not touch it. | Raw HTML. |
| Ecwid's storefront API is present: `Ecwid.OnPageLoaded`, `Ecwid.OnProductSelectedOptionsChanged` (fires with option name → value), `Ecwid.OnCartChanged`, `Ecwid.openPage`, `Ecwid.refreshConfig`. | Local browser on the public page, 22 Nov. |
| The four options are dropdowns: `SIZE` (22 sizes + "For More Options CONTACT US"), `Select Mattress Depth` (3), `FIRMNESS BY BODY WEIGHT` (4), `COVERS` (4). All four are marked required in the product data. | Bridge read + live DOM. |
| Price after a size: `£1 244`, struck `£1 555`, `Save 20%` (the store's discount is 20 % today, not 10 %). It comes 1–2.5 s after the change. The television mirrors these texts; it never computes them. | Live DOM, 22 Nov. |
| Choosing options sends only Ecwid's own catalogue reads; no cart, checkout or order request. | Request log, 22 Nov. |
| **Where code can go.** Product description (HTML mode): HTML, `<style>` and iframes render; no product in the store has a `<script>` there and Ecwid does not document it. Instant Site **Custom JavaScript code** (Website → Advanced website settings): code at the end of `<body>` on every page, **at most 4000 characters**, plans Venture/Business/Unlimited. Custom code *sections* exist for site pages, not for product pages. | Ecwid Help Center articles 8359349900828 and 11721659199388; bridge read of all six products. |
| A script inside the description is **not a reliable way in** even if Ecwid kept it: inside the store the description is inserted by the storefront when the customer moves between pages, and scripts inserted that way do not run. | Browser behaviour; Ecwid is a single-page storefront. |
| The bridge writes name, description, base price and enabled state only, **descriptions up to 100 000 characters**. The approved description is about 141 600 characters (157 948 in the API). | Bridge schema. |
| The repository is private (raw GitHub and jsDelivr answer 404), so the module file is hosted on the owner's `media.divinedunlop.com` (nginx, one-year cache, already serving the videos). | curl, 22 Nov. |

## 2. Architecture

```
Instant Site, every page                  Product page (server-rendered)
  Custom JavaScript code (≤ 4000 chars)    ├─ Ecwid gallery, options, price, Add to Bag   (always there: the shop's own)
  └─ loader: device decides               └─ description HTML = the approved text       (indexed; the fallback)
       ├─ phone  → botanic-phone.js            ▲
       └─ other  → botanic-tv.js  ─────────────┘ mounts the television ABOVE the product details,
                                                 in its own Shadow DOM; folds the long description
                                                 under "Read the full description" (still in the page)
```

* **One address, one text.** The description in Ecwid is the indexed text and the fallback. The television never hides text it
  does not show elsewhere; it presents the same content as an interface, and the description remains in the page (folded on large
  screens). Ecwid's JSON-LD, title, canonical and options stay Ecwid's.
* **Ecwid is the executor.** Size, depth, firmness and cover chosen on the television are set on Ecwid's own dropdowns (value +
  `input` + `change`, as a customer would); a choice made in Ecwid's dropdowns appears on the television
  (`OnProductSelectedOptionsChanged`, plus a change listener and a slow safety poll). Price texts are read from Ecwid. Add to Bag
  on the television presses Ecwid's own button, only when the customer presses it; "Go to Checkout" opens Ecwid's cart.
* **Isolation.** The television lives in a Shadow DOM: the store's CSS cannot change it and its CSS cannot touch the store.
  `?ddtv=off` switches everything off. Only listed product ids start it (test 876405767 first; 831592302 after approval).
* **Device, not window.** Shortest screen side under 600 px = phone layer; otherwise the television (the tested loader gate).

## 3. Phases and gates

| Phase | Work | Gate (all must pass before the next) |
|---|---|---|
| 1 | `tools/build-experience.mjs`: the approved design (docs/tv-preview) turned into `dist/experience/botanic-tv.js`, Shadow DOM, Ecwid binding, real price, real Add to Bag, lean data (the description copy, the unused core picture and the stand-ins removed; certificate logos loaded on demand). | E2 on the real public page, injected locally (nothing saved): TV→Ecwid for all four options, Ecwid→TV, price equal to Ecwid's after each change, Add to Bag untouched, no cart/checkout/order request, no page errors, starts only on listed products. Design suites still green. |
| 2 | Phone layer `dist/experience/botanic-phone.js` from the approved graphite phone design, recoloured to the coffee, vanilla and green palette. | E2 on the phone profile (fast and slow), the same sync checks. |
| 3 | Loader ≤ 4000 characters with the device gate; manifest with sizes and hashes. | Loader-gate test; size within the field. |
| 4 | Test product 876405767 (owner): upload the two files to `media.divinedunlop.com`, paste the loader in Custom JavaScript code, put the approved description in the test product (Ecwid admin, HTML mode: over the bridge limit). | E3 on the test product (owner preview or temporarily enabled without a category). |
| 5 | Live product 831592302 (owner's word only). | Canary green; Search Console URL inspection; LCP/CLS measured on a real tablet and phone. |

## 4. Indexing (Google)

1. The server-rendered description is the indexed content and stays complete: nothing is removed from it.
2. Texts that exist only in the television (the owner's own panels) are added to the description in a later, approved content step,
   so that what Google reads and what customers read stay the same.
3. No second address, no `?view=` variants, no client-side redirects; the test product stays disabled (not indexable).
4. The module loads after the page (async), never blocks the first paint, and the long videos load only on demand.
5. Ecwid's JSON-LD reports `price: 0.0` (base price zero, the price is in the options); that is Ecwid's and is not changed here.
