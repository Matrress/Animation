# Deployment procedure: Botanic Experience TV on the test product

Target: **test product 876405767 only**. The live product **831592302 must not be published to, edited, or added to the engine's product list** until the owner approves.

Who does what: the store admin and the web host are only reachable by the owner. Steps marked **Owner** need their access; steps marked **Anyone** need only this repository.
This is a procedure for E3 and E4 (real store, real Safari) in `TEST-MATRIX.md`. Until it has been run, **no live Ecwid or Safari verification exists.**

What is not known to this document (nobody could look): the exact place in the Ecwid admin where custom JavaScript goes for this store, whether it accepts a ~190 KB script pasted inline, and whether a script tag survives in a product description. The procedure is built so that it works wherever a one-line loader may run, and it says how to find out.

---

## Step 0. Back up (Owner)

1. Copy the test product's current description (about 13,136 characters, an older interface prototype) into a file.
2. Note any custom JavaScript or CSS already in the store from earlier prototypes; **the old prototype's code must not run alongside the new one.** Remove it when replacing the description.

## Step 1. Check the source against the live description, read-only (Owner + Anyone)

The API reports about 157,948 characters for the live description; the source file has about 141,662. A comparison of the live page's DOM (every text node, collapsed accordions included) found the same text, ids, media and style block (only the firmness figures differ, by decision), so the gap is not visible content. The raw string is needed to see what the rest is.

1. **Owner:** read the live product through the API (GET only) and save the `description` field to a file, e.g. `live-description.json` (the whole response is accepted).
2. **Anyone:** `node tools/compare-description.mjs live-description.json`
3. Expected: the only text differences are the firmness figures: only in the API: `49 – 87 kg`, `88 – 114 kg`, `7.7 – 13.7 st`, `13.9 – 18 st` and the two sentences beginning `When we say Medium from 49 kg to 87 kg`; only in the source: `49 – 83 kg`, `83 – 114 kg` and the same two sentences with `83 kg`. Ids, media and links identical.
4. **If anything else differs, stop and send the output.** Do not paste the description until it is explained.

## Step 2. Build and run the automated tests (Anyone)

```
node tools/build.mjs
node tools/build-embed.mjs
NODE_PATH=$(npm root -g) node tests/smoke.mjs     # expects: All checks passed (104)
NODE_PATH=$(npm root -g) node tests/embed.mjs     # expects: All checks passed (simulated Ecwid) (175)
```

The files are in `dist/embed/`. `MANIFEST.txt` lists their sizes and hashes.

## Step 3. Put `botanic-tv.js` on a web host (Owner)

Any HTTPS host works; the web host the owner already uses is fine.

1. Upload `dist/embed/botanic-tv.js` to a public folder, for example `…/ddtv/botanic-tv.js`.
2. Check that it is served untouched (replace the address):

```
curl -sI https://HOST/PATH/botanic-tv.js                 # expect: 200, content-type javascript
curl -s  https://HOST/PATH/botanic-tv.js | wc -c         # expect: the byte count in MANIFEST.txt
curl -s  https://HOST/PATH/botanic-tv.js | openssl dgst -sha256   # expect: the sha256 in MANIFEST.txt
```

If the size or hash differs, something on the host changed the file (a minifier, a compression plugin). Exclude the file from it, or the browser will still run a different file than the one tested.

3. **Optional, SRI.** Use `ecwid-snippet-sri.html` only if both of these pass:

```
curl -sI -H "Origin: https://divinedunlop.com" https://HOST/PATH/botanic-tv.js | grep -i access-control-allow-origin
        # expect: * (or the store's address). Nothing printed = the host sends no CORS header: do NOT use SRI.
curl -s https://HOST/PATH/botanic-tv.js | openssl dgst -sha384 -binary | openssl base64 -A
        # expect: the same value as in ecwid-snippet-sri.html after "sha384-"
```

Without SRI nothing is lost for the test; SRI only protects against the file changing on the host. If SRI is on and either condition later fails, the television **silently does not appear**.

## Step 4. Choose where the loader goes (Owner)

The loader is one line. It adds the file and does nothing on any product except 876405767.

