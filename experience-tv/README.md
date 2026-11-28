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
| `engine/ddtv-assets.js`, `engine/ddtv-model.js` | The **Visual Asset Registry** (data about assets; Ecwid owns the photographs) and the **model descriptor** with the contracts between the subsystems. |
| `schema/ddtv-schema.js` | The schemas and validation rules (model config, asset registry, contextual visual, models index), one dependency-free module for Node and the browser. Reference: `docs/SCHEMA-REFERENCE.md` (generated). |
| `products/models.json` | The models index: which models exist, their status, where they may run, whether any is authorised. **No model is authorised for deployment.** |
| `products/profiles/` | The store profile (`divine-store`): the Ecwid theme's layout, price and gallery selectors, shared by every model that `extends` it. |
| `products/examples/`, `source/examples/` | A **non-production placeholder model** (invented data) that proves a second model runs on the same engine. Never part of a production build. |
| `tools/validate-model.mjs`, `tools/new-model.mjs`, `tools/asset-registry.mjs`, `tools/build-example.mjs`, `tools/schema-docs.mjs` | Validate a model (structure, semantics, cross-model integrity, selectors against its own description), scaffold a new one, migrate/check a registry, build the placeholder page, generate the schema reference. See `docs/ONBOARDING-NEW-MODEL.md`. |
| `docs/ARCHITECTURE-MULTI-MODEL.md`, `docs/ONBOARDING-NEW-MODEL.md`, `docs/SCHEMA-REFERENCE.md` | The multi-model architecture (audit, engine design, schemas, contracts, reuse proof, roadmap, risks, decisions), the onboarding procedure, and the generated schema reference. |
| `products/botanic.media.js` | Media manifest for the product (images stay in Ecwid; this is data about them). `null` for now: the gallery then shows the product's own gallery images. |
| `tools/media-manifest.mjs` | Drafts or merges a manifest from a product export. Copies the addresses Ecwid returned; never invents one. |
| `tests/gallery.mjs` | 174 checks of the gallery integration on a simulated store with the real gallery markup and real image records, a fake storefront endpoint and a synthetic MP4 (needs `ffmpeg` for the media checks; without it they are reported as SKIP, not as passes). |
| `docs/IMPLEMENTATION-REPORT.md` | The consolidated report: what existed, what changed, how images are sourced, how the native gallery is isolated and restored, how configuration is preserved, which tests were simulated and which real, and the release blockers. |
| `docs/GALLERY-ARCHITECTURE.md` | The existing architecture, the real Ecwid gallery, feasibility, the mechanism, owner decisions, the test plan and the verified results. |
| `tests/live/` | Read-only checks against the **public** live store's real DOM and runtime (local browser, nothing saved). `gallery-e2.cjs` and `restore-e2.cjs` cover the gallery integration and the restoration of Standard Product View (39 checks each). See its README. |
| `docs/AUDIT-EMBED.md`, `docs/TEST-MATRIX.md`, `docs/DEPLOYMENT.md` | Audit of the embed files, what was verified where (and what was not), and the step-by-step deployment to the test product. |
| `docs/mobile/MOBILE-OPTIMISATION-STUDY.md` | **Study (not implemented, awaiting approval):** the phone, tablet and desktop optimisation audit, the content architecture, three phone design previews (`docs/mobile/options/`, screenshots in `docs/mobile/shots/`), the measured baseline (`docs/mobile/data/`), the recommendation, the roadmap and the owner's decisions. Tools: `tests/live/baseline.cjs`, `tests/live/engine-cost.cjs`, `tools/audit-description.mjs`, `tools/mobile-prototypes.mjs`, `tools/mobile-shots.mjs`. |
| `docs/mobile/premium/PREMIUM-MOBILE-PROPOSAL.md` | **Proposal (not implemented, awaiting approval):** the premium phone experience and guided configuration: refined Variant C hierarchy, three concepts, an integrated preview (`docs/mobile/premium/preview/`), the Ecwid synchronisation architecture (proof on the real page, E2), the loader gate (tested), the resource plan, the investigations (zero-price structured data, duplicate DOM, firmness consistency), the staged plan and the owner's questions. Tools: `tools/build-premium-preview.mjs`, `premium-shots.mjs`, `premium-measure.mjs`, `premium-content-check.mjs`, `firmness-consistency.mjs`, `media-probe.mjs`; tests: `tests/loader-gate.mjs`, `tests/live/{sync-poc,options-probe,duplicate-dom-probe,duplicate-dom-interactive,structured-data-probe}.cjs`. |
| `docs/mobile/premium/GRAPHITE-SIZE-SELECTOR.md` | The Graphite Blue mobile configurator following the owner's size-selector reference: one screen per step, four side pillars, the price from Ecwid, the mattress SVG (`docs/mobile/premium/assets/`). Preview: `docs/mobile/premium/preview/graphite.html`. Tools: `tools/graphite-shots.mjs`, `tools/trace-mattress.py`, `tools/build-mattress-svg.mjs`; test: `tests/live/size-prices-e2.cjs`. |
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
node tools/build-example.mjs && NODE_PATH=$(npm root -g) node tests/model-reuse.mjs      # the multi-model architecture
NODE_PATH=$(npm root -g) node tools/validate-model.mjs --source-check                  # every model: schema, semantics, selectors
```

These suites run against the stand-in page or a simulated Ecwid, in Chromium. They are **not** a verification of the real
Ecwid store or of Safari; `docs/TEST-MATRIX.md` says exactly what was and was not verified, and where.
`tests/live/gallery-e2.cjs` is the exception in kind (the real Ecwid gallery of the public product, injected locally and
read-only), but it is still not the test product and not a real device.

The two views are called **Optimised Preview** (the television; the store's own gallery is hidden, not removed) and
**Standard Product View** (the original page and gallery). `?ddtv=standard` / `classic` and `?ddtv=optimised` / `interactive` select them.

## Add another mattress

Do not copy Botanic. Run `node tools/new-model.mjs <id> --name "NAME" --product-id <TEST product id>` and follow
`docs/ONBOARDING-NEW-MODEL.md`: a model is configuration and approved content (its config, its description, its asset
registry) on the shared engine, scene library and store profile. The shared engine is not edited for a model: a model
that needs something else uses a documented extension mechanism (`docs/ARCHITECTURE-MULTI-MODEL.md`, 3.3). Nothing is
deployed without the owner's explicit approval.