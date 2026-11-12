# Divine Product TV: multi-model architecture

Status of this document: permanent. It records the owner's brief of 2026-11-10 ("Unified Interactive Experience, Visual Asset Management and Multi-Model Architecture") and says, for every part of it, what exists, what was built in this phase, what is only prepared, what is planned and what has not been verified. Production deployment is **not authorised**; nothing here changes a live product.

**Final architectural principle.** BOTANIC is the reference implementation. Divine Product TV is the reusable engine. Each mattress model provides its own verified configuration, media and technical content. Ecwid remains the source of truth for commerce. Divine Product TV is the unified interactive layer for presentation, education, visualisation and, in time, product configuration. *Build once, configure per model, validate individually and deploy only with explicit approval.*

## Status labels used in this document

| Label | Meaning |
|---|---|
| **[IMPLEMENTED]** | Existed before this phase, working and tested. |
| **[THIS PHASE]** | Built and tested during this phase. |
| **[PREPARED]** | The interface, schema and validation exist; nothing in the product uses it yet (no screen, no behaviour). |
| **[PLANNED]** | Designed here, not built. |
| **[NOT VERIFIED]** | A claim that has not been observed (real devices, a real second product, the live store). |

Evidence levels are the project's: **E1** simulated store page, **E2** the real Ecwid DOM of the public product (local, read-only), **E3** the real test product (not done), **E4** real Safari and devices (not done). Everything new in this phase is E1.

## Where the 14 required deliverables are

| # | Deliverable (from the brief) | Section |
|---|---|---|
| 1 | Current architecture audit | 2 |
| 2 | Shared engine design | 3 |
| 3 | Product model configuration schema | 4 and `docs/SCHEMA-REFERENCE.md` |
| 4 | Model adapter contract | 5 and 7 |
| 5 | Visual Asset Registry schema | 9 and `docs/SCHEMA-REFERENCE.md` |
| 6 | Contextual visualisation contract | 10 (and 11) |
| 7 | Future configuration synchronisation contract | 12 |
| 8 | Lifecycle and mode-switching design | 13 (and 8.1) |
| 9 | New-model onboarding procedure | `docs/ONBOARDING-NEW-MODEL.md` |
| 10 | Reusability demonstration | 17 |
| 11 | Testing and validation requirements | 18 |
| 12 | Implementation roadmap | 19 (and 6) |
| 13 | Remaining technical risks | 21 (and 2.3) |
| 14 | Decisions requiring owner approval | 20 |

## 1. What is and is not authorised in this phase

Done: architecture preparation, a reusable engine, a visual asset registry (data structure, validation, extension points), a model onboarding process, a non-production second model. **Not done, by instruction:** deploying to the live store; modifying any other live product; rebuilding the gallery; a checkout or pricing engine; the size selector; the asset dashboard; redesigning any product; unsupported configurations; changing the phone experience. None of these was touched. The gallery code is unchanged except that its image source can now also be a registry (section 8).

---

## 2. Current architecture audit  [THIS PHASE: the audit]

### 2.1 What the code is, by layer

| Layer | Files | Lines | Reusable across models? |
|---|---|---|---|
| Core engine | `engine/ddtv-engine.js`, `.css` | 1561 / 599 | Yes. Lifecycle, product guard, views, mode switching, native gallery isolation, the connector to Ecwid's options and price, media, the shell. |
| Scene library | `engine/ddtv-scenes.js`, `.css` | 1008 / 570 | **Partly.** Generic scenes (hero, facts, points, reader, choose, result, summary, numerals) yes; concept-shaped scenes (zones, compare, the firmness scale, height slabs, cover swatches) only for options of the same kind. |
| Model gallery | `engine/ddtv-gallery.js`, `.css` | 720 / 219 | Yes. |
| Asset registry, model descriptor | `engine/ddtv-assets.js`, `engine/ddtv-model.js` | 137 / 133 | Yes. |
| Store profile | `products/profiles/divine-store.profile.js` | 48 | Per store theme (the Divine store), not per mattress. |
| Model | `products/<model>.config.js`, `.assets.js`, the description | Botanic: 396 / 288 / 4714 | No, by definition. |
| Tooling | `tools/*`, `schema/*` | | Mostly (see 2.3). |

### 2.2 What was model-specific inside shared code, and what was done  [THIS PHASE]

Found by the audit (a scan of the shared files, then by running a second model on them):

