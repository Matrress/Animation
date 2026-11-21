# Ecwid compatibility contract

Status: **standing rule**. Ecwid is the executor of the whole task. It owns the product, its options, the price, the cart, the checkout and the orders. Our code is the front of the shop: it presents, guides and drives the store's own controls. Everything we build must work **through** Ecwid, never around it. If Ecwid and our layer ever disagree, Ecwid is right and our layer steps aside.

Last full check against the real store: **11 November 2026** (public product 831592302, read-only, local browser). Result in section 4.

## 1. Who owns what

| Ecwid owns | We own |
|---|---|
| The product, its options and their choices, labels and price modifiers | How the choices are presented and explained |
| The **price** (and any discount, tax and currency) | Showing the price Ecwid gives; never calculating one |
| Stock, availability, the cart, the checkout, the orders, accounts | Nothing of these; we never touch them |
| The product page, its address, routing and gallery images | The television, the guided panel, the description's layout |
| The structured data (JSON-LD) for search engines | Nothing; we do not touch it |
| The native option controls (the four dropdowns) and Add to Bag | Reading them, and setting them the way a customer would, then checking Ecwid accepted it |

## 2. Hard rules (a change that breaks one is not merged)

1. **No price is calculated, stored or hard-coded** in our code. The price shown is the one Ecwid shows, read after it has updated. A size's "starting price" is Ecwid's own price after choosing only the size.
2. **No cart, checkout, order or customer request** is made by us, ever. Add to Bag stays Ecwid's button and is never clicked by our tests.
3. **No write to the store.** Our code never edits a product, an option or a page. (Any change in Ecwid Admin is the owner's, and is prepared and approved step by step.)
4. **We set an option the way a customer does:** by changing the native control and letting Ecwid react; then we read it back and confirm. If Ecwid does not accept a choice, we report it and change nothing else.
5. **Nothing depends on Ecwid's class names or element ids.** The four options are found by the **role of their title** (size, depth, firmness, cover); the price is read from where Ecwid shows it. If something is not found, the layer steps aside and the standard page stays.
6. **Fail-safe.** If anything is missing, late or changed, the store's own page keeps working exactly as without us. `?ddtv=off` switches our layer off completely.
7. **The customer can always use Ecwid's own menus** ("Use Ecwid's own menus instead"). The native controls are never removed for good.
8. **Both states of a native option are supported**, before and after the owner changes it in Ecwid Admin (for example the Firmness menu with and without Extra Firm).

## 3. The integration points we use, and the Ecwid behaviour they rely on

| We use | Ecwid behaviour (observed) |
|---|---|
| The four native option blocks, found by title role | Order today: Size, Depth, Firmness, Covers. The options are independent: choosing one does not change another's list. The controls are dropdowns. |
| Setting a choice: change the select, then `input` and `change` | Ecwid re-reads the product and updates the price about **0.7 to 1.5 seconds** later (a catalogue read). Our code never blocks the screen waiting for it. |
| The price element | Starts at £0 (the base price is zero; the price is the sum of the option modifiers, less the store's discount: 22 of 22 sizes equal 90 % of the label modifier). |
| Ecwid's own events (`OnPageLoaded`, option changes) and a mutation observer | The page is a single-page application: product pages are swapped without a reload; the television must start once, and disappear when another product opens. |
| The catalogue read for gallery images | One extra `catalog/product` request, only when the customer asks for the model gallery. |
| The product page's description element | Ecwid delivers the description as HTML; we never remove or change its text. |

On a throttled phone profile Ecwid builds **two copies of the product page** (one from the server, one in its popup); both stay alive. Our adapter works out which one is active and drives that one.

## 4. State on 11 November 2026 (read-only, public product)

| Check (`tests/live/canary.sh`) | Result |
|---|---|
| Option structure | 4 dropdowns: Size (22 sizes), Depth (3), Firmness (4: Soft, Medium, Firm, Extra Firm +£88), Covers (4) |
| Sync adapter, fast and slow profile | all checks pass; no cart, checkout or order request (3 POSTs, all Ecwid's own catalogue reads) |
| Size prices | 22 of 22 equal 90 % of the label modifier (informational) |
| Extra Firm link | the Orthopaedic Coconut product page is live and indexable at exactly the address we use |
| Real runtime events, Add to Bag reachability, gallery, Standard Product View restoration | all checks pass |
| Page errors | the same "Uncaught (in promise)" appears **with no injection at all**: it is the store's own, not ours |
| Structured data | `price: "0.0"` before and after a choice (Ecwid's own); the visible price follows the choice |

The full record: `docs/mobile/premium/data/ecwid-e2-2026-11-11.json`.

## 5. Things the check found that matter for the design

1. **The Size menu holds a non-size.** Besides "Please choose" and the 22 sizes, it ends with **"For More Options CONTACT US"**. Our configurator already shows only real sizes. The owner's decision (Custom Sizes becomes a contact form that sends the model, the size wanted and an email) replaces that entry; whether the native entry stays in Ecwid at go-live is a decision for the owner, because a customer using Ecwid's own menu can still select it.
2. **The Firmness labels leave a gap.** Soft is up to 47 kg, Medium 48 to 85, Firm 85 to 110, Extra Firm over 120. A weight between 110 and 120 kg matches no label. This is Ecwid's text; our guidance must not invent a range, and the owner may want the labels corrected.
3. **Options are not marked as required by anything the probe can see, and Add to Bag is enabled with nothing chosen,** while the base price is £0. The probe looks for an asterisk or `aria-required`; the store may still refuse on click, which we never test on the live store. **Owner to check in Ecwid Admin that all four options are set as required** (so that a £0 mattress cannot be added). To be verified on the test product at E3 by the owner, on the test product only.

## 6. What can break us, and what protects us

| Risk | Protection |
|---|---|
| Ecwid changes class names or markup | We never depend on them (rule 5); the canary warns first |
| Ecwid changes how it updates the price | The price is read, never computed; the adapter verifies each set |
| A choice is renamed, added or removed in Ecwid Admin | Choices are read from the live control each time; both states are supported (rule 8); the canary warns |
| Ecwid swaps the page without a reload | Start and stop on its events; one television only (tested) |
| Two copies of the product page on a slow connection | The active copy is resolved (tested on the slow profile) |
| Ecwid strips scripts from the description | The loader goes to the site's custom code, not the description (DEPLOYMENT.md, step 4) |
| A new Ecwid version breaks something unseen | `tests/live/canary.sh` before every release and about weekly |

## 6b. Still unknown (needs the test product or the owner)

- Whether the test product 876405767 has the same options, order and labels as the public product (it is disabled; this is what E3 checks).
- How the site that hosts the store lets custom code in, on the plan the owner has (DEPLOYMENT.md, step 4).
- Whether Ecwid's checkout shows the four chosen options in the cart for the test product (the owner checks this by eye at E3).

## 7. For every change

Before a change is merged: `bash tests/live/canary.sh` (read-only, public page), `tests/guardrails.mjs`, the engine tests and the preview checks. Any result that is not a pass is reported with its cause; nothing is described as verified on the real store unless it was observed on the real store, and the test product is E3, not E2.
