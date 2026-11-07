# Divine DunlopDreams — Experience TV Engine

A reusable, interactive "television" for product pages. Botanic is the first
reference model. The engine re-arranges the **existing** product description into
chapters and screens beside the native Ecwid options, without copying or losing any
content, and puts everything back for Classic View.

> Prototype for review. Nothing here has been published to the store. The live
> Botanic product (831592302) is not referenced by the engine at all.

## What's here

| Path | What it is |
|---|---|
| `source/botanic-original-description.html` | Original description, verbatim. Single source of content. |
| `products/botanic.config.js` | Everything specific to Botanic: chapters, screens, option matching, sync rules, media registry. |
| `engine/ddtv-engine.js` / `.css` | Shared engine, no dependencies, ES5, all styles scoped. |
| `prototype/template.html` | Mock Ecwid product page used for testing (not shipped). |
| `tools/build.mjs` | Builds `dist/botanic-experience-tv-demo.html`, one self-contained file. |
| `tests/smoke.mjs` | 99 automated checks across desktop, iPad, iPhone, including alignment, a pinned selection and that the Ecwid options column is untouched. |
| `docs/MASTER-PLAN.md` | Inventory, chapter matrix, media registry, architecture, layout plan, risks. **Read this first.** |

## Try it

```bash
node tools/build.mjs
open dist/botanic-experience-tv-demo.html      # or double-click it
```

Site preview (any static server):

```bash
cd dist && python3 -m http.server 8765      # then open http://localhost:8765
```

Choose options on the right and watch the TV respond. URL switches:
`?ddtv=classic` (start in Classic View), `?ddtv=off` (engine disabled).

## Test

```bash
node tools/build.mjs
NODE_PATH=$(npm root -g) node tests/smoke.mjs [screenshot-folder]
```

## Add another mattress

Create `products/<model>.config.js` with the model's chapters and `take` selectors,
option rules and media registry. The engine needs no changes for a different number of
chapters.
