# Divine DunlopDreams Collection 2.0.0 — installation and rollback

Nothing below is done yet on the live store. Steps 1–2 are safe tests; steps 3–6 wait for Martin's approval.
Pinned commit for every jsDelivr URL: `c87cdae0717d2e32d392f08f69848dabe6df580e` (written into every file in `ecwid/` by the build).

## 0. Files
| File | Where it goes |
|---|---|
| `ecwid/description-mattress-2.0.0.html` | Latex Mattresses Collection → Description → `<>` |
| `ecwid/description-topper-2.0.0.html` | Latex Toppers Collection → Description → `<>` |
| `ecwid/loader-2.0.0.html` (or `loader-2.0.0.js` if the field wants code without `<script>` tags) | Site-wide custom code (once) |
| `ecwid/probe-2.0.0.html`, `ecwid/probe-loader-2.0.0.html` | Phase-1 test only |
| `release/2.0.0/` | Served by jsDelivr from the pinned commit: `ddc.css`, `ddc.js`, `assets/t-partners-sides.webp`, probe files |
| Pictures and Chillax | Reused from Hero 1.17.1 at its pinned commit `57479ca` (no copies) |

## 1. Back up both descriptions first
Follow `backup/README.md`: copy the exact HTML of each live description (`<>` mode, select all, copy, close without saving) into `backup/*-SOURCE.html`.

## 2. Phase-1 probe (safe, on a test category)
1. Catalog → Categories → **Add category** "DDC test (temporary)". No products. Do not add it to any menu.
2. Description → `<>` → paste all of `ecwid/probe-2.0.0.html` → **Save**.
3. Open the category on the storefront (desktop, then iPad, then phone): take a screenshot of the table. Green = works.
4. Back in the admin, reopen Description → `<>` → copy everything → send it to me (shows what Ecwid kept, removed or rewrote).
5. Optional (test 18): add `ecwid/probe-loader-2.0.0.html` to the site-wide custom code, reload the test category, screenshot row 18, then **remove** the probe loader again.
6. Delete or disable the test category.

## 3. Site-wide loader (after the probe, with approval)
Instant Site → Settings → the site-wide **custom JavaScript / custom code** field (the one with the 4,000-symbol limit; the exact menu name in your Ecwid version to be confirmed) → paste `ecwid/loader-2.0.0.html` (527 characters) → Save / Publish.
It loads `ddc.css` (21 KB, cached for a year) and `ddc.js` (4 KB). Pages without the collection interface are not changed: every rule is scoped to `.ddc`, and the script only acts on `.ddc`.

## 4. Test before replacing anything
Paste `ecwid/description-mattress-2.0.0.html` into the **test category** description first, check desktop, iPad (portrait and landscape, with touch) and phone, navigate away and back, use the browser Back button, reload the page directly. Then the same with the topper file.

## 5. Replace the live descriptions (only with Martin's approval)
1. Latex Mattresses Collection → Description → `<>` → select all → paste `ecwid/description-mattress-2.0.0.html` → Save.
2. Latex Toppers Collection → same with `ecwid/description-topper-2.0.0.html`.
3. The native product grid stays below the new interface.

## 6. Avoiding the duplicated grid (proposal, after approval only)
When everything in the brief's checklist is confirmed live (all models, links, fallback, mouse, keyboard, touch, navigation, direct load), the safest options are:
1. **Keep the grid** but fix its prices (CAPABILITY-REPORT §4): customers still see the cards they know; least risk.
2. **Hide the grid on these two categories only** with `ecwid/proposal-hide-native-grid.NOT-ACTIVE.css` (fill in the two category ids; add to the site-wide CSS or the loader). Product pages, search, cart, checkout, reviews, other categories and the homepage are untouched.

## 7. Rollback
| What | How | Effect |
|---|---|---|
| Descriptions | Paste `backup/*-SOURCE.html` back into each Description (`<>`) and Save | Old text back immediately |
| Loader | Delete the snippet from the site-wide custom code | Interface falls back to plain readable HTML (still all links); remove the descriptions too for a full rollback |
| A newer version misbehaves | Point the loader back to the previous pinned commit / version folder | Releases are immutable: `release/<version>/` is never edited |
| Hero 1.17.1 | Not involved: nothing in this project touches `divine-hero/` or the homepage section |

## 8. Updating
Edit `src/` (copy in `src/data.mjs`), run `node build.mjs` and `node tests/interaction.mjs`, bump `VERSION` in `build.mjs` and `src/ddc.js` for a new `release/<version>/`, commit, then rebuild with `DDC_REF=<commit sha> node build.mjs` so every URL is pinned, and commit again.