| Found | Where | Resolution |
|---|---|---|
| The scene library read the description through **Botanic's own class names** (`.b-drow`, `.b-ocard__*`, `.b-mtv__*`, `.b-sh__*`, `.b-cover-menu__tag`, `.d-body` …), scattered through about 20 lines. A model written in other markup would have shown nothing, silently. | `ddtv-scenes.js` | Collected into **one named table, the content dialect** (`DDTV.dialect`, 32 roles), overridable per model (`dialect: { … }` in its config). The default is Botanic's markup. A test fails if any such name appears outside the table. |
| Options were parsed by **name**: the keys `depth` and `size` triggered centimetre and width×length parsing; the summary screen iterated a fixed list of four option names. | `ddtv-engine.js`, `ddtv-scenes.js` | Option **kind** (`options.<key>.kind`: `size`, `depth`, `firmness`, `cover`, `list`) decides how choices are read and drawn. Without a kind the kind is the key, so Botanic is unchanged. The summary follows the model's own options in its own order. |
| No way to offer a choice that is none of the four (a plain list of levels). | scene library | A generic **`list` kind** (reader, chooser, result): a title, an optional detail line, an optional text; nothing about the product is assumed. |
| The hero screen assumed a video. | `ddtv-scenes.js` | A model with no video gets a hero without a stage. |
| About 60 lines of **store-theme** configuration (layout selectors, price selectors, labels, gallery selectors) would have been copied into every model. | config | A **profile** (`extends: 'divine-store'`): the theme's values live once; the model states only its own. The engine merges them; the merged config keeps its identity (the idempotent start compares products by identity). |
| A model could not bring a scene of its own without editing the library. | engine | `scenes: { name: fn }` in a model config; it wins over a library scene of the same name. |
| Features (the gallery, the stacked layout, the Classic View highlight) were on or off by accident of what the config contained. | engine | `features: { … }`: a feature is on only if the model configures what it needs and does not switch it off. |
| The connector's abilities were implicit. | engine | `ConfigConnector.capabilities()` states them, including what it cannot do (validate a combination, set options atomically, write a price). |

### 2.3 What is still Botanic-specific  (remaining hard-coded dependencies)  [NOT YET RESOLVED]

The complete list, from the audit and from the ratchet test (`tests/model-reuse.mjs`, section 5), which fails if the shared code gains a new one:

**In shared code**

1. **The dialect default** is Botanic's markup (30 tokens, all inside `DIALECT_DEFAULT`). Intentional and overridable; but it means "the house markup" is today "Botanic's markup". Decision in section 20.
2. **Concept-shaped scenes.** `VISUALS.scale` / `RESULTS.firmness` read weight ranges (`kg`, `st`) from text; `VISUALS.slabs` / `RESULTS.height` assume centimetres and `coverAddsCm`; `VISUALS.swatches` / `RESULTS.cover` / `scenes.compare` assume a texture photo, a short name, a micro-tab and a menu; `scenes.zones` assumes seven zones and a `zonesSvg`. They are correct for an option of that kind. They are not generic.
3. **`READERS.cover`** reads a fixed structure (`strong`, `micro`, `tab`, `menu`, `img`).
4. **CSS:** 3 rules for the Classic View badge name Botanic's classes (`.dd-botanic-page …`, `.b-cover-micro-tabs …`).
5. **`ConfigConnector.normalise`:** `depth` expects two-digit centimetre values; `size` expects `W×L` in the option text.
6. **`chapterFor`** maps description anchors to chapters assuming the source root is an `#id`.
7. **Ecwid theme selectors** (`ECWID.block`, `ECWID.title`, and the whole store profile) were confirmed on the public Botanic page only. They are the Divine store's theme, not Botanic's, but no other product page has been looked at.
8. **Interface text** ("Your selection", "Not chosen yet", "Choose") is English, in the engine. Fine for this store; not localisable.
9. **The summary screen's drawing for an unknown kind** is a plain position marker. It works and it is not polished.

**In tooling**

10. `tools/build-embed.mjs` builds Botanic only (file names `botanic-tv.js`, its config, its test page). A per-model production build from `products/models.json` is planned (section 19).
11. `tests/smoke.mjs` and `tests/embed.mjs` are Botanic content tests (expected), `tools/compare-description.mjs` and `DEPLOYMENT.md` are Botanic procedures.
12. `tools/media-manifest.mjs` defaults its variable name to `botanic`.

---

## 3. Shared engine design  [IMPLEMENTED, extended in this phase]

### 3.1 The responsibilities and where they live

