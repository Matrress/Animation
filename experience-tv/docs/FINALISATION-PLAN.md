# Finalisation plan: TV screen, large platform and the next models

Status: **proposal for owner review**. Nothing in this plan is deployed, and nothing touches the live Ecwid store. Each stage ends with a gate that needs the owner's explicit approval.

## 0. Where we stand

| Layer | State | Evidence level |
|---|---|---|
| Mobile configurator (Graphite, `docs/mobile/premium/preview/graphite.html`) | Approved look for Size, Firmness, Depth, Cover and the description; 62 automated checks pass | E1 (stand-in page) and E2 (real Ecwid DOM, read-only, local) |
| Description, direction H (light ground, turquoise graphite video card and bands, blue-teal) | Owner's lead version | E1 |
| Product TV engine (`engine/`, `schema/`) | Built and tested (earlier phases); the large-screen "TV screen" has not yet been restyled to the approved palette, and some comments and tests still describe iPad | E1/E2 |
| Gallery integration, Visual Asset Registry, model descriptor | Built and tested with a second placeholder model | E1 |
| Media (video, poster frames) | Size and format not yet measured, because the media host refused requests from the build sandbox | Not measured |
| Ecwid test product (E3), real devices (E4) | Not done; both need owner approval or access | Not done |

## 0b. Owner decisions recorded (11 November 2026)

These are decided and are preserved by every later stage.

