# BOTANIC premium phone experience and guided configuration: design and technical proposal

Date: 2026-11-10. Branch `claude/funny-johnson-b4mod7`, draft PR #9.
**Status: design, technical planning and non-deployed prototypes. Nothing is deployed, the live store, the description, the Product TV engine and the build were not changed, and Add to Bag was never clicked. Every item here waits for explicit approval.**

Labels used throughout: **Measured** (a script in this repository produced it; command named), **Read** (from code, markup or git), **Observed** (a behaviour seen on the real public page in a local browser), **Estimated** (judgement), **Not verified** (needs a real phone, the media host, or the owner).
Evidence levels: E1 simulated stand-in page; **E2 real Ecwid DOM of the public product 831592302, local and read-only**; E3 the test product 876405767 (not done); E4 real devices (not done).

Open the integrated preview: `docs/mobile/premium/preview/index.html?concept=sheet` (also `stage`, `journey`; add `&chrome=0` to hide the preview bar). The Ecwid block in it is a labelled **stand-in** (E1).

---

## 0. In short

1. **Direction**: Variant C, rebuilt with a stronger visual language; a guided five-step configurator that is only a presentation layer over Ecwid's own options; the Product TV untouched for tablet and desktop; **no television code on phones**.
2. **The synchronisation architecture works on the real Ecwid page (E2)**: 15 checks pass, fast and slow phone profiles, including the slow profile's duplicate product pages. Ecwid stays the single source of truth; the adapter computes no price and never touches Add to Bag.
3. **Firmness is the biggest finding.** The three places that state weight ranges disagree, and the published Firmness Navigator is not a table of ranges at all: it is a weight-and-height rule. The preview reuses that rule (4.4 KB extracted, identical to the published engine on 24 531 combinations) and shows **no ranges from the description or from Ecwid's labels** until the owner aligns them. Section 7.3.
4. **Duplicate DOM is Ecwid's behaviour, not a result of the two Botanic products**: other models' product pages (which have no test sibling) show the same two live copies on the slow profile. Both copies are independently alive. Section 7.2.
5. **`price: 0.0` in the structured data** is static (it does not follow the options). Whether Google penalises it could not be confirmed from Google's documentation (the host is not reachable from here). Nothing was changed; options are in 7.1.
6. **Loader gate: tested** (17 checks, stub bundles): phones request only the phone layer; tablets and desktop request only the television; rotation, resize, `?ddtv=off`, failed downloads handled. Section 5.
7. **Three guided-configuration concepts** built into the same page. Recommendation: **Concept 2, Stage**, on top of Concept 1's shell, with a measured caveat against Concept 3. Section 3.
8. The phone layer is **32 KB of JavaScript unminified (10.6 KB gzip)** against the television's 278 KB (71 KB gzip). Section 6.
9. **Not measurable here, and not invented**: video and cover byte sizes, real-device behaviour, Google's price rule. Scripts are ready for the owner's machine (`tools/media-probe.mjs`).

---

## 1. Deliverable 1: refined mobile content hierarchy (Variant C)

