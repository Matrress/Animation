# Divine DunlopDreams Collection

Orientation and comparison interface for the **Latex Mattresses Collection** and **Latex Toppers Collection** category pages, placed in each category's Ecwid **Description** field (`<>` HTML mode), above the native product grid. Independent of Hero 1.17.1 (`../divine-hero/`), which is not modified.

- Research, capability table, data verification, open questions: [`CAPABILITY-REPORT.md`](CAPABILITY-REPORT.md)
- Installation and rollback: [`INSTALL.md`](INSTALL.md)
- Tests and results: [`TEST-REPORT.md`](TEST-REPORT.md)

## How it works
| Layer | Lives in | Without the next layer |
|---|---|---|
| Semantic HTML: question, selection path, family map with every model as a real link, one preview per model | Category Description (`ecwid/description-*.html`) | A readable document with all links |
| `ddc.css` (namespace `.ddc`, container queries, `!important` against Ecwid's id-prefixed storefront CSS) | jsDelivr, loaded by the site-wide loader | Split layout, family map, hover / keyboard previews via CSS `:has`, rows open the model page |
| `ddc.js` (6 KB, vanilla) | jsDelivr, loaded by the site-wide loader | Click locks a model, "Back to the overview", detail under the row on narrow screens, stable height, arrow keys, chosen model restored after browser Back |

Family map: one row per family, two picture cards per row (a family with one model gets a note beside it), every row underlined in its own colour and named. Interaction: hover previews after 110 ms (no flicker crossing rows), keyboard focus previews, click or tap locks, leaving the component returns to the locked model or the overview. The family map and the selection path stay visible in every state. From 860 px of description width: map left, stage right; below: the detail opens right after the chosen row.

## Directory
```
divine-collection/
  build.mjs                 build + content guards (8 / 3 models, links, no prices, no gendered words, no "No layers", no approximations)
  src/data.mjs              all copy and verified product data (edit here)
  src/ddc.css, src/ddc.js   sources
  src/assets/               t-partners-sides.webp (the only new picture)
  src/probe/                Phase-1 capability probe sources
  release/1.1.0/            built, immutable: ddc.css, ddc.js, assets/, probe.css, probe.js
  ecwid/                    paste-ready: two descriptions, loader (.html / .js), probe, probe loader, grid-hiding proposal (not active)
  backup/                   live description text 2026-10-10 + slots for the exact source copies
  preview/                  local fragments + sim.html (Ecwid category imitation)
  tests/                    make-sim, interaction (153 checks), shots, make-artifact, lib
  reports/                  screenshots
```

## Build and test
```
npm i esbuild@0.24.0 axe-core@4.10.2   # playwright with Chromium is preinstalled in this environment
node build.mjs && node tests/make-sim.mjs
python3 ../divine-hero/tests/serve.py 8790 &   # from the repository root
node tests/interaction.mjs && node tests/shots.mjs
```