- **Naming (question 2).** The label is "Orthopaedic Coconut Core". The owner aligns the specialist product page to the same name ("Core"). We do not change the live store; until the page is renamed, the link still works, and the mismatch with "Coirs" is only in the page title.
- **TV in the TV (question 3).** The small video card is not a card around the video. It is a second, smaller television inside the main television. The presentation video stays the large one at the start of the main menu. Each other video (for example ventilation) appears as the small television beside its chapter with a short caption, and an arrow enlarges it without losing the television or its options.
- **Extra Firm (question 6, corrected by the owner on 11 November 2026).** Extra Firm is **not removed**; it is redirected to the specialist model (Orthopaedic Coconut Core). The native Ecwid option stays as it is. In our screens Extra Firm opens the specialist page only when the customer taps it. Open: what the screen does if a customer picks Extra Firm in Ecwid's own menu (proposal in `docs/TV-JOURNEY-PROPOSAL.md`, section 4).
- **Custom Sizes (question 7).** The link opens a contact form. The form carries the model (filled in automatically), the size the customer wants, and an email address for the reply. **It goes to `support@divinedunlop.com`** (a public support address; the owner's earlier answer is superseded). Open (technical, mine to propose): how a static page sends the message (a form service or a small server function); the address is kept in that configuration, not in the page.
- **T1 token consolidation.** Approved as a technical refactoring only. The look, colours, typography, layout, interactions and functions must not change. Regression checks and a before-and-after comparison are required. The engine and the Ecwid integrations stay intact.
- **Media probe.** Run from this environment; see `docs/mobile/MEDIA-DIAGNOSTICS.md`.
- **Ecwid test product.** 876405767 is authorised as the test product. The procedure is prepared (`docs/mobile/premium/E3-MOBILE-PROCEDURE.md`); **no change is authorised yet**. The owner's explicit approval is required before any Ecwid change. The live store stays untouched.
- **Large screens (question 1, answered).** Everything above a phone is a large screen: monitors, laptops and tablets of every make. The rule is in `docs/DEVICE-CLASSES.md` and is adopted. The owner's real test device is an **iPad Pro 12.9 inch, 3rd generation**; Samsung, Huawei and other makes are covered by capability-based code and by simulated tests until a device of each kind is tested.
- **Custom sizes requests** go to `support@divinedunlop.com` (see question 7 above).
- **Videos.** The small videos (about 7 to 10 seconds, looping) stay as they are; they are not enlarged. Each model has a full presentation video that can be watched in full. No larger rendition is needed for the small videos.
- **The television is the selection tool; the phone is the short version.** The television's main job is to guide the selection step by step, interactively and easily, on the rules built so far. The phone version is much shorter. The television comes first; the phone layer's production build waits.
- **The owner specifies every button of the large monitor** (what it shows, label, where it leads), on the sections already agreed, with modifications to optimise. The template, pre-filled from today's television, is `docs/TV-BUTTON-SPEC.md`.
- **Standing rule: the screen and Ecwid's controls stay in step, in both directions (mandatory on the large screen).** Every button that chooses a size, a firmness, a depth or a cover sets Ecwid's own control; every change of Ecwid's own control shows on the screen; Add to Bag stays Ecwid's button and adds exactly what both show. Tested: `tests/sync-contract.mjs` (simulated store) and `tests/live/tv-sync-e2.cjs` (real Ecwid DOM, public product, read-only); both pass.
- **Standing rule: Ecwid is the executor.** Ecwid owns the product, its options, the price, the cart, the checkout and the orders; our code only presents, guides and drives the store's own controls, and steps aside if anything does not fit. The contract, the state of the real store on 11 November 2026 and the canary are in `docs/ECWID-COMPATIBILITY.md` and `tests/live/canary.sh`.
- **Standing rule: indexing and speed.** After every change the code must stay precise, load well and index well; smooth for the customer and for Google. `docs/SEO-AND-PERFORMANCE-GUARDRAILS.md` and `tests/guardrails.mjs` enforce it: a change that gets a ratchet worse is not merged.

## 1. What "TV screen" and "large platform" mean here

- **TV screen**: the Product TV monitor of the engine, the moving-image panel on every large screen: desktop and laptop monitors, and tablets of any maker (Apple, Samsung, Huawei, Lenovo, Xiaomi, Microsoft Surface and others), in touch and mouse use, portrait and landscape. It is the same visual language as the mobile configurator, but with its own layout and its own player controls.
- **Device-neutral rule**: the layout is decided by the space and the input the browser reports, never by the brand or model. No user-agent sniffing and no "iPad" branch. iPad is one device among many.
- **Large platform**: everything shared across the product pages. That is the design tokens (colour, radius, shadow, halo, type scale), the button system, the Ecwid connector, the media pipeline, the loader and the deployment procedure.
- **Other models**: any new mattress that uses the same engine. The engine stays unchanged; each model supplies its configuration, assets and, where needed, its accent colour.

## 2. Button inventory: role and orientation

Every button gets one role and one orientation. The orientation says what the button does to the customer's position: forward, back, open, close, play, or leave the page. This table is the working list; the "decision" column is what we propose to do.

| Button (class) | Where | Role | Orientation | Decision |
|---|---|---|---|---|
| Primary action (`b-btn-p`, `b-btn-hero-p`, `btn--p`) | Video card, closing call to action, hero | Primary | Forward (→) | Turquoise gradient, white text, sky edge, faint halo. Used once per block. |
| Secondary action (`b-btn-o`, `b-btn-hero-o`) | Video card, hero, closing call to action | Secondary | Forward or sideways | White edge, transparent fill, same halo in white. |
| Continue (`gx-btn`) | Configurator dock | Primary, step forward | Forward (→) | Label "Continue to **Step**". Keeps the approved wording. |
| Use Ecwid's own menus (`gx-alt`) | Configurator dock | Tertiary, escape | Leave the custom flow | Underlined text link; never styled as a button. |
| Step pills (`pill`) | Configurator, step rail | Navigation | Back (←) for completed, forward (→) for next | Completed steps show a check; the current step is outlined. |
| Size and firmness chips (`gx-chip`, `gx-cov`, `gx-card`) | Configurator | Selection | Not a movement | Selected state is a 2 px edge; non-recommended options fade, they are not hidden. |
| Specialist route (Extra Firm, `a.gx-card.sp`) | Firmness | Link to another product | Leave the flow (↗) | Plain link to the specialist product page, followed only when tapped. Sliders never navigate. |
| Play (`p-video`, `p-play`) | Videos | Media | Open the player | Circle with white glyph on the dark frame. |
| Disclosure (`summary`, "+") | Accordions and cover options | Expand or collapse | Open (+) / close (×) | Plus is sky blue on dark, deep turquoise on light. |
| Close (`gx-x`, `b-video-modal__close`) | Overlays | Dismiss | Back (×) | Round, white glyph, top right. |
| Back to top (`b-floating-top`) | Long description | Navigation | Up (↑) | Fixed, turquoise graphite fill, appears after the first screen. |
| Hero links (`b-hero-rule__link`, Full Firmness Navigator) | Text | Reference link | Leave the page (↗) | Underlined, white text, marked as external. |

Two open points in this table: whether the back-to-top button should appear only after the first screen (proposed yes), and whether the step pills should show the chosen value under each completed step (proposed yes, once the value is short enough).

## 3. Stage plan

### Stage T: the TV screen on every large device

The layout depends on capabilities, not on device names. The browser reports the space, the pointer, the touch points and the orientation; the engine responds to those.

- **T0. Device classes.** Define the classes the engine uses, in `docs/DEVICE-CLASSES.md`: width and height of the monitor container (not of the window), orientation, pointer (fine or coarse), hover, touch points, zoom and reduced motion. Gate: the owner approves the classes.
- **T1. Container-based layout.** Move the monitor's breakpoints to CSS container queries, so the monitor adapts to its own width wherever it is embedded. Today the engine uses viewport media queries and `pointer: coarse` for tap sizes. Rewrite the comments that name iPad in capability terms. Gate: the same screens appear at the same container widths, whatever the device.
- **T2. One token file and the button roles** (sections 2 and 3, stage T1 above), applied to the monitor. The token file for the phone preview exists and is verified (T1 of the preview; `docs/mobile/premium/T1-TOKEN-CONSOLIDATION.md`); the television's own styles are next.
- **T2b. The two open targets from the guardrails** (`docs/SEO-AND-PERFORMANCE-GUARDRAILS.md`, section 3): videos are requested at load (only the opening loop is needed; the full presentation video should wait to be opened), and the product block jumps by 927 pixels on a portrait tablet when the television is inserted (layout shift 0.53 to 0.60, target below 0.1). Both need the owner's button specification first.
- **T3. Test matrix, device class by engine.**
  - Engines: Blink (Chrome, Edge, Samsung Internet, Huawei Browser), WebKit (Safari on iPadOS and macOS), Gecko (Firefox).
  - Classes: 7 to 8 inch tablet, 10 to 11 inch, 12 to 13 inch, 14 to 16 inch laptop, 21 to 24 inch monitor, 27 inch and wider or ultrawide.
  - Portrait and landscape; touch, mouse and hybrid (touch laptops and convertibles).
  - Zoom at 100, 125 and 150 per cent; reduced motion switched on.
  - Gate: no horizontal scroll, no overlapping, and tap targets of at least 44 px on coarse pointers, in every cell of the matrix.
- **T4. Video on every engine.** Check codec support and fallback, the autoplay policy, and the fullscreen differences between engines. Do not assume iOS behaviour for other systems. Gate: the proof videos play in each engine class in the matrix.
- **T5. Accessibility**, as before: contrast of every text pair, a visible turquoise focus ring on every button, keyboard order, and labels for play, close and disclosure controls. Gate: keyboard run and an automated audit with no serious findings.
- **T6. Evidence.** Each cell of the matrix is recorded in `docs/TEST-MATRIX.md` with its evidence level.

**What emulation cannot prove.** Playwright device profiles cover layout and the engines, which is evidence at level E2. They do not cover vendor behaviour in Samsung Internet, the Huawei Browser or the video decoders of a particular tablet. Those cells stay open until they are tested on real devices (E4). We have no vendor devices in this environment, so the owner should say which ones are available, or whether a device lab can be used.

### Stage P: large platform

- **P1. Shared tokens and button library** used by every model (from T1 and T2).
- **P2. Media.** The owner runs `tools/media-probe.mjs` from a machine that can reach the media host. The output decides the poster frames, the maximum file sizes and whether the heavy Product TV loads on phones at all. Gate: the numbers are in the study document, and the owner approves the sizes.
- **P3. Loader.** The gate proposal (`docs/mobile/premium/proposals/loader-gate.js`) is tested with stubs. Phones request only the phone layer; tablets and desktop request the TV bundle. Gate: a test on a throttled profile with real requests, not stubs.
- **P4. Ecwid connector on a test product (E3).** The sync adapter is proven locally (E2). The next step needs the owner's written approval, the test product number, and a rule that nothing is saved to the cart or checkout.
- **P5. Native Ecwid options.** Extra Firm **stays** in Ecwid's Firmness menu (+£88); it is not removed (owner's decision of 11 November 2026). Our screens redirect it to the specialist model. Any change to the store's options (for example a label correction, or marking options as required) is the owner's change in Ecwid Admin, prepared and approved step by step.
- **P6. Real devices (E4).** Two phones, one tablet, one laptop, in both Standard and Optimised views.
- **P7. Deployment.** The procedure is in `docs/DEPLOYMENT.md`. Add a rollback step: the previous embed stays available behind the `?ddtv=off` switch until the new one has run without incident.