The approved description is still the only source. The refined page is its own markup regrouped (not retyped); **all 422 source texts are present** (`tools/premium-content-check.mjs`; the preview's description region is 12 839 px, 9 848 of its 31 845 characters visible without a tap, 26 `<details>` of which 7 open). It is longer than the first Variant C (11 822 px) on purpose: the brief puts presentation quality above page height.

| # | Block | Role | Visible by default | Source section | Treatment |
|---|---|---|---|---|---|
| 1 | Gallery | Orientation | Yes (Ecwid's own) | – | Collapses to a thumbnail bar when configuration starts; restorable (3.4) |
| 2 | Title, Ecwid price, introduction, **Configure Your Mattress** | Orientation and entry to the guided flow | Yes | Hero text (moved, not repeated) | One primary action |
| 3 | Ecwid's own options and Add to Bag | Commerce | Yes, always | Ecwid | Never hidden, restyled or duplicated |
| 4 | Hero media card | First impression | Yes | Hero | Poster, **full video on tap** (the autoplaying teaser is retired on phones) |
| 5 | **At a glance**: six tiles with a line icon each | The immediate characteristics: Dunlop latex, made to order, certified in Europe, delivery, warranty, pillows | Yes | Key-features bar (the original nodes, moved) | 2 × 3 tiles |
| 6 | **Seven-zone support**, promoted to a permanent block | Signature feature | Yes | 7-Zone section | A light SVG body map beside the seven approved zone names and notes; explanation row below |
| 7 | **Firmness** (guidance and decision notes) | Decision | Yes | Firmness | The four approved descriptions; **ranges not shown** (7.3) |
| 8 | **Height**, **Covers** | Decision | Yes | Height, Covers | Depth cards, cover names and tags; the details rows collapsed |
| 9 | **See the material at work** | Proof | Swipeable row of five posters | The five proof videos | Tap to load; the file is requested only then |
| 10 | **The technical detail** | Education | Rows, one level, collapsed | Comfort, Benefits, Support, Adaptation, Ventilation, Hygiene | Flat rows; no accordion inside an accordion |
| 11 | **Certifications**, **Warranty and gift** | Trust | Yes | Certifications, Warranty | Open |
| 12 | Delivery, closing statement | Purchase confidence | Yes | Delivery, CTA | Open |

Not shown on a phone (text stays in the DOM and in the server HTML): section numbers, the decorative dividers, the floating Back to Top, the hero's first column (the title and intro are the Ecwid block above), the "configuration at a glance" card (repeats the options), the kilogram and stone ranges of the four firmness cards (7.3).

**Visual language** (all inside the existing identity: palette `#364849 / #DDEBF1 / #759397 / #797572`, Chillax, 12 / 18 px radii, rounded corners only): a short accent rule above each heading; hairline dividers; a calm dark proof band with a static radial highlight (an "ambient light" made of one gradient, no blur); line icons and diagrams in inline SVG; transitions limited to transform, opacity and height, switched off under `prefers-reduced-motion`. **No `backdrop-filter`, no animation library, no image heavier than needed.**

**Diagrams made from approved numbers only**: the seven-zone map (the seven approved names), the depth bars drawn to scale from 20 / 24 / 26 cm, the size footprint from the label's dimensions, the firmness scale driven by the engine. **A construction cross-section was not drawn**: the layers are not documented in the approved text and none was invented. That needs an approved drawing from the owner (question 9.4).

Accessibility, search: headings keep their levels; native `<details>`; visible focus rings; touch targets at least 44 px in the panel; text hidden only by CSS stays in the DOM; no mobile-only content.

---

## 2. Deliverable 2 (part): the integrated preview

`docs/mobile/premium/preview/index.html`, built by `node tools/build-premium-preview.mjs`. One page that shows, in order: the gallery, the title and price, the introduction and the **Configure Your Mattress** action, Ecwid's own options and Add to Bag (stand-in), the refined Variant C content with its media interactions, and the technical rows. The guided panel opens over or inside that page, never as an isolated component.

Screens (`docs/mobile/premium/shots/`): `montage-sheet.jpg`, `montage-stage.jpg`, `montage-journey.jpg` (seven states each: opening, size, size chosen, firmness with the sliders set, depth, cover, review), `content-sheet.jpg` (every screen of the whole page), `content-top.jpg`, and the individual `*.png` frames. **Driven by real clicks** (`tools/premium-shots.mjs`); in all three concepts four native selections were made, the Ecwid stand-in price followed, and no page error occurred.

---

## 3. Deliverable 2: three concepts for guided configuration

One set of steps (size, firmness, depth, cover, review), one synchronisation adapter, three **shells**. Every concept shows: the opening view, the gallery-to-configuration transition, size, firmness with visual guidance, depth and cover, a persistent summary, Ecwid's price, readiness to order, and a way back to information and the gallery.

| | 1. Sheet | 2. Stage | 3. Journey |
|---|---|---|---|
| Idea | A bottom sheet over the page; a step rail; a summary dock | A full-screen stage: a **mattress drawn from the choices** (footprint from the size, thickness from the depth, bands tinted by the firmness, the cover's pattern) above the step panel | Inline in the page: five steps as an expanding list, a sticky summary dock |
| Gallery | Collapses to a thumbnail bar; "Show gallery" restores | A thumbnail chip at the top; tapping it returns to the gallery | Collapses to the thumbnail bar |
| How the configuration "develops" | Summary dock fills in | **The drawing builds**, plus the dock | Steps tick off |
| Page behind | Visible above the sheet | Covered | Part of the flow |

### 3.1 The flow and the order
The brief proposes size, firmness, depth, cover, review. **Observed (E2)**: the four native options are independent (changing the size left the other lists unchanged; the order on the page is size, depth, firmness, cover), so any order is valid. The proposed order is kept; "next" always goes to the first step not yet chosen. **Not verified**: which options Ecwid treats as required (this can only be seen by pressing Add to Bag with a missing option, which is not done; the owner can read it in Ecwid Admin, question 9.1).

### 3.2 Size, firmness, depth, cover
- **Size** (22 sizes plus "For more options, contact us", as Ecwid lists them): grouped Single, Double, King, Super King, Emperor; touch chips with name and dimensions; a footprint drawing to scale. The price modifiers in Ecwid's labels are not repeated; Ecwid's own price is the only price shown.
- **Firmness** (7.3): two sliders (body weight 30–250 kg, height 120–230 cm: the engine's own limits) give guidance from the published rule; four cards with the approved descriptions; a scale drawing; the sentence about Botanic Dual Plush appears only when the engine returns a second option, in the description's own words; a link to the full Firmness Navigator. The visitor can ignore the guidance and choose directly.
- **Depth**: three cards with bars to scale (20 / 24 / 26 cm), names and descriptions from the description, and the approved "+2 cm with a cover" note.
- **Cover**: four cards with name, tag and description (approved text). Textures are placeholders in the preview; in production they load only when this step opens (section 5.3).
- **Review**: four rows with Change; Ecwid's price; a "ready" state when all four are chosen; a button to Ecwid's own Add to Bag; the approved purchasing facts (made to order, delivery, warranty, pillows).

### 3.3 Price
The panel shows the text of Ecwid's price element and nothing else. **Observed (E2)**: it starts at £0; it follows a choice about 0.7 s later; it is a partial sum while choices are missing (size alone gives £1 199.70 for UK King); some choices add nothing (20 cm, Soft, Cotton). Ecwid applies a reduction to the sum of the label modifiers (788 → £709.20, 1 333 → £1 199.70, 2 098 → £1 888.20 are all 90 %), which is exactly why **no price may be computed outside Ecwid**. The panel labels the number "Your price, from Ecwid" and "2 of 4 chosen". The initial zero state is left alone, as instructed.

### 3.4 Gallery and configuration together
Three behaviours were considered. **Chosen**: collapse the gallery by CSS only (height and opacity; nothing is removed or rebuilt, so images are not reloaded), leave a thumbnail bar with a visible **Show gallery** control, and let the visitor return at any moment. Rejected: removing the gallery (reload cost, loses Ecwid's state); keeping it half-visible (steals the space the panel needs).
On the real page the same would be done with one scoped attribute and one stylesheet, as the television already does and as `tests/live/restore-e2.cjs` proves for restoration (12 cycles). **Not yet tested for the phone**: it must be re-run on the phone layout (stage 3).

### 3.5 Starting from Ecwid's Size option
The brief suggests opening the panel when the visitor touches the native Size option. **Recommended instead: do not intercept the native control.** Stopping the pointer event would suppress the system picker, break assistive technology and autofill, and contradict "must not interfere with native behaviour". Two safe routes: a **Choose visually** button next to the native Size option (opens the panel at step 1); and, when a native option is changed by hand while the panel is open, the panel simply follows (E2-proven). A real-iPhone check is required before either is relied on (question 9.2).

### 3.6 Comparison

Scores 1 (weak) to 5 (strong); **judgement from the previews and the measurements below, not user-tested**.

| | 1. Sheet | 2. Stage | 3. Journey |
|---|---|---|---|
| Premium visual quality | 3 | **5** (the drawing is the memorable moment) | 3 |
| Ease of selection | 4 | 4 | 3 (a long list; the dock covers part of a chip until scrolled) |
| Product understanding | 3 | **5** (you see the mattress you are making) | 3 |
| Interaction clarity | 4 | 4 | 3 |
| Mobile performance (measured, 4× CPU, stand-in) | No layout shift; slowest interaction 128 ms | No layout shift; slowest 128 ms; +16 DOM nodes | **Layout shift 0.195**, the page reflows as steps open |
| Accessibility | 4 (non-modal; keyboard, focus rings) | 3 (full-screen modal: needs a focus trap and a labelled return) | 4 |
| Technical feasibility with Ecwid | 5 (an overlay, independent of Ecwid's layout) | 5 (the same) | 3 (inline, sits among Ecwid's blocks) |
| Maintenance across models | 5 (steps from the model's options) | 4 (the drawing is model-specific) | 4 |

**Recommendation: Stage**, built on the Sheet's shell so the steps are shared (the drawing is about 1.5 KB of code); the Sheet is the fallback if user testing prefers a lighter feel. **Journey is not recommended**: it measured a layout shift of 0.195 (above the 0.1 "good" threshold) in this preview and depends most on Ecwid's layout.

---

## 4. Deliverable 4: Ecwid synchronisation architecture

**Rule: the native Ecwid controls are the single source of truth. The panel never stores a competing value.** `docs/mobile/premium/src/sync.js` (8.5 KB unminified).

| Concern | Design | Evidence |
|---|---|---|
| Panel to Ecwid | `set(role, choice)` sets the native `<select>` value and fires `input` then `change`, as a person would; then verifies the value is reflected (2 s) | E2: reflected, Ecwid's price followed |
| Ecwid to panel | A delegated, capturing `change` listener on the document, filtered to option blocks; plus `Ecwid.OnProductSelectedOptionsChanged` and `OnPageLoaded` where present; plus a debounced MutationObserver | E2: a trusted user-like change on the native select was reported as `native` |
| Options located | By the option block's title (size, depth, firmness, cover), never by an id (the selects have none) | Observed |
| DOM lifecycle | Option nodes and the price node **survive** a change (checked); re-render is still handled by the observer and the delegated listener | Observed |
| Asynchrony | The price changes about 0.7 s after a change; the panel renders what Ecwid shows when it shows it | Observed |
| Rapid input | Four sets in one tick all reflected; no lost write | E2 |
| Unavailable or missing | A choice that does not exist is refused (`choice-unavailable`); nothing changes | E2 |
| Required and validation | Left to Ecwid; the panel shows "n choices left" and never submits | Required flags not verified (9.1) |
| Dependencies and availability | Disabled native choices are not offered; the four options are independent today; the adapter reads the lists each time | Observed |
| **Two live product pages (slow phone)** | The active instance is resolved, not assumed: the page the visitor touched, else the one in the popup layer, else the first. Changing one instance does not change the other | **E2, slow profile: exactly one instance changed** |
| Failure recovery | If the native options do not appear in 6 s, or a set is not reflected, the panel says so and points at Ecwid's own option; nothing is hidden; the standard controls always remain | Designed; failure paths exercised in the preview |
| Add to Bag, cart, checkout | **Never touched.** Selecting options causes only Ecwid's own catalog reads (3 POSTs to its storefront catalog API in the test, none to cart, checkout or order) | E2 |
| Responsive transitions, rotation | Overlay shells are positioned against the viewport; the dock respects the safe area | Preview; real phone needed |

Run it yourself: `NODE_PATH=$(npm root -g) node tests/live/sync-poc.cjs fast` (or `slow`). Both pass (7 and 8 checks, `docs/mobile/premium/data/sync-poc-*.json`). **E2 only**: not the test product, not a real phone.

---

## 5. Deliverable 5: resource-loading and optimisation plan

### 5.1 The loader, exactly (not implemented)
`docs/mobile/premium/proposals/loader-gate.js`, tested by `tests/loader-gate.mjs` (17 checks, stub bundles, offline):

```
site loader (tiny)
  ?ddtv=off ..................... nothing is requested
  ?ddtv=phone / ?ddtv=tv ........ review only
  shortest SCREEN side < 600 px . botanic-phone.js only   (the television bundle is never requested)
  otherwise ..................... botanic-tv.js only      (as today)
```
It uses the rule the engine already uses (`Television.prototype.isPhone`), so no device changes behaviour; only the download changes. A script that is never requested costs nothing, whereas `display:none` on something already downloaded costs everything.

| Case | Result (tested) |
|---|---|
| iPhone 13 portrait and landscape, iPhone 14 Pro Max, Pixel 7, Galaxy S9+ landscape | phone layer only |
| iPad Mini portrait and landscape, iPad Pro 11, desktop 1440 | television only |
| Rotation after load (phone and iPad) | nothing further requested (the screen's shortest side does not change) |
| Desktop window dragged to 480 px | the television bundle stays; the engine's own width rules choose the view, as today |
| `?ddtv=off` | nothing, on any device |
| Bundle returns 500 | the standard page is intact, no page error (it is the default state, so nothing needs restoring) |

Not decided: a foldable unfolded to about 673 px counts as a tablet (question 9.5). Not tested: Safari's "Request Desktop Website" on an iPhone (the screen is still a phone; expected correct, needs E4).

### 5.2 The phone layer
- Loaded after first paint; **the guided panel's code (about 24 KB of the 32 KB) loads only on the first tap of Configure, or on idle**, behind a bootstrap of about 1 KB that draws the button. (Estimated; the bootstrap is not built.)
- No framework, no animation library, no new web fonts (the Chillax stylesheet is requested once, as the television does today); the preview's stand-in is not part of the layer.
- Cover textures and the four option images load when step 4 opens; proof videos on tap; the hero video on tap.

### 5.3 Media (approved direction)
- **Posters from actual frames**: `tools/media-probe.mjs frames` extracts eight candidate frames per video, scores them (detail, mid brightness) and writes a **contact sheet for the owner to choose from**; it proposes, the owner decides. Self-tested on synthetic files only: **no real video frame was seen or chosen here** (the host answers 403). Use `node tools/media-probe.mjs frames` on a machine that can reach `media.divinedunlop.com`.
- **Measurements that need an authorised environment or a real device** (none was invented): the size, codec, bitrate and faststart state of each of the seven videos and four covers (`node tools/media-probe.mjs probe`); whether iOS honours `preload` and starts muted loops in Low Power Mode; real-phone transferred bytes before and after; Chrome UX Report or Search Console field data for LCP, INP and CLS.
- Valuable videos are not replaced; the full presentation still plays with sound on tap.

### 5.4 What is in our control and what is Ecwid's
| In our control | Depends on Ecwid |
|---|---|
| The television bundle on phones (71 KB gzip, ~0.4 s throttled) | The page's 2.2 MB, 94 requests, 45 scripts (about 95 % of the bytes) |
| Seven videos requested at load | **LCP**: measured as an Ecwid gallery image; no description redesign can move it |
| The description's length, density and effects | The duplicate product pages on slow connections |
| Our own layer's code and its layout shift (0 for Sheet and Stage) | The price recalculation delay (~0.7 s) |
| Posters, deferral of covers and technical media | The structured data Ecwid generates |

---

## 6. Deliverable 6: expected performance, design quality and maintenance

**Measured on the preview's phone layer** (`tools/premium-measure.mjs`; 4× CPU; stand-in Ecwid; excludes the real Ecwid page, the media host and real devices):

| | Sheet | Stage | Journey | Product TV (for scale) |
|---|---|---|---|---|
| JavaScript shipped, unminified | 32.0 KB (10.6 KB gzip): sync 8.5 + configurator 19.8 + firmness rule 4.4 | same | same | 278 KB (71 KB gzip) |
| CSS | 14.1 KB panel + 5.2 KB content | same | same | about 66 KB (engine, scenes, gallery) |
| Panel DOM (nodes) | 73 | 89 | 74 | ~1 113 in its shadow root |
| Script time over a full flow | 108 ms | 156 ms | 102 ms | 212–417 ms to start alone |
| Heap | 2.9 MB | 3.0 MB | 3.0 MB | ~2.2 MB added |
| Slowest interaction (Event Timing; a synthetic stand-in for INP) | 128 ms | 128 ms | 120 ms | – |
| Layout shift | 0 | 0 | **0.195** | – |

All three interactions stay under the 200 ms "good" INP threshold **in this lab**; real phones decide. The firmness rule extracted for reuse is 4.4 KB, identical on **24 531 weight and height combinations** (`docs/mobile/premium/data/firmness-core-check.json`).

**Compared with today (from the earlier study, measured):** the phone stops downloading the television (−71 KB gzip, −0.4 s) and stops requesting seven videos at load; the page gains a 10.6 KB layer, deferred to first use. Net transfer on first load falls. **No LCP gain is claimed.** Video and texture bytes: not measured.

| | Sheet | Stage | Journey |
|---|---|---|---|
| Design quality (judgement) | good, familiar | **highest** | good |
| Performance (measured) | best | within a few ms of Sheet | layout shift fails |
| Maintenance | lowest (steps from the model's options) | + one model-specific drawing | + sticky/dock layout care |

---

## 7. Deliverable 7: investigation summary

### 7.1 `price: 0.0` in the structured data
- **Observed (E2)**: the server HTML carries one `Product` JSON-LD with an `Offer` of `price "0.0"`, GBP, `InStock`. After rendering, and **after choosing a size so that the visible price became £1 199.70, the JSON-LD still said 0.0** (`docs/mobile/premium/data/structured-data.json`). It is static; it does not follow the options.
- **Not verified**: how Google treats a zero price on a product that is not free. The search that was run returned no Google statement, and the Google documentation host is not reachable from this environment (a fetch failed at DNS). **No rule is claimed.** The owner's Search Console (Merchant listings and Product snippets reports) will show any warning in minutes: that is the evidence to look at first.
- **If a concern is confirmed**, options that keep the commercial logic (each a separate proposal, none applied): (a) leave as is if no warning appears; (b) an `AggregateOffer` with `lowPrice` and `highPrice` taken from Ecwid's real configurations (needs the owner's approval of the numbers and a way to keep them in step); (c) a Merchant Center product feed with real variant prices, which Google reads in preference to markup; (d) markup that states the price depends on options, if Ecwid or its theme allows custom JSON-LD. **Not proposed**: any default or artificial initial price.

### 7.2 Duplicate DOM
- **Observed**: on the slow-phone profile the public Botanic page ended with **two** product pages (3 of 3 runs earlier, 2 of 2 now, and still two after **75 s**); iPad, desktop and fast phone had one (`tests/live/duplicate-dom-probe.cjs`).
- **Where they come from**: both are added at the same moment (about 1.6 s) from the server-rendered storefront markup (`div#static-html > .ec-storefront-v3-ssr`); the second sits in Ecwid's popup layer (`div.ecwid-popup`, `position:absolute`). The store root `#my-store-…` stays empty. Ecwid reports `OnPageLoaded` **twice** (about 13.8 s).
- **Not specific to Botanic and not caused by the two Botanic products**: the **Ambient** and **Hotel Line** product pages (no test sibling) show the identical signature, and category pages show two `OnPageLoaded` events on the slow profile too. The disabled test product cannot be opened publicly, so a direct comparison was not possible; the evidence rules out coexistence as a necessary cause.
- **Both copies are alive and independent** (`tests/live/duplicate-dom-interactive.cjs`): a choice made in one did not change the other. A guided panel must therefore bind to the instance the visitor uses; the adapter does (section 4).
- **Cause, as far as it can be stated**: Ecwid's storefront v3 server-side rendering plus its popup instance, with hydration incomplete on a slow device. Whether it ever resolves, whether visitors see two pages, and which copy Add to Bag acts on were **not established**. **No DOM was removed or modified.** A real-phone observation on a mobile network is needed (question 9.3).

### 7.3 Firmness consistency
Three sources state ranges for the same four firmness levels:

| | Soft | Medium | Firm | Extra Firm |
|---|---|---|---|---|
| **Published Firmness Navigator** (front release 0.7.0, the authoritative reference), engine base bands | up to 48 kg | 49–87 | 88–114 | 115+ |
| BOTANIC description (`.b-fc__kg`) | 0–48 | 49–83 | **83**–114 | 115+ |
| Native Ecwid option labels (read from the public page) | Up to 47 | 48–85 | 85–110 | **Over 120** |

The description overlaps at 83 kg; Ecwid's labels leave 110–120 kg uncovered; neither matches the module. **More importantly, the module's output is not those bands**: it is a rule of weight and height with locked windows (for example from 80 kg for most heights, from 72 kg at 170–175 cm, Extra Firm from 100 kg) that also yields a second option and a Dual Plush recommendation (`docs/mobile/premium/data/firmness-consistency.json`, `tools/firmness-consistency.mjs`). A single table of ranges would therefore **contradict the module** wherever it is shown.
**What the preview does**: it asks the extracted rule; it shows guidance, not ranges; it hides the description's kilogram text visually (still in the DOM and the server HTML) and does not repeat Ecwid's label ranges. **What it cannot do**: the native Ecwid select still shows the old labels, and the description still states the old ranges. Aligning them is the owner's decision and an Ecwid and description edit; nothing was changed (question 9.6).
**Where the module lives**: `divine-firmness/` on branch `claude/divine-firmness-visual` of this repository, served from jsDelivr by pinned commit on divinedunlop.com. **Reused**: the decision rule only (4.4 KB, generated by the build from the git ref and proven identical). **Not imported**: the 130 KB scene, the sketches, the fonts, the form and its contact handling. The module's graphics could be adapted later (question 9.7).

---

## 8. Deliverable 8: staged implementation plan with rollback

| Stage | What | Depends on | Gate | Rollback |
|---|---|---|---|---|
| 0 | Owner-side measurements: `media-probe`, real-phone network panel, Search Console price report, required flags in Ecwid Admin, the real-phone duplicate observation | Owner's machine and devices | Numbers recorded in the proposal | None (read-only) |
| 1 | Loader gate on the **test product** first | Approval; 5.1 | Phone: no television request; tablet and desktop unchanged; all existing suites and the new `loader-gate` test green | Restore the old loader line |
| 2 | Posters and media on demand (hero, five proofs); cover textures deferred | Posters chosen (5.3) | Zero media requests at load on a real phone; playback works on iOS | Restore the attributes |
| 3 | Refined Variant C content on phones (CSS plus a small script; the server HTML unchanged) | Stage 1 | All 422 texts present; Search Console URL Inspection; real-phone review | Remove the phone layer |
| 4 | Guided panel, **Sheet shell**: steps, synchronisation, summary, gallery collapse and restore | Stage 3; sync proof re-run on the **test product** (E3) | `sync-poc` against the test product; phone restore test (12 cycles); duplicate-instance test on a real phone; accessibility audit | Remove the panel script; the CTA disappears; Ecwid's options remain |
| 5 | **Stage** drawing on top of the Sheet | Stage 4 and owner's choice after seeing it on phones | Layout shift stays 0; INP under 200 ms on a real phone | Switch the shell back |
| 6 | Firmness alignment: description and Ecwid labels follow the module (owner's edits) and the panel shows the module's guidance | Owner's decision (7.3) | The three sources agree | Revert the edits |
| 7 | Second model on the same layer | Stage 4 | The reuse suite extended to the phone layer | – |

Every stage is a separate, reversible change on the test product first, with no deployment without explicit approval.

---

## 9. Deliverable 9: unresolved questions for the owner

1. **Required options.** Which of Size, Depth, Firmness and Cover are required in Ecwid? (Visible in Ecwid Admin; cannot be tested without pressing Add to Bag.)
2. **Starting from the native Size option.** Agree not to intercept it and to add a **Choose visually** button beside it? A real iPhone is needed to confirm.
3. **Duplicate pages.** Can you observe two pages on a real phone on mobile data, and which one Add to Bag uses?
4. **Construction illustration.** An approved drawing of the mattress construction is needed; none was invented.
5. **Foldables.** Treat an unfolded foldable (about 673 px) as a tablet?
6. **Firmness.** Update the description's ranges and Ecwid's option labels to follow the module, or keep them and show guidance only? Who approves the wording?
7. **Firmness graphics.** Adapt any of the module's graphics (the model photo, the spine) for the phone, or keep the phone drawings new?
8. **Autoplay.** Confirm the hero's teaser loop is retired on phones in favour of the full video on tap.
9. **Posters.** Who chooses the frames from the contact sheet?
10. **Concept.** Stage (recommended) over Sheet, or user testing first?
11. **Structured data.** Check Search Console for price warnings and decide whether a separate proposal is wanted (7.1).
12. **Dual models and toppers.** For Dual Plush the firmness is a pair (mattress plus topper): the panel's firmness step needs its own design for those models before they are added.
13. **Real devices.** Access to a real iPhone and iPad for every stage.

---

## 10. Scalability (BOTANIC first, not a universal system)

- The synchronisation adapter and the steps are **role-based** (size, depth, firmness, cover found by the option title), not Botanic-specific. A model supplies its list of steps, its approved wording (read from its own description through the existing dialect) and, optionally, a firmness rule; a model without one skips the guidance and offers the four choices.
- It fits the existing multi-model architecture: the model configuration gains a `phone` profile next to `layout`, `features` and `modelGallery`; the validator checks it against the model's own description; the ratchet test is extended so no Botanic name enters shared phone code.
- Not generalised yet: the stage drawing (model-specific), the firmness rule (one model so far), the option kinds of dual models.

---

## 11. Limits of this phase

- The media host answers 403 from this environment: **no video or texture bytes, no playback timing, no real poster frames**.
- Chromium only. No Safari, no real phone or tablet (E4). Touch feel, Low Power Mode, the on-screen keyboard, focus behaviour with VoiceOver are unverified.
- The preview's Ecwid block is a stand-in; its price rule is an illustration of what was observed on one date. The real-page proof is E2 on the public product, not the test product (E3).
- Concept scores are judgement; no user testing.
- Google's documentation could not be read; no claim is made about how it treats the zero price.
- Nothing was deployed or changed in the store, the description, the Product TV engine or the existing builds. New and changed files are the preview, its build and measurement tools, the new test scripts, the loader proposal, data captures, and this document.
