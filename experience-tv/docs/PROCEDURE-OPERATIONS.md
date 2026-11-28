# Operating procedure: the TV module, releases and new models

Status: 28 November 2026. This document is the operating manual. It does not replace the decisions in `DECISIONS.md` or the architecture in `ARCHITECTURE-MULTI-MODEL.md`; it says what to do, in what order, and who does each step. The model-by-model intake is `ONBOARDING-NEW-MODEL.md`; this file links to it.

## 0. Standing rules

- **Test product first.** Every change is shown on a disabled test product until the owner approves that specific change in writing.
- **Never a live id in a test.** The live Botanic Original is `831592302`. The enabled product `775209252` ("BOTANIC DUAL PLUSH …") is also a live-looking listing: it is not a test target either.
- **Nothing deploys without the owner.** A write to the store, a live product, the category page or the collection needs its own approval, named per change.
- **Read-only checks are free.** Searching the store, reading a page or a description, and the local tests never change anything.
- **Ask only when blocked.** Otherwise decide, state the decision, and move on.

## 1. Where things are

| Thing | Where |
|---|---|
| Working copy, Botanic TV and tests | `/home/user/Animation`, branch `claude/funny-johnson-b4mod7`, folder `experience-tv/` |
| Media host (pictures, TV file) | Published through `divine-siteground-bridge`, branch `main`, folder `.ddtv/media-inbox/` |
| Central loader (v1.5) | Ecwid admin → Website → Custom JavaScript code. Stays unchanged unless the owner approves a new version. |
| Description for the test product | `dist/standard/botanic-standard-description.html` plus the pointer block (see step 2.7) |
| Decisions and their history | `docs/DECISIONS.md`, one round per entry; owner quotes are kept |

## 2. Changing the TV (any content or design change)

1. **Edit** the sources: `tools/tv-design-preview.template.html`, `tools/own-panels.mjs`, `tools/standard-module.css`, `tools/build-standard-module.mjs`, `products/botanic.gallery.json`, `engine/*` for behaviour shared by every model.
2. **Build:** `node tools/build-tv-design-preview.mjs && node tools/build-standard-module.mjs && node tools/build-experience.mjs && node tools/build-package.mjs`. A gallery entry that points at no topic or part stops the build with a message.
3. **Offline suites** (run from `experience-tv`, with `NODE_PATH=$(npm root -g)`): `smoke`, `embed`, `gallery`, `central-loader`, `experience-loader`, `experience-package`, `experience-promo`, `loader-gate`, `model-reuse`, `price-promo-contract`, `selection-rules`, `sync-contract`, `design-rules` (expect "All 200 design-rule checks passed").
4. **Live suites** on a copy of the real test page (nothing saved, this browser only): `layout-e2`, `gallery-mini-e2`, `standard-module-e2`, `experience-e2`, `loader-e2`, `stability-e2`, `tv-sync-e2`. Any change in layout, gallery or sound gets the first three at minimum.
5. **Commit and push** the `experience-tv` changes to `claude/funny-johnson-b4mod7`.
6. **Publish media** (each picture and the TV file are content-named and immutable):
   - Make a folder `.ddtv/media-inbox/<job-id>/` in the bridge repo with `payload.b64` (the file, base64, one line) and `job.ready.json` (`schema_version`, `job_id`, `operation: publish`, `filename`, `bytes`, `sha256`, `confirmation: APPROVE_DDTV_MEDIA_PUBLISH`; a code file also needs `code_confirmation: APPROVE_DDTV_MEDIA_CODE`).
   - Branch, commit, pull request, merge. Then check with `curl` that the new address returns 200 and that the downloaded `sha256` equals the one in the job. Nothing existing is overwritten.
7. **Description:** copy the module HTML and set the pointer block's `data-ddtv-tv` to the new TV file name (the file name carries the hash). Save it as `DESCRIPTION-876405767-STANDARD-FULL-vNN.html` (next number). Check that every picture address in it returns 200.
8. **The owner pastes:** Ecwid → Products → the test product → Description → HTML → Ctrl+A, Delete, paste the whole file, Save.
9. **Verify on the test product:** the loader chain (`loader-e2`) and the gallery test. Then describe what was seen and what was not (Chromium only; no iPad Safari here).

## 3. A new model (for example Dual Plush or the baby mattress)

**The working principle (owner, 28 Nov):** a new model is built on a **test product** while the existing published model keeps running and keeps its product id, its address, its search index and its advertising. When the new model and the existing one are both ready, the finished code is moved into the **existing** product and its existing address. Nothing is rebuilt from scratch on the live product, so the product's logistics, index and campaign details are not lost. That move is a live change: it needs the owner's written approval for that exact change, and the test steps below come first.