| Responsibility (from the brief) | Implemented by | Interface | Status |
|---|---|---|---|
| **Product Data Adapter**: reads verified Ecwid product information | `ConfigConnector` (native options, current selection, price); the gallery adapter (images: page DOM, storefront records) | `read`, `choose`, `subscribe`, `capabilities`; `snap`, `images`, `report` | **[IMPLEMENTED]**; `capabilities` **[THIS PHASE]** |
| **Model Configuration Resolver**: loads the right model config | `productFor(id)` + `resolveProfile` (the `extends` merge) | `DDTV_PRODUCTS`, `DDTV_PROFILES`, the product guard by Ecwid id | **[IMPLEMENTED]**; the merge **[THIS PHASE]** |
| **Model adapter**: the standard view of a model | `DDTV.model.resolve(product)` | `identity`, `options`, `topics`, `assets`, `visualsFor`, `content`, `presentation`, `features` | **[THIS PHASE]** |
| **Visual Asset Registry** | `engine/ddtv-assets.js`, `DDTV_ASSETS`, `schema/` | `forModel`, `manifestFor`, `resolveVisuals`, `allowed` | **[THIS PHASE]** (data structure, validation, extension points; no dashboard) |
| **Context Resolver**: approved content for a topic and the current state | `DDTV.assets.resolveVisuals`, `model.visualsFor` | see section 10 | **[PREPARED]** (resolves; no screen draws the result) |
| **Presentation Controller** | `Television` + the scene library | `go`, `show`, scenes | **[IMPLEMENTED]** |
| **Configuration Adapter** | `ConfigConnector.choose` / `refresh` | see section 12 | **[IMPLEMENTED]** for the current one-way-at-a-time behaviour; the full contract **[PLANNED]** |
| **Mode Controller** | `Television.setView`, `NativeGallery` | see section 13 | **[IMPLEMENTED]** (verified E1, E2) |
| **Media Controller** | `MediaManager`; the gallery component | `park`, `unpark`, `focus`, `observe` | **[IMPLEMENTED]** |
| **Lifecycle Controller** | `boot`, `start`, `stop`, `destroy`, `recover`, `failSafe` | see section 13 | **[IMPLEMENTED]** |

### 3.2 Data flow

```
Ecwid page (owns images, options, price, cart)
   │  read: native option blocks, price text, the gallery's thumbnails, (once) the storefront product records
   ▼
Product Data Adapter ───────────────┐
   (ConfigConnector, gallery adapter)│
                                    ▼
model config ─► Model Configuration Resolver ─► Model adapter (DDTV.model.resolve)
 + store profile (extends)                          │ identity · options · topics · features · content
 + asset registry (DDTV_ASSETS)                     ▼
                                    Presentation Controller (Television + scenes)
                                       │ dialect (how to read this model's description)
                                       │ kinds   (how to read and draw each option)
                                       ├─► Mode Controller   (Optimised Preview ⇄ Standard Product View, native gallery isolation)
                                       ├─► Media Controller  (loops, the full video, the model gallery)
                                       └─► Configuration Adapter ──► drives the native Ecwid controls (as a customer would)
```

Communication is by **explicit data contracts** (sections 4, 9, 10, 12) and by the page's own DOM events. There is **no network relay, proxy or bypass**; the one extra network call in the whole system is the optional storefront request of the gallery (`GALLERY-ARCHITECTURE.md` 4.3). Any future gateway or bridge is a separate decision (section 8.3).

### 3.3 The extension mechanisms  [THIS PHASE]

A model that needs something the shared code does not have must use one of these, never edit the engine:

| Need | Mechanism | Where |
|---|---|---|
| A description in other markup | `dialect: { role: selector }` | model config |
| A new kind of option | `DDTV.kinds.readers / visuals / results / normalisers.<kind>` (a file the model loads) | scene library |
| A screen of its own | `scenes: { name: function (ctx) {…} }` | model config |
| A different store theme | another profile in `DDTV_PROFILES`, `extends: '<profile>'` | `products/profiles/` |
| To switch a feature off | `features: { modelGallery: false, … }` | model config |
| A different image source | a source behind the gallery adapter (section 8.2) | gallery |

---

## 4. Product model configuration schema  [THIS PHASE]

The authoritative reference is generated from the code: **`docs/SCHEMA-REFERENCE.md`** (a test fails if it is stale). In words:

