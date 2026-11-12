# Prices, promotions and checkout: the contract for every model

Owner's rule (12 November 2026), for the mobile and the large version, and for every later model built from this engine: **the customer always sees the real price and the price with the discount, and the discount is clearly stated; and Go to Checkout takes the customer to the checkout at once.** Our prices are always promotional, the percentage changes (10, 15, 17 per cent or any other), and the promotion is run in Ecwid.

## The owner's laws (12 November 2026, final)

These are the rules every model follows. They replace the earlier assumptions in this document where they differ.

1. **Prices are entered in Equity.** Each size's price and its final price are entered in Equity, and the store's price comes from there.
2. **The promotion is an automatic rule in Equity's Promotions.** The rule shows, in Equity, which promotion is active now and what it gives. Our promotions are always running: 10, 15, 17 per cent or another percentage, and it changes.
3. **The discount is taken from the Promotions rule, not from us.** Once the rule is active, the store shows the discount: the price without the discount (struck through) and the price with it. The module shows exactly those two prices and the discount note. It does not calculate them.
4. **The panel must show them, on every screen where a price is shown.** The large selection panel, the Review step, and the mobile selection dock. The checkout is the shop's own page.
5. **"Redeem your discount" in the checkout is not ours.** It is the shop's own checkout field and the module does not touch it.
6. **Add to Bag becomes READY only when the four processes are complete**: size, depth, firmness and cover are all chosen. A READY button is larger and lit with a crisp ring (no blur). Before that it is off.
7. **Clicking READY adds the mattress to the bag** (Ecwid's own button does it). When Ecwid confirms it is in the bag, the same button becomes **Go to Checkout**, and a second click opens the checkout page.
8. **A changed choice after that** means the bag no longer matches the four choices: the button goes back to Add to Bag, and READY again only when the four choices are covered again.

What this means for the build: the module reads the price, the struck-through price and the discount note from the store page (`price.current`, `price.compare`, `price.discount` in each model's config), shows them on the panels, and reads the cart event to decide which face the button has. It never calculates a price, and it never reads or changes the checkout's discount field.

**Open, to verify on the test product before go-live (owner's approval needed):**
- Where the store shows the active promotion's name and state. The product page shows the discount; the name of the active rule is visible in Equity. We need only the text the store shows; if the name is wanted on the page, it has to come from a value kept next to the model's config, not from calculation.
- I could not find documentation for "Equity" as a product in the public sources I searched. I treat it as the owner's name for the store's price and promotion system. If Equity is a separate system, its documentation is needed before any integration is built.

## Go to Checkout opens the shopping cart (owner, 12 November 2026, corrected)

- **Go to Checkout takes the customer to the shopping cart** (Ecwid's cart page), not to the checkout. The cart shows the order's structure, built directly from our selections: size, firmness, depth, cover, and the promotion.
- The building of that order and the promotion are **Equity's** work, through Ecwid's own protocol. Our part is to hand over the whole selection to the cart, correctly, in one step.
- In the cart the customer enters the **e-mail**, then continues to the checkout. The coupon and the e-mail code are entered there, never in the configuration.
- The mobile module calls `Ecwid.openPage('cart')` (the cart page). It does not call `Ecwid.Cart.gotoCheckout()`, which would skip the cart. The large design shows the same behaviour in its preview (nothing is opened).
- Research note: Ecwid's documentation lists `'cart'` among its open-page options, and the cart page's first step is the e-mail and coupon entry (checkout step 1). This is consistent with the protocol above and is to be confirmed on the test product.

## Addendum (12 November 2026): the five factors, READY and the coupon

- The checkout is made of the **five factors**: size, firmness, depth, cover, and the promotion. The promotion's discount is shown as the store gives it (the price without it and the price with it); its **name is not shown** (it stays in the store's promotions).
- The configuration gives the bag the four choices; the **READY** rule and the stay-active rule are in `engine/selection-rules.js` and in `docs/DECISIONS.md` ("Selection laws").
- The **coupon and e-mail code** are entered in the checkout. They are not part of the configuration.
- Equid (the owner's name) is read as Ecwid, the platform in use.

## What Ecwid does (researched)

- Ecwid's **automatic discounts (promotions)** are rules in the store admin; they are applied to the order automatically at checkout once their conditions are met ([Ecwid docs: automatic discounts](https://docs.ecwid.com/discounts-and-tips/add-discounts-to-the-store/automatic-discounts-promotions)). Ecwid's help says a promotion is not by itself shown on the product page.
- The old price and the saving on the product page come from the product's **compare-to price**: the page then shows the struck-through earlier price, the "ON SALE" label and the saving ([Ecwid help: compare-to price](https://support.ecwid.com/hc/en-us/articles/207101639), [lowest price before discounting](https://support.ecwid.com/hc/en-us/articles/9382914337820-Lowest-product-price-before-discounting)).
- What we **observed** on the live Botanic product (read-only, 10 and 11 November 2026): the price starts at £0 and follows the choices; after a choice the page renders the price, the struck-through earlier price and a note such as "Save 10%"; the price equals 90 per cent of the sum of the option modifiers (22 of 22 sizes). The nodes: `.details-product-price__value`, `.details-product-price-compare__container s`, `.product-details__product-price-discount`.
- The cart API (storefront JavaScript, [docs](https://docs.ecwid.com/api-reference/advanced/js-api-calls)): `Ecwid.OnCartChanged.add(callback)` reports every change of the cart ([docs](https://docs.ecwid.com/storefronts/track-storefront-events/cart-details-are-changed-event)); `Ecwid.Cart.gotoCheckout()` opens the checkout; `Ecwid.openPage('cart')` opens the first checkout step ([docs](https://docs.ecwid.com/storefronts/open-page-on-the-storefront/overview-of-open-page-options)); `Ecwid.Cart.calculateTotal()` returns the totals with the discounts.

## The contract

1. **The module computes no price and no percentage.** It reads three texts that Ecwid renders, and shows them: the earlier price (struck through), the price with the discount, the discount note ("Save 15%"). Any percentage works, because the text is Ecwid's own. When Ecwid shows no promotion, the module shows the price alone.
2. **Where the customer sees it:** the selection panel (large) and the selection dock (mobile) on every step, and the Review step. The checkout itself is the shop's own page, not ours. The note "Discount included: this is the price you pay" appears whenever an earlier price is shown, so it is clear that the discount is already in the price.
3. **Add to Bag** presses **Ecwid's own** Add to Bag button (Ecwid validates and adds), and the button turns into **Go to Checkout** only when Ecwid's own cart event reports the product in the cart. If the customer changes any of the four choices after that, the bag no longer matches and the button is Add to Bag again.
4. **Go to Checkout** calls `Ecwid.Cart.gotoCheckout()` (or `Ecwid.openPage('cart')` if that is not available) at once. If neither exists the module does nothing on its own and leaves the customer with Ecwid's own controls: it never invents a checkout.
5. Everything is read from the page, so it is the same for every model: the selectors are in the model's config (`price.current`, `price.compare`, `price.discount`) and in the store profile (`products/profiles/divine-store.profile.js`).

## Where it is built

| Place | What |
|---|---|
| `docs/mobile/premium/src/sync.js` | reads the earlier price and the discount note (read-only) |
| `docs/mobile/premium/src/graphite.js`, `graphite.css` | the dock shows the earlier price, the price and the note; the review button is Add to Bag, then Go to Checkout |
| `docs/mobile/premium/src/standin.js` | the stand-in store: promotion nodes with any percentage (`?promo=15`), the cart API stand-in |
| `tools/tv-design-preview.template.html` | the large design: price with the promotion, Add to Bag / READY / Go to Checkout. There is no checkout screen of ours: Go to Checkout hands over to the shop's checkout |
| `tests/price-promo-contract.mjs` | 34 checks: promotions 0, 10, 15 and 17 per cent on mobile and large; Add to Bag, Go to Checkout, return to Add to Bag when a choice changes |
| `docs/mobile/premium/shots/promo/`, `docs/tv-preview/design-*-19-promo15.png`, `-20-promo17-std.png`, `-21-checkout.png` | pictures |

The engine of today's television (`engine/ddtv-engine.js`) already mirrors the earlier price and the discount note; the new look and the Add to Bag / Go to Checkout button move into it with the new design, after the owner's approval.

## What is still to verify on Ecwid itself (owner's decision needed)

The tests above use a simulated store. Before this goes live, on the **test product 876405767 only, with the owner's explicit approval**:

1. **Which mechanism carries the promotion?** If it is the product's compare-to price, the product page shows the earlier price and the note and the module mirrors them. If the promotion is an automatic promotion rule that Ecwid applies only at checkout, the product page may not show the discounted price before the cart; in that case the module can show the price with the discount after Add to Bag, from the cart totals (`Ecwid.Cart.calculateTotal()`), and the contract above stays the same.
2. **Does the page show the note for every percentage** (10, 15, 17 and a new one)? A read-only check on the live page each time the promotion changes costs nothing and changes nothing (`tests/live/`).
3. **`Ecwid.Cart.gotoCheckout()` or `Ecwid.openPage('cart')`:** which one opens the checkout on this store's theme. Tested only on the test product.
4. **Required options:** none of the four options is required today and Add to Bag is enabled with nothing chosen. Marking them required in Ecwid Admin makes Ecwid's own button behave like ours.
