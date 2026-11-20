# Integration into Equity: what exists, what is missing, what comes next

Status: **20 November 2026.** Desk review of the repository only. Nothing was changed in the shop, in Equity or on the test product 876405767. The live product 831592302 is not touched.

## 1. Four code paths, and only one of them runs in the shop

| Path | Files | Size | Runs in the shop? | State |
|---|---|---|---|---|
| **A. Production embed** | `engine/ddtv-*.js|css`, `products/botanic.*.js`, built by `tools/build-embed.mjs` into `dist/embed/botanic-tv.js` | 282 KB, one file, sha256 `959bd182…` (MANIFEST) | Yes, once the owner pastes it and the product id is listed | Tested on a simulated Ecwid only (`tests/embed.mjs`, 175 checks; `tests/smoke.mjs`, 104). **Its visual layer has none of the rounds XVI–XIX:** `engine/*.css` contains no `#6E8601`. |
| **B. Design sandbox** | `tools/tv-design-preview.template.html` → `docs/tv-preview/large-screen-design.html` | 860 KB, with the pictures inlined as data | No. It is the design, with simulated data and stand-in prices. | Where the owner's rounds have been drawn and checked (145 design-rule checks). |
| **C. Mobile** | `docs/mobile/premium/preview/graphite.html` | 255 KB | Not yet | Defined by the owner. Its palette is **still slate blue and navy** (`#364849`, `#203032`, `#46628F`, `#8CA2C2`, `#C3D5ED`). It is not the coffee, vanilla and green palette. |
| **D. Presentation** | `docs/tv-presentation/botanic-experience-tv.html` (Artifact) | 867 KB | No. Review only. | Current. |

**The main fact to hold on to:** the design of the last four rounds (the green, the Cover panels, the zones in the drawing, the core cut-out, the mattress card, the owner's texts) lives in path B. Path A, the one the shop would run, does not have it yet. Nothing in B can be pasted into Equity as it is.

## 2. Where Equity sits, from the repository

- **Equity** is the owner's system for the prices, the sizes' final prices and the promotions (`docs/PRICES-AND-CHECKOUT.md`, `docs/DECISIONS.md`). The active promotion is an automatic rule in Equity. The store shows the price without the discount and the price with it, and our module shows exactly what the store shows.
- **Ecwid** owns the product, its four options, the cart and the checkout (`docs/ECWID-COMPATIBILITY.md`). "Go to Checkout" opens Ecwid's shopping cart; the order is built by Ecwid and Equity from the four choices.
- Our code **calculates no price**, stores no price, never clicks Add to Bag and never writes to the store. This is a standing rule, and every change must keep it.
- The repository does not contain Equity's own documentation or its admin screens. Where Equity accepts custom code, and whether it accepts a 282 KB script or only a link, is **not known** (`docs/DEPLOYMENT.md` says the same).

## 3. Questions the owner needs to answer before the port

1. In Equity's admin, **where does custom HTML or JavaScript go**, and is there a size limit? If there is one, the embed loader (`dist/embed/ecwid-loader.js`, which fetches the 282 KB file from the owner's host) is the way in.
2. Does Equity expose the **price and the promotion through its own API or page**, or only through the store's price element? Our code reads the store's element only, so this decides whether anything changes on our side.
3. Is the **mobile graphite preview** the mobile design for this same product page, with the same four option titles? The owner says it is defined; the palette still needs to follow the coffee and green tokens.
4. **Approval of new wording.** Round XVIII and XIX added texts that are not in the approved description: the Cover fit, zip and washing at 40°C, the warranty for the latex core only, "buy directly from the maker", the production in Germany and the UK depot, and "not a medical device". They come from the owner's letter and from the owner's notes. They need the owner's approval against the warranty terms before they go on any live page. The text lives in `tools/own-panels.mjs`.
5. **The Cover figure.** The published description says the cover adds 2 cm (1 cm top, 1 cm bottom). The owner's latest note says a 26 cm Botanic is a 24 cm core plus the cover. The design shows the second reading. One of the two must be confirmed; the description cannot say both.

## 4. Plan, in order (nothing goes live without the owner's go)

1. **One set of tokens.** Move the palette into one file used by the design, the engine and the mobile: coffee `#434239`, deep slate `#2E3633`, vanilla `#FBFBED`, latte `#DDD6C4`, the one green `#6E8601` (text on light `#566901`), the decorative sky `#5DB8C4` (only in the mattress card). The mobile's blue palette is replaced here, and nowhere else.
2. **Port the visual layer to the engine.** The components are: the four-family header, Your order, Your selection with the mattress card and the core cut-out, the Cosmic Selection, the zones drawing, the film panel, the Cover panels, the Delivery part C, the start-up. Each one is ported with its tests; `tests/embed.mjs` and `tests/smoke.mjs` must stay green.
3. **Port the design rules.** `tests/design-rules.mjs` tests the sandbox file. Its checks (contrast R40, one green R41, the content R42, the mattress card R43) must run against the embed as well.
4. **Build and check the embed**: `node tools/build.mjs`, `node tools/build-embed.mjs`, `node tests/smoke.mjs`, `node tests/embed.mjs`. Check the file's size and hash against `dist/embed/MANIFEST.txt`.
5. **Test product only** (876405767). Paste the description and the loader there, following `docs/DEPLOYMENT.md`, Steps 0 to 3. The live product stays as it is.
6. **Real store check** (E3 and E4 in `docs/TEST-MATRIX.md`): the owner's account, real Ecwid, real Safari. Until that has been run, no live verification exists.

## 5. Risks to keep in view

- **Two codebases drift.** The design in B and the embed in A already differ. Step 1 and Step 3 close this; until they are done, every design round must say which path it changes.
- **External dependencies.** The embed loads the Chillax font from api.fontshare.com (the page still works without it), and every film and photograph from media.divinedunlop.com. The store's security policy may block either; check on the test product first.
- **Weight.** The embed is 282 KB and the sandbox 860 KB. The sandbox is never shipped. The embed's budget is in `docs/SEO-AND-PERFORMANCE-GUARDRAILS.md`; the videos load on demand (`preload="metadata"`).
- **Stand-in prices.** The sandbox shows "£1 346.40" and "Save 10%" as stand-ins. In the shop these come from Equity and Ecwid only.
- **The mobile palette** is the biggest visual gap between what the owner has approved and what is in the repository.

## 6. Ready to paste?

**Not yet.** The embed currently builds the earlier design. What is ready is the tooling: after step 2 the same `tools/build-embed.mjs` command produces `dist/embed/ecwid-loader.js` and `dist/embed/ecwid-snippet.html`, which are the two files to paste.