### Stage M: other models

- The engine is not changed for a new model. A new model needs: its configuration (checked by `schema/ddtv-schema.js`), its assets in the registry, its own accent colour as an override token, and its copy.
- The procedure is in `docs/ONBOARDING-NEW-MODEL.md`. The placeholder second model (task 17) is the test that the procedure works.
- Gate for each new model: the schema validator passes, the 62-style checks pass for its configurator, and the owner signs off its colours.

## 4. Gates that need the owner

1. Approve the device classes (T0) and the matrix in T3, and tell us which tablets and laptops you can provide for the real-device tests (E4), including any Samsung and Huawei devices.
8. Approve the T1 consolidation (one token file), which changes the code but not the look.
2. (Decided, see 0b) Naming: the label says "Orthopaedic Coconut **Core**", the verified product page says "Orthopaedic Coconut **Coirs**". The label and the page must match before go-live.
3. (Decided, see 0b) The video card is a small television inside the main television.
4. Run `tools/media-probe.mjs` on a machine that reaches the media host and send the numbers.
5. Approve the E3 test product run (P4), in writing, with the product number.
6. (Decided: Extra Firm is not removed, it is redirected; see 0b.) Still open: what the screen does if Extra Firm is chosen in Ecwid's own menu.
7. Confirm the Custom Sizes link target (`/customsizes` or the Ecwid contact page).

