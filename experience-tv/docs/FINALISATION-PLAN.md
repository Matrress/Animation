# Finalisation plan: TV screen, large platform and the next models

Status: **proposal for owner review**. Nothing in this plan is deployed, and nothing touches the live Ecwid store. Each stage ends with a gate that needs the owner's explicit approval.

## 0. Where we stand

| Layer | State | Evidence level |
|---|---|---|
| Mobile configurator (Graphite, `docs/mobile/premium/preview/graphite.html`) | Approved look for Size, Firmness, Depth, Cover and the description; 62 automated checks pass | E1 (stand-in page) and E2 (real Ecwid DOM, read-only, local) |
| Description, direction H (light ground, turquoise graphite video card and bands, blue-teal) | Owner's lead version | E1 |
| Product TV engine (`engine/`, `schema/`) | Built and tested (earlier phases); the desktop and iPad "TV screen" has not yet been restyled to the approved palette | E1/E2 |
| Gallery integration, Visual Asset Registry, model descriptor | Built and tested with a second placeholder model | E1 |
| Media (video, poster frames) | Size and format not yet measured, because the media host refused requests from the build sandbox | Not measured |
| Ecwid test product (E3), real devices (E4) | Not done; both need owner approval or access | Not done |

## 1. What "TV screen" and "large platform" mean here

- **TV screen**: the Product TV monitor of the engine, the moving-image panel on desktop and iPad. It is the same visual language as the mobile configurator, but with its own layout and its own player controls.
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

### Stage T: TV screen (desktop and iPad)

- **T1. One token file.** Replace the stacked override layers (`description-light`, `description-turquoise`, `description-hybrid`, earlier `description-dark`) with one `design-tokens.css` and one component layer. Most of the `!important` declarations exist only because of the layering. Gate: the mobile preview looks the same (screenshot comparison, same tolerance as the existing checks).
- **T2. Apply the tokens to the TV monitor.** Check every colour in `engine/ddtv-*.css` against the palette; remove any remaining green; apply the button roles from section 2. Gate: no visible difference on the mobile preview; desktop and iPad screenshots reviewed by the owner.
- **T3. Layout on desktop and iPad.** Portrait and landscape at 768, 834, 1024 and 1280 px; touch and mouse. The existing iPad tests in `tests/` are the starting point. Gate: no horizontal scroll; the monitor and the text never overlap.
- **T4. Accessibility.** Contrast for every text pair (the mobile check is the template); a visible focus ring in turquoise on every button; keyboard order; labels for the play, close and disclosure controls. Gate: keyboard run and an automated audit with no serious findings.
- **T5. Evidence.** Re-run the engine tests, the 62 preview checks and the new TV checks. Record the results in `docs/TEST-MATRIX.md`.

### Stage P: large platform

- **P1. Shared tokens and button library** used by every model (from T1 and T2).
- **P2. Media.** The owner runs `tools/media-probe.mjs` from a machine that can reach the media host. The output decides the poster frames, the maximum file sizes and whether the heavy Product TV loads on phones at all. Gate: the numbers are in the study document, and the owner approves the sizes.
- **P3. Loader.** The gate proposal (`docs/mobile/premium/proposals/loader-gate.js`) is tested with stubs. Phones request only the phone layer; tablets and desktop request the TV bundle. Gate: a test on a throttled profile with real requests, not stubs.
- **P4. Ecwid connector on a test product (E3).** The sync adapter is proven locally (E2). The next step needs the owner's written approval, the test product number, and a rule that nothing is saved to the cart or checkout.
- **P5. Native Ecwid options.** The native Firmness menu still lists Extra Firm (+£88). Removing or relabelling it is a live-store change. It is prepared as a step-by-step instruction and happens only after the new design is approved for go-live.
- **P6. Real devices (E4).** Two phones, one tablet, one laptop, in both Standard and Optimised views.
- **P7. Deployment.** The procedure is in `docs/DEPLOYMENT.md`. Add a rollback step: the previous embed stays available behind the `?ddtv=off` switch until the new one has run without incident.

### Stage M: other models

- The engine is not changed for a new model. A new model needs: its configuration (checked by `schema/ddtv-schema.js`), its assets in the registry, its own accent colour as an override token, and its copy.
- The procedure is in `docs/ONBOARDING-NEW-MODEL.md`. The placeholder second model (task 17) is the test that the procedure works.
- Gate for each new model: the schema validator passes, the 62-style checks pass for its configurator, and the owner signs off its colours.

## 4. Gates that need the owner

1. Approve the T1 consolidation (one token file), which changes the code but not the look.
2. Confirm the naming: the label says "Orthopaedic Coconut **Core**", the verified product page says "Orthopaedic Coconut **Coirs**". The label and the page must match before go-live.
3. Confirm the video card question: the card should sit only at the side of each video, or around the whole block with its title.
4. Run `tools/media-probe.mjs` on a machine that reaches the media host and send the numbers.
5. Approve the E3 test product run (P4), in writing, with the product number.
6. Approve or refuse the removal of the native Extra Firm option (P5), at go-live only.
7. Confirm the Custom Sizes link target (`/customsizes` or the Ecwid contact page).

## 5. Definition of done

The project is finished when each of these is true, with the evidence recorded:

- The TV screen and the mobile configurator use one token file and one button library, with no green and no hard-coded colours outside the token file.
- Every button has a role and orientation from section 2, and the keyboard and screen-reader checks pass.
- The media sizes are measured and approved; the phone layer is lighter than the TV bundle on a throttled profile, measured with real requests.
- The Ecwid connector has run on the test product (E3) with the owner's approval, and the real devices (E4) have been tested.
- A second model has gone through the onboarding procedure without any change to the engine.

## 6. Risks

- **The media host** refuses requests from the build sandbox, so the weights are unknown until the owner measures them.
- **Ecwid's option structure** may differ between products; the connector is proven on one product and must be re-checked for each new model.
- **Stacked overrides** make the styles fragile; stage T1 removes most of the risk.
- **Brand decisions** (naming, the Extra Firm route, the store options) belong to the owner and must not be made in code.

## 7. What we do next

1. The owner reads this plan and answers the seven questions in section 4.
2. Stage T1 starts once the owner agrees to the consolidation.
3. The owner runs the media probe in parallel, because it does not depend on the code.
