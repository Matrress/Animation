# Onboarding a new product model

This is the repeatable process for introducing a mattress model (or a topper, or a future range) into Divine Product TV. Its principle: **adding a model needs configuration and approved content, not changes to the shared engine.** If a step seems to need an engine change, that is a finding to report (section "When the engine does not fit"), not a licence to fork.

Nothing in this procedure deploys anything. Production deployment needs the owner's explicit approval, and the tooling will not point a model at a live product before that.

Background: `docs/ARCHITECTURE-MULTI-MODEL.md` (the design) and `docs/SCHEMA-REFERENCE.md` (every key a config may contain).

## Who does what

| Marker | Meaning |
|---|---|
| **[Tool]** | A command in this repository does it. |
| **[Owner]** | Only the owner (or whoever the owner names) can supply or decide it: approved content, business rules, assets, approval. |
| **[Anyone]** | A developer, following the instructions. |

## The ten steps

### 1. Identify the correct Ecwid product  [Owner + Tool]

The model runs on the **test product** first (a separate, disabled Ecwid product, never the live one). Get its Ecwid product id. Never use a live product id: `tools/new-model.mjs` refuses it, and `tools/validate-model.mjs` rejects a live id on any model whose `deployment` is not `authorised`.

### 2. Load its verified product data  [Owner + Anyone]

Collect, from the test product, only what is verified:

