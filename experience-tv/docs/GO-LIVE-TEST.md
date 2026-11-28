# Putting the Botanic Experience on the test product (876405767)

> **The one package (22 Nov).** `node tools/build-package.mjs` builds everything and writes `dist/botanic-ddtv-package.zip`: the folder
> `upload/ddtv/` (five files), `paste/1-loader.txt`, `paste/2-description.html` and `PASTE-ME.html` (both blocks with a Copy button
> each, and the steps in Bulgarian). The owner uploads one folder and pastes two blocks; nothing is assembled or chosen. For the live
> product, or another host: `node tools/build-package.mjs --products=831592302 --base=https://HOST/ddtv/` (everything below then
> applies with those values).

Everything below is prepared and tested locally on the real Ecwid page (E2: nothing saved). These steps need the owner's access.
The live product 831592302 is not touched: the loader and both files start **only** on 876405767.

Files (built by `node tools/build-phone.mjs && node tools/build-experience.mjs`, all in `dist/experience/`):

| File | What it is | Where it goes |
|---|---|---|
| `botanic-tv.js` | the television (tablets, laptops, monitors) | upload to `https://media.divinedunlop.com/ddtv/` |
| `botanic-tv-logos.js` | the certificate logos (loaded when Certifications is opened) | the same folder |
| `botanic-cup.webp` | the cup picture under Add to Bag | the same folder |
| `botanic-mattress.webp` | the photograph of the mattress in Your selection (23 Nov) | the same folder |
| `botanic-phone.js` | the phone layer (guided configuration, approved palette) | the same folder |
| `loader.html` | ~1 300 characters | Ecwid admin → Website → Advanced website settings → **Custom JavaScript code** → Add code |
| `botanic-description.html` | the approved description (only change: "Organic Natural" → "Organic") | product 876405767 → Description → **HTML mode (`<>`)**, replace everything |

`MANIFEST.txt` and `MANIFEST-phone.txt` give each file's size and sha256.

## Steps

1. **Upload the five files** to `media.divinedunlop.com/ddtv/` (the same server as the videos). Check one of them:
   `curl -sI https://media.divinedunlop.com/ddtv/botanic-tv.js` → `200`, `content-type: application/javascript` (or `text/javascript`).
   Compression saves about three quarters of the download: in nginx, `gzip on; gzip_types application/javascript text/javascript;`.
2. **Paste the loader** (`loader.html`, the whole text with its `<script>` tags) into Custom JavaScript code and save.
   It downloads nothing on any page except product 876405767. `?ddtv=off` on any address switches it off for that view.
3. **Paste the description** into product 876405767 in HTML mode, replacing the old prototype completely (the old one is backed up in
   `docs/ecwid-backup/`). The product stays disabled. (The bridge cannot write it: it takes descriptions up to 100 000 characters and
   the approved one has 141 654.)
4. **Make it reachable for the test**: either Ecwid's own preview of the disabled product, or (so that the automated E3 checks can run
   on it from here) take it out of the category "Latex Mattresses Collection" and enable it. Enabled but in no category, customers do
   not find it in the shop.
5. Tell me, and the E3 checks run on the product's real address: the television on a laptop and an iPad size, the phone layer on an
   iPhone size, the four choices both ways, Ecwid's price, no cart request, the description complete and indexable.

## Undo

Remove the loader from Custom JavaScript code: the page is exactly as before (the description stays the approved one). For one view
only: add `?ddtv=off` to the address.

## After the test: the live product

Only on the owner's word: the product list becomes `[831592302]` in `tools/build-experience.mjs` and `tools/build-phone.mjs`, both are
rebuilt, the two files are uploaded again (new `?v=` in the loader), the loader is replaced, and the live description gets the same
single correction. The canary (`tests/live/canary.sh`) runs before and after.
