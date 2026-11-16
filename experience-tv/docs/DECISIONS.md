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

- The owner decides every button: `docs/TV-BUTTON-CATALOGUE.md` lists every button of every screen of the large design (39 screens, picture and table each) with a column for the decision (keep, remove, change, add).

## Selection laws (owner, 12 November 2026; one source: `engine/selection-rules.js`, tests: `tests/selection-rules.mjs`)
- The four choices, in the customer's order: size, firmness, depth, cover. The five factors of the price and of the checkout: size, firmness, depth, cover and the promotion Ecwid applies (its percentage, never its name).
- **READY** (the Add to Bag button lit, larger, crisp ring) only when all four are covered. Clicking it adds the mattress through Ecwid's own button; the same button then becomes **Go to Checkout**, and a second click opens the checkout page.
- **Once the four are covered, changing any one of them keeps the button active**: it is READY for the new configuration (Add to Bag again). Removing a choice takes it back to the guidance.
- **Whatever is missing is named** ("Still to choose: Size · Cover"), so the customer always knows where they are. Mobile and large screen alike.
- **Go to Checkout opens the shopping cart** (Ecwid's cart page, `openPage('cart')`), where the order is built by Equity and Ecwid from our selections. The customer enters the e-mail there and continues to checkout. No checkout screen of ours; the coupon and the e-mail code are never in the configuration. "Redeem your discount" in the checkout is not ours.
- Equid/Ecwid is the platform. The promotion's name is not shown; the discount is shown as the store gives it.

## Content decisions
- Firmness numbers are the Firmness module's four ranges: Soft up to 48 kg, Medium 49 to 87, Firm 88 to 114, Extra Firm 115 and over. The module is the guide for any discrepancy. The sliders (body weight and height) are on the large screen too.
- Extra Firm is not removed: it is redirected to the specialist model "Orthopaedic Coconut Core" (a plain link, followed only on a tap). Open: what happens if it is picked in Ecwid's own menu (proposal: same notice and link, nothing changed in Ecwid).
- **Prices and promotions (owner, 12 November 2026), mobile and large, every model:** the customer always sees the real price and the price with the discount (the earlier price struck through, the price with the discount, the discount note), whatever the percentage (10, 15, 17 or other); the promotion is run in Ecwid; the module only mirrors Ecwid's texts and computes nothing; it says "Discount included". **Go to Checkout takes the customer to the checkout at once** (Ecwid's own checkout). Contract and verification plan: `docs/PRICES-AND-CHECKOUT.md`; test: `tests/price-promo-contract.mjs`.
- Sizes are shown in centimetres and in inches (cm divided by 2.54, one decimal).
- Custom size: a contact form (model filled in, size wanted, reply email) to support@divinedunlop.com.
- The small videos (7 to 10 seconds) stay small; each model has a full presentation video playable in full; the video card is a small "television in the television".
- The four steps of the order are Size, Firmness, Depth, Cover, then Review; all fourteen topics stay on top of the television (Discover, Firmness, Comfort, Height, Covers, Benefits, Support, Adaptation, 7-Zone, Ventilation, Hygiene, Certifications, Warranty, Delivery). The television's purpose is to show all of the Botanic information, broken into buttons.
- No "Choose by hand" screen inside the television. The shop's own options and Add to Bag stay on the page below it, in step with it.
- **Add to Bag and Go to Checkout are one button with two faces**, bright blue; it waits for the four choices; it returns to Add to Bag if a choice changes.
- **The bright blue family (owner, 12 November 2026):** Add to Bag / Go to Checkout and **View Model Gallery** are the same bright blue. The two view buttons (Optimised Preview, Standard Product View) are outlined in the same blue, not filled. Nothing else on the screen is that blue. (This replaces the earlier "Add to Bag is the only blue button" rule.)
- **Add to Bag is READY only when size, depth, firmness and cover are all chosen**; READY is lit and larger (a crisp ring, no blur). Clicking it adds the mattress; the same button then becomes Go to Checkout, and a second click opens the checkout. Changing a choice turns it back into Add to Bag. (Owner, 12 November 2026; see `docs/PRICES-AND-CHECKOUT.md`, the owner's laws.)
- **Prices come from Equity**: sizes and final prices are entered there; the active promotion is an automatic rule in Equity's Promotions; the store shows the price without the discount and the price with it; the module shows exactly those. "Redeem your discount" in the checkout is not ours.
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

## BOTANIC TV redesign round (owner, 13–15 November 2026: master prompt + navigation map; project audit document)
- Precedence: the owner's approved decisions and original drawings, then the PRIMARY screenshot, then the live store's options and published terms; ALTERNATE screenshots are inspiration only. The audit of all 31 subviews, the legal list and the open decisions live in the Claude project document "BOTANIC TV — одит и план по референциите".
- Ignition: each time the television is switched on (page start and every press of Optimised Preview) it wakes like a car's instrument panel: dark glass, one hairline of light, the leaf and BOTANIC, then two readouts, then the glass lights into the stage (about 3.4 s). The two facts are mandatory: **100% Natural Latex** and **Dunlop Technology** (the description's own hero bar). Skip, a tap or a key ends it; reduced motion gives a quiet fade; no blur. Name and facts are per model (`D.ignition`). Test R29.
- Depth: the three heights are drawn from the owner's 26 cm drawing in TRUE proportion 20 : 24 : 26 (front edge scaled cm/26), never exaggerated; the chosen depth carries a "Chosen" mark. Replaces the earlier ×1.8 exaggeration. Test R28.
- Not changed without the owner: texts on the legal list (warranty "2 cm = more than 12%", hygiene, OEKO-TEX scope, cover claims), firmness boundaries, leaf colour (green in the TV, graphite #364849 in the live description), the 20 days unit.

## Reference round (owner, 15 November 2026: the three PDFs, all 37 pictures)
- Every screen follows its PRIMARY screenshot; ALTERNATE only checks copy; the legal list is not published as fact. Audit and status per screen: `docs/BOTANIC-REFERENCE-AUDIT.md`; side by side: `docs/tv-reference/index.html`.
- Pictures are only the owner's own, taken from modules already on the site (`assets/botanic/PROVENANCE.md`): the engineering view (vector body + mattress) for Firmness, Support (Stretching Effect) and the 7-Zone map; the Bio Dunlop SVG; the moon (shown silver, small); the perforated core.
- 7-Zone map: the engineering view full width, never squeezed or redrawn (test R27 checks the proportion 2550:760 and the width).
- Warranty: three full-width rows; the pillows come with the mattress either way; 12% examples only for 20/24/26 cm.
- Ignition v2: luminous lettering (one pass of light, letters stay solid) and a soft ambient pad made in the browser, only after a tap, with Sound on/off remembered; test R29.
- Invitation to explore: "N of 31 explored", small green dots on opened topics and buttons.

## Owner's answers and the Ivory Cockpit (15 November 2026, evening)
- Firmness boundaries: always from the main firmness module (`DDFirmnessCore`): up to 48 / 49–87 / 88–114 / 115+ kg. Confirmed.
- The bowl comes from the Quality and Certificates page; so do the real core close-up (fine pins), the small moon and the official marks (shown in one graphite ink).
- Leaf colour: the designer's choice per place (green on the instrument bands, graphite where it is a quiet marker).
- "Divine Dunlop Dreams" in small spaced letters under the Bio Dunlop wordmark.
- Warranty: 12% of the selected mattress height. That is the rule.
- Delivery: "20 Days Delivery", without saying calendar or working days.
- Text house style: short dashes only (the long dash is never shown); Support and Adaptation always begin with a capital S and A, and in the instrument-band titles they are the bold words while the rest of the title is light.
- Look: Ivory Cockpit. Ivory surfaces (the colour of latex and of ivory car seats), graphite instrument glass for the bands and the current buttons, one lit blue for action (Add to Bag, Go to Checkout, the gallery), large light figures for readouts, hairlines instead of boxes, a four-segment selection gauge. The engineering drawings and the 7-Zone map are in the latex colours. `?theme=classic` shows the previous look.
- The orange numbers and purple dashed frames in the reference screenshots are annotation overlays of the button map, never part of the television.

## Owner's round of 16 November 2026
- **Ignition v3 (about 9 s).** BOTANIC, the two facts (100% Natural Latex, Dunlop Technology), then the three essences, each with a small animation: **Explore** (14 topics light up), **Select & Buy** (four choices light up), **Custom** (the mattress drawn to size); then the tagline "Custom Dunlop Natural Environment for Healthy Sleep" and the line "One custom presentation module: it explores, it selects and it customises." It plays when the television opens (always on Discover), on every press of Discover and of Optimised Preview. Skip, tap or Esc ends it; sound only after a tap; reduced motion shows it still. Test R29.
- **Presentation bar** is not over the television: it is a player strip attached directly under it (play, pause, previous, next, start-up, caption, progress). It lives in the presentation page only (`tools/presentation-tour.html`, `tools/build-presentation.mjs`), never in the module.
- **Labels.** Every rail and topic label starts each word with a capital. The topic that opened every size is now **Sizes**; its panels are **Select Your Size**, **Select Your Depth**, **Why Height Matters**; also **Select Your Firmness**, **Select Your Cover**.
- **Order of the choices** is the shop's own: Size, Depth, Firmness, Cover, Review (the large television only; the mobile premium preview is unchanged). `DDRules.ORDER_SHOP`, test R30.
- **The television guides.** After every choice it says what was chosen and what comes next ("Now choose your Depth") and opens the next choice by itself after 2.6 s; any tap cancels it ("Change my choice"). In "Your selection" a guide card always says what to do now. Off in automated browsers unless `?guide=1`. Test R32.
- **Choosing topics stand out.** In the top bar Firmness, Sizes, Covers and Delivery carry an icon, a deeper ivory and a graphite underline, and a small mark when their choice is made. The order in the left rail is one assembled instrument: four icon tiles on a line that fills as the choices are made, the next one pulsing softly.
- **Header** always names the model: Botanic Original 100% Natural 100% Organic Latex Mattress Dunlop Technology (Botanic and Dunlop bold, Original and Organic thin, in the second colour).
- The preview opens on Discover.

## Owner's round of 16 November 2026 (II)
- **Ignition:** the owner's moon-phase cycle loads first (about 1.4 s, sweeping left to right), then the start-up. Behind it a very light glow of the seven-zone core: a vector sketch of the core from the Quality page photograph (seven perforated bands), no image file, about 26% opacity. The moon cycle also sits as a quiet ornament in the Review band.
- **Two groups in the top bar.** Explore (the 14 description topics, ivory) and **Select & Buy** (Size, Depth, Firmness, Cover, Review: teal underline, teal glow on hover, a mark when chosen). The gallery blue (#2A86B0, owner 16 Nov: never green-teal) is the colour of the selection system everywhere: the order line, the ticks, the next step, the gauge, the guide.
- **Standard Product View** has its own colour: warm sand. View Model Gallery and the two views live in the "Select your Botanic here" card, which stays visible in the standard view so the customer can always switch back.
- **Words for customers:** "screen" or "presentation screen", never "television" (internal only).
- **How Density Works** (owner's infographic, redrawn in the system): four steps Density, Stable Structure, Consistent Firmness, Adaptive Comfort, the conclusion band and the note. In Comfort and in Support.
- **Adjustable Beds** (Adaptation): a settings screen like the car's climate page: positions on the left (Flat, Reading, Relax, Legs Up, Zero Gravity), the core with a sketched sleeper on a hinged base in the middle, Head and Legs sliders, four short points. Claim used: "Suitable for adjustable beds" (owner).
- **Mattress icon** in "Your selection": an outline, transparent, smaller; blue only when all four choices are made. No blue block, no glow.
- **Small green leaf** marks the section labels (Explore, Select & Buy, the stage header, In <topic>, Your selection) and every card.

## Adjustable beds wording and drawing (owner, 16 November 2026)
- The claim is **"Suitable for adjustable beds"**, never "made for": Botanic is a mattress for every bed and can also be used on adjustable bases.
- The drawing is traced from the owner's photograph (woman on the curved latex core): the core's S-curve and the person's outline, smoothed, in the latex colours. No hinged broken lines, no sliders; the positions are listed as information ("Positions it suits"), not as controls.

## Owner's round of 16 November 2026 (III)
- **No duplicate choice buttons.** Size, Depth, Firmness, Cover and Review exist only in the **Select & Buy** group of the top bar. The left rail no longer lists the order steps, the Explore topics no longer repeat them, and "Your selection" carries no choice chips (only the guide card, the gauge, the price and the bag).
- **Firmness is confirmed, not only shown.** Weight and height (or a tap) pick a firmness; a bar "Your firmness: Medium. Confirm it to continue." holds the button **Confirm Medium**. Once confirmed, the other firmnesses disappear: the screen shows the confirmed card (badge Confirmed, the range, one line) and **Change firmness**, which reopens the four. Only the confirmed firmness counts as a choice and is sent to Ecwid.
- **Ignition:** the moon-phase cycle no longer comes first. It sits under the BOTANIC name, the same width, and appears with the rest in sequence, with a light sweep and breath.
- **Stretching Effect:** the spine runs inside the body (the vertebrae along the back, from the neck to the pelvis) and the two arrows run inside the torso along the spine, outward from the middle. Static, no blinking. The drawing is shown at full card width with the label under it.
- **Topic and its parts are one tree.** The left rail shows the selected topic as a dark header with its colour dot and "N parts in this topic", and its parts as branches joined by a line in the topic's colour. On a choice screen the header reads "Your <choice> · Learn before you choose" and the branches are the related explanations from the topics.
- **Each topic has its own colour** (night palette: blues, violets, sand, sage), shown as the dot in Explore, the tree line, the stage tint, the card top edge and the aurora in the question band, which is a night sky with stars and a crescent. Selection stays in the gallery blue.

## Owner's round of 16 November 2026 (IV)
- **No button twice, ever.** Firmness, Height and Covers are no longer Explore topics. Explore has eleven topics (Discover, Comfort, Benefits, Support, Adaptation, 7-Zone, Ventilation, Hygiene, Certifications, Warranty, Delivery), six to a row. Size, Depth, Firmness, Cover and Review exist only in Select & Buy. The word is **Cover**, never "Covers"; the old Height topic is **Depth**.
- **Knowledge hangs under the choice.** When a Select & Buy button is pressed, the left tree ("Choose and learn") shows the choice itself first ("Select Your Firmness", Your choice), then its more information: Firmness has Correct vs Softer, How It Works, Who It Is For; Depth has Why Height Matters; Cover has Cover System. Each is marked "More information"; the stage header reads "<Choice> · More information", the Select & Buy button stays lit, and the actions are "More: <next>" and "Select Your <Choice>". Test R26 opens every one.
- **Review** sits in the second row next to Cover, the same size as Depth and Cover.
- **Stretching Effect:** the sleeper lies on the shoulder, so the spine runs through the middle of the torso, neck to sacrum (the midline measured from the body outline, smoothed: `engineering-view.json` spine). The arrows continue the spine inside the body, into the head and into the legs (`stretch`).
- **Stronger lights.** Each Explore topic changes the room: the stage, the left column, the screen's edge glow, an aurora in the question band and the lit Explore button, all in the topic's colour. Choices keep the gallery blue.

## Colour concept "From Nature to Sleep" (owner, 16 November 2026, V)
- **No brown, no beige, no sand, anywhere.** Blue and brown fight. The base is the site's own cool palette: mist #EDF5F7 / #F6FAFB, aqua line #D6E6E8, slate ink #203032 / #364849, sage-slate #5E7A7D. The latex drawings, the zone map, the gauges and the Standard Product View use the same cool mist and slate. The green leaf stays as the one natural mark. Test R33 scans every element in both layers for warm colours.
- **Two layers, two environments.** The customer always knows where they are:
  - **Explore = the night.** The topic's colour fills the room: stage, left column, screen edge, the night-sky question band and the lit Explore button. The eleven colours walk in the order of the bar, from mint (nature: Discover) through aqua and sky to indigo and violet (sleep: Delivery): Discover #45C49A, Comfort #45C4B2, Benefits #45BEC4, Support #45A5C4, Adaptation #458DC4, 7-Zone #4575C4, Ventilation #455CC4, Hygiene #4645C4, Certifications #5E45C4, Warranty #7745C4, Delivery #8F45C4.
  - **Select & Buy = the clear day.** White, crisp, the gallery blue #2A86B0 only. The question band turns deep clear blue, without stars or moon.
- **The choice is never shown twice.** The Select & Buy button is the choice. The left tree ("You are choosing") shows the choice as its header (with the value or "Not chosen yet") and only the information that helps to choose ("Helps you choose"). There is no "Select Your …" button in the tree and no second "Select Your …" button on the information screens (only "Back to the choice"). The cover card says "Cover", never "Covers".

## Colour concept "Divine Night" and the order trail (owner, 16 November 2026, VI) — replaces "From Nature to Sleep"
- **Only the site's own colours.** Read from divinedunlop.com (read-only): navy #1F3D58 and #0B2A38 (the dark cards and night sections), ice white #F1F6FB / #F9F9F9 (the ground), mint #4FD3CB and periwinkle #647BD0 (the accents). The toxic green (#45C49A) and the violet end are gone.
- **One family of accents.** The eleven Explore topics take one step each of the family from the site's mint to its periwinkle, in the order of the bar (Discover #42CDC3 … Delivery #5871CA). Select & Buy is the gallery blue #2A86B0, which sits inside the same family. Everything is in unison: change one, and the family moves together.
- **Colour is an indicator, never a glow on white** (Polestar: clean, ordered). White and ice surfaces are flat. No screen-edge glow, no tinted stage, no coloured halo around buttons. The topic shows as a dot, a thin line (tree, card top, the 3 px line under the current button) and a soft light only on the dark navy band (as on the site's night sections). The current Explore button is navy with its topic's line; Select & Buy tiles are white with a step number (1–4) that becomes the blue tick; the current one is navy with the blue line.
- **No moon over the logo.** The Discover band carries the Dunlop mark, so it has no crescent.
- **The order trail (traceability).** While choosing, and on every "Helps you choose" screen, a strip under the two groups shows the whole order: Size (value, tick) — Depth — Firmness — Cover — Review, the current step in navy. Every step is one tap away, so the customer always sees where they are and can go back and correct. The tree's header leads back too ("Not chosen yet · Choose" or "Firm · Change"), and every information screen ends with "Back to the choice". Test R34.
- **Review** fills both rows on the right, the same height as the four steps, parted from them by a thin line.
- **7-Zone:** the seven zone cards sit in one row under the map (each with its tone on top), then "How to read the map" beside the film. Nothing hangs alone.

## Four families, four cards (owner, 16 November 2026, VII)
Explore, Select & Buy, Your order and Your selection are no longer buttons parted by a line. Each is its own card with its own colour life; none borrows from another.
- **Explore (read): the night.** A navy card (#1F3D58 to #0B2A38). Translucent buttons, the topic's colour as a dot; the current topic turns white with its coloured line. The last topic spans two columns so no button hangs alone.
- **Select & Buy (choose): the day.** An ice-blue card (#E4F0F7, line #C3DCEA) with white tiles and step numbers; the step you are on is the gallery blue #2A86B0.
- **Your order (traceability): a slate ledger.** A cool grey-blue card (#E6EBF2), the steps joined by a line; done = navy tick with its value, here = a white pill with the blue line.
- **Your selection (pay): an aqua column.** The site's mist aqua (#E8F3F5) with white cards for the price and the bag; the topic rail stays white.
Test R35 checks that the four have four different looks; R2 was updated for the aqua column.

## Owner's round of 16 November 2026 (VIII)
- **Start-up animation: calm and clean, as before.** No moon cycle, no mattress drawing (the moon cycle is also gone from the Review band). BOTANIC, the two facts, Explore / Select & Buy / Custom ("11 topics"), the tagline.
- **The Standard Product View keeps the product information.** Besides the shop's gallery and options, the whole approved description (the earlier, approved format with all its chapters and cards) is there, as on the shop page. In the shop the engine already puts the original description back when the customer chooses Standard Product View; the preview now shows it too. One view does not eat the other. Test R36.
- **One screen.** On a large screen the monitor is the height of the screen (like a car display): the two groups, the order trail and the three columns are always in view; only the middle stage scrolls inside, with its actions fixed at the bottom. The chrome is tighter (38–40 px buttons, smaller band). Fixed a defect where long pages squeezed the stage header and the band.
- **Explore buttons** carry a thin, delicate blue outline (1 px). The current topic is outlined in its own colour, and the same colour outlines its header in the tree: the button and its tree read as one.
- **Topic parts are lettered A, B, C** in the topic's colour (also under a choice), and the stage header names the part: "Discover (A) Introduction".
- **Films and photographs** of the description are shown: the six loops play in their topics (Discover, Benefits, Adaptation, 7-Zone, Ventilation, Certifications), the cover photographs and the gallery. The published preview can only load its own files, so they travel with the page (fetched at build time, not committed); in the shop they come from the shop's own media addresses.
- **Titles:** Ventilation "Breathable … Comfort" and 7-Zone "7-Zone" in blue and a touch bolder; **Warranty and Durability** with Durability opening on the Divine Dunlop D mark.
- **Delivery Journey** (new part B of Delivery): seven steps, each with a notification: Order confirmed, In production, Quality tested, Prepared for dispatch, In transit, At the depot, Out for delivery (the two-person delivery team). "A notification at every step", **delivery included in the price, no extra transport fees**, 20 Days Delivery.
- **No "N of 24 explored"**: the customer decides what to read.

## Cosmic Selection (owner, 16 November 2026, IX)
- **The fixed one-screen height is withdrawn.** It hid things (the King sizes, the third depth). The screen is tall again and shows everything; there is no scrolling inside the screen or inside any card ("no lifts, no sliders").
- **Sizes in six families.** All Single Sizes (75–100 cm wide, 6), All Small Double Sizes (120, 2), All Double Sizes (135–140, 3), All King Sizes (150–160, 5), All Super King Sizes (180, 3), All Emperor Sizes (200, 3): all 22 sizes, each in exactly one family, by width. A customer looking for a double never has to read the kings.
- **Navigation.** Tap a family to open it. Inside, "All size families" leads back, and the six families stay one tap away as lit chips, so the customer can move between families and back to any other choice (Select & Buy, the order trail) at any time. The family of a chosen size is marked ("✓ King Long").
- **Cosmic Selection** is the space every choice happens in (size, depth, firmness, cover): deep navy with a few stars, glass cards, and the light in a thin underline that glows in the family's colour. The six families walk the site's spectrum from mint to a measured violet (#4FD3CB, #3FC1E6, #52A6F0, #6F8CF2, #8E80F0, #AE97F2). Each size card shows its footprint drawn to scale (200 × 220 cm fills the box), centimetres and inches. The cards of a family share one row (King five across). The light stays on the dark; nothing glows on white.
- **Depths** sit side by side in the same space (20, 24, 26 cm), so the third depth is never out of view.
- **Body weight scale** ends at **180 kg** (the firmness ranges are unchanged: 115 kg and over is Extra Firm).
- Test R37.

## Pick, Confirm, Change (owner, 16 November 2026, X)
- **Every choice works like firmness.** For size, depth, firmness and cover: a touch only **picks** (the card lights, nothing counts, nothing goes to the order or the shop); a bar says "Your size: King Long · 150 × 210 cm. Confirm it to continue." with the button **Confirm King Long**; only then the choice counts (order trail, Select & Buy tile, price, Add to Bag) and the module says what comes next and opens it.
- **A confirmed choice stays open.** The screen then shows the choice alone (badge Confirmed, its picture, its words) with **Change size / Change depth / Change firmness / Change cover**. A touch brings every option back (for sizes: the family of the chosen size is open, with all six families one touch away), the current one preselected; confirming again replaces it. The customer is never left on a first choice: Select & Buy, the order trail and the tree's header all lead back at any time.
- **Nothing blocks anything.** Reading the information under a choice, moving to another choice, or leaving and returning never loses a pick that was confirmed; an unconfirmed pick simply does not count. "Continue to <next>" stays inactive until the choice is confirmed.
- **In the shop** (Ecwid is the executor): only a confirmed choice is written to Ecwid's own control, exactly like firmness. The shop's own controls in the Standard Product View remain direct and are always confirmed by themselves.
- Test R38.

## Sizes first (owner, 16 November 2026, XI)
- **The size is the star.** In the size step the figures are what the customer sees first: the family names 23 px, the range of each family in cm and in inches on two lines (20 px and 17 px), each size's centimetres at 30 px and its inches at 20 px, with generous spacing. The confirmed size shows as large figures (up to 60 px cm, 38 px inches) with one glowing line under them.
- **No small mattress drawings.** The footprints are gone (from the families, the size cards and the confirmed card); the size matters more than a picture of a bed. The light is one thin glowing line under each card, in the family's colour.
- **Rows without a lonely card:** King = 3 + 2 (the two wider), Single = 3 + 3, Small Double = 2, Double = 3, Super King = 3, Emperor = 3.
- Tests R14 (figure sizes) and R37 updated.

## The screen stays at the information block; the size families, serious (owner, 16 November 2026, XII)
- **No jump to the top.** Whatever is pressed (a topic, a part in the tree, a Select & Buy step, a step of the order trail, Next, Back, Continue), the page is no longer thrown back to its top, so the customer never has to scroll down to find what came out. If the information block (its heading line) is out of view, the page brings it to a calm position near the top; if it is already in view, nothing moves. A pick, a confirm, opening a family or any change in place never moves the page. (`toStage()`; reduced motion jumps without animation.) Test R39.
- **The size families are the map of the sizes.** Each family button is large (184 px high), with the name in capitals with wide spacing (22 px, 0.13 em: ALL SINGLE SIZES), the width range in cm and in inches, and the number of sizes in the family's colour, with the glowing line. Not pills. All six have the same height and structure.
- **Inside a family** the six families are rectangular tabs (capitals, spaced, with the count of sizes and the line), the current one lit in its colour, plus "All size families" as a rectangular button. The size cards return to a calm size (23 px cm, 16 px inches) so the families, not the cards, are the main structure.