- **The description** (raw HTML, exactly as Ecwid stores it). Compare it with the source file with `tools/compare-description.mjs` so nothing was lost or altered.
- **The exact titles and texts of its options** as Ecwid renders them (the console snippet in `DEPLOYMENT.md`, step 7, prints the option titles). Nothing is guessed from another model.
- **The product record** (the storefront's product JSON, with `mediaItems`) for its images.

Do not invent product data. If something is missing, the model leaves it out and the feature stays off.

### 3. Create its model configuration  [Tool + Anyone]

```
node tools/new-model.mjs <id> --name "MODEL NAME" --product-id <TEST PRODUCT ID>
```

This writes `products/<id>.config.js` (a minimal, valid config that `extends` the Divine store profile and assumes **no option**), an empty registry `products/<id>.assets.js`, a stub description `source/<id>-description.html` (every text says TODO), and registers the model in `products/models.json` as `development`, `deployment: not-authorised`, `production: false`. It then validates. Replace the stub with the model's approved description.

### 4. Associate its approved visual assets  [Owner + Tool]

Add assets to `products/<id>.assets.js` (schema: `docs/SCHEMA-REFERENCE.md`). Rules that matter:

- **Ecwid owns the photographs.** Copy addresses from Ecwid (the product record, `tools/media-manifest.mjs`, `tools/asset-registry.mjs from-manifest`); never type or derive one (the five files of one image have unrelated numbers).
- Mark each asset `scope: model` with `products: ['<id>']`, or `shared` with the models it is approved for.
- A **construction, technical, animation or cover** picture says how a model is built or finished: it must name each model it is true for and **can never be `"*"`**. Do not reuse another model's construction picture here unless the owner has approved that association explicitly (name this model in its `products`).
- `visibility.gallery: true` only for photographs meant for the customer-facing gallery. Supporting and educational images are not gallery photographs.
- `priority` is the priority **inside the Product TV**; it does not change the order in Ecwid.

### 5. Define its supported information topics  [Owner + Anyone]

In the config, `chapters` → `panels`: each panel names a scene from the library and the selectors of the **approved text** in the model's own description (content is never copied into the config). Optionally declare `topics` (the options a topic is about, and its contextual visuals). Use only the scenes the model really needs; a model without video, without zones, without covers simply does not use those scenes.

### 6. Map its available product options  [Anyone, from the verified titles of step 2]

`options`: a key, a label, a regular expression that matches the **Ecwid option title**, the chapter and panel where the customer chooses it, and its **kind**:

| Kind | For | Needs in the description |
|---|---|---|
| `size` | width × length | choices with a name and `W×L` |
| `depth` | a height in centimetres | choices with a cm value |
| `firmness` | choices with weight ranges | `kg` / `st` text per choice |
| `cover` | a texture photo and a short name | the cover micro-structure |
| `list` | **anything else** | a title, optionally a detail line and a text |

`values`: how each raw Ecwid option text maps to a value id (a regular expression per choice). Do not copy Botanic's firmness or cover tables: another model's options are its own.

### 7. Activate the relevant interface modules  [Anyone]

- `extends: 'divine-store'` gives the layout, price, labels and gallery selectors of the Divine Ecwid theme. A different theme needs its own profile.
- `dialect`: only if the description is written in other markup than the house markup (see `DDTV.dialect`); override just the roles that differ.
- `features`: switch off what the model should not have (`modelGallery`, `storefrontImages`, `stackedLayout`, `classicHighlight`, `contextualVisuals`).
- `sync`: only if the Classic View should highlight the customer's choice on the model's own cards.

### 8. Run the model-specific compatibility tests  [Tool]

```
node tools/validate-model.mjs <id>                       # structure, semantics, cross-model integrity, assets
NODE_PATH=$(npm root -g) node tools/validate-model.mjs <id> --source-check   # every selector matches the model's own description
node tools/asset-registry.mjs check products/<id>.assets.js --models <id>
node tests/model-reuse.mjs                               # the shared engine still runs a second model; no new hard-coding
node tests/smoke.mjs && node tests/embed.mjs && node tests/gallery.mjs       # Botanic is unaffected
```

Then load the model on a stand-in store page of its own (the option blocks of its test product): `tools/build-example.mjs` is the pattern to copy. A generic stand-in builder is planned; until then this step is manual, and it is the first place a real second model is likely to expose a gap.

### 9. Review the visual presentation  [Owner + Anyone]

Look at it on desktop and iPad, portrait and landscape, with options chosen, in both views, and with the gallery open. Check that nothing of another model appears, that every unsupported feature is absent (not empty), and that a phone shows the original Ecwid page. Real Safari on a real iPad and iPhone, and the real test product, are separate gates (E3, E4) that no tool here replaces.

### 10. Obtain approval before deployment  [Owner]

Move the model up the ladder in `products/models.json` as it is approved: `development` → `test` → `approved`. Only after the owner approves a deployment is the live product id added, `deployment` set to `authorised` and `production` set to `true`. Until then: **do not deploy.** The validator will fail any model that lists a live id without that.

## Checklist

| | Check | By |
|---|---|---|
| ☐ | Test product id, not a live id | Tool |
| ☐ | Description is the verified raw export; option titles are the real ones | Owner / Anyone |
| ☐ | Config created from the scaffold; no content copied from another model | Anyone |
| ☐ | Assets copied from Ecwid, owners named, construction pictures not shared | Owner |
| ☐ | `validate-model` and `--source-check` pass | Tool |
| ☐ | The model's own stand-in page runs; nothing of another model appears | Anyone |
| ☐ | `tests/model-reuse.mjs`, smoke, embed, gallery pass | Tool |
| ☐ | Visual review on desktop and iPad; phone shows the Ecwid page | Owner |
| ☐ | E3 on the test product; E4 on real devices | Owner |
| ☐ | Owner's written approval; only then `authorised` and the live id | Owner |

## When the engine does not fit

A model may need something the shared code does not provide: a kind of option with its own drawing, a screen of its own, a description in unfamiliar markup. Use the documented extension mechanisms (`ARCHITECTURE-MULTI-MODEL.md`, 3.3): a **dialect**, a registered **kind** (`DDTV.kinds`), a model **scene** (`scenes:` in the config), a **profile**, a **feature** switch. If none of them is enough, report it as a finding with the model and the gap; the shared engine is changed only deliberately, with the existing suites and the ratchet test as the safety net, and never by adding a model's name, id or class to it. The ratchet (`tests/model-reuse.mjs`, section 5) fails if shared code gains a model-specific name.
