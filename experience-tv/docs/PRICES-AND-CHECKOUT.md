# Prices, promotions and checkout: the contract for every model

Owner's rule (12 November 2026), for the mobile and the large version, and for every later model built from this engine: **the customer always sees the real price and the price with the discount, and the discount is clearly stated; and Go to Checkout takes the customer to the checkout at once.** Our prices are always promotional, the percentage changes (10, 15, 17 per cent or any other), and the promotion is run in Ecwid.

## What Ecwid does (researched)

- Ecwid's **automatic discounts (promotions)** are rules in the store admin; they are applied to the order automatically at checkout once their conditions are met ([Ecwid docs: automatic discounts](https://docs.ecwid.com/discounts-and-tips/add-discounts-to-the-store/automatic-discounts-promotions)). Ecwid's help says a promotion is not by itself shown on the product page.
- The old price and the saving on the product page come from the product's **compare-to price**: the page then shows the struck-through earlier price, the "ON SALE" label and the saving ([Ecwid help: compare-to price](https://support.ecwid.com/hc/en-us/articles/207101639), [lowest price before discounting](https://support.ecwid.com/hc/en-us/articles/9382914337820-Lowest-product-price-before-discounting)).
- What we **observed** on the live Botanic product (read-only, 10 and 11 November 2026): the price starts at £0 and follows the choices; after a choice the page renders the price, the struck-through earlier price and a note such as "Save 10%"; the price equals 90 per cent of the sum of the option modifiers (22 of 22 sizes). The nodes: `.details-product-price__value`, `.details-product-price-compare__container s`, `.product-details__product-price-discount`.
- The cart API (storefront JavaScript, [docs](https://docs.ecwid.com/api-reference/advanced/js-api-calls)): `Ecwid.OnCartChanged.add(callback)` reports every change of the cart ([docs](https://docs.ecwid.com/storefronts/track-storefront-events/cart-details-are-changed-event)); `Ecwid.Cart.gotoCheckout()` opens the checkout; `Ecwid.openPage('cart')` opens the first checkout step ([docs](https://docs.ecwid.com/storefronts/open-page-on-the-storefront/overview-of-open-page-options)); `Ecwid.Cart.calculateTotal()` returns the totals with the discounts.

## The contract

1. **The module computes no price and no percentage.** It reads three texts that Ecwid renders, and shows them: the earlier price (struck through), the price with the discount, the discount note ("Save 15%"). Any percentage works, because the text is Ecwid's own. When Ecwid shows no promotion, the module shows the price alone.
2. **Where the customer sees it:** the selection panel (large) and the selection dock (mobile) on every step, the Review step, and the checkout screen. The note "Discount included: this is the price you pay" appears whenever an earlier price is shown, so it is clear that the discount is already in the price.
3. **Add to Bag** presses **Ecwid's own** Add to Bag button (Ecwid validates and adds), and the button turns into **Go to Checkout** only when Ecwid's own cart event reports the product in the cart. If the customer changes any of the four choices after that, the bag no longer matches and the button is Add to Bag again.
4. **Go to Checkout** calls `Ecwid.Cart.gotoCheckout()` (or `Ecwid.openPage('cart')` if that is not available) at once. If neither exists the module does nothing on its own and leaves the customer with Ecwid's own controls: it never invents a checkout.
5. Everything is read from the page, so it is the same for every model: the selectors are in the model's config (`price.current`, `price.compare`, `price.discount`) and in the store profile (`products/profiles/divine-store.profile.js`).

## Where it is built

| Place | What |
|---|---|
| `docs/mobile/premium/src/sync.js` | reads the earlier price and the discount note (read-only) |
| `docs/mobile/premium/src/graphite.js`, `graphite.css` | the dock shows the earlier price, the price and the note; the review button is Add to Bag, then Go to Checkout |
| `docs/mobile/premium/src/standin.js` | the stand-in store: promotion nodes with any percentage (`?promo=15`), the cart API stand-in |
| `tools/tv-design-preview.template.html` | the large design: price with the promotion, Add to Bag / Go to Checkout, the checkout screen (stand-in) |
| `tests/price-promo-contract.mjs` | 34 checks: promotions 0, 10, 15 and 17 per cent on mobile and large; Add to Bag, Go to Checkout, return to Add to Bag when a choice changes |
| `docs/mobile/premium/shots/promo/`, `docs/tv-preview/design-*-19-promo15.png`, `-20-promo17-std.png`, `-21-checkout.png` | pictures |

The engine of today's television (`engine/ddtv-engine.js`) already mirrors the earlier price and the discount note; the new look and the Add to Bag / Go to Checkout button move into it with the new design, after the owner's approval.

## What is still to verify on Ecwid itself (owner's decision needed)

The tests above use a simulated store. Before this goes live, on the **test product 876405767 only, with the owner's explicit approval**:

1. **Which mechanism carries the promotion?** If it is the product's compare-to price, the product page shows the earlier price and the note and the module mirrors them. If the promotion is an automatic promotion rule that Ecwid applies only at checkout, the product page may not show the discounted price before the cart; in that case the module can show the price with the discount after Add to Bag, from the cart totals (`Ecwid.Cart.calculateTotal()`), and the contract above stays the same.
2. **Does the page show the note for every percentage** (10, 15, 17 and a new one)? A read-only check on the live page each time the promotion changes costs nothing and changes nothing (`tests/live/`).
3. **`Ecwid.Cart.gotoCheckout()` or `Ecwid.openPage('cart')`:** which one opens the checkout on this store's theme. Tested only on the test product.
4. **Required options:** none of the four options is required today and Add to Bag is enabled with nothing chosen. Marking them required in Ecwid Admin makes Ecwid's own button behave like ours.