| Option | What to paste | Notes |
|---|---|---|
| **A. A JavaScript field in the store's admin** (custom JavaScript / code) | the contents of `dist/embed/ecwid-loader.js`, with the address replaced | Runs on every storefront page, so the engine's own guard (product id) is what keeps other pages untouched. This is a store-wide script: approve it knowingly. |
| **B. An HTML field** | `dist/embed/ecwid-snippet.html`, with the address replaced | Same effect, as a script tag. |
| **C. Inside the test product's description** | the same tag at the end of the description | Product-scoped, **but** it may be stripped by Ecwid. Try it only to see; if the television does not start, use A or B. |

Replace `https://YOUR-SITE.example/PATH/botanic-tv.js` and **keep** `?v=…` (it makes browsers fetch the new file after each build).

## Step 5. Replace the test product's description (Owner)

1. Open product 876405767 in the admin, the description in its **HTML (source) view**.
2. Replace everything with `dist/embed/botanic-description.html` (about 142 KB: all 13 sections, 7 videos, the cover textures, the seven-zone video, the style block).
3. Save. View the product page **with the television off**: add `?ddtv=off` to the address. It must look exactly like the live Botanic page (same sections, images, videos).

The engine needs the element `id="bp-top"` from this file; without it the television waits about 15 seconds and quietly gives up.

## Step 6. Add the loader (Owner)

Do this after step 5. Open the test product's page (the admin preview, if the product is disabled; see the note under step 7).

## Step 7. Check on the real test product: E3 (Owner)

Open the browser console (F12) on the product page and run these. Expected answers in brackets.

```
window.__ddtvEmbedLoaded                 // [true] the file was loaded
typeof DDTV                              // ['object']
DDTV.current && DDTV.current.alive()     // [true] a television is running
document.querySelectorAll('.ddtv-host').length   // [1]
[...document.querySelectorAll('.details-product-option__title')].map(e => e.textContent)
        // the four option titles; send them if the television shows fewer than four choices
document.querySelector('[class*="ProductPage-"]').className   // contains ProductPage-876405767
DDTV.current.modelGallery.adapter.report()
        // {mode:'native', native:N, shown:N, ...}: N is how many images the product's gallery has.
        // If N is 0 or wrong, send this line: the gallery selectors need checking on this product.
document.querySelector('.product-details__gallery').getAttribute('data-ddtv-gallery')   // ['isolated'] while the TV shows
```

Then, by eye:

| Check | Expected |
|---|---|
| Desktop and iPad landscape | The television at the top of the left column, the options beside it, unchanged. |
| iPad portrait | The television full width above the product block; the options below, unchanged. The store's own gallery is hidden while the television shows, so its place beside the options is empty (open decision 5). |
| **View Model Gallery** | The button in the monitor's header on every screen. It opens the product's own images inside the monitor; arrows, swipe and the thumbnail strip browse them; Close or Escape returns to the same screen. The store's options, price and Add to Bag stay usable. |
| Optimised Preview / Standard Product View | The switch under the monitor. Standard Product View shows the store's original gallery and description again, with all 14 (or however many) thumbnails and no page reload; switching back hides the gallery again. Switch ten times: still one television, no duplicate gallery. |
| Upload a new image to the test product in Ecwid, then reload | The Standard Product View shows it. The model gallery does **not** show it yet if a manifest exists (it is reported as unlisted until classified); with no manifest it shows it. |
| Chapter buttons | Two rows of seven, every label fully visible, no numbers. |
| Choose a firmness, a depth, a size and a cover **in the television** | The store's four dropdowns show the same choices; **the store's price and the monitor's price are identical**; if the store shows a discount, so does the monitor. |
| Choose in the store's own dropdowns | The monitor's "Your selection" follows. |
| **Add to Bag** with all four chosen | Adds the right item at the store's price; the cart shows the four choices. (Do this on the test product only. If the disabled product cannot be bought, decide with the owner whether to enable it for the test window; nothing else changes.) |
| Add to Bag with a choice missing | The store refuses, as without the television. |
| Standard Product View | Original description and gallery back, 13 sections, 7 videos. |
| Click another product, then back | The television disappears, then returns once. |
| Open the live Botanic product | **No television and no change at all.** |
| `?ddtv=off` on the test product | No television; the original description. |

