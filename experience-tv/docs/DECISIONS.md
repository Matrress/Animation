# Decisions of the owner: the register (check this before proposing anything)

These are decided. They are not asked again and not undone by a later change. Where a decision is a design rule it is checked by `tests/design-rules.mjs` (run after every change to the large-screen design: `node tools/build-tv-design-preview.mjs && NODE_PATH=$(npm root -g) node tests/design-rules.mjs`). Detailed history: `docs/FINALISATION-PLAN.md` section 0b and `docs/TV-DESIGN-PREVIEW.md`.

## Working rules
- The live Ecwid store is not changed. The test product 876405767 is authorised as the test product only; nothing is deployed to it or changed on it without the owner's explicit approval. Simulated tests are never presented as live verification. The real Add to Bag is never clicked in tests.
- **Ecwid is the executor.** It owns the product, options, price, cart, checkout and orders. Our code presents, guides and drives Ecwid's own controls, and steps aside if anything does not fit. No price is computed by our code.
- **Two-way sync is mandatory.** The screen drives Ecwid's controls and Ecwid's controls drive the screen (size, firmness, depth, cover), and Add to Bag adds exactly what both show.
- Indexing and speed are protected (`docs/SEO-AND-PERFORMANCE-GUARDRAILS.md`, `tests/guardrails.mjs`).
- British English in documents and on screen. No model identifier in commits or PRs. Replies to the owner in Bulgarian.
- Everything above a phone is a large screen (shortest screen side 600 CSS px or more), device-neutral code, the owner's real device is an iPad Pro 12.9 (3rd generation). The phone version is the shorter one and waits.
- The owner specifies every button (`docs/TV-BUTTON-SPEC.md`); until then labels are proposals.

## Content decisions
- Firmness numbers are the Firmness module's four ranges: Soft up to 48 kg, Medium 49 to 87, Firm 88 to 114, Extra Firm 115 and over. The module is the guide for any discrepancy. The sliders (body weight and height) are on the large screen too.
- Extra Firm is not removed: it is redirected to the specialist model "Orthopaedic Coconut Core" (a plain link, followed only on a tap). Open: what happens if it is picked in Ecwid's own menu (proposal: same notice and link, nothing changed in Ecwid).
- Sizes are shown in centimetres and in inches (cm divided by 2.54, one decimal).
- Custom size: a contact form (model filled in, size wanted, reply email) to support@divinedunlop.com.
- The small videos (7 to 10 seconds) stay small; each model has a full presentation video playable in full; the video card is a small "television in the television".
- The four steps of the order are Size, Firmness, Depth, Cover, then Review; all fourteen topics stay on top of the television (Discover, Firmness, Comfort, Height, Covers, Benefits, Support, Adaptation, 7-Zone, Ventilation, Hygiene, Certifications, Warranty, Delivery). The television's purpose is to show all of the Botanic information, broken into buttons.
- No "Choose by hand" screen inside the television. The shop's own options and Add to Bag stay on the page below it, in step with it.
- **Add to Bag and Go to Checkout are one button with two faces**, bright blue; it waits for the four choices; it returns to Add to Bag if a choice changes.
- **The bright blue family (owner, 12 November 2026):** Add to Bag / Go to Checkout and **View Model Gallery** are the same bright blue. The two view buttons (Optimised Preview, Standard Product View) are outlined in the same blue, not filled. Nothing else on the screen is that blue. (This replaces the earlier "Add to Bag is the only blue button" rule.)
- The television must say where to select: "Select your Botanic here".
- The two views: Optimised Preview (the television) and Standard Product View (the shop's own page, with the shop's own gallery and options). A "View Model Gallery" button opens the product photographs inside the television.
- The 7-Zone panel uses the same sketch, legend and zone list as the mobile concept. The video card is the larger of the two (the model is the smaller); the sketch sits on white, with no dark sky or background behind it.
- Depths are drawn from the owner's mattress drawing (`docs/mobile/premium/assets/owner-mattress-depth.svg`), three heights; the owner's second drawing (`owner-mattress-icon.svg`) is the small icon in "Your selection" that lights up when all four choices are made.
- Covers: four photographs in a square, one short caption each, with a white information board beside them (no text on the photographs).

## Design rules (checked by tests/design-rules.mjs)
- Rounded corners only: no pills, no circles on buttons (largest radius 16 px).
- No mint. The side cards (order rail and "Your selection") are white; only the buttons and chips inside them are dark graphite blue with white text. The middle stage is light, with white cards; a dark or grey stage was tried and rejected.
- The question band is dark turquoise graphite; the leaf is green (never blue) and sits beside the question.
- The frame of the television is thin (5 px).
- One common top line: the question band, the first chip and the first rail button start at the same height, on every step and panel.
- The blue of Add to Bag, Go to Checkout and View Model Gallery is the lit blue of the question band; flat and crisp (thin border, shadow blur at most 4 px, no glow). The two view buttons are blue-outlined.
- Cover photographs and the information board have the same height.