## 5. Definition of done

The project is finished when each of these is true, with the evidence recorded:

- The TV screen and the mobile configurator use one token file and one button library, with no green and no hard-coded colours outside the token file.
- Every button has a role and orientation from section 2, and the keyboard and screen-reader checks pass.
- The media sizes are measured and approved; the phone layer is lighter than the TV bundle on a throttled profile, measured with real requests.
- The TV screen passes the device-class matrix on every engine class, and each cell records its evidence level.
- The Ecwid connector has run on the test product (E3) with the owner's approval, and the real devices (E4) have been tested.
- A second model has gone through the onboarding procedure without any change to the engine.

## 6. Risks

- **The media host** refuses requests from the build sandbox, so the weights are unknown until the owner measures them.
- **Ecwid's option structure** may differ between products; the connector is proven on one product and must be re-checked for each new model.
- **Stacked overrides** make the styles fragile; stage T1 removes most of the risk.
- **Brand decisions** (naming, the Extra Firm route, the store options) belong to the owner and must not be made in code.
- **Vendor browsers** (Samsung Internet, Huawei Browser) and tablet-specific video decoders cannot be fully proven by emulation; those cells need real devices.

## 7. What we do next

1. The owner fills in `docs/TV-BUTTON-SPEC.md`, part by part (chapters first, then the selection steps).
2. From that specification, stage T builds the television's selection experience; the two open targets (T2b) are fixed in the same pass.
3. The phone layer's production build, the Ecwid test (E3, needs the owner's explicit approval) and the real-device tests follow.