Follow `ONBOARDING-NEW-MODEL.md` (ten steps). Two facts from this repository change how it applies:

- **The engine is shared, the content is not yet.** `engine/*` runs a second model (`tests/model-reuse.mjs`, with a placeholder). But the TV build for Botanic reads its own files directly: `source/botanic-original-description.html`, `products/botanic.gallery.json`, `products/botanic.zones.js` and `assets/botanic/*` (see `tools/build-tv-design-preview.mjs`, `build-standard-module.mjs`, `build-experience.mjs`). **A second model's television cannot be built until those inputs are chosen by a model id** (a `--model` argument and a folder per model). That is the first engineering task of the next model, and it is not done.
- **What the owner supplies, per model** (nothing is invented; a missing item stops that step):
  1. The Ecwid **test** product id (a disabled copy, never a live id).
  2. The **verified** description export, and the exact option titles as Ecwid shows them.
  3. The **pictures**, with their addresses taken from Ecwid, and which of them are cut-outs. A picture is cut only when the cut is flawless at 1:1 against the source photograph on dark and light grounds.
  4. The **prices** and the **approved wording** of every panel.
  5. The **owner's written go-ahead** for each live step.

## 4. The models (status on 28 November)

| Model | Store evidence (read-only search) | Status | Still needed |
|---|---|---|---|
| Botanic Original | Test: `876405767` (Botanic Experience TV \| TEST DRAFT, enabled). Live: `831592302` (do not touch). | TV module in test; description v22 is the current version. | Owner's paste of v22; owner's decision on the next live step. |
| Dunlop 100% Natural Baby & Junior Mattress | `876311857`, SKU `DD-BABY-DUNLOP-DRAFT`, **disabled**, created 6 Nov 2026, price 0. Its own text says it is a development draft, not for sale, with firmness provisional and safety and cot compatibility pending. Details in `docs/MODEL-BABY-JUNIOR.md`. | Draft in the store. No TV module yet. | Prices, the safety and compliance confirmations, approved text, the owner's decision on the test copy and the live go-ahead. |
| Botanic Dual Plush | `775209252` "BOTANIC DUAL PLUSH 100% Organic Latex Mattress + Organic Latex topper": **enabled (published)**, address `…/products/botanic-dual-plush-100-organic-latex-mattress-organic-latex-topper-dunlop-technology`, created 18 Aug 2025, last updated 27 Nov 2026 22:36 UTC (not by this work: nothing was written to the store). An earlier data file also names the address `…/products/dual-plush-latex-mattress-latex-topper`. | Not started (planned). It is the existing model that will receive the finished code. | Which address is indexed and must be kept; who changed the listing on 27 Nov; a disabled test copy for development; the verified description. The Botanic description links to Dual Plush in three places (`source/botanic-original-description.html`, around lines 2254, 2569 and 2668): those links must keep working. |

The baby mattress was discussed in an earlier conversation whose record is not in this repository. Its prices and content must be given again.

## 5. The store's collection and gallery

- The **collection** (the category page and its tile picture) is not the TV. The project rule is that Collection 3.13.2 does not change without a separate approval for that exact change. The category tile picture of the test product is a manual upload by the owner (the bridge does not write gallery pictures for a live product).
- Adapting the **store gallery and navigation** to a new model is therefore a list of named changes for the owner to approve, one by one, after the model's test page works.

## 6. Starting a new session for the next model

1. Open a new Claude Code session on `/home/user/Animation` (branch `claude/funny-johnson-b4mod7`), or on `divine-siteground-bridge` for media jobs.
2. First message: point to `experience-tv/docs/PROCEDURE-OPERATIONS.md` and `docs/ONBOARDING-NEW-MODEL.md`, name the model, give the test product id (or ask for one), and paste the owner's intake pack from section 3.
3. The new session starts with step 1 of the onboarding (identify the product), not with design.

## 7. Known open items

- The model-parameterised TV build (section 3). Not done.
- Two guardrail targets are still open and are measured, not hidden: G4 (video requests at load on desktop and tablets) and G5 (layout shift of the product block when the television is inserted; about 0.5–0.6 on tablets). They are in `tests/guardrails.mjs` output and must be closed or accepted by the owner before a live step.
- iPad Safari, the start-up sound on a device, and real-device touch are not verified here. Chromium only.
- Every run of the design tests regenerates the screenshots in `docs/tv-preview/`; they are committed with the change that caused them.