If it does not start, in order: is `__ddtvEmbedLoaded` true (no: the loader or file address is wrong, or SRI blocked it: open the Network tab and look for `botanic-tv.js`); is `typeof DDTV` object; are the four option titles present; is `#bp-top` in the page. Send what the console prints.

## Step 7b. Media manifest for the model gallery (optional, Owner + Anyone)

Without a manifest the model gallery shows every image of the product's own Ecwid gallery, at the size the store's page supplies (about 800 px). That works from the first day and is the fallback.

A manifest adds classification (main, gallery, seven-zone, covers, lifestyle, details, technical, shared) and larger sizes. The images stay in Ecwid; the manifest is data about them.

1. Export the product's record (the storefront's product JSON with `mediaItems`; `tests/live/capture-media.cjs` shows how it was read for the public product).
2. `node tools/media-manifest.mjs product.json --product-id 876405767 --out products/botanic.media.js`
3. Open the file and set `category` and `customerGallery` for each image (new images start hidden, as `unclassified`).
4. `node tools/build-embed.mjs`, upload `botanic-tv.js` again.
5. When images are added or replaced in Ecwid: `node tools/media-manifest.mjs product.json --product-id 876405767 --merge products/botanic.media.js --out products/botanic.media.js`. Until then the console's `DDTV.current.modelGallery.adapter.report()` lists them as `unlisted` (new) or `stale` (replaced; they are left out of the gallery, never shown broken).

Never type an image address by hand: the tool copies the addresses Ecwid returned, and an address of one size cannot be worked out from another.

## Step 8. Check on real devices: E4 (Owner or tester)

A real iPad (portrait and landscape; if possible two sizes) and a real iPhone, in Safari:

- iPad: chapter taps, the monitor's internal scrolling, tapping choices, rotating while a chapter is open, the Optimised Preview / Standard Product View switch, **View Model Gallery** (open, swipe, thumbnails, close, rotate while it is open).
- Videos: the muted loops start by themselves; the full video opens inside the monitor and plays with sound on tap; the seven-zone video plays.
- Cover photos and video thumbnails load from `media.divinedunlop.com`.
- iPhone, both orientations: no television, no view switch, no View Model Gallery button, the complete standard page with the store's own gallery, no sideways scroll.
- The store's controls and Add to Bag work as before.

## Step 9. Rollback (Owner)

- Instant for a visitor: add `?ddtv=off` to the address. The engine does not even start.
- For everyone: remove the one loader line. The television disappears; the description stays as pasted.
- Restore the description from the step 0 backup if needed.

## Step 10. Going live is a separate approval

Only after the owner approves, and not before the open decisions below are settled:

1. Put the approved description on the live product (a store change).
2. Add `831592302` to `productIds` in `products/botanic.config.js`, rebuild (`node tools/build-embed.mjs`), upload, re-run steps 3 and 7 for the live product.

## Decisions that are still open (Owner)

1. **Placement:** `layout.placement` is `'top'` (the monitor starts at the top of the column, covering the space above the options) or `'size'` (the top row of chapter buttons starts level with SIZE; a roughly 300 px empty band remains above it). The two instructions conflict; `'top'` is the default.
2. **Firmness ranges:** 83 kg is in both Medium and Firm on the homepage; the approved Firmness page was not available; the store's options say 48–85 / 85–110 / over 120 kg (110–120 kg has no option). Stone values for Medium and Firm are not shown until an approved source gives them.
3. **Subresource Integrity:** on or off (off by default).
4. **Brand logo:** the wordmark "Divine DunlopDreams" is used until a logo file is supplied.
5. **Empty left column in the stacked placement (iPad portrait):** hiding the store's gallery leaves its place beside the options empty, because Ecwid's layout cannot be restyled. Accept it, or decide on another arrangement (`docs/GALLERY-ARCHITECTURE.md`, 2.4 and 5).
6. **Unlisted images:** with a manifest, an image uploaded in Ecwid stays out of the model gallery until it is classified (default), or is shown at once (`unlisted: 'show'`).
