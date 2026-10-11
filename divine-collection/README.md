# Divine DunlopDreams Collection

One-screen orientation and comparison map for the **Latex Mattresses Collection** and **Latex Toppers Collection** category pages, placed in each category's Ecwid **Description** field (`<>` HTML mode), above the native product grid. Independent of Hero 1.17.1 (`../divine-hero/`), which is not modified.

- Research, capability table, data verification, open questions: [`CAPABILITY-REPORT.md`](CAPABILITY-REPORT.md)
- Installation and rollback: [`INSTALL.md`](INSTALL.md)
- Tests and results: [`TEST-REPORT.md`](TEST-REPORT.md)
- Versions: [`CHANGELOG.md`](CHANGELOG.md)

## What the visitor sees (3.2.0)
- **Top:** the question "Which 100% latex mattress is right for you?" and the selection path *Pick your model → set size, firmness, thickness & cover → buy*, always visible.
- **The whole collection on one screen:** families side by side, each named and underlined with a thin line in its own colour: **Premium** (Botanic, Botanic Dual Plush), **Essential** (Bio Comfort, Bio Comfort Dual Plush), **Orthopaedic**, **Partners**, **Best Value**. Mattresses: 4 columns × 2 rows; toppers: 3 × 1; phones: mattresses two blocks per row, toppers three wide rows.
- **Every model is a rounded cube** (cubism): picture cube, outlined family label, the name and one key line, a thin family-colour edge (кант) along the top, and a **Buy now** button on the picture. The whole tile, the small picture and the button are real links to the model page.
- **Hover** (keyboard focus; tap on the name band on touch) opens a large floating card beside the tile: picture, what the model is, who it suits, firmness and depths, "You buy on the model page: choose your size, firmness, depth and cover", and **Buy now**. On phones it is a bottom sheet with Buy now always in view.

## How it works
| Layer | Lives in | Without the next layer |
|---|---|---|
| Semantic HTML: question, path, families, tiles with pictures and links, the card text of every model | Category Description (`ecwid/description-*.html`) | A readable document with all links (and all text for search engines) |
| `ddc.css` (namespace `.ddc`, container queries, `!important` against Ecwid's id-prefixed storefront CSS) | jsDelivr, loaded by the site-wide loader | The full one-screen map; tiles are links |
| `ddc.js` (4 KB, vanilla) | jsDelivr, loaded by the site-wide loader | Hover / focus / tap cards; re-initialises after Ecwid page changes |

Interaction: hover opens a card after 120 ms (no flicker crossing tiles), a click on the tile, the picture, Buy now or the card goes straight to the model page, Escape closes, Tab reaches the tile's Buy now and the card's. Touch: a tap on the picture or Buy now opens the model page; a first tap on the name band opens the card, a second tap or its Buy now opens the model page; a tap elsewhere closes.

## Directory
```
divine-collection/
  build.mjs                 build + content guards (8 / 3 models, links, no prices, no gendered words, no "No layers", no approximations)
  src/data.mjs              all copy and verified product data (edit here)
  src/ddc.css, src/ddc.js   sources
  src/assets/               t-partners-sides.webp (the only new picture)
  src/probe/                Phase-1 capability probe sources
  release/<version>/        built, immutable: ddc.css, ddc.js, assets/, probe.css, probe.js (1.0.0, 1.1.0 and 2.0.0 kept for rollback)
  ecwid/                    paste-ready: two descriptions, loader (.html / .js), probe, probe loader, grid-hiding proposal (not active)
  backup/                   live description text 2026-10-10 + slots for the exact source copies
  preview/                  local fragments + sim.html (Ecwid category imitation)
  tests/                    make-sim, interaction (321 checks), shots, make-artifact, lib
  reports/                  screenshots
```

## Build and test
```
npm i esbuild@0.24.0 axe-core@4.10.2   # playwright with Chromium is preinstalled in this environment
node build.mjs && node tests/make-sim.mjs
python3 ../divine-hero/tests/serve.py 8790 &   # from the repository root
node tests/interaction.mjs && node tests/shots.mjs
```