- **Identity:** `id`, `name`, `status` (`placeholder` · `development` · `test` · `approved` · `live`), `productIds` (the Ecwid products it may run on), `sourceRoot` (the description's root), `extends`.
- **Content:** `chapters` → `panels` (`scene`, `params` = selectors into the model's own approved description), `topics` (optional; the options a topic is about and its contextual visuals), `dialect`, `notInTelevision` (what is deliberately not shown, with the reason), `media` (legacy list).
- **Selection:** `options` (`label`, `match`, `chapter`, `panel`, `kind`), `values` (how raw Ecwid option text maps to a value id), `sync` (Classic View highlighting).
- **Presentation:** `viewLabels`, `brand`, `layout`, `price`, `modelGallery` (usually from the profile).
- **Behaviour:** `features`, `scenes`.

Content is never copied into the config: every selector points at text that already exists in the model's description, so there is one source of content. **What a model must not contain:** another model's chapters, options, values, visuals or product ids (section 14).

## 5. Model adapter contract  [THIS PHASE]

`DDTV.model.resolve(product)` returns the object the engine, the tools and the tests ask instead of reading config keys:

| Method | Returns |
|---|---|
| `identity()` | `{ id, name, status, productIds, experienceTitle, brand }` |
| `options()` | the model's own dimensions: `{ key, label, kind, chapter, panel, values[] }`, in its order; **nothing is added** |
| `topics()` | every panel as a topic, plus the explicit `topics` it declares (with their options and visuals) |
| `assets()` | the registry assets this model may use |
| `visualsFor(topicId, state)` | the approved visuals for a topic and the current selection, and what was blocked and why |
| `content()` | `{ sourceRoot, chapters[{ id, source }] }` |
| `presentation()` | `{ viewLabels, dialect, placement, experienceTitle }` |
| `features` | `{ modelGallery, storefrontImages, stackedLayout, classicHighlight, contextualVisuals }`: true only if configured and not switched off |

Rules, enforced by code and by tests: the adapter **never invents** a dimension, topic, visual or feature the config does not define; an **unsupported feature is off** (Botanic's `contextualVisuals` is `false` because it declares none; asking for visuals returns "not enabled", not a guess); **no product-specific DOM assumption** lives in the adapter (the DOM knowledge is in the dialect and the profile). The contracts (`DDTV.model.contracts`) name the three interfaces and `DDTV.model.conforms()` checks an object against one; the test shows the descriptor, the connector's implemented methods and the gallery's image source conform, and that the **planned** synchronisation methods are **not** implemented.

## 6. Multi-model roadmap  [PLANNED: not authorisation to touch any product]

Potential future models named in the brief: BIO COMFORT, BOTANIC DUAL, BOTANIC DUAL PLUSH, BIO COMFORT DUAL PLUSH, AMBIENT, PARTNER MATTRESS, compatible toppers, future ranges. **Nothing is known to this work about any of them** (their construction, heights, firmness options, covers, content, images), and none is assumed. What the architecture does for them:

- Each brings its own config, description, registry and visuals; it inherits the shell, the two views, the gallery, the isolation, the profile and the scene library.
- A model with a dimension Botanic lacks (for example a second firmness choice for two sleepers, a topper's thickness) uses an option **kind**: the generic `list`, or a kind it registers. Whether the existing `firmness` kind may be used twice in one model is untested.
- A model whose description uses other markup supplies a **dialect**.
- A model on a different Ecwid theme supplies a **profile**.
- It starts as `status: "development"`, `deployment: "not-authorised"`, `production: false` (`tools/new-model.mjs` writes exactly that).

## 7. Interfaces between the subsystems  [THIS PHASE: named and tested]

| Contract | Defined in | Implemented by | Checked by |
|---|---|---|---|
| **model** (`identity`, `options`, `topics`, `assets`, `visualsFor`, `content`, `presentation`) | `DDTV.model.contracts.model` | `DDTV.model.resolve` | `tests/model-reuse.mjs` |
| **configuration** (implemented: `read`, `choose`, `subscribe`, `refresh`, `start`, `stop`, `normalise`, `capabilities`; planned: `validate`, `set`, `onNativeChange`) | `contracts.configuration` | `ConfigConnector` (the implemented part) | the test asserts the planned part is **absent** |
| **imageSource** (`snap`, `images`, `report`, `refresh`, `onChange`) | `contracts.imageSource` | the gallery adapter | `tests/model-reuse.mjs` |
| **asset registry** | `schema/ddtv-schema.js` (`ASSET_REGISTRY`) | `DDTV.assets` | `tools/validate-model.mjs`, `tools/asset-registry.mjs check` |
| **model config** | `schema/ddtv-schema.js` (`MODEL`) | the engine | `tools/validate-model.mjs` |

The components do not reach into each other: the gallery asks the adapter, the adapter asks the registry, the scenes ask the dialect and the kinds, the engine asks the model descriptor for features.

## 8. Ecwid integration, native gallery and image sources

### 8.1 Two modes over the same Ecwid data  [IMPLEMENTED, verified E1 and E2]

Unchanged, and not rebuilt. See `docs/GALLERY-ARCHITECTURE.md` (mechanism, restoration, evidence) and `docs/IMPLEMENTATION-REPORT.md`. In Optimised Preview the native gallery is isolated by one scoped attribute rule, never removed or cloned; in Standard Product View it is back untouched, with its thumbnails, its zoom/lightbox, the chosen options, the price and Add to Bag. Switching is reversible and was run for 12 cycles on the real Ecwid page. In this phase it also runs for the **second** model (4 cycles on its page, section 17): the isolation does not know which model it is isolating for.

### 8.2 Automatic image retrieval and a replaceable source  [IMPLEMENTED; contract named in this phase]

The gallery adapter merges, in this order of preference for *data about an image*: a hand-made manifest, the model's asset registry, the storefront's own records, the page's own gallery. The storefront request (1500 px files, alt, order) is optional, undocumented, verified against the page and fail-safe; it was left exactly as it was.

The **source is replaceable**: the gallery depends on the `imageSource` contract, and on the records' shape (`id`, `isMain`, `width`, `height`, `image160pxUrl … image1500pxUrl`, `imageOriginalUrl`, `alt`). A documented Ecwid API, or the Divine DunlopDreams Ecwid Bridge, would be one more source that returns those records and is verified against the page the same way. **[PLANNED].** This repository does not contain, and this work does not rebuild, an Ecwid Bridge; nothing is known about it, so nothing is claimed about it.

### 8.3 Gateways and bridges  [PLANNED, not decided]

No relay, proxy or bypass is introduced. A future API gateway or bridge must be assessed separately for security (what it can read and write, credentials, abuse), maintainability and operational need, and must justify itself against reading the page's own data, which needs none of these.

---

## 9. Visual Asset Registry  [THIS PHASE: structure, validation, extension points; no dashboard]

Reference: `docs/SCHEMA-REFERENCE.md` ("Visual Asset Registry"). A registry is `window.DDTV_ASSETS[<model id>] = { version: 1, galleryOrder, assets: [...] }`. **Ecwid still owns the photographs**: the registry is data about them, and every address in it was copied from Ecwid (or from the product's own source for a video), never typed or derived.

| Field | Meaning |
|---|---|
| `id` | Stable identifier, unique in the registry. |
| `type`, `role` | `image`/`video`; `main`, `gallery`, `lifestyle`, `detail`, `construction`, `technical`, `cover`, `educational`, `video`, `animation`. |
| `scope`, `products` | `model`: the models that own it. `shared`: the models it is approved for, or `"*"` for every model (**not allowed for a `construction`, `technical`, `animation` or `cover` asset**: a picture that says how a mattress is built or finished must name each model it is true for). |
| `status` | `active` / `inactive`. Inactive is never used. |
| `ecwid` | `{ productId, mediaId, key }`: the pointer to the Ecwid image it describes (Ecwid is the source of truth). |
| `urls` / `url` | Verified sizes (`160`, `400`, `800`, `1500`, `original`) / a single file (a video). Must be https. |
| `alt`, `title`, `caption`, `width`, `height` | Metadata. A customer-facing image without alt text is a warning. |
| `categories`, `tags` | Content categories (they become the gallery's category chips) and contextual tags. |
| `priority` | **Priority inside the Product TV**, independent of the image's order in Ecwid (a registry's `galleryOrder` is `ecwid` unless it says `priority`). |
| `visibility` | `gallery`: appears in the **customer-facing** gallery; `contexts`: where it may appear (`chapter:…`, `topic:…`). |
| `usedIn` | Where it is used. |

**Customer-facing versus supporting.** Only `visibility.gallery: true` images enter the customer gallery; the rest are carried as supporting resources and reported. Filtering the custom gallery is **not** Ecwid visibility control: an image uploaded to the native Ecwid product gallery still appears in Standard Product View whatever the registry says (the registry cannot hide it there, and does not try to).

**Bridge to the existing, tested gallery.** `DDTV.assets.manifestFor(product)` returns the registry as the media-manifest format the gallery already reads, or **`null` when the registry holds no customer-gallery image**, so a model with a registry but no gallery photographs keeps showing the page's own images and the gallery is never empty. A hand-made manifest, if present, still wins.

**Tools.** `tools/asset-registry.mjs from-legacy` converts a config's legacy `media` list (Botanic's 11 videos and cover textures: verified URLs from its own description; a test regenerates it and compares byte for byte), `from-manifest` converts a media manifest, `check` validates.

**Semantic rules** (`tools/validate-model.mjs`): duplicate ids; a model asset without owners; a `"*"` structural asset; an image without `urls`; a non-https address; an asset for an unknown model; an asset in a model's registry that is not approved for that model.

## 10. Contextual visualisation contract  [PREPARED]

A topic (`topics[]` in a model config, or any panel) may declare **visuals**:

```js
{ id: 'support-choose', chapter: 'support', panel: 'choose', options: ['support'], visuals: [
    { asset: 'placeholder-technical-001', presentation: 'panel', relation: 'illustrates',
      when: { option: 'support', value: 'supportive' }, priority: 5 } ] }
```

- **`presentation`** names the pattern: `inline`, `panel` (a small detail panel), `expandable`, `media` (a related video or animation), `response` (a configuration-related visual response). One contract, no custom implementation per model.
- **`when`** ties a visual to a value the customer has chosen (a normalised value id).
- **The resolver** (`model.visualsFor(topic, state)`) returns the visuals to show, ordered by priority, and the ones it **blocked, with the reason**. A visual is blocked, never shown "close enough", when its asset is missing, inactive, **not approved for this model**, or waits for a value that is not chosen. A model that switches `contextualVisuals` off gets none.
- **Integrity:** a construction or technical picture of another model can never resolve (verified: the same asset approved for another model is blocked with "not approved for model …"); the validator rejects a topic that references one.

**Not built:** no screen draws these visuals yet. The contract, the data, the validation and the resolver exist and are tested; the presentation components are **[PLANNED]** and need the owner's decision on which topics get which approved visuals (section 20).

## 11. Interactive information architecture  [PREPARED]

The Product TV organises knowledge in layers: a **chapter** (a subject), a **panel** (a screen), a **topic** (what a panel is about), and, per topic, text (approved description, read by selector), visuals (section 10), a related video, and the **options it is about** (`topics[].options`). A firmness topic, for example, can explain firmness, show an approved visual for the chosen value and link to the firmness selection; **what it says and which visual it shows come from the model's configuration and approved content, not from code**. There is no assumption about firmness, zoning or construction in the shared engine that a model cannot override, with the exceptions listed in 2.3 (the concept-shaped scenes), which are correct only for options of that kind. What exists today is the chapter/panel/scene layer **[IMPLEMENTED]**; topics with options and visuals **[PREPARED]**.

## 12. Future configuration synchronisation  [IMPLEMENTED in part; the contract is PLANNED]

**Ecwid is authoritative** for available options, valid combinations, prices, availability, the cart and checkout. The Product TV never invents a price, never bypasses Ecwid's validation, and never holds a second copy of the selection.

**What exists now** (`ConfigConnector`, verified E1 and E2): the television reads the native option blocks and drives them as a customer would (set the select, fire `input` and `change`), and re-reads on events plus a slow safety poll; a change made in the store's own controls reaches the television; the television's state is **derived from the native controls**, not stored; the selection survives a switch between the two views because it lives in the native controls. `capabilities()` states what it cannot do: it cannot validate a combination, cannot set several options atomically, and writes no price.

**The planned contract** (not implemented):

| Method | Purpose |
|---|---|
| `capabilities()` | **Exists.** What this connector can do. |
| `validate(selection)` | Ask whether a combination is valid, using only what Ecwid exposes (a disabled option, an unavailable combination), returning reasons. It must never compute a price. |
| `set(dimension, value)` → `{ applied, rejected, reason }` | Apply one choice to the native control; success is confirmed only by Ecwid's own event, never assumed. |
| `onNativeChange(fn)` | Subscribe to changes that came from the native controls. |

Rules for the implementation: every change carries an **origin** (`television` / `native`) so a native change caused by the television is not echoed back (no feedback loop); updates are **debounced and idempotent** (no duplicate updates); an invalid combination is shown by Ecwid and mirrored, not corrected by us; and **if synchronisation fails** the television reports it, the native controls remain fully usable and Standard Product View is one click away. **The size selector and any new selection control are not authorised in this phase and were not built.**

## 13. Lifecycle and mode-switching design  [IMPLEMENTED]

| Concern | Mechanism | Verified |
|---|---|---|
| Which model runs | the product guard (`productIds`); another product, `?ddtv=off` and phones get nothing | E1, E2 |
| Start | `boot` → `productFor` → `start`: idempotent (the merged config keeps its identity), cancellable waits, stale-host cleanup, a double-load guard | E1, E2 |
| Dynamic rendering, client-side navigation, re-initialisation | page-load events, hash routes, a missed-announcement check, an observer on the native gallery, its parent and the product block, `recover()` | E1, E2 (real navigation away and back) |
| Mode switching | `setView('interactive' ⇄ 'classic')`: Optimised Preview isolates the native gallery with one attribute and one rule, hides the description; Standard Product View removes them: nothing was cloned or moved, so nothing needs restoring | 12 cycles, E1 and E2 |
| Failure | `failSafe` restores the native gallery and the original page; a render watchdog; never a blank image area; never blocked purchasing | E1 |
| Cleanup | `destroy` removes the host, listeners, observers, attributes, the stylesheet and **resets the content dialect** | E1; listeners flat over 12 cycles (E1 149 → 149, E2 648 → 648) |

## 14. Model-specific content integrity  [THIS PHASE: rules enforced by the validator]

The shared engine does not force a model to have Botanic's latex construction, zones, firmness options, heights, covers, illustrations, configuration logic or technical explanations; a model gets only what it declares. The validator prevents unsupported content from being shown:

- a topic or visual may reference only an asset **approved for that model**; a `construction`/`technical`/`animation`/`cover` asset cannot be shared with `"*"`;
- a model's own text (config strings and, with `--source-check`, its description) must not **name another model** unless the index declares it;
- an option must point at a screen that exists; values only for options the model has; a scene must exist;
- a model may not list a **live product** before approval (`models.json` `deployment`), nor a product another model already claims;
- the descriptor never reports a dimension, topic or feature the config does not define.

## 15. Visual design system  [IMPLEMENTED]

The shell, the scene library and the gallery carry the Divine DunlopDreams language (Chillax, premium minimalism, rounded corners only, accessible contrast, restrained animation, progressive disclosure) in **shared CSS**; a model inherits it by construction and cannot fragment it. Controlled model-specific differences are today limited to the brand mark and the markup it reads. Per-model design tokens (an accent colour, say) are **[PLANNED]** and would need a decision; none is built.

## 16. Performance and devices  [IMPLEMENTED; unchanged]

Desktop and iPad get the Product TV; phones keep the original Ecwid interface (a rule the second model obeys too, tested). No media is loaded before it is needed; the gallery requests nothing before it opens; listeners and nodes stay flat across repeated mode switches. Cost of this phase: the Botanic embed grew from 249,543 to 282,162 characters (+13%: the asset module, the model descriptor, the dialect and kind tables, the profile merge, Botanic's registry); the schema, validator and tools are **not** part of the embed. Older iPads: **[NOT VERIFIED]** (no real device).

---

## 17. Reusability demonstration  [THIS PHASE, E1]

**What it is.** A second model, `placeholder`, entirely invented (`products/examples/placeholder-model.*`, `source/examples/placeholder-model-description.html`), never part of a production build, product id `900000001` (not an Ecwid product of this store), every address on the reserved host `placeholder.invalid`. It differs from Botanic on purpose: **two options** (size, a two-level "support") where Botanic has four; its own choices; **no depth, no cover, no firmness scale, no zones, no video**; its own markup (`px-`); its own chapters (four) and a screen of its own. Built by `tools/build-example.mjs` onto the same stand-in store page, it runs on the shared engine.

**What was proved** (`tests/model-reuse.mjs`): the engine starts for the placeholder on a page that loads **no Botanic file at all**; it shows exactly the model's own four chapters and two options, and **nothing from Botanic appears in the television's content**; choosing in the television drives the store's own dropdowns and the store's price, a change in the store's dropdown is read back, the summary knows when every choice is made, Add to Bag takes both options; the gallery works on the model's own images (fed by its registry: 3 customer photographs, 3 supporting resources), the native gallery is isolated and restored over four cycles with the options kept, Standard Product View highlights the model's own cards; the stacked layout and the phone rule apply with **no configuration** (they come from the profile and the engine); a model's own scene, dialect and registry work; **two models registered in one bundle do not touch each other** in either direction; an unknown product gets nothing.

**What it reused unchanged.** The 8 shared engine files (JS and CSS, 4,947 lines in all) appear **byte for byte** in both the Botanic build and the placeholder build (a test checks it), and none names the placeholder.

| Part | Reused unchanged | Needed model-specific configuration | Had to be changed in the engine (found by this exercise) |
|---|---|---|---|
| Lifecycle, product guard, views, mode switching, native gallery isolation, restoration, fail-safe, the stacked layout, the phone rule | yes | no | no |
| Model gallery, its adapter, the storefront source | yes | its images (a registry) | the registry → manifest bridge (additive) |
| Layout, price, labels, brand, gallery selectors | yes | one line: `extends: 'divine-store'` | the profile merge (new) |
| Scene library: hero, facts, reader, choose, result, summary | yes | which scene each screen uses, and the selectors | hero without video; the generic `list` kind; the summary following the model's own options; option parsing by **kind** not by name; the dialect (new) |
| Reading the description | the readers | its markup's class names (a dialect) | the dialect table (new) |
| Content, options, values, chapters, texts | no | **all of it**: 130 lines of config, 53 of registry, 49 of description (a toy; Botanic's are 396, 288 and 4,714: the sizes are not comparable) | no |
| A screen of its own | the mechanism | one scene function in its config | model scenes (new) |

**Honest limits of this proof.** It is simulated (E1) on an offline stand-in page that is the one the Botanic tests use; no real second product exists; the placeholder's description deliberately uses the same *roles* as the house markup under other class names, so it demonstrates the dialect mechanism, not that an arbitrary future description will map onto the scene library; its generic `list` kind draws a plainer summary marker than Botanic's firmness scale; and the Ecwid theme selectors in the profile are still confirmed only on Botanic's page. **A second *real* model is the real test**, and section 2.3 is the list of what is likely to break first.

## 18. Testing and validation requirements  [THIS PHASE]

| Gate | Tool | When |
|---|---|---|
| Schema, semantics, cross-model integrity, assets | `node tools/validate-model.mjs` | every change to a model; CI |
| Every selector in the config matches the model's own description | `NODE_PATH=$(npm root -g) node tools/validate-model.mjs --source-check` | every change to a model or its description |
| Registry data reproducible and valid | `node tools/asset-registry.mjs check …` | every change to a registry |
| The generated schema reference is current | `node tools/schema-docs.mjs --check` | CI |
| The shared code gained no model-specific name | the ratchet in `tests/model-reuse.mjs` | every change to `engine/` |
| The engine still runs a second model; two models do not interfere; the contracts hold | `tests/model-reuse.mjs` | every change to `engine/` |
| Everything that already existed | `tests/smoke.mjs`, `tests/embed.mjs`, `tests/gallery.mjs`, `tests/live/*` | every change |

**Not yet available:** a *generic* compatibility run for any registered model. The placeholder test is specific to the placeholder; a new model needs its own stand-in page (the option blocks of its store page) and today that is a manual step; a generic stand-in builder driven by `models.json` is **[PLANNED]**. Real-device, real-store and live-media verification of any model are **[NOT VERIFIED]** and remain the owner's gates.

## 19. Implementation roadmap

| Phase | Content | Status |
|---|---|---|
| A | Botanic reference: shell, scenes, two views, gallery, isolation, storefront source, restoration | **[IMPLEMENTED]**, E1 and E2 |
| B | This phase: dialect, kinds, profile, model scenes, features, registry, descriptor, contracts, schemas, validator, scaffold, placeholder proof | **[THIS PHASE]**, E1 |
| C | Botanic adopts `extends: 'divine-store'` (its config shrinks by about 60 lines; behaviour must not change: a test already checks the profile equals Botanic's values) | **[PLANNED]**, needs approval (touches the reference config) |
| D | A per-model production build from `models.json` (`production: true` only), one embed per model | **[PLANNED]** |
| E | A generic stand-in builder and compatibility run for any registered model | **[PLANNED]** |
| F | E3 and E4 for Botanic: the test product and real devices | **[NOT DONE]**, owner |
| G | The first real second model, onboarded with `tools/new-model.mjs`; its approved description and assets | **[PLANNED]**, owner chooses which |
| H | A documented Ecwid API or the Ecwid Bridge as an image source (if reliable) | **[PLANNED]**, needs the Bridge's description |
| I | Contextual visual components (draw `visualsFor`), with approved visuals per topic | **[PLANNED]** |
| J | Bidirectional configuration contract (`validate`, `set`, `onNativeChange`) | **[PLANNED]**, needs approval |
| K | The size selector | **[PLANNED]**, **not authorised** |
| L | The asset management dashboard | **[PLANNED]**, **not authorised** |

## 20. Decisions that need the owner

1. **The house markup.** The dialect default is Botanic's markup (`b-` classes). Will future descriptions be written in that markup (then it should be named as the house markup, and a prefix not called "b" decided), or in new markup (then each model brings a dialect)?
2. **Botanic adopting the store profile** (phase C): approve touching the reference config, with the existing suites as the safety net.
3. **Status and release gate.** The `status` ladder and the `deployment` flag in `products/models.json` are proposed as the formal gate: `placeholder` → `development` → `test` → `approved` → `live`; the validator refuses a live product id before `deployment: authorised`. Confirm, and say who sets `authorised`.
4. **One bundle or one embed per model.** A bundle with all models grows with each; per-model embeds from the shared core (phase D) are recommended.
5. **Who approves assets and visuals.** Construction and technical pictures are the most dangerous to share. Who signs off that a picture is true for a model, and where is the sign-off recorded (the registry's `status`)?
6. **Contextual visuals**: which topics get which approved visuals, and which presentation patterns (`panel`, `expandable`, …) are wanted first.
7. **Option kinds for future models** (a second firmness for dual models, a topper's thickness): the business rules, from the owner.
8. **The Ecwid Bridge**: its description (what it exposes, security, hosting) before anything is built against it; and whether the undocumented storefront request is acceptable in the meantime (`GALLERY-ARCHITECTURE.md` section 5).
9. **Configuration synchronisation** (phase J): approve the contract; decide what happens on an invalid combination.
10. **Per-model design tokens**: allowed or not.

## 21. Remaining technical risks

1. **A real second model will find what the placeholder could not.** Section 2.3 is the list; the concept-shaped scenes and the cover reader are the most likely.
2. **The Ecwid theme assumptions** (the profile, `ECWID.block`/`title`) are confirmed on one page.
3. **The dialect is a convention, not a guarantee**: a description with missing or renamed roles shows less, not an error. The validator's `--source-check` reports selectors that match nothing, but cannot know a role is needed; dialect roles are reported as warnings because many are optional.
4. **Registry correctness depends on people**: an asset marked `shared` or approved for the wrong model is a content error no code can detect; the validator enforces structure and the structural-role rule only.
5. **The storefront source is undocumented** (unchanged risk).
6. **Bundle growth** with each model in one bundle (decision 4).
7. **Nothing here has run on a real device or the live store.**
