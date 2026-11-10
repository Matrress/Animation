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
| `products/botanic.config.js` | Everything specific to Botanic: chapters, which scene each screen uses, where its content is in the source, option matching, media registry, what is deliberately not shown. |
| `engine/ddtv-engine.js` / `.css` | Shared shell: navigation, Ecwid connector (reads and drives the native options, reads the price), media, views. |
| `engine/ddtv-scenes.js` / `.css` | Shared scene library: turns the description's content into screens made for the monitor. |
| `prototype/template.html` | Offline stand-in for the Ecwid product page (class names, option titles and texts copied from the live store's DOM). For development and tests; it is **not Ecwid**. |
| `tools/build.mjs` | Builds `dist/botanic-experience-tv-demo.html`, one self-contained file. |
| `tools/build-embed.mjs` | Builds `dist/embed/`: `botanic-tv.js` (one self-starting file), the loader and tag snippets, `botanic-description.html`, a manifest with hashes, and an offline test page with a **simulated** Ecwid. |
| `tools/compare-description.mjs` | Compares the raw description exported from the Ecwid API with the source and says where they differ. |
| `tests/smoke.mjs` | 104 checks on the stand-in page: every source text is on a screen, choices made in the TV reach the native dropdowns, the column is untouched, no pills or circles. |
| `tests/embed.mjs` | 175 checks of the store embed on a **simulated** Ecwid: product guard, repeated and missed events, navigation, rotation, ten iPad sizes, phones, Add to Bag (simulated), both placement modes. |
| `engine/ddtv-gallery.js` / `.css` | The **gallery integration**: a reusable image adapter (normalises Ecwid's own image data and an optional per-product manifest), the *View Model Gallery* button and the gallery inside the monitor. Loaded as an engine extension (`DDTV.use`). |
| `products/botanic.media.js` | Media manifest for the product (images stay in Ecwid; this is data about them). `null` for now: the gallery then shows the product's own gallery images. |
| `tools/media-manifest.mjs` | Drafts or merges a manifest from a product export. Copies the addresses Ecwid returned; never invents one. |
| `tests/gallery.mjs` | 174 checks of the gallery integration on a simulated store with the real gallery markup and real image records, a fake storefront endpoint and a synthetic MP4 (needs `ffmpeg` for the media checks; without it they are reported as SKIP, not as passes). |
| `docs/IMPLEMENTATION-REPORT.md` | The consolidated report: what existed, what changed, how images are sourced, how the native gallery is isolated and restored, how configuration is preserved, which tests were simulated and which real, and the release blockers. |
| `docs/GALLERY-ARCHITECTURE.md` | The existing architecture, the real Ecwid gallery, feasibility, the mechanism, owner decisions, the test plan and the verified results. |
| `tests/live/` | Read-only checks against the **public** live store's real DOM and runtime (local browser, nothing saved). `gallery-e2.cjs` and `restore-e2.cjs` cover the gallery integration and the restoration of Standard Product View (39 checks each). See its README. |
| `docs/AUDIT-EMBED.md`, `docs/TEST-MATRIX.md`, `docs/DEPLOYMENT.md` | Audit of the embed files, what was verified where (and what was not), and the step-by-step deployment to the test product. |
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
node tools/build.mjs && node tools/build-embed.mjs
NODE_PATH=$(npm root -g) node tests/smoke.mjs [screenshot-folder]
NODE_PATH=$(npm root -g) node tests/embed.mjs
NODE_PATH=$(npm root -g) node tests/gallery.mjs
```

These suites run against the stand-in page or a simulated Ecwid, in Chromium. They are **not** a verification of the real
Ecwid store or of Safari; `docs/TEST-MATRIX.md` says exactly what was and was not verified, and where.
`tests/live/gallery-e2.cjs` is the exception in kind (the real Ecwid gallery of the public product, injected locally and
read-only), but it is still not the test product and not a real device.

The two views are called **Optimised Preview** (the television; the store's own gallery is hidden, not removed) and
**Standard Product View** (the original page and gallery). `?ddtv=standard` / `classic` and `?ddtv=optimised` / `interactive` select them.

## Add another mattress

Create `products/<model>.config.js` with the model's chapters, a scene per screen and the selectors of its content,
option rules and media registry. The engine needs no changes for a different number of
chapters.
