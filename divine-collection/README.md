# Divine DunlopDreams Collection

One-screen orientation and comparison map for the **Latex Mattresses Collection** and **Latex Toppers Collection** category pages, placed in each category's Ecwid **Description** field (`<>` HTML mode), above the native product grid. Independent of Hero 1.17.1 (`../divine-hero/`), which is not modified.

- Research, capability table, data verification, open questions: [`CAPABILITY-REPORT.md`](CAPABILITY-REPORT.md)
- Installation and rollback: [`INSTALL.md`](INSTALL.md)
- Tests and results: [`TEST-REPORT.md`](TEST-REPORT.md)
- Versions: [`CHANGELOG.md`](CHANGELOG.md)

## What the visitor sees (2.0.0)
- **Top:** the question "Which 100% latex mattress is right for you?" and the selection path *Pick your model → set size, firmness, thickness & cover → buy*, always visible.
- **The whole collection on one screen:** families side by side, each named and underlined in its own colour, every model a picture tile with its name and one key line. Mattresses: 4 columns × 2 rows (Classic Premium & Essential, Innovative Premium Comfort / Orthopaedic Firmness, Partners, Best Value). Toppers: 3 columns × 1 row. Phones: one column of compact picture rows.
- **Every tile is a real link** to the model page (direct entrance).
- **Hover** (keyboard focus, tap on touch) opens a floating card beside the tile, not a full panel: what the model is, who it suits, firmness and depths, and the clear message that you buy on the model page (choose size, firmness, depth and cover there), with a *View model* button. On phones the card is a bottom sheet with the button always in view.

## How it works
| Layer | Lives in | Without the next layer |
|---|---|---|
| Semantic HTML: question, path, families, tiles with pictures and links, the card text of every model | Category Description (`ecwid/description-*.html`) | A readable document with all links (and all text for search engines) |
| `ddc.css` (namespace `.ddc`, container queries, `!important` against Ecwid's id-prefixed storefront CSS) | jsDelivr, loaded by the site-wide loader | The full one-screen map; tiles are links |
| `ddc.js` (4 KB, vanilla) | jsDelivr, loaded by the site-wide loader | Hover / focus / tap cards; re-initialises after Ecwid page changes |

Interaction: hover opens a card after 120 ms (no flicker crossing tiles), a click on the tile goes straight to the model page, Escape closes, Tab reaches *View model*. Touch: first tap opens the card, second tap on the tile or *View model* opens the model page, a tap elsewhere closes.

## Directory
```
divine-collection/
  build.mjs                 build + content guards (8 / 3 models, links, no prices, no gendered words, no "No layers", no approximations)
  src/data.mjs              all copy and verified product data (edit here)
  src/ddc.css, src/ddc.js   sources
  src/assets/               t-partners-sides.webp (the only new picture)
  src/probe/                Phase-1 capability probe sources
  release/<version>/        built, immutable: ddc.css, ddc.js, assets/, probe.css, probe.js (1.0.0 and 1.1.0 kept for rollback)
  ecwid/                    paste-ready: two descriptions, loader (.html / .js), probe, probe loader, grid-hiding proposal (not active)
  backup/                   live description text 2026-10-10 + slots for the exact source copies
  preview/                  local fragments + sim.html (Ecwid category imitation)
  tests/                    make-sim, interaction (292 checks), shots, make-artifact, lib
  reports/                  screenshots
```

## Build and test
```
npm i esbuild@0.24.0 axe-core@4.10.2   # playwright with Chromium is preinstalled in this environment
node build.mjs && node tests/make-sim.mjs
python3 ../divine-hero/tests/serve.py 8790 &   # from the repository root
node tests/interaction.mjs && node tests/shots.mjs
```
